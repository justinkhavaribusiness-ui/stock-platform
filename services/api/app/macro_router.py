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


# ═══════════════════════════════════════════════════════════════════════
#  CEASEFIRE / WAR PROBABILITY DASHBOARD — Real data driven
# ═══════════════════════════════════════════════════════════════════════
CEASEFIRE_CACHE_KEY = "cache:ceasefire-prob"
CEASEFIRE_CACHE_TTL = 300  # 5 min

@router.get("/ceasefire-probability")
async def ceasefire_probability():
    """War scenario probabilities derived from real oil, energy, VIX, and yield data."""
    cached = rdb.get(CEASEFIRE_CACHE_KEY)
    if cached:
        return json.loads(cached)

    # Fetch real market data
    brent = _safe_quote("BZ=F")
    wti = _safe_quote("CL=F")
    natgas = _safe_quote("NG=F")
    vix_data = _vix_percentile()
    gold = _safe_quote("GC=F")
    tnx = _safe_quote("^TNX")
    dxy = _safe_quote("DX-Y.NYB")
    spy = _safe_quote("SPY")
    xle = _safe_quote("XLE")  # Energy sector
    xlu = _safe_quote("XLU")  # Utilities
    uso = _safe_quote("USO")  # US Oil Fund

    brent_price = brent.get("price", 0)
    brent_week_chg = brent.get("week_change_pct", 0)
    vix_level = vix_data.get("current", 20)
    vix_pctile = vix_data.get("percentile", 50)
    gold_price = gold.get("price", 0)
    gold_week = gold.get("week_change_pct", 0)
    ten_y = tnx.get("price", 0)
    spy_week = spy.get("week_change_pct", 0)

    # ── Derive probabilities from market signals ──
    # Oil price level is the primary signal
    # >$110 = war premium high, <$80 = ceasefire priced in
    oil_war_signal = min(100, max(0, (brent_price - 70) * 2.5)) if brent_price else 50

    # Oil momentum: rising = escalation, falling = de-escalation
    oil_momentum = 50
    if brent_week_chg > 5:
        oil_momentum = 80  # rising fast = escalation
    elif brent_week_chg > 2:
        oil_momentum = 65
    elif brent_week_chg < -5:
        oil_momentum = 20  # falling fast = ceasefire signal
    elif brent_week_chg < -2:
        oil_momentum = 35

    # VIX signal: >25 = fear, >30 = panic
    vix_fear = min(100, max(0, (vix_level - 15) * 5))

    # Gold as safe haven: rising gold = fear, falling = risk-on
    gold_signal = 50
    if gold_week > 3:
        gold_signal = 75
    elif gold_week < -2:
        gold_signal = 25

    # Yield signal: rising yields = inflation fear (war persists)
    yield_signal = min(100, max(0, (ten_y - 3.5) * 30)) if ten_y else 50

    # Composite war intensity score (0-100, higher = more war)
    war_intensity = int(
        oil_war_signal * 0.35 +
        oil_momentum * 0.25 +
        vix_fear * 0.15 +
        gold_signal * 0.15 +
        yield_signal * 0.10
    )

    # Derive scenario probabilities
    if war_intensity > 75:
        ceasefire_pct = 10
        prolonged_pct = 40
        escalation_pct = 50
    elif war_intensity > 60:
        ceasefire_pct = 20
        prolonged_pct = 50
        escalation_pct = 30
    elif war_intensity > 45:
        ceasefire_pct = 35
        prolonged_pct = 45
        escalation_pct = 20
    elif war_intensity > 30:
        ceasefire_pct = 50
        prolonged_pct = 35
        escalation_pct = 15
    else:
        ceasefire_pct = 65
        prolonged_pct = 25
        escalation_pct = 10

    # Portfolio impact by scenario
    portfolio_impact = {
        "ceasefire": {
            "SOFI": "+20-30%", "OSCR": "+15-20%", "NBIS": "+5-10%",
            "COHR": "+10-15%", "AEHR": "+5%", "KSPI": "+10-15%",
            "oil_target": "$75-85",
        },
        "prolonged": {
            "SOFI": "-5 to flat", "OSCR": "-5 to flat", "NBIS": "flat",
            "COHR": "flat", "AEHR": "thesis-driven", "KSPI": "flat",
            "oil_target": "$90-110",
        },
        "escalation": {
            "SOFI": "-15-25%", "OSCR": "-10-15%", "NBIS": "-10%",
            "COHR": "-15%", "AEHR": "-10%", "KSPI": "-5%",
            "oil_target": "$130-150+",
        },
    }

    # AI analysis if available
    ai_analysis = None
    if ANTHROPIC_AVAILABLE and ANTHROPIC_KEY:
        try:
            client = anthropic.Anthropic(api_key=ANTHROPIC_KEY)
            prompt = f"""You are a geopolitical risk analyst. Based on these REAL market signals, assess the Iran war / Strait of Hormuz situation:

LIVE MARKET DATA:
- Brent crude: ${brent_price} (week: {brent_week_chg:+.1f}%)
- WTI crude: ${wti.get('price', 'N/A')} (week: {wti.get('week_change_pct', 'N/A')}%)
- Natural gas: ${natgas.get('price', 'N/A')} (week: {natgas.get('week_change_pct', 'N/A')}%)
- VIX: {vix_level} (percentile: {vix_pctile}%, level: {vix_data.get('level', 'N/A')})
- Gold: ${gold_price} (week: {gold_week:+.1f}%)
- 10Y yield: {ten_y}%
- SPY week: {spy_week:+.1f}%
- Energy sector (XLE) week: {xle.get('week_change_pct', 'N/A')}%
- War intensity score: {war_intensity}/100

Provide a JSON object with:
- "headline": one-line war status summary (15 words max)
- "oil_read": what oil price action signals about war trajectory (2 sentences)
- "vix_read": what VIX signals about market fear (1 sentence)
- "gold_read": what gold signals about safe-haven demand (1 sentence)
- "energy_sector_read": what energy sector performance signals (1 sentence)
- "strait_status": "closed" | "partially_open" | "open"
- "fed_impact": how this affects Fed rate cut timing (1 sentence)
- "trade_signal": specific action for a retail trader with SOFI, NBIS, COHR positions (2 sentences)
- "risk_event_next_48h": the single biggest risk event to watch (1 sentence)

Return ONLY valid JSON, no markdown."""

            msg = client.messages.create(
                model="claude-sonnet-4-20250514",
                max_tokens=1000,
                messages=[{"role": "user", "content": prompt}],
            )
            text = msg.content[0].text.strip()
            if text.startswith("{"):
                ai_analysis = json.loads(text)
        except Exception:
            pass

    result = {
        "war_intensity": war_intensity,
        "scenarios": {
            "ceasefire": {"probability": ceasefire_pct, "label": "Ceasefire / De-escalation", "color": "#22c55e"},
            "prolonged": {"probability": prolonged_pct, "label": "Prolonged Conflict", "color": "#f59e0b"},
            "escalation": {"probability": escalation_pct, "label": "Major Escalation", "color": "#ef4444"},
        },
        "market_signals": {
            "oil": {"brent": brent, "wti": wti, "natgas": natgas, "signal_score": oil_war_signal, "momentum_score": oil_momentum},
            "vix": {**vix_data, "fear_score": vix_fear},
            "gold": {**gold, "signal_score": gold_signal},
            "yields": {"10y": tnx, "signal_score": yield_signal},
            "spy": spy,
            "energy_sector": xle,
            "utilities": xlu,
            "dxy": dxy,
        },
        "portfolio_impact": portfolio_impact,
        "ai_analysis": ai_analysis,
        "updated_at": datetime.now(timezone.utc).isoformat(),
    }

    rdb.setex(CEASEFIRE_CACHE_KEY, CEASEFIRE_CACHE_TTL, json.dumps(result))
    return result


