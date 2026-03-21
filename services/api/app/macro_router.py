"""
Macro Router — War/Macro Command Center
Oil, VIX, Treasuries, DXY, Sector Rotation, AI War Impact Analysis
"""

from fastapi import APIRouter
from datetime import datetime, timezone
import json, os, traceback

router = APIRouter(prefix="/macro", tags=["macro"])

try:
    import yfinance as yf
except ImportError:
    yf = None

try:
    import anthropic
    ANTHROPIC_AVAILABLE = True
except ImportError:
    anthropic = None
    ANTHROPIC_AVAILABLE = False

import redis

REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379")
ANTHROPIC_KEY = os.getenv("ANTHROPIC_API_KEY", "")
rdb = redis.from_url(REDIS_URL, decode_responses=True)

CACHE_KEY = "cache:war-dashboard"
CACHE_TTL = 60

SECTOR_ETFS = {
    "Energy": "XLE", "Financials": "XLF", "Technology": "XLK",
    "Healthcare": "XLV", "Industrials": "XLI", "Materials": "XLB",
    "Utilities": "XLU", "Real Estate": "XLRE", "Comm Svcs": "XLC",
    "Cons Disc": "XLY", "Cons Stap": "XLP",
}

MACRO_SYMBOLS = {
    "brent": "BZ=F", "wti": "CL=F", "vix": "^VIX",
    "tnx": "^TNX", "tyx": "^TYX", "irx": "^IRX",
    "dxy": "DX-Y.NYB", "gold": "GC=F", "natgas": "NG=F",
    "spy": "SPY", "qqq": "QQQ",
}


def _safe_quote(symbol: str) -> dict:
    """Fetch a single yfinance quote safely."""
    if not yf:
        return {}
    try:
        t = yf.Ticker(symbol)
        info = t.fast_info if hasattr(t, "fast_info") else {}
        hist = t.history(period="5d")
        if hist.empty:
            return {}
        last = float(hist["Close"].iloc[-1])
        prev = float(hist["Close"].iloc[-2]) if len(hist) > 1 else last
        change = last - prev
        change_pct = (change / prev * 100) if prev else 0
        week_ago = float(hist["Close"].iloc[0]) if len(hist) >= 5 else prev
        week_change_pct = ((last - week_ago) / week_ago * 100) if week_ago else 0
        return {
            "price": round(last, 2),
            "change": round(change, 2),
            "change_pct": round(change_pct, 2),
            "week_change_pct": round(week_change_pct, 2),
            "prev_close": round(prev, 2),
        }
    except Exception:
        return {}


def _vix_percentile() -> dict:
    """Get VIX with 1-year percentile rank."""
    if not yf:
        return {}
    try:
        t = yf.Ticker("^VIX")
        hist = t.history(period="1y")
        if hist.empty:
            return {}
        current = float(hist["Close"].iloc[-1])
        values = sorted(hist["Close"].tolist())
        rank = sum(1 for v in values if v <= current) / len(values) * 100
        return {
            "current": round(current, 2),
            "percentile": round(rank, 1),
            "year_low": round(min(values), 2),
            "year_high": round(max(values), 2),
            "level": "EXTREME" if current > 30 else "ELEVATED" if current > 20 else "NORMAL" if current > 15 else "LOW",
        }
    except Exception:
        return {}


