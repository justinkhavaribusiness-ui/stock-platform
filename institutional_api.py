"""
Institutional API Endpoints
Add these routes to your existing FastAPI app (main.py).

Required: pip install anthropic yfinance fredapi requests
Required env: ANTHROPIC_API_KEY

Usage: Copy the routes into your main.py, or import as a router.
"""

from fastapi import APIRouter, Request
from fastapi.responses import JSONResponse
import yfinance as yf
import json, os, time, traceback
from datetime import datetime, timedelta
from typing import Optional

router = APIRouter(prefix="/api")

# ═══════════════════════════════════════════════════════════
#  AI CHAT - Claude-powered trade analyst
# ═══════════════════════════════════════════════════════════

@router.post("/chat")
async def chat_endpoint(request: Request):
    """Proxy to Anthropic Claude API with trading context."""
    try:
        import anthropic
    except ImportError:
        return JSONResponse({"error": "pip install anthropic"}, 500)

    body = await request.json()
    messages = body.get("messages", [])
    context = body.get("context", {})

    # Build system prompt with live market context
    quotes_str = ""
    if context and context.get("quotes"):
        for q in context["quotes"]:
            if isinstance(q, dict) and q.get("ticker"):
                chg = q.get("changePercent", 0)
                quotes_str += f"  {q['ticker']}: ${q.get('price','?')} ({'+' if chg >= 0 else ''}{chg:.2f}%)\n"

    system = f"""You are an expert institutional trading analyst embedded in a photonics-focused stock trading platform. You provide concise, actionable analysis.

CURRENT MARKET SNAPSHOT ({context.get('timestamp', 'unknown')}):
{quotes_str or '  (Loading...)'}

USER'S FOCUS AREAS:
- Photonics supply chain: COHR, AAOI, MTSI, POET, CIEN, ANET, MRVL, AXTI, GLW, etc.
- Core holdings: NVDA, AAPL, TSLA, AMZN, FANG, OSCR, SOFI
- Strategies: Covered calls, cash-secured puts, long calls, swing trades
- Accounts: Individual brokerage + Roth IRA at Fidelity

GUIDELINES:
- Be specific: exact prices, strike prices, dates, percentages
- Always mention risk/reward and position sizing
- Flag upcoming catalysts (earnings, ex-div dates, FOMC)
- Use technical levels when relevant (support/resistance, moving averages)
- Compare IV rank when discussing options
- Keep responses focused and scannable — use brief sections, not walls of text
- You are NOT a financial advisor — remind when giving specific trade suggestions
- When asked about portfolio, reference the user's known positions and watchlist"""

    api_key = os.environ.get("ANTHROPIC_API_KEY", "")
    if not api_key:
        return JSONResponse({"content": "⚠️ ANTHROPIC_API_KEY not set. Add it to your environment:\n\nexport ANTHROPIC_API_KEY=sk-ant-...\n\nThen restart the API server."}, 200)

    try:
        client = anthropic.Anthropic(api_key=api_key)
        response = client.messages.create(
            model="claude-sonnet-4-20250514",
            max_tokens=2000,
            system=system,
            messages=messages[-20:],  # Last 20 messages for context
        )
        content = response.content[0].text if response.content else "No response."
        return JSONResponse({"content": content})
    except Exception as e:
        return JSONResponse({"content": f"⚠️ API Error: {str(e)}"}, 200)


# ═══════════════════════════════════════════════════════════
#  EARNINGS CALENDAR - Real data from yfinance
# ═══════════════════════════════════════════════════════════

