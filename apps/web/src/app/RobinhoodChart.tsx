"use client";
import { useState, useEffect, useRef, useCallback } from "react";

const PHOTONICS_GROUPS: { label: string; tickers: string[] }[] = [
  { label: "Materials & Substrates", tickers: ["AXTI", "GLW", "TSEM", "ALMU"] },
  { label: "Epitaxy & Wafer Fab",   tickers: ["AEHR", "GFS", "LWLG", "SMTC"] },
  { label: "Chips & Components",     tickers: ["COHR", "MTSI", "POET", "CRDO"] },
  { label: "Transceivers & Assembly",tickers: ["AAOI", "FN", "CIEN", "VIAV"] },
  { label: "Networking & Data Center",tickers: ["ANET", "MRVL", "NOK"] },
];
const ALL_PHOTONICS = PHOTONICS_GROUPS.flatMap(g => g.tickers);
const OTHER_DEFAULTS = ["NVDA","AAPL","TSLA","AMZN","FANG","OSCR","SOFI","AMD","GOOGL","META","SPY","QQQ","AVGO","MU","MSFT","NFLX"];
const periods: [string, string][] = [["1d","1D"],["5d","1W"],["1m","1M"],["3m","3M"],["6m","6M"],["1y","1Y"],["2y","ALL"]];

