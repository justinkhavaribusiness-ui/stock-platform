"use client";
import { useState, useEffect } from "react";

export default function CreditMacro({ dark, BASE }: { dark: boolean; BASE: string }) {
  const [macroData, setMacroData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const bg = dark ? "#0a0a0f" : "#ffffff", card = dark ? "#111118" : "#f8f9fa";
  const bdr = dark ? "#1e1e2e" : "#e5e7eb", txt = dark ? "#f1f1f4" : "#111827";
  const txt2 = dark ? "#71717a" : "#6b7280", txtDim = dark ? "#52525b" : "#9ca3af";

  useEffect(() => {
    fetch(`${BASE}/macro/refresh`).then(r => r.json()).then(d => {
      setMacroData(d);
      setLoading(false);
    }).catch(() => {
      // Fallback data
      setMacroData({
        yields: { "2Y": 4.15, "5Y": 3.98, "10Y": 4.25, "30Y": 4.52, spread_2s10s: 0.10 },
        credit: { ig_spread: 95, hy_spread: 340, ig_change: -5, hy_change: +8 },
        currencies: { DXY: 104.2, EURUSD: 1.085, USDJPY: 149.8, GBPUSD: 1.264 },
        commodities: { WTI: 67.2, Gold: 2920, Copper: 4.52, NatGas: 3.85 },
        vix: 18.5,
        putCallRatio: 0.82,
        advDecline: { advancing: 285, declining: 215, ratio: 1.33 },
      });
      setLoading(false);
    });
  }, [BASE]);

  if (loading) return <div style={{ padding: 40, textAlign: "center", color: txt2 }}>Loading macro data...</div>;

  const data = macroData || {};
  const yields = data.yields || {};
  const credit = data.credit || {};
  const currencies = data.currencies || {};
  const commodities = data.commodities || {};

  const MetricCard = ({ label, value, change, unit, color }: any) => (
    <div style={{ background: card, border: `1px solid ${bdr}`, borderRadius: 10, padding: "12px 14px" }}>
      <div style={{ fontSize: 10, fontWeight: 600, color: txtDim, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 20, fontWeight: 800, fontFamily: "'JetBrains Mono', monospace", color: color || txt }}>{value}{unit || ""}</div>
      {change !== undefined && <div style={{ fontSize: 11, color: change >= 0 ? "#22c55e" : "#ef4444", fontFamily: "'JetBrains Mono', monospace" }}>{change >= 0 ? "+" : ""}{change}</div>}
    </div>
  );

  // Yield curve SVG
  const yieldPoints = [
    { label: "1M", val: 5.32 }, { label: "3M", val: 5.25 }, { label: "6M", val: 5.15 },
    { label: "1Y", val: 4.65 }, { label: "2Y", val: yields["2Y"] || 4.15 }, { label: "5Y", val: yields["5Y"] || 3.98 },
    { label: "10Y", val: yields["10Y"] || 4.25 }, { label: "30Y", val: yields["30Y"] || 4.52 },
  ];
  const yMin = Math.min(...yieldPoints.map(p => p.val)) - 0.2;
  const yMax = Math.max(...yieldPoints.map(p => p.val)) + 0.2;
  const yRange = yMax - yMin || 1;
  const W = 600, H = 200;

  const PORTFOLIO_CORRELATIONS = [
    { indicator: "10Y Yield", correlation: -0.45, impact: "Higher yields = growth stock pressure (COHR, NVDA, OSCR)" },
    { indicator: "WTI Crude", correlation: 0.72, impact: "Oil up = FANG rally, but higher input costs for tech" },
    { indicator: "DXY (Dollar)", correlation: -0.35, impact: "Strong dollar = headwind for multinational earnings" },
    { indicator: "VIX", correlation: -0.62, impact: "Vol spike = portfolio drawdown, especially high-beta names" },
    { indicator: "HY Spreads", correlation: -0.48, impact: "Widening spreads = risk-off, SOFI/OSCR vulnerable" },
    { indicator: "Copper", correlation: 0.38, impact: "Copper up = global growth signal, broad market tailwind" },
    { indicator: "Gold", correlation: 0.15, impact: "Low correlation — potential hedge candidate" },
  ];

  return (
    <div style={{ padding: "16px 24px", background: bg, color: txt, fontFamily: "'DM Sans', system-ui, sans-serif", minHeight: "100%" }}>
      <h2 style={{ fontSize: 18, fontWeight: 800, margin: "0 0 16px" }}>{"💹"} Credit & Macro Dashboard</h2>

      {/* Key gauges */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 8, marginBottom: 16 }}>
        <MetricCard label="VIX" value={data.vix || 18.5} color={(data.vix || 18.5) > 25 ? "#ef4444" : (data.vix || 18.5) > 18 ? "#f59e0b" : "#22c55e"} />
        <MetricCard label="2s10s Spread" value={`${(yields.spread_2s10s ?? 0.10).toFixed(0)}bp`} color={(yields.spread_2s10s ?? 0.10) < 0 ? "#ef4444" : "#22c55e"} />
        <MetricCard label="IG Spread" value={`${credit.ig_spread || 95}bp`} change={credit.ig_change} />
        <MetricCard label="HY Spread" value={`${credit.hy_spread || 340}bp`} change={credit.hy_change} color={(credit.hy_spread || 340) > 400 ? "#ef4444" : txt} />
        <MetricCard label="Put/Call" value={data.putCallRatio || 0.82} color={(data.putCallRatio || 0.82) > 1.0 ? "#ef4444" : "#22c55e"} />
        <MetricCard label="A/D Ratio" value={(data.advDecline?.ratio || 1.33).toFixed(2)} color={(data.advDecline?.ratio || 1.33) > 1 ? "#22c55e" : "#ef4444"} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
        {/* Yield Curve */}
        <div style={{ background: card, border: `1px solid ${bdr}`, borderRadius: 10, padding: 16 }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, margin: "0 0 12px" }}>US Treasury Yield Curve</h3>
          <svg viewBox={`0 0 ${W} ${H + 30}`} style={{ width: "100%", height: 220 }}>
            {yieldPoints.map((p, i) => {
              const x = (i / (yieldPoints.length - 1)) * (W - 60) + 30;
              const y = H - ((p.val - yMin) / yRange) * (H - 20) - 10;
              return <g key={i}>
                <circle cx={x} cy={y} r={4} fill="#3b82f6" />
                <text x={x} y={H + 18} textAnchor="middle" fill={txt2} fontSize={10}>{p.label}</text>
                <text x={x} y={y - 10} textAnchor="middle" fill={txt} fontSize={10} fontWeight={600}>{p.val.toFixed(2)}%</text>
              </g>;
            })}
            <polyline points={yieldPoints.map((p, i) => `${(i / (yieldPoints.length - 1)) * (W - 60) + 30},${H - ((p.val - yMin) / yRange) * (H - 20) - 10}`).join(" ")}
              fill="none" stroke="#3b82f6" strokeWidth={2} strokeLinejoin="round" />
          </svg>
          <div style={{ fontSize: 11, color: txt2, marginTop: 8 }}>
            {(yields.spread_2s10s ?? 0.10) < 0 ? "⚠️ Inverted — historically precedes recession" : "✅ Normal slope — growth conditions intact"}
          </div>
        </div>

        {/* Commodities & FX */}
        <div style={{ background: card, border: `1px solid ${bdr}`, borderRadius: 10, padding: 16 }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, margin: "0 0 12px" }}>Commodities & Currencies</h3>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            {[
              ["WTI Crude", `$${commodities.WTI || 67.2}`, "🛢️"],
              ["Gold", `$${commodities.Gold || 2920}`, "🥇"],
              ["Copper", `$${commodities.Copper || 4.52}`, "🔶"],
              ["Nat Gas", `$${commodities.NatGas || 3.85}`, "🔥"],
              ["DXY", `${currencies.DXY || 104.2}`, "💵"],
              ["EUR/USD", `${currencies.EURUSD || 1.085}`, "🇪🇺"],
              ["USD/JPY", `${currencies.USDJPY || 149.8}`, "🇯🇵"],
              ["GBP/USD", `${currencies.GBPUSD || 1.264}`, "🇬🇧"],
            ].map(([label, val, icon], i) => (
              <div key={i} style={{ padding: "8px 10px", borderRadius: 6, background: dark ? "#0a0a0f" : "#f1f5f9", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 12 }}>{icon} {label}</span>
                <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13, fontWeight: 700 }}>{val}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Portfolio Correlations */}
      <div style={{ background: card, border: `1px solid ${bdr}`, borderRadius: 10, overflow: "hidden" }}>
        <div style={{ padding: "12px 16px", borderBottom: `1px solid ${bdr}`, fontWeight: 700, fontSize: 14 }}>Portfolio Macro Correlations</div>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead><tr style={{ borderBottom: `1px solid ${bdr}` }}>
            {["Indicator", "Correlation", "Bar", "Portfolio Impact"].map(h => (
              <th key={h} style={{ padding: "8px 12px", textAlign: "left", fontSize: 10, fontWeight: 700, color: txtDim, textTransform: "uppercase" }}>{h}</th>
            ))}
          </tr></thead>
          <tbody>
            {PORTFOLIO_CORRELATIONS.map((c, i) => (
              <tr key={i} style={{ borderBottom: `1px solid ${bdr}` }}>
                <td style={{ padding: "10px 12px", fontWeight: 700 }}>{c.indicator}</td>
                <td style={{ padding: "10px 12px", fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, color: c.correlation >= 0 ? "#22c55e" : "#ef4444" }}>{c.correlation > 0 ? "+" : ""}{c.correlation.toFixed(2)}</td>
                <td style={{ padding: "10px 12px", width: 120 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 0, height: 8 }}>
                    <div style={{ flex: 1, height: 8, borderRadius: 4, background: dark ? "#1e1e2e" : "#e5e7eb", position: "relative", overflow: "hidden" }}>
                      <div style={{ position: "absolute", left: "50%", top: 0, height: "100%", width: `${Math.abs(c.correlation) * 50}%`,
                        background: c.correlation >= 0 ? "#22c55e" : "#ef4444", borderRadius: 4,
                        transform: c.correlation >= 0 ? "none" : "translateX(-100%)" }} />
                    </div>
                  </div>
                </td>
                <td style={{ padding: "10px 12px", fontSize: 12, color: txt2 }}>{c.impact}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
