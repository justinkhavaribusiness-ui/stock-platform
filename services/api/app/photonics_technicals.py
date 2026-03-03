"""
Photonics Command Center — Technical Analysis Module
Adds: RSI, MACD, SMA crossovers, volume analysis, sector heatmap, scanner
"""

from fastapi import APIRouter
from typing import Optional, List
import math
from datetime import datetime, timezone, timedelta

router = APIRouter(prefix="/photonics/technicals", tags=["photonics-technicals"])

TICKERS = ["AAOI","AEHR","ALMU","ANET","AXTI","CIEN","COHR","CRDO","FN","GFS","GLW","LWLG","MRVL","MTSI","NOK","POET","SMTC","TSEM","VIAV"]

def _get_history(ticker: str, period: str = "6mo"):
    try:
        import yfinance as yf
        t = yf.Ticker(ticker)
        df = t.history(period=period)
        if df.empty:
            return None
        return df
    except Exception:
        return None

def _calc_rsi(closes: list, period: int = 14):
    if len(closes) < period + 1:
        return None
    deltas = [closes[i] - closes[i-1] for i in range(1, len(closes))]
    gains = [d if d > 0 else 0 for d in deltas]
    losses = [-d if d < 0 else 0 for d in deltas]
    avg_gain = sum(gains[:period]) / period
    avg_loss = sum(losses[:period]) / period
    for i in range(period, len(gains)):
        avg_gain = (avg_gain * (period - 1) + gains[i]) / period
        avg_loss = (avg_loss * (period - 1) + losses[i]) / period
    if avg_loss == 0:
        return 100.0
    rs = avg_gain / avg_loss
    return round(100 - (100 / (1 + rs)), 1)

def _calc_sma(closes: list, period: int):
    if len(closes) < period:
        return None
    return round(sum(closes[-period:]) / period, 2)

def _calc_ema(closes: list, period: int):
    if len(closes) < period:
        return []
    multiplier = 2 / (period + 1)
    ema = [sum(closes[:period]) / period]
    for price in closes[period:]:
        ema.append((price - ema[-1]) * multiplier + ema[-1])
    return ema

def _calc_macd(closes: list):
    if len(closes) < 35:
        return None, None, None
    ema12 = _calc_ema(closes, 12)
    ema26 = _calc_ema(closes, 26)
    offset = len(ema12) - len(ema26)
    ema12_aligned = ema12[offset:]
    macd_line = [a - b for a, b in zip(ema12_aligned, ema26)]
    if len(macd_line) < 9:
        return round(macd_line[-1], 4) if macd_line else None, None, None
    signal_mult = 2 / 10
    signal = [sum(macd_line[:9]) / 9]
    for val in macd_line[9:]:
        signal.append((val - signal[-1]) * signal_mult + signal[-1])
    histogram = macd_line[-1] - signal[-1]
    return round(macd_line[-1], 4), round(signal[-1], 4), round(histogram, 4)

def _volume_analysis(volumes: list, period: int = 20):
    if len(volumes) < period + 1:
        return None, None, None
    avg_vol = sum(volumes[-period-1:-1]) / period
    latest_vol = volumes[-1]
    ratio = round(latest_vol / avg_vol, 2) if avg_vol > 0 else 0
    return int(latest_vol), int(avg_vol), ratio

def _interpret_rsi(rsi):
    if rsi is None: return "N/A"
    if rsi >= 70: return "OVERBOUGHT"
    if rsi >= 60: return "BULLISH"
    if rsi <= 30: return "OVERSOLD"
    if rsi <= 40: return "BEARISH"
    return "NEUTRAL"

def _interpret_macd(macd, signal, hist):
    if macd is None or signal is None: return "N/A"
    if hist > 0 and macd > 0: return "BULLISH"
    if hist > 0 and macd <= 0: return "RECOVERING"
    if hist < 0 and macd > 0: return "WEAKENING"
    if hist < 0 and macd <= 0: return "BEARISH"
    return "NEUTRAL"

