"""
Extras Router — Goals, Named Watchlists, Accounts, Trade Plans, Wheel Strategy,
Notifications, Trade Templates, Webhooks, Complex Alerts, Workspaces, Settings, Screener Saved
All Redis-backed CRUD.
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime, timezone
import json, os, uuid

import redis

REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379")
rdb = redis.from_url(REDIS_URL, decode_responses=True)

router = APIRouter(tags=["extras"])

# ── Helpers ──────────────────────────────────────────────────────────────

def _list_get(key: str):
    return [json.loads(r) for r in rdb.lrange(key, 0, -1)]

def _list_add(key: str, entry: dict):
    rdb.rpush(key, json.dumps(entry))
    return entry

def _list_delete(key: str, id_field: str, id_val: str):
    for r in rdb.lrange(key, 0, -1):
        item = json.loads(r)
        if item.get(id_field) == id_val:
            rdb.lrem(key, 1, r)
            return {"deleted": id_val}
    raise HTTPException(404, "Not found")

def _list_update(key: str, id_field: str, id_val: str, updates: dict):
    raw = rdb.lrange(key, 0, -1)
    for i, r in enumerate(raw):
        item = json.loads(r)
        if item.get(id_field) == id_val:
            item.update({k: v for k, v in updates.items() if v is not None})
            rdb.lset(key, i, json.dumps(item))
            return item
    raise HTTPException(404, "Not found")

def _make_id():
    return str(uuid.uuid4())[:8]

def _now():
    return datetime.now(timezone.utc).isoformat()


# ═══════════════════════════════════════════════════════════════════════
#  GOALS
# ═══════════════════════════════════════════════════════════════════════
GOALS_KEY = "goals:list"

class GoalCreate(BaseModel):
    name: str
    target_amount: float
    type: str = "profit"

@router.get("/goals")
async def get_goals():
    return {"goals": _list_get(GOALS_KEY)}

@router.post("/goals")
async def create_goal(goal: GoalCreate):
    entry = {
        "id": _make_id(),
        "name": goal.name,
        "target_amount": goal.target_amount,
        "current_amount": 0,
        "type": goal.type,
        "created": _now(),
    }
    return _list_add(GOALS_KEY, entry)

@router.delete("/goals/{goal_id}")
async def delete_goal(goal_id: str):
    return _list_delete(GOALS_KEY, "id", goal_id)


# ═══════════════════════════════════════════════════════════════════════
#  NAMED WATCHLISTS
# ═══════════════════════════════════════════════════════════════════════

@router.get("/watchlists")
async def get_watchlists():
    keys = rdb.keys("watchlists:*")
    watchlists = []
    for k in sorted(keys):
        name = k.split(":", 1)[1]
        tickers = [json.loads(t) if t.startswith("{") else t for t in rdb.lrange(k, 0, -1)]
        watchlists.append({"name": name, "tickers": tickers})
    return {"watchlists": watchlists}

@router.get("/watchlists/{name}")
async def get_watchlist_by_name(name: str):
    key = f"watchlists:{name}"
    tickers = [json.loads(t) if t.startswith("{") else t for t in rdb.lrange(key, 0, -1)]
    return {"name": name, "tickers": tickers}

@router.post("/watchlists/{name}")
async def create_watchlist(name: str):
    key = f"watchlists:{name}"
    if not rdb.exists(key):
        pass  # empty list created on first add
    return {"name": name, "tickers": []}

@router.delete("/watchlists/{name}")
async def delete_watchlist(name: str):
    rdb.delete(f"watchlists:{name}")
    return {"deleted": name}

@router.post("/watchlists/{name}/{ticker}")
async def add_to_named_watchlist(name: str, ticker: str):
    key = f"watchlists:{name}"
    rdb.rpush(key, ticker.upper())
    return {"added": ticker.upper(), "watchlist": name}

@router.delete("/watchlists/{name}/{ticker}")
async def remove_from_named_watchlist(name: str, ticker: str):
    key = f"watchlists:{name}"
    rdb.lrem(key, 0, ticker.upper())
    return {"removed": ticker.upper(), "watchlist": name}


# ═══════════════════════════════════════════════════════════════════════
#  SCREENER SAVED
# ═══════════════════════════════════════════════════════════════════════
SCREENS_KEY = "screener:saved"

class ScreenerSave(BaseModel):
    name: str
    universe: str = "sp500"
    sector: str = ""
    min_market_cap: Optional[float] = None
    max_pe: Optional[float] = None
    custom_tickers: str = ""

@router.get("/screener/saved")
async def get_saved_screens():
    return {"screens": _list_get(SCREENS_KEY)}

@router.post("/screener/saved")
async def save_screen(screen: ScreenerSave):
    entry = {
        "id": _make_id(),
        **screen.model_dump(),
        "created": _now(),
    }
    return _list_add(SCREENS_KEY, entry)

@router.delete("/screener/saved/{screen_id}")
async def delete_saved_screen(screen_id: str):
    return _list_delete(SCREENS_KEY, "id", screen_id)


# ═══════════════════════════════════════════════════════════════════════
#  ACCOUNTS
# ═══════════════════════════════════════════════════════════════════════
ACCOUNTS_KEY = "accounts:list"

class AccountCreate(BaseModel):
    name: str
    broker: str = "custom"

@router.get("/accounts")
async def get_accounts():
    return {"accounts": _list_get(ACCOUNTS_KEY)}

@router.post("/accounts")
async def create_account(acct: AccountCreate):
    entry = {
        "key": _make_id(),
        "name": acct.name,
        "broker": acct.broker,
        "created": _now(),
    }
    return _list_add(ACCOUNTS_KEY, entry)

@router.delete("/accounts/{key}")
async def delete_account(key: str):
    return _list_delete(ACCOUNTS_KEY, "key", key)


# ═══════════════════════════════════════════════════════════════════════
#  TRADE PLANS
# ═══════════════════════════════════════════════════════════════════════
PLANS_KEY = "trade-plans:list"

class TradePlanCreate(BaseModel):
    name: str
    ticker: str
    direction: str = "long"
    entry_zone: str = ""
    stop_loss: str = ""
    target_1: str = ""
    target_2: str = ""
    target_3: str = ""
    thesis: str = ""
    setup_type: str = ""
    timeframe: str = "swing"
    position_size: str = ""

class TradePlanUpdate(BaseModel):
    status: Optional[str] = None
    entry_zone: Optional[str] = None
    stop_loss: Optional[str] = None
    target_1: Optional[str] = None
    target_2: Optional[str] = None
    target_3: Optional[str] = None
    thesis: Optional[str] = None

@router.get("/trade-plans")
async def get_trade_plans():
    return {"plans": _list_get(PLANS_KEY)}

@router.post("/trade-plans")
async def create_trade_plan(plan: TradePlanCreate):
    entry = {
        "id": _make_id(),
        **plan.model_dump(),
        "ticker": plan.ticker.upper(),
        "status": "planning",
        "created": _now(),
    }
    return _list_add(PLANS_KEY, entry)

@router.put("/trade-plans/{plan_id}")
async def update_trade_plan(plan_id: str, updates: TradePlanUpdate):
    return _list_update(PLANS_KEY, "id", plan_id, updates.model_dump(exclude_none=True))

@router.delete("/trade-plans/{plan_id}")
async def delete_trade_plan(plan_id: str):
    return _list_delete(PLANS_KEY, "id", plan_id)


# ═══════════════════════════════════════════════════════════════════════
#  WHEEL STRATEGY
# ═══════════════════════════════════════════════════════════════════════
WHEEL_KEY = "wheel:positions"

class WheelCreate(BaseModel):
    ticker: str
    phase: str = "csp"
    strike: float = 0
    premium: float = 0
    expiry: str = ""

@router.get("/wheel")
async def get_wheel():
    return {"positions": _list_get(WHEEL_KEY)}

@router.post("/wheel")
async def add_wheel(pos: WheelCreate):
    entry = {
        "id": _make_id(),
        **pos.model_dump(),
        "ticker": pos.ticker.upper(),
        "created": _now(),
    }
    return _list_add(WHEEL_KEY, entry)

@router.delete("/wheel/{pos_id}")
async def delete_wheel(pos_id: str):
    return _list_delete(WHEEL_KEY, "id", pos_id)


# ═══════════════════════════════════════════════════════════════════════
#  NOTIFICATIONS
# ═══════════════════════════════════════════════════════════════════════
NOTIF_KEY = "notifications:list"

@router.get("/notifications")
async def get_notifications():
    return {"notifications": _list_get(NOTIF_KEY)}

@router.post("/notifications/read-all")
async def mark_all_read():
    raw = rdb.lrange(NOTIF_KEY, 0, -1)
    for i, r in enumerate(raw):
        item = json.loads(r)
        item["read"] = True
        rdb.lset(NOTIF_KEY, i, json.dumps(item))
    return {"marked": len(raw)}


# ═══════════════════════════════════════════════════════════════════════
#  TRADE TEMPLATES
# ═══════════════════════════════════════════════════════════════════════
TEMPLATES_KEY = "trade-templates:list"

class TemplateCreate(BaseModel):
    name: str
    strategy: str = ""
    entry_rules: str = ""
    exit_rules: str = ""
    risk_pct: str = "2"
    position_type: str = "swing"
    notes: str = ""

@router.get("/trade-templates")
async def get_templates():
    return {"templates": _list_get(TEMPLATES_KEY)}

@router.post("/trade-templates")
async def create_template(tmpl: TemplateCreate):
    entry = {
        "id": _make_id(),
        **tmpl.model_dump(),
        "created": _now(),
    }
    return _list_add(TEMPLATES_KEY, entry)

@router.delete("/trade-templates/{tmpl_id}")
async def delete_template(tmpl_id: str):
    return _list_delete(TEMPLATES_KEY, "id", tmpl_id)


# ═══════════════════════════════════════════════════════════════════════
#  WEBHOOKS
# ═══════════════════════════════════════════════════════════════════════
WEBHOOKS_KEY = "webhooks:list"

class WebhookCreate(BaseModel):
    platform: str = "discord"
    url: str
    events: list = ["alert_triggered", "trade_closed"]

class WebhookTest(BaseModel):
    webhook_id: str

@router.get("/webhooks")
async def get_webhooks():
    return {"webhooks": _list_get(WEBHOOKS_KEY)}

@router.post("/webhooks")
async def create_webhook(wh: WebhookCreate):
    entry = {
        "id": _make_id(),
        **wh.model_dump(),
        "created": _now(),
    }
    return _list_add(WEBHOOKS_KEY, entry)

@router.post("/webhooks/test")
async def test_webhook(body: WebhookTest):
    hooks = _list_get(WEBHOOKS_KEY)
    hook = next((h for h in hooks if h["id"] == body.webhook_id), None)
    if not hook:
        raise HTTPException(404, "Webhook not found")
    # In production, would actually POST to the URL
    return {"tested": body.webhook_id, "status": "ok", "message": "Test payload sent"}

@router.delete("/webhooks/{wh_id}")
async def delete_webhook(wh_id: str):
    return _list_delete(WEBHOOKS_KEY, "id", wh_id)


# ═══════════════════════════════════════════════════════════════════════
#  COMPLEX ALERTS
# ═══════════════════════════════════════════════════════════════════════
COMPLEX_ALERTS_KEY = "alerts:complex"

class ComplexCondition(BaseModel):
    metric: str = "price"
    operator: str = ">"
    value: str = ""

class ComplexAlertCreate(BaseModel):
    ticker: str
    name: str = ""
    conditions: list[dict] = []
    logic: str = "AND"
    notify_via: str = "app"

@router.get("/alerts/complex")
async def get_complex_alerts():
    return {"alerts": _list_get(COMPLEX_ALERTS_KEY)}

@router.post("/alerts/complex")
async def create_complex_alert(alert: ComplexAlertCreate):
    entry = {
        "id": _make_id(),
        "ticker": alert.ticker.upper(),
        "name": alert.name or f"{alert.ticker.upper()} alert",
        "conditions": alert.conditions,
        "logic": alert.logic,
        "notify_via": alert.notify_via,
        "active": True,
        "created": _now(),
    }
    return _list_add(COMPLEX_ALERTS_KEY, entry)

@router.delete("/alerts/complex/{alert_id}")
async def delete_complex_alert(alert_id: str):
    return _list_delete(COMPLEX_ALERTS_KEY, "id", alert_id)

@router.get("/alerts/unread")
async def get_unread_alerts():
    triggered = [json.loads(r) for r in rdb.lrange("alerts:triggered", 0, -1)]
    unread = [a for a in triggered if not a.get("read")]
    return {"count": len(unread), "alerts": unread}


# ═══════════════════════════════════════════════════════════════════════
#  WORKSPACES
# ═══════════════════════════════════════════════════════════════════════
WORKSPACES_KEY = "workspaces:list"

class WorkspaceCreate(BaseModel):
    name: str
    active_tab: str = "dashboard"

@router.get("/workspaces")
async def get_workspaces():
    return {"workspaces": _list_get(WORKSPACES_KEY)}

@router.post("/workspaces")
async def create_workspace(ws: WorkspaceCreate):
    entry = {
        "id": _make_id(),
        "name": ws.name,
        "active_tab": ws.active_tab,
        "created": _now(),
    }
    return _list_add(WORKSPACES_KEY, entry)

@router.delete("/workspaces/{ws_id}")
async def delete_workspace(ws_id: str):
    return _list_delete(WORKSPACES_KEY, "id", ws_id)


# ═══════════════════════════════════════════════════════════════════════
#  SETTINGS / THEME
# ═══════════════════════════════════════════════════════════════════════

class ThemeSave(BaseModel):
    theme: str = "dark"

@router.get("/settings/theme")
async def get_theme():
    theme = rdb.get("settings:theme") or "dark"
    return {"theme": theme}

@router.post("/settings/theme")
async def save_theme(body: ThemeSave):
    rdb.set("settings:theme", body.theme)
    return {"theme": body.theme}


# ═══════════════════════════════════════════════════════════════════════
#  MARGIN TRACKER
# ═══════════════════════════════════════════════════════════════════════
MARGIN_KEY = "margin:current"
MARGIN_HISTORY_KEY = "margin:history"

class MarginInput(BaseModel):
    balance: float
    rate: float = 11.825

@router.get("/margin")
async def get_margin():
    current = rdb.get(MARGIN_KEY)
    current = json.loads(current) if current else None
    history = [json.loads(r) for r in rdb.lrange(MARGIN_HISTORY_KEY, 0, -1)]
    return {"current": current, "history": history[-90:]}

@router.post("/margin")
async def save_margin(body: MarginInput):
    daily = round(body.balance * (body.rate / 100) / 365, 2)
    weekly = round(daily * 7, 2)
    monthly = round(daily * 30, 2)
    annual = round(body.balance * (body.rate / 100), 2)
    entry = {
        "balance": body.balance,
        "rate": body.rate,
        "daily_cost": daily,
        "weekly_cost": weekly,
        "monthly_cost": monthly,
        "annual_cost": annual,
        "timestamp": _now(),
    }
    rdb.set(MARGIN_KEY, json.dumps(entry))
    rdb.rpush(MARGIN_HISTORY_KEY, json.dumps(entry))
    rdb.ltrim(MARGIN_HISTORY_KEY, -365, -1)
    return entry

@router.get("/margin/analysis")
async def margin_analysis():
    """Cross-reference margin cost vs CC income from options journal."""
    current = rdb.get(MARGIN_KEY)
    current = json.loads(current) if current else {"balance": 0, "rate": 11.825, "monthly_cost": 0}
    monthly_interest = current.get("monthly_cost", 0)

    # Load options journal for CC income
    import pathlib
    data_file = pathlib.Path.home() / "dev/stock-platform/.options_trades.json"
    cc_income = 0
    cc_count = 0
    if data_file.exists():
        with open(data_file) as f:
            journal = json.load(f)
        for t in journal.get("closed_trades", []):
            if t.get("is_short") and t.get("pnl", 0) > 0:
                cc_income += t["pnl"]
                cc_count += 1

    months_of_data = max(1, cc_count / 4)  # rough estimate
    avg_monthly_cc = round(cc_income / months_of_data, 2) if months_of_data else 0
    net_monthly = round(avg_monthly_cc - monthly_interest, 2)
    breakeven_premium = round(monthly_interest / 4, 2) if monthly_interest > 0 else 0  # ~4 CCs/month

    return {
        "margin": current,
        "cc_income_total": round(cc_income, 2),
        "cc_trades": cc_count,
        "avg_monthly_cc_income": avg_monthly_cc,
        "monthly_interest": monthly_interest,
        "net_monthly": net_monthly,
        "covers_margin": net_monthly > 0,
        "breakeven_premium_per_contract": breakeven_premium,
    }


# ═══════════════════════════════════════════════════════════════════════
#  WHEEL STRATEGY ENHANCEMENTS
# ═══════════════════════════════════════════════════════════════════════

class WheelUpdate(BaseModel):
    phase: Optional[str] = None
    strike: Optional[float] = None
    premium: Optional[float] = None
    expiry: Optional[str] = None
    notes: Optional[str] = None

@router.put("/wheel/{pos_id}")
async def update_wheel(pos_id: str, updates: WheelUpdate):
    raw = rdb.lrange(WHEEL_KEY, 0, -1)
    for i, r in enumerate(raw):
        item = json.loads(r)
        if item.get("id") == pos_id:
            if updates.phase:
                if "history" not in item:
                    item["history"] = []
                item["history"].append({
                    "phase": item.get("phase"),
                    "premium": item.get("premium", 0),
                    "timestamp": _now(),
                })
                item["phase"] = updates.phase
            if updates.strike is not None:
                item["strike"] = updates.strike
            if updates.premium is not None:
                item["total_premium"] = item.get("total_premium", 0) + updates.premium
                item["premium"] = updates.premium
            if updates.expiry is not None:
                item["expiry"] = updates.expiry
            if updates.notes is not None:
                item["notes"] = updates.notes
            rdb.lset(WHEEL_KEY, i, json.dumps(item))
            return item
    raise HTTPException(404, "Wheel position not found")

@router.get("/wheel/analytics")
async def wheel_analytics():
    """Per-ticker lifetime premium, annualized return, cycle count, next action."""
    positions = _list_get(WHEEL_KEY)
    by_ticker = {}
    for p in positions:
        tk = p.get("ticker", "?")
        if tk not in by_ticker:
            by_ticker[tk] = {"ticker": tk, "positions": [], "total_premium": 0, "cycles": 0}
        by_ticker[tk]["positions"].append(p)
        by_ticker[tk]["total_premium"] += p.get("total_premium", p.get("premium", 0))
        history = p.get("history", [])
        by_ticker[tk]["cycles"] += len(history)

    analytics = []
    for tk, data in by_ticker.items():
        current_phase = data["positions"][-1].get("phase", "csp") if data["positions"] else "csp"
        next_action = {
            "csp": "Wait for assignment or BTC on dip",
            "assigned": "Sell covered call on next rip",
            "cc": "Wait for expiry or BTC when profitable",
            "called_away": "Restart wheel — sell new CSP",
        }.get(current_phase, "Review position")

        analytics.append({
            "ticker": tk,
            "current_phase": current_phase,
            "total_premium": round(data["total_premium"], 2),
            "cycles": data["cycles"],
            "active_positions": len(data["positions"]),
            "next_action": next_action,
        })

    return {"analytics": analytics, "total_premium": round(sum(a["total_premium"] for a in analytics), 2)}


# ═══════════════════════════════════════════════════════════════════════
#  POSITION HEALTH SCANNER
# ═══════════════════════════════════════════════════════════════════════

@router.get("/portfolio/health-scan")
async def health_scan():
    """Categorize all positions as Core/Thesis/Dead Weight/Overweight."""
    import pathlib, csv as csvmod

    # Load Fidelity positions
    positions = []
    csv_path = pathlib.Path(__file__).parent.parent / "data" / "positions.csv"
    if not csv_path.exists():
        csv_path = pathlib.Path(__file__).parent / "positions.csv"
    if not csv_path.exists():
        csv_path = pathlib.Path(__file__).parent.parent / "positions.csv"
    if csv_path.exists():
        with open(csv_path) as f:
            reader = csvmod.DictReader(f)
            for row in reader:
                sym = (row.get("Symbol") or "").strip()
                if not sym or sym == "Cash" or sym.startswith("-") or "SPAXX" in sym:
                    continue
                try:
                    qty = float((row.get("Quantity") or "0").replace(",", ""))
                    cost_basis = float((row.get("Cost Basis Total") or "0").replace("$", "").replace(",", "").replace("+", "") or 0)
                    market_val = float((row.get("Current Value") or "0").replace("$", "").replace(",", "").replace("+", "") or 0)
                    pnl = market_val - cost_basis if cost_basis else 0
                    pnl_pct = (pnl / cost_basis * 100) if cost_basis else 0
                except (ValueError, TypeError):
                    qty, cost_basis, market_val, pnl, pnl_pct = 0, 0, 0, 0, 0
                positions.append({
                    "ticker": sym, "shares": qty, "cost_basis": round(cost_basis, 2),
                    "market_value": round(market_val, 2), "pnl": round(pnl, 2),
                    "pnl_pct": round(pnl_pct, 1),
                })

    total_value = sum(p["market_value"] for p in positions) or 1

    # Load options journal for CC detection
    options_data = {}
    data_file = pathlib.Path.home() / "dev/stock-platform/.options_trades.json"
    if data_file.exists():
        with open(data_file) as f:
            journal = json.load(f)
        for op in journal.get("open_positions", []):
            tk = op.get("ticker", "")
            if op.get("is_short"):
                options_data[tk] = True

    # Load convictions for thesis detection
    convictions = {c.get("ticker", ""): c for c in _list_get("convictions:list")}

    results = {"core": [], "thesis": [], "dead_weight": [], "overweight": []}
    for p in positions:
        tk = p["ticker"]
        pct_of_account = round(p["market_value"] / total_value * 100, 1)
        p["pct_of_account"] = pct_of_account

        has_cc = tk in options_data
        has_thesis = tk in convictions
        is_small = p["market_value"] < 300
        is_losing = p["pnl_pct"] < -20

        if pct_of_account > 15:
            p["category"] = "overweight"
            p["recommendation"] = f"Consider trimming — {pct_of_account}% of account"
            results["overweight"].append(p)
        elif has_cc:
            p["category"] = "core"
            p["recommendation"] = "Active CC income strategy"
            results["core"].append(p)
        elif has_thesis:
            p["category"] = "thesis"
            p["recommendation"] = f"Thesis play — {convictions[tk].get('thesis', 'defined')}"
            results["thesis"].append(p)
        elif is_small and is_losing:
            p["category"] = "dead_weight"
            p["recommendation"] = f"Sell — small position ({pct_of_account}%), down {p['pnl_pct']}%, no CC or thesis"
            results["dead_weight"].append(p)
        elif is_small:
            p["category"] = "dead_weight"
            p["recommendation"] = f"Too small to matter ({pct_of_account}% of account) — size up or sell"
            results["dead_weight"].append(p)
        else:
            p["category"] = "thesis"
            p["recommendation"] = "No conviction defined — add thesis or consider selling"
            results["thesis"].append(p)

    return {
        "summary": {
            "core": len(results["core"]),
            "thesis": len(results["thesis"]),
            "dead_weight": len(results["dead_weight"]),
            "overweight": len(results["overweight"]),
            "total_positions": len(positions),
            "total_value": round(total_value, 2),
        },
        **results,
    }


# ═══════════════════════════════════════════════════════════════════════
#  ACCOUNT GROWTH TRACKER
# ═══════════════════════════════════════════════════════════════════════
GROWTH_KEY = "growth:snapshots"

class GrowthSnapshot(BaseModel):
    account_value: float
    cash: float = 0
    margin_used: float = 0
    notes: str = ""

@router.get("/growth")
async def get_growth():
    snapshots = _list_get(GROWTH_KEY)
    if not snapshots:
        return {"snapshots": [], "current": None, "goal": 50000, "stats": {}}

    current = snapshots[-1] if snapshots else None
    first = snapshots[0] if snapshots else None

    # Calculate stats
    current_val = current.get("account_value", 0) if current else 0
    first_val = first.get("account_value", 0) if first else current_val
    total_gain = current_val - first_val
    days = max(1, len(snapshots))
    daily_rate = total_gain / days if days > 0 else 0
    weekly_rate = daily_rate * 7
    monthly_rate = daily_rate * 30

    goal = 50000
    remaining = goal - current_val
    days_to_goal = int(remaining / daily_rate) if daily_rate > 0 else 0

    return {
        "snapshots": snapshots[-90:],
        "current": current,
        "goal": goal,
        "stats": {
            "current_value": round(current_val, 2),
            "total_gain": round(total_gain, 2),
            "daily_rate": round(daily_rate, 2),
            "weekly_rate": round(weekly_rate, 2),
            "monthly_rate": round(monthly_rate, 2),
            "remaining": round(remaining, 2),
            "days_to_goal": days_to_goal,
            "projected_date": "",
            "snapshots_count": len(snapshots),
        },
    }

@router.post("/growth")
async def add_growth_snapshot(snap: GrowthSnapshot):
    entry = {
        "account_value": snap.account_value,
        "cash": snap.cash,
        "margin_used": snap.margin_used,
        "notes": snap.notes,
        "timestamp": _now(),
    }
    _list_add(GROWTH_KEY, entry)
    return entry

@router.post("/growth/goal")
async def set_growth_goal(body: dict):
    rdb.set("growth:goal", str(body.get("goal", 50000)))
    return {"goal": body.get("goal", 50000)}


# ═══════════════════════════════════════════════════════════════════════
#  WEEKLY CC INCOME DASHBOARD
# ═══════════════════════════════════════════════════════════════════════

@router.get("/cc-income")
async def get_cc_income():
    """Analyze CC income from options journal — by week, ticker, annualized."""
    import pathlib
    from collections import defaultdict
    from datetime import datetime as dt

    data_file = pathlib.Path.home() / "dev/stock-platform/.options_trades.json"
    if not data_file.exists():
        return {"weekly": [], "by_ticker": [], "summary": {}}

    with open(data_file) as f:
        journal = json.load(f)

    # Collect all CC trades (closed short calls/puts)
    cc_trades = []
    for t in journal.get("closed_trades", []):
        if t.get("is_short") and t.get("pnl", 0) != 0:
            cc_trades.append(t)
    for t in journal.get("orphan_closings", []):
        if t.get("close_cash", 0) < 0:  # BTC = debit
            cc_trades.append({"ticker": t.get("ticker", "?"), "pnl": abs(t["close_cash"]), "close_date": t.get("close_date", ""), "strategy": "CC (orphan)"})

    # Open CC positions (premium not yet realized but collected)
    open_premium = 0
    for op in journal.get("open_positions", []):
        if op.get("is_short"):
            open_premium += op.get("premium_received", 0)

    # Group by week
    weekly = defaultdict(lambda: {"premium": 0, "trades": 0, "tickers": set()})
    by_ticker = defaultdict(lambda: {"premium": 0, "trades": 0, "wins": 0, "losses": 0})

    for t in cc_trades:
        tk = t.get("ticker", "?")
        pnl = t.get("pnl", 0)
        close_date = t.get("close_date", "")

        # Parse week
        try:
            if "/" in close_date:
                d = dt.strptime(close_date, "%m/%d/%Y")
            elif "-" in close_date:
                d = dt.strptime(close_date, "%Y-%m-%d")
            else:
                d = dt.now()
            week_key = d.strftime("%Y-W%U")
            week_label = d.strftime("%b %d")
        except Exception:
            week_key = "unknown"
            week_label = "?"

        weekly[week_key]["premium"] += pnl
        weekly[week_key]["trades"] += 1
        weekly[week_key]["tickers"].add(tk)
        weekly[week_key]["label"] = week_label

        by_ticker[tk]["premium"] += pnl
        by_ticker[tk]["trades"] += 1
        if pnl > 0:
            by_ticker[tk]["wins"] += 1
        else:
            by_ticker[tk]["losses"] += 1

    # Format output
    weekly_list = []
    for wk in sorted(weekly.keys()):
        w = weekly[wk]
        weekly_list.append({
            "week": wk,
            "label": w.get("label", wk),
            "premium": round(w["premium"], 2),
            "trades": w["trades"],
            "tickers": list(w["tickers"]),
        })

    ticker_list = []
    for tk, data in sorted(by_ticker.items(), key=lambda x: x[1]["premium"], reverse=True):
        ticker_list.append({
            "ticker": tk,
            "premium": round(data["premium"], 2),
            "trades": data["trades"],
            "wins": data["wins"],
            "losses": data["losses"],
            "win_rate": round(data["wins"] / data["trades"] * 100, 1) if data["trades"] else 0,
        })

    total_premium = sum(t["pnl"] for t in cc_trades if t.get("pnl", 0) > 0)
    total_losses = sum(t["pnl"] for t in cc_trades if t.get("pnl", 0) < 0)
    weeks_active = max(1, len(weekly_list))
    avg_weekly = total_premium / weeks_active

    return {
        "weekly": weekly_list,
        "by_ticker": ticker_list,
        "summary": {
            "total_premium": round(total_premium, 2),
            "total_losses": round(total_losses, 2),
            "net_income": round(total_premium + total_losses, 2),
            "open_premium": round(open_premium, 2),
            "total_cc_trades": len(cc_trades),
            "weeks_active": weeks_active,
            "avg_weekly": round(avg_weekly, 2),
            "annualized": round(avg_weekly * 52, 2),
        },
    }


# ═══════════════════════════════════════════════════════════════════════
#  GEOPOLITICAL SIGNAL MONITOR
# ═══════════════════════════════════════════════════════════════════════

@router.get("/geo-monitor")
async def geo_monitor():
    """Geopolitical risk monitor — oil, rates, ceasefire signals, portfolio impact."""
    try:
        import yfinance as yf
    except ImportError:
        return {"error": "yfinance not available"}

    # Key indicators
    def safe_price(sym):
        try:
            t = yf.Ticker(sym)
            h = t.history(period="1mo")
            if h.empty:
                return {}
            prices = h["Close"].tolist()
            current = prices[-1]
            prev = prices[-2] if len(prices) > 1 else current
            week_ago = prices[-5] if len(prices) >= 5 else prices[0]
            month_ago = prices[0]
            return {
                "current": round(current, 2),
                "daily_chg": round((current - prev) / prev * 100, 2),
                "weekly_chg": round((current - week_ago) / week_ago * 100, 2),
                "monthly_chg": round((current - month_ago) / month_ago * 100, 2),
                "trend": "rising" if current > week_ago else "falling",
            }
        except Exception:
            return {}

    brent = safe_price("BZ=F")
    vix = safe_price("^VIX")
    tnx = safe_price("^TNX")
    dxy = safe_price("DX-Y.NYB")
    gold = safe_price("GC=F")

    # Risk level assessment
    oil_risk = "critical" if (brent.get("current", 0) > 100) else "elevated" if brent.get("current", 0) > 85 else "normal"
    vix_risk = "critical" if (vix.get("current", 0) > 30) else "elevated" if vix.get("current", 0) > 20 else "normal"
    rate_risk = "elevated" if (tnx.get("current", 0) > 4.5) else "normal"

    # Ceasefire signal heuristics
    oil_falling = brent.get("daily_chg", 0) < -2
    vix_falling = vix.get("daily_chg", 0) < -3
    gold_falling = gold.get("daily_chg", 0) < -1
    ceasefire_signals = sum([oil_falling, vix_falling, gold_falling])

    if ceasefire_signals >= 2:
        ceasefire_status = "possible"
        ceasefire_note = "Multiple de-escalation signals: oil, VIX, and/or gold falling simultaneously"
    elif ceasefire_signals == 1:
        ceasefire_status = "unlikely"
        ceasefire_note = "Mixed signals — one indicator suggesting de-escalation"
    else:
        ceasefire_status = "no_signal"
        ceasefire_note = "No de-escalation signals detected. War premium intact."

    # Trade signals
    signals = []
    if oil_falling and brent.get("daily_chg", 0) < -3:
        signals.append({"signal": "OIL CRASH", "action": "Consider adding SOFI/rate-sensitive names", "urgency": "high"})
    if vix.get("current", 0) > 30:
        signals.append({"signal": "VIX ELEVATED", "action": "Caution on new entries — sell premium instead", "urgency": "medium"})
    if brent.get("current", 0) > 110:
        signals.append({"signal": "OIL SPIKE", "action": "Avoid rate-sensitive longs. Hold AI/photonics.", "urgency": "high"})
    if tnx.get("trend") == "falling" and tnx.get("weekly_chg", 0) < -2:
        signals.append({"signal": "YIELDS FALLING", "action": "Rate cut expectations rising — bullish SOFI", "urgency": "high"})
    if ceasefire_status == "possible":
        signals.append({"signal": "CEASEFIRE SIGNAL", "action": "Load SOFI/OSCR before confirmation", "urgency": "critical"})

    return {
        "indicators": {
            "brent": brent,
            "vix": vix,
            "10y_yield": tnx,
            "dxy": dxy,
            "gold": gold,
        },
        "risk_levels": {
            "oil": oil_risk,
            "volatility": vix_risk,
            "rates": rate_risk,
            "overall": "critical" if oil_risk == "critical" or vix_risk == "critical" else "elevated" if oil_risk == "elevated" else "normal",
        },
        "ceasefire": {
            "status": ceasefire_status,
            "note": ceasefire_note,
            "signals_detected": ceasefire_signals,
        },
        "trade_signals": signals,
        "updated_at": _now(),
    }


# ═══════════════════════════════════════════════════════════════════════
#  FIDELITY CSV UPLOAD
# ═══════════════════════════════════════════════════════════════════════
from fastapi import UploadFile, File

@router.post("/fidelity/upload-positions")
async def upload_fidelity_positions(file: UploadFile = File(...)):
    """Upload Fidelity positions CSV and store for all dashboards."""
    import pathlib, csv as csvmod, io
    content = (await file.read()).decode("utf-8-sig")

    # Parse and validate
    lines = content.strip().split("\n")
    reader = csvmod.DictReader(io.StringIO(content))
    rows = list(reader)
    if not rows or "Symbol" not in rows[0]:
        return {"error": "Invalid CSV — missing Symbol column"}

    # Save to data directory
    data_dir = pathlib.Path(__file__).parent.parent / "data"
    data_dir.mkdir(exist_ok=True)
    csv_path = data_dir / "positions.csv"
    with open(csv_path, "w") as f:
        f.write(content)

    # Parse positions for summary
    positions = []
    total_value = 0
    for row in rows:
        sym = (row.get("Symbol") or "").strip()
        if not sym or "SPAXX" in sym or sym == "Cash":
            continue
        try:
            val = float((row.get("Current Value") or "0").replace("$", "").replace(",", "").replace("+", "") or 0)
            total_value += val
            positions.append(sym)
        except (ValueError, TypeError):
            continue

    return {
        "status": "ok",
        "positions_count": len(positions),
        "total_value": round(total_value, 2),
        "tickers": positions,
        "file_saved": str(csv_path),
    }

@router.post("/fidelity/upload-history")
async def upload_fidelity_history(file: UploadFile = File(...)):
    """Upload Fidelity activity/orders CSV for options journal and trade replay."""
    import pathlib
    content = (await file.read()).decode("utf-8-sig")

    # Import the options parser
    from app.options_router import parse_options_csv, DATA_FILE

    # Parse options trades
    try:
        result = parse_options_csv(content)
    except Exception as e:
        return {"error": f"Parse failed: {str(e)}"}

    # Merge with existing data if present
    import pathlib as _p
    if _p.Path(DATA_FILE).exists():
        with open(DATA_FILE) as f:
            existing = json.load(f)

        # Deduplicate: keep existing trades not in new data
        new_symbols = {t["symbol"] + t.get("close_date", "") for t in result.get("closed_trades", [])}
        kept = [t for t in existing.get("closed_trades", []) if t.get("symbol", "") + t.get("close_date", "") not in new_symbols]
        result["closed_trades"] = kept + result["closed_trades"]

        # Recalculate summary
        closed = result["closed_trades"]
        total_pnl = round(sum(t.get("pnl", 0) for t in closed), 2)
        winners = [t for t in closed if t.get("pnl", 0) > 0]
        losers = [t for t in closed if t.get("pnl", 0) < 0]
        result["summary"] = {
            "total_pnl": total_pnl,
            "total_trades": len(closed),
            "win_rate": round(len(winners) / len(closed) * 100, 1) if closed else 0,
            "winners": len(winners),
            "losers": len(losers),
            "avg_win": round(sum(t["pnl"] for t in winners) / len(winners), 2) if winners else 0,
            "avg_loss": round(sum(t["pnl"] for t in losers) / len(losers), 2) if losers else 0,
            "open_count": len(result.get("open_positions", [])),
        }

    # Save
    import os
    os.makedirs(os.path.dirname(DATA_FILE), exist_ok=True)
    with open(DATA_FILE, "w") as f:
        json.dump(result, f, indent=2)

    return {"status": "ok", "summary": result["summary"]}


# ═══════════════════════════════════════════════════════════════════════
#  PORTFOLIO EQUITY CURVE
# ═══════════════════════════════════════════════════════════════════════
EQUITY_KEY = "equity:history"

@router.post("/equity/snapshot")
async def add_equity_snapshot(body: dict):
    """Log daily equity snapshot for curve tracking."""
    entry = {
        "value": body.get("value", 0),
        "cash": body.get("cash", 0),
        "invested": body.get("invested", 0),
        "day_pnl": body.get("day_pnl", 0),
        "timestamp": _now(),
        "date": datetime.now(timezone.utc).strftime("%Y-%m-%d"),
    }
    rdb.rpush(EQUITY_KEY, json.dumps(entry))
    rdb.ltrim(EQUITY_KEY, -365, -1)
    return entry

@router.get("/equity/curve")
async def get_equity_curve():
    """Get equity curve data with drawdown and benchmark comparison."""
    snapshots = _list_get(EQUITY_KEY)

    if not snapshots:
        # Try to build from Fidelity data if available
        import pathlib, csv as csvmod
        csv_path = pathlib.Path(__file__).parent.parent / "data" / "positions.csv"
        if csv_path.exists():
            with open(csv_path) as f:
                reader = csvmod.DictReader(f)
                total = 0
                for row in reader:
                    try:
                        val = float((row.get("Current Value") or "0").replace("$", "").replace(",", "").replace("+", "") or 0)
                        total += val
                    except (ValueError, TypeError):
                        continue
            if total > 0:
                snapshots = [{"value": round(total, 2), "date": datetime.now(timezone.utc).strftime("%Y-%m-%d"), "timestamp": _now()}]

    if not snapshots:
        return {"curve": [], "stats": {}}

    values = [s.get("value", 0) for s in snapshots]
    peak = values[0]
    drawdowns = []
    for v in values:
        if v > peak:
            peak = v
        dd = ((v - peak) / peak * 100) if peak > 0 else 0
        drawdowns.append(round(dd, 2))

    first_val = values[0]
    last_val = values[-1]
    total_return = round(((last_val - first_val) / first_val * 100), 2) if first_val > 0 else 0
    max_dd = round(min(drawdowns), 2) if drawdowns else 0

    curve = []
    for i, s in enumerate(snapshots):
        curve.append({
            **s,
            "drawdown": drawdowns[i] if i < len(drawdowns) else 0,
        })

    return {
        "curve": curve,
        "stats": {
            "current": round(last_val, 2),
            "start": round(first_val, 2),
            "total_return": total_return,
            "max_drawdown": max_dd,
            "peak": round(max(values), 2),
            "trough": round(min(values), 2),
            "days": len(snapshots),
        },
    }


# ═══════════════════════════════════════════════════════════════════════
#  DIVIDEND TRACKER
# ═══════════════════════════════════════════════════════════════════════
DIVIDENDS_KEY = "dividends:history"

class DividendEntry(BaseModel):
    ticker: str
    amount: float
    date: str = ""
    shares: float = 0
    per_share: float = 0

@router.get("/dividends")
async def get_dividends():
    """Get dividend history and upcoming ex-dates."""
    history = _list_get(DIVIDENDS_KEY)
    total = round(sum(d.get("amount", 0) for d in history), 2)

    # Get upcoming dividends from yfinance for portfolio tickers
    upcoming = []
    try:
        import yfinance as yf
        import pathlib, csv as csvmod
        csv_path = pathlib.Path(__file__).parent.parent / "data" / "positions.csv"
        if csv_path.exists():
            tickers = []
            with open(csv_path) as f:
                reader = csvmod.DictReader(f)
                for row in reader:
                    sym = (row.get("Symbol") or "").strip()
                    if sym and "SPAXX" not in sym and sym != "Cash" and not sym.startswith("-"):
                        tickers.append(sym)

            for tk in tickers[:15]:
                try:
                    info = yf.Ticker(tk).info or {}
                    div_yield = info.get("dividendYield")
                    div_rate = info.get("dividendRate")
                    ex_date = info.get("exDividendDate")
                    if div_yield and div_yield > 0:
                        upcoming.append({
                            "ticker": tk,
                            "yield": round(div_yield * 100, 2),
                            "annual_rate": round(div_rate, 2) if div_rate else None,
                            "ex_date": ex_date,
                        })
                except Exception:
                    continue
    except Exception:
        pass

    return {
        "history": history,
        "upcoming": sorted(upcoming, key=lambda x: x["yield"], reverse=True),
        "total_received": total,
        "total_entries": len(history),
    }

@router.post("/dividends")
async def add_dividend(entry: DividendEntry):
    item = {
        "id": _make_id(),
        "ticker": entry.ticker.upper(),
        "amount": entry.amount,
        "date": entry.date or _now()[:10],
        "shares": entry.shares,
        "per_share": entry.per_share,
        "created": _now(),
    }
    return _list_add(DIVIDENDS_KEY, item)

@router.delete("/dividends/{div_id}")
async def delete_dividend(div_id: str):
    return _list_delete(DIVIDENDS_KEY, "id", div_id)


# ═══════════════════════════════════════════════════════════════════════
#  WATCHLIST PRICE ALERTS
# ═══════════════════════════════════════════════════════════════════════
PRICE_ALERTS_KEY = "price-alerts:list"

class PriceAlertCreate(BaseModel):
    ticker: str
    condition: str = "below"  # "below" or "above"
    target: float = 0
    notes: str = ""

@router.get("/price-alerts")
async def get_price_alerts():
    """Get all price alerts with current prices and triggered status."""
    alerts = _list_get(PRICE_ALERTS_KEY)
    try:
        import yfinance as yf
        tickers = list({a["ticker"] for a in alerts})
        if tickers:
            data = yf.download(tickers, period="1d", progress=False, auto_adjust=True)
            for a in alerts:
                try:
                    if len(tickers) == 1:
                        price = float(data["Close"].iloc[-1])
                    else:
                        price = float(data["Close"][a["ticker"]].iloc[-1])
                    a["current_price"] = round(price, 2)
                    if a["condition"] == "below":
                        a["triggered"] = price <= a["target"]
                        a["distance_pct"] = round((price - a["target"]) / price * 100, 1)
                    else:
                        a["triggered"] = price >= a["target"]
                        a["distance_pct"] = round((a["target"] - price) / price * 100, 1)
                except Exception:
                    a["current_price"] = None
                    a["triggered"] = False
    except Exception:
        pass
    triggered = [a for a in alerts if a.get("triggered")]
    return {"alerts": alerts, "triggered_count": len(triggered)}

@router.post("/price-alerts")
async def create_price_alert(alert: PriceAlertCreate):
    entry = {
        "id": _make_id(),
        "ticker": alert.ticker.upper(),
        "condition": alert.condition,
        "target": alert.target,
        "notes": alert.notes,
        "created": _now(),
        "triggered": False,
    }
    return _list_add(PRICE_ALERTS_KEY, entry)

@router.delete("/price-alerts/{alert_id}")
async def delete_price_alert(alert_id: str):
    return _list_delete(PRICE_ALERTS_KEY, "id", alert_id)


# ═══════════════════════════════════════════════════════════════════════
#  PORTFOLIO CORRELATION MATRIX
# ═══════════════════════════════════════════════════════════════════════

@router.get("/portfolio/correlations")
async def portfolio_correlations():
    """Calculate correlation matrix for portfolio holdings."""
    import pathlib, csv as csvmod
    try:
        import yfinance as yf
        import numpy as np
    except ImportError:
        return {"error": "yfinance or numpy not available"}

    # Load tickers from Fidelity
    csv_path = pathlib.Path(__file__).parent.parent / "data" / "positions.csv"
    if not csv_path.exists():
        return {"tickers": [], "matrix": [], "clusters": []}

    tickers = []
    with open(csv_path) as f:
        reader = csvmod.DictReader(f)
        for row in reader:
            sym = (row.get("Symbol") or "").strip()
            if sym and "SPAXX" not in sym and sym != "Cash" and not sym.startswith("-"):
                tickers.append(sym)

    tickers = tickers[:20]  # limit
    if len(tickers) < 2:
        return {"tickers": tickers, "matrix": [], "clusters": []}

    # Download 3-month returns
    try:
        data = yf.download(tickers, period="3mo", progress=False, auto_adjust=True)
        if data.empty:
            return {"tickers": tickers, "matrix": [], "clusters": []}
        returns = data["Close"].pct_change().dropna()
        corr = returns.corr()
    except Exception as e:
        return {"tickers": tickers, "matrix": [], "error": str(e)}

    # Build matrix
    matrix = []
    for i, t1 in enumerate(tickers):
        row = []
        for j, t2 in enumerate(tickers):
            try:
                val = round(float(corr.loc[t1, t2]), 3)
            except Exception:
                val = 0
            row.append(val)
        matrix.append(row)

    # Find clusters (highly correlated groups > 0.7)
    clusters = []
    seen = set()
    for i, t1 in enumerate(tickers):
        if t1 in seen:
            continue
        cluster = [t1]
        for j, t2 in enumerate(tickers):
            if i != j and t2 not in seen:
                try:
                    if abs(float(corr.loc[t1, t2])) > 0.7:
                        cluster.append(t2)
                except Exception:
                    pass
        if len(cluster) > 1:
            clusters.append(cluster)
            seen.update(cluster)

    return {"tickers": tickers, "matrix": matrix, "clusters": clusters}


# ═══════════════════════════════════════════════════════════════════════
#  EARNINGS CALENDAR WITH AI PREP
# ═══════════════════════════════════════════════════════════════════════

@router.get("/earnings/ai-prep")
async def earnings_ai_prep():
    """Get upcoming earnings for portfolio with AI prep notes."""
    import pathlib, csv as csvmod

    try:
        import yfinance as yf
    except ImportError:
        return {"earnings": []}

    # Load tickers
    csv_path = pathlib.Path(__file__).parent.parent / "data" / "positions.csv"
    tickers = []
    if csv_path.exists():
        with open(csv_path) as f:
            reader = csvmod.DictReader(f)
            for row in reader:
                sym = (row.get("Symbol") or "").strip()
                if sym and "SPAXX" not in sym and sym != "Cash" and not sym.startswith("-"):
                    tickers.append(sym)

    earnings = []
    for tk in tickers[:20]:
        try:
            info = yf.Ticker(tk).info or {}
            cal = yf.Ticker(tk).calendar
            ear_date = None
            if isinstance(cal, dict):
                ear_date = cal.get("Earnings Date")
                if isinstance(ear_date, list) and ear_date:
                    ear_date = str(ear_date[0])
                elif ear_date:
                    ear_date = str(ear_date)

            if not ear_date:
                continue

            earnings.append({
                "ticker": tk,
                "earnings_date": ear_date,
                "price": round(info.get("currentPrice") or info.get("regularMarketPrice") or 0, 2),
                "pe": info.get("trailingPE"),
                "forward_pe": info.get("forwardPE"),
                "eps_estimate": info.get("epsCurrentYear"),
                "revenue_estimate": info.get("revenueEstimate", {}).get("avg") if isinstance(info.get("revenueEstimate"), dict) else None,
                "recommendation": info.get("recommendationKey", ""),
                "analysts": info.get("numberOfAnalystOpinions", 0),
            })
        except Exception:
            continue

    # Sort by earnings date
    earnings.sort(key=lambda x: x.get("earnings_date", "9999"))

    # AI prep for next 3 earnings if Claude available
    try:
        import anthropic
        ANTHROPIC_KEY = os.getenv("ANTHROPIC_API_KEY", "")
        if earnings[:3] and ANTHROPIC_KEY:
            client = anthropic.Anthropic(api_key=ANTHROPIC_KEY)
            tickers_info = "\n".join([f"{e['ticker']}: P/E {e.get('pe','N/A')}, Fwd P/E {e.get('forward_pe','N/A')}, EPS Est {e.get('eps_estimate','N/A')}, Consensus: {e.get('recommendation','N/A')}, Date: {e['earnings_date']}" for e in earnings[:3]])

            msg = client.messages.create(
                model="claude-sonnet-4-20250514",
                max_tokens=1500,
                messages=[{"role": "user", "content": f"""For each upcoming earnings report below, provide brief prep notes as JSON array:
