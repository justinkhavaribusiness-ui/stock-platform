"use client";
import { useState, useCallback } from "react";
import { getTheme, cardStyle, labelStyle, btnPrimaryStyle } from "./theme";

interface TradeReplayProps { dark: boolean; BASE: string; }

export default function TradeReplay({ dark, BASE }: TradeReplayProps) {
  const t = getTheme(dark);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const run = useCallback(async () => {
    setLoading(true); setData(null);
    try { const r = await fetch(`${BASE}/ai/trade-replay`); setData(await r.json()); } catch {} finally { setLoading(false); }
  }, [BASE]);

  const gradeColor = (grade: string) => {
    if (grade?.startsWith("A")) return t.green;
    if (grade?.startsWith("B")) return t.blue;
    if (grade?.startsWith("C")) return t.yellow;
    return t.red;
  };

  return (
    <div style={{ fontFamily: t.fontBody, color: t.text }}>
      <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>Trade Replay / Journal AI</h2>
      <div style={{ fontSize: 12, color: t.textMuted, marginBottom: 16 }}>AI-powered analysis of your trading patterns, mistakes, and behavioral insights</div>

      <button style={btnPrimaryStyle(t)} onClick={run} disabled={loading}>
        {loading ? "Analyzing your trades with Claude..." : "Run AI Trade Analysis"}
      </button>

      {loading && <div style={{ color: t.textMuted, padding: 20, fontSize: 13 }}>This may take 30-60 seconds as Claude reviews your entire trading history...</div>}

      {data && !data.parse_error && (
        <div style={{ marginTop: 20 }}>
          {/* Grade + Overview */}
          <div style={{ ...cardStyle(t), padding: 20, display: "flex", gap: 20, alignItems: "center" }}>
            <div style={{ width: 80, height: 80, borderRadius: 40, border: `3px solid ${gradeColor(data.grade)}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 36, fontWeight: 800, fontFamily: t.fontMono, color: gradeColor(data.grade) }}>
              {data.grade?.charAt(0) || "?"}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>{data.grade}</div>
              <div style={{ fontSize: 14, color: t.textSecondary }}>{data.overview}</div>
              <div style={{ fontSize: 12, color: t.textMuted, marginTop: 4 }}>{data.total_trades} closed trades | {data.open_count} open positions</div>
            </div>
          </div>

          {/* Strengths & Weaknesses */}
          <div style={{ display: "flex", gap: 12, marginTop: 12, flexWrap: "wrap" }}>
            <div style={{ ...cardStyle(t), padding: 16, flex: 1, minWidth: 280, borderLeft: `3px solid ${t.green}` }}>
              <div style={{ ...labelStyle(t), color: t.green, marginBottom: 8 }}>STRENGTHS</div>
              {data.strengths?.map((s: string, i: number) => <div key={i} style={{ fontSize: 13, color: t.text, marginBottom: 6 }}>+ {s}</div>)}
            </div>
            <div style={{ ...cardStyle(t), padding: 16, flex: 1, minWidth: 280, borderLeft: `3px solid ${t.red}` }}>
              <div style={{ ...labelStyle(t), color: t.red, marginBottom: 8 }}>WEAKNESSES</div>
              {data.weaknesses?.map((w: string, i: number) => <div key={i} style={{ fontSize: 13, color: t.text, marginBottom: 6 }}>- {w}</div>)}
            </div>
          </div>

          {/* Best & Worst Trades */}
          <div style={{ display: "flex", gap: 12, marginTop: 12, flexWrap: "wrap" }}>
            <div style={{ ...cardStyle(t), padding: 16, flex: 1, minWidth: 280 }}>
              <div style={{ ...labelStyle(t), color: t.green, marginBottom: 8 }}>BEST TRADES</div>
              {data.best_trades?.map((tr: any, i: number) => (
                <div key={i} style={{ marginBottom: 8, padding: 8, borderRadius: t.radiusSm, background: t.greenBg }}>
                  <div style={{ fontWeight: 600, fontFamily: t.fontMono, color: t.green }}>{tr.ticker || tr} {tr.pnl ? `+$${tr.pnl}` : ""}</div>
                  {tr.reason && <div style={{ fontSize: 12, color: t.textSecondary, marginTop: 2 }}>{tr.reason}</div>}
                </div>
              ))}
            </div>
            <div style={{ ...cardStyle(t), padding: 16, flex: 1, minWidth: 280 }}>
              <div style={{ ...labelStyle(t), color: t.red, marginBottom: 8 }}>WORST TRADES</div>
              {data.worst_trades?.map((tr: any, i: number) => (
                <div key={i} style={{ marginBottom: 8, padding: 8, borderRadius: t.radiusSm, background: t.redBg }}>
                  <div style={{ fontWeight: 600, fontFamily: t.fontMono, color: t.red }}>{tr.ticker || tr} {tr.pnl ? `$${tr.pnl}` : ""}</div>
                  {tr.reason && <div style={{ fontSize: 12, color: t.textSecondary, marginTop: 2 }}>{tr.reason}</div>}
                </div>
              ))}
            </div>
          </div>

          {/* Behavioral Patterns */}
          {data.behavioral_patterns?.length > 0 && (
            <div style={{ ...cardStyle(t), padding: 16, marginTop: 12 }}>
              <div style={{ ...labelStyle(t), marginBottom: 8 }}>BEHAVIORAL PATTERNS</div>
              {data.behavioral_patterns.map((p: string, i: number) => (
                <div key={i} style={{ fontSize: 13, color: t.textSecondary, marginBottom: 6, paddingLeft: 12, borderLeft: `2px solid ${t.accent}` }}>{p}</div>
              ))}
            </div>
          )}

          {/* Recommendations */}
          {data.recommendations?.length > 0 && (
            <div style={{ ...cardStyle(t), padding: 16, marginTop: 12, borderLeft: `3px solid ${t.accent}` }}>
              <div style={{ ...labelStyle(t), color: t.accent, marginBottom: 8 }}>RECOMMENDATIONS</div>
              {data.recommendations.map((r: string, i: number) => <div key={i} style={{ fontSize: 13, color: t.text, marginBottom: 6 }}>{i + 1}. {r}</div>)}
            </div>
          )}

          {/* Next Steps */}
          {data.next_steps?.length > 0 && (
            <div style={{ ...cardStyle(t), padding: 16, marginTop: 12 }}>
              <div style={{ ...labelStyle(t), marginBottom: 8 }}>IMMEDIATE NEXT STEPS</div>
              {data.next_steps.map((s: string, i: number) => <div key={i} style={{ fontSize: 13, color: t.accent, fontWeight: 600, marginBottom: 6 }}>{s}</div>)}
            </div>
          )}
        </div>
      )}

      {data?.parse_error && <div style={{ ...cardStyle(t), padding: 16, marginTop: 16, whiteSpace: "pre-wrap", fontSize: 13, color: t.textSecondary }}>{data.raw_analysis}</div>}
    </div>
  );
}
