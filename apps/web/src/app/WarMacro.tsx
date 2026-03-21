"use client";
import { useState, useEffect, useCallback } from "react";
import { getTheme, cardStyle, labelStyle, type Theme } from "./theme";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from "recharts";

interface WarMacroProps { dark: boolean; BASE: string; }

export default function WarMacro({ dark, BASE }: WarMacroProps) {
  const t = getTheme(dark);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const r = await fetch(`${BASE}/macro/war-dashboard`);
      const d = await r.json();
      setData(d);
    } catch {} finally { setLoading(false); }
  }, [BASE]);

  useEffect(() => { load(); const iv = setInterval(load, 60000); return () => clearInterval(iv); }, [load]);

  if (loading) return <div style={{ color: t.textMuted, padding: 40, textAlign: "center" }}>Loading war/macro dashboard...</div>;
  if (!data) return <div style={{ color: t.red, padding: 40 }}>Failed to load macro data</div>;

  const PriceCard = ({ label, data: q, unit = "$" }: { label: string; data: any; unit?: string }) => (
    <div style={{ ...cardStyle(t), padding: 16, flex: 1, minWidth: 160 }}>
      <div style={labelStyle(t)}>{label}</div>
      <div style={{ fontSize: 28, fontWeight: 700, color: t.text, fontFamily: t.fontMono, marginTop: 6 }}>
        {unit}{q?.price?.toFixed(2) || "—"}
      </div>
      <div style={{ fontSize: 13, color: (q?.change_pct || 0) >= 0 ? t.green : t.red, fontFamily: t.fontMono, marginTop: 2 }}>
        {(q?.change_pct || 0) >= 0 ? "+" : ""}{q?.change_pct?.toFixed(2) || 0}% today
      </div>
      {q?.week_change_pct !== undefined && (
        <div style={{ fontSize: 11, color: t.textMuted, marginTop: 2 }}>
          {q.week_change_pct >= 0 ? "+" : ""}{q.week_change_pct.toFixed(1)}% 5d
        </div>
      )}
    </div>
  );

  const vix = data.vix || {};
  const fg = data.fear_greed || {};
  const tres = data.treasuries || {};
  const sectors = data.sectors || {};
  const impact = data.war_impact || [];

  const sectorData = Object.entries(sectors).map(([name, q]: any) => ({
    name, pct: q?.change_pct || 0,
  })).sort((a: any, b: any) => b.pct - a.pct);

  const fgColor = fg.score < 20 ? t.red : fg.score < 40 ? t.orange : fg.score < 60 ? t.yellow : fg.score < 80 ? t.green : t.green;

  return (
    <div style={{ fontFamily: t.fontBody, color: t.text }}>
      <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>War / Macro Command Center</h2>
      <div style={{ fontSize: 12, color: t.textMuted, marginBottom: 20 }}>
        Updated {data.updated_at ? new Date(data.updated_at).toLocaleTimeString() : "—"} | Auto-refresh 60s
      </div>

      {/* Oil & Energy */}
      <div style={labelStyle(t)}>OIL & ENERGY</div>
      <div style={{ display: "flex", gap: 12, marginTop: 8, marginBottom: 16, flexWrap: "wrap" }}>
        <PriceCard label="Brent Crude" data={data.oil?.brent} />
        <PriceCard label="WTI Crude" data={data.oil?.wti} />
        <PriceCard label="Natural Gas" data={data.oil?.natgas} />
        <PriceCard label="Gold" data={data.gold} />
      </div>

      {/* VIX & Fear */}
      <div style={{ display: "flex", gap: 12, marginBottom: 16, flexWrap: "wrap" }}>
        <div style={{ ...cardStyle(t), padding: 16, flex: 1, minWidth: 200 }}>
          <div style={labelStyle(t)}>VIX — VOLATILITY INDEX</div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 12, marginTop: 6 }}>
            <span style={{ fontSize: 36, fontWeight: 700, fontFamily: t.fontMono, color: vix.current > 25 ? t.red : vix.current > 18 ? t.yellow : t.green }}>
              {vix.current?.toFixed(1) || "—"}
            </span>
            <span style={{ fontSize: 14, fontWeight: 600, color: vix.current > 25 ? t.red : t.yellow }}>
              {vix.level || ""}
            </span>
          </div>
          <div style={{ fontSize: 12, color: t.textMuted, marginTop: 4 }}>
            Percentile: {vix.percentile}% | Range: {vix.year_low}–{vix.year_high}
          </div>
          <div style={{ marginTop: 8, height: 6, background: t.bgAlt, borderRadius: 3, overflow: "hidden" }}>
            <div style={{ width: `${vix.percentile || 0}%`, height: "100%", background: vix.current > 25 ? t.red : t.yellow, borderRadius: 3 }} />
          </div>
        </div>

        <div style={{ ...cardStyle(t), padding: 16, flex: 1, minWidth: 200 }}>
          <div style={labelStyle(t)}>FEAR & GREED INDEX</div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 12, marginTop: 6 }}>
            <span style={{ fontSize: 36, fontWeight: 700, fontFamily: t.fontMono, color: fgColor }}>
              {fg.score ?? "—"}
            </span>
            <span style={{ fontSize: 14, fontWeight: 600, color: fgColor }}>
              {fg.label || ""}
            </span>
          </div>
          <div style={{ marginTop: 8, height: 6, background: t.bgAlt, borderRadius: 3, overflow: "hidden" }}>
            <div style={{ width: `${fg.score || 0}%`, height: "100%", background: fgColor, borderRadius: 3 }} />
          </div>
        </div>
      </div>

      {/* Treasuries & DXY */}
      <div style={labelStyle(t)}>TREASURIES & DOLLAR</div>
      <div style={{ display: "flex", gap: 12, marginTop: 8, marginBottom: 16, flexWrap: "wrap" }}>
        <PriceCard label="10Y Yield" data={tres["10y"]} unit="" />
        <PriceCard label="30Y Yield" data={tres["30y"]} unit="" />
        <PriceCard label="3M Yield" data={tres["3m"]} unit="" />
        <div style={{ ...cardStyle(t), padding: 16, flex: 1, minWidth: 160 }}>
          <div style={labelStyle(t)}>2s10s Spread</div>
          <div style={{ fontSize: 28, fontWeight: 700, fontFamily: t.fontMono, color: (tres.spread_2s10s || 0) < 0 ? t.red : t.green, marginTop: 6 }}>
            {tres.spread_2s10s?.toFixed(2) ?? "—"}
          </div>
          <div style={{ fontSize: 12, color: t.textMuted, marginTop: 2 }}>{tres.curve || ""}</div>
        </div>
        <PriceCard label="DXY Dollar" data={data.dxy} unit="" />
      </div>

      {/* Sector Rotation */}
      <div style={labelStyle(t)}>SECTOR ROTATION (TODAY)</div>
      <div style={{ ...cardStyle(t), marginTop: 8, marginBottom: 16, padding: 16 }}>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={sectorData} layout="vertical" margin={{ left: 80 }}>
            <XAxis type="number" tickFormatter={(v: number) => `${v.toFixed(1)}%`} style={{ fontSize: 10 }} />
            <YAxis type="category" dataKey="name" style={{ fontSize: 11 }} width={75} />
            <Tooltip formatter={(v: number) => `${v.toFixed(2)}%`} />
            <Bar dataKey="pct">
              {sectorData.map((e: any, i: number) => (
                <Cell key={i} fill={e.pct >= 0 ? t.green : t.red} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* War Impact Analysis */}
      {impact.length > 0 && !impact[0]?.error && (
        <>
          <div style={labelStyle(t)}>WAR IMPACT — PORTFOLIO POSITIONS</div>
          <div style={{ ...cardStyle(t), marginTop: 8, padding: 0, overflow: "hidden" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ background: t.bgAlt }}>
                  {["Ticker", "Oil Exp", "Rate Sens", "War Risk", "Status", "Assessment"].map(h => (
                    <th key={h} style={{ padding: "10px 12px", textAlign: "left", fontWeight: 600, color: t.textSecondary, fontSize: 11, textTransform: "uppercase", borderBottom: "1px solid " + t.border }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {impact.map((row: any, i: number) => {
                  const catColor = row.category === "insulated" ? t.green : row.category === "exposed" ? t.red : t.yellow;
                  return (
                    <tr key={i} style={{ borderBottom: "1px solid " + t.borderLight }}>
                      <td style={{ padding: "8px 12px", fontWeight: 600, fontFamily: t.fontMono }}>{row.ticker}</td>
                      <td style={{ padding: "8px 12px", fontFamily: t.fontMono, color: row.oil_exposure > 6 ? t.red : t.textSecondary }}>{row.oil_exposure}/10</td>
                      <td style={{ padding: "8px 12px", fontFamily: t.fontMono, color: row.rate_sensitivity > 6 ? t.red : t.textSecondary }}>{row.rate_sensitivity}/10</td>
                      <td style={{ padding: "8px 12px", fontFamily: t.fontMono, color: row.war_risk > 6 ? t.red : t.textSecondary }}>{row.war_risk}/10</td>
                      <td style={{ padding: "8px 12px" }}>
                        <span style={{ fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 4, background: catColor + "22", color: catColor, textTransform: "uppercase" }}>
                          {row.category}
                        </span>
                      </td>
                      <td style={{ padding: "8px 12px", color: t.textSecondary, fontSize: 12 }}>{row.assessment}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
