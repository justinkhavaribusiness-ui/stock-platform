"use client";
import { useState, useEffect, useCallback } from "react";
import { getTheme, cardStyle, labelStyle } from "./theme";

interface InstitutionalProps { dark: boolean; BASE: string; }

type SubTab = "ivhv" | "putcall" | "insiders" | "short";

export default function Institutional({ dark, BASE }: InstitutionalProps) {
  const t = getTheme(dark);
  const [sub, setSub] = useState<SubTab>("ivhv");
  const [ivhv, setIvhv] = useState<any>(null);
  const [putcall, setPutcall] = useState<any>(null);
  const [insiders, setInsiders] = useState<any>(null);
  const [shortInt, setShortInt] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async (tab: SubTab) => {
    setLoading(true);
    try {
      const endpoints: Record<SubTab, string> = {
        ivhv: "/institutional/iv-hv",
        putcall: "/institutional/put-call",
        insiders: "/institutional/insiders",
        short: "/institutional/short-interest",
      };
      const r = await fetch(`${BASE}${endpoints[tab]}`);
      const d = await r.json();
      if (tab === "ivhv") setIvhv(d);
      else if (tab === "putcall") setPutcall(d);
      else if (tab === "insiders") setInsiders(d);
      else setShortInt(d);
    } catch {} finally { setLoading(false); }
  }, [BASE]);

  useEffect(() => { load(sub); }, [sub, load]);

  const tabs: { id: SubTab; label: string; icon: string }[] = [
    { id: "ivhv", label: "IV vs HV", icon: "📊" },
    { id: "putcall", label: "Put/Call", icon: "⚖️" },
    { id: "insiders", label: "Insiders", icon: "👤" },
    { id: "short", label: "Short Interest", icon: "📉" },
  ];

  const signalBg = (s: string) => s === "RICH" || s === "BULLISH" || s === "bullish" ? t.greenBg : s === "CHEAP" || s === "BEARISH" || s === "bearish" ? t.redBg : t.bgAlt;
  const signalColor = (s: string) => s === "RICH" || s === "BULLISH" || s === "bullish" ? t.green : s === "CHEAP" || s === "BEARISH" || s === "bearish" ? t.red : t.textMuted;

  return (
    <div style={{ fontFamily: t.fontBody, color: t.text }}>
      <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>Institutional Analytics</h2>
      <div style={{ fontSize: 12, color: t.textMuted, marginBottom: 16 }}>Professional-grade market data for your portfolio</div>

      {/* Sub-tabs */}
      <div style={{ display: "flex", gap: 6, marginBottom: 16 }}>
        {tabs.map(tab => (
          <button key={tab.id} onClick={() => setSub(tab.id)}
            style={{ padding: "8px 14px", borderRadius: t.radiusSm, fontSize: 12, fontWeight: 600, cursor: "pointer", border: `1px solid ${t.border}`, fontFamily: t.fontBody, background: sub === tab.id ? t.accent : t.bgCard, color: sub === tab.id ? "#fff" : t.textSecondary }}>
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {loading && <div style={{ color: t.textMuted, padding: 20, textAlign: "center" }}>Loading... (scanning all positions, may take 30s)</div>}

      {/* IV vs HV */}
      {sub === "ivhv" && ivhv && !loading && (
        <div>
          <div style={{ display: "flex", gap: 12, marginBottom: 16 }}>
            <div style={{ ...cardStyle(t), padding: 14, flex: 1, textAlign: "center", borderTop: `3px solid ${t.green}` }}>
              <div style={labelStyle(t)}>Rich Premium</div>
              <div style={{ fontSize: 28, fontWeight: 700, fontFamily: t.fontMono, color: t.green }}>{ivhv.rich_count}</div>
              <div style={{ fontSize: 11, color: t.textMuted }}>sell CCs on these</div>
            </div>
            <div style={{ ...cardStyle(t), padding: 14, flex: 1, textAlign: "center", borderTop: `3px solid ${t.red}` }}>
              <div style={labelStyle(t)}>Cheap Premium</div>
              <div style={{ fontSize: 28, fontWeight: 700, fontFamily: t.fontMono, color: t.red }}>{ivhv.cheap_count}</div>
              <div style={{ fontSize: 11, color: t.textMuted }}>hold, don't sell</div>
            </div>
          </div>
          <div style={{ ...cardStyle(t), padding: 0, overflow: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
              <thead><tr style={{ background: t.bgAlt }}>{["Ticker", "Price", "IV%", "HV20%", "IV/HV", "Signal", "Action"].map(h => <th key={h} style={{ padding: "8px 10px", textAlign: "right", fontWeight: 600, color: t.textSecondary, fontSize: 10, textTransform: "uppercase", borderBottom: `1px solid ${t.border}` }}>{h}</th>)}</tr></thead>
              <tbody>
                {(ivhv.positions || []).map((r: any, i: number) => (
                  <tr key={i} style={{ borderBottom: `1px solid ${t.borderLight}`, background: r.premium_signal === "RICH" ? t.greenBg + "44" : r.premium_signal === "CHEAP" ? t.redBg + "44" : "transparent" }}>
                    <td style={{ padding: "8px 10px", textAlign: "left", fontWeight: 700, fontFamily: t.fontMono }}>{r.ticker}</td>
                    <td style={{ padding: "8px 10px", textAlign: "right", fontFamily: t.fontMono }}>${r.price}</td>
                    <td style={{ padding: "8px 10px", textAlign: "right", fontFamily: t.fontMono, fontWeight: 600 }}>{r.iv ?? "—"}</td>
                    <td style={{ padding: "8px 10px", textAlign: "right", fontFamily: t.fontMono }}>{r.hv20 ?? "—"}</td>
                    <td style={{ padding: "8px 10px", textAlign: "right", fontFamily: t.fontMono, fontWeight: 600, color: (r.iv_hv_ratio || 0) > 1.2 ? t.green : (r.iv_hv_ratio || 0) < 0.8 ? t.red : t.text }}>{r.iv_hv_ratio ?? "—"}</td>
                    <td style={{ padding: "8px 10px", textAlign: "center" }}><span style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 3, background: signalBg(r.premium_signal || ""), color: signalColor(r.premium_signal || "") }}>{r.premium_signal || "—"}</span></td>
                    <td style={{ padding: "8px 10px", textAlign: "right", fontSize: 11, color: t.textSecondary }}>{r.action}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Put/Call Ratio */}
      {sub === "putcall" && putcall && !loading && (
        <div style={{ ...cardStyle(t), padding: 0, overflow: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
            <thead><tr style={{ background: t.bgAlt }}>{["Ticker", "Price", "P/C Vol", "P/C OI", "Max Pain", "Distance", "Sentiment", "Dealer Signal"].map(h => <th key={h} style={{ padding: "8px 8px", textAlign: "right", fontWeight: 600, color: t.textSecondary, fontSize: 10, textTransform: "uppercase", borderBottom: `1px solid ${t.border}`, whiteSpace: "nowrap" }}>{h}</th>)}</tr></thead>
            <tbody>
              {(putcall.positions || []).map((r: any, i: number) => (
                <tr key={i} style={{ borderBottom: `1px solid ${t.borderLight}` }}>
                  <td style={{ padding: "8px", textAlign: "left", fontWeight: 700, fontFamily: t.fontMono }}>{r.ticker}</td>
                  <td style={{ padding: "8px", textAlign: "right", fontFamily: t.fontMono }}>${r.price}</td>
                  <td style={{ padding: "8px", textAlign: "right", fontFamily: t.fontMono, fontWeight: 600, color: r.pc_ratio_volume > 1 ? t.red : t.green }}>{r.pc_ratio_volume}</td>
                  <td style={{ padding: "8px", textAlign: "right", fontFamily: t.fontMono }}>{r.pc_ratio_oi}</td>
                  <td style={{ padding: "8px", textAlign: "right", fontFamily: t.fontMono, color: t.yellow }}>${r.max_pain || "—"}</td>
                  <td style={{ padding: "8px", textAlign: "right", fontFamily: t.fontMono, fontSize: 11 }}>{r.max_pain_distance != null ? `${r.max_pain_distance}%` : "—"}</td>
                  <td style={{ padding: "8px", textAlign: "center" }}><span style={{ fontSize: 10, fontWeight: 700, padding: "2px 6px", borderRadius: 3, background: signalBg(r.sentiment), color: signalColor(r.sentiment) }}>{r.sentiment}</span></td>
                  <td style={{ padding: "8px", textAlign: "right", fontSize: 10, color: t.textSecondary, maxWidth: 200 }}>{r.dealer_signal}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Insiders */}
      {sub === "insiders" && insiders && !loading && (
        <div>
          {(insiders.summary || []).length > 0 && (
            <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
              {insiders.summary.map((s: any, i: number) => (
                <div key={i} style={{ ...cardStyle(t), padding: 12, minWidth: 120, borderLeft: `3px solid ${signalColor(s.signal)}` }}>
                  <div style={{ fontWeight: 700, fontFamily: t.fontMono, fontSize: 14 }}>{s.ticker}</div>
                  <div style={{ fontSize: 11, color: t.textMuted }}>{s.buys} buys, {s.sells} sells</div>
                  <div style={{ fontFamily: t.fontMono, fontWeight: 600, color: signalColor(s.signal), fontSize: 13 }}>
                    {s.net_value >= 0 ? "+" : ""}${(s.net_value / 1000).toFixed(0)}K net
                  </div>
                </div>
              ))}
            </div>
          )}
          <div style={{ ...cardStyle(t), padding: 0, overflow: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
              <thead><tr style={{ background: t.bgAlt }}>{["Ticker", "Insider", "Type", "Shares", "Value", "Date", "Signal"].map(h => <th key={h} style={{ padding: "8px 10px", textAlign: "right", fontWeight: 600, color: t.textSecondary, fontSize: 10, textTransform: "uppercase", borderBottom: `1px solid ${t.border}` }}>{h}</th>)}</tr></thead>
              <tbody>
                {(insiders.transactions || []).map((r: any, i: number) => (
                  <tr key={i} style={{ borderBottom: `1px solid ${t.borderLight}` }}>
                    <td style={{ padding: "6px 10px", textAlign: "left", fontWeight: 700, fontFamily: t.fontMono }}>{r.ticker}</td>
                    <td style={{ padding: "6px 10px", textAlign: "left", fontSize: 11, color: t.textSecondary }}>{r.insider}</td>
                    <td style={{ padding: "6px 10px", textAlign: "left", fontSize: 10, color: t.textMuted }}>{r.transaction}</td>
                    <td style={{ padding: "6px 10px", textAlign: "right", fontFamily: t.fontMono }}>{r.shares?.toLocaleString()}</td>
                    <td style={{ padding: "6px 10px", textAlign: "right", fontFamily: t.fontMono }}>${r.value?.toLocaleString()}</td>
                    <td style={{ padding: "6px 10px", textAlign: "right", fontSize: 11, color: t.textMuted }}>{r.date}</td>
                    <td style={{ padding: "6px 10px", textAlign: "center" }}><span style={{ fontSize: 9, fontWeight: 700, padding: "2px 6px", borderRadius: 3, background: signalBg(r.signal), color: signalColor(r.signal) }}>{r.signal}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Short Interest */}
      {sub === "short" && shortInt && !loading && (
        <div style={{ ...cardStyle(t), padding: 0, overflow: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
            <thead><tr style={{ background: t.bgAlt }}>{["Ticker", "Price", "Short % Float", "Days to Cover", "SI Change", "Squeeze Signal"].map(h => <th key={h} style={{ padding: "8px 10px", textAlign: "right", fontWeight: 600, color: t.textSecondary, fontSize: 10, textTransform: "uppercase", borderBottom: `1px solid ${t.border}` }}>{h}</th>)}</tr></thead>
            <tbody>
              {(shortInt.positions || []).map((r: any, i: number) => (
                <tr key={i} style={{ borderBottom: `1px solid ${t.borderLight}`, background: r.squeeze_signal === "HIGH SQUEEZE POTENTIAL" ? t.greenBg + "44" : "transparent" }}>
                  <td style={{ padding: "8px 10px", textAlign: "left", fontWeight: 700, fontFamily: t.fontMono }}>{r.ticker}</td>
                  <td style={{ padding: "8px 10px", textAlign: "right", fontFamily: t.fontMono }}>${r.price}</td>
                  <td style={{ padding: "8px 10px", textAlign: "right", fontFamily: t.fontMono, fontWeight: 600, color: (r.short_pct_float || 0) > 15 ? t.red : t.text }}>{r.short_pct_float ?? "—"}%</td>
                  <td style={{ padding: "8px 10px", textAlign: "right", fontFamily: t.fontMono }}>{r.short_ratio ?? "—"}</td>
                  <td style={{ padding: "8px 10px", textAlign: "right", fontFamily: t.fontMono, color: (r.si_change_pct || 0) > 0 ? t.red : t.green }}>{r.si_change_pct != null ? `${r.si_change_pct > 0 ? "+" : ""}${r.si_change_pct}%` : "—"}</td>
                  <td style={{ padding: "8px 10px", textAlign: "center" }}>
                    {r.squeeze_signal && <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 3, background: r.squeeze_signal.includes("HIGH") ? t.greenBg : t.bgAlt, color: r.squeeze_signal.includes("HIGH") ? t.green : t.textMuted }}>{r.squeeze_signal}</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
