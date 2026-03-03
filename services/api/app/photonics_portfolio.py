"""
Photonics Command Center — Portfolio Overlay Module
Maps real positions into photonics universe with P&L, target gap, allocation analysis.
Supports manual entry and Fidelity CSV import.
"""

from fastapi import APIRouter, UploadFile, File
from pydantic import BaseModel
from typing import Optional, List, Dict
import json, uuid, redis, csv, io
from datetime import datetime, timezone

router = APIRouter(prefix="/photonics/portfolio", tags=["photonics-portfolio"])

rdb = redis.Redis(host="127.0.0.1", port=6379, db=0, decode_responses=True)

POSITIONS_KEY = "photonics:portfolio:positions"
WATCHLIST_KEY = "photonics:watchlist"

PHOTONICS_UNIVERSE = ["AAOI","AEHR","ALMU","ANET","AXTI","CIEN","COHR","CRDO","FN","GFS","GLW","LWLG","MRVL","MTSI","NOK","POET","SMTC","TSEM","VIAV"]

# ── Models ──────────────────────────────────────────────────

class Position(BaseModel):
    ticker: str
    shares: float
    avg_cost: float
    account: Optional[str] = "Individual"  # Individual, Roth IRA, etc.
    notes: Optional[str] = ""

class PositionUpdate(BaseModel):
    shares: Optional[float] = None
    avg_cost: Optional[float] = None
    account: Optional[str] = None
    notes: Optional[str] = None


def _get_live_price(ticker: str) -> Optional[float]:
    try:
        import yfinance as yf
        t = yf.Ticker(ticker)
        data = t.fast_info
        return round(data.get("lastPrice", 0) or data.get("last_price", 0), 2)
    except Exception:
        return None


def _get_watchlist_targets() -> Dict[str, dict]:
    """Get watchlist data including buy targets."""
    raw = rdb.get(WATCHLIST_KEY)
    if not raw:
        return {}
    wl = json.loads(raw)
    return {item["ticker"]: item for item in wl}


# ── Endpoints ───────────────────────────────────────────────

@router.get("/positions")
async def get_positions():
    """Get all portfolio positions with live P&L and target gap analysis."""
    raw = rdb.get(POSITIONS_KEY)
    positions = json.loads(raw) if raw else []
    targets = _get_watchlist_targets()

    enriched = []
    total_value = 0
    total_cost = 0
    photonics_value = 0
    photonics_cost = 0

    for pos in positions:
        ticker = pos["ticker"]
        shares = pos["shares"]
        avg_cost = pos["avg_cost"]
        cost_basis = round(shares * avg_cost, 2)

        price = _get_live_price(ticker)
        if price is None:
            price = avg_cost  # fallback

        market_value = round(shares * price, 2)
        pnl = round(market_value - cost_basis, 2)
        pnl_pct = round((pnl / cost_basis) * 100, 2) if cost_basis > 0 else 0

        total_value += market_value
        total_cost += cost_basis

        # Check if in photonics universe
        in_universe = ticker.upper() in PHOTONICS_UNIVERSE
        if in_universe:
            photonics_value += market_value
            photonics_cost += cost_basis

        # Target gap analysis
        target_info = targets.get(ticker.upper(), {})
        buy_target = target_info.get("target")
        target_gap = None
        target_gap_pct = None
        position_vs_target = None
        if buy_target and price:
            target_gap = round(buy_target - price, 2)
            target_gap_pct = round((target_gap / price) * 100, 2)
            if price < buy_target * 0.9:
                position_vs_target = "BELOW TARGET — BUY ZONE"
            elif price < buy_target:
                position_vs_target = "NEAR TARGET"
            elif price < buy_target * 1.2:
                position_vs_target = "ABOVE TARGET — HOLD"
            else:
                position_vs_target = "EXTENDED — CONSIDER TRIM"

        enriched.append({
            **pos,
            "price": price,
            "market_value": market_value,
            "cost_basis": cost_basis,
            "pnl": pnl,
            "pnl_pct": pnl_pct,
            "in_photonics_universe": in_universe,
            "buy_target": buy_target,
            "target_gap": target_gap,
            "target_gap_pct": target_gap_pct,
            "position_vs_target": position_vs_target,
            "supply_chain_layer": target_info.get("step"),
            "notes_watchlist": target_info.get("notes", ""),
        })

    # Sort: photonics first, then by market value
    enriched.sort(key=lambda x: (not x["in_photonics_universe"], -x["market_value"]))

    # Allocation breakdown
    by_account = {}
    for pos in enriched:
        acct = pos.get("account", "Individual")
        if acct not in by_account:
            by_account[acct] = {"value": 0, "cost": 0, "pnl": 0, "count": 0}
        by_account[acct]["value"] += pos["market_value"]
        by_account[acct]["cost"] += pos["cost_basis"]
        by_account[acct]["pnl"] += pos["pnl"]
        by_account[acct]["count"] += 1

    total_pnl = round(total_value - total_cost, 2)
    total_pnl_pct = round((total_pnl / total_cost) * 100, 2) if total_cost > 0 else 0
    photonics_pct = round((photonics_value / total_value) * 100, 1) if total_value > 0 else 0

    return {
        "positions": enriched,
        "summary": {
            "total_value": round(total_value, 2),
            "total_cost": round(total_cost, 2),
            "total_pnl": total_pnl,
            "total_pnl_pct": total_pnl_pct,
            "position_count": len(positions),
            "photonics_value": round(photonics_value, 2),
            "photonics_pct": photonics_pct,
            "non_photonics_value": round(total_value - photonics_value, 2),
        },
        "by_account": by_account,
        "updated_at": datetime.now(timezone.utc).isoformat(),
    }


