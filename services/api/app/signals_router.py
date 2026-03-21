"""
Signal Intelligence Router
Aggregates trading signals from Twitter RSS, Discord, and manual input.
AI-powered parsing via Claude, with bridge endpoints to convictions/watchlist/journal.

    from app.signals_router import router as signals_router
    app.include_router(signals_router)
"""

from fastapi import APIRouter, Query, HTTPException, Body
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime, timezone, timedelta
import asyncio
import csv
import hashlib
import io
import json
import os
import re
import uuid

import httpx
import redis

try:
    import anthropic
    ANTHROPIC_AVAILABLE = True
except ImportError:
    ANTHROPIC_AVAILABLE = False

try:
    import feedparser
except ImportError:
    feedparser = None

try:
    import yfinance as yf
except ImportError:
    yf = None

# ── Config ────────────────────────────────────────────────────────────────
REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379")
ANTHROPIC_KEY = os.getenv("ANTHROPIC_API_KEY", "")
FINNHUB_API_KEY = os.getenv("FINNHUB_API_KEY", "")
DISCORD_BOT_TOKEN = os.getenv("DISCORD_BOT_TOKEN", "")
MISPRICED_ASSETS_CHANNEL_ID = os.getenv("MISPRICED_ASSETS_CHANNEL_ID", "")
TWITTER_BEARER_TOKEN = os.getenv("TWITTER_BEARER_TOKEN", "")

rdb = redis.from_url(REDIS_URL, decode_responses=True)

router = APIRouter(prefix="/signals", tags=["signals"])

# ── Redis Keys ────────────────────────────────────────────────────────────
SIGNALS_FEED = "signals:feed"
SIGNALS_SOURCES = "signals:sources"
CONVICTIONS_KEY = "convictions:list"
WATCHLIST_KEY = "watchlist:tickers"
JOURNAL_KEY = "journal:trades"

# ── Noise filter for ticker extraction ────────────────────────────────────
_NOISE = {
    "THE", "AND", "FOR", "BUT", "NOT", "YOU", "ALL", "CAN", "HAS", "HER",
    "WAS", "ONE", "OUR", "OUT", "ARE", "HIS", "HOW", "MAN", "NEW", "NOW",
    "OLD", "SEE", "WAY", "MAY", "WHO", "BOY", "DID", "ITS", "LET", "PUT",
    "SAY", "SHE", "TOO", "USE", "DAD", "MOM", "ANY", "FEW", "GOT", "HAD",
    "HIM", "HIT", "LOW", "OWN", "RUN", "TOP", "YES", "BIG", "END", "FAR",
    "EPS", "IPO", "CEO", "CFO", "GDP", "CPI", "PPI", "IMF", "FED", "ETF",
    "ATH", "ATL", "YOY", "QOQ", "WOW", "LOL", "IMO", "FOMO", "YOLO",
    "THIS", "THAT", "WITH", "FROM", "HAVE", "WILL", "BEEN", "JUST", "LIKE",
    "WHAT", "WHEN", "YOUR", "MORE", "SOME", "THAN", "THEM", "VERY", "INTO",
    "OVER", "SUCH", "TAKE", "ONLY", "ALSO", "BACK", "EVEN", "MOST", "MUCH",
    "THEN", "WELL", "DOWN", "HERE", "HIGH", "LAST", "LONG", "MAKE", "MANY",
    "NEXT", "ONLY", "SAME", "YEAR", "FREE", "FULL", "GOOD", "KEEP", "KNOW",
    "LOOK", "PART", "READ", "REAL", "RISK", "SALE", "SELL", "SHOW", "STILL",
    "WORK", "ABOUT", "COULD", "FIRST", "GREAT", "NEVER", "OTHER", "THEIR",
    "THERE", "THESE", "THINK", "THREE", "WOULD", "AFTER", "EVERY", "MONTH",
    "PRICE", "SHARE", "SHORT", "SINCE", "STOCK", "THOSE", "TRADE", "UNDER",
    "VALUE", "WHERE", "WHICH", "WHILE", "WORLD", "ABOVE", "BELOW", "DAILY",
    "EARLY", "LARGE", "SMALL", "TODAY", "TOTAL", "WATCH", "BEING", "GOING",
    "RIGHT", "RSS", "BUY", "DCA",
}


def extract_tickers(text: str):
    """Extract $TICKER mentions and common ticker patterns from text."""
    if not text:
        return []
    dollar_tickers = re.findall(r'\$([A-Z]{1,5})\b', text)
    word_tickers = re.findall(r'(?<!\w)([A-Z]{2,5})(?=\s|[,.:;!?\-\)]|$)', text)
    valid = set(dollar_tickers)
    for t in word_tickers:
        if t not in _NOISE and len(t) >= 2:
            valid.add(t)
    return sorted(valid)


# ── Pydantic Models ───────────────────────────────────────────────────────

class ManualSignalIn(BaseModel):
    source: str = "manual"
    ticker: str
    action: str = "WATCH"
    thesis: str = ""
    entry_target: Optional[float] = None
    price_target: Optional[float] = None
    stop_loss: Optional[float] = None
    confidence: float = 0.5
    raw_text: str = ""
    url: Optional[str] = None


class SignalPatch(BaseModel):
    status: Optional[str] = None
    action: Optional[str] = None
    confidence: Optional[float] = None
    notes: Optional[str] = None


class SourceIn(BaseModel):
    type: str  # "twitter" | "discord"
    handle: str
    channel_id: Optional[str] = None


class SmartWatchlistCreate(BaseModel):
    name: str
    description: str = ""


class SmartWatchlistEntry(BaseModel):
    ticker: str
    entry_zone_low: Optional[float] = None
    entry_zone_high: Optional[float] = None
    stop_loss: Optional[float] = None
    take_profit: Optional[float] = None
    thesis: str = ""
    signal_id: Optional[str] = None


class EntryPlanIn(BaseModel):
    ticker: str
    entry_target: float
    price_target: float
    stop_loss: float
    portfolio_pct: float = 5.0  # percent of portfolio to allocate


# ══════════════════════════════════════════════════════════════════════════
#  HELPERS
# ══════════════════════════════════════════════════════════════════════════

def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def _signal_from_redis(signal_id: str) -> tuple:
    """Fetch a single signal from the sorted set by scanning members."""
    members = rdb.zrange(SIGNALS_FEED, 0, -1, withscores=True)
    for raw, score in members:
        sig = json.loads(raw)
        if sig.get("id") == signal_id:
            return sig, score
    return None, None


def _all_signals(
    source=None,
    status=None,
    ticker=None,
    limit=50,
):
    """Return signals from Redis sorted set, newest first, with optional filters."""
    members = rdb.zrevrange(SIGNALS_FEED, 0, -1)
    results = []
    for raw in members:
        sig = json.loads(raw)
        if source and sig.get("source") != source:
            continue
        if status and sig.get("status") != status:
            continue
        if ticker and ticker.upper() not in [t.upper() for t in sig.get("tickers", [sig.get("ticker", "")])]:
            continue
        results.append(sig)
        if len(results) >= limit:
            break
    return results


async def _parse_text_with_claude(raw_text: str, source: str = "manual", source_type: str = "manual", url=None):
    """Send raw text to Claude Haiku to extract structured signal data."""
    if not ANTHROPIC_AVAILABLE or not ANTHROPIC_KEY:
        raise HTTPException(500, "Anthropic API key not configured")

    prompt = f"""You are a trading signal parser. Extract structured data from the following trading-related text.
Return ONLY a JSON object with exactly this structure (no markdown, no backticks):
{{
    "ticker": "PRIMARY_TICKER",
    "tickers": ["ALL", "MENTIONED", "TICKERS"],
    "action": "BUY" or "SELL" or "HOLD" or "WATCH" or "UNKNOWN",
    "thesis": "Brief thesis extracted from the text",
    "entry_target": null or number,
    "price_target": null or number,
    "stop_loss": null or number,
    "confidence": 0.0 to 1.0 based on conviction strength in the text
}}

TEXT:
{raw_text}

Return ONLY the JSON object, nothing else."""

    try:
        client = anthropic.Anthropic(api_key=ANTHROPIC_KEY)
        message = client.messages.create(
            model="claude-haiku-4-5-20251001",
            max_tokens=500,
            messages=[{"role": "user", "content": prompt}],
        )
        response_text = message.content[0].text.strip()
        if response_text.startswith("```"):
            response_text = re.sub(r"^```(?:json)?\s*", "", response_text)
            response_text = re.sub(r"\s*```$", "", response_text)
        parsed = json.loads(response_text)
    except json.JSONDecodeError:
        # Fallback: extract what we can manually
        tickers = extract_tickers(raw_text)
        parsed = {
            "ticker": tickers[0] if tickers else "UNKNOWN",
            "tickers": tickers,
            "action": "UNKNOWN",
            "thesis": raw_text[:200],
            "entry_target": None,
            "price_target": None,
            "stop_loss": None,
            "confidence": 0.3,
        }
    except Exception as e:
        raise HTTPException(500, f"Claude API error: {e}")

    now = _now_iso()
    signal = {
        "id": uuid.uuid4().hex[:8],
        "source": source,
        "source_type": source_type,
        "ticker": parsed.get("ticker", "UNKNOWN"),
        "tickers": parsed.get("tickers", []),
        "action": parsed.get("action", "UNKNOWN"),
        "thesis": parsed.get("thesis", ""),
        "entry_target": parsed.get("entry_target"),
        "price_target": parsed.get("price_target"),
        "stop_loss": parsed.get("stop_loss"),
        "confidence": parsed.get("confidence", 0.5),
        "raw_text": raw_text,
        "url": url,
        "timestamp": now,
        "parsed_at": now,
        "status": "new",
    }

    # Store in Redis sorted set scored by current timestamp
    score = datetime.now(timezone.utc).timestamp()
    rdb.zadd(SIGNALS_FEED, {json.dumps(signal): score})
    return signal


# ══════════════════════════════════════════════════════════════════════════
#  1. SIGNAL CRUD  (static routes first, then dynamic /{signal_id} last)
# ══════════════════════════════════════════════════════════════════════════

@router.get("")
async def list_signals(
    source: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    ticker: Optional[str] = Query(None),
    limit: int = Query(50, ge=1, le=500),
    enrich: bool = Query(False),
):
    """List signals with optional filters. Set enrich=true to add live prices."""
    signals = _all_signals(source=source, status=status, ticker=ticker, limit=limit)

    if enrich and FINNHUB_API_KEY and signals:
        # Collect unique tickers
        all_tickers = set()
        for sig in signals:
            tks = sig.get("tickers", [])
            if tks:
                all_tickers.update(tks)
            elif sig.get("ticker"):
                all_tickers.add(sig["ticker"])
        all_tickers.discard("UNKNOWN")

        # Batch-fetch prices from Finnhub
        prices = {}  # type: Dict[str, Dict[str, Any]]
        async with httpx.AsyncClient(timeout=10) as client:
            for tk in list(all_tickers)[:40]:
                try:
                    r = await client.get(
                        "https://finnhub.io/api/v1/quote",
                        params={"symbol": tk, "token": FINNHUB_API_KEY},
                    )
                    if r.status_code == 200:
                        data = r.json()
                        if data.get("c") and data["c"] > 0:
                            prices[tk] = {
                                "current_price": round(data["c"], 2),
                                "price_change_pct": round(data.get("dp", 0), 2),
                            }
                except Exception:
                    continue

        # Enrich each signal
        for sig in signals:
            tk = sig.get("ticker", "")
            if tk in prices:
                sig["current_price"] = prices[tk]["current_price"]
                sig["price_change_pct"] = prices[tk]["price_change_pct"]
                entry = sig.get("entry_target")
                if entry and entry > 0:
                    sig["since_signal_pct"] = round(
                        ((prices[tk]["current_price"] - entry) / entry) * 100, 2
                    )
                else:
                    sig["since_signal_pct"] = None
            else:
                sig["current_price"] = None
                sig["price_change_pct"] = None
                sig["since_signal_pct"] = None

    return {"signals": signals, "count": len(signals)}