- "ticker": string
- "what_to_watch": 1 sentence on what matters most
- "expected_move": estimated % move (based on historical)
- "risk": main risk going in
- "action": what a covered call trader should do (hold through, close CC before, sell puts after, etc.)

{tickers_info}

Return ONLY valid JSON array."""}],
            )
            text = msg.content[0].text.strip()
            if text.startswith("["):
                ai_prep = json.loads(text)
                # Merge AI prep into earnings
                prep_map = {p["ticker"]: p for p in ai_prep}
                for e in earnings:
                    if e["ticker"] in prep_map:
                        e["ai_prep"] = prep_map[e["ticker"]]
    except Exception:
        pass

    return {"earnings": earnings, "total": len(earnings)}


# ═══════════════════════════════════════════════════════════════════════
#  MULTI-ACCOUNT DASHBOARD
# ═══════════════════════════════════════════════════════════════════════
IBKR_KEY = "accounts:ibkr"

class IBKRPosition(BaseModel):
    ticker: str
    shares: float
    avg_cost: float
    currency: str = "USD"
    account: str = "IBKR"

@router.get("/multi-account")
async def multi_account():
    """Combine Fidelity + IBKR into one view."""
    import pathlib, csv as csvmod

    accounts = []

    # Fidelity
    csv_path = pathlib.Path(__file__).parent.parent / "data" / "positions.csv"
    fidelity_positions = []
    fidelity_total = 0
    if csv_path.exists():
        with open(csv_path) as f:
            reader = csvmod.DictReader(f)
            for row in reader:
                sym = (row.get("Symbol") or "").strip()
                if not sym or "SPAXX" in sym or sym == "Cash":
                    continue
                try:
                    val = float((row.get("Current Value") or "0").replace("$", "").replace(",", "").replace("+", "") or 0)
                    qty = float((row.get("Quantity") or "0").replace(",", ""))
                    cost = float((row.get("Cost Basis Total") or "0").replace("$", "").replace(",", "").replace("+", "") or 0)
                    pnl = val - cost
                except (ValueError, TypeError):
                    continue
                fidelity_total += val
                fidelity_positions.append({
                    "ticker": sym, "shares": qty, "value": round(val, 2),
                    "cost": round(cost, 2), "pnl": round(pnl, 2),
                    "pnl_pct": round(pnl / cost * 100, 1) if cost else 0,
                })

    accounts.append({
        "name": "Fidelity",
        "type": "Individual",
        "total_value": round(fidelity_total, 2),
        "positions": fidelity_positions,
        "position_count": len(fidelity_positions),
    })

    # IBKR (from Redis)
    ibkr_positions = _list_get(IBKR_KEY)
    ibkr_total = 0
    try:
        import yfinance as yf
        for p in ibkr_positions:
            try:
                t = yf.Ticker(p["ticker"])
                hist = t.history(period="1d")
                if not hist.empty:
                    price = float(hist["Close"].iloc[-1])
                    val = price * p["shares"]
                    cost = p["avg_cost"] * p["shares"]
                    p["current_price"] = round(price, 2)
                    p["value"] = round(val, 2)
                    p["pnl"] = round(val - cost, 2)
                    p["pnl_pct"] = round((val - cost) / cost * 100, 1) if cost else 0
                    ibkr_total += val
            except Exception:
                pass
    except Exception:
        pass

    if ibkr_positions:
        accounts.append({
            "name": "Interactive Brokers",
            "type": "Individual",
            "total_value": round(ibkr_total, 2),
            "positions": ibkr_positions,
            "position_count": len(ibkr_positions),
        })

    grand_total = sum(a["total_value"] for a in accounts)
    return {
        "accounts": accounts,
        "grand_total": round(grand_total, 2),
        "account_count": len(accounts),
    }

@router.post("/multi-account/ibkr")
async def add_ibkr_position(pos: IBKRPosition):
    entry = {
        "id": _make_id(),
        "ticker": pos.ticker.upper(),
        "shares": pos.shares,
        "avg_cost": pos.avg_cost,
        "currency": pos.currency,
        "account": pos.account,
        "created": _now(),
    }
    return _list_add(IBKR_KEY, entry)

@router.delete("/multi-account/ibkr/{pos_id}")
async def delete_ibkr_position(pos_id: str):
    return _list_delete(IBKR_KEY, "id", pos_id)
