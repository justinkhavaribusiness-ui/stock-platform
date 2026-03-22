"""
AI Router — Morning Briefing, Market Regime Detection, Trade Review, Natural Language Query
"""

from fastapi import APIRouter, HTTPException, Body
from datetime import datetime, timezone, timedelta
import json, os, traceback

router = APIRouter(prefix="/ai", tags=["ai"])

# ── Dependencies (lazy-loaded from main app) ─────────────────────────
try:
    import anthropic
    ANTHROPIC_AVAILABLE = True
except ImportError:
    anthropic = None
    ANTHROPIC_AVAILABLE = False

try:
    import yfinance as yf
except ImportError:
    yf = None

import redis
REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379")
rdb = redis.from_url(REDIS_URL, decode_responses=True)

# Load .env if key not in environment
def _get_anthropic_key():
    key = os.getenv("ANTHROPIC_API_KEY", "")
    if key:
        return key
    env_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), ".env")
    if os.path.exists(env_path):
        with open(env_path) as f:
            for line in f:
                line = line.strip()
                if line.startswith("ANTHROPIC_API_KEY="):
                    return line.split("=", 1)[1].strip()
    return ""

ANTHROPIC_KEY = _get_anthropic_key()


def _call_claude(system: str, prompt: str, max_tokens: int = 2000) -> str:
    """Helper to call Claude and return text response."""
    key = os.getenv("ANTHROPIC_API_KEY", "") or ANTHROPIC_KEY
    if not ANTHROPIC_AVAILABLE or not key:
        raise HTTPException(500, "Anthropic API key not configured")
    client = anthropic.Anthropic(api_key=key)
    message = client.messages.create(
        model="claude-sonnet-4-20250514",
        max_tokens=max_tokens,
        system=system,
        messages=[{"role": "user", "content": prompt}]
    )
    return message.content[0].text.strip()


def _clean_json(text: str) -> dict:
    """Strip markdown fences and parse JSON."""
    import re
    t = text.strip()
    if t.startswith("```"):
        t = re.sub(r"^```(?:json)?\s*", "", t)
        t = re.sub(r"\s*```$", "", t)
    return json.loads(t)


# ═══════════════════════════════════════════════════════════════════════
#  MORNING BRIEFING
# ═══════════════════════════════════════════════════════════════════════
@router.get("/morning-briefing")
async def morning_briefing():
    """AI-generated morning market briefing with overnight moves, events, and portfolio impact."""
    # Check cache (valid for 30 minutes)
    cached = rdb.get("ai:morning_briefing")
    cached_ts = rdb.get("ai:morning_briefing:ts")
    if cached and cached_ts:
        age = (datetime.now(timezone.utc) - datetime.fromisoformat(cached_ts)).total_seconds()
        if age < 1800:  # 30 min cache
            return json.loads(cached)

    context_parts = []

    # Gather market data
    if yf:
        try:
            tickers = ["SPY", "QQQ", "DIA", "IWM", "VIX", "GLD", "TLT", "BTC-USD", "^GSPC"]
            data = yf.download(tickers, period="5d", interval="1d", progress=False, auto_adjust=True)
            market_lines = []
            for tk in tickers:
                try:
                    if len(tickers) == 1:
                        closes = data["Close"]
                    else:
                        closes = data["Close"][tk]
                    if closes.empty:
                        continue
                    last = float(closes.iloc[-1])
                    prev = float(closes.iloc[-2]) if len(closes) > 1 else last
                    chg = round((last - prev) / prev * 100, 2)
                    market_lines.append(f"  {tk}: ${last:.2f} ({'+' if chg > 0 else ''}{chg}%)")
                except Exception:
                    pass
            if market_lines:
                context_parts.append("MARKET DATA (latest close):\n" + "\n".join(market_lines))
        except Exception as e:
            context_parts.append(f"Market data error: {e}")

    # Get user portfolio
    try:
        raw = rdb.get("portfolio:default")
        if raw:
            portfolio = json.loads(raw)
            port_tickers = list(portfolio.keys())[:10]
            context_parts.append(f"USER PORTFOLIO TICKERS: {', '.join(port_tickers)}")
    except Exception:
        pass

    # Get watchlist
    try:
        watchlist = list(rdb.smembers("watchlist:tickers") or set())
        if watchlist:
            context_parts.append(f"WATCHLIST: {', '.join(sorted(watchlist)[:15])}")
    except Exception:
        pass

    # Get triggered alerts
    try:
        triggered_raw = rdb.lrange("alerts:triggered", 0, 5)
        if triggered_raw:
            alerts = [json.loads(a) for a in triggered_raw]
            alert_text = "RECENT ALERTS:\n" + "\n".join(
                f"  {a.get('ticker','')} {a.get('condition','')} ${a.get('target','')} (fired: {a.get('fired_at','')})"
                for a in alerts[:5]
            )
            context_parts.append(alert_text)
    except Exception:
        pass

    context = "\n\n".join(context_parts)
    now = datetime.now(timezone.utc)

    system = """You are a professional market analyst preparing a morning briefing for a trader.
Be concise, data-driven, and actionable. Use actual numbers from the data provided."""

    prompt = f"""Generate a morning market briefing for {now.strftime('%A, %B %d, %Y')}.

{context}

Return JSON (no markdown fences) with this exact structure:
{{
  "date": "{now.strftime('%Y-%m-%d')}",
  "market_summary": "2-3 sentence overview of market conditions",
  "overnight_moves": [
    {{"symbol": "SPY", "change_pct": -1.1, "note": "brief context"}}
  ],
  "key_levels": {{
    "spy_support": 0, "spy_resistance": 0,
    "vix_level": 0, "vix_signal": "elevated/normal/low"
  }},
  "portfolio_impact": "1-2 sentences about how the user's portfolio/watchlist may be affected",
  "action_items": ["actionable item 1", "actionable item 2", "actionable item 3"],
  "risk_events": ["upcoming risk event 1", "risk event 2"],
  "sentiment": "bullish/bearish/neutral/cautious"
}}"""

    try:
        result = _clean_json(_call_claude(system, prompt, 1500))
        # Cache result
        rdb.set("ai:morning_briefing", json.dumps(result))
        rdb.set("ai:morning_briefing:ts", now.isoformat())
        return result
    except Exception as e:
        return {"error": f"Morning briefing failed: {e}", "date": now.strftime('%Y-%m-%d')}


# ═══════════════════════════════════════════════════════════════════════
#  MARKET REGIME DETECTOR
# ═══════════════════════════════════════════════════════════════════════
@router.get("/regime")
async def market_regime():
    """AI-powered market regime classification: bull/bear/sideways/volatile."""
    # Check cache (valid for 15 minutes)
    cached = rdb.get("ai:regime")
    cached_ts = rdb.get("ai:regime:ts")
    if cached and cached_ts:
        age = (datetime.now(timezone.utc) - datetime.fromisoformat(cached_ts)).total_seconds()
        if age < 900:
            return json.loads(cached)

    context_parts = []
    if yf:
        try:
            # Get 60-day data for trend analysis
            for tk in ["SPY", "VIX", "TLT", "QQQ"]:
                stock = yf.Ticker(tk)
                hist = stock.history(period="3mo", interval="1d")
                if hist.empty:
                    continue
                closes = hist["Close"]
                last = float(closes.iloc[-1])
                sma20 = float(closes.tail(20).mean())
                sma50 = float(closes.tail(50).mean()) if len(closes) >= 50 else sma20
                high_20d = float(hist["High"].tail(20).max())
                low_20d = float(hist["Low"].tail(20).min())
                volatility = round(float(closes.tail(20).pct_change().std() * (252**0.5) * 100), 1)

                context_parts.append(f"""{tk}:
  Price: ${last:.2f}  SMA20: ${sma20:.2f}  SMA50: ${sma50:.2f}
  20d High: ${high_20d:.2f}  20d Low: ${low_20d:.2f}
  Annualized Vol: {volatility}%
  Above SMA20: {'Yes' if last > sma20 else 'No'}  Above SMA50: {'Yes' if last > sma50 else 'No'}""")
        except Exception as e:
            context_parts.append(f"Data error: {e}")

    context = "\n".join(context_parts)

    system = "You are a quantitative market analyst. Classify the current market regime based on technical data."

    prompt = f"""Based on this technical data, classify the current market regime.

{context}

Return JSON only:
{{
  "regime": "bull" or "bear" or "sideways" or "volatile",
  "confidence": 0-100,
  "description": "One sentence explaining why",
  "signals": {{
    "trend": "up/down/flat",
    "volatility": "high/normal/low",
    "breadth": "strong/weak/mixed"
  }},
  "recommendation": "risk-on/risk-off/selective/defensive"
}}"""

    try:
        result = _clean_json(_call_claude(system, prompt, 500))
        now = datetime.now(timezone.utc)
        rdb.set("ai:regime", json.dumps(result))
        rdb.set("ai:regime:ts", now.isoformat())
        return result
    except Exception as e:
        return {"regime": "unknown", "confidence": 0, "description": f"Error: {e}", "signals": {}, "recommendation": "unknown"}


