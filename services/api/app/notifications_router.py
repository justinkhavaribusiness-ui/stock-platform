"""
Notifications Router — Discord Webhooks, Browser Push, Alert Monitoring,
AI Thesis Vault, Auto Morning Briefing
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from datetime import datetime, timezone
import json, os, uuid, traceback

import redis, httpx

REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379")
rdb = redis.from_url(REDIS_URL, decode_responses=True)

router = APIRouter(tags=["notifications"])

def _make_id(): return str(uuid.uuid4())[:8]
def _now(): return datetime.now(timezone.utc).isoformat()


# ═══════════════════════════════════════════════════════════════════════
#  DISCORD WEBHOOK SYSTEM
# ═══════════════════════════════════════════════════════════════════════
DISCORD_WEBHOOK_KEY = "discord:webhook_url"
DISCORD_HISTORY_KEY = "discord:sent_history"

class DiscordConfig(BaseModel):
    webhook_url: str

@router.get("/discord/config")
async def get_discord_config():
    url = rdb.get(DISCORD_WEBHOOK_KEY) or ""
    return {"configured": bool(url), "url": url[:30] + "..." if url else ""}

@router.post("/discord/config")
async def set_discord_config(config: DiscordConfig):
    rdb.set(DISCORD_WEBHOOK_KEY, config.webhook_url)
    # Send test message
    try:
        async with httpx.AsyncClient() as client:
            await client.post(config.webhook_url, json={
                "embeds": [{
                    "title": "Stock Terminal Connected",
                    "description": "Price alerts, market intel, and morning briefings will be sent here.",
                    "color": 0x22c55e,
                    "footer": {"text": "Stock Terminal v5.2"},
                }]
            })
        return {"status": "ok", "message": "Discord webhook configured and test message sent"}
    except Exception as e:
        return {"status": "error", "message": str(e)}

async def _send_discord(embed: dict):
    """Send an embed to Discord webhook."""
    url = rdb.get(DISCORD_WEBHOOK_KEY)
    if not url:
        return False
    try:
        async with httpx.AsyncClient() as client:
            r = await client.post(url, json={"embeds": [embed]})
            # Log to history
            rdb.rpush(DISCORD_HISTORY_KEY, json.dumps({
                "title": embed.get("title", ""),
                "timestamp": _now(),
                "status": r.status_code,
            }))
            rdb.ltrim(DISCORD_HISTORY_KEY, -100, -1)
            return r.status_code == 204
    except Exception:
        return False

@router.get("/discord/history")
async def discord_history():
    items = [json.loads(r) for r in rdb.lrange(DISCORD_HISTORY_KEY, 0, -1)]
    return {"messages": items[-20:], "total": len(items)}


# ═══════════════════════════════════════════════════════════════════════
#  ALERT MONITOR — CHECK PRICES AND FIRE NOTIFICATIONS
# ═══════════════════════════════════════════════════════════════════════

@router.post("/alerts/check-and-notify")
async def check_and_notify():
    """Check all price alerts, fire Discord notifications for any that triggered."""
    alerts_raw = rdb.lrange("price-alerts:list", 0, -1)
    if not alerts_raw:
        return {"checked": 0, "triggered": 0}

    alerts = [json.loads(r) for r in alerts_raw]

    try:
        import yfinance as yf
        tickers = list({a["ticker"] for a in alerts})
        prices = {}
        if tickers:
            data = yf.download(tickers, period="1d", progress=False, auto_adjust=True)
            for tk in tickers:
                try:
                    if len(tickers) == 1:
                        prices[tk] = float(data["Close"].iloc[-1])
                    else:
                        prices[tk] = float(data["Close"][tk].iloc[-1])
                except Exception:
                    pass
    except Exception:
        return {"checked": 0, "triggered": 0, "error": "yfinance failed"}

    triggered = []
    for i, a in enumerate(alerts):
        price = prices.get(a["ticker"])
        if not price:
            continue

        was_triggered = a.get("triggered", False)
        now_triggered = False

        if a["condition"] == "below" and price <= a["target"]:
            now_triggered = True
        elif a["condition"] == "above" and price >= a["target"]:
            now_triggered = True

        # Only notify on NEW triggers (not already triggered)
        if now_triggered and not was_triggered:
            triggered.append(a)
            a["triggered"] = True
            a["triggered_at"] = _now()
            a["triggered_price"] = round(price, 2)
            rdb.lset("price-alerts:list", i, json.dumps(a))

            # Send Discord notification
            color = 0x22c55e if a["condition"] == "below" else 0xf59e0b
            await _send_discord({
                "title": f"PRICE ALERT: {a['ticker']} {'dropped to' if a['condition'] == 'below' else 'hit'} ${price:.2f}",
                "description": f"Target: ${a['target']} ({a['condition']})\n{a.get('notes', '')}",
                "color": color,
                "fields": [
                    {"name": "Current Price", "value": f"${price:.2f}", "inline": True},
                    {"name": "Target", "value": f"${a['target']}", "inline": True},
                ],
                "footer": {"text": f"Stock Terminal | {datetime.now().strftime('%I:%M %p')}"},
            })

            # Also store as notification in the notification system
            rdb.rpush("notifications:list", json.dumps({
                "id": _make_id(),
                "type": "price_alert",
                "title": f"{a['ticker']} hit ${price:.2f}",
                "message": a.get("notes", ""),
                "read": False,
                "timestamp": _now(),
            }))

    return {"checked": len(alerts), "triggered": len(triggered), "alerts": [a["ticker"] for a in triggered]}


# ═══════════════════════════════════════════════════════════════════════
#  AI THESIS VAULT — STORE DEEP DIVE ANALYSES PER TICKER
# ═══════════════════════════════════════════════════════════════════════
THESIS_VAULT_KEY = "thesis-vault:entries"

class ThesisEntry(BaseModel):
    ticker: str
    thesis: str
    conviction: str = "medium"  # high/medium/low
    cohr_score: int = 0  # 1-7
    entry_zone: str = ""
    target: str = ""
    stop: str = ""
    catalysts: str = ""
    risks: str = ""
    category: str = "thesis"  # thesis/wheel/income/speculative

@router.get("/thesis-vault")
async def get_thesis_vault():
    entries = [json.loads(r) for r in rdb.lrange(THESIS_VAULT_KEY, 0, -1)]
    return {"entries": entries}

@router.get("/thesis-vault/{ticker}")
async def get_thesis_for_ticker(ticker: str):
    entries = [json.loads(r) for r in rdb.lrange(THESIS_VAULT_KEY, 0, -1)]
    matches = [e for e in entries if e.get("ticker", "").upper() == ticker.upper()]
    return {"ticker": ticker.upper(), "entries": matches}

@router.post("/thesis-vault")
async def add_thesis(entry: ThesisEntry):
    item = {
        "id": _make_id(),
        "ticker": entry.ticker.upper(),
        "thesis": entry.thesis,
        "conviction": entry.conviction,
        "cohr_score": entry.cohr_score,
        "entry_zone": entry.entry_zone,
        "target": entry.target,
        "stop": entry.stop,
        "catalysts": entry.catalysts,
        "risks": entry.risks,
        "category": entry.category,
        "created": _now(),
        "updated": _now(),
    }
    rdb.rpush(THESIS_VAULT_KEY, json.dumps(item))
    return item

@router.put("/thesis-vault/{thesis_id}")
async def update_thesis(thesis_id: str, updates: dict):
    raw = rdb.lrange(THESIS_VAULT_KEY, 0, -1)
    for i, r in enumerate(raw):
        item = json.loads(r)
        if item.get("id") == thesis_id:
            item.update({k: v for k, v in updates.items() if v is not None and k != "id"})
            item["updated"] = _now()
            rdb.lset(THESIS_VAULT_KEY, i, json.dumps(item))
            return item
    raise HTTPException(404, "Thesis not found")

@router.delete("/thesis-vault/{thesis_id}")
async def delete_thesis(thesis_id: str):
    raw = rdb.lrange(THESIS_VAULT_KEY, 0, -1)
    for r in raw:
        item = json.loads(r)
        if item.get("id") == thesis_id:
            rdb.lrem(THESIS_VAULT_KEY, 1, r)
            return {"deleted": thesis_id}
    raise HTTPException(404, "Thesis not found")


# ═══════════════════════════════════════════════════════════════════════
#  MORNING BRIEFING TO DISCORD
# ═══════════════════════════════════════════════════════════════════════

@router.post("/discord/morning-briefing")
async def send_morning_briefing():
    """Generate and send morning market briefing to Discord."""
    try:
        import anthropic
        import yfinance as yf
    except ImportError:
        raise HTTPException(500, "Dependencies not available")

    # Get API key
    key = os.getenv("ANTHROPIC_API_KEY", "")
    if not key:
        env_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), ".env")
        if os.path.exists(env_path):
            with open(env_path) as f:
                for line in f:
                    if line.strip().startswith("ANTHROPIC_API_KEY="):
                        key = line.strip().split("=", 1)[1]

    if not key:
        raise HTTPException(500, "Anthropic API key not configured")

    # Gather data
    def safe_price(sym):
        try:
            h = yf.Ticker(sym).history(period="2d")
            if h.empty: return "N/A"
            last = float(h["Close"].iloc[-1])
            prev = float(h["Close"].iloc[-2]) if len(h) > 1 else last
            chg = round((last - prev) / prev * 100, 2)
            return f"${last:.2f} ({'+' if chg >= 0 else ''}{chg}%)"
        except Exception:
            return "N/A"

    spy = safe_price("SPY")
    qqq = safe_price("QQQ")
    oil = safe_price("BZ=F")
    vix = safe_price("^VIX")
    tnx = safe_price("^TNX")
    gold = safe_price("GC=F")

    # Portfolio tickers
    portfolio = []
    import pathlib, csv
    csv_path = pathlib.Path(__file__).parent.parent / "data" / "positions.csv"
    if csv_path.exists():
        with open(csv_path) as f:
            reader = csv.DictReader(f)
            for row in reader:
                sym = (row.get("Symbol") or "").strip()
                if sym and "SPAXX" not in sym and sym != "Cash" and not sym.startswith("-"):
                    portfolio.append(sym)

    # Get alerts
    alerts = [json.loads(r) for r in rdb.lrange("price-alerts:list", 0, -1)]
    alert_text = "\n".join([f"  {a['ticker']} {a['condition']} ${a['target']}: {a.get('notes','')}" for a in alerts[:10]])

    context = f"""Pre-market data:
