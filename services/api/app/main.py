"""
Stock Platform API — v4.0
Full-featured backend with Robinhood integration, yfinance charts,
and all frontend-compatible endpoints.
"""

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime, timezone, timedelta
import asyncio, json, os, traceback, uuid, math

import redis, httpx

# ── Load .env file ──────────────────────────────────────────────────────
_env_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), ".env")
if os.path.exists(_env_path):
    with open(_env_path) as _f:
        for _line in _f:
            _line = _line.strip()
            if _line and not _line.startswith("#") and "=" in _line:
                _k, _v = _line.split("=", 1)
                os.environ.setdefault(_k.strip(), _v.strip())

# ── yfinance ────────────────────────────────────────────────────────────
try:
    import feedparser
except ImportError:
    feedparser = None

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

# ── Robinhood ───────────────────────────────────────────────────────────
try:
    import robin_stocks.robinhood as rs
    RH_AVAILABLE = True
except ImportError:
    rs = None
    RH_AVAILABLE = False

# ── Config ──────────────────────────────────────────────────────────────
FINN_KEY   = os.getenv("FINNHUB_API_KEY", "")
ALPHA_KEY  = os.getenv("ALPHA_VANTAGE_KEY", "")
REDIS_URL  = os.getenv("REDIS_URL", "redis://localhost:6379")
ANTHROPIC_KEY = os.getenv("ANTHROPIC_API_KEY", "")
RH_EMAIL   = os.getenv("RH_EMAIL", "")
RH_PASSWORD= os.getenv("RH_PASSWORD", "")

app = FastAPI(title="Stock Platform API", version="4.0.0")
from app.photonics_api import router as photonics_router
from app.photonics_technicals import router as photonics_technicals_router
from app.photonics_portfolio import router as photonics_portfolio_router
from app.photonics_advanced import router as photonics_advanced_router
app.include_router(photonics_router)
app.include_router(photonics_technicals_router)
app.include_router(photonics_portfolio_router)
app.include_router(photonics_advanced_router)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], allow_methods=["*"],
    allow_headers=["*"], allow_credentials=True,
)

rdb = redis.from_url(REDIS_URL, decode_responses=True)

# ── Robinhood session state ─────────────────────────────────────────────
rh_logged_in = False

# ── Redis keys ──────────────────────────────────────────────────────────
ALERTS_KEY       = "alerts:rules"
TRIGGERED_KEY    = "alerts:triggered"
CONVICTIONS_KEY  = "convictions:list"
WATCHLIST_KEY    = "watchlist:tickers"
JOURNAL_KEY      = "journal:trades"
NEWS_CACHE       = "cache:news"
MACRO_KEY        = "cache:macro:quotes"
KEYWORDS_KEY     = "keywords:set"
NEWS_ALERTS_KEY  = "news:alerts"
BREAKING_KEY     = "breaking:alerts"
CALENDAR_CACHE   = "cache:calendar"

# ── Macro symbols ───────────────────────────────────────────────────────
MACRO_SYMBOLS = {
    "SPY": "S&P 500 ETF", "QQQ": "Nasdaq 100 ETF", "DIA": "Dow 30 ETF",
    "IWM": "Russell 2000", "GLD": "Gold ETF", "TLT": "20Y Treasury",
    "BTC-USD": "Bitcoin", "ETH-USD": "Ethereum",
    "USO": "Oil ETF", "XLF": "Financials", "XLE": "Energy", "XLK": "Tech",
    "AAPL": "Apple", "MSFT": "Microsoft", "NVDA": "NVIDIA",
    "TSLA": "Tesla", "AMZN": "Amazon", "META": "Meta", "GOOGL": "Google",
}

# ── Pydantic models ────────────────────────────────────────────────────
class AlertRule(BaseModel):
    ticker: str
    condition: str = Field(..., pattern="^(above|below)$")
    price: float

class ConvictionIn(BaseModel):
    trader: str = ""
    ticker: str
    thesis: str = ""
    entry_target: float = 0
    price_target: float = 0
    status: str = "watching"
    notes: str = ""

class ConvictionPatch(BaseModel):
    status: Optional[str] = None
    thesis: Optional[str] = None
    entry_target: Optional[float] = None
    price_target: Optional[float] = None
    notes: Optional[str] = None

class TradeEntry(BaseModel):
    ticker: str
    side: str = Field(..., pattern="^(long|short)$")
    entry_price: float
    quantity: float
    exit_price: Optional[float] = None
    stop_loss: Optional[float] = None
    take_profit: Optional[float] = None
    notes: Optional[str] = None
    tags: Optional[list[str]] = []

class TradeUpdate(BaseModel):
    exit_price: Optional[float] = None
    stop_loss: Optional[float] = None
    take_profit: Optional[float] = None
    notes: Optional[str] = None
    tags: Optional[list[str]] = None
    status: Optional[str] = Field(None, pattern="^(open|closed|cancelled)$")

# ── Utility ─────────────────────────────────────────────────────────────
async def finnhub_get(path: str, params: dict = {}) -> dict:
    if not FINN_KEY:
        raise ValueError("FINNHUB_API_KEY not set")
    params["token"] = FINN_KEY
    async with httpx.AsyncClient(timeout=10) as c:
        r = await c.get(f"https://finnhub.io/api/v1{path}", params=params)
        r.raise_for_status()
        return r.json()

async def alpha_get(function: str, params: dict = {}) -> dict:
    params.update({"function": function, "apikey": ALPHA_KEY})
    async with httpx.AsyncClient(timeout=15) as c:
        r = await c.get("https://www.alphavantage.co/query", params=params)
        r.raise_for_status()
        return r.json()

def safe_float(val, default=None):
    try:
        return float(val)
    except (TypeError, ValueError):
        return default


# ═══════════════════════════════════════════════════════════════════════
#  HEALTH
# ═══════════════════════════════════════════════════════════════════════
@app.get("/health")
async def health():
    try:
        rdb.ping()
        redis_ok = True
    except Exception:
        redis_ok = False
    return {
        "status": "ok", "redis": redis_ok, "version": "4.0.0",
        "robinhood": rh_logged_in, "yfinance": yf is not None,
    }


# ═══════════════════════════════════════════════════════════════════════
#  MACRO / TICKER TAPE
#  Frontend expects: GET /macro/refresh → {data: [{symbol,label,price,change,change_pct}]}
# ═══════════════════════════════════════════════════════════════════════
@app.get("/macro/refresh")
async def macro_refresh():
    cached = rdb.get(MACRO_KEY)
    if cached:
        return {"data": json.loads(cached)}

    # Try yfinance first (free, no key needed)
    if yf:
        results = []
        for sym, label in MACRO_SYMBOLS.items():
            try:
                t = yf.Ticker(sym)
                info = t.fast_info
                price = getattr(info, "last_price", None)
                prev  = getattr(info, "previous_close", None)
                change = round(price - prev, 2) if price and prev else None
                change_pct = round((change / prev) * 100, 2) if change and prev else None
                results.append({"symbol": sym, "label": label, "price": round(price, 2) if price else None, "change": change, "change_pct": change_pct})
            except Exception:
                results.append({"symbol": sym, "label": label, "price": None, "change": None, "change_pct": None})
        rdb.setex(MACRO_KEY, 25, json.dumps(results))
        return {"data": results}

    # Fallback to Finnhub
    results = []
    for sym, label in MACRO_SYMBOLS.items():
        try:
            data = await finnhub_get("/quote", {"symbol": sym})
            results.append({"symbol": sym, "label": label, "price": safe_float(data.get("c")), "change": safe_float(data.get("d")), "change_pct": safe_float(data.get("dp"))})
        except Exception:
            results.append({"symbol": sym, "label": label, "price": None, "change": None, "change_pct": None})
    rdb.setex(MACRO_KEY, 25, json.dumps(results))
    return {"data": results}


# ═══════════════════════════════════════════════════════════════════════
#  QUOTES
#  Frontend expects: GET /quotes?tickers=X,Y → {data: [{ticker,price,...}]}
# ═══════════════════════════════════════════════════════════════════════
@app.get("/quotes")
async def get_quotes(tickers: str = Query(...)):
    symbols = [t.strip().upper() for t in tickers.split(",") if t.strip()]
    if not symbols:
        raise HTTPException(400, "No tickers provided")

    results = []
    for sym in symbols:
        try:
            data = await finnhub_get("/quote", {"symbol": sym})
            profile = {}
            try:
                profile = await finnhub_get("/stock/profile2", {"symbol": sym})
            except Exception:
                pass
            results.append({
                "ticker": sym,
                "price": safe_float(data.get("c")),
                "change": safe_float(data.get("d")),
                "changePercent": safe_float(data.get("dp")),
                "high": safe_float(data.get("h")),
                "low": safe_float(data.get("l")),
                "open": safe_float(data.get("o")),
                "prevClose": safe_float(data.get("pc")),
                "name": profile.get("name", sym),
                "industry": profile.get("finnhubIndustry", ""),
                "marketCap": profile.get("marketCapitalization", 0),
                "logo": profile.get("logo", ""),
            })
        except Exception as e:
            results.append({"ticker": sym, "price": None, "error": str(e)})
    return {"data": results}


# ═══════════════════════════════════════════════════════════════════════
#  WATCHLIST
#  Frontend expects: GET /watchlist → {tickers: string[]}
#  Frontend expects: POST /watchlist body:{ticker}
#  Frontend expects: DELETE /watchlist/{ticker}
# ═══════════════════════════════════════════════════════════════════════
@app.get("/watchlist")
async def get_watchlist():
    tickers = rdb.smembers(WATCHLIST_KEY)
    return {"tickers": sorted(tickers)}

@app.post("/watchlist")
async def add_to_watchlist(data: dict):
    t = data.get("ticker", "").strip().upper()
    if not t:
        raise HTTPException(400, "No ticker")
    rdb.sadd(WATCHLIST_KEY, t)
    return {"added": t}

@app.delete("/watchlist/{ticker}")
async def remove_from_watchlist(ticker: str):
    t = ticker.strip().upper()
    rdb.srem(WATCHLIST_KEY, t)
    return {"removed": t}


# ═══════════════════════════════════════════════════════════════════════
#  TECHNICAL INDICATORS (yfinance)
# ═══════════════════════════════════════════════════════════════════════
def compute_sma(closes, period):
    result = []
    for i in range(len(closes)):
        if i < period - 1:
            result.append(None)
        else:
            result.append(sum(closes[i - period + 1:i + 1]) / period)
    return result

def compute_ema(closes, period):
    result = []
    k = 2 / (period + 1)
    for i, c in enumerate(closes):
        if i < period - 1:
            result.append(None)
        elif i == period - 1:
            result.append(sum(closes[:period]) / period)
        else:
            result.append(c * k + result[-1] * (1 - k))
    return result

def compute_rsi(closes, period=14):
    result = [None] * period
    gains, losses = [], []
    for i in range(1, len(closes)):
        diff = closes[i] - closes[i - 1]
        gains.append(max(diff, 0))
        losses.append(max(-diff, 0))
    if len(gains) < period:
        return [None] * len(closes)
    avg_gain = sum(gains[:period]) / period
    avg_loss = sum(losses[:period]) / period
    if avg_loss == 0:
        result.append(100.0)
    else:
        result.append(100 - 100 / (1 + avg_gain / avg_loss))
    for i in range(period, len(gains)):
        avg_gain = (avg_gain * (period - 1) + gains[i]) / period
        avg_loss = (avg_loss * (period - 1) + losses[i]) / period
        if avg_loss == 0:
            result.append(100.0)
        else:
            result.append(100 - 100 / (1 + avg_gain / avg_loss))
    return result

def compute_macd(closes):
    ema12 = compute_ema(closes, 12)
    ema26 = compute_ema(closes, 26)
    macd_line = []
    for a, b in zip(ema12, ema26):
        if a is not None and b is not None:
            macd_line.append(a - b)
        else:
            macd_line.append(None)
    valid = [v for v in macd_line if v is not None]
    signal = compute_ema(valid, 9) if len(valid) >= 9 else [None] * len(valid)
    pad = len(macd_line) - len(signal)
    signal = [None] * pad + signal
    histogram = []
    for m, s in zip(macd_line, signal):
        if m is not None and s is not None:
            histogram.append(m - s)
        else:
            histogram.append(None)
    return {"macd": macd_line, "signal": signal, "histogram": histogram}


