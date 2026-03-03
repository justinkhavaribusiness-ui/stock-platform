"use client";
import { useState, useEffect } from "react";

export default function OptionsFlow({ dark, BASE }: { dark: boolean; BASE: string }) {
  const [flows, setFlows] = useState<any[]>([]);
  const [filter, setFilter] = useState<"all"|"calls"|"puts"|"sweeps"|"large">("all");
  const [loading, setLoading] = useState(true);
  const [watchTickers] = useState(["COHR","NVDA","OSCR","SOFI","FANG","LITE","AMZN","TSLA","MRVL","ANET","AMD","AAPL","META","SPY","QQQ"]);
  const [ivData, setIvData] = useState<Record<string, any>>({});

  const bg = dark ? "#0a0a0f" : "#ffffff", card = dark ? "#111118" : "#f8f9fa";
  const bdr = dark ? "#1e1e2e" : "#e5e7eb", txt = dark ? "#f1f1f4" : "#111827";
  const txt2 = dark ? "#71717a" : "#6b7280", txtDim = dark ? "#52525b" : "#9ca3af";

  useEffect(() => {
    // Generate realistic flow data from watchlist
    const types = ["Call", "Put"];
    const sentiments = ["Bullish", "Bearish", "Neutral"];
    const execs = ["Sweep", "Block", "Single", "Multi-leg", "Split"];
    const generated: any[] = [];
    const now = Date.now();

    for (let i = 0; i < 50; i++) {
      const ticker = watchTickers[Math.floor(Math.random() * watchTickers.length)];
      const type = types[Math.floor(Math.random() * types.length)];
      const strike = Math.round((80 + Math.random() * 200) * 100) / 100;
      const premium = Math.round((10000 + Math.random() * 500000));
      const volume = Math.round(50 + Math.random() * 2000);
      const oi = Math.round(100 + Math.random() * 10000);
      const exec = execs[Math.floor(Math.random() * execs.length)];
      const sentiment = premium > 200000 ? (type === "Call" ? "Bullish" : "Bearish") : sentiments[Math.floor(Math.random() * sentiments.length)];
      const daysExp = Math.floor(7 + Math.random() * 90);
      const iv = Math.round((20 + Math.random() * 60) * 10) / 10;
      const ivRank = Math.round(Math.random() * 100);
      const time = new Date(now - Math.random() * 3600000 * 4);

      generated.push({ id: i, ticker, type, strike, premium, volume, oi, exec, sentiment, daysExp, iv, ivRank, time,
        volOiRatio: +(volume / Math.max(oi, 1)).toFixed(2),
        unusual: volume > oi * 0.5 || premium > 200000,
      });
    }
    generated.sort((a, b) => b.premium - a.premium);
    setFlows(generated);

    // IV data per ticker
    const ivMap: Record<string, any> = {};
    watchTickers.forEach(t => {
      ivMap[t] = { iv: +(20 + Math.random() * 50).toFixed(1), ivRank: Math.round(Math.random() * 100), ivPercentile: Math.round(Math.random() * 100), putCallRatio: +(0.5 + Math.random() * 1.5).toFixed(2) };
    });
    setIvData(ivMap);
    setLoading(false);
  }, []);

  const filtered = flows.filter(f => {
    if (filter === "calls") return f.type === "Call";
    if (filter === "puts") return f.type === "Put";
    if (filter === "sweeps") return f.exec === "Sweep";
    if (filter === "large") return f.premium > 100000;
    return true;
  });

  const totalPrem = filtered.reduce((s, f) => s + f.premium, 0);
  const callPrem = filtered.filter(f => f.type === "Call").reduce((s, f) => s + f.premium, 0);
  const putPrem = filtered.filter(f => f.type === "Put").reduce((s, f) => s + f.premium, 0);

  if (loading) return <div style={{ padding: 40, textAlign: "center", color: txt2 }}>Loading flow data...</div>;

  return (
    <div style={{ padding: "16px 24px", background: bg, color: txt, fontFamily: "'DM Sans', system-ui, sans-serif", minHeight: "100%" }}>
      <h2 style={{ fontSize: 18, fontWeight: 800, margin: "0 0 16px" }}>{"🌊"} Options Flow Scanner</h2>

      {/* Summary cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 8, marginBottom: 16 }}>
        {[
          ["Total Premium", `$${(totalPrem/1e6).toFixed(2)}M`, txt],
          ["Call Premium", `$${(callPrem/1e6).toFixed(2)}M`, "#22c55e"],
          ["Put Premium", `$${(putPrem/1e6).toFixed(2)}M`, "#ef4444"],
          ["Call/Put Ratio", `${(callPrem/Math.max(putPrem,1)).toFixed(2)}`, callPrem > putPrem ? "#22c55e" : "#ef4444"],
          ["Unusual Alerts", `${flows.filter(f => f.unusual).length}`, "#f59e0b"],
        ].map(([label, val, color], i) => (
          <div key={i} style={{ background: card, border: `1px solid ${bdr}`, borderRadius: 10, padding: "12px 14px" }}>
            <div style={{ fontSize: 10, fontWeight: 600, color: txtDim, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 4 }}>{label}</div>
            <div style={{ fontSize: 18, fontWeight: 800, fontFamily: "'JetBrains Mono', monospace", color: color as string }}>{val}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: 4, marginBottom: 12 }}>
        {(["all","calls","puts","sweeps","large"] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{
            padding: "6px 14px", borderRadius: 20, fontSize: 12, fontWeight: filter === f ? 700 : 500, cursor: "pointer",
            border: "none", background: filter === f ? (dark ? "#3b82f620" : "#dbeafe") : "transparent", color: filter === f ? "#3b82f6" : txt2,
          }}>{f === "all" ? "All" : f === "calls" ? "Calls Only" : f === "puts" ? "Puts Only" : f === "sweeps" ? "Sweeps" : "$100K+"}</button>
        ))}
      </div>

      {/* IV Rank Bar */}
      <div style={{ background: card, border: `1px solid ${bdr}`, borderRadius: 10, padding: "10px 14px", marginBottom: 12, display: "flex", gap: 12, overflowX: "auto" }}>
        {Object.entries(ivData).slice(0, 10).map(([t, d]) => (
          <div key={t} style={{ minWidth: 70, textAlign: "center" }}>
            <div style={{ fontWeight: 700, fontSize: 12 }}>{t}</div>
            <div style={{ fontSize: 11, fontFamily: "'JetBrains Mono', monospace", color: d.ivRank > 70 ? "#ef4444" : d.ivRank > 40 ? "#f59e0b" : "#22c55e" }}>IV {d.ivRank}</div>
          </div>
        ))}
      </div>

      {/* Flow table */}
      <div style={{ background: card, border: `1px solid ${bdr}`, borderRadius: 10, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
          <thead><tr style={{ borderBottom: `1px solid ${bdr}` }}>
            {["Time", "Ticker", "C/P", "Strike", "Exp", "Premium", "Vol", "OI", "Vol/OI", "IV", "Exec", "Sentiment"].map(h => (
              <th key={h} style={{ padding: "8px 10px", textAlign: "left", fontSize: 10, fontWeight: 700, color: txtDim, textTransform: "uppercase" }}>{h}</th>
            ))}
          </tr></thead>
          <tbody>
            {filtered.slice(0, 30).map(f => (
              <tr key={f.id} style={{ borderBottom: `1px solid ${bdr}`, background: f.unusual ? (dark ? "#f59e0b08" : "#fffbeb") : "transparent" }}>
                <td style={{ padding: "8px 10px", color: txt2, fontFamily: "'JetBrains Mono', monospace" }}>{f.time.toLocaleTimeString([], {hour:"2-digit",minute:"2-digit"})}</td>
                <td style={{ padding: "8px 10px", fontWeight: 700 }}>{f.ticker}</td>
                <td style={{ padding: "8px 10px" }}><span style={{ padding: "2px 6px", borderRadius: 4, fontSize: 10, fontWeight: 700, background: f.type==="Call" ? "#22c55e20" : "#ef444420", color: f.type==="Call" ? "#22c55e" : "#ef4444" }}>{f.type}</span></td>
                <td style={{ padding: "8px 10px", fontFamily: "'JetBrains Mono', monospace" }}>${f.strike}</td>
                <td style={{ padding: "8px 10px", fontFamily: "'JetBrains Mono', monospace", color: txt2 }}>{f.daysExp}d</td>
                <td style={{ padding: "8px 10px", fontFamily: "'JetBrains Mono', monospace", fontWeight: f.premium > 100000 ? 700 : 400 }}>${(f.premium/1000).toFixed(1)}K</td>
                <td style={{ padding: "8px 10px", fontFamily: "'JetBrains Mono', monospace" }}>{f.volume.toLocaleString()}</td>
                <td style={{ padding: "8px 10px", fontFamily: "'JetBrains Mono', monospace", color: txt2 }}>{f.oi.toLocaleString()}</td>
                <td style={{ padding: "8px 10px", fontFamily: "'JetBrains Mono', monospace", color: f.volOiRatio > 0.5 ? "#f59e0b" : txt2 }}>{f.volOiRatio}x</td>
                <td style={{ padding: "8px 10px", fontFamily: "'JetBrains Mono', monospace" }}>{f.iv}%</td>
                <td style={{ padding: "8px 10px" }}><span style={{ fontSize: 10, color: f.exec==="Sweep" ? "#f59e0b" : txt2 }}>{f.exec}</span></td>
                <td style={{ padding: "8px 10px" }}><span style={{ padding: "2px 6px", borderRadius: 4, fontSize: 10, fontWeight: 600, background: f.sentiment==="Bullish" ? "#22c55e15" : f.sentiment==="Bearish" ? "#ef444415" : (dark?"#ffffff10":"#00000008"), color: f.sentiment==="Bullish" ? "#22c55e" : f.sentiment==="Bearish" ? "#ef4444" : txt2 }}>{f.sentiment}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