@router.post("/manual")
async def create_manual_signal(s: ManualSignalIn):
    """Create a signal manually."""
    tickers = extract_tickers(s.raw_text) if s.raw_text else []
    if s.ticker.upper() not in tickers:
        tickers.insert(0, s.ticker.upper())

    now = _now_iso()
    signal = {
        "id": uuid.uuid4().hex[:8],
        "source": s.source or "manual",
        "source_type": "manual",
        "ticker": s.ticker.upper(),
        "tickers": tickers,
        "action": s.action.upper(),
        "thesis": s.thesis,
        "entry_target": s.entry_target,
        "price_target": s.price_target,
        "stop_loss": s.stop_loss,
        "confidence": s.confidence,
        "raw_text": s.raw_text,
        "url": s.url,
        "timestamp": now,
        "parsed_at": now,
        "status": "new",
    }
    score = datetime.now(timezone.utc).timestamp()
    rdb.zadd(SIGNALS_FEED, {json.dumps(signal): score})
    return signal


# ══════════════════════════════════════════════════════════════════════════
#  2. AI SIGNAL PARSER
# ══════════════════════════════════════════════════════════════════════════

@router.post("/parse")
async def parse_signal(
    text: str = Body(..., embed=True),
    source: str = Body("manual", embed=True),
    source_type: str = Body("manual", embed=True),
    url: Optional[str] = Body(None, embed=True),
):
    """Parse raw text into a structured signal using Claude Haiku."""
    signal = await _parse_text_with_claude(text, source=source, source_type=source_type, url=url)
    return signal


class BulkPostsRequest(BaseModel):
    posts: List[Dict[str, str]] = Field(..., description="List of {text, source} objects")


@router.post("/parse/bulk")
async def parse_bulk_posts(req: BulkPostsRequest):
    """Parse multiple posts at once. Each post is {text, source (handle/name)}.
    Splits by post, runs AI parsing on each, returns all signals."""
    results = []
    errors = []
    for i, post in enumerate(req.posts):
        text = post.get("text", "").strip()
        source = post.get("source", "manual").strip().lstrip("@").lower()
        if not text or len(text) < 5:
            continue
        try:
            signal = await _parse_text_with_claude(
                raw_text=text,
                source=source,
                source_type="twitter",
            )
            results.append(signal)
        except Exception as e:
            # Fallback: store basic signal
            tickers = extract_tickers(text)
            if tickers:
                now = _now_iso()
                signal = {
                    "id": uuid.uuid4().hex[:8],
                    "source": source,
                    "source_type": "twitter",
                    "ticker": tickers[0],
                    "tickers": tickers,
                    "action": "UNKNOWN",
                    "thesis": text[:300],
                    "entry_target": None,
                    "price_target": None,
                    "stop_loss": None,
                    "confidence": 0.3,
                    "raw_text": text,
                    "url": None,
                    "timestamp": now,
                    "parsed_at": now,
                    "status": "new",
                }
                score = datetime.now(timezone.utc).timestamp()
                rdb.zadd(SIGNALS_FEED, {json.dumps(signal): score})
                results.append(signal)
            errors.append({"index": i, "error": str(e)})

    return {"parsed": len(results), "errors": len(errors), "signals": results}


# ══════════════════════════════════════════════════════════════════════════
#  3. TWITTER API v2 + RSS FALLBACK
# ══════════════════════════════════════════════════════════════════════════

TWITTER_API_BASE = "https://api.twitter.com/2"

# Cache user IDs to avoid repeated lookups
_twitter_user_id_cache: Dict[str, str] = {}


async def _twitter_api_headers():
    """Return auth headers for Twitter API v2."""
    if not TWITTER_BEARER_TOKEN:
        return None
    return {"Authorization": f"Bearer {TWITTER_BEARER_TOKEN}"}


async def _twitter_lookup_user_id(handle: str, client: httpx.AsyncClient) -> Optional[str]:
    """Look up a Twitter user ID by username, with Redis caching."""
    handle_lower = handle.lower()

    # Check in-memory cache
    if handle_lower in _twitter_user_id_cache:
        return _twitter_user_id_cache[handle_lower]

    # Check Redis cache
    cached = rdb.get(f"twitter:uid:{handle_lower}")
    if cached:
        _twitter_user_id_cache[handle_lower] = cached
        return cached

    headers = await _twitter_api_headers()
    if not headers:
        return None

    r = await client.get(f"{TWITTER_API_BASE}/users/by/username/{handle}", headers=headers)
    if r.status_code == 200:
        data = r.json().get("data", {})
        uid = data.get("id")
        if uid:
            _twitter_user_id_cache[handle_lower] = uid
            rdb.set(f"twitter:uid:{handle_lower}", uid, ex=86400 * 30)  # cache 30 days
            return uid
    return None


async def _fetch_twitter_v2(handle: str) -> tuple:
    """Fetch recent tweets via Twitter API v2. Returns (entries, source_url)."""
    headers = await _twitter_api_headers()
    if not headers:
        return [], None

    async with httpx.AsyncClient(timeout=20) as client:
        uid = await _twitter_lookup_user_id(handle, client)
        if not uid:
            # Fallback: use search endpoint
            query = f"from:{handle} -is:retweet"
            params = {
                "query": query,
                "max_results": 50,
                "tweet.fields": "created_at,text,author_id,conversation_id",
                "sort_order": "recency",
            }
            r = await client.get(f"{TWITTER_API_BASE}/tweets/search/recent", headers=headers, params=params)
        else:
            # Use user timeline endpoint (more reliable)
            params = {
                "max_results": 50,
                "tweet.fields": "created_at,text,author_id,conversation_id",
                "exclude": "retweets",
            }
            r = await client.get(f"{TWITTER_API_BASE}/users/{uid}/tweets", headers=headers, params=params)

        if r.status_code == 429:
            # Rate limited — return empty with info
            reset = r.headers.get("x-rate-limit-reset", "")
            return [], f"rate_limited:reset={reset}"

        if r.status_code != 200:
            return [], f"error:{r.status_code}"

        data = r.json()
        tweets = data.get("data", [])

        # Convert to entry-like dicts compatible with existing parsing
        entries = []
        for tw in tweets:
            entries.append({
                "id": tw.get("id", ""),
                "title": tw.get("text", ""),
                "summary": tw.get("text", ""),
                "link": f"https://x.com/{handle}/status/{tw.get('id', '')}",
                "published": tw.get("created_at", ""),
            })

        return entries, f"twitter_api_v2:user={handle}"


# RSS fallback bridges (most are dead as of 2025, but kept as backup)
RSS_BRIDGES = [
    "https://rsshub.app/twitter/user/{handle}",
    "https://nitter.privacydev.net/{handle}/rss",
    "https://twiiit.com/{handle}/rss",
]


async def _fetch_twitter_rss(handle: str):
    """Try RSS bridges in order, return parsed feed entries."""
    if not feedparser:
        return [], None

    async with httpx.AsyncClient(timeout=10, follow_redirects=True) as client:
        for bridge_tpl in RSS_BRIDGES:
            url = bridge_tpl.format(handle=handle)
            try:
                r = await client.get(url)
                if r.status_code == 200 and r.text.strip():
                    feed = feedparser.parse(r.text)
                    if feed.entries:
                        return feed.entries, url
            except Exception:
                continue
    return [], None


async def _fetch_tweets(handle: str):
    """Fetch tweets: try API v2 first, fall back to RSS bridges."""
    # Try Twitter API v2 first
    entries, source = await _fetch_twitter_v2(handle)
    if entries:
        return entries, source

    # Fall back to RSS bridges
    entries, source = await _fetch_twitter_rss(handle)
    return entries, source


def _entry_hash(entry) -> str:
    """Create a dedup hash from a feed entry."""
    key = entry.get("link") or entry.get("id") or entry.get("title", "")
    return hashlib.sha256(key.encode()).hexdigest()[:16]


@router.post("/poll/twitter/{handle}")
async def poll_twitter_handle(handle: str):
    """Poll a single Twitter handle via API v2 (preferred) or RSS bridges."""
    handle = handle.lstrip("@").lower()
    seen_key = f"signals:seen:{handle}"

    entries, source_url = await _fetch_tweets(handle)
    if not entries:
        return {"handle": handle, "new_signals": 0, "source": source_url, "error": "No tweets found — check TWITTER_BEARER_TOKEN"}

    new_signals = []
    for entry in entries:
        h = _entry_hash(entry)
        if rdb.sismember(seen_key, h):
            continue

        text = entry.get("summary") or entry.get("title") or ""
        tickers = extract_tickers(text)
        if not tickers:
            rdb.sadd(seen_key, h)
            continue

        try:
            signal = await _parse_text_with_claude(
                raw_text=text,
                source=handle,
                source_type="twitter",
                url=entry.get("link"),
            )
            new_signals.append(signal)
        except Exception:
            # Store a basic signal on parse failure
            now = _now_iso()
            signal = {
                "id": uuid.uuid4().hex[:8],
                "source": handle,
                "source_type": "twitter",
                "ticker": tickers[0],
                "tickers": tickers,
                "action": "UNKNOWN",
                "thesis": text[:300],
                "entry_target": None,
                "price_target": None,
                "stop_loss": None,
                "confidence": 0.3,
                "raw_text": text,
                "url": entry.get("link"),
                "timestamp": now,
                "parsed_at": now,
                "status": "new",
            }
            score = datetime.now(timezone.utc).timestamp()
            rdb.zadd(SIGNALS_FEED, {json.dumps(signal): score})
            new_signals.append(signal)

        rdb.sadd(seen_key, h)

    return {"handle": handle, "new_signals": len(new_signals), "signals": new_signals, "bridge": bridge_url}


@router.post("/poll/twitter")
async def poll_all_twitter():
    """Poll ALL configured Twitter sources."""
    sources = rdb.hgetall(SIGNALS_SOURCES)
    twitter_handles = [
        json.loads(v).get("handle")
        for v in sources.values()
        if json.loads(v).get("type") == "twitter"
    ]
    if not twitter_handles:
        return {"error": "No Twitter sources configured", "results": []}

    results = []
    for handle in twitter_handles:
        try:
            result = await poll_twitter_handle(handle)
            results.append(result)
        except Exception as e:
            results.append({"handle": handle, "error": str(e)})

    total = sum(r.get("new_signals", 0) for r in results)
    return {"total_new": total, "results": results}


