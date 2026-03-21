"""
Stock Platform API — v4.0
Full-featured backend with Robinhood integration, yfinance charts,
and all frontend-compatible endpoints.
"""

import fastapi
from fastapi import FastAPI, HTTPException, Query, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from app.options_router import router as options_router
from app.signals_router import router as signals_router
from app.ai_router import router as ai_router
from app.extras_router import router as extras_router
from app.macro_router import router as macro_router
from app.notifications_router import router as notifications_router
from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime, timezone, timedelta
import asyncio, csv, glob as globmod, json, os, re, shutil, traceback, uuid, math

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
DISCORD_BOT_TOKEN = os.getenv("DISCORD_BOT_TOKEN", "")
DISCORD_CHANNEL_ID = os.getenv("DISCORD_CHANNEL_ID", "")
DISCORD_USER_ID = os.getenv("DISCORD_USER_ID", "")
TWITTER_USERNAME = os.getenv("TWITTER_USERNAME", "")

app = FastAPI(title="Stock Platform API", version="4.0.0")
from app.photonics_api import router as photonics_router
from app.photonics_technicals import router as photonics_technicals_router
from app.photonics_portfolio import router as photonics_portfolio_router
from app.photonics_advanced import router as photonics_advanced_router
app.include_router(photonics_router)
app.include_router(photonics_technicals_router)
app.include_router(photonics_portfolio_router)
app.include_router(photonics_advanced_router)
app.include_router(signals_router)
app.include_router(ai_router)
app.include_router(extras_router)
app.include_router(macro_router)
app.include_router(options_router)
app.include_router(notifications_router)
_cors_env = os.getenv("CORS_ORIGINS", "")
_cors_origins = [o.strip() for o in _cors_env.split(",") if o.strip()] if _cors_env else ["*"]
app.add_middleware(
    CORSMiddleware,
    allow_origins=_cors_origins, allow_methods=["*"],
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
NEWS_INTEL_CACHE = "cache:news:intelligence"
NEWS_BOOKMARKS_KEY = "news:bookmarks"

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


def compute_atr(highs, lows, closes, period=14):
    """Average True Range"""
    result = [None] * period
    trs = []
    for i in range(len(closes)):
        if i == 0:
            trs.append(highs[i] - lows[i])
        else:
            tr = max(highs[i] - lows[i], abs(highs[i] - closes[i-1]), abs(lows[i] - closes[i-1]))
            trs.append(tr)
    if len(trs) < period:
        return [None] * len(closes)
    atr_val = sum(trs[:period]) / period
    result.append(atr_val)
    for i in range(period + 1, len(trs)):
        atr_val = (atr_val * (period - 1) + trs[i]) / period
        result.append(atr_val)
    while len(result) < len(closes):
        result.append(None)
    return result[:len(closes)]

def compute_stochastic(highs, lows, closes, k_period=14, d_period=3):
    """%K and %D stochastic oscillator"""
    k_vals = []
    for i in range(len(closes)):
        if i < k_period - 1:
            k_vals.append(None)
        else:
            h_max = max(highs[i - k_period + 1:i + 1])
            l_min = min(lows[i - k_period + 1:i + 1])
            rng = h_max - l_min
            if rng == 0:
                k_vals.append(50.0)
            else:
                k_vals.append(((closes[i] - l_min) / rng) * 100)
    # %D = SMA of %K
    d_vals = []
    valid_k = [v for v in k_vals if v is not None]
    if len(valid_k) >= d_period:
        d_raw = compute_sma(valid_k, d_period)
        pad = len(k_vals) - len(d_raw)
        d_vals = [None] * pad + d_raw
    else:
        d_vals = [None] * len(k_vals)
    return {"k": k_vals, "d": d_vals}

def detect_patterns(opens, highs, lows, closes, dates):
    """Simple pattern detection: engulfing, doji, hammer, shooting star"""
    patterns = []
    for i in range(1, len(closes)):
        body = abs(closes[i] - opens[i])
        prev_body = abs(closes[i-1] - opens[i-1])
        upper_wick = highs[i] - max(opens[i], closes[i])
        lower_wick = min(opens[i], closes[i]) - lows[i]
        full_range = highs[i] - lows[i]
        if full_range == 0:
            continue
        # Bullish engulfing
        if (closes[i-1] < opens[i-1] and closes[i] > opens[i] and
            opens[i] <= closes[i-1] and closes[i] >= opens[i-1] and body > prev_body * 0.8):
            patterns.append({"pattern": "Bullish Engulfing", "index": i, "date": dates[i], "direction": "bull", "confidence": 0.7})
        # Bearish engulfing
        elif (closes[i-1] > opens[i-1] and closes[i] < opens[i] and
              opens[i] >= closes[i-1] and closes[i] <= opens[i-1] and body > prev_body * 0.8):
            patterns.append({"pattern": "Bearish Engulfing", "index": i, "date": dates[i], "direction": "bear", "confidence": 0.7})
        # Doji
        elif body < full_range * 0.1 and full_range > 0:
            patterns.append({"pattern": "Doji", "index": i, "date": dates[i], "direction": "neutral", "confidence": 0.5})
        # Hammer (bullish reversal)
        elif lower_wick > body * 2 and upper_wick < body * 0.5 and body > 0:
            patterns.append({"pattern": "Hammer", "index": i, "date": dates[i], "direction": "bull", "confidence": 0.6})
        # Shooting star (bearish reversal)
        elif upper_wick > body * 2 and lower_wick < body * 0.5 and body > 0:
            patterns.append({"pattern": "Shooting Star", "index": i, "date": dates[i], "direction": "bear", "confidence": 0.6})
    return patterns


@app.get("/technicals/{ticker}")
async def get_technicals(
    ticker: str,
    period: str = Query("3m", pattern="^(1d|5d|1m|3m|6m|1y|2y)$"),
):
    t = ticker.strip().upper()

    if yf is None:
        raise HTTPException(500, "yfinance not installed")

    period_map = {"1d": "5d", "5d": "1mo", "1m": "3mo", "3m": "3mo", "6m": "6mo", "1y": "1y", "2y": "2y"}
    interval_map = {"1d": "5m", "5d": "15m", "1m": "1d", "3m": "1d", "6m": "1d", "1y": "1d", "2y": "1wk"}
    yf_period = period_map.get(period, "3mo")
    yf_interval = interval_map.get(period, "1d")
    is_intraday = yf_interval in ("5m", "15m", "30m", "1h")

    try:
        stock = yf.Ticker(t)
        df = stock.history(period=yf_period, interval=yf_interval)
        if df.empty:
            raise ValueError("No data returned")
        # For intraday, only keep the most recent N days of data
        if period == "1d" and len(df) > 0:
            last_date = df.index[-1].date()
            df = df[df.index.date == last_date]
    except Exception as e:
        raise HTTPException(404, f"Could not fetch data for {t}: {e}")

    date_fmt = "%Y-%m-%d %H:%M" if is_intraday else "%Y-%m-%d"
    dates   = [d.strftime(date_fmt) for d in df.index]
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
    atr_vals  = compute_atr(highs, lows, closes, 14)
    stoch     = compute_stochastic(highs, lows, closes, 14, 3)

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
            "atr": round(atr_vals[i], 4) if i < len(atr_vals) and atr_vals[i] is not None else None,
            "stochK": round(stoch["k"][i], 2) if i < len(stoch["k"]) and stoch["k"][i] is not None else None,
            "stochD": round(stoch["d"][i], 2) if i < len(stoch["d"]) and stoch["d"][i] is not None else None,
        })

    # Detect patterns
    pats = detect_patterns(opens, highs, lows, closes, dates)

    return {"ticker": t, "period": period, "candles": candles, "patterns": pats}


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
#  FIDELITY AUTO-SYNC — watches iCloud + Downloads for new CSV exports
# ═══════════════════════════════════════════════════════════════════════
FIDELITY_CSV_DEST = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data", "positions.csv")
FIDELITY_SEARCH_DIRS = [
    os.path.expanduser("~/Library/Mobile Documents/com~apple~CloudDocs"),
    os.path.expanduser("~/Downloads"),
    os.path.expanduser("~/Desktop"),
]
FIDELITY_CSV_PATTERN = "Portfolio Positions*.csv"

def _find_latest_fidelity_csv():
    """Scan known directories for the most recent Fidelity CSV export."""
    best_path, best_mtime = None, 0
    for d in FIDELITY_SEARCH_DIRS:
        if not os.path.isdir(d):
            continue
        for f in globmod.glob(os.path.join(d, FIDELITY_CSV_PATTERN)):
            mtime = os.path.getmtime(f)
            if mtime > best_mtime:
                best_path, best_mtime = f, mtime
    return best_path, best_mtime

def _sync_fidelity_csv() -> dict:
    """Copy latest Fidelity CSV to data/positions.csv if it's newer."""
    src, src_mtime = _find_latest_fidelity_csv()
    if not src:
        return {"synced": False, "reason": "no_csv_found", "searched": FIDELITY_SEARCH_DIRS}

    # Check if dest already has the same or newer file
    dest_mtime = os.path.getmtime(FIDELITY_CSV_DEST) if os.path.exists(FIDELITY_CSV_DEST) else 0
    if src_mtime <= dest_mtime:
        return {
            "synced": False, "reason": "already_current",
            "source": src,
            "data_date": datetime.fromtimestamp(dest_mtime).isoformat(),
        }

    os.makedirs(os.path.dirname(FIDELITY_CSV_DEST), exist_ok=True)
    shutil.copy2(src, FIDELITY_CSV_DEST)
    # Clear cache so next positions request uses fresh data
    rdb.delete("cache:fidelity:positions")
    return {
        "synced": True,
        "source": os.path.basename(src),
        "data_date": datetime.fromtimestamp(src_mtime).isoformat(),
    }

@app.get("/portfolio/fidelity-sync")
async def fidelity_sync():
    """Manually trigger a sync from iCloud/Downloads."""
    result = _sync_fidelity_csv()
    # Also return freshness info
    if os.path.exists(FIDELITY_CSV_DEST):
        mtime = os.path.getmtime(FIDELITY_CSV_DEST)
        result["current_data_date"] = datetime.fromtimestamp(mtime).isoformat()
        result["age_minutes"] = round((datetime.now().timestamp() - mtime) / 60, 1)
    return result

@app.get("/portfolio/fidelity-freshness")
async def fidelity_freshness():
    """Check how fresh the current positions data is."""
    if not os.path.exists(FIDELITY_CSV_DEST):
        return {"has_data": False}
    mtime = os.path.getmtime(FIDELITY_CSV_DEST)
    age_min = (datetime.now().timestamp() - mtime) / 60
    # Check if there's a newer CSV available
    src, src_mtime = _find_latest_fidelity_csv()
    newer_available = src is not None and src_mtime > mtime
    return {
        "has_data": True,
        "data_date": datetime.fromtimestamp(mtime).isoformat(),
        "age_minutes": round(age_min, 1),
        "newer_available": newer_available,
        "newer_source": os.path.basename(src) if newer_available else None,
    }

async def _periodic_fidelity_sync():
    """Background task: check for new Fidelity CSVs every 60 seconds."""
    while True:
        await asyncio.sleep(60)  # 1 min (faster detection)
        try:
            result = _sync_fidelity_csv()
            if result.get("synced"):
                print(f"📊 Fidelity auto-sync: imported {result['source']}")
        except Exception as e:
            print(f"⚠️  Fidelity auto-sync error: {e}")


def _fetch_live_prices(tickers: list) -> dict:
    """Fetch real-time prices for a list of tickers using yfinance."""
    try:
        import yfinance as yf
        if not tickers:
            return {}
        # Batch download for efficiency
        data = yf.download(tickers, period="2d", progress=False, auto_adjust=True, threads=True)
        prices = {}
        if len(tickers) == 1:
            tk = tickers[0]
            if not data.empty:
                prices[tk] = {
                    "price": float(data["Close"].iloc[-1]),
                    "prev_close": float(data["Close"].iloc[-2]) if len(data) > 1 else float(data["Close"].iloc[-1]),
                }
        else:
            for tk in tickers:
                try:
                    close_col = data["Close"][tk].dropna()
                    if len(close_col) >= 2:
                        prices[tk] = {
                            "price": float(close_col.iloc[-1]),
                            "prev_close": float(close_col.iloc[-2]),
                        }
                    elif len(close_col) == 1:
                        prices[tk] = {
                            "price": float(close_col.iloc[-1]),
                            "prev_close": float(close_col.iloc[-1]),
                        }
                except Exception:
                    pass
        return prices
    except Exception as e:
        print(f"⚠️  Live price fetch error: {e}")
        return {}


async def _periodic_price_refresh():
    """Background task: refresh live prices every 30s during market hours."""
    while True:
        await asyncio.sleep(30)
        try:
            now = datetime.now()
            # Only refresh during extended market hours (4am-8pm ET, Mon-Fri)
            weekday = now.weekday()
            hour = now.hour
            if weekday < 5 and 4 <= hour <= 20:
                # Clear the live price cache to force refresh on next request
                rdb.delete("cache:fidelity:positions")
                rdb.delete("cache:fidelity:live_prices")
        except Exception:
            pass


