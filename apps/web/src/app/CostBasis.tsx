"use client";
import { useState, useEffect, useCallback } from "react";
import { getTheme, cardStyle, labelStyle, type Theme } from "./theme";

interface CostBasisProps { dark: boolean; BASE: string; }

export default function CostBasis({ dark, BASE }: CostBasisProps) {
  const t = getTheme(dark);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const r = await fetch(`${BASE}/options-journal/cost-basis`);
      setData(await r.json());
    } catch {} finally { setLoading(false); }
  }, [BASE]);

  useEffect(() => { load(); }, [load]);

  if (loading) return <div style={{ color: t.textMuted, padding: 40, textAlign: "center" }}>Calculating true cost basis...</div>;
  if (!data) return <div style={{ color: t.red, padding: 40 }}>Failed to load cost basis data</div>;

  const positions = data.positions || [];

  return (
    <div style={{ fontFamily: t.fontBody, color: t.text }}>
      <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>True Cost Basis Calculator</h2>
      <div style={{ fontSize: 12, color: t.textMuted, marginBottom: 16 }}>
        Adjusts Fidelity cost basis by netting covered call premium collected
      </div>

      {/* Summary */}
      <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
        <div style={{ ...cardStyle(t), padding: 16, flex: 1, minWidth: 180, textAlign: "center" }}>
          <div style={labelStyle(t)}>Total CC Premium Collected</div>
          <div style={{ fontSize: 28, fontWeight: 700, fontFamily: t.fontMono, color: t.green, marginTop: 6 }}>
            +${data.total_premium?.toFixed(2)}
          </div>
        </div>
        <div style={{ ...cardStyle(t), padding: 16, flex: 1, minWidth: 180, textAlign: "center" }}>
          <div style={labelStyle(t)}>Total P&L Adjustment</div>
          <div style={{ fontSize: 28, fontWeight: 700, fontFamily: t.fontMono, color: data.total_adjustment >= 0 ? t.green : t.red, marginTop: 6 }}>
            {data.total_adjustment >= 0 ? "+" : ""}${data.total_adjustment?.toFixed(2)}
          </div>
          <div style={{ fontSize: 11, color: t.textMuted, marginTop: 2 }}>vs Fidelity&apos;s reported P&L</div>
        </div>
      </div>

      {/* Table */}
      <div style={{ ...cardStyle(t), padding: 0, overflow: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ background: t.bgAlt }}>
              {["Ticker", "Shares", "Fidelity Avg", "Premium", "True Cost", "Mkt Value", "Raw P&L", "Adj P&L", "Difference", "Break-even"].map(h => (
                <th key={h} style={{ padding: "10px 10px", textAlign: "right", fontWeight: 600, color: t.textSecondary, fontSize: 11, textTransform: "uppercase", borderBottom: "1px solid " + t.border, whiteSpace: "nowrap" }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {positions.map((p: any, i: number) => {
              const hasPremium = p.premium_collected > 0;
              return (
                <tr key={i} style={{ borderBottom: "1px solid " + t.borderLight, background: hasPremium ? t.greenBg + "33" : "transparent" }}>
                  <td style={{ padding: "8px 10px", textAlign: "left", fontWeight: 600, fontFamily: t.fontMono }}>{p.ticker}</td>
                  <td style={{ padding: "8px 10px", textAlign: "right", fontFamily: t.fontMono, color: t.textSecondary }}>{p.shares}</td>
                  <td style={{ padding: "8px 10px", textAlign: "right", fontFamily: t.fontMono }}>${p.fidelity_avg_cost?.toFixed(2)}</td>
                  <td style={{ padding: "8px 10px", textAlign: "right", fontFamily: t.fontMono, color: hasPremium ? t.green : t.textMuted, fontWeight: hasPremium ? 600 : 400 }}>
                    {hasPremium ? `+$${p.premium_collected.toFixed(0)}` : "—"}
                  </td>
                  <td style={{ padding: "8px 10px", textAlign: "right", fontFamily: t.fontMono, fontWeight: 600 }}>${p.true_cost_per_share?.toFixed(2)}</td>
                  <td style={{ padding: "8px 10px", textAlign: "right", fontFamily: t.fontMono }}>${p.market_value?.toFixed(0)}</td>
                  <td style={{ padding: "8px 10px", textAlign: "right", fontFamily: t.fontMono, color: p.raw_pnl >= 0 ? t.green : t.red }}>
                    {p.raw_pnl >= 0 ? "+" : ""}${p.raw_pnl?.toFixed(0)}
                  </td>
                  <td style={{ padding: "8px 10px", textAlign: "right", fontFamily: t.fontMono, color: p.adjusted_pnl >= 0 ? t.green : t.red, fontWeight: 600 }}>
                    {p.adjusted_pnl >= 0 ? "+" : ""}${p.adjusted_pnl?.toFixed(0)}
                  </td>
                  <td style={{ padding: "8px 10px", textAlign: "right", fontFamily: t.fontMono, color: p.pnl_difference > 0 ? t.green : t.textMuted }}>
                    {p.pnl_difference > 0 ? `+$${p.pnl_difference.toFixed(0)}` : "—"}
                  </td>
                  <td style={{ padding: "8px 10px", textAlign: "right", fontFamily: t.fontMono, color: t.blue }}>${p.breakeven_price?.toFixed(2)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
