"use client";
import { useState, useEffect, useRef } from "react";

interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp: number;
}

export default function AIChat({ dark, BASE }: { dark: boolean; BASE: string }) {
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: "I'm your AI trading analyst. I have access to your portfolio, watchlist, and live market data. Ask me anything — trade ideas, risk analysis, earnings prep, options strategies, or sector breakdowns.", timestamp: Date.now() }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [context, setContext] = useState<any>(null);
  const [expanded, setExpanded] = useState(true);
  const [activePreset, setActivePreset] = useState<string|null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Load market context for AI
  useEffect(() => {
    const loadContext = async () => {
      try {
        const [quotesRes, macroRes] = await Promise.all([
          fetch(`${BASE}/quotes?tickers=SPY,QQQ,VIX,COHR,NVDA,AAPL,TSLA,SOFI,FANG,OSCR`).then(r => r.json()).catch(() => null),
          fetch(`${BASE}/api/macro`).then(r => r.json()).catch(() => null),
        ]);
        setContext({
          quotes: quotesRes?.data || quotesRes || [],
          macro: macroRes,
          timestamp: new Date().toISOString(),
        });
      } catch { }
    };
    loadContext();
    const iv = setInterval(loadContext, 60000);
    return () => clearInterval(iv);
  }, [BASE]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async (text?: string) => {
    const msg = text || input.trim();
    if (!msg || loading) return;

    const userMsg: Message = { role: "user", content: msg, timestamp: Date.now() };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setLoading(true);
    setActivePreset(null);

    try {
      const res = await fetch(`${BASE}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...messages, userMsg].map(m => ({ role: m.role, content: m.content })),
          context: context,
        }),
      });

      if (!res.ok) throw new Error(`API error ${res.status}`);
      const data = await res.json();
      const reply = data?.content || data?.response || data?.message || "No response received.";

      setMessages(prev => [...prev, {
        role: "assistant",
        content: typeof reply === "string" ? reply : JSON.stringify(reply),
        timestamp: Date.now(),
      }]);
    } catch (err: any) {
      setMessages(prev => [...prev, {
        role: "assistant",
        content: `⚠️ Error: ${err.message}. Make sure the /api/chat endpoint is running and your ANTHROPIC_API_KEY is set.`,
        timestamp: Date.now(),
      }]);
    }
    setLoading(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const presets = [
    { label: "📊 Portfolio Review", prompt: "Give me a comprehensive review of my current portfolio positions. Analyze the risk concentration, sector exposure, and any positions that need attention based on current market conditions." },
    { label: "🎯 Trade Ideas", prompt: "Based on current market conditions and my watchlist, suggest 3 actionable trade ideas with specific entry points, stop losses, and profit targets. Focus on risk/reward ratio." },
    { label: "📋 Earnings Prep", prompt: "Which stocks in my watchlist have upcoming earnings? Give me a prep sheet for each with key metrics to watch, consensus estimates, and potential post-earnings moves." },
    { label: "⚡ Options Play", prompt: "Suggest an options strategy for my top conviction position. Consider current IV levels, upcoming catalysts, and my risk tolerance. Include specific strikes and expirations." },
    { label: "🌍 Macro Check", prompt: "What's the current macro environment telling us? Analyze VIX, yield curve, credit spreads, and how they impact my photonics and tech-heavy portfolio." },
    { label: "🔬 Photonics Deep Dive", prompt: "Analyze the photonics supply chain stocks (COHR, AAOI, MTSI, POET, CIEN, etc). Which are showing the best momentum? Any earnings catalysts or technical setups forming?" },
  ];

  // Colors
  const bg = dark ? "#0a0a0f" : "#ffffff";
  const bgCard = dark ? "#111118" : "#f8f9fa";
  const bgMsg = dark ? "#161620" : "#f1f3f5";
  const bgUser = dark ? "#1a2332" : "#e8f0fe";
  const border = dark ? "#1e1e2e" : "#e5e7eb";
  const text = dark ? "#f1f1f4" : "#111827";
  const textSec = dark ? "#71717a" : "#6b7280";
  const textDim = dark ? "#52525b" : "#9ca3af";
  const accent = "#6366f1";
  const accentBg = dark ? "#6366f115" : "#6366f110";

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 140px)", background: bg, fontFamily: "'DM Sans', system-ui, sans-serif" }}>

      {/* Header */}
      <div style={{ padding: "12px 20px", borderBottom: `1px solid ${border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: `linear-gradient(135deg, ${accent}, #8b5cf6)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>🤖</div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: text }}>Trading Analyst AI</div>
            <div style={{ fontSize: 11, color: textDim }}>
              {context ? `Live data • ${(context.quotes || []).length} tickers tracked` : "Connecting..."}
              {loading && " • Thinking..."}
            </div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={() => setMessages([messages[0]])}
            style={{ padding: "6px 12px", fontSize: 11, fontWeight: 600, borderRadius: 6, border: `1px solid ${border}`, background: "transparent", color: textSec, cursor: "pointer" }}>
            Clear Chat
          </button>
        </div>
      </div>

      {/* Quick Actions */}
      <div style={{ padding: "10px 20px", borderBottom: `1px solid ${border}`, display: "flex", gap: 6, flexWrap: "wrap" }}>
        {presets.map(p => (
          <button key={p.label} onClick={() => { setActivePreset(p.label); sendMessage(p.prompt); }}
            style={{
              padding: "5px 10px", fontSize: 11, fontWeight: 500, borderRadius: 6, cursor: "pointer",
              border: `1px solid ${activePreset === p.label ? accent : border}`,
              background: activePreset === p.label ? accentBg : "transparent",
              color: activePreset === p.label ? accent : textSec,
              transition: "all 0.15s",
            }}>
            {p.label}
          </button>
        ))}
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: "auto", padding: "16px 20px" }}>
        {messages.map((msg, i) => (
          <div key={i} style={{
            marginBottom: 16, display: "flex",
            flexDirection: msg.role === "user" ? "row-reverse" : "row",
            gap: 10,
          }}>
            <div style={{
              width: 28, height: 28, borderRadius: 6, flexShrink: 0,
              background: msg.role === "user" ? (dark ? "#1e293b" : "#dbeafe") : `linear-gradient(135deg, ${accent}, #8b5cf6)`,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 13, color: msg.role === "user" ? textSec : "#fff",
            }}>
              {msg.role === "user" ? "J" : "AI"}
            </div>
            <div style={{
              maxWidth: "75%", padding: "10px 14px", borderRadius: 10,
              background: msg.role === "user" ? bgUser : bgMsg,
              color: text, fontSize: 13, lineHeight: 1.6,
              whiteSpace: "pre-wrap", wordBreak: "break-word",
            }}>
              {msg.content}
            </div>
          </div>
        ))}
        {loading && (
          <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
            <div style={{
              width: 28, height: 28, borderRadius: 6,
              background: `linear-gradient(135deg, ${accent}, #8b5cf6)`,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 13, color: "#fff",
            }}>AI</div>
            <div style={{ padding: "10px 14px", borderRadius: 10, background: bgMsg, color: textDim, fontSize: 13 }}>
              <span style={{ animation: "pulse 1.5s infinite" }}>Analyzing market data...</span>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={{ padding: "12px 20px", borderTop: `1px solid ${border}`, background: bgCard }}>
        <div style={{ display: "flex", gap: 8, alignItems: "flex-end" }}>
          <textarea
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about trades, positions, earnings, options strategies..."
            rows={1}
            style={{
              flex: 1, padding: "10px 14px", borderRadius: 10,
              border: `1px solid ${border}`, background: bg, color: text,
              fontSize: 13, outline: "none", fontFamily: "inherit",
              resize: "none", minHeight: 40, maxHeight: 120,
            }}
            onInput={(e) => {
              const target = e.target as HTMLTextAreaElement;
              target.style.height = "auto";
              target.style.height = Math.min(target.scrollHeight, 120) + "px";
            }}
          />
          <button onClick={() => sendMessage()} disabled={loading || !input.trim()}
            style={{
              padding: "10px 18px", borderRadius: 10, fontSize: 13, fontWeight: 700,
              border: "none", cursor: loading ? "not-allowed" : "pointer",
              background: loading ? textDim : `linear-gradient(135deg, ${accent}, #8b5cf6)`,
              color: "#fff", transition: "all 0.15s",
              opacity: (!input.trim() || loading) ? 0.5 : 1,
            }}>
            {loading ? "..." : "Send"}
          </button>
        </div>
        <div style={{ fontSize: 10, color: textDim, marginTop: 6, textAlign: "center" }}>
          Powered by Claude • Not financial advice • Always verify with your own research
        </div>
      </div>
    </div>
  );
}