# ═══════════════════════════════════════════════════════════════════════
#  DEAD WEIGHT SCANNER
# ═══════════════════════════════════════════════════════════════════════
@router.get("/dead-weight")
async def dead_weight_scanner():
    """Scan portfolio for dead weight positions — no thesis, no CC, no catalyst."""
    positions = []
    try:
        raw = rdb.get("fidelity:positions")
        if raw:
            positions = json.loads(raw)
            if isinstance(positions, dict):
                positions = positions.get("positions", [])
    except Exception:
        pass

    if not positions:
        return {"dead_weight": [], "total_dead_capital": 0}

    dead = []
    # Criteria for dead weight:
    # 1. Small position (<$500)
    # 2. Deep loss (>-30%)
    # 3. Fractional shares (can't sell CC)
    # 4. No options market (ETFs, tiny names)
    KNOWN_DEAD = {"FOUR", "XNET", "SOXL", "KORU"}
    KNOWN_CC_POSITIONS = {"SOFI", "OSCR", "BMNR", "COHR", "LWLG"}
    KNOWN_THESIS = {"NBIS", "SOFI", "OSCR", "COHR", "AEHR", "AXTI", "AAOI", "KSPI", "QCOM", "BMNR", "LWLG", "HIMS"}

    for pos in positions:
        sym = pos.get("symbol", "")
        if not sym or sym == "Cash":
            continue
        value = abs(pos.get("market_value", 0))
        gain_pct = pos.get("gain_pct", 0)
        qty = pos.get("quantity", 0)
        reasons = []

        if sym in KNOWN_DEAD:
            reasons.append("No active thesis")
        if value < 400 and sym not in KNOWN_THESIS:
            reasons.append(f"Tiny position (${value:.0f})")
        if qty < 1 and qty > 0:
            reasons.append("Fractional — can't sell CC")
        if gain_pct < -30 and sym not in KNOWN_CC_POSITIONS:
            reasons.append(f"Deep loss ({gain_pct:.1f}%) with no income strategy")
        if sym not in KNOWN_THESIS and sym not in KNOWN_CC_POSITIONS:
            reasons.append("No defined thesis or exit plan")

        if reasons:
            dead.append({
                "ticker": sym,
                "value": round(value, 2),
                "gain_pct": round(gain_pct, 1) if gain_pct else 0,
                "quantity": qty,
                "reasons": reasons,
                "action": "SELL" if len(reasons) >= 2 else "REVIEW",
            })

    dead.sort(key=lambda x: len(x["reasons"]), reverse=True)
    total = sum(d["value"] for d in dead)

    return {
        "dead_weight": dead,
        "total_dead_capital": round(total, 2),
        "positions_scanned": len(positions),
        "recommendation": f"Sell {len([d for d in dead if d['action']=='SELL'])} positions to free ${total:.0f} for higher-conviction names",
    }