# ── Hardcoded followed accounts ──────────────────────────────────────────
FOLLOWED_ACCOUNTS = [
    {"handle": "unusual_whales", "label": "Unusual Whales", "priority": 1},
    {"handle": "DeItaone", "label": "Walter Bloomberg", "priority": 1},
    {"handle": "zaborskitrading", "label": "Zaborski", "priority": 2},
    {"handle": "jimcramer", "label": "Jim Cramer", "priority": 2},
    {"handle": "elikidesign", "label": "Eli Ki", "priority": 2},
    {"handle": "chaaborski", "label": "ChaBorski", "priority": 2},
    {"handle": "Mr_Derivatives", "label": "Mr. Derivatives", "priority": 1},
    {"handle": "OptionsHawk", "label": "Options Hawk", "priority": 1},
    {"handle": "traborski", "label": "TraBorski", "priority": 2},
    {"handle": "aleabitoreddit", "label": "Serenity", "priority": 0},  # highest priority
    {"handle": "MispricedAssets", "label": "Mispriced Assets", "priority": 0},
]

@router.post("/poll/following")
async def poll_following_feed():
    """Poll all followed accounts, return new signals."""
    results = []
    for acct in FOLLOWED_ACCOUNTS:
        try:
            result = await poll_twitter_handle(acct["handle"])
            result["label"] = acct["label"]
            result["priority"] = acct["priority"]
            results.append(result)
        except Exception as e:
            results.append({"handle": acct["handle"], "label": acct["label"], "error": str(e), "new_signals": 0})

    total = sum(r.get("new_signals", 0) for r in results)
    return {"total_new": total, "results": results, "accounts": len(FOLLOWED_ACCOUNTS)}


@router.get("/twitter/status")
async def twitter_api_status():
    """Check Twitter API v2 configuration status."""
    global TWITTER_BEARER_TOKEN
    TWITTER_BEARER_TOKEN = os.getenv("TWITTER_BEARER_TOKEN", TWITTER_BEARER_TOKEN)
    configured = bool(TWITTER_BEARER_TOKEN)
    result = {"configured": configured, "accounts": len(FOLLOWED_ACCOUNTS)}

    if configured:
        # Quick validation — try to look up one account
        async with httpx.AsyncClient(timeout=10) as client:
            headers = await _twitter_api_headers()
            try:
                r = await client.get(f"{TWITTER_API_BASE}/users/me", headers=headers)
                if r.status_code == 200:
                    result["valid"] = True
                    result["authenticated_as"] = r.json().get("data", {}).get("username", "")
                elif r.status_code == 403:
                    result["valid"] = True
                    result["note"] = "App-only auth (no user context) — search endpoints will work"
                else:
                    result["valid"] = False
                    result["error"] = f"HTTP {r.status_code}"
            except Exception as e:
                result["valid"] = False
                result["error"] = str(e)

    return result


@router.post("/twitter/set-token")
async def set_twitter_token(token: str = Body(..., embed=True)):
    """Set the Twitter Bearer Token at runtime (persists until restart)."""
    global TWITTER_BEARER_TOKEN
    TWITTER_BEARER_TOKEN = token.strip()

    # Validate it
    async with httpx.AsyncClient(timeout=10) as client:
        headers = {"Authorization": f"Bearer {TWITTER_BEARER_TOKEN}"}
        try:
            r = await client.get(f"{TWITTER_API_BASE}/tweets/search/recent?query=test&max_results=10", headers=headers)
            if r.status_code in (200, 403):
                return {"success": True, "message": "Token set successfully"}
            else:
                TWITTER_BEARER_TOKEN = ""
                return {"success": False, "error": f"Token invalid: HTTP {r.status_code}"}
        except Exception as e:
            TWITTER_BEARER_TOKEN = ""
            return {"success": False, "error": str(e)}


@router.get("/curated-watchlist")
async def curated_watchlist():
    """Build a curated watchlist from all signals in the last 14 days, grouped by ticker with AI thesis.
    Prioritizes Serenity and Mispriced Assets signals."""
    two_weeks_ago = (datetime.now(timezone.utc) - timedelta(days=14)).timestamp()

    members = rdb.zrangebyscore(SIGNALS_FEED, two_weeks_ago, "+inf", withscores=True)

    # Group signals by ticker
    ticker_signals = {}  # type: Dict[str, List[dict]]
    for raw, score in members:
        sig = json.loads(raw)
        if sig.get("source_type") != "twitter":
            continue
        ticker = sig.get("ticker", "UNKNOWN")
        if ticker == "UNKNOWN":
            continue
        if ticker not in ticker_signals:
            ticker_signals[ticker] = []
        ticker_signals[ticker].append(sig)

    # Build watchlist entries
    watchlist = []
    for ticker, signals in ticker_signals.items():
        # Sort by priority (Serenity=0 first) then by timestamp
        priority_map = {a["handle"].lower(): a["priority"] for a in FOLLOWED_ACCOUNTS}
        signals.sort(key=lambda s: (priority_map.get(s.get("source", "").lower(), 5), s.get("timestamp", "")))

        # Aggregate
        sources = list({s.get("source", "") for s in signals})
        actions = [s.get("action", "UNKNOWN") for s in signals if s.get("action") != "UNKNOWN"]
        consensus_action = max(set(actions), key=actions.count) if actions else "WATCH"

        # Best thesis (prefer highest confidence or Serenity)
        best = max(signals, key=lambda s: (
            10 if s.get("source", "").lower() == "aleabitoreddit" else 0,
            5 if s.get("source", "").lower() == "mispricedassets" else 0,
            s.get("confidence", 0)
        ))

        avg_confidence = sum(s.get("confidence", 0.5) for s in signals) / len(signals)

        entry = {
            "ticker": ticker,
            "action": consensus_action,
            "thesis": best.get("thesis", ""),
            "sources": sources,
            "signal_count": len(signals),
            "avg_confidence": round(avg_confidence, 2),
            "entry_target": best.get("entry_target"),
            "price_target": best.get("price_target"),
            "stop_loss": best.get("stop_loss"),
            "latest_signal": max(s.get("timestamp", "") for s in signals),
            "serenity_mentioned": any(s.get("source", "").lower() == "aleabitoreddit" for s in signals),
        }
        watchlist.append(entry)

    # Sort: Serenity mentions first, then by signal count * confidence
    watchlist.sort(key=lambda w: (
        -int(w["serenity_mentioned"]),
        -(w["signal_count"] * w["avg_confidence"])
    ))

    return {"watchlist": watchlist, "total_tickers": len(watchlist), "period_days": 14}


@router.get("/feed/timeline")
async def following_timeline(limit: int = Query(100, ge=1, le=500)):
    """Return all Twitter signals as a chronological feed, newest first."""
    members = rdb.zrevrange(SIGNALS_FEED, 0, -1, withscores=True)

    feed = []
    for raw, score in members:
        sig = json.loads(raw)
        if sig.get("source_type") != "twitter":
            continue
        # Add label
        handle = sig.get("source", "").lower()
        for acct in FOLLOWED_ACCOUNTS:
            if acct["handle"].lower() == handle:
                sig["source_label"] = acct["label"]
                sig["priority"] = acct["priority"]
                break
        else:
            sig["source_label"] = sig.get("source", "Unknown")
            sig["priority"] = 5
        feed.append(sig)
        if len(feed) >= limit:
            break

    return {"feed": feed, "count": len(feed)}


# ══════════════════════════════════════════════════════════════════════════
#  4. DISCORD POLLING
# ══════════════════════════════════════════════════════════════════════════

@router.post("/poll/discord")
async def poll_discord():
    """Poll Discord channel(s) via Bot API, parse messages with tickers."""
    if not DISCORD_BOT_TOKEN or not MISPRICED_ASSETS_CHANNEL_ID:
        return {"error": "Discord bot or channel not configured", "new_signals": 0}

    seen_key = "signals:seen:discord"

    try:
        async with httpx.AsyncClient(timeout=10) as client:
            r = await client.get(
                f"https://discord.com/api/v10/channels/{MISPRICED_ASSETS_CHANNEL_ID}/messages?limit=50",
                headers={"Authorization": f"Bot {DISCORD_BOT_TOKEN}"},
            )
            msgs = r.json()
    except Exception as e:
        return {"error": f"Discord API error: {e}", "new_signals": 0}

    if isinstance(msgs, dict) and msgs.get("code"):
        return {"error": msgs.get("message", "Discord API error"), "new_signals": 0}

    new_signals = []
    for m in (msgs if isinstance(msgs, list) else []):
        msg_id = m.get("id", "")
        if rdb.sismember(seen_key, msg_id):
            continue

        content = m.get("content", "")
        tickers = extract_tickers(content)
        if not tickers:
            rdb.sadd(seen_key, msg_id)
            continue

        author = m.get("author", {})
        is_bot = author.get("bot", False)
        source_name = "mispriced_assets" if is_bot else (author.get("username", "discord_user"))

        try:
            signal = await _parse_text_with_claude(
                raw_text=content,
                source=source_name,
                source_type="discord",
                url=None,
            )
            # Bot messages get higher confidence boost
            if is_bot:
                signal["confidence"] = min(1.0, signal.get("confidence", 0.5) + 0.2)
            new_signals.append(signal)
        except Exception:
            now = _now_iso()
            signal = {
                "id": uuid.uuid4().hex[:8],
                "source": source_name,
                "source_type": "discord",
                "ticker": tickers[0],
                "tickers": tickers,
                "action": "UNKNOWN",
                "thesis": content[:300],
                "entry_target": None,
                "price_target": None,
                "stop_loss": None,
                "confidence": 0.5 if is_bot else 0.3,
                "raw_text": content,
                "url": None,
                "timestamp": m.get("timestamp", _now_iso()),
                "parsed_at": _now_iso(),
                "status": "new",
            }
            score = datetime.now(timezone.utc).timestamp()
            rdb.zadd(SIGNALS_FEED, {json.dumps(signal): score})
            new_signals.append(signal)

        rdb.sadd(seen_key, msg_id)

    return {"channel_id": MISPRICED_ASSETS_CHANNEL_ID, "new_signals": len(new_signals), "signals": new_signals}


# ══════════════════════════════════════════════════════════════════════════
#  5. BRIDGE ENDPOINTS
# ══════════════════════════════════════════════════════════════════════════

@router.post("/{signal_id}/to-conviction")
async def signal_to_conviction(signal_id: str):
    """Create a conviction from an existing signal."""
    sig, _ = _signal_from_redis(signal_id)
    if not sig:
        raise HTTPException(404, "Signal not found")

    conviction = {
        "id": uuid.uuid4().hex[:8],
        "trader": sig.get("source", "signal"),
        "ticker": sig["ticker"],
        "thesis": sig.get("thesis", ""),
        "entry_target": sig.get("entry_target"),
        "price_target": sig.get("price_target"),
        "status": "watching",
        "notes": f"From signal {signal_id} ({sig.get('source_type', '')})",
        "created": _now_iso(),
    }
    rdb.rpush(CONVICTIONS_KEY, json.dumps(conviction))

    # Mark signal as acted
    _update_signal_status(signal_id, "acted")

    return {"conviction": conviction, "signal_id": signal_id}


@router.post("/{signal_id}/to-watchlist")
async def signal_to_watchlist(signal_id: str):
    """Add signal's ticker to the watchlist Redis set."""
    sig, _ = _signal_from_redis(signal_id)
    if not sig:
        raise HTTPException(404, "Signal not found")

    ticker = sig["ticker"].upper()
    rdb.sadd(WATCHLIST_KEY, ticker)

    _update_signal_status(signal_id, "acted")
    return {"added": ticker, "signal_id": signal_id}


