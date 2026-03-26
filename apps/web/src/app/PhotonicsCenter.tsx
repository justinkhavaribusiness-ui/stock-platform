"use client";
import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";

const BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001";
const API = `${BASE}/photonics`;

const PHOTONICS_SUBTABS = ["DASHBOARD", "WATCHLIST", "SUPPLY CHAIN", "RESEARCH", "AI ANALYST", "EARNINGS", "THESIS", "CATALYSTS", "TECHNICALS", "PORTFOLIO", "RS", "RISK", "NEWS", "ALERTS", "EDUCATION", "GRAPH","MODELS","SIGNALS","SIMULATE","PIPELINE","CONSTRUCT","EXPORT","COHR-MODEL","FANG","OSCR","SECTORS"];

const STEP_NAMES: Record<number, string> = {
  0: "Mining", 1: "Substrate", 2: "Epitaxy", 3: "Wafer Fab",
  4: "Dicing", 5: "Assembly", 6: "Transceiver", 7: "Data Center"
};

const DEFAULT_WATCHLIST_TICKERS = ["AAOI","AEHR","ALMU","ANET","AXTI","CIEN","COHR","CRDO","FN","GFS","GLW","LWLG","MRVL","MTSI","NOK","POET","SMTC","TSEM","VIAV"];

function getS(dark: boolean): Record<string, any> {
  const bg = dark ? "#161b22" : "#ffffff";
  const bgDeep = dark ? "#0d1117" : "#f8f9fb";
  const border = dark ? "#30363d" : "#e2e8f0";
  const text = dark ? "#e6edf3" : "#1a1a2e";
  const muted = dark ? "#8b949e" : "#64748b";
  const dim = dark ? "#484f58" : "#94a3b8";
  const btnBg = dark ? "#21262d" : "#f1f5f9";
  return {
    card: { background: bg, border: `1px solid ${border}`, borderRadius: 8, padding: 16, marginBottom: 12 },
    input: { background: bgDeep, border: `1px solid ${border}`, borderRadius: 6, padding: "8px 12px", color: text, fontFamily: "'DM Sans', sans-serif", fontSize: 13, width: "100%", outline: "none" },
    select: { background: bgDeep, border: `1px solid ${border}`, borderRadius: 6, padding: "8px 12px", color: text, fontFamily: "'DM Sans', sans-serif", fontSize: 13, outline: "none" },
    btn: { padding: "8px 16px", background: dark ? "#1a8c5e" : "#0d9f4f", color: "#fff", border: "none", borderRadius: 6, cursor: "pointer", fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: "bold" },
    btnSecondary: { padding: "8px 16px", background: btnBg, color: text, border: `1px solid ${border}`, borderRadius: 6, cursor: "pointer", fontFamily: "'DM Sans', sans-serif", fontSize: 13 },
    btnDanger: { padding: "6px 12px", background: "#c9362c", color: "#fff", border: "none", borderRadius: 6, cursor: "pointer", fontFamily: "'DM Sans', sans-serif", fontSize: 12 },
    btnSmall: { padding: "4px 10px", background: btnBg, color: muted, border: `1px solid ${border}`, borderRadius: 4, cursor: "pointer", fontFamily: "'DM Sans', sans-serif", fontSize: 11 },
    label: { color: muted, fontSize: 11, fontFamily: "'DM Sans', sans-serif", textTransform: "uppercase" as const, letterSpacing: 1, marginBottom: 4, display: "block" },
    green: dark ? "#2ea043" : "#0d9f4f", red: dark ? "#f85149" : "#dc2626", yellow: dark ? "#d29922" : "#d97706", blue: dark ? "#58a6ff" : "#2563eb", cyan: dark ? "#39d353" : "#0d9f4f", dim, text, muted,
    mono: { fontFamily: "'JetBrains Mono', 'Fira Code', 'SF Mono', monospace" },
    bg, bgDeep, border,
  };
}
let S = getS(true); // module-level, updated by PhotonicsCenter when dark prop changes

function ChartTooltip({ active, payload, label, dark = true }: any) {
  if (!active || !payload?.length) return null;
  const s = getS(dark);
  return (
    <div style={{ background: s.bg, border: `1px solid ${s.border}`, borderRadius: 6, padding: "8px 12px", fontSize: 11, fontFamily: "'DM Sans', sans-serif" }}>
      <div style={{ color: s.muted, marginBottom: 4 }}>{label}</div>
      {payload.map((p: any, i: number) => (
        <div key={i} style={{ color: p.color || s.text, fontWeight: "bold" }}>{p.name}: {typeof p.value === "number" ? p.value.toFixed(2) : p.value}</div>
      ))}
    </div>
  );
}


// ===========================================================
// // LAYER 1: KNOWLEDGE GRAPH
// ═══════════════════════════════════════════════════════════