# ═══════════════════════════════════════════════════════════════════════
#  POSITION CONVICTION SCORES (COHR Framework)
# ═══════════════════════════════════════════════════════════════════════
@router.get("/conviction-scores")
async def conviction_scores():
    """Rate every position using the COHR analog framework (7 criteria)."""
    positions = []
    try:
        raw = rdb.get("fidelity:positions")
        if raw:
            positions = json.loads(raw)
            if isinstance(positions, dict):
                positions = positions.get("positions", [])
    except Exception:
        pass

    if not positions and not ANTHROPIC_AVAILABLE:
        return {"scores": [], "framework": "COHR 7-point analog"}

    tickers = [p.get("symbol", "") for p in positions if p.get("symbol") and p["symbol"] != "Cash"][:20]
    if not tickers:
        return {"scores": []}

    scores = []
    if ANTHROPIC_AVAILABLE and ANTHROPIC_KEY:
        try:
            client = anthropic.Anthropic(api_key=ANTHROPIC_KEY)
            prompt = f"""You are a professional equity analyst using the Nemeth/Mispriced Assets COHR framework.
Rate each ticker on these 7 criteria (1-10 each):

1. Legacy narrative masking new business (market applying old mental model)
2. Revenue scale hidden in diversified reporting
3. Manufacturing/technology inflection unpriced
4. Operating leverage about to kick in
5. New/proven management executing specific playbook
6. Depressed "second segment" misread as structural drag
7. Same or lower market cap as pure-play peer but larger actual business

For each ticker provide a JSON array with objects:
- "ticker": string
- "total_score": sum of 7 criteria (max 70)
- "grade": "A+" (60-70) | "A" (50-59) | "B+" (40-49) | "B" (30-39) | "C" (20-29) | "D" (<20)
- "strongest": which criterion scores highest (name it)
- "weakest": which criterion scores lowest (name it)
- "one_line": one-sentence thesis or concern
- "strategy": "HOLD" | "ADD" | "TRIM" | "SELL" | "WHEEL"

Tickers: {', '.join(tickers)}

Return ONLY valid JSON array."""

            msg = client.messages.create(
                model="claude-sonnet-4-20250514",
                max_tokens=2000,
                messages=[{"role": "user", "content": prompt}],
            )
            text = msg.content[0].text.strip()
            if text.startswith("["):
                scores = json.loads(text)
        except Exception as e:
            scores = [{"error": str(e)}]

    return {"scores": scores, "framework": "COHR 7-point analog (Nemeth)", "tickers_analyzed": len(tickers)}


