"""
Institutional Router — IV vs HV Scanner, Put/Call Ratio, Insider Transactions, Short Interest
Professional-grade market analytics.
"""

from fastapi import APIRouter, HTTPException
from datetime import datetime, timezone
import json, os, math

router = APIRouter(prefix="/institutional", tags=["institutional"])

try:
    import yfinance as yf
except ImportError:
    yf = None

import redis
REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379")
rdb = redis.from_url(REDIS_URL, decode_responses=True)


def _get_portfolio_tickers():
    """Load tickers from Fidelity positions CSV."""
    import pathlib, csv
    tickers = []
    csv_path = pathlib.Path(__file__).parent.parent / "data" / "positions.csv"
    if csv_path.exists():
        with open(csv_path) as f:
            reader = csv.DictReader(f)
            for row in reader:
                sym = (row.get("Symbol") or "").strip()
                if sym and "SPAXX" not in sym and sym != "Cash" and not sym.startswith("-"):
                    tickers.append(sym)
    return tickers[:20]


# ═══════════════════════════════════════════════════════════════════════
#  IV vs HV SCANNER — Premium Selling Edge Detector
# ═══════════════════════════════════════════════════════════════════════

@router.get("/iv-hv")
async def iv_vs_hv():
    """Compare implied vs historical volatility for portfolio holdings.
    When IV > HV, premium is rich — sell CCs. When IV < HV, premium is cheap — hold."""
    if not yf:
        raise HTTPException(500, "yfinance not available")

    tickers = _get_portfolio_tickers()
    results = []

    for tk in tickers:
        try:
            t = yf.Ticker(tk)
            info = t.info or {}
            hist = t.history(period="3mo")
            if hist.empty:
                continue

            # Historical volatility (20-day annualized)
            returns = hist["Close"].pct_change().dropna()
            hv20 = float(returns[-20:].std() * (252 ** 0.5) * 100) if len(returns) >= 20 else None
            hv10 = float(returns[-10:].std() * (252 ** 0.5) * 100) if len(returns) >= 10 else None

            # Implied volatility from options
            iv = None
            try:
                exps = list(t.options)
                if exps:
                    chain = t.option_chain(exps[0])
                    # ATM call IV
                    price = float(hist["Close"].iloc[-1])
                    calls = chain.calls
                    calls_sorted = calls.iloc[(calls["strike"] - price).abs().argsort()[:3]]
                    ivs = [float(r["impliedVolatility"]) for _, r in calls_sorted.iterrows() if not math.isnan(r["impliedVolatility"])]
                    if ivs:
                        iv = round(sum(ivs) / len(ivs) * 100, 1)
            except Exception:
                pass

            # IV percentile (where current IV sits vs 1-year range)
            iv_pct = None
            if iv and hv20:
                # Rough percentile based on ratio
                ratio = iv / hv20
                iv_pct = min(100, max(0, int(ratio * 50)))

            premium_signal = None
            if iv and hv20:
                if iv > hv20 * 1.2:
                    premium_signal = "RICH"
                elif iv < hv20 * 0.8:
                    premium_signal = "CHEAP"
                else:
                    premium_signal = "FAIR"

            action = None
            if premium_signal == "RICH":
                action = "Sell CC — premium is elevated above realized vol"
            elif premium_signal == "CHEAP":
                action = "Hold — premium too cheap to sell"
            else:
                action = "Neutral — premium at fair value"

            results.append({
                "ticker": tk,
                "price": round(float(hist["Close"].iloc[-1]), 2),
                "iv": iv,
                "hv20": round(hv20, 1) if hv20 else None,
                "hv10": round(hv10, 1) if hv10 else None,
                "iv_hv_ratio": round(iv / hv20, 2) if iv and hv20 else None,
                "iv_percentile": iv_pct,
                "premium_signal": premium_signal,
                "action": action,
            })
        except Exception:
            continue

    # Sort by IV/HV ratio descending (richest premium first)
    results.sort(key=lambda x: x.get("iv_hv_ratio") or 0, reverse=True)

    return {
        "positions": results,
        "rich_count": len([r for r in results if r.get("premium_signal") == "RICH"]),
        "cheap_count": len([r for r in results if r.get("premium_signal") == "CHEAP"]),
    }


