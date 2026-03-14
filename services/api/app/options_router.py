"""
Options Journal Router - Fixed P&L Engine
Drop this file into your services/api/app/ directory and import it in main.py:

    from app.options_router import router as options_router
    app.include_router(options_router, prefix="/api")
"""

from fastapi import APIRouter, UploadFile, File, HTTPException
from typing import Optional
import csv, io, json, os
from collections import defaultdict
from datetime import datetime, date
import yfinance as yf

router = APIRouter()

DATA_FILE = os.path.expanduser("~/dev/stock-platform/.options_trades.json")


# ──────────────────────────────────────────────
#  CSV PARSER  (the fixed core logic)
# ──────────────────────────────────────────────

def parse_options_csv(content: str) -> dict:
    """
    Parse a Fidelity Activity/Orders CSV and return:
      - open_positions  : currently active options contracts
      - closed_trades   : completed round-trip trades with real P&L
      - orphan_closings : closing legs whose opening wasn't in this CSV
      - summary stats
    """
    lines = content.split("\n")
    # Skip Fidelity's blank header rows; find the real CSV header
    header_idx = next(
        (i for i, l in enumerate(lines) if "Run Date" in l), None
    )
    if header_idx is None:
        raise ValueError("Could not find 'Run Date' header row in CSV")

    reader = csv.DictReader(io.StringIO("\n".join(lines[header_idx:])))
    rows = [r for r in reader if r.get("Run Date", "").strip()]

    # Pull only options transactions
    opt_rows = [r for r in rows if "TRANSACTION" in (r.get("Action") or "")]

    # ── Normalise each row ───────────────────────────────────────────────
    def clean(r):
        action = r["Action"]
        return {
            "date":     r["Run Date"],
            "symbol":   r["Symbol"].strip(),
            "desc":     r.get("Description", ""),
            "account":  r["Account"],
            "qty":      abs(float(r.get("Quantity") or 0)),
            "price":    float(r.get("Price ($)") or 0),
            "amount":   float(r.get("Amount ($)") or 0),  # + = credit, – = debit
            "is_sold":  "SOLD"   in action,
            "is_bought":"BOUGHT" in action,
            "is_open":  "OPENING" in action,
            "is_close": "CLOSING" in action,
            # True  → short options (covered call / CSP)  SOLD to OPEN
            # False → long  options (long call / put)     BOUGHT to OPEN
            "short_leg": "SOLD" in action and "OPENING" in action,
            "long_leg":  "BOUGHT" in action and "OPENING" in action,
        }

    trades = [clean(r) for r in opt_rows]

    # ── Helper: parse option symbol e.g. -OSCR270115C20 ─────────────────
    def decode_symbol(sym: str) -> dict:
        """Returns ticker, exp_date, call_put, strike from OCC-style symbol."""
        s = sym.lstrip("-")
        try:
            # Last char is strike digits; before that C or P; before that 6-digit date
            for i in range(len(s) - 1, -1, -1):
                if s[i] in ("C", "P"):
                    cp = s[i]
                    strike = float(s[i + 1:])
                    date_str = s[i - 6: i]
                    ticker = s[: i - 6]
                    exp = datetime.strptime(date_str, "%y%m%d").date()
                    return {
                        "ticker": ticker,
                        "expiration": exp.strftime("%b %d, %Y"),
                        "call_put": "Call" if cp == "C" else "Put",
                        "strike": strike,
                        "expired": exp < date.today(),
                    }
        except Exception:
            pass
        return {"ticker": sym, "expiration": "N/A", "call_put": "?", "strike": 0, "expired": False}

    # ── Group openings and closings by symbol ────────────────────────────
    by_sym: dict = defaultdict(lambda: {"openings": [], "closings": []})
    for t in trades:
        if t["is_open"]:
            by_sym[t["symbol"]]["openings"].append(t)
        elif t["is_close"]:
            by_sym[t["symbol"]]["closings"].append(t)

    open_positions = []
    closed_trades  = []
    orphan_closings = []

    for sym, legs in by_sym.items():
        info = decode_symbol(sym)
        openings = legs["openings"]
        closings = legs["closings"]

        total_open_qty  = sum(t["qty"] for t in openings)
        total_close_qty = sum(t["qty"] for t in closings)
        net_open_qty    = total_open_qty - total_close_qty

        # All credits/debits for this symbol
        open_cash  = sum(t["amount"] for t in openings)   # credits positive
        close_cash = sum(t["amount"] for t in closings)   # credits positive / debits negative
        net_pnl    = round(open_cash + close_cash, 2)

        is_short = any(t["short_leg"] for t in openings)

        # Determine strategy label
        if is_short:
            strategy = "Covered Call" if info["call_put"] == "Call" else "Cash-Secured Put"
        else:
            strategy = f"Long {info['call_put']}"

        if not openings:
            # Only closings in CSV → orphan (position was opened in a prior CSV)
            orphan_closings.append({
                "symbol":     sym,
                "ticker":     info["ticker"],
                "description": f"{info['call_put']} ${info['strike']} exp {info['expiration']}",
                "close_cash": round(close_cash, 2),
                "close_date": closings[0]["date"] if closings else "?",
                "account":    closings[0]["account"] if closings else "?",
                "note":       "Opening leg predates this CSV",
            })
            continue

        if net_open_qty > 0.001:
            # ── OPEN position ──────────────────────────────────────────
            # Average cost/premium across openings
            avg_price = sum(t["price"] * t["qty"] for t in openings) / total_open_qty if total_open_qty else 0

            open_positions.append({
                "symbol":      sym,
                "ticker":      info["ticker"],
                "strike":      info["strike"],
                "expiration":  info["expiration"],
                "call_put":    info["call_put"],
                "strategy":    strategy,
                "contracts":   int(net_open_qty),
                "avg_price":   round(avg_price, 2),
                "premium_received" if is_short else "cost_basis":
                               round(abs(open_cash) if is_short else abs(open_cash), 2),
                "open_date":   openings[-1]["date"],
                "account":     openings[0]["account"],
                "is_short":    is_short,
                "expired":     info["expired"],
            })

        else:
            # ── CLOSED trade ────────────────────────────────────────────
            open_date  = openings[-1]["date"]
            close_date = closings[0]["date"] if closings else "?"

            closed_trades.append({
                "symbol":      sym,
                "ticker":      info["ticker"],
                "strike":      info["strike"],
                "expiration":  info["expiration"],
                "call_put":    info["call_put"],
                "strategy":    strategy,
                "contracts":   int(total_open_qty),
                "pnl":         net_pnl,
                "pnl_pct":     round((net_pnl / abs(open_cash)) * 100, 1) if open_cash else 0,
                "open_date":   open_date,
                "close_date":  close_date,
                "account":     openings[0]["account"],
                "is_short":    is_short,
                "open_credit" if is_short else "open_debit":
                               round(abs(open_cash), 2),
            })

    # Sort
    open_positions.sort(key=lambda x: x["open_date"], reverse=True)
    closed_trades.sort(key=lambda x: x["close_date"], reverse=True)

    total_pnl    = round(sum(t["pnl"] for t in closed_trades), 2)
    winners      = [t for t in closed_trades if t["pnl"] > 0]
    losers       = [t for t in closed_trades if t["pnl"] < 0]
    win_rate     = round(len(winners) / len(closed_trades) * 100, 1) if closed_trades else 0
    avg_win      = round(sum(t["pnl"] for t in winners) / len(winners), 2) if winners else 0
    avg_loss     = round(sum(t["pnl"] for t in losers)  / len(losers),  2) if losers  else 0

    return {
        "open_positions":  open_positions,
        "closed_trades":   closed_trades,
        "orphan_closings": orphan_closings,
        "summary": {
            "total_pnl":      total_pnl,
            "total_trades":   len(closed_trades),
            "win_rate":       win_rate,
            "winners":        len(winners),
            "losers":         len(losers),
            "avg_win":        avg_win,
            "avg_loss":       avg_loss,
            "open_count":     len(open_positions),
        },
    }


