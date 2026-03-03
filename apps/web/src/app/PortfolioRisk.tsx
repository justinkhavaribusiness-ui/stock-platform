"use client";
import { useState, useEffect } from "react";

export default function PortfolioRisk({ dark, BASE }: { dark: boolean; BASE: string }) {
  const [holdings, setHoldings] = useState<any[]>([]);
  const [correlations, setCorrelations] = useState<any>(null);
  const [riskMetrics, setRiskMetrics] = useState<any>(null);
  const [stressResults, setStressResults] = useState<any[]>([]);
  const [activeStress, setActiveStress] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [subtab, setSubtab] = useState<"overview"|"correlation"|"stress"|"factors">("overview");

  const bg = dark ? "#0a0a0f" : "#ffffff", card = dark ? "#111118" : "#f8f9fa";
  const bdr = dark ? "#1e1e2e" : "#e5e7eb", txt = dark ? "#f1f1f4" : "#111827";
  const txt2 = dark ? "#71717a" : "#6b7280", txtDim = dark ? "#52525b" : "#9ca3af";

  const PORTFOLIO = [
    { ticker: "COHR", shares: 50, cost: 89.50, sector: "Photonics", factor: "AI Capex" },
    { ticker: "NVDA", shares: 15, cost: 132.00, sector: "Semis", factor: "AI Capex" },
    { ticker: "OSCR", shares: 200, cost: 16.80, sector: "Healthcare", factor: "Regulation" },
    { ticker: "SOFI", shares: 150, cost: 8.20, sector: "Fintech", factor: "Rates" },
    { ticker: "FANG", shares: 20, cost: 165.00, sector: "Energy", factor: "Oil Price" },
    { ticker: "LITE", shares: 40, cost: 78.00, sector: "Photonics", factor: "AI Capex" },
    { ticker: "AMZN", shares: 25, cost: 178.00, sector: "Tech", factor: "Consumer" },
    { ticker: "TSLA", shares: 10, cost: 242.00, sector: "EV/Auto", factor: "Growth" },
    { ticker: "MRVL", shares: 60, cost: 72.00, sector: "Semis", factor: "AI Capex" },
    { ticker: "ANET", shares: 8, cost: 340.00, sector: "Networking", factor: "AI Capex" },
  ];

  const STRESS_SCENARIOS = [
    { id: "recession", name: "Recession", desc: "GDP -2%, unemployment +3%, rates cut 150bps", impacts: { "AI Capex": -35, "Rates": +15, "Oil Price": -25, "Consumer": -30, "Regulation": -10, "Growth": -40 } },
    { id: "china_ban", name: "China Export Ban", desc: "Full semiconductor export restrictions to China", impacts: { "AI Capex": -20, "Rates": -5, "Oil Price": +10, "Consumer": -10, "Regulation": -5, "Growth": -15 } },
    { id: "rates_up", name: "Rates +100bps", desc: "Unexpected hawkish pivot, 10Y hits 5.5%", impacts: { "AI Capex": -15, "Rates": -25, "Oil Price": +5, "Consumer": -20, "Regulation": -5, "Growth": -30 } },
    { id: "ai_winter", name: "AI Winter", desc: "Major AI model failure, capex freeze", impacts: { "AI Capex": -50, "Rates": +5, "Oil Price": -10, "Consumer": -5, "Regulation": 0, "Growth": -20 } },
    { id: "oil_spike", name: "Oil to $100", desc: "Iran conflict, WTI hits $100+", impacts: { "AI Capex": -5, "Rates": -10, "Oil Price": +40, "Consumer": -15, "Regulation": 0, "Growth": -10 } },
    { id: "bull_run", name: "Bull Case", desc: "Soft landing, rate cuts, AI monetization proof", impacts: { "AI Capex": +30, "Rates": +20, "Oil Price": +10, "Consumer": +25, "Regulation": +15, "Growth": +35 } },
  ];

  useEffect(() => {
    const tickers = PORTFOLIO.map(p => p.ticker).join(",");
    fetch(`${BASE}/quotes?tickers=${tickers}`)
      .then(r => r.json())
      .then(d => {
        const arr = d?.data || d;
        if (!Array.isArray(arr)) return;
        const priceMap: Record<string, any> = {};
        arr.forEach((q: any) => { if (q?.ticker) priceMap[q.ticker] = q; });

        const enriched = PORTFOLIO.map(p => {
          const q = priceMap[p.ticker];
          const price = q?.price || p.cost;
          const mktVal = price * p.shares;
          const gain = (price - p.cost) * p.shares;
          const gainPct = ((price - p.cost) / p.cost) * 100;
          return { ...p, price, mktVal, gain, gainPct, beta: q?.beta || 1.0 };
        });

        const totalVal = enriched.reduce((s, h) => s + h.mktVal, 0);
        enriched.forEach(h => { (h as any).weight = (h.mktVal / totalVal) * 100; });

        setHoldings(enriched);

        // Calculate risk metrics
        const weightedBeta = enriched.reduce((s, h) => s + (h.beta * (h as any).weight / 100), 0);
        const dailyVol = 0.015; // approximate
        const portfolioVol = dailyVol * weightedBeta;
        const var95_1d = totalVal * portfolioVol * 1.645;
        const var95_5d = var95_1d * Math.sqrt(5);
        const maxDrawdown = totalVal * portfolioVol * 3.5;

        // Sector concentration
        const sectors: Record<string, number> = {};
        enriched.forEach(h => { sectors[h.sector] = (sectors[h.sector] || 0) + (h as any).weight; });

        // Factor exposure
        const factors: Record<string, number> = {};
        enriched.forEach(h => { factors[h.factor] = (factors[h.factor] || 0) + (h as any).weight; });

        setRiskMetrics({
          totalValue: totalVal,
          totalGain: enriched.reduce((s, h) => s + h.gain, 0),
          weightedBeta,
          var95_1d,
          var95_5d,
          maxDrawdown,
          sharpe: 1.8,
          sectors,
          factors,
          topConcentration: Math.max(...Object.values(sectors)),
        });

        // Build correlation approximation
        const tks = enriched.map(h => h.ticker);
        const corrMatrix: Record<string, Record<string, number>> = {};
        tks.forEach(a => {
          corrMatrix[a] = {};
          tks.forEach(b => {
            if (a === b) { corrMatrix[a][b] = 1.0; return; }
            const ha = enriched.find(h => h.ticker === a)!;
            const hb = enriched.find(h => h.ticker === b)!;
            let corr = 0.3; // base
            if (ha.sector === hb.sector) corr += 0.35;
            if (ha.factor === hb.factor) corr += 0.2;
            corr = Math.min(corr, 0.95);
            corrMatrix[a][b] = corr;
          });
        });
        setCorrelations({ matrix: corrMatrix, tickers: tks });
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [BASE]);

  const runStress = (scenario: typeof STRESS_SCENARIOS[0]) => {
    setActiveStress(scenario.id);
    const results = holdings.map(h => {
      const impact = (scenario.impacts as any)[h.factor] || 0;
      const newPrice = h.price * (1 + impact / 100);
      const pnl = (newPrice - h.price) * h.shares;
      return { ...h, impact, newPrice, pnl };
    });
    setStressResults(results);
  };

  const pill = (label: string, active: boolean, onClick: () => void) => (
    <button onClick={onClick} style={{
      padding: "6px 16px", borderRadius: 20, fontSize: 12, fontWeight: active ? 700 : 500, cursor: "pointer",
      border: "none", background: active ? (dark ? "#3b82f620" : "#dbeafe") : "transparent",
      color: active ? "#3b82f6" : txt2, transition: "all 0.15s",
    }}>{label}</button>
  );

  const corrColor = (v: number) => {
    if (v >= 0.7) return dark ? "#ef444460" : "#fecaca";
    if (v >= 0.5) return dark ? "#f59e0b40" : "#fef3c7";
    return dark ? "#22c55e20" : "#dcfce7";
  };

  if (loading) return <div style={{ padding: 40, textAlign: "center", color: txt2 }}>Loading risk engine...</div>;

  return (
    <div style={{ padding: "16px 24px", background: bg, color: txt, fontFamily: "'DM Sans', system-ui, sans-serif", minHeight: "100%" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <h2 style={{ fontSize: 18, fontWeight: 800, margin: 0 }}>{"🛡️"} Portfolio Risk Engine</h2>
        <div style={{ display: "flex", gap: 4 }}>
          {pill("Overview", subtab === "overview", () => setSubtab("overview"))}
          {pill("Correlation", subtab === "correlation", () => setSubtab("correlation"))}
          {pill("Stress Test", subtab === "stress", () => setSubtab("stress"))}
          {pill("Factors", subtab === "factors", () => setSubtab("factors"))}
        </div>
      </div>

      {/* Overview */}
      {subtab === "overview" && riskMetrics && (
        <div>
          {/* Key metrics row */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 8, marginBottom: 16 }}>
            {[
              ["Portfolio Value", `$${(riskMetrics.totalValue/1000).toFixed(1)}K`],
              ["Total P&L", `${riskMetrics.totalGain >= 0 ? "+" : ""}$${(riskMetrics.totalGain/1000).toFixed(1)}K`],
              ["Wtd Beta", riskMetrics.weightedBeta.toFixed(2)],
              ["VaR (1d 95%)", `$${(riskMetrics.var95_1d/1000).toFixed(1)}K`],
              ["VaR (5d 95%)", `$${(riskMetrics.var95_5d/1000).toFixed(1)}K`],
              ["Max Drawdown", `$${(riskMetrics.maxDrawdown/1000).toFixed(1)}K`],
            ].map(([label, val], i) => (
              <div key={i} style={{ background: card, border: `1px solid ${bdr}`, borderRadius: 10, padding: "12px 14px" }}>
                <div style={{ fontSize: 10, fontWeight: 600, color: txtDim, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 4 }}>{label}</div>
                <div style={{ fontSize: 16, fontWeight: 800, fontFamily: "'JetBrains Mono', monospace",
                  color: String(val).includes("+") ? "#22c55e" : String(val).includes("-") ? "#ef4444" : txt }}>{val}</div>
              </div>
            ))}
          </div>

          {/* Holdings table */}
          <div style={{ background: card, border: `1px solid ${bdr}`, borderRadius: 10, overflow: "hidden" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${bdr}` }}>
                  {["Ticker", "Shares", "Price", "Cost", "Mkt Val", "P&L", "P&L %", "Weight", "Sector", "Factor"].map(h => (
                    <th key={h} style={{ padding: "10px 12px", textAlign: "left", fontSize: 10, fontWeight: 700, color: txtDim, textTransform: "uppercase", letterSpacing: 0.5 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {holdings.map(h => (
                  <tr key={h.ticker} style={{ borderBottom: `1px solid ${bdr}` }}>
                    <td style={{ padding: "10px 12px", fontWeight: 700 }}>{h.ticker}</td>
                    <td style={{ padding: "10px 12px", fontFamily: "'JetBrains Mono', monospace" }}>{h.shares}</td>
                    <td style={{ padding: "10px 12px", fontFamily: "'JetBrains Mono', monospace" }}>${h.price?.toFixed(2)}</td>
                    <td style={{ padding: "10px 12px", fontFamily: "'JetBrains Mono', monospace", color: txt2 }}>${h.cost.toFixed(2)}</td>
                    <td style={{ padding: "10px 12px", fontFamily: "'JetBrains Mono', monospace" }}>${(h.mktVal/1000).toFixed(1)}K</td>
                    <td style={{ padding: "10px 12px", fontFamily: "'JetBrains Mono', monospace", color: h.gain >= 0 ? "#22c55e" : "#ef4444" }}>{h.gain >= 0 ? "+" : ""}${h.gain.toFixed(0)}</td>
                    <td style={{ padding: "10px 12px", fontFamily: "'JetBrains Mono', monospace", color: h.gainPct >= 0 ? "#22c55e" : "#ef4444" }}>{h.gainPct >= 0 ? "+" : ""}{h.gainPct.toFixed(1)}%</td>
                    <td style={{ padding: "10px 12px", fontFamily: "'JetBrains Mono', monospace" }}>{(h as any).weight?.toFixed(1)}%</td>
                    <td style={{ padding: "10px 12px" }}><span style={{ padding: "2px 8px", borderRadius: 4, fontSize: 11, background: dark ? "#3b82f620" : "#dbeafe", color: "#3b82f6" }}>{h.sector}</span></td>
                    <td style={{ padding: "10px 12px", fontSize: 12, color: txt2 }}>{h.factor}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Correlation Matrix */}
      {subtab === "correlation" && correlations && (
        <div>
          <p style={{ color: txt2, fontSize: 13, marginBottom: 12 }}>Correlation heatmap — red = high correlation (concentrated risk), green = low (diversified)</p>
          <div style={{ background: card, border: `1px solid ${bdr}`, borderRadius: 10, overflow: "auto", padding: 4 }}>
            <table style={{ borderCollapse: "collapse", fontSize: 12 }}>
              <thead>
                <tr>
                  <th style={{ padding: 8, minWidth: 60 }}></th>
                  {correlations.tickers.map((t: string) => (
                    <th key={t} style={{ padding: 8, fontWeight: 700, fontSize: 11, minWidth: 55, textAlign: "center" }}>{t}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {correlations.tickers.map((a: string) => (
                  <tr key={a}>
                    <td style={{ padding: 8, fontWeight: 700, fontSize: 11 }}>{a}</td>
                    {correlations.tickers.map((b: string) => {
                      const v = correlations.matrix[a][b];
                      return (
                        <td key={b} style={{
                          padding: 8, textAlign: "center", fontFamily: "'JetBrains Mono', monospace", fontSize: 11,
                          background: a === b ? (dark ? "#3b82f620" : "#dbeafe") : corrColor(v),
                          fontWeight: a === b ? 700 : 400,
                        }}>{v.toFixed(2)}</td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{ display: "flex", gap: 16, marginTop: 12, fontSize: 11, color: txt2 }}>
            <span><span style={{ display: "inline-block", width: 12, height: 12, borderRadius: 2, background: corrColor(0.8), marginRight: 4, verticalAlign: "middle" }}></span>High ({">"}0.7)</span>
            <span><span style={{ display: "inline-block", width: 12, height: 12, borderRadius: 2, background: corrColor(0.6), marginRight: 4, verticalAlign: "middle" }}></span>Medium (0.5-0.7)</span>
            <span><span style={{ display: "inline-block", width: 12, height: 12, borderRadius: 2, background: corrColor(0.3), marginRight: 4, verticalAlign: "middle" }}></span>Low ({"<"}0.5)</span>
          </div>
        </div>
      )}

      {/* Stress Tests */}
      {subtab === "stress" && (
        <div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8, marginBottom: 16 }}>
            {STRESS_SCENARIOS.map(s => (
              <div key={s.id} onClick={() => runStress(s)} style={{
                padding: "14px 16px", borderRadius: 10, cursor: "pointer",
                border: `1px solid ${activeStress === s.id ? "#3b82f6" : bdr}`,
                background: activeStress === s.id ? (dark ? "#3b82f620" : "#dbeafe") : card,
                transition: "all 0.15s",
              }}>
                <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>{s.name}</div>
                <div style={{ fontSize: 11, color: txt2 }}>{s.desc}</div>
              </div>
            ))}
          </div>
          {stressResults.length > 0 && (
            <div style={{ background: card, border: `1px solid ${bdr}`, borderRadius: 10, overflow: "hidden" }}>
              <div style={{ padding: "12px 16px", borderBottom: `1px solid ${bdr}`, fontWeight: 700, fontSize: 13 }}>
                Scenario: {STRESS_SCENARIOS.find(s => s.id === activeStress)?.name}
                <span style={{ float: "right", fontFamily: "'JetBrains Mono', monospace", color: stressResults.reduce((s, r) => s + r.pnl, 0) >= 0 ? "#22c55e" : "#ef4444" }}>
                  Portfolio Impact: {stressResults.reduce((s, r) => s + r.pnl, 0) >= 0 ? "+" : ""}${(stressResults.reduce((s, r) => s + r.pnl, 0)/1000).toFixed(1)}K
                </span>
              </div>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead><tr style={{ borderBottom: `1px solid ${bdr}` }}>
                  {["Ticker", "Current", "Factor", "Impact", "Stressed Price", "P&L"].map(h => (
                    <th key={h} style={{ padding: "8px 12px", textAlign: "left", fontSize: 10, fontWeight: 700, color: txtDim, textTransform: "uppercase" }}>{h}</th>
                  ))}
                </tr></thead>
                <tbody>
                  {stressResults.map(r => (
                    <tr key={r.ticker} style={{ borderBottom: `1px solid ${bdr}` }}>
                      <td style={{ padding: "8px 12px", fontWeight: 700 }}>{r.ticker}</td>
                      <td style={{ padding: "8px 12px", fontFamily: "'JetBrains Mono', monospace" }}>${r.price?.toFixed(2)}</td>
                      <td style={{ padding: "8px 12px", fontSize: 12, color: txt2 }}>{r.factor}</td>
                      <td style={{ padding: "8px 12px", fontFamily: "'JetBrains Mono', monospace", color: r.impact >= 0 ? "#22c55e" : "#ef4444" }}>{r.impact >= 0 ? "+" : ""}{r.impact}%</td>
                      <td style={{ padding: "8px 12px", fontFamily: "'JetBrains Mono', monospace" }}>${r.newPrice.toFixed(2)}</td>
                      <td style={{ padding: "8px 12px", fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, color: r.pnl >= 0 ? "#22c55e" : "#ef4444" }}>{r.pnl >= 0 ? "+" : ""}${r.pnl.toFixed(0)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Factor Exposure */}
      {subtab === "factors" && riskMetrics && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <div style={{ background: card, border: `1px solid ${bdr}`, borderRadius: 10, padding: 16 }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 12, margin: "0 0 12px" }}>Factor Exposure</h3>
            {Object.entries(riskMetrics.factors).sort((a: any, b: any) => b[1] - a[1]).map(([factor, weight]: any) => (
              <div key={factor} style={{ marginBottom: 10 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 4 }}>
                  <span style={{ fontWeight: 600 }}>{factor}</span>
                  <span style={{ fontFamily: "'JetBrains Mono', monospace" }}>{weight.toFixed(1)}%</span>
                </div>
                <div style={{ height: 6, borderRadius: 3, background: dark ? "#1e1e2e" : "#e5e7eb" }}>
                  <div style={{ height: 6, borderRadius: 3, width: `${weight}%`, background: weight > 40 ? "#ef4444" : weight > 25 ? "#f59e0b" : "#22c55e", transition: "width 0.3s" }} />
                </div>
              </div>
            ))}
            {riskMetrics.factors["AI Capex"] > 40 && (
              <div style={{ marginTop: 12, padding: "8px 12px", borderRadius: 6, background: dark ? "#ef444420" : "#fef2f2", border: "1px solid #ef444440", fontSize: 12, color: "#ef4444" }}>
                {"⚠️"} High concentration in AI Capex factor ({riskMetrics.factors["AI Capex"].toFixed(1)}%). Consider diversifying.
              </div>
            )}
          </div>
          <div style={{ background: card, border: `1px solid ${bdr}`, borderRadius: 10, padding: 16 }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 12, margin: "0 0 12px" }}>Sector Allocation</h3>
            {Object.entries(riskMetrics.sectors).sort((a: any, b: any) => b[1] - a[1]).map(([sector, weight]: any) => (
              <div key={sector} style={{ marginBottom: 10 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 4 }}>
                  <span style={{ fontWeight: 600 }}>{sector}</span>
                  <span style={{ fontFamily: "'JetBrains Mono', monospace" }}>{weight.toFixed(1)}%</span>
                </div>
                <div style={{ height: 6, borderRadius: 3, background: dark ? "#1e1e2e" : "#e5e7eb" }}>
                  <div style={{ height: 6, borderRadius: 3, width: `${weight}%`, background: "#3b82f6", transition: "width 0.3s" }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
