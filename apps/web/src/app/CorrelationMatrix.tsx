"use client";
import { useState, useEffect, useCallback } from "react";
import { getTheme, cardStyle, labelStyle } from "./theme";

interface CorrelationMatrixProps { dark: boolean; BASE: string; }

export default function CorrelationMatrix({ dark, BASE }: CorrelationMatrixProps) {
  const t = getTheme(dark);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try { const r = await fetch(`${BASE}/portfolio/correlations`); setData(await r.json()); } catch {} finally { setLoading(false); }
  }, [BASE]);

  useEffect(() => { load(); }, [load]);

  if (loading) return <div style={{ color: t.textMuted, padding: 40, textAlign: "center" }}>Calculating correlations (this may take 30s)...</div>;
  if (!data?.matrix?.length) return <div style={{ color: t.textMuted, padding: 40 }}>Not enough positions for correlation analysis</div>;

  const tickers = data.tickers || [];
  const matrix = data.matrix || [];
  const clusters = data.clusters || [];

  const corrColor = (val: number) => {
    if (val >= 0.7) return dark ? "#3fb950" : "#0d9f4f";
    if (val >= 0.4) return dark ? "#58a6ff" : "#2563eb";
    if (val >= -0.2) return t.textMuted;
    if (val >= -0.5) return dark ? "#d29922" : "#d97706";
    return dark ? "#f85149" : "#dc2626";
  };

  const corrBg = (val: number) => {
    const abs = Math.abs(val);
    if (abs > 0.7) return val > 0 ? (dark ? "rgba(63,185,80,0.15)" : "rgba(13,159,79,0.1)") : (dark ? "rgba(248,81,73,0.15)" : "rgba(220,38,38,0.1)");
    return "transparent";
  };

  return (
    <div style={{ fontFamily: t.fontBody, color: t.text }}>
      <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>Portfolio Correlation Matrix</h2>
      <div style={{ fontSize: 12, color: t.textMuted, marginBottom: 16 }}>3-month return correlations between your holdings</div>

      {clusters.length > 0 && (
        <div style={{ ...cardStyle(t), padding: 16, marginBottom: 16, borderLeft: `3px solid ${t.yellow}` }}>
          <div style={{ ...labelStyle(t), color: t.yellow, marginBottom: 8 }}>CORRELATED CLUSTERS ({">"}0.7)</div>
          {clusters.map((c: string[], i: number) => (
            <div key={i} style={{ fontSize: 13, marginBottom: 4 }}>
              <span style={{ fontWeight: 600, color: t.yellow }}>Cluster {i + 1}:</span>{" "}
              {c.map((tk, j) => <span key={j} style={{ fontFamily: t.fontMono, fontWeight: 600 }}>{j > 0 ? ", " : ""}{tk}</span>)}
              <span style={{ color: t.textMuted, fontSize: 11 }}> — these move together, reducing your real diversification</span>
            </div>
          ))}
        </div>
      )}

      <div style={{ ...cardStyle(t), padding: 0, overflow: "auto" }}>
        <table style={{ borderCollapse: "collapse", fontSize: 11 }}>
          <thead>
            <tr>
              <th style={{ padding: "6px 8px", background: t.bgAlt, borderBottom: `1px solid ${t.border}`, position: "sticky", left: 0, zIndex: 1 }} />
              {tickers.map((tk: string) => (
                <th key={tk} style={{ padding: "6px 4px", background: t.bgAlt, borderBottom: `1px solid ${t.border}`, fontFamily: t.fontMono, fontWeight: 600, color: t.textSecondary, fontSize: 10, writingMode: "vertical-lr", textAlign: "left", height: 60 }}>{tk}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {tickers.map((tk1: string, i: number) => (
              <tr key={tk1}>
                <td style={{ padding: "4px 8px", fontFamily: t.fontMono, fontWeight: 600, fontSize: 10, position: "sticky", left: 0, background: t.bgCard, borderRight: `1px solid ${t.border}` }}>{tk1}</td>
                {tickers.map((tk2: string, j: number) => {
                  const val = matrix[i]?.[j] ?? 0;
                  return (
                    <td key={j} style={{ padding: "4px", textAlign: "center", fontFamily: t.fontMono, fontSize: 10, fontWeight: Math.abs(val) > 0.5 ? 700 : 400, color: i === j ? t.textMuted : corrColor(val), background: i === j ? t.bgAlt : corrBg(val), border: `1px solid ${t.borderLight}`, minWidth: 36 }}>
                      {i === j ? "1.0" : val.toFixed(2)}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ fontSize: 11, color: t.textMuted, marginTop: 12 }}>
        <span style={{ color: dark ? "#3fb950" : "#0d9f4f" }}>Green ({">"}0.7)</span> = move together |
        <span style={{ color: dark ? "#f85149" : "#dc2626" }}> Red ({"<"}-0.5)</span> = move opposite |
        <span style={{ color: t.textMuted }}> Gray</span> = low correlation
      </div>
    </div>
  );
}
