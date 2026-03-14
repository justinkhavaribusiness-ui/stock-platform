"use client";
import { useState, useEffect, useRef, useCallback, useMemo } from "react";

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

// Market hours check (ET)
function isMarketOpen(): boolean {
  const now = new Date();
  const et = new Date(now.toLocaleString("en-US", { timeZone: "America/New_York" }));
  const day = et.getDay();
  if (day === 0 || day === 6) return false;
  const mins = et.getHours() * 60 + et.getMinutes();
  return mins >= 570 && mins < 960; // 9:30 AM - 4:00 PM
}

function timeAgo(ts: number): string {
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 5) return "just now";
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  return `${Math.floor(s / 3600)}h ago`;
}

// ---- Mini chart for multi-layout ----
function MiniChart({ ticker, dark, BASE, onSelect, accent: _accent }: {
  ticker: string; dark: boolean; BASE: string; onSelect: (t: string) => void; accent?: string;
}) {
  const [data, setData] = useState<any[]>([]);
  const [quote, setQuote] = useState<any>(null);
  useEffect(() => {
    fetch(`${BASE}/technicals/${ticker}?period=1m`).then(r => r.json()).then(d => {
      const arr = d?.candles || d; if (Array.isArray(arr)) setData(arr);
    }).catch(() => {});
    fetch(`${BASE}/quotes?tickers=${ticker}`).then(r => r.json()).then(d => {
      const arr = d?.data || d; const q = Array.isArray(arr) ? arr[0] : arr;
      if (q?.price !== undefined) setQuote(q);
    }).catch(() => {});
  }, [ticker, BASE]);

  const prices = data.map(d => d.close).filter(Boolean);
  const minP = Math.min(...prices), maxP = Math.max(...prices), rng = maxP - minP || 1;
  const W = 300, H = 100;
  const pts = prices.map((p, i) => `${(i / Math.max(prices.length - 1, 1)) * W},${H - ((p - minP) / rng) * (H - 10) - 5}`).join(" ");
  const isUp = (prices[prices.length - 1] || 0) >= (prices[0] || 0);
  const ac = isUp ? "#22c55e" : "#ef4444";
  const bg = dark ? "#111118" : "#f8f9fa", bdr = dark ? "#1e1e2e" : "#e5e7eb", txt = dark ? "#f1f1f4" : "#111827", txt2 = dark ? "#71717a" : "#6b7280";

  return (
    <div onClick={() => onSelect(ticker)} style={{ background: bg, border: `1px solid ${bdr}`, borderRadius: 10, padding: 10, cursor: "pointer", position: "relative", overflow: "hidden" }}
      onMouseEnter={e => e.currentTarget.style.borderColor = ac} onMouseLeave={e => e.currentTarget.style.borderColor = bdr}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
        <span style={{ fontWeight: 700, fontSize: 13 }}>{ticker}</span>
        <div style={{ textAlign: "right" }}>
          <span style={{ fontSize: 13, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace" }}>{quote?.price != null ? `$${quote.price.toFixed(2)}` : "—"}</span>
          {quote && <span style={{ fontSize: 10, color: ac, marginLeft: 6, fontWeight: 600 }}>{(quote.changePercent ?? 0) >= 0 ? "+" : ""}{(quote.changePercent ?? 0).toFixed(2)}%</span>}
        </div>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: 80 }}>
        <defs><linearGradient id={`mg-${ticker}`} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={ac} stopOpacity={0.2}/><stop offset="100%" stopColor={ac} stopOpacity={0}/></linearGradient></defs>
        {pts && <><polygon points={`0,${H} ${pts} ${W},${H}`} fill={`url(#mg-${ticker})`} /><polyline points={pts} fill="none" stroke={ac} strokeWidth={1.5} /></>}
      </svg>
    </div>
  );
}

