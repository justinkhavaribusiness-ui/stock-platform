"use client";
import { useState, useEffect, useCallback } from "react";
import { getTheme, cardStyle, labelStyle } from "./theme";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";

interface CCIncomeProps { dark: boolean; BASE: string; }

export default function CCIncome({ dark, BASE }: CCIncomeProps) {
  const t = getTheme(dark);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try { const r = await fetch(`${BASE}/cc-income`); setData(await r.json()); } catch {} finally { setLoading(false); }
  }, [BASE]);

  useEffect(() => { load(); }, [load]);

  if (loading) return <div style={{ color: t.textMuted, padding: 40, textAlign: "center" }}>Loading CC income data...</div>;
  if (!data) return <div style={{ color: t.red, padding: 40 }}>Failed to load</div>;

  const s = data.summary || {};
  const weekly = data.weekly || [];
  const byTicker = data.by_ticker || [];

  return (
    <div style={{ fontFamily: t.fontBody, color: t.text }}>
      <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>Weekly CC Income Dashboard</h2>
      <div style={{ fontSize: 12, color: t.textMuted, marginBottom: 16 }}>Covered call premium tracking — your wheel income visualized</div>

      {/* Summary */}
      <div style={{ display: "flex", gap: 12, marginBottom: 16, flexWrap: "wrap" }}>
        {[
          { label: "Net CC Income", val: `$${s.net_income?.toFixed(0) || 0}`, color: s.net_income > 0 ? t.green : t.red },
          { label: "Avg Weekly", val: `$${s.avg_weekly?.toFixed(0) || 0}`, color: t.accent },
          { label: "Annualized", val: `$${s.annualized?.toFixed(0) || 0}`, color: t.green },
          { label: "Win Rate", val: `${s.total_cc_trades || 0} trades`, color: t.text },
        ].map(({ label, val, color }) => (
          <div key={label} style={{ ...cardStyle(t), padding: 14, flex: 1, minWidth: 130, textAlign: "center" }}>
            <div style={labelStyle(t)}>{label}</div>
            <div style={{ fontSize: 24, fontWeight: 700, fontFamily: t.fontMono, color, marginTop: 6 }}>{val}</div>
          </div>
        ))}
      </div>

      {/* Open premium */}
      {s.open_premium > 0 && (
        <div style={{ ...cardStyle(t), padding: 12, marginBottom: 16, background: t.blueBg, border: `1px solid ${t.accent}40` }}>
          <span style={{ fontSize: 12, color: t.accent, fontWeight: 600 }}>Open CC Premium (unrealized): </span>
          <span style={{ fontSize: 14, fontFamily: t.fontMono, fontWeight: 700, color: t.accent }}>${s.open_premium.toFixed(2)}</span>
        </div>
      )}

      {/* Weekly chart */}
      {weekly.length > 0 && (
        <div style={{ ...cardStyle(t), padding: 16, marginBottom: 16 }}>
          <div style={labelStyle(t)}>WEEKLY PREMIUM COLLECTED</div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={weekly} margin={{ top: 10, right: 10, bottom: 0, left: 0 }}>
              <XAxis dataKey="label" style={{ fontSize: 10 }} />
              <YAxis style={{ fontSize: 10 }} tickFormatter={(v: number) => `$${v}`} />
              <Tooltip formatter={(v: number) => `$${v.toFixed(2)}`} />
              <Bar dataKey="premium">
                {weekly.map((w: any, i: number) => (
                  <Cell key={i} fill={w.premium >= 0 ? t.green : t.red} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* By ticker */}
      {byTicker.length > 0 && (
        <div style={{ ...cardStyle(t), padding: 0, overflow: "auto" }}>
          <div style={{ ...labelStyle(t), padding: "12px 12px 0" }}>PREMIUM BY TICKER</div>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ background: t.bgAlt }}>
                {["Ticker", "Net Premium", "Trades", "Wins", "Losses", "Win Rate"].map(h => (
                  <th key={h} style={{ padding: "8px 10px", textAlign: "right", fontWeight: 600, color: t.textSecondary, fontSize: 11, textTransform: "uppercase", borderBottom: `1px solid ${t.border}` }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {byTicker.map((row: any, i: number) => (
                <tr key={i} style={{ borderBottom: `1px solid ${t.borderLight}` }}>
                  <td style={{ padding: "8px 10px", textAlign: "left", fontWeight: 600, fontFamily: t.fontMono }}>{row.ticker}</td>
                  <td style={{ padding: "8px 10px", textAlign: "right", fontFamily: t.fontMono, color: row.premium >= 0 ? t.green : t.red, fontWeight: 600 }}>
                    {row.premium >= 0 ? "+" : ""}${row.premium.toFixed(0)}
                  </td>
                  <td style={{ padding: "8px 10px", textAlign: "right", fontFamily: t.fontMono }}>{row.trades}</td>
                  <td style={{ padding: "8px 10px", textAlign: "right", fontFamily: t.fontMono, color: t.green }}>{row.wins}</td>
                  <td style={{ padding: "8px 10px", textAlign: "right", fontFamily: t.fontMono, color: t.red }}>{row.losses}</td>
                  <td style={{ padding: "8px 10px", textAlign: "right", fontFamily: t.fontMono }}>{row.win_rate}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
