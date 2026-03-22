"use client";
import { useState, useEffect, useCallback } from "react";
import { getTheme, cardStyle, labelStyle, inputFieldStyle, btnPrimaryStyle } from "./theme";

interface TrumpMonitorProps { dark: boolean; BASE: string; }

export default function TrumpMonitor({ dark, BASE }: TrumpMonitorProps) {
  const t = getTheme(dark);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [pasteText, setPasteText] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try { const r = await fetch(`${BASE}/trump-monitor`); setData(await r.json()); } catch {} finally { setLoading(false); }
  }, [BASE]);

  useEffect(() => { load(); const iv = setInterval(load, 120000); return () => clearInterval(iv); }, [load]);

  const addPost = async () => {
    if (!pasteText.trim()) return;
    await fetch(`${BASE}/trump-monitor/add`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text: pasteText }) });
    setPasteText("");
    load();
  };

  const a = data?.analysis || {};
  const sentColor = a.overall_sentiment === "bullish" ? t.green : a.overall_sentiment === "bearish" ? t.red : t.yellow;
  const impactColor = a.market_impact === "high" ? t.red : a.market_impact === "medium" ? t.yellow : t.textMuted;

  return (
    <div style={{ fontFamily: t.fontBody, color: t.text }}>
      <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>Trump Truth Social Monitor</h2>
      <div style={{ fontSize: 12, color: t.textMuted, marginBottom: 16 }}>AI-analyzed market impact from presidential posts | Auto-refresh 2min</div>

      {/* AI Analysis Banner */}
      {a.overall_sentiment && (
        <div style={{ ...cardStyle(t), padding: 20, borderLeft: `5px solid ${sentColor}`, marginBottom: 16, background: a.urgency === "immediate" ? t.redBg : "transparent" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
            <span style={{ fontSize: 24, fontWeight: 800, color: sentColor, textTransform: "uppercase", fontFamily: t.fontMono }}>{a.overall_sentiment}</span>
            <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 4, background: impactColor + "22", color: impactColor, textTransform: "uppercase" }}>
              {a.market_impact} IMPACT
            </span>
            {a.urgency === "immediate" && <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 4, background: t.red + "22", color: t.red, textTransform: "uppercase" }}>IMMEDIATE</span>}
          </div>
          <div style={{ fontSize: 14, fontWeight: 600, color: t.text, marginBottom: 8 }}>{a.summary}</div>
          {a.key_topics?.length > 0 && (
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 8 }}>
              {a.key_topics.map((topic: string, i: number) => (
                <span key={i} style={{ fontSize: 10, padding: "2px 8px", borderRadius: 4, background: t.bgAlt, color: t.textSecondary }}>{topic}</span>
              ))}
            </div>
          )}
          {a.trade_signals?.length > 0 && (
            <div style={{ marginTop: 8 }}>
              {a.trade_signals.map((s: any, i: number) => (
                <div key={i} style={{ fontSize: 13, marginBottom: 4, display: "flex", gap: 8, alignItems: "center" }}>
                  <span style={{ fontWeight: 700, fontFamily: t.fontMono, color: s.direction === "bullish" ? t.green : t.red }}>{s.ticker}</span>
                  <span style={{ fontSize: 10, fontWeight: 600, padding: "1px 6px", borderRadius: 3, background: (s.direction === "bullish" ? t.green : t.red) + "22", color: s.direction === "bullish" ? t.green : t.red }}>{s.direction}</span>
                  <span style={{ color: t.textSecondary }}>{s.signal}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Paste a post */}
      <div style={{ ...cardStyle(t), padding: 14, marginBottom: 16 }}>
        <div style={{ ...labelStyle(t), marginBottom: 6 }}>PASTE TRUMP POST FOR ANALYSIS</div>
        <div style={{ display: "flex", gap: 8 }}>
          <textarea style={{ ...inputFieldStyle(t), flex: 1, height: 60 }} value={pasteText} onChange={e => setPasteText(e.target.value)} placeholder="Paste a Truth Social post here..." />
          <button style={{ ...btnPrimaryStyle(t), alignSelf: "flex-end" }} onClick={addPost}>Analyze</button>
        </div>
      </div>

      {/* Posts */}
      <div style={{ ...labelStyle(t), marginBottom: 8 }}>RECENT POSTS ({data?.post_count || 0})</div>
      {(data?.posts || []).length === 0 && !loading && (
        <div style={{ ...cardStyle(t), padding: 20, textAlign: "center", color: t.textMuted }}>
          No posts available. Paste a Trump post above to analyze it, or posts will auto-fetch when available.
        </div>
      )}
      {(data?.posts || []).map((post: any, i: number) => (
        <div key={i} style={{ ...cardStyle(t), padding: 14 }}>
          <div style={{ fontSize: 13, color: t.text, lineHeight: 1.6, marginBottom: 6 }}>{post.text}</div>
          <div style={{ fontSize: 10, color: t.textMuted }}>{post.created_at ? new Date(post.created_at).toLocaleString() : ""} {post.source === "manual" ? " (manually added)" : ""}</div>
        </div>
      ))}

      {loading && <div style={{ color: t.textMuted, padding: 20, textAlign: "center" }}>Loading...</div>}
    </div>
  );
}