@router.post("/{signal_id}/to-journal")
async def signal_to_journal(signal_id: str):
    """Create a draft journal entry from a signal."""
    sig, _ = _signal_from_redis(signal_id)
    if not sig:
        raise HTTPException(404, "Signal not found")

    entry = {
        "id": uuid.uuid4().hex[:8],
        "ticker": sig["ticker"],
        "date": _now_iso(),
        "action": sig.get("action", "WATCH"),
        "thesis": sig.get("thesis", ""),
        "entry_price": sig.get("entry_target"),
        "target_price": sig.get("price_target"),
        "stop_loss": sig.get("stop_loss"),
        "status": "draft",
        "source": f"signal:{signal_id}",
        "notes": f"Auto-generated from {sig.get('source', '')} signal",
    }
    rdb.rpush(JOURNAL_KEY, json.dumps(entry))

    _update_signal_status(signal_id, "acted")
    return {"journal_entry": entry, "signal_id": signal_id}


def _update_signal_status(signal_id: str, new_status: str):
    """Helper to update a signal's status in the sorted set."""
    members = rdb.zrange(SIGNALS_FEED, 0, -1, withscores=True)
    for raw, score in members:
        sig = json.loads(raw)
        if sig.get("id") == signal_id:
            sig["status"] = new_status
            rdb.zrem(SIGNALS_FEED, raw)
            rdb.zadd(SIGNALS_FEED, {json.dumps(sig): score})
            return


# ══════════════════════════════════════════════════════════════════════════
#  6. SOURCES MANAGEMENT
# ══════════════════════════════════════════════════════════════════════════

@router.get("/sources")
async def list_sources():
    """List all configured signal sources."""
    raw = rdb.hgetall(SIGNALS_SOURCES)
    sources = []
    for sid, val in raw.items():
        src = json.loads(val)
        src["id"] = sid
        sources.append(src)
    return {"sources": sources}


@router.post("/sources")
async def add_source(s: SourceIn):
    """Add a signal source (twitter handle or discord channel)."""
    sid = uuid.uuid4().hex[:8]
    entry = {
        "type": s.type,
        "handle": s.handle,
        "channel_id": s.channel_id,
        "added": _now_iso(),
    }
    rdb.hset(SIGNALS_SOURCES, sid, json.dumps(entry))
    entry["id"] = sid
    return entry


@router.delete("/sources/{source_id}")
async def remove_source(source_id: str):
    """Remove a configured source."""
    if not rdb.hdel(SIGNALS_SOURCES, source_id):
        raise HTTPException(404, "Source not found")
    return {"deleted": source_id}


# ══════════════════════════════════════════════════════════════════════════
#  7. ANALYTICS
# ══════════════════════════════════════════════════════════════════════════

@router.get("/stats")
async def signal_stats():
    """Signal counts by source and trending tickers (top 10)."""
    members = rdb.zrange(SIGNALS_FEED, 0, -1)
    by_source = {}
    ticker_counts = {}
    by_status = {}

    for raw in members:
        sig = json.loads(raw)
        src = sig.get("source", "unknown")
        by_source[src] = by_source.get(src, 0) + 1

        status = sig.get("status", "unknown")
        by_status[status] = by_status.get(status, 0) + 1

        for t in sig.get("tickers", []):
            ticker_counts[t] = ticker_counts.get(t, 0) + 1

    trending = sorted(ticker_counts.items(), key=lambda x: x[1], reverse=True)[:10]

    return {
        "total": len(members),
        "by_source": by_source,
        "by_status": by_status,
        "trending_tickers": [{"ticker": t, "count": c} for t, c in trending],
    }


@router.get("/performance")
async def signal_performance():
    """P&L attribution placeholder — returns acted signals with price deltas."""
    members = rdb.zrange(SIGNALS_FEED, 0, -1)
    acted = []
    for raw in members:
        sig = json.loads(raw)
        if sig.get("status") == "acted":
            acted.append({
                "id": sig["id"],
                "ticker": sig["ticker"],
                "action": sig.get("action"),
                "entry_target": sig.get("entry_target"),
                "price_target": sig.get("price_target"),
                "source": sig.get("source"),
                "timestamp": sig.get("timestamp"),
            })

    # Enrich with current prices if yfinance is available
    if yf and acted:
        tickers = list({s["ticker"] for s in acted if s["ticker"] != "UNKNOWN"})
        prices = {}
        try:
            for t in tickers[:20]:  # limit batch
                stock = yf.Ticker(t)
                hist = stock.history(period="1d")
                if not hist.empty:
                    prices[t] = round(float(hist["Close"].iloc[-1]), 2)
        except Exception:
            pass

        for s in acted:
            s["current_price"] = prices.get(s["ticker"])
            if s["current_price"] and s.get("entry_target"):
                s["pnl_pct"] = round(
                    ((s["current_price"] - s["entry_target"]) / s["entry_target"]) * 100, 2
                )

    return {"acted_signals": acted, "count": len(acted)}


# ══════════════════════════════════════════════════════════════════════════
#  8. SMART WATCHLISTS
# ══════════════════════════════════════════════════════════════════════════

SMART_WL_PREFIX = "smart_watchlist:"


@router.get("/smart-watchlists", tags=["smart-watchlists"])
async def list_smart_watchlists():
    """List all named smart watchlists."""
    keys = rdb.keys(f"{SMART_WL_PREFIX}*:meta")
    watchlists = []
    for k in keys:
        meta = rdb.get(k)
        if meta:
            m = json.loads(meta)
            name = k.replace(SMART_WL_PREFIX, "").replace(":meta", "")
            entry_count = rdb.hlen(f"{SMART_WL_PREFIX}{name}")
            watchlists.append({"name": name, "description": m.get("description", ""), "count": entry_count})
    return {"watchlists": watchlists}


@router.post("/smart-watchlists", tags=["smart-watchlists"])
async def create_smart_watchlist(wl: SmartWatchlistCreate):
    """Create a new named smart watchlist."""
    name = wl.name.lower().replace(" ", "-")
    meta_key = f"{SMART_WL_PREFIX}{name}:meta"
    if rdb.exists(meta_key):
        raise HTTPException(409, "Watchlist already exists")

    meta = {"description": wl.description, "created": _now_iso()}
    rdb.set(meta_key, json.dumps(meta))
    return {"name": name, "description": wl.description}


@router.get("/smart-watchlists/{name}", tags=["smart-watchlists"])
async def get_smart_watchlist(name: str):
    """Get all entries in a smart watchlist."""
    meta_key = f"{SMART_WL_PREFIX}{name}:meta"
    if not rdb.exists(meta_key):
        raise HTTPException(404, "Watchlist not found")

    wl_key = f"{SMART_WL_PREFIX}{name}"
    raw = rdb.hgetall(wl_key)
    entries = [json.loads(v) for v in raw.values()]
    meta = json.loads(rdb.get(meta_key) or "{}")
    return {"name": name, "description": meta.get("description", ""), "entries": entries}


@router.post("/smart-watchlists/{name}/add", tags=["smart-watchlists"])
async def add_to_smart_watchlist(name: str, entry: SmartWatchlistEntry):
    """Add an entry to a smart watchlist."""
    meta_key = f"{SMART_WL_PREFIX}{name}:meta"
    if not rdb.exists(meta_key):
        raise HTTPException(404, "Watchlist not found")

    ticker = entry.ticker.upper()
    wl_key = f"{SMART_WL_PREFIX}{name}"
    data = {
        "ticker": ticker,
        "entry_zone_low": entry.entry_zone_low,
        "entry_zone_high": entry.entry_zone_high,
        "stop_loss": entry.stop_loss,
        "take_profit": entry.take_profit,
        "thesis": entry.thesis,
        "signal_id": entry.signal_id,
        "added": _now_iso(),
    }
    rdb.hset(wl_key, ticker, json.dumps(data))
    return data


@router.delete("/smart-watchlists/{name}/{ticker}", tags=["smart-watchlists"])
async def remove_from_smart_watchlist(name: str, ticker: str):
    """Remove a ticker from a smart watchlist."""
    wl_key = f"{SMART_WL_PREFIX}{name}"
    if not rdb.hdel(wl_key, ticker.upper()):
        raise HTTPException(404, "Ticker not found in watchlist")
    return {"deleted": ticker.upper(), "watchlist": name}


# ══════════════════════════════════════════════════════════════════════════
#  9. ENTRY PLANNER
# ══════════════════════════════════════════════════════════════════════════

@router.post("/entry-plan")
async def entry_plan(plan: EntryPlanIn):
    """Calculate DCA levels, position size, and risk/reward ratio."""
    ticker = plan.ticker.upper()
    entry = plan.entry_target
    target = plan.price_target
    stop = plan.stop_loss
    pct = plan.portfolio_pct

    # Fetch current price
    current_price = None
    technicals = {}
    if yf:
        try:
            stock = yf.Ticker(ticker)
            hist = stock.history(period="3mo", interval="1d")
            if not hist.empty:
                current_price = round(float(hist["Close"].iloc[-1]), 2)
                # Basic technicals
                closes = hist["Close"]
                technicals["sma_20"] = round(float(closes.rolling(20).mean().iloc[-1]), 2) if len(closes) >= 20 else None
                technicals["sma_50"] = round(float(closes.rolling(50).mean().iloc[-1]), 2) if len(closes) >= 50 else None
                technicals["rsi_14"] = _calc_rsi(closes, 14)
                technicals["atr_14"] = _calc_atr(hist, 14)
                technicals["high_3m"] = round(float(hist["High"].max()), 2)
                technicals["low_3m"] = round(float(hist["Low"].min()), 2)
        except Exception:
            pass

    # Risk/reward
    risk_per_share = abs(entry - stop)
    reward_per_share = abs(target - entry)
    rr_ratio = round(reward_per_share / risk_per_share, 2) if risk_per_share > 0 else 0

    # DCA levels (3 tranches)
    dca_levels = [
        {"level": 1, "price": round(entry, 2), "pct_of_position": 40, "label": "Initial entry"},
        {"level": 2, "price": round(entry - (risk_per_share * 0.33), 2), "pct_of_position": 35, "label": "First add"},
        {"level": 3, "price": round(entry - (risk_per_share * 0.66), 2), "pct_of_position": 25, "label": "Final add"},
    ]

    # Position sizing (assuming $100k portfolio as default reference)
    portfolio_value = 100_000
    allocation = portfolio_value * (pct / 100)
    shares_at_entry = int(allocation / entry) if entry > 0 else 0
    max_loss = round(shares_at_entry * risk_per_share, 2)
    max_loss_pct = round((max_loss / portfolio_value) * 100, 2) if portfolio_value else 0

    return {
        "ticker": ticker,
        "current_price": current_price,
        "entry_target": entry,
        "price_target": target,
        "stop_loss": stop,
        "risk_reward_ratio": rr_ratio,
        "dca_levels": dca_levels,
        "position_sizing": {
            "portfolio_pct": pct,
            "reference_portfolio": portfolio_value,
            "allocation": round(allocation, 2),
            "shares_at_entry": shares_at_entry,
            "max_loss": max_loss,
            "max_loss_pct_portfolio": max_loss_pct,
        },
        "technicals": technicals,
    }


def _calc_rsi(closes, period=14):
    """Calculate RSI from a pandas Series of closes."""
    try:
        delta = closes.diff()
        gain = delta.where(delta > 0, 0).rolling(window=period).mean()
        loss = (-delta.where(delta < 0, 0)).rolling(window=period).mean()
        rs = gain.iloc[-1] / loss.iloc[-1] if loss.iloc[-1] != 0 else 100
        return round(100 - (100 / (1 + rs)), 2)
    except Exception:
        return None


