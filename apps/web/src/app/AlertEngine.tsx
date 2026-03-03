"use client";
import { useState } from "react";

interface Alert { id: number; ticker: string; type: string; condition: string; value: string; status: "active"|"triggered"|"expired"; createdAt: Date; triggeredAt?: Date; }

export default function AlertEngine({ dark, BASE }: { dark: boolean; BASE: string }) {
  const [alerts, setAlerts] = useState<Alert[]>([
    { id: 1, ticker: "COHR", type: "Price Above", condition: ">", value: "$280", status: "active", createdAt: new Date(Date.now() - 86400000 * 3) },
    { id: 2, ticker: "NVDA", type: "RSI Below", condition: "<", value: "30", status: "active", createdAt: new Date(Date.now() - 86400000 * 2) },
    { id: 3, ticker: "FANG", type: "Price Above", condition: ">", value: "$190", status: "active", createdAt: new Date(Date.now() - 86400000) },
    { id: 4, ticker: "OSCR", type: "Volume Spike", condition: ">", value: "3x avg", status: "triggered", createdAt: new Date(Date.now() - 86400000 * 5), triggeredAt: new Date(Date.now() - 86400000) },
    { id: 5, ticker: "SOFI", type: "Earnings in", condition: "<", value: "7 days", status: "active", createdAt: new Date(Date.now() - 86400000 * 7) },
    { id: 6, ticker: "LITE", type: "Insider Buy", condition: "=", value: "Any", status: "triggered", createdAt: new Date(Date.now() - 86400000 * 10), triggeredAt: new Date(Date.now() - 86400000 * 2) },
    { id: 7, ticker: "AAOI", type: "Price Below", condition: "<", value: "$70", status: "active", createdAt: new Date(Date.now() - 86400000 * 4) },
    { id: 8, ticker: "SPY", type: "RSI Above", condition: ">", value: "70", status: "active", createdAt: new Date(Date.now() - 86400000 * 1) },
  ]);
  const [showCreate, setShowCreate] = useState(false);
  const [newTicker, setNewTicker] = useState("");
  const [newType, setNewType] = useState("Price Above");
  const [newValue, setNewValue] = useState("");
  const [filter, setFilter] = useState<"all"|"active"|"triggered">("all");

  const bg = dark ? "#0a0a0f" : "#ffffff", card = dark ? "#111118" : "#f8f9fa";
  const bdr = dark ? "#1e1e2e" : "#e5e7eb", txt = dark ? "#f1f1f4" : "#111827";
  const txt2 = dark ? "#71717a" : "#6b7280", txtDim = dark ? "#52525b" : "#9ca3af";

  const ALERT_TYPES = ["Price Above", "Price Below", "RSI Above", "RSI Below", "Volume Spike", "Earnings in", "Insider Buy", "Insider Sell", "New SEC Filing", "52W High", "52W Low", "MACD Cross"];

  const addAlert = () => {
    if (!newTicker || !newValue) return;
    setAlerts(prev => [...prev, {
      id: Date.now(), ticker: newTicker.toUpperCase(), type: newType, condition: newType.includes("Above") || newType.includes("Spike") ? ">" : "<",
      value: newValue, status: "active", createdAt: new Date(),
    }]);
    setNewTicker(""); setNewValue(""); setShowCreate(false);
  };

  const removeAlert = (id: number) => setAlerts(prev => prev.filter(a => a.id !== id));

  const filtered = alerts.filter(a => {
    if (filter === "active") return a.status === "active";
    if (filter === "triggered") return a.status === "triggered";
    return true;
  });

  const activeCount = alerts.filter(a => a.status === "active").length;
  const triggeredCount = alerts.filter(a => a.status === "triggered").length;

  return (
    <div style={{ padding: "16px 24px", background: bg, color: txt, fontFamily: "'DM Sans', system-ui, sans-serif", minHeight: "100%" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <h2 style={{ fontSize: 18, fontWeight: 800, margin: 0 }}>{"🔔"} Alert Engine</h2>
        <button onClick={() => setShowCreate(!showCreate)} style={{
          padding: "8px 16px", borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: "pointer",
          border: "none", background: "#3b82f6", color: "#fff",
        }}>+ New Alert</button>
      </div>

      {/* Summary */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8, marginBottom: 16 }}>
        <div style={{ background: card, border: `1px solid ${bdr}`, borderRadius: 10, padding: "12px 14px" }}>
          <div style={{ fontSize: 10, fontWeight: 600, color: txtDim, textTransform: "uppercase" }}>Total Alerts</div>
          <div style={{ fontSize: 20, fontWeight: 800, fontFamily: "'JetBrains Mono', monospace" }}>{alerts.length}</div>
        </div>
        <div style={{ background: card, border: `1px solid ${bdr}`, borderRadius: 10, padding: "12px 14px" }}>
          <div style={{ fontSize: 10, fontWeight: 600, color: txtDim, textTransform: "uppercase" }}>Active</div>
          <div style={{ fontSize: 20, fontWeight: 800, fontFamily: "'JetBrains Mono', monospace", color: "#22c55e" }}>{activeCount}</div>
        </div>
        <div style={{ background: card, border: `1px solid ${bdr}`, borderRadius: 10, padding: "12px 14px" }}>
          <div style={{ fontSize: 10, fontWeight: 600, color: txtDim, textTransform: "uppercase" }}>Triggered</div>
          <div style={{ fontSize: 20, fontWeight: 800, fontFamily: "'JetBrains Mono', monospace", color: "#f59e0b" }}>{triggeredCount}</div>
        </div>
      </div>

      {/* Create form */}
      {showCreate && (
        <div style={{ background: card, border: `1px solid #3b82f6`, borderRadius: 10, padding: 16, marginBottom: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 12 }}>Create Alert</div>
          <div style={{ display: "flex", gap: 8, alignItems: "flex-end" }}>
            <div>
              <div style={{ fontSize: 10, fontWeight: 600, color: txtDim, marginBottom: 4 }}>TICKER</div>
              <input value={newTicker} onChange={e => setNewTicker(e.target.value)} placeholder="COHR"
                style={{ padding: "8px 12px", borderRadius: 6, border: `1px solid ${bdr}`, background: bg, color: txt, fontSize: 13, width: 80, outline: "none", fontFamily: "inherit" }} />
            </div>
            <div>
              <div style={{ fontSize: 10, fontWeight: 600, color: txtDim, marginBottom: 4 }}>TYPE</div>
              <select value={newType} onChange={e => setNewType(e.target.value)}
                style={{ padding: "8px 12px", borderRadius: 6, border: `1px solid ${bdr}`, background: bg, color: txt, fontSize: 13, outline: "none", fontFamily: "inherit" }}>
                {ALERT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <div style={{ fontSize: 10, fontWeight: 600, color: txtDim, marginBottom: 4 }}>VALUE</div>
              <input value={newValue} onChange={e => setNewValue(e.target.value)} placeholder="$280"
                style={{ padding: "8px 12px", borderRadius: 6, border: `1px solid ${bdr}`, background: bg, color: txt, fontSize: 13, width: 100, outline: "none", fontFamily: "inherit" }} />
            </div>
            <button onClick={addAlert} style={{ padding: "8px 16px", borderRadius: 6, border: "none", background: "#22c55e", color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>Create</button>
          </div>
        </div>
      )}

      {/* Filters */}
      <div style={{ display: "flex", gap: 4, marginBottom: 12 }}>
        {(["all","active","triggered"] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{
            padding: "6px 14px", borderRadius: 20, fontSize: 12, fontWeight: filter === f ? 700 : 500, cursor: "pointer",
            border: "none", background: filter === f ? (dark ? "#3b82f620" : "#dbeafe") : "transparent", color: filter === f ? "#3b82f6" : txt2,
          }}>{f === "all" ? "All" : f === "active" ? "Active" : "Triggered"}</button>
        ))}
      </div>

      {/* Alert list */}
      <div style={{ background: card, border: `1px solid ${bdr}`, borderRadius: 10, overflow: "hidden" }}>
        {filtered.map(a => (
          <div key={a.id} style={{ padding: "12px 16px", borderBottom: `1px solid ${bdr}`, display: "flex", justifyContent: "space-between", alignItems: "center",
            background: a.status === "triggered" ? (dark ? "#f59e0b08" : "#fffbeb") : "transparent" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: a.status === "active" ? "#22c55e" : "#f59e0b" }}></span>
              <span style={{ fontWeight: 700, fontSize: 14 }}>{a.ticker}</span>
              <span style={{ padding: "2px 8px", borderRadius: 4, fontSize: 11, background: dark ? "#3b82f615" : "#dbeafe", color: "#3b82f6" }}>{a.type}</span>
              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13, color: txt2 }}>{a.condition} {a.value}</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              {a.triggeredAt && <span style={{ fontSize: 11, color: "#f59e0b" }}>Triggered {a.triggeredAt.toLocaleDateString()}</span>}
              <span style={{ fontSize: 11, color: txtDim }}>{a.createdAt.toLocaleDateString()}</span>
              <button onClick={() => removeAlert(a.id)} style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer", fontSize: 16, padding: 4 }}>{"×"}</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