@router.get("/war-dashboard")
async def war_dashboard():
    """Full macro war dashboard with oil, VIX, yields, sectors, AI impact."""
    cached = rdb.get(CACHE_KEY)
    if cached:
        return json.loads(cached)

    # Oil
    oil = {
        "brent": _safe_quote("BZ=F"),
        "wti": _safe_quote("CL=F"),
        "natgas": _safe_quote("NG=F"),
    }

    # VIX with percentile
    vix = _vix_percentile()

    # Treasuries
    tnx = _safe_quote("^TNX")
    tyx = _safe_quote("^TYX")
    irx = _safe_quote("^IRX")
    spread_2s10s = None
    if tnx.get("price") and irx.get("price"):
        spread_2s10s = round(tnx["price"] - irx["price"], 2)

    treasuries = {
        "10y": tnx, "30y": tyx, "3m": irx,
        "spread_2s10s": spread_2s10s,
        "curve": "INVERTED" if spread_2s10s and spread_2s10s < 0 else "STEEP" if spread_2s10s and spread_2s10s > 1 else "FLAT",
    }

    # Dollar index
    dxy = _safe_quote("DX-Y.NYB")

    # Gold
    gold = _safe_quote("GC=F")

    # Sector rotation
    sectors = {}
    for name, sym in SECTOR_ETFS.items():
        q = _safe_quote(sym)
        if q:
            sectors[name] = q

    # Market indices
    indices = {
        "SPY": _safe_quote("SPY"),
        "QQQ": _safe_quote("QQQ"),
    }

    # Fear & Greed composite
    vix_val = vix.get("current", 20)
    spy_data = indices.get("SPY", {})
    spy_week = spy_data.get("week_change_pct", 0)
    fg_score = max(0, min(100, int(50 - (vix_val - 20) * 3 + spy_week * 5)))
    fear_greed = {
        "score": fg_score,
        "label": "EXTREME FEAR" if fg_score < 20 else "FEAR" if fg_score < 40 else "NEUTRAL" if fg_score < 60 else "GREED" if fg_score < 80 else "EXTREME GREED",
        "components": {"vix": vix_val, "spy_momentum": spy_week},
    }

    # AI war impact on positions (if Fidelity data exists)
    war_impact = []
    try:
        import pathlib
        csv_path = pathlib.Path(__file__).parent / "positions.csv"
        if not csv_path.exists():
            csv_path = pathlib.Path(__file__).parent.parent / "positions.csv"
        if csv_path.exists():
            import csv as csvmod
            tickers = []
            with open(csv_path) as f:
                reader = csvmod.DictReader(f)
                for row in reader:
                    sym = row.get("Symbol", "").strip()
                    if sym and sym != "Cash" and not sym.startswith("-"):
                        tickers.append(sym)
            tickers = list(set(tickers))[:20]

            if tickers and ANTHROPIC_AVAILABLE and ANTHROPIC_KEY:
                client = anthropic.Anthropic(api_key=ANTHROPIC_KEY)
                oil_price = oil.get("brent", {}).get("price", "N/A")
                vix_price = vix.get("current", "N/A")
                prompt = f"""Current macro: Brent oil ${oil_price}, VIX {vix_price}, 10Y yield {tnx.get('price','N/A')}%.
Strait of Hormuz disruption ongoing. Rate cuts delayed.

For each ticker below, give a JSON array with objects containing:
- "ticker": string
- "oil_exposure": 1-10 (how much high oil hurts this stock)
- "rate_sensitivity": 1-10 (how much high rates hurt)
- "war_risk": 1-10 (overall geopolitical risk)
- "assessment": one sentence
- "category": "insulated" | "moderate" | "exposed"

Tickers: {', '.join(tickers)}

Return ONLY valid JSON array, no markdown."""

                msg = client.messages.create(
                    model="claude-sonnet-4-20250514",
                    max_tokens=2000,
                    messages=[{"role": "user", "content": prompt}],
                )
                text = msg.content[0].text.strip()
                if text.startswith("["):
                    war_impact = json.loads(text)
    except Exception as e:
        war_impact = [{"error": str(e)}]

    result = {
        "oil": oil,
        "vix": vix,
        "treasuries": treasuries,
        "dxy": dxy,
        "gold": gold,
        "sectors": sectors,
        "indices": indices,
        "fear_greed": fear_greed,
        "war_impact": war_impact,
        "updated_at": datetime.now(timezone.utc).isoformat(),
    }

    rdb.setex(CACHE_KEY, CACHE_TTL, json.dumps(result))
    return result