@app.get("/technicals/{ticker}")
async def get_technicals(
    ticker: str,
    period: str = Query("3m", pattern="^(1m|3m|6m|1y)$"),
):
    t = ticker.strip().upper()

    if yf is None:
        raise HTTPException(500, "yfinance not installed")

    period_map = {"1m": "3mo", "3m": "3mo", "6m": "6mo", "1y": "1y"}
    yf_period = period_map.get(period, "3mo")

    try:
        stock = yf.Ticker(t)
        df = stock.history(period=yf_period, interval="1d")
        if df.empty:
            raise ValueError("No data returned")
    except Exception as e:
        raise HTTPException(404, f"Could not fetch data for {t}: {e}")

    dates   = [d.strftime("%Y-%m-%d") for d in df.index]
    closes  = [round(float(v), 4) for v in df["Close"]]
    opens   = [round(float(v), 4) for v in df["Open"]]
    highs   = [round(float(v), 4) for v in df["High"]]
    lows    = [round(float(v), 4) for v in df["Low"]]
    volumes = [int(v) for v in df["Volume"]]

    sma20     = compute_sma(closes, 20)
    sma50     = compute_sma(closes, 50)
    ema12     = compute_ema(closes, 12)
    ema26     = compute_ema(closes, 26)
    rsi_vals  = compute_rsi(closes, 14)
    macd_data = compute_macd(closes)

    candles = []
    for i in range(len(dates)):
        candles.append({
            "date": dates[i],
            "open": opens[i], "high": highs[i],
            "low": lows[i], "close": closes[i],
            "volume": volumes[i],
            "sma20": round(sma20[i], 4) if sma20[i] is not None else None,
            "sma50": round(sma50[i], 4) if sma50[i] is not None else None,
            "ema12": round(ema12[i], 4) if ema12[i] is not None else None,
            "ema26": round(ema26[i], 4) if ema26[i] is not None else None,
            "rsi": round(rsi_vals[i], 2) if i < len(rsi_vals) and rsi_vals[i] is not None else None,
            "macd": round(macd_data["macd"][i], 4) if i < len(macd_data["macd"]) and macd_data["macd"][i] is not None else None,
            "macdSignal": round(macd_data["signal"][i], 4) if i < len(macd_data["signal"]) and macd_data["signal"][i] is not None else None,
            "macdHist": round(macd_data["histogram"][i], 4) if i < len(macd_data["histogram"]) and macd_data["histogram"][i] is not None else None,
        })
    return {"ticker": t, "period": period, "candles": candles}


# ═══════════════════════════════════════════════════════════════════════
#  TRADE JOURNAL
# ═══════════════════════════════════════════════════════════════════════
@app.get("/journal")
async def get_journal(status: Optional[str] = None):
    raw = rdb.lrange(JOURNAL_KEY, 0, -1)
    trades = [json.loads(r) for r in raw]
    if status:
        trades = [t for t in trades if t.get("status") == status]
    closed = [t for t in trades if t.get("status") == "closed" and t.get("exit_price")]
    total_pnl = 0
    wins = 0
    for t in closed:
        if t["side"] == "long":
            pnl = (t["exit_price"] - t["entry_price"]) * t["quantity"]
        else:
            pnl = (t["entry_price"] - t["exit_price"]) * t["quantity"]
        t["pnl"] = round(pnl, 2)
        total_pnl += pnl
        if pnl > 0:
            wins += 1
    win_rate = (wins / len(closed) * 100) if closed else 0
    return {
        "trades": trades,
        "stats": {
            "total_trades": len(trades),
            "open_trades": len([t for t in trades if t.get("status") == "open"]),
            "closed_trades": len(closed),
            "total_pnl": round(total_pnl, 2),
            "win_rate": round(win_rate, 1),
        },
    }

@app.post("/journal")
async def add_trade(entry: TradeEntry):
    trade = {
        "id": str(uuid.uuid4())[:8],
        "ticker": entry.ticker.upper(),
        "side": entry.side,
        "entry_price": entry.entry_price,
        "quantity": entry.quantity,
        "exit_price": entry.exit_price,
        "stop_loss": entry.stop_loss,
        "take_profit": entry.take_profit,
        "notes": entry.notes or "",
        "tags": entry.tags or [],
        "status": "closed" if entry.exit_price else "open",
        "opened_at": datetime.now(timezone.utc).isoformat(),
        "closed_at": datetime.now(timezone.utc).isoformat() if entry.exit_price else None,
    }
    rdb.rpush(JOURNAL_KEY, json.dumps(trade))
    return trade

@app.put("/journal/{trade_id}")
async def update_trade(trade_id: str, update: TradeUpdate):
    raw = rdb.lrange(JOURNAL_KEY, 0, -1)
    for i, r in enumerate(raw):
        trade = json.loads(r)
        if trade["id"] == trade_id:
            if update.exit_price is not None:
                trade["exit_price"] = update.exit_price
                trade["status"] = "closed"
                trade["closed_at"] = datetime.now(timezone.utc).isoformat()
            if update.stop_loss is not None:
                trade["stop_loss"] = update.stop_loss
            if update.take_profit is not None:
                trade["take_profit"] = update.take_profit
            if update.notes is not None:
                trade["notes"] = update.notes
            if update.tags is not None:
                trade["tags"] = update.tags
            if update.status is not None:
                trade["status"] = update.status
                if update.status == "closed":
                    trade["closed_at"] = datetime.now(timezone.utc).isoformat()
            rdb.lset(JOURNAL_KEY, i, json.dumps(trade))
            return trade
    raise HTTPException(404, "Trade not found")

@app.delete("/journal/{trade_id}")
async def delete_trade(trade_id: str):
    raw = rdb.lrange(JOURNAL_KEY, 0, -1)
    for r in raw:
        trade = json.loads(r)
        if trade["id"] == trade_id:
            rdb.lrem(JOURNAL_KEY, 1, r)
            return {"deleted": trade_id}
    raise HTTPException(404, "Trade not found")


# ═══════════════════════════════════════════════════════════════════════
#  EARNINGS CALENDAR
# ═══════════════════════════════════════════════════════════════════════
@app.get("/earnings")
async def get_earnings(
    from_date: Optional[str] = None,
    to_date: Optional[str] = None,
    ticker: Optional[str] = None,
):
    today = datetime.now(timezone.utc).date()
    f = from_date or today.isoformat()
    t = to_date or (today + timedelta(days=14)).isoformat()
    try:
        data = await finnhub_get("/calendar/earnings", {"from": f, "to": t})
        earnings = data.get("earningsCalendar", [])
    except Exception:
        earnings = []
    if ticker:
        ticker_upper = ticker.strip().upper()
        earnings = [e for e in earnings if e.get("symbol", "").upper() == ticker_upper]
    earnings.sort(key=lambda x: x.get("date", ""))
    return {"from": f, "to": t, "count": len(earnings), "earnings": earnings}


# ═══════════════════════════════════════════════════════════════════════
#  PORTFOLIO
#  Frontend expects: GET /portfolio/{name} → {holdings: {TICKER: {shares, cost_basis}}}
#  Frontend expects: POST /portfolio/{name} body:{ticker,shares,cost_basis}
#  Frontend expects: DELETE /portfolio/{name}/{ticker}
# ═══════════════════════════════════════════════════════════════════════
@app.get("/portfolio/{name}")
async def get_portfolio(name: str):
    raw = rdb.get(f"portfolio:{name}")
    if not raw:
        return {"name": name, "holdings": {}, "cash": 0}
    data = json.loads(raw)
    holdings = data.get("holdings", {})
    if isinstance(holdings, list):
        h_dict = {}
        for item in holdings:
            t = item.get("ticker", "")
            if t:
                h_dict[t] = {"shares": item.get("shares", 0), "cost_basis": item.get("cost_basis", 0)}
        holdings = h_dict
    return {"name": name, "holdings": holdings, "cash": data.get("cash", 0)}

@app.post("/portfolio/{name}")
async def save_portfolio(name: str, data: dict):
    ticker = data.get("ticker", "").strip().upper()
    shares = safe_float(data.get("shares"), 0)
    cost_basis = safe_float(data.get("cost_basis"), 0)
    if not ticker:
        raise HTTPException(400, "No ticker")
    raw = rdb.get(f"portfolio:{name}")
    port = json.loads(raw) if raw else {"holdings": {}, "cash": 0}
    holdings = port.get("holdings", {})
    if isinstance(holdings, list):
        h_dict = {}
        for item in holdings:
            t = item.get("ticker", "")
            if t:
                h_dict[t] = {"shares": item.get("shares", 0), "cost_basis": item.get("cost_basis", 0)}
        holdings = h_dict
    holdings[ticker] = {"shares": shares, "cost_basis": cost_basis}
    port["holdings"] = holdings
    rdb.set(f"portfolio:{name}", json.dumps(port))
    return {"saved": ticker}

@app.delete("/portfolio/{name}/{ticker}")
async def delete_portfolio_holding(name: str, ticker: str):
    t = ticker.strip().upper()
    raw = rdb.get(f"portfolio:{name}")
    if not raw:
        raise HTTPException(404, "Portfolio not found")
    port = json.loads(raw)
    holdings = port.get("holdings", {})
    if isinstance(holdings, list):
        h_dict = {}
        for item in holdings:
            tk = item.get("ticker", "")
            if tk:
                h_dict[tk] = {"shares": item.get("shares", 0), "cost_basis": item.get("cost_basis", 0)}
        holdings = h_dict
    holdings.pop(t, None)
    port["holdings"] = holdings
    rdb.set(f"portfolio:{name}", json.dumps(port))
    return {"deleted": t}

@app.post("/portfolio/{name}/snapshot")
async def snapshot_portfolio(name: str):
    raw = rdb.get(f"portfolio:{name}")
    if not raw:
        raise HTTPException(404, "Portfolio not found")
    port = json.loads(raw)
    total = port.get("cash", 0)
    holdings = port.get("holdings", {})
    if isinstance(holdings, dict):
        for ticker, h in holdings.items():
            try:
                q = await finnhub_get("/quote", {"symbol": ticker})
                total += q.get("c", 0) * h.get("shares", 0)
            except Exception:
                pass
    snapshot = {"date": datetime.now(timezone.utc).isoformat(), "value": round(total, 2)}
    rdb.rpush(f"portfolio:{name}:history", json.dumps(snapshot))
    return snapshot

@app.get("/portfolio/{name}/history")
async def portfolio_history(name: str):
    raw = rdb.lrange(f"portfolio:{name}:history", 0, -1)
    return [json.loads(r) for r in raw]


# ═══════════════════════════════════════════════════════════════════════
#  OPTIONS
# ═══════════════════════════════════════════════════════════════════════
@app.get("/options/{ticker}")
async def get_options(ticker: str):
    t = ticker.strip().upper()
    try:
        chain = await finnhub_get("/stock/option-chain", {"symbol": t})
        return chain
    except Exception as e:
        raise HTTPException(500, str(e))

@app.get("/options/{ticker}/unusual")
async def unusual_options(ticker: str):
    t = ticker.strip().upper()
    try:
        chain = await finnhub_get("/stock/option-chain", {"symbol": t})
    except Exception as e:
        raise HTTPException(500, str(e))
    unusual = []
    for exp in chain.get("data", []):
        for opt in exp.get("options", {}).get("CALL", []) + exp.get("options", {}).get("PUT", []):
            vol = opt.get("volume", 0) or 0
            oi = opt.get("openInterest", 0) or 1
            if vol > 200 and vol > oi * 0.5:
                unusual.append({
                    "strike": opt.get("strike"),
                    "type": opt.get("contractType", "unknown"),
                    "expiration": exp.get("expirationDate"),
                    "volume": vol, "openInterest": oi,
                    "volOiRatio": round(vol / max(oi, 1), 2),
                    "lastPrice": opt.get("lastPrice"),
                    "impliedVol": opt.get("impliedVolatility"),
                })
    unusual.sort(key=lambda x: x["volOiRatio"], reverse=True)
    return {"ticker": t, "unusual": unusual[:20]}


# ═══════════════════════════════════════════════════════════════════════
#  ALERTS
# ═══════════════════════════════════════════════════════════════════════
@app.get("/alerts")
async def get_alerts():
    rules = [json.loads(r) for r in rdb.lrange(ALERTS_KEY, 0, -1)]
    triggered = [json.loads(r) for r in rdb.lrange(TRIGGERED_KEY, 0, -1)]
    return {"rules": rules, "triggered": triggered}

@app.post("/alerts")
async def create_alert(rule: AlertRule):
    entry = {
        "id": str(uuid.uuid4())[:8],
        "ticker": rule.ticker.upper(),
        "condition": rule.condition,
        "price": rule.price,
        "active": True,
        "created": datetime.now(timezone.utc).isoformat(),
    }
    rdb.rpush(ALERTS_KEY, json.dumps(entry))
    return entry

@app.delete("/alerts/{alert_id}")
async def delete_alert(alert_id: str):
    raw = rdb.lrange(ALERTS_KEY, 0, -1)
    for r in raw:
        a = json.loads(r)
        if a["id"] == alert_id:
            rdb.lrem(ALERTS_KEY, 1, r)
            return {"deleted": alert_id}
    raise HTTPException(404, "Alert not found")


# ═══════════════════════════════════════════════════════════════════════
#  CONVICTIONS
#  Frontend expects: GET /convictions → {convictions: [...]}
#  PATCH /convictions/{id} body:{status}
# ═══════════════════════════════════════════════════════════════════════
@app.get("/convictions")
async def get_convictions():
    raw = rdb.lrange(CONVICTIONS_KEY, 0, -1)
    convictions = [json.loads(r) for r in raw]
    return {"convictions": convictions}

@app.post("/convictions")
async def add_conviction(c: ConvictionIn):
    entry = {
        "id": str(uuid.uuid4())[:8],
        "trader": c.trader,
        "ticker": c.ticker.upper(),
        "thesis": c.thesis,
        "entry_target": c.entry_target,
        "price_target": c.price_target,
        "status": c.status,
        "notes": c.notes,
        "created": datetime.now(timezone.utc).isoformat(),
    }
    rdb.rpush(CONVICTIONS_KEY, json.dumps(entry))
    return entry

@app.patch("/convictions/{cid}")
async def patch_conviction(cid: str, update: ConvictionPatch):
    raw = rdb.lrange(CONVICTIONS_KEY, 0, -1)
    for i, r in enumerate(raw):
        c = json.loads(r)
        if c["id"] == cid:
            if update.status is not None: c["status"] = update.status
            if update.thesis is not None: c["thesis"] = update.thesis
            if update.entry_target is not None: c["entry_target"] = update.entry_target
            if update.price_target is not None: c["price_target"] = update.price_target
            if update.notes is not None: c["notes"] = update.notes
            rdb.lset(CONVICTIONS_KEY, i, json.dumps(c))
            return c
    raise HTTPException(404, "Conviction not found")

