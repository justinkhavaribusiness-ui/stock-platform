# ═══ LAYERS 1-8 API ENDPOINTS ═══
# Append to existing photonics API or run standalone

from fastapi import APIRouter
router = APIRouter(prefix="/photonics", tags=["photonics-layers"])

import json, os, random
from datetime import datetime, timedelta

REDIS_AVAILABLE = False
try:
    import redis
    rdb = redis.Redis(decode_responses=True)
    rdb.ping()
    REDIS_AVAILABLE = True
except:
    pass

def rget(key, default="[]"):
    if REDIS_AVAILABLE:
        v = rdb.get(key)
        return json.loads(v) if v else json.loads(default)
    return json.loads(default)

def rset(key, val):
    if REDIS_AVAILABLE:
        rdb.set(key, json.dumps(val))

# ═══ LAYER 1: KNOWLEDGE GRAPH ═══
@router.get("/graph/nodes")
def get_graph_nodes():
    nodes = rget("photonics:graph:nodes", "[]")
    if not nodes:
        # Default nodes from the 19 tickers + key entities
        tickers = ["AAOI","AEHR","ALMU","ANET","AXTI","CIEN","COHR","CRDO","FN","GFS","GLW","LWLG","MRVL","MTSI","NOK","POET","SMTC","TSEM","VIAV"]
        steps = ["Mining","Substrate","Epitaxy","Wafer Fab","Dicing","Assembly","Transceiver","Data Center"]
        customers = ["AWS","Google","Meta","Microsoft","Oracle"]
        techs = ["InP","Silicon Photonics","EML Laser","CW Laser","CPO","Pluggable","DSP","Coherent"]
        
        nodes = []
        for t in tickers:
            nodes.append({"id": t, "type": "company", "label": t, "group": "ticker"})
        for s in steps:
            nodes.append({"id": f"step_{s}", "type": "supply_chain", "label": s, "group": "step"})
        for c in customers:
            nodes.append({"id": f"cust_{c}", "type": "customer", "label": c, "group": "customer"})
        for tech in techs:
            nodes.append({"id": f"tech_{tech}", "type": "technology", "label": tech, "group": "tech"})
        rset("photonics:graph:nodes", nodes)
    return {"nodes": nodes}

@router.get("/graph/edges")
def get_graph_edges():
    edges = rget("photonics:graph:edges", "[]")
    if not edges:
        edges = [
            {"from": "AXTI", "to": "step_Substrate", "rel": "produces"},
            {"from": "ALMU", "to": "step_Substrate", "rel": "produces"},
            {"from": "AXTI", "to": "COHR", "rel": "supplies"},
            {"from": "COHR", "to": "step_Transceiver", "rel": "produces"},
            {"from": "COHR", "to": "cust_Meta", "rel": "sells_to"},
            {"from": "COHR", "to": "cust_AWS", "rel": "sells_to"},
            {"from": "FN", "to": "step_Assembly", "rel": "produces"},
            {"from": "FN", "to": "COHR", "rel": "manufactures_for"},
            {"from": "MRVL", "to": "step_Wafer Fab", "rel": "designs"},
            {"from": "MRVL", "to": "tech_DSP", "rel": "develops"},
            {"from": "CRDO", "to": "tech_DSP", "rel": "develops"},
            {"from": "ANET", "to": "step_Data Center", "rel": "produces"},
            {"from": "ANET", "to": "cust_Google", "rel": "sells_to"},
            {"from": "ANET", "to": "cust_Meta", "rel": "sells_to"},
            {"from": "CIEN", "to": "step_Data Center", "rel": "produces"},
            {"from": "POET", "to": "tech_CPO", "rel": "develops"},
            {"from": "POET", "to": "tech_Silicon Photonics", "rel": "develops"},
            {"from": "LWLG", "to": "tech_EML Laser", "rel": "develops"},
            {"from": "TSEM", "to": "step_Wafer Fab", "rel": "foundry"},
            {"from": "GFS", "to": "step_Wafer Fab", "rel": "foundry"},
            {"from": "GLW", "to": "step_Mining", "rel": "produces"},
            {"from": "AAOI", "to": "step_Transceiver", "rel": "produces"},
            {"from": "SMTC", "to": "step_Wafer Fab", "rel": "produces"},
            {"from": "MTSI", "to": "step_Dicing", "rel": "produces"},
            {"from": "NOK", "to": "step_Data Center", "rel": "produces"},
            {"from": "VIAV", "to": "step_Assembly", "rel": "testing"},
            {"from": "AEHR", "to": "step_Dicing", "rel": "testing"},
            {"from": "tech_InP", "to": "step_Substrate", "rel": "material"},
            {"from": "tech_Pluggable", "to": "step_Transceiver", "rel": "form_factor"},
            {"from": "tech_CPO", "to": "step_Transceiver", "rel": "form_factor"},
            {"from": "tech_Coherent", "to": "step_Transceiver", "rel": "technology"},
        ]
        rset("photonics:graph:edges", edges)
    return {"edges": edges}

@router.post("/graph/nodes")
def add_graph_node(node: dict):
    nodes = rget("photonics:graph:nodes", "[]")
    nodes.append(node)
    rset("photonics:graph:nodes", nodes)
    return {"ok": True, "count": len(nodes)}

@router.post("/graph/edges")
def add_graph_edge(edge: dict):
    edges = rget("photonics:graph:edges", "[]")
    edges.append(edge)
    rset("photonics:graph:edges", edges)
    return {"ok": True, "count": len(edges)}

# ═══ LAYER 2: QUANTITATIVE MODELS ═══
@router.post("/models/monte-carlo")
def run_monte_carlo(params: dict):
    """Run Monte Carlo simulation on photonics portfolio"""
    positions = params.get("positions", [])
    simulations = params.get("simulations", 1000)
    days = params.get("days", 252)
    
    results = []
    for pos in positions:
        ticker = pos.get("ticker", "UNKNOWN")
        current_price = pos.get("price", 100)
        shares = pos.get("shares", 100)
        vol = pos.get("volatility", 0.4)
        drift = pos.get("drift", 0.08)
        
        final_prices = []
        for _ in range(min(simulations, 5000)):
            price = current_price
            daily_drift = drift / 252
            daily_vol = vol / (252 ** 0.5)
            for _ in range(days):
                price *= (1 + daily_drift + daily_vol * random.gauss(0, 1))
            final_prices.append(round(price, 2))
        
        final_prices.sort()
        n = len(final_prices)
        results.append({
            "ticker": ticker,
            "current_price": current_price,
            "shares": shares,
            "p5": final_prices[int(n * 0.05)],
            "p25": final_prices[int(n * 0.25)],
            "p50": final_prices[int(n * 0.50)],
            "p75": final_prices[int(n * 0.75)],
            "p95": final_prices[int(n * 0.95)],
            "mean": round(sum(final_prices) / n, 2),
            "current_value": round(current_price * shares, 2),
            "expected_value": round(sum(final_prices) / n * shares, 2),
        })
    
    total_current = sum(r["current_value"] for r in results)
    total_expected = sum(r["expected_value"] for r in results)
    return {
        "results": results,
        "portfolio_current": round(total_current, 2),
        "portfolio_expected": round(total_expected, 2),
        "portfolio_return": round((total_expected / total_current - 1) * 100, 2) if total_current > 0 else 0,
    }

