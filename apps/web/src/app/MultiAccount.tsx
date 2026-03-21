"use client";
import { useState, useEffect, useCallback } from "react";
import { getTheme, cardStyle, labelStyle, inputFieldStyle, btnPrimaryStyle } from "./theme";

interface MultiAccountProps { dark: boolean; BASE: string; }

export default function MultiAccount({ dark, BASE }: MultiAccountProps) {
  const t = getTheme(dark);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ ticker: "", shares: "", avg_cost: "" });
  const [showForm, setShowForm] = useState(false);

  const load = useCallback(async () => {
    try { const r = await fetch(`${BASE}/multi-account`); setData(await r.json()); } catch {} finally { setLoading(false); }
  }, [BASE]);

  useEffect(() => { load(); }, [load]);

  const addIBKR = async () => {
    if (!form.ticker || !form.shares || !form.avg_cost) return;
    await fetch(`${BASE}/multi-account/ibkr`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ticker: form.ticker, shares: parseFloat(form.shares), avg_cost: parseFloat(form.avg_cost) }) });
    setForm({ ticker: "", shares: "", avg_cost: "" }); setShowForm(false); load();
  };

  const delIBKR = async (id: string) => { await fetch(`${BASE}/multi-account/ibkr/${id}`, { method: "DELETE" }); load(); };

  if (loading) return <div style={{ color: t.textMuted, padding: 40, textAlign: "center" }}>Loading accounts...</div>;

  const accounts = data?.accounts || [];

  return (
    <div style={{ fontFamily: t.fontBody, color: t.text }}>
      <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>Multi-Account Dashboard</h2>
      <div style={{ fontSize: 12, color: t.textMuted, marginBottom: 16 }}>All accounts in one view</div>

      {/* Grand Total */}
      <div style={{ ...cardStyle(t), padding: 20, textAlign: "center", marginBottom: 16, borderTop: `3px solid ${t.accent}` }}>
        <div style={labelStyle(t)}>TOTAL NET WORTH</div>
        <div style={{ fontSize: 40, fontWeight: 800, fontFamily: t.fontMono, color: t.text, marginTop: 8 }}>${data?.grand_total?.toLocaleString()}</div>
        <div style={{ fontSize: 12, color: t.textMuted, marginTop: 4 }}>{data?.account_count} accounts</div>
      </div>

      {/* Account cards */}
      {accounts.map((acct: any, ai: number) => (
        <div key={ai} style={{ ...cardStyle(t), padding: 16, marginBottom: 12 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <div>
              <span style={{ fontSize: 16, fontWeight: 700 }}>{acct.name}</span>
              <span style={{ fontSize: 12, color: t.textMuted, marginLeft: 8 }}>{acct.type}</span>
            </div>
            <div style={{ fontSize: 20, fontWeight: 700, fontFamily: t.fontMono, color: t.accent }}>${acct.total_value?.toLocaleString()}</div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {acct.positions?.slice(0, 15).map((p: any, pi: number) => (
              <div key={pi} style={{ display: "flex", alignItems: "center", gap: 8, padding: "4px 0", borderBottom: `1px solid ${t.borderLight}`, fontSize: 12 }}>
                <span style={{ fontWeight: 600, fontFamily: t.fontMono, minWidth: 50 }}>{p.ticker}</span>
                <span style={{ color: t.textMuted, minWidth: 60 }}>{p.shares} sh</span>
                <span style={{ fontFamily: t.fontMono, minWidth: 70 }}>${p.value?.toFixed(0)}</span>
                <span style={{ fontFamily: t.fontMono, color: (p.pnl || 0) >= 0 ? t.green : t.red, minWidth: 80 }}>
                  {(p.pnl || 0) >= 0 ? "+" : ""}${(p.pnl || 0).toFixed(0)} ({(p.pnl_pct || 0).toFixed(1)}%)
                </span>
                {acct.name === "Interactive Brokers" && (
                  <button onClick={() => delIBKR(p.id)} style={{ background: "none", border: "none", color: t.red, cursor: "pointer", fontSize: 11, marginLeft: "auto" }}>x</button>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* Add IBKR position */}
      <button style={btnPrimaryStyle(t)} onClick={() => setShowForm(v => !v)}>+ Add IBKR Position</button>
      {showForm && (
        <div style={{ ...cardStyle(t), padding: 14, marginTop: 8, display: "flex", gap: 8, flexWrap: "wrap", alignItems: "flex-end" }}>
          <div><div style={{ ...labelStyle(t), marginBottom: 4 }}>Ticker</div><input style={{ ...inputFieldStyle(t), width: 80 }} value={form.ticker} onChange={e => setForm({ ...form, ticker: e.target.value.toUpperCase() })} placeholder="SIVE" /></div>
          <div><div style={{ ...labelStyle(t), marginBottom: 4 }}>Shares</div><input style={{ ...inputFieldStyle(t), width: 70 }} value={form.shares} onChange={e => setForm({ ...form, shares: e.target.value })} placeholder="85" /></div>
          <div><div style={{ ...labelStyle(t), marginBottom: 4 }}>Avg Cost</div><input style={{ ...inputFieldStyle(t), width: 90 }} value={form.avg_cost} onChange={e => setForm({ ...form, avg_cost: e.target.value })} placeholder="11.36" /></div>
          <button style={btnPrimaryStyle(t)} onClick={addIBKR}>Add</button>
        </div>
      )}
    </div>
  );
}
