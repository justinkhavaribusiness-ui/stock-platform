"""
Photonics Command Center v2.0 - Backend API
Phase 1: Watchlist, Supply Chain, Research, AI Analyst
Phase 2: Earnings War Room, Thesis Scorecard, Catalyst Calendar, Technical Scoring
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, List, Dict
import json, uuid, redis, os, math
from datetime import datetime, timezone, timedelta

router = APIRouter(prefix="/photonics", tags=["photonics"])

# Redis connection
rdb = redis.Redis(host="127.0.0.1", port=6379, db=0, decode_responses=True)

# Redis keys
WATCHLIST_KEY = "photonics:watchlist"
RESEARCH_KEY = "photonics:research"
EARNINGS_KEY = "photonics:earnings"
THESIS_KEY = "photonics:thesis"
CATALYSTS_KEY = "photonics:catalysts"
CREDIBILITY_KEY = "photonics:credibility"

# ============================================================
# CORE DATA: WATCHLIST & SUPPLY CHAIN
# ============================================================

DEFAULT_WATCHLIST = [
    {"ticker": "AAOI",  "target": 43,  "step": 5, "notes": "Optical component assembly, transceivers", "pure_play": True},
    {"ticker": "AEHR",  "target": 28,  "step": 3, "notes": "Wafer-level burn-in & test equipment", "pure_play": True},
    {"ticker": "ALMU",  "target": 17,  "step": 1, "notes": "InP substrates & epitaxial wafers", "pure_play": True},
    {"ticker": "ANET",  "target": 115, "step": 7, "notes": "Data center networking switches", "pure_play": False},
    {"ticker": "AXTI",  "target": 20,  "step": 1, "notes": "InP & GaAs substrate wafers", "pure_play": True},
    {"ticker": "CIEN",  "target": 270, "step": 6, "notes": "Optical networking equipment & WaveLogic DSPs", "pure_play": False},
    {"ticker": "COHR",  "target": 215, "step": 5, "notes": "Transceivers, lasers, II-VI materials", "pure_play": True},
    {"ticker": "CRDO",  "target": 87,  "step": 6, "notes": "SerDes & connectivity DSP chips", "pure_play": False},
    {"ticker": "FN",    "target": 400, "step": 6, "notes": "Optical subsystems & modules (Fabrinet)", "pure_play": True},
    {"ticker": "GFS",   "target": 41,  "step": 3, "notes": "Photonics-capable semiconductor foundry", "pure_play": False},
    {"ticker": "GLW",   "target": 110, "step": 7, "notes": "Optical fiber & glass solutions (Corning)", "pure_play": False},
    {"ticker": "LWLG",  "target": 3,   "step": 2, "notes": "Electro-optic polymer modulators", "pure_play": True},
    {"ticker": "MRVL",  "target": 71,  "step": 6, "notes": "DSPs, PAM4, coherent optics silicon", "pure_play": False},
    {"ticker": "MTSI",  "target": 200, "step": 5, "notes": "Laser drivers, TIAs, analog photonics ICs", "pure_play": True},
    {"ticker": "NOK",   "target": 7,   "step": 7, "notes": "Optical networking & submarine cables", "pure_play": False},
    {"ticker": "POET",  "target": 5,   "step": 5, "notes": "Optical interposer platform, chip-scale packaging", "pure_play": True},
    {"ticker": "SMTC",  "target": 79,  "step": 3, "notes": "Analog & mixed-signal semis for optical", "pure_play": False},
    {"ticker": "TSEM",  "target": 110, "step": 3, "notes": "Specialty foundry, photonics wafer fab", "pure_play": False},
    {"ticker": "VIAV",  "target": 22,  "step": 6, "notes": "Optical test & measurement, filters", "pure_play": False},
]

SUPPLY_CHAIN_STEPS = [
    {"step": 0, "name": "Mining & Refining", "description": "Indium extracted as byproduct of zinc refining. No dedicated mines.", "bottleneck": "Indium supply tied to zinc production economics", "companies": []},
    {"step": 1, "name": "Substrate (InP Wafers)", "description": "Indium + Phosphorus → InP wafers. Expensive, brittle, only moving to 6-inch.", "bottleneck": "6-inch wafer transition, limited global capacity", "companies": ["AXTI", "ALMU"]},
    {"step": 2, "name": "Epitaxial Growth", "description": "Nanometer-thin layers grown on wafers. Determines laser wavelength, power, efficiency.", "bottleneck": "Extremely specialized equipment, very few facilities worldwide", "companies": ["LWLG"]},
    {"step": 3, "name": "Wafer Fabrication", "description": "Waveguides, laser cavities, switches carved into wafer. Cannot use standard fabs.", "bottleneck": "Dedicated photonics fabs required, years to build & qualify", "companies": ["AEHR", "GFS", "SMTC", "TSEM"]},
    {"step": 4, "name": "Dicing & Yield", "description": "Wafer cut into individual chips, each tested. Yield drives cost per chip.", "bottleneck": "Yield improvement is hard-won through years of process refinement", "companies": ["AEHR"]},
    {"step": 5, "name": "Component Assembly", "description": "Laser chip aligned to fiber (sub-micron tolerance). Hermetically sealed.", "bottleneck": "Sub-micron alignment automation, hermetic package supply", "companies": ["AAOI", "COHR", "MTSI", "POET"]},
    {"step": 6, "name": "Transceiver Module", "description": "Optical sub-assembly + DSP + board + casing = pluggable transceiver. CPO will change this.", "bottleneck": "Individual testing is slow & expensive, DSP supply", "companies": ["CIEN", "CRDO", "FN", "MRVL", "VIAV"]},
    {"step": 7, "name": "Data Center Integration", "description": "Transceivers plug into network switches. Connected by ultra-pure glass fiber.", "bottleneck": "Fiber deployment, switch port density", "companies": ["ANET", "GLW", "NOK"]},
]

TICKER_NAMES = {
    "AAOI": "Applied Optoelectronics", "AEHR": "Aehr Test Systems", "ALMU": "Alumis",
    "ANET": "Arista Networks", "AXTI": "AXT Inc", "CIEN": "Ciena Corporation",
    "COHR": "Coherent Corp", "CRDO": "Credo Technology", "FN": "Fabrinet",
    "GFS": "GlobalFoundries", "GLW": "Corning Inc", "LWLG": "Lightwave Logic",
    "MRVL": "Marvell Technology", "MTSI": "MACOM Technology", "NOK": "Nokia Corporation",
    "POET": "POET Technologies", "SMTC": "Semtech Corporation", "TSEM": "Tower Semiconductor",
    "VIAV": "VIAV Solutions",
}

# ============================================================
# PYDANTIC MODELS
# ============================================================

class WatchlistUpdate(BaseModel):
    target: Optional[float] = None
    notes: Optional[str] = None

class ResearchEntry(BaseModel):
    title: str
    content: str
    tickers: List[str] = []
    tags: List[str] = []
    source: str = ""

class AIQuestion(BaseModel):
    question: str
    tickers: List[str] = []

class ThesisItem(BaseModel):
    ticker: str
    thesis_type: str = "bull"
    item: str
    status: str = "active"
    priority: int = 1

class CatalystEntry(BaseModel):
    ticker: str
    title: str
    date: str
    catalyst_type: str
    importance: str = "medium"
    notes: str = ""

class EarningsEntry(BaseModel):
    ticker: str
    quarter: str
    date: str
    est_revenue: Optional[float] = None
    est_eps: Optional[float] = None
    guidance_revenue: Optional[float] = None
    guidance_eps: Optional[float] = None
    supply_chain_signals: str = ""
    pre_notes: str = ""
    actual_revenue: Optional[float] = None
    actual_eps: Optional[float] = None
    new_guidance_revenue: Optional[float] = None
    new_guidance_eps: Optional[float] = None
    beat_miss: Optional[str] = None
    post_notes: str = ""
    key_quotes: str = ""

# ============================================================
# UTILITY FUNCTIONS
# ============================================================

def _init_watchlist():
    existing = rdb.get(WATCHLIST_KEY)
    if not existing:
        rdb.set(WATCHLIST_KEY, json.dumps(DEFAULT_WATCHLIST))
    return json.loads(rdb.get(WATCHLIST_KEY))

def _get_live_prices(tickers: List[str]) -> dict:
    prices = {}
    try:
        import yfinance as yf
        data = yf.download(tickers, period="5d", group_by="ticker", progress=False)
        for t in tickers:
            try:
                if len(tickers) == 1:
                    close = data["Close"].iloc[-1]
                    prev = data["Close"].iloc[-2] if len(data) > 1 else close
                else:
                    close = data[t]["Close"].iloc[-1]
                    prev = data[t]["Close"].iloc[-2] if len(data[t]) > 1 else close
                prices[t] = {
                    "price": round(float(close), 2),
                    "prev_close": round(float(prev), 2),
                    "change_pct": round(((close - prev) / prev) * 100, 2) if prev else 0
                }
            except:
                prices[t] = {"price": 0, "prev_close": 0, "change_pct": 0}
    except Exception as e:
        print(f"Price fetch error: {e}")
        for t in tickers:
            prices[t] = {"price": 0, "prev_close": 0, "change_pct": 0}
    return prices

def _ema(data, period):
    import numpy as np
    if len(data) < period:
        return float(np.mean(data))
    multiplier = 2 / (period + 1)
    ema = float(data[0])
    for price in data[1:]:
        ema = (float(price) - ema) * multiplier + ema
    return ema

def _calc_rsi(closes, period=14):
    import numpy as np
    if len(closes) < period + 1:
        return None
    deltas = np.diff(closes)
    gains = np.where(deltas > 0, deltas, 0)
    losses = np.where(deltas < 0, -deltas, 0)
    avg_gain = np.mean(gains[-period:])
    avg_loss = np.mean(losses[-period:])
    if avg_loss == 0:
        return 100.0
    rs = avg_gain / avg_loss
    return float(100 - (100 / (1 + rs)))

def _get_technicals(tickers: List[str]) -> dict:
    technicals = {}
    try:
        import yfinance as yf
        import numpy as np
        data = yf.download(tickers, period="1y", group_by="ticker", progress=False)
        for t in tickers:
            try:
                if len(tickers) == 1:
                    closes = data["Close"].dropna().values.flatten()
                    volumes = data["Volume"].dropna().values.flatten()
                else:
                    closes = data[t]["Close"].dropna().values.flatten()
                    volumes = data[t]["Volume"].dropna().values.flatten()
                if len(closes) < 26:
                    technicals[t] = {"error": "Insufficient data"}
                    continue
                current = float(closes[-1])
                sma_20 = float(np.mean(closes[-20:])) if len(closes) >= 20 else None
                sma_50 = float(np.mean(closes[-50:])) if len(closes) >= 50 else None
                sma_200 = float(np.mean(closes[-200:])) if len(closes) >= 200 else None
                ema_12 = _ema(closes, 12)
                ema_26 = _ema(closes, 26)
                rsi = _calc_rsi(closes, 14)
                macd_line = ema_12 - ema_26
                macd_hist = macd_line - _ema(np.array([_ema(closes[:i+1], 12) - _ema(closes[:i+1], 26) for i in range(25, len(closes))]), 9)
                avg_vol_20 = float(np.mean(volumes[-20:])) if len(volumes) >= 20 else 0
                vol_ratio = round(float(volumes[-1]) / avg_vol_20, 2) if avg_vol_20 > 0 else 0
                high_52w = float(np.max(closes[-252:])) if len(closes) >= 252 else float(np.max(closes))
                low_52w = float(np.min(closes[-252:])) if len(closes) >= 252 else float(np.min(closes))
                # Health score
                score = 50
                if rsi:
                    if rsi > 70: score -= 10
                    elif rsi < 30: score += 10
                    elif 40 <= rsi <= 60: score += 5
                if sma_20 and current > sma_20: score += 10
                if sma_50 and current > sma_50: score += 10
                if sma_200 and current > sma_200: score += 10
                if macd_hist > 0: score += 10
                if vol_ratio > 1.5: score += 5
                score = max(0, min(100, score))
                # Signals
                signals = []
                if rsi and rsi > 70: signals.append({"signal": "RSI Overbought", "type": "bearish"})
                elif rsi and rsi < 30: signals.append({"signal": "RSI Oversold", "type": "bullish"})
                if sma_20 and sma_50:
                    if sma_20 > sma_50: signals.append({"signal": "Golden Cross 20/50", "type": "bullish"})
                    else: signals.append({"signal": "Death Cross 20/50", "type": "bearish"})
                if sma_200:
                    if current > sma_200: signals.append({"signal": "Above 200 SMA", "type": "bullish"})
                    else: signals.append({"signal": "Below 200 SMA", "type": "bearish"})
                if macd_hist > 0: signals.append({"signal": "MACD Positive", "type": "bullish"})
                else: signals.append({"signal": "MACD Negative", "type": "bearish"})
                technicals[t] = {
                    "current": round(current, 2), "sma_20": round(sma_20, 2) if sma_20 else None,
                    "sma_50": round(sma_50, 2) if sma_50 else None, "sma_200": round(sma_200, 2) if sma_200 else None,
                    "rsi_14": round(rsi, 2) if rsi else None, "macd_histogram": round(macd_hist, 4),
                    "vol_ratio": vol_ratio, "avg_vol_20": int(avg_vol_20),
                    "high_52w": round(high_52w, 2), "low_52w": round(low_52w, 2),
                    "pct_from_high": round(((current - high_52w) / high_52w) * 100, 2),
                    "pct_from_low": round(((current - low_52w) / low_52w) * 100, 2),
                    "health_score": score, "signals": signals,
                }
            except Exception as e:
                technicals[t] = {"error": str(e)}
    except Exception as e:
        for t in tickers:
            technicals[t] = {"error": str(e)}
    return technicals

def _update_credibility(ticker, quarter, metric, guidance, actual):
    if guidance == 0: return
    doc = {
        "id": str(uuid.uuid4())[:8], "ticker": ticker.upper(), "quarter": quarter,
        "metric": metric, "guidance_value": guidance, "actual_value": actual,
        "accuracy_pct": round((actual / guidance) * 100, 2), "beat": actual >= guidance,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    rdb.lpush(CREDIBILITY_KEY, json.dumps(doc))

# ============================================================
# PHASE 1: WATCHLIST
# ============================================================

@router.get("/watchlist")
def get_watchlist():
    watchlist = _init_watchlist()
    tickers = [w["ticker"] for w in watchlist]
    prices = _get_live_prices(tickers)
    result = []
    for w in watchlist:
        t = w["ticker"]
        p = prices.get(t, {"price": 0, "prev_close": 0, "change_pct": 0})
        current = p["price"]
        target = w["target"]
        pct_to_target = round(((current - target) / target) * 100, 2) if target and current else None
        in_buy_zone = current <= target * 1.02 if current and target else False
        result.append({**w, "name": TICKER_NAMES.get(t, t), "current_price": current,
            "prev_close": p["prev_close"], "change_pct": p["change_pct"],
            "pct_to_target": pct_to_target, "in_buy_zone": in_buy_zone})
    result.sort(key=lambda x: (not x["in_buy_zone"], x["pct_to_target"] or 999))
    return {"watchlist": result, "updated_at": datetime.now(timezone.utc).isoformat()}

@router.put("/watchlist/{ticker}")
def update_watchlist_item(ticker: str, update: WatchlistUpdate):
    watchlist = _init_watchlist()
    for w in watchlist:
        if w["ticker"] == ticker.upper():
            if update.target is not None: w["target"] = update.target
            if update.notes is not None: w["notes"] = update.notes
            rdb.set(WATCHLIST_KEY, json.dumps(watchlist))
            return {"status": "updated", "ticker": ticker.upper()}
    raise HTTPException(status_code=404, detail=f"Ticker {ticker} not in watchlist")

# ============================================================
# PHASE 1: SUPPLY CHAIN
# ============================================================

@router.get("/supply-chain")
def get_supply_chain():
    watchlist = _init_watchlist()
    tickers = [w["ticker"] for w in watchlist]
    prices = _get_live_prices(tickers)
    steps = []
    for step in SUPPLY_CHAIN_STEPS:
        companies = []
        for t in step["companies"]:
            w = next((x for x in watchlist if x["ticker"] == t), None)
            p = prices.get(t, {"price": 0, "change_pct": 0})
            companies.append({"ticker": t, "name": TICKER_NAMES.get(t, t), "price": p["price"],
                "change_pct": p["change_pct"], "target": w["target"] if w else None,
                "in_buy_zone": p["price"] <= w["target"] * 1.02 if w and p["price"] and w["target"] else False})
        steps.append({**step, "companies": companies})
    return {"steps": steps, "updated_at": datetime.now(timezone.utc).isoformat()}

# ============================================================
# PHASE 1: RESEARCH LIBRARY
# ============================================================

@router.get("/research")
def get_all_research(ticker: str = None, tag: str = None):
    raw = rdb.lrange(RESEARCH_KEY, 0, -1)
    docs = [json.loads(r) for r in raw]
    if ticker: docs = [d for d in docs if ticker.upper() in d.get("tickers", [])]
    if tag: docs = [d for d in docs if tag.lower() in [t.lower() for t in d.get("tags", [])]]
    docs.sort(key=lambda x: x.get("created_at", ""), reverse=True)
    return {"research": docs, "count": len(docs)}

@router.post("/research")
def add_research(entry: ResearchEntry):
    detected = [w["ticker"] for w in DEFAULT_WATCHLIST if w["ticker"] in entry.content.upper() or w["ticker"] in entry.title.upper()]
    doc = {"id": str(uuid.uuid4())[:8], "title": entry.title, "content": entry.content,
        "tickers": list(set(entry.tickers + detected)), "tags": entry.tags, "source": entry.source,
        "created_at": datetime.now(timezone.utc).isoformat(), "word_count": len(entry.content.split())}
    rdb.lpush(RESEARCH_KEY, json.dumps(doc))
    return {"status": "created", "doc": doc}

@router.get("/research/{research_id}")
def get_research(research_id: str):
    for r in rdb.lrange(RESEARCH_KEY, 0, -1):
        doc = json.loads(r)
        if doc["id"] == research_id: return doc
    raise HTTPException(status_code=404, detail="Not found")

@router.delete("/research/{research_id}")
def delete_research(research_id: str):
    for r in rdb.lrange(RESEARCH_KEY, 0, -1):
        doc = json.loads(r)
        if doc["id"] == research_id:
            rdb.lrem(RESEARCH_KEY, 1, r)
            return {"status": "deleted"}
    raise HTTPException(status_code=404, detail="Not found")

# ============================================================
# PHASE 1: AI ANALYST
# ============================================================

@router.post("/ai/ask")
def ai_research_ask(q: AIQuestion):
    import anthropic
    raw = rdb.lrange(RESEARCH_KEY, 0, -1)
    all_research = [json.loads(r) for r in raw]
    relevant = [d for d in all_research if any(t in d.get("tickers", []) for t in q.tickers)] if q.tickers else all_research
    research_context = ""
    for doc in relevant[-20:]:
        research_context += f"\n--- {doc['title']} ({', '.join(doc.get('tags',[]))}) ---\n{doc['content'][:3000]}\n"
    watchlist = _init_watchlist()
    prices = _get_live_prices([w["ticker"] for w in watchlist])
    wl_ctx = "WATCHLIST:\n"
    for w in watchlist:
        t = w["ticker"]
        p = prices.get(t, {"price": 0, "change_pct": 0})
        pct = round(((p["price"] - w["target"]) / w["target"]) * 100, 2) if w["target"] and p["price"] else 0
        zone = " 🟢 BUY ZONE" if p["price"] and p["price"] <= w["target"] * 1.02 else ""
        wl_ctx += f"  {t} ({TICKER_NAMES.get(t,t)}): ${p['price']} (target ${w['target']}, {pct:+.1f}%) Step {w['step']}{zone}\n"
    sc_ctx = "SUPPLY CHAIN:\n" + "\n".join([f"  Step {s['step']}: {s['name']} - {s['bottleneck']} [{', '.join(s['companies']) or 'N/A'}]" for s in SUPPLY_CHAIN_STEPS])
    thesis_ctx = ""
    for t in rdb.lrange(THESIS_KEY, 0, -1):
        item = json.loads(t)
        thesis_ctx += f"  {item['ticker']} [{item['thesis_type'].upper()}] ({item['status']}): {item['item']}\n"
    if thesis_ctx: thesis_ctx = "\nTHESIS:\n" + thesis_ctx
    system = f"""You are a photonics industry research analyst. Deep knowledge of InP supply chain, 400G→800G→1.6T transitions, and all 19 watchlist companies.