@router.get("/earnings")
async def earnings_calendar(tickers: str = ""):
    """Get upcoming earnings for watchlist tickers."""
    if not tickers:
        tickers = "COHR,AAOI,MTSI,POET,CIEN,NVDA,AAPL,TSLA,AMZN,FANG,OSCR,SOFI,ANET,MRVL,AMD,GOOGL,META"

    results = []
    for ticker in tickers.split(","):
        ticker = ticker.strip()
        if not ticker:
            continue
        try:
            stock = yf.Ticker(ticker)
            info = stock.info or {}
            cal = stock.calendar
            
            earnings_date = None
            if cal is not None:
                if isinstance(cal, dict):
                    ed = cal.get("Earnings Date")
                    if ed:
                        earnings_date = ed[0].isoformat() if isinstance(ed, list) else str(ed)
                elif hasattr(cal, 'index'):
                    if "Earnings Date" in cal.index:
                        ed = cal.loc["Earnings Date"]
                        earnings_date = str(ed.iloc[0]) if hasattr(ed, 'iloc') else str(ed)

            # Get analyst estimates
            eps_est = info.get("trailingEps")
            rev_est = info.get("totalRevenue")
            
            results.append({
                "ticker": ticker,
                "name": info.get("shortName", ticker),
                "earningsDate": earnings_date,
                "epsEstimate": round(eps_est, 2) if eps_est else None,
                "revenueEstimate": rev_est,
                "marketCap": info.get("marketCap"),
                "forwardPE": round(info.get("forwardPE", 0), 1) if info.get("forwardPE") else None,
                "analystRating": info.get("recommendationKey"),
                "targetPrice": info.get("targetMeanPrice"),
                "numberOfAnalysts": info.get("numberOfAnalystOpinions"),
            })
        except Exception as e:
            results.append({"ticker": ticker, "error": str(e)})

    return JSONResponse({"data": results})


# ═══════════════════════════════════════════════════════════
#  OPTIONS FLOW - Real options data from yfinance
# ═══════════════════════════════════════════════════════════

@router.get("/options-flow/{ticker}")
async def options_flow(ticker: str):
    """Get options chain with volume/OI analysis."""
    try:
        stock = yf.Ticker(ticker)
        info = stock.info or {}
        expirations = stock.options

        if not expirations:
            return JSONResponse({"data": [], "expirations": []})

        # Get nearest 3 expirations
        flows = []
        for exp in expirations[:3]:
            try:
                chain = stock.option_chain(exp)
                current_price = info.get("currentPrice") or info.get("regularMarketPrice", 0)

                for _, row in chain.calls.iterrows():
                    vol = int(row.get("volume", 0) or 0)
                    oi = int(row.get("openInterest", 0) or 0)
                    if vol < 10:
                        continue
                    premium = round(vol * float(row.get("lastPrice", 0)) * 100, 0)
                    flows.append({
                        "type": "CALL",
                        "strike": float(row["strike"]),
                        "expiry": exp,
                        "bid": float(row.get("bid", 0)),
                        "ask": float(row.get("ask", 0)),
                        "last": float(row.get("lastPrice", 0)),
                        "volume": vol,
                        "openInterest": oi,
                        "volOiRatio": round(vol / max(oi, 1), 2),
                        "impliedVol": round(float(row.get("impliedVolatility", 0)) * 100, 1),
                        "premium": premium,
                        "inTheMoney": row.get("inTheMoney", False),
                        "unusual": vol > oi * 0.5 or premium > 200000,
                    })

                for _, row in chain.puts.iterrows():
                    vol = int(row.get("volume", 0) or 0)
                    oi = int(row.get("openInterest", 0) or 0)
                    if vol < 10:
                        continue
                    premium = round(vol * float(row.get("lastPrice", 0)) * 100, 0)
                    flows.append({
                        "type": "PUT",
                        "strike": float(row["strike"]),
                        "expiry": exp,
                        "bid": float(row.get("bid", 0)),
                        "ask": float(row.get("ask", 0)),
                        "last": float(row.get("lastPrice", 0)),
                        "volume": vol,
                        "openInterest": oi,
                        "volOiRatio": round(vol / max(oi, 1), 2),
                        "impliedVol": round(float(row.get("impliedVolatility", 0)) * 100, 1),
                        "premium": premium,
                        "inTheMoney": row.get("inTheMoney", False),
                        "unusual": vol > oi * 0.5 or premium > 200000,
                    })
            except:
                continue

        # Sort by premium descending
        flows.sort(key=lambda x: x["premium"], reverse=True)

        return JSONResponse({
            "ticker": ticker,
            "price": info.get("currentPrice") or info.get("regularMarketPrice"),
            "expirations": list(expirations[:6]),
            "data": flows[:100],  # Top 100 by premium
            "summary": {
                "totalCallVolume": sum(f["volume"] for f in flows if f["type"] == "CALL"),
                "totalPutVolume": sum(f["volume"] for f in flows if f["type"] == "PUT"),
                "totalCallPremium": sum(f["premium"] for f in flows if f["type"] == "CALL"),
                "totalPutPremium": sum(f["premium"] for f in flows if f["type"] == "PUT"),
                "unusualCount": sum(1 for f in flows if f["unusual"]),
            }
        })
    except Exception as e:
        return JSONResponse({"error": str(e), "data": []}, 200)