def _calc_atr(hist, period=14):
    """Calculate Average True Range."""
    try:
        high = hist["High"]
        low = hist["Low"]
        close = hist["Close"].shift(1)
        tr1 = high - low
        tr2 = (high - close).abs()
        tr3 = (low - close).abs()
        tr = tr1.to_frame("tr1").join(tr2.rename("tr2")).join(tr3.rename("tr3")).max(axis=1)
        return round(float(tr.rolling(period).mean().iloc[-1]), 2)
    except Exception:
        return None


# ══════════════════════════════════════════════════════════════════════════
#  10. CATALYST CALENDAR
# ══════════════════════════════════════════════════════════════════════════

@router.get("/catalysts")
async def catalyst_calendar():
    """Upcoming earnings dates for tickers in active (non-dismissed) signals."""
    # Check cache
    cached = rdb.get("cache:catalysts")
    if cached:
        return json.loads(cached)

    # Collect tickers from active signals
    members = rdb.zrange(SIGNALS_FEED, 0, -1)
    tickers = set()
    for raw in members:
        sig = json.loads(raw)
        if sig.get("status") == "dismissed":
            continue
        tks = sig.get("tickers", [])
        if tks:
            tickers.update(tks)
        elif sig.get("ticker"):
            tickers.add(sig["ticker"])
    tickers.discard("UNKNOWN")

    if not tickers or not FINNHUB_API_KEY:
        return {"catalysts": [], "count": 0}

    today = datetime.now(timezone.utc).date()
    end_date = today + timedelta(days=30)
    from_str = today.isoformat()
    to_str = end_date.isoformat()

    catalysts = []  # type: List[Dict[str, Any]]
    async with httpx.AsyncClient(timeout=10) as client:
        for tk in list(tickers)[:30]:
            try:
                r = await client.get(
                    "https://finnhub.io/api/v1/calendar/earnings",
                    params={
                        "from": from_str,
                        "to": to_str,
                        "symbol": tk,
                        "token": FINNHUB_API_KEY,
                    },
                )
                if r.status_code == 200:
                    data = r.json()
                    for ec in data.get("earningsCalendar", []):
                        earn_date = ec.get("date", "")
                        if earn_date:
                            try:
                                ed = datetime.strptime(earn_date, "%Y-%m-%d").date()
                                days_until = (ed - today).days
                            except ValueError:
                                days_until = None
                            catalysts.append({
                                "ticker": ec.get("symbol", tk),
                                "earnings_date": earn_date,
                                "days_until": days_until,
                                "estimate_eps": ec.get("epsEstimate"),
                                "quarter": ec.get("quarter"),
                            })
            except Exception:
                continue

    # Sort by date
    catalysts.sort(key=lambda x: x.get("earnings_date", "9999"))

    result = {"catalysts": catalysts, "count": len(catalysts)}

    # Cache for 6 hours
    rdb.setex("cache:catalysts", 6 * 3600, json.dumps(result))

    return result


# ══════════════════════════════════════════════════════════════════════════
#  11. SIGNAL SCORECARD
# ══════════════════════════════════════════════════════════════════════════

@router.get("/scorecard")
async def signal_scorecard():
    """Win-rate and return stats per source."""
    members = rdb.zrange(SIGNALS_FEED, 0, -1)

    # Group signals by source
    by_source = {}  # type: Dict[str, List[Dict[str, Any]]]
    for raw in members:
        sig = json.loads(raw)
        src = sig.get("source", "unknown")
        by_source.setdefault(src, []).append(sig)

    # Get current prices for acted signals via yfinance
    acted_tickers = set()
    for sigs in by_source.values():
        for sig in sigs:
            if sig.get("status") == "acted" and sig.get("ticker", "UNKNOWN") != "UNKNOWN":
                acted_tickers.add(sig["ticker"])

    prices = {}  # type: Dict[str, float]
    if yf and acted_tickers:
        for t in list(acted_tickers)[:30]:
            try:
                stock = yf.Ticker(t)
                hist = stock.history(period="1d")
                if not hist.empty:
                    prices[t] = round(float(hist["Close"].iloc[-1]), 2)
            except Exception:
                pass

    sources = []  # type: List[Dict[str, Any]]
    for src, sigs in by_source.items():
        total = len(sigs)
        acted = [s for s in sigs if s.get("status") == "acted"]
        acted_count = len(acted)

        wins = 0
        returns = []  # type: List[float]
        best_ticker = None
        best_return = None  # type: Optional[float]

        for s in acted:
            tk = s.get("ticker", "UNKNOWN")
            entry = s.get("entry_target")
            cp = prices.get(tk)
            if cp is None or entry is None or entry <= 0:
                continue

            action = s.get("action", "BUY").upper()
            if action == "SELL":
                ret_pct = round(((entry - cp) / entry) * 100, 2)
            else:
                ret_pct = round(((cp - entry) / entry) * 100, 2)

            returns.append(ret_pct)
            if ret_pct > 0:
                wins += 1
            if best_return is None or ret_pct > best_return:
                best_return = ret_pct
                best_ticker = tk

        evaluated = len(returns)
        win_rate = round((wins / evaluated) * 100, 1) if evaluated > 0 else None
        avg_return = round(sum(returns) / len(returns), 2) if returns else None

        sources.append({
            "source": src,
            "total": total,
            "acted": acted_count,
            "win_rate": win_rate,
            "avg_return": avg_return,
            "best_ticker": best_ticker,
            "best_return": best_return,
        })

    return {"sources": sources}


# ══════════════════════════════════════════════════════════════════════════
#  12. UNUSUAL ACTIVITY (INSIDER TRANSACTIONS)
# ══════════════════════════════════════════════════════════════════════════

@router.get("/unusual-activity")
async def unusual_activity():
    """Insider transactions for tickers in active signals (last 30 days)."""
    # Check cache
    cached = rdb.get("cache:unusual_activity")
    if cached:
        return json.loads(cached)

    # Collect tickers from active signals
    members = rdb.zrange(SIGNALS_FEED, 0, -1)
    tickers = set()
    for raw in members:
        sig = json.loads(raw)
        if sig.get("status") == "dismissed":
            continue
        tks = sig.get("tickers", [])
        if tks:
            tickers.update(tks)
        elif sig.get("ticker"):
            tickers.add(sig["ticker"])
    tickers.discard("UNKNOWN")

    if not tickers or not FINNHUB_API_KEY:
        return {"activities": [], "count": 0}

    cutoff = (datetime.now(timezone.utc) - timedelta(days=30)).strftime("%Y-%m-%d")
    activities = []  # type: List[Dict[str, Any]]

    async with httpx.AsyncClient(timeout=10) as client:
        for tk in list(tickers)[:20]:
            try:
                r = await client.get(
                    "https://finnhub.io/api/v1/stock/insider-transactions",
                    params={"symbol": tk, "token": FINNHUB_API_KEY},
                )
                if r.status_code == 200:
                    data = r.json()
                    for txn in data.get("data", []):
                        txn_date = txn.get("transactionDate", "")
                        if txn_date >= cutoff:
                            activities.append({
                                "ticker": tk,
                                "type": txn.get("transactionCode", "unknown"),
                                "volume_or_shares": txn.get("share", 0),
                                "date": txn_date,
                                "description": "{} {} {} shares".format(
                                    txn.get("name", "Insider"),
                                    txn.get("transactionCode", "traded"),
                                    txn.get("share", 0),
                                ),
                            })
            except Exception:
                continue

    # Sort by date descending
    activities.sort(key=lambda x: x.get("date", ""), reverse=True)

    result = {"activities": activities, "count": len(activities)}

    # Cache for 1 hour
    rdb.setex("cache:unusual_activity", 3600, json.dumps(result))

    return result


# ══════════════════════════════════════════════════════════════════════════
#  13. PORTFOLIO CORRELATION
# ══════════════════════════════════════════════════════════════════════════

@router.get("/correlation")
async def portfolio_correlation():
    """Pairwise correlation between signal tickers and Fidelity holdings."""
    if not yf:
        raise HTTPException(500, "yfinance not installed")

    # Collect tickers from active signals
    members = rdb.zrange(SIGNALS_FEED, 0, -1)
    signal_tickers = set()
    for raw in members:
        sig = json.loads(raw)
        if sig.get("status") == "dismissed":
            continue
        tks = sig.get("tickers", [])
        if tks:
            signal_tickers.update(tks)
        elif sig.get("ticker"):
            signal_tickers.add(sig["ticker"])
    signal_tickers.discard("UNKNOWN")

    if not signal_tickers:
        return {"correlations": [], "signal_tickers": [], "portfolio_tickers": []}

    # Read Fidelity positions from Redis
    portfolio_tickers = set()
    fidelity_raw = rdb.get("fidelity:positions")
    if fidelity_raw:
        try:
            positions = json.loads(fidelity_raw)
            if isinstance(positions, list):
                for pos in positions:
                    tk = pos.get("ticker") or pos.get("symbol") or pos.get("Ticker") or pos.get("Symbol")
                    if tk:
                        portfolio_tickers.add(tk.upper())
            elif isinstance(positions, dict):
                for key in positions:
                    portfolio_tickers.add(key.upper())
        except (json.JSONDecodeError, TypeError):
            pass

    if not portfolio_tickers:
        return {
            "correlations": [],
            "signal_tickers": sorted(signal_tickers),
            "portfolio_tickers": [],
            "note": "No Fidelity positions found in Redis key fidelity:positions",
        }

    # Fetch 3-month daily closes for all tickers
    all_tickers = list(signal_tickers | portfolio_tickers)[:30]
    closes = {}  # type: Dict[str, List[float]]
    for tk in all_tickers:
        try:
            stock = yf.Ticker(tk)
            hist = stock.history(period="3mo", interval="1d")
            if not hist.empty:
                closes[tk] = [float(c) for c in hist["Close"].tolist()]
        except Exception:
            continue

    # Calculate daily returns
    returns = {}  # type: Dict[str, List[float]]
    for tk, close_list in closes.items():
        if len(close_list) < 2:
            continue
        rets = []
        for i in range(1, len(close_list)):
            if close_list[i - 1] != 0:
                rets.append((close_list[i] - close_list[i - 1]) / close_list[i - 1])
            else:
                rets.append(0.0)
        returns[tk] = rets

    # Pairwise correlation between signal tickers and portfolio tickers
    correlations = []  # type: List[Dict[str, Any]]
    for stk in sorted(signal_tickers):
        if stk not in returns:
            continue
        for ptk in sorted(portfolio_tickers):
            if ptk not in returns:
                continue
            if stk == ptk:
                continue
            r1 = returns[stk]
            r2 = returns[ptk]
            min_len = min(len(r1), len(r2))
            if min_len < 5:
                continue
            r1 = r1[:min_len]
            r2 = r2[:min_len]

            # Pearson correlation
            n = min_len
            sum1 = sum(r1)
            sum2 = sum(r2)
            sum1sq = sum(x * x for x in r1)
            sum2sq = sum(x * x for x in r2)
            psum = sum(a * b for a, b in zip(r1, r2))

            num = psum - (sum1 * sum2 / n)
            den_a = sum1sq - (sum1 * sum1 / n)
            den_b = sum2sq - (sum2 * sum2 / n)
            if den_a <= 0 or den_b <= 0:
                corr = 0.0
            else:
                den = (den_a * den_b) ** 0.5
                corr = round(num / den, 4) if den != 0 else 0.0

            correlations.append({
                "signal_ticker": stk,
                "portfolio_ticker": ptk,
                "correlation": corr,
                "concentration_warning": abs(corr) > 0.7,
            })

    # Sort by absolute correlation descending
    correlations.sort(key=lambda x: abs(x["correlation"]), reverse=True)

    return {
        "correlations": correlations,
        "signal_tickers": sorted(signal_tickers),
        "portfolio_tickers": sorted(portfolio_tickers),
    }