# ═══════════════════════════════════════════════════════════════════════
#  FIDELITY POSITIONS (must come before /portfolio/{name} to avoid route conflict)
# ═══════════════════════════════════════════════════════════════════════
@app.get("/portfolio/fidelity-positions")
async def get_fidelity_positions(live: bool = True):
    cache_key = "cache:fidelity:positions"
    cached = rdb.get(cache_key)
    if cached:
        return json.loads(cached)

    csv_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data", "positions.csv")
    if not os.path.exists(csv_path):
        return {"error": "positions.csv not found", "positions": [], "summary": {}}

    positions = []
    with open(csv_path, "r", encoding="utf-8-sig") as f:
        reader = csv.DictReader(f)
        for row in reader:
            symbol = (row.get("Symbol") or "").strip()
            if not symbol:
                continue
            # Skip disclaimer rows
            acct = (row.get("Account Name") or "").strip()
            if not acct:
                continue

            is_cash = "MONEY MARKET" in (row.get("Description") or "").upper() or symbol.endswith("**")
            is_option = symbol.startswith("-") or symbol.startswith(" -")

            def parse_num(val):
                if not val:
                    return None
                val = val.strip().replace("$", "").replace(",", "").replace("+", "").replace("%", "")
                try:
                    return float(val)
                except (ValueError, TypeError):
                    return None

            positions.append({
                "account": acct,
                "account_number": (row.get("Account Number") or "").strip(),
                "symbol": symbol.strip().lstrip(" -"),
                "raw_symbol": symbol.strip(),
                "description": (row.get("Description") or "").strip(),
                "quantity": parse_num(row.get("Quantity")),
                "last_price": parse_num(row.get("Last Price")),
                "price_change": parse_num(row.get("Last Price Change")),
                "current_value": parse_num(row.get("Current Value")),
                "day_gain_dollar": parse_num(row.get("Today's Gain/Loss Dollar")),
                "day_gain_pct": parse_num(row.get("Today's Gain/Loss Percent")),
                "total_gain_dollar": parse_num(row.get("Total Gain/Loss Dollar")),
                "total_gain_pct": parse_num(row.get("Total Gain/Loss Percent")),
                "pct_of_account": parse_num(row.get("Percent Of Account")),
                "cost_basis": parse_num(row.get("Cost Basis Total")),
                "avg_cost": parse_num(row.get("Average Cost Basis")),
                "type": (row.get("Type") or "").strip(),
                "is_option": is_option,
                "is_cash": is_cash,
            })

    # ── Live price overlay ────────────────────────────────────────────
    live_updated = False
    if live:
        # Get unique stock tickers (not options, not cash)
        stock_tickers = list(set(
            p["symbol"] for p in positions
            if not p["is_option"] and not p["is_cash"] and p["quantity"]
        ))
        if stock_tickers:
            # Check for cached live prices (30s TTL)
            live_cache = rdb.get("cache:fidelity:live_prices")
            if live_cache:
                live_prices = json.loads(live_cache)
            else:
                live_prices = _fetch_live_prices(stock_tickers)
                if live_prices:
                    rdb.setex("cache:fidelity:live_prices", 30, json.dumps(live_prices))

            if live_prices:
                live_updated = True
                for p in positions:
                    if p["is_option"] or p["is_cash"]:
                        continue
                    lp = live_prices.get(p["symbol"])
                    if lp and p["quantity"]:
                        new_price = lp["price"]
                        prev_close = lp["prev_close"]
                        qty = p["quantity"]
                        avg_cost = p["avg_cost"] or 0
                        cost_total = p["cost_basis"] or (avg_cost * qty)

                        p["last_price"] = round(new_price, 2)
                        p["price_change"] = round(new_price - prev_close, 2)
                        p["current_value"] = round(new_price * qty, 2)
                        p["day_gain_dollar"] = round((new_price - prev_close) * qty, 2)
                        p["day_gain_pct"] = round(((new_price - prev_close) / prev_close * 100) if prev_close else 0, 2)
                        p["total_gain_dollar"] = round(new_price * qty - cost_total, 2)
                        p["total_gain_pct"] = round(((new_price * qty - cost_total) / cost_total * 100) if cost_total else 0, 2)

    # ── Recalculate totals (works whether live or CSV prices) ─────────
    accounts = list(set(p["account"] for p in positions))
    stocks = [p for p in positions if not p["is_option"] and not p["is_cash"]]
    options = [p for p in positions if p["is_option"]]
    cash_positions = [p for p in positions if p["is_cash"]]

    total_value = sum(p["current_value"] or 0 for p in positions)
    total_cost = sum(p["cost_basis"] or 0 for p in stocks)
    total_day_gain = sum(p["day_gain_dollar"] or 0 for p in positions if p["day_gain_dollar"] is not None)
    total_gain = sum(p["total_gain_dollar"] or 0 for p in positions if p["total_gain_dollar"] is not None)
    total_cash = sum(p["current_value"] or 0 for p in cash_positions)

    # Recalculate pct_of_account with live totals
    if total_value > 0:
        for p in positions:
            p["pct_of_account"] = round(((p["current_value"] or 0) / total_value) * 100, 2)

    acct_summary = {}
    for acct_name in accounts:
        acct_pos = [p for p in positions if p["account"] == acct_name]
        acct_summary[acct_name] = {
            "value": round(sum(p["current_value"] or 0 for p in acct_pos), 2),
            "day_gain": round(sum(p["day_gain_dollar"] or 0 for p in acct_pos if p["day_gain_dollar"] is not None), 2),
            "total_gain": round(sum(p["total_gain_dollar"] or 0 for p in acct_pos if p["total_gain_dollar"] is not None), 2),
            "positions": len([p for p in acct_pos if not p["is_cash"]]),
        }

    best = max(stocks, key=lambda p: p["total_gain_pct"] or -9999) if stocks else None
    worst = min(stocks, key=lambda p: p["total_gain_pct"] or 9999) if stocks else None

    result = {
        "accounts": sorted(accounts),
        "positions": positions,
        "live_prices": live_updated,
        "summary": {
            "total_value": round(total_value, 2),
            "total_cost": round(total_cost, 2),
            "total_day_gain": round(total_day_gain, 2),
            "day_gain": round(total_day_gain, 2),
            "total_gain": round(total_gain, 2),
            "total_gain_pct": round((total_gain / total_cost * 100) if total_cost else 0, 2),
            "total_cash": round(total_cash, 2),
            "num_stocks": len(stocks),
            "num_options": len(options),
            "num_total": len(positions),
            "best_performer": {"symbol": best["symbol"], "pct": best["total_gain_pct"]} if best else None,
            "worst_performer": {"symbol": worst["symbol"], "pct": worst["total_gain_pct"]} if worst else None,
            "accounts": acct_summary,
        }
    }

    # Cache for 30s (short TTL so live prices stay fresh)
    rdb.setex(cache_key, 30, json.dumps(result))
    return result


# ═══════════════════════════════════════════════════════════════════════
#  FIDELITY SECTORS
# ═══════════════════════════════════════════════════════════════════════
@app.get("/portfolio/fidelity-positions/sectors")
async def get_fidelity_sectors():
    """Get sector breakdown of Fidelity holdings."""
    cache_key = "cache:fidelity:sectors"
    cached = rdb.get(cache_key)
    if cached:
        return json.loads(cached)

    # Get positions from the fidelity cache
    pos_cache = rdb.get("cache:fidelity:positions")
    if not pos_cache:
        return {"sectors": []}

    data = json.loads(pos_cache)
    positions = data.get("positions", [])
    stocks = [p for p in positions if not p.get("is_option") and not p.get("is_cash") and p.get("symbol")]

    tickers = list(set(p["symbol"] for p in stocks))

    # Fetch sector info from yfinance
    import yfinance as yf
    sector_map = {}
    for tk in tickers:
        try:
            info = yf.Ticker(tk).info
            sector_map[tk] = info.get("sector", "Unknown")
        except Exception:
            sector_map[tk] = "Unknown"

    # Group by sector
    sector_data = {}
    for p in stocks:
        sector = sector_map.get(p["symbol"], "Unknown")
        if sector not in sector_data:
            sector_data[sector] = {"name": sector, "value": 0, "tickers": [], "pnl": 0}
        sector_data[sector]["value"] += p.get("current_value") or 0
        sector_data[sector]["pnl"] += p.get("total_gain_dollar") or 0
        if p["symbol"] not in sector_data[sector]["tickers"]:
            sector_data[sector]["tickers"].append(p["symbol"])

    total = sum(s["value"] for s in sector_data.values())
    SECTOR_COLORS = {"Technology":"#6366f1","Healthcare":"#10b981","Financial Services":"#f59e0b","Consumer Cyclical":"#ec4899","Communication Services":"#8b5cf6","Industrials":"#64748b","Consumer Defensive":"#14b8a6","Energy":"#f97316","Real Estate":"#06b6d4","Utilities":"#84cc16","Basic Materials":"#a78bfa","Unknown":"#475569"}

    sectors = sorted([
        {**s, "pct": round(s["value"] / total * 100, 1) if total else 0, "color": SECTOR_COLORS.get(s["name"], "#6366f1")}
        for s in sector_data.values()
    ], key=lambda x: -x["value"])

    result = {"sectors": sectors, "total": round(total, 2)}
    rdb.setex(cache_key, 600, json.dumps(result))
    return result


# ═══════════════════════════════════════════════════════════════════════
#  HOLDING DEEP DIVE
# ═══════════════════════════════════════════════════════════════════════
@app.get("/holding-deep-dive/{ticker}")
async def get_holding_deep_dive(ticker: str):
    """Deep dive data for a single holding: stats, analyst, insiders."""
    cache_key = f"cache:holding:{ticker.upper()}"
    cached = rdb.get(cache_key)
    if cached:
        return json.loads(cached)

    import yfinance as yf
    tk = yf.Ticker(ticker.upper())
    info = tk.info or {}

    # Key stats
    stats = {
        "pe": info.get("trailingPE"),
        "forward_pe": info.get("forwardPE"),
        "market_cap": info.get("marketCap"),
        "fifty_two_week_high": info.get("fiftyTwoWeekHigh"),
        "fifty_two_week_low": info.get("fiftyTwoWeekLow"),
        "current_price": info.get("currentPrice") or info.get("regularMarketPrice"),
        "sector": info.get("sector", "N/A"),
        "industry": info.get("industry", "N/A"),
        "dividend_yield": info.get("dividendYield"),
        "beta": info.get("beta"),
        "avg_volume": info.get("averageVolume"),
        "target_mean": info.get("targetMeanPrice"),
        "target_high": info.get("targetHighPrice"),
        "target_low": info.get("targetLowPrice"),
        "recommendation": info.get("recommendationKey"),
        "num_analysts": info.get("numberOfAnalystOpinions"),
        "short_pct": info.get("shortPercentOfFloat"),
        "earnings_date": None,
    }

    # 52-week range position (0-100%)
    if stats["fifty_two_week_low"] and stats["fifty_two_week_high"] and stats["current_price"]:
        rng = stats["fifty_two_week_high"] - stats["fifty_two_week_low"]
        stats["range_position"] = round((stats["current_price"] - stats["fifty_two_week_low"]) / rng * 100, 1) if rng > 0 else 50

    # Analyst recommendations
    analyst = {"buy": 0, "hold": 0, "sell": 0, "strong_buy": 0, "strong_sell": 0}
    try:
        recs = tk.recommendations
        if recs is not None and not recs.empty:
            latest = recs.tail(1).iloc[0]
            for col in recs.columns:
                col_lower = col.lower().replace(" ", "_")
                if col_lower in analyst:
                    analyst[col_lower] = int(latest[col]) if latest[col] else 0
    except Exception:
        pass

    # Insider transactions
    insiders = []
    try:
        ins = tk.insider_transactions
        if ins is not None and not ins.empty:
            for _, row in ins.head(5).iterrows():
                insiders.append({
                    "name": str(row.get("Insider Trading", row.get("Text", "Unknown"))),
                    "shares": int(row.get("Shares", 0)) if row.get("Shares") else 0,
                    "value": float(row.get("Value", 0)) if row.get("Value") else 0,
                    "date": str(row.get("Start Date", row.get("Date", ""))),
                })
    except Exception:
        pass

    result = {"ticker": ticker.upper(), "stats": stats, "analyst": analyst, "insiders": insiders}
    rdb.setex(cache_key, 600, json.dumps(result))
    return result


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
        return {"name": name, "holdings": {}, "cash": 0, "options": [], "account": {}}
    data = json.loads(raw)
    holdings = data.get("holdings", {})
    if isinstance(holdings, list):
        h_dict = {}
        for item in holdings:
            t = item.get("ticker", "")
            if t:
                h_dict[t] = {"shares": item.get("shares", 0), "cost_basis": item.get("cost_basis", 0)}
        holdings = h_dict
    return {
        "name": name,
        "holdings": holdings,
        "cash": data.get("cash", 0),
        "options": data.get("options", []),
        "account": data.get("account", {}),
    }

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