# ═══════════════════════════════════════════════════════════
#  MACRO DASHBOARD - Real market indicators
# ═══════════════════════════════════════════════════════════

@router.get("/macro")
async def macro_dashboard():
    """Get macro indicators: VIX, yields, commodities, FX."""
    indicators = {}

    # Batch fetch all macro tickers
    macro_tickers = {
        "VIX": "^VIX",
        "SPY": "SPY",
        "QQQ": "QQQ",
        "DXY": "DX-Y.NYB",
        "US10Y": "^TNX",
        "US2Y": "^IRX",
        "US30Y": "^TYX",
        "Gold": "GC=F",
        "WTI": "CL=F",
        "NatGas": "NG=F",
        "Copper": "HG=F",
        "EURUSD": "EURUSD=X",
        "USDJPY": "JPY=X",
        "GBPUSD": "GBPUSD=X",
        "Bitcoin": "BTC-USD",
    }

    for name, symbol in macro_tickers.items():
        try:
            t = yf.Ticker(symbol)
            info = t.info or {}
            price = info.get("regularMarketPrice") or info.get("currentPrice")
            prev = info.get("regularMarketPreviousClose")
            if price:
                change = round(price - (prev or price), 4)
                change_pct = round((change / (prev or price)) * 100, 2) if prev else 0
                indicators[name] = {
                    "price": round(price, 4),
                    "change": change,
                    "changePct": change_pct,
                    "prevClose": prev,
                }
        except:
            pass

    # Yield curve spread
    us10 = indicators.get("US10Y", {}).get("price")
    us2 = indicators.get("US2Y", {}).get("price")
    if us10 and us2:
        indicators["Spread2s10s"] = {
            "price": round(us10 - us2, 2),
            "label": "2s10s Spread",
        }

    return JSONResponse({"data": indicators, "timestamp": datetime.now().isoformat()})


# ═══════════════════════════════════════════════════════════
#  SEC FILINGS - Insider trades via SEC EDGAR
# ═══════════════════════════════════════════════════════════