@app.delete("/convictions/{cid}")
async def delete_conviction(cid: str):
    raw = rdb.lrange(CONVICTIONS_KEY, 0, -1)
    for r in raw:
        c = json.loads(r)
        if c["id"] == cid:
            rdb.lrem(CONVICTIONS_KEY, 1, r)
            return {"deleted": cid}
    raise HTTPException(404, "Conviction not found")


# ═══════════════════════════════════════════════════════════════════════
#  NEWS
#  Frontend expects: GET /news → {articles: [{title,source,link,published,summary}]}
# ═══════════════════════════════════════════════════════════════════════
def _map_finnhub_news(items):
    result = []
    for n in items:
        result.append({
            "title": n.get("headline", ""),
            "source": n.get("source", ""),
            "link": n.get("url", ""),
            "published": datetime.fromtimestamp(
                n.get("datetime", 0), tz=timezone.utc
            ).isoformat() if n.get("datetime") else "",
            "summary": n.get("summary", ""),
        })
    return result

@app.get("/news/alerts/clear")
async def clear_news_alerts():
    rdb.delete(NEWS_ALERTS_KEY)
    return {"cleared": True}

@app.get("/news/alerts")
async def get_news_alerts():
    raw = rdb.lrange(NEWS_ALERTS_KEY, 0, -1)
    return {"alerts": [json.loads(r) for r in raw]}

@app.get("/news/refresh")
async def refresh_news():
    try:
        data = await finnhub_get("/news", {"category": "general"})
        items = data[:30] if isinstance(data, list) else []
        articles = _map_finnhub_news(items)
        rdb.setex(f"{NEWS_CACHE}:general", 300, json.dumps(articles))
        keywords = rdb.smembers(KEYWORDS_KEY)
        if keywords:
            for article in articles:
                title_lower = (article.get("title", "") + " " + article.get("summary", "")).lower()
                matched = [k for k in keywords if k.lower() in title_lower]
                if matched:
                    alert_entry = {**article, "keywords": matched}
                    rdb.lpush(NEWS_ALERTS_KEY, json.dumps(alert_entry))
            rdb.ltrim(NEWS_ALERTS_KEY, 0, 49)
        return {"articles": articles}
    except Exception as e:
        print(f"News refresh error: {e}")
        return {"articles": []}

@app.get("/news/{ticker}")
async def get_ticker_news(ticker: str):
    t = ticker.strip().upper()
    today = datetime.now(timezone.utc).date()
    week_ago = today - timedelta(days=7)
    try:
        data = await finnhub_get("/company-news", {
            "symbol": t, "from": week_ago.isoformat(), "to": today.isoformat()
        })
        items = data[:20] if isinstance(data, list) else []
        return {"articles": _map_finnhub_news(items)}
    except Exception:
        return {"articles": []}

@app.get("/news")
async def get_news(category: str = "general"):
    cached = rdb.get(f"{NEWS_CACHE}:{category}")
    if cached:
        return {"articles": json.loads(cached)}
    try:
        data = await finnhub_get("/news", {"category": category})
        items = data[:30] if isinstance(data, list) else []
        articles = _map_finnhub_news(items)
        rdb.setex(f"{NEWS_CACHE}:{category}", 300, json.dumps(articles))
        return {"articles": articles}
    except Exception as e:
        print(f"News fetch error: {e}")
        return {"articles": []}


# ═══════════════════════════════════════════════════════════════════════
#  KEYWORDS
#  Frontend expects: GET /keywords → {keywords: string[]}
# ═══════════════════════════════════════════════════════════════════════
@app.get("/keywords")
async def get_keywords():
    kws = rdb.smembers(KEYWORDS_KEY)
    return {"keywords": sorted(kws)}

@app.post("/keywords")
async def add_keyword(data: dict):
    kw = data.get("keyword", "").strip().lower()
    if not kw:
        raise HTTPException(400, "No keyword")
    rdb.sadd(KEYWORDS_KEY, kw)
    return {"added": kw}

@app.delete("/keywords/{keyword}")
async def remove_keyword(keyword: str):
    rdb.srem(KEYWORDS_KEY, keyword)
    return {"removed": keyword}


# ═══════════════════════════════════════════════════════════════════════
#  BREAKING
#  Frontend expects: GET /breaking → {alerts: [...]}
# ═══════════════════════════════════════════════════════════════════════
@app.get("/breaking/clear")
async def clear_breaking():
    rdb.delete(BREAKING_KEY)
    return {"cleared": True}

@app.get("/breaking")
async def get_breaking():
    raw = rdb.lrange(BREAKING_KEY, 0, -1)
    return {"alerts": [json.loads(r) for r in raw]}


# ═══════════════════════════════════════════════════════════════════════
#  CALENDAR
#  Frontend expects: GET /calendar → {events: [{date,event,category,ticker?}]}
# ═══════════════════════════════════════════════════════════════════════
def _map_calendar_events(events):
    result = []
    for ev in events:
        category = "MACRO DATA"
        event_name = ev.get("event", "")
        event_lower = event_name.lower()
        if any(w in event_lower for w in ["fed", "fomc", "interest rate", "powell"]):
            category = "FED"
        elif any(w in event_lower for w in ["earnings", "revenue"]):
            category = "EARNINGS"
        elif any(w in event_lower for w in ["gdp", "cpi", "ppi", "employment", "payroll", "jobs", "unemployment", "inflation"]):
            category = "MACRO DATA"
        actual = ev.get("actual", "")
        estimate = ev.get("estimate", "")
        unit = ev.get("unit", "")
        detail = event_name
        if actual:
            detail += f" (Actual: {actual}{unit})"
        elif estimate:
            detail += f" (Est: {estimate}{unit})"
        result.append({
            "date": ev.get("date", ev.get("time", "")),
            "event": detail,
            "category": category,
            "ticker": ev.get("symbol", None),
        })
    return result

@app.get("/calendar/refresh")
async def refresh_calendar():
    today = datetime.now(timezone.utc).date()
    try:
        data = await finnhub_get("/calendar/economic", {
            "from": today.isoformat(),
            "to": (today + timedelta(days=14)).isoformat(),
        })
        raw_events = data.get("economicCalendar", {}).get("result", [])
        events = _map_calendar_events(raw_events)
        rdb.setex(CALENDAR_CACHE, 600, json.dumps(events))
        return {"events": events}
    except Exception as e:
        print(f"Calendar refresh error: {e}")
        return {"events": []}

@app.get("/calendar")
async def economic_calendar():
    cached = rdb.get(CALENDAR_CACHE)
    if cached:
        return {"events": json.loads(cached)}
    today = datetime.now(timezone.utc).date()
    try:
        data = await finnhub_get("/calendar/economic", {
            "from": today.isoformat(),
            "to": (today + timedelta(days=14)).isoformat(),
        })
        raw_events = data.get("economicCalendar", {}).get("result", [])
        events = _map_calendar_events(raw_events)
        rdb.setex(CALENDAR_CACHE, 600, json.dumps(events))
        return {"events": events}
    except Exception as e:
        print(f"Calendar fetch error: {e}")
        return {"events": []}


# ═══════════════════════════════════════════════════════════════════════
#  ROBINHOOD INTEGRATION
# ═══════════════════════════════════════════════════════════════════════

@app.get("/rh/status")
async def rh_status():
    return {
        "available": RH_AVAILABLE,
        "logged_in": rh_logged_in,
        "email": RH_EMAIL[:3] + "***" if RH_EMAIL else None,
    }

@app.post("/rh/login")
async def rh_login(data: dict = {}):
    global rh_logged_in
    if not RH_AVAILABLE:
        raise HTTPException(500, "robin_stocks not installed")
    if not RH_EMAIL or not RH_PASSWORD:
        raise HTTPException(400, "RH_EMAIL and RH_PASSWORD not set in .env")

    mfa_code = data.get("mfa_code", None)

    try:
        login_args = {
            "username": RH_EMAIL,
            "password": RH_PASSWORD,
            "store_session": True,
            "expiresIn": 86400,
        }
        if mfa_code:
            login_args["mfa_code"] = str(mfa_code)

        result = rs.login(**login_args)
        rh_logged_in = True
        return {"status": "logged_in", "message": "Robinhood connected!"}
    except Exception as e:
        error_msg = str(e)
        if "mfa" in error_msg.lower() or "challenge" in error_msg.lower():
            return {"status": "mfa_required", "message": "Check your phone/email for the MFA code, then POST /rh/login with {mfa_code: '123456'}"}
        raise HTTPException(401, f"Login failed: {error_msg}")

@app.post("/rh/logout")
async def rh_logout():
    global rh_logged_in
    if RH_AVAILABLE and rh_logged_in:
        try:
            rs.logout()
        except Exception:
            pass
    rh_logged_in = False
    return {"status": "logged_out"}

@app.get("/rh/portfolio")
async def rh_portfolio():
    if not rh_logged_in:
        raise HTTPException(401, "Not logged in to Robinhood. POST /rh/login first.")
    try:
        holdings = rs.build_holdings()
        result = {}
        for ticker, info in holdings.items():
            result[ticker] = {
                "shares": safe_float(info.get("quantity"), 0),
                "avg_cost": safe_float(info.get("average_buy_price"), 0),
                "current_price": safe_float(info.get("price"), 0),
                "equity": safe_float(info.get("equity"), 0),
                "pnl": safe_float(info.get("equity_change"), 0),
                "pnl_pct": safe_float(info.get("percent_change"), 0),
                "name": info.get("name", ticker),
            }
        # Also get account info
        profile = rs.load_portfolio_profile()
        return {
            "holdings": result,
            "equity": safe_float(profile.get("equity")),
            "market_value": safe_float(profile.get("market_value")),
            "cash": safe_float(profile.get("withdrawable_amount")),
            "buying_power": safe_float(profile.get("excess_margin")),
        }
    except Exception as e:
        raise HTTPException(500, f"Failed to load RH portfolio: {e}")

@app.get("/rh/orders")
async def rh_orders(limit: int = 50):
    if not rh_logged_in:
        raise HTTPException(401, "Not logged in to Robinhood. POST /rh/login first.")
    try:
        orders = rs.get_all_stock_orders()
        result = []
        for o in orders[:limit]:
            result.append({
                "id": o.get("id", ""),
                "ticker": o.get("instrument_id", ""),  # need to resolve
                "side": o.get("side", ""),
                "type": o.get("type", ""),
                "state": o.get("state", ""),
                "quantity": safe_float(o.get("quantity")),
                "price": safe_float(o.get("price")) or safe_float(o.get("average_price")),
                "created_at": o.get("created_at", ""),
                "updated_at": o.get("updated_at", ""),
            })
        return {"orders": result, "count": len(result)}
    except Exception as e:
        raise HTTPException(500, f"Failed to load RH orders: {e}")

@app.get("/rh/options/{ticker}")
async def rh_options(ticker: str):
    if not rh_logged_in:
        raise HTTPException(401, "Not logged in to Robinhood. POST /rh/login first.")
    t = ticker.strip().upper()
    try:
        chains = rs.get_chains(t)
        expirations = chains.get("expiration_dates", [])
        result = {"ticker": t, "expirations": expirations[:8], "chains": []}

        # Get first 3 expirations
        for exp in expirations[:3]:
            try:
                options = rs.find_options_by_expiration(
                    [t], expirationDate=exp, optionType="both"
                )
                for opt in options[:20]:
                    result["chains"].append({
                        "expiration": exp,
                        "strike": safe_float(opt.get("strike_price")),
                        "type": opt.get("type", ""),
                        "bid": safe_float(opt.get("bid_price")),
                        "ask": safe_float(opt.get("ask_price")),
                        "last": safe_float(opt.get("last_trade_price")),
                        "volume": safe_float(opt.get("volume"), 0),
                        "open_interest": safe_float(opt.get("open_interest"), 0),
                        "implied_vol": safe_float(opt.get("implied_volatility")),
                        "delta": safe_float(opt.get("delta")),
                        "gamma": safe_float(opt.get("gamma")),
                        "theta": safe_float(opt.get("theta")),
                    })
            except Exception:
                pass
        return result
    except Exception as e:
        raise HTTPException(500, f"Failed to load RH options: {e}")

@app.get("/rh/historicals/{ticker}")
async def rh_historicals(
    ticker: str,
    interval: str = Query("day", pattern="^(5minute|10minute|hour|day|week)$"),
    span: str = Query("year", pattern="^(day|week|month|3month|year|5year)$"),
):
    if not rh_logged_in:
        raise HTTPException(401, "Not logged in to Robinhood. POST /rh/login first.")
    t = ticker.strip().upper()
    try:
        data = rs.get_stock_historicals(t, interval=interval, span=span)
        candles = []
        for d in data:
            candles.append({
                "date": d.get("begins_at", ""),
                "open": safe_float(d.get("open_price")),
                "high": safe_float(d.get("high_price")),
                "low": safe_float(d.get("low_price")),
                "close": safe_float(d.get("close_price")),
                "volume": int(safe_float(d.get("volume"), 0)),
            })
        return {"ticker": t, "interval": interval, "span": span, "candles": candles}
    except Exception as e:
        raise HTTPException(500, f"Failed to load RH historicals: {e}")