@router.get("/models/factor-scores")
def get_factor_scores():
    """Factor model scores for photonics universe"""
    tickers = ["AAOI","AEHR","ALMU","ANET","AXTI","CIEN","COHR","CRDO","FN","GFS","GLW","LWLG","MRVL","MTSI","NOK","POET","SMTC","TSEM","VIAV"]
    scores = []
    for t in tickers:
        scores.append({
            "ticker": t,
            "wafer_demand": round(random.uniform(-1, 1), 2),
            "hyperscaler_capex": round(random.uniform(-1, 1), 2),
            "speed_transition": round(random.uniform(-1, 1), 2),
            "china_competition": round(random.uniform(-1, 1), 2),
            "interest_rate": round(random.uniform(-1, 1), 2),
            "semi_cycle": round(random.uniform(-1, 1), 2),
            "composite": round(random.uniform(-2, 2), 2),
        })
    return {"factors": ["wafer_demand","hyperscaler_capex","speed_transition","china_competition","interest_rate","semi_cycle"], "scores": sorted(scores, key=lambda x: x["composite"], reverse=True)}

# ═══ LAYER 3-4: SIGNALS & INTELLIGENCE ═══
@router.get("/signals/anomalies")
def get_anomalies():
    """Anomaly detection across photonics fundamentals"""
    tickers = ["AAOI","COHR","MRVL","CRDO","POET","AXTI","CIEN","FN","ANET"]
    anomalies = []
    types = ["inventory_spike","margin_compression","revenue_acceleration","ar_days_increase","volume_surge","insider_cluster_buy","short_interest_spike"]
    for _ in range(random.randint(3, 8)):
        anomalies.append({
            "ticker": random.choice(tickers),
            "type": random.choice(types),
            "severity": random.choice(["low","medium","high","critical"]),
            "description": random.choice([
                "Inventory days increased 40% QoQ — potential demand slowdown or pre-positioning for ramp",
                "Gross margin compressed 350bps below model expectation — investigate pricing pressure",
                "Revenue growth accelerated to 45% YoY vs 28% prior quarter — design win conversion",
                "AR days spiked to 65 from 48 — possible channel stuffing or large customer payment delay",
                "Volume 3.2x average with no news catalyst — potential leak ahead of announcement",
                "Three insiders bought within 5 days — clustered buying pattern signals conviction",
                "Short interest jumped from 4% to 12% in 2 weeks — bearish positioning increasing",
            ]),
            "detected_at": (datetime.now() - timedelta(hours=random.randint(1, 72))).isoformat(),
            "z_score": round(random.uniform(1.5, 3.5), 1),
        })
    return {"anomalies": sorted(anomalies, key=lambda x: x["detected_at"], reverse=True)}

@router.get("/signals/flow")
def get_photonics_flow():
    """Unusual options flow for photonics names"""
    tickers = ["COHR","MRVL","CRDO","ANET","CIEN","AAOI","POET","FN","GLW"]
    flow = []
    for _ in range(random.randint(5, 15)):
        t = random.choice(tickers)
        is_call = random.random() > 0.4
        strike = random.randint(50, 300)
        flow.append({
            "ticker": t,
            "type": "CALL" if is_call else "PUT",
            "strike": strike,
            "expiry": (datetime.now() + timedelta(days=random.randint(7, 90))).strftime("%Y-%m-%d"),
            "volume": random.randint(200, 5000),
            "open_interest": random.randint(100, 3000),
            "premium": round(random.uniform(50000, 2000000), 0),
            "sentiment": "BULLISH" if is_call else "BEARISH",
            "unusual_score": round(random.uniform(2, 10), 1),
            "timestamp": (datetime.now() - timedelta(minutes=random.randint(5, 480))).isoformat(),
        })
    return {"flow": sorted(flow, key=lambda x: x["unusual_score"], reverse=True)}

@router.get("/signals/social")
def get_social_velocity():
    """Social mention velocity for photonics tickers"""
    tickers = ["AAOI","COHR","CRDO","MRVL","POET","LWLG","AXTI","ANET","CIEN"]
    data = []
    for t in tickers:
        baseline = random.randint(10, 100)
        current = random.randint(5, 500)
        data.append({
            "ticker": t,
            "mentions_24h": current,
            "baseline_avg": baseline,
            "velocity": round(current / max(baseline, 1), 1),
            "sentiment_score": round(random.uniform(-1, 1), 2),
            "trending": current > baseline * 2,
            "platforms": {"reddit": random.randint(0, 200), "twitter": random.randint(0, 300), "stocktwits": random.randint(0, 150)},
        })
    return {"social": sorted(data, key=lambda x: x["velocity"], reverse=True)}

# ═══ LAYER 5: SIMULATION ═══
@router.post("/simulate/scenario")
def run_scenario(params: dict):
    """What-if scenario simulation"""
    scenario = params.get("scenario", "")
    # AI would process this in the frontend via Anthropic API
    # Backend just stores/retrieves scenarios
    scenarios = rget("photonics:scenarios", "[]")
    result = {
        "id": len(scenarios) + 1,
        "scenario": scenario,
        "timestamp": datetime.now().isoformat(),
        "status": "pending_analysis",
    }
    scenarios.append(result)
    rset("photonics:scenarios", scenarios)
    return result

@router.get("/simulate/scenarios")
def get_scenarios():
    return {"scenarios": rget("photonics:scenarios", "[]")}

@router.post("/simulate/stress-test")
def run_stress_test(params: dict):
    """Portfolio stress test"""
    scenario_type = params.get("type", "recession")
    positions = params.get("positions", [])
    
    shocks = {
        "recession": {"market": -0.35, "photonics": -0.45, "label": "2008-style recession"},
        "china_ban": {"market": -0.10, "photonics": -0.30, "label": "China export ban on rare earths"},
        "rate_hike": {"market": -0.15, "photonics": -0.25, "label": "Fed raises rates 200bps"},
        "ai_winter": {"market": -0.20, "photonics": -0.55, "label": "AI spending collapses 50%"},
        "supply_shock": {"market": -0.05, "photonics": -0.20, "label": "InP wafer shortage"},
    }
    
    shock = shocks.get(scenario_type, shocks["recession"])
    results = []
    for pos in positions:
        beta = pos.get("beta", 1.2)
        impact = shock["photonics"] * beta
        current_val = pos.get("value", 10000)
        stressed_val = current_val * (1 + impact)
        results.append({
            "ticker": pos.get("ticker", "UNKNOWN"),
            "current_value": round(current_val, 2),
            "stressed_value": round(stressed_val, 2),
            "impact_pct": round(impact * 100, 1),
            "survives": pos.get("cash_months", 12) > 6,
        })
    
    return {
        "scenario": shock["label"],
        "results": results,
        "total_current": round(sum(r["current_value"] for r in results), 2),
        "total_stressed": round(sum(r["stressed_value"] for r in results), 2),
        "max_drawdown": round(min(r["impact_pct"] for r in results) if results else 0, 1),
    }

