"use client";
import { useState, useEffect, useCallback } from "react";
import { getTheme, cardStyle, labelStyle, inputFieldStyle, btnPrimaryStyle } from "./theme";

interface PriceAlertsProps { dark: boolean; BASE: string; }

export default function PriceAlerts({ dark, BASE }: PriceAlertsProps) {
  const t = getTheme(dark);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ ticker: "", condition: "below", target: "", notes: "" });
  const [showForm, setShowForm] = useState(false);

  const load = useCallback(async () => {
    try { const r = await fetch(`${BASE}/price-alerts`); setData(await r.json()); } catch {} finally { setLoading(false); }
  }, [BASE]);

  useEffect(() => { load(); const iv = setInterval(load, 30000); return () => clearInterval(iv); }, [load]);

  const add = async () => {
    if (!form.ticker || !form.target) return;
    await fetch(`${BASE}/price-alerts`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...form, target: parseFloat(form.target) }) });
    setForm({ ticker: "", condition: "below", target: "", notes: "" }); setShowForm(false); load();
  };

  const del = async (id: string) => { await fetch(`${BASE}/price-alerts/${id}`, { method: "DELETE" }); load(); };

  const alerts = data?.alerts || [];
  const triggered = alerts.filter((a: any) => a.triggered);

  return (
    <div style={{ fontFamily: t.fontBody, color: t.text }}>
      <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>Watchlist Price Alerts</h2>
      <div style={{ fontSize: 12, color: t.textMuted, marginBottom: 16 }}>Auto-refresh 30s | {triggered.length} triggered</div>

      {triggered.length > 0 && (
        <div style={{ ...cardStyle(t), padding: 16, borderLeft: `3px solid ${t.green}`, marginBottom: 16, background: t.greenBg }}>
          <div style={{ ...labelStyle(t), color: t.green, marginBottom: 8 }}>TRIGGERED ALERTS</div>
          {triggered.map((a: any) => (
            <div key={a.id} style={{ fontSize: 14, fontWeight: 600, color: t.green, marginBottom: 4, fontFamily: t.fontMono }}>
              {a.ticker} hit ${a.target} (now ${a.current_price}) — {a.notes || a.condition}
            </div>
          ))}
        </div>
      )}

      <button style={btnPrimaryStyle(t)} onClick={() => setShowForm(v => !v)}>+ New Alert</button>
      {showForm && (
        <div style={{ ...cardStyle(t), padding: 14, marginTop: 8, display: "flex", gap: 8, flexWrap: "wrap", alignItems: "flex-end" }}>
          <div><div style={{ ...labelStyle(t), marginBottom: 4 }}>Ticker</div><input style={{ ...inputFieldStyle(t), width: 80 }} value={form.ticker} onChange={e => setForm({ ...form, ticker: e.target.value.toUpperCase() })} /></div>
          <div><div style={{ ...labelStyle(t), marginBottom: 4 }}>Condition</div><select style={{ ...inputFieldStyle(t), width: 100 }} value={form.condition} onChange={e => setForm({ ...form, condition: e.target.value })}><option value="below">Below</option><option value="above">Above</option></select></div>
          <div><div style={{ ...labelStyle(t), marginBottom: 4 }}>Target ($)</div><input style={{ ...inputFieldStyle(t), width: 90 }} value={form.target} onChange={e => setForm({ ...form, target: e.target.value })} /></div>
          <div><div style={{ ...labelStyle(t), marginBottom: 4 }}>Notes</div><input style={{ ...inputFieldStyle(t), width: 160 }} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="Buy signal..." /></div>
          <button style={btnPrimaryStyle(t)} onClick={add}>Create</button>
        </div>
      )}

      {alerts.length > 0 && (
        <div style={{ ...cardStyle(t), padding: 0, overflow: "auto", marginTop: 16 }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead><tr style={{ background: t.bgAlt }}>{["Ticker", "Condition", "Target", "Current", "Distance", "Status", "Notes", ""].map(h => <th key={h} style={{ padding: "8px 10px", textAlign: "right", fontWeight: 600, color: t.textSecondary, fontSize: 11, textTransform: "uppercase", borderBottom: `1px solid ${t.border}` }}>{h}</th>)}</tr></thead>
            <tbody>
              {alerts.map((a: any) => (
                <tr key={a.id} style={{ borderBottom: `1px solid ${t.borderLight}`, background: a.triggered ? t.greenBg : "transparent" }}>
                  <td style={{ padding: "8px 10px", textAlign: "left", fontWeight: 700, fontFamily: t.fontMono }}>{a.ticker}</td>
                  <td style={{ padding: "8px 10px", textAlign: "right", textTransform: "uppercase", fontSize: 11, color: t.textMuted }}>{a.condition}</td>
                  <td style={{ padding: "8px 10px", textAlign: "right", fontFamily: t.fontMono, color: t.accent }}>${a.target}</td>
                  <td style={{ padding: "8px 10px", textAlign: "right", fontFamily: t.fontMono }}>${a.current_price || "—"}</td>
                  <td style={{ padding: "8px 10px", textAlign: "right", fontFamily: t.fontMono, color: a.distance_pct > 0 ? t.textMuted : t.green }}>{a.distance_pct != null ? `${a.distance_pct}%` : "—"}</td>
                  <td style={{ padding: "8px 10px", textAlign: "center" }}><span style={{ fontSize: 10, fontWeight: 700, padding: "2px 6px", borderRadius: 3, background: a.triggered ? t.green + "22" : t.bgAlt, color: a.triggered ? t.green : t.textMuted }}>{a.triggered ? "TRIGGERED" : "WATCHING"}</span></td>
                  <td style={{ padding: "8px 10px", textAlign: "right", color: t.textMuted, fontSize: 12 }}>{a.notes}</td>
                  <td style={{ padding: "4px 8px" }}><button onClick={() => del(a.id)} style={{ background: "none", border: "none", color: t.red, cursor: "pointer", fontSize: 12 }}>x</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