# ═══════════════════════════════════════════════════════════════════════
#  AI ANALYSIS (Claude-powered)
# ═══════════════════════════════════════════════════════════════════════
@app.get("/ai/analyze/{ticker}")
async def ai_analyze(ticker: str):
    t = ticker.strip().upper()
    if not ANTHROPIC_AVAILABLE or not ANTHROPIC_KEY:
        raise HTTPException(500, "Anthropic API key not configured")

    # Gather context data
    context_parts = []

    # Price data from yfinance
    if yf:
        try:
            stock = yf.Ticker(t)
            info = stock.info
            hist = stock.history(period="1mo", interval="1d")
            last_close = round(float(hist["Close"].iloc[-1]), 2) if not hist.empty else None
            month_ago = round(float(hist["Close"].iloc[0]), 2) if not hist.empty else None
            high_1m = round(float(hist["High"].max()), 2) if not hist.empty else None
            low_1m = round(float(hist["Low"].min()), 2) if not hist.empty else None
            avg_vol = int(hist["Volume"].mean()) if not hist.empty else None

            context_parts.append(f"""PRICE DATA for {t}:
Current Price: ${last_close}
1-Month Ago: ${month_ago}
1-Month High: ${high_1m}
1-Month Low: ${low_1m}
Avg Daily Volume: {avg_vol:,}
Market Cap: {info.get('marketCap', 'N/A')}
P/E Ratio: {info.get('trailingPE', 'N/A')}
Forward P/E: {info.get('forwardPE', 'N/A')}
EPS: {info.get('trailingEps', 'N/A')}
52-Week High: {info.get('fiftyTwoWeekHigh', 'N/A')}
52-Week Low: {info.get('fiftyTwoWeekLow', 'N/A')}
Sector: {info.get('sector', 'N/A')}
Industry: {info.get('industry', 'N/A')}
Short Name: {info.get('shortName', t)}
""")
        except Exception as e:
            context_parts.append(f"Price data unavailable: {e}")

    # Recent news from Finnhub
    try:
        today = datetime.now(timezone.utc).date()
        week_ago = today - timedelta(days=7)
        news_data = await finnhub_get("/company-news", {
            "symbol": t, "from": week_ago.isoformat(), "to": today.isoformat()
        })
        if news_data and isinstance(news_data, list):
            news_text = "RECENT NEWS:\n"
            for n in news_data[:8]:
                news_text += f"- {n.get('headline', '')} ({n.get('source', '')}): {n.get('summary', '')[:150]}\n"
            context_parts.append(news_text)
    except Exception:
        pass

    context = "\n".join(context_parts)

    prompt = f"""You are an expert stock analyst. Analyze {t} based on the data below. 
Return your analysis as a JSON object with EXACTLY this structure (no markdown, no backticks, just raw JSON):
{{
  "ticker": "{t}",
  "name": "Company Name",
  "sentiment": "bullish" or "bearish" or "neutral",
  "score": 1-10 (1=strong sell, 10=strong buy),
  "summary": "2-3 sentence executive summary",
  "bull_case": ["point 1", "point 2", "point 3"],
  "bear_case": ["point 1", "point 2", "point 3"],
  "technicals": "Brief technical analysis paragraph",
  "catalysts": ["upcoming catalyst 1", "catalyst 2"],
  "risk_factors": ["risk 1", "risk 2"],
  "price_target": {{"low": number, "mid": number, "high": number}},
  "recommendation": "BUY" or "SELL" or "HOLD" or "WATCH"
}}

DATA:
{context}

Return ONLY the JSON object, nothing else."""

    try:
        client = anthropic.Anthropic(api_key=ANTHROPIC_KEY)
        message = client.messages.create(
            model="claude-sonnet-4-20250514",
            max_tokens=1500,
            messages=[{"role": "user", "content": prompt}]
        )
        response_text = message.content[0].text.strip()
        # Clean potential markdown wrapping
        if response_text.startswith("```"):
            response_text = re.sub(r"^```(?:json)?\s*", "", response_text)
            response_text = re.sub(r"\s*```$", "", response_text)
        analysis = json.loads(response_text)
        return analysis
    except json.JSONDecodeError:
        return {"ticker": t, "error": "Failed to parse AI response", "raw": response_text[:500]}
    except Exception as e:
        raise HTTPException(500, f"AI analysis failed: {e}")


@app.get("/ai/quick/{ticker}")
async def ai_quick(ticker: str):
    """Quick sentiment check without full analysis."""
    t = ticker.strip().upper()
    if not ANTHROPIC_AVAILABLE or not ANTHROPIC_KEY:
        raise HTTPException(500, "Anthropic API key not configured")

    price_info = ""
    if yf:
        try:
            stock = yf.Ticker(t)
            hist = stock.history(period="5d", interval="1d")
            if not hist.empty:
                last = round(float(hist["Close"].iloc[-1]), 2)
                prev = round(float(hist["Close"].iloc[-2]), 2) if len(hist) > 1 else last
                change_pct = round((last - prev) / prev * 100, 2) if prev else 0
                price_info = f"Price: ${last} ({'+' if change_pct > 0 else ''}{change_pct}%)"
        except Exception:
            pass

    try:
        client = anthropic.Anthropic(api_key=ANTHROPIC_KEY)
        message = client.messages.create(
            model="claude-sonnet-4-20250514",
            max_tokens=300,
            messages=[{"role": "user", "content": f"Give a one-line sentiment for {t} stock. {price_info}. Reply with JSON: {{\"sentiment\": \"bullish/bearish/neutral\", \"score\": 1-10, \"one_liner\": \"brief reason\"}}. JSON only, no markdown."}]
        )
        text = message.content[0].text.strip()
        if text.startswith("```"):
            text = re.sub(r"^```(?:json)?\s*", "", text)
            text = re.sub(r"\s*```$", "", text)
        return json.loads(text)
    except Exception as e:
        return {"ticker": t, "sentiment": "unknown", "score": 5, "one_liner": f"Analysis unavailable: {e}"}



# ═══════════════════════════════════════════════════════════════════════
#  STOCK SCREENER (yfinance-powered)
# ═══════════════════════════════════════════════════════════════════════

# Popular stock universes
SCREENER_UNIVERSES = {
    "sp500_top": ["AAPL","MSFT","NVDA","AMZN","GOOGL","META","TSLA","BRK-B","UNH","XOM",
                  "JNJ","JPM","V","PG","MA","HD","CVX","MRK","ABBV","LLY",
                  "PEP","KO","COST","AVGO","TMO","MCD","WMT","CSCO","ACN","ABT",
                  "CRM","DHR","NEE","TXN","BMY","UPS","LIN","QCOM","PM","AMD",
                  "RTX","LOW","SCHW","MS","INTC","GS","ISRG","ELV","BLK","ADP",
                  "AMAT","MDLZ","GILD","DE","ADI","VRTX","SYK","CI","CB","MMC",
                  "PLD","CME","PYPL","REGN","SO","ZTS","DUK","EOG","CL","SNPS",
                  "TJX","BSX","NOC","MO","APD","ITW","CDNS","ORLY","FDX","PNC",
                  "SLB","EMR","HUM","AEP","GD","NXPI","KLAC","NSC","MCK","WM"],
    "tech": ["AAPL","MSFT","NVDA","GOOGL","META","TSLA","AVGO","AMD","CRM","INTC",
             "CSCO","TXN","QCOM","AMAT","NOW","ADBE","SNPS","CDNS","KLAC","NXPI",
             "MRVL","PANW","LRCX","FTNT","CRWD","NET","DDOG","ZS","MDB","SNOW",
             "PLTR","U","COIN","SQ","SHOP","ROKU","TTD","PINS","SNAP","RBLX"],
    "growth": ["NVDA","TSLA","PLTR","COIN","CRWD","DDOG","NET","ZS","MDB","SNOW",
               "SHOP","SQ","ROKU","TTD","PINS","RBLX","ABNB","DASH","UBER","LYFT",
               "PATH","BILL","HUBS","PCOR","MNDY","CFLT","ESTC","GTLB","DOCN","IOT"],
    "dividend": ["JNJ","PG","KO","PEP","MCD","WMT","HD","ABBV","MRK","CVX",
                 "XOM","PM","MO","CL","MMM","IBM","VZ","T","O","SCHD",
                 "SO","DUK","AEP","D","SRE","ED","WEC","AES","PPL","NEE"],
    "small_cap": ["IESC","MYRG","NVT","AMPS","ITRI","ERII","POWI","VICR","RBBN","ENS",
                  "WIRE","AYI","VVNT","KLIC","OSIS","ESE","COHU","MKSI","AEIS","CEVA",
                  "CALX","LSCC","DIOD","SLAB","AAON","RMBS","ONTO","FORM","CRUS","ALGM"],
    "custom": [],
}

@app.get("/screener/universes")
async def screener_universes():
    return {"universes": {k: len(v) for k, v in SCREENER_UNIVERSES.items()}}

@app.get("/screener")
async def run_screener(
    universe: str = Query("sp500_top"),
    min_market_cap: Optional[float] = None,
    max_market_cap: Optional[float] = None,
    min_pe: Optional[float] = None,
    max_pe: Optional[float] = None,
    min_volume: Optional[float] = None,
    sector: Optional[str] = None,
    min_change_pct: Optional[float] = None,
    max_change_pct: Optional[float] = None,
    sort_by: str = Query("market_cap", pattern="^(market_cap|pe|volume|change_pct|price|name|dividend_yield)$"),
    sort_dir: str = Query("desc", pattern="^(asc|desc)$"),
    limit: int = Query(50, ge=1, le=200),
    tickers: Optional[str] = None,
):
    if not yf:
        raise HTTPException(500, "yfinance not installed")

    # Get ticker list
    if tickers:
        symbols = [t.strip().upper() for t in tickers.split(",") if t.strip()]
    elif universe in SCREENER_UNIVERSES:
        symbols = SCREENER_UNIVERSES[universe]
    else:
        symbols = SCREENER_UNIVERSES["sp500_top"]

    # Check cache first
    cache_key = f"screener:{universe}:{','.join(sorted(symbols[:10]))}"
    cached = rdb.get(cache_key)
    if cached:
        results = json.loads(cached)
    else:
        results = []
        for sym in symbols:
            try:
                stock = yf.Ticker(sym)
                info = stock.info
                fast = stock.fast_info

                mkt_cap = info.get("marketCap") or getattr(fast, "market_cap", None)
                pe = info.get("trailingPE")
                fwd_pe = info.get("forwardPE")
                price = getattr(fast, "last_price", None) or info.get("currentPrice")
                prev = getattr(fast, "previous_close", None) or info.get("previousClose")
                volume = info.get("volume") or getattr(fast, "last_volume", None)
                avg_volume = info.get("averageVolume")
                change = round(price - prev, 2) if price and prev else None
                change_pct = round((change / prev) * 100, 2) if change and prev else None
                div_yield = info.get("dividendYield")
                if div_yield:
                    div_yield = round(div_yield * 100, 2)
                beta = info.get("beta")
                wk52_high = info.get("fiftyTwoWeekHigh")
                wk52_low = info.get("fiftyTwoWeekLow")
                from_52h = round((price - wk52_high) / wk52_high * 100, 2) if price and wk52_high else None
                from_52l = round((price - wk52_low) / wk52_low * 100, 2) if price and wk52_low else None

                results.append({
                    "ticker": sym,
                    "name": info.get("shortName", sym),
                    "sector": info.get("sector", ""),
                    "industry": info.get("industry", ""),
                    "price": round(price, 2) if price else None,
                    "change": change,
                    "change_pct": change_pct,
                    "market_cap": mkt_cap,
                    "pe": round(pe, 2) if pe else None,
                    "forward_pe": round(fwd_pe, 2) if fwd_pe else None,
                    "volume": volume,
                    "avg_volume": avg_volume,
                    "dividend_yield": div_yield,
                    "beta": round(beta, 2) if beta else None,
                    "wk52_high": wk52_high,
                    "wk52_low": wk52_low,
                    "from_52h_pct": from_52h,
                    "from_52l_pct": from_52l,
                    "eps": info.get("trailingEps"),
                    "revenue": info.get("totalRevenue"),
                })
            except Exception as e:
                results.append({"ticker": sym, "name": sym, "error": str(e)})

        # Cache for 2 minutes
        rdb.setex(cache_key, 120, json.dumps(results))

    # Apply filters
    filtered = results
    if min_market_cap:
        filtered = [r for r in filtered if r.get("market_cap") and r["market_cap"] >= min_market_cap]
    if max_market_cap:
        filtered = [r for r in filtered if r.get("market_cap") and r["market_cap"] <= max_market_cap]
    if min_pe:
        filtered = [r for r in filtered if r.get("pe") and r["pe"] >= min_pe]
    if max_pe:
        filtered = [r for r in filtered if r.get("pe") and r["pe"] <= max_pe]
    if min_volume:
        filtered = [r for r in filtered if r.get("volume") and r["volume"] >= min_volume]
    if sector:
        sector_lower = sector.lower()
        filtered = [r for r in filtered if sector_lower in (r.get("sector", "") or "").lower()]
    if min_change_pct is not None:
        filtered = [r for r in filtered if r.get("change_pct") is not None and r["change_pct"] >= min_change_pct]
    if max_change_pct is not None:
        filtered = [r for r in filtered if r.get("change_pct") is not None and r["change_pct"] <= max_change_pct]

    # Sort
    def sort_key(r):
        v = r.get(sort_by)
        if v is None:
            return float("-inf") if sort_dir == "desc" else float("inf")
        return v

    filtered.sort(key=sort_key, reverse=(sort_dir == "desc"))

    # Get unique sectors for filter dropdown
    all_sectors = sorted(set(r.get("sector", "") for r in results if r.get("sector")))

    return {
        "results": filtered[:limit],
        "total": len(filtered),
        "universe": universe,
        "sectors": all_sectors,
    }