@app.get("/portfolio/{name}/sectors")
async def portfolio_sectors(name: str):
    """Get sector allocation for portfolio holdings"""
    raw = rdb.get(f"portfolio:{name}")
    if not raw:
        return {"sectors": {}}
    data = json.loads(raw)
    holdings = data.get("holdings", {})
    if isinstance(holdings, list):
        h_dict = {}
        for item in holdings:
            t = item.get("ticker", "")
            if t:
                h_dict[t] = {"shares": item.get("shares", 0), "cost_basis": item.get("cost_basis", 0)}
        holdings = h_dict
    sectors = {}
    for ticker, h in holdings.items():
        try:
            if yf is not None:
                info = yf.Ticker(ticker).info
                sector = info.get("sector", "Unknown")
                beta = info.get("beta", None)
            else:
                sector = "Unknown"
                beta = None
        except Exception:
            sector = "Unknown"
            beta = None
        cost_val = h.get("shares", 0) * h.get("cost_basis", 0)
        if sector not in sectors:
            sectors[sector] = {"value": 0, "tickers": [], "beta_sum": 0, "beta_count": 0}
        sectors[sector]["value"] += cost_val
        sectors[sector]["tickers"].append(ticker)
        if beta is not None:
            sectors[sector]["beta_sum"] += beta * cost_val
            sectors[sector]["beta_count"] += cost_val
    total = sum(s["value"] for s in sectors.values()) or 1
    result = {}
    for s, d in sectors.items():
        result[s] = {
            "value": round(d["value"], 2),
            "weight": round(d["value"] / total * 100, 1),
            "tickers": d["tickers"],
            "beta": round(d["beta_sum"] / d["beta_count"], 2) if d["beta_count"] > 0 else None,
        }
    return {"sectors": result}

@app.get("/portfolio/{name}/daily-pnl")
async def portfolio_daily_pnl(name: str):
    """Get 30-day daily portfolio P&L"""
    raw = rdb.get(f"portfolio:{name}")
    if not raw:
        return {"daily": []}
    data = json.loads(raw)
    holdings = data.get("holdings", {})
    if isinstance(holdings, list):
        h_dict = {}
        for item in holdings:
            t = item.get("ticker", "")
            if t:
                h_dict[t] = {"shares": item.get("shares", 0), "cost_basis": item.get("cost_basis", 0)}
        holdings = h_dict
    cash = data.get("cash", 0)
    if not holdings or yf is None:
        return {"daily": []}
    # Fetch 30-day history for all tickers
    tickers = list(holdings.keys())
    history_data = {}
    for t in tickers:
        try:
            df = yf.Ticker(t).history(period="1mo", interval="1d")
            if not df.empty:
                history_data[t] = {d.strftime("%Y-%m-%d"): round(float(v), 4) for d, v in zip(df.index, df["Close"])}
        except Exception:
            pass
    if not history_data:
        return {"daily": []}
    # Build daily values
    all_dates = sorted(set(d for prices in history_data.values() for d in prices.keys()))
    daily = []
    total_cost = sum(h["shares"] * h["cost_basis"] for h in holdings.values()) + cash
    for date in all_dates:
        value = cash
        for t, h in holdings.items():
            if t in history_data and date in history_data[t]:
                value += history_data[t][date] * h["shares"]
            else:
                value += h["cost_basis"] * h["shares"]
        pnl = value - total_cost
        pnl_pct = (pnl / total_cost * 100) if total_cost > 0 else 0
        daily.append({"date": date, "value": round(value, 2), "pnl": round(pnl, 2), "pnl_pct": round(pnl_pct, 2)})
    return {"daily": daily}

@app.get("/options/{ticker}/greeks")
async def get_options_greeks(ticker: str):
    """Get options chain with Greeks from yfinance"""
    t = ticker.strip().upper()
    if yf is None:
        raise HTTPException(500, "yfinance not installed")
    try:
        stock = yf.Ticker(t)
        expirations = stock.options
        if not expirations:
            return {"ticker": t, "expirations": []}
        result = []
        for exp in expirations[:4]:  # limit to next 4 expirations
            chain = stock.option_chain(exp)
            calls = []
            for _, row in chain.calls.iterrows():
                calls.append({
                    "strike": float(row["strike"]),
                    "lastPrice": float(row.get("lastPrice", 0)),
                    "volume": int(row.get("volume", 0) or 0),
                    "openInterest": int(row.get("openInterest", 0) or 0),
                    "impliedVolatility": round(float(row.get("impliedVolatility", 0) or 0) * 100, 1),
                    "inTheMoney": bool(row.get("inTheMoney", False)),
                })
            puts = []
            for _, row in chain.puts.iterrows():
                puts.append({
                    "strike": float(row["strike"]),
                    "lastPrice": float(row.get("lastPrice", 0)),
                    "volume": int(row.get("volume", 0) or 0),
                    "openInterest": int(row.get("openInterest", 0) or 0),
                    "impliedVolatility": round(float(row.get("impliedVolatility", 0) or 0) * 100, 1),
                    "inTheMoney": bool(row.get("inTheMoney", False)),
                })
            result.append({"expiration": exp, "calls": calls, "puts": puts})
        return {"ticker": t, "expirations": result}
    except Exception as e:
        raise HTTPException(500, f"Options error: {e}")

@app.get("/options/{ticker}/iv-stats")
async def get_iv_stats(ticker: str):
    """Get IV rank and percentile"""
    t = ticker.strip().upper()
    if yf is None:
        raise HTTPException(500, "yfinance not installed")
    try:
        stock = yf.Ticker(t)
        # Compute historical volatility from 1-year close prices
        df = stock.history(period="1y", interval="1d")
        if df.empty or len(df) < 30:
            return {"ticker": t, "currentIV": None, "ivRank": None, "ivPercentile": None}
        closes = [float(v) for v in df["Close"]]
        import math
        # Rolling 20-day HV
        hvs = []
        for i in range(20, len(closes)):
            rets = [math.log(closes[j] / closes[j-1]) for j in range(i-19, i+1) if closes[j-1] > 0]
            if rets:
                mean = sum(rets) / len(rets)
                var = sum((r - mean)**2 for r in rets) / max(len(rets)-1, 1)
                hv = math.sqrt(var * 252) * 100
                hvs.append(hv)
        if not hvs:
            return {"ticker": t, "currentIV": None, "ivRank": None, "ivPercentile": None}
        current = hvs[-1]
        iv_high = max(hvs)
        iv_low = min(hvs)
        iv_rank = ((current - iv_low) / (iv_high - iv_low) * 100) if iv_high > iv_low else 50
        iv_pct = sum(1 for h in hvs if h < current) / len(hvs) * 100
        return {
            "ticker": t,
            "currentIV": round(current, 1),
            "ivRank": round(iv_rank, 1),
            "ivPercentile": round(iv_pct, 1),
            "iv52High": round(iv_high, 1),
            "iv52Low": round(iv_low, 1),
        }
    except Exception as e:
        raise HTTPException(500, f"IV stats error: {e}")

@app.get("/patterns/{ticker}")
async def get_patterns(ticker: str, period: str = Query("3m", pattern="^(1d|5d|1m|3m|6m|1y|2y)$")):
    """Detect candlestick patterns"""
    t = ticker.strip().upper()
    if yf is None:
        raise HTTPException(500, "yfinance not installed")
    period_map = {"1d": "5d", "5d": "1mo", "1m": "3mo", "3m": "3mo", "6m": "6mo", "1y": "1y", "2y": "2y"}
    yf_period = period_map.get(period, "3mo")
    try:
        df = yf.Ticker(t).history(period=yf_period, interval="1d")
        if df.empty:
            return {"ticker": t, "patterns": []}
        opens = [float(v) for v in df["Open"]]
        highs = [float(v) for v in df["High"]]
        lows = [float(v) for v in df["Low"]]
        closes = [float(v) for v in df["Close"]]
        dates = [d.strftime("%Y-%m-%d") for d in df.index]
        pats = detect_patterns(opens, highs, lows, closes, dates)
        return {"ticker": t, "patterns": pats}
    except Exception as e:
        raise HTTPException(500, f"Pattern detection error: {e}")


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
#  NEWS INTELLIGENCE UTILITIES
# ═══════════════════════════════════════════════════════════════════════

BULLISH_WORDS = {"surge", "soar", "rally", "jump", "gain", "rise", "bull", "upgrade",
                 "beat", "outperform", "record", "boom", "breakout", "growth", "positive",
                 "strong", "buy", "upside", "momentum", "optimistic", "recovery", "profit",
                 "bullish", "highs", "surging", "advancing", "climbs"}
BEARISH_WORDS = {"crash", "plunge", "drop", "fall", "decline", "bear", "downgrade",
                 "miss", "underperform", "loss", "sell", "warning", "risk", "weak",
                 "negative", "recession", "cut", "layoff", "bankruptcy", "default", "fear",
                 "bearish", "lows", "tumble", "slump", "plummets", "selloff"}

SECTOR_KEYWORDS = {
    "Technology": ["tech", "software", "semiconductor", "ai ", "cloud", "saas", "aapl", "msft", "nvda", "googl", "meta", "chip"],
    "Finance": ["bank", "financial", "insurance", "lending", "jpm", "bac", "gs", "wall street", "fed ", "rate"],
    "Healthcare": ["pharma", "biotech", "health", "medical", "drug", "fda", "vaccine"],
    "Energy": ["oil", "gas", "energy", "solar", "wind", "renewable", "xom", "cvx", "opec"],
    "Consumer": ["retail", "consumer", "ecommerce", "amazon", "walmart", "amzn", "wmt", "spending"],
    "Crypto": ["bitcoin", "ethereum", "crypto", "blockchain", "btc", "eth", "defi", "token"],
    "Industrials": ["manufacturing", "industrial", "aerospace", "defense", "supply chain"],
    "Real Estate": ["reit", "real estate", "housing", "mortgage", "home"],
}


def classify_news_category(title: str, summary: str) -> str:
    text = (title + " " + summary).lower()
    if any(w in text for w in ["earnings", "revenue", "eps", "guidance", "quarterly", "fiscal", "profit margin", "beat estimates", "miss estimates"]):
        return "earnings"
    if any(w in text for w in ["bitcoin", "ethereum", "crypto", "blockchain", "defi", "nft", "btc ", "eth ", "token"]):
        return "crypto"
    if any(w in text for w in ["ai ", "artificial intelligence", "semiconductor", "chip", "software", "cloud", "saas", "tech giant"]):
        return "tech"
    if any(w in text for w in ["fed ", "rate ", "inflation", "gdp", "jobs report", "market ", "s&p", "dow ", "nasdaq", "bull ", "bear ", "recession", "rally"]):
        return "market"
    return "other"


def analyze_sentiment(title: str, summary: str):
    text = (title + " " + summary).lower()
    words = set(re.split(r'\W+', text))
    bull = len(words & BULLISH_WORDS)
    bear = len(words & BEARISH_WORDS)
    total = bull + bear
    if total == 0:
        return 0.0, "neutral"
    score = (bull - bear) / total
    label = "bullish" if score > 0.15 else "bearish" if score < -0.15 else "neutral"
    return round(score, 2), label


def extract_trending_topics(articles: list) -> list:
    stop_words = {"the", "a", "an", "is", "are", "was", "were", "to", "of", "in", "for",
                  "on", "and", "or", "at", "by", "with", "from", "that", "this", "it",
                  "be", "as", "has", "have", "had", "will", "not", "but", "its", "up",
                  "down", "new", "says", "said", "could", "would", "than", "after", "over",
                  "into", "about", "more", "been", "also", "what", "how", "why", "when",
                  "amid", "stocks", "stock", "market", "share", "shares", "price", "prices"}
    from collections import Counter
    word_counts = Counter()
    word_articles = {}
    for idx, article in enumerate(articles):
        words = re.findall(r'\b[a-z]{4,}\b', article.get("title", "").lower())
        for word in set(words):
            if word not in stop_words:
                word_counts[word] += 1
                word_articles.setdefault(word, []).append(idx)
    return [{"term": w, "count": c, "articles": word_articles[w]}
            for w, c in word_counts.most_common(25) if c >= 2]


def group_by_timeline(articles: list) -> dict:
    now = datetime.now(timezone.utc)
    today = now.date()
    yesterday = today - timedelta(days=1)
    groups = {"Today": [], "Yesterday": [], "This Week": [], "Older": []}
    for idx, a in enumerate(articles):
        try:
            pub_str = a.get("published", "")
            if not pub_str:
                groups["Older"].append(idx)
                continue
            pub = datetime.fromisoformat(pub_str.replace("Z", "+00:00")).date()
            if pub == today:
                groups["Today"].append(idx)
            elif pub == yesterday:
                groups["Yesterday"].append(idx)
            elif pub >= today - timedelta(days=7):
                groups["This Week"].append(idx)
            else:
                groups["Older"].append(idx)
        except Exception:
            groups["Older"].append(idx)
    return groups