# ──────────────────────────────────────────────
#  LIVE PRICE ENRICHMENT
# ──────────────────────────────────────────────

def enrich_with_live_prices(open_positions: list) -> list:
    """Fetch current stock prices and add live P&L to open positions."""
    tickers = list({p["ticker"] for p in open_positions})
    prices  = {}
    if tickers:
        try:
            data = yf.download(tickers, period="1d", progress=False, auto_adjust=True)
            if len(tickers) == 1:
                prices[tickers[0]] = float(data["Close"].iloc[-1])
            else:
                for tk in tickers:
                    try:
                        prices[tk] = float(data["Close"][tk].iloc[-1])
                    except Exception:
                        pass
        except Exception:
            pass

    for pos in open_positions:
        tk  = pos["ticker"]
        px  = prices.get(tk)
        pos["current_stock_price"] = round(px, 2) if px else None

        if px and pos.get("is_short"):
            # Short call: profit if stock stays below strike
            intrinsic     = max(0.0, px - pos["strike"])
            approx_option = intrinsic  # rough estimate (no live option chain here)
            pos["intrinsic_value"]   = round(intrinsic * pos["contracts"] * 100, 2)
            pos["itm"]               = px > pos["strike"]
            pos["distance_to_strike"] = round(((pos["strike"] - px) / px) * 100, 1)
        elif px and not pos.get("is_short"):
            pos["itm"]               = (px > pos["strike"]) if pos["call_put"] == "Call" else (px < pos["strike"])
            pos["distance_to_strike"] = round(((px - pos["strike"]) / pos["strike"]) * 100, 1)

    return open_positions


# ──────────────────────────────────────────────
#  ENDPOINTS
# ──────────────────────────────────────────────

@router.post("/options-journal/upload")
async def upload_options_csv(file: UploadFile = File(...)):
    """Upload a Fidelity CSV. Parses, deduplicates, and saves."""
    raw = (await file.read()).decode("utf-8-sig")
    try:
        result = parse_options_csv(raw)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

    # Persist parsed data
    os.makedirs(os.path.dirname(DATA_FILE), exist_ok=True)
    with open(DATA_FILE, "w") as f:
        json.dump(result, f, indent=2)

    return {"status": "ok", "summary": result["summary"]}


@router.get("/options-journal")
def get_options_journal(live: bool = True):
    """Return the full options journal with optional live price enrichment."""
    if not os.path.exists(DATA_FILE):
        return {
            "open_positions":  [],
            "closed_trades":   [],
            "orphan_closings": [],
            "summary": {
                "total_pnl": 0, "total_trades": 0, "win_rate": 0,
                "winners": 0, "losers": 0, "avg_win": 0, "avg_loss": 0, "open_count": 0,
            },
        }

    with open(DATA_FILE) as f:
        data = json.load(f)

    if live and data.get("open_positions"):
        data["open_positions"] = enrich_with_live_prices(data["open_positions"])

    return data


@router.get("/options-journal/summary")
def get_options_summary():
    if not os.path.exists(DATA_FILE):
        return {}
    with open(DATA_FILE) as f:
        return json.load(f).get("summary", {})