# ═══════════════════════════════════════════════════════════════════════
#  RESEARCH FEEDS — Substack RSS + Stocktwits
# ═══════════════════════════════════════════════════════════════════════

SUBSTACK_FEEDS = {
    "Mispriced Assets": "https://mispricedassets.substack.com/feed",
    "AI Supremacy": "https://aisupremacy.substack.com/feed",
    "Alina Khay": "https://alinakhay.substack.com/feed",
    "Base Hit Investing": "https://basehitinvesting.substack.com/feed",
    "BiggerPicture Trading": "https://biggerpicturetrading.substack.com/feed",
    "Capitalist Letters": "https://capitalistletters.substack.com/feed",
    "Charting With KR": "https://chartingwithkr.substack.com/feed",
    "Chipstrat": "https://chipstrat.substack.com/feed",
    "The Coastal Journal": "https://thecoastaljournal.substack.com/feed",
    "Coinstack": "https://coinstack.substack.com/feed",
    "Collyer Bridge": "https://collyerbridge.substack.com/feed",
    "Coughlin Capital": "https://coughlincapital.substack.com/feed",
    "Crack The Market": "https://crackthemarket.substack.com/feed",
    "The Credit Strategist": "https://thecreditstrategist.substack.com/feed",
    "Crux Capital": "https://cruxcapital.substack.com/feed",
    "Cycles Edge": "https://cyclesedge.substack.com/feed",
    "Daniel Romero": "https://danielromero.substack.com/feed",
    "Data Driven Investing": "https://datadrivenivesting.substack.com/feed",
    "Doomberg": "https://doomberg.substack.com/feed",
    "Easy Value": "https://easyvalue.substack.com/feed",
    "Felix Nikolas Prehn": "https://felixprehn.substack.com/feed",
    "FJ Research": "https://fjresearch.substack.com/feed",
    "Fundamentally Sound": "https://fundamentallysound.substack.com/feed",
    "Galno": "https://galno.substack.com/feed",
    "Guardian Research": "https://guardianresearch.substack.com/feed",
    "Helwani Nose": "https://helwaninose.substack.com/feed",
    "The Illiquid Edge": "https://theilliquidedge.substack.com/feed",
    "InvestorTalkDaily": "https://investortalkdaily.substack.com/feed",
    "Irrational Analysis": "https://irrationalanalysis.substack.com/feed",
    "Jim Orbin": "https://jimorbin.substack.com/feed",
    "Jon's Thoughts": "https://jonsthoughts.substack.com/feed",
    "LP Blueprint": "https://lpblueprint.substack.com/feed",
    "Make Money Make Time": "https://mmmtwealth.substack.com/feed",
    "The Meridian Report": "https://themeridianreport.substack.com/feed",
    "The Multiplier": "https://themultiplier.substack.com/feed",
    "The Options Seller": "https://theoptionsseller.substack.com/feed",
    "Procure.FYI": "https://procurefyi.substack.com/feed",
    "Refcell Capital": "https://refcellcapital.substack.com/feed",
    "SemiconSam": "https://semiconsam.substack.com/feed",
    "Trading Floor Whispers": "https://tradingfloorwhispers.substack.com/feed",
    "Undervalued & Undercovered": "https://undervaluedundercovered.substack.com/feed",
    "Value Investors": "https://valueinvestors.substack.com/feed",
    "The Value Road": "https://thevalueroad.substack.com/feed",
    "Will's Wall Street": "https://willswallstreet.substack.com/feed",
}

FEEDS_KEY = "feeds:substacks"
FEEDS_CACHE = "cache:feeds"
FEEDS_CUSTOM = "feeds:custom"

# Save feeds to Redis on startup
async def _init_feeds():
    for name, url in SUBSTACK_FEEDS.items():
        rdb.hset(FEEDS_KEY, name, url)

def extract_tickers(text):
    """Extract $TICKER mentions and common ticker patterns from text."""
    import re as _re
    if not text:
        return []
    # Match $TICKER pattern
    dollar_tickers = _re.findall(r'\$([A-Z]{1,5})\b', text)
    # Match standalone all-caps 2-5 letter words that look like tickers
    # (surrounded by spaces/punctuation, not part of normal words)
    word_tickers = _re.findall(r'(?<!\w)([A-Z]{2,5})(?=\s|[,.:;!?\-\)]|$)', text)
    # Common non-ticker uppercase words to filter out
    noise = {"THE","AND","FOR","BUT","NOT","YOU","ALL","CAN","HAS","HER","WAS","ONE",
             "OUR","OUT","ARE","HIS","HOW","MAN","NEW","NOW","OLD","SEE","WAY","MAY",
             "WHO","BOY","DID","ITS","LET","PUT","SAY","SHE","TOO","USE","DAD","MOM",
             "ANY","FEW","GOT","HAD","HIM","HIT","LOW","OWN","RUN","TOP","YES",
             "BIG","END","FAR","EPS","IPO","CEO","CFO","GDP","CPI","PPI","IMF","FED",
             "ETF","ATH","ATL","YOY","QOQ","MOM","WOW","LOL","IMO","FOMO","YOLO",
             "THIS","THAT","WITH","FROM","HAVE","WILL","BEEN","JUST","LIKE","WHAT",
             "WHEN","YOUR","MORE","SOME","THAN","THEM","VERY","INTO","OVER","SUCH",
             "TAKE","THAN","ONLY","ALSO","BACK","EVEN","MOST","MUCH","THEN","WELL",
             "ALSO","DOWN","HERE","HIGH","LAST","LONG","MAKE","MANY","NEXT","ONLY",
             "OVER","SAME","YEAR","FREE","FULL","GOOD","KEEP","KNOW","LOOK","PART",
             "READ","REAL","RISK","SALE","SELL","SHOW","STILL","WORK","ABOUT","COULD",
             "FIRST","GREAT","NEVER","OTHER","THEIR","THERE","THESE","THINK","THREE",
             "WOULD","AFTER","EVERY","MONTH","PRICE","SHARE","SHORT","SINCE","STOCK",
             "THOSE","TRADE","UNDER","VALUE","WHERE","WHICH","WHILE","WORLD","ABOVE",
             "BELOW","COULD","DAILY","EARLY","LARGE","SMALL","TODAY","TOTAL","WATCH",
             "BEING","GOING","RIGHT"}
    valid_tickers = set(dollar_tickers)
    for t in word_tickers:
        if t not in noise and len(t) >= 2:
            valid_tickers.add(t)
    return sorted(valid_tickers)

def parse_feed_entries(feed_data, source_name, max_entries=10):
    """Parse RSS feed entries into a standard format."""
    entries = []
    for entry in feed_data.entries[:max_entries]:
        title = entry.get("title", "")
        summary = entry.get("summary", "")
        # Clean HTML from summary
        import re as _re
        clean_summary = _re.sub(r'<[^>]+>', '', summary)[:500]
        link = entry.get("link", "")
        published = entry.get("published", "")

        # Extract tickers from title + summary
        tickers = extract_tickers(title + " " + clean_summary)

        entries.append({
            "source": source_name,
            "title": title,
            "summary": clean_summary,
            "link": link,
            "published": published,
            "tickers": tickers,
        })
    return entries

@app.get("/feeds/sources")
async def get_feed_sources():
    feeds = rdb.hgetall(FEEDS_KEY)
    custom = rdb.hgetall(FEEDS_CUSTOM)
    return {
        "substacks": {k: v for k, v in feeds.items()},
        "custom": {k: v for k, v in custom.items()},
        "total": len(feeds) + len(custom),
    }

@app.post("/feeds/sources")
async def add_feed_source(data: dict):
    name = data.get("name", "").strip()
    url = data.get("url", "").strip()
    if not name or not url:
        raise HTTPException(400, "name and url required")
    if not url.endswith("/feed"):
        url = url.rstrip("/") + "/feed"
    rdb.hset(FEEDS_CUSTOM, name, url)
    return {"added": name, "url": url}

@app.delete("/feeds/sources/{name}")
async def remove_feed_source(name: str):
    rdb.hdel(FEEDS_CUSTOM, name)
    return {"removed": name}

@app.get("/feeds/refresh")
async def refresh_feeds(sources: Optional[str] = None):
    """Fetch latest posts from all or selected Substack feeds."""
    if not feedparser:
        raise HTTPException(500, "feedparser not installed")

    all_feeds = {}
    all_feeds.update(rdb.hgetall(FEEDS_KEY))
    all_feeds.update(rdb.hgetall(FEEDS_CUSTOM))

    if sources:
        selected = [s.strip() for s in sources.split(",")]
        all_feeds = {k: v for k, v in all_feeds.items() if k in selected}

    all_entries = []
    errors = []

    for name, url in all_feeds.items():
        try:
            feed = feedparser.parse(url)
            if feed.bozo and not feed.entries:
                errors.append({"source": name, "error": "Feed unavailable or empty"})
                continue
            entries = parse_feed_entries(feed, name, max_entries=5)
            all_entries.extend(entries)
        except Exception as e:
            errors.append({"source": name, "error": str(e)})

    # Sort by published date (newest first)
    all_entries.sort(key=lambda x: x.get("published", ""), reverse=True)

    # Cache results
    rdb.setex(FEEDS_CACHE, 600, json.dumps(all_entries[:100]))

    # Extract all mentioned tickers across all posts
    all_tickers = {}
    for entry in all_entries:
        for t in entry.get("tickers", []):
            if t not in all_tickers:
                all_tickers[t] = {"count": 0, "sources": []}
            all_tickers[t]["count"] += 1
            src = entry["source"]
            if src not in all_tickers[t]["sources"]:
                all_tickers[t]["sources"].append(src)

    # Sort tickers by mention count
    trending = sorted(all_tickers.items(), key=lambda x: x[1]["count"], reverse=True)[:20]

    return {
        "entries": all_entries[:100],
        "total": len(all_entries),
        "errors": errors,
        "trending_tickers": [{"ticker": t, **info} for t, info in trending],
    }

@app.get("/feeds")
async def get_feeds():
    """Get cached feed results."""
    cached = rdb.get(FEEDS_CACHE)
    if cached:
        entries = json.loads(cached)
        # Recalculate trending
        all_tickers = {}
        for entry in entries:
            for t in entry.get("tickers", []):
                if t not in all_tickers:
                    all_tickers[t] = {"count": 0, "sources": []}
                all_tickers[t]["count"] += 1
                src = entry["source"]
                if src not in all_tickers[t]["sources"]:
                    all_tickers[t]["sources"].append(src)
        trending = sorted(all_tickers.items(), key=lambda x: x[1]["count"], reverse=True)[:20]
        return {
            "entries": entries,
            "total": len(entries),
            "trending_tickers": [{"ticker": t, **info} for t, info in trending],
        }
    return {"entries": [], "total": 0, "trending_tickers": []}

# ── Stocktwits ──────────────────────────────────────────────────────────
@app.get("/stocktwits/{ticker}")
async def get_stocktwits(ticker: str):
    t = ticker.strip().upper()
    cache_key = f"stocktwits:{t}"
    cached = rdb.get(cache_key)
    if cached:
        return json.loads(cached)

    try:
        async with httpx.AsyncClient(timeout=10) as client:
            r = await client.get(f"https://api.stocktwits.com/api/2/streams/symbol/{t}.json")
            r.raise_for_status()
            data = r.json()

        messages = []
        bull = 0
        bear = 0
        for msg in data.get("messages", []):
            sentiment = msg.get("entities", {}).get("sentiment", {})
            sent_str = sentiment.get("basic") if sentiment else None
            if sent_str == "Bullish":
                bull += 1
            elif sent_str == "Bearish":
                bear += 1
            messages.append({
                "id": msg.get("id"),
                "body": msg.get("body", ""),
                "user": msg.get("user", {}).get("username", ""),
                "followers": msg.get("user", {}).get("followers", 0),
                "sentiment": sent_str,
                "created_at": msg.get("created_at", ""),
                "likes": msg.get("likes", {}).get("total", 0) if msg.get("likes") else 0,
            })

        total = bull + bear
        result = {
            "ticker": t,
            "messages": messages[:30],
            "sentiment": {
                "bullish": bull,
                "bearish": bear,
                "total": total,
                "bull_pct": round(bull / total * 100) if total > 0 else 50,
            },
        }
        rdb.setex(cache_key, 120, json.dumps(result))
        return result
    except Exception as e:
        return {"ticker": t, "messages": [], "sentiment": {"bullish": 0, "bearish": 0, "total": 0, "bull_pct": 50}, "error": str(e)}




# ═══════════════════════════════════════════════════════════════════════
#  FIDELITY PORTFOLIO
# ═══════════════════════════════════════════════════════════════════════

@app.get("/fidelity/accounts")
async def fidelity_accounts():
    accts = rdb.get("fidelity:accounts")
    if not accts:
        return {"accounts": []}
    keys = json.loads(accts)
    result = []
    for key in keys:
        data = rdb.get(f"fidelity:{key}")
        if data:
            acct = json.loads(data)
            result.append({"key": key, "name": acct["name"], "holdings_count": len(acct["holdings"]), "total_value": acct["total_value"], "total_gl": acct["total_gl"]})
    return {"accounts": result}