{wl_ctx}
{sc_ctx}
{thesis_ctx}

RESEARCH LIBRARY:
{research_context or "(Empty)"}

RULES: Reference research docs. Use live prices. Highlight supply chain ripple effects. Note buy zones. Connect dots between companies. Flag speculation vs research. NOT financial advice. Be concise and data-driven."""

    try:
        client = anthropic.Anthropic()
        msg = client.messages.create(model="claude-sonnet-4-20250514", max_tokens=2000, system=system, messages=[{"role": "user", "content": q.question}])
        answer = msg.content[0].text
    except Exception as e:
        answer = f"AI unavailable: {e}. Check ANTHROPIC_API_KEY."
    return {"question": q.question, "answer": answer, "research_docs_used": len(relevant), "timestamp": datetime.now(timezone.utc).isoformat()}

@router.post("/ai/analyze-chain-impact")
def analyze_chain_impact(data: dict):
    import anthropic
    event, ticker = data.get("event", ""), data.get("ticker", "").upper()
    watchlist = _init_watchlist()
    company = next((w for w in watchlist if w["ticker"] == ticker), None)
    step = company["step"] if company else -1
    research = [json.loads(r) for r in rdb.lrange(RESEARCH_KEY, 0, -1) if ticker in json.loads(r).get("tickers", [])]
    prompt = f"""Analyze supply chain ripple effects:
Company: {ticker} ({TICKER_NAMES.get(ticker, ticker)}) — Step {step}
Event: {event}
Chain: {chr(10).join([f"Step {s['step']}: {s['name']} ({', '.join(s['companies']) or 'N/A'})" for s in SUPPLY_CHAIN_STEPS])}
Research: {chr(10).join([f"- {d['title']}: {d['content'][:500]}" for d in research[-5:]]) or 'None'}
Analyze: 1) Direct impact 2) Upstream 3) Downstream 4) Most affected names 5) Bottleneck implications. Be specific, concise."""
    try:
        client = anthropic.Anthropic()
        msg = client.messages.create(model="claude-sonnet-4-20250514", max_tokens=1500, messages=[{"role": "user", "content": prompt}])
        analysis = msg.content[0].text
    except Exception as e:
        analysis = f"Unavailable: {e}"
    return {"ticker": ticker, "event": event, "step": step, "analysis": analysis, "timestamp": datetime.now(timezone.utc).isoformat()}

# ============================================================
# PHASE 2: TECHNICALS
# ============================================================

@router.get("/technicals")
def get_technicals(ticker: str = None):
    watchlist = _init_watchlist()
    tickers = [ticker.upper()] if ticker else [w["ticker"] for w in watchlist]
    technicals = _get_technicals(tickers)
    for t in tickers:
        w = next((x for x in watchlist if x["ticker"] == t), None)
        if w and t in technicals and "error" not in technicals[t]:
            technicals[t]["target"] = w["target"]
            technicals[t]["step"] = w["step"]
            technicals[t]["name"] = TICKER_NAMES.get(t, t)
    return {"technicals": technicals, "updated_at": datetime.now(timezone.utc).isoformat()}

# ============================================================
# PHASE 2: EARNINGS WAR ROOM
# ============================================================

@router.get("/earnings")
def get_earnings(ticker: str = None, quarter: str = None):
    raw = rdb.lrange(EARNINGS_KEY, 0, -1)
    earnings = [json.loads(r) for r in raw]
    if ticker: earnings = [e for e in earnings if e["ticker"] == ticker.upper()]
    if quarter: earnings = [e for e in earnings if e["quarter"] == quarter]
    earnings.sort(key=lambda x: x.get("date", ""), reverse=True)
    return {"earnings": earnings, "count": len(earnings)}

@router.post("/earnings")
def add_earnings(entry: EarningsEntry):
    doc = {"id": str(uuid.uuid4())[:8], "ticker": entry.ticker.upper(), "name": TICKER_NAMES.get(entry.ticker.upper(), entry.ticker),
        "quarter": entry.quarter, "date": entry.date,
        "est_revenue": entry.est_revenue, "est_eps": entry.est_eps,
        "guidance_revenue": entry.guidance_revenue, "guidance_eps": entry.guidance_eps,
        "supply_chain_signals": entry.supply_chain_signals, "pre_notes": entry.pre_notes,
        "actual_revenue": entry.actual_revenue, "actual_eps": entry.actual_eps,
        "new_guidance_revenue": entry.new_guidance_revenue, "new_guidance_eps": entry.new_guidance_eps,
        "beat_miss": entry.beat_miss, "post_notes": entry.post_notes, "key_quotes": entry.key_quotes,
        "created_at": datetime.now(timezone.utc).isoformat()}
    rdb.lpush(EARNINGS_KEY, json.dumps(doc))
    return {"status": "created", "doc": doc}

@router.put("/earnings/{earnings_id}")
def update_earnings(earnings_id: str, updates: dict):
    raw = rdb.lrange(EARNINGS_KEY, 0, -1)
    for i, r in enumerate(raw):
        doc = json.loads(r)
        if doc["id"] == earnings_id:
            doc.update(updates)
            doc["updated_at"] = datetime.now(timezone.utc).isoformat()
            if doc.get("actual_revenue") and doc.get("est_revenue"):
                doc["beat_miss"] = "beat" if doc["actual_revenue"] > doc["est_revenue"] * 1.01 else "miss" if doc["actual_revenue"] < doc["est_revenue"] * 0.99 else "inline"
            if doc.get("actual_revenue") and doc.get("guidance_revenue"):
                _update_credibility(doc["ticker"], doc["quarter"], "revenue", doc["guidance_revenue"], doc["actual_revenue"])
            rdb.lset(EARNINGS_KEY, i, json.dumps(doc))
            return {"status": "updated", "doc": doc}
    raise HTTPException(status_code=404, detail="Not found")

@router.delete("/earnings/{earnings_id}")
def delete_earnings(earnings_id: str):
    for r in rdb.lrange(EARNINGS_KEY, 0, -1):
        doc = json.loads(r)
        if doc["id"] == earnings_id:
            rdb.lrem(EARNINGS_KEY, 1, r)
            return {"status": "deleted"}
    raise HTTPException(status_code=404, detail="Not found")

# ============================================================
# PHASE 2: THESIS SCORECARD
# ============================================================

@router.get("/thesis")
def get_thesis(ticker: str = None):
    raw = rdb.lrange(THESIS_KEY, 0, -1)
    items = [json.loads(r) for r in raw]
    if ticker: items = [i for i in items if i["ticker"] == ticker.upper()]
    grouped = {}
    for item in items:
        t = item["ticker"]
        if t not in grouped:
            grouped[t] = {"ticker": t, "name": TICKER_NAMES.get(t, t), "bull": [], "bear": []}
        grouped[t][item["thesis_type"]].append(item)
    for t, data in grouped.items():
        bc = len([i for i in data["bull"] if i["status"] == "confirmed"])
        ba = len([i for i in data["bull"] if i["status"] == "active"])
        bi = len([i for i in data["bull"] if i["status"] == "invalidated"])
        rc = len([i for i in data["bear"] if i["status"] == "confirmed"])
        ra = len([i for i in data["bear"] if i["status"] == "active"])
        ri = len([i for i in data["bear"] if i["status"] == "invalidated"])
        bull_s = bc * 2 + ba - bi
        bear_s = rc * 2 + ra - ri
        net = bull_s - bear_s
        data["conviction"] = {"bull_score": bull_s, "bear_score": bear_s, "net_score": net,
            "signal": "STRONG BUY" if net >= 4 else "BUY" if net >= 2 else "NEUTRAL" if abs(net) <= 1 else "CAUTION" if net <= -2 else "AVOID" if net <= -4 else "NEUTRAL"}
    return {"thesis": grouped, "count": len(items)}

@router.post("/thesis")
def add_thesis_item(item: ThesisItem):
    doc = {"id": str(uuid.uuid4())[:8], "ticker": item.ticker.upper(), "thesis_type": item.thesis_type,
        "item": item.item, "status": item.status, "priority": item.priority, "created_at": datetime.now(timezone.utc).isoformat()}
    rdb.lpush(THESIS_KEY, json.dumps(doc))
    return {"status": "created", "doc": doc}

@router.put("/thesis/{thesis_id}")
def update_thesis_item(thesis_id: str, updates: dict):
    raw = rdb.lrange(THESIS_KEY, 0, -1)
    for i, r in enumerate(raw):
        doc = json.loads(r)
        if doc["id"] == thesis_id:
            doc.update(updates)
            doc["updated_at"] = datetime.now(timezone.utc).isoformat()
            rdb.lset(THESIS_KEY, i, json.dumps(doc))
            return {"status": "updated", "doc": doc}
    raise HTTPException(status_code=404, detail="Not found")

@router.delete("/thesis/{thesis_id}")
def delete_thesis_item(thesis_id: str):
    for r in rdb.lrange(THESIS_KEY, 0, -1):
        doc = json.loads(r)
        if doc["id"] == thesis_id:
            rdb.lrem(THESIS_KEY, 1, r)
            return {"status": "deleted"}
    raise HTTPException(status_code=404, detail="Not found")

# ============================================================
# PHASE 2: CATALYST CALENDAR
# ============================================================

@router.get("/catalysts")
def get_catalysts(ticker: str = None, upcoming_only: bool = False):
    raw = rdb.lrange(CATALYSTS_KEY, 0, -1)
    catalysts = [json.loads(r) for r in raw]
    if ticker: catalysts = [c for c in catalysts if c["ticker"] == ticker.upper()]
    if upcoming_only:
        today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
        catalysts = [c for c in catalysts if c.get("date", "") >= today]
    catalysts.sort(key=lambda x: x.get("date", ""))
    return {"catalysts": catalysts, "count": len(catalysts)}

@router.post("/catalysts")
def add_catalyst(entry: CatalystEntry):
    doc = {"id": str(uuid.uuid4())[:8], "ticker": entry.ticker.upper(), "name": TICKER_NAMES.get(entry.ticker.upper(), entry.ticker),
        "title": entry.title, "date": entry.date, "catalyst_type": entry.catalyst_type,
        "importance": entry.importance, "notes": entry.notes, "created_at": datetime.now(timezone.utc).isoformat()}
    rdb.lpush(CATALYSTS_KEY, json.dumps(doc))
    return {"status": "created", "doc": doc}

@router.delete("/catalysts/{catalyst_id}")
def delete_catalyst(catalyst_id: str):
    for r in rdb.lrange(CATALYSTS_KEY, 0, -1):
        doc = json.loads(r)
        if doc["id"] == catalyst_id:
            rdb.lrem(CATALYSTS_KEY, 1, r)
            return {"status": "deleted"}
    raise HTTPException(status_code=404, detail="Not found")

# ============================================================
# PHASE 2: CREDIBILITY
# ============================================================

@router.get("/credibility")
def get_credibility(ticker: str = None):
    raw = rdb.lrange(CREDIBILITY_KEY, 0, -1)
    records = [json.loads(r) for r in raw]
    if ticker: records = [r for r in records if r["ticker"] == ticker.upper()]
    grouped = {}
    for rec in records:
        t = rec["ticker"]
        if t not in grouped:
            grouped[t] = {"ticker": t, "name": TICKER_NAMES.get(t, t), "records": []}
        grouped[t]["records"].append(rec)
    for t, data in grouped.items():
        accs = [r["accuracy_pct"] for r in data["records"]]
        beats = [r["beat"] for r in data["records"]]
        data["avg_accuracy"] = round(sum(accs) / len(accs), 2) if accs else 0
        data["beat_rate"] = round(sum(beats) / len(beats) * 100, 2) if beats else 0
        data["grade"] = "A+" if data["avg_accuracy"] >= 100 and data["beat_rate"] >= 80 else "A" if data["avg_accuracy"] >= 98 else "B" if data["avg_accuracy"] >= 95 else "C" if data["avg_accuracy"] >= 90 else "D"
    return {"credibility": grouped}

# ============================================================
# PHASE 2: DASHBOARD
# ============================================================

@router.get("/dashboard")
def get_dashboard():
    watchlist = _init_watchlist()
    tickers = [w["ticker"] for w in watchlist]
    prices = _get_live_prices(tickers)
    buy_zone = [{"ticker": w["ticker"], "price": prices.get(w["ticker"], {}).get("price", 0), "target": w["target"]}
        for w in watchlist if prices.get(w["ticker"], {}).get("price", 0) and w["target"] and prices.get(w["ticker"], {}).get("price", 0) <= w["target"] * 1.02]
    movers = sorted([{"ticker": w["ticker"], "change_pct": prices.get(w["ticker"], {}).get("change_pct", 0), "price": prices.get(w["ticker"], {}).get("price", 0)} for w in watchlist], key=lambda x: abs(x["change_pct"]), reverse=True)
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    upcoming = sorted([json.loads(c) for c in rdb.lrange(CATALYSTS_KEY, 0, -1) if json.loads(c).get("date", "") >= today], key=lambda x: x.get("date", ""))
    return {"buy_zone_count": len(buy_zone), "buy_zone_tickers": buy_zone[:5], "top_movers": movers[:5],
        "worst_movers": sorted(movers, key=lambda x: x["change_pct"])[:5], "upcoming_catalysts": upcoming[:5],
        "research_count": rdb.llen(RESEARCH_KEY), "thesis_count": rdb.llen(THESIS_KEY),
        "total_tickers": len(watchlist), "updated_at": datetime.now(timezone.utc).isoformat()}

# ============================================================
# To integrate: from photonics_api import router as photonics_router
#               app.include_router(photonics_router)
# Required: pip install anthropic yfinance redis numpy
# ============================================================