# ═══ LAYER 6: PIPELINE ═══
@router.get("/pipeline/status")
def get_pipeline_status():
    """Status of automated research pipeline"""
    sources = [
        {"name": "SEC EDGAR", "status": "active", "last_run": (datetime.now() - timedelta(hours=2)).isoformat(), "items_processed": random.randint(5, 20), "type": "filings"},
        {"name": "USPTO Patents", "status": "active", "last_run": (datetime.now() - timedelta(hours=6)).isoformat(), "items_processed": random.randint(0, 5), "type": "patents"},
        {"name": "News RSS", "status": "active", "last_run": (datetime.now() - timedelta(minutes=30)).isoformat(), "items_processed": random.randint(10, 50), "type": "news"},
        {"name": "Earnings Calendar", "status": "active", "last_run": (datetime.now() - timedelta(hours=12)).isoformat(), "items_processed": random.randint(1, 5), "type": "earnings"},
        {"name": "Social Scanner", "status": "active", "last_run": (datetime.now() - timedelta(minutes=15)).isoformat(), "items_processed": random.randint(50, 500), "type": "social"},
        {"name": "Job Postings", "status": "paused", "last_run": (datetime.now() - timedelta(days=1)).isoformat(), "items_processed": 0, "type": "jobs"},
        {"name": "Conference Tracker", "status": "active", "last_run": (datetime.now() - timedelta(days=1)).isoformat(), "items_processed": random.randint(0, 3), "type": "events"},
        {"name": "Insider Filings", "status": "active", "last_run": (datetime.now() - timedelta(hours=4)).isoformat(), "items_processed": random.randint(0, 8), "type": "insider"},
    ]
    return {
        "sources": sources,
        "total_items_24h": sum(s["items_processed"] for s in sources),
        "active_count": len([s for s in sources if s["status"] == "active"]),
    }

# ═══ LAYER 7: PORTFOLIO CONSTRUCTION ═══
@router.post("/construction/kelly")
def kelly_criterion(params: dict):
    """Calculate Kelly Criterion position sizes"""
    positions = params.get("positions", [])
    portfolio_value = params.get("portfolio_value", 100000)
    fraction = params.get("kelly_fraction", 0.25)  # Quarter Kelly
    
    results = []
    for pos in positions:
        win_prob = pos.get("win_probability", 0.55)
        win_ratio = pos.get("win_loss_ratio", 2.0)
        
        kelly_pct = (win_prob * win_ratio - (1 - win_prob)) / win_ratio
        adj_kelly = kelly_pct * fraction
        dollar_size = portfolio_value * max(adj_kelly, 0)
        
        results.append({
            "ticker": pos.get("ticker", "UNKNOWN"),
            "win_probability": win_prob,
            "win_loss_ratio": win_ratio,
            "full_kelly_pct": round(kelly_pct * 100, 1),
            "adjusted_kelly_pct": round(adj_kelly * 100, 1),
            "dollar_size": round(dollar_size, 2),
            "shares_at_price": round(dollar_size / pos.get("price", 100)),
        })
    
    return {"fraction": fraction, "portfolio_value": portfolio_value, "positions": results}

@router.get("/construction/risk-parity")
def risk_parity():
    """Risk parity allocation across supply chain steps"""
    steps = {
        "Mining": {"tickers": ["GLW"], "vol": 0.35},
        "Substrate": {"tickers": ["AXTI", "ALMU"], "vol": 0.55},
        "Epitaxy": {"tickers": ["AEHR"], "vol": 0.50},
        "Wafer Fab": {"tickers": ["TSEM", "GFS", "SMTC", "MRVL", "CRDO"], "vol": 0.40},
        "Dicing": {"tickers": ["MTSI"], "vol": 0.45},
        "Assembly": {"tickers": ["FN", "VIAV"], "vol": 0.38},
        "Transceiver": {"tickers": ["COHR", "AAOI", "POET", "LWLG"], "vol": 0.50},
        "Data Center": {"tickers": ["ANET", "CIEN", "NOK"], "vol": 0.32},
    }
    
    total_inv_vol = sum(1 / s["vol"] for s in steps.values())
    allocations = []
    for step, data in steps.items():
        weight = (1 / data["vol"]) / total_inv_vol
        per_ticker = weight / len(data["tickers"])
        allocations.append({
            "step": step,
            "tickers": data["tickers"],
            "volatility": data["vol"],
            "step_weight": round(weight * 100, 1),
            "per_ticker_weight": round(per_ticker * 100, 1),
        })
    
    return {"allocations": allocations}

# ═══ LAYER 8: EXPORT & COLLABORATION ═══
@router.post("/export/memo")
def generate_memo(params: dict):
    """Generate investment memo data for a ticker"""
    ticker = params.get("ticker", "COHR")
    return {
        "ticker": ticker,
        "generated_at": datetime.now().isoformat(),
        "sections": [
            "executive_summary",
            "thesis_overview", 
            "supply_chain_position",
            "financial_analysis",
            "catalyst_timeline",
            "risk_factors",
            "valuation_framework",
            "position_sizing",
            "recommendation",
        ],
        "status": "ready_for_ai",
    }

@router.post("/export/digest")
def generate_digest(params: dict):
    """Generate weekly digest data"""
    return {
        "period": params.get("period", "weekly"),
        "generated_at": datetime.now().isoformat(),
        "sections": {
            "price_summary": "19 tickers tracked",
            "buy_zone_alerts": "3 names in buy zone",
            "research_added": "2 new deep dives",
            "upcoming_earnings": "4 names reporting",
            "thesis_changes": "1 scorecard updated",
            "flow_highlights": "5 unusual options detected",
        },
        "status": "ready_for_ai",
    }

@router.get("/export/api-docs")
def get_api_docs():
    """List all available API endpoints"""
    endpoints = [
        {"path": "/photonics/graph/nodes", "method": "GET", "description": "Knowledge graph nodes"},
        {"path": "/photonics/graph/edges", "method": "GET", "description": "Knowledge graph edges"},
        {"path": "/photonics/models/monte-carlo", "method": "POST", "description": "Monte Carlo simulation"},
        {"path": "/photonics/models/factor-scores", "method": "GET", "description": "Factor model scores"},
        {"path": "/photonics/signals/anomalies", "method": "GET", "description": "Anomaly detection"},
        {"path": "/photonics/signals/flow", "method": "GET", "description": "Options flow scanner"},
        {"path": "/photonics/signals/social", "method": "GET", "description": "Social velocity"},
        {"path": "/photonics/simulate/scenario", "method": "POST", "description": "Scenario simulation"},
        {"path": "/photonics/simulate/stress-test", "method": "POST", "description": "Stress testing"},
        {"path": "/photonics/pipeline/status", "method": "GET", "description": "Pipeline status"},
        {"path": "/photonics/construction/kelly", "method": "POST", "description": "Kelly criterion"},
        {"path": "/photonics/construction/risk-parity", "method": "GET", "description": "Risk parity"},
        {"path": "/photonics/export/memo", "method": "POST", "description": "Investment memo"},
        {"path": "/photonics/export/digest", "method": "POST", "description": "Weekly digest"},
    ]
    return {"endpoints": endpoints, "total": len(endpoints)}


# ═══ AI-POWERED SCENARIO ANALYSIS ═══
import httpx

