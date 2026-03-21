"use client";
import { useState, useEffect, useCallback } from "react";
import { getTheme, cardStyle, labelStyle, inputFieldStyle, btnPrimaryStyle, type Theme } from "./theme";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

interface MarginTrackerProps { dark: boolean; BASE: string; }

export default function MarginTracker({ dark, BASE }: MarginTrackerProps) {
  const t = getTheme(dark);
  const [balance, setBalance] = useState("");
  const [rate, setRate] = useState("11.825");
  const [current, setCurrent] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [analysis, setAnalysis] = useState<any>(null);

  const load = useCallback(async () => {
    try {
      const [mr, ma] = await Promise.all([
        fetch(`${BASE}/margin`).then(r => r.json()),
        fetch(`${BASE}/margin/analysis`).then(r => r.json()),
      ]);
      setCurrent(mr.current);
      setHistory(mr.history || []);
      setAnalysis(ma);
      if (mr.current) {
        setBalance(String(mr.current.balance));
        setRate(String(mr.current.rate));
      }
    } catch {}
  }, [BASE]);

  useEffect(() => { load(); }, [load]);

  const save = async () => {
    if (!balance) return;
    const r = await fetch(`${BASE}/margin`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ balance: parseFloat(balance), rate: parseFloat(rate) }),
    });
    const d = await r.json();
    setCurrent(d);
    load();
  };

  const CostCard = ({ label, value, sub }: { label: string; value: string; sub?: string }) => (
    <div style={{ ...cardStyle(t), padding: 16, flex: 1, minWidth: 140, textAlign: "center" }}>
      <div style={labelStyle(t)}>{label}</div>
      <div style={{ fontSize: 26, fontWeight: 700, fontFamily: t.fontMono, color: t.red, marginTop: 6 }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: t.textMuted, marginTop: 2 }}>{sub}</div>}
    </div>
  );

  const historyData = history.map((h: any, i: number) => ({
    idx: i,
    balance: h.balance,
    date: h.timestamp ? new Date(h.timestamp).toLocaleDateString() : `${i}`,
  }));

  return (
    <div style={{ fontFamily: t.fontBody, color: t.text }}>
      <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 16 }}>Margin & Interest Tracker</h2>

      {/* Input */}
      <div style={{ ...cardStyle(t), padding: 16, display: "flex", gap: 12, alignItems: "flex-end", flexWrap: "wrap" }}>
        <div>
          <div style={{ ...labelStyle(t), marginBottom: 4 }}>Margin Balance ($)</div>
          <input style={{ ...inputFieldStyle(t), width: 160 }} value={balance} onChange={e => setBalance(e.target.value)} placeholder="e.g. 3756" />
        </div>
        <div>
          <div style={{ ...labelStyle(t), marginBottom: 4 }}>Interest Rate (%)</div>
          <input style={{ ...inputFieldStyle(t), width: 100 }} value={rate} onChange={e => setRate(e.target.value)} />
        </div>
        <button style={btnPrimaryStyle(t)} onClick={save}>Update</button>
      </div>

      {/* Interest Costs */}
      {current && (
        <>
          <div style={{ ...labelStyle(t), marginTop: 16 }}>INTEREST COST BREAKDOWN</div>
          <div style={{ display: "flex", gap: 12, marginTop: 8, flexWrap: "wrap" }}>
            <CostCard label="Daily" value={`-$${current.daily_cost?.toFixed(2)}`} sub="bleeding every day" />
            <CostCard label="Weekly" value={`-$${current.weekly_cost?.toFixed(2)}`} />
            <CostCard label="Monthly" value={`-$${current.monthly_cost?.toFixed(2)}`} sub="eating your CC income" />
            <CostCard label="Annual" value={`-$${current.annual_cost?.toFixed(2)}`} sub={`at ${current.rate}% rate`} />
          </div>
        </>
      )}

      {/* CC Income vs Margin */}
      {analysis && (
        <div style={{ ...cardStyle(t), padding: 16, marginTop: 16 }}>
          <div style={labelStyle(t)}>CC INCOME vs MARGIN COST</div>
          <div style={{ display: "flex", gap: 24, marginTop: 12, flexWrap: "wrap" }}>
            <div>
              <div style={{ fontSize: 12, color: t.textMuted }}>Avg Monthly CC Income</div>
              <div style={{ fontSize: 22, fontWeight: 700, fontFamily: t.fontMono, color: t.green }}>${analysis.avg_monthly_cc_income?.toFixed(2)}</div>
            </div>
            <div>
              <div style={{ fontSize: 12, color: t.textMuted }}>Monthly Interest Cost</div>
              <div style={{ fontSize: 22, fontWeight: 700, fontFamily: t.fontMono, color: t.red }}>-${analysis.monthly_interest?.toFixed(2)}</div>
            </div>
            <div>
              <div style={{ fontSize: 12, color: t.textMuted }}>Net Monthly</div>
              <div style={{ fontSize: 22, fontWeight: 700, fontFamily: t.fontMono, color: analysis.net_monthly >= 0 ? t.green : t.red }}>
                {analysis.net_monthly >= 0 ? "+" : ""}${analysis.net_monthly?.toFixed(2)}
              </div>
            </div>
            <div>
              <div style={{ fontSize: 12, color: t.textMuted }}>Break-even CC Premium/Contract</div>
              <div style={{ fontSize: 22, fontWeight: 700, fontFamily: t.fontMono, color: t.yellow }}>${analysis.breakeven_premium_per_contract?.toFixed(2)}</div>
            </div>
          </div>
          <div style={{ marginTop: 12, padding: "8px 12px", borderRadius: t.radiusSm, background: analysis.covers_margin ? t.greenBg : t.redBg, color: analysis.covers_margin ? t.green : t.red, fontSize: 13, fontWeight: 600 }}>
            {analysis.covers_margin
              ? "CC income covers margin interest"
              : "WARNING: Margin interest exceeds CC income — you're losing money on leverage"}
          </div>
        </div>
      )}

      {/* History Chart */}
      {historyData.length > 1 && (
        <div style={{ ...cardStyle(t), padding: 16, marginTop: 16 }}>
          <div style={labelStyle(t)}>MARGIN BALANCE HISTORY</div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={historyData} margin={{ top: 10, right: 10, bottom: 0, left: 0 }}>
              <XAxis dataKey="date" style={{ fontSize: 10 }} />
              <YAxis style={{ fontSize: 10 }} tickFormatter={(v: number) => `$${v}`} />
              <Tooltip formatter={(v: number) => `$${v.toFixed(2)}`} />
              <Area type="monotone" dataKey="balance" stroke={t.red} fill={t.redBg} strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