# ═══════════════════════════════════════════════════════════════════════
#  AI TRADE REVIEW
# ═══════════════════════════════════════════════════════════════════════
@router.post("/review-trades")
async def review_trades(data: dict):
    """Claude reviews closed trades and identifies patterns, mistakes, and improvements."""
    trades = data.get("trades", [])
    if not trades:
        raise HTTPException(400, "No trades provided")

    # Format trades for analysis
    trade_summary = []
    for t in trades[:50]:  # Limit to 50 trades
        line = f"{t.get('ticker','?')}: {t.get('strategy','?')} | "
        line += f"P&L: ${t.get('pnl', 0):.2f} ({t.get('pnl_pct', 0):.1f}%) | "
        line += f"Open: {t.get('open_date','?')} Close: {t.get('close_date','?')} | "
        line += f"{t.get('call_put','?')} ${t.get('strike',0)} exp {t.get('expiration','?')}"
        if t.get('is_short'):
            line += " [SHORT/SOLD]"
        trade_summary.append(line)

    system = """You are an expert options trading coach. Analyze the trader's closed trades and provide
specific, actionable feedback. Be honest about mistakes but encouraging about improvements."""

    prompt = f"""Review these {len(trades)} closed options trades and provide a comprehensive analysis:

TRADES:
{chr(10).join(trade_summary)}

SUMMARY:
Total P&L: ${sum(t.get('pnl', 0) for t in trades):.2f}
Winners: {sum(1 for t in trades if t.get('pnl', 0) > 0)}
Losers: {sum(1 for t in trades if t.get('pnl', 0) < 0)}

Return JSON only:
{{
  "overall_grade": "A/B/C/D/F",
  "summary": "2-3 sentence overall assessment",
  "patterns": [
    {{"pattern": "pattern name", "description": "what you noticed", "frequency": "how often"}}
  ],
  "mistakes": [
    {{"mistake": "mistake name", "description": "what went wrong", "fix": "how to improve"}}
  ],
  "strengths": [
    {{"strength": "strength name", "description": "what they do well"}}
  ],
  "recommendations": [
    "specific actionable recommendation 1",
    "specific actionable recommendation 2",
    "specific actionable recommendation 3"
  ],
  "risk_management": {{
    "score": 1-10,
    "feedback": "assessment of position sizing, stop losses, etc."
  }}
}}"""

    try:
        return _clean_json(_call_claude(system, prompt, 2000))
    except Exception as e:
        return {"error": f"Trade review failed: {e}"}


# ═══════════════════════════════════════════════════════════════════════
#  NATURAL LANGUAGE QUERY
# ═══════════════════════════════════════════════════════════════════════
@router.post("/query")
async def natural_language_query(data: dict):
    """Accept a natural language question, gather relevant data, and return structured answer."""
    question = data.get("question", "").strip()
    if not question:
        raise HTTPException(400, "No question provided")

    # ── Gather ALL available data sources ──────────────────────────
    context_parts = []

    # Portfolio
    try:
        raw = rdb.get("portfolio:default")
        if raw:
            portfolio = json.loads(raw)
            if portfolio:
                lines = []
                for tk, info in list(portfolio.items())[:20]:
                    lines.append(f"  {tk}: {info.get('shares',0)} shares @ ${info.get('cost_basis',0):.2f}")
                context_parts.append("PORTFOLIO:\n" + "\n".join(lines))
    except Exception:
        pass

    # Watchlist
    try:
        wl = list(rdb.smembers("watchlist:tickers") or set())
        if wl:
            context_parts.append(f"WATCHLIST: {', '.join(sorted(wl)[:20])}")
    except Exception:
        pass

    # Live quotes for relevant tickers
    all_tickers = set()
    try:
        raw = rdb.get("portfolio:default")
        if raw:
            all_tickers.update(json.loads(raw).keys())
        all_tickers.update(rdb.smembers("watchlist:tickers") or set())
    except Exception:
        pass

    # Check for tickers mentioned in question
    import re as _re
    words = _re.findall(r'\b[A-Z]{1,5}\b', question.upper())
    common_words = {"A","I","AM","AN","AT","BE","BY","DO","GO","IF","IN","IS","IT","ME","MY","NO","OF","ON","OR","SO","TO","UP","US","WE","THE","AND","FOR","ARE","BUT","NOT","YOU","ALL","ANY","CAN","HAD","HER","WAS","ONE","OUR","OUT","HAS","HIS","HOW","MAN","NEW","NOW","OLD","SEE","WAY","WHO","DID","GET","HIM","LET","SAY","SHE","TOO","USE","DAY","WHAT","THAT","WITH","HAVE","THIS","WILL","YOUR","FROM","THEY","BEEN","CALL","COME","EACH","MAKE","LIKE","LONG","LOOK","MANY","MOST","OVER","SUCH","TAKE","THAN","THEM","VERY","WHEN","SHOW","TELL","GIVE","FIND","BEST","WORST","TOP","MAX","MIN","HIGH","LOW","BUY","SELL","PUT","CALL","HOLD"}
    mentioned_tickers = [w for w in words if w not in common_words and len(w) >= 2]
    all_tickers.update(mentioned_tickers[:5])

    if all_tickers and yf:
        try:
            tks = list(all_tickers)[:15]
            data_yf = yf.download(tks, period="5d", interval="1d", progress=False, auto_adjust=True)
            quote_lines = []
            for tk in tks:
                try:
                    if len(tks) == 1:
                        closes = data_yf["Close"]
                    else:
                        closes = data_yf["Close"][tk]
                    if closes.empty:
                        continue
                    last = float(closes.iloc[-1])
                    prev = float(closes.iloc[-2]) if len(closes) > 1 else last
                    chg = round((last - prev) / prev * 100, 2)
                    quote_lines.append(f"  {tk}: ${last:.2f} ({'+' if chg > 0 else ''}{chg}%)")
                except Exception:
                    pass
            if quote_lines:
                context_parts.append("LIVE QUOTES:\n" + "\n".join(quote_lines))
        except Exception:
            pass

    # Journal trades
    try:
        trades_raw = rdb.lrange("journal:trades", 0, 19)
        if trades_raw:
            trade_lines = []
            for t_raw in trades_raw:
                t = json.loads(t_raw)
                pnl = t.get("pnl")
                pnl_str = f"P&L: ${pnl:.2f}" if pnl is not None else "Open"
                trade_lines.append(f"  {t.get('ticker','?')} {t.get('side','?')} @ ${t.get('entry_price',0)} x{t.get('quantity',0)} — {pnl_str}")
            context_parts.append("RECENT TRADES:\n" + "\n".join(trade_lines))
    except Exception:
        pass

    # Alerts
    try:
        alerts_raw = rdb.lrange("alerts:rules", 0, 9)
        if alerts_raw:
            alert_lines = [f"  {json.loads(a).get('ticker','')} {json.loads(a).get('condition','')} ${json.loads(a).get('price','')}" for a in alerts_raw]
            context_parts.append("ACTIVE ALERTS:\n" + "\n".join(alert_lines))
    except Exception:
        pass

    # Goals
    try:
        goals_raw = rdb.lrange("goals:list", 0, -1)
        if goals_raw:
            goal_lines = [f"  {json.loads(g).get('name','')}: ${json.loads(g).get('current_amount',0):.0f}/${json.loads(g).get('target_amount',0):.0f}" for g in goals_raw]
            context_parts.append("GOALS:\n" + "\n".join(goal_lines))
    except Exception:
        pass

    context = "\n\n".join(context_parts) if context_parts else "No data available."

    system = """You are a trading data assistant with access to the user's portfolio, watchlist, trades, alerts, and live market quotes.
Answer the user's question using the data provided. Be specific with numbers.

IMPORTANT: Your response must be valid JSON with this structure:
{
  "answer": "Your text answer",
  "data_type": "text" or "table" or "chart" or "list",
  "data": null or [...],
  "columns": null or ["col1", "col2"],
  "chart_type": null or "bar" or "line" or "pie"
}

- For questions about specific data (like "show my portfolio", "what are my best trades"), use data_type "table" and provide rows in "data" and column headers in "columns"
- For comparison questions, use data_type "chart" with chart_type and data as [{name: "x", value: y}, ...]
- For simple questions, use data_type "text" with just the "answer" field
- For lists (like "what should I do"), use data_type "list" with data as ["item1", "item2"]"""

    prompt = f"""User question: {question}

Available data:
{context}

Return JSON only (no markdown fences)."""

    try:
        result = _clean_json(_call_claude(system, prompt, 2000))
        return result
    except Exception as e:
        return {"answer": f"Query failed: {e}", "data_type": "text", "data": None}