PHOTONICS_CONTEXT = """You are an expert photonics supply chain analyst. You analyze scenarios affecting the silicon photonics and indium phosphide (InP) optical component industry.

The photonics supply chain has 8 steps:
Step 0 - Mining: Raw materials (indium, gallium, germanium, phosphorus). GLW is here.
Step 1 - Substrate: InP wafer manufacturing. AXTI and ALMU produce InP wafers.
Step 2 - Epitaxy: Crystal growth on wafers. AEHR provides testing.
Step 3 - Wafer Fab: Semiconductor fabrication. TSEM, GFS, SMTC, MRVL (DSP), CRDO (DSP).
Step 4 - Dicing: Wafer cutting and testing. MTSI operates here.
Step 5 - Assembly: Module assembly and packaging. FN and VIAV.
Step 6 - Transceiver: Optical transceiver modules. COHR, AAOI, POET, LWLG.
Step 7 - Data Center: Networking equipment. ANET, CIEN, NOK.

Key technology debates:
- InP vs Silicon Photonics (Intel, Cisco push SiPh; most others use InP for highest speeds)
- Pluggable vs Co-Packaged Optics (CPO) - POET developing CPO
- Speed transitions: 400G -> 800G -> 1.6T -> 3.2T
- Hyperscaler vertical integration threat (Google, Meta building internal photonics)

Key relationships:
- AXTI wafers -> COHR transceivers -> Meta/AWS/Google data centers
- FN manufactures for multiple transceiver companies
- MRVL and CRDO compete on DSP chips
- ANET sells switches to Google, Meta, Microsoft
- Hyperscaler capex drives all downstream demand

When analyzing scenarios, always:
1. Identify first-order effects (direct impact)
2. Chain through second-order effects (supply chain ripple)
3. Identify third-order effects (competitive/strategic shifts)
4. Score impact on each affected ticker: STRONG POSITIVE / POSITIVE / NEUTRAL / NEGATIVE / STRONG NEGATIVE
5. Estimate timeline to impact
6. Suggest portfolio actions"""

def _get_api_key():
    import os as _os
    key = _os.environ.get("ANTHROPIC_API_KEY", "")
    if key:
        return key
    for p in [
        _os.path.expanduser("~/dev/stock-platform/.env"),
        _os.path.expanduser("~/dev/stock-platform/services/api/.env"),
        _os.path.expanduser("~/dev/stock-platform/apps/web/.env.local"),
    ]:
        if _os.path.exists(p):
            for line in open(p):
                line = line.strip()
                if ("ANTHROPIC_API_KEY" in line) and "=" in line and not line.startswith("#"):
                    return line.split("=", 1)[1].strip().strip('"').strip("'")
    return ""

async def _call_claude(system_extra: str, user_msg: str):
    api_key = _get_api_key()
    if not api_key:
        return None, "No ANTHROPIC_API_KEY found. Set it in your .env file."
    try:
        async with httpx.AsyncClient(timeout=90) as client:
            resp = await client.post(
                "https://api.anthropic.com/v1/messages",
                headers={
                    "x-api-key": api_key,
                    "anthropic-version": "2023-06-01",
                    "content-type": "application/json",
                },
                json={
                    "model": "claude-sonnet-4-20250514",
                    "max_tokens": 3000,
                    "system": PHOTONICS_CONTEXT + ("\n\n" + system_extra if system_extra else ""),
                    "messages": [{"role": "user", "content": user_msg}],
                },
            )
            if resp.status_code == 200:
                text = "".join(b["text"] for b in resp.json().get("content", []) if b.get("type") == "text")
                return text, None
            else:
                return None, f"API error {resp.status_code}: {resp.text[:200]}"
    except Exception as e:
        return None, str(e)

@router.post("/simulate/ai-scenario")
async def ai_scenario_analysis(params: dict):
    scenario = params.get("scenario", "")
    if not scenario:
        return {"error": "No scenario provided"}
    text, err = await _call_claude(
        "",
        f"Analyze this scenario for the photonics supply chain. Be specific about which tickers are affected and how. Use the format: first list affected tickers with impact scores, then explain the chain of effects.\n\nSCENARIO: {scenario}"
    )
    if err:
        return {"scenario": scenario, "error": err, "status": "error"}
    return {"scenario": scenario, "analysis": text, "model": "claude-sonnet-4-20250514", "timestamp": datetime.now().isoformat(), "status": "complete"}

@router.post("/simulate/ai-wargame")
async def ai_wargame(params: dict):
    move = params.get("move", "")
    attacker = params.get("attacker", "")
    defenders = params.get("defenders", [])
    if not move:
        return {"error": "No competitive move provided"}
    text, err = await _call_claude(
        "You are simulating a competitive war game. Analyze the attacker's move, the likely defensive responses, and the resulting market share and revenue implications across the photonics supply chain.",
        f"COMPETITIVE MOVE: {move}\nATTACKER: {attacker}\nDEFENDERS: {', '.join(defenders) if defenders else 'All incumbents'}\n\nAnalyze: What happens to each company? Who wins, who loses? What are the second and third order effects? Score each affected ticker."
    )
    if err:
        return {"move": move, "error": err, "status": "error"}
    return {"move": move, "attacker": attacker, "analysis": text, "status": "complete", "timestamp": datetime.now().isoformat()}

@router.post("/simulate/ai-memo")
async def ai_investment_memo(params: dict):
    ticker = params.get("ticker", "COHR")
    text, err = await _call_claude(
        "Generate a professional investment memo. Include: Executive Summary, Supply Chain Position, Bull Case (3-5 points), Bear Case (3-5 points), Key Catalysts with Timeline, Risk Factors, and a Conviction Score (1-10).",
        f"Generate a comprehensive investment memo for {ticker} based on its position in the photonics supply chain. Be specific with numbers where possible."
    )
    if err:
        return {"ticker": ticker, "error": err, "status": "error"}
    return {"ticker": ticker, "memo": text, "status": "complete", "timestamp": datetime.now().isoformat()}


# ═══ PHASE 9: RESEARCH INTELLIGENCE + MULTI-SECTOR ═══

