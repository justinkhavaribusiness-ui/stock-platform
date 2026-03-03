from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional
import json, redis, math
from datetime import datetime, timezone

router = APIRouter(prefix="/photonics/advanced", tags=["photonics-advanced"])
rdb = redis.Redis(host="127.0.0.1", port=6379, db=0, decode_responses=True)
TICKERS = ["AAOI","AEHR","ALMU","ANET","AXTI","CIEN","COHR","CRDO","FN","GFS","GLW","LWLG","MRVL","MTSI","NOK","POET","SMTC","TSEM","VIAV"]
ALERTS_KEY = "photonics:alerts"

def _get_hist(ticker, period="6mo"):
    try:
        import yfinance as yf
        return yf.Ticker(ticker).history(period=period)
    except:
        return None

@router.get("/relative-strength")
async def relative_strength():
    import yfinance as yf
    benchmarks = {"SPY": "S&P 500", "SOXX": "Semiconductors (SOX)", "QQQ": "Nasdaq 100"}
    periods = {"1W": 5, "1M": 21, "3M": 63, "6M": 126}
    bench_returns = {}
    for sym, name in benchmarks.items():
        df = _get_hist(sym, "6mo")
        if df is None or len(df) < 5: continue
        closes = df["Close"].tolist()
        rets = {}
        for label, days in periods.items():
            if len(closes) > days:
                rets[label] = round((closes[-1] - closes[-days-1]) / closes[-days-1] * 100, 2)
        bench_returns[sym] = {"name": name, "price": round(closes[-1], 2), "returns": rets}
    ticker_returns = []
    for ticker in TICKERS:
        df = _get_hist(ticker, "6mo")
        if df is None or len(df) < 5: continue
        closes = df["Close"].tolist()
        rets = {}
        for label, days in periods.items():
            if len(closes) > days:
                rets[label] = round((closes[-1] - closes[-days-1]) / closes[-days-1] * 100, 2)
        spy_rets = bench_returns.get("SPY", {}).get("returns", {})
        rs_vs_spy = {}
        for label in periods:
            if label in rets and label in spy_rets and spy_rets[label] != 0:
                rs_vs_spy[label] = round(rets[label] - spy_rets[label], 2)
        ticker_returns.append({"ticker": ticker, "price": round(closes[-1], 2), "returns": rets, "rs_vs_spy": rs_vs_spy})
    sector_avg = {}
    for label in periods:
        vals = [t["returns"].get(label) for t in ticker_returns if t["returns"].get(label) is not None]
        if vals: sector_avg[label] = round(sum(vals) / len(vals), 2)
    ticker_returns.sort(key=lambda x: x.get("rs_vs_spy", {}).get("1M", 0), reverse=True)
    return {"benchmarks": bench_returns, "sector_average": sector_avg, "tickers": ticker_returns, "leaders": ticker_returns[:5], "laggards": ticker_returns[-5:], "updated_at": datetime.now(timezone.utc).isoformat()}

