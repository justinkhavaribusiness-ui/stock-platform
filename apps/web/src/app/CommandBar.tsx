"use client";
import { useState, useEffect, useRef, useCallback } from "react";

interface CommandBarProps {
  dark: boolean;
  BASE: string;
  onNavigate: (tab: string, ticker?: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

interface SearchResult {
  ticker: string;
  name?: string;
  price?: number;
  change?: number;
  changePercent?: number;
  type: "stock" | "tab" | "action";
}

const TABS = [
  { id: "dash", label: "Dashboard", icon: "📊" },
  { id: "charts", label: "Charts", icon: "📈" },
  { id: "portfolio", label: "Portfolio", icon: "💼" },
  { id: "options", label: "Options", icon: "🎯" },
  { id: "screener", label: "Screener", icon: "🔍" },
  { id: "photonics", label: "Photonics", icon: "🔬" },
  { id: "crypto", label: "Crypto", icon: "₿" },
  { id: "news", label: "News", icon: "📰" },
  { id: "earnings-intel", label: "Earnings Intel", icon: "📋" },
  { id: "risk", label: "Risk Engine", icon: "🛡️" },
  { id: "flow", label: "Options Flow", icon: "🌊" },
  { id: "filings", label: "SEC Filings", icon: "📑" },
  { id: "econ", label: "Economic Calendar", icon: "🏛️" },
  { id: "credit", label: "Credit & Macro", icon: "💹" },
  { id: "alerts", label: "Alert Engine", icon: "🔔" },
  { id: "transcripts", label: "Conference Calls", icon: "🎙️" },
];

export default function CommandBar({ dark, BASE, onNavigate, isOpen, onClose }: CommandBarProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setQuery("");
      setResults([]);
      setSelectedIdx(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Search logic
  useEffect(() => {
    if (!query.trim()) {
      setResults(TABS.map(t => ({ ticker: t.id, name: t.label, type: "tab" as const, price: undefined, change: undefined, changePercent: undefined })));
      setSelectedIdx(0);
      return;
    }

    const q = query.toLowerCase();

    // Filter tabs
    const tabResults: SearchResult[] = TABS
      .filter(t => t.label.toLowerCase().includes(q) || t.id.includes(q))
      .map(t => ({ ticker: t.id, name: `${t.icon} ${t.label}`, type: "tab" as const, price: undefined, change: undefined, changePercent: undefined }));

    // Search stocks
    setLoading(true);
    const timer = setTimeout(() => {
      fetch(`${BASE}/quotes?tickers=${query.toUpperCase()}`)
        .then(r => r.json())
        .then(d => {
          const arr = d?.data || d;
          const stocks: SearchResult[] = [];
          if (Array.isArray(arr)) {
            arr.forEach((s: any) => {
              if (s?.ticker) stocks.push({ ticker: s.ticker, name: s.name, price: s.price, change: s.change, changePercent: s.changePercent, type: "stock" });
            });
          } else if (arr?.ticker) {
            stocks.push({ ticker: arr.ticker, name: arr.name, price: arr.price, change: arr.change, changePercent: arr.changePercent, type: "stock" });
          }
          setResults([...stocks, ...tabResults]);
          setSelectedIdx(0);
          setLoading(false);
        })
        .catch(() => { setResults(tabResults); setLoading(false); });
    }, 200);

    return () => clearTimeout(timer);
  }, [query, BASE]);

  const handleSelect = useCallback((r: SearchResult) => {
    if (r.type === "tab") {
      onNavigate(r.ticker);
    } else {
      onNavigate("charts", r.ticker);
    }
    onClose();
  }, [onNavigate, onClose]);

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") { e.preventDefault(); setSelectedIdx(i => Math.min(i + 1, results.length - 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setSelectedIdx(i => Math.max(i - 1, 0)); }
    else if (e.key === "Enter" && results[selectedIdx]) { handleSelect(results[selectedIdx]); }
    else if (e.key === "Escape") { onClose(); }
  };

  if (!isOpen) return null;

  const bg = dark ? "#111118" : "#ffffff";
  const bdr = dark ? "#2a2a3a" : "#e2e8f0";
  const txt = dark ? "#f1f1f4" : "#111827";
  const txt2 = dark ? "#71717a" : "#6b7280";
  const overlay = dark ? "rgba(0,0,0,0.7)" : "rgba(0,0,0,0.4)";
  const hoverBg = dark ? "#1a1a28" : "#f1f5f9";

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: overlay, zIndex: 9999, display: "flex", justifyContent: "center", paddingTop: "15vh", backdropFilter: "blur(4px)" }}>
      <div onClick={e => e.stopPropagation()} style={{ width: 600, maxHeight: "60vh", background: bg, borderRadius: 16, border: `1px solid ${bdr}`, boxShadow: "0 24px 64px rgba(0,0,0,0.3)", overflow: "hidden", display: "flex", flexDirection: "column" }}>
        {/* Input */}
        <div style={{ padding: "16px 20px", borderBottom: `1px solid ${bdr}`, display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 18, color: txt2 }}>{"⌘"}</span>
          <input ref={inputRef} value={query} onChange={e => setQuery(e.target.value)} onKeyDown={handleKey}
            placeholder="Search tickers, navigate tabs..."
            style={{ flex: 1, background: "transparent", border: "none", outline: "none", fontSize: 16, color: txt, fontFamily: "'DM Sans', system-ui, sans-serif" }} />
          <kbd style={{ padding: "2px 8px", borderRadius: 4, fontSize: 11, color: txt2, border: `1px solid ${bdr}`, background: dark ? "#0a0a0f" : "#f8f9fa" }}>ESC</kbd>
        </div>