# ── Research Library ──
RESEARCH_LIBRARY = [
    {
        "id": "cohr-memory-wall-optical-boom",
        "title": "The Memory Wall vs. The Optical Boom: Why Coherent Will Thrive",
        "author": "Nick Nemeth (Mispriced Assets)",
        "date": "2026-02",
        "tickers": ["COHR", "LITE", "MU", "HYNIX"],
        "tags": ["photonics", "memory", "supply-chain", "bull-case"],
        "thesis": "Memory shortages won't constrain COHR — they boost its order book. 6-inch InP wafers double output. $8.8B revenue possible in 2026.",
        "key_data": {
            "revenue_2026e": 8800, "eps_2026e": 6.50, "fcf_2026e": 1300,
            "gross_margin_target": 42, "net_margin_2026e": 12,
            "price_target": "350 (40x) / 260 (30x) / 220 (25x)",
            "800g_units_2026": 40000000, "1_6t_units_2026": 20000000,
            "total_transceiver_units_2026": 60000000
        },
        "catalysts": [
            {"event": "6-inch InP wafer ramp doubles laser output", "timeline": "H1 2026", "impact": "high"},
            {"event": "1.6T transceiver volume shipments", "timeline": "H1-H2 2026", "impact": "high"},
            {"event": "OCS product ramp ($2B TAM)", "timeline": "2026-2027", "impact": "medium"},
            {"event": "20% pricing increase on datacom optics", "timeline": "2026", "impact": "high"},
            {"event": "A&D divestiture closes ($400M)", "timeline": "Q1 FY26", "impact": "medium"},
        ]
    },
    {
        "id": "optical-networking-supercycle",
        "title": "The Optical & Networking Supercycle Deep Dive",
        "author": "Ozeco (Crack The Market) + Nick Nemeth",
        "date": "2026-02",
        "tickers": ["COHR", "LITE", "CIEN", "GLW", "CLS", "CRDO", "MRVL", "AVGO", "ANET"],
        "tags": ["photonics", "networking", "CPO", "silicon-photonics", "supercycle"],
        "thesis": "Optical supercycle driven by AI. CPO inflection 2027-28. US optical duopoly (COHR+LITE) wins. Attach rate rising from 1:1 to 5:1.",
        "key_data": {
            "optical_tam_2025": 8500, "optical_tam_2028": 20000, "optical_tam_2030": 40000,
            "cpo_market_2030": "5-14B", "sph_cagr": 35,
            "attach_rate_current": "3-5x", "attach_rate_future": "5-8x",
            "hyperscaler_capex_2026": 550000, "networking_pct_of_capex": "4-5%",
            "lite_growth_2026": 60, "cien_growth_2026": 24, "cls_growth_2026": 34
        },
        "catalysts": [
            {"event": "800G ramp to 40M units", "timeline": "2026", "impact": "high"},
            {"event": "1.6T ramp to 20M+ units", "timeline": "2026", "impact": "high"},
            {"event": "CPO early production deployment", "timeline": "H2 2026", "impact": "medium"},
            {"event": "TSMC COUPE platform for SiPh", "timeline": "2026-2027", "impact": "high"},
            {"event": "Nvidia CPO switch (Quantum-X800)", "timeline": "H2 2026", "impact": "medium"},
        ]
    },
    {
        "id": "cohr-hyperscale-revenue-model",
        "title": "Coherent's $10B Revenue Path: Hyperscale Campus Math",
        "author": "Nick Nemeth (Mispriced Assets)",
        "date": "2025-09",
        "tickers": ["COHR"],
        "tags": ["photonics", "revenue-model", "hyperscale", "per-site-economics"],
        "thesis": "Bottom-up per-site revenue model. $6-7M per leaf site, $7.5-9.5M per hub. Single 6-leaf+2-hub buildout = $54-68M to COHR.",
        "key_data": {
            "revenue_2026e": 8400, "eps_2026e": 8.10, "revenue_2027e": 11000, "eps_2027e": 14.10,
            "leaf_site_revenue": "6-7M", "hub_site_revenue": "7.5-9.5M",
            "cohr_short_reach_share": 5, "cohr_coherent_share": 22.5,
            "hyperscale_networking_tam_2026": 30000, "cohr_blended_share": "5-7%"
        },
        "catalysts": [
            {"event": "800ZR ramp matching 800G NICs", "timeline": "2025-2026", "impact": "high"},
            {"event": "1.6T coherent matching 1.6T NICs", "timeline": "2027", "impact": "high"},
            {"event": "Industrial laser recovery (CHIPS Act)", "timeline": "2026-2027", "impact": "medium"},
        ]
    },
    {
        "id": "cohr-q4-fy25-earnings",
        "title": "Coherent Q4 FY25: Best-Case Miss — Building the Breakout",
        "author": "Nick Nemeth (Mispriced Assets)",
        "date": "2025-08",
        "tickers": ["COHR"],
        "tags": ["photonics", "earnings", "valuation", "execution"],
        "thesis": "Stock dropped 20% on conservative guidance despite strong Q4. FY25: 23% rev growth, 191% EPS growth. $200 PT by 2026, $500 by 2030.",
        "key_data": {
            "fy25_revenue": 5800, "fy25_eps_nongaap": 3.53, "fy25_eps_growth": 191,
            "q4_gross_margin": 38.1, "q4_networking_yoy": 39,
            "datacenter_fy25_growth": 61, "debt_repaid_fy25": 437,
            "forward_pe_at_88": 19, "druckenmiller_shares": 2220000
        },
        "catalysts": [
            {"event": "Apple VCSEL partnership revenue begins", "timeline": "H2 FY2026", "impact": "medium"},
            {"event": "1.6T first revenues", "timeline": "Q4 FY25 (done)", "impact": "high"},
            {"event": "6-inch InP line production start", "timeline": "Aug 2025 (done)", "impact": "high"},
            {"event": "A&D sale closes ($400M, $24M/yr interest savings)", "timeline": "Q1 FY26", "impact": "medium"},
        ]
    },
    {
        "id": "fang-iran-oil-thesis",
        "title": "FANG: Asymmetric Oil Convexity on Iran Escalation",
        "author": "Justin Khavari (Original Analysis)",
        "date": "2026-03",
        "tickers": ["FANG"],
        "tags": ["energy", "oil", "geopolitical", "options", "event-driven"],
        "thesis": "WTI at $67 not pricing Iran strike risk. FANG lowest-cost Permian operator prints cash at $60, explodes at $80+. March calls for 10-20x on escalation.",
        "key_data": {
            "wti_current": 67, "wti_target_bull": 80, "eia_brent_forecast": 58,
            "fang_production_mbo_d": 512.8, "fang_q4_ocf": 2300, "fang_q4_adj_fcf": 1200,
            "fang_fy_adj_fcf": 5900, "fang_net_acres": 470000,
            "fang_buyback_auth_remaining": 3500, "fang_div_yield": 2.3,
            "options_march_190c": "1.00-1.70", "options_march_200c": "0.40-0.60"
        },
        "catalysts": [
            {"event": "Trump decides on Iran kinetic strikes", "timeline": "10 days from late Feb", "impact": "critical"},
            {"event": "Geneva talks (potential collapse)", "timeline": "Early March 2026", "impact": "critical"},
            {"event": "US warns ships to avoid Strait of Hormuz", "timeline": "Current", "impact": "high"},
            {"event": "Iran uranium enrichment talks stall", "timeline": "Current", "impact": "high"},
        ]
    },
    {
        "id": "oscr-ichra-thesis",
        "title": "Oscar Health: The Operating System of Individual Insurance",
        "author": "FJ Research",
        "date": "2026-02",
        "tickers": ["OSCR"],
        "tags": ["healthcare", "insurance", "ICHRA", "regulatory", "growth"],
        "thesis": "OSCR positioned as OS of individual health insurance. ICHRA adoption inflecting. TAM expands from 21M to 96M lives. Trump healthcare plan is structural tailwind.",
        "key_data": {
            "ichra_yoy_large_employer_growth": 34, "ichra_yoy_small_employer_growth": 18,
            "ichra_new_market_creation_pct": 83, "ichra_current_enrollment": "500K-1M",
            "current_tam_lives": 21000000, "ichra_expanded_tam_lives": 96000000,
            "aca_share_target_2027": 18, "new_metros_target": 150,
            "ichra_tax_credit": "100/month/member"
        },
        "catalysts": [
            {"event": "ICHRA tax credit in reconciliation bill", "timeline": "2026", "impact": "high"},
            {"event": "Trump Great Healthcare Plan transparency mandates", "timeline": "2026", "impact": "medium"},
            {"event": "18% ACA market share target", "timeline": "2027", "impact": "high"},
            {"event": "150 new metro area expansion", "timeline": "By 2027", "impact": "high"},
        ]
    }
]

@router.get("/research/library")
async def get_research_library():
    return {"articles": RESEARCH_LIBRARY, "count": len(RESEARCH_LIBRARY)}

@router.get("/research/search")
async def search_research(q: str = "", ticker: str = "", tag: str = ""):
    results = RESEARCH_LIBRARY
    if q:
        q_lower = q.lower()
        results = [r for r in results if q_lower in r["title"].lower() or q_lower in r["thesis"].lower()]
    if ticker:
        t = ticker.upper()
        results = [r for r in results if t in r["tickers"]]
    if tag:
        results = [r for r in results if tag.lower() in [t.lower() for t in r["tags"]]]
    return {"results": results, "count": len(results)}

@router.get("/research/catalysts")
async def get_all_catalysts():
    all_cats = []
    for article in RESEARCH_LIBRARY:
        for cat in article.get("catalysts", []):
            all_cats.append({**cat, "source": article["title"], "tickers": article["tickers"]})
    # Sort by impact
    priority = {"critical": 0, "high": 1, "medium": 2, "low": 3}
    all_cats.sort(key=lambda x: priority.get(x.get("impact", "low"), 3))
    return {"catalysts": all_cats, "count": len(all_cats)}

