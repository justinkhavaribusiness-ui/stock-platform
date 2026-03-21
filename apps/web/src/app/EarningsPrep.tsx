"use client";
import { useState, useEffect, useCallback } from "react";
import { getTheme, cardStyle, labelStyle } from "./theme";

interface EarningsPrepProps { dark: boolean; BASE: string; }

export default function EarningsPrep({ dark, BASE }: EarningsPrepProps) {
  const t = getTheme(dark);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try { const r = await fetch(`${BASE}/earnings/ai-prep`); setData(await r.json()); } catch {} finally { setLoading(false); }
  }, [BASE]);

  useEffect(() => { load(); }, [load]);

  if (loading) return <div style={{ color: t.textMuted, padding: 40, textAlign: "center" }}>Loading earnings calendar with AI prep...</div>;

  const earnings = data?.earnings || [];

  return (
    <div style={{ fontFamily: t.fontBody, color: t.text }}>
      <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>Earnings Calendar + AI Prep</h2>
      <div style={{ fontSize: 12, color: t.textMuted, marginBottom: 16 }}>{earnings.length} upcoming earnings for your holdings</div>

      {earnings.length === 0 && <div style={{ color: t.textMuted, padding: 20 }}>No upcoming earnings found for portfolio holdings</div>}

      {earnings.map((e: any, i: number) => (
        <div key={i} style={{ ...cardStyle(t), padding: 16, marginBottom: 8 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
            <div>
              <span style={{ fontSize: 18, fontWeight: 700, fontFamily: t.fontMono }}>{e.ticker}</span>
              <span style={{ fontSize: 13, color: t.textMuted, marginLeft: 12 }}>${e.price}</span>
              {e.recommendation && <span style={{ fontSize: 10, fontWeight: 600, padding: "2px 6px", borderRadius: 3, marginLeft: 8, background: t.bgAlt, color: e.recommendation === "buy" ? t.green : e.recommendation === "sell" ? t.red : t.textSecondary, textTransform: "uppercase" }}>{e.recommendation}</span>}
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: t.accent }}>{e.earnings_date}</div>
              <div style={{ fontSize: 11, color: t.textMuted }}>{e.analysts} analysts</div>
            </div>
          </div>

          <div style={{ display: "flex", gap: 16, fontSize: 12, color: t.textSecondary, marginBottom: 8 }}>
            {e.pe && <span>P/E: <strong style={{ color: t.text, fontFamily: t.fontMono }}>{e.pe.toFixed(1)}</strong></span>}
            {e.forward_pe && <span>Fwd P/E: <strong style={{ color: t.text, fontFamily: t.fontMono }}>{e.forward_pe.toFixed(1)}</strong></span>}
            {e.eps_estimate && <span>EPS Est: <strong style={{ color: t.text, fontFamily: t.fontMono }}>${e.eps_estimate}</strong></span>}
          </div>

          {e.ai_prep && (
            <div style={{ padding: 12, borderRadius: t.radiusSm, background: t.bgAlt, border: `1px solid ${t.border}` }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: t.accent, textTransform: "uppercase", marginBottom: 6 }}>AI PREP NOTES</div>
              {e.ai_prep.what_to_watch && <div style={{ fontSize: 13, marginBottom: 4 }}><strong>Watch:</strong> {e.ai_prep.what_to_watch}</div>}
              {e.ai_prep.expected_move && <div style={{ fontSize: 13, marginBottom: 4 }}><strong>Expected Move:</strong> <span style={{ fontFamily: t.fontMono, color: t.yellow }}>{e.ai_prep.expected_move}</span></div>}
              {e.ai_prep.risk && <div style={{ fontSize: 13, marginBottom: 4 }}><strong>Risk:</strong> <span style={{ color: t.red }}>{e.ai_prep.risk}</span></div>}
              {e.ai_prep.action && <div style={{ fontSize: 13, fontWeight: 600, color: t.green }}>{e.ai_prep.action}</div>}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
