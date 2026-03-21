"use client";
import { useState, useEffect, useCallback } from "react";
import { getTheme, cardStyle, labelStyle } from "./theme";

interface GeoMonitorProps { dark: boolean; BASE: string; }

export default function GeoMonitor({ dark, BASE }: GeoMonitorProps) {
  const t = getTheme(dark);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try { const r = await fetch(`${BASE}/geo-monitor`); setData(await r.json()); } catch {} finally { setLoading(false); }
  }, [BASE]);

  useEffect(() => { load(); const iv = setInterval(load, 120000); return () => clearInterval(iv); }, [load]);

  if (loading) return <div style={{ color: t.textMuted, padding: 40, textAlign: "center" }}>Scanning geopolitical signals...</div>;
  if (!data) return <div style={{ color: t.red, padding: 40 }}>Failed to load</div>;

  const risk = data.risk_levels || {};
  const ceasefire = data.ceasefire || {};
  const signals = data.trade_signals || [];
  const ind = data.indicators || {};

  const riskColor = (level: string) => level === "critical" ? t.red : level === "elevated" ? t.yellow : t.green;
  const ceasefireColor = ceasefire.status === "possible" ? t.green : ceasefire.status === "unlikely" ? t.yellow : t.red;

  const IndicatorCard = ({ label, data: q, unit }: { label: string; data: any; unit?: string }) => (
    <div style={{ ...cardStyle(t), padding: 14, flex: 1, minWidth: 140 }}>
      <div style={labelStyle(t)}>{label}</div>
      <div style={{ fontSize: 24, fontWeight: 700, fontFamily: t.fontMono, color: t.text, marginTop: 4 }}>
        {unit}{q?.current?.toFixed(2) || "—"}
      </div>
      <div style={{ display: "flex", gap: 8, marginTop: 4, fontSize: 11, fontFamily: t.fontMono }}>
        <span style={{ color: (q?.daily_chg || 0) >= 0 ? t.green : t.red }}>{q?.daily_chg >= 0 ? "+" : ""}{q?.daily_chg}% 1d</span>
        <span style={{ color: (q?.weekly_chg || 0) >= 0 ? t.green : t.red }}>{q?.weekly_chg >= 0 ? "+" : ""}{q?.weekly_chg}% 1w</span>
        <span style={{ color: (q?.monthly_chg || 0) >= 0 ? t.green : t.red }}>{q?.monthly_chg >= 0 ? "+" : ""}{q?.monthly_chg}% 1m</span>
      </div>
      <div style={{ fontSize: 10, color: t.textMuted, marginTop: 2 }}>Trend: {q?.trend || "—"}</div>
    </div>
  );

  return (
    <div style={{ fontFamily: t.fontBody, color: t.text }}>
      <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>Geopolitical Signal Monitor</h2>
      <div style={{ fontSize: 12, color: t.textMuted, marginBottom: 16 }}>
        Auto-refresh 2min | {data.updated_at ? new Date(data.updated_at).toLocaleTimeString() : "—"}
      </div>

      {/* Risk Level Banner */}
      <div style={{ ...cardStyle(t), padding: 16, borderLeft: `4px solid ${riskColor(risk.overall)}`, marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
          <span style={{ fontSize: 14, fontWeight: 700, textTransform: "uppercase", color: riskColor(risk.overall) }}>
            {risk.overall === "critical" ? "CRITICAL RISK" : risk.overall === "elevated" ? "ELEVATED RISK" : "NORMAL CONDITIONS"}
          </span>
        </div>
        <div style={{ display: "flex", gap: 16, fontSize: 12 }}>
          {Object.entries(risk).filter(([k]) => k !== "overall").map(([key, level]: any) => (
            <span key={key} style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <span style={{ width: 8, height: 8, borderRadius: 4, background: riskColor(level), display: "inline-block" }} />
              <span style={{ color: t.textSecondary, textTransform: "capitalize" }}>{key}:</span>
              <span style={{ fontWeight: 600, color: riskColor(level), textTransform: "uppercase" }}>{level}</span>
            </span>
          ))}
        </div>
      </div>

      {/* Ceasefire Status */}
      <div style={{ ...cardStyle(t), padding: 16, borderLeft: `4px solid ${ceasefireColor}`, marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
          <span style={labelStyle(t)}>CEASEFIRE SIGNAL</span>
          <span style={{ fontSize: 12, fontWeight: 700, padding: "2px 8px", borderRadius: 4, background: ceasefireColor + "22", color: ceasefireColor, textTransform: "uppercase" }}>
            {ceasefire.status?.replace("_", " ")}
          </span>
          <span style={{ fontSize: 11, color: t.textMuted }}>({ceasefire.signals_detected}/3 indicators)</span>
        </div>
        <div style={{ fontSize: 13, color: t.textSecondary }}>{ceasefire.note}</div>
      </div>

      {/* Trade Signals */}
      {signals.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <div style={{ ...labelStyle(t), marginBottom: 8 }}>TRADE SIGNALS</div>
          {signals.map((sig: any, i: number) => {
            const urgencyColor = sig.urgency === "critical" ? t.red : sig.urgency === "high" ? t.yellow : t.blue;
            return (
              <div key={i} style={{ ...cardStyle(t), padding: 12, borderLeft: `3px solid ${urgencyColor}`, display: "flex", gap: 12, alignItems: "center" }}>
                <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 6px", borderRadius: 3, background: urgencyColor + "22", color: urgencyColor, textTransform: "uppercase", whiteSpace: "nowrap" }}>
                  {sig.signal}
                </span>
                <span style={{ fontSize: 13, color: t.text }}>{sig.action}</span>
                <span style={{ fontSize: 10, fontWeight: 600, color: urgencyColor, textTransform: "uppercase", marginLeft: "auto" }}>{sig.urgency}</span>
              </div>
            );
          })}
        </div>
      )}

      {/* Indicators */}
      <div style={{ ...labelStyle(t), marginBottom: 8 }}>KEY INDICATORS</div>
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        <IndicatorCard label="Brent Crude" data={ind.brent} unit="$" />
        <IndicatorCard label="VIX" data={ind.vix} />
        <IndicatorCard label="10Y Yield" data={ind["10y_yield"]} />
        <IndicatorCard label="DXY Dollar" data={ind.dxy} />
        <IndicatorCard label="Gold" data={ind.gold} unit="$" />
      </div>
    </div>
  );
}
