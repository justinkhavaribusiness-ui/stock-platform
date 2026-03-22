"use client";
import { useState } from "react";
import { getTheme, cardStyle, labelStyle, inputFieldStyle, btnPrimaryStyle } from "./theme";

interface PositionSizerProps { dark: boolean; BASE: string; }

export default function PositionSizer({ dark, BASE }: PositionSizerProps) {
  const t = getTheme(dark);
  const [ticker, setTicker] = useState("");
  const [acctVal, setAcctVal] = useState("29000");
  const [riskPct, setRiskPct] = useState("2");
  const [entry, setEntry] = useState("");
  const [stop, setStop] = useState("");
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const calc = async () => {
    if (!ticker) return;
    setLoading(true);
    try {
      const params = new URLSearchParams({ ticker, account_value: acctVal, risk_pct: riskPct, entry: entry || "0", stop: stop || "0" });
      const r = await fetch(`${BASE}/position-sizer?${params}`);
      setResult(await r.json());
    } catch {} finally { setLoading(false); }
  };

  return (
    <div style={{ fontFamily: t.fontBody, color: t.text }}>
      <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>Position Sizing Calculator</h2>
      <div style={{ fontSize: 12, color: t.textMuted, marginBottom: 16 }}>How many shares to buy based on your risk tolerance</div>

      {/* Inputs */}
      <div style={{ ...cardStyle(t), padding: 16, display: "flex", gap: 10, flexWrap: "wrap", alignItems: "flex-end" }}>
        <div><div style={{ ...labelStyle(t), marginBottom: 4 }}>Ticker</div><input style={{ ...inputFieldStyle(t), width: 90 }} value={ticker} onChange={e => setTicker(e.target.value.toUpperCase())} onKeyDown={e => e.key === "Enter" && calc()} placeholder="AEHR" /></div>
        <div><div style={{ ...labelStyle(t), marginBottom: 4 }}>Account Value</div><input style={{ ...inputFieldStyle(t), width: 110 }} value={acctVal} onChange={e => setAcctVal(e.target.value)} /></div>
        <div><div style={{ ...labelStyle(t), marginBottom: 4 }}>Risk %</div><input style={{ ...inputFieldStyle(t), width: 60 }} value={riskPct} onChange={e => setRiskPct(e.target.value)} /></div>
        <div><div style={{ ...labelStyle(t), marginBottom: 4 }}>Entry (optional)</div><input style={{ ...inputFieldStyle(t), width: 90 }} value={entry} onChange={e => setEntry(e.target.value)} placeholder="auto" /></div>
        <div><div style={{ ...labelStyle(t), marginBottom: 4 }}>Stop Loss</div><input style={{ ...inputFieldStyle(t), width: 90 }} value={stop} onChange={e => setStop(e.target.value)} placeholder="auto 5%" /></div>
        <button style={btnPrimaryStyle(t)} onClick={calc}>{loading ? "..." : "Calculate"}</button>
      </div>

      {result && !result.error && (
        <div style={{ marginTop: 16 }}>
          {/* Result cards */}
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 16 }}>
            <div style={{ ...cardStyle(t), padding: 16, flex: 1, minWidth: 150, textAlign: "center", borderTop: `3px solid ${t.accent}` }}>
              <div style={labelStyle(t)}>BUY</div>
              <div style={{ fontSize: 40, fontWeight: 800, fontFamily: t.fontMono, color: t.accent, marginTop: 4 }}>{result.shares}</div>
              <div style={{ fontSize: 12, color: t.textMuted }}>shares</div>
            </div>
            <div style={{ ...cardStyle(t), padding: 16, flex: 1, minWidth: 150, textAlign: "center" }}>
              <div style={labelStyle(t)}>Position Value</div>
              <div style={{ fontSize: 24, fontWeight: 700, fontFamily: t.fontMono, color: t.text, marginTop: 4 }}>${result.position_value?.toLocaleString()}</div>
              <div style={{ fontSize: 12, color: t.textMuted }}>{result.pct_of_account}% of account</div>
            </div>
            <div style={{ ...cardStyle(t), padding: 16, flex: 1, minWidth: 150, textAlign: "center" }}>
              <div style={labelStyle(t)}>Max Risk</div>
              <div style={{ fontSize: 24, fontWeight: 700, fontFamily: t.fontMono, color: t.red, marginTop: 4 }}>${result.risk_amount?.toFixed(0)}</div>
              <div style={{ fontSize: 12, color: t.textMuted }}>{result.risk_pct}% of ${(result.account_value/1000).toFixed(0)}K</div>
            </div>
          </div>

          {/* Details */}
          <div style={{ ...cardStyle(t), padding: 16 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, fontSize: 13 }}>
              <div><span style={{ color: t.textMuted }}>Current Price:</span> <strong style={{ fontFamily: t.fontMono }}>${result.price}</strong></div>
              <div><span style={{ color: t.textMuted }}>Entry:</span> <strong style={{ fontFamily: t.fontMono }}>${result.entry}</strong></div>
              <div><span style={{ color: t.textMuted }}>Stop Loss:</span> <strong style={{ fontFamily: t.fontMono, color: t.red }}>${result.stop}</strong></div>
              <div><span style={{ color: t.textMuted }}>Risk/Share:</span> <strong style={{ fontFamily: t.fontMono }}>${result.risk_per_share}</strong></div>
              <div><span style={{ color: t.textMuted }}>Kelly Criterion:</span> <strong style={{ fontFamily: t.fontMono, color: t.blue }}>{result.kelly_shares} shares ({result.kelly_pct}%)</strong></div>
              <div><span style={{ color: t.textMuted }}>Can Sell CC:</span> <strong style={{ color: result.can_sell_cc ? t.green : t.red }}>{result.can_sell_cc ? "Yes (100+ shares)" : "No (need 100)"}</strong></div>
            </div>
          </div>
        </div>
      )}

      {result?.error && <div style={{ ...cardStyle(t), padding: 16, color: t.red }}>{result.error}</div>}
    </div>
  );
}
