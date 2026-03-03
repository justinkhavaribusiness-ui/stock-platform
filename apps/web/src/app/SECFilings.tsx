"use client";
import { useState, useEffect } from "react";

export default function SECFilings({ dark, BASE }: { dark: boolean; BASE: string }) {
  const [filings, setFilings] = useState<any[]>([]);
  const [filter, setFilter] = useState<"all"|"insider"|"13f"|"8k">("all");
  const [selected, setSelected] = useState<any>(null);

  const bg = dark ? "#0a0a0f" : "#ffffff", card = dark ? "#111118" : "#f8f9fa";
  const bdr = dark ? "#1e1e2e" : "#e5e7eb", txt = dark ? "#f1f1f4" : "#111827";
  const txt2 = dark ? "#71717a" : "#6b7280", txtDim = dark ? "#52525b" : "#9ca3af";

  useEffect(() => {
    const tickers = ["COHR","NVDA","OSCR","SOFI","FANG","LITE","AMZN","MRVL","ANET","AMD","AAPL","META","TSLA"];
    const types = ["Form 4 (Insider)", "13F-HR", "8-K", "10-Q", "SC 13G", "DEF 14A"];
    const insiderTypes = ["Purchase", "Sale", "Option Exercise", "Gift"];
    const generated: any[] = [];
    const now = Date.now();

    for (let i = 0; i < 40; i++) {
      const ticker = tickers[Math.floor(Math.random() * tickers.length)];
      const type = types[Math.floor(Math.random() * types.length)];
      const date = new Date(now - Math.random() * 86400000 * 30);
      const isInsider = type.includes("Form 4");
      const is13F = type.includes("13F");

      generated.push({
        id: i, ticker, type, date,
        filer: isInsider ? ["CEO", "CFO", "CTO", "Director", "VP Engineering", "VP Sales"][Math.floor(Math.random() * 6)] :
               is13F ? ["Vanguard", "BlackRock", "ARK Invest", "Bridgewater", "Citadel", "Renaissance Tech", "Tiger Global"][Math.floor(Math.random() * 7)] :
               ticker,
        action: isInsider ? insiderTypes[Math.floor(Math.random() * insiderTypes.length)] : null,
        shares: isInsider ? Math.round(1000 + Math.random() * 50000) : is13F ? Math.round(100000 + Math.random() * 5000000) : null,
        value: Math.round(50000 + Math.random() * 5000000),
        priceAtFiling: +(80 + Math.random() * 200).toFixed(2),
        signal: isInsider ? (Math.random() > 0.4 ? "Bullish" : "Bearish") : is13F ? (Math.random() > 0.3 ? "Increased" : "Decreased") : "Neutral",
        summary: isInsider ? `${["CEO","CFO","CTO","Director"][Math.floor(Math.random()*4)]} ${Math.random()>0.4?"purchased":"sold"} shares worth $${(Math.random()*2+0.1).toFixed(1)}M` :
                 is13F ? `${["Increased","Decreased","Initiated","Maintained"][Math.floor(Math.random()*4)]} position by ${Math.round(Math.random()*30+5)}%` :
                 `Material event filing related to ${["acquisition","restructuring","leadership change","debt offering","guidance update"][Math.floor(Math.random()*5)]}`,
      });
    }
    generated.sort((a, b) => b.date.getTime() - a.date.getTime());
    setFilings(generated);
  }, []);

  const filtered = filings.filter(f => {
    if (filter === "insider") return f.type.includes("Form 4");
    if (filter === "13f") return f.type.includes("13F");
    if (filter === "8k") return f.type.includes("8-K");
    return true;
  });

  return (
    <div style={{ display: "flex", gap: 0, minHeight: "100%", background: bg, color: txt, fontFamily: "'DM Sans', system-ui, sans-serif" }}>
      <div style={{ flex: 1, padding: "16px 24px", overflowY: "auto" }}>
        <h2 style={{ fontSize: 18, fontWeight: 800, margin: "0 0 16px" }}>{"📑"} SEC Filings & Insider Activity</h2>
        <div style={{ display: "flex", gap: 4, marginBottom: 12 }}>
          {(["all","insider","13f","8k"] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)} style={{
              padding: "6px 14px", borderRadius: 20, fontSize: 12, fontWeight: filter === f ? 700 : 500, cursor: "pointer",
              border: "none", background: filter === f ? (dark ? "#3b82f620" : "#dbeafe") : "transparent", color: filter === f ? "#3b82f6" : txt2,
            }}>{f === "all" ? "All Filings" : f === "insider" ? "Insider (Form 4)" : f === "13f" ? "Institutions (13F)" : "8-K Events"}</button>
          ))}
        </div>

        <div style={{ background: card, border: `1px solid ${bdr}`, borderRadius: 10, overflow: "hidden" }}>
          {filtered.slice(0, 25).map(f => (
            <div key={f.id} onClick={() => setSelected(f)} style={{
              padding: "12px 14px", borderBottom: `1px solid ${bdr}`, cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center",
              background: selected?.id === f.id ? (dark ? "#3b82f620" : "#dbeafe") : "transparent",
            }}
              onMouseEnter={e => { if (selected?.id !== f.id) e.currentTarget.style.background = dark ? "#ffffff05" : "#f9fafb"; }}
              onMouseLeave={e => { if (selected?.id !== f.id) e.currentTarget.style.background = "transparent"; }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ padding: "2px 6px", borderRadius: 4, fontSize: 10, fontWeight: 700,
                  background: f.type.includes("Form 4") ? "#f59e0b20" : f.type.includes("13F") ? "#3b82f620" : "#8b5cf620",
                  color: f.type.includes("Form 4") ? "#f59e0b" : f.type.includes("13F") ? "#3b82f6" : "#8b5cf6" }}>{f.type.split(" ")[0]}</span>
                <span style={{ fontWeight: 700, fontSize: 13 }}>{f.ticker}</span>
                <span style={{ fontSize: 12, color: txt2 }}>{f.filer}</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                {f.signal !== "Neutral" && (
                  <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 6px", borderRadius: 4,
                    background: f.signal === "Bullish" || f.signal === "Increased" ? "#22c55e15" : "#ef444415",
                    color: f.signal === "Bullish" || f.signal === "Increased" ? "#22c55e" : "#ef4444" }}>{f.signal}</span>
                )}
                <span style={{ fontSize: 12, fontFamily: "'JetBrains Mono', monospace", color: txt2 }}>{f.date.toLocaleDateString()}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Detail panel */}
      <div style={{ width: 340, borderLeft: `1px solid ${bdr}`, background: card, padding: "16px 20px", overflowY: "auto" }}>
        {selected ? (
          <>
            <div style={{ fontSize: 11, fontWeight: 700, color: txtDim, textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>Filing Detail</div>
            <h3 style={{ fontSize: 18, fontWeight: 800, margin: "0 0 4px" }}>{selected.ticker} — {selected.type}</h3>
            <p style={{ fontSize: 12, color: txt2, margin: "0 0 16px" }}>{selected.filer} · {selected.date.toLocaleDateString()}</p>
            <div style={{ padding: "10px 12px", borderRadius: 8, background: dark ? "#0a0a0f" : "#f1f5f9", border: `1px solid ${bdr}`, marginBottom: 12, fontSize: 13, lineHeight: 1.6 }}>
              {selected.summary}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              {selected.shares && <div style={{ padding: "8px 10px", borderRadius: 6, background: dark ? "#0a0a0f" : "#f1f5f9" }}>
                <div style={{ fontSize: 9, fontWeight: 700, color: txtDim, textTransform: "uppercase" }}>Shares</div>
                <div style={{ fontSize: 14, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace" }}>{selected.shares.toLocaleString()}</div>
              </div>}
              <div style={{ padding: "8px 10px", borderRadius: 6, background: dark ? "#0a0a0f" : "#f1f5f9" }}>
                <div style={{ fontSize: 9, fontWeight: 700, color: txtDim, textTransform: "uppercase" }}>Value</div>
                <div style={{ fontSize: 14, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace" }}>${(selected.value/1000).toFixed(0)}K</div>
              </div>
              <div style={{ padding: "8px 10px", borderRadius: 6, background: dark ? "#0a0a0f" : "#f1f5f9" }}>
                <div style={{ fontSize: 9, fontWeight: 700, color: txtDim, textTransform: "uppercase" }}>Price at Filing</div>
                <div style={{ fontSize: 14, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace" }}>${selected.priceAtFiling}</div>
              </div>
            </div>
          </>
        ) : (
          <div style={{ textAlign: "center", padding: "60px 20px", color: txtDim }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>{"📑"}</div>
            <div style={{ fontSize: 14 }}>Select a filing to see details</div>
          </div>
        )}
      </div>
    </div>
  );
}