# ═══════════════════════════════════════════════════════════════════════
#  EARNINGS CALENDAR COUNTDOWN
# ═══════════════════════════════════════════════════════════════════════
@router.get("/earnings-countdown")
async def earnings_countdown():
    """Upcoming earnings for portfolio positions with countdown."""
    # Known earnings dates from our research
    KNOWN_EARNINGS = {
        "AEHR": {"date": "2026-04-07", "label": "Q3 FY2026", "catalyst": "H2 bookings confirmation, AI ASIC PO"},
        "NBIS": {"date": "2026-04-29", "label": "Q1 2026", "catalyst": "First full quarter with Microsoft deal"},
        "SOFI": {"date": "2026-05-13", "label": "Q1 2026", "catalyst": "Loan growth, rate sensitivity, S&P watch"},
        "COHR": {"date": "2026-05-06", "label": "Q3 FY2026", "catalyst": "Datacenter optical revenue mix shift"},
        "OSCR": {"date": "2026-05-08", "label": "Q1 2026", "catalyst": "Membership growth, MLR improvement"},
        "AAOI": {"date": "2026-05-01", "label": "Q1 2026", "catalyst": "1.6T hyperscaler volume ramp"},
        "KSPI": {"date": "2026-05-11", "label": "Q1 2026", "catalyst": "Turkey EBITDA breakeven progress"},
        "QCOM": {"date": "2026-04-30", "label": "Q2 FY2026", "catalyst": "Automotive >$1B, Apple modem timeline"},
        "HIMS": {"date": "2026-05-05", "label": "Q1 2026", "catalyst": "GLP-1 partnership revenue"},
        "AXTI": {"date": "2026-05-07", "label": "Q1 2026", "catalyst": "InP substrate demand from AI optical"},
    }

    today = datetime.now(timezone.utc).date()
    upcoming = []
    for ticker, info in KNOWN_EARNINGS.items():
        from datetime import date as dateclass
        parts = info["date"].split("-")
        earn_date = dateclass(int(parts[0]), int(parts[1]), int(parts[2]))
        days_until = (earn_date - today).days
        if days_until >= -1:  # include today and yesterday
            upcoming.append({
                "ticker": ticker,
                "date": info["date"],
                "label": info["label"],
                "catalyst": info["catalyst"],
                "days_until": days_until,
                "urgency": "NOW" if days_until <= 0 else "THIS_WEEK" if days_until <= 7 else "SOON" if days_until <= 14 else "UPCOMING",
            })

    upcoming.sort(key=lambda x: x["days_until"])
    return {"earnings": upcoming, "next_up": upcoming[0] if upcoming else None}