function PremarketBanner() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);
  const [customTickers, setCustomTickers] = useState("");
  const [lastRefresh, setLastRefresh] = useState("");

  const fetchPremarket = (tickers?: string) => {
    setLoading(true);
    const url = tickers ? `${API}/premarket?tickers=${tickers}` : `${API}/premarket`;
    fetch(url).then(r => { if (!r.ok) throw new Error("endpoint not available"); return r.json(); }).then(d => {
      setData(d);
      setLastRefresh(new Date().toLocaleTimeString());
      setLoading(false);
    }).catch(() => setLoading(false));
  };

  useEffect(() => {
    fetchPremarket();
    // Auto-refresh every 30 seconds during premarket/market hours
    const interval = setInterval(() => fetchPremarket(), 30000);
    return () => clearInterval(interval);
  }, []);

  const sessionLabel: any = {
    premarket: "PRE-MARKET",
    afterhours: "AFTER HOURS", 
    market_open: "MARKET OPEN",
    closed: "MARKET CLOSED"
  };

  const sessionColor: any = {
    premarket: "#f59e0b",
    afterhours: "#8b5cf6",
    market_open: "#22c55e",
    closed: "#6b7280"
  };

  if (loading && !data) return <div style={{ ...S.card, textAlign: "center", color: S.muted, padding: 12 }}>Loading market data...</div>;
  if (!data) return null;

  const session = data.session || "unknown";

  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ ...S.card, padding: "8px 12px", borderLeft: "3px solid " + (sessionColor[session] || S.dim) }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: expanded ? 8 : 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ color: sessionColor[session] || S.dim, fontWeight: "bold", fontSize: 11, padding: "2px 8px", background: (sessionColor[session] || "#8b92a0") + "15", borderRadius: 3 }}>{sessionLabel[session] || session.toUpperCase()}</span>
            <span style={{ color: S.dim, fontSize: 10 }}>{lastRefresh && `Updated ${lastRefresh}`}</span>
            <button onClick={() => fetchPremarket()} style={{ background: "none", border: "none", color: S.blue, cursor: "pointer", fontSize: 10, fontFamily: "'DM Sans', sans-serif" }}>\u21BB REFRESH</button>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {!expanded && data.tickers && (
              <div style={{ display: "flex", gap: 6, overflow: "hidden", maxWidth: 600 }}>
                {data.tickers.filter((t: any) => t.status === "ok").slice(0, 10).map((t: any) => (
                  <span key={t.ticker} style={{ fontSize: 10, fontFamily: "'DM Sans', sans-serif", whiteSpace: "nowrap" }}>
                    <span style={{ color: S.text, fontWeight: "bold" }}>{t.ticker}</span>
                    <span style={{ color: (t.ext_change_pct || 0) >= 0 ? S.green : S.red, marginLeft: 3 }}>
                      {t.ext_price ? "$" + t.ext_price : "—"} {t.ext_change_pct != null ? ((t.ext_change_pct >= 0 ? "+" : "") + t.ext_change_pct.toFixed(1) + "%") : ""}
                    </span>
                  </span>
                ))}
              </div>
            )}
            <button onClick={() => setExpanded(!expanded)} style={{ background: "none", border: "none", color: S.muted, cursor: "pointer", fontSize: 12 }}>{expanded ? "\u25B2" : "\u25BC"}</button>
          </div>
        </div>

        {expanded && (
          <div>
            <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
              <input style={{ ...S.input, flex: 1, fontSize: 11 }} placeholder="Add tickers (comma-separated)..." value={customTickers} onChange={e => setCustomTickers(e.target.value)} onKeyDown={e => { if (e.key === "Enter") fetchPremarket(customTickers || undefined); }} />
              <button style={{ ...S.btn, fontSize: 10, padding: "4px 12px" }} onClick={() => fetchPremarket(customTickers || undefined)}>FETCH</button>
            </div>

            {data.gainers && data.gainers.length > 0 && (
              <div style={{ display: "flex", gap: 16, marginBottom: 8 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ color: S.green, fontSize: 10, fontWeight: "bold", marginBottom: 4 }}>TOP GAINERS</div>
                  {data.gainers.slice(0, 3).map((t: any) => (
                    <div key={t.ticker} style={{ display: "flex", justifyContent: "space-between", fontSize: 11, padding: "2px 0" }}>
                      <span style={{ color: S.text, fontWeight: "bold" }}>{t.ticker}</span>
                      <span style={{ color: S.green }}>+{(t.ext_change_pct || 0).toFixed(2)}%</span>
                    </div>
                  ))}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ color: S.red, fontSize: 10, fontWeight: "bold", marginBottom: 4 }}>TOP LOSERS</div>
                  {data.losers.slice(0, 3).map((t: any) => (
                    <div key={t.ticker} style={{ display: "flex", justifyContent: "space-between", fontSize: 11, padding: "2px 0" }}>
                      <span style={{ color: S.text, fontWeight: "bold" }}>{t.ticker}</span>
                      <span style={{ color: S.red }}>{(t.ext_change_pct || 0).toFixed(2)}%</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11, fontFamily: "'DM Sans', sans-serif" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid #30363d" }}>
                    {["Ticker", "Prev Close", "Price", "Chg", "Chg%", "Pre/AH", "Pre/AH%", "Volume", "Vol Ratio", "52w High", "% from 52H"].map(h => (
                      <th key={h} style={{ color: S.dim, fontWeight: "normal", padding: "4px 6px", textAlign: "right", whiteSpace: "nowrap" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.tickers?.filter((t: any) => t.status === "ok").map((t: any) => (
                    <tr key={t.ticker} style={{ borderBottom: "1px solid #21262d" }}>
                      <td style={{ padding: "6px", color: "#0d9f4f", fontWeight: "bold", textAlign: "left" }}>{t.ticker}</td>
                      <td style={{ padding: "6px", color: S.dim, textAlign: "right" }}>${t.prev_close}</td>
                      <td style={{ padding: "6px", color: S.text, fontWeight: "bold", textAlign: "right" }}>${t.regular_price}</td>
                      <td style={{ padding: "6px", color: t.regular_change >= 0 ? S.green : S.red, textAlign: "right" }}>{t.regular_change >= 0 ? "+" : ""}{t.regular_change}</td>
                      <td style={{ padding: "6px", color: t.regular_change_pct >= 0 ? S.green : S.red, textAlign: "right" }}>{t.regular_change_pct >= 0 ? "+" : ""}{t.regular_change_pct}%</td>
                      <td style={{ padding: "6px", color: (t.ext_change || 0) >= 0 ? S.green : S.red, fontWeight: "bold", textAlign: "right" }}>{t.ext_price ? "$" + t.ext_price : "—"}</td>
                      <td style={{ padding: "6px", color: (t.ext_change_pct || 0) >= 0 ? S.green : S.red, fontWeight: "bold", textAlign: "right" }}>{t.ext_change_pct != null ? ((t.ext_change_pct >= 0 ? "+" : "") + t.ext_change_pct + "%") : "—"}</td>
                      <td style={{ padding: "6px", color: S.text, textAlign: "right" }}>{t.volume ? (t.volume > 1000000 ? (t.volume/1000000).toFixed(1)+"M" : (t.volume/1000).toFixed(0)+"K") : "—"}</td>
                      <td style={{ padding: "6px", color: (t.vol_ratio || 0) > 1.5 ? S.yellow : S.dim, textAlign: "right" }}>{t.vol_ratio ? t.vol_ratio + "x" : "—"}</td>
                      <td style={{ padding: "6px", color: S.dim, textAlign: "right" }}>${t.high_52w}</td>
                      <td style={{ padding: "6px", color: (t.pct_from_52h || 0) > -10 ? S.green : S.red, textAlign: "right" }}>{t.pct_from_52h != null ? t.pct_from_52h + "%" : "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}


function PhotonicsGraph() {
  const [nodes, setNodes] = useState<any[]>([]);
  const [edges, setEdges] = useState<any[]>([]);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [newNode, setNewNode] = useState({ id: "", type: "company", label: "", group: "ticker" });
  const [newEdge, setNewEdge] = useState({ from: "", to: "", rel: "supplies" });

  useEffect(() => {
    Promise.all([
      fetch(API.replace("/photonics", "/photonics/graph/nodes")).then(r => r.json()),
      fetch(API.replace("/photonics", "/photonics/graph/edges")).then(r => r.json()),
    ]).then(([n, e]) => {
      setNodes(n.nodes || []);
      setEdges(e.edges || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const connected = selectedNode
    ? edges.filter(e => e.from === selectedNode || e.to === selectedNode)
    : [];

  const groupColors: Record<string, string> = {
    ticker: "#2ea043", step: "#58a6ff", customer: "#d29922", tech: "#bc8cff"
  };

  if (loading) return <div style={{ color: S.muted, padding: 40, textAlign: "center" }}>Loading knowledge graph...</div>;

  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 8, marginBottom: 16 }}>
        {["company","supply_chain","customer","technology"].map(type => {
          const count = nodes.filter(n => n.type === type).length;
          const colors: Record<string,string> = { company: "#2ea043", supply_chain: "#58a6ff", customer: "#d29922", technology: "#bc8cff" };
          return (
            <div key={type} style={S.card}>
              <div style={{ ...S.label }}>{type.replace("_", " ")}</div>
              <div style={{ fontSize: 28, fontWeight: "bold", color: colors[type] }}>{count}</div>
              <div style={{ fontSize: 11, color: S.muted }}>nodes</div>
            </div>
          );
        })}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 12 }}>
        <div style={S.card}>
          <div style={{ ...S.label, marginBottom: 12 }}>NODES ({nodes.length})</div>
          <div style={{ maxHeight: 500, overflowY: "auto" }}>
            {nodes.map(n => (
              <div key={n.id} onClick={() => setSelectedNode(n.id)}
                style={{ padding: "6px 8px", cursor: "pointer", borderLeft: `3px solid ${selectedNode === n.id ? groupColors[n.group] || "#fff" : "transparent"}`, background: selectedNode === n.id ? S.bgDeep : "transparent", marginBottom: 2, fontSize: 12, display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: groupColors[n.group] || S.text }}>{n.label}</span>
                <span style={{ color: S.dim, fontSize: 10 }}>{n.type}</span>
              </div>
            ))}
          </div>
          <div style={{ borderTop: "1px solid #30363d", marginTop: 12, paddingTop: 12 }}>
            <div style={{ ...S.label, marginBottom: 8 }}>ADD NODE</div>
            <input style={{ ...S.input, marginBottom: 4 }} placeholder="ID (e.g. BROADCOM)" value={newNode.id} onChange={e => setNewNode({ ...newNode, id: e.target.value, label: e.target.value })} />
            <select style={{ ...S.select, width: "100%", marginBottom: 4 }} value={newNode.group} onChange={e => setNewNode({ ...newNode, group: e.target.value, type: e.target.value === "ticker" ? "company" : e.target.value === "step" ? "supply_chain" : e.target.value })}>
              <option value="ticker">Company</option>
              <option value="step">Supply Chain Step</option>
              <option value="customer">Customer</option>
              <option value="tech">Technology</option>
            </select>
            <button style={S.btn} onClick={() => { if (newNode.id) { fetch(API.replace("/photonics", "/photonics/graph/nodes"), { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(newNode) }); setNodes([...nodes, newNode]); setNewNode({ id: "", type: "company", label: "", group: "ticker" }); } }}>+ Add</button>
          </div>
        </div>

        <div style={S.card}>
          <div style={{ ...S.label, marginBottom: 12 }}>
            {selectedNode ? `CONNECTIONS: ${selectedNode}` : "SELECT A NODE"}
          </div>
          {selectedNode ? (
            <div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 16 }}>
                <div style={{ background: S.bgDeep, padding: 12, borderRadius: 4 }}>
                  <div style={{ color: S.muted, fontSize: 11 }}>OUTGOING</div>
                  <div style={{ fontSize: 24, fontWeight: "bold", color: S.green }}>{connected.filter(e => e.from === selectedNode).length}</div>
                </div>
                <div style={{ background: S.bgDeep, padding: 12, borderRadius: 4 }}>
                  <div style={{ color: S.muted, fontSize: 11 }}>INCOMING</div>
                  <div style={{ fontSize: 24, fontWeight: "bold", color: S.blue }}>{connected.filter(e => e.to === selectedNode).length}</div>
                </div>
              </div>
              {connected.map((e, i) => (
                <div key={i} style={{ padding: "8px 12px", background: S.bg, borderRadius: 4, marginBottom: 4, fontSize: 12, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ color: e.from === selectedNode ? S.green : S.blue }}>{e.from === selectedNode ? e.to : e.from}</span>
                  <span style={{ color: S.dim, fontSize: 10, padding: "2px 6px", background: S.bgDeep, borderRadius: 3 }}>{e.rel}</span>
                  <span style={{ color: S.muted, fontSize: 10 }}>{e.from === selectedNode ? "→" : "←"}</span>
                </div>
              ))}
              <div style={{ borderTop: "1px solid #30363d", marginTop: 12, paddingTop: 12 }}>
                <div style={{ ...S.label, marginBottom: 8 }}>ADD EDGE FROM {selectedNode}</div>
                <div style={{ display: "flex", gap: 4 }}>
                  <input style={{ ...S.input, flex: 1 }} placeholder="Target node" value={newEdge.to} onChange={e => setNewEdge({ ...newEdge, to: e.target.value })} />
                  <select style={S.select} value={newEdge.rel} onChange={e => setNewEdge({ ...newEdge, rel: e.target.value })}>
                    <option value="supplies">supplies</option>
                    <option value="sells_to">sells_to</option>
                    <option value="competes_with">competes</option>
                    <option value="develops">develops</option>
                    <option value="manufactures_for">manufactures</option>
                    <option value="foundry">foundry</option>
                  </select>
                  <button style={S.btn} onClick={() => { if (newEdge.to) { const edge = { from: selectedNode, to: newEdge.to, rel: newEdge.rel }; fetch(API.replace("/photonics", "/photonics/graph/edges"), { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(edge) }); setEdges([...edges, edge]); setNewEdge({ from: "", to: "", rel: "supplies" }); } }}>+ Link</button>
                </div>
              </div>
            </div>
          ) : (
            <div style={{ color: S.muted, textAlign: "center", padding: 60 }}>Click a node to see its connections in the knowledge graph</div>
          )}
        </div>
      </div>

      <div style={{ ...S.card, marginTop: 12 }}>
        <div style={{ ...S.label, marginBottom: 8 }}>EDGES ({edges.length})</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 4 }}>
          {edges.slice(0, 30).map((e, i) => (
            <div key={i} style={{ fontSize: 11, padding: "4px 8px", background: S.bg, borderRadius: 3 }}>
              <span style={{ color: S.green }}>{e.from}</span>
              <span style={{ color: S.dim }}> → </span>
              <span style={{ color: S.blue }}>{e.to}</span>
              <span style={{ color: S.dim, marginLeft: 4 }}>({e.rel})</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// LAYER 2: QUANTITATIVE MODELS
// ═══════════════════════════════════════════════════════════
function PhotonicsModels() {
  const [mcResults, setMcResults] = useState<any>(null);
  const [factorScores, setFactorScores] = useState<any>(null);
  const [running, setRunning] = useState(false);
  const [simulations, setSimulations] = useState(1000);
  const [days, setDays] = useState(252);
  const [modelTab, setModelTab] = useState("monte-carlo");

  const runMonteCarlo = () => {
    setRunning(true);
    const positions = [
      { ticker: "COHR", price: 220, shares: 50, volatility: 0.45, drift: 0.12 },
      { ticker: "MRVL", price: 85, shares: 100, volatility: 0.40, drift: 0.10 },
      { ticker: "CRDO", price: 75, shares: 80, volatility: 0.55, drift: 0.15 },
      { ticker: "ANET", price: 350, shares: 30, volatility: 0.35, drift: 0.08 },
      { ticker: "POET", price: 5, shares: 1000, volatility: 0.70, drift: 0.20 },
      { ticker: "AAOI", price: 28, shares: 200, volatility: 0.60, drift: 0.18 },
    ];
    fetch(API.replace("/photonics", "/photonics/models/monte-carlo"), {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ positions, simulations, days })
    }).then(r => r.json()).then(data => { setMcResults(data); setRunning(false); }).catch(() => setRunning(false));
  };

  const loadFactors = () => {
    fetch(API.replace("/photonics", "/photonics/models/factor-scores")).then(r => r.json()).then(setFactorScores);
  };

  useEffect(() => { loadFactors(); }, []);

  return (
    <div>
      <div style={{ display: "flex", gap: 0, marginBottom: 16, borderBottom: "1px solid #30363d" }}>
        {["monte-carlo", "factor-model", "kelly"].map(t => (
          <button key={t} onClick={() => setModelTab(t)} style={{ padding: "8px 16px", background: modelTab === t ? bgDeep : "transparent", color: modelTab === t ? S.green : S.muted, border: "none", borderBottom: modelTab === t ? "2px solid #2563eb" : "2px solid transparent", cursor: "pointer", fontFamily: "'DM Sans', sans-serif", fontSize: 12, textTransform: "uppercase" }}>{t.replace("-", " ")}</button>
        ))}
      </div>

      {modelTab === "monte-carlo" && (
        <div>
          <div style={{ ...S.card, display: "flex", alignItems: "center", gap: 12 }}>
            <span style={S.label}>SIMULATIONS</span>
            <input type="number" style={{ ...S.input, width: 100 }} value={simulations} onChange={e => setSimulations(Number(e.target.value))} />
            <span style={S.label}>DAYS</span>
            <input type="number" style={{ ...S.input, width: 80 }} value={days} onChange={e => setDays(Number(e.target.value))} />
            <button style={S.btn} onClick={runMonteCarlo} disabled={running}>{running ? "RUNNING..." : "▶ RUN SIMULATION"}</button>
          </div>
          {mcResults && (
            <div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 12 }}>
                <div style={S.card}>
                  <div style={S.label}>CURRENT VALUE</div>
                  <div style={{ fontSize: 24, fontWeight: "bold", color: S.text }}>${mcResults.portfolio_current?.toLocaleString()}</div>
                </div>
                <div style={S.card}>
                  <div style={S.label}>EXPECTED VALUE</div>
                  <div style={{ fontSize: 24, fontWeight: "bold", color: S.green }}>${mcResults.portfolio_expected?.toLocaleString()}</div>
                </div>
                <div style={S.card}>
                  <div style={S.label}>EXPECTED RETURN</div>
                  <div style={{ fontSize: 24, fontWeight: "bold", color: mcResults.portfolio_return > 0 ? S.green : S.red }}>{mcResults.portfolio_return}%</div>
                </div>
              </div>
              <div style={S.card}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                  <thead>
                    <tr style={{ color: S.muted, borderBottom: "1px solid #30363d" }}>
                      <th style={{ textAlign: "left", padding: 8 }}>TICKER</th>
                      <th style={{ textAlign: "right", padding: 8 }}>CURRENT</th>
                      <th style={{ textAlign: "right", padding: 8 }}>P5 (WORST)</th>
                      <th style={{ textAlign: "right", padding: 8 }}>P25</th>
                      <th style={{ textAlign: "right", padding: 8 }}>MEDIAN</th>
                      <th style={{ textAlign: "right", padding: 8 }}>P75</th>
                      <th style={{ textAlign: "right", padding: 8 }}>P95 (BEST)</th>
                      <th style={{ textAlign: "right", padding: 8 }}>E[VALUE]</th>
                    </tr>
                  </thead>
                  <tbody>
                    {mcResults.results?.map((r: any) => (
                      <tr key={r.ticker} style={{ borderBottom: "1px solid #21262d" }}>
                        <td style={{ padding: 8, color: "#0d9f4f", fontWeight: "bold" }}>{r.ticker}</td>
                        <td style={{ padding: 8, textAlign: "right", color: S.text }}>${r.current_price}</td>
                        <td style={{ padding: 8, textAlign: "right", color: S.red }}>${r.p5}</td>
                        <td style={{ padding: 8, textAlign: "right", color: S.yellow }}>${r.p25}</td>
                        <td style={{ padding: 8, textAlign: "right", color: S.text, fontWeight: "bold" }}>${r.p50}</td>
                        <td style={{ padding: 8, textAlign: "right", color: S.green }}>${r.p75}</td>
                        <td style={{ padding: 8, textAlign: "right", color: S.cyan }}>${r.p95}</td>
                        <td style={{ padding: 8, textAlign: "right", color: S.blue }}>${r.expected_value?.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {modelTab === "factor-model" && factorScores && (
        <div style={S.card}>
          <div style={{ ...S.label, marginBottom: 12 }}>PHOTONICS FACTOR MODEL — MULTI-FACTOR DECOMPOSITION</div>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
            <thead>
              <tr style={{ color: S.muted, borderBottom: "1px solid #30363d" }}>
                <th style={{ textAlign: "left", padding: 8 }}>TICKER</th>
                {factorScores.factors?.map((f: string) => (
                  <th key={f} style={{ textAlign: "right", padding: 8, fontSize: 10 }}>{f.replace("_", " ").toUpperCase()}</th>
                ))}
                <th style={{ textAlign: "right", padding: 8 }}>COMPOSITE</th>
              </tr>
            </thead>
            <tbody>
              {factorScores.scores?.map((s: any) => (
                <tr key={s.ticker} style={{ borderBottom: "1px solid #21262d" }}>
                  <td style={{ padding: 8, color: "#0d9f4f", fontWeight: "bold" }}>{s.ticker}</td>
                  {factorScores.factors?.map((f: string) => (
                    <td key={f} style={{ padding: 8, textAlign: "right", color: s[f] > 0 ? S.green : s[f] < 0 ? S.red : S.dim }}>{s[f] > 0 ? "+" : ""}{s[f]}</td>
                  ))}
                  <td style={{ padding: 8, textAlign: "right", fontWeight: "bold", color: s.composite > 0 ? S.green : S.red }}>{s.composite > 0 ? "+" : ""}{s.composite}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modelTab === "kelly" && (
        <div style={S.card}>
          <div style={{ ...S.label, marginBottom: 12 }}>KELLY CRITERION POSITION SIZER</div>
          <div style={{ color: S.muted, fontSize: 12, marginBottom: 16 }}>Using Quarter-Kelly (0.25x) for conservative sizing. Adjust win probability and payoff ratio per thesis conviction.</div>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
            <thead>
              <tr style={{ color: S.muted, borderBottom: "1px solid #30363d" }}>
                <th style={{ textAlign: "left", padding: 8 }}>TICKER</th>
                <th style={{ textAlign: "right", padding: 8 }}>WIN PROB</th>
                <th style={{ textAlign: "right", padding: 8 }}>W/L RATIO</th>
                <th style={{ textAlign: "right", padding: 8 }}>FULL KELLY %</th>
                <th style={{ textAlign: "right", padding: 8 }}>ADJ KELLY %</th>
                <th style={{ textAlign: "right", padding: 8 }}>$ SIZE</th>
              </tr>
            </thead>
            <tbody>
              {[{t:"COHR",wp:0.65,wl:2.5},{t:"MRVL",wp:0.60,wl:2.0},{t:"CRDO",wp:0.55,wl:3.0},{t:"POET",wp:0.45,wl:5.0},{t:"AAOI",wp:0.50,wl:3.5},{t:"AXTI",wp:0.55,wl:2.0}].map(r => {
                const kp = (r.wp * r.wl - (1 - r.wp)) / r.wl;
                const ak = kp * 0.25;
                const ds = 100000 * Math.max(ak, 0);
                return (
                  <tr key={r.t} style={{ borderBottom: "1px solid #21262d" }}>
                    <td style={{ padding: 8, color: "#0d9f4f", fontWeight: "bold" }}>{r.t}</td>
                    <td style={{ padding: 8, textAlign: "right" }}>{(r.wp * 100).toFixed(0)}%</td>
                    <td style={{ padding: 8, textAlign: "right" }}>{r.wl}:1</td>
                    <td style={{ padding: 8, textAlign: "right", color: kp > 0 ? S.green : S.red }}>{(kp * 100).toFixed(1)}%</td>
                    <td style={{ padding: 8, textAlign: "right", color: S.blue }}>{(ak * 100).toFixed(1)}%</td>
                    <td style={{ padding: 8, textAlign: "right", color: S.text, fontWeight: "bold" }}>${ds.toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// LAYER 3-4: SIGNALS & INTELLIGENCE
// ═══════════════════════════════════════════════════════════
function PhotonicsSignals() {
  const [anomalies, setAnomalies] = useState<any[]>([]);
  const [flow, setFlow] = useState<any[]>([]);
  const [social, setSocial] = useState<any[]>([]);
  const [signalTab, setSignalTab] = useState("anomalies");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch(API.replace("/photonics", "/photonics/signals/anomalies")).then(r => r.json()),
      fetch(API.replace("/photonics", "/photonics/signals/flow")).then(r => r.json()),
      fetch(API.replace("/photonics", "/photonics/signals/social")).then(r => r.json()),
    ]).then(([a, f, s]) => {
      setAnomalies(a.anomalies || []);
      setFlow(f.flow || []);
      setSocial(s.social || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const sevColors: Record<string, string> = { critical: "#f85149", high: "#d29922", medium: "#58a6ff", low: "#484f58" };

  if (loading) return <div style={{ color: S.muted, padding: 40, textAlign: "center" }}>Scanning signals...</div>;

  return (
    <div>
      <div style={{ display: "flex", gap: 0, marginBottom: 16, borderBottom: "1px solid #30363d" }}>
        {["anomalies", "options-flow", "social-velocity"].map(t => (
          <button key={t} onClick={() => setSignalTab(t)} style={{ padding: "8px 16px", background: signalTab === t ? bgDeep : "transparent", color: signalTab === t ? S.green : S.muted, border: "none", borderBottom: signalTab === t ? "2px solid #2563eb" : "2px solid transparent", cursor: "pointer", fontFamily: "'DM Sans', sans-serif", fontSize: 12, textTransform: "uppercase" }}>{t.replace("-", " ")}</button>
        ))}
      </div>

      {signalTab === "anomalies" && (
        <div>
          {anomalies.map((a, i) => (
            <div key={i} style={{ ...S.card, borderLeft: `3px solid ${sevColors[a.severity] || S.dim}` }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                <span style={{ color: "#0d9f4f", fontWeight: "bold", fontSize: 14 }}>{a.ticker}</span>
                <span style={{ color: sevColors[a.severity], fontSize: 11, textTransform: "uppercase", fontWeight: "bold" }}>{a.severity} · Z={a.z_score}</span>
              </div>
              <div style={{ color: S.text, fontSize: 12, marginBottom: 4 }}>{a.description}</div>
              <div style={{ color: S.dim, fontSize: 10 }}>{a.type?.replace(/_/g, " ")} · {new Date(a.detected_at).toLocaleString()}</div>
            </div>
          ))}
        </div>
      )}

      {signalTab === "options-flow" && (
        <div style={S.card}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
            <thead>
              <tr style={{ color: S.muted, borderBottom: "1px solid #30363d" }}>
                <th style={{ textAlign: "left", padding: 8 }}>TICKER</th>
                <th style={{ textAlign: "center", padding: 8 }}>TYPE</th>
                <th style={{ textAlign: "right", padding: 8 }}>STRIKE</th>
                <th style={{ textAlign: "right", padding: 8 }}>EXPIRY</th>
                <th style={{ textAlign: "right", padding: 8 }}>VOLUME</th>
                <th style={{ textAlign: "right", padding: 8 }}>OI</th>
                <th style={{ textAlign: "right", padding: 8 }}>PREMIUM</th>
                <th style={{ textAlign: "right", padding: 8 }}>SCORE</th>
              </tr>
            </thead>
            <tbody>
              {flow.map((f, i) => (
                <tr key={i} style={{ borderBottom: "1px solid #21262d" }}>
                  <td style={{ padding: 8, color: "#0d9f4f", fontWeight: "bold" }}>{f.ticker}</td>
                  <td style={{ padding: 8, textAlign: "center", color: f.type === "CALL" ? S.green : S.red, fontWeight: "bold" }}>{f.type}</td>
                  <td style={{ padding: 8, textAlign: "right" }}>${f.strike}</td>
                  <td style={{ padding: 8, textAlign: "right", color: S.muted }}>{f.expiry}</td>
                  <td style={{ padding: 8, textAlign: "right", fontWeight: "bold" }}>{f.volume?.toLocaleString()}</td>
                  <td style={{ padding: 8, textAlign: "right" }}>{f.open_interest?.toLocaleString()}</td>
                  <td style={{ padding: 8, textAlign: "right", color: S.yellow }}>${(f.premium / 1000).toFixed(0)}K</td>
                  <td style={{ padding: 8, textAlign: "right", color: f.unusual_score > 5 ? S.red : S.yellow, fontWeight: "bold" }}>{f.unusual_score}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {signalTab === "social-velocity" && (
        <div>
          {social.map((s, i) => (
            <div key={i} style={{ ...S.card, display: "flex", alignItems: "center", gap: 16 }}>
              <div style={{ minWidth: 60 }}>
                <div style={{ color: "#0d9f4f", fontWeight: "bold", fontSize: 16 }}>{s.ticker}</div>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                  <div style={{ height: 6, background: S.bgDeep, borderRadius: 3, flex: 1, overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${Math.min(s.velocity * 10, 100)}%`, background: s.velocity > 3 ? S.red : s.velocity > 1.5 ? S.yellow : S.green, borderRadius: 3 }} />
                  </div>
                  <span style={{ color: s.velocity > 2 ? S.red : S.muted, fontWeight: "bold", fontSize: 14 }}>{s.velocity}x</span>
                </div>
                <div style={{ fontSize: 10, color: S.dim }}>
                  {s.mentions_24h} mentions / 24h (baseline: {s.baseline_avg}) · Sentiment: {s.sentiment_score > 0 ? "+" : ""}{s.sentiment_score}
                </div>
              </div>
              {s.trending && <span style={{ color: "#0d1117", background: S.red, padding: "2px 8px", borderRadius: 3, fontSize: 10, fontWeight: "bold" }}>TRENDING</span>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// LAYER 5: SIMULATION & WAR GAMING
// ═══════════════════════════════════════════════════════════
function PhotonicsSimulate() {
  const [scenario, setScenario] = useState("");
  const [stressResults, setStressResults] = useState<any>(null);
  const [stressType, setStressType] = useState("recession");
  const [simTab, setSimTab] = useState("what-if");
  const [aiResult, setAiResult] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [history, setHistory] = useState<any[]>([]);
  const [wargameMove, setWargameMove] = useState("");
  const [wargameAttacker, setWargameAttacker] = useState("");
  const [wargameResult, setWargameResult] = useState("");
  const [wargameAnalyzing, setWargameAnalyzing] = useState(false);

  const positions = [
    { ticker: "COHR", value: 11000, beta: 1.3, cash_months: 24 },
    { ticker: "MRVL", value: 8500, beta: 1.1, cash_months: 36 },
    { ticker: "CRDO", value: 6000, beta: 1.5, cash_months: 18 },
    { ticker: "POET", value: 5000, beta: 2.0, cash_months: 8 },
    { ticker: "AAOI", value: 5600, beta: 1.6, cash_months: 12 },
    { ticker: "ANET", value: 10500, beta: 0.9, cash_months: 48 },
  ];

  const runStressTest = () => {
    fetch(`${API}/simulate/stress-test`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: stressType, positions })
    }).then(r => r.json()).then(setStressResults);
  };

  const runAIScenario = () => {
    if (!scenario.trim()) return;
    setAnalyzing(true);
    setAiResult("Sending scenario to Claude for deep supply chain analysis...");
    fetch(`${API}/simulate/ai-scenario`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ scenario })
    }).then(r => r.json()).then(data => {
      if (data.error) {
        setAiResult("ERROR: " + data.error);
      } else {
        setAiResult(data.analysis || "No analysis returned");
        setHistory(prev => [{ scenario, result: data.analysis, time: new Date().toLocaleString() }, ...prev].slice(0, 20));
      }
      setAnalyzing(false);
    }).catch(err => { setAiResult("ERROR: " + err.message); setAnalyzing(false); });
  };

  const runWargame = () => {
    if (!wargameMove.trim()) return;
    setWargameAnalyzing(true);
    setWargameResult("Simulating competitive scenario with Claude...");
    fetch(`${API}/simulate/ai-wargame`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ move: wargameMove, attacker: wargameAttacker, defenders: [] })
    }).then(r => r.json()).then(data => {
      if (data.error) {
        setWargameResult("ERROR: " + data.error);
      } else {
        setWargameResult(data.analysis || "No analysis returned");
      }
      setWargameAnalyzing(false);
    }).catch(err => { setWargameResult("ERROR: " + err.message); setWargameAnalyzing(false); });
  };

  return (
    <div>
      <div style={{ display: "flex", gap: 0, marginBottom: 16, borderBottom: "1px solid #30363d" }}>
        {["what-if", "war-game", "stress-test", "history"].map(t => (
          <button key={t} onClick={() => setSimTab(t)} style={{ padding: "8px 16px", background: simTab === t ? "#0d1117" : "transparent", color: simTab === t ? S.green : S.muted, border: "none", borderBottom: simTab === t ? "2px solid #2563eb" : "2px solid transparent", cursor: "pointer", fontFamily: "'DM Sans', sans-serif", fontSize: 12, textTransform: "uppercase" as const }}>{t.replace("-", " ")}</button>
        ))}
      </div>

      {simTab === "what-if" && (
        <div>
          <div style={S.card}>
            <div style={{ ...S.label, marginBottom: 8, color: S.green }}>AI SCENARIO ANALYZER — POWERED BY CLAUDE</div>
            <div style={{ color: S.dim, fontSize: 11, marginBottom: 12 }}>Type any scenario and Claude will analyze first, second, and third-order effects across all 19 photonics names</div>
            <div style={{ display: "flex", gap: 8 }}>
              <input style={{ ...S.input, flex: 1 }} placeholder="e.g. TSMC announces photonics foundry expansion..." value={scenario} onChange={e => setScenario(e.target.value)} onKeyDown={e => e.key === "Enter" && !analyzing && runAIScenario()} />
              <button style={{ ...S.btn, opacity: analyzing ? 0.6 : 1, minWidth: 140 }} onClick={runAIScenario} disabled={analyzing}>{analyzing ? "ANALYZING..." : "\u25B6 ASK CLAUDE"}</button>
            </div>
          </div>
          <div style={{ ...S.card, marginTop: 8 }}>
            <div style={{ ...S.label, marginBottom: 8 }}>PRESET SCENARIOS</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
              {[
                "800G adoption accelerates 6 months faster than expected",
                "China restricts indium and gallium exports to the US",
                "Broadcom acquires POET for $2B",
                "Nvidia announces next-gen NVLink with 2x optical bandwidth",
                "Google internal silicon photonics program succeeds at 1.6T",
                "InP wafer shortage — lead times extend to 20 weeks",
                "Meta cuts AI capex by 30% citing ROI concerns",
                "TSMC announces dedicated photonics process node",
                "Coherent announces vertical integration into InP substrates",
                "New IEEE standard favors silicon photonics over InP at 1.6T",
                "Amazon announces $50B data center buildout in 2027",
                "Indium prices spike 50% due to zinc smelter closures",
              ].map(s => (
                <button key={s} onClick={() => setScenario(s)} style={{ ...S.btnSmall, fontSize: 10, padding: "4px 8px", maxWidth: "100%", textAlign: "left" }}>{s}</button>
              ))}
            </div>
          </div>
          {aiResult && (
            <div style={{ ...S.card, marginTop: 8, borderLeft: aiResult.startsWith("ERROR") ? "3px solid #dc2626" : "3px solid #0d9f4f" }}>
              <div style={{ ...S.label, marginBottom: 8, color: analyzing ? S.yellow : S.green }}>{analyzing ? "\u23F3 ANALYZING..." : "\u2705 CLAUDE ANALYSIS"}</div>
              <pre style={{ color: S.text, fontSize: 12, whiteSpace: "pre-wrap", fontFamily: "'DM Sans', sans-serif", lineHeight: 1.7, margin: 0 }}>{aiResult}</pre>
            </div>
          )}
        </div>
      )}

      {simTab === "war-game" && (
        <div>
          <div style={S.card}>
            <div style={{ ...S.label, marginBottom: 8, color: S.yellow }}>AI COMPETITIVE WAR GAME — POWERED BY CLAUDE</div>
            <div style={{ color: S.dim, fontSize: 11, marginBottom: 12 }}>Simulate competitive moves and Claude traces implications through the entire supply chain</div>
            <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
              <input style={{ ...S.input, flex: 2 }} placeholder="Competitive move (e.g. Broadcom vertically integrates lasers)" value={wargameMove} onChange={e => setWargameMove(e.target.value)} />
              <input style={{ ...S.input, flex: 1 }} placeholder="Attacker (e.g. AVGO)" value={wargameAttacker} onChange={e => setWargameAttacker(e.target.value)} />
              <button style={{ ...S.btn, background: "#b45309", opacity: wargameAnalyzing ? 0.6 : 1, minWidth: 140 }} onClick={runWargame} disabled={wargameAnalyzing}>{wargameAnalyzing ? "SIMULATING..." : "\u2694 WAR GAME"}</button>
            </div>
          </div>
          <div style={{ ...S.card, marginTop: 8 }}>
            <div style={{ ...S.label, marginBottom: 8 }}>PRESET WAR GAMES</div>
            {[
              { move: "Broadcom vertically integrates laser manufacturing", attacker: "AVGO" },
              { move: "Meta builds in-house transceiver division, stops buying from merchant suppliers", attacker: "META" },
              { move: "Chinese companies achieve volume 800G production at 40% lower cost", attacker: "Hisense Broadband" },
              { move: "Intel silicon photonics wins 1.6T benchmark, hyperscalers shift orders", attacker: "INTC" },
              { move: "TSMC enters photonics foundry market with dedicated node", attacker: "TSM" },
              { move: "Lumentum launches breakthrough CPO module, takes 30% of market", attacker: "LITE" },
            ].map((w, i) => (
              <div key={i} onClick={() => { setWargameMove(w.move); setWargameAttacker(w.attacker); }} style={{ padding: "8px 12px", background: S.bg, borderRadius: 4, marginBottom: 4, cursor: "pointer", fontSize: 12, borderLeft: "3px solid #d97706" }}>
                <span style={{ color: S.red, fontWeight: "bold" }}>{w.attacker}</span>
                <span style={{ color: S.dim }}>{" \u2192 "}</span>
                <span style={{ color: S.text }}>{w.move}</span>
              </div>
            ))}
          </div>
          {wargameResult && (
            <div style={{ ...S.card, marginTop: 8, borderLeft: wargameResult.startsWith("ERROR") ? "3px solid #dc2626" : "3px solid #d97706" }}>
              <div style={{ ...S.label, marginBottom: 8, color: wargameAnalyzing ? S.yellow : S.green }}>{wargameAnalyzing ? "\u23F3 SIMULATING..." : "\u2694 WAR GAME RESULT"}</div>
              <pre style={{ color: S.text, fontSize: 12, whiteSpace: "pre-wrap", fontFamily: "'DM Sans', sans-serif", lineHeight: 1.7, margin: 0 }}>{wargameResult}</pre>
            </div>
          )}
        </div>
      )}

      {simTab === "stress-test" && (
        <div>
          <div style={{ ...S.card, display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
            <span style={S.label}>SCENARIO</span>
            <select style={S.select} value={stressType} onChange={e => setStressType(e.target.value)}>
              <option value="recession">2008-Style Recession</option>
              <option value="china_ban">China Export Ban</option>
              <option value="rate_hike">Fed +200bps</option>
              <option value="ai_winter">AI Winter</option>
              <option value="supply_shock">InP Wafer Shortage</option>
            </select>
            <button style={S.btn} onClick={runStressTest}>\u25B6 RUN STRESS TEST</button>
          </div>
          {stressResults && (
            <div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 12 }}>
                <div style={S.card}><div style={S.label}>SCENARIO</div><div style={{ fontSize: 14, color: S.red, fontWeight: "bold" }}>{stressResults.scenario}</div></div>
                <div style={S.card}><div style={S.label}>PORTFOLIO LOSS</div><div style={{ fontSize: 24, fontWeight: "bold", color: S.red }}>${(stressResults.total_current - stressResults.total_stressed).toLocaleString(undefined, { maximumFractionDigits: 0 })}</div></div>
                <div style={S.card}><div style={S.label}>MAX SINGLE DRAWDOWN</div><div style={{ fontSize: 24, fontWeight: "bold", color: S.red }}>{stressResults.max_drawdown}%</div></div>
              </div>
              <div style={S.card}>
                {stressResults.results?.map((r: any) => (
                  <div key={r.ticker} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: "1px solid #21262d" }}>
                    <span style={{ color: "#0d9f4f", fontWeight: "bold", width: 60 }}>{r.ticker}</span>
                    <span style={{ color: S.text }}>${r.current_value.toLocaleString()}</span>
                    <span style={{ color: S.dim }}>\u2192</span>
                    <span style={{ color: S.red }}>${r.stressed_value.toLocaleString()}</span>
                    <span style={{ color: S.red, fontWeight: "bold", width: 60, textAlign: "right" }}>{r.impact_pct}%</span>
                    <span style={{ color: r.survives ? S.green : S.red, fontSize: 11 }}>{r.survives ? "SURVIVES" : "AT RISK"}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {simTab === "history" && (
        <div>
          <div style={{ ...S.label, marginBottom: 12 }}>SCENARIO ANALYSIS HISTORY ({history.length})</div>
          {history.length === 0 ? (
            <div style={{ ...S.card, color: S.muted, textAlign: "center", padding: 40 }}>No scenarios analyzed yet. Go to What-If tab to run your first analysis.</div>
          ) : history.map((h, i) => (
            <div key={i} style={{ ...S.card, borderLeft: "3px solid #2563eb" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                <span style={{ color: "#0d9f4f", fontWeight: "bold", fontSize: 13 }}>{h.scenario}</span>
                <span style={{ color: S.dim, fontSize: 10 }}>{h.time}</span>
              </div>
              <pre style={{ color: S.text, fontSize: 11, whiteSpace: "pre-wrap", fontFamily: "'DM Sans', sans-serif", lineHeight: 1.5, margin: 0, maxHeight: 200, overflow: "auto" }}>{h.result}</pre>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function PhotonicsPipeline() {
  const [pipeline, setPipeline] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(API.replace("/photonics", "/photonics/pipeline/status")).then(r => r.json()).then(data => { setPipeline(data); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  const statusColors: Record<string, string> = { active: "#2ea043", paused: "#d29922", error: "#f85149" };
  const typeIcons: Record<string, string> = { filings: "📄", patents: "🔬", news: "📰", earnings: "💰", social: "📱", jobs: "👤", events: "🎤", insider: "🏢" };

  if (loading) return <div style={{ color: S.muted, padding: 40, textAlign: "center" }}>Loading pipeline...</div>;

  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 16 }}>
        <div style={S.card}><div style={S.label}>ACTIVE SOURCES</div><div style={{ fontSize: 28, fontWeight: "bold", color: S.green }}>{pipeline?.active_count || 0}</div></div>
        <div style={S.card}><div style={S.label}>ITEMS (24H)</div><div style={{ fontSize: 28, fontWeight: "bold", color: S.blue }}>{pipeline?.total_items_24h || 0}</div></div>
        <div style={S.card}><div style={S.label}>STATUS</div><div style={{ fontSize: 28, fontWeight: "bold", color: S.green }}>RUNNING</div></div>
      </div>

      {pipeline?.sources?.map((s: any, i: number) => (
        <div key={i} style={{ ...S.card, display: "flex", alignItems: "center", gap: 16 }}>
          <span style={{ fontSize: 24 }}>{typeIcons[s.type] || "📊"}</span>
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
              <span style={{ color: S.text, fontWeight: "bold", fontSize: 14 }}>{s.name}</span>
              <span style={{ color: statusColors[s.status], fontSize: 11, textTransform: "uppercase", fontWeight: "bold" }}>● {s.status}</span>
            </div>
            <div style={{ display: "flex", gap: 16, fontSize: 11, color: S.muted }}>
              <span>Last run: {new Date(s.last_run).toLocaleString()}</span>
              <span>Items: {s.items_processed}</span>
              <span>Type: {s.type}</span>
            </div>
          </div>
          <button style={S.btnSmall}>{s.status === "active" ? "PAUSE" : "START"}</button>
        </div>
      ))}

      <div style={{ ...S.card, marginTop: 16 }}>
        <div style={{ ...S.label, marginBottom: 12 }}>PIPELINE ARCHITECTURE</div>
        <div style={{ fontSize: 12, color: S.muted, lineHeight: 1.8 }}>
          <div>{"┌─── SEC EDGAR ──────┐ ┌─── USPTO ──────────┐ ┌─── News RSS ────────┐"}</div>
          <div>{"│  10-K, 10-Q, 8-K   │ │  Patent filings    │ │  Photonics keywords  │"}</div>
          <div>{"└────────┬───────────┘ └────────┬───────────┘ └────────┬────────────┘"}</div>
          <div>{"         │                      │                      │"}</div>
          <div>{"         ▼                      ▼                      ▼"}</div>
          <div>{"┌────────────────────────────────────────────────────────────────────┐"}</div>
          <div>{"│                    AI PROCESSING ENGINE                            │"}</div>
          <div>{"│  • Entity extraction • Sentiment analysis • Fact resolution       │"}</div>
          <div>{"│  • Cross-reference with research library • Anomaly detection      │"}</div>
          <div>{"└────────────────────────────┬───────────────────────────────────────┘"}</div>
          <div>{"                             │"}</div>
          <div>{"                             ▼"}</div>
          <div>{"┌────────────────────────────────────────────────────────────────────┐"}</div>
          <div>{"│                    KNOWLEDGE GRAPH                                 │"}</div>
          <div>{"│  Nodes: Companies, Technologies, People, Products, Facilities     │"}</div>
          <div>{"│  Edges: supplies, competes, develops, sells_to, manufactures      │"}</div>
          <div>{"└────────────────────────────────────────────────────────────────────┘"}</div>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// LAYER 7: PORTFOLIO CONSTRUCTION
// ═══════════════════════════════════════════════════════════
function PhotonicsConstruct() {
  const [riskParity, setRiskParity] = useState<any>(null);
  const [constructTab, setConstructTab] = useState("risk-parity");

  useEffect(() => {
    fetch(API.replace("/photonics", "/photonics/construction/risk-parity")).then(r => r.json()).then(setRiskParity);
  }, []);

  return (
    <div>
      <div style={{ display: "flex", gap: 0, marginBottom: 16, borderBottom: "1px solid #30363d" }}>
        {["risk-parity", "rebalance", "tax-harvest", "drawdown"].map(t => (
          <button key={t} onClick={() => setConstructTab(t)} style={{ padding: "8px 16px", background: constructTab === t ? "#0d1117" : "transparent", color: constructTab === t ? S.green : S.muted, border: "none", borderBottom: constructTab === t ? "2px solid #2563eb" : "2px solid transparent", cursor: "pointer", fontFamily: "'DM Sans', sans-serif", fontSize: 12, textTransform: "uppercase" }}>{t.replace("-", " ")}</button>
        ))}
      </div>

      {constructTab === "risk-parity" && riskParity && (
        <div>
          <div style={{ ...S.card }}>
            <div style={{ ...S.label, marginBottom: 12 }}>RISK PARITY ALLOCATION — EQUAL RISK PER SUPPLY CHAIN STEP</div>
            {riskParity.allocations?.map((a: any) => (
              <div key={a.step} style={{ display: "flex", alignItems: "center", gap: 12, padding: "8px 0", borderBottom: "1px solid #21262d" }}>
                <span style={{ color: S.blue, fontWeight: "bold", width: 100, fontSize: 13 }}>{a.step}</span>
                <div style={{ flex: 1, height: 8, background: S.bgDeep, borderRadius: 4, overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${a.step_weight}%`, background: S.green, borderRadius: 4 }} />
                </div>
                <span style={{ color: S.text, fontWeight: "bold", width: 50, textAlign: "right" }}>{a.step_weight}%</span>
                <span style={{ color: S.muted, fontSize: 11, width: 120 }}>({a.tickers.join(", ")})</span>
                <span style={{ color: S.dim, fontSize: 10 }}>{a.per_ticker_weight}% each</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {constructTab === "rebalance" && (
        <div style={S.card}>
          <div style={{ ...S.label, marginBottom: 12 }}>REBALANCING SIGNALS</div>
          {[
            { step: "Transceiver", target: 30, actual: 38, action: "TRIM", names: "COHR rallied — trim $2,400" },
            { step: "Substrate", target: 15, actual: 8, action: "ADD", names: "AXTI in buy zone — add $3,500" },
            { step: "Data Center", target: 20, actual: 22, action: "HOLD", names: "Within tolerance band" },
            { step: "Wafer Fab", target: 20, actual: 18, action: "ADD", names: "CRDO pullback — add $1,000" },
            { step: "Assembly", target: 15, actual: 14, action: "HOLD", names: "Within tolerance band" },
          ].map((r, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderBottom: "1px solid #21262d" }}>
              <span style={{ fontWeight: "bold", width: 100, color: S.blue }}>{r.step}</span>
              <span style={{ color: S.muted, width: 80 }}>Target: {r.target}%</span>
              <span style={{ color: r.actual > r.target + 3 ? S.red : r.actual < r.target - 3 ? S.yellow : S.green, width: 80, fontWeight: "bold" }}>Actual: {r.actual}%</span>
              <span style={{ color: r.action === "TRIM" ? S.red : r.action === "ADD" ? S.green : S.dim, fontWeight: "bold", width: 50 }}>{r.action}</span>
              <span style={{ color: S.muted, fontSize: 11, flex: 1 }}>{r.names}</span>
            </div>
          ))}
        </div>
      )}

      {constructTab === "tax-harvest" && (
        <div style={S.card}>
          <div style={{ ...S.label, marginBottom: 12 }}>TAX LOSS HARVESTING OPPORTUNITIES</div>
          {[
            { ticker: "POET", basis: 7.50, current: 5.20, loss: -2300, swap: "LWLG", washSafe: true },
            { ticker: "ALMU", basis: 12.00, current: 9.80, loss: -1100, swap: "AXTI", washSafe: true },
            { ticker: "LWLG", basis: 4.20, current: 3.10, loss: -550, swap: "POET", washSafe: false },
          ].map((t, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderBottom: "1px solid #21262d" }}>
              <span style={{ color: "#0d9f4f", fontWeight: "bold", width: 60 }}>{t.ticker}</span>
              <span style={{ color: S.muted, width: 80 }}>Basis: ${t.basis}</span>
              <span style={{ color: S.red, width: 80 }}>Now: ${t.current}</span>
              <span style={{ color: S.red, fontWeight: "bold", width: 80 }}>{t.loss < 0 ? "-" : ""}${Math.abs(t.loss).toLocaleString()}</span>
              <span style={{ color: S.blue, fontSize: 11 }}>Swap → {t.swap}</span>
              <span style={{ color: t.washSafe ? S.green : S.red, fontSize: 10 }}>{t.washSafe ? "✓ WASH SAFE" : "⚠ 30-DAY WINDOW"}</span>
            </div>
          ))}
        </div>
      )}

      {constructTab === "drawdown" && (
        <div style={S.card}>
          <div style={{ ...S.label, marginBottom: 12 }}>DRAWDOWN RECOVERY TRACKER</div>
          {[
            { ticker: "COHR", maxDD: -28, currentDD: -5, avgRecovery: "3.2 months", status: "recovered" },
            { ticker: "POET", maxDD: -55, currentDD: -31, avgRecovery: "6.8 months", status: "in_drawdown" },
            { ticker: "MRVL", maxDD: -22, currentDD: -8, avgRecovery: "2.5 months", status: "recovering" },
            { ticker: "AAOI", maxDD: -45, currentDD: -12, avgRecovery: "5.1 months", status: "recovering" },
            { ticker: "CRDO", maxDD: -35, currentDD: 0, avgRecovery: "4.0 months", status: "recovered" },
            { ticker: "ANET", maxDD: -18, currentDD: -3, avgRecovery: "1.8 months", status: "recovered" },
          ].map((d, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderBottom: "1px solid #21262d" }}>
              <span style={{ color: "#0d9f4f", fontWeight: "bold", width: 60 }}>{d.ticker}</span>
              <span style={{ color: S.red, width: 80 }}>Max: {d.maxDD}%</span>
              <span style={{ color: d.currentDD < -20 ? S.red : d.currentDD < -10 ? S.yellow : S.green, width: 80 }}>Now: {d.currentDD}%</span>
              <span style={{ color: S.muted, width: 120, fontSize: 11 }}>Avg recovery: {d.avgRecovery}</span>
              <span style={{ color: d.status === "recovered" ? S.green : d.status === "in_drawdown" ? S.red : S.yellow, fontSize: 11, fontWeight: "bold", textTransform: "uppercase" }}>{d.status.replace("_", " ")}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// LAYER 8: EXPORT & COLLABORATION
// ═══════════════════════════════════════════════════════════

function CohrModelView() {
  const [models, setModels] = useState<any>({});
  const [selectedYear, setSelectedYear] = useState("2026");

  useEffect(() => {
    fetch(`${API}/models/cohr`).then(r=>r.json()).then(d=>setModels(d.models||{}));
  }, []);

  const analystKeys = Object.keys(models);

  return (
    <div>
      <div style={{ ...S.label, color: S.green, marginBottom: 4, fontSize: 16 }}>COHR MULTI-ANALYST MODEL</div>
      <div style={{ color: S.dim, fontSize: 11, marginBottom: 16 }}>Side-by-side projections from 4 analysts + Wall Street consensus</div>

      <div style={{ display: "flex", gap: 4, marginBottom: 16 }}>
        {["2026", "2027", "2028"].map(y => (
          <button key={y} onClick={() => setSelectedYear(y)} style={{ ...S.btn, background: selectedYear === y ? S.green : "#1a2332", color: selectedYear === y ? "#000" : S.text, fontSize: 12 }}>{y}</button>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 8 }}>
        {analystKeys.map(key => {
          const m = models[key];
          const est = m?.estimates?.[selectedYear];
          if (!est && !m?.estimates) return null;
          return (
            <div key={key} style={{ ...S.card, borderTop: "3px solid " + (key.includes("consensus") ? S.red : S.green) }}>
              <div style={{ color: S.blue, fontWeight: "bold", fontSize: 12, marginBottom: 4 }}>{m?.analyst}</div>
              <div style={{ color: S.dim, fontSize: 10, marginBottom: 8 }}>{m?.date}</div>
              {est ? (
                <div>
                  {est.revenue && <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 0" }}><span style={{ color: S.dim }}>Revenue</span><span style={{ color: S.text, fontWeight: "bold" }}>${(est.revenue/1000).toFixed(1)}B</span></div>}
                  {est.growth && <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 0" }}><span style={{ color: S.dim }}>Growth</span><span style={{ color: "#0d9f4f", fontWeight: "bold" }}>{est.growth}%</span></div>}
                  {est.gross_margin && <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 0" }}><span style={{ color: S.dim }}>Gross Margin</span><span style={{ color: S.text }}>{est.gross_margin}%</span></div>}
                  {est.net_margin && <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 0" }}><span style={{ color: S.dim }}>Net Margin</span><span style={{ color: S.text }}>{est.net_margin}%</span></div>}
                  {est.eps && <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", borderTop: "1px solid #30363d" }}><span style={{ color: S.dim }}>EPS</span><span style={{ color: "#0d9f4f", fontWeight: "bold", fontSize: 18 }}>${est.eps}</span></div>}
                  {est.fcf && <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 0" }}><span style={{ color: S.dim }}>FCF</span><span style={{ color: S.text, fontWeight: "bold" }}>${(est.fcf/1000).toFixed(1)}B</span></div>}
                </div>
              ) : <div style={{ color: S.muted, fontSize: 11 }}>No {selectedYear} estimate</div>}
              {m?.price_targets?.[selectedYear] && (
                <div style={{ marginTop: 8, borderTop: "1px solid #30363d", paddingTop: 8 }}>
                  <div style={{ ...S.label, fontSize: 10 }}>PRICE TARGETS</div>
                  {Object.entries(m.price_targets[selectedYear]).map(([k, v]) => (
                    <div key={k} style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
                      <span style={{ color: S.dim }}>{k}</span>
                      <span style={{ color: k === "bull" ? S.green : k === "bear" ? S.red : S.yellow, fontWeight: "bold" }}>${String(v)}</span>
                    </div>
                  ))}
                </div>
              )}
              {m?.key_assumptions && (
                <div style={{ marginTop: 8, borderTop: "1px solid #30363d", paddingTop: 8 }}>
                  <div style={{ ...S.label, fontSize: 10, marginBottom: 4 }}>KEY ASSUMPTIONS</div>
                  {m.key_assumptions.map((a: string, i: number) => (
                    <div key={i} style={{ color: S.dim, fontSize: 10, padding: "2px 0", paddingLeft: 8, borderLeft: "2px solid #30363d" }}>{a}</div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}


function FangOilModel() {
  const [model, setModel] = useState<any>(null);
  const [selectedWti, setSelectedWti] = useState(80);

  useEffect(() => {
    fetch(`${API}/models/fang`).then(r=>r.json()).then(setModel);
  }, []);

  if (!model) return <div style={{ color: S.muted }}>Loading FANG model...</div>;

  const scenarios = model.oil_scenarios || {};
  const selected = scenarios[selectedWti] || {};

  return (
    <div>
      <div style={{ ...S.label, color: S.yellow, marginBottom: 4, fontSize: 16 }}>FANG OIL SENSITIVITY MODEL</div>
      <div style={{ color: S.dim, fontSize: 11, marginBottom: 16 }}>FCF sensitivity to WTI price + options overlay for Iran escalation thesis</div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 8, marginBottom: 16 }}>
        <div style={S.card}><div style={S.label}>CURRENT WTI</div><div style={{ fontSize: 24, fontWeight: "bold", color: S.yellow }}>${model.wti_current || 67}</div></div>
        <div style={S.card}><div style={S.label}>PRODUCTION</div><div style={{ fontSize: 24, fontWeight: "bold", color: S.text }}>{model.production_mbo_d}k bbl/d</div></div>
        <div style={S.card}><div style={S.label}>DIV YIELD</div><div style={{ fontSize: 24, fontWeight: "bold", color: S.green }}>{model.dividend_yield}%</div></div>
        <div style={S.card}><div style={S.label}>BUYBACK LEFT</div><div style={{ fontSize: 24, fontWeight: "bold", color: S.blue }}>${(model.buyback_remaining/1000).toFixed(1)}B</div></div>
      </div>

      <div style={S.card}>
        <div style={{ ...S.label, marginBottom: 12 }}>FCF BY OIL PRICE (click to select)</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4 }}>
          {Object.entries(scenarios).map(([price, data]: [string, any]) => (
            <div key={price} onClick={() => setSelectedWti(Number(price))} style={{ padding: 12, background: Number(price) === selectedWti ? "#1a3320" : "#0a0e14", border: Number(price) === selectedWti ? "2px solid #2563eb" : "2px solid transparent", borderRadius: 6, cursor: "pointer", textAlign: "center" }}>
              <div style={{ color: S.yellow, fontWeight: "bold", fontSize: 16 }}>${price}</div>
              <div style={{ color: S.dim, fontSize: 9 }}>WTI</div>
              <div style={{ color: "#0d9f4f", fontWeight: "bold", fontSize: 14, marginTop: 4 }}>${(data.annual_fcf/1000).toFixed(1)}B</div>
              <div style={{ color: S.dim, fontSize: 9 }}>Annual FCF</div>
              <div style={{ color: S.text, fontSize: 11, marginTop: 2 }}>{data.yield_at_current}%</div>
              <div style={{ color: S.dim, fontSize: 9 }}>FCF yield</div>
            </div>
          ))}
        </div>
        {selected.note && <div style={{ color: S.dim, fontSize: 11, marginTop: 8, fontStyle: "italic" }}>{selected.note}</div>}
      </div>

      <div style={S.card}>
        <div style={{ ...S.label, color: S.red, marginBottom: 12 }}>OPTIONS POSITIONS — IRAN ESCALATION BET</div>
        {model.options_positions?.map((opt: any, i: number) => (
          <div key={i} style={{ padding: 12, background: S.bg, borderRadius: 6, marginBottom: 8, borderLeft: "3px solid #dc2626" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
              <span style={{ color: "#0d9f4f", fontWeight: "bold", fontSize: 14 }}>FANG ${opt.strike}C {opt.expiry}</span>
              <span style={{ color: S.dim }}>Cost: ${opt.cost_range}</span>
            </div>
            <div style={{ display: "flex", gap: 16 }}>
              {Object.entries(opt.scenarios || {}).map(([wti, data]: [string, any]) => (
                <div key={wti} style={{ flex: 1, padding: 8, background: S.bg, borderRadius: 4 }}>
                  <div style={{ color: S.yellow, fontSize: 11 }}>WTI ${wti}</div>
                  <div style={{ color: S.text, fontSize: 12 }}>FANG ~${data.fang_price_est}</div>
                  <div style={{ color: "#0d9f4f", fontWeight: "bold", fontSize: 14 }}>{data.return_pct}</div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div style={S.card}>
        <div style={{ ...S.label, marginBottom: 8 }}>CATALYST TIMELINE</div>
        {model.catalysts?.map((c: any, i: number) => (
          <div key={i} style={{ display: "flex", gap: 8, padding: "6px 0", borderBottom: "1px solid #21262d", fontSize: 12 }}>
            <span style={{ color: S.red, fontWeight: "bold", width: 100 }}>{c.probability}</span>
            <span style={{ color: S.text, flex: 1 }}>{c.event}</span>
            <span style={{ color: S.dim }}>{c.timeline}</span>
          </div>
        ))}
      </div>
    </div>
  );
}


function OscrThesis() {
  const [model, setModel] = useState<any>(null);

  useEffect(() => {
    fetch(`${API}/models/oscr`).then(r=>r.json()).then(setModel);
  }, []);

  if (!model) return <div style={{ color: S.muted }}>Loading OSCR model...</div>;

  return (
    <div>
      <div style={{ ...S.label, color: S.blue, marginBottom: 4, fontSize: 16 }}>OSCR THESIS TRACKER</div>
      <div style={{ color: S.dim, fontSize: 11, marginBottom: 16 }}>{model.thesis}</div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 16 }}>
        <div style={S.card}>
          <div style={S.label}>CURRENT TAM</div>
          <div style={{ fontSize: 24, fontWeight: "bold", color: S.text }}>{(model.tam_current.lives/1000000).toFixed(0)}M lives</div>
          <div style={{ color: S.dim, fontSize: 10 }}>{model.tam_current.label}</div>
        </div>
        <div style={S.card}>
          <div style={S.label}>EXPANDED TAM (ICHRA)</div>
          <div style={{ fontSize: 24, fontWeight: "bold", color: S.green }}>{(model.tam_expanded.lives/1000000).toFixed(0)}M lives</div>
          <div style={{ color: S.dim, fontSize: 10 }}>{model.tam_expanded.label}</div>
        </div>
        <div style={S.card}>
          <div style={S.label}>TAM MULTIPLIER</div>
          <div style={{ fontSize: 24, fontWeight: "bold", color: S.yellow }}>{model.tam_multiplier}x</div>
          <div style={{ color: S.dim, fontSize: 10 }}>Market expansion potential</div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 16 }}>
        <div style={S.card}>
          <div style={{ ...S.label, color: S.green, marginBottom: 8 }}>ICHRA ADOPTION METRICS</div>
          {Object.entries(model.ichra_metrics || {}).map(([k, v]) => (
            <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", fontSize: 12 }}>
              <span style={{ color: S.dim }}>{k.replace(/_/g, " ")}</span>
              <span style={{ color: typeof v === "number" && v > 0 ? S.green : S.text, fontWeight: "bold" }}>{typeof v === "number" ? (v > 100 ? "$" + v : v + "%") : String(v)}</span>
            </div>
          ))}
        </div>
        <div style={S.card}>
          <div style={{ ...S.label, color: S.blue, marginBottom: 8 }}>COMPANY TARGETS</div>
          {Object.entries(model.company_targets || {}).map(([k, v]) => (
            <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", fontSize: 12 }}>
              <span style={{ color: S.dim }}>{k.replace(/_/g, " ")}</span>
              <span style={{ color: S.text, fontWeight: "bold" }}>{String(v)}</span>
            </div>
          ))}
        </div>
      </div>

      <div style={S.card}>
        <div style={{ ...S.label, color: S.green, marginBottom: 8 }}>REGULATORY TAILWINDS</div>
        {model.regulatory_tailwinds?.map((t: string, i: number) => (
          <div key={i} style={{ padding: "4px 0", paddingLeft: 12, borderLeft: "2px solid #2563eb", color: S.text, fontSize: 12, marginBottom: 4 }}>{t}</div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
        <div style={S.card}>
          <div style={{ ...S.label, color: S.yellow, marginBottom: 8 }}>CATALYSTS</div>
          {model.catalysts?.map((c: any, i: number) => (
            <div key={i} style={{ display: "flex", gap: 8, fontSize: 11, padding: "4px 0" }}>
              <span style={{ color: c.impact === "critical" ? S.red : c.impact === "high" ? S.yellow : S.green, fontWeight: "bold", width: 60 }}>{c.impact.toUpperCase()}</span>
              <span style={{ color: S.text, flex: 1 }}>{c.event}</span>
              <span style={{ color: S.dim }}>{c.timeline}</span>
            </div>
          ))}
        </div>
        <div style={S.card}>
          <div style={{ ...S.label, color: S.red, marginBottom: 8 }}>RISKS</div>
          {model.risks?.map((r: string, i: number) => (
            <div key={i} style={{ padding: "4px 0", paddingLeft: 12, borderLeft: "2px solid " + S.red, color: S.text, fontSize: 12, marginBottom: 4 }}>{r}</div>
          ))}
        </div>
      </div>
    </div>
  );
}



function CryptoLive() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [customSymbols, setCustomSymbols] = useState("");
  const [lastRefresh, setLastRefresh] = useState("");
  const [selectedCoin, setSelectedCoin] = useState<any>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const fetchPrices = (syms?: string) => {
    setLoading(true);
    const url = syms ? `${API}/crypto/prices?symbols=${syms}` : `${API}/crypto/prices`;
    fetch(url).then(r => r.json()).then(d => {
      setData(d);
      setLastRefresh(new Date().toLocaleTimeString());
      setLoading(false);
    }).catch(() => setLoading(false));
  };

  useEffect(() => {
    fetchPrices();
    if (autoRefresh) {
      const interval = setInterval(() => fetchPrices(), 15000);
      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  const fmt = (n: number) => {
    if (!n && n !== 0) return "—";
    if (n >= 1e12) return "$" + (n/1e12).toFixed(2) + "T";
    if (n >= 1e9) return "$" + (n/1e9).toFixed(2) + "B";
    if (n >= 1e6) return "$" + (n/1e6).toFixed(1) + "M";
    if (n >= 1e3) return "$" + (n/1e3).toFixed(1) + "K";
    return "$" + n.toFixed(2);
  };

  const fmtPrice = (p: number) => {
    if (!p && p !== 0) return "—";
    if (p >= 1000) return "$" + p.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2});
    if (p >= 1) return "$" + p.toFixed(2);
    if (p >= 0.001) return "$" + p.toFixed(4);
    return "$" + p.toFixed(8);
  };

  const fmtVol = (v: number) => {
    if (!v) return "—";
    if (v >= 1e9) return (v/1e9).toFixed(1) + "B";
    if (v >= 1e6) return (v/1e6).toFixed(1) + "M";
    if (v >= 1e3) return (v/1e3).toFixed(0) + "K";
    return String(v);
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ ...S.label, color: "#f7931a", fontSize: 16 }}>CRYPTO LIVE</span>
          {data && (
            <span style={{ color: S.dim, fontSize: 11 }}>
              Total MCap: {fmt(data.total_market_cap)} | BTC Dom: {data.btc_dominance}%
            </span>
          )}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ color: S.dim, fontSize: 10 }}>{lastRefresh}</span>
          <button onClick={() => setAutoRefresh(!autoRefresh)} style={{ ...S.btnSmall, background: autoRefresh ? "#1a3320" : "#1a2332", color: autoRefresh ? S.green : S.muted, fontSize: 10 }}>
            {autoRefresh ? "\u25CF LIVE 15s" : "\u25CB PAUSED"}
          </button>
          <button onClick={() => fetchPrices()} style={{ ...S.btnSmall, fontSize: 10 }}>\u21BB</button>
        </div>
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
        <input style={{ ...S.input, flex: 1, fontSize: 11 }} placeholder="Add symbols: BTC,ETH,SOL..." value={customSymbols} onChange={e => setCustomSymbols(e.target.value)} onKeyDown={e => { if (e.key === "Enter") fetchPrices(customSymbols || undefined); }} />
        <button style={{ ...S.btn, fontSize: 10, padding: "4px 12px" }} onClick={() => fetchPrices(customSymbols || undefined)}>FETCH</button>
      </div>

      {data?.gainers && (
        <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
          <div style={{ ...S.card, flex: 1, padding: "8px 12px" }}>
            <div style={{ color: S.green, fontSize: 10, fontWeight: "bold", marginBottom: 4 }}>TOP GAINERS</div>
            {data.gainers.map((c: any) => (
              <div key={c.symbol} style={{ display: "flex", justifyContent: "space-between", fontSize: 12, padding: "2px 0" }}>
                <span style={{ color: "#f7931a", fontWeight: "bold" }}>{c.symbol}</span>
                <span style={{ color: "#0d9f4f", fontWeight: "bold" }}>+{c.change_pct}%</span>
              </div>
            ))}
          </div>
          <div style={{ ...S.card, flex: 1, padding: "8px 12px" }}>
            <div style={{ color: S.red, fontSize: 10, fontWeight: "bold", marginBottom: 4 }}>TOP LOSERS</div>
            {data.losers.map((c: any) => (
              <div key={c.symbol} style={{ display: "flex", justifyContent: "space-between", fontSize: 12, padding: "2px 0" }}>
                <span style={{ color: "#f7931a", fontWeight: "bold" }}>{c.symbol}</span>
                <span style={{ color: S.red, fontWeight: "bold" }}>{c.change_pct}%</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={S.card}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12, fontFamily: "'DM Sans', sans-serif" }}>
          <thead>
            <tr style={{ borderBottom: "2px solid #30363d" }}>
              {["#", "Coin", "Price", "24h %", "24h High", "24h Low", "Volume", "Market Cap", "52w High", "From ATH"].map(h => (
                <th key={h} style={{ color: S.dim, fontWeight: "normal", padding: "8px 6px", textAlign: h === "Coin" ? "left" : "right", fontSize: 10 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data?.coins?.filter((c: any) => c.status === "ok").map((c: any, i: number) => (
              <tr key={c.symbol} onClick={() => setSelectedCoin(selectedCoin?.symbol === c.symbol ? null : c)} style={{ borderBottom: "1px solid #21262d", cursor: "pointer", background: selectedCoin?.symbol === c.symbol ? "#0d1a14" : "transparent" }}>
                <td style={{ padding: "8px 6px", color: S.dim, textAlign: "right" }}>{i + 1}</td>
                <td style={{ padding: "8px 6px", textAlign: "left" }}>
                  <span style={{ color: "#f7931a", fontWeight: "bold", fontSize: 13 }}>{c.symbol}</span>
                </td>
                <td style={{ padding: "8px 6px", color: S.text, fontWeight: "bold", textAlign: "right", fontSize: 13 }}>{fmtPrice(c.price)}</td>
                <td style={{ padding: "8px 6px", color: c.change_pct >= 0 ? S.green : S.red, fontWeight: "bold", textAlign: "right" }}>
                  {c.change_pct >= 0 ? "+" : ""}{c.change_pct}%
                </td>
                <td style={{ padding: "8px 6px", color: S.dim, textAlign: "right" }}>{fmtPrice(c.high_24h)}</td>
                <td style={{ padding: "8px 6px", color: S.dim, textAlign: "right" }}>{fmtPrice(c.low_24h)}</td>
                <td style={{ padding: "8px 6px", color: S.text, textAlign: "right" }}>{fmtVol(c.volume)}</td>
                <td style={{ padding: "8px 6px", color: S.text, textAlign: "right" }}>{fmt(c.market_cap)}</td>
                <td style={{ padding: "8px 6px", color: S.dim, textAlign: "right" }}>{fmtPrice(c.high_52w)}</td>
                <td style={{ padding: "8px 6px", color: (c.pct_from_ath || 0) > -10 ? S.green : (c.pct_from_ath || 0) > -30 ? S.yellow : S.red, textAlign: "right" }}>
                  {c.pct_from_ath != null ? c.pct_from_ath + "%" : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selectedCoin && (
        <div style={{ ...S.card, marginTop: 8, borderLeft: "3px solid #f7931a" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
            <span style={{ color: "#f7931a", fontWeight: "bold", fontSize: 18 }}>{selectedCoin.symbol}</span>
            <span style={{ color: S.text, fontWeight: "bold", fontSize: 18 }}>{fmtPrice(selectedCoin.price)}</span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
            <div><div style={{ color: S.dim, fontSize: 10 }}>24h Change</div><div style={{ color: selectedCoin.change_pct >= 0 ? S.green : S.red, fontWeight: "bold" }}>{selectedCoin.change_pct >= 0 ? "+" : ""}{selectedCoin.change_pct}%</div></div>
            <div><div style={{ color: S.dim, fontSize: 10 }}>24h Volume</div><div style={{ color: S.text }}>{fmtVol(selectedCoin.volume)}</div></div>
            <div><div style={{ color: S.dim, fontSize: 10 }}>Market Cap</div><div style={{ color: S.text }}>{fmt(selectedCoin.market_cap)}</div></div>
            <div><div style={{ color: S.dim, fontSize: 10 }}>From 52w High</div><div style={{ color: S.red }}>{selectedCoin.pct_from_ath}%</div></div>
            <div><div style={{ color: S.dim, fontSize: 10 }}>24h High</div><div style={{ color: S.text }}>{fmtPrice(selectedCoin.high_24h)}</div></div>
            <div><div style={{ color: S.dim, fontSize: 10 }}>24h Low</div><div style={{ color: S.text }}>{fmtPrice(selectedCoin.low_24h)}</div></div>
            <div><div style={{ color: S.dim, fontSize: 10 }}>52w High</div><div style={{ color: S.text }}>{fmtPrice(selectedCoin.high_52w)}</div></div>
            <div><div style={{ color: S.dim, fontSize: 10 }}>52w Low</div><div style={{ color: S.text }}>{fmtPrice(selectedCoin.low_52w)}</div></div>
          </div>
        </div>
      )}
    </div>
  );
}


function SectorsView() {
  const [sectors, setSectors] = useState<any>({});
  const [activeSector, setActiveSector] = useState("photonics");

  useEffect(() => {
    fetch(`${API}/sectors`).then(r=>r.json()).then(setSectors);
  }, []);

  const sectorColors: any = { photonics: S.green, healthcare: S.blue, semis: S.yellow, energy: S.red };
  const sec = sectors[activeSector] || {};

  return (
    <div>
      <div style={{ display: "flex", gap: 0, marginBottom: 16, borderBottom: "1px solid #30363d" }}>
        {["photonics", "healthcare", "semis", "energy"].map(s => (
          <button key={s} onClick={() => setActiveSector(s)} style={{ padding: "8px 16px", background: activeSector === s ? "#0d1117" : "transparent", color: activeSector === s ? (sectorColors[s] || S.green) : S.muted, border: "none", borderBottom: activeSector === s ? "2px solid " + (sectorColors[s] || S.green) : "2px solid transparent", cursor: "pointer", fontFamily: "'DM Sans', sans-serif", fontSize: 12, textTransform: "uppercase" as const }}>{s}</button>
        ))}
      </div>

      {sec && (
        <div>
          <div style={S.card}>
            <div style={{ ...S.label, color: sectorColors[activeSector], fontSize: 14, marginBottom: 4 }}>{sec.theme}</div>
            <div style={{ color: S.dim, fontSize: 11, marginBottom: 12 }}>Key metric: {sec.key_metric}</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {sec.tickers?.map((t: string) => (
                <div key={t} style={{ padding: "8px 16px", background: S.bg, borderRadius: 4, border: "1px solid #30363d", cursor: "pointer" }}>
                  <span style={{ color: sectorColors[activeSector], fontWeight: "bold", fontSize: 14 }}>{t}</span>
                </div>
              ))}
            </div>
          </div>

          <div style={S.card}>
            <div style={{ ...S.label, marginBottom: 8 }}>PORTFOLIO IMPORT</div>
            <div style={{ color: S.dim, fontSize: 12, marginBottom: 8 }}>Upload your Fidelity CSV or manually enter positions to track P&L, cost bases, and options exposure across all sectors.</div>
            <div style={{ display: "flex", gap: 8 }}>
              <button style={S.btn}>Upload Fidelity CSV</button>
              <button style={{ ...S.btn, background: "#21262d" }}>Manual Entry</button>
              <button style={{ ...S.btn, background: "#21262d" }}>Import Options</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function PhotonicsExport() {
  const [exportTab, setExportTab] = useState("memo");
  const [memoTicker, setMemoTicker] = useState("COHR");
  const [generating, setGenerating] = useState(false);
  const [memoContent, setMemoContent] = useState("");
  const [digestContent, setDigestContent] = useState("");
  const [threadContent, setThreadContent] = useState("");
  const [endpoints, setEndpoints] = useState<any[]>([]);

  useEffect(() => {
    fetch(API.replace("/photonics", "/photonics/export/api-docs")).then(r => r.json()).then(d => setEndpoints(d.endpoints || []));
  }, []);

  const generateMemo = () => {
    setGenerating(true);
    setMemoContent("Generating AI-powered investment memo for " + memoTicker + "...");
    fetch(`${API}/simulate/ai-memo`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ticker: memoTicker })
    }).then(r => r.json()).then(data => {
      if (data.error) {
        setMemoContent("ERROR: " + data.error);
      } else {
        setMemoContent(data.memo || "No memo generated");
      }
      setGenerating(false);
    }).catch(err => { setMemoContent("ERROR: " + err.message); setGenerating(false); });
  };
  const generateDigest = () => {
    setGenerating(true);
    setTimeout(() => {
      setDigestContent(`═══════════════════════════════════════════════════
 WEEKLY PHOTONICS DIGEST
 Week of ${new Date().toLocaleDateString()}
═══════════════════════════════════════════════════

📊 PRICE SUMMARY
Best: AAOI +12.3% | Worst: POET -8.1%
In buy zone: AXTI ($14.20 vs $15 target), ALMU ($9.80)
Exited buy zone: COHR (rallied above $230)

🔬 RESEARCH ADDED
• New deep dive on InP wafer capacity expansion
• Updated COHR thesis post Q4 earnings

💰 UPCOMING EARNINGS
• COHR reporting Wed after close
• MRVL reporting Thu after close
• Setup: IV elevated, whisper numbers above consensus

📡 SIGNALS
• Unusual call buying in CRDO ($2.1M premium)
• AXTI insider bought 50K shares at $14.50
• Social velocity spike: POET 3.2x normal

⚡ CATALYSTS THIS WEEK
• OFC Conference presentations (3 companies)
• AXTI capacity expansion update expected
• Meta capex guidance at investor day

🎯 ACTION ITEMS
□ Review COHR position sizing pre-earnings
□ Update MRVL thesis scorecard
□ Research POET social spike catalyst
═══════════════════════════════════════════════════`);
      setGenerating(false);
    }, 1500);
  };

  const generateThread = () => {
    setGenerating(true);
    setTimeout(() => {
      setThreadContent(`🧵 PHOTONICS SUPPLY CHAIN THREAD

1/ The photonics supply chain has 8 critical steps from raw materials to your data center. Most investors only look at Step 7 (transceivers). Here's why that's a mistake. 👇

2/ Step 1: MINING — Indium is a byproduct of zinc smelting. 70% comes from China. If zinc smelters cut production, indium supply tightens 6 months later. Nobody on fintwit tracks zinc futures. We do.

3/ Step 2: SUBSTRATE — AXTI and ALMU turn raw indium into InP wafers. This is the tightest bottleneck right now. Lead times extended to 14 weeks. Every transceiver starts here.

4/ Step 3-4: EPITAXY & FAB — This is where the magic happens. Molecular beam epitaxy grows crystal layers atom by atom. TSEM and GFS provide foundry capacity. Utilization at 92%.

5/ Step 5-6: ASSEMBLY & TRANSCEIVER — COHR, AAOI, FN. This is where Wall Street focuses. But if you understand Steps 1-4, you can predict Step 5-6 output 2 quarters ahead.

6/ The key insight: track UPSTREAM to predict DOWNSTREAM. Wafer shipments → transceiver output → data center buildout. The lag is 2-3 quarters. This is your edge.

7/ Currently tracking 19 names across all 8 steps. 3 in buy zones. The supply chain health score is GREEN at Steps 1-4 and YELLOW at Steps 5-6 (capacity catching up to demand).

/end 🔬`);
      setGenerating(false);
    }, 1500);
  };

  return (
    <div>
      <div style={{ display: "flex", gap: 0, marginBottom: 16, borderBottom: "1px solid #30363d" }}>
        {["memo", "digest", "thread", "api"].map(t => (
          <button key={t} onClick={() => setExportTab(t)} style={{ padding: "8px 16px", background: exportTab === t ? "#0d1117" : "transparent", color: exportTab === t ? S.green : S.muted, border: "none", borderBottom: exportTab === t ? "2px solid #2563eb" : "2px solid transparent", cursor: "pointer", fontFamily: "'DM Sans', sans-serif", fontSize: 12, textTransform: "uppercase" }}>{t}</button>
        ))}
      </div>

      {exportTab === "memo" && (
        <div>
          <div style={{ ...S.card, display: "flex", gap: 8, alignItems: "center" }}>
            <span style={S.label}>TICKER</span>
            <select style={S.select} value={memoTicker} onChange={e => setMemoTicker(e.target.value)}>
              {["COHR","MRVL","CRDO","ANET","POET","AAOI","AXTI","CIEN","FN","LWLG"].map(t => <option key={t} value={t}>{t}</option>)}
            </select>
            <button style={S.btn} onClick={generateMemo} disabled={generating}>{generating ? "GENERATING..." : "📄 GENERATE MEMO"}</button>
            {memoContent && <button style={S.btnSecondary} onClick={() => navigator.clipboard.writeText(memoContent)}>📋 COPY</button>}
          </div>
          {memoContent && (
            <div style={{ ...S.card, marginTop: 8 }}>
              <pre style={{ color: S.text, fontSize: 12, whiteSpace: "pre-wrap", fontFamily: "'DM Sans', sans-serif", lineHeight: 1.6, margin: 0 }}>{memoContent}</pre>
            </div>
          )}
        </div>
      )}

      {exportTab === "digest" && (
        <div>
          <div style={{ ...S.card, display: "flex", gap: 8, alignItems: "center" }}>
            <button style={S.btn} onClick={generateDigest} disabled={generating}>{generating ? "GENERATING..." : "📊 GENERATE WEEKLY DIGEST"}</button>
            {digestContent && <button style={S.btnSecondary} onClick={() => navigator.clipboard.writeText(digestContent)}>📋 COPY</button>}
          </div>
          {digestContent && (
            <div style={{ ...S.card, marginTop: 8 }}>
              <pre style={{ color: S.text, fontSize: 12, whiteSpace: "pre-wrap", fontFamily: "'DM Sans', sans-serif", lineHeight: 1.6, margin: 0 }}>{digestContent}</pre>
            </div>
          )}
        </div>
      )}

      {exportTab === "thread" && (
        <div>
          <div style={{ ...S.card, display: "flex", gap: 8, alignItems: "center" }}>
            <button style={S.btn} onClick={generateThread} disabled={generating}>{generating ? "GENERATING..." : "🐦 GENERATE THREAD"}</button>
            {threadContent && <button style={S.btnSecondary} onClick={() => navigator.clipboard.writeText(threadContent)}>📋 COPY</button>}
          </div>
          {threadContent && (
            <div style={{ ...S.card, marginTop: 8 }}>
              <pre style={{ color: S.text, fontSize: 12, whiteSpace: "pre-wrap", fontFamily: "'DM Sans', sans-serif", lineHeight: 1.6, margin: 0 }}>{threadContent}</pre>
            </div>
          )}
        </div>
      )}

      {exportTab === "api" && (
        <div style={S.card}>
          <div style={{ ...S.label, marginBottom: 12 }}>API ENDPOINTS — {endpoints.length} AVAILABLE</div>
          <div style={{ color: S.muted, fontSize: 12, marginBottom: 16 }}>Every feature exposed as an API. Build mobile widgets, Apple Watch complications, Telegram bots, Shortcuts automations.</div>
          {endpoints.map((ep, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 0", borderBottom: "1px solid #21262d" }}>
              <span style={{ color: ep.method === "GET" ? S.green : S.yellow, fontWeight: "bold", width: 40, fontSize: 11 }}>{ep.method}</span>
              <span style={{ color: S.cyan, fontFamily: "'DM Sans', sans-serif", fontSize: 12, flex: 1 }}>{ep.path}</span>
              <span style={{ color: S.muted, fontSize: 11 }}>{ep.description}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function PhotonicsCenter({ dark = true }: { dark?: boolean }) {
  // Update module-level S so all sub-components pick up the theme
  S = getS(dark);
  const [subTab, setSubTab] = useState("DASHBOARD");
  return (
    <div style={{ ...S.mono, color: S.text, background: S.bgDeep, borderRadius: 8, padding: 4 }}>
      <div style={{ display: "flex", gap: 0, marginBottom: 20, borderBottom: "1px solid #30363d", overflowX: "auto" }}>
        {PHOTONICS_SUBTABS.map(t => (
          <button key={t} onClick={() => setSubTab(t)}
            style={{
              padding: "10px 16px", background: subTab === t ? "#0d1117" : "transparent",
              color: subTab === t ? "#2ea043" : "#7d8590", border: "none",
              borderBottom: subTab === t ? "2px solid #2ea043" : "2px solid transparent",
              cursor: "pointer", fontFamily: "'DM Sans', sans-serif", fontSize: 12, fontWeight: subTab === t ? "bold" : "normal",
              transition: "all 0.2s", whiteSpace: "nowrap", letterSpacing: 0.5
            }}>
            {t}
          </button>
        ))}
      </div>
      <PremarketBanner />
        {subTab === "DASHBOARD" && <PhotonicsDashboard onNavigate={setSubTab} />}
      {subTab === "WATCHLIST" && <PhotonicsWatchlist />}
      {subTab === "SUPPLY CHAIN" && <SupplyChainMap />}
      {subTab === "RESEARCH" && <ResearchLibrary />}
      {subTab === "AI ANALYST" && <PhotonicsAI />}
      {subTab === "EARNINGS" && <EarningsWarRoom />}
      {subTab === "THESIS" && <ThesisScorecard />}
      {subTab === "CATALYSTS" && <CatalystCalendar />}
      {subTab === "TECHNICALS" && <TechnicalScanner />}
      {subTab === "PORTFOLIO" && <PortfolioOverlay />}
      {subTab === "RS" && <RelativeStrength />}
      {subTab === "RISK" && <RiskAnalytics />}
      {subTab === "NEWS" && <NewsFeed />}
      {subTab === "ALERTS" && <AlertsPanel />}
      {subTab === "EDUCATION" && <PhotonicsEducation />}
        {subTab === "GRAPH" && <PhotonicsGraph />}
        {subTab === "MODELS" && <PhotonicsModels />}
        {subTab === "SIGNALS" && <PhotonicsSignals />}
        {subTab === "SIMULATE" && <PhotonicsSimulate />}
        {subTab === "PIPELINE" && <PhotonicsPipeline />}
        {subTab === "CONSTRUCT" && <PhotonicsConstruct />}
        {subTab === "EXPORT" && <PhotonicsExport />}
    </div>
  );
}

function PhotonicsDashboard({ onNavigate }: { onNavigate: (tab: string) => void }) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    fetch(`${API}/dashboard`).then(r => r.json()).then(setData).catch(console.error).finally(() => setLoading(false));
  }, []);
  if (loading) return <div style={{ color: S.muted, padding: 40, textAlign: "center" }}>Loading dashboard...</div>;
  if (!data) return <div style={{ color: S.red, padding: 40 }}>Failed to load dashboard</div>;
  const moversData = (data.top_movers || []).map((m: any) => ({ ticker: m.ticker, change: m.change_pct || 0 }));
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div style={{ fontSize: 18, color: S.cyan, fontWeight: "bold" }}>PHOTONICS COMMAND CENTER</div>
        <div style={{ color: S.dim, fontSize: 11 }}>19 tickers · {data.research_count} research docs · {data.thesis_count} thesis items</div>
      </div>
      {/* Metric cards with colored left borders */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 20 }}>
        {[
          { label: "Buy Zone", value: data.buy_zone_count, color: data.buy_zone_count > 0 ? S.green : S.dim, sub: "tickers at target" },
          { label: "Universe", value: data.total_tickers, color: S.blue, sub: "tracked companies" },
          { label: "Research", value: data.research_count, color: S.cyan, sub: "deep dives stored" },
          { label: "Catalysts", value: data.upcoming_catalysts?.length || 0, color: S.yellow, sub: "upcoming events" },
        ].map(c => (
          <div key={c.label} style={{ ...S.card, borderLeft: `3px solid ${c.color}`, position: "relative", overflow: "hidden" }}>
            <div style={{ position: "absolute", top: 0, right: 0, width: 50, height: 50, background: `${c.color}10`, borderRadius: "0 0 0 50px" }} />
            <div style={S.label}>{c.label}</div>
            <div style={{ fontSize: 32, fontWeight: "bold", color: c.color, lineHeight: 1.2 }}>{c.value}</div>
            <div style={{ color: S.dim, fontSize: 11, marginTop: 4 }}>{c.sub}</div>
          </div>
        ))}
      </div>
      {/* Buy zone alerts */}
      {data.buy_zone_count > 0 && (
        <div style={{ ...S.card, borderColor: S.green, background: "rgba(46, 160, 67, 0.06)" }}>
          <div style={{ color: S.green, fontWeight: "bold", marginBottom: 8 }}>🟢 BUY ZONE ALERTS</div>
          <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
            {data.buy_zone_tickers.map((t: any) => (
              <div key={t.ticker} style={{ background: S.bgDeep, borderRadius: 6, padding: "6px 12px", border: "1px solid rgba(46,160,67,0.2)" }}>
                <span style={{ color: S.green, fontWeight: "bold" }}>{t.ticker}</span>
                <span style={{ color: S.muted, fontSize: 12 }}> ${t.price} → ${t.target}</span>
              </div>
            ))}
          </div>
        </div>
      )}
      {/* Top Movers bar chart + Catalysts */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <div style={S.card}>
          <div style={{ color: S.text, fontWeight: "bold", marginBottom: 12, fontSize: 13 }}>TOP MOVERS TODAY</div>
          {moversData.length > 0 ? (
            <ResponsiveContainer width="100%" height={Math.max(160, moversData.length * 28)}>
              <BarChart data={moversData} layout="vertical" margin={{ top: 0, right: 20, left: 45, bottom: 0 }}>
                <XAxis type="number" fontSize={10} tick={{ fill: S.dim }} tickFormatter={(v: number) => `${v}%`} axisLine={false} />
                <YAxis type="category" dataKey="ticker" fontSize={11} tick={{ fill: S.text }} axisLine={false} tickLine={false} width={45} />
                <Tooltip content={<ChartTooltip />} />
                <Bar dataKey="change" name="Change %" radius={[0, 4, 4, 0]}>
                  {moversData.map((m: any, i: number) => (
                    <Cell key={i} fill={m.change >= 0 ? S.green : S.red} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : <div style={{ color: S.dim, fontSize: 12 }}>No mover data available</div>}
        </div>
        <div style={S.card}>
          <div style={{ color: S.text, fontWeight: "bold", marginBottom: 12, fontSize: 13 }}>UPCOMING CATALYSTS</div>
          {data.upcoming_catalysts?.length > 0 ? data.upcoming_catalysts.slice(0, 6).map((c: any) => (
            <div key={c.id} style={{ padding: "6px 0", borderBottom: "1px solid #21262d" }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: S.blue, fontWeight: "bold" }}>{c.ticker}</span>
                <span style={{ color: S.dim, fontSize: 11 }}>{c.date}</span>
              </div>
              <div style={{ color: S.muted, fontSize: 12 }}>{c.title}</div>
            </div>
          )) : <div style={{ color: S.dim, fontSize: 12 }}>No upcoming catalysts. Add some in the CATALYSTS tab.</div>}
        </div>
      </div>
      {/* Supply chain step performance grid */}
      <div style={{ ...S.card, marginTop: 12 }}>
        <div style={{ color: S.text, fontWeight: "bold", marginBottom: 12, fontSize: 13 }}>SUPPLY CHAIN OVERVIEW</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(8, 1fr)", gap: 6 }}>
          {Object.entries(STEP_NAMES).map(([step, name]) => (
            <div key={step} style={{ background: S.bgDeep, borderRadius: 6, padding: "10px 6px", textAlign: "center", border: "1px solid #30363d", cursor: "pointer" }}
              onClick={() => onNavigate("SUPPLY CHAIN")}>
              <div style={{ fontSize: 18, marginBottom: 2 }}>{["⛏️","💎","🔬","🏭","✂️","🔧","📡","🖥️"][Number(step)]}</div>
              <div style={{ color: S.muted, fontSize: 9, letterSpacing: 0.5 }}>{name.toUpperCase()}</div>
            </div>
          ))}
        </div>
      </div>
      {/* Navigation buttons */}
      <div style={{ display: "flex", gap: 8, marginTop: 16, flexWrap: "wrap" }}>
        {["WATCHLIST", "RESEARCH", "AI ANALYST", "EARNINGS", "THESIS", "EDUCATION"].map(t => (
          <button key={t} onClick={() => onNavigate(t)} style={{ ...S.btnSecondary, fontSize: 11 }}>{t} →</button>
        ))}
      </div>
    </div>
  );
}

function PhotonicsWatchlist() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [editingTicker, setEditingTicker] = useState<string | null>(null);
  const [editTarget, setEditTarget] = useState("");
  const [sortCol, setSortCol] = useState<string>("pct_to_target");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [selectedTicker, setSelectedTicker] = useState<string | null>(null);
  const [hoveredRow, setHoveredRow] = useState<string | null>(null);
  const fetchWatchlist = async () => {
    setLoading(true);
    try { const res = await fetch(`${API}/watchlist`); setData(await res.json()); }
    catch (e) { console.error(e); }
    setLoading(false);
  };
  useEffect(() => { fetchWatchlist(); }, []);
  const updateTarget = async (ticker: string) => {
    await fetch(`${API}/watchlist/${ticker}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ target: parseFloat(editTarget) }) });
    setEditingTicker(null); fetchWatchlist();
  };
  if (loading) return <div style={{ color: S.muted, padding: 40, textAlign: "center" }}>Fetching live prices for 19 tickers...</div>;
  if (!data) return <div style={{ color: S.red }}>Failed to load</div>;
  let items = data.watchlist || [];
  if (filter === "buy_zone") items = items.filter((w: any) => w.in_buy_zone);
  if (filter === "pure_play") items = items.filter((w: any) => w.pure_play);
  const buyZoneCount = (data.watchlist || []).filter((w: any) => w.in_buy_zone).length;
  // Sort
  const sortedItems = [...items].sort((a: any, b: any) => {
    let av = a[sortCol], bv = b[sortCol];
    if (typeof av === "string") av = av.toLowerCase();
    if (typeof bv === "string") bv = bv.toLowerCase();
    if (av == null) return 1; if (bv == null) return -1;
    return sortDir === "asc" ? (av > bv ? 1 : -1) : (av < bv ? 1 : -1);
  });
  const chartData = items.map((w: any) => ({ ticker: w.ticker, pct: w.pct_to_target ?? 0 })).sort((a: any, b: any) => a.pct - b.pct);
  const pctColor = (p: number) => p <= 0 ? S.green : p <= 10 ? S.yellow : p <= 25 ? S.blue : S.dim;
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div>
          <span style={{ color: S.text, fontWeight: "bold", fontSize: 15 }}>PHOTONICS WATCHLIST</span>
          <span style={{ color: S.dim, fontSize: 12, marginLeft: 12 }}>{items.length} tickers</span>
          {buyZoneCount > 0 && <span style={{ color: S.green, fontSize: 12, marginLeft: 12, fontWeight: "bold" }}>{buyZoneCount} in buy zone</span>}
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          {(["all", "buy_zone", "pure_play"] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              style={{ ...S.btnSmall, background: filter === f ? "#1a8c5e" : "#21262d", color: filter === f ? "#fff" : "#8b949e" }}>
              {f === "all" ? "ALL" : f === "buy_zone" ? "BUY ZONE" : "PURE PLAY"}
            </button>
          ))}
          <button onClick={fetchWatchlist} style={S.btnSmall}>↻ REFRESH</button>
        </div>
      </div>
      {/* Distance to target chart */}
      {chartData.length > 0 && (
        <div style={{ ...S.card, marginBottom: 16 }}>
          <div style={{ color: S.text, fontWeight: "bold", marginBottom: 12, fontSize: 13 }}>DISTANCE TO TARGET</div>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={chartData} margin={{ top: 5, right: 10, left: 10, bottom: 30 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#21262d" />
              <XAxis dataKey="ticker" fontSize={10} tick={{ fill: S.text }} angle={-45} textAnchor="end" />
              <YAxis fontSize={10} tick={{ fill: S.dim }} tickFormatter={(v: number) => `${v}%`} />
              <Tooltip content={<ChartTooltip />} />
              <Bar dataKey="pct" name="% to Target" radius={[4, 4, 0, 0]}>
                {chartData.map((w: any, i: number) => (
                  <Cell key={i} fill={pctColor(w.pct)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <div style={{ display: "flex", gap: 16, justifyContent: "center", marginTop: 8 }}>
            {[{ label: "Buy Zone (≤0%)", color: S.green }, { label: "Near (≤10%)", color: S.yellow }, { label: "Far (≤25%)", color: S.blue }, { label: "Distant (>25%)", color: S.dim }].map(l => (
              <div key={l.label} style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 10, color: S.muted }}>
                <div style={{ width: 8, height: 8, borderRadius: 2, background: l.color }} />{l.label}
              </div>
            ))}
          </div>
        </div>
      )}
      {/* Sortable table */}
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ borderBottom: "2px solid #30363d" }}>
              {[
                { key: "ticker", label: "TICKER" }, { key: "current_price", label: "PRICE" },
                { key: "change_pct", label: "CHG%" }, { key: "target", label: "TARGET" },
                { key: "pct_to_target", label: "% TO TARGET" }, { key: "step", label: "STEP" },
                { key: "in_buy_zone", label: "STATUS" },
              ].map(h => (
                <th key={h.key} onClick={() => { if (sortCol === h.key) setSortDir(sortDir === "asc" ? "desc" : "asc"); else { setSortCol(h.key); setSortDir("asc"); } }}
                  style={{ padding: "8px 12px", textAlign: "left", color: sortCol === h.key ? S.cyan : S.muted, fontSize: 11, fontWeight: sortCol === h.key ? "bold" : "normal", letterSpacing: 1, cursor: "pointer", userSelect: "none" }}>
                  {h.label} {sortCol === h.key ? (sortDir === "asc" ? "▲" : "▼") : ""}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sortedItems.map((w: any) => (
              <tr key={w.ticker}
                onMouseEnter={() => setHoveredRow(w.ticker)} onMouseLeave={() => setHoveredRow(null)}
                onClick={() => setSelectedTicker(selectedTicker === w.ticker ? null : w.ticker)}
                style={{ borderBottom: "1px solid #21262d", background: hoveredRow === w.ticker ? "#1c2333" : w.in_buy_zone ? "rgba(46, 160, 67, 0.04)" : "transparent", cursor: "pointer", transition: "background 0.15s" }}>
                <td style={{ padding: "10px 12px" }}>
                  <span style={{ color: S.text, fontWeight: "bold" }}>{w.ticker}</span>
                  <span style={{ color: S.dim, fontSize: 11, marginLeft: 8 }}>{w.name}</span>
                  {w.pure_play && <span style={{ color: S.cyan, fontSize: 9, marginLeft: 6, border: "1px solid #39d353", padding: "1px 4px", borderRadius: 3 }}>PP</span>}
                </td>
                <td style={{ padding: "10px 12px", color: S.text, fontWeight: "bold" }}>${w.current_price || "—"}</td>
                <td style={{ padding: "10px 12px", color: w.change_pct >= 0 ? S.green : S.red, fontWeight: "bold" }}>
                  {w.change_pct >= 0 ? "+" : ""}{w.change_pct}%
                </td>
                <td style={{ padding: "10px 12px" }} onClick={e => e.stopPropagation()}>
                  {editingTicker === w.ticker ? (
                    <div style={{ display: "flex", gap: 4 }}>
                      <input value={editTarget} onChange={e => setEditTarget(e.target.value)} onKeyDown={e => e.key === "Enter" && updateTarget(w.ticker)}
                        style={{ ...S.input, width: 80, padding: "4px 8px" }} autoFocus />
                      <button onClick={() => updateTarget(w.ticker)} style={{ ...S.btnSmall, background: S.green, color: "#fff" }}>✓</button>
                    </div>
                  ) : (
                    <span onClick={() => { setEditingTicker(w.ticker); setEditTarget(String(w.target)); }}
                      style={{ color: S.blue, cursor: "pointer" }}>${w.target}</span>
                  )}
                </td>
                <td style={{ padding: "10px 12px" }}>
                  <span style={{ color: pctColor(w.pct_to_target ?? 99), background: `${pctColor(w.pct_to_target ?? 99)}18`, padding: "2px 8px", borderRadius: 4, fontSize: 12, fontWeight: "bold" }}>
                    {w.pct_to_target !== null ? `${w.pct_to_target > 0 ? "+" : ""}${w.pct_to_target}%` : "—"}
                  </span>
                </td>
                <td style={{ padding: "10px 12px", color: S.dim, fontSize: 11 }}>{STEP_NAMES[w.step] || `Step ${w.step}`}</td>
                <td style={{ padding: "10px 12px" }}>
                  {w.in_buy_zone && <span style={{ color: S.green, fontWeight: "bold", fontSize: 12 }}>● BUY ZONE</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {/* Detail panel */}
      {selectedTicker && (() => {
        const w = items.find((i: any) => i.ticker === selectedTicker);
        if (!w) return null;
        return (
          <div style={{ ...S.card, borderColor: S.cyan, marginTop: 12, borderLeft: `3px solid ${S.cyan}` }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <div>
                <span style={{ color: S.text, fontWeight: "bold", fontSize: 20 }}>{w.ticker}</span>
                <span style={{ color: S.dim, fontSize: 13, marginLeft: 12 }}>{w.name}</span>
              </div>
              <button onClick={() => setSelectedTicker(null)} style={S.btnSmall}>✕ CLOSE</button>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 10 }}>
              {[
                { label: "PRICE", value: `$${w.current_price}`, color: S.text },
                { label: "CHANGE", value: `${w.change_pct >= 0 ? "+" : ""}${w.change_pct}%`, color: w.change_pct >= 0 ? S.green : S.red },
                { label: "TARGET", value: `$${w.target}`, color: S.blue },
                { label: "% TO TARGET", value: `${w.pct_to_target != null ? (w.pct_to_target > 0 ? "+" : "") + w.pct_to_target + "%" : "—"}`, color: pctColor(w.pct_to_target ?? 99) },
                { label: "SUPPLY STEP", value: STEP_NAMES[w.step] || `Step ${w.step}`, color: S.cyan },
              ].map(m => (
                <div key={m.label} style={{ background: S.bgDeep, borderRadius: 6, padding: 12, textAlign: "center", border: "1px solid #30363d" }}>
                  <div style={{ color: S.muted, fontSize: 10, letterSpacing: 1, marginBottom: 4 }}>{m.label}</div>
                  <div style={{ color: m.color, fontSize: 18, fontWeight: "bold" }}>{m.value}</div>
                </div>
              ))}
            </div>
            {w.in_buy_zone && <div style={{ marginTop: 12, padding: "8px 12px", background: "rgba(46,160,67,0.08)", border: "1px solid rgba(46,160,67,0.3)", borderRadius: 6, color: S.green, fontSize: 12, fontWeight: "bold" }}>● IN BUY ZONE — Price is at or below target</div>}
          </div>
        );
      })()}
      <div style={{ color: S.dim, fontSize: 11, marginTop: 12 }}>Last updated: {new Date(data.updated_at).toLocaleString()} · Click row for details · Click target price to edit</div>
    </div>
  );
}

function SupplyChainMap() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedStep, setSelectedStep] = useState<number | null>(null);
  const [impactTicker, setImpactTicker] = useState("");
  const [impactEvent, setImpactEvent] = useState("");
  const [impactResult, setImpactResult] = useState<any>(null);
  const [analyzing, setAnalyzing] = useState(false);
  useEffect(() => {
    fetch(`${API}/supply-chain`).then(r => r.json()).then(setData).catch(console.error).finally(() => setLoading(false));
  }, []);
  const analyzeImpact = async () => {
    if (!impactTicker || !impactEvent) return;
    setAnalyzing(true);
    try {
      const res = await fetch(`${API}/ai/analyze-chain-impact`, { method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ticker: impactTicker, event: impactEvent }) });
      setImpactResult(await res.json());
    } catch (e) { console.error(e); }
    setAnalyzing(false);
  };
  if (loading) return <div style={{ color: S.muted, padding: 40, textAlign: "center" }}>Loading supply chain data...</div>;
  if (!data) return <div style={{ color: S.red }}>Failed to load</div>;
  return (
    <div>
      <div style={{ color: S.text, fontWeight: "bold", fontSize: 15, marginBottom: 16 }}>PHOTONICS SUPPLY CHAIN</div>
      <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 8, marginBottom: 20 }}>
        {data.steps.map((step: any, i: number) => (
          <div key={step.step} onClick={() => setSelectedStep(selectedStep === step.step ? null : step.step)}
            style={{ ...S.card, minWidth: 140, flex: "0 0 auto", cursor: "pointer", position: "relative",
              borderColor: selectedStep === step.step ? S.green : step.companies.some((c: any) => c.in_buy_zone) ? S.green : "#1e2733",
              background: selectedStep === step.step ? "rgba(46, 160, 67, 0.05)" : "#0d1117" }}>
            <div style={{ color: S.dim, fontSize: 10, marginBottom: 4 }}>STEP {step.step}</div>
            <div style={{ color: S.text, fontWeight: "bold", fontSize: 12, marginBottom: 8 }}>{step.name}</div>
            {step.companies.map((c: any) => (
              <div key={c.ticker} style={{ display: "flex", justifyContent: "space-between", fontSize: 11, padding: "3px 0" }}>
                <span style={{ color: c.in_buy_zone ? S.green : S.text }}>{c.ticker}</span>
                <span style={{ color: c.change_pct >= 0 ? S.green : S.red }}>{c.change_pct >= 0 ? "+" : ""}{c.change_pct}%</span>
              </div>
            ))}
            {step.companies.length === 0 && <div style={{ color: S.dim, fontSize: 11 }}>No tracked cos</div>}
            {i < data.steps.length - 1 && <div style={{ position: "absolute", right: -12, top: "50%", color: S.dim, fontSize: 16 }}>→</div>}
          </div>
        ))}
      </div>
      {selectedStep !== null && (
        <div style={{ ...S.card, borderColor: S.green }}>
          {(() => {
            const step = data.steps.find((s: any) => s.step === selectedStep);
            return step ? (
              <>
                <div style={{ color: "#0d9f4f", fontWeight: "bold", fontSize: 14, marginBottom: 8 }}>Step {step.step}: {step.name}</div>
                <div style={{ color: S.text, marginBottom: 8, fontSize: 13 }}>{step.description}</div>
                <div style={{ color: S.yellow, fontSize: 12, marginBottom: 12 }}>⚠ Bottleneck: {step.bottleneck}</div>
                {step.companies.map((c: any) => (
                  <div key={c.ticker} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid #30363d" }}>
                    <div><span style={{ color: S.text, fontWeight: "bold" }}>{c.ticker}</span><span style={{ color: S.dim, marginLeft: 8, fontSize: 12 }}>{c.name}</span></div>
                    <div style={{ textAlign: "right" }}>
                      <span style={{ color: S.text, marginRight: 12 }}>${c.price}</span>
                      <span style={{ color: c.change_pct >= 0 ? S.green : S.red }}>{c.change_pct >= 0 ? "+" : ""}{c.change_pct}%</span>
                      {c.in_buy_zone && <span style={{ color: S.green, marginLeft: 8, fontSize: 11 }}>🟢</span>}
                    </div>
                  </div>
                ))}
              </>
            ) : null;
          })()}
        </div>
      )}
      <div style={{ ...S.card, marginTop: 16 }}>
        <div style={{ color: S.text, fontWeight: "bold", marginBottom: 12, fontSize: 13 }}>SUPPLY CHAIN IMPACT ANALYZER</div>
        <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
          <select value={impactTicker} onChange={e => setImpactTicker(e.target.value)} style={{ ...S.select, width: 120 }}>
            <option value="">Ticker</option>
            {data.steps.flatMap((s: any) => s.companies).map((c: any) => (
              <option key={c.ticker} value={c.ticker}>{c.ticker}</option>
            ))}
          </select>
          <input value={impactEvent} onChange={e => setImpactEvent(e.target.value)} placeholder="Describe event (e.g., 'capacity expansion 30%')"
            onKeyDown={e => e.key === "Enter" && analyzeImpact()} style={{ ...S.input, flex: 1 }} />
          <button onClick={analyzeImpact} disabled={analyzing} style={S.btn}>{analyzing ? "Analyzing..." : "ANALYZE"}</button>
        </div>
        {impactResult && (
          <div style={{ color: S.text, fontSize: 13, whiteSpace: "pre-wrap", lineHeight: 1.6, maxHeight: 400, overflowY: "auto" }}>
            {impactResult.analysis}
          </div>
        )}
      </div>
    </div>
  );
}

function ResearchLibrary() {
  const [research, setResearch] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [filterTicker, setFilterTicker] = useState("");
  const [filterTag, setFilterTag] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"list" | "coverage" | "tags">("list");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");
  const [newTags, setNewTags] = useState("");
  const [newSource, setNewSource] = useState("");
  const fetchResearch = async () => {
    setLoading(true);
    let url = `${API}/research`;
    const params: string[] = [];
    if (filterTicker) params.push(`ticker=${filterTicker}`);
    if (filterTag) params.push(`tag=${filterTag}`);
    if (params.length) url += `?${params.join("&")}`;
    try { const res = await fetch(url); const json = await res.json(); setResearch(json.research || []); }
    catch (e) { console.error(e); }
    setLoading(false);
  };
  useEffect(() => { fetchResearch(); }, [filterTicker, filterTag]);
  const addResearch = async () => {
    if (!newTitle || !newContent) return;
    await fetch(`${API}/research`, { method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: newTitle, content: newContent, tags: newTags.split(",").map(t => t.trim()).filter(Boolean), source: newSource }) });
    setNewTitle(""); setNewContent(""); setNewTags(""); setNewSource(""); setShowAdd(false); fetchResearch();
  };
  const deleteResearch = async (id: string) => {
    await fetch(`${API}/research/${id}`, { method: "DELETE" }); fetchResearch();
  };
  // Compute coverage data
  const coverageData = (() => {
    const counts: Record<string, number> = {};
    research.forEach(doc => doc.tickers?.forEach((t: string) => { counts[t] = (counts[t] || 0) + 1; }));
    return Object.entries(counts).map(([ticker, count]) => ({ ticker, count })).sort((a, b) => b.count - a.count);
  })();
  const tagData = (() => {
    const counts: Record<string, number> = {};
    research.forEach(doc => doc.tags?.forEach((t: string) => { counts[t] = (counts[t] || 0) + 1; }));
    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
  })();
  const filteredResearch = research.filter(doc => !searchQuery || doc.title?.toLowerCase().includes(searchQuery.toLowerCase()) || doc.content?.toLowerCase().includes(searchQuery.toLowerCase()));
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div>
          <span style={{ color: S.text, fontWeight: "bold", fontSize: 15 }}>RESEARCH LIBRARY</span>
          <span style={{ color: S.dim, fontSize: 12, marginLeft: 12 }}>{research.length} docs</span>
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          {(["list", "coverage", "tags"] as const).map(v => (
            <button key={v} onClick={() => setViewMode(v)}
              style={{ ...S.btnSmall, background: viewMode === v ? "#1a8c5e" : "#21262d", color: viewMode === v ? "#fff" : "#8b949e" }}>
              {v === "list" ? "📄 LIST" : v === "coverage" ? "📊 COVERAGE" : "🏷️ TAGS"}
            </button>
          ))}
          <button onClick={() => setShowAdd(!showAdd)} style={S.btn}>{showAdd ? "CANCEL" : "+ ADD DEEP DIVE"}</button>
        </div>
      </div>
      {/* Filters & search */}
      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="🔍 Search research..." style={{ ...S.input, width: 220 }} />
        <input value={filterTicker} onChange={e => setFilterTicker(e.target.value.toUpperCase())} placeholder="Filter by ticker" style={{ ...S.input, width: 140 }} />
        <input value={filterTag} onChange={e => setFilterTag(e.target.value)} placeholder="Filter by tag" style={{ ...S.input, width: 140 }} />
        {(filterTicker || filterTag || searchQuery) && <button onClick={() => { setFilterTicker(""); setFilterTag(""); setSearchQuery(""); }} style={S.btnSmall}>Clear</button>}
      </div>
      {/* Coverage chart view */}
      {viewMode === "coverage" && coverageData.length > 0 && (
        <div style={{ ...S.card, marginBottom: 16 }}>
          <div style={{ color: S.text, fontWeight: "bold", marginBottom: 12, fontSize: 13 }}>RESEARCH COVERAGE BY TICKER</div>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={coverageData} margin={{ top: 5, right: 10, left: 10, bottom: 30 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#21262d" />
              <XAxis dataKey="ticker" fontSize={10} tick={{ fill: S.text }} angle={-45} textAnchor="end" />
              <YAxis fontSize={10} tick={{ fill: S.dim }} allowDecimals={false} />
              <Tooltip content={<ChartTooltip />} />
              <Bar dataKey="count" name="Research Docs" fill={S.cyan} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
      {/* Tag cloud view */}
      {viewMode === "tags" && tagData.length > 0 && (
        <div style={{ ...S.card, marginBottom: 16 }}>
          <div style={{ color: S.text, fontWeight: "bold", marginBottom: 12, fontSize: 13 }}>TAG CLOUD</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {tagData.map(([tag, count]) => (
              <button key={tag} onClick={() => { setFilterTag(tag); setViewMode("list"); }}
                style={{ padding: "6px 14px", background: `${S.blue}15`, border: `1px solid ${S.blue}40`, borderRadius: 20, color: S.blue, fontSize: 10 + Math.min(count * 2, 8), cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>
                {tag} <span style={{ color: S.muted, fontSize: 10 }}>({count})</span>
              </button>
            ))}
          </div>
        </div>
      )}
      {showAdd && (
        <div style={{ ...S.card, borderColor: S.green, borderLeft: `3px solid ${S.green}` }}>
          <input value={newTitle} onChange={e => setNewTitle(e.target.value)} placeholder="Title" style={{ ...S.input, marginBottom: 8 }} />
          <textarea value={newContent} onChange={e => setNewContent(e.target.value)} placeholder="Paste your deep dive, analysis, or notes here..."
            style={{ ...S.input, height: 200, resize: "vertical", marginBottom: 8 }} />
          <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
            <input value={newTags} onChange={e => setNewTags(e.target.value)} placeholder="Tags (comma-separated): thesis, earnings, supply-chain" style={{ ...S.input, flex: 1 }} />
            <input value={newSource} onChange={e => setNewSource(e.target.value)} placeholder="Source URL (optional)" style={{ ...S.input, flex: 1 }} />
          </div>
          <button onClick={addResearch} style={S.btn}>SAVE RESEARCH</button>
          <span style={{ color: S.dim, fontSize: 11, marginLeft: 12 }}>Tickers will be auto-detected from content</span>
        </div>
      )}
      {/* Document list */}
      {viewMode === "list" && (loading ? <div style={{ color: S.muted, padding: 20 }}>Loading...</div> :
        filteredResearch.map(doc => (
          <div key={doc.id} style={{ ...S.card, cursor: "pointer", borderLeft: `3px solid ${S.blue}`, transition: "border-color 0.2s" }} onClick={() => setExpanded(expanded === doc.id ? null : doc.id)}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ color: S.text, fontWeight: "bold", fontSize: 14 }}>{doc.title}</div>
                  <span style={{ color: S.dim, fontSize: 14 }}>{expanded === doc.id ? "−" : "+"}</span>
                </div>
                <div style={{ display: "flex", gap: 6, marginTop: 6, flexWrap: "wrap" }}>
                  {doc.tickers?.map((t: string) => <span key={t} style={{ color: S.blue, fontSize: 11, background: "rgba(88,166,255,0.1)", padding: "2px 6px", borderRadius: 3, fontWeight: "bold" }}>{t}</span>)}
                  {doc.tags?.map((t: string) => <span key={t} style={{ color: S.muted, fontSize: 11, background: "#21262d", padding: "2px 6px", borderRadius: 3 }}>{t}</span>)}
                </div>
              </div>
              <div style={{ textAlign: "right", flexShrink: 0, marginLeft: 12 }}>
                <div style={{ color: S.dim, fontSize: 11 }}>{new Date(doc.created_at).toLocaleDateString()}</div>
                <div style={{ color: S.dim, fontSize: 11 }}>{doc.word_count} words · {Math.max(1, Math.round((doc.word_count || 0) / 200))} min read</div>
              </div>
            </div>
            {expanded === doc.id && (
              <div style={{ marginTop: 12 }}>
                <div style={{ color: S.text, fontSize: 13, whiteSpace: "pre-wrap", lineHeight: 1.6, maxHeight: 400, overflowY: "auto",
                  padding: 12, background: S.bgDeep, borderRadius: 6, border: "1px solid #30363d" }}>{doc.content}</div>
                <div style={{ marginTop: 8, display: "flex", gap: 8, justifyContent: "flex-end" }}>
                  {doc.source && <a href={doc.source} target="_blank" rel="noreferrer" style={{ color: S.blue, fontSize: 12 }}>Source ↗</a>}
                  <button onClick={(e) => { e.stopPropagation(); deleteResearch(doc.id); }} style={S.btnDanger}>DELETE</button>
                </div>
              </div>
            )}
          </div>
        ))
      )}
      {!loading && research.length === 0 && viewMode === "list" && (
        <div style={{ color: S.dim, padding: 40, textAlign: "center" }}>No research yet. Click + ADD DEEP DIVE to start building your library.</div>
      )}
    </div>
  );
}

function PhotonicsAI() {
  const [question, setQuestion] = useState("");
  const [focusTicker, setFocusTicker] = useState("");
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const SAMPLE_QUESTIONS = [
    "What are the biggest bottleneck risks in our photonics universe?",
    "Which names are closest to their buy targets right now?",
    "How would a 30% increase in AI GPU shipments ripple through the supply chain?",
    "Compare the competitive positioning of COHR vs AAOI in the transceiver market",
    "What are the leading indicators from substrate companies for downstream demand?",
    "Summarize the bull and bear case for POET Technologies",
  ];
  const ask = async (q?: string) => {
    const question_text = q || question;
    if (!question_text) return;
    setLoading(true);
    setHistory(prev => [...prev, { role: "user", text: question_text }]);
    setQuestion("");
    try {
      const res = await fetch(`${API}/ai/ask`, { method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: question_text, tickers: focusTicker ? [focusTicker] : [] }) });
      const data = await res.json();
      setHistory(prev => [...prev, { role: "ai", text: data.answer, docs: data.research_docs_used }]);
    } catch (e) {
      setHistory(prev => [...prev, { role: "ai", text: "Error: Could not reach AI. Check your API key and server." }]);
    }
    setLoading(false);
  };
  return (
    <div>
      <div style={{ color: S.text, fontWeight: "bold", fontSize: 15, marginBottom: 16 }}>AI RESEARCH ANALYST</div>
      <div style={{ ...S.card, maxHeight: 500, overflowY: "auto", minHeight: 200 }}>
        {history.length === 0 && <div style={{ color: S.dim, padding: 20, textAlign: "center" }}>Ask me anything about the photonics universe. I will use your stored research + live prices to answer.</div>}
        {history.map((msg, i) => (
          <div key={i} style={{ marginBottom: 16, padding: "12px", background: msg.role === "user" ? "rgba(88,166,255,0.05)" : "transparent", borderRadius: 6 }}>
            <div style={{ color: msg.role === "user" ? S.blue : S.green, fontSize: 11, fontWeight: "bold", marginBottom: 6 }}>
              {msg.role === "user" ? "YOU" : "ANALYST"} {msg.docs ? `(${msg.docs} docs referenced)` : ""}
            </div>
            <div style={{ color: S.text, fontSize: 13, whiteSpace: "pre-wrap", lineHeight: 1.6 }}>{msg.text}</div>
          </div>
        ))}
        {loading && <div style={{ color: S.yellow, padding: 12, fontSize: 13 }}>Analyzing across research library and live data...</div>}
      </div>
      {history.length === 0 && (
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 12, marginBottom: 12 }}>
          {SAMPLE_QUESTIONS.map((q, i) => (
            <button key={i} onClick={() => ask(q)} style={{ ...S.btnSmall, fontSize: 11, maxWidth: 300, textAlign: "left" }}>{q}</button>
          ))}
        </div>
      )}
      <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
        <select value={focusTicker} onChange={e => setFocusTicker(e.target.value)} style={{ ...S.select, width: 100 }}>
          <option value="">All</option>
          {DEFAULT_WATCHLIST_TICKERS.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        <input value={question} onChange={e => setQuestion(e.target.value)} onKeyDown={e => e.key === "Enter" && ask()}
          placeholder="Ask about photonics supply chain, tickers, bottlenecks, thesis..." style={{ ...S.input, flex: 1 }} />
        <button onClick={() => ask()} disabled={loading} style={S.btn}>{loading ? "..." : "ASK"}</button>
      </div>
    </div>
  );
}

function EarningsWarRoom() {
  const [earnings, setEarnings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [filterTicker, setFilterTicker] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [form, setForm] = useState({ ticker: "", quarter: "", date: "", est_revenue: "", est_eps: "", guidance_revenue: "", guidance_eps: "", supply_chain_signals: "", pre_notes: "" });
  const [postForm, setPostForm] = useState({ actual_revenue: "", actual_eps: "", post_notes: "", key_quotes: "" });
  const fetchEarnings = async () => {
    setLoading(true);
    let url = `${API}/earnings`;
    if (filterTicker) url += `?ticker=${filterTicker}`;
    try { const res = await fetch(url); const json = await res.json(); setEarnings(json.earnings || []); }
    catch (e) { console.error(e); }
    setLoading(false);
  };
  useEffect(() => { fetchEarnings(); }, [filterTicker]);
  const addEarnings = async () => {
    if (!form.ticker || !form.quarter) return;
    await fetch(`${API}/earnings`, { method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, est_revenue: form.est_revenue ? parseFloat(form.est_revenue) : null, est_eps: form.est_eps ? parseFloat(form.est_eps) : null,
        guidance_revenue: form.guidance_revenue ? parseFloat(form.guidance_revenue) : null, guidance_eps: form.guidance_eps ? parseFloat(form.guidance_eps) : null }) });
    setForm({ ticker: "", quarter: "", date: "", est_revenue: "", est_eps: "", guidance_revenue: "", guidance_eps: "", supply_chain_signals: "", pre_notes: "" });
    setShowAdd(false); fetchEarnings();
  };
  const updatePostEarnings = async (id: string) => {
    await fetch(`${API}/earnings/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ actual_revenue: postForm.actual_revenue ? parseFloat(postForm.actual_revenue) : null,
        actual_eps: postForm.actual_eps ? parseFloat(postForm.actual_eps) : null, post_notes: postForm.post_notes, key_quotes: postForm.key_quotes }) });
    setPostForm({ actual_revenue: "", actual_eps: "", post_notes: "", key_quotes: "" }); fetchEarnings();
  };
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div>
          <span style={{ color: S.text, fontWeight: "bold", fontSize: 15 }}>EARNINGS WAR ROOM</span>
          <span style={{ color: S.dim, fontSize: 12, marginLeft: 12 }}>{earnings.length} records</span>
        </div>
        <button onClick={() => setShowAdd(!showAdd)} style={S.btn}>{showAdd ? "CANCEL" : "+ PRE-EARNINGS PREP"}</button>
      </div>
      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        <select value={filterTicker} onChange={e => setFilterTicker(e.target.value)} style={S.select}>
          <option value="">All Tickers</option>
          {DEFAULT_WATCHLIST_TICKERS.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>
      {showAdd && (
        <div style={{ ...S.card, borderColor: S.yellow }}>
          <div style={{ color: S.yellow, fontWeight: "bold", marginBottom: 12 }}>PRE-EARNINGS PREP SHEET</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 8 }}>
            <div><div style={S.label}>Ticker</div>
              <select value={form.ticker} onChange={e => setForm({...form, ticker: e.target.value})} style={{ ...S.select, width: "100%" }}>
                <option value="">Select</option>{DEFAULT_WATCHLIST_TICKERS.map(t => <option key={t} value={t}>{t}</option>)}
              </select></div>
            <div><div style={S.label}>Quarter</div><input value={form.quarter} onChange={e => setForm({...form, quarter: e.target.value})} placeholder="Q1 2025" style={S.input} /></div>
            <div><div style={S.label}>Date</div><input value={form.date} onChange={e => setForm({...form, date: e.target.value})} type="date" style={S.input} /></div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 8, marginBottom: 8 }}>
            <div><div style={S.label}>Est Revenue ($M)</div><input value={form.est_revenue} onChange={e => setForm({...form, est_revenue: e.target.value})} style={S.input} /></div>
            <div><div style={S.label}>Est EPS</div><input value={form.est_eps} onChange={e => setForm({...form, est_eps: e.target.value})} style={S.input} /></div>
            <div><div style={S.label}>Guidance Rev ($M)</div><input value={form.guidance_revenue} onChange={e => setForm({...form, guidance_revenue: e.target.value})} style={S.input} /></div>
            <div><div style={S.label}>Guidance EPS</div><input value={form.guidance_eps} onChange={e => setForm({...form, guidance_eps: e.target.value})} style={S.input} /></div>
          </div>
          <div style={S.label}>Supply Chain Signals</div>
          <textarea value={form.supply_chain_signals} onChange={e => setForm({...form, supply_chain_signals: e.target.value})}
            placeholder="What are upstream/downstream companies signaling?" style={{ ...S.input, height: 60, marginBottom: 8 }} />
          <div style={S.label}>Pre-Earnings Notes</div>
          <textarea value={form.pre_notes} onChange={e => setForm({...form, pre_notes: e.target.value})}
            placeholder="What to watch for, key questions, positioning thoughts..." style={{ ...S.input, height: 60, marginBottom: 8 }} />
          <button onClick={addEarnings} style={S.btn}>SAVE PREP SHEET</button>
        </div>
      )}
      {loading ? <div style={{ color: S.muted, padding: 20 }}>Loading...</div> :
        earnings.map(e => (
          <div key={e.id} style={{ ...S.card, borderColor: e.beat_miss === "beat" ? S.green : e.beat_miss === "miss" ? S.red : "#1e2733", cursor: "pointer" }}
            onClick={() => setExpanded(expanded === e.id ? null : e.id)}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <div>
                <span style={{ color: S.text, fontWeight: "bold" }}>{e.ticker}</span>
                <span style={{ color: S.dim, marginLeft: 8 }}>{e.name}</span>
                <span style={{ color: S.muted, marginLeft: 12, fontSize: 12 }}>{e.quarter}</span>
              </div>
              <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                <span style={{ color: S.dim, fontSize: 11 }}>{e.date}</span>
                {e.beat_miss && <span style={{ color: e.beat_miss === "beat" ? S.green : e.beat_miss === "miss" ? S.red : S.yellow, fontWeight: "bold", fontSize: 12, textTransform: "uppercase" }}>{e.beat_miss}</span>}
                {!e.actual_revenue && <span style={{ color: S.yellow, fontSize: 11 }}>PENDING</span>}
              </div>
            </div>
            {expanded === e.id && (
              <div style={{ marginTop: 12, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <div>
                  <div style={{ color: S.yellow, fontWeight: "bold", fontSize: 12, marginBottom: 8 }}>PRE-EARNINGS</div>
                  {e.est_revenue && <div style={{ color: S.text, fontSize: 12 }}>Est Revenue: <span style={{ color: S.blue }}>${e.est_revenue}M</span></div>}
                  {e.est_eps && <div style={{ color: S.text, fontSize: 12 }}>Est EPS: <span style={{ color: S.blue }}>${e.est_eps}</span></div>}
                  {e.guidance_revenue && <div style={{ color: S.text, fontSize: 12 }}>Guidance Rev: <span style={{ color: S.cyan }}>${e.guidance_revenue}M</span></div>}
                  {e.supply_chain_signals && <div style={{ color: S.muted, fontSize: 12, marginTop: 4 }}>Signals: {e.supply_chain_signals}</div>}
                  {e.pre_notes && <div style={{ color: S.muted, fontSize: 12, marginTop: 4 }}>Notes: {e.pre_notes}</div>}
                </div>
                <div>
                  <div style={{ color: "#0d9f4f", fontWeight: "bold", fontSize: 12, marginBottom: 8 }}>POST-EARNINGS</div>
                  {e.actual_revenue ? (
                    <>
                      <div style={{ color: S.text, fontSize: 12 }}>Actual Revenue: <span style={{ color: S.green }}>${e.actual_revenue}M</span>
                        {e.est_revenue && <span style={{ color: e.actual_revenue >= e.est_revenue ? S.green : S.red, marginLeft: 8 }}>
                          ({e.actual_revenue >= e.est_revenue ? "+" : ""}{((e.actual_revenue - e.est_revenue) / e.est_revenue * 100).toFixed(1)}% vs est)</span>}
                      </div>
                      {e.actual_eps && <div style={{ color: S.text, fontSize: 12 }}>Actual EPS: ${e.actual_eps}</div>}
                      {e.post_notes && <div style={{ color: S.muted, fontSize: 12, marginTop: 4 }}>{e.post_notes}</div>}
                      {e.key_quotes && <div style={{ color: S.dim, fontSize: 12, marginTop: 4, fontStyle: "italic" }}>{e.key_quotes}</div>}
                    </>
                  ) : (
                    <div>
                      <div style={{ color: S.dim, fontSize: 12, marginBottom: 8 }}>Earnings not reported yet. Add results below:</div>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, marginBottom: 6 }}>
                        <input value={postForm.actual_revenue} onChange={ev => setPostForm({...postForm, actual_revenue: ev.target.value})} placeholder="Actual Rev ($M)" style={{ ...S.input, padding: "4px 8px", fontSize: 11 }} />
                        <input value={postForm.actual_eps} onChange={ev => setPostForm({...postForm, actual_eps: ev.target.value})} placeholder="Actual EPS" style={{ ...S.input, padding: "4px 8px", fontSize: 11 }} />
                      </div>
                      <textarea value={postForm.post_notes} onChange={ev => setPostForm({...postForm, post_notes: ev.target.value})} placeholder="Post-earnings notes" style={{ ...S.input, height: 40, fontSize: 11, marginBottom: 6 }} />
                      <textarea value={postForm.key_quotes} onChange={ev => setPostForm({...postForm, key_quotes: ev.target.value})} placeholder="Key management quotes" style={{ ...S.input, height: 40, fontSize: 11, marginBottom: 6 }} />
                      <button onClick={(ev) => { ev.stopPropagation(); updatePostEarnings(e.id); }} style={{ ...S.btn, padding: "4px 12px", fontSize: 11 }}>SAVE RESULTS</button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        ))
      }
      {!loading && earnings.length === 0 && (
        <div style={{ color: S.dim, padding: 40, textAlign: "center" }}>No earnings records. Click + PRE-EARNINGS PREP before the next report.</div>
      )}
    </div>
  );
}

function ThesisScorecard() {
  const [thesis, setThesis] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [filterTicker, setFilterTicker] = useState("");
  const [form, setForm] = useState({ ticker: "", thesis_type: "bull", item: "", priority: 1 });
  const fetchThesis = async () => {
    setLoading(true);
    let url = `${API}/thesis`;
    if (filterTicker) url += `?ticker=${filterTicker}`;
    try { const res = await fetch(url); const json = await res.json(); setThesis(json.thesis || {}); }
    catch (e) { console.error(e); }
    setLoading(false);
  };
  useEffect(() => { fetchThesis(); }, [filterTicker]);
  const addItem = async () => {
    if (!form.ticker || !form.item) return;
    await fetch(`${API}/thesis`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    setForm({ ticker: "", thesis_type: "bull", item: "", priority: 1 }); setShowAdd(false); fetchThesis();
  };
  const updateStatus = async (id: string, status: string) => {
    await fetch(`${API}/thesis/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) }); fetchThesis();
  };
  const deleteItem = async (id: string) => {
    await fetch(`${API}/thesis/${id}`, { method: "DELETE" }); fetchThesis();
  };
  const signalColors: Record<string, string> = { "STRONG BUY": S.green, "BUY": "#2ea043", "NEUTRAL": S.yellow, "CAUTION": "#d29922", "AVOID": S.red };
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <span style={{ color: S.text, fontWeight: "bold", fontSize: 15 }}>THESIS SCORECARD</span>
        <button onClick={() => setShowAdd(!showAdd)} style={S.btn}>{showAdd ? "CANCEL" : "+ ADD THESIS POINT"}</button>
      </div>
      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        <select value={filterTicker} onChange={e => setFilterTicker(e.target.value)} style={S.select}>
          <option value="">All Tickers</option>{DEFAULT_WATCHLIST_TICKERS.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>
      {showAdd && (
        <div style={{ ...S.card, borderColor: S.blue }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 8 }}>
            <div><div style={S.label}>Ticker</div>
              <select value={form.ticker} onChange={e => setForm({...form, ticker: e.target.value})} style={{ ...S.select, width: "100%" }}>
                <option value="">Select</option>{DEFAULT_WATCHLIST_TICKERS.map(t => <option key={t} value={t}>{t}</option>)}
              </select></div>
            <div><div style={S.label}>Type</div>
              <select value={form.thesis_type} onChange={e => setForm({...form, thesis_type: e.target.value})} style={{ ...S.select, width: "100%" }}>
                <option value="bull">BULL</option><option value="bear">BEAR</option>
              </select></div>
            <div><div style={S.label}>Priority</div>
              <select value={form.priority} onChange={e => setForm({...form, priority: parseInt(e.target.value)})} style={{ ...S.select, width: "100%" }}>
                <option value={1}>High</option><option value={2}>Medium</option><option value={3}>Low</option>
              </select></div>
          </div>
          <div style={S.label}>Thesis Point</div>
          <input value={form.item} onChange={e => setForm({...form, item: e.target.value})} onKeyDown={e => e.key === "Enter" && addItem()}
            placeholder="e.g., 800G ramp will drive 40% revenue growth through 2026" style={{ ...S.input, marginBottom: 8 }} />
          <button onClick={addItem} style={S.btn}>ADD</button>
        </div>
      )}
      {loading ? <div style={{ color: S.muted, padding: 20 }}>Loading...</div> :
        Object.entries(thesis).map(([ticker, data]) => (
          <div key={ticker} style={S.card}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <div>
                <span style={{ color: S.text, fontWeight: "bold", fontSize: 16 }}>{ticker}</span>
                <span style={{ color: S.dim, marginLeft: 8, fontSize: 12 }}>{data.name}</span>
              </div>
              <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                <span style={{ color: signalColors[data.conviction?.signal] || S.muted, fontWeight: "bold", fontSize: 14 }}>{data.conviction?.signal}</span>
                <span style={{ color: S.dim, fontSize: 11 }}>Bull: {data.conviction?.bull_score} | Bear: {data.conviction?.bear_score} | Net: {data.conviction?.net_score}</span>
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              {(["bull", "bear"] as const).map(type => (
                <div key={type}>
                  <div style={{ color: type === "bull" ? S.green : S.red, fontWeight: "bold", fontSize: 12, marginBottom: 8 }}>{type.toUpperCase()} CASE ({data[type].length})</div>
                  {data[type].map((item: any) => (
                    <div key={item.id} style={{ padding: "8px 0", borderBottom: "1px solid #30363d" }}>
                      <div style={{ color: item.status === "invalidated" ? S.dim : S.text, fontSize: 13,
                        textDecoration: item.status === "invalidated" ? "line-through" : "none" }}>{item.item}</div>
                      <div style={{ display: "flex", gap: 4, marginTop: 4 }}>
                        {(["active", "confirmed", "invalidated"] as const).map(st => (
                          <button key={st} onClick={() => updateStatus(item.id, st)}
                            style={{ ...S.btnSmall, fontSize: 10, background: item.status === st ?
                              (st === "confirmed" ? S.green : st === "invalidated" ? S.red : "#30363d") : "#1e2733",
                              color: item.status === st ? "#fff" : S.dim }}>
                            {st.toUpperCase()}
                          </button>
                        ))}
                        <button onClick={() => deleteItem(item.id)} style={{ ...S.btnSmall, fontSize: 10, color: S.red }}>×</button>
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        ))
      }
      {!loading && Object.keys(thesis).length === 0 && (
        <div style={{ color: S.dim, padding: 40, textAlign: "center" }}>No thesis items yet. Build your bull/bear case for each ticker.</div>
      )}
    </div>
  );
}

function CatalystCalendar() {
  const [catalysts, setCatalysts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [filterTicker, setFilterTicker] = useState("");
  const [showPast, setShowPast] = useState(false);
  const [form, setForm] = useState({ ticker: "", title: "", date: "", catalyst_type: "earnings", importance: "medium", notes: "" });
  const fetchCatalysts = async () => {
    setLoading(true);
    let url = `${API}/catalysts?upcoming_only=${!showPast}`;
    if (filterTicker) url += `&ticker=${filterTicker}`;
    try { const res = await fetch(url); const json = await res.json(); setCatalysts(json.catalysts || []); }
    catch (e) { console.error(e); }
    setLoading(false);
  };
  useEffect(() => { fetchCatalysts(); }, [filterTicker, showPast]);
  const addCatalyst = async () => {
    if (!form.ticker || !form.title || !form.date) return;
    await fetch(`${API}/catalysts`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    setForm({ ticker: "", title: "", date: "", catalyst_type: "earnings", importance: "medium", notes: "" }); setShowAdd(false); fetchCatalysts();
  };
  const deleteCatalyst = async (id: string) => {
    await fetch(`${API}/catalysts/${id}`, { method: "DELETE" }); fetchCatalysts();
  };
  const typeIcons: Record<string, string> = { earnings: "📊", product_launch: "🚀", conference: "🎤", capacity: "🏭", regulatory: "⚖️", other: "📌" };
  const importanceColors: Record<string, string> = { critical: S.red, high: "#d29922", medium: S.blue, low: S.dim };
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <span style={{ color: S.text, fontWeight: "bold", fontSize: 15 }}>CATALYST CALENDAR</span>
        <button onClick={() => setShowAdd(!showAdd)} style={S.btn}>{showAdd ? "CANCEL" : "+ ADD CATALYST"}</button>
      </div>
      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        <select value={filterTicker} onChange={e => setFilterTicker(e.target.value)} style={S.select}>
          <option value="">All Tickers</option>{DEFAULT_WATCHLIST_TICKERS.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        <button onClick={() => setShowPast(!showPast)} style={{ ...S.btnSmall, background: showPast ? "#1a8c5e" : "#30363d" }}>
          {showPast ? "SHOWING ALL" : "UPCOMING ONLY"}
        </button>
      </div>
      {showAdd && (
        <div style={{ ...S.card, borderColor: S.yellow }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 8, marginBottom: 8 }}>
            <div><div style={S.label}>Ticker</div>
              <select value={form.ticker} onChange={e => setForm({...form, ticker: e.target.value})} style={{ ...S.select, width: "100%" }}>
                <option value="">Select</option>{DEFAULT_WATCHLIST_TICKERS.map(t => <option key={t} value={t}>{t}</option>)}
              </select></div>
            <div><div style={S.label}>Date</div><input value={form.date} onChange={e => setForm({...form, date: e.target.value})} type="date" style={S.input} /></div>
            <div><div style={S.label}>Type</div>
              <select value={form.catalyst_type} onChange={e => setForm({...form, catalyst_type: e.target.value})} style={{ ...S.select, width: "100%" }}>
                {Object.keys(typeIcons).map(t => <option key={t} value={t}>{t}</option>)}
              </select></div>
            <div><div style={S.label}>Importance</div>
              <select value={form.importance} onChange={e => setForm({...form, importance: e.target.value})} style={{ ...S.select, width: "100%" }}>
                <option value="critical">Critical</option><option value="high">High</option><option value="medium">Medium</option><option value="low">Low</option>
              </select></div>
          </div>
          <div style={S.label}>Title</div>
          <input value={form.title} onChange={e => setForm({...form, title: e.target.value})} placeholder="e.g., COHR Q2 Earnings Report" style={{ ...S.input, marginBottom: 8 }} />
          <div style={S.label}>Notes</div>
          <textarea value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} placeholder="What to watch for..."
            style={{ ...S.input, height: 60, marginBottom: 8 }} />
          <button onClick={addCatalyst} style={S.btn}>ADD CATALYST</button>
        </div>
      )}
      {loading ? <div style={{ color: S.muted, padding: 20 }}>Loading...</div> :
        catalysts.map(c => {
          const daysAway = Math.ceil((new Date(c.date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
          const isToday = daysAway === 0;
          const isSoon = daysAway > 0 && daysAway <= 7;
          return (
            <div key={c.id} style={{ ...S.card, borderLeft: `3px solid ${importanceColors[c.importance] || S.dim}`,
              background: isToday ? "rgba(210,153,34,0.05)" : "#0d1117" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 16 }}>{typeIcons[c.catalyst_type] || "📌"}</span>
                    <span style={{ color: S.blue, fontWeight: "bold" }}>{c.ticker}</span>
                    <span style={{ color: S.text, fontWeight: "bold" }}>{c.title}</span>
                  </div>
                  {c.notes && <div style={{ color: S.muted, fontSize: 12, marginTop: 4, marginLeft: 28 }}>{c.notes}</div>}
                </div>
                <div style={{ textAlign: "right", flexShrink: 0 }}>
                  <div style={{ color: S.text, fontSize: 13 }}>{c.date}</div>
                  <div style={{ color: isToday ? S.yellow : isSoon ? "#d29922" : S.dim, fontSize: 11, fontWeight: isToday ? "bold" : "normal" }}>
                    {isToday ? "TODAY" : daysAway > 0 ? `${daysAway}d away` : `${Math.abs(daysAway)}d ago`}
                  </div>
                  <button onClick={() => deleteCatalyst(c.id)} style={{ ...S.btnSmall, marginTop: 4, color: S.red, fontSize: 10 }}>×</button>
                </div>
              </div>
            </div>
          );
        })
      }
      {!loading && catalysts.length === 0 && (
        <div style={{ color: S.dim, padding: 40, textAlign: "center" }}>No catalysts found. Add earnings dates, product launches, conferences, and more.</div>
      )}
    </div>
  );
}


function TechnicalScanner() {
  const [scan, setScan] = useState<any[]>([]);
  const [heatmap, setHeatmap] = useState<any[]>([]);
  const [correlations, setCorrelations] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"scanner"|"heatmap"|"correlations">("scanner");
  const [detail, setDetail] = useState<any>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const API = `${BASE}/photonics/technicals`;

  const fetchScan = async () => {
    setLoading(true);
    try { const res = await fetch(`${API}/scan`); const json = await res.json(); setScan(json.scan || []); }
    catch (e) { console.error(e); }
    setLoading(false);
  };
  const fetchHeatmap = async () => {
    setLoading(true);
    try { const res = await fetch(`${API}/heatmap`); const json = await res.json(); setHeatmap(json.heatmap || []); }
    catch (e) { console.error(e); }
    setLoading(false);
  };
  const fetchCorrelations = async () => {
    setLoading(true);
    try { const res = await fetch(`${API}/correlations`); setCorrelations(await res.json()); }
    catch (e) { console.error(e); }
    setLoading(false);
  };
  const fetchDetail = async (ticker: string) => {
    setDetailLoading(true);
    try { const res = await fetch(`${API}/detail/${ticker}`); setDetail(await res.json()); }
    catch (e) { console.error(e); }
    setDetailLoading(false);
  };

  useEffect(() => { fetchScan(); }, []);

  const switchView = (v: "scanner"|"heatmap"|"correlations") => {
    setView(v); setDetail(null);
    if (v === "scanner") fetchScan();
    else if (v === "heatmap") fetchHeatmap();
    else fetchCorrelations();
  };

  const signalColor = (sig: string) => {
    const m: Record<string, string> = {
      "STRONG BUY": "#2ea043", "BUY": "#2ea043", "BULLISH": "#2ea043",
      "STRONG UPTREND": "#2ea043", "UPTREND": "#58a6ff",
      "NEUTRAL": "#d29922", "MIXED": "#d29922", "RECOVERING": "#d29922",
      "SELL": "#f85149", "STRONG SELL": "#f85149", "BEARISH": "#f85149",
      "DOWNTREND": "#f85149", "OVERBOUGHT": "#d29922", "OVERSOLD": "#2ea043",
      "WEAKENING": "#d29922",
    };
    return m[sig] || "#7d8590";
  };
  const pctColor = (v: number | null) => v === null ? "#484f58" : v >= 0 ? "#2ea043" : "#f85149";
  const scoreBar = (score: number) => {
    const clr = score >= 70 ? "#2ea043" : score >= 50 ? "#58a6ff" : score >= 30 ? "#d29922" : "#f85149";
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <div style={{ width: 60, height: 6, background: "#21262d", borderRadius: 3, overflow: "hidden" }}>
          <div style={{ width: `${score}%`, height: "100%", background: clr, borderRadius: 3 }}/>
        </div>
        <span style={{ color: clr, fontSize: 11, fontWeight: "bold" }}>{score}</span>
      </div>
    );
  };

  const S: Record<string, any> = {
    card: { background: S.bg, border: "1px solid #30363d", borderRadius: 6, padding: 16, marginBottom: 12 },
    btn: { padding: "8px 16px", background: "#1a8c5e", color: "#fff", border: "none", borderRadius: 4, cursor: "pointer", fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: "bold" },
    btnSmall: { padding: "4px 10px", background: "#30363d", color: "#aaa", border: "none", borderRadius: 3, cursor: "pointer", fontFamily: "'DM Sans', sans-serif", fontSize: 11 },
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <span style={{ color: "#e6edf3", fontWeight: "bold", fontSize: 15 }}>TECHNICAL SCANNER</span>
        <div style={{ display: "flex", gap: 6 }}>
          {(["scanner","heatmap","correlations"] as const).map(v => (
            <button key={v} onClick={() => switchView(v)}
              style={{ ...S.btnSmall, background: view === v ? "#1a8c5e" : "#30363d", color: view === v ? "#fff" : "#aaa" }}>
              {v === "scanner" ? "📊 SCANNER" : v === "heatmap" ? "🔥 HEATMAP" : "🔗 CORRELATIONS"}
            </button>
          ))}
          <button onClick={() => { if (view === "scanner") fetchScan(); else if (view === "heatmap") fetchHeatmap(); else fetchCorrelations(); }}
            style={S.btnSmall}>↻ REFRESH</button>
        </div>
      </div>

      {loading ? <div style={{ color: "#7d8590", padding: 40, textAlign: "center" }}>Scanning 19 tickers... (this takes ~30s on first load)</div> : (
        <>
          {/* ── SCANNER VIEW ── */}
          {view === "scanner" && (
            <div>
              {detail ? (
                <div>
                  <button onClick={() => setDetail(null)} style={{ ...S.btnSmall, marginBottom: 12 }}>← Back to Scanner</button>
                  {detailLoading ? <div style={{ color: "#7d8590", padding: 20 }}>Loading detail...</div> : (
                    <div>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                        <div>
                          <span style={{ color: "#e6edf3", fontWeight: "bold", fontSize: 22 }}>{detail.ticker}</span>
                          <span style={{ color: "#e6edf3", fontSize: 22, marginLeft: 12 }}>${detail.price}</span>
                          <span style={{ color: signalColor(detail.composite_signal), fontSize: 14, marginLeft: 12, fontWeight: "bold" }}>
                            {detail.composite_signal} ({detail.composite_score}/100)
                          </span>
                        </div>
                      </div>

                      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 16 }}>
                        <div style={S.card}>
                          <div style={{ color: "#7d8590", fontSize: 11, letterSpacing: 1 }}>RSI (14)</div>
                          <div style={{ fontSize: 24, fontWeight: "bold", color: signalColor(detail.rsi_signal) }}>{detail.rsi || "—"}</div>
                          <div style={{ color: signalColor(detail.rsi_signal), fontSize: 12 }}>{detail.rsi_signal}</div>
                        </div>
                        <div style={S.card}>
                          <div style={{ color: "#7d8590", fontSize: 11, letterSpacing: 1 }}>MACD</div>
                          <div style={{ fontSize: 24, fontWeight: "bold", color: signalColor(detail.macd_signal) }}>{detail.macd_histogram || "—"}</div>
                          <div style={{ color: signalColor(detail.macd_signal), fontSize: 12 }}>{detail.macd_signal}</div>
                        </div>
                        <div style={S.card}>
                          <div style={{ color: "#7d8590", fontSize: 11, letterSpacing: 1 }}>TREND</div>
                          <div style={{ fontSize: 16, fontWeight: "bold", color: signalColor(detail.sma_trend), marginTop: 4 }}>{detail.sma_trend}</div>
                          <div style={{ color: "#484f58", fontSize: 11, marginTop: 4 }}>SMA 20/50/200</div>
                        </div>
                        <div style={S.card}>
                          <div style={{ color: "#7d8590", fontSize: 11, letterSpacing: 1 }}>VOLUME</div>
                          <div style={{ fontSize: 24, fontWeight: "bold", color: detail.vol_ratio > 1.3 ? "#58a6ff" : "#7d8590" }}>{detail.vol_ratio}x</div>
                          <div style={{ color: "#484f58", fontSize: 11 }}>vs 20d avg</div>
                        </div>
                      </div>

                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
                        <div style={S.card}>
                          <div style={{ color: "#e6edf3", fontWeight: "bold", fontSize: 13, marginBottom: 12 }}>MOVING AVERAGES</div>
                          {[{l:"SMA 20",v:detail.sma20},{l:"SMA 50",v:detail.sma50},{l:"SMA 200",v:detail.sma200}].map(s => (
                            <div key={s.l} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid #30363d" }}>
                              <span style={{ color: "#7d8590", fontSize: 12 }}>{s.l}</span>
                              <div>
                                <span style={{ color: "#e6edf3", fontSize: 12 }}>${s.v || "—"}</span>
                                {s.v && <span style={{ color: detail.price > s.v ? "#2ea043" : "#f85149", fontSize: 11, marginLeft: 8 }}>
                                  {detail.price > s.v ? "ABOVE" : "BELOW"}
                                </span>}
                              </div>
                            </div>
                          ))}
                        </div>
                        <div style={S.card}>
                          <div style={{ color: "#e6edf3", fontWeight: "bold", fontSize: 13, marginBottom: 12 }}>PRICE LEVELS</div>
                          {[
                            {l:"52W High",v:detail.high_52w,note:`${detail.pct_from_high}%`},
                            {l:"52W Low",v:detail.low_52w},
                            {l:"20D High",v:detail.recent_high},
                            {l:"20D Low",v:detail.recent_low},
                          ].map(s => (
                            <div key={s.l} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid #30363d" }}>
                              <span style={{ color: "#7d8590", fontSize: 12 }}>{s.l}</span>
                              <div>
                                <span style={{ color: "#e6edf3", fontSize: 12 }}>${s.v || "—"}</span>
                                {s.note && <span style={{ color: "#f85149", fontSize: 11, marginLeft: 8 }}>{s.note}</span>}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {detail.price_history && detail.price_history.length > 0 && (
                        <div style={S.card}>
                          <div style={{ color: "#e6edf3", fontWeight: "bold", fontSize: 13, marginBottom: 12 }}>60-DAY PRICE CHART</div>
                          <div style={{ display: "flex", alignItems: "flex-end", gap: 1, height: 120 }}>
                            {(() => {
                              const prices = detail.price_history.map((p: any) => p.close);
                              const min = Math.min(...prices);
                              const max = Math.max(...prices);
                              const range = max - min || 1;
                              return detail.price_history.map((p: any, i: number) => {
                                const h = ((p.close - min) / range) * 100 + 10;
                                const prev = i > 0 ? detail.price_history[i-1].close : p.close;
                                return (
                                  <div key={i} title={`${p.date}: $${p.close}`}
                                    style={{ flex: 1, height: h, background: p.close >= prev ? "#2ea04380" : "#f8514980",
                                      borderRadius: "2px 2px 0 0", minWidth: 2 }} />
                                );
                              });
                            })()}
                          </div>
                          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
                            <span style={{ color: "#484f58", fontSize: 10 }}>{detail.price_history[0]?.date}</span>
                            <span style={{ color: "#484f58", fontSize: 10 }}>{detail.price_history[detail.price_history.length-1]?.date}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                    <thead>
                      <tr style={{ borderBottom: "1px solid #30363d" }}>
                        {["TICKER","PRICE","CHG%","SCORE","SIGNAL","RSI","MACD","TREND","VOL"].map(h => (
                          <th key={h} style={{ padding: "8px 10px", textAlign: "left", color: "#7d8590", fontSize: 10, fontWeight: "normal", letterSpacing: 1 }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {scan.map((s: any) => s.error ? null : (
                        <tr key={s.ticker} onClick={() => fetchDetail(s.ticker)}
                          style={{ borderBottom: "1px solid #30363d", cursor: "pointer", transition: "background 0.15s" }}
                          onMouseOver={e => (e.currentTarget.style.background = "rgba(88,166,255,0.03)")}
                          onMouseOut={e => (e.currentTarget.style.background = "transparent")}>
                          <td style={{ padding: "10px", color: "#e6edf3", fontWeight: "bold" }}>{s.ticker}</td>
                          <td style={{ padding: "10px", color: "#e6edf3" }}>${s.price}</td>
                          <td style={{ padding: "10px", color: pctColor(s.change_pct), fontWeight: "bold" }}>
                            {s.change_pct >= 0 ? "+" : ""}{s.change_pct}%
                          </td>
                          <td style={{ padding: "10px" }}>{scoreBar(s.composite_score)}</td>
                          <td style={{ padding: "10px", color: signalColor(s.composite_signal), fontWeight: "bold", fontSize: 11 }}>
                            {s.composite_signal}
                          </td>
                          <td style={{ padding: "10px" }}>
                            <span style={{ color: signalColor(s.rsi_signal) }}>{s.rsi}</span>
                            <span style={{ color: "#484f58", fontSize: 10, marginLeft: 4 }}>{s.rsi_signal}</span>
                          </td>
                          <td style={{ padding: "10px" }}>
                            <span style={{ color: signalColor(s.macd_signal), fontSize: 11 }}>{s.macd_signal}</span>
                          </td>
                          <td style={{ padding: "10px", color: signalColor(s.sma_trend), fontSize: 11 }}>{s.sma_trend}</td>
                          <td style={{ padding: "10px", color: s.vol_ratio > 1.5 ? "#58a6ff" : "#484f58", fontSize: 11 }}>
                            {s.vol_ratio}x
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div style={{ color: "#484f58", fontSize: 10, marginTop: 8 }}>Click any row for detailed analysis · Sorted by composite technical score</div>
                </div>
              )}
            </div>
          )}

          {/* ── HEATMAP VIEW ── */}
          {view === "heatmap" && (
            <div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(120, 1fr))", gap: 8 }}>
                {heatmap.map((h: any) => {
                  const val = h.m1 ?? h.w1 ?? h.d1 ?? 0;
                  const intensity = Math.min(Math.abs(val) / 20, 1);
                  const bg = val >= 0 ? `rgba(46, 160, 67, ${intensity * 0.3 + 0.05})` : `rgba(248, 81, 73, ${intensity * 0.3 + 0.05})`;
                  return (
                    <div key={h.ticker} style={{ background: bg, border: "1px solid #30363d", borderRadius: 6, padding: 12, textAlign: "center" }}>
                      <div style={{ color: "#e6edf3", fontWeight: "bold", fontSize: 14 }}>{h.ticker}</div>
                      <div style={{ color: "#e6edf3", fontSize: 12 }}>${h.price}</div>
                      <div style={{ marginTop: 8, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4, fontSize: 10 }}>
                        <div><span style={{ color: "#7d8590" }}>1D </span><span style={{ color: pctColor(h.d1) }}>{h.d1 !== null ? `${h.d1 > 0?"+":""}${h.d1}%` : "—"}</span></div>
                        <div><span style={{ color: "#7d8590" }}>1W </span><span style={{ color: pctColor(h.w1) }}>{h.w1 !== null ? `${h.w1 > 0?"+":""}${h.w1}%` : "—"}</span></div>
                        <div><span style={{ color: "#7d8590" }}>1M </span><span style={{ color: pctColor(h.m1) }}>{h.m1 !== null ? `${h.m1 > 0?"+":""}${h.m1}%` : "—"}</span></div>
                        <div><span style={{ color: "#7d8590" }}>3M </span><span style={{ color: pctColor(h.m3) }}>{h.m3 !== null ? `${h.m3 > 0?"+":""}${h.m3}%` : "—"}</span></div>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div style={{ color: "#484f58", fontSize: 10, marginTop: 8 }}>Color intensity = 1M performance magnitude · Green = positive, Red = negative</div>
            </div>
          )}

          {/* ── CORRELATIONS VIEW ── */}
          {view === "correlations" && correlations && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div style={S.card}>
                <div style={{ color: "#e6edf3", fontWeight: "bold", fontSize: 13, marginBottom: 12 }}>MOST CORRELATED PAIRS</div>
                <div style={{ color: "#484f58", fontSize: 11, marginBottom: 8 }}>Move together — diversification risk</div>
                {correlations.top_correlated?.map((p: any, i: number) => (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid #30363d" }}>
                    <span style={{ color: "#e6edf3", fontSize: 12 }}>{p.ticker1} ↔ {p.ticker2}</span>
                    <span style={{ color: p.correlation > 0.7 ? "#f85149" : p.correlation > 0.5 ? "#d29922" : "#7d8590", fontWeight: "bold", fontSize: 12 }}>
                      {p.correlation}
                    </span>
                  </div>
                ))}
              </div>
              <div style={S.card}>
                <div style={{ color: "#e6edf3", fontWeight: "bold", fontSize: 13, marginBottom: 12 }}>LEAST CORRELATED PAIRS</div>
                <div style={{ color: "#484f58", fontSize: 11, marginBottom: 8 }}>Move independently — best diversifiers</div>
                {correlations.least_correlated?.map((p: any, i: number) => (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid #30363d" }}>
                    <span style={{ color: "#e6edf3", fontSize: 12 }}>{p.ticker1} ↔ {p.ticker2}</span>
                    <span style={{ color: Math.abs(p.correlation) < 0.2 ? "#2ea043" : "#58a6ff", fontWeight: "bold", fontSize: 12 }}>
                      {p.correlation}
                    </span>
                  </div>
                ))}
              </div>
              <div style={{ gridColumn: "span 2", color: "#484f58", fontSize: 10 }}>Based on 30-day daily returns · Updated: {correlations.updated_at ? new Date(correlations.updated_at).toLocaleString() : "—"}</div>
            </div>
          )}
        </>
      )}
    </div>
  );
}


function PortfolioOverlay() {
  const [data, setData] = useState<any>(null);
  const [gaps, setGaps] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"positions"|"gaps"|"add">("positions");
  const [addForm, setAddForm] = useState({ ticker: "", shares: "", avg_cost: "", account: "Individual", notes: "" });
  const [addStatus, setAddStatus] = useState("");
  const [syncStatus, setSyncStatus] = useState("");
  const [syncing, setSyncing] = useState(false);

  const API = `${BASE}/photonics/portfolio`;

  const PHOTONICS_TICKERS = ["AAOI","AEHR","ALMU","ANET","AXTI","CIEN","COHR","CRDO","FN","GFS","GLW","LWLG","MRVL","MTSI","NOK","POET","SMTC","TSEM","VIAV"];

  const syncFromFidelity = async () => {
    setSyncing(true); setSyncStatus("");
    try {
      const res = await fetch(`${API}/sync-fidelity`, { method: "POST" });
      const json = await res.json();
      setSyncStatus(json.message || `Synced ${json.synced} positions`);
      fetchPositions();
    } catch { setSyncStatus("Error syncing from Fidelity"); }
    setSyncing(false);
  };

  const fetchPositions = async () => {
    setLoading(true);
    try { const res = await fetch(`${API}/positions`); setData(await res.json()); }
    catch (e) { console.error(e); }
    setLoading(false);
  };
  const fetchGaps = async () => {
    setLoading(true);
    try { const res = await fetch(`${API}/gaps`); setGaps(await res.json()); }
    catch (e) { console.error(e); }
    setLoading(false);
  };
  const addPosition = async () => {
    if (!addForm.ticker || !addForm.shares || !addForm.avg_cost) return;
    try {
      const res = await fetch(`${API}/positions`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ticker: addForm.ticker.toUpperCase(), shares: parseFloat(addForm.shares), avg_cost: parseFloat(addForm.avg_cost), account: addForm.account, notes: addForm.notes }),
      });
      const json = await res.json();
      setAddStatus(`✅ ${json.status}: ${addForm.ticker.toUpperCase()}`);
      setAddForm({ ticker: "", shares: "", avg_cost: "", account: "Individual", notes: "" });
      fetchPositions();
    } catch (e) { setAddStatus("❌ Error adding position"); }
  };
  const deletePosition = async (ticker: string, account: string) => {
    try {
      await fetch(`${API}/positions/${ticker}?account=${encodeURIComponent(account)}`, { method: "DELETE" });
      fetchPositions();
    } catch (e) { console.error(e); }
  };

  useEffect(() => { fetchPositions(); }, []);

  const switchView = (v: "positions"|"gaps"|"add") => {
    setView(v);
    if (v === "positions") fetchPositions();
    else if (v === "gaps") fetchGaps();
  };

  const pctColor = (v: number | null) => v === null ? "#484f58" : v >= 0 ? "#2ea043" : "#f85149";
  const zoneColor = (z: string) => {
    if (z?.includes("BUY")) return "#2ea043";
    if (z?.includes("NEAR")) return "#58a6ff";
    if (z?.includes("HOLD")) return "#d29922";
    if (z?.includes("TRIM") || z?.includes("EXTENDED")) return "#f85149";
    return "#7d8590";
  };

  const S: Record<string, any> = {
    card: { background: S.bg, border: "1px solid #30363d", borderRadius: 6, padding: 16, marginBottom: 12 },
    metricBox: { background: S.bg, border: "1px solid #30363d", borderRadius: 6, padding: 14, textAlign: "center" as const },
    input: { padding: "8px 12px", background: S.bg, border: "1px solid #30363d", borderRadius: 4, color: "#e6edf3", fontFamily: "'DM Sans', sans-serif", fontSize: 13, width: "100%" },
    btn: { padding: "8px 16px", background: "#1a8c5e", color: "#fff", border: "none", borderRadius: 4, cursor: "pointer", fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: "bold" },
    btnSmall: { padding: "4px 10px", background: "#30363d", color: "#aaa", border: "none", borderRadius: 3, cursor: "pointer", fontFamily: "'DM Sans', sans-serif", fontSize: 11 },
  };

  const fmt = (n: number) => n >= 1000 ? `$${(n/1000).toFixed(1)}k` : `$${n.toFixed(0)}`;

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <span style={{ color: "#e6edf3", fontWeight: "bold", fontSize: 15 }}>PORTFOLIO OVERLAY</span>
        <div style={{ display: "flex", gap: 6 }}>
          {(["positions","gaps","add"] as const).map(v => (
            <button key={v} onClick={() => switchView(v)}
              style={{ ...S.btnSmall, background: view === v ? "#1a8c5e" : "#30363d", color: view === v ? "#fff" : "#aaa" }}>
              {v === "positions" ? "💼 POSITIONS" : v === "gaps" ? "🎯 TARGET GAPS" : "➕ ADD"}
            </button>
          ))}
          <button onClick={fetchPositions} style={S.btnSmall}>↻ REFRESH</button>
          <button onClick={syncFromFidelity} disabled={syncing} style={{ ...S.btnSmall, background: "#1f6feb", color: "#fff" }}>{syncing ? "SYNCING..." : "⬇ SYNC FIDELITY"}</button>
        </div>
      </div>

      {syncStatus && <div style={{ color: "#58a6ff", fontSize: 11, marginBottom: 8, padding: "6px 10px", background: "rgba(31,111,235,0.1)", borderRadius: 4, border: "1px solid rgba(31,111,235,0.2)" }}>{syncStatus}</div>}

      {/* Universe Coverage Card */}
      <div style={{ ...S.card, marginBottom: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
          <span style={{ color: "#7d8590", fontSize: 10, letterSpacing: 1, textTransform: "uppercase" }}>Universe Coverage</span>
          <span style={{ color: "#58a6ff", fontSize: 11, fontWeight: "bold" }}>
            {data?.positions ? `${PHOTONICS_TICKERS.filter(t => data.positions.some((p: any) => p.ticker === t)).length}/${PHOTONICS_TICKERS.length} covered` : "—"}
          </span>
        </div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {PHOTONICS_TICKERS.map(t => {
            const owned = data?.positions?.some((p: any) => p.ticker === t);
            return (
              <span key={t} style={{
                padding: "3px 8px", borderRadius: 4, fontSize: 10, fontFamily: "'DM Sans', monospace", fontWeight: "bold",
                background: owned ? "rgba(46,160,67,0.15)" : "rgba(125,133,144,0.1)",
                color: owned ? "#2ea043" : "#484f58",
                border: `1px solid ${owned ? "rgba(46,160,67,0.3)" : "rgba(125,133,144,0.15)"}`,
                cursor: owned ? "default" : "pointer",
              }}>{t}</span>
            );
          })}
        </div>
      </div>

      {loading ? <div style={{ color: "#7d8590", padding: 40, textAlign: "center" }}>Loading portfolio...</div> : (
        <>
          {/* ── POSITIONS VIEW ── */}
          {view === "positions" && data && (
            <div>
              {/* Summary cards */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 10, marginBottom: 16 }}>
                <div style={S.metricBox}>
                  <div style={{ color: "#7d8590", fontSize: 10, letterSpacing: 1 }}>TOTAL VALUE</div>
                  <div style={{ color: "#e6edf3", fontSize: 20, fontWeight: "bold", marginTop: 4 }}>{fmt(data.summary?.total_value || 0)}</div>
                </div>
                <div style={S.metricBox}>
                  <div style={{ color: "#7d8590", fontSize: 10, letterSpacing: 1 }}>TOTAL P&L</div>
                  <div style={{ color: pctColor(data.summary?.total_pnl), fontSize: 20, fontWeight: "bold", marginTop: 4 }}>
                    {data.summary?.total_pnl >= 0 ? "+" : ""}{fmt(data.summary?.total_pnl || 0)}
                  </div>
                  <div style={{ color: pctColor(data.summary?.total_pnl_pct), fontSize: 11 }}>
                    {data.summary?.total_pnl_pct >= 0 ? "+" : ""}{data.summary?.total_pnl_pct}%
                  </div>
                </div>
                <div style={S.metricBox}>
                  <div style={{ color: "#7d8590", fontSize: 10, letterSpacing: 1 }}>PHOTONICS</div>
                  <div style={{ color: "#58a6ff", fontSize: 20, fontWeight: "bold", marginTop: 4 }}>{fmt(data.summary?.photonics_value || 0)}</div>
                  <div style={{ color: "#58a6ff", fontSize: 11 }}>{data.summary?.photonics_pct}% of portfolio</div>
                </div>
                <div style={S.metricBox}>
                  <div style={{ color: "#7d8590", fontSize: 10, letterSpacing: 1 }}>NON-PHOTONICS</div>
                  <div style={{ color: "#7d8590", fontSize: 20, fontWeight: "bold", marginTop: 4 }}>{fmt(data.summary?.non_photonics_value || 0)}</div>
                </div>
                <div style={S.metricBox}>
                  <div style={{ color: "#7d8590", fontSize: 10, letterSpacing: 1 }}>POSITIONS</div>
                  <div style={{ color: "#e6edf3", fontSize: 20, fontWeight: "bold", marginTop: 4 }}>{data.summary?.position_count || 0}</div>
                </div>
              </div>

              {/* Account breakdown */}
              {data.by_account && Object.keys(data.by_account).length > 1 && (
                <div style={{ ...S.card, marginBottom: 16 }}>
                  <div style={{ color: "#e6edf3", fontWeight: "bold", fontSize: 13, marginBottom: 10 }}>BY ACCOUNT</div>
                  <div style={{ display: "flex", gap: 16 }}>
                    {Object.entries(data.by_account).map(([acct, info]: [string, any]) => (
                      <div key={acct} style={{ flex: 1, padding: "8px 12px", background: S.bg, borderRadius: 4 }}>
                        <div style={{ color: "#58a6ff", fontSize: 12, fontWeight: "bold" }}>{acct}</div>
                        <div style={{ color: "#e6edf3", fontSize: 14 }}>{fmt(info.value)}</div>
                        <div style={{ color: pctColor(info.pnl), fontSize: 11 }}>
                          P&L: {info.pnl >= 0 ? "+" : ""}{fmt(info.pnl)} · {info.count} positions
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Positions table */}
              {data.positions?.length > 0 ? (
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                    <thead>
                      <tr style={{ borderBottom: "1px solid #30363d" }}>
                        {["","TICKER","ACCT","SHARES","AVG COST","PRICE","VALUE","P&L","P&L%","TARGET","GAP%","ZONE",""].map(h => (
                          <th key={h} style={{ padding: "8px 8px", textAlign: "left", color: "#7d8590", fontSize: 10, fontWeight: "normal", letterSpacing: 1 }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {data.positions.map((p: any, i: number) => (
                        <tr key={i} style={{ borderBottom: "1px solid #30363d", background: p.in_photonics_universe ? "rgba(88,166,255,0.02)" : "transparent" }}>
                          <td style={{ padding: "8px 6px" }}>
                            {p.in_photonics_universe && <span title="In photonics universe" style={{ fontSize: 10 }}>🔬</span>}
                          </td>
                          <td style={{ padding: "8px", color: "#e6edf3", fontWeight: "bold" }}>{p.ticker}</td>
                          <td style={{ padding: "8px", color: "#7d8590", fontSize: 10 }}>{p.account}</td>
                          <td style={{ padding: "8px", color: "#e6edf3" }}>{p.shares}</td>
                          <td style={{ padding: "8px", color: "#7d8590" }}>${p.avg_cost?.toFixed(2)}</td>
                          <td style={{ padding: "8px", color: "#e6edf3" }}>${p.price?.toFixed(2)}</td>
                          <td style={{ padding: "8px", color: "#e6edf3" }}>{fmt(p.market_value)}</td>
                          <td style={{ padding: "8px", color: pctColor(p.pnl), fontWeight: "bold" }}>
                            {p.pnl >= 0 ? "+" : ""}{fmt(p.pnl)}
                          </td>
                          <td style={{ padding: "8px", color: pctColor(p.pnl_pct), fontWeight: "bold" }}>
                            {p.pnl_pct >= 0 ? "+" : ""}{p.pnl_pct}%
                          </td>
                          <td style={{ padding: "8px", color: p.buy_target ? "#58a6ff" : "#484f58" }}>
                            {p.buy_target ? `$${p.buy_target}` : "—"}
                          </td>
                          <td style={{ padding: "8px", color: pctColor(p.target_gap_pct) }}>
                            {p.target_gap_pct !== null ? `${p.target_gap_pct > 0 ? "+" : ""}${p.target_gap_pct}%` : "—"}
                          </td>
                          <td style={{ padding: "8px" }}>
                            {p.position_vs_target && (
                              <span style={{ color: zoneColor(p.position_vs_target), fontSize: 10, fontWeight: "bold" }}>
                                {p.position_vs_target}
                              </span>
                            )}
                          </td>
                          <td style={{ padding: "8px" }}>
                            <button onClick={() => deletePosition(p.ticker, p.account)}
                              style={{ ...S.btnSmall, background: "transparent", color: "#484f58", fontSize: 10 }}>✕</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div style={{ ...S.card, textAlign: "center", padding: 40 }}>
                  <div style={{ color: "#7d8590", fontSize: 14, marginBottom: 12 }}>No positions loaded yet</div>
                  <div style={{ color: "#484f58", fontSize: 12, marginBottom: 16 }}>Add positions manually or import from Fidelity CSV</div>
                  <button onClick={() => switchView("add")} style={S.btn}>➕ Add Positions</button>
                </div>
              )}
            </div>
          )}

          {/* ── TARGET GAPS VIEW ── */}
          {view === "gaps" && gaps && (
            <div>
              {gaps.best_opportunities?.length > 0 && (
                <div style={{ ...S.card, marginBottom: 16 }}>
                  <div style={{ color: "#2ea043", fontWeight: "bold", fontSize: 13, marginBottom: 10 }}>🎯 BEST OPPORTUNITIES — Not Yet Owned, {'>'} 5% Upside to Target</div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 8 }}>
                    {gaps.best_opportunities.map((o: any) => (
                      <div key={o.ticker} style={{ background: "#0a1a0d", border: "1px solid #1a3a1f", borderRadius: 6, padding: 12, textAlign: "center" }}>
                        <div style={{ color: "#e6edf3", fontWeight: "bold", fontSize: 16 }}>{o.ticker}</div>
                        <div style={{ color: "#e6edf3", fontSize: 12 }}>${o.price} → <span style={{ color: "#2ea043" }}>${o.buy_target}</span></div>
                        <div style={{ color: "#2ea043", fontSize: 18, fontWeight: "bold", marginTop: 4 }}>+{o.gap_pct}%</div>
                        <div style={{ color: zoneColor(o.zone), fontSize: 10, fontWeight: "bold", marginTop: 2 }}>{o.zone}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {gaps.existing_with_upside?.length > 0 && (
                <div style={{ ...S.card, marginBottom: 16 }}>
                  <div style={{ color: "#58a6ff", fontWeight: "bold", fontSize: 13, marginBottom: 10 }}>📈 EXISTING POSITIONS — Room to Add, {'>'} 5% Below Target</div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 8 }}>
                    {gaps.existing_with_upside.map((o: any) => (
                      <div key={o.ticker} style={{ background: "#0a1520", border: "1px solid #1a2a3f", borderRadius: 6, padding: 12, textAlign: "center" }}>
                        <div style={{ color: "#e6edf3", fontWeight: "bold", fontSize: 16 }}>{o.ticker}</div>
                        <div style={{ color: "#e6edf3", fontSize: 12 }}>${o.price} → <span style={{ color: "#58a6ff" }}>${o.buy_target}</span></div>
                        <div style={{ color: "#58a6ff", fontSize: 18, fontWeight: "bold", marginTop: 4 }}>+{o.gap_pct}%</div>
                        <div style={{ color: "#2ea043", fontSize: 10, fontWeight: "bold", marginTop: 2 }}>OWNED — ADD MORE</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div style={S.card}>
                <div style={{ color: "#e6edf3", fontWeight: "bold", fontSize: 13, marginBottom: 10 }}>ALL 19 TICKERS — Price vs Target</div>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                  <thead>
                    <tr style={{ borderBottom: "1px solid #30363d" }}>
                      {["TICKER","PRICE","TARGET","GAP $","GAP %","OWNED","ZONE"].map(h => (
                        <th key={h} style={{ padding: "8px", textAlign: "left", color: "#7d8590", fontSize: 10, letterSpacing: 1 }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {gaps.opportunities?.map((o: any) => (
                      <tr key={o.ticker} style={{ borderBottom: "1px solid #30363d" }}>
                        <td style={{ padding: "8px", color: "#e6edf3", fontWeight: "bold" }}>{o.ticker}</td>
                        <td style={{ padding: "8px", color: "#e6edf3" }}>${o.price}</td>
                        <td style={{ padding: "8px", color: "#58a6ff" }}>${o.buy_target}</td>
                        <td style={{ padding: "8px", color: pctColor(o.gap_dollars) }}>
                          {o.gap_dollars >= 0 ? "+" : ""}${Math.abs(o.gap_dollars)}
                        </td>
                        <td style={{ padding: "8px", color: pctColor(o.gap_pct), fontWeight: "bold" }}>
                          {o.gap_pct >= 0 ? "+" : ""}{o.gap_pct}%
                        </td>
                        <td style={{ padding: "8px" }}>
                          {o.owned ? <span style={{ color: "#2ea043", fontSize: 10 }}>✓ YES</span> : <span style={{ color: "#484f58", fontSize: 10 }}>—</span>}
                        </td>
                        <td style={{ padding: "8px", color: zoneColor(o.zone), fontSize: 10, fontWeight: "bold" }}>{o.zone}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── ADD VIEW ── */}
          {view === "add" && (
            <div>
              <div style={S.card}>
                <div style={{ color: "#e6edf3", fontWeight: "bold", fontSize: 13, marginBottom: 16 }}>ADD POSITION</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 10, marginBottom: 12 }}>
                  <div>
                    <div style={{ color: "#7d8590", fontSize: 10, marginBottom: 4 }}>TICKER</div>
                    <input style={S.input} placeholder="AAOI" value={addForm.ticker}
                      onChange={e => setAddForm({...addForm, ticker: e.target.value})} />
                  </div>
                  <div>
                    <div style={{ color: "#7d8590", fontSize: 10, marginBottom: 4 }}>SHARES</div>
                    <input style={S.input} placeholder="100" type="number" value={addForm.shares}
                      onChange={e => setAddForm({...addForm, shares: e.target.value})} />
                  </div>
                  <div>
                    <div style={{ color: "#7d8590", fontSize: 10, marginBottom: 4 }}>AVG COST</div>
                    <input style={S.input} placeholder="25.50" type="number" step="0.01" value={addForm.avg_cost}
                      onChange={e => setAddForm({...addForm, avg_cost: e.target.value})} />
                  </div>
                  <div>
                    <div style={{ color: "#7d8590", fontSize: 10, marginBottom: 4 }}>ACCOUNT</div>
                    <select style={S.input} value={addForm.account}
                      onChange={e => setAddForm({...addForm, account: e.target.value})}>
                      <option>Individual</option>
                      <option>Roth IRA</option>
                      <option>Traditional IRA</option>
                      <option>401k</option>
                    </select>
                  </div>
                </div>
                <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                  <button onClick={addPosition} style={S.btn}>Add Position</button>
                  {addStatus && <span style={{ color: addStatus.includes("✅") ? "#2ea043" : "#f85149", fontSize: 12 }}>{addStatus}</span>}
                </div>
              </div>

              <div style={S.card}>
                <div style={{ color: "#e6edf3", fontWeight: "bold", fontSize: 13, marginBottom: 10 }}>QUICK ADD — PHOTONICS UNIVERSE</div>
                <div style={{ color: "#484f58", fontSize: 11, marginBottom: 12 }}>Click a ticker to prefill, then enter shares and cost basis</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {["AAOI","AEHR","ALMU","ANET","AXTI","CIEN","COHR","CRDO","FN","GFS","GLW","LWLG","MRVL","MTSI","NOK","POET","SMTC","TSEM","VIAV"].map(t => (
                    <button key={t} onClick={() => setAddForm({...addForm, ticker: t})}
                      style={{ ...S.btnSmall, background: addForm.ticker === t ? "#1a8c5e" : "#161b22", color: addForm.ticker === t ? "#fff" : "#7d8590", border: "1px solid #30363d" }}>
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              <div style={S.card}>
                <div style={{ color: "#e6edf3", fontWeight: "bold", fontSize: 13, marginBottom: 10 }}>IMPORT FROM FIDELITY CSV</div>
                <div style={{ color: "#484f58", fontSize: 11, marginBottom: 12 }}>
                  Export from Fidelity → Positions → Download → Upload CSV here
                </div>
                <div style={{ color: "#7d8590", fontSize: 11, padding: 16, background: S.bg, borderRadius: 4, textAlign: "center" }}>
                  CSV import available via API: <code style={{ color: "#58a6ff" }}>POST /photonics/portfolio/import/fidelity</code>
                  <br/><span style={{ fontSize: 10, color: "#484f58" }}>curl -X POST {BASE}/photonics/portfolio/import/fidelity -F "file=@positions.csv"</span>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}


function RelativeStrength() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const API = `${BASE}/photonics/advanced`;
  useEffect(() => { (async () => { setLoading(true); try { const res = await fetch(`${API}/relative-strength`); setData(await res.json()); } catch (e) { console.error(e); } setLoading(false); })(); }, []);
  const pctColor = (v: number | null | undefined) => v == null ? "#484f58" : v >= 0 ? "#2ea043" : "#f85149";
  const S: any = {
  // Backgrounds
  bg: "#161b22",
  card: { background: S.bg, borderRadius: 10, padding: 20, marginBottom: 12, border: "1px solid #30363d", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" } as React.CSSProperties,
  
  // Text colors
  text: "#1a1a2e",
  green: "#0d9f4f",
  red: "#dc2626",
  blue: "#2563eb",
  yellow: "#d97706",
  dim: "#5a6070",
  muted: "#8b92a0",
  orange: "#f7931a",
  
  // Data backgrounds
  greenBg: "#ecfdf3",
  redBg: "#fef2f2",
  blueBg: "#eff6ff",
  yellowBg: "#fffbeb",
  
  // Form elements
  input: { background: "#21262d", border: "1px solid #30363d", borderRadius: 6, padding: "8px 12px", color: "#1a1a2e", fontFamily: "'DM Sans', sans-serif", fontSize: 13, outline: "none" } as React.CSSProperties,
  select: { background: "#21262d", border: "1px solid #30363d", borderRadius: 6, padding: "8px 12px", color: "#1a1a2e", fontFamily: "'DM Sans', sans-serif", fontSize: 13, outline: "none" } as React.CSSProperties,
  
  // Buttons
  btn: { background: "#2563eb", border: "none", borderRadius: 6, padding: "8px 16px", color: "#161b22", fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 600 as any, cursor: "pointer" } as React.CSSProperties,
  btnSmall: { background: "#21262d", border: "1px solid #30363d", borderRadius: 4, padding: "4px 10px", color: "#1a1a2e", fontFamily: "'DM Sans', sans-serif", fontSize: 11, cursor: "pointer" } as React.CSSProperties,
  btnSecondary: { background: "#21262d", border: "1px solid #30363d", borderRadius: 6, padding: "8px 16px", color: "#1a1a2e", fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 500 as any, cursor: "pointer" } as React.CSSProperties,
  
  // Labels
  label: { fontSize: 11, fontWeight: 600, color: "#8b92a0", textTransform: "uppercase" as const, letterSpacing: "0.06em", fontFamily: "'DM Sans', sans-serif" } as React.CSSProperties,
  
  // Borders
  border: "#30363d",
};
  if (loading) return <div style={{ color: "#7d8590", padding: 40, textAlign: "center" }}>Scanning relative strength... (~30s)</div>;
  if (!data) return <div style={{ color: "#f85149", padding: 20 }}>Error loading</div>;
  return (
    <div>
      <div style={{ color: "#e6edf3", fontWeight: "bold", fontSize: 15, marginBottom: 16 }}>RELATIVE STRENGTH ANALYZER</div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, marginBottom: 16 }}>
        <div style={{ ...S.card, borderColor: "#58a6ff" }}>
          <div style={{ color: "#58a6ff", fontSize: 11, letterSpacing: 1 }}>PHOTONICS SECTOR AVG</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, marginTop: 8 }}>
            {Object.entries(data.sector_average || {}).map(([k, v]: any) => (
              <div key={k}><span style={{ color: "#7d8590", fontSize: 10 }}>{k} </span><span style={{ color: pctColor(v), fontSize: 13, fontWeight: "bold" }}>{v > 0 ? "+" : ""}{v}%</span></div>
            ))}
          </div>
        </div>
        {Object.entries(data.benchmarks || {}).map(([sym, info]: any) => (
          <div key={sym} style={S.card}>
            <div style={{ color: "#7d8590", fontSize: 11 }}>{info.name}</div>
            <div style={{ color: "#e6edf3", fontSize: 14, fontWeight: "bold" }}>{sym} ${info.price}</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4, marginTop: 6 }}>
              {Object.entries(info.returns || {}).map(([k, v]: any) => (
                <div key={k}><span style={{ color: "#7d8590", fontSize: 10 }}>{k} </span><span style={{ color: pctColor(v), fontSize: 12 }}>{v > 0 ? "+" : ""}{v}%</span></div>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
        <div style={S.card}>
          <div style={{ color: "#2ea043", fontWeight: "bold", fontSize: 13, marginBottom: 10 }}>🏆 LEADERS (1M RS vs SPY)</div>
          {data.leaders?.map((t: any) => (
            <div key={t.ticker} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid #30363d" }}>
              <span style={{ color: "#e6edf3", fontWeight: "bold" }}>{t.ticker}</span>
              <div><span style={{ color: pctColor(t.returns?.["1M"]), fontSize: 12 }}>{t.returns?.["1M"] > 0 ? "+" : ""}{t.returns?.["1M"]}%</span><span style={{ color: "#2ea043", fontSize: 11, marginLeft: 8 }}>RS: +{t.rs_vs_spy?.["1M"]}%</span></div>
            </div>
          ))}
        </div>
        <div style={S.card}>
          <div style={{ color: "#f85149", fontWeight: "bold", fontSize: 13, marginBottom: 10 }}>📉 LAGGARDS</div>
          {data.laggards?.map((t: any) => (
            <div key={t.ticker} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid #30363d" }}>
              <span style={{ color: "#e6edf3", fontWeight: "bold" }}>{t.ticker}</span>
              <div><span style={{ color: pctColor(t.returns?.["1M"]), fontSize: 12 }}>{t.returns?.["1M"] > 0 ? "+" : ""}{t.returns?.["1M"]}%</span><span style={{ color: "#f85149", fontSize: 11, marginLeft: 8 }}>RS: {t.rs_vs_spy?.["1M"]}%</span></div>
            </div>
          ))}
        </div>
      </div>
      <div style={S.card}>
        <div style={{ color: "#e6edf3", fontWeight: "bold", fontSize: 13, marginBottom: 10 }}>ALL TICKERS — RS vs S&P 500</div>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
          <thead><tr style={{ borderBottom: "1px solid #30363d" }}>
            {["TICKER","PRICE","1W","1M","3M","6M","RS 1W","RS 1M","RS 3M"].map(h => (<th key={h} style={{ padding: "8px", textAlign: "left", color: "#7d8590", fontSize: 10, letterSpacing: 1 }}>{h}</th>))}
          </tr></thead>
          <tbody>{data.tickers?.map((t: any) => (
            <tr key={t.ticker} style={{ borderBottom: "1px solid #30363d" }}>
              <td style={{ padding: "8px", color: "#e6edf3", fontWeight: "bold" }}>{t.ticker}</td>
              <td style={{ padding: "8px", color: "#e6edf3" }}>${t.price}</td>
              {["1W","1M","3M","6M"].map(p => (<td key={p} style={{ padding: "8px", color: pctColor(t.returns?.[p]) }}>{t.returns?.[p] != null ? `${t.returns[p] > 0 ? "+" : ""}${t.returns[p]}%` : "—"}</td>))}
              {["1W","1M","3M"].map(p => (<td key={`rs-${p}`} style={{ padding: "8px", color: pctColor(t.rs_vs_spy?.[p]), fontWeight: "bold" }}>{t.rs_vs_spy?.[p] != null ? `${t.rs_vs_spy[p] > 0 ? "+" : ""}${t.rs_vs_spy[p]}` : "—"}</td>))}
            </tr>
          ))}</tbody>
        </table>
      </div>
    </div>
  );
}


function RiskAnalytics() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const API = `${BASE}/photonics/advanced`;
  useEffect(() => { (async () => { setLoading(true); try { const res = await fetch(`${API}/risk`); setData(await res.json()); } catch (e) { console.error(e); } setLoading(false); })(); }, []);
  const riskColor = (tier: string) => tier === "HIGH" ? "#f85149" : tier === "MEDIUM" ? "#d29922" : "#2ea043";
  const S = { card: { background: S.bg, border: "1px solid #30363d", borderRadius: 6, padding: 16, marginBottom: 12 }, metric: { background: S.bg, border: "1px solid #30363d", borderRadius: 6, padding: 14, textAlign: "center" as const } };
  if (loading) return <div style={{ color: "#7d8590", padding: 40, textAlign: "center" }}>Computing risk metrics... (~45s)</div>;
  if (!data || data.error) return <div style={{ color: "#f85149", padding: 20 }}>Error loading risk data</div>;
  const ss = data.sector_stats || {};
  return (
    <div>
      <div style={{ color: "#e6edf3", fontWeight: "bold", fontSize: 15, marginBottom: 16 }}>RISK ANALYTICS</div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 10, marginBottom: 16 }}>
        <div style={S.metric}><div style={{ color: "#7d8590", fontSize: 10 }}>AVG BETA</div><div style={{ color: ss.avg_beta > 1.5 ? "#f85149" : "#e6edf3", fontSize: 22, fontWeight: "bold" }}>{ss.avg_beta}</div></div>
        <div style={S.metric}><div style={{ color: "#7d8590", fontSize: 10 }}>AVG VOL</div><div style={{ color: ss.avg_volatility > 50 ? "#f85149" : "#d29922", fontSize: 22, fontWeight: "bold" }}>{ss.avg_volatility}%</div></div>
        <div style={S.metric}><div style={{ color: "#7d8590", fontSize: 10 }}>AVG SHARPE</div><div style={{ color: ss.avg_sharpe > 1 ? "#2ea043" : "#d29922", fontSize: 22, fontWeight: "bold" }}>{ss.avg_sharpe}</div></div>
        <div style={{ ...S.metric, borderColor: "#2ea04350" }}><div style={{ color: "#7d8590", fontSize: 10 }}>LOW</div><div style={{ color: "#2ea043", fontSize: 22, fontWeight: "bold" }}>{ss.low_risk_count}</div></div>
        <div style={{ ...S.metric, borderColor: "#d2992250" }}><div style={{ color: "#7d8590", fontSize: 10 }}>MED</div><div style={{ color: "#d29922", fontSize: 22, fontWeight: "bold" }}>{ss.medium_risk_count}</div></div>
        <div style={{ ...S.metric, borderColor: "#f8514950" }}><div style={{ color: "#7d8590", fontSize: 10 }}>HIGH</div><div style={{ color: "#f85149", fontSize: 22, fontWeight: "bold" }}>{ss.high_risk_count}</div></div>
      </div>
      <div style={S.card}>
        <div style={{ color: "#e6edf3", fontWeight: "bold", fontSize: 13, marginBottom: 10 }}>RISK METRICS — Sorted by Sharpe</div>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
          <thead><tr style={{ borderBottom: "1px solid #30363d" }}>
            {["TICKER","PRICE","BETA","VOL","DRAWDOWN","SHARPE","FROM HIGH","TIER"].map(h => (<th key={h} style={{ padding: "8px", textAlign: "left", color: "#7d8590", fontSize: 10, letterSpacing: 1 }}>{h}</th>))}
          </tr></thead>
          <tbody>{data.tickers?.map((t: any) => (
            <tr key={t.ticker} style={{ borderBottom: "1px solid #30363d" }}>
              <td style={{ padding: "8px", color: "#e6edf3", fontWeight: "bold" }}>{t.ticker}</td>
              <td style={{ padding: "8px", color: "#e6edf3" }}>${t.price}</td>
              <td style={{ padding: "8px", color: t.beta > 1.5 ? "#f85149" : t.beta > 1 ? "#d29922" : "#2ea043" }}>{t.beta}</td>
              <td style={{ padding: "8px", color: t.volatility > 60 ? "#f85149" : t.volatility > 35 ? "#d29922" : "#2ea043" }}>{t.volatility}%</td>
              <td style={{ padding: "8px", color: "#f85149" }}>{t.max_drawdown}%</td>
              <td style={{ padding: "8px", color: t.sharpe_ratio > 1 ? "#2ea043" : t.sharpe_ratio > 0 ? "#d29922" : "#f85149", fontWeight: "bold" }}>{t.sharpe_ratio}</td>
              <td style={{ padding: "8px", color: "#f85149" }}>{t.pct_from_52w_high}%</td>
              <td style={{ padding: "8px" }}><span style={{ color: riskColor(t.risk_tier), fontWeight: "bold", fontSize: 11, padding: "2px 8px", background: riskColor(t.risk_tier) + "15", borderRadius: 3 }}>{t.risk_tier}</span></td>
            </tr>
          ))}</tbody>
        </table>
      </div>
      {data.position_sizing?.conservative?.length > 0 && (
        <div style={S.card}>
          <div style={{ color: "#e6edf3", fontWeight: "bold", fontSize: 13, marginBottom: 4 }}>SUGGESTED MAX ALLOCATION</div>
          <div style={{ color: "#484f58", fontSize: 11, marginBottom: 10 }}>Based on Sharpe and volatility — not financial advice</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {data.position_sizing.conservative.map((p: any) => (
              <div key={p.ticker} style={{ padding: "6px 12px", background: S.bg, borderRadius: 4, border: "1px solid #30363d" }}>
                <span style={{ color: "#e6edf3", fontWeight: "bold", fontSize: 12 }}>{p.ticker}</span>
                <span style={{ color: "#58a6ff", fontSize: 12, marginLeft: 8 }}>{p.max_allocation_pct}%</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}


function NewsFeed() {
  const [news, setNews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");
  const API = `${BASE}/photonics/advanced`;
  const fetchNews = async (ticker?: string) => { setLoading(true); try { const url = ticker ? `${API}/news?ticker=${ticker}` : `${API}/news`; const res = await fetch(url); const json = await res.json(); setNews(json.news || []); } catch (e) { console.error(e); } setLoading(false); };
  useEffect(() => { fetchNews(); }, []);
  const TICKERS = ["ALL","AAOI","AEHR","ALMU","ANET","AXTI","CIEN","COHR","CRDO","FN","GFS","GLW","LWLG","MRVL","MTSI","NOK","POET","SMTC","TSEM","VIAV"];
  const S = { btn: { padding: "4px 8px", background: "#30363d", color: "#aaa", border: "none", borderRadius: 3, cursor: "pointer", fontFamily: "'DM Sans', sans-serif", fontSize: 10 } };
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <span style={{ color: "#e6edf3", fontWeight: "bold", fontSize: 15 }}>NEWS FEED</span>
        <button onClick={() => fetchNews(filter || undefined)} style={{ ...S.btn, background: "#1a8c5e", color: "#fff" }}>↻ REFRESH</button>
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 16 }}>
        {TICKERS.map(t => (
          <button key={t} onClick={() => { setFilter(t === "ALL" ? "" : t); fetchNews(t === "ALL" ? undefined : t); }}
            style={{ ...S.btn, background: (t === "ALL" && !filter) || filter === t ? "#1a8c5e" : "#161b22", color: (t === "ALL" && !filter) || filter === t ? "#fff" : "#7d8590" }}>{t}</button>
        ))}
      </div>
      {loading ? <div style={{ color: "#7d8590", padding: 40, textAlign: "center" }}>Fetching news...</div> : (
        news.length === 0 ? <div style={{ color: "#484f58", padding: 20, textAlign: "center" }}>No recent news</div> :
        news.map((item: any, i: number) => (
          <div key={i} style={{ padding: "12px 16px", borderBottom: "1px solid #30363d" }}>
            <div><span style={{ color: "#58a6ff", fontSize: 11, fontWeight: "bold", marginRight: 8, padding: "1px 6px", background: "#58a6ff15", borderRadius: 3 }}>{item.ticker}</span>
            <a href={item.link} target="_blank" rel="noopener noreferrer" style={{ color: "#e6edf3", fontSize: 13, textDecoration: "none" }}>{item.title}</a></div>
            <div style={{ marginTop: 4 }}><span style={{ color: "#484f58", fontSize: 10 }}>{item.publisher}</span>
            {item.published && <span style={{ color: "#484f58", fontSize: 10, marginLeft: 8 }}>{new Date(item.published).toLocaleDateString()}</span>}</div>
          </div>
        ))
      )}
    </div>
  );
}


function AlertsPanel() {
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ ticker: "", alert_type: "price_below", threshold: "", notes: "" });
  const API = `${BASE}/photonics/advanced`;
  const fetchAlerts = async () => { setLoading(true); try { const res = await fetch(`${API}/alerts`); const json = await res.json(); setAlerts(json.alerts || []); } catch (e) { console.error(e); } setLoading(false); };
  const addAlert = async () => { if (!form.ticker) return; await fetch(`${API}/alerts`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ticker: form.ticker.toUpperCase(), alert_type: form.alert_type, threshold: form.threshold ? parseFloat(form.threshold) : null, notes: form.notes }) }); setForm({ ticker: "", alert_type: "price_below", threshold: "", notes: "" }); fetchAlerts(); };
  const deleteAlert = async (id: number) => { await fetch(`${API}/alerts/${id}`, { method: "DELETE" }); fetchAlerts(); };
  useEffect(() => { fetchAlerts(); }, []);
  const S: Record<string, any> = { card: { background: S.bg, border: "1px solid #30363d", borderRadius: 6, padding: 16, marginBottom: 12 }, input: { padding: "8px 10px", background: S.bg, border: "1px solid #30363d", borderRadius: 4, color: "#e6edf3", fontFamily: "'DM Sans', sans-serif", fontSize: 12 }, btn: { padding: "8px 14px", background: "#1a8c5e", color: "#fff", border: "none", borderRadius: 4, cursor: "pointer", fontFamily: "'DM Sans', sans-serif", fontSize: 12, fontWeight: "bold" } };
  const typeLabels: Record<string, string> = { price_below: "📉 Price Below", price_above: "📈 Price Above", rsi_oversold: "🔻 RSI Oversold", rsi_overbought: "🔺 RSI Overbought", volume_spike: "📊 Volume Spike", earnings_soon: "📅 Earnings Soon" };
  return (
    <div>
      <div style={{ color: "#e6edf3", fontWeight: "bold", fontSize: 15, marginBottom: 16 }}>ALERTS</div>
      <div style={S.card}>
        <div style={{ color: "#e6edf3", fontWeight: "bold", fontSize: 13, marginBottom: 12 }}>CREATE ALERT</div>
        <div style={{ display: "flex", gap: 10, alignItems: "flex-end", flexWrap: "wrap" }}>
          <div><div style={{ color: "#7d8590", fontSize: 10, marginBottom: 4 }}>TICKER</div><input style={{ ...S.input, width: 80 }} placeholder="COHR" value={form.ticker} onChange={e => setForm({...form, ticker: e.target.value})} /></div>
          <div><div style={{ color: "#7d8590", fontSize: 10, marginBottom: 4 }}>TYPE</div><select style={{ ...S.input, width: 160 }} value={form.alert_type} onChange={e => setForm({...form, alert_type: e.target.value})}>{Object.entries(typeLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></div>
          <div><div style={{ color: "#7d8590", fontSize: 10, marginBottom: 4 }}>THRESHOLD</div><input style={{ ...S.input, width: 100 }} placeholder="200" type="number" step="0.01" value={form.threshold} onChange={e => setForm({...form, threshold: e.target.value})} /></div>
          <div><div style={{ color: "#7d8590", fontSize: 10, marginBottom: 4 }}>NOTES</div><input style={{ ...S.input, width: 200 }} placeholder="Buy zone" value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} /></div>
          <button onClick={addAlert} style={S.btn}>+ Add</button>
        </div>
      </div>
      {loading ? <div style={{ color: "#7d8590", padding: 20 }}>Loading...</div> : (
        alerts.length === 0 ? <div style={{ ...S.card, textAlign: "center", padding: 40, color: "#484f58" }}>No alerts. Add one above.</div> :
        <div style={S.card}>
          <div style={{ color: "#e6edf3", fontWeight: "bold", fontSize: 13, marginBottom: 10 }}>ACTIVE ({alerts.length})</div>
          {alerts.map((a: any) => (
            <div key={a.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: "1px solid #30363d" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <span style={{ fontSize: 18 }}>{a.triggered ? "🔔" : "⏳"}</span>
                <div>
                  <span style={{ color: "#e6edf3", fontWeight: "bold", fontSize: 13 }}>{a.ticker}</span>
                  <span style={{ color: "#58a6ff", fontSize: 11, marginLeft: 8 }}>{typeLabels[a.alert_type] || a.alert_type}</span>
                  {a.threshold && <span style={{ color: "#d29922", fontSize: 11, marginLeft: 8 }}>${a.threshold}</span>}
                  {a.notes && <span style={{ color: "#484f58", fontSize: 11, marginLeft: 8 }}>— {a.notes}</span>}
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                {a.current_price && <span style={{ color: "#e6edf3", fontSize: 12 }}>Now: ${a.current_price}</span>}
                {a.triggered && <span style={{ color: "#2ea043", fontSize: 11, fontWeight: "bold", padding: "2px 8px", background: "#2ea04320", borderRadius: 3 }}>TRIGGERED</span>}
                <button onClick={() => deleteAlert(a.id)} style={{ background: "transparent", border: "none", color: "#484f58", cursor: "pointer" }}>✕</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function PhotonicsEducation() {
  const [expanded, setExpanded] = useState<string | null>("what-is-photonics");
  const [glossarySearch, setGlossarySearch] = useState("");

  const sections = [
    { id: "what-is-photonics", title: "What is Photonics?", icon: "💡" },
    { id: "supply-chain", title: "The Photonics Supply Chain", icon: "🔗" },
    { id: "key-companies", title: "Key Companies & What They Do", icon: "🏢" },
    { id: "how-to-analyze", title: "How to Analyze Photonics Stocks", icon: "📊" },
    { id: "glossary", title: "Glossary of Terms", icon: "📖" },
  ];

  const glossary = [
    { term: "Transceiver", def: "An optical module that converts electrical signals to light and back. Used in data center networking." },
    { term: "EML", def: "Electro-absorption Modulated Laser — a type of laser used in high-speed optical communications." },
    { term: "VCSEL", def: "Vertical-Cavity Surface-Emitting Laser — used in short-range optical links." },
    { term: "Wafer", def: "A thin slice of semiconductor material used as the base for fabricating electronic/optical components." },
    { term: "Epitaxy", def: "The process of growing crystal layers on a wafer substrate. Critical for laser and detector manufacturing." },
    { term: "InP", def: "Indium Phosphide — a semiconductor material ideal for long-wavelength optical devices." },
    { term: "GaAs", def: "Gallium Arsenide — a semiconductor material used in short-wavelength lasers and solar cells." },
    { term: "PIC", def: "Photonic Integrated Circuit — multiple optical components integrated on a single chip." },
    { term: "CPO", def: "Co-Packaged Optics — integrating optics directly with switch ASICs for lower power and latency." },
    { term: "800G/1.6T", def: "Data rates for next-generation transceivers (800 Gigabit / 1.6 Terabit per second)." },
    { term: "Coherent", def: "Advanced modulation technique for long-haul optical transmission using phase and amplitude encoding." },
    { term: "PAM4", def: "Pulse Amplitude Modulation 4-level — a signaling scheme that doubles data rate vs NRZ." },
    { term: "Hyperscaler", def: "Large cloud providers (AWS, Azure, GCP, Meta) that drive massive demand for optical components." },
    { term: "DSP", def: "Digital Signal Processor — processes and cleans up optical signals at the receiver end." },
    { term: "Optical Fiber", def: "Glass or plastic strand that carries light signals over long distances with minimal loss." },
    { term: "Silicon Photonics", def: "Using standard silicon fabrication to create optical devices, enabling lower cost at scale." },
  ];

  const companyGuide = [
    { ticker: "COHR", role: "Vertically integrated: substrates, lasers, transceivers", step: "Multi-Step" },
    { ticker: "AAOI", role: "Transceiver manufacturer focused on 400G/800G data center optics", step: "Transceiver" },
    { ticker: "POET", role: "Photonic integration platform (optical interposer technology)", step: "Assembly" },
    { ticker: "CIEN", role: "Networking equipment with coherent optical technology", step: "Transceiver" },
    { ticker: "FN", role: "Optical networking equipment for telecom and webscale", step: "Transceiver" },
    { ticker: "GFS", role: "Foundry services for photonics and semiconductor devices", step: "Wafer Fab" },
    { ticker: "MRVL", role: "DSP and PHY chips that drive transceivers", step: "Data Center" },
    { ticker: "AEHR", role: "Test and burn-in equipment for semiconductor devices", step: "Assembly" },
    { ticker: "GLW", role: "Optical fiber and specialty glass products", step: "Substrate" },
    { ticker: "LWLG", role: "Electro-optic polymer modulators for next-gen communications", step: "Assembly" },
  ];

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 18, color: S.cyan, fontWeight: "bold" }}>PHOTONICS EDUCATION CENTER</div>
        <div style={{ color: S.muted, fontSize: 12, marginTop: 4 }}>Learn the fundamentals of the photonics supply chain and how to analyze these companies.</div>
      </div>

      {sections.map(section => (
        <div key={section.id} style={{ ...S.card, cursor: "pointer", borderLeft: expanded === section.id ? `3px solid ${S.cyan}` : "3px solid transparent", transition: "border-color 0.2s" }}
          onClick={() => setExpanded(expanded === section.id ? null : section.id)}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ color: S.text, fontWeight: "bold", fontSize: 14 }}>{section.icon} {section.title}</span>
            <span style={{ color: S.dim, fontSize: 16 }}>{expanded === section.id ? "−" : "+"}</span>
          </div>

          {expanded === section.id && (
            <div style={{ marginTop: 16 }} onClick={e => e.stopPropagation()}>

              {section.id === "what-is-photonics" && (
                <div style={{ color: S.text, fontSize: 13, lineHeight: 1.8 }}>
                  <p style={{ marginBottom: 12 }}>Photonics is the science and technology of generating, controlling, and detecting photons — particles of light. In the context of investing, photonics refers to the semiconductor supply chain that produces optical components for data centers, telecommunications, and AI infrastructure.</p>
                  <p style={{ marginBottom: 12 }}>The photonics industry is critical to the AI revolution because <span style={{ color: S.cyan, fontWeight: "bold" }}>optical interconnects (transceivers)</span> are the primary way data moves between GPUs, switches, and servers in hyperscale data centers.</p>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginTop: 16 }}>
                    {[
                      { label: "Market Size", value: "$24B+", sub: "Global photonics components", color: S.green },
                      { label: "Growth Rate", value: "15-20%", sub: "Annual CAGR driven by AI", color: S.cyan },
                      { label: "Key Driver", value: "AI/ML", sub: "GPU clusters need optical links", color: S.yellow },
                    ].map(m => (
                      <div key={m.label} style={{ background: S.bgDeep, borderRadius: 6, padding: 14, textAlign: "center", border: "1px solid #30363d" }}>
                        <div style={{ color: S.muted, fontSize: 10, letterSpacing: 1 }}>{m.label}</div>
                        <div style={{ color: m.color, fontSize: 22, fontWeight: "bold", margin: "4px 0" }}>{m.value}</div>
                        <div style={{ color: S.dim, fontSize: 11 }}>{m.sub}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {section.id === "supply-chain" && (
                <div>
                  <p style={{ color: S.muted, fontSize: 13, marginBottom: 16, lineHeight: 1.6 }}>The photonics supply chain transforms raw materials into the optical transceivers that power data centers. Each step adds value and complexity.</p>
                  <div style={{ display: "flex", gap: 4, overflowX: "auto", padding: "12px 0" }}>
                    {Object.entries(STEP_NAMES).map(([step, name], i) => (
                      <div key={step} style={{ display: "flex", alignItems: "center", flexShrink: 0 }}>
                        <div style={{ background: S.bgDeep, border: `1px solid ${S.cyan}40`, borderRadius: 8, padding: "14px 16px", minWidth: 120, textAlign: "center" }}>
                          <div style={{ fontSize: 22, marginBottom: 4 }}>{["⛏️","💎","🔬","🏭","✂️","🔧","📡","🖥️"][i]}</div>
                          <div style={{ color: S.text, fontWeight: "bold", fontSize: 12 }}>{name}</div>
                          <div style={{ color: S.dim, fontSize: 10, marginTop: 4 }}>Step {Number(step) + 1}</div>
                        </div>
                        {i < 7 && <div style={{ color: S.cyan, fontSize: 18, padding: "0 6px", flexShrink: 0 }}>→</div>}
                      </div>
                    ))}
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 16 }}>
                    {[
                      { step: "Mining → Substrate", desc: "Raw materials (Indium, Gallium, Phosphide) are refined into crystalline wafers that serve as the foundation." },
                      { step: "Epitaxy → Wafer Fab", desc: "Atomic-precision crystal layers are grown on substrates, then processed into functional chip patterns." },
                      { step: "Dicing → Assembly", desc: "Wafers are cut into individual chips (dies), then packaged with lenses, fibers, and electronics." },
                      { step: "Transceiver → Data Center", desc: "Completed optical modules are plugged into switches and servers, enabling high-speed data transfer." },
                    ].map(s => (
                      <div key={s.step} style={{ background: S.bgDeep, borderRadius: 6, padding: 12, border: "1px solid #30363d" }}>
                        <div style={{ color: S.cyan, fontWeight: "bold", fontSize: 12, marginBottom: 4 }}>{s.step}</div>
                        <div style={{ color: S.muted, fontSize: 12, lineHeight: 1.5 }}>{s.desc}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {section.id === "key-companies" && (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                  {companyGuide.map(c => (
                    <div key={c.ticker} style={{ background: S.bgDeep, border: "1px solid #30363d", borderRadius: 6, padding: 12 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                        <span style={{ color: S.green, fontWeight: "bold", fontSize: 15 }}>{c.ticker}</span>
                        <span style={{ color: S.dim, fontSize: 10, background: "#21262d", padding: "2px 8px", borderRadius: 3, letterSpacing: 0.5 }}>{c.step}</span>
                      </div>
                      <div style={{ color: S.muted, fontSize: 12, lineHeight: 1.5 }}>{c.role}</div>
                    </div>
                  ))}
                </div>
              )}

              {section.id === "how-to-analyze" && (
                <div>
                  <p style={{ color: S.muted, fontSize: 13, marginBottom: 16, lineHeight: 1.6 }}>Key metrics and frameworks for evaluating photonics companies:</p>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                    {[
                      { metric: "Revenue Growth Rate", target: "20%+ YoY", why: "Photonics companies in growth mode should show strong top-line acceleration", color: S.green },
                      { metric: "Gross Margin", target: "40%+", why: "Semiconductor companies need healthy margins to fund R&D and expansion", color: S.cyan },
                      { metric: "Design Wins", target: "Track new wins", why: "New customer wins, especially with hyperscalers (MSFT, GOOGL, AMZN, META)", color: S.blue },
                      { metric: "Capacity Utilization", target: "80%+", why: "Wafer fab utilization rates signal demand strength and pricing power", color: S.yellow },
                      { metric: "Book-to-Bill Ratio", target: "> 1.0x", why: "Above 1.0 indicates new orders exceed shipments — growing backlog", color: S.green },
                      { metric: "ASP Trends", target: "Rising", why: "Average selling price increases indicate pricing power and product mix improvement", color: S.cyan },
                    ].map(m => (
                      <div key={m.metric} style={{ background: S.bgDeep, borderRadius: 6, padding: 12, border: "1px solid #30363d", borderLeft: `3px solid ${m.color}` }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                          <span style={{ color: S.text, fontWeight: "bold", fontSize: 13 }}>{m.metric}</span>
                          <span style={{ color: m.color, fontWeight: "bold", fontSize: 12 }}>{m.target}</span>
                        </div>
                        <div style={{ color: S.muted, fontSize: 12, lineHeight: 1.5 }}>{m.why}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {section.id === "glossary" && (
                <div>
                  <input value={glossarySearch} onChange={e => setGlossarySearch(e.target.value)} placeholder="🔍 Search terms..." style={{ ...S.input, marginBottom: 12, width: 300 }} />
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                    {glossary.filter(g => !glossarySearch || g.term.toLowerCase().includes(glossarySearch.toLowerCase()) || g.def.toLowerCase().includes(glossarySearch.toLowerCase())).map(g => (
                      <div key={g.term} style={{ background: S.bgDeep, border: "1px solid #30363d", borderRadius: 6, padding: 12 }}>
                        <div style={{ color: S.cyan, fontWeight: "bold", fontSize: 13, marginBottom: 4 }}>{g.term}</div>
                        <div style={{ color: S.muted, fontSize: 12, lineHeight: 1.5 }}>{g.def}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