# ═══════════════════════════════════════════════════════════════════════
#  AI TRADE JOURNALING — Auto-tag & analyze journal entries
# ═══════════════════════════════════════════════════════════════════════
@router.post("/journal-analyze")
async def ai_journal_analyze(data: dict):
    """AI analyzes a trade and auto-tags setup type, mistakes, and lessons."""
    trade = data.get("trade", {})
    if not trade:
        raise HTTPException(400, "No trade provided")

    system = """You are an expert trade analyst. Analyze the trade and provide tags, setup classification, and lessons learned."""

    prompt = f"""Analyze this trade:
Ticker: {trade.get('ticker', '?')}
Side: {trade.get('side', '?')}
Entry: ${trade.get('entry_price', 0)}
Exit: ${trade.get('exit_price', 'still open')}
P&L: ${trade.get('pnl', 'N/A')}
Notes: {trade.get('notes', 'none')}
Tags: {', '.join(trade.get('tags', []))}

Return JSON only:
{{
  "setup_type": "breakout/breakdown/pullback/reversal/momentum/range/gap/earnings/other",
  "quality_score": 1-10,
  "tags": ["auto-generated tags"],
  "entry_analysis": "Was the entry good? Why?",
  "exit_analysis": "Was the exit good? Why?",
  "mistakes": ["any mistakes made"],
  "lessons": ["key lessons from this trade"],
  "similar_setups": "What to look for next time"
}}"""

    try:
        return _clean_json(_call_claude(system, prompt, 1000))
    except Exception as e:
        return {"error": f"Analysis failed: {e}"}


# ═══════════════════════════════════════════════════════════════════════
#  AI PATTERN RECOGNITION
# ═══════════════════════════════════════════════════════════════════════
@router.get("/pattern-scan/{ticker}")
async def ai_pattern_scan(ticker: str):
    """AI scans chart data for technical patterns."""
    if not yf:
        raise HTTPException(500, "yfinance not available")

    try:
        data = yf.Ticker(ticker.upper()).history(period="3mo", interval="1d")
        if data.empty:
            return {"patterns": [], "error": "No data"}

        # Prepare price data for Claude
        recent = data.tail(30)
        price_lines = []
        for idx, row in recent.iterrows():
            d = idx.strftime("%Y-%m-%d")
            price_lines.append(f"{d}: O={row['Open']:.2f} H={row['High']:.2f} L={row['Low']:.2f} C={row['Close']:.2f} V={int(row['Volume'])}")

        system = "You are a chart pattern recognition expert. Identify patterns in the price data."

        prompt = f"""Analyze the last 30 days of {ticker.upper()} price data for chart patterns:

{chr(10).join(price_lines)}

Current price: ${float(data['Close'].iloc[-1]):.2f}
30-day high: ${float(data['High'].tail(30).max()):.2f}
30-day low: ${float(data['Low'].tail(30).min()):.2f}

Return JSON only:
{{
  "patterns": [
    {{
      "pattern": "pattern name (e.g., Double Bottom, Bull Flag, Head & Shoulders)",
      "confidence": 1-100,
      "direction": "bullish/bearish/neutral",
      "description": "brief description",
      "target_price": estimated target or null,
      "stop_price": suggested stop or null
    }}
  ],
  "trend": "uptrend/downtrend/sideways",
  "support_levels": [price1, price2],
  "resistance_levels": [price1, price2],
  "volume_trend": "increasing/decreasing/flat",
  "summary": "1-2 sentence summary"
}}"""

        return _clean_json(_call_claude(system, prompt, 1000))
    except Exception as e:
        return {"patterns": [], "error": str(e)}


# ═══════════════════════════════════════════════════════════════════════
#  AI SENTIMENT AGGREGATOR
# ═══════════════════════════════════════════════════════════════════════
@router.get("/sentiment/{ticker}")
async def ai_sentiment(ticker: str):
    """Aggregate sentiment from multiple sources and provide AI analysis."""
    ticker = ticker.upper()
    context_parts = []

    # StockTwits sentiment
    try:
        import httpx
        async with httpx.AsyncClient() as client:
            r = await client.get(f"https://api.stocktwits.com/api/2/streams/symbol/{ticker}.json", timeout=5)
            if r.status_code == 200:
                st_data = r.json()
                msgs = st_data.get("messages", [])[:10]
                bull = sum(1 for m in msgs if m.get("entities", {}).get("sentiment", {}).get("basic") == "Bullish")
                bear = sum(1 for m in msgs if m.get("entities", {}).get("sentiment", {}).get("basic") == "Bearish")
                context_parts.append(f"StockTwits ({len(msgs)} recent): {bull} bullish, {bear} bearish")
                recent_msgs = [m.get("body", "")[:100] for m in msgs[:5]]
                context_parts.append("Recent messages: " + " | ".join(recent_msgs))
    except Exception:
        pass

    # News headlines
    try:
        if yf:
            info = yf.Ticker(ticker)
            news = info.news[:5] if hasattr(info, 'news') else []
            if news:
                headlines = [n.get("title", "") for n in news]
                context_parts.append("Recent headlines: " + " | ".join(headlines))
    except Exception:
        pass

    # Price context
    if yf:
        try:
            data = yf.Ticker(ticker).history(period="1mo")
            if not data.empty:
                current = float(data['Close'].iloc[-1])
                month_ago = float(data['Close'].iloc[0])
                chg = round((current - month_ago) / month_ago * 100, 2)
                context_parts.append(f"Price: ${current:.2f} ({'+' if chg > 0 else ''}{chg}% 1M)")
        except Exception:
            pass

    system = "You are a sentiment analysis expert for financial markets."

    prompt = f"""Analyze overall market sentiment for {ticker} based on this data:

{chr(10).join(context_parts) if context_parts else "Limited data available."}

Return JSON only:
{{
  "overall_sentiment": "very_bullish/bullish/neutral/bearish/very_bearish",
  "score": -100 to 100 (negative=bearish, positive=bullish),
  "social_sentiment": "bullish/bearish/neutral",
  "news_sentiment": "bullish/bearish/neutral",
  "technical_sentiment": "bullish/bearish/neutral",
  "key_themes": ["theme1", "theme2"],
  "risks": ["risk1", "risk2"],
  "catalysts": ["catalyst1", "catalyst2"],
  "summary": "2-3 sentence sentiment summary"
}}"""

    try:
        return _clean_json(_call_claude(system, prompt, 800))
    except Exception as e:
        return {"overall_sentiment": "neutral", "score": 0, "error": str(e)}


# ═══════════════════════════════════════════════════════════════════════
#  AI PORTFOLIO REBALANCING SUGGESTIONS
# ═══════════════════════════════════════════════════════════════════════
@router.get("/rebalance")
async def ai_rebalance():
    """AI suggests portfolio rebalancing based on current allocations and market conditions."""
    # Get portfolio
    try:
        raw = rdb.get("portfolio:default")
        portfolio = json.loads(raw) if raw else {}
    except Exception:
        portfolio = {}

    if not portfolio:
        return {"suggestions": [], "error": "No portfolio data"}

    # Get current prices
    context_parts = []
    if yf:
        try:
            tickers = list(portfolio.keys())[:20]
            data = yf.download(tickers, period="3mo", interval="1d", progress=False, auto_adjust=True)
            holdings = []
            total_value = 0
            for tk in tickers:
                try:
                    closes = data["Close"][tk] if len(tickers) > 1 else data["Close"]
                    price = float(closes.iloc[-1])
                    shares = portfolio[tk].get("shares", 0)
                    cost = portfolio[tk].get("cost_basis", 0)
                    value = price * shares
                    total_value += value
                    m1_chg = round((price / float(closes.iloc[-21]) - 1) * 100, 2) if len(closes) > 21 else 0
                    m3_chg = round((price / float(closes.iloc[0]) - 1) * 100, 2) if len(closes) > 1 else 0
                    holdings.append(f"{tk}: {shares} shares, ${price:.2f} (1M: {'+' if m1_chg>0 else ''}{m1_chg}%, 3M: {'+' if m3_chg>0 else ''}{m3_chg}%), Value: ${value:.2f}")
                except Exception:
                    continue
            context_parts.append(f"Total Portfolio Value: ${total_value:.2f}")
            context_parts.append("Holdings:\n" + "\n".join(holdings))
        except Exception:
            pass

    system = "You are a portfolio management expert. Suggest rebalancing actions."

    prompt = f"""Review this portfolio and suggest rebalancing:

{chr(10).join(context_parts)}

Consider: sector diversification, concentration risk, momentum, risk management.

Return JSON only:
{{
  "overall_score": 1-10,
  "assessment": "2-3 sentence portfolio assessment",
  "suggestions": [
    {{
      "action": "reduce/increase/add/remove",
      "ticker": "TICKER",
      "reason": "why",
      "urgency": "high/medium/low"
    }}
  ],
  "sector_exposure": {{"sector": "pct"}},
  "concentration_risk": "high/medium/low",
  "diversification_score": 1-10
}}"""

    try:
        return _clean_json(_call_claude(system, prompt, 1500))
    except Exception as e:
        return {"suggestions": [], "error": str(e)}


