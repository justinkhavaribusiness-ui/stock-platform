"use client";
import { useState, useEffect, useCallback } from "react";
import { getTheme, cardStyle, labelStyle } from "./theme";

interface MarketIntelProps { dark: boolean; BASE: string; }

export default function MarketIntel({ dark, BASE }: MarketIntelProps) {
  const t = getTheme(dark);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try { const r = await fetch(`${BASE}/ai/market-intel`); setData(await r.json()); } catch {} finally { setLoading(false); }
  }, [BASE]);

  useEffect(() => { load(); const iv = setInterval(load, 300000); return () => clearInterval(iv); }, [load]);

  if (loading && !data) return (
    <div style={{ color: t.textMuted, padding: 40, textAlign: "center" }}>
      <div style={{ fontSize: 18, marginBottom: 8 }}>Generating Market Intelligence...</div>
      <div style={{ fontSize: 12 }}>Claude is analyzing macro data, geopolitics, and your portfolio. This takes 30-60 seconds.</div>
    </div>
  );

  if (!data) return <div style={{ color: t.red, padding: 40 }}>Failed to load market intelligence</div>;

  const threatColor = data.threat_level === "critical" ? t.red : data.threat_level === "elevated" ? t.yellow : t.green;
  const alerts = data.emergency_alerts || [];
  const macro = data.macro_assessment || {};
  const scenarios = data.scenario_probabilities || [];
  const signals = data.trade_signals || [];
  const watch = data.positions_to_watch || [];

  const severityColor = (s: string) => s === "critical" ? t.red : s === "high" ? t.yellow : t.blue;
  const statusColor = (s: string) => s === "danger" ? t.red : s === "caution" ? t.yellow : t.green;
  const dirColor = (d: string) => d === "bullish" ? t.green : d === "bearish" ? t.red : t.textMuted;

  return (
    <div style={{ fontFamily: t.fontBody, color: t.text }}>
      {/* Threat Level Banner */}
      <div style={{ ...cardStyle(t), padding: 20, borderLeft: `5px solid ${threatColor}`, marginBottom: 16, background: data.threat_level === "critical" ? t.redBg : data.threat_level === "elevated" ? t.yellowBg : t.greenBg }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
          <span style={{ fontSize: 28, fontWeight: 800, color: threatColor, textTransform: "uppercase", fontFamily: t.fontMono }}>
            {data.threat_level === "critical" ? "CRITICAL" : data.threat_level === "elevated" ? "ELEVATED" : "NORMAL"}
          </span>
          <span style={{ fontSize: 11, color: t.textMuted }}>THREAT LEVEL</span>
          <span style={{ fontSize: 11, color: t.textMuted, marginLeft: "auto" }}>
            Updated {data.timestamp ? new Date(data.timestamp).toLocaleTimeString() : "—"} | Auto-refresh 5min
          </span>
        </div>
        <div style={{ fontSize: 18, fontWeight: 700, color: t.text }}>{data.headline}</div>
      </div>

      {/* Emergency Alerts */}
      {alerts.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <div style={{ ...labelStyle(t), color: t.red, marginBottom: 8, fontSize: 13, letterSpacing: 2 }}>EMERGENCY ALERTS</div>
          {alerts.map((a: any, i: number) => (
            <div key={i} style={{ ...cardStyle(t), padding: 16, borderLeft: `4px solid ${severityColor(a.severity)}`, marginBottom: 8 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                <span style={{ fontSize: 12, fontWeight: 800, padding: "3px 10px", borderRadius: 4, background: severityColor(a.severity) + "22", color: severityColor(a.severity), textTransform: "uppercase", letterSpacing: 1 }}>
                  {a.severity}
                </span>
                <span style={{ fontSize: 15, fontWeight: 700 }}>{a.alert}</span>
              </div>
              <div style={{ fontSize: 13, color: t.textSecondary, marginBottom: 8, lineHeight: 1.6 }}>{a.detail}</div>
              <div style={{ fontSize: 13, marginBottom: 6 }}>
                <strong style={{ color: t.yellow }}>Portfolio Impact:</strong> <span style={{ color: t.textSecondary }}>{a.portfolio_impact}</span>
              </div>
              <div style={{ fontSize: 13, fontWeight: 600, color: t.accent, padding: "8px 12px", borderRadius: t.radiusSm, background: t.blueBg }}>
                ACTION: {a.action}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Macro Assessment */}
      <div style={{ ...labelStyle(t), marginBottom: 8 }}>MACRO ASSESSMENT</div>
      <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
        {[
          { title: "War / Geopolitical", content: macro.war_status, icon: "🎖" },
          { title: "Fed / Rate Outlook", content: macro.fed_outlook, icon: "🏛" },
          { title: "Recession Risk", content: macro.recession_risk, icon: "📉" },
          { title: "Oil Thesis", content: macro.oil_thesis, icon: "🛢" },
          { title: "Volatility Regime", content: macro.volatility_regime, icon: "📊" },
        ].map(({ title, content, icon }) => (
          <div key={title} style={{ ...cardStyle(t), padding: 14, flex: 1, minWidth: 250 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: t.accent, textTransform: "uppercase", marginBottom: 6 }}>{icon} {title}</div>
            <div style={{ fontSize: 13, color: t.textSecondary, lineHeight: 1.6 }}>{content || "—"}</div>
          </div>
        ))}
      </div>

      {/* Scenario Probabilities */}
      {scenarios.length > 0 && (
        <>
          <div style={{ ...labelStyle(t), marginBottom: 8 }}>SCENARIO PROBABILITIES</div>
          <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
            {scenarios.map((s: any, i: number) => (
              <div key={i} style={{ ...cardStyle(t), padding: 16, flex: 1, minWidth: 250 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                  <span style={{ fontSize: 14, fontWeight: 700 }}>{s.scenario}</span>
                  <span style={{ fontSize: 22, fontWeight: 800, fontFamily: t.fontMono, color: t.accent }}>{s.probability}%</span>
                </div>
                <div style={{ height: 6, background: t.bgAlt, borderRadius: 3, marginBottom: 10, overflow: "hidden" }}>
                  <div style={{ width: `${s.probability}%`, height: "100%", background: t.accent, borderRadius: 3 }} />
                </div>
                <div style={{ fontSize: 12, color: t.textSecondary, marginBottom: 4 }}><strong>Market:</strong> {s.market_impact}</div>
                <div style={{ fontSize: 12, color: t.green, fontWeight: 600 }}>{s.portfolio_play}</div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Trade Signals */}
      {signals.length > 0 && (
        <>
          <div style={{ ...labelStyle(t), marginBottom: 8 }}>TRADE SIGNALS</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 20 }}>
            {signals.map((s: any, i: number) => {
              const urgBg = s.urgency === "now" ? t.redBg : s.urgency === "this_week" ? t.yellowBg : t.bgAlt;
              const urgColor = s.urgency === "now" ? t.red : s.urgency === "this_week" ? t.yellow : t.textMuted;
              return (
                <div key={i} style={{ ...cardStyle(t), padding: 12, display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                  <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 3, background: urgBg, color: urgColor, textTransform: "uppercase" }}>{s.urgency}</span>
                  <span style={{ fontWeight: 700, fontFamily: t.fontMono, color: dirColor(s.direction), minWidth: 50 }}>{s.ticker}</span>
                  <span style={{ fontSize: 10, fontWeight: 600, padding: "2px 6px", borderRadius: 3, background: dirColor(s.direction) + "22", color: dirColor(s.direction), textTransform: "uppercase" }}>{s.direction}</span>
                  <span style={{ fontSize: 13, fontWeight: 600, color: t.text }}>{s.signal}</span>
                  <span style={{ fontSize: 12, color: t.textSecondary, flex: 1 }}>{s.action}</span>
                  <span style={{ fontSize: 11, color: t.textMuted, fontStyle: "italic" }}>{s.rationale}</span>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Positions to Watch */}
      {watch.length > 0 && (
        <>
          <div style={{ ...labelStyle(t), marginBottom: 8 }}>POSITIONS TO WATCH</div>
          <div style={{ ...cardStyle(t), padding: 0, overflow: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ background: t.bgAlt }}>
                  {["Ticker", "Status", "Note"].map(h => (
                    <th key={h} style={{ padding: "8px 12px", textAlign: "left", fontWeight: 600, color: t.textSecondary, fontSize: 11, textTransform: "uppercase", borderBottom: `1px solid ${t.border}` }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {watch.map((w: any, i: number) => (
                  <tr key={i} style={{ borderBottom: `1px solid ${t.borderLight}` }}>
                    <td style={{ padding: "8px 12px", fontWeight: 700, fontFamily: t.fontMono }}>{w.ticker}</td>
                    <td style={{ padding: "8px 12px" }}>
                      <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 3, background: statusColor(w.status) + "22", color: statusColor(w.status), textTransform: "uppercase" }}>{w.status}</span>
                    </td>
                    <td style={{ padding: "8px 12px", color: t.textSecondary }}>{w.note}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Raw macro data */}
      <div style={{ ...labelStyle(t), marginTop: 20, marginBottom: 8 }}>LIVE INDICATORS</div>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {data.macro_data && Object.entries(data.macro_data).map(([key, q]: any) => (
          <div key={key} style={{ ...cardStyle(t), padding: 10, minWidth: 110, textAlign: "center" }}>
            <div style={{ fontSize: 10, color: t.textMuted, textTransform: "uppercase" }}>{key}</div>
            <div style={{ fontSize: 16, fontWeight: 700, fontFamily: t.fontMono, marginTop: 2 }}>{key === "btc" || key === "oil" || key === "wti" || key === "gold" ? "$" : ""}{q?.price || "—"}</div>
            <div style={{ fontSize: 11, fontFamily: t.fontMono, color: (q?.daily_chg || 0) >= 0 ? t.green : t.red }}>{(q?.daily_chg || 0) >= 0 ? "+" : ""}{q?.daily_chg || 0}%</div>
          </div>
        ))}
      </div>

      {/* Refresh button */}
      <div style={{ marginTop: 16, textAlign: "center" }}>
        <button onClick={load} disabled={loading} style={{ padding: "10px 24px", background: t.accent, color: "#fff", border: "none", borderRadius: t.radiusSm, fontSize: 13, fontWeight: 600, cursor: "pointer", opacity: loading ? 0.5 : 1 }}>
          {loading ? "Analyzing..." : "Refresh Intelligence"}
        </button>
      </div>
    </div>
  );
}