@router.post("/positions")
async def add_position(pos: Position):
    """Add or update a position."""
    raw = rdb.get(POSITIONS_KEY)
    positions = json.loads(raw) if raw else []

    # Check if position exists (same ticker + account)
    for i, existing in enumerate(positions):
        if existing["ticker"].upper() == pos.ticker.upper() and existing.get("account", "Individual") == pos.account:
            # Update existing
            positions[i] = {
                "ticker": pos.ticker.upper(),
                "shares": pos.shares,
                "avg_cost": pos.avg_cost,
                "account": pos.account or "Individual",
                "notes": pos.notes or "",
                "updated_at": datetime.now(timezone.utc).isoformat(),
            }
            rdb.set(POSITIONS_KEY, json.dumps(positions))
            return {"status": "updated", "position": positions[i]}

    # New position
    new_pos = {
        "ticker": pos.ticker.upper(),
        "shares": pos.shares,
        "avg_cost": pos.avg_cost,
        "account": pos.account or "Individual",
        "notes": pos.notes or "",
        "added_at": datetime.now(timezone.utc).isoformat(),
    }
    positions.append(new_pos)
    rdb.set(POSITIONS_KEY, json.dumps(positions))
    return {"status": "added", "position": new_pos, "total_positions": len(positions)}


@router.delete("/positions/{ticker}")
async def delete_position(ticker: str, account: str = "Individual"):
    """Remove a position."""
    raw = rdb.get(POSITIONS_KEY)
    positions = json.loads(raw) if raw else []
    before = len(positions)
    positions = [p for p in positions if not (p["ticker"].upper() == ticker.upper() and p.get("account", "Individual") == account)]
    rdb.set(POSITIONS_KEY, json.dumps(positions))
    return {"status": "deleted" if len(positions) < before else "not_found", "remaining": len(positions)}