# ═══════════════════════════════════════════════════════════════════════
#  AI EARNINGS CALL SUMMARIZER
# ═══════════════════════════════════════════════════════════════════════
@router.get("/earnings-summary/{ticker}")
async def ai_earnings_summary(ticker: str):
    """AI summarizes recent earnings and key metrics for a ticker."""
    ticker = ticker.upper()
    context_parts = []

    if yf:
        try:
            info = yf.Ticker(ticker).info
            context_parts.append(f"Company: {info.get('longName', ticker)}")
            context_parts.append(f"Sector: {info.get('sector', 'N/A')}")
            context_parts.append(f"Market Cap: ${info.get('marketCap', 0):,.0f}")
            context_parts.append(f"PE Ratio: {info.get('trailingPE', 'N/A')}")
            context_parts.append(f"Forward PE: {info.get('forwardPE', 'N/A')}")
            context_parts.append(f"EPS (TTM): ${info.get('trailingEps', 'N/A')}")
            context_parts.append(f"Revenue Growth: {info.get('revenueGrowth', 'N/A')}")
            context_parts.append(f"Profit Margin: {info.get('profitMargins', 'N/A')}")
            context_parts.append(f"52W Range: ${info.get('fiftyTwoWeekLow', 0):.2f} - ${info.get('fiftyTwoWeekHigh', 0):.2f}")
            context_parts.append(f"Price: ${info.get('currentPrice', info.get('regularMarketPrice', 0)):.2f}")
            context_parts.append(f"Analyst Target: ${info.get('targetMeanPrice', 0):.2f}")
            context_parts.append(f"Recommendation: {info.get('recommendationKey', 'N/A')}")
        except Exception:
            pass

    system = "You are a financial analyst specializing in earnings analysis."

    prompt = f"""Provide an earnings analysis for {ticker}:

{chr(10).join(context_parts) if context_parts else "Limited data available."}

Return JSON only:
{{
  "company": "{ticker}",
  "summary": "2-3 sentence earnings overview",
  "key_metrics": [
    {{"metric": "metric name", "value": "value", "assessment": "good/neutral/concern"}}
  ],
  "growth_outlook": "strong/moderate/weak/declining",
  "competitive_position": "leader/strong/average/weak",
  "risks": ["risk1", "risk2"],
  "catalysts": ["catalyst1", "catalyst2"],
  "fair_value_range": {{"low": price, "mid": price, "high": price}},
  "recommendation": "strong buy/buy/hold/sell/strong sell"
}}"""

    try:
        return _clean_json(_call_claude(system, prompt, 1200))
    except Exception as e:
        return {"company": ticker, "error": str(e)}


# ═══════════════════════════════════════════════════════════════════════
#  AI TRADE COACH
# ═══════════════════════════════════════════════════════════════════════
@router.post("/trade-coach")
async def ai_trade_coach(data: dict):
    """AI trade coach reviews open positions and suggests adjustments."""
    question = data.get("question", "Review my open positions and suggest adjustments")
    context_parts = []

    # Get open trades
    try:
        raw = rdb.lrange("journal:trades", 0, -1)
        open_trades = [json.loads(r) for r in raw if json.loads(r).get("status") == "open"]
        if open_trades:
            lines = []
            for t in open_trades[:15]:
                lines.append(f"{t.get('ticker','?')} {t.get('side','?')} @ ${t.get('entry_price',0)} x{t.get('quantity',0)} | SL: ${t.get('stop_loss','N/A')} TP: ${t.get('take_profit','N/A')}")
            context_parts.append("OPEN TRADES:\n" + "\n".join(lines))
    except Exception:
        pass

    # Get portfolio
    try:
        raw = rdb.get("portfolio:default")
        if raw:
            port = json.loads(raw)
            lines = [f"{tk}: {v.get('shares',0)} sh @ ${v.get('cost_basis',0):.2f}" for tk, v in list(port.items())[:10]]
            context_parts.append("PORTFOLIO:\n" + "\n".join(lines))
    except Exception:
        pass

    # Get recent closed trades for pattern analysis
    try:
        raw = rdb.lrange("journal:trades", 0, -1)
        closed = [json.loads(r) for r in raw if json.loads(r).get("status") == "closed"][-10:]
        if closed:
            lines = [f"{t.get('ticker','?')} P&L: ${t.get('pnl', 0):.2f}" for t in closed]
            context_parts.append("RECENT CLOSED:\n" + "\n".join(lines))
    except Exception:
        pass

    system = """You are an expert trading coach. Provide specific, actionable advice.
Be direct and honest. Reference specific positions when giving advice."""

    prompt = f"""Trader's question: {question}

{chr(10).join(context_parts) if context_parts else "No position data available."}

Return JSON only:
{{
  "advice": "Direct, specific coaching advice",
  "position_reviews": [
    {{
      "ticker": "TICKER",
      "action": "hold/trim/add/close/adjust_stop",
      "reason": "why",
      "new_stop": null or price,
      "new_target": null or price
    }}
  ],
  "risk_assessment": "Your overall risk level assessment",
  "top_priority": "The single most important thing to do right now",
  "mistakes_to_avoid": ["mistake1", "mistake2"],
  "encouragement": "One encouraging note"
}}"""

    try:
        return _clean_json(_call_claude(system, prompt, 1500))
    except Exception as e:
        return {"advice": f"Coach unavailable: {e}", "position_reviews": []}


# ═══════════════════════════════════════════════════════════════════════
#  AI WATCHLIST SCREENER
# ═══════════════════════════════════════════════════════════════════════
@router.get("/watchlist-scan")
async def ai_watchlist_scan():
    """AI scans watchlist tickers and flags the best setups."""
    # Get watchlist
    try:
        watchlist = list(rdb.smembers("watchlist:tickers") or set())
    except Exception:
        watchlist = []

    if not watchlist:
        return {"scans": [], "error": "Watchlist empty"}

    context_parts = []
    if yf:
        try:
            tickers = list(watchlist)[:15]
            data = yf.download(tickers, period="1mo", interval="1d", progress=False, auto_adjust=True)
            for tk in tickers:
                try:
                    closes = data["Close"][tk] if len(tickers) > 1 else data["Close"]
                    if closes.empty:
                        continue
                    price = float(closes.iloc[-1])
                    prev = float(closes.iloc[-2]) if len(closes) > 1 else price
                    d1 = round((price - prev) / prev * 100, 2)
                    w1 = round((price / float(closes.iloc[-5]) - 1) * 100, 2) if len(closes) > 5 else 0
                    m1 = round((price / float(closes.iloc[0]) - 1) * 100, 2)
                    vol = float(data["Volume"][tk].iloc[-1]) if len(tickers) > 1 else float(data["Volume"].iloc[-1])
                    avg_vol = float(data["Volume"][tk].mean()) if len(tickers) > 1 else float(data["Volume"].mean())
                    vol_ratio = round(vol / max(avg_vol, 1), 2)
                    high = float(closes.max())
                    low = float(closes.min())
                    pct_from_high = round((price / high - 1) * 100, 2)
                    context_parts.append(f"{tk}: ${price:.2f} (1D: {d1:+.2f}%, 1W: {w1:+.2f}%, 1M: {m1:+.2f}%) Vol: {vol_ratio}x avg, {pct_from_high:.1f}% from high")
                except Exception:
                    continue
        except Exception:
            pass

    system = "You are an expert technical analyst scanning stocks for trading setups."

    prompt = f"""Scan these watchlist stocks and identify the best setups:

{chr(10).join(context_parts) if context_parts else "No data available."}

Return JSON only:
{{
  "scans": [
    {{
      "ticker": "TICKER",
      "setup": "setup type (breakout, pullback, reversal, etc.)",
      "signal": "bullish/bearish/neutral",
      "strength": 1-10,
      "action": "Buy/Sell/Watch",
      "entry": suggested entry or null,
      "stop": suggested stop or null,
      "target": suggested target or null,
      "reason": "brief reason"
    }}
  ],
  "top_picks": ["TICKER1", "TICKER2"],
  "avoid": ["TICKER"],
  "market_context": "brief market context"
}}"""

    try:
        return _clean_json(_call_claude(system, prompt, 1500))
    except Exception as e:
        return {"scans": [], "error": str(e)}


# ═══════════════════════════════════════════════════════════════════════
#  AI RISK ALERTS
# ═══════════════════════════════════════════════════════════════════════
@router.get("/risk-check")
async def ai_risk_check():
    """AI proactively checks for portfolio risk issues."""
    context_parts = []

    # Portfolio
    try:
        raw = rdb.get("portfolio:default")
        if raw:
            port = json.loads(raw)
            total_value = 0
            lines = []
            for tk, v in list(port.items())[:15]:
                val = v.get("shares", 0) * v.get("cost_basis", 0)
                total_value += val
                lines.append(f"{tk}: {v.get('shares',0)} sh, ${val:.0f}")
            if total_value > 0:
                for tk, v in port.items():
                    pct = v.get("shares", 0) * v.get("cost_basis", 0) / total_value * 100
                    if pct > 20:
                        lines.append(f"⚠️ {tk} is {pct:.0f}% of portfolio (concentration risk)")
            context_parts.append("PORTFOLIO:\n" + "\n".join(lines))
    except Exception:
        pass

    # Open trades
    try:
        raw = rdb.lrange("journal:trades", 0, -1)
        open_trades = [json.loads(r) for r in raw if json.loads(r).get("status") == "open"]
        if open_trades:
            context_parts.append(f"OPEN TRADES: {len(open_trades)} positions")
            no_stop = [t for t in open_trades if not t.get("stop_loss")]
            if no_stop:
                context_parts.append(f"⚠️ {len(no_stop)} trades without stop losses: {', '.join(t.get('ticker','?') for t in no_stop)}")
    except Exception:
        pass

    system = "You are a risk management expert. Identify and flag risk issues proactively."

    prompt = f"""Check this trader's portfolio and positions for risk issues:

{chr(10).join(context_parts) if context_parts else "No data."}

Return JSON only:
{{
  "risk_level": "low/moderate/elevated/high/critical",
  "risk_score": 1-100,
  "alerts": [
    {{
      "severity": "critical/warning/info",
      "title": "Alert title",
      "description": "What the risk is",
      "action": "What to do about it"
    }}
  ],
  "summary": "1-2 sentence risk summary",
  "top_concern": "The biggest risk right now"
}}"""

    try:
        return _clean_json(_call_claude(system, prompt, 1000))
    except Exception as e:
        return {"risk_level": "unknown", "alerts": [], "error": str(e)}