@app.get("/fidelity/{account_key}")
async def fidelity_portfolio(account_key: str):
    data = rdb.get(f"fidelity:{account_key}")
    if not data:
        raise HTTPException(404, "Account not found")
    acct = json.loads(data)
    if yf:
        for h in acct["holdings"]:
            if h["ticker"].startswith("-"): continue
            try:
                price = yf.Ticker(h["ticker"]).fast_info.last_price
                if price:
                    h["last_price"] = round(price, 2)
                    h["current_value"] = round(price * h["shares"], 2)
                    cost = (h["avg_cost"] or 0) * h["shares"]
                    h["total_gl"] = round(h["current_value"] - cost, 2)
                    h["total_gl_pct"] = round((h["total_gl"] / cost) * 100, 2) if cost > 0 else 0
            except: pass
        acct["total_value"] = sum(h["current_value"] or 0 for h in acct["holdings"])
        acct["total_gl"] = sum(h["total_gl"] or 0 for h in acct["holdings"])
    return acct




# ═══════════════════════════════════════════════════════════════════════
#  PORTFOLIO ANALYTICS
# ═══════════════════════════════════════════════════════════════════════

@app.get("/portfolio/analytics/{account_key}")
async def portfolio_analytics(account_key: str):
    """Sector breakdown, allocation, and stats for a Fidelity account."""
    data = rdb.get(f"fidelity:{account_key}")
    if not data:
        raise HTTPException(404, "Account not found")
    acct = json.loads(data)
    holdings = acct.get("holdings", [])

    total_value = sum(h.get("current_value") or 0 for h in holdings)
    if total_value == 0:
        return {"allocation": [], "sectors": [], "stats": {}}

    # Get sector info via yfinance
    allocation = []
    sector_map = {}
    for h in holdings:
        ticker = h["ticker"]
        val = h.get("current_value") or 0
        pct_alloc = round((val / total_value) * 100, 2) if total_value else 0
        sector = "Unknown"
        industry = ""
        if yf:
            try:
                info = yf.Ticker(ticker).info
                sector = info.get("sector", "Unknown")
                industry = info.get("industry", "")
            except:
                pass

        allocation.append({
            "ticker": ticker, "name": h.get("name", ""),
            "value": val, "pct": pct_alloc,
            "sector": sector, "industry": industry,
            "shares": h.get("shares", 0),
            "avg_cost": h.get("avg_cost"),
            "pnl": h.get("total_gl"), "pnl_pct": h.get("total_gl_pct"),
        })

        if sector not in sector_map:
            sector_map[sector] = {"value": 0, "count": 0, "tickers": []}
        sector_map[sector]["value"] += val
        sector_map[sector]["count"] += 1
        sector_map[sector]["tickers"].append(ticker)

    sectors = []
    for name, info in sorted(sector_map.items(), key=lambda x: -x[1]["value"]):
        sectors.append({
            "sector": name, "value": round(info["value"], 2),
            "pct": round((info["value"] / total_value) * 100, 2),
            "count": info["count"], "tickers": info["tickers"],
        })

    # Stats
    pnls = [h.get("total_gl") or 0 for h in holdings]
    winners = sum(1 for p in pnls if p > 0)
    losers = sum(1 for p in pnls if p < 0)
    best = max(holdings, key=lambda h: h.get("total_gl_pct") or -999)
    worst = min(holdings, key=lambda h: h.get("total_gl_pct") or 999)

    stats = {
        "total_value": round(total_value, 2),
        "total_pnl": round(sum(pnls), 2),
        "holdings_count": len(holdings),
        "winners": winners, "losers": losers,
        "best_performer": {"ticker": best["ticker"], "pnl_pct": best.get("total_gl_pct")},
        "worst_performer": {"ticker": worst["ticker"], "pnl_pct": worst.get("total_gl_pct")},
        "avg_position_size": round(total_value / len(holdings), 2) if holdings else 0,
    }

    return {"allocation": allocation, "sectors": sectors, "stats": stats}



# ═══════════════════════════════════════════════════════════════════════
#  MOO MOO (FUTU) INTEGRATION
# ═══════════════════════════════════════════════════════════════════════

moomoo_ctx = None

@app.get("/moomoo/status")
async def moomoo_status():
    """Check if FutuOpenD is running and accessible."""
    try:
        import socket
        s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        s.settimeout(1)
        result = s.connect_ex(("127.0.0.1", 11111))
        s.close()
        if result != 0:
            return {"connected": False, "error": "FutuOpenD not running on port 11111. Start Moo Moo desktop app first."}
        import futu
        from futu import OpenSecTradeContext, TrdEnv, TrdMarket
        ctx = OpenSecTradeContext(host="127.0.0.1", port=11111, security_firm=futu.SecurityFirm.FUTUINC)
        ret, data = ctx.get_acc_list()
        ctx.close()
        if ret == 0:
            accounts = []
            for _, row in data.iterrows():
                accounts.append({"acc_id": str(row.get("acc_id","")), "acc_type": str(row.get("trd_env",""))})
            return {"connected": True, "accounts": accounts}
        return {"connected": False, "error": str(data)}
    except ImportError:
        return {"connected": False, "error": "futu-api not installed. Run: pip install futu-api"}
    except Exception as e:
        return {"connected": False, "error": f"FutuOpenD not running on localhost:11111. Start Moo Moo desktop app first. ({str(e)})"}

@app.get("/moomoo/portfolio")
async def moomoo_portfolio():
    """Get Moo Moo portfolio holdings."""
    try:
        from futu import OpenSecTradeContext, TrdEnv, TrdMarket, SecurityFirm
        ctx = OpenSecTradeContext(host="127.0.0.1", port=11111, security_firm=SecurityFirm.FUTUINC)
        ret, data = ctx.position_list_query(trd_env=TrdEnv.REAL)
        ctx.close()
        if ret != 0:
            return {"error": str(data), "holdings": []}

        holdings = []
        total_value = 0
        total_pnl = 0
        for _, row in data.iterrows():
            val = float(row.get("market_val", 0))
            pnl = float(row.get("pl_val", 0))
            cost = float(row.get("cost_price", 0))
            qty = float(row.get("qty", 0))
            price = float(row.get("nominal_price", 0))
            ticker = str(row.get("code", "")).replace("US.", "")
            holdings.append({
                "ticker": ticker, "name": str(row.get("stock_name", "")),
                "shares": qty, "avg_cost": cost, "last_price": price,
                "current_value": val, "total_gl": pnl,
                "total_gl_pct": round((pnl / (cost * qty)) * 100, 2) if cost * qty > 0 else 0,
            })
            total_value += val
            total_pnl += pnl

        return {"name": "Moo Moo", "holdings": holdings, "total_value": round(total_value, 2), "total_gl": round(total_pnl, 2)}
    except ImportError:
        return {"error": "futu-api not installed", "holdings": []}
    except Exception as e:
        return {"error": str(e), "holdings": []}

@app.get("/moomoo/orders")
async def moomoo_orders():
    """Get recent Moo Moo orders."""
    try:
        from futu import OpenSecTradeContext, TrdEnv, SecurityFirm
        ctx = OpenSecTradeContext(host="127.0.0.1", port=11111, security_firm=SecurityFirm.FUTUINC)
        ret, data = ctx.order_list_query(trd_env=TrdEnv.REAL)
        ctx.close()
        if ret != 0:
            return {"orders": [], "error": str(data)}

        orders = []
        for _, row in data.iterrows():
            orders.append({
                "ticker": str(row.get("code","")).replace("US.",""),
                "side": str(row.get("trd_side","")), "price": float(row.get("price",0)),
                "quantity": float(row.get("qty",0)), "status": str(row.get("order_status","")),
                "created_at": str(row.get("create_time","")),
            })
        return {"orders": orders[:30]}
    except ImportError:
        return {"orders": [], "error": "futu-api not installed"}
    except Exception as e:
        return {"orders": [], "error": str(e)}




# ═══════════════════════════════════════════════════════════════════════
#  HEAT MAP
# ═══════════════════════════════════════════════════════════════════════

@app.get("/heatmap")
async def heatmap(tickers: str = ""):
    default_tickers = "AAPL,MSFT,AMZN,GOOGL,META,NVDA,TSLA,JPM,V,JNJ,WMT,PG,XOM,UNH,HD,MA,DIS,NFLX,ADBE,CRM,PYPL,INTC,AMD,QCOM,AVGO,COST,PEP,KO,MRK,ABBV,TMO,ACN,LLY,MCD,BA,CAT,GS,AXP,IBM,ORCL"
    ticker_list = [t.strip() for t in (tickers or default_tickers).split(",") if t.strip()]
    results = []
    if yf:
        for t in ticker_list[:50]:
            try:
                stock = yf.Ticker(t)
                hist = stock.history(period="2d")
                if len(hist) >= 2:
                    prev = hist["Close"].iloc[-2]
                    curr = hist["Close"].iloc[-1]
                    chg = ((curr - prev) / prev) * 100
                    info = stock.info
                    results.append({"ticker": t, "price": round(curr, 2), "change_pct": round(chg, 2), "market_cap": info.get("marketCap", 0), "sector": info.get("sector", "Unknown"), "name": info.get("shortName", t)})
            except:
                pass
    return {"heatmap": results}

@app.get("/heatmap/portfolio/{account_key}")
async def heatmap_portfolio(account_key: str):
    data = rdb.get(f"fidelity:{account_key}")
    if not data: raise HTTPException(404, "Account not found")
    acct = json.loads(data)
    tickers = ",".join(h["ticker"] for h in acct["holdings"] if not h["ticker"].startswith("-"))
    return await heatmap(tickers)


# ═══════════════════════════════════════════════════════════════════════
#  DIVIDENDS
# ═══════════════════════════════════════════════════════════════════════

@app.get("/dividends/portfolio/{account_key}")
async def portfolio_dividends(account_key: str):
    data = rdb.get(f"fidelity:{account_key}")
    if not data: raise HTTPException(404, "Account not found")
    acct = json.loads(data)
    results = []
    total_annual_income = 0
    for h in acct["holdings"]:
        t = h["ticker"]
        if t.startswith("-"): continue
        try:
            info = yf.Ticker(t).info
            div_yield = info.get("dividendYield", 0) or 0
            div_rate = info.get("dividendRate", 0) or 0
            annual_income = div_rate * h["shares"]
            total_annual_income += annual_income
            results.append({"ticker": t, "shares": h["shares"], "value": h.get("current_value", 0), "yield_pct": round(div_yield * 100, 2), "annual_rate": div_rate, "annual_income": round(annual_income, 2), "ex_date": str(info.get("exDividendDate", "")), "payout_ratio": round((info.get("payoutRatio", 0) or 0) * 100, 1)})
        except:
            results.append({"ticker": t, "shares": h["shares"], "yield_pct": 0, "annual_income": 0})
    return {"holdings": results, "total_annual_income": round(total_annual_income, 2), "account": acct["name"]}


# ═══════════════════════════════════════════════════════════════════════
#  PERFORMANCE
# ═══════════════════════════════════════════════════════════════════════

@app.get("/performance/{account_key}")
async def portfolio_performance(account_key: str, period: str = "1mo"):
    data = rdb.get(f"fidelity:{account_key}")
    if not data: raise HTTPException(404, "Account not found")
    acct = json.loads(data)
    holdings = [h for h in acct["holdings"] if not h["ticker"].startswith("-")]
    if not yf or not holdings: return {"error": "No data"}
    shares_map = {h["ticker"]: h["shares"] for h in holdings}
    cost_map = {h["ticker"]: (h.get("avg_cost") or 0) * h["shares"] for h in holdings}
    total_cost = sum(cost_map.values())
    try:
        data_frames = {}
        for t in [h["ticker"] for h in holdings] + ["SPY"]:
            hist = yf.Ticker(t).history(period=period)
            if len(hist) > 0: data_frames[t] = hist["Close"]
        if "SPY" not in data_frames: return {"error": "Could not fetch SPY"}
        spy = data_frames["SPY"]
        dates = sorted(spy.index)
        spy_start = float(spy.iloc[0])
        portfolio_series = []
        spy_series = []
        for date in dates:
            port_val = 0
            for t in shares_map:
                if t in data_frames:
                    try:
                        idx = data_frames[t].index.get_indexer([date], method="ffill")[0]
                        if idx >= 0: port_val += float(data_frames[t].iloc[idx]) * shares_map[t]
                    except: pass
            spy_val = float(spy.loc[date]) if date in spy.index else None
            if port_val > 0: portfolio_series.append({"date": str(date.date()), "value": round(port_val, 2)})
            if spy_val:
                spy_norm = (spy_val / spy_start) * total_cost if total_cost > 0 else spy_val
                spy_series.append({"date": str(date.date()), "value": round(spy_norm, 2)})
        return {"portfolio": portfolio_series, "benchmark": spy_series, "total_cost": round(total_cost, 2), "current_value": round(portfolio_series[-1]["value"], 2) if portfolio_series else 0, "period": period}
    except Exception as e:
        return {"error": str(e)}


# ═══════════════════════════════════════════════════════════════════════
#  BACKTESTER
# ═══════════════════════════════════════════════════════════════════════