@router.get("/risk")
async def risk_analytics():
    import numpy as np
    spy_df = _get_hist("SPY", "1y")
    if spy_df is None or len(spy_df) < 60: return {"error": "Could not fetch SPY data"}
    spy_closes = spy_df["Close"].tolist()
    spy_returns = [(spy_closes[i] - spy_closes[i-1]) / spy_closes[i-1] for i in range(1, len(spy_closes))]
    results = []
    for ticker in TICKERS:
        df = _get_hist(ticker, "1y")
        if df is None or len(df) < 60: continue
        closes = df["Close"].tolist()
        highs = df["High"].tolist()
        returns = [(closes[i] - closes[i-1]) / closes[i-1] for i in range(1, len(closes))]
        min_len = min(len(returns), len(spy_returns))
        aligned_returns = returns[-min_len:]
        aligned_spy = spy_returns[-min_len:]
        cov = np.cov(aligned_returns, aligned_spy)
        beta = round(float(cov[0][1] / cov[1][1]), 2) if cov[1][1] != 0 else 1.0
        vol_daily = np.std(returns[-60:])
        vol_annual = round(float(vol_daily * math.sqrt(252) * 100), 1)
        recent = closes[-126:] if len(closes) >= 126 else closes
        peak = recent[0]
        max_dd = 0
        for p in recent:
            if p > peak: peak = p
            dd = (p - peak) / peak
            if dd < max_dd: max_dd = dd
        rf_daily = 0.045 / 252
        excess_returns = [r - rf_daily for r in returns[-60:]]
        sharpe = round(float(np.mean(excess_returns) / np.std(excess_returns) * math.sqrt(252)), 2) if np.std(excess_returns) > 0 else 0
        high_52w = max(highs[-252:]) if len(highs) >= 252 else max(highs)
        results.append({"ticker": ticker, "price": round(closes[-1], 2), "beta": beta, "volatility": vol_annual, "max_drawdown": round(max_dd * 100, 1), "sharpe_ratio": sharpe, "pct_from_52w_high": round((closes[-1] - high_52w) / high_52w * 100, 1), "risk_tier": "HIGH" if vol_annual > 60 else "MEDIUM" if vol_annual > 35 else "LOW"})
    results.sort(key=lambda x: x.get("sharpe_ratio", 0), reverse=True)
    betas = [r["beta"] for r in results]; vols = [r["volatility"] for r in results]; sharpes = [r["sharpe_ratio"] for r in results]
    return {"tickers": results, "sector_stats": {"avg_beta": round(sum(betas)/len(betas), 2) if betas else 0, "avg_volatility": round(sum(vols)/len(vols), 1) if vols else 0, "avg_sharpe": round(sum(sharpes)/len(sharpes), 2) if sharpes else 0, "high_risk_count": len([r for r in results if r["risk_tier"]=="HIGH"]), "medium_risk_count": len([r for r in results if r["risk_tier"]=="MEDIUM"]), "low_risk_count": len([r for r in results if r["risk_tier"]=="LOW"])}, "position_sizing": {"note": "Kelly-inspired sizing", "conservative": [{"ticker": r["ticker"], "max_allocation_pct": round(min(15, max(2, 100/r["volatility"]*r.get("sharpe_ratio",0.5))), 1)} for r in results if r["sharpe_ratio"]>0]}, "updated_at": datetime.now(timezone.utc).isoformat()}

@router.get("/news")
async def news_feed(ticker: Optional[str] = None):
    import yfinance as yf
    tickers_to_scan = [ticker.upper()] if ticker else TICKERS[:10]
    all_news = []
    for t in tickers_to_scan:
        try:
            stock = yf.Ticker(t)
            news = stock.news
            if not news: continue
            for item in news[:3]:
                content = item.get("content", {})
                all_news.append({"ticker": t, "title": content.get("title", item.get("title", "No title")), "publisher": content.get("provider", {}).get("displayName", "Unknown"), "link": content.get("canonicalUrl", {}).get("url", item.get("link", "")), "published": content.get("pubDate", ""), "type": item.get("type", "STORY")})
        except: continue
    all_news.sort(key=lambda x: x.get("published", ""), reverse=True)
    return {"news": all_news[:30], "ticker_filter": ticker, "count": len(all_news), "updated_at": datetime.now(timezone.utc).isoformat()}

class Alert(BaseModel):
    ticker: str
    alert_type: str
    threshold: Optional[float] = None
    notes: Optional[str] = ""

@router.get("/alerts")
async def get_alerts():
    raw = rdb.get(ALERTS_KEY)
    alerts = json.loads(raw) if raw else []
    for alert in alerts:
        try:
            import yfinance as yf
            stock = yf.Ticker(alert["ticker"])
            price = round(stock.fast_info.get("lastPrice", 0) or stock.fast_info.get("last_price", 0), 2)
            alert["current_price"] = price
            if alert["alert_type"] == "price_above" and alert.get("threshold"): alert["triggered"] = price >= alert["threshold"]
            elif alert["alert_type"] == "price_below" and alert.get("threshold"): alert["triggered"] = price <= alert["threshold"]
            else: alert["triggered"] = False
        except: alert["triggered"] = False; alert["current_price"] = None
    return {"alerts": alerts, "count": len(alerts)}

@router.post("/alerts")
async def add_alert(alert: Alert):
    raw = rdb.get(ALERTS_KEY)
    alerts = json.loads(raw) if raw else []
    new_alert = {"id": len(alerts)+1, "ticker": alert.ticker.upper(), "alert_type": alert.alert_type, "threshold": alert.threshold, "notes": alert.notes or "", "created_at": datetime.now(timezone.utc).isoformat(), "triggered": False}
    alerts.append(new_alert)
    rdb.set(ALERTS_KEY, json.dumps(alerts))
    return {"status": "created", "alert": new_alert}

@router.delete("/alerts/{alert_id}")
async def delete_alert(alert_id: int):
    raw = rdb.get(ALERTS_KEY)
    alerts = json.loads(raw) if raw else []
    alerts = [a for a in alerts if a.get("id") != alert_id]
    rdb.set(ALERTS_KEY, json.dumps(alerts))
    return {"status": "deleted", "remaining": len(alerts)}
