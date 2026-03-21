"use client";
import { useState, useEffect, useCallback } from "react";
import { getTheme, cardStyle, labelStyle, inputFieldStyle, btnPrimaryStyle, btnSecondaryStyle } from "./theme";

interface OptionsChainProps { dark: boolean; BASE: string; }

export default function OptionsChain({ dark, BASE }: OptionsChainProps) {
  const t = getTheme(dark);
  const [ticker, setTicker] = useState("");
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [showPuts, setShowPuts] = useState(false);

  const load = useCallback(async (tk?: string, exp?: string) => {
    const sym = (tk || ticker).trim().toUpperCase();
    if (!sym) return;
    setLoading(true);
    try {
      const url = exp ? `${BASE}/options-chain/${sym}?expiry=${exp}` : `${BASE}/options-chain/${sym}`;
      const r = await fetch(url);
      setData(await r.json());
    } catch {} finally { setLoading(false); }
  }, [BASE, ticker]);

  const chain = showPuts ? (data?.puts || []) : (data?.calls || []);
  const price = data?.stock_price;

  return (
    <div style={{ fontFamily: t.fontBody, color: t.text }}>
      <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 16 }}>Live Options Chain</h2>

      {/* Search */}
      <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap", alignItems: "flex-end" }}>
        <div>
          <div style={{ ...labelStyle(t), marginBottom: 4 }}>Ticker</div>
          <input style={{ ...inputFieldStyle(t), width: 120 }} value={ticker} onChange={e => setTicker(e.target.value.toUpperCase())} onKeyDown={e => e.key === "Enter" && load()} placeholder="SOFI" />
        </div>
        <button style={btnPrimaryStyle(t)} onClick={() => load()}>Load Chain</button>
        {data?.expirations?.length > 0 && (
          <div>
            <div style={{ ...labelStyle(t), marginBottom: 4 }}>Expiry</div>
            <select style={{ ...inputFieldStyle(t), width: 140 }} value={data.expiry} onChange={e => load(data.ticker, e.target.value)}>
              {data.expirations.map((exp: string) => <option key={exp} value={exp}>{exp}</option>)}
            </select>
          </div>
        )}
        <button style={showPuts ? btnPrimaryStyle(t) : btnSecondaryStyle(t)} onClick={() => setShowPuts(v => !v)}>
          {showPuts ? "Puts" : "Calls"}
        </button>
      </div>

      {loading && <div style={{ color: t.textMuted, padding: 20 }}>Loading chain...</div>}

      {data && !loading && (
        <>
          {/* Stock info */}
          <div style={{ ...cardStyle(t), padding: 12, display: "flex", gap: 16, alignItems: "center" }}>
            <span style={{ fontSize: 18, fontWeight: 700, fontFamily: t.fontMono }}>{data.ticker}</span>
            <span style={{ fontSize: 18, fontFamily: t.fontMono }}>${price?.toFixed(2)}</span>
            <span style={{ fontSize: 12, color: t.textMuted }}>Expiry: {data.expiry}</span>
            <span style={{ fontSize: 12, color: t.textMuted }}>{chain.length} strikes</span>
          </div>

          {/* Chain table */}
          <div style={{ ...cardStyle(t), padding: 0, overflow: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
              <thead>
                <tr style={{ background: t.bgAlt }}>
                  {["Strike", "Bid", "Ask", "Mid", "Last", "Vol", "OI", "IV%", "Delta", "$/100sh", "Ann Yield", "CC"].map(h => (
                    <th key={h} style={{ padding: "8px 6px", textAlign: "right", fontWeight: 600, color: t.textSecondary, fontSize: 10, textTransform: "uppercase", borderBottom: `1px solid ${t.border}`, whiteSpace: "nowrap" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {chain.map((row: any, i: number) => {
                  const isOptimal = row.cc_score === "optimal";
                  const isViable = row.cc_score === "viable";
                  const rowBg = isOptimal ? (dark ? "#0d2818" : "#ecfdf3") : isViable ? (dark ? "#1a2332" : "#eff6ff") : "transparent";
                  return (
                    <tr key={i} style={{ borderBottom: `1px solid ${t.borderLight}`, background: rowBg }}>
                      <td style={{ padding: "6px", textAlign: "right", fontFamily: t.fontMono, fontWeight: row.itm ? 700 : 400, color: row.itm ? t.yellow : t.text }}>{row.strike.toFixed(1)}</td>
                      <td style={{ padding: "6px", textAlign: "right", fontFamily: t.fontMono, color: t.green }}>{row.bid.toFixed(2)}</td>
                      <td style={{ padding: "6px", textAlign: "right", fontFamily: t.fontMono, color: t.red }}>{row.ask.toFixed(2)}</td>
                      <td style={{ padding: "6px", textAlign: "right", fontFamily: t.fontMono, fontWeight: 600 }}>{row.mid.toFixed(2)}</td>
                      <td style={{ padding: "6px", textAlign: "right", fontFamily: t.fontMono, color: t.textSecondary }}>{row.last.toFixed(2)}</td>
                      <td style={{ padding: "6px", textAlign: "right", fontFamily: t.fontMono, color: t.textMuted }}>{row.volume || "—"}</td>
                      <td style={{ padding: "6px", textAlign: "right", fontFamily: t.fontMono, color: t.textMuted }}>{row.open_interest || "—"}</td>
                      <td style={{ padding: "6px", textAlign: "right", fontFamily: t.fontMono }}>{row.iv}%</td>
                      <td style={{ padding: "6px", textAlign: "right", fontFamily: t.fontMono, color: t.blue }}>{row.delta_est ?? "—"}</td>
                      <td style={{ padding: "6px", textAlign: "right", fontFamily: t.fontMono, color: t.green, fontWeight: 600 }}>${row.premium_100}</td>
                      <td style={{ padding: "6px", textAlign: "right", fontFamily: t.fontMono, color: row.annual_yield > 20 ? t.green : t.textSecondary }}>{row.annual_yield}%</td>
                      <td style={{ padding: "6px", textAlign: "center" }}>
                        {isOptimal && <span style={{ fontSize: 9, fontWeight: 700, padding: "1px 5px", borderRadius: 3, background: t.green + "22", color: t.green }}>OPTIMAL</span>}
                        {isViable && <span style={{ fontSize: 9, fontWeight: 700, padding: "1px 5px", borderRadius: 3, background: t.blue + "22", color: t.blue }}>VIABLE</span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