# ═══════════════════════════════════════════════════════════════════════
#  AI NEWS SENTIMENT TIMELINE
# ═══════════════════════════════════════════════════════════════════════
@router.get("/sentiment-timeline/{ticker}")
async def ai_sentiment_timeline(ticker: str):
    """Track sentiment over time for a ticker."""
    ticker = ticker.upper()
    # Check cache
    cache_key = f"ai:sentiment_timeline:{ticker}"
    cached = rdb.get(cache_key)
    if cached:
        return json.loads(cached)

    context_parts = []
    if yf:
        try:
            data = yf.Ticker(ticker).history(period="3mo", interval="1w")
            if not data.empty:
                for idx, row in data.iterrows():
                    d = idx.strftime("%Y-%m-%d")
                    chg = round((float(row["Close"]) - float(row["Open"])) / max(float(row["Open"]), 0.01) * 100, 2)
                    vol = int(row["Volume"])
                    context_parts.append(f"Week of {d}: Close ${row['Close']:.2f}, Change {chg:+.2f}%, Vol {vol:,}")
        except Exception:
            pass

    system = "You are a sentiment analyst tracking market sentiment over time."

    prompt = f"""Analyze sentiment trajectory for {ticker} over the past 3 months:

{chr(10).join(context_parts) if context_parts else "Limited data."}

Return JSON only:
{{
  "timeline": [
    {{"week": "YYYY-MM-DD", "sentiment_score": -100 to 100, "label": "bullish/bearish/neutral", "event": "key event or null"}}
  ],
  "trend": "improving/deteriorating/stable/volatile",
  "current_sentiment": "bullish/bearish/neutral",
  "outlook": "1-2 sentence outlook"
}}"""

    try:
        result = _clean_json(_call_claude(system, prompt, 1200))
        rdb.set(cache_key, json.dumps(result), ex=3600)
        return result
    except Exception as e:
        return {"timeline": [], "error": str(e)}


# ═══════════════════════════════════════════════════════════════════════
#  ML PRICE PREDICTION (Simple)
# ═══════════════════════════════════════════════════════════════════════
@router.get("/predict/{ticker}")
async def ml_predict(ticker: str):
    """Simple statistical price prediction using momentum and mean reversion."""
    if not yf:
        return {"error": "yfinance not available"}
    ticker = ticker.upper()
    try:
        data = yf.Ticker(ticker).history(period="1y", interval="1d")
        if data.empty or len(data) < 60:
            return {"error": "Insufficient data"}

        closes = data["Close"].values
        returns = [(closes[i] - closes[i-1]) / closes[i-1] for i in range(1, len(closes))]
        current = float(closes[-1])

        # Momentum-based prediction
        momentum_5d = sum(returns[-5:]) / 5
        momentum_20d = sum(returns[-20:]) / 20
        momentum_60d = sum(returns[-60:]) / 60

        # Mean reversion signal
        sma_20 = float(sum(closes[-20:]) / 20)
        sma_50 = float(sum(closes[-50:]) / 50)
        deviation_from_mean = (current - sma_20) / sma_20

        # Volatility
        std_20 = (sum((r - momentum_20d) ** 2 for r in returns[-20:]) / 20) ** 0.5

        # Prediction (weighted ensemble)
        # Momentum says: continue recent direction
        momentum_pred = current * (1 + momentum_5d * 5)
        # Mean reversion says: revert toward SMA
        reversion_pred = current + (sma_20 - current) * 0.3
        # Combined
        pred_1w = round((momentum_pred * 0.6 + reversion_pred * 0.4), 2)
        pred_1m = round(current * (1 + momentum_20d * 20), 2)

        # Confidence based on trend consistency
        trend_consistency = abs(momentum_5d + momentum_20d) / max(std_20 * 2, 0.001)
        confidence = min(round(trend_consistency * 50, 0), 85)

        # Scenarios
        bull = round(current * (1 + std_20 * 2 * 5), 2)
        bear = round(current * (1 - std_20 * 2 * 5), 2)

        direction = "bullish" if momentum_5d > 0 and momentum_20d > 0 else "bearish" if momentum_5d < 0 and momentum_20d < 0 else "neutral"

        return {
            "ticker": ticker, "current_price": current,
            "prediction_1w": pred_1w, "prediction_1m": pred_1m,
            "direction": direction, "confidence": confidence,
            "scenarios": {"bull": bull, "base": pred_1w, "bear": bear},
            "signals": {
                "momentum_5d": round(momentum_5d * 100, 3),
                "momentum_20d": round(momentum_20d * 100, 3),
                "deviation_from_sma20": round(deviation_from_mean * 100, 2),
                "sma_20": round(sma_20, 2), "sma_50": round(sma_50, 2),
                "volatility_20d": round(std_20 * 100 * (252 ** 0.5), 2),
            },
            "disclaimer": "Statistical model only. Not financial advice.",
        }
    except Exception as e:
        return {"ticker": ticker, "error": str(e)}


# ══════════════════════════════════════════════════════════════════════
# v5.2 — AI Journal Deep Review, Portfolio Doctor, Market Narrative
# ══════════════════════════════════════════════════════════════════════

@router.get("/journal-deep-review")
async def ai_journal_deep_review():
    """AI reads entire trade history and finds behavioral patterns"""
    raw = rdb.lrange("journal:trades", 0, -1)
    trades = [json.loads(t) for t in raw]
    
    if len(trades) < 3:
        return {"error": "Need at least 3 trades for deep review"}
    
    closed = [t for t in trades if t.get("exit_price")]
    
    # Compute detailed stats for AI
    stats = {"total": len(trades), "closed": len(closed), "open": len(trades) - len(closed)}
    winners = []
    losers = []
    hold_times_win = []
    hold_times_loss = []
    
    for t in closed:
        pnl = (t["exit_price"] - t["entry_price"]) * t["quantity"] * (1 if t.get("side", "long") == "long" else -1)
        try:
            entry_dt = datetime.fromisoformat(t.get("entry_time", t.get("timestamp", "")))
            exit_dt = datetime.fromisoformat(t.get("exit_time", t.get("closed_at", "")))
            hold_days = (exit_dt - entry_dt).total_seconds() / 86400
        except:
            hold_days = 1
        
        if pnl > 0:
            winners.append({"ticker": t.get("ticker"), "pnl": round(pnl, 2), "hold_days": round(hold_days, 1), "side": t.get("side", "long")})
            hold_times_win.append(hold_days)
        else:
            losers.append({"ticker": t.get("ticker"), "pnl": round(pnl, 2), "hold_days": round(hold_days, 1), "side": t.get("side", "long")})
            hold_times_loss.append(hold_days)
    
    stats["winners"] = len(winners)
    stats["losers"] = len(losers)
    stats["avg_hold_winners"] = round(sum(hold_times_win) / len(hold_times_win), 1) if hold_times_win else 0
    stats["avg_hold_losers"] = round(sum(hold_times_loss) / len(hold_times_loss), 1) if hold_times_loss else 0
    stats["total_pnl"] = round(sum(w["pnl"] for w in winners) + sum(l["pnl"] for l in losers), 2)
    stats["avg_winner"] = round(sum(w["pnl"] for w in winners) / len(winners), 2) if winners else 0
    stats["avg_loser"] = round(sum(l["pnl"] for l in losers) / len(losers), 2) if losers else 0
    
    prompt = f"""Analyze this trader's complete journal and find behavioral patterns, strengths, and weaknesses.

STATS: {json.dumps(stats)}
TOP WINNERS: {json.dumps(winners[:10])}
TOP LOSERS: {json.dumps(sorted(losers, key=lambda x: x['pnl'])[:10])}

Return JSON:
{{
  "overall_grade": "A/B/C/D/F",
  "personality_type": "brief label like 'Disciplined Swing Trader' or 'Impatient Scalper'",
  "key_strengths": ["strength1", "strength2", "strength3"],
  "key_weaknesses": ["weakness1", "weakness2", "weakness3"],
  "behavioral_patterns": [
    {{"pattern": "description", "evidence": "data point", "impact": "positive/negative"}}
  ],
  "hold_time_analysis": "analysis of win vs loss hold times",
  "biggest_mistake_pattern": "the most costly recurring mistake",
  "action_plan": ["specific action 1", "specific action 2", "specific action 3"],
  "estimated_improvement": "estimated P&L improvement if action plan followed"
}}"""
    
    result = await _call_claude(prompt)
    if "error" in result:
        return result
    return {**result, "stats": stats}


