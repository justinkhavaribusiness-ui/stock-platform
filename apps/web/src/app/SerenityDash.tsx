"use client";
import { useState, useEffect, useCallback } from "react";
import { getTheme, cardStyle, labelStyle } from "./theme";

interface SerenityDashProps { dark: boolean; BASE: string; }

const SERENITY_POSITIONS = [
  { ticker: "NBIS", name: "Nebius Group", bucket: "Core NeoCloud", pt: "$400", timeframe: "1Y" },
  { ticker: "RKLB", name: "Rocket Lab", bucket: "Core NeoCloud", pt: "$500", timeframe: "5Y" },
  { ticker: "CRCL", name: "Circle (SPAC)", bucket: "Core NeoCloud", pt: "$150", timeframe: "8M" },
  { ticker: "ALAB", name: "Astera Labs", bucket: "Core NeoCloud", pt: "$250", timeframe: "6M" },
  { ticker: "CRWV", name: "CoreWeave", bucket: "Mag7 Contracts" },
  { ticker: "WULF", name: "TeraWulf", bucket: "Mag7 Contracts" },
  { ticker: "CIFR", name: "Cipher Mining", bucket: "Mag7 Contracts" },
  { ticker: "IREN", name: "Iren (Iris Energy)", bucket: "Compute" },
  { ticker: "BITF", name: "Bitfarms", bucket: "Compute" },
  { ticker: "HIMS", name: "Hims & Hers", bucket: "Swing Trade" },
  { ticker: "SNAP", name: "Snap Inc", bucket: "Swing Trade" },
  { ticker: "SMCI", name: "Super Micro", bucket: "Swing Trade" },
  { ticker: "GLXY", name: "Galaxy Digital", bucket: "Swing Trade" },
  { ticker: "XLU", name: "Utilities Select ETF", bucket: "Macro Thesis" },
];

const BUCKETS = ["Core NeoCloud", "Mag7 Contracts", "Compute", "Swing Trade", "Macro Thesis"];
const BUCKET_COLORS: Record<string, { color: string; bg: string }> = {
  "Core NeoCloud": { color: "#8b5cf6", bg: "#8b5cf622" },
  "Mag7 Contracts": { color: "#38bdf8", bg: "#38bdf822" },
  "Compute": { color: "#f59e0b", bg: "#f59e0b22" },
  "Swing Trade": { color: "#ec4899", bg: "#ec489922" },
  "Macro Thesis": { color: "#22c55e", bg: "#22c55e22" },
};

