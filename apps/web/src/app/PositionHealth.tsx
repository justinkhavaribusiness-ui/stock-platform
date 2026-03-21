"use client";
import { useState, useEffect, useCallback } from "react";
import { getTheme, cardStyle, labelStyle, type Theme } from "./theme";

interface PositionHealthProps { dark: boolean; BASE: string; }

export default function PositionHealth({ dark, BASE }: PositionHealthProps) {
  const t = getTheme(dark);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const r = await fetch(`${BASE}/portfolio/health-scan`);
      setData(await r.json());
    } catch {} finally { setLoading(false); }
  }, [BASE]);

  useEffect(() => { load(); }, [load]);

  if (loading) return <div style={{ color: t.textMuted, padding: 40, textAlign: "center" }}>Scanning positions...</div>;
  if (!data) return <div style={{ color: t.red, padding: 40 }}>Failed to load health scan</div>;

  const s = data.summary || {};
  const catConfig: Record<string, { color: string; bg: string; icon: string }> = {
    core: { color: t.green, bg: t.greenBg, icon: "shield" },
    thesis: { color: t.blue, bg: t.blueBg, icon: "target" },
    dead_weight: { color: t.red, bg: t.redBg, icon: "trash" },
    overweight: { color: t.yellow, bg: t.yellowBg, icon: "alert" },
  };

  const SummaryCard = ({ label, count, cat }: { label: string; count: number; cat: string }) => {
    const c = catConfig[cat] || catConfig.thesis;
    return (
      <div style={{ ...cardStyle(t), padding: 16, flex: 1, minWidth: 140, textAlign: "center", borderLeft: `3px solid ${c.color}` }}>
        <div style={{ fontSize: 32, fontWeight: 700, fontFamily: getTheme(dark).fontMono, color: c.color }}>{count}</div>
        <div style={{ fontSize: 12, fontWeight: 600, color: t.textSecondary, marginTop: 4, textTransform: "uppercase" }}>{label}</div>
      </div>
    );
  };

  const PositionRow = ({ p }: { p: any }) => {
    const c = catConfig[p.category] || catConfig.thesis;
    return (
      <div style={{ ...cardStyle(t), padding: 14, display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <span style={{ fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 4, background: c.bg, color: c.color, textTransform: "uppercase", minWidth: 80, textAlign: "center" }}>
          {p.category?.replace("_", " ")}
        </span>
        <span style={{ fontWeight: 700, fontFamily: t.fontMono, fontSize: 14, minWidth: 60 }}>{p.ticker}</span>
        <span style={{ fontSize: 13, color: t.textMuted, minWidth: 80 }}>{p.shares} shares</span>
        <span style={{ fontSize: 13, fontFamily: t.fontMono, minWidth: 80 }}>${p.market_value?.toFixed(0)}</span>
        <span style={{ fontSize: 13, fontFamily: t.fontMono, color: p.pnl >= 0 ? t.green : t.red, minWidth: 80 }}>
          {p.pnl >= 0 ? "+" : ""}${p.pnl?.toFixed(0)} ({p.pnl_pct?.toFixed(1)}%)
        </span>
        <span style={{ fontSize: 12, color: t.textMuted, minWidth: 60 }}>{p.pct_of_account}%</span>
        <span style={{ fontSize: 12, color: c.color, flex: 1 }}>{p.recommendation}</span>
      </div>
    );
  };

  const sections: [string, string, any[]][] = [
    ["OVERWEIGHT POSITIONS", "overweight", data.overweight || []],
    ["DEAD WEIGHT — SELL THESE", "dead_weight", data.dead_weight || []],
    ["CORE — ACTIVE CC INCOME", "core", data.core || []],
    ["THESIS PLAYS", "thesis", data.thesis || []],
  ];

  return (
    <div style={{ fontFamily: t.fontBody, color: t.text }}>
      <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>Position Health Scanner</h2>
      <div style={{ fontSize: 12, color: t.textMuted, marginBottom: 16 }}>
        {s.total_positions} positions | ${s.total_value?.toLocaleString()} total value
      </div>

      {/* Summary */}
      <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
        <SummaryCard label="Core (CC Active)" count={s.core} cat="core" />
        <SummaryCard label="Thesis Plays" count={s.thesis} cat="thesis" />
        <SummaryCard label="Dead Weight" count={s.dead_weight} cat="dead_weight" />
        <SummaryCard label="Overweight" count={s.overweight} cat="overweight" />
      </div>

      {/* Position Lists */}
      {sections.map(([title, cat, positions]) => (
        positions.length > 0 && (
          <div key={cat} style={{ marginBottom: 20 }}>
            <div style={{ ...labelStyle(t), marginBottom: 8, color: catConfig[cat]?.color }}>{title}</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              {positions.map((p: any, i: number) => <PositionRow key={i} p={p} />)}
            </div>
          </div>
        )
      ))}
    </div>
  );
}