@router.get("/portfolio-doctor")
async def ai_portfolio_doctor():
    """AI checkup: concentration risk, correlation, hedges, tax optimization"""
    # Gather all portfolio data
    holdings_raw = rdb.hgetall("portfolio:default")
    holdings = {k: json.loads(v) for k, v in holdings_raw.items()} if holdings_raw else {}
    
    journal_raw = rdb.lrange("journal:trades", 0, -1)
    trades = [json.loads(t) for t in journal_raw]
    open_trades = [t for t in trades if not t.get("exit_price")]
    
    watchlist_raw = rdb.lrange("watchlist:default", 0, -1)
    watchlist = [t.decode() if isinstance(t, bytes) else t for t in watchlist_raw]
    
    portfolio_summary = []
    total_value = 0
    for ticker, h in holdings.items():
        val = h.get("shares", 0) * h.get("cost_basis", 0)
        total_value += val
        portfolio_summary.append({"ticker": ticker, "shares": h.get("shares"), "cost_basis": h.get("cost_basis"), "value": round(val, 2)})
    
    prompt = f"""You are a portfolio doctor. Perform a comprehensive health check on this portfolio.

HOLDINGS ({len(holdings)} positions, total ~${round(total_value, 0)}):
{json.dumps(portfolio_summary[:20])}

OPEN TRADES: {len(open_trades)}
WATCHLIST: {watchlist[:20]}

Analyze and return JSON:
{{
  "health_score": 0-100,
  "health_grade": "A/B/C/D/F",
  "diagnosis": [
    {{"area": "Concentration Risk/Correlation/Hedging/Diversification/Tax", "status": "healthy/warning/critical", "detail": "explanation", "prescription": "what to do"}}
  ],
  "concentration_risk": {{"top_position_pct": number, "top_3_pct": number, "status": "ok/warning/danger"}},
  "missing_hedges": ["suggested hedge positions"],
  "tax_opportunities": ["tax-loss harvesting opportunities"],
  "rebalance_suggestions": [{{"action": "buy/sell/trim", "ticker": "X", "reason": "why"}}],
  "overall_assessment": "2-3 sentence summary"
}}"""
    
    result = await _call_claude(prompt)
    if "error" in result:
        return result
    return {**result, "portfolio_value": round(total_value, 2), "num_holdings": len(holdings)}


@router.get("/market-narrative")
async def ai_market_narrative():
    """Real-time AI synthesis of what's driving the market right now"""
    import yfinance as yf
    
    # Gather market data
    indices = {}
    for sym in ["SPY", "QQQ", "DIA", "IWM", "VIX", "TLT", "GLD", "USO"]:
        try:
            t = yf.Ticker(sym)
            h = t.history(period="5d")
            if not h.empty:
                current = float(h["Close"].iloc[-1])
                prev = float(h["Close"].iloc[-2]) if len(h) > 1 else current
                chg = (current - prev) / prev * 100
                indices[sym] = {"price": round(current, 2), "change_pct": round(chg, 2)}
        except:
            pass
    
    # Get recent news
    news_raw = rdb.get("cache:news")
    news = json.loads(news_raw)[:10] if news_raw else []
    news_headlines = [n.get("title", "") for n in news]
    
    # Get breaking alerts
    breaking_raw = rdb.get("cache:breaking")
    breaking = json.loads(breaking_raw)[:5] if breaking_raw else []
    breaking_headlines = [b.get("headline", b.get("title", "")) for b in breaking]
    
    prompt = f"""You are a market analyst. Synthesize what's driving the market RIGHT NOW.

MARKET DATA:
{json.dumps(indices)}

LATEST NEWS HEADLINES:
{json.dumps(news_headlines)}

BREAKING:
{json.dumps(breaking_headlines)}

Return JSON:
{{
  "narrative": "2-3 paragraph narrative of what's happening in markets right now",
  "key_themes": [{{"theme": "name", "impact": "positive/negative/neutral", "detail": "brief explanation"}}],
  "market_mood": "risk-on/risk-off/cautious/euphoric/fearful",
  "sector_outlook": [{{"sector": "name", "bias": "bullish/bearish/neutral", "catalyst": "why"}}],
  "trading_implications": ["implication 1", "implication 2", "implication 3"],
  "watch_for": ["upcoming event or level to watch"],
  "confidence": 0-100
}}"""
    
    result = await _call_claude(prompt)
    if "error" in result:
        return result
    return {**result, "market_data": indices, "generated_at": datetime.now().isoformat()}


@router.post("/natural-search")
async def ai_natural_search(payload: dict = Body(...)):
    """Natural language search/query across all terminal data"""
    query = payload.get("query", "")
    if not query:
        return {"error": "No query provided"}
    
    # Gather context
    journal_raw = rdb.lrange("journal:trades", 0, -1)
    trades = [json.loads(t) for t in journal_raw]
    closed = [t for t in trades if t.get("exit_price")]
    
    watchlist_raw = rdb.lrange("watchlist:default", 0, -1)
    watchlist = [t.decode() if isinstance(t, bytes) else t for t in watchlist_raw]
    
    holdings_raw = rdb.hgetall("portfolio:default")
    holdings = {k: json.loads(v) for k, v in holdings_raw.items()} if holdings_raw else {}
    
    # Build condensed context
    trade_summary = []
    for t in closed[-50:]:
        pnl = (t["exit_price"] - t["entry_price"]) * t["quantity"] * (1 if t.get("side", "long") == "long" else -1)
        trade_summary.append({"ticker": t.get("ticker"), "side": t.get("side"), "pnl": round(pnl, 2), "date": t.get("timestamp", "")[:10]})
    
    prompt = f"""User query: "{query}"

Available data:
- Trade journal: {len(trades)} trades ({len(closed)} closed)
- Recent closed trades: {json.dumps(trade_summary[-20:])}
- Watchlist: {watchlist[:20]}
- Portfolio holdings: {list(holdings.keys())}

Answer the user's question using the data. Return JSON:
{{
  "answer": "direct answer to the question",
  "data": [any relevant data rows],
  "visualization": "table/chart/number/text",
  "follow_up_suggestions": ["related question 1", "related question 2"]
}}"""
    
    result = await _call_claude(prompt)
    if "error" in result:
        return result
    return {**result, "query": query}


# ═══════════════════════════════════════════════════════════════════════
#  DEEP DIVE — Nemeth/Mispriced Assets 7-Layer Framework
# ═══════════════════════════════════════════════════════════════════════

from pydantic import BaseModel as _BaseModel

class DeepDiveRequest(_BaseModel):
    ticker: str