# ══════════════════════════════════════════════════════════════════════════
#  PASTE-SIGNALS: Bulk paste & parse
# ══════════════════════════════════════════════════════════════════════════

class PasteSignalsRequest(BaseModel):
    text: str
    source: str = "Serenity"


def _get_current_price(ticker: str) -> Optional[float]:
    """Fetch current price for a ticker via yfinance. Returns None on failure."""
    if not yf:
        return None
    try:
        t = yf.Ticker(ticker)
        hist = t.history(period="1d")
        if not hist.empty:
            return round(float(hist["Close"].iloc[-1]), 2)
    except Exception:
        pass
    return None


@router.post("/paste-signals")
async def paste_signals(req: PasteSignalsRequest):
    """Accept pasted text, split into individual posts, parse each with Claude,
    fetch current prices, store in Redis."""
    text = req.text.strip()
    source = req.source.strip() or "manual"
    if not text:
        raise HTTPException(400, "Text is empty")

    # Split into individual posts by double newline or tweet-like boundaries
    posts = re.split(r'\n{2,}|(?=@\w+\s)', text)
    posts = [p.strip() for p in posts if p.strip() and len(p.strip()) > 10]

    if not posts:
        posts = [text]

    parsed_signals = []
    errors = []
    now_ts = datetime.now(timezone.utc).timestamp()

    for i, post_text in enumerate(posts):
        try:
            signal = await _parse_text_with_claude(
                raw_text=post_text,
                source=source,
                source_type="paste",
            )
            # Fetch current prices for each ticker
            tickers = signal.get("tickers", [])
            if not tickers and signal.get("ticker") and signal["ticker"] != "UNKNOWN":
                tickers = [signal["ticker"]]

            prices = {}
            for tk in tickers:
                price = _get_current_price(tk)
                if price is not None:
                    prices[tk] = price

            signal["current_prices"] = prices

            # Store each signal with per-ticker keys
            ts = now_ts + i * 0.001  # slight offset to preserve order
            for tk in tickers:
                rdb.set(
                    f"signal:{tk}:{int(ts)}",
                    json.dumps(signal),
                    ex=86400 * 30,  # 30-day TTL
                )
            rdb.zadd("signals:parsed", {json.dumps(signal): ts})

            parsed_signals.append(signal)
        except Exception as e:
            errors.append({"index": i, "error": str(e), "text": post_text[:100]})

    return {
        "parsed": len(parsed_signals),
        "errors": len(errors),
        "signals": parsed_signals,
        "error_details": errors,
    }


# ══════════════════════════════════════════════════════════════════════════
#  PNL-TRACKER: Track P&L across all parsed signals
# ══════════════════════════════════════════════════════════════════════════

@router.get("/pnl-tracker")
async def pnl_tracker():
    """Read all parsed signals, fetch current prices, calculate P&L."""
    cache_key = "cache:pnl-tracker"
    cached = rdb.get(cache_key)
    if cached:
        return json.loads(cached)

    members = rdb.zrange("signals:parsed", 0, -1, withscores=True)
    if not members:
        # Fallback: use main signals feed
        members = rdb.zrange(SIGNALS_FEED, 0, -1, withscores=True)

    results = []
    seen_tickers = set()

    for raw, score in members:
        try:
            sig = json.loads(raw)
        except json.JSONDecodeError:
            continue

        ticker = sig.get("ticker", "UNKNOWN")
        if ticker == "UNKNOWN" or ticker in seen_tickers:
            continue
        seen_tickers.add(ticker)

        # Determine the price at signal time
        price_at_mention = sig.get("entry_target") or sig.get("current_prices", {}).get(ticker)
        signal_date = sig.get("timestamp", "")

        # Fetch current price
        current_price = _get_current_price(ticker)
        if current_price is None:
            continue

        pnl_pct = None
        pnl_dollar = None
        if price_at_mention and price_at_mention > 0:
            pnl_pct = round(((current_price - price_at_mention) / price_at_mention) * 100, 2)
            pnl_dollar = round(current_price - price_at_mention, 2)

        results.append({
            "ticker": ticker,
            "source": sig.get("source", ""),
            "date_mentioned": signal_date,
            "price_at_mention": price_at_mention,
            "current_price": current_price,
            "pnl_pct": pnl_pct,
            "pnl_dollar": pnl_dollar,
            "thesis": sig.get("thesis", ""),
            "action": sig.get("action", "UNKNOWN"),
        })

    # Sort by P&L percentage descending (None values last)
    results.sort(key=lambda x: x["pnl_pct"] if x["pnl_pct"] is not None else -9999, reverse=True)

    response = {"signals": results, "count": len(results)}
    rdb.set(cache_key, json.dumps(response), ex=300)  # 5-min cache
    return response


# ══════════════════════════════════════════════════════════════════════════
#  THEMES: AI-powered thematic clustering
# ══════════════════════════════════════════════════════════════════════════

@router.get("/themes")
async def signal_themes():
    """Cluster all signal tickers into thematic baskets using Claude AI."""
    cache_key = "cache:signal-themes"
    cached = rdb.get(cache_key)
    if cached:
        return json.loads(cached)

    if not ANTHROPIC_AVAILABLE or not ANTHROPIC_KEY:
        raise HTTPException(500, "Anthropic API key not configured")

    # Gather all signals
    members = rdb.zrange("signals:parsed", 0, -1)
    if not members:
        members = rdb.zrange(SIGNALS_FEED, 0, -1)

    ticker_theses = {}
    for raw in members:
        try:
            sig = json.loads(raw)
        except json.JSONDecodeError:
            continue
        tickers = sig.get("tickers", [])
        if not tickers and sig.get("ticker", "UNKNOWN") != "UNKNOWN":
            tickers = [sig["ticker"]]
        for tk in tickers:
            if tk not in ticker_theses:
                ticker_theses[tk] = []
            ticker_theses[tk].append(sig.get("thesis", ""))

    if not ticker_theses:
        return {"themes": [], "count": 0}

    # Build summary for Claude
    summary_lines = []
    for tk, theses in ticker_theses.items():
        combined = "; ".join([t for t in theses if t][:3])
        summary_lines.append(f"{tk}: {combined}")
    summary_text = "\n".join(summary_lines)

    prompt = f"""Group these trading signals into thematic baskets. Each basket should have a name, description, and list of tickers.
Example themes: Photonics/CPO, Memory/DRAM, Social Media, AI Infrastructure, Short Squeeze plays, Semiconductors, Biotech, etc.

Return ONLY a JSON array with this structure (no markdown, no backticks):
[
  {{"name": "Theme Name", "description": "Brief description", "tickers": ["TICK1", "TICK2"]}}
]

SIGNALS:
{summary_text}

Return ONLY the JSON array, nothing else."""

    try:
        client = anthropic.Anthropic(api_key=ANTHROPIC_KEY)
        message = client.messages.create(
            model="claude-haiku-4-5-20251001",
            max_tokens=1500,
            messages=[{"role": "user", "content": prompt}],
        )
        response_text = message.content[0].text.strip()
        if response_text.startswith("```"):
            response_text = re.sub(r"^```(?:json)?\s*", "", response_text)
            response_text = re.sub(r"\s*```$", "", response_text)
        themes = json.loads(response_text)
    except Exception as e:
        raise HTTPException(500, f"Claude themes error: {e}")

    # Enrich with current prices
    for theme in themes:
        theme_tickers = theme.get("tickers", [])
        prices = {}
        for tk in theme_tickers:
            price = _get_current_price(tk)
            if price is not None:
                prices[tk] = price
        theme["current_prices"] = prices

    response = {"themes": themes, "count": len(themes)}
    rdb.set(cache_key, json.dumps(response), ex=300)  # 5-min cache
    return response


# ══════════════════════════════════════════════════════════════════════════
#  MORNING-BRIEF: AI-generated trading brief
# ══════════════════════════════════════════════════════════════════════════

@router.get("/morning-brief")
async def morning_brief():
    """Generate an AI morning trading brief from signals in the last 14 days."""
    cache_key = "cache:morning-brief"
    cached = rdb.get(cache_key)
    if cached:
        return json.loads(cached)

    if not ANTHROPIC_AVAILABLE or not ANTHROPIC_KEY:
        raise HTTPException(500, "Anthropic API key not configured")

    # Get signals from last 14 days
    cutoff = (datetime.now(timezone.utc) - timedelta(days=14)).timestamp()
    members = rdb.zrangebyscore("signals:parsed", cutoff, "+inf")
    if not members:
        members = rdb.zrangebyscore(SIGNALS_FEED, cutoff, "+inf")

    if not members:
        return {"brief": "No signals found in the last 14 days.", "signal_count": 0}

    signals_summary = []
    for raw in members:
        try:
            sig = json.loads(raw)
            ticker = sig.get("ticker", "UNKNOWN")
            if ticker == "UNKNOWN":
                continue
            signals_summary.append(
                f"- {ticker} ({sig.get('action', '?')}): {sig.get('thesis', 'N/A')} "
                f"[source: {sig.get('source', '?')}, entry: {sig.get('entry_target', 'N/A')}, "
                f"target: {sig.get('price_target', 'N/A')}]"
            )
        except json.JSONDecodeError:
            continue

    signals_text = "\n".join(signals_summary[:100])  # cap at 100

    prompt = f"""Create a concise morning trading brief from these signals. Highlight:
(1) Highest conviction plays and why
(2) Key catalysts this week
(3) Sector themes emerging
(4) Risk alerts

Format as a structured brief with clear sections using markdown headers.

SIGNALS FROM LAST 14 DAYS:
{signals_text}

Write the brief now:"""

    try:
        client = anthropic.Anthropic(api_key=ANTHROPIC_KEY)
        message = client.messages.create(
            model="claude-haiku-4-5-20251001",
            max_tokens=2000,
            messages=[{"role": "user", "content": prompt}],
        )
        brief_text = message.content[0].text.strip()
    except Exception as e:
        raise HTTPException(500, f"Claude morning brief error: {e}")

    response = {
        "brief": brief_text,
        "signal_count": len(signals_summary),
        "generated_at": _now_iso(),
    }
    rdb.set(cache_key, json.dumps(response), ex=300)  # 5-min cache
    return response


# ══════════════════════════════════════════════════════════════════════════
#  PORTFOLIO-OVERLAP: Cross-reference signals with portfolio positions
# ══════════════════════════════════════════════════════════════════════════