@app.get("/backtest/{ticker}")
async def backtest(ticker: str, strategy: str = "sma_cross", period: str = "1y", fast: int = 10, slow: int = 30, rsi_period: int = 14, rsi_buy: int = 30, rsi_sell: int = 70, capital: float = 10000):
    if not yf: return {"error": "yfinance not available"}
    try:
        hist = yf.Ticker(ticker.upper()).history(period=period)
        if len(hist) < slow + 5: return {"error": f"Not enough data"}
        prices = hist["Close"].values.tolist()
        dates = [str(d.date()) for d in hist.index]
        trades = []; equity_curve = []; cash = capital; shares = 0; position_price = 0

        if strategy == "sma_cross":
            for i in range(slow, len(prices)):
                fast_sma = sum(prices[i-fast:i]) / fast
                slow_sma = sum(prices[i-slow:i]) / slow
                equity = cash + shares * prices[i]
                equity_curve.append({"date": dates[i], "equity": round(equity, 2), "price": round(prices[i], 2)})
                if fast_sma > slow_sma and shares == 0:
                    shares = int(cash / prices[i])
                    if shares > 0: cash -= shares * prices[i]; position_price = prices[i]; trades.append({"date": dates[i], "action": "BUY", "price": round(prices[i], 2), "shares": shares})
                elif fast_sma < slow_sma and shares > 0:
                    pnl = shares * (prices[i] - position_price); cash += shares * prices[i]; trades.append({"date": dates[i], "action": "SELL", "price": round(prices[i], 2), "shares": shares, "pnl": round(pnl, 2)}); shares = 0
        elif strategy == "rsi":
            gains = [0.0]*len(prices); losses = [0.0]*len(prices)
            for i in range(1, len(prices)):
                diff = prices[i] - prices[i-1]; gains[i] = diff if diff > 0 else 0; losses[i] = -diff if diff < 0 else 0
            for i in range(rsi_period+1, len(prices)):
                avg_gain = sum(gains[i-rsi_period:i])/rsi_period; avg_loss = sum(losses[i-rsi_period:i])/rsi_period
                rs = avg_gain/avg_loss if avg_loss > 0 else 100; rsi = 100-(100/(1+rs))
                equity = cash + shares * prices[i]
                equity_curve.append({"date": dates[i], "equity": round(equity, 2), "price": round(prices[i], 2), "rsi": round(rsi, 1)})
                if rsi < rsi_buy and shares == 0:
                    shares = int(cash/prices[i])
                    if shares > 0: cash -= shares*prices[i]; position_price = prices[i]; trades.append({"date": dates[i], "action": "BUY", "price": round(prices[i], 2), "shares": shares, "rsi": round(rsi, 1)})
                elif rsi > rsi_sell and shares > 0:
                    pnl = shares*(prices[i]-position_price); cash += shares*prices[i]; trades.append({"date": dates[i], "action": "SELL", "price": round(prices[i], 2), "shares": shares, "pnl": round(pnl, 2), "rsi": round(rsi, 1)}); shares = 0

        final_equity = cash + shares * prices[-1]
        buy_hold = (prices[-1] / prices[0]) * capital
        total_return = ((final_equity - capital) / capital) * 100
        buy_hold_return = ((buy_hold - capital) / capital) * 100
        winning_trades = sum(1 for t in trades if t.get("pnl", 0) > 0)
        losing_trades = sum(1 for t in trades if t.get("pnl", 0) < 0)
        return {"ticker": ticker.upper(), "strategy": strategy, "period": period, "initial_capital": capital, "final_equity": round(final_equity, 2), "total_return_pct": round(total_return, 2), "buy_hold_equity": round(buy_hold, 2), "buy_hold_return_pct": round(buy_hold_return, 2), "alpha": round(total_return - buy_hold_return, 2), "trades": trades, "trade_count": len(trades), "winning_trades": winning_trades, "losing_trades": losing_trades, "win_rate": round(winning_trades / max(1, winning_trades + losing_trades) * 100, 1), "equity_curve": equity_curve}
    except Exception as e:
        return {"error": str(e)}


# ═══════════════════════════════════════════════════════════════════════
#  BACKGROUND TASKS
# ═══════════════════════════════════════════════════════════════════════
async def check_alerts():
    while True:
        await asyncio.sleep(30)
        try:
            raw = rdb.lrange(ALERTS_KEY, 0, -1)
            tickers = set()
            for r in raw:
                rule = json.loads(r)
                if rule.get("active"):
                    tickers.add(rule["ticker"])
            prices = {}
            for t in tickers:
                try:
                    q = await finnhub_get("/quote", {"symbol": t})
                    prices[t] = q.get("c", 0)
                except Exception:
                    pass
            for rule_str in raw:
                rule = json.loads(rule_str)
                if not rule.get("active"):
                    continue
                price = prices.get(rule["ticker"], 0)
                if not price:
                    continue
                triggered = (
                    (rule["condition"] == "above" and price >= rule["price"]) or
                    (rule["condition"] == "below" and price <= rule["price"])
                )
                if triggered:
                    event = {
                        "alert_id": rule["id"], "ticker": rule["ticker"],
                        "condition": rule["condition"], "target": rule["price"],
                        "actual_price": price,
                        "fired_at": datetime.now(timezone.utc).isoformat(),
                    }
                    rdb.lpush(TRIGGERED_KEY, json.dumps(event))
                    rdb.ltrim(TRIGGERED_KEY, 0, 49)
                    rule["active"] = False
                    rdb.lrem(ALERTS_KEY, 0, rule_str)
                    rdb.rpush(ALERTS_KEY, json.dumps(rule))
        except Exception as e:
            print(f"Alert check error: {e}")

async def background_news_refresh():
    while True:
        await asyncio.sleep(300)
        try:
            data = await finnhub_get("/news", {"category": "general"})
            items = data[:30] if isinstance(data, list) else []
            articles = _map_finnhub_news(items)
            rdb.setex(f"{NEWS_CACHE}:general", 300, json.dumps(articles))
            keywords = rdb.smembers(KEYWORDS_KEY)
            if keywords:
                for article in articles:
                    title_lower = (article.get("title", "") + " " + article.get("summary", "")).lower()
                    matched = [k for k in keywords if k.lower() in title_lower]
                    if matched:
                        alert_entry = {**article, "keywords": matched}
                        rdb.lpush(NEWS_ALERTS_KEY, json.dumps(alert_entry))
                rdb.ltrim(NEWS_ALERTS_KEY, 0, 49)
        except Exception as e:
            print(f"News refresh error: {e}")

async def background_macro_refresh():
    while True:
        await asyncio.sleep(600)
        try:
            today = datetime.now(timezone.utc).date()
            data = await finnhub_get("/calendar/economic", {
                "from": today.isoformat(),
                "to": (today + timedelta(days=7)).isoformat(),
            })
            raw_events = data.get("economicCalendar", {}).get("result", [])
            events = _map_calendar_events(raw_events)
            rdb.setex(CALENDAR_CACHE, 600, json.dumps(events))
        except Exception as e:
            print(f"Macro refresh error: {e}")

@app.on_event("startup")
async def startup():
    global rh_logged_in
    # Try auto-login to Robinhood (uses stored session if available)
    if RH_AVAILABLE and RH_EMAIL and RH_PASSWORD:
        try:
            rs.login(
                username=RH_EMAIL,
                password=RH_PASSWORD,
                store_session=True,
                expiresIn=86400,
            )
            rh_logged_in = True
            print("✅ Robinhood: auto-logged in (stored session)")
        except Exception as e:
            print(f"⚠️  Robinhood: needs MFA — POST /rh/login with mfa_code")
            rh_logged_in = False

    asyncio.create_task(check_alerts())
    asyncio.create_task(background_news_refresh())
    asyncio.create_task(background_macro_refresh())

# ── OPTIONS JOURNAL ──────────────────────────────────────────
import pathlib as _pathlib
_OPTIONS_DATA_PATH = _pathlib.Path(__file__).parent / "options_data.json"

@app.get("/options-journal")
async def get_options_journal():
    import json
    if _OPTIONS_DATA_PATH.exists():
        with open(_OPTIONS_DATA_PATH) as f:
            return json.load(f)
    return {"error": "options_data.json not found"}

@app.get("/options-journal/summary")
async def get_options_journal_summary():
    import json
    if _OPTIONS_DATA_PATH.exists():
        with open(_OPTIONS_DATA_PATH) as f:
            data = json.load(f)
            return data.get("summary", {})
    return {"error": "options_data.json not found"}

# ── OPTIONS JOURNAL V2: CSV Upload, AI Analysis, Live Positions ──────

import io, csv, re, json
from datetime import datetime, timezone
from collections import defaultdict

def parse_fidelity_csv(csv_text: str):
    """Parse Fidelity CSV text into options trades"""
    lines = csv_text.strip().split('\n')
    header_idx = None
    for i, line in enumerate(lines):
        if 'Run Date' in line:
            header_idx = i
            break
    if header_idx is None:
        return []

    reader = csv.DictReader(lines[header_idx:])
    options_trades = []
    for row in reader:
        if not row.get('Run Date'):
            continue
        action = (row.get('Action') or '')
        symbol = (row.get('Symbol') or '').strip()
        is_option = any(kw in action.upper() for kw in ['OPENING TRANSACTION', 'CLOSING TRANSACTION', 'EXPIRED', 'ASSIGNED'])
        if not is_option:
            continue
        trade = {
            'date': row['Run Date'],
            'account': (row.get('Account') or '').strip('"'),
            'action': action.strip('"'),
            'symbol': symbol,
            'description': (row.get('Description') or '').strip('"'),
            'price': float(row['Price ($)']) if row.get('Price ($)') else 0,
            'quantity': int(float(row.get('Quantity', '0') or '0')),
            'commission': float(row.get('Commission ($)', '0') or '0'),
            'fees': float(row.get('Fees ($)', '0') or '0'),
            'amount': float(row.get('Amount ($)', '0') or '0'),
        }
        if 'SOLD OPENING' in action.upper():
            trade['trade_type'] = 'SELL_OPEN'
        elif 'BOUGHT OPENING' in action.upper():
            trade['trade_type'] = 'BUY_OPEN'
        elif 'SOLD CLOSING' in action.upper():
            trade['trade_type'] = 'SELL_CLOSE'
        elif 'BOUGHT CLOSING' in action.upper():
            trade['trade_type'] = 'BUY_CLOSE'
        elif 'EXPIRED' in action.upper():
            trade['trade_type'] = 'EXPIRED'
        elif 'ASSIGNED' in action.upper():
            trade['trade_type'] = 'ASSIGNED'
        else:
            trade['trade_type'] = 'OTHER'
        if symbol.startswith('-'):
            sym = symbol[1:]
            match = re.match(r'([A-Z]+)(\d{6})([CP])([\d.]+)', sym)
            if match:
                trade['ticker'] = match.group(1)
                ds = match.group(2)
                trade['option_type'] = 'CALL' if match.group(3) == 'C' else 'PUT'
                trade['strike'] = float(match.group(4))
                trade['expiry'] = f"20{ds[:2]}-{ds[2:4]}-{ds[4:6]}"
            else:
                trade['ticker'] = sym
                trade['option_type'] = 'CALL' if 'CALL' in action.upper() else 'PUT'
                trade['strike'] = 0
                trade['expiry'] = ''
        else:
            trade['ticker'] = symbol
            trade['option_type'] = 'CALL' if 'CALL' in action.upper() else 'PUT'
            trade['strike'] = 0
            trade['expiry'] = ''
        options_trades.append(trade)
    return options_trades

def build_journal_data(options_trades):
    """Group trades into completed round trips and compute stats"""
    contract_groups = defaultdict(list)
    for t in options_trades:
        key = f"{t.get('ticker','')}-{t.get('expiry','')}-{t.get('option_type','')}-{t.get('strike','')}-{t.get('account','')}"
        contract_groups[key].append(t)

    completed_trades = []
    open_positions = []

    for key, trades in contract_groups.items():
        trades.sort(key=lambda x: datetime.strptime(x['date'], '%m/%d/%Y'))
        opens = [t for t in trades if t['trade_type'] in ('SELL_OPEN', 'BUY_OPEN')]
        closes = [t for t in trades if t['trade_type'] in ('SELL_CLOSE', 'BUY_CLOSE', 'EXPIRED', 'ASSIGNED')]
        total_open_amount = sum(t['amount'] for t in opens)
        total_close_amount = sum(t['amount'] for t in closes)
        total_commissions = sum(t['commission'] + t['fees'] for t in trades)
        net_pnl = total_open_amount + total_close_amount
        if opens:
            if opens[0]['trade_type'] == 'SELL_OPEN':
                strategy = 'Covered Call' if opens[0]['option_type'] == 'CALL' else 'Cash-Secured Put'
            else:
                strategy = 'Long Call' if opens[0]['option_type'] == 'CALL' else 'Long Put'
        else:
            strategy = 'Unknown'
        total_contracts = sum(abs(t['quantity']) for t in opens) if opens else 0
        is_closed = len(closes) > 0
        entry = {
            'ticker': trades[0].get('ticker', ''),
            'option_type': trades[0].get('option_type', ''),
            'strike': trades[0].get('strike', 0),
            'expiry': trades[0].get('expiry', ''),
            'strategy': strategy,
            'contracts': total_contracts,
            'open_date': opens[0]['date'] if opens else '',
            'close_date': closes[-1]['date'] if closes else '',
            'open_premium': total_open_amount,
            'close_premium': total_close_amount,
            'net_pnl': round(net_pnl, 2),
            'commissions': round(total_commissions, 2),
            'net_after_fees': round(net_pnl, 2),
            'status': 'CLOSED' if is_closed else 'OPEN',
            'close_type': closes[-1]['trade_type'] if closes else '',
            'account': trades[0].get('account', ''),
        }
        if is_closed:
            completed_trades.append(entry)
        else:
            open_positions.append(entry)

    completed_trades.sort(key=lambda x: datetime.strptime(x['open_date'], '%m/%d/%Y') if x['open_date'] else datetime.min)

    # Stats
    winners = [t for t in completed_trades if t['net_pnl'] > 0]
    losers = [t for t in completed_trades if t['net_pnl'] < 0]
    total_pnl = sum(t['net_pnl'] for t in completed_trades)
    total_commissions = sum(t['commissions'] for t in completed_trades)

    pnl_by_ticker = defaultdict(float)
    trades_by_ticker = defaultdict(int)
    for t in completed_trades:
        pnl_by_ticker[t['ticker']] += t['net_pnl']
        trades_by_ticker[t['ticker']] += 1

    pnl_by_strategy = defaultdict(float)
    trades_by_strategy = defaultdict(int)
    for t in completed_trades:
        pnl_by_strategy[t['strategy']] += t['net_pnl']
        trades_by_strategy[t['strategy']] += 1

    monthly_pnl = defaultdict(float)
    monthly_trades = defaultdict(int)
    for t in completed_trades:
        if t['close_date']:
            dt = datetime.strptime(t['close_date'], '%m/%d/%Y')
            mk = dt.strftime('%Y-%m')
            monthly_pnl[mk] += t['net_pnl']
            monthly_trades[mk] += 1

    return {
        'summary': {
            'total_trades': len(completed_trades),
            'winners': len(winners),
            'losers': len(losers),
            'breakeven': len([t for t in completed_trades if t['net_pnl'] == 0]),
            'win_rate': round(len(winners)/len(completed_trades)*100, 1) if completed_trades else 0,
            'total_pnl': round(total_pnl, 2),
            'total_commissions': round(total_commissions, 2),
            'avg_win': round(sum(t['net_pnl'] for t in winners)/len(winners), 2) if winners else 0,
            'avg_loss': round(sum(t['net_pnl'] for t in losers)/len(losers), 2) if losers else 0,
            'best_trade': round(max(t['net_pnl'] for t in completed_trades), 2) if completed_trades else 0,
            'worst_trade': round(min(t['net_pnl'] for t in completed_trades), 2) if completed_trades else 0,
            'largest_win_ticker': max(completed_trades, key=lambda x: x['net_pnl'])['ticker'] if completed_trades else '',
            'largest_loss_ticker': min(completed_trades, key=lambda x: x['net_pnl'])['ticker'] if completed_trades else '',
        },
        'completed_trades': completed_trades,
        'open_positions': open_positions,
        'pnl_by_ticker': {k: round(v, 2) for k, v in sorted(pnl_by_ticker.items(), key=lambda x: x[1], reverse=True)},
        'trades_by_ticker': dict(trades_by_ticker),
        'pnl_by_strategy': {k: round(v, 2) for k, v in pnl_by_strategy.items()},
        'trades_by_strategy': dict(trades_by_strategy),
        'monthly_pnl': {k: round(v, 2) for k, v in sorted(monthly_pnl.items())},
        'monthly_trades': dict(sorted(monthly_trades.items())),
        'last_updated': datetime.now(timezone.utc).isoformat(),
    }

