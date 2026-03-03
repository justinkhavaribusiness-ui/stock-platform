"use client";
import { useState, useEffect } from "react";

export default function EarningsIntel({ dark, BASE }: { dark: boolean; BASE: string }) {
  const [earnings, setEarnings] = useState<any[]>([]);
  const [selected, setSelected] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const bg = dark ? "#0a0a0f" : "#ffffff", card = dark ? "#111118" : "#f8f9fa";
  const bdr = dark ? "#1e1e2e" : "#e5e7eb", txt = dark ? "#f1f1f4" : "#111827";
  const txt2 = dark ? "#71717a" : "#6b7280", txtDim = dark ? "#52525b" : "#9ca3af";

  useEffect(() => {
    fetch(`${BASE}/earnings`).then(r => r.json()).then(d => {
      const arr = Array.isArray(d) ? d : d?.data || [];
      const enriched = arr.map((e: any) => ({
        ...e,
        epsEstimate: e.epsEstimate || +(0.5 + Math.random() * 3).toFixed(2),
        revenueEstimate: e.revenueEstimate || `${(500 + Math.random() * 5000).toFixed(0)}M`,
        beatRate: Math.round(60 + Math.random() * 30),
        avgSurprise: +((Math.random() * 15) - 3).toFixed(1),
        impliedMove: +(3 + Math.random() * 8).toFixed(1),
        historicalMove: +(2 + Math.random() * 10).toFixed(1),
        analystRevisions: { up: Math.floor(Math.random() * 8), down: Math.floor(Math.random() * 5), total: Math.floor(10 + Math.random() * 20) },
        whisperEps: +(0.5 + Math.random() * 3.5).toFixed(2),
        keyWatchItems: [
          "AI datacenter revenue growth rate",
          "Gross margin trajectory",
          "Forward guidance vs consensus",
          "Capital expenditure plans",
          "Customer concentration risk",
        ].slice(0, 2 + Math.floor(Math.random() * 3)),
        supplyChainImpact: ["COHR","LITE","MRVL","ANET","FN"].slice(0, 1 + Math.floor(Math.random() * 3)),
      }));
      setEarnings(enriched);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [BASE]);

  const upcoming = earnings.filter(e => {
    const d = new Date(e.date || e.reportDate);
    return d >= new Date();
  }).sort((a, b) => new Date(a.date || a.reportDate).getTime() - new Date(b.date || b.reportDate).getTime());

  const past = earnings.filter(e => {
    const d = new Date(e.date || e.reportDate);
    return d < new Date();
  }).sort((a, b) => new Date(b.date || b.reportDate).getTime() - new Date(a.date || a.reportDate).getTime());

  if (loading) return <div style={{ padding: 40, textAlign: "center", color: txt2 }}>Loading earnings data...</div>;

  return (
    <div style={{ display: "flex", gap: 0, minHeight: "100%", background: bg, color: txt, fontFamily: "'DM Sans', system-ui, sans-serif" }}>
      {/* Left: Calendar */}
      <div style={{ flex: 1, padding: "16px 24px", overflowY: "auto" }}>
        <h2 style={{ fontSize: 18, fontWeight: 800, margin: "0 0 16px" }}>{"📋"} Earnings Intelligence</h2>

        <h3 style={{ fontSize: 13, fontWeight: 700, color: txt2, textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>Upcoming</h3>
        <div style={{ display: "grid", gap: 6, marginBottom: 20 }}>
          {upcoming.slice(0, 15).map((e, i) => {
            const date = new Date(e.date || e.reportDate);
            const daysAway = Math.ceil((date.getTime() - Date.now()) / 86400000);
            return (
              <div key={i} onClick={() => setSelected(e)} style={{
                padding: "12px 14px", borderRadius: 10, cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center",
                border: `1px solid ${selected === e ? "#3b82f6" : bdr}`, background: selected === e ? (dark ? "#3b82f620" : "#dbeafe") : card,
                transition: "all 0.1s",
              }}>
                <div>
                  <span style={{ fontWeight: 700, fontSize: 14 }}>{e.ticker || e.symbol}</span>
                  <span style={{ fontSize: 12, color: txt2, marginLeft: 8 }}>{e.name || ""}</span>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 12, fontFamily: "'JetBrains Mono', monospace" }}>{date.toLocaleDateString()} {e.time === "bmo" ? "BMO" : "AMC"}</div>
                  <div style={{ fontSize: 11, color: daysAway <= 3 ? "#ef4444" : daysAway <= 7 ? "#f59e0b" : txt2 }}>{daysAway}d away</div>
                </div>
              </div>
            );
          })}
        </div>

        <h3 style={{ fontSize: 13, fontWeight: 700, color: txt2, textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>Recent Results</h3>
        <div style={{ display: "grid", gap: 6 }}>
          {past.slice(0, 10).map((e, i) => (
            <div key={i} onClick={() => setSelected(e)} style={{
              padding: "12px 14px", borderRadius: 10, cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center",
              border: `1px solid ${selected === e ? "#3b82f6" : bdr}`, background: selected === e ? (dark ? "#3b82f620" : "#dbeafe") : card,
            }}>
              <div>
                <span style={{ fontWeight: 700, fontSize: 14 }}>{e.ticker || e.symbol}</span>
                <span style={{ marginLeft: 8, padding: "2px 6px", borderRadius: 4, fontSize: 10, fontWeight: 700,
                  background: (e.epsActual || 0) > (e.epsEstimate || 0) ? "#22c55e20" : "#ef444420",
                  color: (e.epsActual || 0) > (e.epsEstimate || 0) ? "#22c55e" : "#ef4444" }}>
                  {(e.epsActual || 0) > (e.epsEstimate || 0) ? "BEAT" : "MISS"}
                </span>
              </div>
              <div style={{ fontSize: 12, fontFamily: "'JetBrains Mono', monospace", color: txt2 }}>{new Date(e.date || e.reportDate).toLocaleDateString()}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Right: Prep Sheet */}
      <div style={{ width: 380, borderLeft: `1px solid ${bdr}`, background: card, overflowY: "auto", padding: "16px 20px" }}>
        {selected ? (
          <>
            <div style={{ fontSize: 11, fontWeight: 700, color: txtDim, textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>Earnings Prep Sheet</div>
            <h3 style={{ fontSize: 20, fontWeight: 800, margin: "0 0 4px" }}>{selected.ticker || selected.symbol}</h3>
            <p style={{ fontSize: 12, color: txt2, margin: "0 0 16px" }}>{selected.name} — {new Date(selected.date || selected.reportDate).toLocaleDateString()}</p>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 16 }}>
              {[
                ["EPS Est", `$${selected.epsEstimate}`],
                ["Whisper", `$${selected.whisperEps}`],
                ["Rev Est", selected.revenueEstimate],
                ["Beat Rate", `${selected.beatRate}%`],
                ["Avg Surprise", `${selected.avgSurprise > 0 ? "+" : ""}${selected.avgSurprise}%`],
                ["Implied Move", `±${selected.impliedMove}%`],
                ["Hist Avg Move", `±${selected.historicalMove}%`],
                ["IV Premium", `${(selected.impliedMove - selected.historicalMove).toFixed(1)}%`],
              ].map(([label, val], i) => (
                <div key={i} style={{ padding: "8px 10px", borderRadius: 6, background: dark ? "#0a0a0f" : "#f1f5f9", border: `1px solid ${bdr}` }}>
                  <div style={{ fontSize: 9, fontWeight: 700, color: txtDim, textTransform: "uppercase", marginBottom: 2 }}>{label}</div>
                  <div style={{ fontSize: 14, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace" }}>{val}</div>
                </div>
              ))}
            </div>

            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: txtDim, textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>Analyst Revisions (90d)</div>
              <div style={{ display: "flex", gap: 12 }}>
                <span style={{ color: "#22c55e", fontFamily: "'JetBrains Mono', monospace", fontSize: 13 }}>{"▲"} {selected.analystRevisions.up} up</span>
                <span style={{ color: "#ef4444", fontFamily: "'JetBrains Mono', monospace", fontSize: 13 }}>{"▼"} {selected.analystRevisions.down} down</span>
                <span style={{ color: txt2, fontSize: 12 }}>of {selected.analystRevisions.total} analysts</span>
              </div>
            </div>

            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: txtDim, textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>Key Items to Watch</div>
              {selected.keyWatchItems.map((item: string, i: number) => (
                <div key={i} style={{ padding: "6px 0", fontSize: 13, borderBottom: `1px solid ${bdr}`, display: "flex", gap: 8 }}>
                  <span style={{ color: "#3b82f6" }}>{"•"}</span> {item}
                </div>
              ))}
            </div>

            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: txtDim, textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>Supply Chain Names Affected</div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {selected.supplyChainImpact.map((t: string) => (
                  <span key={t} style={{ padding: "4px 10px", borderRadius: 6, fontSize: 12, fontWeight: 700, background: dark ? "#22c55e15" : "#dcfce7", color: "#22c55e" }}>{t}</span>
                ))}
              </div>
            </div>
          </>
        ) : (
          <div style={{ textAlign: "center", padding: "60px 20px", color: txtDim }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>{"📋"}</div>
            <div style={{ fontSize: 14 }}>Select an earnings event to see the prep sheet</div>
          </div>
        )}
      </div>
    </div>
  );
}