@router.post("/deep-dive")
async def deep_dive(req: DeepDiveRequest):
    """Full 7-layer Nemeth-style deep dive on a ticker."""
    ticker = req.ticker.upper()

    # Check cache
    cache_key = f"cache:deep-dive:{ticker}"
    cached = rdb.get(cache_key)
    if cached:
        return json.loads(cached)

    if not yf:
        raise HTTPException(500, "yfinance not available")

    # Gather data from yfinance
    t = yf.Ticker(ticker)
    try:
        info = t.info or {}
    except Exception:
        info = {}

    try:
        hist = t.history(period="3mo")
        price = float(hist["Close"].iloc[-1]) if not hist.empty else None
        pct_3m = round(((hist["Close"].iloc[-1] / hist["Close"].iloc[0]) - 1) * 100, 1) if len(hist) > 1 else 0
    except Exception:
        price, pct_3m = None, 0

    # Key financials
    market_cap = info.get("marketCap", 0)
    pe = info.get("trailingPE") or info.get("forwardPE")
    revenue = info.get("totalRevenue", 0)
    gross_margins = info.get("grossMargins", 0)
    profit_margins = info.get("profitMargins", 0)
    roe = info.get("returnOnEquity", 0)
    debt_to_equity = info.get("debtToEquity", 0)
    free_cash_flow = info.get("freeCashflow", 0)
    sector = info.get("sector", "Unknown")
    industry = info.get("industry", "Unknown")
    name = info.get("shortName") or info.get("longName") or ticker
    summary = info.get("longBusinessSummary", "")[:500]
    analyst_target = info.get("targetMeanPrice")
    recommendation = info.get("recommendationKey", "")
    num_analysts = info.get("numberOfAnalystOpinions", 0)

    # Format large numbers
    def fmt(n):
        if not n: return "N/A"
        if abs(n) >= 1e9: return f"${n/1e9:.1f}B"
        if abs(n) >= 1e6: return f"${n/1e6:.0f}M"
        return f"${n:,.0f}"

    financials_context = f"""
Company: {name} ({ticker})
Sector: {sector} | Industry: {industry}
Price: ${price} | 3-month return: {pct_3m}%
Market Cap: {fmt(market_cap)} | P/E: {pe or 'N/A'}
Revenue: {fmt(revenue)} | Gross Margin: {f'{gross_margins*100:.1f}%' if gross_margins else 'N/A'}
Profit Margin: {f'{profit_margins*100:.1f}%' if profit_margins else 'N/A'} | ROE: {f'{roe*100:.1f}%' if roe else 'N/A'}
D/E: {debt_to_equity or 'N/A'} | FCF: {fmt(free_cash_flow)}
Analyst Target: ${analyst_target} ({num_analysts} analysts) | Consensus: {recommendation}
Business: {summary}
"""

    system_prompt = """You are an elite semiconductor and technology equity analyst modeled after Nick Nemeth of Mispriced Assets.
Your analysis framework uses 7 layers, each requiring specific technical depth:

1. TECHNOLOGY LAYER — What specific technology does this company make? What architecture (EML vs VCSEL, InP vs GaAs vs SiPh, etc.)? What are the technical tradeoffs? Why does their approach matter vs alternatives?

2. MANUFACTURING LAYER — Wafer sizes, fab locations, vertical integration depth, capex trajectory, yield status, ramp capacity. How fast can they scale vs demand?

3. CUSTOMER/HYPERSCALER LAYER — Named vs unnamed customers, dual-source vs single-source risk, design win lock-in, revenue visibility (backlog, multi-year forecasts). How locked in are they?

4. COMPETITIVE POSITIONING — Not just "here are competitors" but real technology and manufacturing comparison. Who's ahead on which product generation? Who's gaining/losing share? What's the actual moat?

5. CEO/MANAGEMENT TRACK RECORD — Prior companies, execution history, compensation alignment. Do they underpromise/overdeliver?

6. FINANCIAL MODEL — Segment-by-segment revenue, gross margin expansion path with specific drivers, EPS trajectory. Forward P/E at multiple price levels.

7. CPO/AI ROADMAP — Where does this company sit in the AI infrastructure / co-packaged optics / data center buildout? Next-gen positioning.

After the 7 layers, provide:
- BULL CASE (3-4 specific points)
- BEAR CASE (3-4 specific points, be genuinely critical)
- COHR ANALOG SCORE (1-7): How closely does this match the Coherent mispriced-asset setup? 7 = nearly identical arithmetic mispricing of existing revenue, 1 = pure speculative bet
- KEY RISKS (ranked by severity)
- CATALYSTS (with approximate timeline)
- VERDICT: Is this a "mispriced asset" trade or a "binary event" trade? Be explicit.

Return valid JSON with keys: layers (array of 7 objects with "name" and "analysis"), bull_case (array), bear_case (array), cohr_score (number 1-7), key_risks (array), catalysts (array of objects with "event" and "timeline"), verdict (string), conviction (string: "high"/"medium"/"low").

Be direct. Do not write a fluff piece. If the stock is overvalued, say so. If the thesis is speculative, call it out."""

    try:
        raw = _call_claude(system_prompt, financials_context, max_tokens=4000)
        result = _clean_json(raw)
    except json.JSONDecodeError:
        result = {"raw_analysis": raw, "parse_error": True}
    except Exception as e:
        raise HTTPException(500, f"Deep dive failed: {str(e)}")

    result["ticker"] = ticker
    result["price"] = price
    result["market_cap"] = market_cap
    result["pe"] = pe
    result["name"] = name
    result["analyst_target"] = analyst_target
    result["pct_3m"] = pct_3m
    result["timestamp"] = datetime.now(timezone.utc).isoformat()

    # Cache for 30 minutes
    rdb.setex(cache_key, 1800, json.dumps(result))
    return result


# ═══════════════════════════════════════════════════════════════════════
#  TRADE REPLAY / JOURNAL AI
# ═══════════════════════════════════════════════════════════════════════

@router.get("/trade-replay")
async def trade_replay():
    """AI analysis of trading history — patterns, mistakes, behavioral insights."""
    import pathlib

    data_file = pathlib.Path.home() / "dev/stock-platform/.options_trades.json"
    if not data_file.exists():
        raise HTTPException(400, "No options journal data found. Upload a Fidelity CSV first.")

    with open(data_file) as f:
        journal = json.load(f)

    closed = journal.get("closed_trades", [])
    opens = journal.get("open_positions", [])
    summary = journal.get("summary", {})

    if not closed:
        raise HTTPException(400, "No closed trades to analyze")

    # Build context
    trades_text = []
    for t in closed[:50]:
        trades_text.append(f"{t.get('ticker','?')} {t.get('call_put','?')} ${t.get('strike',0)} | {t.get('strategy','?')} | P&L: ${t.get('pnl',0):.2f} | Close: {t.get('close_date','?')}")

    open_text = []
    for o in opens:
        open_text.append(f"{o.get('ticker','?')} {o.get('call_put','?')} ${o.get('strike',0)} | {o.get('strategy','?')} | {o.get('contracts',0)} contracts")

    context = f"""TRADING JOURNAL ANALYSIS

Summary: {json.dumps(summary)}

Closed Trades ({len(closed)} total):
{chr(10).join(trades_text)}

Open Positions ({len(opens)}):
{chr(10).join(open_text)}
"""

    system = """You are an elite trading coach analyzing a retail trader's options journal.

Provide a detailed analysis as JSON with these keys:
- "overview": 2-3 sentence summary of their trading performance
- "strengths": array of 3-4 specific strengths with examples from their trades
- "weaknesses": array of 3-4 specific weaknesses or patterns to fix
- "best_trades": array of top 3 trades with ticker, P&L, and why it was good
- "worst_trades": array of bottom 3 trades with ticker, P&L, and what went wrong
- "behavioral_patterns": array of 2-3 behavioral patterns you notice (e.g., "tends to hold losers too long", "good at sizing winners")
- "recommendations": array of 3-4 specific actionable recommendations
- "grade": letter grade A through F with brief justification
- "next_steps": array of 2-3 immediate actions to take

Be direct and honest. Reference specific trades. Don't write fluff."""

    try:
        raw = _call_claude(system, context, max_tokens=3000)
        result = _clean_json(raw)
    except json.JSONDecodeError:
        result = {"raw_analysis": raw, "parse_error": True}
    except Exception as e:
        raise HTTPException(500, f"AI analysis failed: {str(e)}")

    result["summary"] = summary
    result["total_trades"] = len(closed)
    result["open_count"] = len(opens)
    return result


# ═══════════════════════════════════════════════════════════════════════
#  MARKET INTELLIGENCE — DEEP MACRO ANALYSIS WITH EMERGENCY ALERTS
# ═══════════════════════════════════════════════════════════════════════