def build_sector_heatmap(articles: list) -> dict:
    heatmap = {}
    for sector, keywords in SECTOR_KEYWORDS.items():
        count = 0
        sentiments = []
        for a in articles:
            text = (a.get("title", "") + " " + a.get("summary", "")).lower()
            if any(kw in text for kw in keywords):
                count += 1
                sentiments.append(a.get("sentiment", 0))
        if count > 0:
            heatmap[sector] = {
                "count": count,
                "sentiment_avg": round(sum(sentiments) / len(sentiments), 2) if sentiments else 0
            }
    return heatmap


# ═══════════════════════════════════════════════════════════════════════
#  NEWS
#  Frontend expects: GET /news → {articles: [{title,source,link,published,summary}]}
# ═══════════════════════════════════════════════════════════════════════
def _map_finnhub_news(items, enrich=False):
    result = []
    now = datetime.now(timezone.utc)
    for n in items:
        pub_dt = datetime.fromtimestamp(n.get("datetime", 0), tz=timezone.utc) if n.get("datetime") else None
        title = n.get("headline", "")
        summary = n.get("summary", "")

        article = {
            "title": title,
            "source": n.get("source", ""),
            "link": n.get("url", ""),
            "published": pub_dt.isoformat() if pub_dt else "",
            "summary": summary,
        }

        if enrich:
            # Relative time
            relative = ""
            if pub_dt:
                diff = now - pub_dt
                mins = int(diff.total_seconds() / 60)
                if mins < 0:
                    relative = "just now"
                elif mins < 60:
                    relative = f"{mins}m ago"
                elif mins < 1440:
                    relative = f"{mins // 60}h ago"
                else:
                    relative = f"{mins // 1440}d ago"

            # Tickers from text + Finnhub related field
            text_tickers = extract_tickers(title + " " + summary)
            related = [t.strip().upper() for t in (n.get("related", "") or "").split(",") if t.strip()]
            all_tickers = sorted(set(text_tickers + related))

            score, label = analyze_sentiment(title, summary)
            cat = classify_news_category(title, summary)

            article.update({
                "id": str(n.get("id", abs(hash(title + n.get("source", ""))))),
                "tickers": all_tickers,
                "category": cat,
                "sentiment": score,
                "sentiment_label": label,
                "relative_time": relative,
                "image": n.get("image", ""),
            })

        result.append(article)
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

@app.get("/news/intelligence")
async def news_intelligence():
    """Enriched news with sentiment, categories, trending topics, sector heatmap."""
    cached = rdb.get(NEWS_INTEL_CACHE)
    if cached:
        return json.loads(cached)
    try:
        data = await finnhub_get("/news", {"category": "general"})
        items = data[:50] if isinstance(data, list) else []
        articles = _map_finnhub_news(items, enrich=True)

        bull = sum(1 for a in articles if a.get("sentiment_label") == "bullish")
        bear = sum(1 for a in articles if a.get("sentiment_label") == "bearish")
        neutral = sum(1 for a in articles if a.get("sentiment_label") == "neutral")
        total = len(articles)
        top_tickers = {}
        for a in articles:
            for t in a.get("tickers", []):
                top_tickers[t] = top_tickers.get(t, 0) + 1
        most_mentioned = max(top_tickers, key=top_tickers.get) if top_tickers else "---"

        topics = extract_trending_topics(articles)
        heatmap = build_sector_heatmap(articles)
        timeline = group_by_timeline(articles)

        result = {
            "articles": articles,
            "stats": {
                "total_today": total,
                "most_mentioned_ticker": most_mentioned,
                "ticker_counts": dict(sorted(top_tickers.items(), key=lambda x: -x[1])[:10]),
                "sentiment_breakdown": {"bullish": bull, "bearish": bear, "neutral": neutral, "bullish_pct": round(bull / total * 100, 1) if total else 50},
                "trending_topics_count": len(topics),
            },
            "trending_topics": topics,
            "sector_heatmap": heatmap,
            "timeline_groups": timeline,
        }
        rdb.setex(NEWS_INTEL_CACHE, 120, json.dumps(result))
        return result
    except Exception as e:
        import traceback as _tb
        print(f"News intelligence error: {e}")
        _tb.print_exc()
        return {"articles": [], "stats": {}, "trending_topics": [], "sector_heatmap": {}, "timeline_groups": {}}

@app.get("/news/watchlist")
async def watchlist_news():
    """News for all watchlist + portfolio tickers, grouped by ticker."""
    tickers = rdb.smembers(WATCHLIST_KEY)
    portfolio_raw = rdb.hgetall("portfolio:default")
    ptickers = set(portfolio_raw.keys()) if portfolio_raw else set()
    all_tickers = sorted(set(t.upper() for t in tickers) | set(t.upper() for t in ptickers))
    if not all_tickers:
        return {"groups": [], "total": 0}
    groups = []
    today = datetime.now(timezone.utc).date()
    week_ago = today - timedelta(days=7)
    for ticker in all_tickers[:10]:
        cache_key = f"cache:news:ticker:{ticker}"
        cached = rdb.get(cache_key)
        if cached:
            articles = json.loads(cached)
        else:
            try:
                data = await finnhub_get("/company-news", {"symbol": ticker, "from": week_ago.isoformat(), "to": today.isoformat()})
                articles = _map_finnhub_news((data[:5] if isinstance(data, list) else []), enrich=True)
                rdb.setex(cache_key, 600, json.dumps(articles))
            except Exception:
                articles = []
        if articles:
            groups.append({"ticker": ticker, "articles": articles})
    return {"groups": groups, "total": sum(len(g["articles"]) for g in groups)}

@app.post("/news/bookmark")
async def bookmark_article(data: dict):
    rdb.sadd(NEWS_BOOKMARKS_KEY, json.dumps(data))
    return {"bookmarked": True}

@app.delete("/news/bookmark")
async def remove_bookmark(data: dict):
    aid = str(data.get("id", ""))
    for m in rdb.smembers(NEWS_BOOKMARKS_KEY):
        try:
            if str(json.loads(m).get("id", "")) == aid:
                rdb.srem(NEWS_BOOKMARKS_KEY, m)
                return {"removed": True}
        except Exception:
            pass
    return {"removed": False}

@app.get("/news/bookmarks")
async def get_bookmarks():
    members = rdb.smembers(NEWS_BOOKMARKS_KEY)
    return {"bookmarks": [json.loads(m) for m in members]}

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

    # ── Multi-Factor Scoring ──
    for r in filtered:
        if r.get("error"):
            continue
        # Value score (P/E based)
        pe_val = r.get("pe")
        if pe_val and pe_val > 0:
            if pe_val < 12: v_score = 90
            elif pe_val < 18: v_score = 70
            elif pe_val < 25: v_score = 50
            elif pe_val < 35: v_score = 30
            else: v_score = 10
        else:
            v_score = 40
        # Momentum score
        chg = r.get("change_pct") or 0
        from_52h = r.get("from_52h_pct") or 0
        m_score = max(0, min(100, chg * 5 + (100 + from_52h)))
        # Quality score
        q_score = 50
        if r.get("eps") and r["eps"] > 0: q_score += 20
        if r.get("dividend_yield") and r["dividend_yield"] > 0: q_score += 15
        fwd = r.get("forward_pe")
        if fwd and pe_val and fwd < pe_val: q_score += 15
        q_score = min(100, q_score)
        composite = round(v_score * 0.33 + m_score * 0.34 + q_score * 0.33)
        r["factor_scores"] = {"value": round(v_score), "momentum": round(m_score), "quality": round(q_score)}
        r["composite_score"] = composite

    # Momentum rank & percentile
    scored = [r for r in filtered if r.get("factor_scores")]
    scored.sort(key=lambda x: x["factor_scores"]["momentum"], reverse=True)
    for i, r in enumerate(scored):
        r["momentum_rank"] = i + 1
        r["momentum_pctile"] = round((1 - i / max(len(scored) - 1, 1)) * 100)

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


# ── Correlation Matrix ────────────────────────────────────────────────
@app.get("/correlation-matrix")
async def correlation_matrix(tickers: str = Query("SPY,QQQ,AAPL,MSFT,NVDA,TSLA,AMZN,GOOGL")):
    """Compute return correlation matrix for given tickers."""
    if not yf:
        raise HTTPException(500, "yfinance not available")
    symbols = [t.strip().upper() for t in tickers.split(",") if t.strip()][:20]
    try:
        data = yf.download(symbols, period="3mo", interval="1d", progress=False, auto_adjust=True)
        if data.empty:
            return {"matrix": [], "tickers": symbols}
        closes = data["Close"] if len(symbols) > 1 else data[["Close"]].rename(columns={"Close": symbols[0]})
        returns = closes.pct_change().dropna()
        corr = returns.corr()
        matrix = []
        valid_tickers = [t for t in symbols if t in corr.columns]
        for t1 in valid_tickers:
            row = []
            for t2 in valid_tickers:
                row.append(round(float(corr.loc[t1, t2]), 3))
            matrix.append(row)
        return {"matrix": matrix, "tickers": valid_tickers}
    except Exception as e:
        return {"matrix": [], "tickers": symbols, "error": str(e)}


# ── Sector Rotation Dashboard ─────────────────────────────────────────
@app.get("/sector-rotation")
async def sector_rotation():
    """Sector ETF performance across timeframes for rotation analysis."""
    if not yf:
        raise HTTPException(500, "yfinance not available")
    sector_etfs = {
        "XLK": "Technology", "XLV": "Healthcare", "XLF": "Financials",
        "XLE": "Energy", "XLI": "Industrials", "XLY": "Cons. Disc.",
        "XLP": "Cons. Staples", "XLU": "Utilities", "XLRE": "Real Estate",
        "XLB": "Materials", "XLC": "Comm. Svcs", "SPY": "S&P 500",
    }
    symbols = list(sector_etfs.keys())
    try:
        data = yf.download(symbols, period="6mo", interval="1d", progress=False, auto_adjust=True)
        if data.empty:
            return {"sectors": [], "error": "No data"}
        results = []
        for sym, name in sector_etfs.items():
            try:
                closes = data["Close"][sym] if len(symbols) > 1 else data["Close"]
                if closes.empty or len(closes) < 2:
                    continue
                current = float(closes.iloc[-1])
                d1 = round((current / float(closes.iloc[-2]) - 1) * 100, 2) if len(closes) > 1 else 0
                w1 = round((current / float(closes.iloc[-5]) - 1) * 100, 2) if len(closes) > 5 else 0
                m1 = round((current / float(closes.iloc[-21]) - 1) * 100, 2) if len(closes) > 21 else 0
                m3 = round((current / float(closes.iloc[-63]) - 1) * 100, 2) if len(closes) > 63 else 0
                momentum = round(d1 * 0.1 + w1 * 0.2 + m1 * 0.3 + m3 * 0.4, 2)
                spy_closes = data["Close"]["SPY"]
                spy_current = float(spy_closes.iloc[-1])
                spy_m1 = round((spy_current / float(spy_closes.iloc[-21]) - 1) * 100, 2) if len(spy_closes) > 21 else 0
                rel_strength = round(m1 - spy_m1, 2) if sym != "SPY" else 0
                results.append({
                    "symbol": sym, "name": name, "price": round(current, 2),
                    "1d": d1, "1w": w1, "1m": m1, "3m": m3,
                    "momentum": momentum, "relative_strength": rel_strength,
                })
            except Exception:
                continue
        results.sort(key=lambda x: x["momentum"], reverse=True)
        leaders = [r["symbol"] for r in results[:3] if r["symbol"] != "SPY"]
        laggards = [r["symbol"] for r in results[-3:] if r["symbol"] != "SPY"]
        return {"sectors": results, "leaders": leaders, "laggards": laggards}
    except Exception as e:
        return {"sectors": [], "error": str(e)}