def _interpret_sma(price, sma20, sma50, sma200):
    count = 0
    if sma20 and price > sma20: count += 1
    if sma50 and price > sma50: count += 1
    if sma200 and price > sma200: count += 1
    if count == 3: return "STRONG UPTREND"
    if count == 2: return "UPTREND"
    if count == 1: return "MIXED"
    return "DOWNTREND"

def _composite_score(rsi, macd_hist, sma_trend, vol_ratio):
    score = 50
    if rsi is not None:
        if rsi <= 30: score += 15
        elif rsi <= 40: score += 8
        elif rsi >= 70: score -= 15
        elif rsi >= 60: score -= 5
    if macd_hist is not None:
        if macd_hist > 0.5: score += 15
        elif macd_hist > 0: score += 8
        elif macd_hist < -0.5: score -= 15
        elif macd_hist < 0: score -= 8
    trend_scores = {"STRONG UPTREND": 15, "UPTREND": 8, "MIXED": 0, "DOWNTREND": -15}
    score += trend_scores.get(sma_trend, 0)
    if vol_ratio is not None:
        if vol_ratio > 2.0: score += 5
        elif vol_ratio > 1.3: score += 3
        elif vol_ratio < 0.5: score -= 3
    return max(0, min(100, score))

def _composite_signal(score):
    if score >= 75: return "STRONG BUY"
    if score >= 60: return "BUY"
    if score >= 40: return "NEUTRAL"
    if score >= 25: return "SELL"
    return "STRONG SELL"


@router.get("/scan")
async def scan_all_tickers():
    results = []
    for ticker in TICKERS:
        df = _get_history(ticker, "6mo")
        if df is None or len(df) < 5:
            results.append({"ticker": ticker, "error": "no data"})
            continue
        closes = df["Close"].tolist()
        volumes = df["Volume"].tolist()
        price = round(closes[-1], 2)
        prev_close = round(closes[-2], 2) if len(closes) > 1 else price
        change_pct = round((price - prev_close) / prev_close * 100, 2) if prev_close else 0
        rsi = _calc_rsi(closes)
        macd, signal, hist = _calc_macd(closes)
        sma20 = _calc_sma(closes, 20)
        sma50 = _calc_sma(closes, 50)
        sma200 = _calc_sma(closes, 200)
        latest_vol, avg_vol, vol_ratio = _volume_analysis(volumes)
        sma_trend = _interpret_sma(price, sma20, sma50, sma200)
        composite = _composite_score(rsi, hist, sma_trend, vol_ratio)
        results.append({
            "ticker": ticker, "price": price, "change_pct": change_pct,
            "rsi": rsi, "rsi_signal": _interpret_rsi(rsi),
            "macd": macd, "macd_signal_line": signal, "macd_histogram": hist,
            "macd_signal": _interpret_macd(macd, signal, hist),
            "sma20": sma20, "sma50": sma50, "sma200": sma200, "sma_trend": sma_trend,
            "volume": latest_vol, "avg_volume": avg_vol, "vol_ratio": vol_ratio,
            "composite_score": composite, "composite_signal": _composite_signal(composite),
        })
    results.sort(key=lambda x: x.get("composite_score", 0), reverse=True)
    return {"scan": results, "scanned_at": datetime.now(timezone.utc).isoformat(), "count": len(results)}


