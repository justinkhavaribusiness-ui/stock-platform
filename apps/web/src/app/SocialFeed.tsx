"use client";
import { useState, useEffect, useCallback } from "react";
import { getTheme, cardStyle, labelStyle, inputFieldStyle, btnPrimaryStyle, btnSecondaryStyle } from "./theme";

interface SocialFeedProps { dark: boolean; BASE: string; }

export default function SocialFeed({ dark, BASE }: SocialFeedProps) {
  const t = getTheme(dark);
  const [feed, setFeed] = useState<any[]>([]);
  const [signals, setSignals] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [polling, setPolling] = useState(false);
  const [pasteText, setPasteText] = useState("");
  const [parseResult, setParseResult] = useState<any>(null);
  const [twitterStatus, setTwitterStatus] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<"feed" | "paste" | "watchlist" | "settings">("feed");

  const loadFeed = useCallback(async () => {
    try {
      const r = await fetch(`${BASE}/signals/feed/timeline?limit=50`);
      const d = await r.json();
      setFeed(d.feed || []);
    } catch {}
  }, [BASE]);

  const loadWatchlist = useCallback(async () => {
    try {
      const r = await fetch(`${BASE}/signals/curated-watchlist`);
      const d = await r.json();
      setSignals(d.watchlist || []);
    } catch {}
  }, [BASE]);

  const checkTwitter = useCallback(async () => {
    try { const r = await fetch(`${BASE}/signals/twitter/status`); setTwitterStatus(await r.json()); } catch {}
  }, [BASE]);

  useEffect(() => { loadFeed(); loadWatchlist(); checkTwitter(); }, [loadFeed, loadWatchlist, checkTwitter]);

  const pollAll = async () => {
    setPolling(true);
    try {
      const r = await fetch(`${BASE}/signals/poll/following`, { method: "POST" });
      const d = await r.json();
      if (d.total_new > 0) loadFeed();
    } catch {} finally { setPolling(false); }
  };

  const pasteAndParse = async () => {
    if (!pasteText.trim()) return;
    setLoading(true);
    try {
      const r = await fetch(`${BASE}/signals/paste-signals`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: pasteText }),
      });
      const d = await r.json();
      setParseResult(d);
      setPasteText("");
      loadFeed();
      loadWatchlist();
    } catch {} finally { setLoading(false); }
  };

  const parseSingle = async () => {
    if (!pasteText.trim()) return;
    setLoading(true);
    try {
      const r = await fetch(`${BASE}/signals/parse`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: pasteText, source: "manual_paste", source_type: "manual" }),
      });
      const d = await r.json();
      setParseResult(d);
      setPasteText("");
      loadFeed();
      loadWatchlist();
    } catch {} finally { setLoading(false); }
  };

  const actionColor = (a: string) => {
    if (a === "BUY") return t.green;
    if (a === "SELL") return t.red;
    if (a === "WATCH") return t.yellow;
    return t.textMuted;
  };

  const priorityLabel = (p: number) => p === 0 ? "TOP" : p === 1 ? "HIGH" : "MED";
  const priorityColor = (p: number) => p === 0 ? t.green : p === 1 ? t.accent : t.textMuted;

  const tabs = [
    { id: "feed" as const, label: "Live Feed", icon: "📡" },
    { id: "paste" as const, label: "Paste & Parse", icon: "📋" },
    { id: "watchlist" as const, label: "Signal Watchlist", icon: "🎯" },
    { id: "settings" as const, label: "Settings", icon: "⚙️" },
  ];

  return (
    <div style={{ fontFamily: t.fontBody, color: t.text }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 2 }}>Social Signal Feed</h2>
          <div style={{ fontSize: 12, color: t.textMuted }}>Trade signals from X/Twitter, Discord, and manual sources — AI-parsed by Claude</div>
        </div>
        <button style={{ ...btnPrimaryStyle(t), opacity: polling ? 0.5 : 1 }} onClick={pollAll} disabled={polling}>
          {polling ? "Polling..." : "Poll All Feeds"}
        </button>
      </div>

      {/* Sub-tabs */}
      <div style={{ display: "flex", gap: 6, marginBottom: 16 }}>
        {tabs.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            style={{ padding: "8px 14px", borderRadius: t.radiusSm, fontSize: 12, fontWeight: 600, cursor: "pointer", border: `1px solid ${t.border}`, fontFamily: t.fontBody, background: activeTab === tab.id ? t.accent : t.bgCard, color: activeTab === tab.id ? "#fff" : t.textSecondary }}>
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* LIVE FEED */}
      {activeTab === "feed" && (
        <div>
          {feed.length === 0 && (
            <div style={{ ...cardStyle(t), padding: 24, textAlign: "center", color: t.textMuted }}>
              <div style={{ fontSize: 16, marginBottom: 8 }}>No signals yet</div>
              <div style={{ fontSize: 12 }}>Click "Poll All Feeds" to fetch tweets, or use "Paste & Parse" to manually add signals from X/Twitter posts.</div>
            </div>
          )}
          {feed.map((sig: any, i: number) => (
            <div key={i} style={{ ...cardStyle(t), padding: 14, borderLeft: `3px solid ${actionColor(sig.action || "")}` }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6, flexWrap: "wrap" }}>
                <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 3, background: priorityColor(sig.priority || 5) + "22", color: priorityColor(sig.priority || 5) }}>{priorityLabel(sig.priority || 5)}</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: t.accent }}>{sig.source_label || sig.source || "Unknown"}</span>
                {sig.ticker && sig.ticker !== "UNKNOWN" && (
                  <span style={{ fontWeight: 700, fontFamily: t.fontMono, fontSize: 14, color: t.text }}>${sig.ticker}</span>
                )}
                {sig.action && sig.action !== "UNKNOWN" && (
                  <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 6px", borderRadius: 3, background: actionColor(sig.action) + "22", color: actionColor(sig.action) }}>{sig.action}</span>
                )}
                {sig.confidence > 0 && (
                  <span style={{ fontSize: 10, color: t.textMuted }}>{Math.round(sig.confidence * 100)}% conf</span>
                )}
                <span style={{ fontSize: 10, color: t.textMuted, marginLeft: "auto" }}>{sig.timestamp ? new Date(sig.timestamp).toLocaleString() : ""}</span>
              </div>
              {sig.thesis && <div style={{ fontSize: 13, color: t.textSecondary, marginBottom: 4 }}>{sig.thesis}</div>}
              {sig.raw_text && <div style={{ fontSize: 12, color: t.textMuted, fontStyle: "italic", borderLeft: `2px solid ${t.border}`, paddingLeft: 8 }}>{sig.raw_text.substring(0, 200)}{sig.raw_text.length > 200 ? "..." : ""}</div>}
              <div style={{ display: "flex", gap: 12, marginTop: 6, fontSize: 11, color: t.textMuted }}>
                {sig.entry_target > 0 && <span>Entry: <strong style={{ color: t.green, fontFamily: t.fontMono }}>${sig.entry_target}</strong></span>}
                {sig.price_target > 0 && <span>Target: <strong style={{ color: t.accent, fontFamily: t.fontMono }}>${sig.price_target}</strong></span>}
                {sig.stop_loss > 0 && <span>Stop: <strong style={{ color: t.red, fontFamily: t.fontMono }}>${sig.stop_loss}</strong></span>}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* PASTE & PARSE */}
      {activeTab === "paste" && (
        <div>
          <div style={{ ...cardStyle(t), padding: 16 }}>
            <div style={{ ...labelStyle(t), marginBottom: 8 }}>PASTE TWEETS OR TRADE IDEAS</div>
            <div style={{ fontSize: 12, color: t.textMuted, marginBottom: 12 }}>
              Copy tweets from X/Twitter, Discord messages, or Substack posts. Claude will extract tickers, sentiment, entry/target/stop levels, and create trade signals.
            </div>
            <textarea
              style={{ ...inputFieldStyle(t), width: "100%", height: 150, resize: "vertical" }}
              value={pasteText}
              onChange={e => setPasteText(e.target.value)}
              placeholder={"Paste one or more tweets/posts here...\n\nExample:\n@MispricedAssets: COHR looking incredibly cheap at $250. InP wafer transition is real, datacenter revenue 2x LITE. PT $400.\n\n@unusual_whales: Large SOFI call sweep: 5000x Jan 2027 $25C at $2.50. Bullish flow."}
            />
            <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
              <button style={btnPrimaryStyle(t)} onClick={parseSingle} disabled={loading}>
                {loading ? "Parsing..." : "Parse Single Post"}
              </button>
              <button style={btnSecondaryStyle(t)} onClick={pasteAndParse} disabled={loading}>
                Parse Multiple Posts
              </button>
            </div>
          </div>

          {parseResult && (
            <div style={{ ...cardStyle(t), padding: 16, marginTop: 12, borderLeft: `3px solid ${t.green}` }}>
              <div style={{ ...labelStyle(t), color: t.green, marginBottom: 8 }}>PARSED SIGNAL</div>
              {parseResult.ticker && <div style={{ fontSize: 16, fontWeight: 700, fontFamily: t.fontMono, marginBottom: 4 }}>${parseResult.ticker} — {parseResult.action}</div>}
              {parseResult.thesis && <div style={{ fontSize: 13, color: t.textSecondary, marginBottom: 4 }}>{parseResult.thesis}</div>}
              <div style={{ fontSize: 12, color: t.textMuted }}>
                Confidence: {Math.round((parseResult.confidence || 0) * 100)}% | Source: {parseResult.source || "manual"}
              </div>
            </div>
          )}

          <div style={{ ...cardStyle(t), padding: 16, marginTop: 16 }}>
            <div style={{ ...labelStyle(t), marginBottom: 8 }}>HOW TO USE</div>
            <div style={{ fontSize: 13, color: t.textSecondary, lineHeight: 1.8 }}>
              <div><strong>From X/Twitter:</strong> Copy the tweet text → paste here → Claude extracts the trade signal</div>
              <div><strong>From Discord:</strong> Copy messages from #market-discussion → paste → auto-parse</div>
              <div><strong>From Substack:</strong> Copy trade thesis paragraphs → paste → signal created</div>
              <div><strong>Multiple posts:</strong> Paste several posts separated by blank lines → "Parse Multiple" processes all</div>
            </div>
          </div>
        </div>
      )}

      {/* SIGNAL WATCHLIST */}
      {activeTab === "watchlist" && (
        <div>
          {signals.length === 0 && (
            <div style={{ ...cardStyle(t), padding: 20, textAlign: "center", color: t.textMuted }}>No signal-derived watchlist items yet. Poll feeds or paste signals to build the watchlist.</div>
          )}
          {signals.map((s: any, i: number) => (
            <div key={i} style={{ ...cardStyle(t), padding: 14 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 18, fontWeight: 700, fontFamily: t.fontMono }}>{s.ticker}</span>
                  <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 3, background: actionColor(s.consensus_action || "") + "22", color: actionColor(s.consensus_action || "") }}>{s.consensus_action}</span>
                  <span style={{ fontSize: 11, color: t.textMuted }}>{s.signal_count} signals from {s.sources?.join(", ")}</span>
                </div>
                <span style={{ fontSize: 14, fontWeight: 600, fontFamily: t.fontMono, color: t.accent }}>{Math.round((s.avg_confidence || 0) * 100)}%</span>
              </div>
              {s.best_thesis && <div style={{ fontSize: 13, color: t.textSecondary }}>{s.best_thesis}</div>}
              <div style={{ display: "flex", gap: 12, marginTop: 4, fontSize: 11 }}>
                {s.entry_target > 0 && <span style={{ color: t.textMuted }}>Entry: <strong style={{ color: t.green, fontFamily: t.fontMono }}>${s.entry_target}</strong></span>}
                {s.price_target > 0 && <span style={{ color: t.textMuted }}>Target: <strong style={{ color: t.accent, fontFamily: t.fontMono }}>${s.price_target}</strong></span>}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* SETTINGS */}
      {activeTab === "settings" && (
        <div>
          <div style={{ ...cardStyle(t), padding: 16, borderLeft: `3px solid ${twitterStatus?.configured ? t.green : t.yellow}` }}>
            <div style={{ ...labelStyle(t), marginBottom: 8 }}>TWITTER/X API STATUS</div>
            <div style={{ fontSize: 13, color: twitterStatus?.configured ? t.green : t.yellow, fontWeight: 600 }}>
              {twitterStatus?.configured ? "Connected — auto-polling available" : "Not configured — using paste mode"}
            </div>
            <div style={{ fontSize: 12, color: t.textMuted, marginTop: 4 }}>
              {twitterStatus?.configured
                ? `Authenticated as @${twitterStatus.authenticated_as || "app"} | ${twitterStatus.accounts} accounts tracked`
                : "To enable auto-polling: get a Twitter Bearer Token from developer.twitter.com and add it as TWITTER_BEARER_TOKEN in Render env vars"}
            </div>
          </div>

          <div style={{ ...cardStyle(t), padding: 16, marginTop: 12 }}>
            <div style={{ ...labelStyle(t), marginBottom: 8 }}>FOLLOWED ACCOUNTS</div>
            {[
              { handle: "MispricedAssets", label: "Mispriced Assets (Nick Nemeth)", priority: "TOP" },
              { handle: "aleabitoreddit", label: "Serenity", priority: "TOP" },
              { handle: "unusual_whales", label: "Unusual Whales", priority: "HIGH" },
              { handle: "DeItaone", label: "Walter Bloomberg", priority: "HIGH" },
              { handle: "Mr_Derivatives", label: "Mr. Derivatives", priority: "HIGH" },
              { handle: "OptionsHawk", label: "Options Hawk", priority: "HIGH" },
              { handle: "jimcramer", label: "Jim Cramer (inverse)", priority: "MED" },
            ].map((acct, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 0", borderBottom: `1px solid ${t.borderLight}`, fontSize: 13 }}>
                <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 6px", borderRadius: 3, background: acct.priority === "TOP" ? t.greenBg : acct.priority === "HIGH" ? t.blueBg : t.bgAlt, color: acct.priority === "TOP" ? t.green : acct.priority === "HIGH" ? t.accent : t.textMuted }}>{acct.priority}</span>
                <span style={{ fontWeight: 600 }}>@{acct.handle}</span>
                <span style={{ color: t.textMuted }}>{acct.label}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
