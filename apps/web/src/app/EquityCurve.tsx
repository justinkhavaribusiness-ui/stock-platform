"use client";
import { useState, useEffect, useCallback } from "react";
import { getTheme, cardStyle, labelStyle, inputFieldStyle, btnPrimaryStyle } from "./theme";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";

interface EquityCurveProps { dark: boolean; BASE: string; }

export default function EquityCurve({ dark, BASE }: EquityCurveProps) {
  const t = getTheme(dark);
  const [data, setData] = useState<any>(null);
  const [value, setValue] = useState("");

  const load = useCallback(async () => {
    try { const r = await fetch(`${BASE}/equity/curve`); setData(await r.json()); } catch {}
  }, [BASE]);

  useEffect(() => { load(); }, [load]);

  const addSnapshot = async () => {
    if (!value) return;
    await fetch(`${BASE}/equity/snapshot`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ value: parseFloat(value) }),
    });
    setValue("");
    load();
  };

  const s = data?.stats || {};
  const curve = data?.curve || [];

  return (
    <div style={{ fontFamily: t.fontBody, color: t.text }}>
      <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>Portfolio Equity Curve</h2>
      <div style={{ fontSize: 12, color: t.textMuted, marginBottom: 16 }}>Track your account value over time with drawdown analysis</div>

      {/* Stats */}
      <div style={{ display: "flex", gap: 12, marginBottom: 16, flexWrap: "wrap" }}>
        {[
          { label: "Current", val: `$${s.current?.toLocaleString() || "—"}`, color: t.text },
          { label: "Total Return", val: `${s.total_return >= 0 ? "+" : ""}${s.total_return || 0}%`, color: s.total_return >= 0 ? t.green : t.red },
          { label: "Max Drawdown", val: `${s.max_drawdown || 0}%`, color: t.red },
          { label: "Peak", val: `$${s.peak?.toLocaleString() || "—"}`, color: t.green },
        ].map(({ label, val, color }) => (
          <div key={label} style={{ ...cardStyle(t), padding: 14, flex: 1, minWidth: 130, textAlign: "center" }}>
            <div style={labelStyle(t)}>{label}</div>
            <div style={{ fontSize: 22, fontWeight: 700, fontFamily: t.fontMono, color, marginTop: 6 }}>{val}</div>
          </div>
        ))}
      </div>

      {/* Input */}
      <div style={{ ...cardStyle(t), padding: 14, display: "flex", gap: 10, alignItems: "flex-end" }}>
        <div>
          <div style={{ ...labelStyle(t), marginBottom: 4 }}>Log Today&apos;s Account Value</div>
          <input style={{ ...inputFieldStyle(t), width: 160 }} value={value} onChange={e => setValue(e.target.value)} onKeyDown={e => e.key === "Enter" && addSnapshot()} placeholder="28512" />
        </div>
        <button style={btnPrimaryStyle(t)} onClick={addSnapshot}>Log</button>
      </div>

      {/* Chart */}
      {curve.length > 0 && (
        <div style={{ ...cardStyle(t), padding: 16, marginTop: 16 }}>
          <div style={labelStyle(t)}>ACCOUNT VALUE</div>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={curve} margin={{ top: 10, right: 10, bottom: 0, left: 0 }}>
              <XAxis dataKey="date" style={{ fontSize: 10 }} />
              <YAxis style={{ fontSize: 10 }} tickFormatter={(v: number) => `$${(v / 1000).toFixed(1)}k`} domain={["auto", "auto"]} />
              <Tooltip formatter={(v: number) => `$${v.toLocaleString()}`} />
              <Area type="monotone" dataKey="value" stroke={t.accent} fill={t.blueBg} strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Drawdown chart */}
      {curve.length > 1 && curve.some((c: any) => c.drawdown < 0) && (
        <div style={{ ...cardStyle(t), padding: 16, marginTop: 16 }}>
          <div style={labelStyle(t)}>DRAWDOWN</div>
          <ResponsiveContainer width="100%" height={150}>
            <AreaChart data={curve} margin={{ top: 10, right: 10, bottom: 0, left: 0 }}>
              <XAxis dataKey="date" style={{ fontSize: 10 }} />
              <YAxis style={{ fontSize: 10 }} tickFormatter={(v: number) => `${v}%`} />
              <Tooltip formatter={(v: number) => `${v}%`} />
              <ReferenceLine y={0} stroke={t.textMuted} strokeDasharray="3 3" />
              <Area type="monotone" dataKey="drawdown" stroke={t.red} fill={t.redBg} strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
