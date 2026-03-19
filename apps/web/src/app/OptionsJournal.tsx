"use client";
import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, LineChart, Line, AreaChart, Area, Legend,
} from "recharts";

const API = process.env.NEXT_PUBLIC_API_URL || "https://stock-platform-8o8c.onrender.com";

interface OpenPosition {
  symbol: string; ticker: string; strike: number; expiration: string;
  call_put: string; strategy: string; contracts: number; avg_price: number;
  open_date: string; account: string; is_short: boolean; expired: boolean;
  premium_received?: number; cost_basis?: number;
  current_stock_price?: number; itm?: boolean; distance_to_strike?: number;
}
interface ClosedTrade {
  symbol: string; ticker: string; strike: number; expiration: string;
  call_put: string; strategy: string; contracts: number;
  pnl: number; pnl_pct: number; open_date: string; close_date: string;
  account: string; is_short: boolean; open_credit?: number; open_debit?: number;
}
interface Summary {
  total_pnl: number; total_trades: number; open_count: number;
  win_rate: number; winners: number; losers: number; avg_win: number; avg_loss: number;
}
interface JournalData {
  open_positions: OpenPosition[];
  closed_trades: ClosedTrade[];
  orphan_closings: any[];
  summary: Summary;
  pnl_by_ticker: Record<string, number>;
}
interface AnalysisData {
  insights: { type: string; title: string; text: string }[];
  warnings: { type: string; title: string; text: string }[];
  recommendations: { title: string; text: string }[];
  stats: any;
}

const S: Record<string, any> = {
  card: { background: "#ffffff", border: "1px solid #e8ecf0", borderRadius: 6, padding: 16, marginBottom: 12 },
  label: { color: "#7d8590", fontSize: 11, fontFamily: "'DM Sans', sans-serif", textTransform: "uppercase" as const, letterSpacing: 1, marginBottom: 4, display: "block" },
  green: "#2ea043", red: "#f85149", yellow: "#d29922", blue: "#58a6ff", cyan: "#39d353", purple: "#bc8cff",
  dim: "#484f58", text: "#1f2937", muted: "#7d8590",
  mono: { fontFamily: "'JetBrains Mono', 'Fira Code', 'SF Mono', monospace" },
  font: "'DM Sans', sans-serif",
};

const CHART_COLORS = ["#2ea043", "#58a6ff", "#d29922", "#f85149", "#bc8cff", "#39d353", "#f97316", "#06b6d4", "#ec4899", "#8b5cf6"];

// Black-Scholes helpers
function normCDF(x: number): number {
  const a1 = 0.254829592, a2 = -0.284496736, a3 = 1.421413741, a4 = -1.453152027, a5 = 1.061405429;
  const p = 0.3275911;
  const sign = x < 0 ? -1 : 1;
  const k = 1 / (1 + p * Math.abs(x));
  const y = 1 - (((((a5 * k + a4) * k) + a3) * k + a2) * k + a1) * k * Math.exp(-x * x / 2);
  return 0.5 * (1 + sign * y);
}
function normPDF(x: number): number {
  return Math.exp(-0.5 * x * x) / Math.sqrt(2 * Math.PI);
}
function calcGreeks(Sp: number, K: number, T: number, sigma: number, r: number) {
  if (T <= 0 || sigma <= 0 || Sp <= 0 || K <= 0) return { delta: 0, gamma: 0, theta: 0, vega: 0, callPrice: 0, putPrice: 0 };
  const d1 = (Math.log(Sp / K) + (r + sigma * sigma / 2) * T) / (sigma * Math.sqrt(T));
  const d2 = d1 - sigma * Math.sqrt(T);
  const delta = normCDF(d1);
  const gamma = normPDF(d1) / (Sp * sigma * Math.sqrt(T));
  const theta = (-(Sp * normPDF(d1) * sigma) / (2 * Math.sqrt(T)) - r * K * Math.exp(-r * T) * normCDF(d2)) / 365;
  const vega = Sp * normPDF(d1) * Math.sqrt(T) / 100;
  const callPrice = Sp * normCDF(d1) - K * Math.exp(-r * T) * normCDF(d2);
  const putPrice = callPrice - Sp + K * Math.exp(-r * T);
  return { delta, gamma, theta, vega, callPrice, putPrice };
}

const TABS = [
  { id: "overview", label: "OVERVIEW", icon: "🏠" },
  { id: "open", label: "OPEN", icon: "📊" },
  { id: "closed", label: "CLOSED", icon: "📋" },
  { id: "dashboard", label: "DASHBOARD", icon: "📈" },
  { id: "greeks", label: "GREEKS", icon: "🔬" },
  { id: "pnl", label: "P&L", icon: "📉" },
  { id: "analytics", label: "ANALYTICS", icon: "🎯" },
  { id: "replay", label: "REPLAY", icon: "🔄" },
  { id: "ai", label: "AI", icon: "🤖" },
  { id: "tools", label: "TOOLS", icon: "🛠️" },
  { id: "payoff", label: "PAYOFF", icon: "💹" },
] as const;
type TabId = typeof TABS[number]["id"];

// Custom tooltip for recharts
function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: "#1a1f2e", border: "1px solid #2a3441", borderRadius: 4, padding: "8px 12px", fontSize: 11, fontFamily: "'DM Sans', sans-serif" }}>
      <div style={{ color: "#7d8590", marginBottom: 4 }}>{label}</div>
      {payload.map((p: any, i: number) => (
        <div key={i} style={{ color: p.color, fontWeight: "bold" }}>{p.name}: {typeof p.value === "number" ? `$${p.value.toFixed(2)}` : p.value}</div>
      ))}
    </div>
  );
}