# ═══════════════════════════════════════════════════════════════════════
#  PUT/CALL RATIO + DEALER POSITIONING
# ═══════════════════════════════════════════════════════════════════════

@router.get("/put-call")
async def put_call_ratio():
    """Put/call ratio, max pain, and dealer positioning signals for portfolio + SPY."""
    if not yf:
        raise HTTPException(500, "yfinance not available")

    targets = ["SPY", "QQQ"] + _get_portfolio_tickers()[:10]
    results = []

    for tk in list(dict.fromkeys(targets)):  # dedupe
        try:
            t = yf.Ticker(tk)
            exps = list(t.options)
            if not exps:
                continue

            chain = t.option_chain(exps[0])
            calls = chain.calls
            puts = chain.puts
            hist = t.history(period="1d")
            price = float(hist["Close"].iloc[-1]) if not hist.empty else 0

            # Volume-based P/C ratio
            call_vol = int(calls["volume"].sum()) if not calls["volume"].isna().all() else 0
            put_vol = int(puts["volume"].sum()) if not puts["volume"].isna().all() else 0
            pc_ratio = round(put_vol / call_vol, 2) if call_vol > 0 else 0

            # OI-based P/C ratio
            call_oi = int(calls["openInterest"].sum()) if not calls["openInterest"].isna().all() else 0
            put_oi = int(puts["openInterest"].sum()) if not puts["openInterest"].isna().all() else 0
            pc_oi_ratio = round(put_oi / call_oi, 2) if call_oi > 0 else 0

            # Max pain calculation (strike where most options expire worthless)
            max_pain = None
            try:
                strikes = sorted(set(calls["strike"].tolist() + puts["strike"].tolist()))
                min_pain_val = float("inf")
                for strike in strikes:
                    pain = 0
                    for _, row in calls.iterrows():
                        if strike > row["strike"]:
                            pain += (strike - row["strike"]) * (row.get("openInterest") or 0) * 100
                    for _, row in puts.iterrows():
                        if strike < row["strike"]:
                            pain += (row["strike"] - strike) * (row.get("openInterest") or 0) * 100
                    if pain < min_pain_val:
                        min_pain_val = pain
                        max_pain = round(float(strike), 2)
            except Exception:
                pass

            # Sentiment signal
            sentiment = "neutral"
            if pc_ratio > 1.2:
                sentiment = "bearish"
            elif pc_ratio < 0.7:
                sentiment = "bullish"

            # Dealer positioning inference
            dealer_signal = None
            if pc_oi_ratio > 1.5:
                dealer_signal = "Dealers net short puts — forced selling on down moves (negative gamma)"
            elif pc_oi_ratio < 0.6:
                dealer_signal = "Dealers net short calls — forced buying on up moves (positive gamma)"
            else:
                dealer_signal = "Balanced dealer positioning"

            results.append({
                "ticker": tk,
                "price": round(price, 2),
                "pc_ratio_volume": pc_ratio,
                "pc_ratio_oi": pc_oi_ratio,
                "call_volume": call_vol,
                "put_volume": put_vol,
                "call_oi": call_oi,
                "put_oi": put_oi,
                "max_pain": max_pain,
                "max_pain_distance": round((price - max_pain) / price * 100, 1) if max_pain and price else None,
                "sentiment": sentiment,
                "dealer_signal": dealer_signal,
                "expiry": exps[0],
            })
        except Exception:
            continue

    return {"positions": results}


# ═══════════════════════════════════════════════════════════════════════
#  INSIDER TRANSACTIONS
# ═══════════════════════════════════════════════════════════════════════