export default function SerenityDash({ dark, BASE }: SerenityDashProps) {
  const t = getTheme(dark);
  const [prices, setPrices] = useState<Record<string, any>>({});
  const [signals, setSignals] = useState<any[]>([]);
  const [portfolio, setPortfolio] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [aiAnalysis, setAiAnalysis] = useState<any>(null);
  const [analyzing, setAnalyzing] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const tickers = SERENITY_POSITIONS.map(p => p.ticker).join(",");
      const [priceRes, sigRes, portRes] = await Promise.all([
        fetch(`${BASE}/quotes?tickers=${tickers}`).then(r => r.json()),
        fetch(`${BASE}/signals?source=aleabitoreddit&limit=20`).then(r => r.json()).catch(() => ({ signals: [] })),
        fetch(`${BASE}/portfolio/fidelity-positions`).then(r => r.json()).catch(() => ({ positions: [] })),
      ]);
      const priceMap: Record<string, any> = {};
      (priceRes.data || []).forEach((q: any) => { priceMap[q.ticker] = q; });
      setPrices(priceMap);
      setSignals(sigRes.signals || sigRes.data || []);
      setPortfolio(portRes.positions || []);
    } catch {} finally { setLoading(false); }
  }, [BASE]);

  useEffect(() => { load(); }, [load]);

  const runAI = async () => {
    setAnalyzing(true);
    try {
      const context = SERENITY_POSITIONS.map(p => {
        const q = prices[p.ticker];
        const price = q?.price ? `$${q.price}` : "N/A";
        const upside = q?.price && p.pt ? `${(((parseFloat(p.pt.replace("$", "")) - q.price) / q.price) * 100).toFixed(0)}%` : "N/A";
        return `${p.ticker} (${p.name}) — ${p.bucket} | Price: ${price} | PT: ${p.pt || "N/A"} | Upside: ${upside}`;
      }).join("\n");

      const r = await fetch(`${BASE}/ai/deep-dive`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ticker: "SERENITY_PORTFOLIO" }),
      });
      // Use the query endpoint instead for portfolio-level analysis
      const r2 = await fetch(`${BASE}/api/chat`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: `Analyze Serenity's NeoCloud portfolio. Which picks overlap with my Fidelity holdings? Which should I be paying attention to? Here are his positions:\n${context}`,
          context: "serenity_analysis"
        }),
      });
      const d = await r2.json();
      setAiAnalysis(d.response || d.content || d.message || JSON.stringify(d));
    } catch (e) {
      setAiAnalysis("AI analysis unavailable");
    } finally { setAnalyzing(false); }
  };

  // Calculate overlap
  const myTickers = new Set(portfolio.map((p: any) => p.symbol));
  const overlap = SERENITY_POSITIONS.filter(p => myTickers.has(p.ticker));
  const notOwned = SERENITY_POSITIONS.filter(p => !myTickers.has(p.ticker));

  return (
    <div style={{ fontFamily: t.fontBody, color: t.text }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 2 }}>Serenity (@aleabitoreddit) — NeoCloud Thesis</h2>
          <div style={{ fontSize: 12, color: t.textMuted }}>Track Serenity's picks with live prices, upside to PT, and portfolio overlap</div>
        </div>
        <button style={{ padding: "8px 16px", background: "#8b5cf6", color: "#fff", border: "none", borderRadius: t.radiusSm, fontSize: 12, fontWeight: 600, cursor: "pointer", opacity: analyzing ? 0.5 : 1 }} onClick={runAI} disabled={analyzing}>
          {analyzing ? "Analyzing..." : "AI Analysis"}
        </button>
      </div>

      {/* Portfolio Overlap Alert */}
      {overlap.length > 0 && (
        <div style={{ ...cardStyle(t), padding: 14, borderLeft: "3px solid #8b5cf6", marginBottom: 16, background: dark ? "#1a1028" : "#f5f3ff" }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#8b5cf6", textTransform: "uppercase", marginBottom: 6 }}>You own {overlap.length} of Serenity's picks</div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {overlap.map(p => {
              const q = prices[p.ticker];
              return (
                <span key={p.ticker} style={{ fontSize: 12, fontFamily: t.fontMono, padding: "4px 10px", borderRadius: 6, background: dark ? "#2d1f4e" : "#ede9fe", color: "#8b5cf6", fontWeight: 600 }}>
                  {p.ticker} {q?.price ? `$${q.price.toFixed(2)}` : ""} {p.pt ? `→ PT ${p.pt}` : ""}
                </span>
              );
            })}
          </div>
        </div>
      )}

      {/* Bucket Breakdown */}
      <div style={{ display: "flex", gap: 12, marginBottom: 16, flexWrap: "wrap" }}>
        {BUCKETS.map(bucket => {
          const positions = SERENITY_POSITIONS.filter(p => p.bucket === bucket);
          const bc = BUCKET_COLORS[bucket] || { color: t.textMuted, bg: t.bgAlt };
          return (
            <div key={bucket} style={{ ...cardStyle(t), padding: 14, flex: 1, minWidth: 200, borderTop: `3px solid ${bc.color}` }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: bc.color, textTransform: "uppercase", marginBottom: 8 }}>{bucket}</div>
              {positions.map(p => {
                const q = prices[p.ticker];
                const upside = q?.price && p.pt ? ((parseFloat(p.pt.replace("$", "")) - q.price) / q.price * 100) : null;
                const owned = myTickers.has(p.ticker);
                return (
                  <div key={p.ticker} style={{ display: "flex", alignItems: "center", gap: 6, padding: "4px 0", borderBottom: `1px solid ${t.borderLight}`, fontSize: 12 }}>
                    {owned && <span style={{ fontSize: 8, color: "#8b5cf6" }}>●</span>}
                    <span style={{ fontWeight: 700, fontFamily: t.fontMono, minWidth: 45 }}>{p.ticker}</span>
                    <span style={{ color: t.textMuted, flex: 1, fontSize: 11 }}>{p.name}</span>
                    {q?.price && <span style={{ fontFamily: t.fontMono, color: (q.change_pct || 0) >= 0 ? t.green : t.red }}>${q.price.toFixed(2)}</span>}
                    {q?.change_pct != null && <span style={{ fontFamily: t.fontMono, fontSize: 10, color: q.change_pct >= 0 ? t.green : t.red }}>{q.change_pct >= 0 ? "+" : ""}{q.change_pct.toFixed(1)}%</span>}
                    {upside != null && <span style={{ fontFamily: t.fontMono, fontSize: 10, fontWeight: 600, color: upside > 0 ? t.green : t.red, minWidth: 45, textAlign: "right" }}>{upside > 0 ? "+" : ""}{upside.toFixed(0)}%</span>}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>

      {/* Full watchlist table */}
      <div style={{ ...cardStyle(t), padding: 0, overflow: "auto", marginBottom: 16 }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
          <thead>
            <tr style={{ background: t.bgAlt }}>
              {["", "Ticker", "Name", "Bucket", "Price", "Change", "PT", "Upside", "TF", "You Own"].map(h => (
                <th key={h} style={{ padding: "8px 10px", textAlign: h === "Ticker" || h === "Name" ? "left" : "right", fontWeight: 600, color: t.textSecondary, fontSize: 10, textTransform: "uppercase", borderBottom: `1px solid ${t.border}` }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {SERENITY_POSITIONS.map((p, i) => {
              const q = prices[p.ticker];
              const upside = q?.price && p.pt ? ((parseFloat(p.pt.replace("$", "")) - q.price) / q.price * 100) : null;
              const owned = myTickers.has(p.ticker);
              const bc = BUCKET_COLORS[p.bucket] || { color: t.textMuted, bg: t.bgAlt };
              return (
                <tr key={i} style={{ borderBottom: `1px solid ${t.borderLight}`, background: owned ? (dark ? "#1a1028" : "#f5f3ff") : "transparent" }}>
                  <td style={{ padding: "6px 10px", textAlign: "center", fontSize: 10 }}>{i + 1}</td>
                  <td style={{ padding: "6px 10px", fontWeight: 700, fontFamily: t.fontMono }}>{p.ticker}</td>
                  <td style={{ padding: "6px 10px", color: t.textSecondary }}>{p.name}</td>
                  <td style={{ padding: "6px 10px", textAlign: "right" }}><span style={{ fontSize: 9, fontWeight: 600, padding: "2px 6px", borderRadius: 3, background: bc.bg, color: bc.color }}>{p.bucket}</span></td>
                  <td style={{ padding: "6px 10px", textAlign: "right", fontFamily: t.fontMono }}>{q?.price ? `$${q.price.toFixed(2)}` : "—"}</td>
                  <td style={{ padding: "6px 10px", textAlign: "right", fontFamily: t.fontMono, color: (q?.change_pct || 0) >= 0 ? t.green : t.red }}>{q?.change_pct != null ? `${q.change_pct >= 0 ? "+" : ""}${q.change_pct.toFixed(1)}%` : "—"}</td>
                  <td style={{ padding: "6px 10px", textAlign: "right", fontFamily: t.fontMono, color: t.accent, fontWeight: 600 }}>{p.pt || "—"}</td>
                  <td style={{ padding: "6px 10px", textAlign: "right", fontFamily: t.fontMono, fontWeight: 600, color: upside != null ? (upside > 0 ? t.green : t.red) : t.textMuted }}>{upside != null ? `${upside > 0 ? "+" : ""}${upside.toFixed(0)}%` : "—"}</td>
                  <td style={{ padding: "6px 10px", textAlign: "right", fontSize: 10, color: t.textMuted }}>{p.timeframe || "—"}</td>
                  <td style={{ padding: "6px 10px", textAlign: "center" }}>{owned ? <span style={{ color: "#8b5cf6", fontWeight: 700 }}>YES</span> : <span style={{ color: t.textMuted }}>—</span>}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Not owned — potential adds */}
      {notOwned.length > 0 && (
        <div style={{ ...cardStyle(t), padding: 14, borderLeft: `3px solid ${t.yellow}` }}>
          <div style={{ ...labelStyle(t), color: t.yellow, marginBottom: 8 }}>SERENITY PICKS YOU DON'T OWN ({notOwned.length})</div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {notOwned.map(p => {
              const q = prices[p.ticker];
              const upside = q?.price && p.pt ? ((parseFloat(p.pt.replace("$", "")) - q.price) / q.price * 100) : null;
              return (
                <span key={p.ticker} style={{ fontSize: 11, padding: "4px 10px", borderRadius: 6, background: t.bgAlt, border: `1px solid ${t.border}`, fontFamily: t.fontMono }}>
                  {p.ticker} {q?.price ? `$${q.price.toFixed(0)}` : ""} {upside != null && upside > 0 ? <span style={{ color: t.green, fontWeight: 600 }}>+{upside.toFixed(0)}%</span> : ""}
                </span>
              );
            })}
          </div>
        </div>
      )}

      {/* AI Analysis */}
      {aiAnalysis && (
        <div style={{ ...cardStyle(t), padding: 16, marginTop: 16, borderLeft: "3px solid #8b5cf6" }}>
          <div style={{ ...labelStyle(t), color: "#8b5cf6", marginBottom: 8 }}>AI ANALYSIS — SERENITY vs YOUR PORTFOLIO</div>
          <div style={{ fontSize: 13, color: t.textSecondary, whiteSpace: "pre-wrap", lineHeight: 1.7 }}>{typeof aiAnalysis === "string" ? aiAnalysis : JSON.stringify(aiAnalysis)}</div>
        </div>
      )}

      {/* Recent signals */}
      {signals.length > 0 && (
        <div style={{ marginTop: 16 }}>
          <div style={{ ...labelStyle(t), marginBottom: 8 }}>RECENT SERENITY SIGNALS</div>
          {signals.slice(0, 5).map((sig: any, i: number) => (
            <div key={i} style={{ ...cardStyle(t), padding: 12 }}>
              <div style={{ fontSize: 13, color: t.textSecondary }}>{sig.raw_text || sig.thesis || sig.text || JSON.stringify(sig)}</div>
              <div style={{ fontSize: 10, color: t.textMuted, marginTop: 4 }}>{sig.timestamp ? new Date(sig.timestamp).toLocaleString() : ""}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
