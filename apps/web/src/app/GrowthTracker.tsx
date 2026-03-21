"use client";
import { useState, useEffect, useCallback } from "react";
import { getTheme, cardStyle, labelStyle, inputFieldStyle, btnPrimaryStyle } from "./theme";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";

interface GrowthTrackerProps { dark: boolean; BASE: string; }

export default function GrowthTracker({ dark, BASE }: GrowthTrackerProps) {
  const t = getTheme(dark);
  const [data, setData] = useState<any>(null);
  const [value, setValue] = useState("");
  const [cash, setCash] = useState("");
  const [margin, setMargin] = useState("");

  const load = useCallback(async () => {
    try { const r = await fetch(`${BASE}/growth`); setData(await r.json()); } catch {}
  }, [BASE]);

  useEffect(() => { load(); }, [load]);

  const addSnapshot = async () => {
    if (!value) return;
    await fetch(`${BASE}/growth`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ account_value: parseFloat(value), cash: parseFloat(cash || "0"), margin_used: parseFloat(margin || "0") }),
    });
    setValue(""); setCash(""); setMargin("");
    load();
  };

  const s = data?.stats || {};
  const goal = data?.goal || 50000;
  const pct = s.current_value ? Math.min(100, (s.current_value / goal) * 100) : 0;
  const chartData = (data?.snapshots || []).map((snap: any, i: number) => ({
    idx: i, value: snap.account_value,
    date: snap.timestamp ? new Date(snap.timestamp).toLocaleDateString() : `${i}`,
  }));

  return (
    <div style={{ fontFamily: t.fontBody, color: t.text }}>
      <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>Account Growth Tracker</h2>
      <div style={{ fontSize: 12, color: t.textMuted, marginBottom: 16 }}>Track progress toward $50K goal</div>

      {/* Progress bar */}
      <div style={{ ...cardStyle(t), padding: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
          <span style={{ fontSize: 14, fontWeight: 600 }}>Progress to ${(goal/1000).toFixed(0)}K</span>
          <span style={{ fontSize: 14, fontWeight: 700, fontFamily: t.fontMono, color: t.accent }}>{pct.toFixed(1)}%</span>
        </div>
        <div style={{ height: 12, background: t.bgAlt, borderRadius: 6, overflow: "hidden", marginBottom: 12 }}>
          <div style={{ width: `${pct}%`, height: "100%", background: `linear-gradient(90deg, ${t.accent}, ${t.green})`, borderRadius: 6, transition: "width 0.5s" }} />
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: t.textMuted }}>
          <span>Current: <strong style={{ color: t.text, fontFamily: t.fontMono }}>${s.current_value?.toLocaleString() || "—"}</strong></span>
          <span>Remaining: <strong style={{ color: t.accent, fontFamily: t.fontMono }}>${s.remaining?.toLocaleString() || "—"}</strong></span>
          <span>Goal: <strong style={{ color: t.green, fontFamily: t.fontMono }}>${goal.toLocaleString()}</strong></span>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: "flex", gap: 12, marginBottom: 16, flexWrap: "wrap" }}>
        {[
          { label: "Daily Rate", val: `$${s.daily_rate?.toFixed(2) || "0"}`, color: s.daily_rate > 0 ? t.green : t.red },
          { label: "Weekly Rate", val: `$${s.weekly_rate?.toFixed(2) || "0"}`, color: s.weekly_rate > 0 ? t.green : t.red },
          { label: "Monthly Rate", val: `$${s.monthly_rate?.toFixed(2) || "0"}`, color: s.monthly_rate > 0 ? t.green : t.red },
          { label: "Days to Goal", val: s.days_to_goal > 0 ? `${s.days_to_goal}d` : "—", color: t.accent },
        ].map(({ label, val, color }) => (
          <div key={label} style={{ ...cardStyle(t), padding: 14, flex: 1, minWidth: 130, textAlign: "center" }}>
            <div style={labelStyle(t)}>{label}</div>
            <div style={{ fontSize: 24, fontWeight: 700, fontFamily: t.fontMono, color, marginTop: 6 }}>{val}</div>
          </div>
        ))}
      </div>

      {/* Input */}
      <div style={{ ...cardStyle(t), padding: 14, display: "flex", gap: 10, alignItems: "flex-end", flexWrap: "wrap" }}>
        <div>
          <div style={{ ...labelStyle(t), marginBottom: 4 }}>Account Value</div>
          <input style={{ ...inputFieldStyle(t), width: 140 }} value={value} onChange={e => setValue(e.target.value)} placeholder="29303" />
        </div>
        <div>
          <div style={{ ...labelStyle(t), marginBottom: 4 }}>Cash</div>
          <input style={{ ...inputFieldStyle(t), width: 100 }} value={cash} onChange={e => setCash(e.target.value)} placeholder="0" />
        </div>
        <div>
          <div style={{ ...labelStyle(t), marginBottom: 4 }}>Margin Used</div>
          <input style={{ ...inputFieldStyle(t), width: 100 }} value={margin} onChange={e => setMargin(e.target.value)} placeholder="0" />
        </div>
        <button style={btnPrimaryStyle(t)} onClick={addSnapshot}>Log Snapshot</button>
      </div>

      {/* Chart */}
      {chartData.length > 1 && (
        <div style={{ ...cardStyle(t), padding: 16, marginTop: 16 }}>
          <div style={labelStyle(t)}>EQUITY CURVE</div>
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={chartData} margin={{ top: 10, right: 10, bottom: 0, left: 0 }}>
              <XAxis dataKey="date" style={{ fontSize: 10 }} />
              <YAxis style={{ fontSize: 10 }} tickFormatter={(v: number) => `$${(v/1000).toFixed(1)}k`} domain={["auto", "auto"]} />
              <Tooltip formatter={(v: number) => `$${v.toLocaleString()}`} />
              <ReferenceLine y={goal} stroke={t.green} strokeDasharray="5 5" label={{ value: `$${(goal/1000).toFixed(0)}K Goal`, position: "right", fill: t.green, fontSize: 10 }} />
              <Area type="monotone" dataKey="value" stroke={t.accent} fill={t.blueBg} strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
