"use client";
import { useState, useEffect, useCallback } from "react";
import { getTheme, cardStyle, labelStyle, inputFieldStyle, btnPrimaryStyle, btnSecondaryStyle } from "./theme";

interface NotifCenterProps { dark: boolean; BASE: string; }

export default function NotifCenter({ dark, BASE }: NotifCenterProps) {
  const t = getTheme(dark);
  const [discordUrl, setDiscordUrl] = useState("");
  const [discordConfigured, setDiscordConfigured] = useState(false);
  const [history, setHistory] = useState<any[]>([]);
  const [checkResult, setCheckResult] = useState<any>(null);
  const [briefing, setBriefing] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  // Thesis vault
  const [theses, setTheses] = useState<any[]>([]);
  const [showThesisForm, setShowThesisForm] = useState(false);
  const [thesisForm, setThesisForm] = useState({ ticker: "", thesis: "", conviction: "medium", cohr_score: "0", entry_zone: "", target: "", stop: "", catalysts: "", risks: "", category: "thesis" });

  const loadAll = useCallback(async () => {
    try {
      const [dc, dh, tv] = await Promise.all([
        fetch(`${BASE}/discord/config`).then(r => r.json()),
        fetch(`${BASE}/discord/history`).then(r => r.json()),
        fetch(`${BASE}/thesis-vault`).then(r => r.json()),
      ]);
      setDiscordConfigured(dc.configured);
      if (dc.url) setDiscordUrl(dc.url);
      setHistory(dh.messages || []);
      setTheses(tv.entries || []);
    } catch {}
  }, [BASE]);

  useEffect(() => { loadAll(); }, [loadAll]);

  const saveDiscord = async () => {
    if (!discordUrl) return;
    const r = await fetch(`${BASE}/discord/config`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ webhook_url: discordUrl }) });
    const d = await r.json();
    if (d.status === "ok") setDiscordConfigured(true);
  };

  const checkAlerts = async () => {
    setLoading(true);
    try { const r = await fetch(`${BASE}/alerts/check-and-notify`, { method: "POST" }); setCheckResult(await r.json()); } catch {} finally { setLoading(false); }
  };

  const sendBriefing = async () => {
    setLoading(true);
    try { const r = await fetch(`${BASE}/discord/morning-briefing`, { method: "POST" }); setBriefing(await r.json()); } catch {} finally { setLoading(false); }
  };

  const addThesis = async () => {
    if (!thesisForm.ticker || !thesisForm.thesis) return;
    await fetch(`${BASE}/thesis-vault`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...thesisForm, cohr_score: parseInt(thesisForm.cohr_score) }) });
    setThesisForm({ ticker: "", thesis: "", conviction: "medium", cohr_score: "0", entry_zone: "", target: "", stop: "", catalysts: "", risks: "", category: "thesis" });
    setShowThesisForm(false);
    loadAll();
  };

  const deleteThesis = async (id: string) => { await fetch(`${BASE}/thesis-vault/${id}`, { method: "DELETE" }); loadAll(); };

  const convictionColor = (c: string) => c === "high" ? t.green : c === "low" ? t.red : t.yellow;

  return (
    <div style={{ fontFamily: t.fontBody, color: t.text }}>
      <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 16 }}>Notification Center & Thesis Vault</h2>

      {/* Discord Setup */}
      <div style={{ ...cardStyle(t), padding: 16, borderLeft: `3px solid ${discordConfigured ? t.green : t.yellow}` }}>
        <div style={{ ...labelStyle(t), marginBottom: 8 }}>DISCORD WEBHOOK</div>
        <div style={{ display: "flex", gap: 8, alignItems: "flex-end", flexWrap: "wrap" }}>
          <div style={{ flex: 1, minWidth: 250 }}>
            <input style={{ ...inputFieldStyle(t), width: "100%" }} value={discordUrl} onChange={e => setDiscordUrl(e.target.value)} placeholder="https://discord.com/api/webhooks/..." />
          </div>
          <button style={btnPrimaryStyle(t)} onClick={saveDiscord}>{discordConfigured ? "Update" : "Connect"}</button>
        </div>
        {discordConfigured && <div style={{ fontSize: 12, color: t.green, marginTop: 6, fontWeight: 600 }}>Connected — alerts will push to Discord</div>}
      </div>

      {/* Action Buttons */}
      <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
        <button style={btnPrimaryStyle(t)} onClick={checkAlerts} disabled={loading}>
          {loading ? "Checking..." : "Check Alerts Now"}
        </button>
        <button style={btnSecondaryStyle(t)} onClick={sendBriefing} disabled={loading}>
          {loading ? "Generating..." : "Send Morning Briefing to Discord"}
        </button>
      </div>

      {/* Check result */}
      {checkResult && (
        <div style={{ ...cardStyle(t), padding: 12, marginTop: 8 }}>
          <span style={{ fontSize: 13, color: t.textSecondary }}>
            Checked {checkResult.checked} alerts — <strong style={{ color: checkResult.triggered > 0 ? t.green : t.textMuted }}>{checkResult.triggered} triggered</strong>
            {checkResult.alerts?.length > 0 && ` (${checkResult.alerts.join(", ")})`}
          </span>
        </div>
      )}

      {/* Briefing result */}
      {briefing?.briefing && (
        <div style={{ ...cardStyle(t), padding: 16, marginTop: 8, borderLeft: `3px solid ${t.accent}` }}>
          <div style={{ ...labelStyle(t), color: t.accent, marginBottom: 8 }}>MORNING BRIEFING</div>
          <div style={{ fontSize: 13, color: t.textSecondary, whiteSpace: "pre-wrap", lineHeight: 1.7 }}>{briefing.briefing}</div>
          <div style={{ fontSize: 11, color: t.textMuted, marginTop: 8 }}>{briefing.status === "sent" ? "Sent to Discord" : "Discord not configured"}</div>
        </div>
      )}

      {/* Discord History */}
      {history.length > 0 && (
        <div style={{ ...cardStyle(t), padding: 12, marginTop: 12 }}>
          <div style={{ ...labelStyle(t), marginBottom: 8 }}>DISCORD SEND HISTORY</div>
          {history.slice(-10).reverse().map((h: any, i: number) => (
            <div key={i} style={{ fontSize: 12, color: t.textSecondary, padding: "4px 0", borderBottom: `1px solid ${t.borderLight}` }}>
              <span style={{ color: h.status === 204 ? t.green : t.red, fontWeight: 600 }}>{h.status === 204 ? "Sent" : "Failed"}</span>
              {" — "}{h.title} <span style={{ color: t.textMuted }}>{h.timestamp ? new Date(h.timestamp).toLocaleString() : ""}</span>
            </div>
          ))}
        </div>
      )}

      {/* Thesis Vault */}
      <div style={{ marginTop: 24 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <h3 style={{ fontSize: 18, fontWeight: 700 }}>AI Thesis Vault</h3>
          <button style={btnPrimaryStyle(t)} onClick={() => setShowThesisForm(v => !v)}>+ New Thesis</button>
        </div>

        {showThesisForm && (
          <div style={{ ...cardStyle(t), padding: 16, marginBottom: 12 }}>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 8 }}>
              <div><div style={{ ...labelStyle(t), marginBottom: 4 }}>Ticker</div><input style={{ ...inputFieldStyle(t), width: 80 }} value={thesisForm.ticker} onChange={e => setThesisForm({ ...thesisForm, ticker: e.target.value.toUpperCase() })} /></div>
              <div><div style={{ ...labelStyle(t), marginBottom: 4 }}>Conviction</div><select style={{ ...inputFieldStyle(t), width: 100 }} value={thesisForm.conviction} onChange={e => setThesisForm({ ...thesisForm, conviction: e.target.value })}><option value="high">High</option><option value="medium">Medium</option><option value="low">Low</option></select></div>
              <div><div style={{ ...labelStyle(t), marginBottom: 4 }}>COHR Score (1-7)</div><input style={{ ...inputFieldStyle(t), width: 60 }} value={thesisForm.cohr_score} onChange={e => setThesisForm({ ...thesisForm, cohr_score: e.target.value })} /></div>
              <div><div style={{ ...labelStyle(t), marginBottom: 4 }}>Category</div><select style={{ ...inputFieldStyle(t), width: 120 }} value={thesisForm.category} onChange={e => setThesisForm({ ...thesisForm, category: e.target.value })}><option value="thesis">Thesis</option><option value="wheel">Wheel</option><option value="income">Income</option><option value="speculative">Speculative</option></select></div>
            </div>
            <div style={{ marginBottom: 8 }}><div style={{ ...labelStyle(t), marginBottom: 4 }}>Thesis</div><textarea style={{ ...inputFieldStyle(t), width: "100%", height: 60 }} value={thesisForm.thesis} onChange={e => setThesisForm({ ...thesisForm, thesis: e.target.value })} placeholder="Why you own this..." /></div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 8 }}>
              <div><div style={{ ...labelStyle(t), marginBottom: 4 }}>Entry Zone</div><input style={{ ...inputFieldStyle(t), width: 100 }} value={thesisForm.entry_zone} onChange={e => setThesisForm({ ...thesisForm, entry_zone: e.target.value })} placeholder="$34-38" /></div>
              <div><div style={{ ...labelStyle(t), marginBottom: 4 }}>Target</div><input style={{ ...inputFieldStyle(t), width: 100 }} value={thesisForm.target} onChange={e => setThesisForm({ ...thesisForm, target: e.target.value })} placeholder="$65" /></div>
              <div><div style={{ ...labelStyle(t), marginBottom: 4 }}>Stop</div><input style={{ ...inputFieldStyle(t), width: 100 }} value={thesisForm.stop} onChange={e => setThesisForm({ ...thesisForm, stop: e.target.value })} placeholder="$28" /></div>
            </div>
            <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
              <div style={{ flex: 1 }}><div style={{ ...labelStyle(t), marginBottom: 4 }}>Catalysts</div><input style={{ ...inputFieldStyle(t), width: "100%" }} value={thesisForm.catalysts} onChange={e => setThesisForm({ ...thesisForm, catalysts: e.target.value })} placeholder="April 7 earnings, H2 bookings" /></div>
              <div style={{ flex: 1 }}><div style={{ ...labelStyle(t), marginBottom: 4 }}>Key Risks</div><input style={{ ...inputFieldStyle(t), width: "100%" }} value={thesisForm.risks} onChange={e => setThesisForm({ ...thesisForm, risks: e.target.value })} placeholder="Customer concentration, lumpy revenue" /></div>
            </div>
            <button style={btnPrimaryStyle(t)} onClick={addThesis}>Save Thesis</button>
          </div>
        )}

        {/* Thesis cards */}
        {theses.length === 0 && <div style={{ color: t.textMuted, padding: 16, fontSize: 13 }}>No theses saved yet. Add your first conviction above.</div>}
        {theses.map((th: any) => (
          <div key={th.id} style={{ ...cardStyle(t), padding: 16, borderLeft: `3px solid ${convictionColor(th.conviction)}` }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                <span style={{ fontSize: 18, fontWeight: 700, fontFamily: t.fontMono }}>{th.ticker}</span>
                <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 3, background: convictionColor(th.conviction) + "22", color: convictionColor(th.conviction), textTransform: "uppercase" }}>{th.conviction}</span>
                {th.cohr_score > 0 && <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 3, background: t.accent + "22", color: t.accent }}>COHR: {th.cohr_score}/7</span>}
                <span style={{ fontSize: 10, padding: "2px 6px", borderRadius: 3, background: t.bgAlt, color: t.textMuted, textTransform: "uppercase" }}>{th.category}</span>
              </div>
              <button onClick={() => deleteThesis(th.id)} style={{ background: "none", border: "none", color: t.red, cursor: "pointer", fontSize: 14 }}>x</button>
            </div>
            <div style={{ fontSize: 13, color: t.textSecondary, marginBottom: 8, lineHeight: 1.6 }}>{th.thesis}</div>
            <div style={{ display: "flex", gap: 16, fontSize: 12, flexWrap: "wrap" }}>
              {th.entry_zone && <span><strong style={{ color: t.blue }}>Entry:</strong> {th.entry_zone}</span>}
              {th.target && <span><strong style={{ color: t.green }}>Target:</strong> {th.target}</span>}
              {th.stop && <span><strong style={{ color: t.red }}>Stop:</strong> {th.stop}</span>}
            </div>
            {th.catalysts && <div style={{ fontSize: 12, color: t.textMuted, marginTop: 4 }}>Catalysts: {th.catalysts}</div>}
            {th.risks && <div style={{ fontSize: 12, color: t.red, marginTop: 2 }}>Risks: {th.risks}</div>}
            <div style={{ fontSize: 10, color: t.textMuted, marginTop: 6 }}>{th.updated ? `Updated ${new Date(th.updated).toLocaleDateString()}` : ""}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