@router.get("/portfolio-overlap")
async def portfolio_overlap(account_key: Optional[str] = Query(None)):
    """Find tickers in both signals and portfolio positions."""
    cache_key = f"cache:portfolio-overlap:{account_key or 'all'}"
    cached = rdb.get(cache_key)
    if cached:
        return json.loads(cached)

    # Read signals tickers
    members = rdb.zrange("signals:parsed", 0, -1)
    if not members:
        members = rdb.zrange(SIGNALS_FEED, 0, -1)

    signal_map: Dict[str, Dict] = {}
    for raw in members:
        try:
            sig = json.loads(raw)
        except json.JSONDecodeError:
            continue
        tickers = sig.get("tickers", [])
        if not tickers and sig.get("ticker", "UNKNOWN") != "UNKNOWN":
            tickers = [sig["ticker"]]
        for tk in tickers:
            if tk not in signal_map:
                signal_map[tk] = sig

    # Read portfolio positions from CSV or Redis
    positions: Dict[str, Dict] = {}

    # Try Redis first (if cached from Fidelity upload)
    if account_key:
        redis_key = f"fidelity:positions:{account_key}"
        redis_positions = rdb.get(redis_key)
        if redis_positions:
            try:
                pos_list = json.loads(redis_positions)
                for p in pos_list:
                    sym = p.get("Symbol", p.get("symbol", "")).strip()
                    if sym:
                        positions[sym] = p
            except json.JSONDecodeError:
                pass

    # Fallback: read from CSV file
    if not positions:
        csv_path = os.path.join(
            os.path.dirname(os.path.dirname(__file__)),
            "data", "positions.csv"
        )
        if os.path.exists(csv_path):
            try:
                with open(csv_path, "r") as f:
                    reader = csv.DictReader(f)
                    for row in reader:
                        sym = row.get("Symbol", "").strip()
                        if not sym or sym in ("", "Pending Activity"):
                            continue
                        if account_key and row.get("Account Number", "") != account_key:
                            continue
                        positions[sym] = row
            except Exception:
                pass

    if not positions:
        return {"overlaps": [], "count": 0, "note": "No portfolio positions found"}

    # Find overlaps
    overlaps = []
    for ticker in set(signal_map.keys()) & set(positions.keys()):
        sig = signal_map[ticker]
        pos = positions[ticker]

        # Parse position data
        try:
            qty = float(str(pos.get("Quantity", "0")).replace(",", ""))
        except (ValueError, TypeError):
            qty = 0
        try:
            avg_cost = float(str(pos.get("Average Cost Basis", "0")).replace("$", "").replace(",", ""))
        except (ValueError, TypeError):
            avg_cost = 0

        current_price = _get_current_price(ticker)
        portfolio_pnl = None
        if current_price and avg_cost > 0:
            portfolio_pnl = round(((current_price - avg_cost) / avg_cost) * 100, 2)

        overlaps.append({
            "ticker": ticker,
            "signal_source": sig.get("source", ""),
            "signal_thesis": sig.get("thesis", ""),
            "signal_action": sig.get("action", "UNKNOWN"),
            "portfolio_qty": qty,
            "portfolio_avg_cost": avg_cost,
            "current_price": current_price,
            "portfolio_pnl": portfolio_pnl,
        })

    overlaps.sort(key=lambda x: abs(x["portfolio_pnl"] or 0), reverse=True)

    response = {"overlaps": overlaps, "count": len(overlaps)}
    rdb.set(cache_key, json.dumps(response), ex=300)  # 5-min cache
    return response


# ══════════════════════════════════════════════════════════════════════════
#  CONVICTION-SCORES: Quantified conviction ranking
# ══════════════════════════════════════════════════════════════════════════

@router.get("/conviction-scores")
async def conviction_scores():
    """Calculate conviction scores for all signal tickers based on multiple factors."""
    cache_key = "cache:conviction-scores"
    cached = rdb.get(cache_key)
    if cached:
        return json.loads(cached)

    members = rdb.zrange("signals:parsed", 0, -1, withscores=True)
    if not members:
        members = rdb.zrange(SIGNALS_FEED, 0, -1, withscores=True)

    # Aggregate per ticker
    ticker_data: Dict[str, Dict[str, Any]] = {}
    now_ts = datetime.now(timezone.utc).timestamp()

    for raw, score in members:
        try:
            sig = json.loads(raw)
        except json.JSONDecodeError:
            continue

        tickers = sig.get("tickers", [])
        if not tickers and sig.get("ticker", "UNKNOWN") != "UNKNOWN":
            tickers = [sig["ticker"]]

        for tk in tickers:
            if tk not in ticker_data:
                ticker_data[tk] = {
                    "mention_count": 0,
                    "sources": set(),
                    "has_entry": False,
                    "most_recent_ts": 0,
                    "theses": [],
                }
            td = ticker_data[tk]
            td["mention_count"] += 1
            td["sources"].add(sig.get("source", "unknown"))
            if sig.get("entry_target"):
                td["has_entry"] = True
            if score > td["most_recent_ts"]:
                td["most_recent_ts"] = score
            if sig.get("thesis"):
                td["theses"].append(sig["thesis"])

    if not ticker_data:
        return {"scores": [], "count": 0}

    max_mentions = max(td["mention_count"] for td in ticker_data.values()) or 1
    max_sources = max(len(td["sources"]) for td in ticker_data.values()) or 1

    results = []
    for tk, td in ticker_data.items():
        # Weighted scoring: mentions(40%), sources(30%), entry(20%), recency(10%)
        mention_score = (td["mention_count"] / max_mentions) * 40
        source_score = (len(td["sources"]) / max_sources) * 30
        entry_score = 20 if td["has_entry"] else 0

        # Recency: score higher if mentioned recently (within 7 days)
        days_since = (now_ts - td["most_recent_ts"]) / 86400
        recency_score = max(0, (1 - days_since / 30)) * 10

        conviction = round(mention_score + source_score + entry_score + recency_score, 1)
        conviction = min(100, conviction)

        # Determine most recent mention date
        most_recent_dt = datetime.fromtimestamp(td["most_recent_ts"], tz=timezone.utc).isoformat()

        # Pick the primary thesis (first non-empty)
        primary_thesis = next((t for t in td["theses"] if t), "")

        results.append({
            "ticker": tk,
            "conviction_score": conviction,
            "mention_count": td["mention_count"],
            "unique_sources": len(td["sources"]),
            "has_entry": td["has_entry"],
            "most_recent_mention": most_recent_dt,
            "primary_thesis": primary_thesis[:300],
        })

    results.sort(key=lambda x: x["conviction_score"], reverse=True)

    response = {"scores": results, "count": len(results)}
    rdb.set(cache_key, json.dumps(response), ex=300)  # 5-min cache
    return response


# ══════════════════════════════════════════════════════════════════════════
#  AUTO-ALERTS: Create price alerts from signal entry/target/stop
# ══════════════════════════════════════════════════════════════════════════

ALERTS_KEY = "alerts:rules"


@router.post("/auto-alerts")
async def auto_alerts():
    """Read signals with price levels and auto-create alerts."""
    members = rdb.zrange("signals:parsed", 0, -1)
    if not members:
        members = rdb.zrange(SIGNALS_FEED, 0, -1)

    created_alerts = []
    skipped = 0

    for raw in members:
        try:
            sig = json.loads(raw)
        except json.JSONDecodeError:
            continue

        ticker = sig.get("ticker", "UNKNOWN")
        if ticker == "UNKNOWN":
            continue

        entry = sig.get("entry_target")
        target = sig.get("price_target")
        stop = sig.get("stop_loss")

        auto_set_key = f"alerts:auto:{ticker}"

        # Create entry alert (price drops to entry zone)
        if entry and entry > 0:
            alert_id = f"auto-entry-{ticker}"
            if not rdb.sismember(auto_set_key, alert_id):
                alert_entry = {
                    "id": alert_id,
                    "ticker": ticker,
                    "condition": "below",
                    "price": entry,
                    "active": True,
                    "created": _now_iso(),
                    "source": "auto-signal",
                    "signal_id": sig.get("id", ""),
                    "label": f"Signal entry zone for {ticker}",
                }
                rdb.rpush(ALERTS_KEY, json.dumps(alert_entry))
                rdb.sadd(auto_set_key, alert_id)
                created_alerts.append(alert_entry)
            else:
                skipped += 1

        # Create target alert (price reaches target)
        if target and target > 0:
            alert_id = f"auto-target-{ticker}"
            if not rdb.sismember(auto_set_key, alert_id):
                alert_entry = {
                    "id": alert_id,
                    "ticker": ticker,
                    "condition": "above",
                    "price": target,
                    "active": True,
                    "created": _now_iso(),
                    "source": "auto-signal",
                    "signal_id": sig.get("id", ""),
                    "label": f"Signal target for {ticker}",
                }
                rdb.rpush(ALERTS_KEY, json.dumps(alert_entry))
                rdb.sadd(auto_set_key, alert_id)
                created_alerts.append(alert_entry)
            else:
                skipped += 1

        # Create stop-loss alert
        if stop and stop > 0:
            alert_id = f"auto-stop-{ticker}"
            if not rdb.sismember(auto_set_key, alert_id):
                alert_entry = {
                    "id": alert_id,
                    "ticker": ticker,
                    "condition": "below",
                    "price": stop,
                    "active": True,
                    "created": _now_iso(),
                    "source": "auto-signal",
                    "signal_id": sig.get("id", ""),
                    "label": f"Signal stop-loss for {ticker}",
                }
                rdb.rpush(ALERTS_KEY, json.dumps(alert_entry))
                rdb.sadd(auto_set_key, alert_id)
                created_alerts.append(alert_entry)
            else:
                skipped += 1

    return {
        "created": len(created_alerts),
        "skipped_duplicates": skipped,
        "alerts": created_alerts,
    }


# ══════════════════════════════════════════════════════════════════════════
#  EARNINGS-CROSSREF: Signals with upcoming earnings
# ══════════════════════════════════════════════════════════════════════════

@router.get("/earnings-crossref")
async def earnings_crossref():
    """Cross-reference signal tickers with upcoming earnings dates."""
    cache_key = "cache:earnings-crossref"
    cached = rdb.get(cache_key)
    if cached:
        return json.loads(cached)

    members = rdb.zrange("signals:parsed", 0, -1)
    if not members:
        members = rdb.zrange(SIGNALS_FEED, 0, -1)

    # Gather unique tickers
    ticker_signals: Dict[str, Dict] = {}
    for raw in members:
        try:
            sig = json.loads(raw)
        except json.JSONDecodeError:
            continue
        tickers = sig.get("tickers", [])
        if not tickers and sig.get("ticker", "UNKNOWN") != "UNKNOWN":
            tickers = [sig["ticker"]]
        for tk in tickers:
            if tk not in ticker_signals:
                ticker_signals[tk] = sig

    if not yf:
        raise HTTPException(500, "yfinance not available")

    results = []
    now = datetime.now(timezone.utc)
    cutoff = now + timedelta(days=30)

    for ticker, sig in ticker_signals.items():
        try:
            t = yf.Ticker(ticker)
            cal = t.calendar
            if cal is None or (isinstance(cal, dict) and not cal):
                continue

            # yfinance calendar can be a dict or DataFrame
            earnings_date = None
            estimated_eps = None

            if isinstance(cal, dict):
                # Newer yfinance returns dict
                ed = cal.get("Earnings Date")
                if isinstance(ed, list) and ed:
                    earnings_date = ed[0]
                elif ed:
                    earnings_date = ed
                estimated_eps = cal.get("Earnings Average") or cal.get("EPS Estimate")
            else:
                # Older versions may return DataFrame
                try:
                    if hasattr(cal, "loc"):
                        if "Earnings Date" in cal.index:
                            ed_val = cal.loc["Earnings Date"]
                            if hasattr(ed_val, "iloc"):
                                earnings_date = ed_val.iloc[0]
                            else:
                                earnings_date = ed_val
                except Exception:
                    pass

            if earnings_date is None:
                continue

            # Normalize earnings_date to datetime
            if isinstance(earnings_date, str):
                try:
                    earnings_dt = datetime.fromisoformat(earnings_date.replace("Z", "+00:00"))
                except ValueError:
                    continue
            elif hasattr(earnings_date, "timestamp"):
                earnings_dt = earnings_date
                if earnings_dt.tzinfo is None:
                    earnings_dt = earnings_dt.replace(tzinfo=timezone.utc)
            else:
                continue

            # Only include earnings within the next 30 days
            if hasattr(earnings_dt, "timestamp"):
                if earnings_dt > cutoff or earnings_dt < now - timedelta(days=1):
                    continue
                days_until = (earnings_dt - now).days
                earnings_iso = earnings_dt.isoformat()
            else:
                continue

            results.append({
                "ticker": ticker,
                "signal_source": sig.get("source", ""),
                "signal_thesis": sig.get("thesis", ""),
                "earnings_date": earnings_iso,
                "days_until_earnings": days_until,
                "estimated_eps": estimated_eps,
                "signal_action": sig.get("action", "UNKNOWN"),
            })
        except Exception:
            continue

    results.sort(key=lambda x: x["days_until_earnings"])

    response = {"earnings_signals": results, "count": len(results)}
    rdb.set(cache_key, json.dumps(response), ex=300)  # 5-min cache
    return response