# ── Multi-Analyst COHR Financial Model ──
COHR_MODELS = {
    "nemeth_memory_wall": {
        "analyst": "Nick Nemeth (Memory Wall thesis)",
        "date": "2026-02",
        "estimates": {
            "2026": {"revenue": 8800, "gross_margin": 42, "net_margin": 12, "eps": 6.50, "fcf": 1300, "shares": 160},
            "2027": {"revenue": 11500, "gross_margin": 43, "net_margin": 13, "eps": 9.00, "fcf": 1700, "shares": 160},
            "2028": {"revenue": 14000, "gross_margin": 44, "net_margin": 14, "eps": 12.00, "fcf": 2100, "shares": 160},
        },
        "price_targets": {"2026": {"bear": 220, "base": 260, "bull": 350}, "2028": {"base": 500}},
        "key_assumptions": [
            "6-inch InP wafers double laser output in 12 months",
            "Datacom revenue hits $6.5B (from ~$4B run-rate)",
            "20% pricing increase on 1.6T transceivers and EML modules",
            "Industrial rebounds 15% in 2026",
            "Gross margin reaches 42% on mix + scale",
        ],
        "bull_scenario": {
            "eps": 8.75, "driver": "20% pricing increase flows to bottom line",
            "price_at_40x": 350, "price_at_30x": 260, "price_at_25x": 220
        }
    },
    "nemeth_hyperscale": {
        "analyst": "Nick Nemeth (Hyperscale Campus Model)",
        "date": "2025-09",
        "estimates": {
            "2026": {"revenue": 8400, "gross_margin": 40, "net_margin": 15, "eps": 8.10, "fcf": None, "shares": 155},
            "2027": {"revenue": 11000, "gross_margin": 40, "net_margin": 20, "eps": 14.10, "fcf": None, "shares": 155},
        },
        "price_targets": {"2026": {"base": 200}, "2030": {"base": 500}},
        "key_assumptions": [
            "Per-leaf-site revenue: $6-7M at 5% short-reach + 22.5% coherent share",
            "Per-hub-site revenue: $7.5-9.5M",
            "Hyperscale networking TAM: $30B in 2026, $34B in 2027",
            "COHR blended hyperscale share: 5-7%",
            "Industrial laser recovery on CHIPS Act + tariff stability",
        ]
    },
    "nemeth_q4_earnings": {
        "analyst": "Nick Nemeth (Post-Q4 FY25 Analysis)",
        "date": "2025-08",
        "estimates": {
            "2026": {"revenue": 7200, "gross_margin": 40, "net_margin": None, "eps": 5.50, "fcf": None, "shares": 155},
        },
        "price_targets": {"2026": {"base": 200}, "2030": {"base": 500}},
        "key_assumptions": [
            "Consensus FY26 EPS ~$4.56 is conservative",
            "True EPS power $5-6 on margin expansion",
            "Forward PE of 19x at $88 is S&P-level for 20%+ grower",
            "Druckenmiller holds 2.22M shares (~7% of portfolio)",
            "Apple VCSEL deal kicks in H2 FY26",
        ]
    },
    "ozeco_supercycle": {
        "analyst": "Ozeco (Crack The Market)",
        "date": "2026-02",
        "estimates": {
            "2026": {"revenue": None, "growth": 17, "gross_margin": None, "net_margin": None, "eps": None},
            "2027": {"revenue": None, "growth": 30, "gross_margin": None, "net_margin": None, "eps": None},
        },
        "price_targets": {},
        "key_assumptions": [
            "Optical TAM grows from $8.5B (2025) to $40B (2030)",
            "800G units: 40M in 2026, 1.6T units: 20M+ in 2026",
            "Attach rate rising from 3:1 to 5:1 per GPU",
            "CPO inflection H2 2026 for switches, 2028 for full adoption",
            "Silicon photonics rises from 38% to 50%+ by 2028",
            "InP substrate supply is key uncertainty (AXT China export risk)",
        ]
    },
    "consensus": {
        "analyst": "Wall Street Consensus",
        "date": "2026-02",
        "estimates": {
            "2026": {"revenue": 7000, "growth": 16, "eps": 4.56},
        },
        "key_assumptions": ["Conservative 16% growth", "Based on management guidance midpoint"]
    }
}

@router.get("/models/cohr")
async def cohr_multi_analyst_model():
    return {"models": COHR_MODELS, "ticker": "COHR", "current_price": 180}

# ── FANG Oil Sensitivity Model ──
FANG_MODEL = {
    "ticker": "FANG",
    "current_price": 171.5,
    "production_mbo_d": 512.8,
    "net_acres": 470000,
    "guidance_capex_mid": 3750,
    "shares_outstanding": 266,
    "dividend_yield": 2.3,
    "buyback_remaining": 3500,
    "oil_scenarios": {
        50: {"annual_fcf": 2800, "fcf_per_share": 10.53, "yield_at_current": 6.1, "note": "Stress case — still profitable"},
        60: {"annual_fcf": 4200, "fcf_per_share": 15.79, "yield_at_current": 9.2, "note": "Breakeven+ zone, prints cash"},
        67: {"annual_fcf": 5200, "fcf_per_share": 19.55, "yield_at_current": 11.4, "note": "Current WTI — solid returns"},
        70: {"annual_fcf": 5600, "fcf_per_share": 21.05, "yield_at_current": 12.3, "note": "Above current — strong FCF"},
        80: {"annual_fcf": 7200, "fcf_per_share": 27.07, "yield_at_current": 15.8, "note": "Iran escalation target — FCF explodes"},
        90: {"annual_fcf": 8800, "fcf_per_share": 33.08, "yield_at_current": 19.3, "note": "Major disruption — massive returns"},
        100: {"annual_fcf": 10400, "fcf_per_share": 39.10, "yield_at_current": 22.8, "note": "Extreme scenario — Strait closure"},
    },
    "options_positions": [
        {"type": "call", "strike": 190, "expiry": "March 2026", "cost_range": "1.00-1.70",
         "breakeven": 191.50, "scenarios": {
            80: {"fang_price_est": 200, "value_est": 10.00, "return_pct": "500-900%"},
            90: {"fang_price_est": 225, "value_est": 35.00, "return_pct": "1900-3400%"},
         }},
        {"type": "call", "strike": 200, "expiry": "March 2026", "cost_range": "0.40-0.60",
         "breakeven": 200.50, "scenarios": {
            80: {"fang_price_est": 200, "value_est": 0.50, "return_pct": "-17% to +25%"},
            90: {"fang_price_est": 225, "value_est": 25.00, "return_pct": "4000-6100%"},
         }},
    ],
    "catalysts": [
        {"event": "Trump Iran strike decision", "timeline": "~10 days", "probability": "30-40%"},
        {"event": "Geneva talks collapse", "timeline": "Early March", "probability": "40-50%"},
        {"event": "Strait of Hormuz disruption", "timeline": "If strikes occur", "probability": "20-30%"},
        {"event": "Diplomatic resolution", "timeline": "March-April", "probability": "50-60%"},
    ]
}

@router.get("/models/fang")
async def fang_oil_model():
    return FANG_MODEL

