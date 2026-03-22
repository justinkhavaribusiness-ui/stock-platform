"use client";
import { useState, useEffect, useCallback } from "react";
import { getTheme, cardStyle, labelStyle } from "./theme";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";

interface SectorExposureProps { dark: boolean; BASE: string; }

const COLORS = ["#2563eb", "#0d9f4f", "#d97706", "#dc2626", "#8b5cf6", "#06b6d4", "#f59e0b", "#ec4899", "#6b7280"];

export default function SectorExposure({ dark, BASE }: SectorExposureProps) {
  const t = getTheme(dark);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try { const r = await fetch(`${BASE}/sector-exposure`); setData(await r.json()); } catch {} finally { setLoading(false); }
  }, [BASE]);

  useEffect(() => { load(); }, [load]);

  if (loading) return <div style={{ color: t.textMuted, padding: 40, textAlign: "center" }}>Analyzing sector exposure...</div>;
  if (!data?.groups?.length) return <div style={{ color: t.textMuted, padding: 40 }}>No position data available</div>;

  const groups = data.groups || [];
  const warnings = data.warnings || [];
  const pieData = groups.map((g: any) => ({ name: g.name, value: g.value }));

  return (
    <div style={{ fontFamily: t.fontBody, color: t.text }}>
      <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>Thesis Exposure Heatmap</h2>
      <div style={{ fontSize: 12, color: t.textMuted, marginBottom: 16 }}>Real concentration risk by investment thesis, not just sector</div>

      {/* Warnings */}
      {warnings.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          {warnings.map((w: any, i: number) => (
            <div key={i} style={{ ...cardStyle(t), padding: 12, marginBottom: 6, borderLeft: `3px solid ${w.severity === "high" ? t.red : t.yellow}` }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: w.severity === "high" ? t.red : t.yellow }}>{w.message}</span>
            </div>
          ))}
        </div>
      )}

      {/* Pie chart */}
      <div style={{ ...cardStyle(t), padding: 16, marginBottom: 16 }}>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={110} label={({ name, percent }: any) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={true} fontSize={11}>
              {pieData.map((_: any, i: number) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
            </Pie>
            <Tooltip formatter={(v: number) => `$${v.toLocaleString()}`} />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Group breakdown */}
      {groups.map((g: any, gi: number) => (
        <div key={gi} style={{ ...cardStyle(t), padding: 14, marginBottom: 8, borderLeft: `3px solid ${COLORS[gi % COLORS.length]}` }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <span style={{ fontSize: 14, fontWeight: 700 }}>{g.name}</span>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 16, fontWeight: 700, fontFamily: t.fontMono }}>{g.pct}%</span>
              <span style={{ fontSize: 12, fontFamily: t.fontMono, color: t.textMuted }}>${g.value.toLocaleString()}</span>
            </div>
          </div>
          <div style={{ height: 6, background: t.bgAlt, borderRadius: 3, overflow: "hidden", marginBottom: 8 }}>
            <div style={{ width: `${g.pct}%`, height: "100%", background: COLORS[gi % COLORS.length], borderRadius: 3 }} />
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {g.tickers.map((tk: any, ti: number) => (
              <span key={ti} style={{ fontSize: 11, fontFamily: t.fontMono, padding: "2px 8px", borderRadius: 4, background: t.bgAlt, color: t.text }}>
                {tk.ticker} <span style={{ color: t.textMuted }}>{tk.pct}%</span>
              </span>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
