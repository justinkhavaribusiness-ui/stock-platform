"use client";
import { useState, useEffect, useMemo, useCallback } from "react";

const API = "http://localhost:8001";

const fmt = (n: number) => {
  if (n === undefined || n === null) return "$0.00";
  const sign = n >= 0 ? "+" : "";
  return `${sign}$${Math.abs(n).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

interface Trade {
  ticker: string; option_type: string; strike: number; expiry: string; strategy: string;
  contracts: number; open_date: string; close_date: string; open_premium: number;
  close_premium: number; net_pnl: number; commissions: number; net_after_fees: number;
  status: string; close_type: string; account: string;
}

interface OptionsData {
  summary: any; completed_trades: Trade[]; open_positions: Trade[];
  pnl_by_ticker: Record<string, number>; trades_by_ticker: Record<string, number>;
  pnl_by_strategy: Record<string, number>; trades_by_strategy: Record<string, number>;
  monthly_pnl: Record<string, number>; monthly_trades: Record<string, number>;
  last_updated?: string;
}

interface AnalysisData {
  insights: {type: string; title: string; text: string}[];
  warnings: {type: string; title: string; text: string}[];
  recommendations: {title: string; text: string}[];
  stats: any;
}

interface LiveData {
  positions: any[]; total_unrealized: number; prices: any;
}

export default function OptionsJournal() {
  const [data, setData] = useState<OptionsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [subTab, setSubTab] = useState("overview");
  const [sortCol, setSortCol] = useState("close_date");
  const [sortDir, setSortDir] = useState(-1);
  const [filterTicker, setFilterTicker] = useState("ALL");
  const [filterStrategy, setFilterStrategy] = useState("ALL");

  // Upload state
  const [uploading, setUploading] = useState(false);
  const [uploadMsg, setUploadMsg] = useState("");
  const [dragOver, setDragOver] = useState(false);

  // AI Analysis state
  const [analysis, setAnalysis] = useState<AnalysisData | null>(null);
  const [analyzing, setAnalyzing] = useState(false);

  // Live positions state
  const [liveData, setLiveData] = useState<LiveData | null>(null);
  const [liveLoading, setLiveLoading] = useState(false);

  const loadData = useCallback(() => {
    fetch(`${API}/options-journal`)
      .then((r) => r.json())
      .then((d) => { setData(d); setLoading(false); })
      .catch((e) => { setError(e.message); setLoading(false); });
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  // CSV Upload
  const handleUpload = async (file: File) => {
    setUploading(true); setUploadMsg("");
    const formData = new FormData();
    formData.append("file", file);
    try {
      const res = await fetch(`${API}/options-journal/upload`, { method: "POST", body: formData });
      const result = await res.json();
      if (res.ok) {
        setUploadMsg(`${result.message}`);
        loadData();
      } else {
        setUploadMsg(`Error: ${result.error || "Upload failed"}`);
      }
    } catch (e: any) { setUploadMsg(`Error: ${e.message}`); }
    setUploading(false);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault(); setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file && (file.name.endsWith('.csv') || file.type === 'text/csv')) handleUpload(file);
    else setUploadMsg("Please drop a .csv file");
  };

  // AI Analysis
  const loadAnalysis = async () => {
    setAnalyzing(true);
    try {
      const res = await fetch(`${API}/options-journal/analyze`);
      const result = await res.json();
      setAnalysis(result);
    } catch (e: any) { console.error(e); }
    setAnalyzing(false);
  };

  // Live positions
  const loadLive = async () => {
    setLiveLoading(true);
    try {
      const res = await fetch(`${API}/options-journal/live`);
      const result = await res.json();
      setLiveData(result);
    } catch (e: any) { console.error(e); }
    setLiveLoading(false);
  };

  const tickers = useMemo(() => {
    if (!data) return ["ALL"];
    return ["ALL", ...Object.keys(data.pnl_by_ticker)];
  }, [data]);

  const strategies = useMemo(() => {
    if (!data) return ["ALL"];
    return ["ALL", ...new Set(data.completed_trades.map((t) => t.strategy))];
  }, [data]);

  const filteredTrades = useMemo(() => {
    if (!data) return [];
    let trades = [...data.completed_trades];
    if (filterTicker !== "ALL") trades = trades.filter((t) => t.ticker === filterTicker);
    if (filterStrategy !== "ALL") trades = trades.filter((t) => t.strategy === filterStrategy);
    trades.sort((a: any, b: any) => {
      let av = a[sortCol], bv = b[sortCol];
      if (sortCol === "open_date" || sortCol === "close_date") {
        av = av ? new Date(av).getTime() : 0; bv = bv ? new Date(bv).getTime() : 0;
      }
      if (typeof av === "string") return av.localeCompare(bv) * sortDir;
      return ((av || 0) - (bv || 0)) * sortDir;
    });
    return trades;
  }, [data, sortCol, sortDir, filterTicker, filterStrategy]);

  const tickerData = useMemo(() => {
    if (!data) return [];
    return Object.entries(data.pnl_by_ticker)
      .map(([ticker, pnl]) => ({ ticker, pnl: Math.round(pnl * 100) / 100, trades: data.trades_by_ticker[ticker] || 0 }))
      .sort((a, b) => b.pnl - a.pnl);
  }, [data]);

  const monthlyData = useMemo(() => {
    if (!data) return [];
    return Object.entries(data.monthly_pnl).map(([month, pnl]) => ({
      month, label: new Date(month + "-15").toLocaleDateString("en-US", { month: "short", year: "2-digit" }),
      pnl, trades: data.monthly_trades[month] || 0,
    }));
  }, [data]);

  const handleSort = (col: string) => {
    if (sortCol === col) setSortDir((d) => d * -1);
    else { setSortCol(col); setSortDir(-1); }
  };

  // -- Light theme colors --
  const green = "#16a34a";
  const red = "#dc2626";
  const blue = "#2563eb";
  const purple = "#7c3aed";
  const amber = "#d97706";

  if (loading) return <div style={{ padding: 40, textAlign: "center", color: "#6b7280" }}>Loading options data...</div>;
  if (error) return <div style={{ padding: 40, textAlign: "center", color: red }}>Error: {error}</div>;
  if (!data) return null;

  const s = data.summary;
  const maxPnl = Math.max(...tickerData.map((t) => Math.abs(t.pnl)), 1);
  const maxMonthly = Math.max(...monthlyData.map((m) => Math.abs(m.pnl)), 1);
  let cum = 0;
  const cumulativeData = monthlyData.map((m) => { cum += m.pnl; return { ...m, cumulative: cum }; });

  const cardStyle: React.CSSProperties = { background: "#ffffff", border: "1px solid #e5e7eb", borderRadius: 10, padding: 16 };
  const labelStyle: React.CSSProperties = { fontSize: 11, color: "#6b7280", textTransform: "uppercase" as const, letterSpacing: 1, fontWeight: 600, marginBottom: 4 };

  const pnlColor = (v: number) => v > 0 ? green : v < 0 ? red : "#6b7280";

  return (
    <div style={{ color: "#1e293b" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: "#111827" }}>
            <span style={{ color: green }}>&#9670;</span> Options Trading Journal
          </h2>
          <div style={{ fontSize: 12, color: "#6b7280", marginTop: 2 }}>
            Fidelity Activity &middot; {data.last_updated ? `Updated ${new Date(data.last_updated).toLocaleDateString()}` : "Oct 2025 \u2013 Feb 2026"}
          </div>
        </div>
        <div style={{ fontSize: 28, fontWeight: 800, fontFamily: "monospace", color: pnlColor(s.total_pnl) }}>
          {fmt(s.total_pnl)}
        </div>
      </div>

      {/* Sub-tabs */}
      <div style={{ display: "flex", gap: 4, marginBottom: 16, flexWrap: "wrap" }}>
        {["overview", "trades", "tickers", "monthly", "analysis", "live", "import"].map((t) => (
          <button key={t} onClick={() => { setSubTab(t); if (t === "analysis" && !analysis) loadAnalysis(); if (t === "live") loadLive(); }}
            style={{
              background: subTab === t ? "#f1f5f9" : "transparent",
              color: subTab === t ? "#111827" : "#6b7280",
              border: "1px solid " + (subTab === t ? "#cbd5e1" : "transparent"),
              borderRadius: 8, padding: "6px 14px", fontSize: 13, fontWeight: 600, cursor: "pointer",
              textTransform: "capitalize",
            }}>{t === "analysis" ? "AI Analysis" : t === "live" ? "Live Positions" : t}</button>
        ))}
      </div>

      {/* -- OVERVIEW -- */}
      {subTab === "overview" && (
        <div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 10, marginBottom: 20 }}>
            {[
              { label: "Total P&L", value: fmt(s.total_pnl), color: pnlColor(s.total_pnl) },
              { label: "Win Rate", value: `${s.win_rate}%`, color: s.win_rate >= 50 ? green : red, sub: `${s.winners}W / ${s.losers}L` },
              { label: "Total Trades", value: String(s.total_trades), color: blue, sub: `${data.open_positions.length} open` },
              { label: "Avg Win", value: fmt(s.avg_win), color: green },
              { label: "Avg Loss", value: fmt(s.avg_loss), color: red },
              { label: "Best Trade", value: fmt(s.best_trade), color: green },
              { label: "Worst Trade", value: fmt(s.worst_trade), color: red },
              { label: "Commissions", value: `$${s.total_commissions.toFixed(2)}`, color: amber },
            ].map((card, i) => (
              <div key={i} style={cardStyle}>
                <div style={labelStyle}>{card.label}</div>
                <div style={{ fontSize: 22, fontWeight: 700, color: card.color, fontFamily: "monospace" }}>{card.value}</div>
                {card.sub && <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 2 }}>{card.sub}</div>}
              </div>
            ))}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20 }}>
            <div style={cardStyle}>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12, color: "#111827" }}>Strategy Breakdown</div>
              {Object.entries(data.pnl_by_strategy).sort((a, b) => b[1] - a[1]).map(([strat, pnl], i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid #f1f5f9" }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 13, color: "#111827" }}>{strat}</div>
                    <div style={{ fontSize: 11, color: "#6b7280" }}>{data.trades_by_strategy[strat]} trades</div>
                  </div>
                  <div style={{ fontWeight: 700, fontFamily: "monospace", color: pnlColor(pnl), alignSelf: "center" }}>{fmt(pnl)}</div>
                </div>
              ))}
            </div>
            <div style={cardStyle}>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12, color: "#111827" }}>Open Positions</div>
              {data.open_positions.length === 0 ? <div style={{ color: "#6b7280", fontSize: 13 }}>No open positions</div> :
                data.open_positions.map((p, i) => (
                  <div key={i} style={{ padding: "8px 0", borderBottom: "1px solid #f1f5f9" }}>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ fontWeight: 700, color: "#111827" }}>{p.ticker}</span>
                      <span style={{ fontSize: 11, background: "#eff6ff", color: blue, padding: "2px 8px", borderRadius: 4, fontWeight: 600 }}>{p.strategy}</span>
                    </div>
                    <div style={{ fontSize: 12, color: "#6b7280", marginTop: 4 }}>
                      {p.option_type} ${p.strike} &middot; exp {p.expiry} &middot; {p.contracts}x
                    </div>
                  </div>
                ))
              }
            </div>
          </div>

          <div style={{ ...cardStyle, marginBottom: 20 }}>
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 14, color: "#111827" }}>Monthly Performance</div>
            <div style={{ display: "flex", gap: 8, alignItems: "flex-end", height: 120 }}>
              {cumulativeData.map((m, i) => {
                const barH = maxMonthly > 0 ? (Math.abs(m.pnl) / maxMonthly) * 100 : 0;
                return (
                  <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                    <div style={{ fontSize: 11, fontFamily: "monospace", fontWeight: 600, color: pnlColor(m.pnl) }}>{fmt(m.pnl)}</div>
                    <div style={{ width: "100%", maxWidth: 60, height: barH, background: m.pnl >= 0 ? `linear-gradient(180deg, ${green}, ${green}44)` : `linear-gradient(180deg, ${red}, ${red}44)`, borderRadius: "4px 4px 0 0" }} />
                    <div style={{ fontSize: 11, color: "#6b7280" }}>{m.label}</div>
                    <div style={{ fontSize: 10, color: "#9ca3af", fontFamily: "monospace" }}>&Sigma; {fmt(m.cumulative)}</div>
                  </div>
                );
              })}
            </div>
          </div>

          <div style={cardStyle}>
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 14, color: "#111827" }}>P&L by Ticker</div>
            {tickerData.map((t, i) => {
              const barW = maxPnl > 0 ? (Math.abs(t.pnl) / maxPnl) * 100 : 0;
              return (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                  <div style={{ width: 50, fontWeight: 700, fontSize: 13, textAlign: "right", color: "#111827" }}>{t.ticker}</div>
                  <div style={{ flex: 1, position: "relative", height: 22 }}>
                    <div style={{ position: "absolute", left: t.pnl >= 0 ? 0 : undefined, right: t.pnl < 0 ? 0 : undefined, width: `${barW}%`, height: "100%", borderRadius: 3, background: t.pnl >= 0 ? `${green}33` : `${red}33`, border: `1px solid ${t.pnl >= 0 ? green : red}` }} />
                  </div>
                  <div style={{ width: 90, textAlign: "right", fontFamily: "monospace", fontSize: 12, fontWeight: 600, color: pnlColor(t.pnl) }}>{fmt(t.pnl)}</div>
                  <div style={{ width: 60, textAlign: "right", fontSize: 11, color: "#6b7280" }}>{t.trades} trades</div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* -- TRADES TABLE -- */}
      {subTab === "trades" && (
        <div>
          <div style={{ display: "flex", gap: 10, marginBottom: 14, flexWrap: "wrap" }}>
            <select value={filterTicker} onChange={(e) => setFilterTicker(e.target.value)} style={{ background: "#ffffff", border: "1px solid #d1d5db", borderRadius: 8, padding: "7px 12px", color: "#111827", fontSize: 13 }}>
              {tickers.map((t) => <option key={t} value={t}>{t === "ALL" ? "All Tickers" : t}</option>)}
            </select>
            <select value={filterStrategy} onChange={(e) => setFilterStrategy(e.target.value)} style={{ background: "#ffffff", border: "1px solid #d1d5db", borderRadius: 8, padding: "7px 12px", color: "#111827", fontSize: 13 }}>
              {strategies.map((s) => <option key={s} value={s}>{s === "ALL" ? "All Strategies" : s}</option>)}
            </select>
            <div style={{ marginLeft: "auto", fontSize: 13, color: "#6b7280", alignSelf: "center" }}>
              {filteredTrades.length} trades &middot; Net: <span style={{ color: pnlColor(filteredTrades.reduce((a, t) => a + t.net_pnl, 0)), fontWeight: 700 }}>{fmt(filteredTrades.reduce((a, t) => a + t.net_pnl, 0))}</span>
            </div>
          </div>
          <div style={{ overflowX: "auto", borderRadius: 10, border: "1px solid #e5e7eb" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ background: "#f9fafb" }}>
                  {[{key:"close_date",label:"Close"},{key:"ticker",label:"Ticker"},{key:"option_type",label:"Type"},{key:"strike",label:"Strike"},{key:"expiry",label:"Expiry"},{key:"strategy",label:"Strategy"},{key:"contracts",label:"Qty"},{key:"open_premium",label:"Opened"},{key:"close_premium",label:"Closed"},{key:"net_pnl",label:"P&L"},{key:"close_type",label:"Exit"},{key:"account",label:"Acct"}].map((col) => (
                    <th key={col.key} onClick={() => handleSort(col.key)} style={{ padding: "8px 10px", textAlign: "left", color: "#6b7280", fontWeight: 600, fontSize: 11, textTransform: "uppercase", letterSpacing: 0.5, cursor: "pointer", borderBottom: "1px solid #e5e7eb", whiteSpace: "nowrap", background: sortCol === col.key ? "#f1f5f9" : undefined }}>{col.label} {sortCol === col.key ? (sortDir === 1 ? "\u25B2" : "\u25BC") : ""}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredTrades.map((t, i) => (
                  <tr key={i} style={{ background: i % 2 === 0 ? "#ffffff" : "#f9fafb" }}>
                    <td style={{ padding: "8px 10px", borderBottom: "1px solid #f1f5f9", fontSize: 12 }}>{t.close_date}</td>
                    <td style={{ padding: "8px 10px", borderBottom: "1px solid #f1f5f9", fontWeight: 700, color: "#111827" }}>{t.ticker}</td>
                    <td style={{ padding: "8px 10px", borderBottom: "1px solid #f1f5f9" }}><span style={{ padding: "2px 7px", borderRadius: 4, fontSize: 11, fontWeight: 600, background: t.option_type === "CALL" ? `${green}15` : `${red}15`, color: t.option_type === "CALL" ? green : red }}>{t.option_type}</span></td>
                    <td style={{ padding: "8px 10px", borderBottom: "1px solid #f1f5f9", fontFamily: "monospace" }}>${t.strike}</td>
                    <td style={{ padding: "8px 10px", borderBottom: "1px solid #f1f5f9", fontSize: 12, color: "#6b7280" }}>{t.expiry}</td>
                    <td style={{ padding: "8px 10px", borderBottom: "1px solid #f1f5f9", fontSize: 12 }}>{t.strategy}</td>
                    <td style={{ padding: "8px 10px", borderBottom: "1px solid #f1f5f9", textAlign: "center" }}>{t.contracts}</td>
                    <td style={{ padding: "8px 10px", borderBottom: "1px solid #f1f5f9", fontFamily: "monospace", fontSize: 12 }}>{fmt(t.open_premium)}</td>
                    <td style={{ padding: "8px 10px", borderBottom: "1px solid #f1f5f9", fontFamily: "monospace", fontSize: 12 }}>{fmt(t.close_premium)}</td>
                    <td style={{ padding: "8px 10px", borderBottom: "1px solid #f1f5f9", fontFamily: "monospace", fontWeight: 700, color: pnlColor(t.net_pnl) }}>{fmt(t.net_pnl)}</td>
                    <td style={{ padding: "8px 10px", borderBottom: "1px solid #f1f5f9", fontSize: 11, color: "#6b7280" }}>{t.close_type === "EXPIRED" ? "Expired" : t.close_type === "ASSIGNED" ? "Assigned" : t.close_type === "BUY_CLOSE" ? "Bought back" : t.close_type === "SELL_CLOSE" ? "Sold" : t.close_type}</td>
                    <td style={{ padding: "8px 10px", borderBottom: "1px solid #f1f5f9", fontSize: 11, color: "#6b7280" }}>{t.account === "ROTH IRA" ? "Roth" : "Ind"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* -- TICKERS -- */}
      {subTab === "tickers" && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 10 }}>
          {tickerData.map((t, i) => {
            const tickerTrades = data.completed_trades.filter((tr) => tr.ticker === t.ticker);
            const wins = tickerTrades.filter((tr) => tr.net_pnl > 0).length;
            return (
              <div key={i} style={{ ...cardStyle, borderLeft: `3px solid ${t.pnl >= 0 ? green : red}` }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
                  <span style={{ fontSize: 17, fontWeight: 800, color: "#111827" }}>{t.ticker}</span>
                  <span style={{ fontSize: 17, fontWeight: 700, fontFamily: "monospace", color: pnlColor(t.pnl) }}>{fmt(t.pnl)}</span>
                </div>
                <div style={{ display: "flex", gap: 14, fontSize: 12, color: "#6b7280" }}>
                  <span>{t.trades} trades</span>
                  <span>WR: {((wins / t.trades) * 100).toFixed(0)}%</span>
                  <span>Avg: {fmt(t.pnl / t.trades)}</span>
                </div>
                <div style={{ marginTop: 10, display: "flex", gap: 3, flexWrap: "wrap" }}>
                  {tickerTrades.map((tr, j) => (
                    <div key={j} style={{ width: 8, height: 8, borderRadius: 2, background: tr.net_pnl > 0 ? green : tr.net_pnl < 0 ? red : "#d1d5db", opacity: 0.8 }} title={`${tr.close_date}: ${fmt(tr.net_pnl)}`} />
                  ))}
                </div>
                <div style={{ marginTop: 10, fontSize: 11, color: "#6b7280" }}>
                  {tickerTrades.slice(-3).map((tr, j) => (
                    <div key={j} style={{ display: "flex", justifyContent: "space-between", padding: "2px 0" }}>
                      <span>{tr.close_date} &middot; {tr.strategy}</span>
                      <span style={{ color: pnlColor(tr.net_pnl), fontFamily: "monospace" }}>{fmt(tr.net_pnl)}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* -- MONTHLY -- */}
      {subTab === "monthly" && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 10 }}>
          {cumulativeData.map((m, i) => {
            const barH = maxMonthly > 0 ? (Math.abs(m.pnl) / maxMonthly) * 100 : 0;
            return (
              <div key={i} style={{ ...cardStyle, borderTop: `3px solid ${m.pnl >= 0 ? green : red}` }}>
                <div style={{ fontSize: 12, color: "#6b7280", fontWeight: 600, textTransform: "uppercase" }}>{m.label}</div>
                <div style={{ fontSize: 24, fontWeight: 700, fontFamily: "monospace", color: pnlColor(m.pnl), marginTop: 6 }}>{fmt(m.pnl)}</div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "#6b7280", marginTop: 8 }}>
                  <span>{m.trades} trades</span>
                  <span>&Sigma; {fmt(m.cumulative)}</span>
                </div>
                <div style={{ marginTop: 10, height: 6, background: "#f1f5f9", borderRadius: 3 }}>
                  <div style={{ height: "100%", width: `${barH}%`, borderRadius: 3, background: m.pnl >= 0 ? green : red }} />
                </div>
                <div style={{ marginTop: 10 }}>
                  {data.completed_trades.filter((t) => t.close_date && new Date(t.close_date).toISOString().slice(0, 7) === m.month).map((t, j) => (
                    <div key={j} style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#6b7280", padding: "2px 0" }}>
                      <span>{t.ticker} {t.option_type} ${t.strike}</span>
                      <span style={{ fontFamily: "monospace", color: pnlColor(t.net_pnl) }}>{fmt(t.net_pnl)}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* -- AI ANALYSIS -- */}
      {subTab === "analysis" && (
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <div style={{ fontSize: 13, color: "#6b7280" }}>AI-powered analysis of your trading patterns</div>
            <button onClick={loadAnalysis} disabled={analyzing} style={{ background: purple, color: "white", border: "none", borderRadius: 8, padding: "8px 16px", fontSize: 13, fontWeight: 600, cursor: "pointer", opacity: analyzing ? 0.5 : 1 }}>
              {analyzing ? "Analyzing..." : "Refresh Analysis"}
            </button>
          </div>

          {!analysis && !analyzing && <div style={{ color: "#6b7280", textAlign: "center", padding: 40 }}>Loading analysis...</div>}
          {analyzing && <div style={{ color: "#6b7280", textAlign: "center", padding: 40 }}>Analyzing your {s.total_trades} trades...</div>}

          {analysis && (
            <div>
              {/* Key Stats */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 10, marginBottom: 20 }}>
                {[
                  { label: "Risk/Reward", value: `${analysis.stats.risk_reward}x`, color: analysis.stats.risk_reward >= 1 ? green : red },
                  { label: "Profit Factor", value: `${analysis.stats.profit_factor}x`, color: analysis.stats.profit_factor >= 1.5 ? green : amber },
                  { label: "Avg Hold", value: `${analysis.stats.avg_hold_days}d`, color: blue },
                  { label: "Trades/Mo", value: `${analysis.stats.trades_per_month}`, color: purple },
                  { label: "Green Months", value: `${analysis.stats.green_months}/${analysis.stats.total_months}`, color: analysis.stats.green_months === analysis.stats.total_months ? green : amber },
                ].map((stat, i) => (
                  <div key={i} style={cardStyle}>
                    <div style={labelStyle}>{stat.label}</div>
                    <div style={{ fontSize: 22, fontWeight: 700, fontFamily: "monospace", color: stat.color }}>{stat.value}</div>
                  </div>
                ))}
              </div>

              {/* Strengths */}
              {analysis.insights.filter(i => i.type === "strength").length > 0 && (
                <div style={{ ...cardStyle, marginBottom: 12, borderLeft: `3px solid ${green}` }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: green, marginBottom: 10 }}>Strengths</div>
                  {analysis.insights.filter(i => i.type === "strength").map((item, i) => (
                    <div key={i} style={{ marginBottom: 10 }}>
                      <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 2, color: "#111827" }}>{item.title}</div>
                      <div style={{ fontSize: 12, color: "#6b7280", lineHeight: 1.5 }}>{item.text}</div>
                    </div>
                  ))}
                </div>
              )}

              {/* Warnings */}
              {analysis.warnings.length > 0 && (
                <div style={{ ...cardStyle, marginBottom: 12, borderLeft: `3px solid ${red}` }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: red, marginBottom: 10 }}>Warnings</div>
                  {analysis.warnings.map((item, i) => (
                    <div key={i} style={{ marginBottom: 10 }}>
                      <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 2, color: "#111827" }}>{item.title}</div>
                      <div style={{ fontSize: 12, color: "#6b7280", lineHeight: 1.5 }}>{item.text}</div>
                    </div>
                  ))}
                </div>
              )}

              {/* Recommendations */}
              {analysis.recommendations.length > 0 && (
                <div style={{ ...cardStyle, borderLeft: `3px solid ${blue}` }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: blue, marginBottom: 10 }}>Recommendations</div>
                  {analysis.recommendations.map((item, i) => (
                    <div key={i} style={{ marginBottom: 10 }}>
                      <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 2, color: "#111827" }}>{item.title}</div>
                      <div style={{ fontSize: 12, color: "#6b7280", lineHeight: 1.5 }}>{item.text}</div>
                    </div>
                  ))}
                </div>
              )}

              {/* Neutral Insights */}
              {analysis.insights.filter(i => i.type === "neutral").length > 0 && (
                <div style={{ ...cardStyle, marginTop: 12, borderLeft: "3px solid #9ca3af" }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#6b7280", marginBottom: 10 }}>Additional Insights</div>
                  {analysis.insights.filter(i => i.type === "neutral").map((item, i) => (
                    <div key={i} style={{ marginBottom: 10 }}>
                      <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 2, color: "#111827" }}>{item.title}</div>
                      <div style={{ fontSize: 12, color: "#6b7280", lineHeight: 1.5 }}>{item.text}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* -- LIVE POSITIONS -- */}
      {subTab === "live" && (
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <div style={{ fontSize: 13, color: "#6b7280" }}>Real-time prices for your open positions</div>
            <button onClick={loadLive} disabled={liveLoading} style={{ background: blue, color: "white", border: "none", borderRadius: 8, padding: "8px 16px", fontSize: 13, fontWeight: 600, cursor: "pointer", opacity: liveLoading ? 0.5 : 1 }}>
              {liveLoading ? "Loading..." : "Refresh Prices"}
            </button>
          </div>

          {liveLoading && <div style={{ color: "#6b7280", textAlign: "center", padding: 40 }}>Fetching live prices...</div>}

          {!liveData && !liveLoading && <div style={{ color: "#9ca3af", textAlign: "center", padding: 40 }}>Click Refresh to load live prices</div>}

          {liveData && (
            <div>
              {/* Total unrealized */}
              <div style={{ ...cardStyle, marginBottom: 16, textAlign: "center" }}>
                <div style={labelStyle}>Total Unrealized P&L (Intrinsic)</div>
                <div style={{ fontSize: 32, fontWeight: 800, fontFamily: "monospace", color: pnlColor(liveData.total_unrealized) }}>
                  {fmt(liveData.total_unrealized)}
                </div>
              </div>

              {/* Position cards */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 12 }}>
                {liveData.positions.map((p: any, i: number) => (
                  <div key={i} style={{ ...cardStyle, borderLeft: `3px solid ${p.itm ? green : red}` }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                      <div>
                        <span style={{ fontSize: 18, fontWeight: 800, marginRight: 8, color: "#111827" }}>{p.ticker}</span>
                        <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 4, fontWeight: 600, background: p.option_type === "CALL" ? `${green}15` : `${red}15`, color: p.option_type === "CALL" ? green : red }}>{p.option_type}</span>
                      </div>
                      <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 4, fontWeight: 600, background: p.itm ? `${green}15` : `${red}15`, color: p.itm ? green : red }}>{p.itm ? "ITM" : "OTM"}</span>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, fontSize: 12, marginBottom: 12 }}>
                      <div>
                        <div style={{ color: "#6b7280", fontSize: 11 }}>Strike</div>
                        <div style={{ fontFamily: "monospace", fontWeight: 600, color: "#111827" }}>${p.strike}</div>
                      </div>
                      <div>
                        <div style={{ color: "#6b7280", fontSize: 11 }}>Stock Price</div>
                        <div style={{ fontFamily: "monospace", fontWeight: 600, color: "#111827" }}>
                          ${p.stock_price?.toFixed(2) || "\u2014"}
                          {p.stock_change_pct ? <span style={{ marginLeft: 6, fontSize: 11, color: pnlColor(p.stock_change_pct) }}>{p.stock_change_pct >= 0 ? "+" : ""}{p.stock_change_pct?.toFixed(2)}%</span> : null}
                        </div>
                      </div>
                      <div>
                        <div style={{ color: "#6b7280", fontSize: 11 }}>Expiry</div>
                        <div style={{ fontWeight: 600, color: "#111827" }}>{p.expiry}</div>
                      </div>
                      <div>
                        <div style={{ color: "#6b7280", fontSize: 11 }}>Contracts</div>
                        <div style={{ fontWeight: 600, color: "#111827" }}>{p.contracts}</div>
                      </div>
                      <div>
                        <div style={{ color: "#6b7280", fontSize: 11 }}>Cost Basis</div>
                        <div style={{ fontFamily: "monospace", fontWeight: 600, color: red }}>${p.cost_basis?.toFixed(2)}</div>
                      </div>
                      <div>
                        <div style={{ color: "#6b7280", fontSize: 11 }}>Intrinsic Value</div>
                        <div style={{ fontFamily: "monospace", fontWeight: 600, color: p.intrinsic_value > 0 ? green : "#9ca3af" }}>${p.intrinsic_value?.toFixed(2)}</div>
                      </div>
                    </div>

                    <div style={{ borderTop: "1px solid #e5e7eb", paddingTop: 10, display: "flex", justifyContent: "space-between" }}>
                      <span style={{ color: "#6b7280", fontSize: 12 }}>Unrealized P&L</span>
                      <span style={{ fontFamily: "monospace", fontWeight: 800, fontSize: 16, color: pnlColor(p.unrealized_pnl) }}>{fmt(p.unrealized_pnl)}</span>
                    </div>
                  </div>
                ))}
              </div>

              {liveData.positions.length === 0 && <div style={{ ...cardStyle, textAlign: "center", color: "#6b7280" }}>No open positions to track</div>}
            </div>
          )}
        </div>
      )}

      {/* -- IMPORT -- */}
      {subTab === "import" && (
        <div>
          <div style={{
            ...cardStyle,
            border: dragOver ? `2px dashed ${green}` : "2px dashed #cbd5e1",
            textAlign: "center",
            padding: 40,
            cursor: "pointer",
            transition: "all 0.2s",
            background: dragOver ? `${green}08` : "#ffffff",
          }}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={onDrop}
            onClick={() => { const input = document.createElement("input"); input.type = "file"; input.accept = ".csv"; input.onchange = (e: any) => { if (e.target.files[0]) handleUpload(e.target.files[0]); }; input.click(); }}
          >
            <div style={{ fontSize: 40, marginBottom: 12 }}>&#128193;</div>
            <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 6, color: "#111827" }}>
              {uploading ? "Uploading..." : "Drop Fidelity CSV here or click to browse"}
            </div>
            <div style={{ fontSize: 12, color: "#6b7280" }}>
              Supports Activity_Orders_History.csv exports from Fidelity
            </div>
            <div style={{ fontSize: 12, color: "#6b7280", marginTop: 4 }}>
              New trades are automatically merged &mdash; duplicates are skipped
            </div>
          </div>

          {uploadMsg && (
            <div style={{ ...cardStyle, marginTop: 12, borderLeft: `3px solid ${uploadMsg.startsWith("Error") ? red : green}` }}>
              <div style={{ fontSize: 13, color: uploadMsg.startsWith("Error") ? red : green }}>{uploadMsg}</div>
            </div>
          )}

          <div style={{ ...cardStyle, marginTop: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 10, color: "#111827" }}>How to export from Fidelity</div>
            <div style={{ fontSize: 12, color: "#6b7280", lineHeight: 1.8 }}>
              1. Log into Fidelity.com<br />
              2. Go to Accounts &rarr; Activity & Orders<br />
              3. Select your date range<br />
              4. Click the download icon (CSV)<br />
              5. Drop the file here
            </div>
          </div>

          <div style={{ ...cardStyle, marginTop: 12 }}>
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 6, color: "#111827" }}>Current Data</div>
            <div style={{ fontSize: 12, color: "#6b7280" }}>
              {s.total_trades} closed trades &middot; {data.open_positions.length} open positions &middot; {Object.keys(data.monthly_pnl).length} months of data
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