@router.get("/insiders")
async def insider_transactions():
    """Get insider buying/selling for portfolio holdings."""
    if not yf:
        raise HTTPException(500, "yfinance not available")

    tickers = _get_portfolio_tickers()
    results = []

    for tk in tickers:
        try:
            t = yf.Ticker(tk)
            insiders = t.insider_transactions
            if insiders is None or insiders.empty:
                continue

            for _, row in insiders.head(5).iterrows():
                shares = row.get("Shares") or row.get("shares") or 0
                value = row.get("Value") or row.get("value") or 0
                tx_type = str(row.get("Text") or row.get("Transaction") or row.get("transaction") or "")
                insider = str(row.get("Insider") or row.get("insider") or "")
                date = str(row.get("Start Date") or row.get("startDate") or row.get("date") or "")

                is_buy = "buy" in tx_type.lower() or "purchase" in tx_type.lower() or "acquisition" in tx_type.lower()
                is_sell = "sale" in tx_type.lower() or "sell" in tx_type.lower()

                results.append({
                    "ticker": tk,
                    "insider": insider[:40],
                    "transaction": tx_type[:60],
                    "shares": int(shares) if shares else 0,
                    "value": round(float(value), 0) if value else 0,
                    "date": date[:10],
                    "is_buy": is_buy,
                    "is_sell": is_sell,
                    "signal": "BULLISH" if is_buy else "BEARISH" if is_sell else "NEUTRAL",
                })
        except Exception:
            continue

    # Summarize by ticker
    by_ticker = {}
    for r in results:
        tk = r["ticker"]
        if tk not in by_ticker:
            by_ticker[tk] = {"buys": 0, "sells": 0, "net_value": 0}
        if r["is_buy"]:
            by_ticker[tk]["buys"] += 1
            by_ticker[tk]["net_value"] += r["value"]
        elif r["is_sell"]:
            by_ticker[tk]["sells"] += 1
            by_ticker[tk]["net_value"] -= r["value"]

    summary = []
    for tk, data in by_ticker.items():
        signal = "BULLISH" if data["net_value"] > 0 else "BEARISH" if data["net_value"] < 0 else "NEUTRAL"
        summary.append({"ticker": tk, **data, "signal": signal})

    summary.sort(key=lambda x: x["net_value"], reverse=True)

    return {"transactions": results[:50], "summary": summary}


# ═══════════════════════════════════════════════════════════════════════
#  SHORT INTEREST MONITOR
# ═══════════════════════════════════════════════════════════════════════

@router.get("/short-interest")
async def short_interest():
    """Get short interest data for portfolio holdings."""
    if not yf:
        raise HTTPException(500, "yfinance not available")

    tickers = _get_portfolio_tickers()
    results = []

    for tk in tickers:
        try:
            t = yf.Ticker(tk)
            info = t.info or {}

            short_pct = info.get("shortPercentOfFloat")
            short_ratio = info.get("shortRatio")  # days to cover
            shares_short = info.get("sharesShort")
            shares_float = info.get("floatShares")
            prev_short = info.get("sharesShortPriorMonth")

            if short_pct is None and shares_short is None:
                continue

            # Squeeze potential
            squeeze_signal = None
            if short_pct and short_pct > 0.2:
                squeeze_signal = "HIGH SQUEEZE POTENTIAL"
            elif short_pct and short_pct > 0.1:
                squeeze_signal = "MODERATE"
            elif short_pct:
                squeeze_signal = "LOW"

            # Short interest change
            si_change = None
            if shares_short and prev_short:
                si_change = round((shares_short - prev_short) / prev_short * 100, 1)

            results.append({
                "ticker": tk,
                "short_pct_float": round(short_pct * 100, 1) if short_pct else None,
                "short_ratio": round(short_ratio, 1) if short_ratio else None,
                "shares_short": shares_short,
                "shares_float": shares_float,
                "si_change_pct": si_change,
                "squeeze_signal": squeeze_signal,
                "price": round(info.get("currentPrice") or info.get("regularMarketPrice") or 0, 2),
            })
        except Exception:
            continue

    results.sort(key=lambda x: x.get("short_pct_float") or 0, reverse=True)

    return {"positions": results}