@router.post("/import/fidelity")
async def import_fidelity_csv(file: UploadFile = File(...)):
    """Import positions from Fidelity CSV export."""
    content = await file.read()
    text = content.decode("utf-8-sig")

    positions = []
    reader = csv.DictReader(io.StringIO(text))
    for row in reader:
        ticker = row.get("Symbol", "").strip().replace("**", "")
        if not ticker or ticker in ["Pending Activity", "Cash", ""]:
            continue
        try:
            shares = float(row.get("Quantity", "0").replace(",", "").replace("$", ""))
            avg_cost = float(row.get("Cost Basis Per Share", row.get("Average Cost Basis", "0")).replace(",", "").replace("$", "").replace("--", "0"))
            account = row.get("Account Name", row.get("Account Number", "Individual"))
        except (ValueError, AttributeError):
            continue

        if shares > 0:
            positions.append({
                "ticker": ticker.upper(),
                "shares": shares,
                "avg_cost": round(avg_cost, 4),
                "account": account.strip() if account else "Individual",
                "notes": f"Imported from Fidelity {datetime.now().strftime('%Y-%m-%d')}",
                "added_at": datetime.now(timezone.utc).isoformat(),
            })

    if positions:
        rdb.set(POSITIONS_KEY, json.dumps(positions))

    return {
        "status": "imported",
        "positions_loaded": len(positions),
        "tickers": [p["ticker"] for p in positions],
        "photonics_overlap": [p["ticker"] for p in positions if p["ticker"] in PHOTONICS_UNIVERSE],
    }


@router.post("/import/manual")
async def import_manual_batch(positions: List[Position]):
    """Batch import positions."""
    raw = rdb.get(POSITIONS_KEY)
    existing = json.loads(raw) if raw else []

    added = 0
    updated = 0
    for pos in positions:
        found = False
        for i, ex in enumerate(existing):
            if ex["ticker"].upper() == pos.ticker.upper() and ex.get("account", "Individual") == (pos.account or "Individual"):
                existing[i] = {
                    "ticker": pos.ticker.upper(), "shares": pos.shares, "avg_cost": pos.avg_cost,
                    "account": pos.account or "Individual", "notes": pos.notes or "",
                    "updated_at": datetime.now(timezone.utc).isoformat(),
                }
                updated += 1
                found = True
                break
        if not found:
            existing.append({
                "ticker": pos.ticker.upper(), "shares": pos.shares, "avg_cost": pos.avg_cost,
                "account": pos.account or "Individual", "notes": pos.notes or "",
                "added_at": datetime.now(timezone.utc).isoformat(),
            })
            added += 1

    rdb.set(POSITIONS_KEY, json.dumps(existing))
    return {"status": "imported", "added": added, "updated": updated, "total": len(existing)}


@router.get("/gaps")
async def get_target_gaps():
    """Analyze gaps between current prices and buy targets for watchlist not yet owned."""
    raw = rdb.get(POSITIONS_KEY)
    positions = json.loads(raw) if raw else []
    owned_tickers = {p["ticker"].upper() for p in positions}
    targets = _get_watchlist_targets()

    opportunities = []
    for ticker in PHOTONICS_UNIVERSE:
        target_info = targets.get(ticker, {})
        buy_target = target_info.get("target")
        if not buy_target:
            continue

        price = _get_live_price(ticker)
        if price is None:
            continue

        gap_pct = round((buy_target - price) / price * 100, 2)
        owned = ticker in owned_tickers

        opportunities.append({
            "ticker": ticker,
            "price": price,
            "buy_target": buy_target,
            "gap_pct": gap_pct,
            "gap_dollars": round(buy_target - price, 2),
            "owned": owned,
            "upside_to_target": gap_pct if gap_pct > 0 else 0,
            "notes": target_info.get("notes", ""),
            "zone": "BUY ZONE" if price < buy_target * 0.9 else "NEAR TARGET" if price < buy_target else "ABOVE TARGET" if price < buy_target * 1.3 else "EXTENDED",
        })

    opportunities.sort(key=lambda x: x["gap_pct"], reverse=True)

    return {
        "opportunities": opportunities,
        "best_opportunities": [o for o in opportunities if not o["owned"] and o["gap_pct"] > 5],
        "existing_with_upside": [o for o in opportunities if o["owned"] and o["gap_pct"] > 5],
        "updated_at": datetime.now(timezone.utc).isoformat(),
    }