@router.get("/detail/{ticker}")
async def get_ticker_detail(ticker: str):
    ticker = ticker.upper()
    df = _get_history(ticker, "1y")
    if df is None or len(df) < 5:
        return {"error": f"No data for {ticker}"}
    closes = df["Close"].tolist()
    volumes = df["Volume"].tolist()
    highs = df["High"].tolist()
    lows = df["Low"].tolist()
    dates = [d.strftime("%Y-%m-%d") for d in df.index]
    price = round(closes[-1], 2)
    rsi = _calc_rsi(closes)
    macd, signal, hist = _calc_macd(closes)
    sma20 = _calc_sma(closes, 20)
    sma50 = _calc_sma(closes, 50)
    sma200 = _calc_sma(closes, 200)
    latest_vol, avg_vol, vol_ratio = _volume_analysis(volumes)
    sma_trend = _interpret_sma(price, sma20, sma50, sma200)
    composite = _composite_score(rsi, hist, sma_trend, vol_ratio)
    one_year_highs = highs[-252:] if len(highs) >= 252 else highs
    one_year_lows = lows[-252:] if len(lows) >= 252 else lows
    high_52w = round(max(one_year_highs), 2)
    low_52w = round(min(one_year_lows), 2)
    pct_from_high = round((price - high_52w) / high_52w * 100, 2)
    recent_high = round(max(highs[-20:]), 2) if len(highs) >= 20 else None
    recent_low = round(min(lows[-20:]), 2) if len(lows) >= 20 else None
    chart_len = min(60, len(closes))
    price_history = [
        {"date": dates[-chart_len + i], "close": round(closes[-chart_len + i], 2), "volume": int(volumes[-chart_len + i])}
        for i in range(chart_len)
    ]
    rsi_history = []
    for i in range(min(30, len(closes) - 14)):
        idx = len(closes) - 30 + i
        if idx >= 15:
            r = _calc_rsi(closes[:idx+1])
            if r is not None:
                rsi_history.append({"date": dates[idx] if idx < len(dates) else "", "rsi": r})
    return {
        "ticker": ticker, "price": price, "high_52w": high_52w, "low_52w": low_52w,
        "pct_from_high": pct_from_high, "recent_high": recent_high, "recent_low": recent_low,
        "rsi": rsi, "rsi_signal": _interpret_rsi(rsi),
        "macd": macd, "macd_signal_line": signal, "macd_histogram": hist,
        "macd_signal": _interpret_macd(macd, signal, hist),
        "sma20": sma20, "sma50": sma50, "sma200": sma200, "sma_trend": sma_trend,
        "volume": latest_vol, "avg_volume": avg_vol, "vol_ratio": vol_ratio,
        "composite_score": composite, "composite_signal": _composite_signal(composite),
        "price_history": price_history, "rsi_history": rsi_history,
    }


@router.get("/heatmap")
async def get_heatmap():
    results = []
    for ticker in TICKERS:
        df = _get_history(ticker, "6mo")
        if df is None or len(df) < 5:
            results.append({"ticker": ticker, "error": "no data"})
            continue
        closes = df["Close"].tolist()
        price = closes[-1]
        def pct_change(days):
            if len(closes) > days:
                old = closes[-days-1]
                return round((price - old) / old * 100, 2) if old else 0
            return None
        results.append({
            "ticker": ticker, "price": round(price, 2),
            "d1": pct_change(1), "w1": pct_change(5), "m1": pct_change(21),
            "m3": pct_change(63), "m6": pct_change(126) if len(closes) > 126 else None,
        })
    return {"heatmap": results, "updated_at": datetime.now(timezone.utc).isoformat()}


@router.get("/correlations")
async def get_correlations():
    import numpy as np
    returns_data = {}
    for ticker in TICKERS:
        df = _get_history(ticker, "3mo")
        if df is None or len(df) < 22:
            continue
        closes = df["Close"].tolist()[-31:]
        rets = [(closes[i] - closes[i-1]) / closes[i-1] for i in range(1, len(closes))]
        returns_data[ticker] = rets
    tickers_with_data = list(returns_data.keys())
    if len(tickers_with_data) < 2:
        return {"error": "insufficient data"}
    min_len = min(len(v) for v in returns_data.values())
    matrix = []
    for t in tickers_with_data:
        matrix.append(returns_data[t][-min_len:])
    np_matrix = np.array(matrix)
    corr = np.corrcoef(np_matrix)
    pairs = []
    for i in range(len(tickers_with_data)):
        for j in range(i+1, len(tickers_with_data)):
            pairs.append({
                "ticker1": tickers_with_data[i], "ticker2": tickers_with_data[j],
                "correlation": round(float(corr[i][j]), 3)
            })
    pairs.sort(key=lambda x: abs(x["correlation"]), reverse=True)
    return {
        "tickers": tickers_with_data, "top_correlated": pairs[:10],
        "least_correlated": pairs[-10:], "period": "30-day returns",
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