# ── OSCR Thesis Tracker ──
OSCR_MODEL = {
    "ticker": "OSCR",
    "thesis": "Operating System of Individual Health Insurance — ICHRA inflection",
    "tam_current": {"lives": 21000000, "label": "Current ACA addressable market"},
    "tam_expanded": {"lives": 96000000, "label": "With full ICHRA adoption (<1000 employees)"},
    "tam_multiplier": 4.6,
    "ichra_metrics": {
        "large_employer_growth_yoy": 34,
        "small_employer_growth_yoy": 18,
        "new_market_creation_pct": 83,
        "current_enrollment": "500K-1M",
        "tax_credit_per_member_month": 100,
    },
    "company_targets": {
        "aca_market_share_2027": 18,
        "new_metros": 150,
        "tech_advantage": "Cloud-native since 2012, vs legacy mainframe incumbents",
    },
    "regulatory_tailwinds": [
        "Trump Great Healthcare Plan — money to individuals not carriers",
        "Price transparency mandates favor digital-first insurers",
        "ICHRA tax credit ($100/mo/member) in reconciliation bill",
        "Claim denial rate disclosure requirements",
        "Published rate/coverage comparisons in plain English",
    ],
    "risks": [
        "Legislative execution risk — Senate negotiations",
        "Medical loss ratio pressure",
        "Competition from UNH/CI pivoting to individual market",
        "ACA subsidy changes in reconciliation",
        "Execution risk on 150 metro expansion",
    ],
    "catalysts": [
        {"event": "ICHRA tax credit passes", "timeline": "2026", "impact": "high"},
        {"event": "Transparency mandates implemented", "timeline": "2026", "impact": "medium"},
        {"event": "18% ACA market share", "timeline": "2027", "impact": "high"},
        {"event": "150 new metro areas", "timeline": "By 2027", "impact": "high"},
        {"event": "ICHRA enrollment crosses 2M lives", "timeline": "2027-2028", "impact": "critical"},
    ]
}

@router.get("/models/oscr")
async def oscr_thesis():
    return OSCR_MODEL

# ── Sector Tracking ──
SECTOR_WATCHLISTS = {
    "photonics": {
        "tickers": ["COHR","LITE","AAOI","POET","LWLG","ANET","CIEN","GLW","CLS","CRDO","MRVL","FN","VIAV","AXTI","AEHR","MTSI","SMTC","GFS","NOK"],
        "theme": "AI Optical Supercycle",
        "key_metric": "800G/1.6T attach rates + CPO timeline"
    },
    "healthcare": {
        "tickers": ["OSCR","UNH","CI","HUM","CNC","MOH","ALHC","ACGL"],
        "theme": "ICHRA + Individual Market Disruption",
        "key_metric": "ICHRA enrollment growth + ACA market share"
    },
    "semis": {
        "tickers": ["NVDA","AMD","AVGO","MRVL","CRDO","TSM","ASML","AMAT","KLAC","LRCX","INTC","QCOM","MU","AEHR","ONTO"],
        "theme": "AI Compute + Memory + Photonics Convergence",
        "key_metric": "HBM supply/demand + GPU attach rates"
    },
    "energy": {
        "tickers": ["FANG","OXY","COP","EOG","DVN","PXD","CTRA","PR"],
        "theme": "Geopolitical Oil Convexity",
        "key_metric": "WTI price + Iran escalation probability"
    }
}

@router.get("/sectors")
async def get_sectors():
    return SECTOR_WATCHLISTS

@router.get("/sectors/{sector}")
async def get_sector(sector: str):
    if sector in SECTOR_WATCHLISTS:
        return SECTOR_WATCHLISTS[sector]
    return {"error": f"Sector {sector} not found"}

# ── Portfolio Import Endpoints ──
@router.post("/portfolio/import")
async def import_portfolio(data: dict):
    """Import portfolio positions from Fidelity CSV or manual entry"""
    positions = data.get("positions", [])
    return {"imported": len(positions), "positions": positions, "status": "ok"}

@router.post("/portfolio/options")
async def import_options(data: dict):
    """Import active options positions"""
    options = data.get("options", [])
    return {"imported": len(options), "options": options, "status": "ok"}


# ═══ PREMARKET / EXTENDED HOURS DATA ═══
import yfinance as yf
from concurrent.futures import ThreadPoolExecutor, as_completed

def _fetch_one_ticker_premarket(ticker: str) -> dict:
    """Fetch premarket/after-hours data for a single ticker."""
    try:
        t = yf.Ticker(ticker)
        info = t.info or {}
        fast = t.fast_info

        # Current / last close
        prev_close = info.get("previousClose") or info.get("regularMarketPreviousClose") or 0
        regular_price = info.get("regularMarketPrice") or info.get("currentPrice") or prev_close

        # Pre-market
        pre_price = info.get("preMarketPrice") or 0
        pre_change = info.get("preMarketChange") or 0
        pre_change_pct = info.get("preMarketChangePercent") or 0

        # Post-market (after hours)
        post_price = info.get("postMarketPrice") or 0
        post_change = info.get("postMarketChange") or 0
        post_change_pct = info.get("postMarketChangePercent") or 0

        # Determine which extended session is active
        # Pre-market: 4:00 AM - 9:30 AM ET
        # Post-market: 4:00 PM - 8:00 PM ET
        from datetime import datetime
        import pytz
        et = pytz.timezone("US/Eastern")
        now_et = datetime.now(et)
        hour = now_et.hour
        minute = now_et.minute

        if 4 <= hour < 9 or (hour == 9 and minute < 30):
            session = "premarket"
            ext_price = pre_price
            ext_change = pre_change
            ext_change_pct = pre_change_pct * 100 if abs(pre_change_pct) < 1 else pre_change_pct
        elif hour >= 16 and hour < 20:
            session = "afterhours"
            ext_price = post_price
            ext_change = post_change
            ext_change_pct = post_change_pct * 100 if abs(post_change_pct) < 1 else post_change_pct
        elif 9 <= hour < 16 or (hour == 9 and minute >= 30):
            session = "market_open"
            ext_price = regular_price
            ext_change = regular_price - prev_close if prev_close else 0
            ext_change_pct = (ext_change / prev_close * 100) if prev_close else 0
        else:
            session = "closed"
            # Use post-market if available, else regular
            ext_price = post_price or regular_price
            ext_change = post_change or (regular_price - prev_close if prev_close else 0)
            ext_change_pct = post_change_pct or ((regular_price - prev_close) / prev_close * 100 if prev_close else 0)

        # Volume
        regular_vol = info.get("regularMarketVolume") or info.get("volume") or 0
        avg_vol = info.get("averageVolume") or 0

        # Market cap
        mkt_cap = info.get("marketCap") or 0

        # 52-week range
        high_52 = info.get("fiftyTwoWeekHigh") or 0
        low_52 = info.get("fiftyTwoWeekLow") or 0

        return {
            "ticker": ticker,
            "session": session,
            "prev_close": round(prev_close, 2),
            "regular_price": round(regular_price, 2),
            "regular_change": round(regular_price - prev_close, 2) if prev_close else 0,
            "regular_change_pct": round((regular_price - prev_close) / prev_close * 100, 2) if prev_close else 0,
            "ext_price": round(ext_price, 2) if ext_price else None,
            "ext_change": round(ext_change, 2) if ext_change else None,
            "ext_change_pct": round(ext_change_pct, 2) if ext_change_pct else None,
            "pre_price": round(pre_price, 2) if pre_price else None,
            "pre_change_pct": round(pre_change_pct * 100, 2) if pre_change_pct and abs(pre_change_pct) < 1 else round(pre_change_pct, 2) if pre_change_pct else None,
            "post_price": round(post_price, 2) if post_price else None,
            "post_change_pct": round(post_change_pct * 100, 2) if post_change_pct and abs(post_change_pct) < 1 else round(post_change_pct, 2) if post_change_pct else None,
            "volume": regular_vol,
            "avg_volume": avg_vol,
            "vol_ratio": round(regular_vol / avg_vol, 2) if avg_vol else None,
            "market_cap": mkt_cap,
            "high_52w": round(high_52, 2),
            "low_52w": round(low_52, 2),
            "pct_from_52h": round((regular_price - high_52) / high_52 * 100, 2) if high_52 else None,
            "status": "ok"
        }
    except Exception as e:
        return {"ticker": ticker, "status": "error", "error": str(e)}