# ═══════════════════════════════════════════════════════════════════════
#  $50K GOAL TRACKER
# ═══════════════════════════════════════════════════════════════════════
@router.get("/goal-50k")
async def goal_50k():
    """Track progress toward $50K account goal with run rate."""
    # Get current account value from growth snapshots
    snapshots = []
    try:
        raw_list = rdb.lrange("growth:snapshots", 0, -1)
        for r in raw_list:
            snapshots.append(json.loads(r))
    except Exception:
        pass

    current_value = 28512  # fallback
    start_value = 29303   # Jan 1 baseline
    if snapshots:
        snapshots.sort(key=lambda x: x.get("date", ""))
        current_value = snapshots[-1].get("value", current_value)
        if len(snapshots) >= 2:
            start_value = snapshots[0].get("value", start_value)

    target = 50000
    remaining = max(0, target - current_value)
    progress_pct = min(100, (current_value / target) * 100)

    # Calculate run rate
    today = datetime.now(timezone.utc)
    jan1 = datetime(2026, 1, 1, tzinfo=timezone.utc)
    weeks_elapsed = max(1, (today - jan1).days / 7)
    gain_ytd = current_value - start_value
    weekly_rate = gain_ytd / weeks_elapsed if weeks_elapsed > 0 else 0
    weeks_to_goal = remaining / weekly_rate if weekly_rate > 0 else float("inf")

    from datetime import timedelta
    est_date = today + timedelta(weeks=weeks_to_goal) if weeks_to_goal < 200 else None

    return {
        "current": round(current_value, 2),
        "target": target,
        "remaining": round(remaining, 2),
        "progress_pct": round(progress_pct, 1),
        "start_value": start_value,
        "gain_ytd": round(gain_ytd, 2),
        "weekly_rate": round(weekly_rate, 2),
        "weekly_needed": round(remaining / max(1, 26 - weeks_elapsed), 2),  # weeks left in H1
        "weeks_to_goal": round(weeks_to_goal, 1) if weeks_to_goal < 200 else None,
        "est_completion": est_date.strftime("%Y-%m-%d") if est_date else "N/A",
        "on_track": weekly_rate >= (remaining / max(1, 26 - weeks_elapsed)),
    }


# ═══════════════════════════════════════════════════════════════════════
#  WEEKLY CC INCOME LOG
# ═══════════════════════════════════════════════════════════════════════
CC_LOG_KEY = "cc:weekly-income"

@router.get("/cc-income")
async def cc_income():
    """Weekly covered call income tracker."""
    entries = []
    try:
        raw_list = rdb.lrange(CC_LOG_KEY, 0, -1)
        for r in raw_list:
            entries.append(json.loads(r))
    except Exception:
        pass

    # Also pull from options journal for auto-calculation
    try:
        journal_raw = rdb.get("options:journal:raw")
        if journal_raw:
            trades = json.loads(journal_raw)
            # Group CC income by week
            from collections import defaultdict
            weekly = defaultdict(float)
            for trade in trades:
                action = trade.get("action", "")
                desc = trade.get("description", "")
                amount = trade.get("amount", 0)
                date = trade.get("date", "")
                # Sold calls = CC income (positive amount on SELL TO OPEN or negative on BUY TO CLOSE)
                if "CALL" in desc.upper() and "SOLD" in action.upper():
                    # Get ISO week
                    try:
                        from datetime import date as dclass
                        parts = date.split("/")
                        if len(parts) == 3:
                            dt = dclass(int(parts[2]) if int(parts[2]) > 100 else 2000 + int(parts[2]), int(parts[0]), int(parts[1]))
                            week_key = f"{dt.isocalendar()[0]}-W{dt.isocalendar()[1]:02d}"
                            weekly[week_key] += abs(amount)
                    except Exception:
                        pass

            auto_entries = [{"week": k, "income": round(v, 2), "source": "auto"} for k, v in sorted(weekly.items())]
            entries = auto_entries + entries
    except Exception:
        pass

    total = sum(e.get("income", 0) for e in entries)
    weeks = len(set(e.get("week") for e in entries)) or 1
    avg_weekly = total / weeks

    return {
        "entries": entries[-52:],  # last year
        "total_income": round(total, 2),
        "avg_weekly": round(avg_weekly, 2),
        "weeks_tracked": weeks,
        "annualized": round(avg_weekly * 52, 2),
    }