# ── Monte Carlo Simulation ────────────────────────────────────────────
@app.post("/monte-carlo")
async def monte_carlo_simulation(body: dict):
    """Run Monte Carlo simulation on portfolio."""
    if not yf:
        raise HTTPException(500, "yfinance not available")
    tickers = body.get("tickers", [])
    weights = body.get("weights", [])
    initial_value = body.get("initial_value", 100000)
    days = body.get("days", 252)
    simulations = min(body.get("simulations", 1000), 5000)
    if not tickers:
        raw = rdb.get("portfolio:default")
        if raw:
            port = json.loads(raw)
            holdings = port.get("holdings", port)
            if isinstance(holdings, dict):
                tickers = list(holdings.keys())[:10]
                total = sum(
                    (h.get("shares", 0) * h.get("cost_basis", 0) if isinstance(h, dict) else 0)
                    for h in holdings.values()
                )
                weights = [
                    ((h.get("shares", 0) * h.get("cost_basis", 0)) / max(total, 1) if isinstance(h, dict) else 0)
                    for h in holdings.values()
                ]
            else:
                tickers = ["SPY"]
                weights = [1.0]
        else:
            tickers = ["SPY"]
            weights = [1.0]
    if not weights or len(weights) != len(tickers):
        weights = [1.0 / len(tickers)] * len(tickers)
    try:
        data = yf.download(tickers, period="2y", interval="1d", progress=False, auto_adjust=True)
        if data.empty:
            return {"error": "No data"}
        closes = data["Close"] if len(tickers) > 1 else data[["Close"]].rename(columns={"Close": tickers[0]})
        returns = closes.pct_change().dropna()
        port_returns = sum(returns[t] * w for t, w in zip(tickers, weights) if t in returns.columns)
        mean_return = float(port_returns.mean())
        std_return = float(port_returns.std())
        import random
        random.seed(42)
        final_values = []
        for _ in range(simulations):
            value = initial_value
            for d in range(days):
                daily_return = random.gauss(mean_return, std_return)
                value *= (1 + daily_return)
            final_values.append(value)
        final_values.sort()
        p5 = final_values[int(simulations * 0.05)]
        p25 = final_values[int(simulations * 0.25)]
        p50 = final_values[int(simulations * 0.50)]
        p75 = final_values[int(simulations * 0.75)]
        p95 = final_values[int(simulations * 0.95)]
        prob_loss = sum(1 for v in final_values if v < initial_value) / simulations
        var_95 = initial_value - p5
        var_99 = initial_value - final_values[int(simulations * 0.01)]
        bucket_size = (max(final_values) - min(final_values)) / 30
        dist = {}
        for v in final_values:
            bucket = round(min(final_values) + int((v - min(final_values)) / max(bucket_size, 1)) * bucket_size)
            dist[bucket] = dist.get(bucket, 0) + 1
        distribution = [{"value": k, "count": v} for k, v in sorted(dist.items())]
        return {
            "initial_value": initial_value, "days": days, "simulations": simulations,
            "percentiles": {"p5": round(p5, 2), "p25": round(p25, 2), "p50": round(p50, 2),
                           "p75": round(p75, 2), "p95": round(p95, 2)},
            "expected_return": round((p50 / initial_value - 1) * 100, 2),
            "prob_loss": round(prob_loss * 100, 1),
            "var_95": round(var_95, 2), "var_99": round(var_99, 2),
            "mean_daily_return": round(mean_return * 100, 4),
            "daily_volatility": round(std_return * 100, 4),
            "annual_volatility": round(std_return * (252 ** 0.5) * 100, 2),
            "distribution": distribution,
            "best_case": round(max(final_values), 2),
            "worst_case": round(min(final_values), 2),
        }
    except Exception as e:
        return {"error": str(e)}


# ── Portfolio Optimizer (Modern Portfolio Theory) ──────────────────────
@app.post("/portfolio-optimize")
async def portfolio_optimize(body: dict):
    """Find optimal portfolio weights using MPT."""
    if not yf:
        raise HTTPException(500, "yfinance not available")
    tickers = body.get("tickers", ["SPY", "QQQ", "TLT", "GLD", "VNQ"])
    target = body.get("target", "max_sharpe")
    total_amount = body.get("amount", 100000)
    try:
        data = yf.download(tickers, period="2y", interval="1d", progress=False, auto_adjust=True)
        if data.empty:
            return {"error": "No data"}
        closes = data["Close"] if len(tickers) > 1 else data[["Close"]].rename(columns={"Close": tickers[0]})
        returns = closes.pct_change().dropna()
        valid_tickers = [t for t in tickers if t in returns.columns]
        if len(valid_tickers) < 2:
            return {"error": "Need at least 2 valid tickers"}
        n = len(valid_tickers)
        mean_returns = {t: float(returns[t].mean()) * 252 for t in valid_tickers}
        vols = {t: float(returns[t].std()) * (252 ** 0.5) for t in valid_tickers}
        import random
        random.seed(42)
        portfolios = []
        best_sharpe = {"sharpe": -999, "weights": {}, "return": 0, "vol": 0}
        min_vol_port = {"vol": 999, "weights": {}, "return": 0, "sharpe": 0}
        for _ in range(10000):
            w = [random.random() for _ in range(n)]
            total_w = sum(w)
            w = [x / total_w for x in w]
            port_return = sum(w[i] * mean_returns[valid_tickers[i]] for i in range(n))
            port_vol = sum(w[i] ** 2 * vols[valid_tickers[i]] ** 2 for i in range(n)) ** 0.5
            sharpe = port_return / max(port_vol, 0.001)
            if sharpe > best_sharpe["sharpe"]:
                best_sharpe = {"sharpe": round(sharpe, 3), "weights": {valid_tickers[i]: round(w[i], 4) for i in range(n)},
                              "return": round(port_return * 100, 2), "vol": round(port_vol * 100, 2)}
            if port_vol < min_vol_port["vol"]:
                min_vol_port = {"vol": round(port_vol * 100, 2), "weights": {valid_tickers[i]: round(w[i], 4) for i in range(n)},
                               "return": round(port_return * 100, 2), "sharpe": round(sharpe, 3)}
            portfolios.append({"return": round(port_return * 100, 2), "vol": round(port_vol * 100, 2), "sharpe": round(sharpe, 3)})
        chosen = best_sharpe if target == "max_sharpe" else min_vol_port
        allocations = []
        for t in valid_tickers:
            w = chosen["weights"].get(t, 0)
            price = float(closes[t].iloc[-1])
            dollar = total_amount * w
            allocations.append({
                "ticker": t, "weight": round(w * 100, 2), "price": round(price, 2),
                "dollar_amount": round(dollar, 2), "shares": int(dollar / price) if price > 0 else 0,
                "annual_return": round(mean_returns[t] * 100, 2), "annual_vol": round(vols[t] * 100, 2),
            })
        frontier = sorted(random.sample(portfolios, min(200, len(portfolios))), key=lambda x: x["vol"])
        return {
            "optimal": chosen, "allocations": allocations,
            "target": target, "total_amount": total_amount,
            "frontier": frontier[:100],
            "max_sharpe": best_sharpe, "min_volatility": min_vol_port,
        }
    except Exception as e:
        return {"error": str(e)}


# ── Market Breadth ────────────────────────────────────────────────────
@app.get("/market-breadth")
async def market_breadth():
    """Market breadth indicators: advance/decline, new highs/lows, % above SMAs."""
    if not yf:
        raise HTTPException(500, "yfinance not available")
    sp500_sample = ["AAPL","MSFT","AMZN","NVDA","GOOGL","META","TSLA","BRK-B","UNH","JNJ",
                    "JPM","V","PG","XOM","HD","MA","CVX","MRK","ABBV","PFE","COST","AVGO",
                    "KO","PEP","LLY","TMO","WMT","MCD","CSCO","ABT","CRM","ACN","DHR","NKE",
                    "TXN","NEE","UPS","PM","RTX","LOW","INTC","AMD","QCOM","INTU","AMAT"]
    try:
        data = yf.download(sp500_sample, period="1y", interval="1d", progress=False, auto_adjust=True)
        if data.empty:
            return {"error": "No data"}
        advancing = 0; declining = 0; unchanged = 0
        above_20sma = 0; above_50sma = 0; above_200sma = 0
        new_52w_high = 0; new_52w_low = 0
        for sym in sp500_sample:
            try:
                closes = data["Close"][sym] if len(sp500_sample) > 1 else data["Close"]
                if closes.empty or len(closes) < 2:
                    continue
                current = float(closes.iloc[-1])
                prev = float(closes.iloc[-2])
                if current > prev: advancing += 1
                elif current < prev: declining += 1
                else: unchanged += 1
                sma20 = float(closes.tail(20).mean()) if len(closes) >= 20 else None
                sma50 = float(closes.tail(50).mean()) if len(closes) >= 50 else None
                sma200 = float(closes.tail(200).mean()) if len(closes) >= 200 else None
                if sma20 and current > sma20: above_20sma += 1
                if sma50 and current > sma50: above_50sma += 1
                if sma200 and current > sma200: above_200sma += 1
                high_52w = float(closes.max())
                low_52w = float(closes.min())
                if current >= high_52w * 0.98: new_52w_high += 1
                if current <= low_52w * 1.02: new_52w_low += 1
            except Exception:
                continue
        total = advancing + declining + unchanged
        ad_ratio = round(advancing / max(declining, 1), 2)
        pct_above_20 = round(above_20sma / max(total, 1) * 100, 1)
        pct_above_50 = round(above_50sma / max(total, 1) * 100, 1)
        pct_above_200 = round(above_200sma / max(total, 1) * 100, 1)
        breadth_thrust = round((advancing - declining) / max(total, 1) * 100, 1)
        return {
            "advancing": advancing, "declining": declining, "unchanged": unchanged,
            "advance_decline_ratio": ad_ratio, "breadth_thrust": breadth_thrust,
            "pct_above_sma20": pct_above_20, "pct_above_sma50": pct_above_50,
            "pct_above_sma200": pct_above_200,
            "new_highs": new_52w_high, "new_lows": new_52w_low,
            "mcclellan_oscillator": breadth_thrust,
            "total_stocks": total,
            "breadth_signal": "bullish" if pct_above_200 > 60 else "bearish" if pct_above_200 < 40 else "neutral",
        }
    except Exception as e:
        return {"error": str(e)}


# ── Insider Trading ───────────────────────────────────────────────────
@app.get("/insider/{ticker}")
async def insider_trading(ticker: str):
    """Get insider trading activity."""
    ticker = ticker.upper()
    try:
        if yf:
            tk = yf.Ticker(ticker)
            insider_txns = []
            try:
                purchases = tk.insider_purchases
                if purchases is not None and not purchases.empty:
                    for _, row in purchases.head(10).iterrows():
                        insider_txns.append({
                            "name": str(row.get("Insider Trading", row.get("Text", "Unknown"))),
                            "shares": str(row.get("Shares", "N/A")),
                            "type": "purchase",
                        })
            except Exception:
                pass
            try:
                roster = tk.insider_roster_holders
                if roster is not None and not roster.empty:
                    for _, row in roster.head(10).iterrows():
                        insider_txns.append({
                            "name": str(row.get("Name", "Unknown")),
                            "position": str(row.get("Position", "N/A")),
                            "shares": str(row.get("Shares", "N/A")),
                            "latest_date": str(row.get("Latest Transaction Date", "N/A")),
                            "type": "holder",
                        })
            except Exception:
                pass
            inst_holders = []
            try:
                inst = tk.institutional_holders
                if inst is not None and not inst.empty:
                    for _, row in inst.head(10).iterrows():
                        inst_holders.append({
                            "holder": str(row.get("Holder", "Unknown")),
                            "shares": int(row.get("Shares", 0)) if not str(row.get("Shares", "")).startswith("N") else 0,
                            "pct_held": str(row.get("% Out", "N/A")),
                            "date_reported": str(row.get("Date Reported", "N/A")),
                        })
            except Exception:
                pass
            return {
                "ticker": ticker, "insider_transactions": insider_txns,
                "institutional_holders": inst_holders,
                "net_insider_sentiment": "buying" if sum(1 for t in insider_txns if t.get("type") == "purchase") > 0 else "neutral",
            }
    except Exception as e:
        return {"ticker": ticker, "error": str(e)}


# ── Dark Pool / Large Block Detection ─────────────────────────────────
@app.get("/dark-pool/{ticker}")
async def dark_pool_activity(ticker: str, period: str = Query("1mo")):
    """Detect unusual volume and potential block trades."""
    if not yf:
        raise HTTPException(500, "yfinance not available")
    try:
        data = yf.Ticker(ticker.upper()).history(period=period, interval="1d")
        if data.empty:
            return {"error": "No data"}
        avg_vol = float(data["Volume"].mean())
        results = []
        for idx, row in data.iterrows():
            vol = float(row["Volume"])
            vol_ratio = round(vol / max(avg_vol, 1), 2)
            price_range = float(row["High"] - row["Low"])
            avg_range = float((data["High"] - data["Low"]).mean())
            if vol_ratio > 2.0:
                results.append({
                    "date": idx.strftime("%Y-%m-%d"),
                    "volume": int(vol), "avg_volume": int(avg_vol),
                    "vol_ratio": vol_ratio,
                    "close": round(float(row["Close"]), 2),
                    "change_pct": round((float(row["Close"]) - float(row["Open"])) / max(float(row["Open"]), 0.01) * 100, 2),
                    "range_vs_avg": round(price_range / max(avg_range, 0.01), 2),
                    "signal": "block_buy" if float(row["Close"]) > float(row["Open"]) else "block_sell",
                })
        current = float(data["Close"].iloc[-1])
        today_vol = float(data["Volume"].iloc[-1])
        today_ratio = round(today_vol / max(avg_vol, 1), 2)
        return {
            "ticker": ticker.upper(), "unusual_days": results,
            "avg_volume": int(avg_vol), "today_volume": int(today_vol),
            "today_vol_ratio": today_ratio,
            "accumulation": sum(1 for r in results if r["signal"] == "block_buy"),
            "distribution": sum(1 for r in results if r["signal"] == "block_sell"),
        }
    except Exception as e:
        return {"error": str(e)}


