"use client";
import { useState } from "react";

export default function ConferenceCalls({ dark, BASE }: { dark: boolean; BASE: string }) {
  const [selected, setSelected] = useState<any>(null);

  const bg = dark ? "#0a0a0f" : "#ffffff", card = dark ? "#111118" : "#f8f9fa";
  const bdr = dark ? "#1e1e2e" : "#e5e7eb", txt = dark ? "#f1f1f4" : "#111827";
  const txt2 = dark ? "#71717a" : "#6b7280", txtDim = dark ? "#52525b" : "#9ca3af";

  const CALLS = [
    { ticker: "COHR", date: "2025-11-05", quarter: "Q4 FY2025", title: "Coherent Corp Q4 Earnings Call",
      tone: "Confident", toneScore: 82,
      guidanceChange: "Raised", revenueGuidance: "$1.35-1.40B",
      keyQuotes: [
        { speaker: "CEO", topic: "AI Demand", text: "Management emphasized unprecedented demand from hyperscaler customers for 800G and 1.6T transceivers" },
        { speaker: "CFO", topic: "Margins", text: "Gross margins expected to expand 200-300bps as 6-inch wafer transition improves unit economics" },
        { speaker: "CEO", topic: "Capacity", text: "Noted that the company is capacity-constrained and investing $200M in new fab expansion" },
        { speaker: "Analyst Q&A", topic: "Pricing", text: "Confirmed 15-20% pricing power on differentiated InP products due to qualification barriers" },
      ],
      sentimentShifts: [
        { topic: "Datacenter Revenue", shift: "Very Bullish", detail: "Beat by 18%, guided higher" },
        { topic: "Industrial Segment", shift: "Cautious", detail: "Weakness in telecom partially offset" },
        { topic: "Gross Margins", shift: "Bullish", detail: "Expanding on mix shift to higher-value products" },
      ],
      managementTone: { confidence: 85, specificity: 78, forwardLooking: 90, hedging: 25 },
    },
    { ticker: "NVDA", date: "2025-11-20", quarter: "Q3 FY2026", title: "NVIDIA Q3 Earnings Call",
      tone: "Very Bullish", toneScore: 92,
      guidanceChange: "Raised", revenueGuidance: "$37.5B ±2%",
      keyQuotes: [
        { speaker: "CEO", topic: "Blackwell", text: "Described Blackwell demand as 'insane' with production ramping faster than any prior generation" },
        { speaker: "CFO", topic: "Data Center", text: "Data center revenue exceeded expectations driven by cloud and sovereign AI buildout" },
        { speaker: "CEO", topic: "Inference", text: "Highlighted inference as the next growth driver, potentially larger than training market" },
      ],
      sentimentShifts: [
        { topic: "Blackwell Ramp", shift: "Very Bullish", detail: "No supply constraints mentioned" },
        { topic: "Gaming", shift: "Stable", detail: "Steady but not the growth story" },
        { topic: "China", shift: "Cautious", detail: "Export restrictions creating headwinds" },
      ],
      managementTone: { confidence: 95, specificity: 72, forwardLooking: 88, hedging: 15 },
    },
    { ticker: "OSCR", date: "2025-11-07", quarter: "Q3 2025", title: "Oscar Health Q3 Earnings Call",
      tone: "Optimistic", toneScore: 75,
      guidanceChange: "Maintained", revenueGuidance: "$2.4B FY",
      keyQuotes: [
        { speaker: "CEO", topic: "ICHRA", text: "Described ICHRA as a transformational tailwind with employer adoption accelerating beyond expectations" },
        { speaker: "CFO", topic: "MLR", text: "Medical loss ratio improving quarter-over-quarter as risk adjustment models mature" },
        { speaker: "CEO", topic: "Growth", text: "Membership growth of 60% YoY driven by marketplace expansion and ICHRA penetration" },
      ],
      sentimentShifts: [
        { topic: "Membership Growth", shift: "Bullish", detail: "60% YoY, beating expectations" },
        { topic: "Profitability", shift: "Improving", detail: "Path to sustained profitability clearer" },
        { topic: "Regulatory", shift: "Neutral", detail: "Monitoring ACA subsidy cliff risk" },
      ],
      managementTone: { confidence: 72, specificity: 68, forwardLooking: 82, hedging: 35 },
    },
    { ticker: "FANG", date: "2025-11-04", quarter: "Q4 2025", title: "Diamondback Energy Q4 Earnings Call",
      tone: "Disciplined", toneScore: 70,
      guidanceChange: "Maintained", revenueGuidance: "Flat production guidance",
      keyQuotes: [
        { speaker: "CEO", topic: "Capital Returns", text: "Committed to returning 75% of free cash flow to shareholders through dividends and buybacks" },
        { speaker: "CFO", topic: "Breakevens", text: "Corporate breakeven at $40/bbl WTI, generating significant FCF at current strip pricing" },
        { speaker: "CEO", topic: "Endeavor", text: "Post-merger integration ahead of schedule with $200M in synergies realized" },
      ],
      sentimentShifts: [
        { topic: "Capital Discipline", shift: "Bullish", detail: "No growth-at-all-costs mentality" },
        { topic: "Oil Price Sensitivity", shift: "Neutral", detail: "Focused on what they control" },
        { topic: "Inventory Quality", shift: "Bullish", detail: "Tier 1 Permian inventory for 15+ years" },
      ],
      managementTone: { confidence: 78, specificity: 85, forwardLooking: 65, hedging: 30 },
    },
  ];

  const toneColor = (score: number) => score >= 80 ? "#22c55e" : score >= 60 ? "#f59e0b" : "#ef4444";
  const shiftColor = (shift: string) => shift.includes("Bull") ? "#22c55e" : shift.includes("Cauti") || shift.includes("Bear") ? "#ef4444" : "#f59e0b";

  return (
    <div style={{ display: "flex", gap: 0, minHeight: "100%", background: bg, color: txt, fontFamily: "'DM Sans', system-ui, sans-serif" }}>
      {/* Left: Call list */}
      <div style={{ width: 300, borderRight: `1px solid ${bdr}`, overflowY: "auto", padding: "16px 0" }}>
        <div style={{ padding: "0 16px 12px", fontWeight: 800, fontSize: 18 }}>{"🎙️"} Calls</div>
        {CALLS.map(c => (
          <div key={c.ticker + c.date} onClick={() => setSelected(c)} style={{
            padding: "12px 16px", cursor: "pointer", borderBottom: `1px solid ${bdr}`, borderLeft: selected === c ? `3px solid #3b82f6` : "3px solid transparent",
            background: selected === c ? (dark ? "#3b82f620" : "#dbeafe") : "transparent",
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
              <span style={{ fontWeight: 700, fontSize: 14 }}>{c.ticker}</span>
              <span style={{ fontSize: 10, padding: "2px 6px", borderRadius: 4, background: toneColor(c.toneScore) + "20", color: toneColor(c.toneScore), fontWeight: 700 }}>{c.tone}</span>
            </div>
            <div style={{ fontSize: 12, color: txt2 }}>{c.quarter} · {c.date}</div>
            <div style={{ fontSize: 11, color: txtDim, marginTop: 2 }}>Guidance: {c.guidanceChange}</div>
          </div>
        ))}
      </div>

      {/* Right: Transcript analysis */}
      <div style={{ flex: 1, padding: "16px 24px", overflowY: "auto" }}>
        {selected ? (
          <>
            <h2 style={{ fontSize: 18, fontWeight: 800, margin: "0 0 4px" }}>{selected.title}</h2>
            <p style={{ fontSize: 12, color: txt2, margin: "0 0 16px" }}>{selected.quarter} · {selected.date} · Guidance: <span style={{ fontWeight: 700, color: selected.guidanceChange === "Raised" ? "#22c55e" : "#f59e0b" }}>{selected.guidanceChange}</span> · Revenue: {selected.revenueGuidance}</p>

            {/* Tone meters */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8, marginBottom: 16 }}>
              {Object.entries(selected.managementTone).map(([key, val]: any) => (
                <div key={key} style={{ background: card, border: `1px solid ${bdr}`, borderRadius: 10, padding: "10px 12px" }}>
                  <div style={{ fontSize: 10, fontWeight: 600, color: txtDim, textTransform: "uppercase", marginBottom: 6 }}>{key}</div>
                  <div style={{ height: 6, borderRadius: 3, background: dark ? "#1e1e2e" : "#e5e7eb", marginBottom: 4 }}>
                    <div style={{ height: 6, borderRadius: 3, width: `${val}%`, background: key === "hedging" ? (val > 40 ? "#ef4444" : "#22c55e") : toneColor(val) }} />
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace" }}>{val}%</div>
                </div>
              ))}
            </div>

            {/* Key Quotes */}
            <div style={{ marginBottom: 16 }}>
              <h3 style={{ fontSize: 13, fontWeight: 700, color: txt2, textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>AI-Extracted Key Quotes</h3>
              {selected.keyQuotes.map((q: any, i: number) => (
                <div key={i} style={{ padding: "12px 14px", borderRadius: 8, background: card, border: `1px solid ${bdr}`, marginBottom: 6 }}>
                  <div style={{ display: "flex", gap: 8, marginBottom: 4 }}>
                    <span style={{ padding: "1px 6px", borderRadius: 4, fontSize: 10, fontWeight: 700, background: dark ? "#3b82f620" : "#dbeafe", color: "#3b82f6" }}>{q.speaker}</span>
                    <span style={{ fontSize: 11, fontWeight: 600, color: txt2 }}>{q.topic}</span>
                  </div>
                  <div style={{ fontSize: 13, lineHeight: 1.6 }}>{q.text}</div>
                </div>
              ))}
            </div>

            {/* Sentiment Shifts */}
            <h3 style={{ fontSize: 13, fontWeight: 700, color: txt2, textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>Sentiment Shifts</h3>
            <div style={{ display: "grid", gap: 6 }}>
              {selected.sentimentShifts.map((s: any, i: number) => (
                <div key={i} style={{ padding: "10px 14px", borderRadius: 8, background: card, border: `1px solid ${bdr}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <span style={{ fontWeight: 700, fontSize: 13 }}>{s.topic}</span>
                    <span style={{ fontSize: 12, color: txt2, marginLeft: 8 }}>{s.detail}</span>
                  </div>
                  <span style={{ padding: "2px 8px", borderRadius: 4, fontSize: 11, fontWeight: 700, background: shiftColor(s.shift) + "20", color: shiftColor(s.shift) }}>{s.shift}</span>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div style={{ textAlign: "center", padding: "80px 20px", color: txtDim }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>{"🎙️"}</div>
            <div style={{ fontSize: 16 }}>Select an earnings call to see AI analysis</div>
            <div style={{ fontSize: 13, color: txtDim, marginTop: 8 }}>Key quotes, sentiment shifts, management tone scoring</div>
          </div>
        )}
      </div>
    </div>
  );
}