# ── Endpoints ──

from fastapi import UploadFile, File
from fastapi.responses import JSONResponse

@app.post("/options-journal/upload")
async def upload_options_csv(file: UploadFile = File(...)):
    """Upload a Fidelity CSV and merge with existing data"""
    content = await file.read()
    csv_text = content.decode('utf-8-sig')
    new_trades = parse_fidelity_csv(csv_text)
    if not new_trades:
        return JSONResponse(status_code=400, content={"error": "No options trades found in CSV"})

    # Load existing raw trades if available
    raw_path = _OPTIONS_DATA_PATH.parent / "options_raw_trades.json"
    existing_raw = []
    if raw_path.exists():
        with open(raw_path) as f:
            existing_raw = json.load(f)

    # Deduplicate by creating a key for each trade
    def trade_key(t):
        return f"{t['date']}-{t['symbol']}-{t['amount']}-{t['trade_type']}"
    existing_keys = {trade_key(t) for t in existing_raw}
    added = 0
    for t in new_trades:
        k = trade_key(t)
        if k not in existing_keys:
            existing_raw.append(t)
            existing_keys.add(k)
            added += 1

    # Save raw trades
    with open(raw_path, 'w') as f:
        json.dump(existing_raw, f, indent=2)

    # Rebuild journal
    journal = build_journal_data(existing_raw)
    with open(_OPTIONS_DATA_PATH, 'w') as f:
        json.dump(journal, f, indent=2)

    return {"message": f"Imported {added} new trades ({len(new_trades)} in file, {len(existing_raw)} total)", "summary": journal['summary']}

@app.get("/options-journal/analyze")
async def analyze_options_trading():
    """AI-style analysis of trading patterns"""
    if not _OPTIONS_DATA_PATH.exists():
        return {"error": "No data"}
    with open(_OPTIONS_DATA_PATH) as f:
        data = json.load(f)

    trades = data['completed_trades']
    s = data['summary']
    pbt = data['pnl_by_ticker']
    pbs = data['pnl_by_strategy']

    insights = []
    warnings = []
    recommendations = []

    # Win rate analysis
    if s['win_rate'] >= 65:
        insights.append({"type": "strength", "title": "Strong Win Rate", "text": f"Your {s['win_rate']}% win rate across {s['total_trades']} trades is excellent. You're picking winners consistently."})
    elif s['win_rate'] >= 50:
        insights.append({"type": "neutral", "title": "Decent Win Rate", "text": f"Your {s['win_rate']}% win rate is above average but has room for improvement."})
    else:
        warnings.append({"type": "warning", "title": "Low Win Rate", "text": f"Your {s['win_rate']}% win rate needs attention. Consider tightening entry criteria."})

    # Risk/reward
    if s['avg_win'] and s['avg_loss']:
        rr = abs(s['avg_win'] / s['avg_loss'])
        if rr < 1:
            warnings.append({"type": "warning", "title": "Negative Risk/Reward", "text": f"Avg win (${s['avg_win']:.0f}) is smaller than avg loss (${abs(s['avg_loss']):.0f}). R:R = {rr:.2f}. Your losers are larger than your winners."})
            recommendations.append({"title": "Cut Losses Faster", "text": "Set stop-losses at 50% of premium paid on long calls. Your avg loss is too large relative to avg win."})
        else:
            insights.append({"type": "strength", "title": "Positive Risk/Reward", "text": f"Your R:R of {rr:.2f} means your winners outpace your losers."})

    # Strategy analysis
    cc_pnl = pbs.get('Covered Call', 0)
    lc_pnl = pbs.get('Long Call', 0)
    if cc_pnl > 0 and lc_pnl < 0:
        insights.append({"type": "strength", "title": "Covered Calls Are Your Edge", "text": f"Covered calls: +${cc_pnl:.0f}. Long calls: ${lc_pnl:.0f}. Your income strategy is working. Speculative calls are dragging P&L."})
        recommendations.append({"title": "Reduce Long Call Size", "text": "Limit long call positions to 20-30% of options capital. Your covered call income is being eaten by speculative losses."})

    # Best/worst ticker analysis
    sorted_tickers = sorted(pbt.items(), key=lambda x: x[1], reverse=True)
    if sorted_tickers:
        best = sorted_tickers[0]
        worst = sorted_tickers[-1]
        insights.append({"type": "strength", "title": f"{best[0]} Is Your Best Ticker", "text": f"${best[1]:.0f} profit from {data['trades_by_ticker'].get(best[0], 0)} trades. You clearly know this stock well — keep the edge."})
        if worst[1] < -200:
            warnings.append({"type": "warning", "title": f"{worst[0]} Is Your Worst Ticker", "text": f"${worst[1]:.0f} loss from {data['trades_by_ticker'].get(worst[0], 0)} trades. Consider avoiding or reducing position sizes."})

    # Holding period analysis
    hold_days = []
    for t in trades:
        if t['open_date'] and t['close_date']:
            try:
                od = datetime.strptime(t['open_date'], '%m/%d/%Y')
                cd = datetime.strptime(t['close_date'], '%m/%d/%Y')
                hold_days.append((cd - od).days)
            except:
                pass
    if hold_days:
        avg_hold = sum(hold_days) / len(hold_days)
        short_wins = [t for t, d in zip(trades, hold_days) if d <= 3 and t['net_pnl'] > 0]
        long_losses = [t for t, d in zip(trades, hold_days) if d > 14 and t['net_pnl'] < 0]
        insights.append({"type": "neutral", "title": "Avg Hold Period", "text": f"Average holding period: {avg_hold:.0f} days. {len(short_wins)} quick wins (0-3 days), {len(long_losses)} extended losses (14+ days)."})
        if long_losses:
            recommendations.append({"title": "Time-Based Stops", "text": f"You have {len(long_losses)} trades held 14+ days that ended in losses. Consider closing any position down >30% after 10 days."})

    # Monthly consistency
    monthly = data['monthly_pnl']
    green_months = sum(1 for v in monthly.values() if v > 0)
    total_months = len(monthly)
    if total_months > 0:
        insights.append({"type": "strength" if green_months == total_months else "neutral", "title": "Monthly Consistency", "text": f"{green_months}/{total_months} profitable months. {'Perfect streak!' if green_months == total_months else 'Stay consistent.'}"})

    # Overtrading check
    if s['total_trades'] > 0 and total_months > 0:
        trades_per_month = s['total_trades'] / total_months
        if trades_per_month > 15:
            warnings.append({"type": "warning", "title": "High Trade Frequency", "text": f"Averaging {trades_per_month:.0f} trades/month. Higher frequency increases commission drag (${s['total_commissions']:.0f} total). Focus on highest-conviction setups."})

    # Account comparison
    roth_trades = [t for t in trades if t['account'] == 'ROTH IRA']
    ind_trades = [t for t in trades if t['account'] == 'Individual']
    if roth_trades and ind_trades:
        roth_pnl = sum(t['net_pnl'] for t in roth_trades)
        ind_pnl = sum(t['net_pnl'] for t in ind_trades)
        insights.append({"type": "neutral", "title": "Account Comparison", "text": f"Roth IRA: ${roth_pnl:.0f} ({len(roth_trades)} trades). Individual: ${ind_pnl:.0f} ({len(ind_trades)} trades). {'Roth is outperforming!' if roth_pnl/max(len(roth_trades),1) > ind_pnl/max(len(ind_trades),1) else 'Individual has better per-trade returns.'}"})

    # Open position risk
    if data['open_positions']:
        total_at_risk = sum(abs(p['open_premium']) for p in data['open_positions'])
        recommendations.append({"title": "Open Position Check", "text": f"You have {len(data['open_positions'])} open positions with ${total_at_risk:.0f} at risk. Set price targets and stop-losses for each."})

    return {
        "insights": insights,
        "warnings": warnings,
        "recommendations": recommendations,
        "stats": {
            "risk_reward": round(abs(s['avg_win'] / s['avg_loss']), 2) if s['avg_loss'] else 0,
            "avg_hold_days": round(sum(hold_days) / len(hold_days), 1) if hold_days else 0,
            "trades_per_month": round(s['total_trades'] / max(len(monthly), 1), 1),
            "profit_factor": round(sum(t['net_pnl'] for t in trades if t['net_pnl'] > 0) / abs(sum(t['net_pnl'] for t in trades if t['net_pnl'] < 0)), 2) if sum(t['net_pnl'] for t in trades if t['net_pnl'] < 0) != 0 else 0,
            "green_months": green_months,
            "total_months": total_months,
        }
    }

@app.get("/options-journal/live")
async def get_live_positions():
    """Get current prices for open positions"""
    if not _OPTIONS_DATA_PATH.exists():
        return {"error": "No data"}
    with open(_OPTIONS_DATA_PATH) as f:
        data = json.load(f)

    positions = data.get('open_positions', [])
    if not positions:
        return {"positions": [], "total_unrealized": 0}

    # Get current stock prices
    tickers = list(set(p['ticker'] for p in positions if p['ticker']))
    prices = {}
    try:
        import yfinance as yf
        for ticker in tickers:
            try:
                t = yf.Ticker(ticker)
                info = t.info
                prices[ticker] = {
                    "price": info.get('regularMarketPrice') or info.get('currentPrice') or info.get('previousClose', 0),
                    "change": info.get('regularMarketChange', 0),
                    "change_pct": info.get('regularMarketChangePercent', 0),
                }
            except:
                prices[ticker] = {"price": 0, "change": 0, "change_pct": 0}
    except ImportError:
        pass

    enriched = []
    for p in positions:
        ticker = p['ticker']
        stock_price = prices.get(ticker, {}).get('price', 0)
        # Estimate option value (rough intrinsic + some time value)
        if p['option_type'] == 'CALL':
            intrinsic = max(0, stock_price - p['strike']) * 100 * p['contracts']
        else:
            intrinsic = max(0, p['strike'] - stock_price) * 100 * p['contracts']
        cost = abs(p['open_premium'])
        unrealized = intrinsic - cost
        enriched.append({
            **p,
            "stock_price": stock_price,
            "stock_change": prices.get(ticker, {}).get('change', 0),
            "stock_change_pct": prices.get(ticker, {}).get('change_pct', 0),
            "intrinsic_value": round(intrinsic, 2),
            "cost_basis": round(cost, 2),
            "unrealized_pnl": round(unrealized, 2),
            "itm": (stock_price > p['strike'] if p['option_type'] == 'CALL' else stock_price < p['strike']),
        })

    total_unrealized = sum(p['unrealized_pnl'] for p in enriched)
    return {"positions": enriched, "total_unrealized": round(total_unrealized, 2), "prices": prices}

# Phase 8 Layer endpoints
try:
    from photonics_layers import router as layers_router
    app.include_router(layers_router)
    print("OK: Loaded photonics layers (direct)")
except ImportError:
    try:
        from app.photonics_layers import router as layers_router
        app.include_router(layers_router)
        print("OK: Loaded photonics layers (app.)")
    except Exception as e2:
        print(f"WARN: photonics layers not loaded: {e2}")