// ---- MAIN COMPONENT ----
export default function RobinhoodChart({ initialTicker, dark, BASE, portfolio, onTickerChange, onAIAnalyze }: {
  initialTicker: string; dark: boolean; BASE: string; portfolio?: { [ticker: string]: { shares: number; cost_basis: number } }; onTickerChange?: (t: string) => void; onAIAnalyze?: (t: string) => void;
}) {
  // Core state
  const [ticker, setTicker] = useState(initialTicker || "COHR");
  const [period, setPeriod] = useState("3m");
  const [data, setData] = useState<any[]>([]);
  const [quote, setQuote] = useState<any>(null);
  const [ext, setExt] = useState<any>(null);
  const [flash, setFlash] = useState("");
  const [hover, setHover] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(Date.now());
  const [updateText, setUpdateText] = useState("just now");
  const [marketOpen, setMarketOpen] = useState(isMarketOpen());

  // Search
  const [search, setSearch] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [showSearch, setShowSearch] = useState(false);

  // Watchlist
  const [watchlist, setWatchlist] = useState<string[]>([...ALL_PHOTONICS, ...OTHER_DEFAULTS]);
  const [watchPrices, setWatchPrices] = useState<Record<string, any>>({});
  const [showPhotonics, setShowPhotonics] = useState(true);
  const [showOther, setShowOther] = useState(true);

  // Chart mode & layout
  const [chartMode, setChartMode] = useState<"line" | "candle">("candle");
  const [layout, setLayout] = useState<"1x1" | "2x2" | "1x3">("1x1");
  const [multiTickers, setMultiTickers] = useState<string[]>(["COHR", "NVDA", "AAPL", "SPY"]);

  // Overlays
  const [overlayBB, setOverlayBB] = useState(false);
  const [overlayVWAP, setOverlayVWAP] = useState(false);
  const [overlayFib, setOverlayFib] = useState(false);

  // Indicators
  const [showRSI, setShowRSI] = useState(false);
  const [showMACD, setShowMACD] = useState(false);
  const [showATR, setShowATR] = useState(false);
  const [showStoch, setShowStoch] = useState(false);

  // Volume Profile
  const [overlayVolProfile, setOverlayVolProfile] = useState(false);

  // Comparison Mode
  const [comparisonTicker, setComparisonTicker] = useState<string | null>(null);
  const [comparisonData, setComparisonData] = useState<any[]>([]);
  const [showCompareInput, setShowCompareInput] = useState(false);
  const [compareSearch, setCompareSearch] = useState("");

  // Pattern Recognition
  const [showPatterns, setShowPatterns] = useState(false);
  const [patterns, setPatterns] = useState<any[]>([]);

  // Probability Cone
  const [showProbCone, setShowProbCone] = useState(false);
  const [ivData, setIvData] = useState<any>(null);

  // Pan / Zoom
  const [visibleRange, setVisibleRange] = useState<[number, number]>([0, 0]);
  const [isPanning, setIsPanning] = useState(false);
  const [panStartX, setPanStartX] = useState(0);
  const [panStartRange, setPanStartRange] = useState<[number, number]>([0, 0]);

  // Alert
  const [alertMsg, setAlertMsg] = useState("");

  // Drawing tools
  type DrawingType = "none" | "trendline" | "hline" | "annotation";
  type Drawing = { type: DrawingType; ticker: string; dateIdx?: number; price?: number; dateIdx2?: number; price2?: number; text?: string; color?: string };
  const [drawingMode, setDrawingMode] = useState<DrawingType>("none");
  const [drawings, setDrawings] = useState<Record<string, Drawing[]>>({});
  const [drawStart, setDrawStart] = useState<{ idx: number; price: number } | null>(null);
  const [annotationInput, setAnnotationInput] = useState("");
  const [showAnnotationPrompt, setShowAnnotationPrompt] = useState<{ x: number; y: number; idx: number; price: number } | null>(null);

  // Tooltip ref
  const tooltipRef = useRef<HTMLDivElement>(null);
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);
  const prevPrice = useRef<number>(0);

  // ---- Effects ----
  useEffect(() => { if (initialTicker && initialTicker.length > 0) setTicker(initialTicker); }, [initialTicker]);

  // Primary data: fetch candles + quote in parallel (the two critical requests)
  useEffect(() => {
    if (!ticker) return;
    let dead = false;
    setLoading(true);
    setQuote(null); // Clear stale quote while loading

    // Fire both requests simultaneously
    const candleP = fetch(`${BASE}/technicals/${ticker}?period=${period}`).then(r => r.json()).catch(() => null);
    const quoteP = fetch(`${BASE}/quotes?tickers=${ticker}`).then(r => r.json()).catch(() => null);

    Promise.all([candleP, quoteP]).then(([candleData, quoteData]) => {
      if (dead) return;
      // Process candles
      const arr = candleData?.candles || candleData;
      if (Array.isArray(arr) && arr.length) {
        setData(arr);
        const defaultVisible = chartMode === "candle" ? Math.min(80, arr.length) : arr.length;
        setVisibleRange([Math.max(0, arr.length - defaultVisible), arr.length]);
      }
      // Process quote
      const qArr = quoteData?.data || quoteData;
      const q = Array.isArray(qArr) ? qArr[0] : qArr;
      if (q?.price != null) {
        prevPrice.current = q.price;
        setQuote(q);
        setLastUpdate(Date.now());
      }
    }).finally(() => { if (!dead) setLoading(false); });

    return () => { dead = true; };
  }, [ticker, period, BASE]);

  // Reset visible range on chart mode change
  useEffect(() => {
    if (data.length === 0) return;
    const defaultVisible = chartMode === "candle" ? Math.min(80, data.length) : data.length;
    setVisibleRange([Math.max(0, data.length - defaultVisible), data.length]);
  }, [chartMode, data.length]);

  // Live quote polling (starts AFTER initial load, 5s interval)
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
        setLastUpdate(Date.now());
        // Merge live data into last candle
        setData(prev => {
          if (!prev.length) return prev;
          const updated = [...prev];
          const last = { ...updated[updated.length - 1] };
          last.close = q.price;
          if (q.high && q.high > (last.high || 0)) last.high = q.high;
          if (q.low && q.low < (last.low || Infinity)) last.low = q.low;
          updated[updated.length - 1] = last;
          return updated;
        });
      }).catch(() => {});
    };
    // Start polling after 5s (initial load already fetched the first quote)
    const iv = setInterval(load, 5000);
    return () => { dead = true; clearInterval(iv); };
  }, [ticker, BASE]);

  // Update "Updated Xs ago" text
  useEffect(() => {
    const iv = setInterval(() => {
      setUpdateText(timeAgo(lastUpdate));
      setMarketOpen(isMarketOpen());
    }, 1000);
    return () => clearInterval(iv);
  }, [lastUpdate]);

  // Extended hours — only fetch if endpoint exists (graceful probe)
  useEffect(() => {
    if (!ticker) return;
    if (isMarketOpen()) { setExt(null); return; }
    fetch(`${BASE}/photonics/premarket?tickers=${ticker}`)
      .then(r => { if (!r.ok) throw new Error("not found"); return r.json(); })
      .then(d => { const arr = d?.data || d; setExt(Array.isArray(arr) ? arr[0] : arr); })
      .catch(() => setExt(null));
  }, [ticker, BASE]);

  // Watchlist prices — DEFERRED 1.5s after mount, parallel batches
  useEffect(() => {
    let dead = false;
    const load = async () => {
      const all = [...watchlist];
      const map: Record<string, any> = {};
      // Fire ALL quote batches in parallel
      const quoteBatches = [];
      for (let i = 0; i < all.length; i += 10) {
        quoteBatches.push(all.slice(i, i + 10).join(","));
      }
      const quoteResults = await Promise.all(
        quoteBatches.map(batch =>
          fetch(`${BASE}/quotes?tickers=${batch}`).then(r => r.json()).catch(() => null)
        )
      );
      if (dead) return;
      quoteResults.forEach(d => {
        const arr = d?.data || d;
        if (Array.isArray(arr)) arr.forEach((q: any) => { if (q?.ticker && q.price != null) map[q.ticker] = { ...q }; });
      });
      if (!dead) setWatchPrices(map);
    };
    // Defer first load to avoid competing with chart data
    const delay = setTimeout(load, 1500);
    const iv = setInterval(load, 15000);
    return () => { dead = true; clearTimeout(delay); clearInterval(iv); };
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

  // Click outside search
  useEffect(() => {
    const h = (e: MouseEvent) => { if (searchRef.current && !searchRef.current.contains(e.target as Node)) setShowSearch(false); };
    document.addEventListener("mousedown", h); return () => document.removeEventListener("mousedown", h);
  }, []);

  // Keyboard: Escape exits drawing mode
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === "Escape") { setDrawingMode("none"); setDrawStart(null); setShowAnnotationPrompt(null); setShowCompareInput(false); } };
    document.addEventListener("keydown", h); return () => document.removeEventListener("keydown", h);
  }, []);

  // Comparison ticker data fetch
  useEffect(() => {
    if (!comparisonTicker) { setComparisonData([]); return; }
    let dead = false;
    fetch(`${BASE}/technicals/${comparisonTicker}?period=${period}`).then(r => r.json()).then(d => {
      if (dead) return;
      const arr = d?.candles || d;
      if (Array.isArray(arr)) setComparisonData(arr);
    }).catch(() => {});
    return () => { dead = true; };
  }, [comparisonTicker, period, BASE]);

  // IV stats fetch (for probability cone)
  useEffect(() => {
    if (!showProbCone || !ticker) { setIvData(null); return; }
    let dead = false;
    fetch(`${BASE}/options/${ticker}/iv-stats`).then(r => r.json()).then(d => {
      if (!dead && d?.currentIV) setIvData(d);
    }).catch(() => {});
    return () => { dead = true; };
  }, [showProbCone, ticker, BASE]);

  // Pattern detection fetch
  useEffect(() => {
    if (!showPatterns || !ticker) { setPatterns([]); return; }
    let dead = false;
    fetch(`${BASE}/patterns/${ticker}?period=${period}`).then(r => r.json()).then(d => {
      if (!dead && d?.patterns) setPatterns(d.patterns);
    }).catch(() => {});
    return () => { dead = true; };
  }, [showPatterns, ticker, period, BASE]);

  // Layout persistence — save to localStorage
  useEffect(() => {
    try {
      const settings = { chartMode, overlayBB, overlayVWAP, overlayFib, overlayVolProfile, showRSI, showMACD, showATR, showStoch, showPatterns, showProbCone, layout, comparisonTicker };
      localStorage.setItem("chart-settings-v1", JSON.stringify(settings));
    } catch {}
  }, [chartMode, overlayBB, overlayVWAP, overlayFib, overlayVolProfile, showRSI, showMACD, showATR, showStoch, showPatterns, layout, comparisonTicker]);

  // Layout persistence — restore from localStorage on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem("chart-settings-v1");
      if (raw) {
        const s = JSON.parse(raw);
        if (s.chartMode) setChartMode(s.chartMode);
        if (s.overlayBB != null) setOverlayBB(s.overlayBB);
        if (s.overlayVWAP != null) setOverlayVWAP(s.overlayVWAP);
        if (s.overlayFib != null) setOverlayFib(s.overlayFib);
        if (s.overlayVolProfile != null) setOverlayVolProfile(s.overlayVolProfile);
        if (s.showRSI != null) setShowRSI(s.showRSI);
        if (s.showMACD != null) setShowMACD(s.showMACD);
        if (s.showATR != null) setShowATR(s.showATR);
        if (s.showStoch != null) setShowStoch(s.showStoch);
        if (s.showPatterns != null) setShowPatterns(s.showPatterns);
        if (s.showProbCone != null) setShowProbCone(s.showProbCone);
        if (s.layout) setLayout(s.layout);
        if (s.comparisonTicker) setComparisonTicker(s.comparisonTicker);
      }
    } catch {}
  }, []);

  const selectTicker = (t: string) => { setTicker(t); setSearch(""); setShowSearch(false); onTickerChange?.(t); };
  const toggleWatch = (t: string) => setWatchlist(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t]);
  const isWatching = watchlist.includes(ticker);

  // ---- Chart Dimensions ----
  const W = 900, PRICE_H = 280, VOL_H = 55, GAP = 8;
  const CHART_H = PRICE_H + GAP + VOL_H;
  const RSI_H = 80, MACD_H = 80;

  // ---- Visible data slice ----
  const visData = useMemo(() => data.slice(visibleRange[0], visibleRange[1]), [data, visibleRange]);
  const visCount = visData.length;

  // ---- Price math on visible data ----
  const prices = useMemo(() => visData.map(d => d.close).filter(Boolean), [visData]);
  const allHighs = useMemo(() => visData.map(d => d.high ?? d.close).filter(Boolean), [visData]);
  const allLows = useMemo(() => visData.map(d => d.low ?? d.close).filter(Boolean), [visData]);
  const minP = Math.min(...allLows, ...prices), maxP = Math.max(...allHighs, ...prices);
  const range = maxP - minP || 1;
  const firstP = prices[0] || 0, lastP = prices[prices.length - 1] || 0;
  const isUp = lastP >= firstP, accent = isUp ? "#22c55e" : "#ef4444";

  // Coordinate helpers (price area only)
  const toY = useCallback((p: number) => PRICE_H - ((p - minP) / range) * (PRICE_H - 20) - 10, [minP, range]);
  const toX = useCallback((i: number) => (i / Math.max(visCount - 1, 1)) * W, [visCount]);

  // Volume helpers
  const volumes = useMemo(() => visData.map(d => d.volume || 0), [visData]);
  const maxVol = Math.max(...volumes, 1);

  // ---- Line mode polyline ----
  const linePoints = useMemo(() => {
    if (chartMode !== "line") return "";
    return prices.map((p, i) => `${toX(i)},${toY(p)}`).join(" ");
  }, [prices, chartMode, toX, toY]);
  const lineGradPts = linePoints ? `0,${PRICE_H} ${linePoints} ${W},${PRICE_H}` : "";

  // ---- Candlestick dimensions ----
  const candleW = useMemo(() => Math.max(2, (W / Math.max(visCount, 1)) * 0.7), [visCount]);
  const candleGap = useMemo(() => (W / Math.max(visCount, 1)) * 0.15, [visCount]);

  // ---- Overlays (computed on visible data) ----
  // Bollinger Bands
  const bbData = useMemo(() => {
    if (!overlayBB || prices.length < 20) return [];
    return prices.map((_, i) => {
      if (i < 19) return null;
      const win = prices.slice(i - 19, i + 1);
      const mean = win.reduce((s, v) => s + v, 0) / 20;
      const std = Math.sqrt(win.reduce((s, v) => s + (v - mean) ** 2, 0) / 20);
      return { upper: mean + 2 * std, middle: mean, lower: mean - 2 * std };
    });
  }, [overlayBB, prices]);

  const bbUpperPts = bbData.map((b, i) => b ? `${toX(i)},${toY(b.upper)}` : "").filter(Boolean).join(" ");
  const bbMiddlePts = bbData.map((b, i) => b ? `${toX(i)},${toY(b.middle)}` : "").filter(Boolean).join(" ");
  const bbLowerPts = bbData.map((b, i) => b ? `${toX(i)},${toY(b.lower)}` : "").filter(Boolean).join(" ");

  // VWAP
  const vwapPts = useMemo(() => {
    if (!overlayVWAP || visData.length === 0) return "";
    let cumTPV = 0, cumVol = 0;
    return visData.map((d, i) => {
      if (!d.volume || !d.close) return "";
      const tp = ((d.high || d.close) + (d.low || d.close) + d.close) / 3;
      cumTPV += tp * d.volume; cumVol += d.volume;
      return cumVol > 0 ? `${toX(i)},${toY(cumTPV / cumVol)}` : "";
    }).filter(Boolean).join(" ");
  }, [overlayVWAP, visData, toX, toY]);

  // Fibonacci
  const fibLevels = useMemo(() => {
    if (!overlayFib || prices.length < 2) return [];
    const high = Math.max(...prices), low = Math.min(...prices), diff = high - low;
    return [0, 0.236, 0.382, 0.5, 0.618, 0.786, 1].map(lvl => ({ level: lvl, price: high - diff * lvl, y: toY(high - diff * lvl) }));
  }, [overlayFib, prices, toY]);

  // ---- SMA overlays for candlestick mode ----
  const sma20Pts = useMemo(() => {
    if (chartMode !== "candle") return "";
    return visData.map((d, i) => d.sma20 ? `${toX(i)},${toY(d.sma20)}` : "").filter(Boolean).join(" ");
  }, [chartMode, visData, toX, toY]);

  const sma50Pts = useMemo(() => {
    if (chartMode !== "candle") return "";
    return visData.map((d, i) => d.sma50 ? `${toX(i)},${toY(d.sma50)}` : "").filter(Boolean).join(" ");
  }, [chartMode, visData, toX, toY]);

  // ---- RSI data (from backend) ----
  const rsiData = useMemo(() => visData.map(d => d.rsi ?? null), [visData]);
  // ---- MACD data (from backend) ----
  const macdData = useMemo(() => visData.map(d => ({ macd: d.macd ?? null, signal: d.macdSignal ?? null, hist: d.macdHist ?? null })), [visData]);
  // ---- ATR data (from backend) ----
  const atrData = useMemo(() => visData.map(d => d.atr ?? null), [visData]);
  // ---- Stochastic data (from backend) ----
  const stochData = useMemo(() => visData.map(d => ({ k: d.stochK ?? null, d: d.stochD ?? null })), [visData]);

  // ---- Volume Profile (computed client-side) ----
  const volumeProfile = useMemo(() => {
    if (!overlayVolProfile || visData.length === 0) return [];
    const bins = 30;
    const profile: { price: number; volume: number }[] = [];
    const priceBinSize = range / bins;
    for (let b = 0; b < bins; b++) {
      const binLow = minP + b * priceBinSize;
      const binHigh = binLow + priceBinSize;
      const binMid = (binLow + binHigh) / 2;
      let vol = 0;
      visData.forEach(d => {
        if (d.close && d.close >= binLow && d.close < binHigh) vol += d.volume || 0;
      });
      profile.push({ price: binMid, volume: vol });
    }
    return profile;
  }, [overlayVolProfile, visData, minP, range]);
  const maxProfileVol = Math.max(...volumeProfile.map(p => p.volume), 1);
  const pocPrice = volumeProfile.length > 0 ? volumeProfile.reduce((a, b) => a.volume > b.volume ? a : b).price : 0;

  // ---- Comparison mode normalized data ----
  const compNormalized = useMemo(() => {
    if (!comparisonTicker || comparisonData.length === 0 || visData.length === 0) return null;
    // Slice comparison data to match visible range length
    const compSlice = comparisonData.slice(Math.max(0, comparisonData.length - visData.length));
    if (compSlice.length === 0) return null;
    const baseFirst = visData[0]?.close || 1;
    const compFirst = compSlice[0]?.close || 1;
    const basePcts = visData.map(d => ((d.close || baseFirst) / baseFirst - 1) * 100);
    const compPcts = compSlice.map(d => ((d.close || compFirst) / compFirst - 1) * 100);
    const allPcts = [...basePcts, ...compPcts];
    const pctMin = Math.min(...allPcts), pctMax = Math.max(...allPcts);
    const pctRange = pctMax - pctMin || 1;
    return { basePcts, compPcts, pctMin, pctMax, pctRange, compSlice };
  }, [comparisonTicker, comparisonData, visData]);

  // ATR & Stoch panel heights
  const ATR_H = 60, STOCH_H = 60;

  // ---- Pan / Zoom handlers ----
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const [s, en] = visibleRange;
    const currentWidth = en - s;
    const zoomFactor = e.deltaY > 0 ? 1.15 : 0.87; // scroll down = zoom out, up = zoom in
    let newWidth = Math.round(currentWidth * zoomFactor);
    newWidth = Math.max(10, Math.min(data.length, newWidth));
    const center = (s + en) / 2;
    let newS = Math.round(center - newWidth / 2);
    let newE = newS + newWidth;
    if (newS < 0) { newS = 0; newE = newWidth; }
    if (newE > data.length) { newE = data.length; newS = Math.max(0, newE - newWidth); }
    setVisibleRange([newS, newE]);
  }, [visibleRange, data.length]);

  const handlePanStart = useCallback((e: React.MouseEvent) => {
    if (drawingMode !== "none") return;
    setIsPanning(true);
    setPanStartX(e.clientX);
    setPanStartRange([...visibleRange]);
  }, [drawingMode, visibleRange]);

  const handlePanMove = useCallback((e: React.MouseEvent) => {
    if (!isPanning || !chartContainerRef.current) return;
    const dx = e.clientX - panStartX;
    const chartWidth = chartContainerRef.current.getBoundingClientRect().width;
    const dataShift = Math.round((-dx / chartWidth) * (panStartRange[1] - panStartRange[0]));
    let newS = panStartRange[0] + dataShift;
    let newE = panStartRange[1] + dataShift;
    const w = newE - newS;
    if (newS < 0) { newS = 0; newE = w; }
    if (newE > data.length) { newE = data.length; newS = Math.max(0, newE - w); }
    setVisibleRange([newS, newE]);
  }, [isPanning, panStartX, panStartRange, data.length]);

  const handlePanEnd = useCallback(() => { setIsPanning(false); }, []);

  // ---- Hover / Tooltip ----
  const handleSvgMove = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    if (!svgRef.current || !visData.length || isPanning) return;
    const rect = svgRef.current.getBoundingClientRect();
    const xPct = (e.clientX - rect.left) / rect.width;
    const idx = Math.round(xPct * (visData.length - 1));
    if (idx >= 0 && idx < visData.length) {
      const d = visData[idx];
      const px = (idx / Math.max(visData.length - 1, 1)) * rect.width;
      const py = ((d.close - minP) / range);
      // Tooltip position in pixels relative to chart container
      setHover({ ...d, idx, screenX: e.clientX - rect.left, screenY: e.clientY - rect.top, globalIdx: visibleRange[0] + idx });
    }
  }, [visData, minP, range, isPanning, visibleRange]);

  // ---- Chart click (alerts, drawings) ----
  const handleChartClick = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    if (isPanning) return;
    if (!svgRef.current || !visData.length) return;
    const rect = svgRef.current.getBoundingClientRect();
    const xPct = (e.clientX - rect.left) / rect.width;
    const yPct = (e.clientY - rect.top) / rect.height;
    const idx = Math.round(xPct * (visData.length - 1));
    const priceAtY = maxP - (yPct * (CHART_H)) / PRICE_H * range;
    const rounded = Math.round(priceAtY * 100) / 100;
    const globalIdx = visibleRange[0] + idx;

    // Shift+Click = price alert
    if (e.shiftKey && drawingMode === "none") {
      fetch(`${BASE}/alerts`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ticker, condition: rounded > (quote?.price || 0) ? "above" : "below", price: rounded })
      }).then(() => {
        setAlertMsg(`Alert set: ${ticker} ${rounded > (quote?.price || 0) ? "above" : "below"} $${rounded.toFixed(2)}`);
        setTimeout(() => setAlertMsg(""), 3000);
      }).catch(() => {});
      return;
    }

    if (drawingMode === "hline") {
      const newDrawing: Drawing = { type: "hline", ticker, price: rounded, color: "#06b6d4" };
      setDrawings(prev => ({ ...prev, [ticker]: [...(prev[ticker] || []), newDrawing] }));
      setAlertMsg(`H-Level at $${rounded.toFixed(2)}`);
      setTimeout(() => setAlertMsg(""), 2000);
    } else if (drawingMode === "trendline") {
      if (!drawStart) {
        setDrawStart({ idx: globalIdx, price: rounded });
        setAlertMsg("Click endpoint for trendline");
      } else {
        const newDrawing: Drawing = { type: "trendline", ticker, dateIdx: drawStart.idx, price: drawStart.price, dateIdx2: globalIdx, price2: rounded, color: "#f59e0b" };
        setDrawings(prev => ({ ...prev, [ticker]: [...(prev[ticker] || []), newDrawing] }));
        setDrawStart(null);
        setAlertMsg("Trendline added");
        setTimeout(() => setAlertMsg(""), 2000);
      }
    } else if (drawingMode === "annotation") {
      setShowAnnotationPrompt({ x: e.clientX - (svgRef.current?.getBoundingClientRect().left || 0), y: e.clientY - (svgRef.current?.getBoundingClientRect().top || 0), idx: globalIdx, price: rounded });
    }
  }, [isPanning, visData, visibleRange, maxP, range, drawingMode, drawStart, ticker, quote, BASE]);

  const submitAnnotation = useCallback(() => {
    if (!showAnnotationPrompt || !annotationInput.trim()) return;
    const newDrawing: Drawing = { type: "annotation", ticker, dateIdx: showAnnotationPrompt.idx, price: showAnnotationPrompt.price, text: annotationInput.trim(), color: "#e879f9" };
    setDrawings(prev => ({ ...prev, [ticker]: [...(prev[ticker] || []), newDrawing] }));
    setAnnotationInput(""); setShowAnnotationPrompt(null);
  }, [showAnnotationPrompt, annotationInput, ticker]);

  const clearDrawings = () => setDrawings(prev => ({ ...prev, [ticker]: [] }));
  const undoDrawing = () => setDrawings(prev => { const arr = [...(prev[ticker] || [])]; arr.pop(); return { ...prev, [ticker]: arr }; });
  const tickerDrawings = drawings[ticker] || [];

  // Convert drawing data-space coords to current visible SVG coords
  const drawingToSvg = useCallback((globalIdx: number, price: number) => {
    const localIdx = globalIdx - visibleRange[0];
    return { x: toX(localIdx), y: toY(price) };
  }, [visibleRange, toX, toY]);

  // ---- Remove mini chart ----
  const removeMiniTicker = (t: string) => setMultiTickers(prev => prev.filter(x => x !== t));

  // ---- Portfolio position for current ticker ----
  const position = portfolio?.[ticker];
  const positionPnl = position && quote?.price != null ? (quote.price - position.cost_basis) * position.shares : null;
  const positionPnlPct = position && quote?.price != null && position.cost_basis > 0 ? ((quote.price - position.cost_basis) / position.cost_basis) * 100 : null;

  // ---- Theme ----
  const bg = dark ? "#0a0a0f" : "#ffffff", bgCard = dark ? "#111118" : "#f8f9fa";
  const bdr = dark ? "#1e1e2e" : "#e5e7eb", txt = dark ? "#f1f1f4" : "#111827";
  const txt2 = dark ? "#71717a" : "#6b7280", txtDim = dark ? "#52525b" : "#9ca3af";
  const wBg = dark ? "#0d0d14" : "#f9fafb", wHov = dark ? "#16161f" : "#f3f4f6";
  const secBg = dark ? "#0f0f17" : "#f1f3f5", pillBg = dark ? "#1a1a25" : "#f3f4f6";
  const greenC = "#22c55e", redC = "#ef4444";

  // ---- Watchlist row ----
  const WatchRow = ({ t }: { t: string }) => {
    const q = watchPrices[t]; const isAct = t === ticker;
    const price = q?.price; const chg = q?.changePercent ?? q?.change_pct ?? 0;
    return (
      <div className="watch-row" onClick={() => selectTicker(t)} style={{
        padding: "8px 14px", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center",
        borderBottom: `1px solid ${bdr}`, borderLeft: isAct ? `3px solid ${accent}` : "3px solid transparent",
        background: isAct ? (dark ? "#15151f" : "#eef2ff") : "transparent", transition: "all 0.15s ease",
      }}
        onMouseEnter={e => { if (!isAct) e.currentTarget.style.background = wHov; }}
        onMouseLeave={e => { if (!isAct) e.currentTarget.style.background = isAct ? (dark ? "#15151f" : "#eef2ff") : "transparent"; }}>
        <span style={{ fontWeight: 700, fontSize: 13, minWidth: 48 }}>{t}</span>
        <div style={{ textAlign: "right", fontFamily: "'JetBrains Mono', monospace", lineHeight: 1.3 }}>
          {price != null ? (<div style={{ animation: "fadeIn 0.3s ease" }}>
            <div style={{ fontSize: 12, fontWeight: 600 }}>${price.toFixed(2)}</div>
            <div style={{ fontSize: 10, fontWeight: 600, color: chg >= 0 ? greenC : redC }}>{chg >= 0 ? "+" : ""}{chg.toFixed(2)}%</div>
          </div>) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 4, alignItems: "flex-end" }}>
              <div className="skeleton" style={{ width: 56, height: 12, background: dark ? "#1a1a25" : "#e5e7eb" }} />
              <div className="skeleton" style={{ width: 40, height: 10, background: dark ? "#1a1a25" : "#e5e7eb" }} />
            </div>
          )}
        </div>
      </div>
    );
  };

  // ---- RENDER ----
  return (
    <div style={{ display: "flex", gap: 0, minHeight: "100%", background: bg, color: txt, fontFamily: "'DM Sans', system-ui, sans-serif" }}>
      {/* MAIN CHART AREA */}
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
          <button className="chart-btn" onClick={() => toggleWatch(ticker)} style={{ padding: "10px 16px", borderRadius: 10, fontSize: 13, fontWeight: 600,
            border: isWatching ? `1px solid ${accent}` : `1px solid ${bdr}`, background: isWatching ? (dark ? accent + "20" : accent + "15") : "transparent", color: isWatching ? accent : txt2 }}>
            {isWatching ? "✓ Watching" : "+ Watch"}
          </button>
          {onAIAnalyze && <button className="chart-btn" onClick={() => onAIAnalyze(ticker)} style={{ padding: "10px 16px", borderRadius: 10, fontSize: 13, fontWeight: 600,
            border: `1px solid #8b5cf6`, background: dark ? "#8b5cf620" : "#8b5cf615", color: "#8b5cf6" }}>{"🧠"} AI</button>}
        </div>

        {/* Price header — always shows live price */}
        <div style={{ marginBottom: 4 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: txt2, letterSpacing: 1, textTransform: "uppercase", marginBottom: 4, display: "flex", alignItems: "center", gap: 8 }}>
            {ticker} {quote?.name ? `· ${quote.name}` : ""}
            {marketOpen && <span style={{ display: "inline-block", width: 8, height: 8, borderRadius: "50%", background: greenC, animation: "pulse 2s infinite", boxShadow: `0 0 6px ${greenC}` }} />}
          </div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 12 }}>
            {quote?.price != null ? (
              <span style={{ fontSize: 32, fontWeight: 800, fontFamily: "'JetBrains Mono', monospace", transition: "color 0.3s",
                color: flash === "up" ? greenC : flash === "down" ? redC : txt,
                textShadow: flash ? `0 0 20px ${flash === "up" ? greenC + "50" : redC + "50"}` : "none",
                animation: "fadeIn 0.3s ease" }}>
                ${quote.price.toFixed(2)}
              </span>
            ) : (
              <div className="skeleton" style={{ width: 180, height: 36, background: dark ? "#1a1a25" : "#e5e7eb", borderRadius: 8 }} />
            )}
            {quote?.price != null && <span style={{ fontSize: 14, fontWeight: 600, color: accent, animation: "fadeIn 0.3s ease" }}>
              {(quote.change ?? 0) >= 0 ? "▲" : "▼"} ${Math.abs(quote.change ?? 0).toFixed(2)} ({(quote.changePercent ?? 0).toFixed(2)}%)
            </span>}
            <span style={{ fontSize: 11, color: txtDim }}>Updated {updateText}</span>
          </div>
          {ext && (ext.premarket_price || ext.afterhours_price) && (
            <div style={{ fontSize: 12, color: txtDim, marginTop: 2 }}>
              {ext.premarket_price ? `Pre-market $${ext.premarket_price.toFixed(2)}` : `After hours $${(ext.afterhours_price ?? 0).toFixed(2)}`}{" "}
              <span style={{ color: ((ext.premarket_change_pct||ext.afterhours_change_pct||0) >= 0) ? greenC : redC }}>
                {(ext.premarket_change_pct||ext.afterhours_change_pct||0) >= 0 ? "+" : ""}{(ext.premarket_change_pct||ext.afterhours_change_pct||0).toFixed(2)}%
              </span>
            </div>
          )}
        </div>

        {/* Position Info */}
        {position && (
          <div style={{ display: "flex", gap: 12, alignItems: "center", padding: "6px 12px", borderRadius: 8, margin: "4px 0 0",
            background: dark ? "#111118" : "#f8f9fa", border: `1px solid ${bdr}`, animation: "fadeIn 0.3s ease" }}>
            <span style={{ fontSize: 11, color: txt2, fontWeight: 600 }}>YOUR POSITION</span>
            <span style={{ fontSize: 12, fontFamily: "'JetBrains Mono', monospace" }}>
              <span style={{ color: "#f59e0b", fontWeight: 700 }}>{position.shares % 1 === 0 ? position.shares : position.shares.toFixed(3)}</span>
              <span style={{ color: txt2 }}> shares</span>
            </span>
            <span style={{ fontSize: 12, fontFamily: "'JetBrains Mono', monospace", color: txt2 }}>
              @ <span style={{ fontWeight: 600, color: txt }}>${position.cost_basis.toFixed(2)}</span> avg
            </span>
            {quote?.price != null && (
              <>
                <span style={{ fontSize: 12, fontFamily: "'JetBrains Mono', monospace", fontWeight: 700,
                  color: (positionPnl || 0) >= 0 ? greenC : redC }}>
                  {(positionPnl || 0) >= 0 ? "+" : ""}${(positionPnl || 0).toFixed(2)}
                </span>
                <span style={{ fontSize: 11, fontFamily: "'JetBrains Mono', monospace",
                  color: (positionPnlPct || 0) >= 0 ? greenC : redC }}>
                  ({(positionPnlPct || 0) >= 0 ? "+" : ""}{(positionPnlPct || 0).toFixed(2)}%)
                </span>
              </>
            )}
          </div>
        )}

        {/* Controls Row */}
        <div style={{ display: "flex", gap: 6, margin: "8px 0", alignItems: "center", flexWrap: "wrap" }}>
          <span style={{ fontSize: 10, color: txtDim, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1 }}>Overlays</span>
          {[
            { key: "BB", active: overlayBB, toggle: () => setOverlayBB(v => !v), color: "#a78bfa" },
            { key: "VWAP", active: overlayVWAP, toggle: () => setOverlayVWAP(v => !v), color: "#f59e0b" },
            { key: "Fib", active: overlayFib, toggle: () => setOverlayFib(v => !v), color: "#06b6d4" },
            { key: "VP", active: overlayVolProfile, toggle: () => setOverlayVolProfile(v => !v), color: "#ec4899" },
          ].map(o => (
            <button key={o.key} className="chart-btn" onClick={o.toggle} style={{
              padding: "5px 14px", fontSize: 11, fontWeight: o.active ? 700 : 500, borderRadius: 8,
              border: `1px solid ${o.active ? o.color : bdr}`,
              background: o.active ? o.color + "20" : "transparent",
              color: o.active ? o.color : txt2,
              boxShadow: o.active ? `0 0 12px ${o.color}25` : "none",
            }}>{o.key}</button>
          ))}
          <div style={{ width: 1, height: 20, background: bdr, margin: "0 6px" }} />
          <span style={{ fontSize: 10, color: txtDim, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1 }}>Chart</span>
          {([["line", "Line"], ["candle", "Candle"]] as [typeof chartMode, string][]).map(([m, l]) => (
            <button key={m} className="chart-btn" onClick={() => setChartMode(m)} style={{
              padding: "5px 14px", fontSize: 11, fontWeight: chartMode === m ? 700 : 500, borderRadius: 8,
              border: `1px solid ${chartMode === m ? accent : bdr}`,
              background: chartMode === m ? accent + "20" : "transparent",
              color: chartMode === m ? accent : txt2,
              boxShadow: chartMode === m ? `0 0 12px ${accent}25` : "none",
            }}>{l}</button>
          ))}
          <div style={{ width: 1, height: 20, background: bdr, margin: "0 6px" }} />
          <span style={{ fontSize: 10, color: txtDim, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1 }}>Indicators</span>
          {[
            { key: "RSI", active: showRSI, toggle: () => setShowRSI(v => !v), color: "#f97316" },
            { key: "MACD", active: showMACD, toggle: () => setShowMACD(v => !v), color: "#06b6d4" },
            { key: "ATR", active: showATR, toggle: () => setShowATR(v => !v), color: "#14b8a6" },
            { key: "Stoch", active: showStoch, toggle: () => setShowStoch(v => !v), color: "#e879f9" },
          ].map(o => (
            <button key={o.key} className="chart-btn" onClick={o.toggle} style={{
              padding: "5px 14px", fontSize: 11, fontWeight: o.active ? 700 : 500, borderRadius: 8,
              border: `1px solid ${o.active ? o.color : bdr}`,
              background: o.active ? o.color + "20" : "transparent",
              color: o.active ? o.color : txt2,
              boxShadow: o.active ? `0 0 12px ${o.color}25` : "none",
            }}>{o.key}</button>
          ))}
          <div style={{ width: 1, height: 20, background: bdr, margin: "0 6px" }} />
          <button className="chart-btn" onClick={() => setShowPatterns(v => !v)} style={{
            padding: "5px 14px", fontSize: 11, fontWeight: showPatterns ? 700 : 500, borderRadius: 8,
            border: `1px solid ${showPatterns ? "#facc15" : bdr}`,
            background: showPatterns ? "#facc1520" : "transparent",
            color: showPatterns ? "#facc15" : txt2,
            boxShadow: showPatterns ? `0 0 12px #facc1525` : "none",
          }}>Patterns</button>
          <button className="chart-btn" onClick={() => setShowProbCone(v => !v)} style={{
            padding: "5px 14px", fontSize: 11, fontWeight: showProbCone ? 700 : 500, borderRadius: 8,
            border: `1px solid ${showProbCone ? "#a78bfa" : bdr}`,
            background: showProbCone ? "#a78bfa20" : "transparent",
            color: showProbCone ? "#a78bfa" : txt2,
            boxShadow: showProbCone ? `0 0 12px #a78bfa25` : "none",
          }}>σ Cone</button>
          <div style={{ position: "relative" }}>
            <button className="chart-btn" onClick={() => setShowCompareInput(v => !v)} style={{
              padding: "5px 14px", fontSize: 11, fontWeight: comparisonTicker ? 700 : 500, borderRadius: 8,
              border: `1px solid ${comparisonTicker ? "#fb923c" : bdr}`,
              background: comparisonTicker ? "#fb923c20" : "transparent",
              color: comparisonTicker ? "#fb923c" : txt2,
            }}>{comparisonTicker ? `vs ${comparisonTicker}` : "Compare"}</button>
            {showCompareInput && (
              <div style={{ position: "absolute", top: "calc(100% + 4px)", left: 0, zIndex: 60, display: "flex", gap: 4, animation: "fadeIn 0.15s ease" }}>
                <input value={compareSearch} onChange={e => setCompareSearch(e.target.value.toUpperCase())} placeholder="SPY..." autoFocus
                  onKeyDown={e => { if (e.key === "Enter" && compareSearch) { setComparisonTicker(compareSearch); setShowCompareInput(false); setCompareSearch(""); }
                    if (e.key === "Escape") setShowCompareInput(false); }}
                  style={{ padding: "4px 8px", fontSize: 11, borderRadius: 4, border: `1px solid #fb923c`, background: dark ? "#1a1a25" : "#fff", color: txt, width: 80, outline: "none" }} />
                {comparisonTicker && <button onClick={() => { setComparisonTicker(null); setShowCompareInput(false); }} style={{
                  padding: "4px 8px", fontSize: 10, borderRadius: 4, background: redC, color: "#fff", border: "none", cursor: "pointer",
                }}>×</button>}
              </div>
            )}
          </div>
          <div style={{ flex: 1 }} />
          <span style={{ fontSize: 10, color: txtDim, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1 }}>Layout</span>
          {(["1x1", "2x2", "1x3"] as const).map(l => (
            <button key={l} className="chart-btn" onClick={() => setLayout(l)} style={{
              padding: "5px 12px", fontSize: 10, fontWeight: l === layout ? 700 : 500, borderRadius: 8,
              border: `1px solid ${l === layout ? accent : bdr}`,
              background: l === layout ? accent + "20" : "transparent",
              color: l === layout ? accent : txt2,
              boxShadow: l === layout ? `0 0 12px ${accent}25` : "none",
            }}>{l}</button>
          ))}
        </div>

        {/* Drawing Tools */}
        <div style={{ display: "flex", gap: 6, margin: "4px 0", alignItems: "center", flexWrap: "wrap" }}>
          <span style={{ fontSize: 10, color: txtDim, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1 }}>Draw</span>
          {([
            { key: "none", label: "Select", color: txt2 },
            { key: "trendline", label: "Trendline", color: "#f59e0b" },
            { key: "hline", label: "H-Level", color: "#06b6d4" },
            { key: "annotation", label: "Note", color: "#e879f9" },
          ] as { key: DrawingType; label: string; color: string }[]).map(d => (
            <button key={d.key} className="chart-btn" onClick={() => { setDrawingMode(d.key); setDrawStart(null); setShowAnnotationPrompt(null); }} style={{
              padding: "5px 12px", fontSize: 10, fontWeight: drawingMode === d.key ? 700 : 500, borderRadius: 8,
              border: `1px solid ${drawingMode === d.key ? d.color : bdr}`,
              background: drawingMode === d.key ? d.color + "20" : "transparent",
              color: drawingMode === d.key ? d.color : txt2,
            }}>{d.label}</button>
          ))}
          {tickerDrawings.length > 0 && <>
            <button className="chart-btn" onClick={undoDrawing} style={{ padding: "5px 12px", fontSize: 10, borderRadius: 8, border: `1px solid ${bdr}`, background: "transparent", color: txt2 }}>Undo</button>
            <button className="chart-btn" onClick={clearDrawings} style={{ padding: "5px 12px", fontSize: 10, borderRadius: 8, border: `1px solid ${bdr}`, background: "transparent", color: redC }}>Clear</button>
          </>}
          {drawingMode !== "none" && <span style={{ fontSize: 10, color: "#f59e0b", fontStyle: "italic" }}>
            {drawingMode === "trendline" ? (drawStart ? "Click endpoint" : "Click start point") : drawingMode === "hline" ? "Click to place level" : "Click to add note"}
          </span>}
        </div>

        {/* Alert toast */}
        {alertMsg && (
          <div style={{ position: "fixed", bottom: 24, right: 24, zIndex: 999, padding: "10px 20px", borderRadius: 8, background: greenC, color: "#fff", fontSize: 12, fontWeight: 600, boxShadow: "0 4px 12px rgba(0,0,0,0.3)" }}>
            {alertMsg}
          </div>
        )}

        {/* ======== MAIN CHART SVG ======== */}
        <div ref={chartContainerRef} style={{ position: "relative", margin: "8px 0", userSelect: "none" }}
          onMouseDown={handlePanStart} onMouseMove={handlePanMove} onMouseUp={handlePanEnd} onMouseLeave={() => { handlePanEnd(); setHover(null); }}>
          {loading && <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", color: txtDim, fontSize: 13, zIndex: 10 }}>Loading...</div>}

          <svg ref={svgRef} viewBox={`0 0 ${W} ${CHART_H}`}
            style={{ width: "100%", height: "auto", maxHeight: "55vh", aspectRatio: `${W} / ${CHART_H}`, cursor: drawingMode !== "none" ? "cell" : isPanning ? "grabbing" : "crosshair", display: "block" }}
            onMouseMove={handleSvgMove} onMouseLeave={() => setHover(null)} onClick={handleChartClick}
            onWheel={handleWheel}>
            <defs>
              <linearGradient id="cg" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={accent} stopOpacity={0.25}/>
                <stop offset="100%" stopColor={accent} stopOpacity={0.02}/>
              </linearGradient>
              <clipPath id="priceClip"><rect x={0} y={0} width={W} height={PRICE_H} /></clipPath>
              <clipPath id="volClip"><rect x={0} y={PRICE_H + GAP} width={W} height={VOL_H} /></clipPath>
            </defs>

            {/* Price grid lines */}
            {[0.25, 0.5, 0.75].map(pct => {
              const y = PRICE_H * pct;
              const p = maxP - pct * range;
              return <g key={pct}>
                <line x1={0} y1={y} x2={W} y2={y} stroke={bdr} strokeWidth={0.5} />
                <text x={W - 4} y={y - 3} fontSize={8} fill={txtDim} textAnchor="end" fontFamily="'JetBrains Mono', monospace">${p.toFixed(2)}</text>
              </g>;
            })}

            {/* ---- PRICE AREA ---- */}
            <g clipPath="url(#priceClip)">
              {/* Bollinger Bands */}
              {overlayBB && bbUpperPts && <>
                <polyline points={bbUpperPts} fill="none" stroke="#a78bfa" strokeWidth={1} strokeOpacity={0.5} strokeDasharray="4,2" />
                <polyline points={bbMiddlePts} fill="none" stroke="#a78bfa" strokeWidth={1} strokeOpacity={0.7} />
                <polyline points={bbLowerPts} fill="none" stroke="#a78bfa" strokeWidth={1} strokeOpacity={0.5} strokeDasharray="4,2" />
              </>}
              {/* VWAP */}
              {overlayVWAP && vwapPts && <polyline points={vwapPts} fill="none" stroke="#f59e0b" strokeWidth={1.5} strokeOpacity={0.8} strokeDasharray="6,3" />}
              {/* Fibonacci levels */}
              {overlayFib && fibLevels.map(f => (
                <g key={f.level}>
                  <line x1={0} y1={f.y} x2={W} y2={f.y} stroke="#06b6d4" strokeWidth={0.5} strokeOpacity={0.4} strokeDasharray="8,4" />
                  <text x={W - 5} y={f.y - 3} fontSize={8} fill="#06b6d4" fillOpacity={0.7} textAnchor="end">{(f.level * 100).toFixed(1)}% ${f.price.toFixed(2)}</text>
                </g>
              ))}

              {/* Cost Basis Line (portfolio position) */}
              {position && position.cost_basis >= minP && position.cost_basis <= maxP && (() => {
                const cbY = toY(position.cost_basis);
                const isAbove = quote?.price != null && quote.price >= position.cost_basis;
                const cbColor = isAbove ? "#22c55e" : "#ef4444";
                return (
                  <g>
                    <line x1={0} y1={cbY} x2={W} y2={cbY} stroke={cbColor} strokeWidth={1.5} strokeDasharray="8,4" strokeOpacity={0.7} />
                    <rect x={W - 100} y={cbY - 10} width={98} height={18} rx={4} fill={cbColor} fillOpacity={0.15} stroke={cbColor} strokeWidth={0.5} strokeOpacity={0.5} />
                    <text x={W - 50} y={cbY + 3} fontSize={9} fill={cbColor} fontWeight={700} textAnchor="middle" fontFamily="JetBrains Mono, monospace">
                      AVG ${position.cost_basis.toFixed(2)}
                    </text>
                  </g>
                );
              })()}

              {/* LINE MODE */}
              {chartMode === "line" && <>
                {lineGradPts && <polygon points={lineGradPts} fill="url(#cg)" />}
                {linePoints && <polyline points={linePoints} fill="none" stroke={accent} strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round" />}
              </>}

              {/* CANDLESTICK MODE */}
              {chartMode === "candle" && visData.map((d, i) => {
                if (!d.open || !d.close || !d.high || !d.low) return null;
                const isGreen = d.close >= d.open;
                const color = isGreen ? greenC : redC;
                const x = toX(i);
                const bodyTop = toY(Math.max(d.open, d.close));
                const bodyBot = toY(Math.min(d.open, d.close));
                const bodyH = Math.max(bodyBot - bodyTop, 1);
                const wickTop = toY(d.high);
                const wickBot = toY(d.low);
                return (
                  <g key={i}>
                    {/* Wick */}
                    <line x1={x} y1={wickTop} x2={x} y2={wickBot} stroke={color} strokeWidth={1} />
                    {/* Body */}
                    <rect x={x - candleW / 2} y={bodyTop} width={candleW} height={bodyH}
                      fill={isGreen ? color : color} stroke={color} strokeWidth={0.5}
                      fillOpacity={isGreen ? 1 : 1} />
                  </g>
                );
              })}

              {/* SMA overlays in candle mode */}
              {chartMode === "candle" && sma20Pts && <polyline points={sma20Pts} fill="none" stroke="#f59e0b" strokeWidth={1} strokeOpacity={0.7} />}
              {chartMode === "candle" && sma50Pts && <polyline points={sma50Pts} fill="none" stroke="#8b5cf6" strokeWidth={1} strokeOpacity={0.7} />}

              {/* Volume Profile overlay */}
              {overlayVolProfile && volumeProfile.length > 0 && volumeProfile.map((vp, i) => {
                const barY = toY(vp.price);
                const barW = (vp.volume / maxProfileVol) * W * 0.2;
                const isPoc = Math.abs(vp.price - pocPrice) < range / 60;
                return <rect key={`vp-${i}`} x={W - barW} y={barY - (PRICE_H / 60 / 2)} width={barW} height={Math.max(PRICE_H / 60, 2)}
                  fill={isPoc ? "#ec4899" : "#ec4899"} fillOpacity={isPoc ? 0.5 : 0.2} rx={1} />;
              })}
              {overlayVolProfile && pocPrice > 0 && (
                <text x={W - 4} y={toY(pocPrice) - 4} fontSize={7} fill="#ec4899" textAnchor="end" fontWeight={700}>POC ${pocPrice.toFixed(2)}</text>
              )}

              {/* Comparison mode overlay */}
              {compNormalized && (() => {
                const { compPcts, pctMin, pctRange, compSlice } = compNormalized;
                const normToY = (pct: number) => PRICE_H - ((pct - pctMin) / pctRange) * (PRICE_H - 20) - 10;
                const pts = compPcts.map((pct, i) => `${toX(i)},${normToY(pct)}`).join(" ");
                return <>
                  <polyline points={pts} fill="none" stroke="#fb923c" strokeWidth={1.5} strokeOpacity={0.7} />
                  <text x={W - 4} y={normToY(compPcts[compPcts.length - 1] || 0) - 4} fontSize={8} fill="#fb923c" textAnchor="end" fontWeight={700}>
                    {comparisonTicker} {(compPcts[compPcts.length - 1] || 0) >= 0 ? "+" : ""}{(compPcts[compPcts.length - 1] || 0).toFixed(1)}%
                  </text>
                </>;
              })()}

              {/* Probability Cone */}
              {showProbCone && ivData?.currentIV && quote?.price && (() => {
                const iv = ivData.currentIV / 100; // convert from percentage
                const currentPrice = quote.price;
                const daysInPeriod = period === "1d" ? 1 : period === "5d" ? 5 : period === "1m" ? 30 : period === "3m" ? 90 : period === "6m" ? 180 : period === "1y" ? 365 : 730;
                const stepsForward = Math.min(20, Math.floor(visCount * 0.3));
                const lastX = toX(visCount - 1);
                const conePoints1u: string[] = [];
                const conePoints1d: string[] = [];
                const conePoints2u: string[] = [];
                const conePoints2d: string[] = [];
                for (let s = 0; s <= stepsForward; s++) {
                  const daysFwd = (s / stepsForward) * (daysInPeriod * 0.5);
                  const move1 = currentPrice * iv * Math.sqrt(daysFwd / 365);
                  const move2 = move1 * 2;
                  const x = lastX + (s / stepsForward) * (W - lastX);
                  conePoints1u.push(`${x},${toY(currentPrice + move1)}`);
                  conePoints1d.push(`${x},${toY(currentPrice - move1)}`);
                  conePoints2u.push(`${x},${toY(currentPrice + move2)}`);
                  conePoints2d.push(`${x},${toY(currentPrice - move2)}`);
                }
                const poly2 = [...conePoints2u, ...conePoints2d.reverse()].join(" ");
                const poly1 = [...conePoints1u, ...conePoints1d.reverse()].join(" ");
                return <>
                  <polygon points={poly2} fill="#a78bfa" fillOpacity={0.06} />
                  <polygon points={poly1} fill="#a78bfa" fillOpacity={0.12} />
                  <polyline points={conePoints1u.join(" ")} fill="none" stroke="#a78bfa" strokeWidth={0.8} strokeDasharray="3,3" strokeOpacity={0.5} />
                  <polyline points={conePoints1d.join(" ")} fill="none" stroke="#a78bfa" strokeWidth={0.8} strokeDasharray="3,3" strokeOpacity={0.5} />
                  <polyline points={conePoints2u.join(" ")} fill="none" stroke="#a78bfa" strokeWidth={0.5} strokeDasharray="2,4" strokeOpacity={0.3} />
                  <polyline points={conePoints2d.join(" ")} fill="none" stroke="#a78bfa" strokeWidth={0.5} strokeDasharray="2,4" strokeOpacity={0.3} />
                  <text x={W - 4} y={toY(currentPrice + currentPrice * iv * Math.sqrt(daysInPeriod * 0.5 / 365)) - 4} fontSize={7} fill="#a78bfa" textAnchor="end" fillOpacity={0.7}>1σ (68%)</text>
                  <text x={W - 4} y={toY(currentPrice + currentPrice * iv * Math.sqrt(daysInPeriod * 0.5 / 365) * 2) - 4} fontSize={6} fill="#a78bfa" textAnchor="end" fillOpacity={0.5}>2σ (95%)</text>
                </>;
              })()}

              {/* Pattern Recognition labels */}
              {showPatterns && patterns.length > 0 && patterns.map((pat, i) => {
                const localIdx = pat.index - visibleRange[0];
                if (localIdx < 0 || localIdx >= visCount) return null;
                const x = toX(localIdx);
                const d = visData[localIdx];
                if (!d) return null;
                const y = pat.direction === "bull" ? toY(d.low || d.close) + 16 : toY(d.high || d.close) - 8;
                const color = pat.direction === "bull" ? greenC : pat.direction === "bear" ? redC : "#facc15";
                const icon = pat.direction === "bull" ? "▲" : pat.direction === "bear" ? "▼" : "◆";
                return <g key={`pat-${i}`}>
                  <text x={x} y={y} fontSize={7} fill={color} textAnchor="middle" fontWeight={700}>{icon}</text>
                  <text x={x} y={y + (pat.direction === "bull" ? 8 : -4)} fontSize={6} fill={color} textAnchor="middle" fillOpacity={0.8}>{pat.pattern}</text>
                </g>;
              })}

              {/* User drawings */}
              {tickerDrawings.map((d, i) => {
                if (d.type === "hline" && d.price != null) {
                  const y = toY(d.price);
                  return <g key={`draw-${i}`}>
                    <line x1={0} y1={y} x2={W} y2={y} stroke={d.color || "#06b6d4"} strokeWidth={1} strokeDasharray="6,3" />
                    <text x={5} y={y - 4} fontSize={9} fill={d.color || "#06b6d4"} fontWeight={600}>${d.price.toFixed(2)}</text>
                  </g>;
                }
                if (d.type === "trendline" && d.dateIdx != null && d.price != null && d.dateIdx2 != null && d.price2 != null) {
                  const p1 = drawingToSvg(d.dateIdx, d.price);
                  const p2 = drawingToSvg(d.dateIdx2, d.price2);
                  return <line key={`draw-${i}`} x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} stroke={d.color || "#f59e0b"} strokeWidth={1.5} />;
                }
                if (d.type === "annotation" && d.dateIdx != null && d.price != null && d.text) {
                  const p = drawingToSvg(d.dateIdx, d.price);
                  return <g key={`draw-${i}`}>
                    <circle cx={p.x} cy={p.y} r={3} fill={d.color || "#e879f9"} />
                    <rect x={p.x + 6} y={p.y - 10} width={Math.min(d.text.length * 5.5 + 8, 150)} height={16} rx={3} fill={dark ? "#1e1e2e" : "#f3f4f6"} stroke={d.color || "#e879f9"} strokeWidth={0.5} />
                    <text x={p.x + 10} y={p.y + 2} fontSize={9} fill={d.color || "#e879f9"}>{d.text.slice(0, 25)}</text>
                  </g>;
                }
                return null;
              })}

              {/* In-progress trendline */}
              {drawingMode === "trendline" && drawStart && hover && (() => {
                const p1 = drawingToSvg(drawStart.idx, drawStart.price);
                const p2Idx = hover.globalIdx;
                const p2Price = visData[hover.idx]?.close || 0;
                const p2 = drawingToSvg(p2Idx, p2Price);
                return <line x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} stroke="#f59e0b" strokeWidth={1} strokeDasharray="4,4" strokeOpacity={0.6} />;
              })()}

              {/* Hover crosshair */}
              {hover && !isPanning && <>
                <line x1={toX(hover.idx)} y1={0} x2={toX(hover.idx)} y2={PRICE_H} stroke={txtDim} strokeWidth={0.5} strokeDasharray="4,4" />
                <line x1={0} y1={toY(hover.close)} x2={W} y2={toY(hover.close)} stroke={txtDim} strokeWidth={0.5} strokeDasharray="4,4" />
                <circle cx={toX(hover.idx)} cy={toY(hover.close)} r={4} fill={accent} stroke={bg} strokeWidth={2} />
              </>}
            </g>

            {/* Separator line */}
            <line x1={0} y1={PRICE_H + 2} x2={W} y2={PRICE_H + 2} stroke={bdr} strokeWidth={0.5} />

            {/* ---- VOLUME AREA ---- */}
            <g clipPath="url(#volClip)">
              {visData.map((d, i) => {
                if (!d.volume) return null;
                const isGreen = (d.close || 0) >= (d.open || 0);
                const volH = (d.volume / maxVol) * (VOL_H - 4);
                const barW = chartMode === "candle" ? candleW : Math.max(1, W / visCount * 0.7);
                return <rect key={`v-${i}`} x={toX(i) - barW / 2} y={PRICE_H + GAP + VOL_H - volH}
                  width={barW} height={volH}
                  fill={isGreen ? greenC : redC} fillOpacity={0.4} />;
              })}
              {/* Volume hover highlight */}
              {hover && !isPanning && hover.volume && (() => {
                const volH = (hover.volume / maxVol) * (VOL_H - 4);
                const barW = chartMode === "candle" ? candleW : Math.max(1, W / visCount * 0.7);
                const isGreen = (hover.close || 0) >= (hover.open || 0);
                return <rect x={toX(hover.idx) - barW / 2} y={PRICE_H + GAP + VOL_H - volH}
                  width={barW} height={volH}
                  fill={isGreen ? greenC : redC} fillOpacity={0.8} />;
              })()}
            </g>

            {/* Volume label */}
            <text x={4} y={PRICE_H + GAP + 10} fontSize={8} fill={txtDim} fontFamily="'JetBrains Mono', monospace">VOL</text>
          </svg>

          {/* Annotation input popup */}
          {showAnnotationPrompt && (
            <div style={{ position: "absolute", left: showAnnotationPrompt.x, top: showAnnotationPrompt.y, zIndex: 50, display: "flex", gap: 4 }}>
              <input value={annotationInput} onChange={e => setAnnotationInput(e.target.value)} placeholder="Note..." autoFocus
                onKeyDown={e => { if (e.key === "Enter") submitAnnotation(); if (e.key === "Escape") setShowAnnotationPrompt(null); }}
                style={{ padding: "4px 8px", fontSize: 11, borderRadius: 4, border: `1px solid #e879f9`, background: dark ? "#1a1a25" : "#fff", color: txt, width: 140, outline: "none" }} />
              <button onClick={submitAnnotation} style={{ padding: "4px 8px", fontSize: 10, borderRadius: 4, background: "#e879f9", color: "#fff", border: "none", cursor: "pointer" }}>OK</button>
            </div>
          )}

          {/* ---- FLOATING TOOLTIP ---- */}
          {hover && !isPanning && (
            <div ref={tooltipRef} className="tooltip-card" style={{
              position: "absolute",
              left: hover.screenX > (chartContainerRef.current?.getBoundingClientRect().width || 600) * 0.7 ? hover.screenX - 200 : hover.screenX + 16,
              top: hover.screenY > 200 ? hover.screenY - 140 : hover.screenY + 16,
              background: dark ? "#1a1a2eee" : "#ffffffee", border: `1px solid ${bdr}`,
              borderRadius: 12, padding: "12px 16px", fontSize: 11, pointerEvents: "none",
              boxShadow: "0 12px 32px rgba(0,0,0,0.3)", zIndex: 50, minWidth: 190,
              fontFamily: "'JetBrains Mono', monospace", backdropFilter: "blur(12px)",
            }}>
              <div style={{ fontWeight: 700, marginBottom: 6, fontSize: 12, color: txt }}>{hover.date}</div>
              <div style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: "2px 10px" }}>
                <span style={{ color: txtDim }}>Open</span><span style={{ textAlign: "right" }}>${hover.open?.toFixed(2) ?? "—"}</span>
                <span style={{ color: txtDim }}>High</span><span style={{ textAlign: "right", color: greenC }}>${hover.high?.toFixed(2) ?? "—"}</span>
                <span style={{ color: txtDim }}>Low</span><span style={{ textAlign: "right", color: redC }}>${hover.low?.toFixed(2) ?? "—"}</span>
                <span style={{ color: txtDim }}>Close</span><span style={{ textAlign: "right", fontWeight: 700 }}>${hover.close?.toFixed(2) ?? "—"}</span>
                <span style={{ color: txtDim }}>Volume</span><span style={{ textAlign: "right" }}>{hover.volume ? (hover.volume / 1e6).toFixed(2) + "M" : "—"}</span>
                {hover.open && hover.close && <>
                  <span style={{ color: txtDim }}>Change</span>
                  <span style={{ textAlign: "right", color: hover.close >= hover.open ? greenC : redC, fontWeight: 600 }}>
                    {hover.close >= hover.open ? "+" : ""}{((hover.close - hover.open) / hover.open * 100).toFixed(2)}%
                  </span>
                </>}
              </div>
              {(hover.sma20 || hover.rsi || hover.macd != null) && <>
                <div style={{ borderTop: `1px solid ${bdr}`, marginTop: 6, paddingTop: 6, display: "grid", gridTemplateColumns: "auto 1fr", gap: "2px 10px" }}>
                  {hover.sma20 && <><span style={{ color: "#f59e0b" }}>SMA20</span><span style={{ textAlign: "right" }}>${hover.sma20.toFixed(2)}</span></>}
                  {hover.sma50 && <><span style={{ color: "#8b5cf6" }}>SMA50</span><span style={{ textAlign: "right" }}>${hover.sma50.toFixed(2)}</span></>}
                  {hover.rsi != null && <><span style={{ color: "#f97316" }}>RSI</span><span style={{ textAlign: "right" }}>{hover.rsi.toFixed(1)}</span></>}
                  {hover.macd != null && <><span style={{ color: "#06b6d4" }}>MACD</span><span style={{ textAlign: "right" }}>{hover.macd.toFixed(3)}</span></>}
                  {hover.atr != null && <><span style={{ color: "#14b8a6" }}>ATR</span><span style={{ textAlign: "right" }}>{hover.atr.toFixed(2)}</span></>}
                  {hover.stochK != null && <><span style={{ color: "#e879f9" }}>%K</span><span style={{ textAlign: "right" }}>{hover.stochK.toFixed(1)}</span></>}
                  {hover.stochD != null && <><span style={{ color: "#fb923c" }}>%D</span><span style={{ textAlign: "right" }}>{hover.stochD.toFixed(1)}</span></>}
                </div>
              </>}
            </div>
          )}

          <div style={{ textAlign: "center", fontSize: 9, color: txtDim, marginTop: 2 }}>
            {drawingMode !== "none" ? `Drawing: ${drawingMode} mode (Esc to exit)` : "Scroll to zoom · Drag to pan · Shift+Click to set alert"}
          </div>
        </div>

        {/* ---- RSI PANEL ---- */}
        {showRSI && (
          <div className="indicator-panel" style={{ margin: "4px 0", borderTop: `1px solid ${bdr}`, paddingTop: 4 }}>
            <div style={{ fontSize: 9, color: "#f97316", fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, marginBottom: 2 }}>RSI (14)</div>
            <svg viewBox={`0 0 ${W} ${RSI_H}`} style={{ width: "100%", height: RSI_H * 0.6, display: "block" }}>
              {/* Overbought / oversold zones */}
              <rect x={0} y={0} width={W} height={(30 / 100) * RSI_H} fill={redC} fillOpacity={0.05} />
              <rect x={0} y={(70 / 100) * RSI_H} width={W} height={(30 / 100) * RSI_H} fill={greenC} fillOpacity={0.05} />
              <line x1={0} y1={(30 / 100) * RSI_H} x2={W} y2={(30 / 100) * RSI_H} stroke={redC} strokeWidth={0.5} strokeOpacity={0.3} strokeDasharray="4,4" />
              <line x1={0} y1={(50 / 100) * RSI_H} x2={W} y2={(50 / 100) * RSI_H} stroke={txtDim} strokeWidth={0.5} strokeOpacity={0.2} strokeDasharray="4,4" />
              <line x1={0} y1={(70 / 100) * RSI_H} x2={W} y2={(70 / 100) * RSI_H} stroke={greenC} strokeWidth={0.5} strokeOpacity={0.3} strokeDasharray="4,4" />
              {/* RSI line */}
              <polyline
                points={rsiData.map((r, i) => r != null ? `${toX(i)},${RSI_H - (r / 100) * RSI_H}` : "").filter(Boolean).join(" ")}
                fill="none" stroke="#f97316" strokeWidth={1.5} />
              {/* Labels */}
              <text x={W - 4} y={(30 / 100) * RSI_H - 2} fontSize={7} fill={redC} textAnchor="end" fillOpacity={0.6}>70</text>
              <text x={W - 4} y={(70 / 100) * RSI_H - 2} fontSize={7} fill={greenC} textAnchor="end" fillOpacity={0.6}>30</text>
              {/* Hover line */}
              {hover && !isPanning && <line x1={toX(hover.idx)} y1={0} x2={toX(hover.idx)} y2={RSI_H} stroke={txtDim} strokeWidth={0.5} strokeDasharray="4,4" />}
            </svg>
          </div>
        )}

        {/* ---- MACD PANEL ---- */}
        {showMACD && (
          <div className="indicator-panel" style={{ margin: "4px 0", borderTop: `1px solid ${bdr}`, paddingTop: 4 }}>
            <div style={{ fontSize: 9, color: "#06b6d4", fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, marginBottom: 2 }}>MACD (12,26,9)</div>
            <svg viewBox={`0 0 ${W} ${MACD_H}`} style={{ width: "100%", height: MACD_H * 0.6, display: "block" }}>
              {(() => {
                const macds = macdData.filter(m => m.macd != null).map(m => m.macd!);
                const signals = macdData.filter(m => m.signal != null).map(m => m.signal!);
                const hists = macdData.filter(m => m.hist != null).map(m => m.hist!);
                const allVals = [...macds, ...signals, ...hists];
                if (allVals.length === 0) return null;
                const macdMin = Math.min(...allVals), macdMax = Math.max(...allVals);
                const macdRange = macdMax - macdMin || 1;
                const mToY = (v: number) => MACD_H - ((v - macdMin) / macdRange) * (MACD_H - 8) - 4;
                const zeroY = mToY(0);
                const barW = Math.max(1, (W / visCount) * 0.6);

                return <>
                  {/* Zero line */}
                  <line x1={0} y1={zeroY} x2={W} y2={zeroY} stroke={txtDim} strokeWidth={0.5} strokeOpacity={0.3} />
                  {/* Histogram */}
                  {macdData.map((m, i) => {
                    if (m.hist == null) return null;
                    const h = mToY(m.hist);
                    return <rect key={`mh-${i}`} x={toX(i) - barW / 2} y={Math.min(h, zeroY)} width={barW} height={Math.abs(h - zeroY) || 1}
                      fill={m.hist >= 0 ? greenC : redC} fillOpacity={0.5} />;
                  })}
                  {/* MACD line */}
                  <polyline points={macdData.map((m, i) => m.macd != null ? `${toX(i)},${mToY(m.macd)}` : "").filter(Boolean).join(" ")}
                    fill="none" stroke="#06b6d4" strokeWidth={1.5} />
                  {/* Signal line */}
                  <polyline points={macdData.map((m, i) => m.signal != null ? `${toX(i)},${mToY(m.signal)}` : "").filter(Boolean).join(" ")}
                    fill="none" stroke="#f97316" strokeWidth={1} strokeDasharray="4,2" />
                  {/* Hover */}
                  {hover && !isPanning && <line x1={toX(hover.idx)} y1={0} x2={toX(hover.idx)} y2={MACD_H} stroke={txtDim} strokeWidth={0.5} strokeDasharray="4,4" />}
                </>;
              })()}
            </svg>
          </div>
        )}

        {/* ---- ATR PANEL ---- */}
        {showATR && (
          <div className="indicator-panel" style={{ margin: "4px 0", borderTop: `1px solid ${bdr}`, paddingTop: 4 }}>
            <div style={{ fontSize: 9, color: "#14b8a6", fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, marginBottom: 2 }}>ATR (14)</div>
            <svg viewBox={`0 0 ${W} ${ATR_H}`} style={{ width: "100%", height: ATR_H * 0.6, display: "block" }}>
              {(() => {
                const vals = atrData.filter(v => v != null) as number[];
                if (vals.length === 0) return null;
                const aMin = Math.min(...vals), aMax = Math.max(...vals);
                const aRange = aMax - aMin || 1;
                const aToY = (v: number) => ATR_H - ((v - aMin) / aRange) * (ATR_H - 8) - 4;
                const pts = atrData.map((v, i) => v != null ? `${toX(i)},${aToY(v)}` : "").filter(Boolean).join(" ");
                return <>
                  <polyline points={pts} fill="none" stroke="#14b8a6" strokeWidth={1.5} />
                  <text x={W - 4} y={12} fontSize={7} fill="#14b8a6" textAnchor="end" fillOpacity={0.6}>
                    {vals[vals.length - 1]?.toFixed(2)}
                  </text>
                  {hover && !isPanning && <line x1={toX(hover.idx)} y1={0} x2={toX(hover.idx)} y2={ATR_H} stroke={txtDim} strokeWidth={0.5} strokeDasharray="4,4" />}
                </>;
              })()}
            </svg>
          </div>
        )}

        {/* ---- STOCHASTIC PANEL ---- */}
        {showStoch && (
          <div className="indicator-panel" style={{ margin: "4px 0", borderTop: `1px solid ${bdr}`, paddingTop: 4 }}>
            <div style={{ fontSize: 9, color: "#e879f9", fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, marginBottom: 2 }}>Stochastic (14,3)</div>
            <svg viewBox={`0 0 ${W} ${STOCH_H}`} style={{ width: "100%", height: STOCH_H * 0.6, display: "block" }}>
              {/* Overbought / oversold zones */}
              <rect x={0} y={0} width={W} height={(20 / 100) * STOCH_H} fill={redC} fillOpacity={0.05} />
              <rect x={0} y={(80 / 100) * STOCH_H} width={W} height={(20 / 100) * STOCH_H} fill={greenC} fillOpacity={0.05} />
              <line x1={0} y1={(20 / 100) * STOCH_H} x2={W} y2={(20 / 100) * STOCH_H} stroke={redC} strokeWidth={0.5} strokeOpacity={0.3} strokeDasharray="4,4" />
              <line x1={0} y1={(80 / 100) * STOCH_H} x2={W} y2={(80 / 100) * STOCH_H} stroke={greenC} strokeWidth={0.5} strokeOpacity={0.3} strokeDasharray="4,4" />
              {/* %K line */}
              <polyline
                points={stochData.map((s, i) => s.k != null ? `${toX(i)},${STOCH_H - (s.k / 100) * STOCH_H}` : "").filter(Boolean).join(" ")}
                fill="none" stroke="#e879f9" strokeWidth={1.5} />
              {/* %D line */}
              <polyline
                points={stochData.map((s, i) => s.d != null ? `${toX(i)},${STOCH_H - (s.d / 100) * STOCH_H}` : "").filter(Boolean).join(" ")}
                fill="none" stroke="#fb923c" strokeWidth={1} strokeDasharray="4,2" />
              {/* Labels */}
              <text x={W - 4} y={(20 / 100) * STOCH_H - 2} fontSize={7} fill={redC} textAnchor="end" fillOpacity={0.6}>80</text>
              <text x={W - 4} y={(80 / 100) * STOCH_H - 2} fontSize={7} fill={greenC} textAnchor="end" fillOpacity={0.6}>20</text>
              {/* Hover */}
              {hover && !isPanning && <line x1={toX(hover.idx)} y1={0} x2={toX(hover.idx)} y2={STOCH_H} stroke={txtDim} strokeWidth={0.5} strokeDasharray="4,4" />}
            </svg>
          </div>
        )}

        {/* Period pills */}
        <div style={{ display: "flex", justifyContent: "center", gap: 4, margin: "8px 0 16px" }}>
          {periods.map(([v, l]) => <button key={v} className="period-pill" onClick={() => setPeriod(v)} style={{
            padding: "7px 18px", fontSize: 12, fontWeight: v === period ? 700 : 500, borderRadius: 20, border: "none", cursor: "pointer",
            background: v === period ? accent : pillBg, color: v === period ? "#fff" : txt2,
            boxShadow: v === period ? `0 2px 12px ${accent}40` : "none",
          }}>{l}</button>)}
        </div>

        {/* Stats grid */}
        {quote && <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 1, background: bdr, borderRadius: 10, overflow: "hidden", fontSize: 12 }}>
          {([["Open", quote.open], ["High", quote.high], ["Low", quote.low], ["Volume", quote.volume ? (quote.volume / 1e6).toFixed(1) + "M" : null],
            ["Prev Close", quote.prevClose], ["52W High", quote.yearHigh || quote.fiftyTwoWeekHigh], ["52W Low", quote.yearLow || quote.fiftyTwoWeekLow],
            ["Mkt Cap", quote.marketCap ? (quote.marketCap > 1e12 ? (quote.marketCap / 1e12).toFixed(1) + "T" : (quote.marketCap / 1e9).toFixed(1) + "B") : null]] as [string, any][]).map(([l, v], i) => (
            <div key={i} style={{ background: bgCard, padding: "10px 12px" }}>
              <div style={{ color: txtDim, fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 2 }}>{l}</div>
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 600, fontSize: 13 }}>{v != null ? (typeof v === "number" ? "$" + v.toFixed(2) : v) : "—"}</div>
            </div>
          ))}
        </div>}

        {/* ======== MULTI-CHART GRID ======== */}
        {layout !== "1x1" && (
          <div style={{
            display: "grid",
            gridTemplateColumns: layout === "2x2" ? "1fr 1fr" : "1fr 1fr 1fr",
            gap: 12, marginTop: 16,
          }}>
            {multiTickers.slice(0, layout === "2x2" ? 4 : 3).map(t => (
              <div key={t} style={{ position: "relative" }}>
                <MiniChart ticker={t} dark={dark} BASE={BASE} onSelect={selectTicker} />
                <button onClick={(e) => { e.stopPropagation(); removeMiniTicker(t); }} style={{
                  position: "absolute", top: 6, right: 6, width: 18, height: 18, borderRadius: "50%",
                  border: `1px solid ${bdr}`, background: dark ? "#0a0a0f" : "#fff", color: txtDim,
                  fontSize: 10, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", lineHeight: 1,
                }}>×</button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ======== WATCHLIST SIDEBAR ======== */}
      <div style={{ width: 260, borderLeft: `1px solid ${bdr}`, background: wBg, overflowY: "auto", flexShrink: 0 }}>
        <div style={{ padding: "12px 14px 8px", borderBottom: `1px solid ${bdr}`, fontWeight: 700, fontSize: 14, display: "flex", justifyContent: "space-between" }}>
          <span>Watchlist</span><span style={{ fontSize: 10, color: txtDim, fontWeight: 400 }}>{watchlist.length}</span>
        </div>
        {/* Photonics header */}
        <div onClick={() => setShowPhotonics(!showPhotonics)} style={{ padding: "8px 14px", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center", background: secBg, borderBottom: `1px solid ${bdr}`, fontWeight: 700, fontSize: 10, textTransform: "uppercase", letterSpacing: 1.2, color: greenC }}>
          <span>Photonics Supply Chain</span>
          <span style={{ fontSize: 9, transform: showPhotonics ? "rotate(180deg)" : "rotate(0)", transition: "transform 0.2s" }}>▼</span>
        </div>
        {showPhotonics && PHOTONICS_GROUPS.map(g => (
          <div key={g.label}>
            <div style={{ padding: "5px 14px", fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, color: txtDim, background: dark ? "#0c0c12" : "#f0f2f5", borderBottom: `1px solid ${bdr}` }}>{g.label}</div>
            {g.tickers.filter(t => watchlist.includes(t)).map(t => <WatchRow key={t} t={t} />)}
          </div>
        ))}
        {/* Other stocks header */}
        <div onClick={() => setShowOther(!showOther)} style={{ padding: "8px 14px", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center", background: secBg, borderBottom: `1px solid ${bdr}`, fontWeight: 700, fontSize: 10, textTransform: "uppercase", letterSpacing: 1.2, color: txt2 }}>
          <span>Other Stocks</span>
          <span style={{ fontSize: 9, transform: showOther ? "rotate(180deg)" : "rotate(0)", transition: "transform 0.2s" }}>▼</span>
        </div>
        {showOther && watchlist.filter(t => !ALL_PHOTONICS.includes(t)).map(t => <WatchRow key={t} t={t} />)}
      </div>

      {/* Global animations & transitions */}
      <style>{`
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
        @keyframes shimmer {
          0% { background-position: -200px 0; }
          100% { background-position: calc(200px + 100%) 0; }
        }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes slideDown { from { opacity: 0; max-height: 0; } to { opacity: 1; max-height: 200px; } }
        .chart-btn {
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          cursor: pointer;
          user-select: none;
        }
        .chart-btn:hover {
          transform: translateY(-1px);
          box-shadow: 0 2px 8px rgba(0,0,0,0.15);
        }
        .chart-btn:active {
          transform: translateY(0) scale(0.97);
        }
        .watch-row {
          transition: all 0.15s ease;
        }
        .watch-row:hover {
          transform: translateX(2px);
        }
        .skeleton {
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.05), transparent);
          background-size: 200px 100%;
          animation: shimmer 1.5s ease-in-out infinite;
          border-radius: 4px;
        }
        .indicator-panel {
          animation: slideDown 0.3s ease-out;
          overflow: hidden;
        }
        .tooltip-card {
          animation: fadeIn 0.15s ease-out;
        }
        .period-pill {
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .period-pill:hover {
          transform: scale(1.05);
        }
        .period-pill:active {
          transform: scale(0.95);
        }
      `}</style>
    </div>
  );
}