@router.get("/market-intel")
async def market_intel():
    """Deep macro analysis with emergency alerts, war assessment, and portfolio trade signals."""
    cache_key = "cache:market-intel"
    cached = rdb.get(cache_key)
    if cached:
        return json.loads(cached)

    if not yf:
        raise HTTPException(500, "yfinance not available")

    # Gather current macro data
    def safe_quote(sym):
        try:
            t = yf.Ticker(sym)
            h = t.history(period="5d")
            if h.empty:
                return {}
            last = float(h["Close"].iloc[-1])
            prev = float(h["Close"].iloc[-2]) if len(h) > 1 else last
            week_ago = float(h["Close"].iloc[0])
            return {
                "price": round(last, 2),
                "daily_chg": round((last - prev) / prev * 100, 2),
                "weekly_chg": round((last - week_ago) / week_ago * 100, 2),
            }
        except Exception:
            return {}

    oil = safe_quote("BZ=F")
    wti = safe_quote("CL=F")
    vix = safe_quote("^VIX")
    tnx = safe_quote("^TNX")
    tyx = safe_quote("^TYX")
    dxy = safe_quote("DX-Y.NYB")
    gold = safe_quote("GC=F")
    spy = safe_quote("SPY")
    qqq = safe_quote("QQQ")
    btc = safe_quote("BTC-USD")

    # Load portfolio tickers
    portfolio_tickers = []
    try:
        import pathlib, csv as csvmod
        csv_path = pathlib.Path(__file__).parent.parent / "data" / "positions.csv"
        if csv_path.exists():
            with open(csv_path) as f:
                reader = csvmod.DictReader(f)
                for row in reader:
                    sym = (row.get("Symbol") or "").strip()
                    if sym and "SPAXX" not in sym and sym != "Cash" and not sym.startswith("-"):
                        portfolio_tickers.append(sym)
    except Exception:
        pass

    macro_context = f"""CURRENT MARKET DATA (live):
- Brent Oil: ${oil.get('price','N/A')} ({oil.get('daily_chg','?')}% today, {oil.get('weekly_chg','?')}% 5d)
- WTI Oil: ${wti.get('price','N/A')} ({wti.get('daily_chg','?')}% today)
- VIX: {vix.get('price','N/A')} ({vix.get('daily_chg','?')}% today, {vix.get('weekly_chg','?')}% 5d)
- 10Y Yield: {tnx.get('price','N/A')}% ({tnx.get('daily_chg','?')}% today)
- 30Y Yield: {tyx.get('price','N/A')}%
- DXY Dollar: {dxy.get('price','N/A')} ({dxy.get('daily_chg','?')}% today)
- Gold: ${gold.get('price','N/A')} ({gold.get('daily_chg','?')}% today)
- SPY: ${spy.get('price','N/A')} ({spy.get('daily_chg','?')}% today, {spy.get('weekly_chg','?')}% 5d)
- QQQ: ${qqq.get('price','N/A')} ({qqq.get('daily_chg','?')}% today)
- BTC: ${btc.get('price','N/A')} ({btc.get('daily_chg','?')}% today)

PORTFOLIO HOLDINGS: {', '.join(portfolio_tickers[:20])}

Today's date: {datetime.now(timezone.utc).strftime('%B %d, %Y')}
"""

    system = """You are an elite macro strategist and geopolitical analyst providing real-time market intelligence for a retail trader running a covered call wheel strategy on a ~$30K Fidelity account.

Your job is to synthesize the current macro environment into actionable intelligence. Think like the best analysts from Goldman Sachs, Bridgewater, and institutional trading desks — but translate it for a retail trader who needs to know what to DO, not just what's happening.

Return valid JSON with these keys:

"threat_level": "critical" | "elevated" | "normal" — overall market risk right now

"headline": one-sentence summary of the most important thing happening in markets right now (max 15 words)

"emergency_alerts": array of objects, each with:
  - "alert": short title (e.g., "STRAIT OF HORMUZ CLOSED", "VIX SPIKE ABOVE 30")
  - "severity": "critical" | "high" | "medium"
  - "detail": 2-3 sentence explanation of what happened and why it matters
  - "portfolio_impact": how this specifically affects the trader's portfolio
  - "action": what the trader should DO right now
Only include genuinely urgent items. Empty array if nothing urgent.

"macro_assessment": object with:
  - "war_status": current Iran/Middle East war assessment (2-3 sentences)
  - "fed_outlook": rate cut/hold expectations and why (2 sentences)
  - "recession_risk": percentage estimate with one sentence justification
  - "oil_thesis": what oil prices mean for the portfolio (2 sentences)
  - "volatility_regime": current VIX regime and what it means for selling premium

"scenario_probabilities": array of 3 scenarios, each with:
  - "scenario": name (e.g., "Ceasefire 2-4 weeks")
  - "probability": percentage
  - "market_impact": what happens to SPY/oil/rates
  - "portfolio_play": what to do in this scenario

"trade_signals": array of specific actionable signals, each with:
  - "signal": title
  - "ticker": relevant ticker or "MACRO"
  - "direction": "bullish" | "bearish" | "neutral"
  - "action": specific trade action
  - "urgency": "now" | "this_week" | "watch"
  - "rationale": one sentence why

"positions_to_watch": array for specific portfolio holdings that need attention right now, each with:
  - "ticker": from the portfolio
  - "status": "safe" | "caution" | "danger"
  - "note": why this position needs attention right now

Be brutally honest. Don't hedge everything. Give real probabilities and real trade calls. The trader wants to know: what is happening, why does it matter to MY portfolio, and what should I DO about it."""

    try:
        raw = _call_claude(system, macro_context, max_tokens=4000)
        result = _clean_json(raw)
    except json.JSONDecodeError:
        result = {"raw_analysis": raw, "parse_error": True}
    except Exception as e:
        raise HTTPException(500, f"Market intel failed: {str(e)}")

    result["macro_data"] = {
        "oil": oil, "wti": wti, "vix": vix, "tnx": tnx,
        "dxy": dxy, "gold": gold, "spy": spy, "qqq": qqq, "btc": btc,
    }
    result["timestamp"] = datetime.now(timezone.utc).isoformat()

    # Cache for 5 minutes
    rdb.setex(cache_key, 300, json.dumps(result))
    return result


# ═══════════════════════════════════════════════════════════════════════
#  NEXT DAY OUTLOOK — INSTITUTIONAL GRADE DASHBOARD BANNER
# ═══════════════════════════════════════════════════════════════════════

@router.get("/next-day-outlook")
async def next_day_outlook():
    """Institutional-grade next trading day outlook for dashboard banner."""
    cache_key = "cache:next-day-outlook"
    cached = rdb.get(cache_key)
    if cached:
        return json.loads(cached)

    if not yf:
        raise HTTPException(500, "yfinance not available")

    def safe_data(sym):
        try:
            t = yf.Ticker(sym)
            h = t.history(period="1mo")
            if h.empty: return {}
            prices = h["Close"].tolist()
            last = prices[-1]
            prev = prices[-2] if len(prices) > 1 else last
            sma5 = sum(prices[-5:]) / min(5, len(prices))
            sma20 = sum(prices[-20:]) / min(20, len(prices))
            # RSI calculation
            gains, losses = [], []
            for i in range(1, min(15, len(prices))):
                diff = prices[i] - prices[i-1]
                if diff > 0: gains.append(diff)
                else: losses.append(abs(diff))
            avg_gain = sum(gains) / 14 if gains else 0.001
            avg_loss = sum(losses) / 14 if losses else 0.001
            rsi = 100 - (100 / (1 + avg_gain / avg_loss))
            return {
                "price": round(last, 2),
                "change_pct": round((last - prev) / prev * 100, 2),
                "above_sma5": last > sma5,
                "above_sma20": last > sma20,
                "rsi": round(rsi, 1),
                "trend": "up" if last > sma5 > sma20 else "down" if last < sma5 < sma20 else "mixed",
            }
        except Exception:
            return {}

    spy = safe_data("SPY")
    qqq = safe_data("QQQ")
    vix = safe_data("^VIX")
    oil = safe_data("BZ=F")
    tnx = safe_data("^TNX")
    dxy = safe_data("DX-Y.NYB")
    gold = safe_data("GC=F")
    iwm = safe_data("IWM")

    # Portfolio tickers
    portfolio = []
    try:
        import pathlib, csv
        csv_path = pathlib.Path(__file__).parent.parent / "data" / "positions.csv"
        if csv_path.exists():
            with open(csv_path) as f:
                reader = csv.DictReader(f)
                for row in reader:
                    sym = (row.get("Symbol") or "").strip()
                    if sym and "SPAXX" not in sym and sym != "Cash" and not sym.startswith("-"):
                        portfolio.append(sym)
    except Exception:
        pass

    context = f"""You are an institutional macro strategist giving a next-day trading outlook.

CURRENT DATA:
SPY: ${spy.get('price','?')} ({spy.get('change_pct','?')}% today) | RSI: {spy.get('rsi','?')} | Trend: {spy.get('trend','?')} | Above 5d MA: {spy.get('above_sma5','?')} | Above 20d MA: {spy.get('above_sma20','?')}
QQQ: ${qqq.get('price','?')} ({qqq.get('change_pct','?')}%) | RSI: {qqq.get('rsi','?')} | Trend: {qqq.get('trend','?')}
IWM: ${iwm.get('price','?')} ({iwm.get('change_pct','?')}%) | Trend: {iwm.get('trend','?')}
VIX: {vix.get('price','?')} ({vix.get('change_pct','?')}%) | RSI: {vix.get('rsi','?')}
Brent Oil: ${oil.get('price','?')} ({oil.get('change_pct','?')}%)
10Y Yield: {tnx.get('price','?')}% ({tnx.get('change_pct','?')}%)
DXY: {dxy.get('price','?')} ({dxy.get('change_pct','?')}%)
Gold: ${gold.get('price','?')} ({gold.get('change_pct','?')}%)

Portfolio: {', '.join(portfolio[:15])}
Today: {datetime.now().strftime('%A, %B %d, %Y')}

Return ONLY valid JSON:
{{
  "direction": "bullish" | "bearish" | "neutral",
  "confidence": number 1-100,
  "headline": "max 12 word summary of what to expect tomorrow",
  "reasoning": "2-3 sentences of institutional-grade analysis: dealer positioning, put/call skew, macro catalysts, technicals. Reference specific levels.",
  "key_levels": {{"spy_support": number, "spy_resistance": number}},
  "risks": "one sentence on what could go wrong",
  "portfolio_action": "one specific action for tomorrow related to the trader's portfolio",
  "vix_signal": "what VIX is telling you about tomorrow",
  "oil_signal": "what oil means for rate-sensitive positions"
}}"""

    try:
        key = os.getenv("ANTHROPIC_API_KEY", "") or ANTHROPIC_KEY
        if not key:
            env_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), ".env")
            if os.path.exists(env_path):
                with open(env_path) as f:
                    for line in f:
                        if line.strip().startswith("ANTHROPIC_API_KEY="):
                            key = line.strip().split("=", 1)[1]

        client = anthropic.Anthropic(api_key=key)
        msg = client.messages.create(
            model="claude-sonnet-4-20250514",
            max_tokens=800,
            messages=[{"role": "user", "content": context}],
        )
        raw = msg.content[0].text.strip()
        result = _clean_json(raw)
    except json.JSONDecodeError:
        result = {"direction": "neutral", "confidence": 50, "headline": "Analysis unavailable", "reasoning": raw if 'raw' in dir() else "Parse error"}
    except Exception as e:
        result = {"direction": "neutral", "confidence": 50, "headline": "Analysis unavailable", "reasoning": str(e)}

    result["macro"] = {
        "spy": spy, "qqq": qqq, "vix": vix, "oil": oil, "tnx": tnx, "gold": gold,
    }
    result["timestamp"] = datetime.now(timezone.utc).isoformat()

    # Cache for 10 minutes
    rdb.setex(cache_key, 600, json.dumps(result))
    return result
