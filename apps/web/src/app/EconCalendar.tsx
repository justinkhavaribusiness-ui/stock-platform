"use client";
import { useState, useEffect } from "react";

export default function EconCalendar({ dark, BASE }: { dark: boolean; BASE: string }) {
  const [events, setEvents] = useState<any[]>([]);
  const [filter, setFilter] = useState<"all"|"high"|"fed"|"data">("all");
  const [now, setNow] = useState(new Date());

  const bg = dark ? "#0a0a0f" : "#ffffff", card = dark ? "#111118" : "#f8f9fa";
  const bdr = dark ? "#1e1e2e" : "#e5e7eb", txt = dark ? "#f1f1f4" : "#111827";
  const txt2 = dark ? "#71717a" : "#6b7280", txtDim = dark ? "#52525b" : "#9ca3af";

  useEffect(() => {
    const iv = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(iv);
  }, []);

  useEffect(() => {
    const today = new Date();
    const makeDate = (daysOffset: number, hour: number, min: number) => {
      const d = new Date(today); d.setDate(d.getDate() + daysOffset); d.setHours(hour, min, 0, 0); return d;
    };
    const EVENTS = [
      { name: "FOMC Rate Decision", type: "fed", impact: "high", time: makeDate(12, 14, 0), previous: "5.25-5.50%", forecast: "5.25-5.50%", actual: null, portfolioImpact: "Rates -25bps = SOFI +8%, OSCR +3%; Hold = neutral", description: "Federal Reserve interest rate decision and statement" },
      { name: "CPI (YoY)", type: "data", impact: "high", time: makeDate(5, 8, 30), previous: "3.1%", forecast: "2.9%", actual: null, portfolioImpact: "Below 3% = growth stocks rally; Above 3.5% = risk-off", description: "Consumer Price Index year-over-year inflation" },
      { name: "Non-Farm Payrolls", type: "data", impact: "high", time: makeDate(8, 8, 30), previous: "256K", forecast: "180K", actual: null, portfolioImpact: "Strong jobs = delayed cuts = SOFI pressure; Weak = rate cut hopes", description: "Monthly employment change" },
      { name: "GDP (QoQ)", type: "data", impact: "high", time: makeDate(18, 8, 30), previous: "3.3%", forecast: "2.1%", actual: null, portfolioImpact: "Above 2.5% = goldilocks; Below 1% = recession fears hit FANG, TSLA", description: "Gross Domestic Product quarterly annualized" },
      { name: "PCE Price Index", type: "fed", impact: "high", time: makeDate(15, 8, 30), previous: "2.6%", forecast: "2.5%", actual: null, portfolioImpact: "Fed's preferred inflation gauge — below 2.5% = dovish signal", description: "Personal Consumption Expenditures price index" },
      { name: "ISM Manufacturing", type: "data", impact: "medium", time: makeDate(3, 10, 0), previous: "49.3", forecast: "50.1", actual: null, portfolioImpact: "Above 50 = expansion signal, good for FANG energy thesis", description: "Institute for Supply Management manufacturing index" },
      { name: "Retail Sales", type: "data", impact: "medium", time: makeDate(10, 8, 30), previous: "0.4%", forecast: "0.3%", actual: null, portfolioImpact: "Strong consumer = AMZN bullish; Weak = defensive rotation", description: "Monthly retail sales change" },
      { name: "FOMC Minutes", type: "fed", impact: "medium", time: makeDate(20, 14, 0), previous: null, forecast: null, actual: null, portfolioImpact: "Hawkish tone = growth selloff; Dovish = tech rally", description: "Minutes from the previous FOMC meeting" },
      { name: "Initial Jobless Claims", type: "data", impact: "low", time: makeDate(1, 8, 30), previous: "218K", forecast: "220K", actual: null, portfolioImpact: "Above 250K = labor softening signal", description: "Weekly initial unemployment claims" },
      { name: "10Y Treasury Auction", type: "data", impact: "medium", time: makeDate(7, 13, 0), previous: "4.32%", forecast: null, actual: null, portfolioImpact: "Weak demand (tail) = yields up = growth pressure", description: "US Treasury 10-year note auction" },
      { name: "Michigan Consumer Sentiment", type: "data", impact: "low", time: makeDate(14, 10, 0), previous: "71.1", forecast: "70.0", actual: null, portfolioImpact: "Falling sentiment = consumer caution", description: "University of Michigan consumer sentiment survey" },
      { name: "Fed Chair Powell Speech", type: "fed", impact: "high", time: makeDate(22, 12, 0), previous: null, forecast: null, actual: null, portfolioImpact: "Any hint of rate cuts = massive rally; Hawkish = selloff", description: "Federal Reserve Chair press conference or speech" },
    ];
    EVENTS.sort((a, b) => a.time.getTime() - b.time.getTime());
    setEvents(EVENTS);
  }, []);

  const filtered = events.filter(e => {
    if (filter === "high") return e.impact === "high";
    if (filter === "fed") return e.type === "fed";
    if (filter === "data") return e.type === "data";
    return true;
  });

  const countdown = (target: Date) => {
    const diff = target.getTime() - now.getTime();
    if (diff <= 0) return "NOW";
    const d = Math.floor(diff / 86400000);
    const h = Math.floor((diff % 86400000) / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    if (d > 0) return `${d}d ${h}h`;
    return `${h}h ${m}m`;
  };

  const impactColor = (impact: string) => impact === "high" ? "#ef4444" : impact === "medium" ? "#f59e0b" : "#22c55e";

  return (
    <div style={{ padding: "16px 24px", background: bg, color: txt, fontFamily: "'DM Sans', system-ui, sans-serif", minHeight: "100%" }}>
      <h2 style={{ fontSize: 18, fontWeight: 800, margin: "0 0 16px" }}>{"🏛️"} Economic Calendar</h2>

      <div style={{ display: "flex", gap: 4, marginBottom: 16 }}>
        {(["all","high","fed","data"] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{
            padding: "6px 14px", borderRadius: 20, fontSize: 12, fontWeight: filter === f ? 700 : 500, cursor: "pointer",
            border: "none", background: filter === f ? (dark ? "#3b82f620" : "#dbeafe") : "transparent", color: filter === f ? "#3b82f6" : txt2,
          }}>{f === "all" ? "All Events" : f === "high" ? "High Impact" : f === "fed" ? "Fed Events" : "Economic Data"}</button>
        ))}
      </div>

      <div style={{ display: "grid", gap: 8 }}>
        {filtered.map((e, i) => {
          const isPast = e.time < now;
          const isSoon = !isPast && e.time.getTime() - now.getTime() < 86400000 * 2;
          return (
            <div key={i} style={{
              padding: "14px 16px", borderRadius: 10, background: card, border: `1px solid ${isSoon ? "#ef444440" : bdr}`,
              opacity: isPast ? 0.5 : 1, transition: "all 0.15s",
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                    <span style={{ width: 8, height: 8, borderRadius: "50%", background: impactColor(e.impact), display: "inline-block" }}></span>
                    <span style={{ fontWeight: 700, fontSize: 14 }}>{e.name}</span>
                    {e.type === "fed" && <span style={{ padding: "1px 6px", borderRadius: 4, fontSize: 9, fontWeight: 700, background: "#8b5cf620", color: "#8b5cf6" }}>FED</span>}
                  </div>
                  <div style={{ fontSize: 12, color: txt2 }}>{e.description}</div>
                </div>
                <div style={{ textAlign: "right", minWidth: 100 }}>
                  <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13, fontWeight: 700, color: isSoon ? "#ef4444" : txt }}>{countdown(e.time)}</div>
                  <div style={{ fontSize: 11, color: txt2 }}>{e.time.toLocaleDateString()} {e.time.toLocaleTimeString([], {hour:"2-digit",minute:"2-digit"})}</div>
                </div>
              </div>
              <div style={{ display: "flex", gap: 16, fontSize: 12, marginBottom: 6 }}>
                {e.previous && <span><span style={{ color: txtDim }}>Prev:</span> <span style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 600 }}>{e.previous}</span></span>}
                {e.forecast && <span><span style={{ color: txtDim }}>Fcst:</span> <span style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 600 }}>{e.forecast}</span></span>}
                {e.actual && <span><span style={{ color: txtDim }}>Actual:</span> <span style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, color: "#22c55e" }}>{e.actual}</span></span>}
              </div>
              <div style={{ fontSize: 11, color: txt2, padding: "6px 10px", borderRadius: 6, background: dark ? "#0a0a0f" : "#f1f5f9" }}>
                {"📊"} <strong>Portfolio Impact:</strong> {e.portfolioImpact}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