SPY: {spy} | QQQ: {qqq} | Brent Oil: {oil} | VIX: {vix} | 10Y: {tnx} | Gold: {gold}

Portfolio: {', '.join(portfolio[:20])}

Active price alerts:
{alert_text}

Today's date: {datetime.now().strftime('%A, %B %d, %Y')}
"""

    client = anthropic.Anthropic(api_key=key)
    msg = client.messages.create(
        model="claude-sonnet-4-20250514",
        max_tokens=1500,
        system="You are a morning market briefing analyst. Give a concise pre-market briefing covering: 1) overnight moves and why, 2) key events today (earnings, Fed, geopolitical), 3) what matters for the trader's portfolio specifically, 4) 2-3 specific trade ideas for today. Be direct, no fluff. Max 300 words.",
        messages=[{"role": "user", "content": context}],
    )
    briefing = msg.content[0].text.strip()

    # Send to Discord as rich embed
    sections = briefing.split("\n\n")
    description = briefing[:2000]

    sent = await _send_discord({
        "title": f"Morning Briefing — {datetime.now().strftime('%A %b %d')}",
        "description": description,
        "color": 0x3b82f6,
        "fields": [
            {"name": "SPY", "value": spy, "inline": True},
            {"name": "Oil", "value": oil, "inline": True},
            {"name": "VIX", "value": vix, "inline": True},
        ],
        "footer": {"text": "Stock Terminal v5.2 | AI-Powered"},
    })

    # Also store as notification
    rdb.rpush("notifications:list", json.dumps({
        "id": _make_id(),
        "type": "morning_briefing",
        "title": f"Morning Briefing — {datetime.now().strftime('%b %d')}",
        "message": briefing[:200] + "...",
        "read": False,
        "timestamp": _now(),
    }))

    return {"status": "sent" if sent else "discord_not_configured", "briefing": briefing}


# ═══════════════════════════════════════════════════════════════════════
#  MARKET INTEL THREAT CHANGE — NOTIFY ON ESCALATION
# ═══════════════════════════════════════════════════════════════════════

@router.post("/discord/threat-change")
async def notify_threat_change(body: dict):
    """Send Discord alert when threat level changes."""
    level = body.get("level", "unknown")
    headline = body.get("headline", "")

    color_map = {"critical": 0xef4444, "elevated": 0xf59e0b, "normal": 0x22c55e}
    emoji_map = {"critical": "🔴", "elevated": "🟡", "normal": "🟢"}

    sent = await _send_discord({
        "title": f"{emoji_map.get(level, '⚪')} THREAT LEVEL: {level.upper()}",
        "description": headline,
        "color": color_map.get(level, 0x6b7280),
        "footer": {"text": f"Stock Terminal | {datetime.now().strftime('%I:%M %p')}"},
    })

    return {"sent": sent}