# ── Dashboard Market Pulse ────────────────────────────────────────────
MARKET_PULSE_CACHE = "cache:market_pulse"

@app.get("/dashboard/market-pulse")
async def dashboard_market_pulse():
    """Aggregated market intelligence: regime, fear/greed, sectors, yields."""
    cached = rdb.get(MARKET_PULSE_CACHE)
    if cached:
        return json.loads(cached)
    result = {}
    vix_current = 20
    current = 0; sma50 = 1
    # 1. Market Regime
    try:
        spy_hist = yf.Ticker("SPY").history(period="3mo", interval="1d")
        vix_tk = yf.Ticker("^VIX")
        vix_hist = vix_tk.history(period="1mo", interval="1d")
        spy_closes = [float(v) for v in spy_hist["Close"]]
        vix_current = float(vix_hist["Close"].iloc[-1]) if not vix_hist.empty else 20
        sma20 = sum(spy_closes[-20:]) / 20 if len(spy_closes) >= 20 else spy_closes[-1]
        sma50 = sum(spy_closes[-50:]) / 50 if len(spy_closes) >= 50 else spy_closes[-1]
        current = spy_closes[-1]
        trend_score = 0
        if current > sma20: trend_score += 1
        if current > sma50: trend_score += 1
        if sma20 > sma50: trend_score += 1
        if vix_current < 15: vol_regime = "low_vol"
        elif vix_current < 22: vol_regime = "normal"
        elif vix_current < 30: vol_regime = "elevated"
        else: vol_regime = "crisis"
        if trend_score >= 2 and vix_current < 22:
            regime = "BULL"; confidence = min(90, 60 + trend_score * 10)
        elif trend_score <= 1 and vix_current > 25:
            regime = "BEAR"; confidence = min(90, 50 + int(30 - min(vix_current, 30)))
        elif vix_current > 22:
            regime = "VOLATILE"; confidence = min(85, 50 + int(vix_current - 22) * 3)
        else:
            regime = "NEUTRAL"; confidence = 50
        result["regime"] = {
            "label": regime, "confidence": confidence,
            "vix": round(vix_current, 2), "vol_regime": vol_regime,
            "spy_vs_sma20": round((current / sma20 - 1) * 100, 2),
            "spy_vs_sma50": round((current / sma50 - 1) * 100, 2),
            "trend_score": trend_score,
        }
    except Exception as e:
        result["regime"] = {"label": "UNKNOWN", "confidence": 0, "error": str(e)}
    # 2. Fear & Greed Composite
    try:
        vix_score = max(0, min(100, 100 - (vix_current - 10) * 5))
        momentum_pct = (current / sma50 - 1) * 100 if sma50 > 0 else 0
        momentum_score = max(0, min(100, 50 + momentum_pct * 5))
        macro_cached = rdb.get("cache:macro:quotes")
        pos_count = 0; total_count = 0
        if macro_cached:
            macro_items = json.loads(macro_cached)
            for m in macro_items:
                if m.get("change_pct") is not None:
                    total_count += 1
                    if m["change_pct"] > 0: pos_count += 1
        breadth_score = (pos_count / max(total_count, 1)) * 100
        fear_greed = round(vix_score * 0.35 + momentum_score * 0.35 + breadth_score * 0.30)
        if fear_greed >= 75: fg_label = "EXTREME GREED"
        elif fear_greed >= 55: fg_label = "GREED"
        elif fear_greed >= 45: fg_label = "NEUTRAL"
        elif fear_greed >= 25: fg_label = "FEAR"
        else: fg_label = "EXTREME FEAR"
        result["fear_greed"] = {
            "score": fear_greed, "label": fg_label,
            "components": {"vix": round(vix_score), "momentum": round(momentum_score), "breadth": round(breadth_score)},
        }
    except Exception:
        result["fear_greed"] = {"score": 50, "label": "NEUTRAL", "components": {}}
    # 3. Sector Performance
    sector_etfs = {
        "XLK": "Tech", "XLV": "Health", "XLF": "Financials",
        "XLE": "Energy", "XLI": "Industrial", "XLY": "Cons Disc",
        "XLP": "Cons Stap", "XLU": "Utilities", "XLRE": "Real Est",
        "XLB": "Materials", "XLC": "Comm Svcs",
    }
    try:
        sector_results = []
        for sym, name in sector_etfs.items():
            try:
                tk = yf.Ticker(sym)
                fi = tk.fast_info
                price = getattr(fi, "last_price", None)
                prev = getattr(fi, "previous_close", None)
                chg_pct = round((price - prev) / prev * 100, 2) if price and prev else 0
                sector_results.append({"symbol": sym, "name": name, "change_pct": chg_pct, "price": round(price, 2) if price else 0})
            except Exception:
                sector_results.append({"symbol": sym, "name": name, "change_pct": 0, "price": 0})
        sector_results.sort(key=lambda x: x["change_pct"], reverse=True)
        result["sectors"] = sector_results
    except Exception:
        result["sectors"] = []
    # 4. Yield Curve Proxy
    try:
        tlt = yf.Ticker("TLT").fast_info
        shy = yf.Ticker("SHY").fast_info
        tlt_price = getattr(tlt, "last_price", None)
        shy_price = getattr(shy, "last_price", None)
        tlt_prev = getattr(tlt, "previous_close", None)
        shy_prev = getattr(shy, "previous_close", None)
        tlt_chg = round((tlt_price - tlt_prev) / tlt_prev * 100, 2) if tlt_price and tlt_prev else 0
        shy_chg = round((shy_price - shy_prev) / shy_prev * 100, 2) if shy_price and shy_prev else 0
        result["yields"] = {
            "tlt_price": round(tlt_price, 2) if tlt_price else None,
            "tlt_change_pct": tlt_chg,
            "shy_price": round(shy_price, 2) if shy_price else None,
            "shy_change_pct": shy_chg,
            "spread_signal": "steepening" if tlt_chg < shy_chg else "flattening",
        }
    except Exception:
        result["yields"] = {}
    rdb.setex(MARKET_PULSE_CACHE, 60, json.dumps(result))
    return result


# ── Portfolio Risk Analytics ──────────────────────────────────────────
@app.get("/portfolio/{name}/risk-analytics")
async def portfolio_risk_analytics(name: str):
    """Professional portfolio risk metrics: VaR, CVaR, Sharpe, drawdown, beta."""
    raw = rdb.get(f"portfolio:{name}")
    if not raw or yf is None:
        return {"error": "No portfolio data or yfinance unavailable"}
    data = json.loads(raw)
    holdings = data.get("holdings", {})
    if isinstance(holdings, list):
        h_dict = {}
        for item in holdings:
            t = item.get("ticker", "")
            if t: h_dict[t] = {"shares": item.get("shares", 0), "cost_basis": item.get("cost_basis", 0)}
        holdings = h_dict
    cash = data.get("cash", 0)
    if not holdings:
        return {"error": "Empty portfolio"}
    tickers = list(holdings.keys())
    try:
        import pandas as pd
        dl_tickers = tickers + ["SPY"]
        df = yf.download(dl_tickers, period="6mo", interval="1d", progress=False, auto_adjust=True)
    except Exception as e:
        return {"error": f"Data fetch failed: {e}"}
    if df.empty:
        return {"error": "No price data"}
    multi = len(dl_tickers) > 1
    weights = {}; total_val = cash
    for t in tickers:
        try:
            price = float(df["Close"][t].iloc[-1]) if multi else float(df["Close"].iloc[-1])
            total_val += price * holdings[t].get("shares", 0)
        except Exception:
            total_val += holdings[t].get("cost_basis", 0) * holdings[t].get("shares", 0)
    for t in tickers:
        try:
            price = float(df["Close"][t].iloc[-1]) if multi else float(df["Close"].iloc[-1])
            weights[t] = (price * holdings[t].get("shares", 0)) / total_val if total_val > 0 else 0
        except Exception:
            weights[t] = 0
    port_returns = []; spy_returns = []; dates = []
    for i in range(1, len(df)):
        daily_ret = 0
        for t in tickers:
            try:
                prev_p = float(df["Close"][t].iloc[i-1]) if multi else float(df["Close"].iloc[i-1])
                curr_p = float(df["Close"][t].iloc[i]) if multi else float(df["Close"].iloc[i])
                if prev_p > 0: daily_ret += weights.get(t, 0) * ((curr_p / prev_p) - 1)
            except Exception:
                pass
        port_returns.append(daily_ret)
        try:
            spy_prev = float(df["Close"]["SPY"].iloc[i-1]) if multi else float(df["Close"].iloc[i-1])
            spy_curr = float(df["Close"]["SPY"].iloc[i]) if multi else float(df["Close"].iloc[i])
            spy_returns.append((spy_curr / spy_prev) - 1 if spy_prev > 0 else 0)
        except Exception:
            spy_returns.append(0)
        try:
            dates.append(df.index[i].strftime("%Y-%m-%d"))
        except Exception:
            dates.append(str(i))
    if not port_returns:
        return {"error": "Insufficient data"}
    n = len(port_returns)
    sorted_rets = sorted(port_returns)
    var_95 = -sorted_rets[max(int(n * 0.05), 0)] * total_val
    var_99 = -sorted_rets[max(int(n * 0.01), 0)] * total_val
    cutoff_95 = max(int(n * 0.05), 1)
    cvar_95 = -sum(sorted_rets[:cutoff_95]) / cutoff_95 * total_val
    avg_ret = sum(port_returns) / n
    std_ret = (sum((r - avg_ret)**2 for r in port_returns) / max(n-1, 1)) ** 0.5
    sharpe = ((avg_ret - 0.05/252) / std_ret * (252 ** 0.5)) if std_ret > 0 else 0
    downside = [r for r in port_returns if r < 0]
    downside_std = (sum(r**2 for r in downside) / max(len(downside)-1, 1)) ** 0.5 if downside else 0.001
    sortino = ((avg_ret - 0.05/252) / downside_std * (252 ** 0.5)) if downside_std > 0 else 0
    cumulative = [1.0]
    for r in port_returns:
        cumulative.append(cumulative[-1] * (1 + r))
    peak = cumulative[0]; max_dd = 0; dd_series = []
    for i, v in enumerate(cumulative):
        peak = max(peak, v)
        dd = (v / peak - 1) * 100
        dd_series.append({"date": dates[i-1] if i > 0 and i-1 < len(dates) else dates[0] if dates else "", "drawdown": round(dd, 2)})
        max_dd = min(max_dd, dd)
    if spy_returns:
        spy_avg = sum(spy_returns) / len(spy_returns)
        cov = sum((p - avg_ret) * (s - spy_avg) for p, s in zip(port_returns, spy_returns)) / max(n-1, 1)
        spy_var = sum((s - spy_avg)**2 for s in spy_returns) / max(n-1, 1)
        beta = cov / spy_var if spy_var > 0 else 1.0
    else:
        beta = 1.0
    ann_ret = avg_ret * 252
    calmar = ann_ret / abs(max_dd / 100) if max_dd != 0 else 0
    ann_vol = std_ret * (252 ** 0.5) * 100
    return {
        "total_value": round(total_val, 2),
        "var_95_1d": round(var_95, 2), "var_99_1d": round(var_99, 2), "cvar_95_1d": round(cvar_95, 2),
        "sharpe_ratio": round(sharpe, 2), "sortino_ratio": round(sortino, 2), "beta": round(beta, 2),
        "max_drawdown_pct": round(max_dd, 2), "calmar_ratio": round(calmar, 2),
        "annualized_vol": round(ann_vol, 2), "annualized_return": round(ann_ret * 100, 2),
        "drawdown_series": dd_series[-60:],
        "lookback_days": n,
    }