export default function OptionsJournal() {
  const [data, setData] = useState<JournalData | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [tab, setTab] = useState<TabId>("overview");
  const [expandedPosition, setExpandedPosition] = useState<number|null>(null);
  const [filterTicker, setFilterTicker] = useState("ALL");
  const [filterStrategy, setFilterStrategy] = useState("ALL");
  const [sortField, setSortField] = useState("close_date");
  const [sortDir, setSortDir] = useState<"asc"|"desc">("desc");
  const [msg, setMsg] = useState("");

  // Trade Replay state
  const [replayTrade, setReplayTrade] = useState<ClosedTrade | null>(null);
  const [replaySlider, setReplaySlider] = useState(0);
  const [replayData, setReplayData] = useState<any[]>([]);
  const [replayLoading, setReplayLoading] = useState(false);

  // Greeks calculator state
  const [gSpot, setGSpot] = useState(100);
  const [gStrike, setGStrike] = useState(100);
  const [gDays, setGDays] = useState(30);
  const [gIV, setGIV] = useState(30);
  const [gRate, setGRate] = useState(5);

  // Tools state
  const [toolAcctSize, setToolAcctSize] = useState(10000);
  const [toolRiskPct, setToolRiskPct] = useState(2);
  const [toolEntryPrice, setToolEntryPrice] = useState(5.00);
  const [toolStopPrice, setToolStopPrice] = useState(3.00);
  const [toolProbSpot, setToolProbSpot] = useState(100);
  const [toolProbStrike, setToolProbStrike] = useState(105);
  const [toolProbDays, setToolProbDays] = useState(30);
  const [toolProbIV, setToolProbIV] = useState(30);

  // EV Calculator state
  const [evSpot, setEvSpot] = useState(100);
  const [evStrike, setEvStrike] = useState(105);
  const [evPremium, setEvPremium] = useState(3);
  const [evDays, setEvDays] = useState(30);
  const [evIV, setEvIV] = useState(30);
  const [evType, setEvType] = useState<"long_call"|"long_put"|"short_call"|"short_put">("long_call");
  const [evResults, setEvResults] = useState<any>(null);

  // AI Deep Review state
  const [deepReview, setDeepReview] = useState<any>(null);
  const [deepReviewLoading, setDeepReviewLoading] = useState(false);

  // Payoff state
  const [payoffType, setPayoffType] = useState<"long_call"|"long_put"|"covered_call"|"bull_spread"|"iron_condor">("long_call");
  const [payoffSpot, setPayoffSpot] = useState(100);
  const [payoffStrike1, setPayoffStrike1] = useState(100);
  const [payoffStrike2, setPayoffStrike2] = useState(110);
  const [payoffStrike3, setPayoffStrike3] = useState(90);
  const [payoffStrike4, setPayoffStrike4] = useState(115);
  const [payoffPremium, setPayoffPremium] = useState(3);
  const [payoffPremium2, setPayoffPremium2] = useState(1.5);

  // P&L chart canvas ref
  const pnlCanvasRef = useRef<HTMLCanvasElement>(null);

  // Hover state for cards
  const [hoveredCard, setHoveredCard] = useState<string|null>(null);

  // AI Analysis state
  const [analysis, setAnalysis] = useState<AnalysisData | null>(null);
  const [analyzing, setAnalyzing] = useState(false);

  // Expanded ticker in overview
  const [expandedTicker, setExpandedTicker] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/options-journal`);
      if (res.ok) setData(await res.json());
    } catch(e) { console.error(e); }
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const loadAnalysis = useCallback(async () => {
    setAnalyzing(true);
    try {
      const res = await fetch(`${API}/options-journal/analyze`);
      const result = await res.json();
      if (result.insights) setAnalysis(result);
    } catch (e) { console.error(e); }
    setAnalyzing(false);
  }, []);

  // AI Deep Review (Claude-powered)
  const runDeepReview = useCallback(async () => {
    if (!data?.closed_trades?.length) return;
    setDeepReviewLoading(true);
    try {
      const res = await fetch(`${API.replace(/\/api$/, "")}/ai/review-trades`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ trades: data.closed_trades })
      });
      const result = await res.json();
      setDeepReview(result);
    } catch (e) { console.error(e); }
    setDeepReviewLoading(false);
  }, [data]);

  // Trade Replay loader
  const loadReplay = useCallback(async (trade: ClosedTrade) => {
    setReplayTrade(trade);
    setReplaySlider(100);
    setReplayLoading(true);
    try {
      const r = await fetch(`${API}/technicals/${trade.ticker}?period=6m`);
      const d = await r.json();
      const candles = d?.candles || d || [];
      if (!Array.isArray(candles) || candles.length === 0) {
        setReplayData([]);
        setReplayLoading(false);
        return;
      }
      // Filter candles between open and close dates
      const openMs = new Date(trade.open_date).getTime();
      const closeMs = new Date(trade.close_date).getTime();
      const filtered = candles.filter((c: any) => {
        const ts = new Date(c.date || c.Date || c.timestamp).getTime();
        return ts >= openMs - 86400000 * 5 && ts <= closeMs + 86400000 * 5; // 5 day buffer
      });
      // Compute P&L at each point using simple linear interpolation
      const totalDays = Math.max((closeMs - openMs) / 86400000, 1);
      const entries = filtered.map((c: any) => {
        const ts = new Date(c.date || c.Date || c.timestamp).getTime();
        const daysSinceOpen = Math.max((ts - openMs) / 86400000, 0);
        const progress = Math.min(daysSinceOpen / totalDays, 1);
        const pnlAtPoint = trade.pnl * progress;
        return {
          date: (c.date || c.Date || "").slice(0, 10),
          price: c.close || c.Close,
          pnl: Math.round(pnlAtPoint * 100) / 100,
          progress: Math.round(progress * 100),
          strike: trade.strike,
        };
      });
      setReplayData(entries);
    } catch {
      setReplayData([]);
    }
    setReplayLoading(false);
  }, []);

  // Monte Carlo EV Calculator
  const runEVSimulation = useCallback(() => {
    const N = 2000;
    const S0 = evSpot, K = evStrike, premium = evPremium;
    const T = evDays / 365, sigma = evIV / 100, r = 0.05;
    const dt = T;
    const results: number[] = [];
    for (let i = 0; i < N; i++) {
      const z = Array.from({ length: 1 }, () => {
        let u = 0, v = 0;
        while (u === 0) u = Math.random();
        while (v === 0) v = Math.random();
        return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
      })[0];
      const ST = S0 * Math.exp((r - 0.5 * sigma ** 2) * dt + sigma * Math.sqrt(dt) * z);
      let pnl = 0;
      if (evType === "long_call") pnl = Math.max(0, ST - K) - premium;
      else if (evType === "long_put") pnl = Math.max(0, K - ST) - premium;
      else if (evType === "short_call") pnl = premium - Math.max(0, ST - K);
      else if (evType === "short_put") pnl = premium - Math.max(0, K - ST);
      results.push(pnl * 100); // per contract
    }
    results.sort((a, b) => a - b);
    const ev = results.reduce((s, v) => s + v, 0) / N;
    const pProfit = results.filter(r => r > 0).length / N;
    const p5 = results[Math.floor(N * 0.05)];
    const p25 = results[Math.floor(N * 0.25)];
    const p75 = results[Math.floor(N * 0.75)];
    const p95 = results[Math.floor(N * 0.95)];
    const maxLoss = results[0];
    const maxGain = results[N - 1];
    // Build histogram buckets
    const bucketCount = 30;
    const min = results[0], max = results[N - 1], bSize = (max - min) / bucketCount || 1;
    const histogram = Array.from({ length: bucketCount }, (_, i) => {
      const lo = min + i * bSize, hi = lo + bSize;
      const count = results.filter(r => r >= lo && r < hi).length;
      return { range: `$${lo.toFixed(0)}`, count, lo, hi, isProfit: lo >= 0 };
    });
    setEvResults({ ev, pProfit, p5, p25, p75, p95, maxLoss, maxGain, histogram, N });
  }, [evSpot, evStrike, evPremium, evDays, evIV, evType]);

  const [detectedFormat, setDetectedFormat] = useState<any>(null);
  const [dragOver, setDragOver] = useState(false);
  const [importHistory, setImportHistory] = useState<any[]>([]);

  const detectFormat = async (file: File) => {
    const form = new FormData();
    form.append("file", file);
    try {
      const res = await fetch(`${API}/options-journal/detect-format`, { method: "POST", body: form });
      const json = await res.json();
      setDetectedFormat(json);
      return json;
    } catch { return null; }
  };

  const handleUpload = async (file: File) => {
    setUploading(true); setMsg("");
    // Auto-detect format first
    const fmt = await detectFormat(file);
    if (fmt && fmt.detected_format !== "fidelity" && fmt.detected_format !== "unknown") {
      setMsg(`ℹ️ Detected ${fmt.detected_format} format (${fmt.confidence}% confidence). Currently only Fidelity is fully supported. Attempting import...`);
    }
    const form = new FormData();
    form.append("file", file);
    try {
      const res = await fetch(`${API}/options-journal/upload`, { method: "POST", body: form });
      const json = await res.json();
      if (res.ok) {
        const summary = `✅ Imported — ${json.summary?.total_trades} closed trades, ${json.summary?.open_count} open`;
        setMsg(summary);
        setImportHistory(prev => [{ date: new Date().toLocaleString(), file: file.name, format: fmt?.detected_format || "unknown", trades: json.summary?.total_trades || 0, status: "success" }, ...prev].slice(0, 10));
        await fetchData();
      } else {
        setMsg(`❌ Error: ${json.detail || "Upload failed"}`);
        setImportHistory(prev => [{ date: new Date().toLocaleString(), file: file.name, format: fmt?.detected_format || "unknown", trades: 0, status: "failed" }, ...prev].slice(0, 10));
      }
    } catch(e) {
      setMsg("❌ Error: Upload failed");
      setImportHistory(prev => [{ date: new Date().toLocaleString(), file: file.name, format: "unknown", trades: 0, status: "failed" }, ...prev].slice(0, 10));
    }
    setUploading(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file && (file.name.endsWith(".csv") || file.name.endsWith(".CSV"))) {
      handleUpload(file);
    } else {
      setMsg("❌ Please drop a CSV file");
    }
  };

  const tickers = useMemo(() => {
    if (!data) return ["ALL"];
    const t = new Set([
      ...(data.open_positions || []).map(p => p.ticker),
      ...(data.closed_trades || []).map(t => t.ticker),
    ]);
    return ["ALL", ...Array.from(t).sort()];
  }, [data]);

  const strategies = useMemo(() => {
    if (!data) return ["ALL"];
    const s = new Set([
      ...(data.open_positions || []).map(p => p.strategy),
      ...(data.closed_trades || []).map(t => t.strategy),
    ]);
    return ["ALL", ...Array.from(s).sort()];
  }, [data]);

  const filteredClosed = useMemo(() => {
    if (!data?.closed_trades) return [];
    return [...data.closed_trades]
      .filter(t => filterTicker === "ALL" || t.ticker === filterTicker)
      .filter(t => filterStrategy === "ALL" || t.strategy === filterStrategy)
      .sort((a, b) => {
        const va = (a as any)[sortField] ?? "";
        const vb = (b as any)[sortField] ?? "";
        return sortDir === "asc" ? (va > vb ? 1 : -1) : (va < vb ? 1 : -1);
      });
  }, [data, filterTicker, filterStrategy, sortField, sortDir]);

  const filteredOpen = useMemo(() => {
    if (!data?.open_positions) return [];
    return data.open_positions
      .filter(p => filterTicker === "ALL" || p.ticker === filterTicker)
      .filter(p => filterStrategy === "ALL" || p.strategy === filterStrategy);
  }, [data, filterTicker, filterStrategy]);

  const pnlByTicker = useMemo(() => {
    if (!data?.pnl_by_ticker) return [];
    return Object.entries(data.pnl_by_ticker).sort((a, b) => b[1] - a[1]);
  }, [data]);

  // Analytics computed data
  const strategyBreakdown = useMemo(() => {
    if (!data?.closed_trades) return [];
    const map: Record<string, { count: number; pnl: number }> = {};
    data.closed_trades.forEach(t => {
      if (!map[t.strategy]) map[t.strategy] = { count: 0, pnl: 0 };
      map[t.strategy].count++;
      map[t.strategy].pnl += t.pnl;
    });
    return Object.entries(map).map(([name, { count, pnl }]) => ({ name, count, pnl })).sort((a, b) => b.count - a.count);
  }, [data]);

  const monthlyPnl = useMemo(() => {
    if (!data?.closed_trades) return [];
    const map: Record<string, number> = {};
    data.closed_trades.forEach(t => {
      if (!t.close_date) return;
      const d = new Date(t.close_date);
      if (isNaN(d.getTime())) return;
      const month = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      map[month] = (map[month] || 0) + t.pnl;
    });
    return Object.entries(map).sort((a, b) => a[0].localeCompare(b[0])).map(([month, pnl]) => ({ month, pnl: Math.round(pnl * 100) / 100 }));
  }, [data]);

  const cumulativePnl = useMemo(() => {
    if (!data?.closed_trades) return [];
    const sorted = [...data.closed_trades].sort((a, b) => (a.close_date || "").localeCompare(b.close_date || ""));
    let cum = 0;
    return sorted.map((t, i) => {
      cum += t.pnl;
      return { trade: i + 1, date: t.close_date, pnl: t.pnl, cumulative: cum, ticker: t.ticker };
    });
  }, [data]);

  const winLossStreaks = useMemo(() => {
    if (!data?.closed_trades) return { maxWin: 0, maxLoss: 0, currentStreak: 0, currentType: "" };
    const sorted = [...data.closed_trades].sort((a, b) => (a.close_date || "").localeCompare(b.close_date || ""));
    let maxWin = 0, maxLoss = 0, curWin = 0, curLoss = 0;
    sorted.forEach(t => {
      if (t.pnl >= 0) { curWin++; curLoss = 0; maxWin = Math.max(maxWin, curWin); }
      else { curLoss++; curWin = 0; maxLoss = Math.max(maxLoss, curLoss); }
    });
    const last = sorted[sorted.length - 1];
    return { maxWin, maxLoss, currentStreak: last?.pnl >= 0 ? curWin : curLoss, currentType: last?.pnl >= 0 ? "WIN" : "LOSS" };
  }, [data]);

  const bestWorstTrades = useMemo(() => {
    if (!data?.closed_trades || data.closed_trades.length === 0) return { best: [], worst: [] };
    const sorted = [...data.closed_trades].sort((a, b) => b.pnl - a.pnl);
    return { best: sorted.slice(0, 5), worst: sorted.slice(-5).reverse() };
  }, [data]);

  const dayOfWeekPnl = useMemo(() => {
    if (!data?.closed_trades) return [];
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const map: Record<string, { pnl: number; count: number }> = {};
    days.forEach(d => { map[d] = { pnl: 0, count: 0 }; });
    data.closed_trades.forEach(t => {
      if (!t.close_date) return;
      const d = new Date(t.close_date);
      if (!isNaN(d.getTime())) {
        const day = days[d.getDay()];
        map[day].pnl += t.pnl;
        map[day].count++;
      }
    });
    return days.filter(d => map[d].count > 0).map(d => ({ day: d, pnl: map[d].pnl, count: map[d].count }));
  }, [data]);

  const profitFactor = useMemo(() => {
    if (!data?.closed_trades) return 0;
    const wins = data.closed_trades.filter(t => t.pnl > 0).reduce((s, t) => s + t.pnl, 0);
    const losses = Math.abs(data.closed_trades.filter(t => t.pnl < 0).reduce((s, t) => s + t.pnl, 0));
    return losses > 0 ? wins / losses : wins > 0 ? Infinity : 0;
  }, [data]);

  // Growth tracker: compare pre-2026 vs 2026 performance
  const growthTracker = useMemo(() => {
    if (!data?.closed_trades || data.closed_trades.length < 2) return null;
    const pre: ClosedTrade[] = [], post: ClosedTrade[] = [];
    data.closed_trades.forEach(t => {
      if (!t.close_date) return;
      const d = new Date(t.close_date);
      if (isNaN(d.getTime())) return;
      (d.getFullYear() < 2026 ? pre : post).push(t);
    });
    if (pre.length === 0 || post.length === 0) return null;
    const calc = (ts: ClosedTrade[]) => {
      const wins = ts.filter(t => t.pnl > 0), losses = ts.filter(t => t.pnl < 0);
      const totalPnl = ts.reduce((s, t) => s + t.pnl, 0);
      const winAmt = wins.reduce((s, t) => s + t.pnl, 0);
      const lossAmt = Math.abs(losses.reduce((s, t) => s + t.pnl, 0));
      const avgWin = wins.length ? winAmt / wins.length : 0;
      const avgLoss = losses.length ? losses.reduce((s, t) => s + t.pnl, 0) / losses.length : 0;
      let holds: number[] = [];
      ts.forEach(t => {
        try {
          const od = new Date(t.open_date), cd = new Date(t.close_date);
          if (!isNaN(od.getTime()) && !isNaN(cd.getTime())) holds.push((cd.getTime() - od.getTime()) / 86400000);
        } catch {}
      });
      return {
        trades: ts.length, pnl: totalPnl,
        winRate: ts.length ? (wins.length / ts.length) * 100 : 0,
        wins: wins.length, losses: losses.length,
        avgWin, avgLoss,
        profitFactor: lossAmt > 0 ? winAmt / lossAmt : winAmt > 0 ? 99 : 0,
        avgHold: holds.length ? holds.reduce((a, b) => a + b, 0) / holds.length : 0,
        avgPnl: ts.length ? totalPnl / ts.length : 0,
        riskReward: avgLoss !== 0 ? Math.abs(avgWin / avgLoss) : 0,
      };
    };
    const before = calc(pre), after = calc(post);
    const metrics = [
      { label: "Win Rate", before: before.winRate, after: after.winRate, unit: "%", higher: true, fmt: (v: number) => v.toFixed(1) + "%" },
      { label: "Profit Factor", before: before.profitFactor, after: after.profitFactor, unit: "x", higher: true, fmt: (v: number) => v.toFixed(2) + "x" },
      { label: "Avg P&L/Trade", before: before.avgPnl, after: after.avgPnl, unit: "$", higher: true, fmt: (v: number) => "$" + v.toFixed(2) },
      { label: "Risk/Reward", before: before.riskReward, after: after.riskReward, unit: "x", higher: true, fmt: (v: number) => v.toFixed(2) + "x" },
      { label: "Avg Win", before: before.avgWin, after: after.avgWin, unit: "$", higher: true, fmt: (v: number) => "$" + v.toFixed(2) },
      { label: "Avg Loss", before: Math.abs(before.avgLoss), after: Math.abs(after.avgLoss), unit: "$", higher: false, fmt: (v: number) => "-$" + v.toFixed(2) },
      { label: "Avg Hold", before: before.avgHold, after: after.avgHold, unit: "d", higher: false, fmt: (v: number) => v.toFixed(1) + "d" },
      { label: "Total P&L", before: before.pnl, after: after.pnl, unit: "$", higher: true, fmt: (v: number) => "$" + v.toFixed(2) },
    ];
    const improved = metrics.filter(m => m.higher ? m.after > m.before : m.after < m.before);
    const needsWork = metrics.filter(m => m.higher ? m.after <= m.before : m.after >= m.before);
    return { before, after, metrics, improved, needsWork, preTrades: pre.length, postTrades: post.length };
  }, [data]);

  // Per-ticker stats for overview
  const tickerStats = useMemo(() => {
    if (!data?.closed_trades) return [];
    const map: Record<string, { wins: number; losses: number; totalPnl: number; trades: ClosedTrade[] }> = {};
    data.closed_trades.forEach(t => {
      if (!map[t.ticker]) map[t.ticker] = { wins: 0, losses: 0, totalPnl: 0, trades: [] };
      map[t.ticker].totalPnl += t.pnl;
      map[t.ticker].trades.push(t);
      if (t.pnl >= 0) map[t.ticker].wins++; else map[t.ticker].losses++;
    });
    return Object.entries(map).map(([ticker, s]) => ({
      ticker, wins: s.wins, losses: s.losses, total: s.wins + s.losses,
      winRate: s.wins + s.losses > 0 ? (s.wins / (s.wins + s.losses)) * 100 : 0,
      totalPnl: s.totalPnl, avgPnl: s.totalPnl / (s.wins + s.losses),
      bestTrade: Math.max(...s.trades.map(t => t.pnl)),
      worstTrade: Math.min(...s.trades.map(t => t.pnl)),
      trades: s.trades,
    })).sort((a, b) => b.totalPnl - a.totalPnl);
  }, [data]);

  // Per-strategy stats for overview
  const strategyStats = useMemo(() => {
    if (!data?.closed_trades) return [];
    const map: Record<string, { wins: number; losses: number; totalPnl: number; count: number }> = {};
    data.closed_trades.forEach(t => {
      if (!map[t.strategy]) map[t.strategy] = { wins: 0, losses: 0, totalPnl: 0, count: 0 };
      map[t.strategy].totalPnl += t.pnl;
      map[t.strategy].count++;
      if (t.pnl >= 0) map[t.strategy].wins++; else map[t.strategy].losses++;
    });
    return Object.entries(map).map(([strategy, s]) => ({
      strategy, wins: s.wins, losses: s.losses, total: s.count,
      winRate: s.count > 0 ? (s.wins / s.count) * 100 : 0,
      totalPnl: s.totalPnl, avgPnl: s.totalPnl / s.count,
    })).sort((a, b) => b.totalPnl - a.totalPnl);
  }, [data]);

  // Days to expiration helper
  const daysToExp = (exp: string) => {
    const d = new Date(exp);
    if (isNaN(d.getTime())) return null;
    const diff = Math.ceil((d.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    return diff;
  };

  // Payoff diagram data
  const payoffData = useMemo(() => {
    const range = [];
    const low = payoffSpot * 0.7;
    const high = payoffSpot * 1.3;
    const step = (high - low) / 80;
    for (let px = low; px <= high; px += step) {
      let pnl = 0;
      switch (payoffType) {
        case "long_call":
          pnl = Math.max(px - payoffStrike1, 0) - payoffPremium;
          break;
        case "long_put":
          pnl = Math.max(payoffStrike1 - px, 0) - payoffPremium;
          break;
        case "covered_call":
          pnl = (px - payoffSpot) + payoffPremium - Math.max(px - payoffStrike1, 0);
          break;
        case "bull_spread":
          pnl = Math.max(px - payoffStrike1, 0) - Math.max(px - payoffStrike2, 0) - payoffPremium + payoffPremium2;
          break;
        case "iron_condor": {
          const putSpread = Math.max(payoffStrike3 - px, 0) - Math.max(payoffStrike1 - px, 0);
          const callSpread = Math.max(px - payoffStrike2, 0) - Math.max(px - payoffStrike4, 0);
          pnl = payoffPremium - putSpread - callSpread;
          break;
        }
      }
      range.push({ price: Math.round(px * 100) / 100, pnl: Math.round(pnl * 100) / 100 });
    }
    return range;
  }, [payoffType, payoffSpot, payoffStrike1, payoffStrike2, payoffStrike3, payoffStrike4, payoffPremium, payoffPremium2]);

  const toggleSort = (field: string) => {
    if (sortField === field) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortField(field); setSortDir("desc"); }
  };

  const pnlColor = (v: number) => v > 0 ? S.green : v < 0 ? S.red : S.muted;
  const arrow = (field: string) => sortField === field ? (sortDir === "asc" ? " ↑" : " ↓") : "";

  const greeks = useMemo(() => calcGreeks(gSpot, gStrike, gDays / 365, gIV / 100, gRate / 100), [gSpot, gStrike, gDays, gIV, gRate]);

  // Position size calc
  const positionSize = useMemo(() => {
    const riskPerTrade = toolAcctSize * (toolRiskPct / 100);
    const riskPerContract = Math.abs(toolEntryPrice - toolStopPrice) * 100;
    const contracts = riskPerContract > 0 ? Math.floor(riskPerTrade / riskPerContract) : 0;
    const totalRisk = contracts * riskPerContract;
    const totalCost = contracts * toolEntryPrice * 100;
    return { contracts, riskPerTrade, totalRisk, totalCost, riskPerContract };
  }, [toolAcctSize, toolRiskPct, toolEntryPrice, toolStopPrice]);

  // Probability of profit
  const probProfit = useMemo(() => {
    const T = toolProbDays / 365;
    const sigma = toolProbIV / 100;
    if (T <= 0 || sigma <= 0 || toolProbSpot <= 0 || toolProbStrike <= 0) return { otmProb: 0, itmProb: 0 };
    const d2 = (Math.log(toolProbSpot / toolProbStrike) + (0.05 - sigma * sigma / 2) * T) / (sigma * Math.sqrt(T));
    const itmProb = normCDF(d2) * 100;
    return { otmProb: 100 - itmProb, itmProb };
  }, [toolProbSpot, toolProbStrike, toolProbDays, toolProbIV]);

  // Draw P&L bar chart on canvas
  useEffect(() => {
    if (tab !== "pnl" || !pnlCanvasRef.current || pnlByTicker.length === 0) return;
    const canvas = pnlCanvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const dpr = window.devicePixelRatio || 1;
    const w = canvas.clientWidth, h = canvas.clientHeight;
    canvas.width = w * dpr; canvas.height = h * dpr;
    ctx.scale(dpr, dpr); ctx.clearRect(0, 0, w, h);
    const maxAbs = Math.max(...pnlByTicker.map(([, v]) => Math.abs(v)), 1);
    const barCount = pnlByTicker.length;
    const margin = { top: 20, right: 80, bottom: 50, left: 60 };
    const chartW = w - margin.left - margin.right;
    const chartH = h - margin.top - margin.bottom;
    const barW = Math.min(40, (chartW / barCount) * 0.7);
    const gap = (chartW - barW * barCount) / (barCount + 1);
    const midY = margin.top + chartH / 2;
    ctx.strokeStyle = "#e8ecf0"; ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) { const y = margin.top + (chartH / 4) * i; ctx.beginPath(); ctx.moveTo(margin.left, y); ctx.lineTo(w - margin.right, y); ctx.stroke(); }
    ctx.strokeStyle = "#484f58"; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(margin.left, midY); ctx.lineTo(w - margin.right, midY); ctx.stroke();
    ctx.fillStyle = "#7d8590"; ctx.font = "11px 'JetBrains Mono', monospace"; ctx.textAlign = "right";
    for (let i = 0; i <= 4; i++) { const y = margin.top + (chartH / 4) * i; const val = maxAbs - (maxAbs * 2 * i / 4); ctx.fillText(`$${val.toFixed(0)}`, margin.left - 8, y + 4); }
    pnlByTicker.forEach(([ticker, pnl], i) => {
      const x = margin.left + gap + i * (barW + gap);
      const barH = (Math.abs(pnl) / maxAbs) * (chartH / 2);
      const y = pnl >= 0 ? midY - barH : midY;
      ctx.fillStyle = pnl >= 0 ? S.green : S.red;
      ctx.beginPath();
      const r = 3;
      if (pnl >= 0) { ctx.moveTo(x, y + r); ctx.arcTo(x, y, x + barW, y, r); ctx.arcTo(x + barW, y, x + barW, y + barH, r); ctx.lineTo(x + barW, y + barH); ctx.lineTo(x, y + barH); }
      else { ctx.moveTo(x, y); ctx.lineTo(x + barW, y); ctx.lineTo(x + barW, y + barH - r); ctx.arcTo(x + barW, y + barH, x, y + barH, r); ctx.arcTo(x, y + barH, x, y, r); ctx.lineTo(x, y); }
      ctx.fill();
      ctx.fillStyle = pnl >= 0 ? S.green : S.red; ctx.font = "bold 10px 'JetBrains Mono', monospace"; ctx.textAlign = "center";
      ctx.fillText(`${pnl >= 0 ? "+" : ""}$${Math.abs(pnl).toFixed(0)}`, x + barW / 2, pnl >= 0 ? y - 4 : y + barH + 12);
      ctx.fillStyle = "#484f58"; ctx.font = "bold 11px 'DM Sans', sans-serif"; ctx.save(); ctx.translate(x + barW / 2, h - margin.bottom + 14); ctx.rotate(-Math.PI / 6); ctx.fillText(ticker, 0, 0); ctx.restore();
    });
  }, [tab, pnlByTicker]);

  const thStyle: React.CSSProperties = { padding: "6px 10px", borderBottom: "1px solid #e8ecf0", fontSize: 11, fontFamily: "'DM Sans', sans-serif", color: S.dim, fontWeight: "normal", cursor: "pointer", userSelect: "none", position: "sticky", top: 0, background: "#ffffff", whiteSpace: "nowrap", textAlign: "right" };
  const cellStyle: React.CSSProperties = { padding: "6px 10px", borderBottom: "1px solid #f0f2f5", fontSize: 12, fontFamily: "'JetBrains Mono', monospace", whiteSpace: "nowrap", textAlign: "right", color: "#1f2937" };
  const inputStyle: React.CSSProperties = { background: "#f8f9fb", border: "1px solid #e8ecf0", borderRadius: 4, padding: "8px 12px", color: "#1f2937", fontFamily: "'DM Sans', sans-serif", fontSize: 13, width: "100%", outline: "none" };

  const hoverCard = (id: string): React.CSSProperties => ({
    ...S.card,
    transition: "all 0.2s ease",
    transform: hoveredCard === id ? "translateY(-2px)" : "none",
    boxShadow: hoveredCard === id ? "0 4px 12px rgba(0,0,0,0.1)" : "none",
  });

  return (
    <div style={{ background: "#0a0a0f", color: "#f1f1f4", minHeight: "100%", borderRadius: 8, ...S.mono }}>

      {/* Tab bar */}
      <div style={{ display: "flex", gap: 0, borderBottom: "1px solid #e8ecf0", overflowX: "auto", marginBottom: 20, WebkitOverflowScrolling: "touch", scrollbarWidth: "none" }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => { setTab(t.id); if (t.id === "ai" && !analysis && !analyzing) loadAnalysis(); }}
            style={{
              padding: "10px 16px", background: tab === t.id ? "#0d1117" : "transparent",
              color: tab === t.id ? S.green : S.muted, border: "none",
              borderBottom: tab === t.id ? `2px solid ${S.green}` : "2px solid transparent",
              cursor: "pointer", fontFamily: "'DM Sans', sans-serif", fontSize: 12,
              fontWeight: tab === t.id ? "bold" : "normal",
              transition: "all 0.2s", whiteSpace: "nowrap", letterSpacing: 0.5,
            }}>
            {t.icon} {t.label}
            {t.id === "open" && data ? ` (${data.open_positions?.length || 0})` : ""}
            {t.id === "closed" && data ? ` (${data.closed_trades?.length || 0})` : ""}
          </button>
        ))}
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 8, padding: "0 8px" }}>
          <select value={filterTicker} onChange={e => setFilterTicker(e.target.value)} style={{ background: "#0d1117", color: S.muted, border: "1px solid #2a3441", borderRadius: 4, padding: "4px 8px", fontFamily: "'DM Sans', sans-serif", fontSize: 11, outline: "none" }}>
            {tickers.map(t => <option key={t}>{t}</option>)}
          </select>
          <select value={filterStrategy} onChange={e => setFilterStrategy(e.target.value)} style={{ background: "#0d1117", color: S.muted, border: "1px solid #2a3441", borderRadius: 4, padding: "4px 8px", fontFamily: "'DM Sans', sans-serif", fontSize: 11, outline: "none" }}>
            {strategies.map(s => <option key={s}>{s}</option>)}
          </select>
          <label style={{ cursor: "pointer", padding: "6px 12px", background: "#1a8c5e", color: "#fff", border: "none", borderRadius: 4, fontFamily: "'DM Sans', sans-serif", fontSize: 11, fontWeight: "bold" }}>
            {uploading ? "⏳ UPLOADING..." : "📤 UPLOAD CSV"}
            <input type="file" accept=".csv" style={{ display: "none" }} onChange={e => e.target.files?.[0] && handleUpload(e.target.files[0])} disabled={uploading} />
          </label>
          {detectedFormat && <span style={{ fontSize: 10, color: detectedFormat.confidence > 70 ? S.green : "#f59e0b" }}>Format: {detectedFormat.detected_format} ({detectedFormat.confidence}%)</span>}
        </div>
      </div>

      {/* Drag-drop zone */}
      <div
        onDragOver={e => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        style={{
          border: `2px dashed ${dragOver ? S.green : "#2a3441"}`,
          borderRadius: 6,
          padding: dragOver ? "20px" : "8px 12px",
          marginBottom: 12,
          textAlign: "center",
          transition: "all 0.2s",
          background: dragOver ? "#0d9f4f10" : "transparent",
          display: dragOver || !data ? "block" : "none",
        }}
      >
        <div style={{ fontSize: 11, color: dragOver ? S.green : S.dim, fontFamily: "'DM Sans', sans-serif" }}>
          {dragOver ? "📥 Drop CSV file here to import" : "Drag & drop a broker CSV file here (Fidelity, Schwab, TD, Robinhood)"}
        </div>
      </div>

      {/* Import history */}
      {importHistory.length > 0 && tab === "open" && (
        <div style={{ ...S.card, padding: "6px 10px", marginBottom: 10, fontSize: 10, color: S.dim }}>
          <span style={{ fontWeight: "bold", marginRight: 8 }}>Recent imports:</span>
          {importHistory.slice(0, 3).map((h, i) => (
            <span key={i} style={{ marginRight: 12 }}>
              <span style={{ color: h.status === "success" ? S.green : S.red }}>{h.status === "success" ? "✅" : "❌"}</span>
              {" "}{h.file} ({h.format}) — {h.trades} trades
            </span>
          ))}
        </div>
      )}

      {/* Header banner */}
      {data?.summary && (
        <div style={{ ...S.card, padding: "8px 12px", borderLeft: `3px solid ${S.green}`, marginBottom: 16, display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ color: "#0d9f4f", fontWeight: "bold", fontSize: 13, fontFamily: "'DM Sans', sans-serif" }}>⚡ OPTIONS JOURNAL</span>
          <span style={{ color: S.dim }}>|</span>
          <span style={{ color: pnlColor(data.summary.total_pnl), fontWeight: "bold", ...S.mono, fontSize: 13 }}>${data.summary.total_pnl.toFixed(2)}</span>
          <span style={{ color: S.dim }}>|</span>
          <span style={{ color: data.summary.win_rate >= 50 ? S.green : S.red, fontWeight: "bold", fontSize: 12 }}>{data.summary.win_rate}% WR</span>
          <span style={{ color: S.dim }}>|</span>
          <span style={{ color: S.dim, fontSize: 11, fontFamily: "'DM Sans', sans-serif" }}>{data.summary.open_count} open · {data.summary.total_trades} closed</span>
          <button onClick={fetchData} style={{ marginLeft: "auto", background: "none", border: "none", color: S.blue, cursor: "pointer", fontSize: 11, fontFamily: "'DM Sans', sans-serif" }}>↻ REFRESH</button>
        </div>
      )}

      {msg && <div style={{ marginBottom: 12, padding: "6px 12px", color: msg.includes("❌") ? S.red : S.green, fontSize: 11, fontFamily: "'DM Sans', sans-serif" }}>{msg}</div>}
      {loading && <div style={{ color: S.muted, textAlign: "center", padding: 40, fontFamily: "'DM Sans', sans-serif" }}>⏳ Loading...</div>}

      {/* ═══ OVERVIEW ═══ */}
      {!loading && tab === "overview" && data && (
        <div>
          {/* Top-level summary */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 12, marginBottom: 16 }}>
            {[
              { id: "o-pnl", label: "💰 Total P&L", value: `$${data.summary.total_pnl.toFixed(2)}`, color: pnlColor(data.summary.total_pnl), sub: "all closed trades" },
              { id: "o-wr", label: "🎯 Win Rate", value: `${data.summary.win_rate}%`, color: data.summary.win_rate >= 50 ? S.green : S.red, sub: `${data.summary.winners} wins / ${data.summary.losers} losses` },
              { id: "o-avg", label: "📏 Avg Per Trade", value: `$${data.closed_trades.length > 0 ? (data.summary.total_pnl / data.closed_trades.length).toFixed(2) : "0"}`, color: S.blue, sub: "average P&L per trade" },
              { id: "o-pf", label: "📐 Profit Factor", value: profitFactor === Infinity ? "∞" : profitFactor.toFixed(2), color: profitFactor >= 1.5 ? S.green : S.yellow, sub: profitFactor >= 2 ? "Strong edge" : profitFactor >= 1 ? "Positive" : "Negative" },
              { id: "o-open", label: "⚡ Active", value: `${data.summary.open_count} open`, color: S.cyan, sub: `${data.summary.total_trades} total closed` },
            ].map(c => (
              <div key={c.id} style={hoverCard(c.id)} onMouseEnter={() => setHoveredCard(c.id)} onMouseLeave={() => setHoveredCard(null)}>
                <div style={S.label}>{c.label}</div>
                <div style={{ fontSize: 24, fontWeight: "bold", color: c.color, ...S.mono }}>{c.value}</div>
                <div style={{ color: S.dim, fontSize: 11, fontFamily: S.font }}>{c.sub}</div>
              </div>
            ))}
          </div>

          {/* Win/Loss visual breakdown */}
          <div style={{ ...S.card, marginBottom: 16, padding: 20 }}>
            <div style={{ color: S.text, fontWeight: "bold", fontSize: 14, marginBottom: 16, fontFamily: S.font }}>📊 Win vs Loss Breakdown</div>
            <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 12 }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                  <span style={{ color: S.green, fontWeight: "bold", fontSize: 13 }}>🟢 {data.summary.winners} Wins ({data.summary.win_rate}%)</span>
                  <span style={{ color: S.red, fontWeight: "bold", fontSize: 13 }}>🔴 {data.summary.losers} Losses ({(100 - data.summary.win_rate).toFixed(0)}%)</span>
                </div>
                <div style={{ height: 20, borderRadius: 10, background: S.red, overflow: "hidden", position: "relative" }}>
                  <div style={{ width: `${data.summary.win_rate}%`, height: "100%", background: S.green, borderRadius: 10, transition: "width 0.5s ease" }} />
                </div>
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 16 }}>
              {[
                { label: "Avg Win", value: `+$${data.summary.avg_win.toFixed(2)}`, color: S.green },
                { label: "Avg Loss", value: `-$${Math.abs(data.summary.avg_loss).toFixed(2)}`, color: S.red },
                { label: "Total Won", value: `+$${data.closed_trades.filter(t => t.pnl > 0).reduce((s, t) => s + t.pnl, 0).toFixed(2)}`, color: S.green },
                { label: "Total Lost", value: `-$${Math.abs(data.closed_trades.filter(t => t.pnl < 0).reduce((s, t) => s + t.pnl, 0)).toFixed(2)}`, color: S.red },
              ].map(r => (
                <div key={r.label} style={{ textAlign: "center" }}>
                  <div style={{ color: S.muted, fontSize: 10, textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>{r.label}</div>
                  <div style={{ color: r.color, fontWeight: "bold", fontSize: 18, ...S.mono }}>{r.value}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Monthly P&L Bar Chart */}
          <div style={{ ...S.card, marginBottom: 16 }}>
            <div style={{ color: S.text, fontWeight: "bold", fontSize: 14, marginBottom: 16, fontFamily: S.font }}>📅 Monthly P&L</div>
            {monthlyPnl.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={monthlyPnl} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e8ecf0" />
                    <XAxis dataKey="month" fontSize={10} tick={{ fill: S.dim }} tickFormatter={(v: string) => { const d = new Date(v + "-15"); return d.toLocaleDateString("en-US", { month: "short", year: "2-digit" }); }} />
                    <YAxis fontSize={10} tick={{ fill: S.dim }} tickFormatter={(v: number) => `$${v}`} />
                    <Tooltip content={<ChartTooltip />} />
                    <Bar dataKey="pnl" name="Monthly P&L" radius={[4, 4, 0, 0]}>
                      {monthlyPnl.map((entry, i) => (
                        <Cell key={i} fill={entry.pnl >= 0 ? S.green : S.red} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginTop: 12 }}>
                  <div style={{ textAlign: "center" }}>
                    <div style={{ color: S.muted, fontSize: 10, textTransform: "uppercase", letterSpacing: 1 }}>Months Traded</div>
                    <div style={{ color: S.text, fontWeight: "bold", fontSize: 18, ...S.mono }}>{monthlyPnl.length}</div>
                  </div>
                  <div style={{ textAlign: "center" }}>
                    <div style={{ color: S.muted, fontSize: 10, textTransform: "uppercase", letterSpacing: 1 }}>Best Month</div>
                    <div style={{ color: S.green, fontWeight: "bold", fontSize: 18, ...S.mono }}>+${Math.max(...monthlyPnl.map(m => m.pnl)).toFixed(2)}</div>
                  </div>
                  <div style={{ textAlign: "center" }}>
                    <div style={{ color: S.muted, fontSize: 10, textTransform: "uppercase", letterSpacing: 1 }}>Worst Month</div>
                    <div style={{ color: S.red, fontWeight: "bold", fontSize: 18, ...S.mono }}>${Math.min(...monthlyPnl.map(m => m.pnl)).toFixed(2)}</div>
                  </div>
                </div>
              </>
            ) : <div style={{ color: S.muted, textAlign: "center", padding: 30 }}>No monthly data yet</div>}
          </div>

          {/* P&L by Ticker Bar Chart */}
          <div style={{ ...S.card, marginBottom: 16 }}>
            <div style={{ color: S.text, fontWeight: "bold", fontSize: 14, marginBottom: 16, fontFamily: S.font }}>📊 P&L by Ticker</div>
            {tickerStats.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={tickerStats.map(t => ({ ticker: t.ticker, pnl: Math.round(t.totalPnl * 100) / 100 }))} margin={{ top: 5, right: 10, left: 10, bottom: 30 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e8ecf0" />
                  <XAxis dataKey="ticker" fontSize={11} tick={{ fill: S.dim }} angle={-30} textAnchor="end" height={50} interval={0} />
                  <YAxis fontSize={10} tick={{ fill: S.dim }} tickFormatter={(v: number) => `$${v}`} />
                  <Tooltip content={<ChartTooltip />} />
                  <Bar dataKey="pnl" name="Total P&L" radius={[4, 4, 0, 0]}>
                    {tickerStats.map((t, i) => (
                      <Cell key={i} fill={t.totalPnl >= 0 ? S.green : S.red} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : <div style={{ color: S.muted, textAlign: "center", padding: 30 }}>No data</div>}
          </div>

          {/* Performance by Ticker — Clickable Table */}
          <div style={{ ...S.card, marginBottom: 16 }}>
            <div style={{ color: S.text, fontWeight: "bold", fontSize: 14, marginBottom: 16, fontFamily: S.font }}>🏷️ Performance by Ticker — Click to see trades</div>
            {tickerStats.length > 0 ? (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ borderBottom: "2px solid #e8ecf0" }}>
                      {["Ticker","Trades","Wins","Losses","Win Rate","Total P&L","Avg P&L","Best","Worst"].map(h => (
                        <th key={h} style={{ ...thStyle, fontWeight: "bold", fontSize: 11, padding: "10px 12px" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {tickerStats.map((t, i) => (
                      <React.Fragment key={t.ticker}>
                        <tr
                          onClick={() => setExpandedTicker(expandedTicker === t.ticker ? null : t.ticker)}
                          style={{ borderBottom: "1px solid #f0f2f5", background: expandedTicker === t.ticker ? "#eef6ff" : i % 2 === 0 ? "#fafbfc" : "#ffffff", cursor: "pointer", transition: "background 0.15s" }}
                        >
                          <td style={{ ...cellStyle, color: "#0d9f4f", fontWeight: "bold", textAlign: "left", fontSize: 13 }}>
                            <span style={{ display: "inline-block", marginRight: 6, transition: "transform 0.2s", transform: expandedTicker === t.ticker ? "rotate(90deg)" : "rotate(0deg)", fontSize: 10 }}>&#9654;</span>
                            {t.ticker}
                          </td>
                          <td style={{ ...cellStyle, fontWeight: "bold", fontSize: 13 }}>{t.total}</td>
                          <td style={{ ...cellStyle, color: S.green, fontWeight: "bold" }}>{t.wins}</td>
                          <td style={{ ...cellStyle, color: S.red, fontWeight: "bold" }}>{t.losses}</td>
                          <td style={{ ...cellStyle, padding: "6px 12px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 8, justifyContent: "flex-end" }}>
                              <div style={{ width: 60, height: 8, borderRadius: 4, background: "#fee2e2", overflow: "hidden" }}>
                                <div style={{ width: `${t.winRate}%`, height: "100%", background: t.winRate >= 50 ? S.green : S.red, borderRadius: 4 }} />
                              </div>
                              <span style={{ color: t.winRate >= 50 ? S.green : S.red, fontWeight: "bold", minWidth: 40 }}>{t.winRate.toFixed(0)}%</span>
                            </div>
                          </td>
                          <td style={{ ...cellStyle, color: pnlColor(t.totalPnl), fontWeight: "bold", fontSize: 13 }}>{t.totalPnl > 0 ? "+" : ""}${t.totalPnl.toFixed(2)}</td>
                          <td style={{ ...cellStyle, color: pnlColor(t.avgPnl) }}>{t.avgPnl > 0 ? "+" : ""}${t.avgPnl.toFixed(2)}</td>
                          <td style={{ ...cellStyle, color: S.green }}>{t.bestTrade > 0 ? "+" : ""}${t.bestTrade.toFixed(2)}</td>
                          <td style={{ ...cellStyle, color: S.red }}>${t.worstTrade.toFixed(2)}</td>
                        </tr>
                        {expandedTicker === t.ticker && (
                          <tr>
                            <td colSpan={9} style={{ padding: 0, background: "#f8f9fb" }}>
                              <div style={{ padding: "12px 20px" }}>
                                <div style={{ fontSize: 11, color: S.muted, marginBottom: 10, fontFamily: S.font, fontWeight: "bold" }}>
                                  Individual trades for {t.ticker} — {t.trades.length} trades
                                </div>
                                {t.trades
                                  .sort((a, b) => (b.close_date || "").localeCompare(a.close_date || ""))
                                  .map((trade, j) => (
                                  <div key={j} style={{ display: "flex", alignItems: "center", gap: 14, padding: "7px 0", borderBottom: j < t.trades.length - 1 ? "1px solid #e8ecf0" : "none" }}>
                                    <div style={{ width: 3, height: 28, borderRadius: 2, background: trade.pnl >= 0 ? S.green : S.red }} />
                                    <span style={{ width: 80, fontSize: 11, color: S.dim, ...S.mono }}>{trade.close_date}</span>
                                    <span style={{ padding: "2px 8px", borderRadius: 4, fontSize: 10, fontWeight: "bold",
                                      background: trade.call_put === "Call" ? "#dbeafe" : "#fef3c7",
                                      color: trade.call_put === "Call" ? "#1d4ed8" : "#92400e"
                                    }}>{trade.call_put}</span>
                                    <span style={{ ...S.mono, fontSize: 12, color: S.text }}>${trade.strike}</span>
                                    <span style={{ fontSize: 11, color: S.dim, fontFamily: S.font }}>{trade.strategy}</span>
                                    <span style={{ ...S.mono, fontSize: 11, color: S.text }}>{trade.contracts}x</span>
                                    <span style={{ marginLeft: "auto", ...S.mono, fontSize: 13, fontWeight: "bold", color: pnlColor(trade.pnl) }}>
                                      {trade.pnl > 0 ? "+" : ""}${trade.pnl.toFixed(2)}
                                    </span>
                                    <span style={{ ...S.mono, fontSize: 11, color: pnlColor(trade.pnl_pct), minWidth: 55, textAlign: "right" }}>
                                      {trade.pnl_pct > 0 ? "+" : ""}{trade.pnl_pct.toFixed(1)}%
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : <div style={{ color: S.muted, textAlign: "center", padding: 30 }}>No closed trades yet</div>}
          </div>

          {/* Success by Strategy */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div style={S.card}>
              <div style={{ color: S.text, fontWeight: "bold", fontSize: 14, marginBottom: 16, fontFamily: S.font }}>🎯 Strategy Comparison</div>
              {strategyStats.map(s => (
                <div key={s.strategy} style={{ marginBottom: 16, paddingBottom: 12, borderBottom: "1px solid #e8ecf0" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                    <span style={{ fontWeight: "bold", fontSize: 13, color: S.text, fontFamily: S.font }}>{s.strategy}</span>
                    <span style={{ color: pnlColor(s.totalPnl), fontWeight: "bold", ...S.mono, fontSize: 14 }}>{s.totalPnl > 0 ? "+" : ""}${s.totalPnl.toFixed(2)}</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                    <div style={{ flex: 1, height: 10, borderRadius: 5, background: "#fee2e2", overflow: "hidden" }}>
                      <div style={{ width: `${s.winRate}%`, height: "100%", background: s.winRate >= 50 ? S.green : S.yellow, borderRadius: 5, transition: "width 0.5s" }} />
                    </div>
                    <span style={{ fontSize: 12, fontWeight: "bold", color: s.winRate >= 50 ? S.green : S.red, minWidth: 40, ...S.mono }}>{s.winRate.toFixed(0)}%</span>
                  </div>
                  <div style={{ display: "flex", gap: 16, fontSize: 11, color: S.muted, fontFamily: S.font }}>
                    <span>{s.total} trades</span>
                    <span style={{ color: S.green }}>{s.wins}W</span>
                    <span style={{ color: S.red }}>{s.losses}L</span>
                    <span>Avg: <span style={{ color: pnlColor(s.avgPnl), fontWeight: "bold" }}>${s.avgPnl.toFixed(2)}</span></span>
                  </div>
                </div>
              ))}
            </div>

            {/* Recent trades quick view */}
            <div style={S.card}>
              <div style={{ color: S.text, fontWeight: "bold", fontSize: 14, marginBottom: 16, fontFamily: S.font }}>🕐 Recent Trades</div>
              {[...data.closed_trades].sort((a, b) => (b.close_date || "").localeCompare(a.close_date || "")).slice(0, 8).map((t, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "8px 0", borderBottom: "1px solid #f0f2f5" }}>
                  <div style={{ width: 4, height: 32, borderRadius: 2, background: t.pnl >= 0 ? S.green : S.red }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ color: "#0d9f4f", fontWeight: "bold", fontSize: 13 }}>{t.ticker}</span>
                      <span style={{ color: pnlColor(t.pnl), fontWeight: "bold", ...S.mono, fontSize: 13 }}>{t.pnl > 0 ? "+" : ""}${t.pnl.toFixed(2)}</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: S.muted }}>
                      <span>{t.strategy} · ${t.strike} · {t.contracts}x</span>
                      <span>{t.close_date}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ═══ GROWTH TRACKER ═══ */}
          {growthTracker && (
            <div style={{ ...S.card, marginTop: 16 }}>
              <div style={{ color: S.text, fontWeight: "bold", fontSize: 14, marginBottom: 4, fontFamily: S.font }}>📈 Growth Tracker — Since New Year</div>
              <div style={{ color: S.muted, fontSize: 11, marginBottom: 16, fontFamily: S.font }}>
                Comparing Oct–Dec 2025 ({growthTracker.preTrades} trades) vs Jan–Mar 2026 ({growthTracker.postTrades} trades)
              </div>

              {/* Before / After Summary Cards */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20 }}>
                <div style={{ background: "#fafbfc", borderRadius: 8, padding: 16, border: "1px solid #e8ecf0" }}>
                  <div style={{ fontSize: 11, color: S.muted, textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>Oct – Dec 2025</div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                    <div>
                      <div style={{ fontSize: 10, color: S.muted }}>P&L</div>
                      <div style={{ color: pnlColor(growthTracker.before.pnl), fontWeight: "bold", fontSize: 18, ...S.mono }}>${growthTracker.before.pnl.toFixed(2)}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 10, color: S.muted }}>Win Rate</div>
                      <div style={{ color: growthTracker.before.winRate >= 60 ? S.green : S.yellow, fontWeight: "bold", fontSize: 18, ...S.mono }}>{growthTracker.before.winRate.toFixed(1)}%</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 10, color: S.muted }}>Profit Factor</div>
                      <div style={{ color: growthTracker.before.profitFactor >= 1 ? S.green : S.red, fontWeight: "bold", ...S.mono }}>{growthTracker.before.profitFactor.toFixed(2)}x</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 10, color: S.muted }}>Trades</div>
                      <div style={{ color: S.text, fontWeight: "bold", ...S.mono }}>{growthTracker.before.trades}</div>
                    </div>
                  </div>
                </div>
                <div style={{ background: "#f0fdf4", borderRadius: 8, padding: 16, border: "1px solid #bbf7d0" }}>
                  <div style={{ fontSize: 11, color: S.green, textTransform: "uppercase", letterSpacing: 1, marginBottom: 8, fontWeight: "bold" }}>Jan – Mar 2026</div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                    <div>
                      <div style={{ fontSize: 10, color: S.muted }}>P&L</div>
                      <div style={{ color: pnlColor(growthTracker.after.pnl), fontWeight: "bold", fontSize: 18, ...S.mono }}>${growthTracker.after.pnl.toFixed(2)}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 10, color: S.muted }}>Win Rate</div>
                      <div style={{ color: growthTracker.after.winRate >= 60 ? S.green : S.yellow, fontWeight: "bold", fontSize: 18, ...S.mono }}>{growthTracker.after.winRate.toFixed(1)}%</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 10, color: S.muted }}>Profit Factor</div>
                      <div style={{ color: growthTracker.after.profitFactor >= 1 ? S.green : S.red, fontWeight: "bold", ...S.mono }}>{growthTracker.after.profitFactor.toFixed(2)}x</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 10, color: S.muted }}>Trades</div>
                      <div style={{ color: S.text, fontWeight: "bold", ...S.mono }}>{growthTracker.after.trades}</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Metric Comparison Bars */}
              <div style={{ marginBottom: 20 }}>
                {growthTracker.metrics.map(m => {
                  const delta = m.after - m.before;
                  const improved = m.higher ? delta > 0 : delta < 0;
                  const pctChange = m.before !== 0 ? ((m.after - m.before) / Math.abs(m.before)) * 100 : m.after > 0 ? 100 : 0;
                  return (
                    <div key={m.label} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderBottom: "1px solid #f0f2f5" }}>
                      <div style={{ width: 110, fontSize: 12, fontWeight: "bold", color: S.text, fontFamily: S.font }}>{m.label}</div>
                      <div style={{ width: 80, textAlign: "right", fontSize: 12, color: S.dim, ...S.mono }}>{m.fmt(m.before)}</div>
                      <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 8 }}>
                        <div style={{ fontSize: 14 }}>{improved ? "→" : "→"}</div>
                      </div>
                      <div style={{ width: 80, textAlign: "right", fontSize: 12, fontWeight: "bold", color: improved ? S.green : S.red, ...S.mono }}>{m.fmt(m.after)}</div>
                      <div style={{
                        width: 80, textAlign: "right", fontSize: 11, fontWeight: "bold",
                        color: improved ? S.green : S.red,
                        ...S.mono,
                      }}>
                        {improved ? "▲" : "▼"} {Math.abs(pctChange).toFixed(0)}%
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Improved vs Needs Work */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div style={{ borderRadius: 8, padding: 14, border: `1px solid ${S.green}`, background: "#f0fdf4" }}>
                  <div style={{ fontWeight: "bold", color: S.green, fontSize: 13, marginBottom: 10, fontFamily: S.font }}>
                    ✅ Improved ({growthTracker.improved.length})
                  </div>
                  {growthTracker.improved.map(m => (
                    <div key={m.label} style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", fontSize: 12 }}>
                      <span style={{ color: S.text, fontFamily: S.font }}>{m.label}</span>
                      <span style={{ color: S.green, fontWeight: "bold", ...S.mono }}>{m.fmt(m.before)} → {m.fmt(m.after)}</span>
                    </div>
                  ))}
                </div>
                <div style={{ borderRadius: 8, padding: 14, border: `1px solid ${S.yellow}`, background: "#fffbeb" }}>
                  <div style={{ fontWeight: "bold", color: S.yellow, fontSize: 13, marginBottom: 10, fontFamily: S.font }}>
                    ⚠️ Needs Work ({growthTracker.needsWork.length})
                  </div>
                  {growthTracker.needsWork.map(m => (
                    <div key={m.label} style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", fontSize: 12 }}>
                      <span style={{ color: S.text, fontFamily: S.font }}>{m.label}</span>
                      <span style={{ color: S.red, fontWeight: "bold", ...S.mono }}>{m.fmt(m.before)} → {m.fmt(m.after)}</span>
                    </div>
                  ))}
                  {growthTracker.needsWork.length === 0 && (
                    <div style={{ color: S.muted, fontSize: 12, fontStyle: "italic" }}>All metrics improved!</div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ═══ OPEN POSITIONS ═══ */}
      {!loading && tab === "open" && (
        <div>
          {filteredOpen.length === 0 ? (
            <div style={{ ...S.card, color: S.muted, textAlign: "center", padding: 40, fontFamily: S.font }}>📭 No open positions. Upload a CSV to get started.</div>
          ) : (
            <>
              {/* Summary bar */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 16 }}>
                <div style={S.card}>
                  <div style={S.label}>📊 Total Positions</div>
                  <div style={{ fontSize: 28, fontWeight: "bold", color: S.blue, ...S.mono }}>{filteredOpen.length}</div>
                </div>
                <div style={S.card}>
                  <div style={S.label}>💵 Total Premium</div>
                  <div style={{ fontSize: 28, fontWeight: "bold", color: S.green, ...S.mono }}>${filteredOpen.reduce((s, p) => s + (p.premium_received || p.cost_basis || 0), 0).toFixed(2)}</div>
                </div>
                <div style={S.card}>
                  <div style={S.label}>📋 Total Contracts</div>
                  <div style={{ fontSize: 28, fontWeight: "bold", color: S.cyan, ...S.mono }}>{filteredOpen.reduce((s, p) => s + p.contracts, 0)}</div>
                </div>
              </div>

              {/* Position cards */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                {filteredOpen.map((p, i) => {
                  const dte = daysToExp(p.expiration);
                  const isExpanded = expandedPosition === i;
                  const dteColor = dte !== null ? (dte <= 7 ? S.red : dte <= 30 ? S.yellow : S.green) : S.dim;
                  return (
                    <div key={i} onClick={() => setExpandedPosition(isExpanded ? null : i)}
                      style={{ ...S.card, cursor: "pointer", borderLeft: `4px solid ${p.call_put === "Call" ? S.blue : S.yellow}`, transition: "all 0.2s", transform: isExpanded ? "scale(1.01)" : "none", boxShadow: isExpanded ? "0 4px 16px rgba(0,0,0,0.08)" : "none" }}>
                      {/* Header row */}
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <span style={{ fontSize: 18, fontWeight: "bold", color: "#0d9f4f", ...S.mono }}>{p.ticker}</span>
                          <span style={{ padding: "2px 8px", borderRadius: 4, fontSize: 11, fontWeight: "bold", fontFamily: S.font, background: p.call_put === "Call" ? "#dbeafe" : "#fef3c7", color: p.call_put === "Call" ? "#1d4ed8" : "#92400e" }}>
                            {p.is_short ? "SHORT" : "LONG"} {p.call_put?.toUpperCase()}
                          </span>
                          <span style={{ padding: "2px 8px", borderRadius: 4, fontSize: 11, fontFamily: S.font, background: "#f3f4f6", color: S.dim }}>{p.strategy}</span>
                        </div>
                        <span style={{ color: p.itm ? S.red : S.green, fontWeight: "bold", fontSize: 12, ...S.mono }}>
                          {p.current_stock_price ? (p.itm ? "🔴 ITM" : "🟢 OTM") : ""}
                        </span>
                      </div>
                      {/* Key metrics */}
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 8 }}>
                        <div>
                          <div style={{ fontSize: 10, color: S.muted, textTransform: "uppercase", letterSpacing: 0.5 }}>Strike</div>
                          <div style={{ fontSize: 16, fontWeight: "bold", ...S.mono }}>${p.strike}</div>
                        </div>
                        <div>
                          <div style={{ fontSize: 10, color: S.muted, textTransform: "uppercase", letterSpacing: 0.5 }}>Premium</div>
                          <div style={{ fontSize: 16, fontWeight: "bold", color: S.green, ...S.mono }}>${(p.premium_received || p.cost_basis || 0).toFixed(2)}</div>
                        </div>
                        <div>
                          <div style={{ fontSize: 10, color: S.muted, textTransform: "uppercase", letterSpacing: 0.5 }}>Qty</div>
                          <div style={{ fontSize: 16, fontWeight: "bold", ...S.mono }}>{p.contracts}</div>
                        </div>
                        <div>
                          <div style={{ fontSize: 10, color: S.muted, textTransform: "uppercase", letterSpacing: 0.5 }}>DTE</div>
                          <div style={{ fontSize: 16, fontWeight: "bold", color: dteColor, ...S.mono }}>{dte !== null ? `${dte}d` : "—"}</div>
                        </div>
                      </div>
                      {/* Expiration bar */}
                      {dte !== null && (
                        <div style={{ marginTop: 10 }}>
                          <div style={{ height: 4, borderRadius: 2, background: "#f0f2f5", overflow: "hidden" }}>
                            <div style={{ width: `${Math.max(0, Math.min(100, (1 - dte / 365) * 100))}%`, height: "100%", background: dteColor, borderRadius: 2, transition: "width 0.3s" }} />
                          </div>
                          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4, fontSize: 10, color: S.muted }}>
                            <span>Exp: {p.expiration}</span>
                            <span>Opened: {p.open_date}</span>
                          </div>
                        </div>
                      )}
                      {/* Expanded details */}
                      {isExpanded && (
                        <div style={{ marginTop: 12, paddingTop: 12, borderTop: "1px solid #e8ecf0", display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, fontSize: 12 }}>
                          <div><span style={{ color: S.muted }}>Stock: </span><span style={{ fontWeight: "bold", ...S.mono }}>{p.current_stock_price ? `$${p.current_stock_price.toFixed(2)}` : "—"}</span></div>
                          <div><span style={{ color: S.muted }}>Dist: </span><span style={{ fontWeight: "bold", ...S.mono }}>{p.distance_to_strike != null ? `${p.distance_to_strike}%` : "—"}</span></div>
                          <div><span style={{ color: S.muted }}>Acct: </span><span style={{ ...S.mono }}>{p.account?.slice(0, 12) || "—"}</span></div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      )}

      {/* ═══ CLOSED TRADES ═══ */}
      {!loading && tab === "closed" && (
        <div>
          {filteredClosed.length === 0 ? (
            <div style={{ ...S.card, color: S.muted, textAlign: "center", padding: 40, fontFamily: S.font }}>📭 No closed trades.</div>
          ) : (
            <>
              {/* Closed summary */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 16 }}>
                {[
                  { label: "📊 Showing", value: filteredClosed.length, color: S.blue, sub: `of ${data?.closed_trades?.length || 0} total` },
                  { label: "💰 Filtered P&L", value: `$${filteredClosed.reduce((s, t) => s + t.pnl, 0).toFixed(2)}`, color: pnlColor(filteredClosed.reduce((s, t) => s + t.pnl, 0)), sub: "selected trades" },
                  { label: "🏆 Win Rate", value: `${filteredClosed.length > 0 ? ((filteredClosed.filter(t => t.pnl >= 0).length / filteredClosed.length) * 100).toFixed(0) : 0}%`, color: S.green, sub: `${filteredClosed.filter(t => t.pnl >= 0).length}W / ${filteredClosed.filter(t => t.pnl < 0).length}L` },
                  { label: "📏 Avg P&L", value: `$${filteredClosed.length > 0 ? (filteredClosed.reduce((s, t) => s + t.pnl, 0) / filteredClosed.length).toFixed(2) : "0"}`, color: S.cyan, sub: "per trade" },
                ].map(c => (
                  <div key={c.label} style={S.card}>
                    <div style={S.label}>{c.label}</div>
                    <div style={{ fontSize: 22, fontWeight: "bold", color: c.color, ...S.mono }}>{c.value}</div>
                    <div style={{ color: S.dim, fontSize: 11, fontFamily: S.font }}>{c.sub}</div>
                  </div>
                ))}
              </div>

              {/* Trade list with P&L bars */}
              <div style={S.card}>
                {/* Column headers */}
                <div style={{ display: "grid", gridTemplateColumns: "70px 1fr 100px 80px 200px 100px 80px", gap: 8, padding: "8px 12px", borderBottom: "2px solid #e8ecf0", alignItems: "center" }}>
                  {[["ticker","Ticker"],["strategy","Strategy"],["strike","Strike"],["contracts","Qty"],["pnl","P&L"],["close_date","Closed"],["pnl_pct","%"]].map(([f,h]) => (
                    <div key={f} onClick={() => toggleSort(f)} style={{ cursor: "pointer", userSelect: "none", color: S.dim, fontWeight: sortField === f ? "bold" : "normal", fontSize: 11, fontFamily: S.font, textTransform: "uppercase", letterSpacing: 0.5 }}>
                      {h}{arrow(f)}
                    </div>
                  ))}
                </div>

                {/* Trade rows */}
                {filteredClosed.map((t, i) => {
                  const maxPnl = Math.max(...filteredClosed.map(c => Math.abs(c.pnl)), 1);
                  const barWidth = (Math.abs(t.pnl) / maxPnl) * 100;
                  return (
                    <div key={i} style={{ display: "grid", gridTemplateColumns: "70px 1fr 100px 80px 200px 100px 80px", gap: 8, padding: "10px 12px", borderBottom: "1px solid #f0f2f5", alignItems: "center", transition: "background 0.15s", cursor: "default" }}
                      onMouseEnter={e => (e.currentTarget.style.background = "#f8f9fb")}
                      onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                      {/* Ticker */}
                      <div style={{ color: "#0d9f4f", fontWeight: "bold", fontSize: 14, ...S.mono }}>{t.ticker}</div>
                      {/* Strategy */}
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <span style={{ padding: "2px 6px", borderRadius: 3, fontSize: 10, fontWeight: "bold", background: t.call_put === "Call" ? "#dbeafe" : "#fef3c7", color: t.call_put === "Call" ? "#1d4ed8" : "#92400e" }}>{t.call_put}</span>
                        <span style={{ fontSize: 12, color: S.text, fontFamily: S.font }}>{t.strategy}</span>
                      </div>
                      {/* Strike */}
                      <div style={{ ...S.mono, fontSize: 12, color: S.text }}>${t.strike}</div>
                      {/* Qty */}
                      <div style={{ ...S.mono, fontSize: 12, color: S.text, textAlign: "center" }}>{t.contracts}</div>
                      {/* P&L with bar */}
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ color: pnlColor(t.pnl), fontWeight: "bold", fontSize: 13, ...S.mono, minWidth: 80, textAlign: "right" }}>
                          {t.pnl > 0 ? "+" : ""}${t.pnl.toFixed(2)}
                        </span>
                        <div style={{ flex: 1, height: 8, borderRadius: 4, background: "#f0f2f5", overflow: "hidden" }}>
                          <div style={{ width: `${barWidth}%`, height: "100%", background: t.pnl >= 0 ? S.green : S.red, borderRadius: 4, transition: "width 0.3s" }} />
                        </div>
                      </div>
                      {/* Close date */}
                      <div style={{ fontSize: 11, color: S.dim }}>{t.close_date}</div>
                      {/* P&L % */}
                      <div style={{ color: pnlColor(t.pnl_pct), fontWeight: "bold", fontSize: 12, ...S.mono }}>
                        {t.pnl_pct > 0 ? "+" : ""}{t.pnl_pct.toFixed(1)}%
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      )}

      {/* ═══ DASHBOARD ═══ */}
      {!loading && tab === "dashboard" && data && (
        <div>
          {/* Stat cards */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 12 }}>
            {[
              { id: "pnl", label: "💰 Total P&L", value: `$${data.summary.total_pnl.toFixed(2)}`, color: pnlColor(data.summary.total_pnl), sub: "realized gains" },
              { id: "wr", label: "🎯 Win Rate", value: `${data.summary.win_rate}%`, color: data.summary.win_rate >= 50 ? S.green : S.red, sub: `${data.summary.winners}W / ${data.summary.losers}L` },
              { id: "trades", label: "📊 Closed Trades", value: data.summary.total_trades, color: S.blue, sub: "total completed" },
              { id: "open", label: "⚡ Open Positions", value: data.summary.open_count, color: S.cyan, sub: "currently active" },
            ].map(c => (
              <div key={c.id} style={hoverCard(c.id)} onMouseEnter={() => setHoveredCard(c.id)} onMouseLeave={() => setHoveredCard(null)}>
                <div style={S.label}>{c.label}</div>
                <div style={{ fontSize: 28, fontWeight: "bold", color: c.color, ...S.mono }}>{c.value}</div>
                <div style={{ color: S.dim, fontSize: 11, fontFamily: "'DM Sans', sans-serif" }}>{c.sub}</div>
              </div>
            ))}
          </div>

          {/* Charts row */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
            {/* Strategy Breakdown Pie */}
            <div style={S.card}>
              <div style={{ color: S.text, fontWeight: "bold", marginBottom: 12, fontSize: 13, fontFamily: "'DM Sans', sans-serif" }}>🥧 Strategy Breakdown</div>
              {strategyBreakdown.length > 0 ? (
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie data={strategyBreakdown} dataKey="count" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false} fontSize={10}>
                      {strategyBreakdown.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                    </Pie>
                    <Tooltip content={<ChartTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              ) : <div style={{ color: S.muted, textAlign: "center", padding: 40 }}>No data</div>}
            </div>

            {/* Monthly P&L Bar */}
            <div style={S.card}>
              <div style={{ color: S.text, fontWeight: "bold", marginBottom: 12, fontSize: 13, fontFamily: "'DM Sans', sans-serif" }}>📅 Monthly P&L</div>
              {monthlyPnl.length > 0 ? (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={monthlyPnl}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e8ecf0" />
                    <XAxis dataKey="month" fontSize={10} tick={{ fill: S.dim }} />
                    <YAxis fontSize={10} tick={{ fill: S.dim }} tickFormatter={v => `$${v}`} />
                    <Tooltip content={<ChartTooltip />} />
                    <Bar dataKey="pnl" name="P&L" radius={[4, 4, 0, 0]}>
                      {monthlyPnl.map((entry, i) => <Cell key={i} fill={entry.pnl >= 0 ? S.green : S.red} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : <div style={{ color: S.muted, textAlign: "center", padding: 40 }}>No data</div>}
            </div>
          </div>

          {/* Cumulative P&L Line */}
          <div style={{ ...S.card, marginBottom: 12 }}>
            <div style={{ color: S.text, fontWeight: "bold", marginBottom: 12, fontSize: 13, fontFamily: "'DM Sans', sans-serif" }}>📈 Cumulative P&L</div>
            {cumulativePnl.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <AreaChart data={cumulativePnl}>
                  <defs>
                    <linearGradient id="cumGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={S.green} stopOpacity={0.3} />
                      <stop offset="95%" stopColor={S.green} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e8ecf0" />
                  <XAxis dataKey="trade" fontSize={10} tick={{ fill: S.dim }} label={{ value: "Trade #", position: "insideBottomRight", offset: -5, fill: S.muted, fontSize: 10 }} />
                  <YAxis fontSize={10} tick={{ fill: S.dim }} tickFormatter={v => `$${v}`} />
                  <Tooltip content={<ChartTooltip />} />
                  <Area type="monotone" dataKey="cumulative" name="Cumulative P&L" stroke={S.green} fill="url(#cumGrad)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            ) : <div style={{ color: S.muted, textAlign: "center", padding: 40 }}>No data</div>}
          </div>

          {/* Trade Stats + P&L by Ticker */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div style={S.card}>
              <div style={{ color: S.text, fontWeight: "bold", marginBottom: 12, fontSize: 13, fontFamily: "'DM Sans', sans-serif" }}>📊 Trade Stats</div>
              {[
                { label: "Avg Win", value: `$${data.summary.avg_win.toFixed(2)}`, color: S.green },
                { label: "Avg Loss", value: `$${data.summary.avg_loss.toFixed(2)}`, color: S.red },
                { label: "Winners", value: data.summary.winners, color: S.green },
                { label: "Losers", value: data.summary.losers, color: S.red },
                { label: "Profit Factor", value: profitFactor === Infinity ? "∞" : profitFactor.toFixed(2), color: profitFactor >= 1.5 ? S.green : S.yellow },
              ].map(row => (
                <div key={row.label} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid #e8ecf0" }}>
                  <span style={{ color: S.dim, fontSize: 12, fontFamily: "'DM Sans', sans-serif" }}>{row.label}</span>
                  <span style={{ color: row.color, fontWeight: "bold", fontSize: 12, ...S.mono }}>{row.value}</span>
                </div>
              ))}
            </div>
            {data.pnl_by_ticker && Object.keys(data.pnl_by_ticker).length > 0 && (
              <div style={S.card}>
                <div style={{ color: S.text, fontWeight: "bold", marginBottom: 12, fontSize: 13, fontFamily: "'DM Sans', sans-serif" }}>🏷️ P&L by Ticker</div>
                {Object.entries(data.pnl_by_ticker).sort((a,b) => b[1]-a[1]).map(([tk, pnl]) => (
                  <div key={tk} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid #e8ecf0" }}>
                    <span style={{ color: "#0d9f4f", fontWeight: "bold", fontSize: 12 }}>{tk}</span>
                    <span style={{ color: pnlColor(pnl), fontWeight: "bold", fontSize: 12, ...S.mono }}>{pnl > 0 ? "+" : ""}${pnl.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ═══ GREEKS ═══ */}
      {!loading && tab === "greeks" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div style={S.card}>
            <div style={{ color: S.text, fontWeight: "bold", fontSize: 13, marginBottom: 16, fontFamily: "'DM Sans', sans-serif" }}>🔬 Black-Scholes Calculator</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {[
                { label: "Stock Price ($)", value: gSpot, set: setGSpot },
                { label: "Strike Price ($)", value: gStrike, set: setGStrike },
                { label: "Days to Expiry", value: gDays, set: setGDays },
                { label: "Implied Volatility (%)", value: gIV, set: setGIV },
                { label: "Risk-Free Rate (%)", value: gRate, set: setGRate },
              ].map((inp) => (
                <div key={inp.label}>
                  <div style={S.label}>{inp.label}</div>
                  <input type="number" value={inp.value} onChange={(e) => inp.set(Number(e.target.value))} style={inputStyle} />
                </div>
              ))}
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div style={{ ...S.card, borderTop: `3px solid ${S.green}` }}>
                <div style={S.label}>📗 Call Price</div>
                <div style={{ fontSize: 26, fontWeight: 800, color: S.green, ...S.mono }}>${greeks.callPrice.toFixed(2)}</div>
              </div>
              <div style={{ ...S.card, borderTop: `3px solid ${S.red}` }}>
                <div style={S.label}>📕 Put Price</div>
                <div style={{ fontSize: 26, fontWeight: 800, color: S.red, ...S.mono }}>${greeks.putPrice.toFixed(2)}</div>
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              {[
                { label: "Δ Delta", value: greeks.delta.toFixed(4), desc: "Price sensitivity", color: S.blue },
                { label: "Γ Gamma", value: greeks.gamma.toFixed(4), desc: "Delta rate of change", color: S.purple },
                { label: "Θ Theta", value: greeks.theta.toFixed(4), desc: "Daily time decay", color: S.yellow },
                { label: "ν Vega", value: greeks.vega.toFixed(4), desc: "IV sensitivity (1%)", color: S.green },
              ].map((g) => (
                <div key={g.label} style={hoverCard(`g-${g.label}`)} onMouseEnter={() => setHoveredCard(`g-${g.label}`)} onMouseLeave={() => setHoveredCard(null)}>
                  <div style={{ fontSize: 10, color: g.color, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>{g.label}</div>
                  <div style={{ fontSize: 22, fontWeight: 700, ...S.mono, color: S.text }}>{g.value}</div>
                  <div style={{ fontSize: 11, color: S.muted, marginTop: 2, fontFamily: "'DM Sans', sans-serif" }}>{g.desc}</div>
                </div>
              ))}
            </div>
            <div style={S.card}>
              {[
                { label: "Moneyness", value: gSpot > gStrike ? "🟢 In-the-Money" : gSpot < gStrike ? "🔴 Out-of-the-Money" : "⚪ At-the-Money", color: gSpot > gStrike ? S.green : gSpot < gStrike ? S.red : S.muted },
                { label: "Time Value (Call)", value: `$${(greeks.callPrice - Math.max(gSpot - gStrike, 0)).toFixed(2)}`, color: S.text },
                { label: "Intrinsic Value (Call)", value: `$${Math.max(gSpot - gStrike, 0).toFixed(2)}`, color: S.text },
              ].map(row => (
                <div key={row.label} style={{ display: "flex", justifyContent: "space-between", fontSize: 12, padding: "6px 0", borderBottom: "1px solid #e8ecf0" }}>
                  <span style={{ color: S.muted, fontFamily: "'DM Sans', sans-serif" }}>{row.label}</span>
                  <span style={{ fontWeight: 700, color: row.color, ...S.mono }}>{row.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ═══ P&L ═══ */}
      {!loading && tab === "pnl" && (
        <div>
          <div style={S.card}>
            <div style={{ color: S.text, fontWeight: "bold", fontSize: 13, marginBottom: 4, fontFamily: "'DM Sans', sans-serif" }}>📊 P&L by Ticker</div>
            <div style={{ color: S.muted, fontSize: 11, marginBottom: 16, fontFamily: "'DM Sans', sans-serif" }}>Closed trade performance across all tickers</div>
            <canvas ref={pnlCanvasRef} style={{ width: "100%", height: 350, display: "block" }} />
          </div>

          {/* Cumulative P&L Line */}
          <div style={S.card}>
            <div style={{ color: S.text, fontWeight: "bold", fontSize: 13, marginBottom: 12, fontFamily: "'DM Sans', sans-serif" }}>📈 Cumulative Equity Curve</div>
            {cumulativePnl.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <AreaChart data={cumulativePnl}>
                  <defs>
                    <linearGradient id="cumGrad2" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={S.green} stopOpacity={0.3} />
                      <stop offset="95%" stopColor={S.green} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e8ecf0" />
                  <XAxis dataKey="trade" fontSize={10} tick={{ fill: S.dim }} />
                  <YAxis fontSize={10} tick={{ fill: S.dim }} tickFormatter={v => `$${v}`} />
                  <Tooltip content={<ChartTooltip />} />
                  <Area type="monotone" dataKey="cumulative" name="Cumulative" stroke={S.green} fill="url(#cumGrad2)" strokeWidth={2} />
                  <Area type="monotone" dataKey="pnl" name="Per Trade" stroke={S.blue} fill="none" strokeWidth={1} strokeDasharray="3 3" />
                </AreaChart>
              </ResponsiveContainer>
            ) : <div style={{ color: S.muted, textAlign: "center", padding: 40 }}>No data</div>}
          </div>

          {pnlByTicker.length > 0 && (
            <div style={S.card}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead><tr style={{ borderBottom: "1px solid #e8ecf0" }}>{["Ticker", "P&L", "Direction"].map(h => <th key={h} style={{ ...thStyle, fontSize: 10 }}>{h}</th>)}</tr></thead>
                <tbody>{pnlByTicker.map(([ticker, pnl]) => (
                  <tr key={ticker} style={{ borderBottom: "1px solid #f0f2f5" }}>
                    <td style={{ ...cellStyle, fontWeight: 700, color: "#0d9f4f", textAlign: "left" }}>{ticker}</td>
                    <td style={{ ...cellStyle, color: pnlColor(pnl), fontWeight: 700 }}>{pnl > 0 ? "+" : ""}${pnl.toFixed(2)}</td>
                    <td style={{ ...cellStyle, color: pnlColor(pnl) }}>{pnl > 0 ? "🟢 PROFIT" : pnl < 0 ? "🔴 LOSS" : "⚪ FLAT"}</td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ═══ ANALYTICS ═══ */}
      {!loading && tab === "analytics" && data && (
        <div>
          {/* Metrics row */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 12 }}>
            {[
              { id: "pf", label: "📐 Profit Factor", value: profitFactor === Infinity ? "∞" : profitFactor.toFixed(2), color: profitFactor >= 1.5 ? S.green : profitFactor >= 1 ? S.yellow : S.red, sub: profitFactor >= 1.5 ? "Excellent" : profitFactor >= 1 ? "Breakeven" : "Negative edge" },
              { id: "ws", label: "🔥 Max Win Streak", value: winLossStreaks.maxWin, color: S.green, sub: `Current: ${winLossStreaks.currentStreak} ${winLossStreaks.currentType}` },
              { id: "ls", label: "❄️ Max Loss Streak", value: winLossStreaks.maxLoss, color: S.red, sub: "consecutive losses" },
              { id: "avg", label: "📏 Avg Trade", value: `$${data.closed_trades.length > 0 ? (data.summary.total_pnl / data.closed_trades.length).toFixed(2) : "0"}`, color: S.blue, sub: "per trade expectancy" },
            ].map(c => (
              <div key={c.id} style={hoverCard(`a-${c.id}`)} onMouseEnter={() => setHoveredCard(`a-${c.id}`)} onMouseLeave={() => setHoveredCard(null)}>
                <div style={S.label}>{c.label}</div>
                <div style={{ fontSize: 28, fontWeight: "bold", color: c.color, ...S.mono }}>{c.value}</div>
                <div style={{ color: S.dim, fontSize: 11, fontFamily: "'DM Sans', sans-serif" }}>{c.sub}</div>
              </div>
            ))}
          </div>

          {/* Strategy P&L breakdown */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
            <div style={S.card}>
              <div style={{ color: S.text, fontWeight: "bold", marginBottom: 12, fontSize: 13, fontFamily: "'DM Sans', sans-serif" }}>🎯 Strategy P&L</div>
              {strategyBreakdown.length > 0 ? (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={strategyBreakdown} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#e8ecf0" />
                    <XAxis type="number" fontSize={10} tick={{ fill: S.dim }} tickFormatter={v => `$${v}`} />
                    <YAxis type="category" dataKey="name" fontSize={10} tick={{ fill: S.dim }} width={100} />
                    <Tooltip content={<ChartTooltip />} />
                    <Bar dataKey="pnl" name="P&L" radius={[0, 4, 4, 0]}>
                      {strategyBreakdown.map((entry, i) => <Cell key={i} fill={entry.pnl >= 0 ? S.green : S.red} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : <div style={{ color: S.muted, textAlign: "center", padding: 40 }}>No data</div>}
            </div>

            {/* Day of Week */}
            <div style={S.card}>
              <div style={{ color: S.text, fontWeight: "bold", marginBottom: 12, fontSize: 13, fontFamily: "'DM Sans', sans-serif" }}>📅 P&L by Day of Week</div>
              {dayOfWeekPnl.length > 0 ? (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={dayOfWeekPnl}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e8ecf0" />
                    <XAxis dataKey="day" fontSize={10} tick={{ fill: S.dim }} />
                    <YAxis fontSize={10} tick={{ fill: S.dim }} tickFormatter={v => `$${v}`} />
                    <Tooltip content={<ChartTooltip />} />
                    <Bar dataKey="pnl" name="P&L" radius={[4, 4, 0, 0]}>
                      {dayOfWeekPnl.map((entry, i) => <Cell key={i} fill={entry.pnl >= 0 ? S.green : S.red} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : <div style={{ color: S.muted, textAlign: "center", padding: 40 }}>No data</div>}
            </div>
          </div>

          {/* Best & Worst trades */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div style={S.card}>
              <div style={{ color: S.green, fontWeight: "bold", marginBottom: 12, fontSize: 13, fontFamily: "'DM Sans', sans-serif" }}>🏆 Best Trades</div>
              {bestWorstTrades.best.map((t, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid #e8ecf0", fontSize: 12 }}>
                  <span style={{ color: "#0d9f4f", fontWeight: "bold" }}>{t.ticker}</span>
                  <span style={{ color: S.dim }}>{t.strategy}</span>
                  <span style={{ color: S.green, fontWeight: "bold", ...S.mono }}>+${t.pnl.toFixed(2)}</span>
                </div>
              ))}
            </div>
            <div style={S.card}>
              <div style={{ color: S.red, fontWeight: "bold", marginBottom: 12, fontSize: 13, fontFamily: "'DM Sans', sans-serif" }}>💀 Worst Trades</div>
              {bestWorstTrades.worst.map((t, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid #e8ecf0", fontSize: 12 }}>
                  <span style={{ color: "#0d9f4f", fontWeight: "bold" }}>{t.ticker}</span>
                  <span style={{ color: S.dim }}>{t.strategy}</span>
                  <span style={{ color: S.red, fontWeight: "bold", ...S.mono }}>${t.pnl.toFixed(2)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ═══ TOOLS ═══ */}
      {!loading && tab === "tools" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          {/* Position Sizer */}
          <div style={S.card}>
            <div style={{ color: S.text, fontWeight: "bold", fontSize: 13, marginBottom: 16, fontFamily: "'DM Sans', sans-serif" }}>📐 Position Size Calculator</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {[
                { label: "Account Size ($)", value: toolAcctSize, set: setToolAcctSize },
                { label: "Risk per Trade (%)", value: toolRiskPct, set: setToolRiskPct },
                { label: "Entry Price ($)", value: toolEntryPrice, set: setToolEntryPrice },
                { label: "Stop Loss Price ($)", value: toolStopPrice, set: setToolStopPrice },
              ].map(inp => (
                <div key={inp.label}>
                  <div style={S.label}>{inp.label}</div>
                  <input type="number" value={inp.value} onChange={e => inp.set(Number(e.target.value))} style={inputStyle} step={inp.label.includes("Price") ? 0.5 : undefined} />
                </div>
              ))}
            </div>
            <div style={{ marginTop: 16, borderTop: "1px solid #e8ecf0", paddingTop: 12 }}>
              {[
                { label: "Max Contracts", value: positionSize.contracts, color: S.green },
                { label: "Risk per Trade", value: `$${positionSize.riskPerTrade.toFixed(2)}`, color: S.yellow },
                { label: "Risk per Contract", value: `$${positionSize.riskPerContract.toFixed(2)}`, color: S.dim },
                { label: "Total Risk", value: `$${positionSize.totalRisk.toFixed(2)}`, color: S.red },
                { label: "Total Cost", value: `$${positionSize.totalCost.toFixed(2)}`, color: S.blue },
              ].map(r => (
                <div key={r.label} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid #e8ecf0" }}>
                  <span style={{ color: S.muted, fontSize: 12, fontFamily: "'DM Sans', sans-serif" }}>{r.label}</span>
                  <span style={{ color: r.color, fontWeight: "bold", fontSize: 14, ...S.mono }}>{r.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Probability Calculator */}
          <div style={S.card}>
            <div style={{ color: S.text, fontWeight: "bold", fontSize: 13, marginBottom: 16, fontFamily: "'DM Sans', sans-serif" }}>🎲 Probability of Profit</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {[
                { label: "Current Stock Price ($)", value: toolProbSpot, set: setToolProbSpot },
                { label: "Strike Price ($)", value: toolProbStrike, set: setToolProbStrike },
                { label: "Days to Expiry", value: toolProbDays, set: setToolProbDays },
                { label: "Implied Volatility (%)", value: toolProbIV, set: setToolProbIV },
              ].map(inp => (
                <div key={inp.label}>
                  <div style={S.label}>{inp.label}</div>
                  <input type="number" value={inp.value} onChange={e => inp.set(Number(e.target.value))} style={inputStyle} />
                </div>
              ))}
            </div>
            <div style={{ marginTop: 16, borderTop: "1px solid #e8ecf0", paddingTop: 12 }}>
              {/* Visual probability bar */}
              <div style={{ marginBottom: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                  <span style={{ color: S.green, fontSize: 11, fontWeight: "bold" }}>OTM {probProfit.otmProb.toFixed(1)}%</span>
                  <span style={{ color: S.red, fontSize: 11, fontWeight: "bold" }}>ITM {probProfit.itmProb.toFixed(1)}%</span>
                </div>
                <div style={{ height: 12, borderRadius: 6, background: S.red, overflow: "hidden", position: "relative" }}>
                  <div style={{ width: `${probProfit.otmProb}%`, height: "100%", background: S.green, borderRadius: 6, transition: "width 0.3s ease" }} />
                </div>
              </div>
              {[
                { label: "Prob. Expires OTM", value: `${probProfit.otmProb.toFixed(1)}%`, color: S.green, desc: "Short sellers profit" },
                { label: "Prob. Expires ITM", value: `${probProfit.itmProb.toFixed(1)}%`, color: S.red, desc: "Long buyers profit" },
                { label: "Expected Move", value: `±$${(toolProbSpot * (toolProbIV/100) * Math.sqrt(toolProbDays/365)).toFixed(2)}`, color: S.blue, desc: "1 std deviation" },
              ].map(r => (
                <div key={r.label} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid #e8ecf0" }}>
                  <div>
                    <span style={{ color: S.muted, fontSize: 12, fontFamily: "'DM Sans', sans-serif" }}>{r.label}</span>
                    <div style={{ color: S.dim, fontSize: 10 }}>{r.desc}</div>
                  </div>
                  <span style={{ color: r.color, fontWeight: "bold", fontSize: 14, ...S.mono }}>{r.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Reference */}
          <div style={{ ...S.card, gridColumn: "1 / -1" }}>
            <div style={{ color: S.text, fontWeight: "bold", fontSize: 13, marginBottom: 12, fontFamily: "'DM Sans', sans-serif" }}>📚 Quick Reference</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
              {[
                { icon: "🔺", label: "Long Call", desc: "Bullish bet, buy calls", risk: "Premium paid", reward: "Unlimited" },
                { icon: "🔻", label: "Long Put", desc: "Bearish bet, buy puts", risk: "Premium paid", reward: "Strike - Premium" },
                { icon: "📗", label: "Covered Call", desc: "Own stock, sell calls", risk: "Stock decline", reward: "Premium + upside to strike" },
                { icon: "📕", label: "Cash-Secured Put", desc: "Sell puts, cash reserve", risk: "Stock assignment", reward: "Premium collected" },
                { icon: "📊", label: "Bull Call Spread", desc: "Buy low strike, sell high", risk: "Net debit", reward: "Strike diff - debit" },
                { icon: "📉", label: "Bear Put Spread", desc: "Buy high strike, sell low", risk: "Net debit", reward: "Strike diff - debit" },
                { icon: "🦅", label: "Iron Condor", desc: "Sell OTM strangle + wings", risk: "Strike diff - credit", reward: "Net credit" },
                { icon: "🦋", label: "Iron Butterfly", desc: "Sell ATM straddle + wings", risk: "Strike diff - credit", reward: "Net credit" },
              ].map(s => (
                <div key={s.label} style={{ padding: 12, border: "1px solid #e8ecf0", borderRadius: 6, fontSize: 11, fontFamily: "'DM Sans', sans-serif" }}>
                  <div style={{ fontSize: 20, marginBottom: 4 }}>{s.icon}</div>
                  <div style={{ color: S.text, fontWeight: "bold", marginBottom: 2 }}>{s.label}</div>
                  <div style={{ color: S.muted, marginBottom: 6 }}>{s.desc}</div>
                  <div style={{ color: S.red, fontSize: 10 }}>Risk: {s.risk}</div>
                  <div style={{ color: S.green, fontSize: 10 }}>Reward: {s.reward}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Monte Carlo EV Calculator */}
          <div style={{ ...S.card, gridColumn: "1 / -1" }}>
            <div style={{ color: S.text, fontWeight: "bold", fontSize: 13, marginBottom: 16, fontFamily: "'DM Sans', sans-serif" }}>🎰 Expected Value Calculator (Monte Carlo)</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr auto auto", gap: 12, alignItems: "end", marginBottom: 12 }}>
              <div>
                <div style={S.label}>Type</div>
                <select value={evType} onChange={e => setEvType(e.target.value as any)} style={{ ...inputStyle, cursor: "pointer", width: "100%" }}>
                  <option value="long_call">Long Call</option>
                  <option value="long_put">Long Put</option>
                  <option value="short_call">Short Call</option>
                  <option value="short_put">Short Put</option>
                </select>
              </div>
              {[
                { label: "Stock ($)", value: evSpot, set: setEvSpot },
                { label: "Strike ($)", value: evStrike, set: setEvStrike },
                { label: "Premium ($)", value: evPremium, set: setEvPremium },
                { label: "Days", value: evDays, set: setEvDays },
              ].map(inp => (
                <div key={inp.label}>
                  <div style={S.label}>{inp.label}</div>
                  <input type="number" value={inp.value} onChange={e => inp.set(Number(e.target.value))} style={{ ...inputStyle, width: "100%" }} step={inp.label.includes("$") ? 0.5 : 1} />
                </div>
              ))}
              <button onClick={runEVSimulation} style={{ background: "#7c3aed", color: "#fff", border: "none", borderRadius: 6, padding: "10px 20px", fontSize: 12, fontWeight: "bold", cursor: "pointer", fontFamily: S.font, whiteSpace: "nowrap" }}>
                Run Sim
              </button>
            </div>
            {evResults && (
              <div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8, marginBottom: 12 }}>
                  {[
                    { label: "Expected Value", value: `$${evResults.ev.toFixed(2)}`, color: evResults.ev >= 0 ? S.green : S.red },
                    { label: "P(Profit)", value: `${(evResults.pProfit * 100).toFixed(1)}%`, color: evResults.pProfit >= 0.5 ? S.green : S.red },
                    { label: "5th Percentile", value: `$${evResults.p5.toFixed(0)}`, color: S.red },
                    { label: "95th Percentile", value: `$${evResults.p95.toFixed(0)}`, color: S.green },
                  ].map((s, i) => (
                    <div key={i} style={{ padding: 10, border: "1px solid #e8ecf0", borderRadius: 6, textAlign: "center" }}>
                      <div style={{ ...S.label, textAlign: "center" }}>{s.label}</div>
                      <div style={{ fontSize: 18, fontWeight: "bold", color: s.color, ...S.mono }}>{s.value}</div>
                    </div>
                  ))}
                </div>
                <div style={{ height: 180 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={evResults.histogram}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e8ecf020" />
                      <XAxis dataKey="range" tick={{ fontSize: 9, fill: S.muted }} interval={4} />
                      <YAxis tick={{ fontSize: 9, fill: S.muted }} />
                      <Tooltip content={<ChartTooltip />} />
                      <Bar dataKey="count" name="Scenarios">
                        {evResults.histogram.map((entry: any, index: number) => (
                          <Cell key={index} fill={entry.isProfit ? S.green : S.red} fillOpacity={0.7} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div style={{ textAlign: "center", fontSize: 10, color: S.muted, marginTop: 4 }}>{evResults.N.toLocaleString()} simulated paths · {evIV}% IV · {evDays} DTE</div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ═══ PAYOFF DIAGRAM ═══ */}
      {!loading && tab === "payoff" && (
        <div style={{ display: "grid", gridTemplateColumns: "300px 1fr", gap: 12 }}>
          <div style={S.card}>
            <div style={{ color: S.text, fontWeight: "bold", fontSize: 13, marginBottom: 16, fontFamily: "'DM Sans', sans-serif" }}>💹 Strategy Builder</div>
            <div style={{ marginBottom: 12 }}>
              <div style={S.label}>Strategy</div>
              <select value={payoffType} onChange={e => setPayoffType(e.target.value as any)} style={{ ...inputStyle, cursor: "pointer" }}>
                <option value="long_call">🔺 Long Call</option>
                <option value="long_put">🔻 Long Put</option>
                <option value="covered_call">📗 Covered Call</option>
                <option value="bull_spread">📊 Bull Call Spread</option>
                <option value="iron_condor">🦅 Iron Condor</option>
              </select>
            </div>
            {[
              { label: "Stock Price ($)", value: payoffSpot, set: setPayoffSpot },
              { label: "Strike 1 ($)", value: payoffStrike1, set: setPayoffStrike1 },
              ...(["bull_spread", "iron_condor"].includes(payoffType) ? [{ label: "Strike 2 ($)", value: payoffStrike2, set: setPayoffStrike2 }] : []),
              ...(payoffType === "iron_condor" ? [{ label: "Put Strike Low ($)", value: payoffStrike3, set: setPayoffStrike3 }, { label: "Call Strike High ($)", value: payoffStrike4, set: setPayoffStrike4 }] : []),
              { label: "Premium ($)", value: payoffPremium, set: setPayoffPremium },
              ...(payoffType === "bull_spread" ? [{ label: "Short Leg Premium ($)", value: payoffPremium2, set: setPayoffPremium2 }] : []),
            ].map(inp => (
              <div key={inp.label} style={{ marginBottom: 10 }}>
                <div style={S.label}>{inp.label}</div>
                <input type="number" value={inp.value} onChange={e => inp.set(Number(e.target.value))} style={inputStyle} step={0.5} />
              </div>
            ))}
            {/* Quick metrics */}
            <div style={{ marginTop: 12, borderTop: "1px solid #e8ecf0", paddingTop: 12 }}>
              {(() => {
                const maxProfit = Math.max(...payoffData.map(d => d.pnl));
                const maxLoss = Math.min(...payoffData.map(d => d.pnl));
                const breakeven = payoffData.find((d, i) => i > 0 && ((payoffData[i-1].pnl < 0 && d.pnl >= 0) || (payoffData[i-1].pnl >= 0 && d.pnl < 0)));
                return [
                  { label: "Max Profit", value: `$${maxProfit.toFixed(2)}`, color: S.green },
                  { label: "Max Loss", value: `$${maxLoss.toFixed(2)}`, color: S.red },
                  { label: "Breakeven", value: breakeven ? `$${breakeven.price}` : "N/A", color: S.blue },
                ].map(r => (
                  <div key={r.label} style={{ display: "flex", justifyContent: "space-between", padding: "4px 0" }}>
                    <span style={{ color: S.muted, fontSize: 11 }}>{r.label}</span>
                    <span style={{ color: r.color, fontWeight: "bold", fontSize: 12, ...S.mono }}>{r.value}</span>
                  </div>
                ));
              })()}
            </div>
          </div>

          <div style={S.card}>
            <div style={{ color: S.text, fontWeight: "bold", fontSize: 13, marginBottom: 12, fontFamily: "'DM Sans', sans-serif" }}>
              📈 Payoff at Expiration — {payoffType.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase())}
            </div>
            <ResponsiveContainer width="100%" height={400}>
              <AreaChart data={payoffData}>
                <defs>
                  <linearGradient id="profitGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={S.green} stopOpacity={0.2} />
                    <stop offset="95%" stopColor={S.green} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e8ecf0" />
                <XAxis dataKey="price" fontSize={10} tick={{ fill: S.dim }} tickFormatter={v => `$${v}`} label={{ value: "Stock Price at Expiry", position: "insideBottomRight", offset: -5, fill: S.muted, fontSize: 10 }} />
                <YAxis fontSize={10} tick={{ fill: S.dim }} tickFormatter={v => `$${v}`} />
                <Tooltip content={<ChartTooltip />} />
                <Area type="monotone" dataKey="pnl" name="P&L" stroke={S.green} fill="url(#profitGrad)" strokeWidth={2}
                  dot={false} activeDot={{ r: 4, stroke: S.green, strokeWidth: 2, fill: "#fff" }} />
                {/* Zero line reference */}
                <Line type="monotone" dataKey={() => 0} stroke={S.dim} strokeDasharray="5 5" strokeWidth={1} dot={false} legendType="none" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* ═══ TRADE REPLAY ═══ */}
      {!loading && tab === "replay" && (
        <div>
          <div style={{ color: S.muted, fontSize: 13, fontFamily: S.font, marginBottom: 12 }}>🔄 Replay closed trades — see price action from entry to exit</div>
          {!replayTrade ? (
            <div>
              <div style={{ color: S.dim, fontSize: 12, marginBottom: 8, fontFamily: S.font }}>Select a closed trade to replay:</div>
              <div style={{ maxHeight: 400, overflowY: "auto" }}>
                {(data?.closed_trades || []).slice(0, 30).map((t, i) => (
                  <div key={i} onClick={() => loadReplay(t)} style={{
                    ...S.card, cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center",
                    border: "1px solid #21262d", background: "#0d1117", padding: "10px 14px", marginBottom: 6,
                  }}>
                    <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                      <span style={{ color: S.green, fontWeight: 700, fontSize: 13, ...S.mono }}>{t.ticker}</span>
                      <span style={{ color: t.call_put === "call" ? "#3fb950" : "#f85149", fontSize: 11, ...S.mono }}>{t.call_put?.toUpperCase()} ${t.strike}</span>
                      <span style={{ color: S.dim, fontSize: 10 }}>{t.open_date?.slice(0,10)} → {t.close_date?.slice(0,10)}</span>
                    </div>
                    <span style={{ color: t.pnl >= 0 ? S.green : S.red, fontWeight: 700, ...S.mono, fontSize: 13 }}>
                      {t.pnl >= 0 ? "+" : ""}${t.pnl?.toFixed(2)}
                    </span>
                  </div>
                ))}
                {(!data?.closed_trades || data.closed_trades.length === 0) && (
                  <div style={{ color: S.dim, fontSize: 12, textAlign: "center", padding: 40 }}>No closed trades to replay. Upload your journal first.</div>
                )}
              </div>
            </div>
          ) : (
            <div>
              {/* Replay header */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12, flexWrap: "wrap", gap: 8 }}>
                <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                  <span style={{ color: S.green, fontWeight: 700, fontSize: 16, ...S.mono }}>{replayTrade.ticker}</span>
                  <span style={{ color: replayTrade.call_put === "call" ? "#3fb950" : "#f85149", fontSize: 12, ...S.mono }}>{replayTrade.call_put?.toUpperCase()} ${replayTrade.strike}</span>
                  <span style={{ color: S.dim, fontSize: 11 }}>{replayTrade.open_date?.slice(0,10)} → {replayTrade.close_date?.slice(0,10)}</span>
                  <span style={{ color: replayTrade.pnl >= 0 ? S.green : S.red, fontWeight: 700, ...S.mono }}>
                    {replayTrade.pnl >= 0 ? "+" : ""}${replayTrade.pnl?.toFixed(2)} ({replayTrade.pnl_pct?.toFixed(1)}%)
                  </span>
                </div>
                <button onClick={() => { setReplayTrade(null); setReplayData([]); }} style={{ padding: "6px 14px", fontSize: 11, borderRadius: 6, border: "1px solid #30363d", background: "transparent", color: S.muted, cursor: "pointer", fontFamily: S.font }}>← Back</button>
              </div>

              {replayLoading ? (
                <div style={{ textAlign: "center", padding: 40, color: S.dim, fontSize: 13 }}>Loading price data...</div>
              ) : replayData.length > 0 ? (
                <div>
                  {/* Timeline slider */}
                  <div style={{ marginBottom: 16 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                      <span style={{ color: S.dim, fontSize: 10, fontFamily: S.font }}>Entry</span>
                      <span style={{ color: S.muted, fontSize: 11, fontFamily: S.font, fontWeight: 600 }}>
                        Day {Math.round(replaySlider / 100 * replayData.length)} / {replayData.length}
                      </span>
                      <span style={{ color: S.dim, fontSize: 10, fontFamily: S.font }}>Exit</span>
                    </div>
                    <input type="range" min={0} max={100} value={replaySlider} onChange={e => setReplaySlider(Number(e.target.value))}
                      style={{ width: "100%", accentColor: S.green }} />
                  </div>

                  {/* Current point stats */}
                  {(() => {
                    const idx = Math.min(Math.floor(replaySlider / 100 * replayData.length), replayData.length - 1);
                    const pt = replayData[idx];
                    if (!pt) return null;
                    return (
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8, marginBottom: 16 }}>
                        {[
                          ["Date", pt.date],
                          ["Stock Price", `$${pt.price?.toFixed(2)}`],
                          ["P&L at Point", `${pt.pnl >= 0 ? "+" : ""}$${pt.pnl?.toFixed(2)}`],
                          ["Progress", `${pt.progress}%`],
                        ].map(([label, val], i) => (
                          <div key={i} style={{ background: "#161b22", border: "1px solid #21262d", borderRadius: 6, padding: "8px 12px" }}>
                            <div style={{ color: S.dim, fontSize: 9, textTransform: "uppercase", letterSpacing: 1, marginBottom: 2 }}>{label}</div>
                            <div style={{ color: i === 2 ? (pt.pnl >= 0 ? S.green : S.red) : "#e6edf3", fontWeight: 600, ...S.mono, fontSize: 13 }}>{val}</div>
                          </div>
                        ))}
                      </div>
                    );
                  })()}

                  {/* Price chart with entry/exit markers */}
                  <div style={{ ...S.card, background: "#0d1117", border: "1px solid #21262d", padding: 12 }}>
                    <div style={{ color: S.dim, fontSize: 10, textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>Price Action</div>
                    <ResponsiveContainer width="100%" height={200}>
                      <AreaChart data={replayData.slice(0, Math.floor(replaySlider / 100 * replayData.length) + 1)}>
                        <XAxis dataKey="date" tick={{ fontSize: 9, fill: "#484f58" }} />
                        <YAxis tick={{ fontSize: 9, fill: "#484f58" }} domain={["auto", "auto"]} />
                        <Tooltip contentStyle={{ background: "#161b22", border: "1px solid #30363d", borderRadius: 6, fontSize: 11 }} />
                        <Area type="monotone" dataKey="price" stroke="#58a6ff" fill="#58a6ff" fillOpacity={0.1} strokeWidth={2} />
                        <Line type="monotone" dataKey="strike" stroke="#f85149" strokeDasharray="6 3" strokeWidth={1} dot={false} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>

                  {/* P&L chart */}
                  <div style={{ ...S.card, background: "#0d1117", border: "1px solid #21262d", padding: 12, marginTop: 8 }}>
                    <div style={{ color: S.dim, fontSize: 10, textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>P&L Over Time</div>
                    <ResponsiveContainer width="100%" height={150}>
                      <AreaChart data={replayData.slice(0, Math.floor(replaySlider / 100 * replayData.length) + 1)}>
                        <XAxis dataKey="date" tick={{ fontSize: 9, fill: "#484f58" }} />
                        <YAxis tick={{ fontSize: 9, fill: "#484f58" }} />
                        <Tooltip contentStyle={{ background: "#161b22", border: "1px solid #30363d", borderRadius: 6, fontSize: 11 }} />
                        <Area type="monotone" dataKey="pnl" stroke={replayTrade.pnl >= 0 ? "#3fb950" : "#f85149"} fill={replayTrade.pnl >= 0 ? "#3fb950" : "#f85149"} fillOpacity={0.15} strokeWidth={2} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              ) : (
                <div style={{ textAlign: "center", padding: 40, color: S.dim, fontSize: 13 }}>No price data available for this trade period.</div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ═══ AI ANALYSIS ═══ */}
      {!loading && tab === "ai" && (
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 8 }}>
            <div style={{ color: S.muted, fontSize: 13, fontFamily: S.font }}>🧠 AI-powered analysis of your trading patterns</div>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => window.open(`${API}/export/options-journal`, "_blank")}
                style={{ background: "transparent", border: "1px solid #e8ecf0", borderRadius: 6, padding: "10px 16px", fontSize: 12, fontWeight: 500, cursor: "pointer", fontFamily: S.font, color: S.muted }}>
                Export CSV
              </button>
              <button onClick={runDeepReview} disabled={deepReviewLoading || !data?.closed_trades?.length}
                style={{ background: "#0d9f4f", color: "#fff", border: "none", borderRadius: 6, padding: "10px 20px", fontSize: 12, fontWeight: "bold", cursor: "pointer", fontFamily: S.font, opacity: deepReviewLoading ? 0.5 : 1 }}>
                {deepReviewLoading ? "⏳ Reviewing..." : "🧠 Deep Review (Claude)"}
              </button>
              <button onClick={loadAnalysis} disabled={analyzing}
                style={{ background: "#7c3aed", color: "#fff", border: "none", borderRadius: 6, padding: "10px 20px", fontSize: 12, fontWeight: "bold", cursor: "pointer", fontFamily: S.font, opacity: analyzing ? 0.5 : 1 }}>
                {analyzing ? "⏳ Analyzing..." : "🔄 Run Analysis"}
              </button>
            </div>
          </div>

          {/* Deep Review Results */}
          {deepReview && !deepReview.error && (
            <div style={{ ...S.card, marginBottom: 16, borderLeft: `3px solid #0d9f4f` }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <div style={{ fontSize: 14, fontWeight: "bold", color: S.text, fontFamily: S.font }}>🧠 Claude Deep Review</div>
                <div style={{ padding: "4px 12px", borderRadius: 20, background: deepReview.overall_grade === "A" ? "#0d9f4f20" : deepReview.overall_grade === "B" ? "#58a6ff20" : "#d2992220",
                  color: deepReview.overall_grade === "A" ? S.green : deepReview.overall_grade === "B" ? S.blue : S.yellow, fontWeight: "bold", fontSize: 16, ...S.mono }}>
                  {deepReview.overall_grade}
                </div>
              </div>
              <p style={{ color: S.muted, fontSize: 13, lineHeight: 1.6, marginBottom: 12, fontFamily: S.font }}>{deepReview.summary}</p>
              {deepReview.strengths?.length > 0 && (
                <div style={{ marginBottom: 12 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: S.green, marginBottom: 6, fontFamily: S.font }}>STRENGTHS</div>
                  {deepReview.strengths.map((s: any, i: number) => (
                    <div key={i} style={{ fontSize: 12, color: S.muted, marginBottom: 4, fontFamily: S.font }}>✓ <strong style={{ color: S.text }}>{s.strength}</strong> — {s.description}</div>
                  ))}
                </div>
              )}
              {deepReview.mistakes?.length > 0 && (
                <div style={{ marginBottom: 12 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: S.red, marginBottom: 6, fontFamily: S.font }}>AREAS TO IMPROVE</div>
                  {deepReview.mistakes.map((m: any, i: number) => (
                    <div key={i} style={{ fontSize: 12, color: S.muted, marginBottom: 4, fontFamily: S.font }}>✗ <strong style={{ color: S.text }}>{m.mistake}</strong> — {m.description}. Fix: {m.fix}</div>
                  ))}
                </div>
              )}
              {deepReview.recommendations?.length > 0 && (
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: S.blue, marginBottom: 6, fontFamily: S.font }}>RECOMMENDATIONS</div>
                  {deepReview.recommendations.map((r: string, i: number) => (
                    <div key={i} style={{ fontSize: 12, color: S.muted, marginBottom: 4, fontFamily: S.font }}>→ {r}</div>
                  ))}
                </div>
              )}
              {deepReview.risk_management && (
                <div style={{ marginTop: 12, padding: 10, border: "1px solid #e8ecf0", borderRadius: 6, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ fontSize: 11, color: S.muted, fontFamily: S.font }}>Risk Management Score</div>
                  <div style={{ fontSize: 20, fontWeight: "bold", color: (deepReview.risk_management.score || 0) >= 7 ? S.green : (deepReview.risk_management.score || 0) >= 4 ? S.yellow : S.red, ...S.mono }}>
                    {deepReview.risk_management.score}/10
                  </div>
                </div>
              )}
            </div>
          )}

          {analyzing && (
            <div style={{ color: S.muted, textAlign: "center", padding: 60, fontFamily: S.font, fontSize: 14 }}>
              ⏳ Analyzing your {data?.summary?.total_trades || 0} trades...
            </div>
          )}

          {!analysis && !analyzing && (
            <div style={{ ...S.card, textAlign: "center", padding: 60 }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>🤖</div>
              <div style={{ color: S.text, fontWeight: "bold", fontSize: 16, marginBottom: 8, fontFamily: S.font }}>AI Trade Analysis</div>
              <div style={{ color: S.muted, fontSize: 13, marginBottom: 20, fontFamily: S.font }}>Get personalized insights about your trading patterns, strengths, and areas for improvement.</div>
              <button onClick={loadAnalysis}
                style={{ background: "#7c3aed", color: "#fff", border: "none", borderRadius: 6, padding: "12px 28px", fontSize: 14, fontWeight: "bold", cursor: "pointer", fontFamily: S.font }}>
                🚀 Analyze My Trades
              </button>
            </div>
          )}

          {analysis && (
            <div>
              {/* Key Stats */}
              {analysis.stats && (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 12, marginBottom: 16 }}>
                  {[
                    { label: "📊 Risk/Reward", value: `${(analysis.stats.risk_reward || 0).toFixed(1)}x`, color: (analysis.stats.risk_reward || 0) >= 1 ? S.green : S.red },
                    { label: "📐 Profit Factor", value: `${(analysis.stats.profit_factor || 0).toFixed(1)}x`, color: (analysis.stats.profit_factor || 0) >= 1.5 ? S.green : S.yellow },
                    { label: "⏱️ Avg Hold", value: `${analysis.stats.avg_hold_days || 0}d`, color: S.blue },
                    { label: "📅 Trades/Mo", value: `${(analysis.stats.trades_per_month || 0).toFixed(1)}`, color: S.purple },
                    { label: "🟢 Green Months", value: `${analysis.stats.green_months || 0}/${analysis.stats.total_months || 0}`, color: S.green },
                  ].map((stat, i) => (
                    <div key={i} style={S.card}>
                      <div style={S.label}>{stat.label}</div>
                      <div style={{ fontSize: 24, fontWeight: "bold", ...S.mono, color: stat.color }}>{stat.value}</div>
                    </div>
                  ))}
                </div>
              )}

              {/* Strengths */}
              {analysis.insights?.filter(i => i.type === "strength").length > 0 && (
                <div style={{ ...S.card, marginBottom: 12, borderLeft: `3px solid ${S.green}` }}>
                  <div style={{ fontSize: 14, fontWeight: "bold", color: S.green, marginBottom: 14, fontFamily: S.font }}>💪 Strengths</div>
                  {analysis.insights.filter(i => i.type === "strength").map((item, i) => (
                    <div key={i} style={{ marginBottom: 14 }}>
                      <div style={{ fontWeight: "bold", fontSize: 13, color: S.text, marginBottom: 3, fontFamily: S.font }}>{item.title}</div>
                      <div style={{ fontSize: 12, color: S.muted, lineHeight: 1.6, fontFamily: S.font }}>{item.text}</div>
                    </div>
                  ))}
                </div>
              )}

              {/* Warnings */}
              {(analysis.warnings?.length || 0) > 0 && (
                <div style={{ ...S.card, marginBottom: 12, borderLeft: `3px solid ${S.red}` }}>
                  <div style={{ fontSize: 14, fontWeight: "bold", color: S.red, marginBottom: 14, fontFamily: S.font }}>⚠️ Warnings</div>
                  {analysis.warnings.map((item, i) => (
                    <div key={i} style={{ marginBottom: 14 }}>
                      <div style={{ fontWeight: "bold", fontSize: 13, color: S.text, marginBottom: 3, fontFamily: S.font }}>{item.title}</div>
                      <div style={{ fontSize: 12, color: S.muted, lineHeight: 1.6, fontFamily: S.font }}>{item.text}</div>
                    </div>
                  ))}
                </div>
              )}

              {/* Recommendations */}
              {(analysis.recommendations?.length || 0) > 0 && (
                <div style={{ ...S.card, marginBottom: 12, borderLeft: `3px solid ${S.blue}` }}>
                  <div style={{ fontSize: 14, fontWeight: "bold", color: S.blue, marginBottom: 14, fontFamily: S.font }}>💡 Recommendations</div>
                  {analysis.recommendations.map((item, i) => (
                    <div key={i} style={{ marginBottom: 14 }}>
                      <div style={{ fontWeight: "bold", fontSize: 13, color: S.text, marginBottom: 3, fontFamily: S.font }}>{item.title}</div>
                      <div style={{ fontSize: 12, color: S.muted, lineHeight: 1.6, fontFamily: S.font }}>{item.text}</div>
                    </div>
                  ))}
                </div>
              )}

              {/* Neutral Insights */}
              {analysis.insights?.filter(i => i.type === "neutral").length > 0 && (
                <div style={{ ...S.card, borderLeft: `3px solid ${S.dim}` }}>
                  <div style={{ fontSize: 14, fontWeight: "bold", color: S.muted, marginBottom: 14, fontFamily: S.font }}>📝 Additional Insights</div>
                  {analysis.insights.filter(i => i.type === "neutral").map((item, i) => (
                    <div key={i} style={{ marginBottom: 14 }}>
                      <div style={{ fontWeight: "bold", fontSize: 13, color: S.text, marginBottom: 3, fontFamily: S.font }}>{item.title}</div>
                      <div style={{ fontSize: 12, color: S.muted, lineHeight: 1.6, fontFamily: S.font }}>{item.text}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