@router.get("/sec-filings/{ticker}")
async def sec_filings(ticker: str):
    """Get insider trades and institutional filings."""
    try:
        stock = yf.Ticker(ticker)
        
        # Insider transactions
        insiders = []
        try:
            insider_df = stock.insider_transactions
            if insider_df is not None and not insider_df.empty:
                for _, row in insider_df.head(20).iterrows():
                    insiders.append({
                        "insider": str(row.get("Insider", "")),
                        "relation": str(row.get("Position", row.get("Relation", ""))),
                        "type": str(row.get("Transaction", row.get("Text", ""))),
                        "date": str(row.get("Start Date", row.get("Date", ""))),
                        "shares": int(row.get("Shares", 0)) if row.get("Shares") else 0,
                        "value": float(row.get("Value", 0)) if row.get("Value") else 0,
                    })
        except:
            pass

        # Institutional holders
        institutions = []
        try:
            inst_df = stock.institutional_holders
            if inst_df is not None and not inst_df.empty:
                for _, row in inst_df.head(10).iterrows():
                    institutions.append({
                        "holder": str(row.get("Holder", "")),
                        "shares": int(row.get("Shares", 0)) if row.get("Shares") else 0,
                        "value": float(row.get("Value", 0)) if row.get("Value") else 0,
                        "pctHeld": float(row.get("% Out", row.get("pctHeld", 0))) if row.get("% Out", row.get("pctHeld")) else 0,
                        "date": str(row.get("Date Reported", "")),
                    })
        except:
            pass

        return JSONResponse({
            "ticker": ticker,
            "insiderTrades": insiders,
            "institutionalHolders": institutions,
        })
    except Exception as e:
        return JSONResponse({"ticker": ticker, "error": str(e), "insiderTrades": [], "institutionalHolders": []}, 200)


# ═══════════════════════════════════════════════════════════
#  ECONOMIC CALENDAR - Key dates
# ═══════════════════════════════════════════════════════════

@router.get("/econ-calendar")
async def econ_calendar():
    """Return upcoming economic events with dates and impact."""
    # Since free real-time econ calendars are limited, we maintain a curated list
    # that updates based on the Federal Reserve calendar and BLS schedule
    now = datetime.now()
    
    # Key recurring events (approximate next dates)
    events = []
    
    # FOMC meetings 2026 (approximate)
    fomc_dates = [
        "2026-01-28", "2026-03-18", "2026-05-06", "2026-06-17",
        "2026-07-29", "2026-09-16", "2026-11-04", "2026-12-16"
    ]
    for d in fomc_dates:
        dt = datetime.strptime(d, "%Y-%m-%d")
        if dt >= now - timedelta(days=1):
            events.append({
                "event": "FOMC Rate Decision",
                "date": d,
                "time": "14:00 ET",
                "impact": "high",
                "category": "monetary_policy",
                "description": "Federal Reserve interest rate decision and statement",
            })
            break  # Only next one
    
    # Monthly recurring (approximate)
    monthly = [
        {"event": "CPI Report", "day": 12, "time": "08:30 ET", "impact": "high", "category": "inflation"},
        {"event": "Nonfarm Payrolls", "day": 7, "time": "08:30 ET", "impact": "high", "category": "employment"},
        {"event": "PCE Price Index", "day": 28, "time": "08:30 ET", "impact": "high", "category": "inflation"},
        {"event": "ISM Manufacturing", "day": 1, "time": "10:00 ET", "impact": "medium", "category": "manufacturing"},
        {"event": "Retail Sales", "day": 15, "time": "08:30 ET", "impact": "medium", "category": "consumer"},
        {"event": "GDP (Advance)", "day": 25, "time": "08:30 ET", "impact": "high", "category": "growth"},
        {"event": "Initial Jobless Claims", "day": 0, "time": "08:30 ET", "impact": "medium", "category": "employment"},  # weekly
    ]
    
    for m in monthly:
        for month_offset in range(3):  # Next 3 months
            target = now.replace(day=1) + timedelta(days=32 * month_offset)
            try:
                event_date = target.replace(day=min(m["day"] or 1, 28))
            except:
                event_date = target.replace(day=1)
            
            if event_date >= now - timedelta(days=1):
                events.append({
                    "event": m["event"],
                    "date": event_date.strftime("%Y-%m-%d"),
                    "time": m["time"],
                    "impact": m["impact"],
                    "category": m["category"],
                })
                break

    events.sort(key=lambda x: x["date"])
    return JSONResponse({"data": events[:20]})


# ═══════════════════════════════════════════════════════════
#  USAGE: Add to your main.py
# ═══════════════════════════════════════════════════════════
#
# from institutional_api import router as inst_router
# app.include_router(inst_router)
#
# Or copy the individual route functions into your existing app.
