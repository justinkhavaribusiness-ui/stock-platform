"use client";
import { useState, useEffect, useCallback } from "react";
import { getTheme, cardStyle, labelStyle, inputFieldStyle, btnPrimaryStyle } from "./theme";

interface DividendTrackerProps { dark: boolean; BASE: string; }

export default function DividendTracker({ dark, BASE }: DividendTrackerProps) {
  const t = getTheme(dark);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ ticker: "", amount: "", date: "", shares: "", per_share: "" });
  const [showForm, setShowForm] = useState(false);

  const load = useCallback(async () => {
    try { const r = await fetch(`${BASE}/dividends`); setData(await r.json()); } catch {} finally { setLoading(false); }
  }, [BASE]);

  useEffect(() => { load(); }, [load]);

  const addDiv = async () => {
    if (!form.ticker || !form.amount) return;
    await fetch(`${BASE}/dividends`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ticker: form.ticker, amount: parseFloat(form.amount), date: form.date, shares: parseFloat(form.shares || "0"), per_share: parseFloat(form.per_share || "0") }),
    });
    setForm({ ticker: "", amount: "", date: "", shares: "", per_share: "" });
    setShowForm(false);
    load();
  };

  const deleteDiv = async (id: string) => {
    await fetch(`${BASE}/dividends/${id}`, { method: "DELETE" });
    load();
  };

  if (loading) return <div style={{ color: t.textMuted, padding: 40, textAlign: "center" }}>Loading dividend data...</div>;

  const upcoming = data?.upcoming || [];
  const history = data?.history || [];

  return (
    <div style={{ fontFamily: t.fontBody, color: t.text }}>
      <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>Dividend Tracker</h2>
      <div style={{ fontSize: 12, color: t.textMuted, marginBottom: 16 }}>Track dividend income and upcoming ex-dates</div>

      {/* Summary */}
      <div style={{ display: "flex", gap: 12, marginBottom: 16, flexWrap: "wrap" }}>
        <div style={{ ...cardStyle(t), padding: 16, flex: 1, minWidth: 160, textAlign: "center" }}>
          <div style={labelStyle(t)}>Total Dividends Received</div>
          <div style={{ fontSize: 28, fontWeight: 700, fontFamily: t.fontMono, color: t.green, marginTop: 6 }}>${data?.total_received?.toFixed(2) || "0.00"}</div>
        </div>
        <div style={{ ...cardStyle(t), padding: 16, flex: 1, minWidth: 160, textAlign: "center" }}>
          <div style={labelStyle(t)}>Dividend-Paying Holdings</div>
          <div style={{ fontSize: 28, fontWeight: 700, fontFamily: t.fontMono, color: t.accent, marginTop: 6 }}>{upcoming.length}</div>
        </div>
      </div>

      {/* Upcoming dividends from portfolio */}
      {upcoming.length > 0 && (
        <div style={{ ...cardStyle(t), padding: 0, overflow: "auto", marginBottom: 16 }}>
          <div style={{ ...labelStyle(t), padding: "12px 12px 0" }}>PORTFOLIO DIVIDEND YIELDS</div>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ background: t.bgAlt }}>
                {["Ticker", "Yield", "Annual Rate", "Ex-Date"].map(h => (
                  <th key={h} style={{ padding: "8px 12px", textAlign: "right", fontWeight: 600, color: t.textSecondary, fontSize: 11, textTransform: "uppercase", borderBottom: `1px solid ${t.border}` }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {upcoming.map((row: any, i: number) => (
                <tr key={i} style={{ borderBottom: `1px solid ${t.borderLight}` }}>
                  <td style={{ padding: "8px 12px", textAlign: "left", fontWeight: 600, fontFamily: t.fontMono }}>{row.ticker}</td>
                  <td style={{ padding: "8px 12px", textAlign: "right", fontFamily: t.fontMono, color: row.yield > 3 ? t.green : t.text, fontWeight: row.yield > 3 ? 700 : 400 }}>{row.yield}%</td>
                  <td style={{ padding: "8px 12px", textAlign: "right", fontFamily: t.fontMono }}>{row.annual_rate ? `$${row.annual_rate}` : "—"}</td>
                  <td style={{ padding: "8px 12px", textAlign: "right", fontFamily: t.fontMono, color: t.textMuted }}>{row.ex_date ? new Date(row.ex_date * 1000).toLocaleDateString() : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add dividend */}
      <button style={btnPrimaryStyle(t)} onClick={() => setShowForm(v => !v)}>+ Log Dividend</button>
      {showForm && (
        <div style={{ ...cardStyle(t), padding: 14, marginTop: 8, display: "flex", gap: 8, flexWrap: "wrap", alignItems: "flex-end" }}>
          <div><div style={{ ...labelStyle(t), marginBottom: 4 }}>Ticker</div><input style={{ ...inputFieldStyle(t), width: 80 }} value={form.ticker} onChange={e => setForm({ ...form, ticker: e.target.value.toUpperCase() })} /></div>
          <div><div style={{ ...labelStyle(t), marginBottom: 4 }}>Amount ($)</div><input style={{ ...inputFieldStyle(t), width: 90 }} value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} /></div>
          <div><div style={{ ...labelStyle(t), marginBottom: 4 }}>Date</div><input type="date" style={{ ...inputFieldStyle(t), width: 130 }} value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} /></div>
          <button style={btnPrimaryStyle(t)} onClick={addDiv}>Save</button>
        </div>
      )}

      {/* History */}
      {history.length > 0 && (
        <div style={{ ...cardStyle(t), padding: 0, overflow: "auto", marginTop: 16 }}>
          <div style={{ ...labelStyle(t), padding: "12px 12px 0" }}>DIVIDEND HISTORY</div>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ background: t.bgAlt }}>
                {["Ticker", "Amount", "Date", ""].map(h => (
                  <th key={h} style={{ padding: "8px 12px", textAlign: "right", fontWeight: 600, color: t.textSecondary, fontSize: 11, textTransform: "uppercase", borderBottom: `1px solid ${t.border}` }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {history.map((row: any, i: number) => (
                <tr key={i} style={{ borderBottom: `1px solid ${t.borderLight}` }}>
                  <td style={{ padding: "8px 12px", textAlign: "left", fontWeight: 600, fontFamily: t.fontMono }}>{row.ticker}</td>
                  <td style={{ padding: "8px 12px", textAlign: "right", fontFamily: t.fontMono, color: t.green }}>${row.amount?.toFixed(2)}</td>
                  <td style={{ padding: "8px 12px", textAlign: "right", color: t.textMuted }}>{row.date}</td>
                  <td style={{ padding: "4px 12px", textAlign: "right" }}>
                    <button onClick={() => deleteDiv(row.id)} style={{ background: "none", border: "none", color: t.red, cursor: "pointer", fontSize: 12 }}>x</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