export default function RobinhoodChart({ initialTicker, dark, BASE, onTickerChange }: {
  initialTicker: string; dark: boolean; BASE: string; onTickerChange?: (t: string) => void;
}) {
  const [ticker, setTicker] = useState(initialTicker || "COHR");
  const [period, setPeriod] = useState("3m");
  const [data, setData] = useState<any[]>([]);
  const [quote, setQuote] = useState<any>(null);
  const [ext, setExt] = useState<any>(null);
  const [flash, setFlash] = useState("");
  const [hover, setHover] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [showSearch, setShowSearch] = useState(false);
  const [watchlist, setWatchlist] = useState<string[]>([...ALL_PHOTONICS, ...OTHER_DEFAULTS]);
  const [watchPrices, setWatchPrices] = useState<Record<string, any>>({});
  const [showPhotonics, setShowPhotonics] = useState(true);
  const [showOther, setShowOther] = useState(true);
  const svgRef = useRef<SVGSVGElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);
  const prevPrice = useRef<number>(0);

  useEffect(() => { if (initialTicker && initialTicker.length > 0) setTicker(initialTicker); }, [initialTicker]);

  // Chart candles
  useEffect(() => {
    if (!ticker) return;
    setLoading(true);
    fetch(`${BASE}/technicals/${ticker}?period=${period}`)
      .then(r => r.json())
      .then(d => { const arr = d?.candles || d; if (Array.isArray(arr) && arr.length) setData(arr); })
      .catch(() => {}).finally(() => setLoading(false));
  }, [ticker, period, BASE]);

  // Live quote
  useEffect(() => {
    if (!ticker) return;
    let dead = false;
    const load = () => {
      fetch(`${BASE}/quotes?tickers=${ticker}`).then(r => r.json()).then(d => {
        if (dead) return;
        const arr = d?.data || d;
        const q = Array.isArray(arr) ? arr[0] : arr;
        if (!q || q.price === undefined) return;
        if (prevPrice.current && q.price !== prevPrice.current) {
          setFlash(q.price > prevPrice.current ? "up" : "down");
          setTimeout(() => setFlash(""), 600);
        }
        prevPrice.current = q.price;
        setQuote(q);
      }).catch(() => {});
    };
    load(); const iv = setInterval(load, 5000);
    return () => { dead = true; clearInterval(iv); };
  }, [ticker, BASE]);

  // Extended hours
  useEffect(() => {
    if (!ticker) return;
    fetch(`${BASE}/photonics/premarket?tickers=${ticker}`)
      .then(r => r.json()).then(d => { const arr = d?.data || d; setExt(Array.isArray(arr) ? arr[0] : arr); }).catch(() => {});
  }, [ticker, BASE]);

  // Watchlist prices - BATCHED in groups of 10 + premarket merge
  useEffect(() => {
    const load = async () => {
      const all = [...watchlist];
      const map: Record<string, any> = {};
      // Batch quotes
      for (let i = 0; i < all.length; i += 10) {
        const batch = all.slice(i, i + 10).join(",");
        try {
          const r = await fetch(`${BASE}/quotes?tickers=${batch}`);
          const d = await r.json();
          const arr = d?.data || d;
          if (Array.isArray(arr)) arr.forEach((q: any) => { if (q?.ticker && q.price != null) map[q.ticker] = { ...q }; });
        } catch {}
      }
      // Batch premarket
      for (let i = 0; i < all.length; i += 10) {
        const batch = all.slice(i, i + 10).join(",");
        try {
          const r = await fetch(`${BASE}/photonics/premarket?tickers=${batch}`);
          const d = await r.json();
          const arr = d?.data || d;
          if (Array.isArray(arr)) arr.forEach((pm: any) => {
            if (pm?.ticker && map[pm.ticker]) {
              map[pm.ticker].pm_price = pm.premarket_price;
              map[pm.ticker].pm_pct = pm.premarket_change_pct;
              map[pm.ticker].ah_price = pm.afterhours_price;
              map[pm.ticker].ah_pct = pm.afterhours_change_pct;
            }
          });
        } catch {}
      }
      setWatchPrices(map);
    };
    load(); const iv = setInterval(load, 15000);
    return () => clearInterval(iv);
  }, [watchlist, BASE]);

  // Search
  useEffect(() => {
    if (search.length < 1) { setSearchResults([]); return; }
    const t = setTimeout(() => {
      fetch(`${BASE}/quotes?tickers=${search.toUpperCase()}`).then(r => r.json()).then(d => {
        const arr = d?.data || d;
        if (Array.isArray(arr)) setSearchResults(arr.filter((q: any) => q?.ticker));
        else if (arr?.ticker) setSearchResults([arr]);
      }).catch(() => setSearchResults([]));
    }, 300);
    return () => clearTimeout(t);
  }, [search, BASE]);

  // Click outside
  useEffect(() => {
    const h = (e: MouseEvent) => { if (searchRef.current && !searchRef.current.contains(e.target as Node)) setShowSearch(false); };
    document.addEventListener("mousedown", h); return () => document.removeEventListener("mousedown", h);
  }, []);

  const selectTicker = (t: string) => { setTicker(t); setSearch(""); setShowSearch(false); onTickerChange?.(t); };
  const toggleWatch = (t: string) => setWatchlist(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t]);
  const isWatching = watchlist.includes(ticker);

  // Chart math
  const W = 900, H = 220;
  const prices = data.map(d => d.close).filter(Boolean);
  const minP = Math.min(...prices), maxP = Math.max(...prices), range = maxP - minP || 1;
  const firstP = prices[0] || 0, lastP = prices[prices.length - 1] || 0;
  const isUp = lastP >= firstP, accent = isUp ? "#22c55e" : "#ef4444";
  const points = prices.map((p, i) => `${(i / Math.max(prices.length - 1, 1)) * W},${H - ((p - minP) / range) * (H - 20) - 10}`).join(" ");
  const gradPts = points ? `0,${H} ${points} ${W},${H}` : "";

  const handleSvgMove = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    if (!svgRef.current || !data.length) return;
    const rect = svgRef.current.getBoundingClientRect();
    const idx = Math.round(((e.clientX - rect.left) / rect.width) * (data.length - 1));
    if (idx >= 0 && idx < data.length) {
      const d = data[idx];
      const px = (idx / Math.max(data.length - 1, 1)) * W;
      const py = H - ((d.close - minP) / range) * (H - 20) - 10;
      setHover({ ...d, px, py });
    }
  }, [data, minP, range]);

  // Theme
  const bg = dark ? "#0a0a0f" : "#ffffff", bgCard = dark ? "#111118" : "#f8f9fa";
  const bdr = dark ? "#1e1e2e" : "#e5e7eb", txt = dark ? "#f1f1f4" : "#111827";
  const txt2 = dark ? "#71717a" : "#6b7280", txtDim = dark ? "#52525b" : "#9ca3af";
  const wBg = dark ? "#0d0d14" : "#f9fafb", wHov = dark ? "#16161f" : "#f3f4f6";
  const secBg = dark ? "#0f0f17" : "#f1f3f5", pillBg = dark ? "#1a1a25" : "#f3f4f6";

  // Watchlist row component
  const WatchRow = ({ t }: { t: string }) => {
    const q = watchPrices[t];
    const isAct = t === ticker;
    const price = q?.price;
    const chg = q?.changePercent ?? q?.change_pct ?? 0;
    const extP = q?.pm_price || q?.ah_price;
    const extPct = q?.pm_pct || q?.ah_pct;
    const extLbl = q?.pm_price ? "Pre" : q?.ah_price ? "AH" : null;
    return (
      <div onClick={() => selectTicker(t)} style={{
        padding: "7px 14px", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center",
        borderBottom: `1px solid ${bdr}`, borderLeft: isAct ? `3px solid ${accent}` : "3px solid transparent",
        background: isAct ? (dark ? "#15151f" : "#eef2ff") : "transparent", transition: "all 0.1s",
      }}
        onMouseEnter={e => { if (!isAct) e.currentTarget.style.background = wHov; }}
        onMouseLeave={e => { if (!isAct) e.currentTarget.style.background = isAct ? (dark ? "#15151f" : "#eef2ff") : "transparent"; }}>
        <span style={{ fontWeight: 700, fontSize: 13, minWidth: 48 }}>{t}</span>
        <div style={{ textAlign: "right", fontFamily: "'JetBrains Mono', monospace", lineHeight: 1.3 }}>
          {price != null ? (<>
            <div style={{ fontSize: 12, fontWeight: 600 }}>${price.toFixed(2)}</div>
            <div style={{ fontSize: 10, fontWeight: 600, color: chg >= 0 ? "#22c55e" : "#ef4444" }}>{chg >= 0 ? "+" : ""}{chg.toFixed(2)}%</div>
            {extP != null && extP !== 0 && extLbl && <div style={{ fontSize: 9, color: (extPct ?? 0) >= 0 ? "#22c55e80" : "#ef444480" }}>{extLbl} ${extP.toFixed(2)} {(extPct??0)>=0?"+":""}{(extPct??0).toFixed(2)}%</div>}
          </>) : <div style={{ fontSize: 11, color: txtDim }}>loading...</div>}
        </div>
      </div>
    );
  };

  return (
    <div style={{ display: "flex", gap: 0, minHeight: "100%", background: bg, color: txt, fontFamily: "'DM Sans', system-ui, sans-serif" }}>
      {/* MAIN CHART */}
      <div style={{ flex: 1, padding: "16px 24px", minWidth: 0 }}>

        {/* Search */}
        <div ref={searchRef} style={{ position: "relative", marginBottom: 16, display: "flex", gap: 8, alignItems: "center" }}>
          <div style={{ position: "relative", flex: 1, maxWidth: 400 }}>
            <input value={search} onChange={e => { setSearch(e.target.value); setShowSearch(true); }} onFocus={() => setShowSearch(true)}
              placeholder="Search any ticker..." style={{ width: "100%", padding: "10px 14px 10px 36px", borderRadius: 10, border: `1px solid ${bdr}`, background: bgCard, color: txt, fontSize: 14, outline: "none", fontFamily: "inherit" }} />
            <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", fontSize: 15, color: txtDim }}>{"🔍"}</span>
            {showSearch && searchResults.length > 0 && (
              <div style={{ position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0, background: bgCard, border: `1px solid ${bdr}`, borderRadius: 10, boxShadow: "0 12px 32px rgba(0,0,0,0.2)", zIndex: 100, overflow: "hidden" }}>
                {searchResults.map(r => (
                  <div key={r.ticker} onClick={() => selectTicker(r.ticker)} style={{ padding: "10px 14px", cursor: "pointer", display: "flex", justifyContent: "space-between", borderBottom: `1px solid ${bdr}` }}
                    onMouseEnter={e => (e.currentTarget.style.background = wHov)} onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                    <div><span style={{ fontWeight: 700 }}>{r.ticker}</span><span style={{ color: txt2, fontSize: 12, marginLeft: 8 }}>{r.name || ""}</span></div>
                    <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13 }}>${r.price?.toFixed(2) ?? "—"}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
          <button onClick={() => toggleWatch(ticker)} style={{ padding: "10px 16px", borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: "pointer",
            border: isWatching ? `1px solid ${accent}` : `1px solid ${bdr}`, background: isWatching ? (dark ? accent + "20" : accent + "15") : "transparent", color: isWatching ? accent : txt2 }}>
            {isWatching ? "✓ Watching" : "+ Watch"}
          </button>
        </div>

        {/* Price header */}
        <div style={{ marginBottom: 4 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: txt2, letterSpacing: 1, textTransform: "uppercase", marginBottom: 4 }}>{ticker} {quote?.name ? `· ${quote.name}` : ""}</div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 12 }}>
            <span style={{ fontSize: 32, fontWeight: 800, fontFamily: "'JetBrains Mono', monospace", transition: "color 0.3s",
              color: flash === "up" ? "#22c55e" : flash === "down" ? "#ef4444" : txt,
              textShadow: flash ? `0 0 20px ${flash === "up" ? "#22c55e50" : "#ef444450"}` : "none" }}>
              {hover ? `$${hover.close?.toFixed(2)}` : quote?.price != null ? `$${quote.price.toFixed(2)}` : "—"}
            </span>
            {quote && !hover && <span style={{ fontSize: 14, fontWeight: 600, color: accent }}>
              {(quote.change ?? 0) >= 0 ? "▲" : "▼"} ${Math.abs(quote.change ?? 0).toFixed(2)} ({(quote.changePercent ?? 0).toFixed(2)}%)
            </span>}
            {hover && <span style={{ fontSize: 12, color: txt2 }}>{hover.date} · O:{hover.open?.toFixed(2)} H:{hover.high?.toFixed(2)} L:{hover.low?.toFixed(2)} V:{((hover.volume||0)/1e6).toFixed(1)}M</span>}
          </div>
          {ext && (ext.premarket_price || ext.afterhours_price) && (
            <div style={{ fontSize: 12, color: txtDim, marginTop: 2 }}>
              {ext.premarket_price ? `Pre-market $${ext.premarket_price.toFixed(2)}` : `After hours $${(ext.afterhours_price ?? 0).toFixed(2)}`}{" "}
              <span style={{ color: ((ext.premarket_change_pct||ext.afterhours_change_pct||0) >= 0) ? "#22c55e" : "#ef4444" }}>
                {(ext.premarket_change_pct||ext.afterhours_change_pct||0) >= 0 ? "+" : ""}{(ext.premarket_change_pct||ext.afterhours_change_pct||0).toFixed(2)}%
              </span>
            </div>
          )}
        </div>

        {/* SVG Chart */}
        <div style={{ position: "relative", margin: "8px 0" }}>
          {loading && <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", color: txtDim, fontSize: 13 }}>Loading...</div>}
          <svg ref={svgRef} viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: 220, cursor: "crosshair" }} onMouseMove={handleSvgMove} onMouseLeave={() => setHover(null)}>
            <defs><linearGradient id="cg" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={accent} stopOpacity={0.25}/><stop offset="100%" stopColor={accent} stopOpacity={0.02}/></linearGradient></defs>
            {gradPts && <polygon points={gradPts} fill="url(#cg)" />}
            {points && <polyline points={points} fill="none" stroke={accent} strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round" />}
            {hover && <><line x1={hover.px} y1={0} x2={hover.px} y2={H} stroke={txtDim} strokeWidth={0.5} strokeDasharray="4,4" /><circle cx={hover.px} cy={hover.py} r={5} fill={accent} stroke={bg} strokeWidth={2} /></>}
          </svg>
        </div>

        {/* Period pills */}
        <div style={{ display: "flex", justifyContent: "center", gap: 4, margin: "8px 0 16px" }}>
          {periods.map(([v, l]) => <button key={v} onClick={() => setPeriod(v)} style={{ padding: "6px 16px", fontSize: 12, fontWeight: v===period?700:500, borderRadius: 20, border: "none", cursor: "pointer", background: v===period?accent:pillBg, color: v===period?"#fff":txt2, transition: "all 0.15s" }}>{l}</button>)}
        </div>

        {/* Stats grid */}
        {quote && <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 1, background: bdr, borderRadius: 10, overflow: "hidden", fontSize: 12 }}>
          {([["Open",quote.open],["High",quote.high],["Low",quote.low],["Volume",quote.volume?(quote.volume/1e6).toFixed(1)+"M":null],["Prev Close",quote.prevClose],["52W High",quote.yearHigh||quote.fiftyTwoWeekHigh],["52W Low",quote.yearLow||quote.fiftyTwoWeekLow],["Mkt Cap",quote.marketCap?(quote.marketCap>1e12?(quote.marketCap/1e12).toFixed(1)+"T":(quote.marketCap/1e9).toFixed(1)+"B"):null]] as [string,any][]).map(([l,v],i) => (
            <div key={i} style={{ background: bgCard, padding: "10px 12px" }}>
              <div style={{ color: txtDim, fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 2 }}>{l}</div>
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 600, fontSize: 13 }}>{v!=null?(typeof v==="number"?"$"+v.toFixed(2):v):"—"}</div>
            </div>
          ))}
        </div>}
      </div>

      {/* WATCHLIST SIDEBAR */}
      <div style={{ width: 260, borderLeft: `1px solid ${bdr}`, background: wBg, overflowY: "auto", flexShrink: 0 }}>
        <div style={{ padding: "12px 14px 8px", borderBottom: `1px solid ${bdr}`, fontWeight: 700, fontSize: 14, display: "flex", justifyContent: "space-between" }}>
          <span>Watchlist</span><span style={{ fontSize: 10, color: txtDim, fontWeight: 400 }}>{watchlist.length}</span>
        </div>

        {/* Photonics header */}
        <div onClick={() => setShowPhotonics(!showPhotonics)} style={{ padding: "8px 14px", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center", background: secBg, borderBottom: `1px solid ${bdr}`, fontWeight: 700, fontSize: 10, textTransform: "uppercase", letterSpacing: 1.2, color: "#22c55e" }}>
          <span>{"🔬"} Photonics Supply Chain</span>
          <span style={{ fontSize: 9, transform: showPhotonics ? "rotate(180deg)" : "rotate(0)", transition: "transform 0.2s" }}>{"▼"}</span>
        </div>
        {showPhotonics && PHOTONICS_GROUPS.map(g => (
          <div key={g.label}>
            <div style={{ padding: "5px 14px", fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, color: txtDim, background: dark ? "#0c0c12" : "#f0f2f5", borderBottom: `1px solid ${bdr}` }}>{g.label}</div>
            {g.tickers.filter(t => watchlist.includes(t)).map(t => <WatchRow key={t} t={t} />)}
          </div>
        ))}

        {/* Other stocks header */}
        <div onClick={() => setShowOther(!showOther)} style={{ padding: "8px 14px", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center", background: secBg, borderBottom: `1px solid ${bdr}`, fontWeight: 700, fontSize: 10, textTransform: "uppercase", letterSpacing: 1.2, color: txt2 }}>
          <span>{"📊"} Other Stocks</span>
          <span style={{ fontSize: 9, transform: showOther ? "rotate(180deg)" : "rotate(0)", transition: "transform 0.2s" }}>{"▼"}</span>
        </div>
        {showOther && watchlist.filter(t => !ALL_PHOTONICS.includes(t)).map(t => <WatchRow key={t} t={t} />)}
      </div>
    </div>
  );
}