# ── Portfolio Stress Scenarios ────────────────────────────────────────
@app.get("/portfolio/{name}/stress-scenarios")
async def portfolio_stress_scenarios(name: str):
    """Run stress test scenarios against portfolio holdings."""
    raw = rdb.get(f"portfolio:{name}")
    if not raw or yf is None:
        return {"scenarios": []}
    data = json.loads(raw)
    holdings = data.get("holdings", {})
    if isinstance(holdings, list):
        h_dict = {}
        for item in holdings:
            t = item.get("ticker", "")
            if t: h_dict[t] = {"shares": item.get("shares", 0), "cost_basis": item.get("cost_basis", 0)}
        holdings = h_dict
    cash = data.get("cash", 0)
    tickers = list(holdings.keys())
    positions = []; total_val = cash
    for t in tickers:
        try:
            info = yf.Ticker(t).info
            price = info.get("currentPrice") or info.get("previousClose", 0)
            beta_val = info.get("beta", 1.0) or 1.0
            sector = info.get("sector", "Unknown")
            mkt_val = price * holdings[t].get("shares", 0)
            total_val += mkt_val
            positions.append({"ticker": t, "price": price, "beta": beta_val, "sector": sector, "mkt_val": mkt_val})
        except Exception:
            cb = holdings[t].get("cost_basis", 0); sh = holdings[t].get("shares", 0)
            mkt_val = cb * sh; total_val += mkt_val
            positions.append({"ticker": t, "price": cb, "beta": 1.0, "sector": "Unknown", "mkt_val": mkt_val})
    scenarios = [
        {"name": "Market -10%", "desc": "Broad market correction", "spy_move": -10, "icon": "\u26a1", "sector_adj": {}},
        {"name": "Market -20%", "desc": "Bear market", "spy_move": -20, "icon": "\U0001f4c9", "sector_adj": {}},
        {"name": "Flash Crash -5%", "desc": "Single day flash crash", "spy_move": -5, "icon": "\U0001f4a5", "sector_adj": {}},
        {"name": "Rate Shock", "desc": "100bps rate hike, growth crushed", "spy_move": -8, "icon": "\U0001f3e6",
         "sector_adj": {"Technology": 1.3, "Real Estate": 1.5, "Consumer Cyclical": 1.2}},
        {"name": "Recession", "desc": "GDP -2%, broad selloff", "spy_move": -25, "icon": "\U0001f534",
         "sector_adj": {"Consumer Cyclical": 1.4, "Technology": 1.1, "Energy": 1.3, "Industrials": 1.2}},
        {"name": "Bull +15%", "desc": "Strong rally, soft landing", "spy_move": 15, "icon": "\U0001f7e2", "sector_adj": {}},
    ]
    results = []
    for scenario in scenarios:
        spy_move = scenario["spy_move"]
        sector_adj = scenario.get("sector_adj", {})
        portfolio_impact = 0; position_impacts = []
        for pos in positions:
            multiplier = sector_adj.get(pos["sector"], 1.0)
            stock_move = spy_move * pos["beta"] * multiplier
            dollar_impact = pos["mkt_val"] * (stock_move / 100)
            portfolio_impact += dollar_impact
            position_impacts.append({"ticker": pos["ticker"], "move_pct": round(stock_move, 1), "dollar_impact": round(dollar_impact, 2)})
        results.append({
            "name": scenario["name"], "desc": scenario["desc"], "icon": scenario["icon"],
            "portfolio_impact": round(portfolio_impact, 2),
            "portfolio_impact_pct": round(portfolio_impact / max(total_val, 1) * 100, 2),
            "positions": sorted(position_impacts, key=lambda x: x["dollar_impact"]),
        })
    return {"total_value": round(total_val, 2), "scenarios": results}


# ── Community: Discord Presence (Lanyard API) ─────────────────────────
@app.get("/community/discord/presence")
async def discord_presence():
    """Get Discord user presence via Lanyard API (free, no auth)."""
    if not DISCORD_USER_ID:
        return {"error": "DISCORD_USER_ID not configured", "status": "offline", "username": "Not configured"}
    cached = rdb.get("cache:discord:presence")
    if cached:
        return json.loads(cached)
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            r = await client.get(f"https://api.lanyard.rest/v1/users/{DISCORD_USER_ID}")
            data = r.json()
        if not data.get("success"):
            return {"error": data.get("error", {}).get("message", "Lanyard error"), "status": "offline"}
        d = data["data"]
        user = d.get("discord_user", {})
        avatar_hash = user.get("avatar", "")
        avatar_url = f"https://cdn.discordapp.com/avatars/{user.get('id', '')}/{avatar_hash}.png?size=128" if avatar_hash else ""
        activities = []
        for a in d.get("activities", []):
            if a.get("type") == 4:  # Custom status
                continue
            activities.append({
                "name": a.get("name", ""),
                "type": a.get("type", 0),
                "details": a.get("details", ""),
                "state": a.get("state", ""),
            })
        spotify = None
        if d.get("spotify"):
            sp = d["spotify"]
            spotify = {
                "song": sp.get("song", ""),
                "artist": sp.get("artist", ""),
                "album": sp.get("album", ""),
                "album_art_url": sp.get("album_art_url", ""),
            }
        custom_status = None
        for a in d.get("activities", []):
            if a.get("type") == 4:
                custom_status = a.get("state", "")
                break
        result = {
            "user_id": user.get("id", ""),
            "username": user.get("global_name") or user.get("username", "Unknown"),
            "discriminator": user.get("discriminator", "0"),
            "avatar_url": avatar_url,
            "status": d.get("discord_status", "offline"),
            "activities": activities,
            "spotify": spotify,
            "custom_status": custom_status,
        }
        rdb.setex("cache:discord:presence", 15, json.dumps(result))
        return result
    except Exception as e:
        return {"error": str(e), "status": "offline", "username": "Error"}


# ── Community: Discord Channel Feed ───────────────────────────────────
@app.get("/community/discord/feed")
async def discord_feed():
    """Read last 20 messages from configured Discord channel via Bot API."""
    if not DISCORD_BOT_TOKEN or not DISCORD_CHANNEL_ID:
        return {"error": "Discord bot not configured", "channel_id": "", "messages": []}
    cached = rdb.get("cache:discord:feed")
    if cached:
        return json.loads(cached)
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            r = await client.get(
                f"https://discord.com/api/v10/channels/{DISCORD_CHANNEL_ID}/messages?limit=20",
                headers={"Authorization": f"Bot {DISCORD_BOT_TOKEN}"}
            )
            msgs = r.json()
        if isinstance(msgs, dict) and msgs.get("code"):
            return {"error": msgs.get("message", "Discord API error"), "channel_id": DISCORD_CHANNEL_ID, "messages": []}
        messages = []
        for m in msgs if isinstance(msgs, list) else []:
            author = m.get("author", {})
            avatar_hash = author.get("avatar", "")
            avatar_url = f"https://cdn.discordapp.com/avatars/{author.get('id', '')}/{avatar_hash}.png?size=64" if avatar_hash else ""
            messages.append({
                "id": m.get("id", ""),
                "content": m.get("content", ""),
                "author": {
                    "username": author.get("global_name") or author.get("username", "Unknown"),
                    "avatar_url": avatar_url,
                },
                "timestamp": m.get("timestamp", ""),
                "attachments": [{"url": a.get("url", ""), "filename": a.get("filename", "")} for a in m.get("attachments", [])],
                "embeds": len(m.get("embeds", [])),
            })
        result = {"channel_id": DISCORD_CHANNEL_ID, "messages": messages}
        rdb.setex("cache:discord:feed", 30, json.dumps(result))
        return result
    except Exception as e:
        return {"error": str(e), "channel_id": DISCORD_CHANNEL_ID, "messages": []}


# ── Community: Twitter oEmbed Proxy ───────────────────────────────────
@app.get("/community/twitter/oembed")
async def twitter_oembed(url: str = Query(...), theme: str = Query("dark")):
    """Proxy Twitter oEmbed API (free, no auth)."""
    cache_key = f"cache:twitter:oembed:{url}:{theme}"
    cached = rdb.get(cache_key)
    if cached:
        return json.loads(cached)
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            r = await client.get(
                "https://publish.twitter.com/oembed",
                params={"url": url, "omit_script": "true", "theme": theme, "dnt": "true"}
            )
            data = r.json()
        rdb.setex(cache_key, 300, json.dumps(data))
        return data
    except Exception as e:
        return {"html": "", "error": str(e)}


@app.on_event("startup")
async def startup():
    global rh_logged_in
    # Try auto-login to Robinhood (uses stored session if available)
    if RH_AVAILABLE and RH_EMAIL and RH_PASSWORD:
        import concurrent.futures
        def _rh_login():
            rs.login(username=RH_EMAIL, password=RH_PASSWORD, store_session=True, expiresIn=86400)
        try:
            with concurrent.futures.ThreadPoolExecutor() as pool:
                future = pool.submit(_rh_login)
                future.result(timeout=10)
            rh_logged_in = True
            print("✅ Robinhood: auto-logged in (stored session)")
        except concurrent.futures.TimeoutError:
            print("⚠️  Robinhood: login timed out (needs MFA?) — POST /rh/login with mfa_code")
            rh_logged_in = False
        except Exception as e:
            print(f"⚠️  Robinhood: needs MFA — POST /rh/login with mfa_code")
            rh_logged_in = False

    # Auto-sync Fidelity CSV on startup
    try:
        result = _sync_fidelity_csv()
        if result.get("synced"):
            print(f"📊 Fidelity startup sync: imported {result['source']}")
        elif result.get("reason") == "already_current":
            print(f"📊 Fidelity: positions.csv is current (from {result.get('data_date', '?')})")
        else:
            print("📊 Fidelity: no CSV found — export from Fidelity.com to auto-import")
    except Exception as e:
        print(f"⚠️  Fidelity startup sync error: {e}")

    asyncio.create_task(check_alerts())
    asyncio.create_task(background_news_refresh())
    asyncio.create_task(background_macro_refresh())
    asyncio.create_task(_periodic_fidelity_sync())
    asyncio.create_task(_periodic_price_refresh())

# ── OPTIONS JOURNAL ──────────────────────────────────────────
import pathlib as _pathlib
_OPTIONS_DATA_PATH = _pathlib.Path(__file__).parent / "options_data.json"


@app.get("/options-journal")
async def get_options_journal(live: bool = True):
    """Return parsed options journal from saved data file."""
    import json as _json, os as _os
    data_file = _os.path.expanduser("~/dev/stock-platform/.options_trades.json")
    if not _os.path.exists(data_file):
        return {"open_positions": [], "closed_trades": [], "orphan_closings": [],
                "summary": {"total_pnl": 0, "total_trades": 0, "win_rate": 0,
                            "winners": 0, "losers": 0, "avg_win": 0, "avg_loss": 0, "open_count": 0}}
    with open(data_file) as f:
        data = _json.load(f)
    if live and data.get("open_positions"):
        import yfinance as yf
        from datetime import date as _date
        tickers = list({p["ticker"] for p in data["open_positions"]})
        prices = {}
        try:
            dl = yf.download(tickers, period="1d", progress=False, auto_adjust=True)
            if len(tickers) == 1:
                prices[tickers[0]] = float(dl["Close"].iloc[-1])
            else:
                for tk in tickers:
                    try: prices[tk] = float(dl["Close"][tk].iloc[-1])
                    except: pass
        except: pass
        for pos in data["open_positions"]:
            px = prices.get(pos["ticker"])
            pos["current_stock_price"] = round(px, 2) if px else None
            if px:
                pos["itm"] = px > pos["strike"] if pos.get("call_put") == "Call" else px < pos["strike"]
                pos["distance_to_strike"] = round(((pos["strike"] - px) / px) * 100, 1) if pos.get("is_short") else round(((px - pos["strike"]) / pos["strike"]) * 100, 1)
    return data

@app.get("/options-journal/summary")
async def get_options_journal_summary():
    import json as _json, os as _os
    data_file = _os.path.expanduser("~/dev/stock-platform/.options_trades.json")
    if not _os.path.exists(data_file):
        return {}
    with open(data_file) as f:
        return _json.load(f).get("summary", {})