        {/* Results */}
        <div style={{ overflowY: "auto", flex: 1 }}>
          {loading && <div style={{ padding: 16, textAlign: "center", color: txt2, fontSize: 13 }}>Searching...</div>}
          {results.map((r, i) => (
            <div key={`${r.type}-${r.ticker}`} onClick={() => handleSelect(r)}
              style={{
                padding: "12px 20px", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center",
                background: i === selectedIdx ? hoverBg : "transparent",
                borderBottom: `1px solid ${dark ? "#1a1a28" : "#f1f5f9"}`,
                transition: "background 0.1s",
              }}
              onMouseEnter={() => setSelectedIdx(i)}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                {r.type === "stock" && <span style={{ fontSize: 11, padding: "2px 6px", borderRadius: 4, background: dark ? "#22c55e20" : "#dcfce7", color: "#22c55e", fontWeight: 700 }}>STOCK</span>}
                <span style={{ fontWeight: 700, fontSize: 14, color: txt }}>{r.type === "stock" ? r.ticker : r.name}</span>
                {r.type === "stock" && r.name && <span style={{ fontSize: 12, color: txt2 }}>{r.name}</span>}
              </div>
              <div style={{ textAlign: "right", fontFamily: "'JetBrains Mono', monospace" }}>
                {r.price != null && (
                  <>
                    <div style={{ fontSize: 13, fontWeight: 600, color: txt }}>${r.price.toFixed(2)}</div>
                    <div style={{ fontSize: 11, color: (r.changePercent ?? 0) >= 0 ? "#22c55e" : "#ef4444" }}>
                      {(r.changePercent ?? 0) >= 0 ? "+" : ""}{(r.changePercent ?? 0).toFixed(2)}%
                    </div>
                  </>
                )}
                {r.type === "tab" && <span style={{ fontSize: 11, color: txt2 }}>{"→"} Navigate</span>}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div style={{ padding: "8px 20px", borderTop: `1px solid ${bdr}`, display: "flex", gap: 16, fontSize: 11, color: txt2 }}>
          <span>{"↑↓"} Navigate</span>
          <span>{"↵"} Select</span>
          <span>{"/"} Open</span>
        </div>
      </div>
    </div>
  );
}