# ══════════════════════════════════════════════════════════════════════════
#  SECTOR-HEATMAP: Sector performance heatmap from signals
# ══════════════════════════════════════════════════════════════════════════

@router.get("/sector-heatmap")
async def sector_heatmap():
    """Group signal tickers by sector with daily performance for heatmap display."""
    cache_key = "cache:sector-heatmap"
    cached = rdb.get(cache_key)
    if cached:
        return json.loads(cached)

    members = rdb.zrange("signals:parsed", 0, -1)
    if not members:
        members = rdb.zrange(SIGNALS_FEED, 0, -1)

    # Gather unique tickers
    all_tickers = set()
    for raw in members:
        try:
            sig = json.loads(raw)
        except json.JSONDecodeError:
            continue
        tickers = sig.get("tickers", [])
        if not tickers and sig.get("ticker", "UNKNOWN") != "UNKNOWN":
            tickers = [sig["ticker"]]
        all_tickers.update(tickers)
    all_tickers.discard("UNKNOWN")

    if not yf or not all_tickers:
        return {"sectors": [], "count": 0}

    # Fetch sector info and daily performance
    sectors: Dict[str, List[Dict]] = {}
    for ticker in list(all_tickers)[:60]:  # cap to avoid too many API calls
        try:
            t = yf.Ticker(ticker)
            info = t.info or {}
            sector = info.get("sector", "Unknown")
            industry = info.get("industry", "Unknown")

            hist = t.history(period="2d")
            daily_change_pct = 0.0
            current_price = None
            if len(hist) >= 2:
                prev_close = float(hist["Close"].iloc[-2])
                curr_close = float(hist["Close"].iloc[-1])
                if prev_close > 0:
                    daily_change_pct = round(((curr_close - prev_close) / prev_close) * 100, 2)
                current_price = round(curr_close, 2)
            elif len(hist) == 1:
                current_price = round(float(hist["Close"].iloc[-1]), 2)

            ticker_info = {
                "ticker": ticker,
                "industry": industry,
                "daily_change_pct": daily_change_pct,
                "current_price": current_price,
            }

            if sector not in sectors:
                sectors[sector] = []
            sectors[sector].append(ticker_info)
        except Exception:
            continue

    # Build sector aggregates
    sector_list = []
    for sector_name, tickers_data in sectors.items():
        changes = [t["daily_change_pct"] for t in tickers_data if t["daily_change_pct"] is not None]
        avg_change = round(sum(changes) / len(changes), 2) if changes else 0
        sector_list.append({
            "sector": sector_name,
            "ticker_count": len(tickers_data),
            "avg_daily_change_pct": avg_change,
            "tickers": tickers_data,
        })

    sector_list.sort(key=lambda x: x["avg_daily_change_pct"], reverse=True)

    response = {"sectors": sector_list, "count": len(sector_list)}
    rdb.set(cache_key, json.dumps(response), ex=300)  # 5-min cache
    return response


# ══════════════════════════════════════════════════════════════════════════
#  DARKPOOL-INSIDER: Insider trading & institutional data for signal tickers
# ══════════════════════════════════════════════════════════════════════════

@router.get("/darkpool-insider")
async def darkpool_insider():
    """Fetch insider trading and institutional holdings for all signal tickers."""
    cache_key = "cache:darkpool-insider"
    cached = rdb.get(cache_key)
    if cached:
        return json.loads(cached)

    members = rdb.zrange("signals:parsed", 0, -1)
    if not members:
        members = rdb.zrange(SIGNALS_FEED, 0, -1)

    # Gather unique tickers with their signal info
    ticker_signals: Dict[str, Dict] = {}
    for raw in members:
        try:
            sig = json.loads(raw)
        except json.JSONDecodeError:
            continue
        tickers = sig.get("tickers", [])
        if not tickers and sig.get("ticker", "UNKNOWN") != "UNKNOWN":
            tickers = [sig["ticker"]]
        for tk in tickers:
            if tk not in ticker_signals:
                ticker_signals[tk] = sig

    if not yf or not ticker_signals:
        return {"insider_data": [], "count": 0}

    results = []
    now = datetime.now(timezone.utc)
    ninety_days_ago = now - timedelta(days=90)

    for ticker, sig in list(ticker_signals.items())[:40]:  # cap API calls
        try:
            t = yf.Ticker(ticker)

            # Insider transactions
            insider_buys_90d = 0
            insider_sells_90d = 0
            try:
                insider_tx = t.insider_transactions
                if insider_tx is not None and not insider_tx.empty:
                    for _, row in insider_tx.iterrows():
                        tx_date = row.get("Start Date") or row.get("Date")
                        if tx_date is not None:
                            if hasattr(tx_date, "timestamp"):
                                if tx_date.tzinfo is None:
                                    tx_date = tx_date.tz_localize("UTC")
                                if tx_date >= ninety_days_ago:
                                    tx_text = str(row.get("Transaction", "") or row.get("Text", "")).lower()
                                    shares = row.get("Shares", 0) or 0
                                    if "purchase" in tx_text or "buy" in tx_text or (isinstance(shares, (int, float)) and shares > 0):
                                        insider_buys_90d += 1
                                    elif "sale" in tx_text or "sell" in tx_text:
                                        insider_sells_90d += 1
            except Exception:
                pass

            # Institutional holders
            institutional_holders_count = 0
            top_institutions = []
            try:
                inst = t.institutional_holders
                if inst is not None and not inst.empty:
                    institutional_holders_count = len(inst)
                    for _, row in inst.head(5).iterrows():
                        holder_name = str(row.get("Holder", "Unknown"))
                        shares = row.get("Shares", 0)
                        pct = row.get("pctHeld") or row.get("% Out")
                        top_institutions.append({
                            "holder": holder_name,
                            "shares": int(shares) if shares else 0,
                            "pct_held": round(float(pct) * 100, 2) if pct else None,
                        })
            except Exception:
                pass

            insider_net = insider_buys_90d - insider_sells_90d

            results.append({
                "ticker": ticker,
                "signal_source": sig.get("source", ""),
                "signal_thesis": sig.get("thesis", ""),
                "insider_buys_90d": insider_buys_90d,
                "insider_sells_90d": insider_sells_90d,
                "insider_net": insider_net,
                "institutional_holders_count": institutional_holders_count,
                "top_institutions": top_institutions,
            })
        except Exception:
            continue

    results.sort(key=lambda x: x["insider_net"], reverse=True)

    response = {"insider_data": results, "count": len(results)}
    rdb.set(cache_key, json.dumps(response), ex=300)  # 5-min cache
    return response


# ══════════════════════════════════════════════════════════════════════════
#  DYNAMIC ROUTES (must come after all static routes to avoid conflicts)
# ══════════════════════════════════════════════════════════════════════════

@router.get("/{signal_id}")
async def get_signal(signal_id: str):
    """Get a single signal by ID."""
    sig, _ = _signal_from_redis(signal_id)
    if not sig:
        raise HTTPException(404, "Signal not found")
    return sig


@router.patch("/{signal_id}")
async def patch_signal(signal_id: str, update: SignalPatch):
    """Update signal status or metadata."""
    members = rdb.zrange(SIGNALS_FEED, 0, -1, withscores=True)
    for raw, score in members:
        sig = json.loads(raw)
        if sig.get("id") == signal_id:
            if update.status is not None:
                sig["status"] = update.status
            if update.action is not None:
                sig["action"] = update.action
            if update.confidence is not None:
                sig["confidence"] = update.confidence
            if update.notes is not None:
                sig["notes"] = update.notes
            rdb.zrem(SIGNALS_FEED, raw)
            rdb.zadd(SIGNALS_FEED, {json.dumps(sig): score})
            return sig
    raise HTTPException(404, "Signal not found")


@router.delete("/{signal_id}")
async def delete_signal(signal_id: str):
    """Remove a signal."""
    members = rdb.zrange(SIGNALS_FEED, 0, -1)
    for raw in members:
        sig = json.loads(raw)
        if sig.get("id") == signal_id:
            rdb.zrem(SIGNALS_FEED, raw)
            return {"deleted": signal_id}
    raise HTTPException(404, "Signal not found")


# ══════════════════════════════════════════════════════════════════════════
#  10. BACKGROUND AUTO-POLL
# ══════════════════════════════════════════════════════════════════════════

_poll_task = None


async def _auto_poll_loop():
    """Background task: poll all configured sources every 5 minutes."""
    while True:
        try:
            # Poll Twitter sources
            sources = rdb.hgetall(SIGNALS_SOURCES)
            for sid, val in sources.items():
                src = json.loads(val)
                if src.get("type") == "twitter":
                    handle = src.get("handle", "")
                    if handle:
                        try:
                            await poll_twitter_handle(handle)
                        except Exception:
                            pass

            # Poll Discord
            if DISCORD_BOT_TOKEN and MISPRICED_ASSETS_CHANNEL_ID:
                try:
                    await poll_discord()
                except Exception:
                    pass

        except Exception:
            pass

        await asyncio.sleep(300)  # 5 minutes


def start_auto_poll():
    """Call this after app startup to begin background polling."""
    global _poll_task
    # Seed default sources if none exist
    existing = rdb.hgetall(SIGNALS_SOURCES)
    has_serenity = any(
        json.loads(v).get("handle") == "aleabitoreddit"
        for v in existing.values()
    )
    if not has_serenity:
        sid = uuid.uuid4().hex[:8]
        rdb.hset(SIGNALS_SOURCES, sid, json.dumps({
            "type": "twitter",
            "handle": "aleabitoreddit",
            "channel_id": None,
            "added": _now_iso(),
        }))
    if _poll_task is None:
        _poll_task = asyncio.create_task(_auto_poll_loop())


def stop_auto_poll():
    """Call on shutdown to cancel background polling."""
    global _poll_task
    if _poll_task:
        _poll_task.cancel()
        _poll_task = None