@app.post("/options-journal/upload")
async def upload_options_journal(file: "UploadFile" = fastapi.File(...)):
    """Parse a Fidelity CSV and save results."""
    import csv as _csv, io as _io, json as _json, os as _os
    from collections import defaultdict as _dd
    from datetime import datetime as _dt, date as _date

    raw = (await file.read()).decode("utf-8-sig")
    lines = raw.split("\n")
    header_idx = next((i for i, l in enumerate(lines) if "Run Date" in l), None)
    if header_idx is None:
        raise HTTPException(status_code=400, detail="Could not find Run Date header in CSV")

    reader = _csv.DictReader(_io.StringIO("\n".join(lines[header_idx:])))
    rows = [r for r in reader if r.get("Run Date", "").strip()]
    opt_rows = [r for r in rows if "TRANSACTION" in (r.get("Action") or "")
                or ("EXPIRED" in (r.get("Action") or "") and (r.get("Symbol") or "").strip().startswith("-"))
                or ("ASSIGNED" in (r.get("Action") or "") and (r.get("Symbol") or "").strip().startswith("-"))]

    def clean(r):
        action = r["Action"]
        is_expired = "EXPIRED" in action
        is_assigned = "ASSIGNED" in action
        return {
            "date": r["Run Date"], "symbol": r["Symbol"].strip(),
            "desc": r.get("Description", ""), "account": r["Account"],
            "qty": abs(float(r.get("Quantity") or 0)),
            "price": float(r.get("Price ($)") or 0),
            "amount": float(r.get("Amount ($)") or 0),
            "is_open": "OPENING" in action,
            "is_close": "CLOSING" in action or is_expired or is_assigned,
            "short_leg": "SOLD" in action and "OPENING" in action,
            "long_leg": "BOUGHT" in action and "OPENING" in action,
            "is_expired": is_expired, "is_assigned": is_assigned,
        }

    def decode_symbol(sym):
        s = sym.lstrip("-")
        try:
            for i in range(len(s)-1, -1, -1):
                if s[i] in ("C","P"):
                    cp = s[i]; strike = float(s[i+1:])
                    date_str = s[i-6:i]; ticker = s[:i-6]
                    exp = _dt.strptime(date_str, "%y%m%d").date()
                    return {"ticker": ticker, "expiration": exp.strftime("%b %d, %Y"),
                            "call_put": "Call" if cp=="C" else "Put",
                            "strike": strike, "expired": exp < _date.today()}
        except: pass
        return {"ticker": sym, "expiration": "N/A", "call_put": "?", "strike": 0, "expired": False}

    trades = [clean(r) for r in opt_rows]
    by_sym = _dd(lambda: {"openings": [], "closings": []})
    for t in trades:
        if t["is_open"]: by_sym[t["symbol"]]["openings"].append(t)
        elif t["is_close"]: by_sym[t["symbol"]]["closings"].append(t)

    open_positions, closed_trades, orphan_closings = [], [], []

    for sym, legs in by_sym.items():
        info = decode_symbol(sym)
        openings, closings = legs["openings"], legs["closings"]
        total_open_qty = sum(t["qty"] for t in openings)
        total_close_qty = sum(t["qty"] for t in closings)
        net_open_qty = total_open_qty - total_close_qty
        open_cash = sum(t["amount"] for t in openings)
        close_cash = sum(t["amount"] for t in closings)
        net_pnl = round(open_cash + close_cash, 2)
        is_short = any(t["short_leg"] for t in openings)
        strategy = ("Covered Call" if info["call_put"]=="Call" else "Cash-Secured Put") if is_short else f"Long {info['call_put']}"

        if not openings:
            orphan_closings.append({"symbol": sym, "ticker": info["ticker"],
                "close_cash": round(close_cash, 2),
                "close_date": closings[0]["date"] if closings else "?",
                "account": closings[0]["account"] if closings else "?"})
            continue

        if net_open_qty > 0.001:
            avg_price = sum(t["price"]*t["qty"] for t in openings)/total_open_qty if total_open_qty else 0
            key = "premium_received" if is_short else "cost_basis"
            pos = {"symbol": sym, "ticker": info["ticker"], "strike": info["strike"],
                   "expiration": info["expiration"], "call_put": info["call_put"],
                   "strategy": strategy, "contracts": int(net_open_qty),
                   "avg_price": round(avg_price, 2),
                   "open_date": openings[-1]["date"], "account": openings[0]["account"],
                   "is_short": is_short, "expired": info["expired"]}
            pos[key] = round(abs(open_cash), 2)
            open_positions.append(pos)
        else:
            close_date = closings[0]["date"] if closings else "?"
            key = "open_credit" if is_short else "open_debit"
            trade = {"symbol": sym, "ticker": info["ticker"], "strike": info["strike"],
                     "expiration": info["expiration"], "call_put": info["call_put"],
                     "strategy": strategy, "contracts": int(total_open_qty),
                     "pnl": net_pnl,
                     "pnl_pct": round((net_pnl/abs(open_cash))*100, 1) if open_cash else 0,
                     "open_date": openings[-1]["date"], "close_date": close_date,
                     "account": openings[0]["account"], "is_short": is_short}
            trade[key] = round(abs(open_cash), 2)
            closed_trades.append(trade)

    open_positions.sort(key=lambda x: x["open_date"], reverse=True)
    closed_trades.sort(key=lambda x: x["close_date"], reverse=True)
    winners = [t for t in closed_trades if t["pnl"] > 0]
    losers  = [t for t in closed_trades if t["pnl"] < 0]
    summary = {
        "total_pnl": round(sum(t["pnl"] for t in closed_trades), 2),
        "total_trades": len(closed_trades), "open_count": len(open_positions),
        "win_rate": round(len(winners)/len(closed_trades)*100, 1) if closed_trades else 0,
        "winners": len(winners), "losers": len(losers),
        "avg_win": round(sum(t["pnl"] for t in winners)/len(winners), 2) if winners else 0,
        "avg_loss": round(sum(t["pnl"] for t in losers)/len(losers), 2) if losers else 0,
    }
    pnl_by_ticker = {}
    for t in closed_trades:
        pnl_by_ticker[t["ticker"]] = round(pnl_by_ticker.get(t["ticker"], 0) + t["pnl"], 2)
    result = {"open_positions": open_positions, "closed_trades": closed_trades,
              "orphan_closings": orphan_closings, "summary": summary,
              "pnl_by_ticker": pnl_by_ticker}

    data_file = _os.path.expanduser("~/dev/stock-platform/.options_trades.json")
    with open(data_file, "w") as f:
        _json.dump(result, f, indent=2)

    return {"status": "ok", "summary": summary}

@app.get("/options-journal/analyze")
async def analyze_options_journal():
    import json as _json, os as _os
    from datetime import datetime as _dt
    data_file = _os.path.expanduser("~/dev/stock-platform/.options_trades.json")
    if not _os.path.exists(data_file):
        return {"insights": [], "warnings": [], "recommendations": [], "stats": {}}
    with open(data_file) as f:
        data = _json.load(f)
    s = data.get("summary", {})
    trades = data.get("closed_trades", [])
    if not trades:
        return {"insights": [], "warnings": [], "recommendations": [], "stats": {}}
    # Compute stats
    winners = [t for t in trades if t.get("pnl", 0) > 0]
    losers = [t for t in trades if t.get("pnl", 0) < 0]
    avg_win = sum(t["pnl"] for t in winners) / len(winners) if winners else 0
    avg_loss = abs(sum(t["pnl"] for t in losers) / len(losers)) if losers else 0
    risk_reward = round(avg_win / avg_loss, 2) if avg_loss > 0 else 0
    total_wins = sum(t["pnl"] for t in winners)
    total_losses = abs(sum(t["pnl"] for t in losers))
    profit_factor = round(total_wins / total_losses, 2) if total_losses > 0 else 0
    # Avg hold days
    def _parse_date(s):
        for fmt in ("%m/%d/%Y", "%Y-%m-%d"):
            try:
                return _dt.strptime(s[:10], fmt)
            except Exception:
                continue
        return None
    hold_days = []
    for t in trades:
        od = _parse_date(t.get("open_date", ""))
        cd = _parse_date(t.get("close_date", ""))
        if od and cd:
            hold_days.append((cd - od).days)
    avg_hold = round(sum(hold_days) / len(hold_days)) if hold_days else 0
    # Monthly stats
    monthly = {}
    for t in trades:
        cd = t.get("close_date") or ""
        try:
            d = _dt.strptime(cd, "%m/%d/%Y")
            m = d.strftime("%Y-%m")
        except Exception:
            try:
                d = _dt.strptime(cd[:10], "%Y-%m-%d")
                m = d.strftime("%Y-%m")
            except Exception:
                continue
        monthly[m] = monthly.get(m, 0) + t.get("pnl", 0)
    green_months = sum(1 for v in monthly.values() if v > 0)
    total_months = len(monthly)
    trades_per_month = round(len(trades) / total_months, 1) if total_months > 0 else 0
    # Ticker concentration
    ticker_counts = {}
    for t in trades:
        tk = t.get("ticker", "")
        ticker_counts[tk] = ticker_counts.get(tk, 0) + 1
    top_ticker = max(ticker_counts, key=ticker_counts.get) if ticker_counts else ""
    top_ticker_pct = round(ticker_counts.get(top_ticker, 0) / len(trades) * 100) if trades else 0
    # Strategy concentration
    strat_counts = {}
    for t in trades:
        st = t.get("strategy", "")
        strat_counts[st] = strat_counts.get(st, 0) + 1
    top_strat = max(strat_counts, key=strat_counts.get) if strat_counts else ""
    top_strat_pct = round(strat_counts.get(top_strat, 0) / len(trades) * 100) if trades else 0
    # Win/loss streaks
    sorted_trades = sorted(trades, key=lambda t: t.get("close_date", ""))
    max_win_streak = max_loss_streak = cur_win = cur_loss = 0
    for t in sorted_trades:
        if t.get("pnl", 0) >= 0:
            cur_win += 1; cur_loss = 0; max_win_streak = max(max_win_streak, cur_win)
        else:
            cur_loss += 1; cur_win = 0; max_loss_streak = max(max_loss_streak, cur_loss)
    # Build insights
    insights = []
    win_rate = s.get("win_rate", 0)
    if win_rate >= 70:
        insights.append({"type": "strength", "title": f"Exceptional Win Rate: {win_rate}%", "text": f"You win {win_rate}% of your trades ({len(winners)}W/{len(losers)}L). This is well above average for options trading."})
    elif win_rate >= 55:
        insights.append({"type": "strength", "title": f"Solid Win Rate: {win_rate}%", "text": f"Winning {win_rate}% of trades shows consistent execution."})
    if profit_factor >= 2:
        insights.append({"type": "strength", "title": f"Strong Profit Factor: {profit_factor}x", "text": f"Your winners generate ${total_wins:.0f} vs ${total_losses:.0f} in losses. A profit factor above 2 indicates a strong edge."})
    elif profit_factor >= 1.5:
        insights.append({"type": "strength", "title": f"Positive Profit Factor: {profit_factor}x", "text": f"Total wins of ${total_wins:.0f} vs losses of ${total_losses:.0f}."})
    if risk_reward >= 1.5:
        insights.append({"type": "strength", "title": f"Good Risk/Reward: {risk_reward}x", "text": f"Average win (${avg_win:.2f}) is {risk_reward}x your average loss (${avg_loss:.2f})."})
    if max_win_streak >= 5:
        insights.append({"type": "neutral", "title": f"Best Win Streak: {max_win_streak}", "text": f"Your longest winning streak was {max_win_streak} consecutive profitable trades."})
    if green_months == total_months and total_months >= 2:
        insights.append({"type": "strength", "title": "All Green Months", "text": f"Every month of trading ({total_months} months) has been profitable. Excellent consistency."})
    elif green_months > 0:
        insights.append({"type": "neutral", "title": f"Monthly Consistency: {green_months}/{total_months}", "text": f"{green_months} out of {total_months} months were profitable."})
    # Warnings
    warnings = []
    if max_loss_streak >= 4:
        warnings.append({"type": "warning", "title": f"Loss Streak Alert: {max_loss_streak}", "text": f"Your worst loss streak was {max_loss_streak} consecutive losing trades. Consider position sizing rules."})
    if top_ticker_pct >= 40:
        warnings.append({"type": "warning", "title": f"Ticker Concentration: {top_ticker} ({top_ticker_pct}%)", "text": f"{top_ticker_pct}% of your trades are in {top_ticker}. Diversifying across more tickers can reduce risk."})
    if risk_reward < 1 and len(trades) > 5:
        warnings.append({"type": "warning", "title": f"Low Risk/Reward: {risk_reward}x", "text": f"Your average loss (${avg_loss:.2f}) is larger than your average win (${avg_win:.2f}). Consider tighter stop losses."})
    if avg_hold <= 2 and len(hold_days) > 3:
        warnings.append({"type": "warning", "title": f"Very Short Holding Period: {avg_hold}d", "text": "Averaging under 2 days may indicate overtrading. Consider giving trades more time."})
    # Recommendations
    recommendations = []
    if top_strat_pct >= 60 and len(strat_counts) < 3:
        recommendations.append({"title": "Diversify Strategies", "text": f"{top_strat_pct}% of trades use {top_strat}. Exploring other strategies like spreads or covered calls could improve risk-adjusted returns."})
    if len(trades) >= 10 and profit_factor < 1.5:
        recommendations.append({"title": "Improve Win Quality", "text": "Focus on letting winners run longer while cutting losers faster to improve your profit factor."})
    if total_months >= 2 and trades_per_month > 15:
        recommendations.append({"title": "Consider Trade Frequency", "text": f"At {trades_per_month} trades/month, you may benefit from being more selective and focusing on higher-conviction setups."})
    if not recommendations:
        recommendations.append({"title": "Keep It Up", "text": f"Your trading statistics look solid with a {win_rate}% win rate and {profit_factor}x profit factor. Continue tracking and refining your approach."})
    return {
        "insights": insights, "warnings": warnings, "recommendations": recommendations,
        "stats": {"risk_reward": risk_reward, "profit_factor": profit_factor, "avg_hold_days": avg_hold, "trades_per_month": trades_per_month, "green_months": green_months, "total_months": total_months}
    }

@app.get("/options-journal/live")
async def get_options_journal_live():
    return await get_options_journal(live=True)