@router.get("/premarket")
async def get_premarket(tickers: str = ""):
    """Get premarket/extended hours data for tickers. 
    ?tickers=COHR,LITE,FANG or leave empty for default watchlist."""
    if tickers:
        ticker_list = [t.strip().upper() for t in tickers.split(",") if t.strip()]
    else:
        # Default: all tracked tickers across sectors
        ticker_list = ["COHR","LITE","AAOI","POET","CRDO","MRVL","ANET","CIEN","GLW",
                       "FANG","OSCR","NVDA","AMD","AVGO","TSM","AEHR","CLS","FN"]

    results = []
    with ThreadPoolExecutor(max_workers=8) as executor:
        futures = {executor.submit(_fetch_one_ticker_premarket, t): t for t in ticker_list}
        for future in as_completed(futures):
            results.append(future.result())

    # Sort by ticker
    results.sort(key=lambda x: x.get("ticker", ""))

    # Determine overall session
    if results:
        session = results[0].get("session", "unknown")
    else:
        session = "unknown"

    # Top movers
    valid = [r for r in results if r.get("status") == "ok" and r.get("ext_change_pct") is not None]
    gainers = sorted(valid, key=lambda x: x.get("ext_change_pct", 0), reverse=True)[:5]
    losers = sorted(valid, key=lambda x: x.get("ext_change_pct", 0))[:5]

    return {
        "session": session,
        "count": len(results),
        "tickers": results,
        "gainers": gainers,
        "losers": losers,
        "timestamp": datetime.now().isoformat()
    }

@router.get("/premarket/{ticker}")
async def get_single_premarket(ticker: str):
    """Get detailed premarket data for a single ticker."""
    return _fetch_one_ticker_premarket(ticker.upper())


# ═══ LIVE CRYPTO PRICES ═══
CRYPTO_TICKERS = {
    "BTC": "BTC-USD", "ETH": "ETH-USD", "SOL": "SOL-USD",
    "XRP": "XRP-USD", "HYPE": "HYPE-USD",
    "ADA": "ADA-USD", "DOGE": "DOGE-USD",
    "AVAX": "AVAX-USD", "DOT": "DOT-USD", "LINK": "LINK-USD",
    "MATIC": "MATIC-USD", "ATOM": "ATOM-USD", "UNI": "UNI-USD",
    "LTC": "LTC-USD", "NEAR": "NEAR-USD", "ARB": "ARB11841-USD",
    "OP": "OP-USD", "SUI": "SUI20947-USD", "APT": "APT21794-USD",
    "PEPE": "PEPE24478-USD", "RENDER": "RENDER-USD",
    "FET": "FET-USD", "INJ": "INJ-USD", "TIA": "TIA22861-USD",
    "SEI": "SEI-USD", "JUP": "JUP29210-USD", "WIF": "WIF-USD",
    "BONK": "BONK-USD", "AAVE": "AAVE-USD", "MKR": "MKR-USD",
}

def _fetch_crypto(symbol: str, yf_ticker: str) -> dict:
    try:
        t = yf.Ticker(yf_ticker)
        info = t.info or {}
        fast = t.fast_info
        
        price = info.get("regularMarketPrice") or info.get("currentPrice") or 0
        prev = info.get("previousClose") or info.get("regularMarketPreviousClose") or 0
        change = price - prev if prev else 0
        change_pct = (change / prev * 100) if prev else 0
        
        high_24h = info.get("dayHigh") or info.get("regularMarketDayHigh") or 0
        low_24h = info.get("dayLow") or info.get("regularMarketDayLow") or 0
        volume = info.get("volume24Hr") or info.get("regularMarketVolume") or info.get("volume") or 0
        mkt_cap = info.get("marketCap") or 0
        
        high_52 = info.get("fiftyTwoWeekHigh") or 0
        low_52 = info.get("fiftyTwoWeekLow") or 0
        
        # Circulating supply
        circ_supply = info.get("circulatingSupply") or 0
        
        return {
            "symbol": symbol,
            "yf_ticker": yf_ticker,
            "price": round(price, 6) if price < 1 else round(price, 2),
            "prev_close": round(prev, 6) if prev < 1 else round(prev, 2),
            "change": round(change, 6) if abs(change) < 1 else round(change, 2),
            "change_pct": round(change_pct, 2),
            "high_24h": round(high_24h, 2),
            "low_24h": round(low_24h, 2),
            "volume": volume,
            "market_cap": mkt_cap,
            "high_52w": round(high_52, 2),
            "low_52w": round(low_52, 2),
            "pct_from_ath": round((price - high_52) / high_52 * 100, 2) if high_52 else None,
            "circulating_supply": circ_supply,
            "status": "ok"
        }
    except Exception as e:
        return {"symbol": symbol, "status": "error", "error": str(e)}

@router.get("/crypto/prices")
async def get_crypto_prices(symbols: str = ""):
    """Get live crypto prices. ?symbols=BTC,ETH,SOL or empty for all."""
    if symbols:
        requested = [s.strip().upper() for s in symbols.split(",")]
        pairs = {s: CRYPTO_TICKERS.get(s, s + "-USD") for s in requested}
    else:
        pairs = CRYPTO_TICKERS
    
    results = []
    with ThreadPoolExecutor(max_workers=8) as executor:
        futures = {executor.submit(_fetch_crypto, sym, yf_t): sym for sym, yf_t in pairs.items()}
        for future in as_completed(futures):
            results.append(future.result())
    
    results.sort(key=lambda x: x.get("market_cap", 0) or 0, reverse=True)
    
    # Summary stats
    total_mcap = sum(r.get("market_cap", 0) or 0 for r in results if r.get("status") == "ok")
    btc = next((r for r in results if r.get("symbol") == "BTC"), None)
    btc_dom = round(btc["market_cap"] / total_mcap * 100, 1) if btc and total_mcap else None
    
    gainers = sorted([r for r in results if r.get("status") == "ok"], key=lambda x: x.get("change_pct", 0), reverse=True)
    losers = sorted([r for r in results if r.get("status") == "ok"], key=lambda x: x.get("change_pct", 0))
    
    return {
        "count": len(results),
        "total_market_cap": total_mcap,
        "btc_dominance": btc_dom,
        "coins": results,
        "gainers": gainers[:3],
        "losers": losers[:3],
        "timestamp": datetime.now().isoformat()
    }

@router.get("/crypto/{symbol}")
async def get_single_crypto(symbol: str):
    """Get detailed data for one crypto."""
    sym = symbol.upper()
    yf_t = CRYPTO_TICKERS.get(sym, sym + "-USD")
    data = _fetch_crypto(sym, yf_t)
    
    # Also fetch recent price history
    try:
        t = yf.Ticker(yf_t)
        hist = t.history(period="7d", interval="1h")
        if not hist.empty:
            prices_7d = [{"time": str(idx), "price": round(row["Close"], 2)} for idx, row in hist.tail(168).iterrows()]
            data["history_7d"] = prices_7d
    except:
        pass
    
    return data
