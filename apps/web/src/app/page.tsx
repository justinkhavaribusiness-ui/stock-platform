"use client";
import RobinhoodChart from "./RobinhoodChart";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell, AreaChart, Area, LineChart, Line, PieChart, Pie } from "recharts";

import AIChat from "./AIChat";
import CommandBar from "./CommandBar";
import PortfolioRisk from "./PortfolioRisk";
import OptionsFlow from "./OptionsFlow";
import EarningsIntel from "./EarningsIntel";
import SECFilings from "./SECFilings";
import EconCalendar from "./EconCalendar";
import CreditMacro from "./CreditMacro";
import AlertEngine from "./AlertEngine";
import ConferenceCalls from "./ConferenceCalls";
import WarMacro from "./WarMacro";
import MarginTracker from "./MarginTracker";
import PositionHealth from "./PositionHealth";
import CostBasis from "./CostBasis";
import OptionsChain from "./OptionsChain";
import GrowthTracker from "./GrowthTracker";
import CCIncome from "./CCIncome";
import GeoMonitor from "./GeoMonitor";
import FidelitySync from "./FidelitySync";
import EquityCurve from "./EquityCurve";
import DividendTracker from "./DividendTracker";
import TradeReplay from "./TradeReplay";
import PriceAlerts from "./PriceAlerts";
import CorrelationMatrix from "./CorrelationMatrix";
import EarningsPrep from "./EarningsPrep";
import MultiAccount from "./MultiAccount";
import MarketIntel from "./MarketIntel";
import NotifCenter from "./NotifCenter";
import TrumpMonitor from "./TrumpMonitor";
import PositionSizer from "./PositionSizer";
import SectorExposure from "./SectorExposure";
import Institutional from "./Institutional";
import SocialFeed from "./SocialFeed";
import SerenityDash from "./SerenityDash";

const FONTS_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,wght@0,400;0,500;0,600;0,700&family=JetBrains+Mono:wght@400;500;600&display=swap');
`;


const THEME = {
  // Backgrounds
  bg: "#ffffff",
  bgCard: "#ffffff",
  bgHover: "#f8f9fb",
  bgAlt: "#f4f5f7",
  bgAccent: "#f0f7ff",
  bgNav: "#ffffff",
  bgTicker: "#fafbfc",
  
  // Borders
  border: "#e8ecf0",
  borderLight: "#f0f2f5",
  borderAccent: "#d0e3ff",
  
  // Text
  text: "#1a1a2e",
  textSecondary: "#5a6070",
  textMuted: "#8b92a0",
  textLight: "#b0b7c3",
  
  // Data colors
  green: "#0d9f4f",
  greenBg: "#ecfdf3",
  red: "#dc2626",
  redBg: "#fef2f2",
  blue: "#2563eb",
  blueBg: "#eff6ff",
  yellow: "#d97706",
  yellowBg: "#fffbeb",
  orange: "#f7931a",
  
  // Accent
  accent: "#2563eb",
  accentLight: "#dbeafe",
  
  // Shadows
  shadow: "0 1px 3px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.06)",
  shadowMd: "0 4px 6px rgba(0,0,0,0.04), 0 2px 4px rgba(0,0,0,0.06)",
  shadowLg: "0 10px 15px rgba(0,0,0,0.04), 0 4px 6px rgba(0,0,0,0.06)",
  
  // Typography
  fontBody: "'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif",
  fontMono: "'JetBrains Mono', 'SF Mono', 'Menlo', monospace",
  
  // Sizes
  radius: 10,
  radiusSm: 6,
};



const GLOBAL_STYLES = `
  ${FONTS_CSS}
  * { box-sizing: border-box; }
  body { 
    background: #ffffff !important; 
    color: #1a1a2e !important;
    font-family: 'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif !important;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }
  ::-webkit-scrollbar { width: 6px; height: 6px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: #d0d5dd; border-radius: 3px; }
  ::-webkit-scrollbar-thumb:hover { background: #b0b7c3; }
  ::selection { background: #dbeafe; color: #1a1a2e; }
  input:focus, select:focus { border-color: #2563eb !important; box-shadow: 0 0 0 3px rgba(37,99,235,0.1) !important; }
`;
const card: React.CSSProperties = {
  background: THEME.bgCard,
  borderRadius: THEME.radius,
  padding: 20,
  marginBottom: 12,
  border: "1px solid " + THEME.border,
  boxShadow: THEME.shadow,
};

const cardCompact: React.CSSProperties = {
  ...card,
  padding: 14,
};

const label: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 600,
  color: THEME.textMuted,
  textTransform: "uppercase",
  letterSpacing: "0.06em",
  fontFamily: THEME.fontBody,
};

const inputStyle: React.CSSProperties = {
  background: THEME.bgAlt,
  border: "1px solid " + THEME.border,
  borderRadius: THEME.radiusSm,
  padding: "8px 12px",
  color: THEME.text,
  fontFamily: THEME.fontBody,
  fontSize: 13,
  outline: "none",
  transition: "border-color 0.15s",
};

const btnPrimary: React.CSSProperties = {
  background: THEME.accent,
  border: "none",
  borderRadius: THEME.radiusSm,
  padding: "8px 16px",
  color: "#ffffff",
  fontFamily: THEME.fontBody,
  fontSize: 13,
  fontWeight: 600,
  cursor: "pointer",
  transition: "all 0.15s",
};

const btnSecondary: React.CSSProperties = {
  background: THEME.bgAlt,
  border: "1px solid " + THEME.border,
  borderRadius: THEME.radiusSm,
  padding: "8px 16px",
  color: THEME.text,
  fontFamily: THEME.fontBody,
  fontSize: 13,
  fontWeight: 500,
  cursor: "pointer",
  transition: "all 0.15s",
};

import PhotonicsCenter from "./PhotonicsCenter";

import { useState, useEffect, useRef, useCallback, Fragment } from "react";
import OptionsJournal from "./OptionsJournal";

const BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001";

// ── Types ──────────────────────────────────────────────────────────────
type MacroItem  = { symbol: string; label: string; price: number | null; change: number | null; change_pct: number | null };
type NewsItem   = { title: string; source: string; link: string; published: string; summary?: string };
type AlertRule  = { id: string; ticker: string; condition: string; price: number; active: boolean };
type Triggered  = { ticker: string; condition: string; target: number; actual_price: number; fired_at: string };
type Portfolio  = { [ticker: string]: { shares: number; cost_basis: number } };
type OptionPos  = { ticker: string; type: string; strike: number; expiry: string; qty: number; cost_basis: number; side: string; last_price?: number; current_value?: number; pnl?: number; pnl_pct?: number };
type PortfolioFull = { holdings: Portfolio; cash: number; options: OptionPos[]; account: { number?: string; name?: string; type?: string } };
type Conviction = { id: string; trader: string; ticker: string; thesis: string; entry_target: number; price_target: number; status: string; notes?: string };
type Trade      = { id: string; ticker: string; side: string; entry_price: number; quantity: number; exit_price?: number; stop_loss?: number; take_profit?: number; notes: string; tags: string[]; status: string; opened_at: string; pnl?: number };
type AIAnalysis = { ticker: string; name?: string; sentiment?: string; score?: number; summary?: string; bull_case?: string[]; bear_case?: string[]; technicals?: string; catalysts?: string[]; risk_factors?: string[]; price_target?: { low: number; mid: number; high: number }; recommendation?: string; error?: string };

const fmt = (n: number | null | undefined, d = 2) => (n == null ? "—" : n.toLocaleString("en-US", { minimumFractionDigits: d, maximumFractionDigits: d }));
const pct = (n: number | null) => (n == null ? "" : `${n > 0 ? "+" : ""}${fmt(n)}%`);
const clr = (n: number | null | undefined, dark = true) => (n == null ? (dark ? "text-zinc-400" : "text-gray-500") : n > 0 ? "text-emerald-400" : n < 0 ? "text-red-400" : (dark ? "text-zinc-400" : "text-gray-500"));

const GAETANO_TICKERS = ["IESC","MYRG","NVT","AMPS","ITRI","ERII","POWI","VICR","RBBN","ENS","WIRE","AYI","VVNT","KLIC","OSIS","ESE","COHU","MKSI","AEIS"];
const PHOTONICS_UNIVERSE = ["AAOI","AEHR","ALMU","ANET","AXTI","CIEN","COHR","CRDO","FN","GFS","GLW","LWLG","MRVL","MTSI","NOK","POET","SMTC","TSEM","VIAV"];

// Serenity (@aleabitoreddit) — NeoCloud Thesis Positions
const SERENITY_POSITIONS: {ticker:string;name:string;bucket:string;pt?:string;timeframe?:string}[] = [
  {ticker:"NBIS",name:"Nebius Group",bucket:"Core NeoCloud",pt:"$400",timeframe:"1Y"},
  {ticker:"RKLB",name:"Rocket Lab",bucket:"Core NeoCloud",pt:"$500",timeframe:"5Y"},
  {ticker:"CRCL",name:"Circle (SPAC)",bucket:"Core NeoCloud",pt:"$150",timeframe:"8M"},
  {ticker:"ALAB",name:"Astera Labs",bucket:"Core NeoCloud",pt:"$250",timeframe:"6M"},
  {ticker:"CRWV",name:"CoreWeave",bucket:"Mag7 Contracts"},
  {ticker:"WULF",name:"TeraWulf",bucket:"Mag7 Contracts"},
  {ticker:"CIFR",name:"Cipher Mining",bucket:"Mag7 Contracts"},
  {ticker:"IREN",name:"Iren (Iris Energy)",bucket:"Compute"},
  {ticker:"BITF",name:"Bitfarms",bucket:"Compute"},
  {ticker:"HIMS",name:"Hims & Hers",bucket:"Swing Trade"},
  {ticker:"SNAP",name:"Snap Inc",bucket:"Swing Trade"},
  {ticker:"SMCI",name:"Super Micro",bucket:"Swing Trade"},
  {ticker:"GLXY",name:"Galaxy Digital",bucket:"Swing Trade"},
  {ticker:"XLU",name:"Utilities Select ETF",bucket:"Macro Thesis"},
];

function useFlash(value: number | null) {
  const prev = useRef<number | null>(null);
  const [flash, setFlash] = useState<"up"|"down"|null>(null);
  useEffect(() => {
    if (prev.current !== null && value !== null && value !== prev.current) {
      setFlash(value > prev.current ? "up" : "down");
      const t = setTimeout(() => setFlash(null), 800);
      return () => clearTimeout(t);
    }
    prev.current = value;
  }, [value]);
  return flash;
}

// ── Ticker Tape ────────────────────────────────────────────────────────
function TickerTape({ items, dark }: { items: MacroItem[]; dark: boolean }) {
  const filled = [...items, ...items, ...items];
  return (
    <div className={`overflow-hidden h-9 flex items-center select-none ticker-tape ${dark ? "ticker-tape-dark" : "ticker-tape-light"}`}>
      <div className="flex animate-ticker whitespace-nowrap">
        {filled.map((m, i) => (
          <span key={i} className="inline-flex items-center gap-2 px-4 text-sm font-mono">
            <span className={`font-semibold tracking-wide ${dark ? "text-slate-400" : "text-slate-600"}`}>{m.label}</span>
            <span className={`font-bold ${m.change_pct != null && m.change_pct > 0 ? "text-emerald-400" : m.change_pct != null && m.change_pct < 0 ? "text-red-400" : dark ? "text-slate-300" : "text-slate-700"}`}>
              {m.price != null ? fmt(m.price) : "—"}
            </span>
            {m.change_pct != null && <span className={`text-xs font-semibold ${clr(m.change_pct)}`}>{pct(m.change_pct)}</span>}
            <span className={`mx-1 ${dark ? "text-slate-800" : "text-slate-300"}`}>|</span>
          </span>
        ))}
      </div>
    </div>
  );
}

function MacroCard({ item, onClick, dark }: { item: MacroItem; onClick?: () => void; dark: boolean }) {
  const flash = useFlash(item.price);
  return (
    <div onClick={onClick} className={`p-3 border rounded-lg transition-all duration-700 cursor-pointer ${
      flash === "up" ? "bg-emerald-950/50 border-emerald-700 shadow-lg shadow-emerald-950/30" :
      flash === "down" ? "bg-red-950/50 border-red-800 shadow-lg shadow-red-950/30" :
      dark ? "bg-zinc-900/50 border-zinc-800/50 hover:border-zinc-600" : "bg-white border-gray-200 hover:border-gray-400 shadow-sm"
    }`}>
      <div className={`text-xs uppercase tracking-wider mb-1 truncate ${dark ? "text-zinc-500" : "text-gray-500"}`}>{item.label}</div>
      <div className={`text-base font-mono font-bold ${dark ? "text-zinc-100" : "text-gray-900"}`}>{item.price != null ? fmt(item.price) : "—"}</div>
      <div className={`text-xs font-mono ${clr(item.change_pct)}`}>{pct(item.change_pct)}</div>
    </div>
  );
}

const sentimentColor = (s?: string) => {
  if (s === "bullish") return "text-emerald-400 border-emerald-600 bg-emerald-950/30";
  if (s === "bearish") return "text-red-400 border-red-600 bg-red-950/30";
  return "text-amber-400 border-amber-600 bg-amber-950/30";
};

const scoreColor = (s?: number) => {
  if (!s) return "text-zinc-400";
  if (s >= 8) return "text-emerald-400";
  if (s >= 6) return "text-green-400";
  if (s >= 4) return "text-amber-400";
  return "text-red-400";
};

const catColor = (cat: string) => {
  if (cat === "FED") return "text-violet-400 border-violet-700";
  if (cat === "EARNINGS") return "text-emerald-400 border-emerald-700";
  if (cat === "MACRO DATA") return "text-blue-400 border-blue-700";
  return "text-amber-400 border-amber-700";
};

// ── Chart Canvas ───────────────────────────────────────────────────────
function ChartCanvas({ data, overlays }: { data: any[]; overlays: { sma20: boolean; sma50: boolean; ema12: boolean; ema26: boolean } }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [tooltip, setTooltip] = useState<any>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container || !data.length) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const W = container.clientWidth;
    const mainH = 300, volH = 60, rsiH = 80, macdH = 80, gap = 10;
    const totalH = mainH + volH + rsiH + macdH + gap * 3;
    canvas.width = W; canvas.height = totalH;
    const pad = { left: 60, right: 20, top: 10, bottom: 5 };
    const chartW = W - pad.left - pad.right;
    const barW = Math.max(2, Math.floor(chartW / data.length) - 1);
    ctx.fillStyle = "#09090b"; ctx.fillRect(0, 0, W, totalH);
    const priceMax = Math.max(...data.map(d => d.high));
    const priceMin = Math.min(...data.map(d => d.low));
    const priceRange = priceMax - priceMin || 1;
    const toY = (price: number) => pad.top + mainH - ((price - priceMin) / priceRange) * (mainH - 20);
    ctx.strokeStyle = "#27272a"; ctx.lineWidth = 0.5;
    for (let i = 0; i <= 4; i++) {
      const y = pad.top + (mainH / 4) * i;
      ctx.beginPath(); ctx.moveTo(pad.left, y); ctx.lineTo(W - pad.right, y); ctx.stroke();
      const price = priceMax - (priceRange / 4) * i;
      ctx.fillStyle = "#52525b"; ctx.font = "10px monospace"; ctx.textAlign = "right";
      ctx.fillText(`$${price.toFixed(2)}`, pad.left - 5, y + 3);
    }
    data.forEach((d, i) => {
      const x = pad.left + i * (barW + 1);
      const bullish = d.close >= d.open;
      ctx.strokeStyle = bullish ? "#34d399" : "#f87171"; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(x + barW / 2, toY(d.high)); ctx.lineTo(x + barW / 2, toY(d.low)); ctx.stroke();
      ctx.fillStyle = bullish ? "#34d399" : "#f87171";
      const bodyTop = Math.min(toY(d.open), toY(d.close));
      ctx.fillRect(x, bodyTop, barW, Math.max(Math.abs(toY(d.close) - toY(d.open)), 1));
    });
    const drawLine = (key: string, color: string) => {
      ctx.strokeStyle = color; ctx.lineWidth = 1.5; ctx.beginPath();
      let started = false;
      data.forEach((d, i) => {
        if (d[key] == null) return;
        const x = pad.left + i * (barW + 1) + barW / 2;
        if (!started) { ctx.moveTo(x, toY(d[key])); started = true; } else ctx.lineTo(x, toY(d[key]));
      });
      ctx.stroke();
    };
    if (overlays.sma20) drawLine("sma20", "#f59e0b");
    if (overlays.sma50) drawLine("sma50", "#8b5cf6");
    if (overlays.ema12) drawLine("ema12", "#06b6d4");
    if (overlays.ema26) drawLine("ema26", "#ec4899");
    const volTop = mainH + gap;
    const maxVol = Math.max(...data.map(d => d.volume || 0)) || 1;
    data.forEach((d, i) => {
      const x = pad.left + i * (barW + 1);
      const h = (d.volume / maxVol) * volH * 0.9;
      ctx.fillStyle = d.close >= d.open ? "#34d39940" : "#f8717140";
      ctx.fillRect(x, volTop + volH - h, barW, h);
    });
    ctx.fillStyle = "#3f3f46"; ctx.font = "9px monospace"; ctx.textAlign = "left";
    ctx.fillText("VOL", pad.left, volTop + 10);
    const rsiTop = volTop + volH + gap;
    ctx.strokeStyle = "#a78bfa"; ctx.lineWidth = 1.5; ctx.beginPath();
    let rsiS = false;
    data.forEach((d, i) => {
      if (d.rsi == null) return;
      const x = pad.left + i * (barW + 1) + barW / 2;
      const y = rsiTop + rsiH - (d.rsi / 100) * rsiH;
      if (!rsiS) { ctx.moveTo(x, y); rsiS = true; } else ctx.lineTo(x, y);
    });
    ctx.stroke();
    [30, 50, 70].forEach(v => {
      const y = rsiTop + rsiH - (v / 100) * rsiH;
      ctx.strokeStyle = "#52525b40"; ctx.lineWidth = 0.5;
      ctx.beginPath(); ctx.moveTo(pad.left, y); ctx.lineTo(W - pad.right, y); ctx.stroke();
    });
    ctx.fillStyle = "#3f3f46"; ctx.font = "9px monospace"; ctx.fillText("RSI", pad.left, rsiTop + 10);
    const macdTop = rsiTop + rsiH + gap;
    const macdVals = data.filter(d => d.macd != null).map(d => Math.abs(d.macd));
    const histVals = data.filter(d => d.macdHist != null).map(d => Math.abs(d.macdHist));
    const macdMax = Math.max(...macdVals, ...histVals, 0.01);
    data.forEach((d, i) => {
      if (d.macdHist == null) return;
      const x = pad.left + i * (barW + 1);
      const h = Math.abs(d.macdHist / macdMax) * (macdH / 2 - 5);
      ctx.fillStyle = d.macdHist >= 0 ? "#34d39960" : "#f8717160";
      ctx.fillRect(x, d.macdHist >= 0 ? macdTop + macdH / 2 - h : macdTop + macdH / 2, barW, h);
    });
    ctx.fillStyle = "#3f3f46"; ctx.font = "9px monospace"; ctx.fillText("MACD", pad.left, macdTop + 10);
    const step = Math.max(1, Math.floor(data.length / 8));
    ctx.fillStyle = "#52525b"; ctx.font = "9px monospace"; ctx.textAlign = "center";
    data.forEach((d, i) => { if (i % step === 0) ctx.fillText(d.date.slice(5), pad.left + i * (barW + 1) + barW / 2, totalH - 2); });
  }, [data, overlays]);

  const handleMouseMove = (e: React.MouseEvent) => {
    const canvas = e.currentTarget as HTMLCanvasElement;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const pad = { left: 60, right: 20, top: 20 };
    const barW = Math.max(2, Math.min(12, (rect.width - pad.left - pad.right) / (data?.length || 1) - 1));
    const idx = Math.floor((x - pad.left) / (barW + 1));
    const tip = document.getElementById("chart-crosshair-tip");
    if (idx >= 0 && idx < (data?.length || 0) && tip) {
      const d = data[idx];
      const chgPct = ((d.close - d.open) / d.open * 100).toFixed(2);
      const clr = d.close >= d.open ? "#34d399" : "#f87171";
      tip.style.display = "block";
      tip.style.left = Math.min(x + 15, rect.width - 220) + "px";
      tip.style.top = "20px";
      tip.innerHTML = `<div style="font-size:11px;font-family:'JetBrains Mono',monospace;line-height:1.7">` +
        `<div style="color:#a1a1aa;font-weight:600;margin-bottom:4px">${d.date}</div>` +
        `<div>Open <span style="color:${clr};float:right;font-weight:600">${d.open?.toFixed(2)}</span></div>` +
        `<div>High <span style="color:${clr};float:right;font-weight:600">${d.high?.toFixed(2)}</span></div>` +
        `<div>Low  <span style="color:${clr};float:right;font-weight:600">${d.low?.toFixed(2)}</span></div>` +
        `<div>Close <span style="color:${clr};float:right;font-weight:700">${d.close?.toFixed(2)}</span></div>` +
        `<div style="border-top:1px solid #3f3f46;margin-top:4px;padding-top:4px;color:${clr}">` +
        `${parseFloat(chgPct) >= 0 ? "▲ +" : "▼ "}${chgPct}%</div>` +
        `<div style="color:#71717a">Vol: ${((d.volume||0)/1e6).toFixed(1)}M</div>` +
        (d.rsi != null ? `<div style="color:#a78bfa">RSI: ${d.rsi?.toFixed(1)}</div>` : "") +
        `</div>`;
    } else if (tip) { tip.style.display = "none"; }
  };

  return (
    <div ref={containerRef} className="relative" onMouseLeave={() => setTooltip(null)}>
                <canvas ref={canvasRef} onMouseMove={handleMouseMove} className="w-full cursor-crosshair" />
      {tooltip && (
        <div className="absolute pointer-events-none bg-zinc-900/95 border border-zinc-700 rounded px-3 py-2 text-xs font-mono z-50 shadow-xl backdrop-blur-sm" style={{ left: Math.min(tooltip.x + 15, (containerRef.current?.clientWidth || 500) - 200), top: tooltip.y + 15 }}>
          <div className="text-zinc-400 mb-1">{tooltip.d.date}</div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-0.5">
            <span className="text-zinc-500">O</span><span className="text-zinc-200">${fmt(tooltip.d.open)}</span>
            <span className="text-zinc-500">H</span><span className="text-zinc-200">${fmt(tooltip.d.high)}</span>
            <span className="text-zinc-500">L</span><span className="text-zinc-200">${fmt(tooltip.d.low)}</span>
            <span className="text-zinc-500">C</span><span className={clr(tooltip.d.close - tooltip.d.open)}>${fmt(tooltip.d.close)}</span>
            <span className="text-zinc-500">Vol</span><span className="text-zinc-200">{(tooltip.d.volume / 1e6).toFixed(1)}M</span>
            {tooltip.d.rsi != null && <><span className="text-zinc-500">RSI</span><span className={tooltip.d.rsi > 70 ? "text-red-400" : tooltip.d.rsi < 30 ? "text-emerald-400" : "text-zinc-200"}>{fmt(tooltip.d.rsi, 1)}</span></>}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main ───────────────────────────────────────────────────────────────


function CryptoPanel() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState("");
  const [selectedCoin, setSelectedCoin] = useState<any>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [customSymbols, setCustomSymbols] = useState("");

  const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001";

  const fetchPrices = (syms?: string) => {
    setLoading(true);
    const url = syms ? `${API_BASE}/photonics/crypto/prices?symbols=${syms}` : `${API_BASE}/photonics/crypto/prices`;
    fetch(url).then(r => r.json()).then(d => {
      setData(d);
      setLastRefresh(new Date().toLocaleTimeString());
      setLoading(false);
    }).catch(() => setLoading(false));
  };

  useEffect(() => {
    fetchPrices();
    if (autoRefresh) {
      const iv = setInterval(() => fetchPrices(), 15000);
      return () => clearInterval(iv);
    }
  }, [autoRefresh]);

  const fmt = (n: number) => {
    if (!n && n !== 0) return "—";
    if (n >= 1e12) return "$" + (n/1e12).toFixed(2) + "T";
    if (n >= 1e9) return "$" + (n/1e9).toFixed(2) + "B";
    if (n >= 1e6) return "$" + (n/1e6).toFixed(1) + "M";
    return "$" + n.toLocaleString();
  };

  const fmtP = (p: number) => {
    if (!p && p !== 0) return "—";
    if (p >= 1000) return "$" + p.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2});
    if (p >= 1) return "$" + p.toFixed(2);
    if (p >= 0.001) return "$" + p.toFixed(4);
    return "$" + p.toFixed(8);
  };

  const fmtV = (v: number) => {
    if (!v) return "—";
    if (v >= 1e9) return (v/1e9).toFixed(1) + "B";
    if (v >= 1e6) return (v/1e6).toFixed(1) + "M";
    return (v/1e3).toFixed(0) + "K";
  };

  const S = {
    card: { background: "#ffffff", borderRadius: 6, padding: 16, marginBottom: 8, border: "1px solid #e8ecf0" } as React.CSSProperties,
    green: "#22c55e", red: "#ef4444", yellow: "#f59e0b", blue: "#3b82f6",
    dim: "#6b7280", text: "#e5e7eb", muted: "#4b5563",
    input: { background: "#ffffff", border: "1px solid #e8ecf0", borderRadius: 4, padding: "6px 10px", color: "#1a1a2e", fontFamily: "monospace", fontSize: 12, outline: "none" } as React.CSSProperties,
    btn: { background: "#2563eb", border: "none", borderRadius: 4, padding: "6px 14px", color: "#ffffff", fontFamily: "monospace", fontSize: 12, cursor: "pointer", fontWeight: "bold" } as React.CSSProperties,
  };

  return (
    <div style={{ padding: "12px 20px", background: "#ffffff", minHeight: "calc(100vh - 80px)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <span style={{ color: "#f7931a", fontWeight: "bold", fontSize: 18, fontFamily: "monospace" }}>CRYPTO LIVE</span>
          {data && (
            <span style={{ color: S.dim, fontSize: 12, fontFamily: "monospace" }}>
              Total MCap: {fmt(data.total_market_cap)} | BTC Dom: {data.btc_dominance}%
            </span>
          )}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ color: S.dim, fontSize: 10, fontFamily: "monospace" }}>{lastRefresh}</span>
          <button onClick={() => setAutoRefresh(!autoRefresh)} style={{ ...S.btn, background: autoRefresh ? "#1a3320" : "#21262d", fontSize: 10, padding: "4px 10px" }}>
            {autoRefresh ? "\u25CF LIVE 15s" : "\u25CB PAUSED"}
          </button>
          <button onClick={() => fetchPrices()} style={{ ...S.btn, fontSize: 10, padding: "4px 10px", background: "transparent" }}>\u21BB</button>
        </div>
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
        <input style={{ ...S.input, flex: 1 }} placeholder="Add symbols: BTC,ETH,SOL,HYPE..." value={customSymbols} onChange={e => setCustomSymbols(e.target.value)} onKeyDown={e => { if (e.key === "Enter") fetchPrices(customSymbols || undefined); }} />
        <button style={S.btn} onClick={() => fetchPrices(customSymbols || undefined)}>FETCH</button>
      </div>

      {data?.gainers && (
        <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
          <div style={{ ...S.card, flex: 1, padding: "10px 14px" }}>
            <div style={{ color: S.green, fontSize: 10, fontWeight: "bold", fontFamily: "monospace", marginBottom: 6 }}>TOP GAINERS 24H</div>
            {data.gainers.map((c: any) => (
              <div key={c.symbol} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, fontFamily: "monospace", padding: "3px 0" }}>
                <span style={{ color: "#f7931a", fontWeight: "bold" }}>{c.symbol}</span>
                <span>
                  <span style={{ color: S.text, marginRight: 12 }}>{fmtP(c.price)}</span>
                  <span style={{ color: S.green, fontWeight: "bold" }}>+{c.change_pct}%</span>
                </span>
              </div>
            ))}
          </div>
          <div style={{ ...S.card, flex: 1, padding: "10px 14px" }}>
            <div style={{ color: S.red, fontSize: 10, fontWeight: "bold", fontFamily: "monospace", marginBottom: 6 }}>TOP LOSERS 24H</div>
            {data.losers.map((c: any) => (
              <div key={c.symbol} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, fontFamily: "monospace", padding: "3px 0" }}>
                <span style={{ color: "#f7931a", fontWeight: "bold" }}>{c.symbol}</span>
                <span>
                  <span style={{ color: S.text, marginRight: 12 }}>{fmtP(c.price)}</span>
                  <span style={{ color: S.red, fontWeight: "bold" }}>{c.change_pct}%</span>
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={S.card}>
        {loading && !data ? (
          <div style={{ textAlign: "center", color: S.muted, padding: 40, fontFamily: "monospace" }}>Loading crypto prices...</div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12, fontFamily: "monospace" }}>
            <thead>
              <tr style={{ borderBottom: "2px solid #e8ecf0" }}>
                {["#", "Coin", "Price", "24h %", "24h High", "24h Low", "Volume", "Market Cap", "52w High", "From ATH"].map(h => (
                  <th key={h} style={{ color: S.dim, fontWeight: "normal", padding: "10px 8px", textAlign: h === "Coin" ? "left" : "right", fontSize: 10, textTransform: "uppercase" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data?.coins?.filter((c: any) => c.status === "ok").map((c: any, i: number) => (
                <tr key={c.symbol} onClick={() => setSelectedCoin(selectedCoin?.symbol === c.symbol ? null : c)} style={{ borderBottom: "1px solid #f0f2f5", cursor: "pointer", transition: "background 0.1s" }} onMouseEnter={e => (e.currentTarget.style.background = "#161b22")} onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                  <td style={{ padding: "10px 8px", color: S.dim, textAlign: "right" }}>{i + 1}</td>
                  <td style={{ padding: "10px 8px", textAlign: "left" }}>
                    <span style={{ color: "#f7931a", fontWeight: "bold", fontSize: 14 }}>{c.symbol}</span>
                  </td>
                  <td style={{ padding: "10px 8px", color: S.text, fontWeight: "bold", textAlign: "right", fontSize: 14 }}>{fmtP(c.price)}</td>
                  <td style={{ padding: "10px 8px", textAlign: "right" }}>
                    <span style={{ color: c.change_pct >= 0 ? S.green : S.red, fontWeight: "bold", padding: "2px 6px", background: (c.change_pct >= 0 ? S.green : S.red) + "15", borderRadius: 3 }}>
                      {c.change_pct >= 0 ? "+" : ""}{c.change_pct}%
                    </span>
                  </td>
                  <td style={{ padding: "10px 8px", color: S.dim, textAlign: "right" }}>{fmtP(c.high_24h)}</td>
                  <td style={{ padding: "10px 8px", color: S.dim, textAlign: "right" }}>{fmtP(c.low_24h)}</td>
                  <td style={{ padding: "10px 8px", color: S.text, textAlign: "right" }}>{fmtV(c.volume)}</td>
                  <td style={{ padding: "10px 8px", color: S.text, textAlign: "right" }}>{fmt(c.market_cap)}</td>
                  <td style={{ padding: "10px 8px", color: S.dim, textAlign: "right" }}>{fmtP(c.high_52w)}</td>
                  <td style={{ padding: "10px 8px", textAlign: "right" }}>
                    <span style={{ color: (c.pct_from_ath || 0) > -10 ? S.green : (c.pct_from_ath || 0) > -30 ? S.yellow : S.red }}>
                      {c.pct_from_ath != null ? c.pct_from_ath + "%" : "—"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {selectedCoin && (
        <div style={{ ...S.card, borderLeft: "3px solid #f7931a" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <span style={{ color: "#f7931a", fontWeight: "bold", fontSize: 20, fontFamily: "monospace" }}>{selectedCoin.symbol}</span>
            <span style={{ color: S.text, fontWeight: "bold", fontSize: 20, fontFamily: "monospace" }}>{fmtP(selectedCoin.price)}</span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
            {[
              ["24h Change", selectedCoin.change_pct >= 0 ? "+" + selectedCoin.change_pct + "%" : selectedCoin.change_pct + "%", selectedCoin.change_pct >= 0 ? S.green : S.red],
              ["24h Volume", fmtV(selectedCoin.volume), S.text],
              ["Market Cap", fmt(selectedCoin.market_cap), S.text],
              ["From 52w High", selectedCoin.pct_from_ath + "%", S.red],
              ["24h High", fmtP(selectedCoin.high_24h), S.text],
              ["24h Low", fmtP(selectedCoin.low_24h), S.text],
              ["52w High", fmtP(selectedCoin.high_52w), S.text],
              ["52w Low", fmtP(selectedCoin.low_52w), S.text],
            ].map(([label, val, color]) => (
              <div key={String(label)}>
                <div style={{ color: S.dim, fontSize: 10, fontFamily: "monospace", marginBottom: 2 }}>{label}</div>
                <div style={{ color: String(color), fontWeight: "bold", fontSize: 14, fontFamily: "monospace" }}>{val}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}function PersonalHeader({ dark }: { dark?: boolean }) {
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const dateStr = new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
  const dayOfWeek = new Date().getDay();
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
  const isOpen = !isWeekend && hour >= 9 && hour < 16;
  const statusLabel = isWeekend ? "Closed" : hour >= 4 && hour < 9.5 ? "Pre-Market" : isOpen ? "Market Open" : hour >= 16 && hour < 20 ? "After Hours" : "Closed";
  const statusColor = isOpen ? "#22c55e" : !isWeekend && (hour >= 4 && hour < 9.5 || hour >= 16 && hour < 20) ? "#eab308" : "#71717a";

  return (
    <div className="flex items-center justify-between mb-1">
      <div>
        <h1 className={`text-xl font-semibold tracking-tight ${dark ? "text-zinc-100" : "text-zinc-900"}`}>{greeting}, Justin</h1>
        <div className="flex items-center gap-3 mt-0.5">
          <span className={`text-xs ${dark ? "text-zinc-500" : "text-zinc-400"}`}>{dateStr}</span>
          <span className="text-xs font-medium flex items-center gap-1.5" style={{ color: statusColor }}>
            <span style={{ width: 5, height: 5, borderRadius: "50%", background: statusColor, boxShadow: isOpen ? "0 0 6px " + statusColor : "none" }} />
            {statusLabel}
          </span>
        </div>
      </div>
    </div>
  );
  const [quote, setQuote] = useState<any>(null);
  const [flash, setFlash] = useState("");
  const [ext, setExt] = useState<any>(null);
  const [live, setLive] = useState(true);
  const prevRef = useRef<number>(0);

  useEffect(() => {
    if (!ticker || !live) return;
    let cancelled = false;
    const fetchQ = () => {
      fetch(`${BASE}/quotes?tickers=${ticker}`)
        .then(r => r.json())
        .then(d => {
          if (cancelled || !d?.[0]) return;
          const q = d[0];
          if (prevRef.current && prevRef.current !== q.price) {
            setFlash(q.price > prevRef.current ? "g" : "r");
            setTimeout(() => setFlash(""), 700);
          }
          prevRef.current = q.price;
          setQuote(q);
        }).catch(() => {});
    };
    const fetchE = () => {
      fetch(`${BASE}/photonics/premarket/${ticker}`)
        .then(r => { if (!r.ok) throw new Error("not found"); return r.json(); })
        .then(d => { if (!cancelled) setExt(d); }).catch(() => {});
    };
    fetchQ(); fetchE();
    const iv1 = setInterval(fetchQ, 5000);
    const iv2 = setInterval(fetchE, 30000);
    return () => { cancelled = true; clearInterval(iv1); clearInterval(iv2); };
  }, [ticker, live, BASE]);

  useEffect(() => { prevRef.current = 0; setQuote(null); setExt(null); }, [ticker]);

  if (!ticker) return null;
  const chg = quote?.changePercent ?? quote?.change_pct ?? 0;
  const up = chg >= 0;
  const cardCls = dark ? "bg-zinc-900/80 border-zinc-800" : "bg-white border-gray-200 shadow-sm";
  const txtCls = dark ? "text-zinc-100" : "text-zinc-900";
  const dimCls = dark ? "text-zinc-500" : "text-gray-400";

  return (
    <div className={`flex items-center justify-between p-3 rounded-lg border mb-3 ${cardCls}`}>
      <div className="flex items-center gap-3 flex-wrap">
        <span className="text-amber-400 font-bold text-lg tracking-tight">{ticker}</span>
        {quote ? (
          <>
            <span className={`font-bold text-xl font-mono transition-all duration-500 ${flash === "g" ? "text-emerald-400" : flash === "r" ? "text-red-400" : txtCls}`}
              style={flash ? {textShadow: flash === "g" ? "0 0 16px rgba(52,211,153,0.6)" : "0 0 16px rgba(248,113,113,0.6)"} : undefined}>
              ${quote.price?.toFixed(2)}
            </span>
            <span className={`text-sm font-bold font-mono px-1.5 py-0.5 rounded ${up ? "text-emerald-400 bg-emerald-500/10" : "text-red-400 bg-red-500/10"}`}>
              {up ? "▲" : "▼"} {up ? "+" : ""}{chg.toFixed(2)}%
            </span>
            <span className={`text-[10px] font-mono ${dimCls} hidden sm:inline`}>
              H ${quote.dayHigh?.toFixed(2) ?? "—"} · L ${quote.dayLow?.toFixed(2) ?? "—"} · V {((quote.volume ?? 0)/1e6).toFixed(1)}M
            </span>
          </>
        ) : (
          <span className={`text-sm font-mono animate-pulse ${dimCls}`}>Loading...</span>
        )}
        {ext?.ext_price != null && (
          <span className={`text-[10px] px-2 py-0.5 rounded border font-mono ${dark ? "border-zinc-700 bg-zinc-800/50" : "border-gray-200 bg-gray-50"}`}>
            <span className={ext.session === "premarket" ? "text-amber-400 font-bold" : ext.session === "afterhours" ? "text-purple-400 font-bold" : dimCls}>
              {ext.session === "premarket" ? "PRE" : ext.session === "afterhours" ? "AH" : "EXT"}
            </span>
            {" "}<span className={txtCls}>${ext.ext_price?.toFixed(2)}</span>
            {" "}<span className={(ext.ext_change_pct ?? 0) >= 0 ? "text-emerald-400" : "text-red-400"}>
              {(ext.ext_change_pct ?? 0) >= 0 ? "+" : ""}{ext.ext_change_pct?.toFixed(2)}%
            </span>
          </span>
        )}
      </div>
      <button onClick={() => setLive(l => !l)} className={`text-[10px] px-2.5 py-1 rounded border font-mono transition-all ${live ? (dark ? "border-emerald-700 text-emerald-400 bg-emerald-950/40" : "border-green-300 text-green-600 bg-green-50") : (dark ? "border-zinc-700 text-zinc-500" : "border-gray-300 text-gray-400")}`}>
        {live ? "● LIVE 5s" : "○ PAUSED"}
      </button>
    </div>
  );
}export default function Page() {
  const [dark, setDark] = useState(true);
  const [cmdOpen, setCmdOpen] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  // Toast notifications
  const [toasts, setToasts] = useState<{id:string; message:string; type:"success"|"error"|"info"; ts:number}[]>([]);
  const addToast = useCallback((message: string, type: "success"|"error"|"info" = "info") => {
    const id = Math.random().toString(36).slice(2, 8);
    setToasts(prev => [...prev, {id, message, type, ts: Date.now()}]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
  }, []);
  // AI Features
  const [morningBriefing, setMorningBriefing] = useState<any>(null);
  const [briefingLoading, setBriefingLoading] = useState(false);
  const [regime, setRegime] = useState<any>(null);
  const [goals, setGoals] = useState<any[]>([]);
  const [showGoalForm, setShowGoalForm] = useState(false);
  const [goalForm, setGoalForm] = useState({ name: "", target_amount: "", type: "portfolio_value" });
  const [tab, setTab] = useState("dashboard");
  // Loading screen
  const [appReady, setAppReady] = useState(false);
  const [loadProgress, setLoadProgress] = useState(0);
  const [loadPhase, setLoadPhase] = useState("INITIALIZING SYSTEMS");
  const [bootFading, setBootFading] = useState(false);
  // Nav
  const [activeCategory, setActiveCategory] = useState("Dashboard");
  const [macro, setMacro] = useState<MacroItem[]>([]);
  const [news, setNews] = useState<NewsItem[]>([]);
  const [newsAlerts, setNewsAlerts] = useState<any[]>([]);
  const [breaking, setBreaking] = useState<any[]>([]);
  // News Intelligence Dashboard state
  const [newsIntel, setNewsIntel] = useState<any>(null);
  const [newsIntelLoading, setNewsIntelLoading] = useState(false);
  const [newsSubTab, setNewsSubTab] = useState<"all"|"market"|"earnings"|"crypto"|"tech"|"watchlist">("all");
  const [newsTopicFilter, setNewsTopicFilter] = useState("");
  const [newsSectorFilter, setNewsSectorFilter] = useState("");
  const [newsBookmarks, setNewsBookmarks] = useState<Set<string>>(new Set());
  const [watchlistNews, setWatchlistNews] = useState<any>(null);
  const [watchlistNewsLoading, setWatchlistNewsLoading] = useState(false);
  const [newsExpanded, setNewsExpanded] = useState<string|null>(null);
  const [newsSearchQuery, setNewsSearchQuery] = useState("");
  // Holding deep-dive state
  const [expandedHolding, setExpandedHolding] = useState<string|null>(null);
  const [holdingDeepDive, setHoldingDeepDive] = useState<any>(null);
  const [holdingDiveLoading, setHoldingDiveLoading] = useState(false);
  // Sector breakdown state
  const [sectorBreakdown, setSectorBreakdown] = useState<any>(null);
  // Institutional Analytics state
  const [marketPulse, setMarketPulse] = useState<any>(null);
  const [marketPulseLoading, setMarketPulseLoading] = useState(false);
  const [riskAnalytics, setRiskAnalytics] = useState<any>(null);
  const [riskAnalyticsLoading, setRiskAnalyticsLoading] = useState(false);
  const [stressScenarios, setStressScenarios] = useState<any>(null);
  const [stressScenariosLoading, setStressScenariosLoading] = useState(false);
  const [stressExpanded, setStressExpanded] = useState<string|null>(null);
  const [calendar, setCalendar] = useState<any[]>([]);
  const [watchlist, setWatchlist] = useState<string[]>([]);
  const [wlPrices, setWlPrices] = useState<{[t:string]:number|null}>({});
  const [namedWatchlists, setNamedWatchlists] = useState<string[]>([]);
  const [activeWatchlist, setActiveWatchlist] = useState<string>("");
  const [newWlName, setNewWlName] = useState("");
  const [showNewWl, setShowNewWl] = useState(false);
  const [dragIdx, setDragIdx] = useState<number|null>(null);
  const [alerts, setAlerts] = useState<AlertRule[]>([]);
  const [triggered, setTriggered] = useState<Triggered[]>([]);
  const [portfolio, setPortfolio] = useState<Portfolio>({});
  const [portfolioCash, setPortfolioCash] = useState(0);
  const [portfolioOptions, setPortfolioOptions] = useState<OptionPos[]>([]);
  const [portfolioAccount, setPortfolioAccount] = useState<{ number?: string; name?: string; type?: string }>({});
  const [portView, setPortView] = useState<"table"|"heatmap"|"options"|"sectors"|"performance"|"risk"|"fidelity">("fidelity");
  const [portSectors, setPortSectors] = useState<any>(null);
  const [dailyPnl, setDailyPnl] = useState<any[]>([]);
  const [portHistory, setPortHistory] = useState<any[]>([]);
  const [ivStats, setIvStats] = useState<{[ticker:string]:any}>({});
  // Fidelity Positions
  const [fidelityPositions, setFidelityPositions] = useState<any[]>([]);
  const [fidelitySummary, setFidelitySummary] = useState<any>(null);
  const [fidelityLoading, setFidelityLoading] = useState(false);
  const [fidelityAccount, setFidelityAccount] = useState("all");
  const [fidelitySort, setFidelitySort] = useState("current_value");
  const [fidelitySortDir, setFidelitySortDir] = useState("desc");
  const [fidelityFreshness, setFidelityFreshness] = useState<any>(null);
  const [convictions, setConvictions] = useState<Conviction[]>([]);
  const [keywords, setKeywords] = useState<string[]>([]);
  const [quotes, setQuotes] = useState<{[t:string]:number|null}>({});
  const [tickerInput, setTickerInput] = useState("AAPL,MSFT,NVDA");
  const [lastUpdated, setLastUpdated] = useState("");
  const [convFilter, setConvFilter] = useState("all");
  const [showConvForm, setShowConvForm] = useState(false);
  // Charts
  const [chartTicker, setChartTicker] = useState("");
  const [chartPeriod, setChartPeriod] = useState("3m");
  const [chartData, setChartData] = useState<any[]>([]);
  const [chartLoading, setChartLoading] = useState(false);
  const [chartPrice, setChartPrice] = useState<number | null>(null);
  const [overlays, setOverlays] = useState({ sma20: true, sma50: false, ema12: false, ema26: false });
  // AI
  const [aiSubTab, setAiSubTab] = useState<"analysis"|"chat">("analysis");
  const [aiTicker, setAiTicker] = useState("");
  const [aiResult, setAiResult] = useState<AIAnalysis | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  // Journal
  const [trades, setTrades] = useState<Trade[]>([]);
  const [tradeStats, setTradeStats] = useState<any>({});
  const [showTradeForm, setShowTradeForm] = useState(false);
  const [tradeForm, setTradeForm] = useState({ ticker:"", side:"long", entry_price:"", quantity:"", stop_loss:"", take_profit:"", notes:"" });
  // Earnings
  const [earnings, setEarnings] = useState<any[]>([]);
  // Feeds
  const [feedEntries, setFeedEntries] = useState<any[]>([]);
  const [feedLoading, setFeedLoading] = useState(false);
  const [feedTrending, setFeedTrending] = useState<any[]>([]);
  const [feedFilter, setFeedFilter] = useState("");
  const [feedTickerFilter, setFeedTickerFilter] = useState("");
  const [stwits, setStwits] = useState<any>(null);
  const [stwitsLoading, setStwitsLoading] = useState(false);
  const [stwitsTicker, setStwitsTicker] = useState("");
  // Social Feed
  const [socialFeed, setSocialFeed] = useState<any>(null);
  const [socialLoading, setSocialLoading] = useState(false);
  const [socialTickers, setSocialTickers] = useState("SPY,QQQ,NVDA,AAPL,TSLA");
  // Community Hub (Discord + Twitter)
  const [socialSubTab, setSocialSubTab] = useState<"discord"|"twitter"|"substack"|"serenity"|"signals">("discord");
  const [serenityPrices, setSerenityPrices] = useState<Record<string,{price:number;change:number;changePct:number}>>({});
  const [serenityLoading, setSerenityLoading] = useState(false);
  const [discordPresence, setDiscordPresence] = useState<any>(null);
  const [discordPresenceLoading, setDiscordPresenceLoading] = useState(false);
  const [discordFeed, setDiscordFeed] = useState<any[]>([]);
  const [discordFeedLoading, setDiscordFeedLoading] = useState(false);
  const [twitterOembed, setTwitterOembed] = useState<any>(null);
  const [twitterOembedLoading, setTwitterOembedLoading] = useState(false);
  const [twitterTweetUrl, setTwitterTweetUrl] = useState("");
  const [twitterSearchTicker, setTwitterSearchTicker] = useState("");
  const [twitterWidgetLoaded, setTwitterWidgetLoaded] = useState(false);
  const [xFollowingView, setXFollowingView] = useState<string>("");
  // X Curated Feed
  const [xTimeline, setXTimeline] = useState<any[]>([]);
  const [xTimelineLoading, setXTimelineLoading] = useState(false);
  const [xWatchlist, setXWatchlist] = useState<any[]>([]);
  const [xWatchlistLoading, setXWatchlistLoading] = useState(false);
  const [xPolling, setXPolling] = useState(false);
  const [xLastPolled, setXLastPolled] = useState<string>("");
  const [xSubView, setXSubView] = useState<string>("watchlist");
  const [xPasteText, setXPasteText] = useState("");
  const [xParsing, setXParsing] = useState(false);
  const [xParseResult, setXParseResult] = useState<string>("");
  // Signal Intelligence Features
  const [pnlData, setPnlData] = useState<any[]>([]);
  const [pnlLoading, setPnlLoading] = useState(false);
  const [themes, setThemes] = useState<any[]>([]);
  const [themesLoading, setThemesLoading] = useState(false);
  const [signalBrief, setSignalBrief] = useState("");
  const [briefLoading, setBriefLoading] = useState(false);
  const [portfolioOverlap, setPortfolioOverlap] = useState<any[]>([]);
  const [overlapLoading, setOverlapLoading] = useState(false);
  const [convictionScores, setConvictionScores] = useState<any[]>([]);
  const [convictionLoading, setConvictionLoading] = useState(false);
  const [earningsCross, setEarningsCross] = useState<any[]>([]);
  const [earningsXLoading, setEarningsXLoading] = useState(false);
  const [sectorHeatmapData, setSectorHeatmapData] = useState<any[]>([]);
  const [sectorHeatmapLoading, setSectorHeatmapLoading] = useState(false);
  const [darkpoolData, setDarkpoolData] = useState<any[]>([]);
  const [darkpoolLoading, setDarkpoolLoading] = useState(false);
  const [substackUrl, setSubstackUrl] = useState("");
  const [feedSources, setFeedSources] = useState<any[]>([]);
  // Signals badge + Serenity signals
  const [signalNewCount, setSignalNewCount] = useState(0);
  const [serenitySignals, setSerenitySignals] = useState<any[]>([]);
  const [serenitySignalsLoading, setSerenitySignalsLoading] = useState(false);
  const [serenityPolling, setSerenityPolling] = useState(false);
  const [serenitySignalHistory, setSerenitySignalHistory] = useState<any[]>([]);
  // Screener
  const [screenResults, setScreenResults] = useState<any[]>([]);
  const [screenLoading, setScreenLoading] = useState(false);
  const [screenUniverse, setScreenUniverse] = useState("sp500_top");
  const [screenSort, setScreenSort] = useState("market_cap");
  const [screenSortDir, setScreenSortDir] = useState("desc");
  const [screenSectors, setScreenSectors] = useState<string[]>([]);
  const [screenSector, setScreenSector] = useState("");
  const [screenMinCap, setScreenMinCap] = useState("");
  const [screenMaxPe, setScreenMaxPe] = useState("");
  const [screenMinVol, setScreenMinVol] = useState("");
  const [screenCustom, setScreenCustom] = useState("");
  // Options
  const [optTicker, setOptTicker] = useState("");
  const [optChain, setOptChain] = useState<any>(null);
  const [optUnusual, setOptUnusual] = useState<any[]>([]);
  const [optLoading, setOptLoading] = useState(false);
  const [optType, setOptType] = useState<"CALL"|"PUT">("CALL");
  // Robinhood
  const [rhStatus, setRhStatus] = useState<any>(null);
  const [rhPortfolio, setRhPortfolio] = useState<any>(null);
  const [rhOrders, setRhOrders] = useState<any[]>([]);
  const [rhLoading, setRhLoading] = useState(false);
  const [rhMfa, setRhMfa] = useState("");
  const [fidAccounts, setFidAccounts] = useState<any[]>([]);
  const [fidPortfolio, setFidPortfolio] = useState<any>(null);
  const [fidAccount, setFidAccount] = useState("");
  const [fidLoading, setFidLoading] = useState(false);
  // Analytics
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  // Options Calculator
  const [optCalcType, setOptCalcType] = useState<"call"|"put">("call");
  const [optCalcStrike, setOptCalcStrike] = useState("");
  const [optCalcPremium, setOptCalcPremium] = useState("");
  const [optCalcQty, setOptCalcQty] = useState("1");
  const [optCalcSpot, setOptCalcSpot] = useState("");
  const [optCalcResult, setOptCalcResult] = useState<any>(null);
  // Moo Moo
  const [mmStatus, setMmStatus] = useState<any>(null);
  const [mmPortfolio, setMmPortfolio] = useState<any>(null);
  const [mmOrders, setMmOrders] = useState<any[]>([]);
  const [mmLoading, setMmLoading] = useState(false);
  const [heatmapData, setHeatmapData] = useState<any[]>([]);
  const [heatmapLoading, setHeatmapLoading] = useState(false);
  const [heatmapMode, setHeatmapMode] = useState<"market"|"portfolio">("market");
  const [divData, setDivData] = useState<any>(null);
  const [divLoading, setDivLoading] = useState(false);
  const [perfData, setPerfData] = useState<any>(null);
  const [perfLoading, setPerfLoading] = useState(false);
  const [perfPeriod, setPerfPeriod] = useState("1mo");
  const [btTicker, setBtTicker] = useState("");
  const [btStrategy, setBtStrategy] = useState("sma_cross");
  const [btPeriod, setBtPeriod] = useState("1y");
  const [btFast, setBtFast] = useState("10");
  const [btSlow, setBtSlow] = useState("30");
  const [btResult, setBtResult] = useState<any>(null);
  const [btLoading, setBtLoading] = useState(false);
  const [btOptimize, setBtOptimize] = useState(false);
  const [btOptResult, setBtOptResult] = useState<any>(null);
  const [savedScreens, setSavedScreens] = useState<any[]>([]);
  const [showSaveScreen, setShowSaveScreen] = useState(false);
  const [saveScreenName, setSaveScreenName] = useState("");
  // Phase 9 — Calendar enhancements
  const [calImpact, setCalImpact] = useState<any>(null);
  const [calImpactType, setCalImpactType] = useState("fomc");
  const [calImpactLoading, setCalImpactLoading] = useState(false);
  const [calCountdown, setCalCountdown] = useState("");
  // Phase 9 — Earnings enhancements
  const [earningsHistory, setEarningsHistory] = useState<any>(null);
  const [earningsHistTicker, setEarningsHistTicker] = useState("");
  const [earningsHistLoading, setEarningsHistLoading] = useState(false);
  const [earningsImplied, setEarningsImplied] = useState<any>(null);
  const [earnSubTab, setEarnSubTab] = useState<"upcoming"|"history"|"implied">("upcoming");
  // Phase 9 — Dividends enhancements
  const [divSubTab, setDivSubTab] = useState<"portfolio"|"calendar"|"projection"|"drip">("portfolio");
  const [divCalendar, setDivCalendar] = useState<any[]>([]);
  const [divCalLoading, setDivCalLoading] = useState(false);
  const [divProjection, setDivProjection] = useState<any>(null);
  const [divProjLoading, setDivProjLoading] = useState(false);
  const [dripData, setDripData] = useState<any>(null);
  const [dripLoading, setDripLoading] = useState(false);
  const [dripYears, setDripYears] = useState("10");
  // Phase 10 — Multi-Account & Order Form
  const [allAccounts, setAllAccounts] = useState<any[]>([]);
  const [orderForm, setOrderForm] = useState({ ticker: "", side: "buy", quantity: "", order_type: "market", limit_price: "" });
  const [orderSubmitting, setOrderSubmitting] = useState(false);
  const [orderResult, setOrderResult] = useState<any>(null);
  const [showOrderForm, setShowOrderForm] = useState(false);
  const [newAcctName, setNewAcctName] = useState("");
  const [newAcctBroker, setNewAcctBroker] = useState("custom");
  // Phase 11 — Notifications
  const [notifEnabled, setNotifEnabled] = useState(false);
  const [unreadAlerts, setUnreadAlerts] = useState<any[]>([]);
  const [notifPrefs, setNotifPrefs] = useState({ alerts: true, earnings: true, divs: false });
  // Phase 11 — Tax Lot Optimizer
  const [taxTicker, setTaxTicker] = useState("");
  const [taxShares, setTaxShares] = useState("");
  const [taxResult, setTaxResult] = useState<any>(null);
  const [taxLoading, setTaxLoading] = useState(false);
  const [mobileNav, setMobileNav] = useState(false);
  // Phase 13+ — Mega Feature Expansion
  // Position Sizing
  const [posSizeForm, setPosSizeForm] = useState({ account_value: "100000", risk_pct: "2", entry_price: "", stop_loss: "", strategy: "fixed_risk" });
  const [posSizeResult, setPosSizeResult] = useState<any>(null);
  const [posSizeLoading, setPosSizeLoading] = useState(false);
  // Correlation Matrix
  const [corrTickers, setCorrTickers] = useState("SPY,QQQ,AAPL,MSFT,NVDA,TSLA,AMZN,GOOGL");
  const [corrData, setCorrData] = useState<any>(null);
  const [corrLoading, setCorrLoading] = useState(false);
  // Sector Rotation
  const [sectorData, setSectorData] = useState<any>(null);
  const [sectorLoading, setSectorLoading] = useState(false);
  // Trade Plans
  const [tradePlans, setTradePlans] = useState<any[]>([]);
  const [showPlanForm, setShowPlanForm] = useState(false);
  const [planForm, setPlanForm] = useState({ name: "", ticker: "", direction: "long", entry_zone: "", stop_loss: "", target_1: "", target_2: "", target_3: "", thesis: "", setup_type: "", timeframe: "swing", position_size: "" });
  // P&L Calendar
  const [pnlCalData, setPnlCalData] = useState<any>(null);
  const [pnlCalLoading, setPnlCalLoading] = useState(false);
  // Analytics
  const [setupStats, setSetupStats] = useState<any>(null);
  const [setupStatsLoading, setSetupStatsLoading] = useState(false);
  const [timeAnalysis, setTimeAnalysis] = useState<any>(null);
  const [timeAnalysisLoading, setTimeAnalysisLoading] = useState(false);
  const [drawdownData, setDrawdownData] = useState<any>(null);
  const [drawdownLoading, setDrawdownLoading] = useState(false);
  const [ratiosData, setRatiosData] = useState<any>(null);
  const [ratiosLoading, setRatiosLoading] = useState(false);
  // Volume Profile
  const [volProfile, setVolProfile] = useState<any>(null);
  const [volProfileTicker, setVolProfileTicker] = useState("");
  const [volProfileLoading, setVolProfileLoading] = useState(false);
  // AI Features
  const [aiPatterns, setAiPatterns] = useState<any>(null);
  const [aiPatternsLoading, setAiPatternsLoading] = useState(false);
  const [aiSentiment, setAiSentiment] = useState<any>(null);
  const [aiSentimentTicker, setAiSentimentTicker] = useState("");
  const [aiSentimentLoading, setAiSentimentLoading] = useState(false);
  const [aiRebalance, setAiRebalance] = useState<any>(null);
  const [aiRebalanceLoading, setAiRebalanceLoading] = useState(false);
  const [aiEarningsSummary, setAiEarningsSummary] = useState<any>(null);
  const [aiEarningsSumTicker, setAiEarningsSumTicker] = useState("");
  const [aiEarningsSumLoading, setAiEarningsSumLoading] = useState(false);
  // Wheel Strategy
  const [wheelPositions, setWheelPositions] = useState<any[]>([]);
  const [showWheelForm, setShowWheelForm] = useState(false);
  const [wheelForm, setWheelForm] = useState({ ticker: "", phase: "csp", strike: "", premium: "", expiry: "" });
  // Futures/Forex
  const [futuresForex, setFuturesForex] = useState<any[]>([]);
  const [ffLoading, setFfLoading] = useState(false);
  // Risk Parity
  const [rpTickers, setRpTickers] = useState("SPY,TLT,GLD,VNQ");
  const [rpAmount, setRpAmount] = useState("100000");
  const [rpResult, setRpResult] = useState<any>(null);
  const [rpLoading, setRpLoading] = useState(false);
  // Bracket Order Builder
  const [bracketForm, setBracketForm] = useState({ entry_price: "", stop_loss: "", shares: "100", side: "long", targets: [{ price: "", pct: "50" }, { price: "", pct: "50" }] });
  const [bracketResult, setBracketResult] = useState<any>(null);
  // Options P&L Heatmap
  const [optHeatTicker, setOptHeatTicker] = useState("");
  const [optHeatForm, setOptHeatForm] = useState({ type: "call", strike: "", premium: "", qty: "1" });
  const [optHeatData, setOptHeatData] = useState<any>(null);
  const [optHeatLoading, setOptHeatLoading] = useState(false);
  // Analytics Sub-tab
  const [analyticsSubTab, setAnalyticsSubTab] = useState<"overview"|"setups"|"time"|"drawdown"|"ratios"|"volume">("overview");

  // Pop-out panels
  const [poppedOut, setPoppedOut] = useState<Set<string>>(new Set());
  const popOutTab = (tabId: string, title: string) => {
    const w = window.open("", tabId, "width=800,height=600,menubar=no,toolbar=no,status=no");
    if (w) {
      w.document.write(`<!DOCTYPE html><html><head><title>${title} - Stock Terminal</title><style>body{margin:0;font-family:monospace;background:#09090b;color:#e4e4e7;}</style></head><body><div id="root" style="padding:16px;"><h3 style="color:#f59e0b;margin:0 0 8px;">${title}</h3><p style="font-size:12px;color:#71717a;">Pop-out panel loaded. Data syncs with main window.</p></div></body></html>`);
      setPoppedOut(prev => new Set(prev).add(tabId));
      w.onbeforeunload = () => setPoppedOut(prev => { const next = new Set(prev); next.delete(tabId); return next; });
    }
  };

  // ── v5.1 State ─────────────────────────────────────────────────────
  // Monte Carlo
  const [mcForm, setMcForm] = useState({ initial_value: "100000", daily_return: "0.05", daily_volatility: "1.5", days: "252", simulations: "1000" });
  const [mcResult, setMcResult] = useState<any>(null);
  const [mcLoading, setMcLoading] = useState(false);
  // Portfolio Optimizer (MPT)
  const [mptTickers, setMptTickers] = useState("SPY,QQQ,TLT,GLD,VNQ");
  const [mptAmount, setMptAmount] = useState("100000");
  const [mptResult, setMptResult] = useState<any>(null);
  const [mptLoading, setMptLoading] = useState(false);
  // Market Breadth
  const [breadthData, setBreadthData] = useState<any>(null);
  const [breadthLoading, setBreadthLoading] = useState(false);
  // IV Rank
  const [ivTicker, setIvTicker] = useState("");
  const [ivData, setIvData] = useState<any>(null);
  const [ivLoading, setIvLoading] = useState(false);
  // Greeks Calculator
  const [greeksForm, setGreeksForm] = useState({ spot: "", strike: "", dte: "30", rate: "5.0", iv: "30", option_type: "call" });
  const [greeksResult, setGreeksResult] = useState<any>(null);
  const [greeksLoading, setGreeksLoading] = useState(false);
  // Multi-Leg Options Strategy
  const [stratLegs, setStratLegs] = useState([{ type: "call", side: "buy", strike: "", premium: "", qty: "1" }]);
  const [stratResult, setStratResult] = useState<any>(null);
  const [stratTicker, setStratTicker] = useState("");
  // Insider Trading
  const [insiderTicker, setInsiderTicker] = useState("");
  const [insiderData, setInsiderData] = useState<any>(null);
  const [insiderLoading, setInsiderLoading] = useState(false);
  // Dark Pool
  const [dpTicker, setDpTicker] = useState("");
  const [dpData, setDpData] = useState<any>(null);
  const [dpLoading, setDpLoading] = useState(false);
  // Notifications
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotifDrawer, setShowNotifDrawer] = useState(false);
  const [notifCount, setNotifCount] = useState(0);
  // Trade Templates
  const [templates, setTemplates] = useState<any[]>([]);
  const [showTemplateForm, setShowTemplateForm] = useState(false);
  const [templateForm, setTemplateForm] = useState({ name: "", strategy: "", entry_rules: "", exit_rules: "", risk_pct: "2", position_type: "swing", notes: "" });
  // Peer Benchmarks
  const [peerData, setPeerData] = useState<any>(null);
  const [peerLoading, setPeerLoading] = useState(false);
  // Webhooks
  const [webhooks, setWebhooks] = useState<any[]>([]);
  const [webhookForm, setWebhookForm] = useState({ platform: "discord", url: "", events: ["alert_triggered", "trade_closed"] });
  const [showWebhookForm, setShowWebhookForm] = useState(false);
  // AI Trade Coach
  const [coachTicker, setCoachTicker] = useState("");
  const [coachData, setCoachData] = useState<any>(null);
  const [coachLoading, setCoachLoading] = useState(false);
  // AI Watchlist Scanner
  const [scanResult, setScanResult] = useState<any>(null);
  const [scanLoading, setScanLoading] = useState(false);
  // AI Risk Alerts
  const [riskAlerts, setRiskAlerts] = useState<any>(null);
  const [riskAlertsLoading, setRiskAlertsLoading] = useState(false);
  // Sentiment Timeline
  const [sentTimelineTicker, setSentTimelineTicker] = useState("");
  const [sentTimeline, setSentTimeline] = useState<any>(null);
  const [sentTimelineLoading, setSentTimelineLoading] = useState(false);
  // ML Prediction
  const [mlTicker, setMlTicker] = useState("");
  const [mlPrediction, setMlPrediction] = useState<any>(null);
  const [mlLoading, setMlLoading] = useState(false);
  // AI Sub-tab expanded
  const [aiSubTab2, setAiSubTab2] = useState<"analysis"|"chat"|"deepdive"|"rebalance"|"earnsummary"|"coach"|"scanner"|"riskalerts"|"senttime"|"predict"|"deepreview"|"doctor"|"narrative">("analysis");
  const [ddTicker, setDdTicker] = useState("");
  const [nextDayOutlook, setNextDayOutlook] = useState<any>(null);
  const loadOutlook = useCallback(async () => { try { const r = await fetch(`${BASE}/ai/next-day-outlook`); setNextDayOutlook(await r.json()); } catch {} }, []);
  const [ddResult, setDdResult] = useState<any>(null);
  const [ddLoading, setDdLoading] = useState(false);
  const runDeepDive = async (ticker?: string) => {
    const tk = (ticker || ddTicker).trim().toUpperCase();
    if (!tk) return;
    setDdLoading(true); setDdResult(null);
    try { const r = await fetch(`${BASE}/ai/deep-dive`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ticker: tk }) }); setDdResult(await r.json()); } catch {} finally { setDdLoading(false); }
  };

  // ── v5.2 State ─────────────────────────────────────────────────────
  // Stress Test
  const [stressResult, setStressResult] = useState<any>(null);
  const [stressLoading, setStressLoading] = useState(false);
  // Seasonality
  const [seasonTicker, setSeasonTicker] = useState("");
  const [seasonData, setSeasonData] = useState<any>(null);
  const [seasonLoading, setSeasonLoading] = useState(false);
  // Options Skew
  const [skewTicker, setSkewTicker] = useState("");
  const [skewData, setSkewData] = useState<any>(null);
  const [skewLoading, setSkewLoading] = useState(false);
  // Performance Attribution
  const [attribData, setAttribData] = useState<any>(null);
  const [attribLoading, setAttribLoading] = useState(false);
  // Risk of Ruin
  const [rorForm, setRorForm] = useState({ win_rate: "55", avg_win: "2", avg_loss: "1", risk_per_trade: "2", ruin_threshold: "50" });
  const [rorResult, setRorResult] = useState<any>(null);
  const [rorLoading, setRorLoading] = useState(false);
  // Equity Curve
  const [eqCurve, setEqCurve] = useState<any>(null);
  const [eqLoading, setEqLoading] = useState(false);
  // AI Deep Review
  const [deepReview, setDeepReview] = useState<any>(null);
  const [deepReviewLoading, setDeepReviewLoading] = useState(false);
  // AI Portfolio Doctor
  const [doctorData, setDoctorData] = useState<any>(null);
  const [doctorLoading, setDoctorLoading] = useState(false);
  // AI Market Narrative
  const [narrative, setNarrative] = useState<any>(null);
  const [narrativeLoading, setNarrativeLoading] = useState(false);
  // Complex Alerts
  const [complexAlerts, setComplexAlerts] = useState<any[]>([]);
  const [showComplexForm, setShowComplexForm] = useState(false);
  const [complexForm, setComplexForm] = useState({ ticker: "", name: "", conditions: [{ type: "price_above", value: "" }], logic: "AND" });
  // Workspaces
  const [workspaces, setWorkspaces] = useState<any[]>([]);
  const [showWsForm, setShowWsForm] = useState(false);
  const [wsName, setWsName] = useState("");
  // Leaderboard
  const [leaderboard, setLeaderboard] = useState<any>(null);
  const [lbLoading, setLbLoading] = useState(false);
  // Report
  const [reportData, setReportData] = useState<any>(null);
  const [reportLoading, setReportLoading] = useState(false);
  const [reportType, setReportType] = useState("weekly");
  // Voice Commands
  const [voiceActive, setVoiceActive] = useState(false);
  const [voiceText, setVoiceText] = useState("");
  // Quick Trade
  const [showQuickTrade, setShowQuickTrade] = useState(false);
  // News Comments
  const [newsComments, setNewsComments] = useState<any[]>([]);
  const [commentText, setCommentText] = useState("");
  // Natural Search
  const [nlQuery, setNlQuery] = useState("");
  const [nlResult, setNlResult] = useState<any>(null);
  const [nlLoading, setNlLoading] = useState(false);

  const portfolioName = "default";
  const [wlInput, setWlInput] = useState("");
  const [kwInput, setKwInput] = useState("");
  const [alTicker, setAlTicker] = useState(""); const [alCond, setAlCond] = useState("above"); const [alPrice, setAlPrice] = useState("");
  const [ptTicker, setPtTicker] = useState(""); const [ptShares, setPtShares] = useState(""); const [ptCost, setPtCost] = useState("");
  const [convForm, setConvForm] = useState({ trader:"", ticker:"", thesis:"", entry_target:"", price_target:"", notes:"" });

  // ── Loaders ─────────────────────────────────────────────────────────
  const loadMacro = useCallback(async () => { try { const r = await fetch(`${BASE}/macro/refresh`); const d = await r.json(); setMacro(d.data||[]); setLastUpdated(new Date().toLocaleTimeString()); } catch {} }, []);
  const loadNews = useCallback(async () => { try { const r = await fetch(`${BASE}/news`); const d = await r.json(); setNews(d.articles||[]); } catch {} }, []);
  const loadBreaking = useCallback(async () => { try { const r = await fetch(`${BASE}/breaking`); const d = await r.json(); setBreaking(d.alerts||[]); } catch {} }, []);
  const loadCalendar = useCallback(async () => { try { const r = await fetch(`${BASE}/calendar`); const d = await r.json(); setCalendar(d.events||[]); } catch {} }, []);
  const loadWatchlist = useCallback(async () => { try { const r = await fetch(`${BASE}/watchlist`); const d = await r.json(); setWatchlist(d.tickers||[]); } catch {} }, []);
  const loadNamedWatchlists = useCallback(async () => { try { const r = await fetch(`${BASE}/watchlists`); const d = await r.json(); setNamedWatchlists(d.watchlists||[]); } catch {} }, []);
  const loadNamedWatchlist = useCallback(async (name: string) => { try { const r = await fetch(`${BASE}/watchlists/${name}`); const d = await r.json(); setWatchlist(d.tickers||[]); setActiveWatchlist(name); } catch {} }, []);
  const createNamedWatchlist = async (name: string) => { if (!name.trim()) return; await fetch(`${BASE}/watchlists/${name.trim()}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ tickers: [] }) }); setNewWlName(""); setShowNewWl(false); loadNamedWatchlists(); setActiveWatchlist(name.trim()); loadNamedWatchlist(name.trim()); };
  const deleteNamedWatchlist = async (name: string) => { await fetch(`${BASE}/watchlists/${name}`, { method: "DELETE" }); loadNamedWatchlists(); if (activeWatchlist === name) { setActiveWatchlist(""); loadWatchlist(); } };
  const addToNamedWatchlist = async (ticker: string) => { if (!ticker.trim()) return; if (activeWatchlist) { await fetch(`${BASE}/watchlists/${activeWatchlist}/${ticker.trim().toUpperCase()}`, { method: "POST" }); loadNamedWatchlist(activeWatchlist); } else { await fetch(`${BASE}/watchlist`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ticker: ticker.trim().toUpperCase() }) }); loadWatchlist(); } setWlInput(""); };
  const removeFromWatchlist = async (ticker: string) => { if (activeWatchlist) { await fetch(`${BASE}/watchlists/${activeWatchlist}/${ticker}`, { method: "DELETE" }); loadNamedWatchlist(activeWatchlist); } else { await fetch(`${BASE}/watchlist/${ticker}`, { method: "DELETE" }); loadWatchlist(); } };
  const loadAlerts = useCallback(async () => { try { const r = await fetch(`${BASE}/alerts`); const d = await r.json(); setAlerts(d.rules||[]); setTriggered(d.triggered||[]); } catch {} }, []);
  const loadPortfolio = useCallback(async () => { try { const r = await fetch(`${BASE}/portfolio/${portfolioName}`); const d = await r.json(); setPortfolio(d.holdings||{}); setPortfolioCash(d.cash||0); setPortfolioOptions(d.options||[]); setPortfolioAccount(d.account||{}); } catch {} }, []);
  const loadFidelityPositions = useCallback(async (doSync = false) => {
    setFidelityLoading(true);
    try {
      if (doSync) await fetch(`${BASE}/portfolio/fidelity-sync`);
      const r = await fetch(`${BASE}/portfolio/fidelity-positions`);
      const d = await r.json();
      setFidelityPositions(d.positions||[]);
      setFidelitySummary(d.summary||null);
      const fr = await fetch(`${BASE}/portfolio/fidelity-freshness`);
      setFidelityFreshness(await fr.json());
    } catch {}
    setFidelityLoading(false);
  }, []);
  const loadPortSectors = useCallback(async () => { try { const r = await fetch(`${BASE}/portfolio/${portfolioName}/sectors`); const d = await r.json(); setPortSectors(d.sectors||{}); } catch {} }, []);
  const loadDailyPnl = useCallback(async () => { try { const r = await fetch(`${BASE}/portfolio/${portfolioName}/daily-pnl`); const d = await r.json(); setDailyPnl(d.daily||[]); } catch {} }, []);
  const loadPortHistory = useCallback(async () => { try { const r = await fetch(`${BASE}/portfolio/${portfolioName}/history`); const d = await r.json(); setPortHistory(Array.isArray(d) ? d : []); } catch {} }, []);
  const loadConvictions = useCallback(async () => { try { const r = await fetch(`${BASE}/convictions`); const d = await r.json(); setConvictions(d.convictions||[]); } catch {} }, []);
  const loadKeywords = useCallback(async () => { try { const r = await fetch(`${BASE}/keywords`); const d = await r.json(); setKeywords(d.keywords||[]); } catch {} }, []);
  const loadNewsAlerts = useCallback(async () => { try { const r = await fetch(`${BASE}/news/alerts`); const d = await r.json(); setNewsAlerts(d.alerts||[]); } catch {} }, []);
  const loadNewsIntelligence = useCallback(async () => { setNewsIntelLoading(true); try { const r = await fetch(`${BASE}/news/intelligence`); const d = await r.json(); setNewsIntel(d); } catch {} setNewsIntelLoading(false); }, []);
  const loadWatchlistNews = useCallback(async () => { setWatchlistNewsLoading(true); try { const r = await fetch(`${BASE}/news/watchlist`); setWatchlistNews(await r.json()); } catch {} setWatchlistNewsLoading(false); }, []);
  const loadBookmarks = useCallback(async () => { try { const r = await fetch(`${BASE}/news/bookmarks`); const d = await r.json(); setNewsBookmarks(new Set((d.bookmarks||[]).map((b:any)=>String(b.id)))); } catch {} }, []);
  const toggleBookmark = async (article: any) => { const id = String(article.id); if (newsBookmarks.has(id)) { await fetch(`${BASE}/news/bookmark`, { method: "DELETE", headers:{"Content-Type":"application/json"}, body: JSON.stringify({id: article.id}) }); setNewsBookmarks(prev => { const n = new Set(prev); n.delete(id); return n; }); } else { await fetch(`${BASE}/news/bookmark`, { method: "POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify(article) }); setNewsBookmarks(prev => new Set([...prev, id])); } };
  // Institutional analytics loaders
  const loadMarketPulse = useCallback(async () => { setMarketPulseLoading(true); try { const r = await fetch(`${BASE}/dashboard/market-pulse`); setMarketPulse(await r.json()); } catch {} setMarketPulseLoading(false); }, []);
  const loadRiskAnalytics = useCallback(async () => { setRiskAnalyticsLoading(true); try { const r = await fetch(`${BASE}/portfolio/${portfolioName}/risk-analytics`); setRiskAnalytics(await r.json()); } catch {} setRiskAnalyticsLoading(false); }, []);
  const loadStressScenarios = useCallback(async () => { setStressScenariosLoading(true); try { const r = await fetch(`${BASE}/portfolio/${portfolioName}/stress-scenarios`); setStressScenarios(await r.json()); } catch {} setStressScenariosLoading(false); }, []);
  const loadJournal = useCallback(async () => { try { const r = await fetch(`${BASE}/journal`); const d = await r.json(); setTrades(d.trades||[]); const manualStats = d.stats||{}; /* Also load options journal stats if manual journal is empty */ if (!manualStats.total_trades) { try { const r2 = await fetch(`${BASE}/options-journal/summary`); const optStats = await r2.json(); if (optStats.total_pnl) setTradeStats({ open_trades: optStats.open_count||0, win_rate: optStats.win_rate||0, total_pnl: optStats.total_pnl||0, total_trades: optStats.total_trades||0 }); else setTradeStats(manualStats); } catch { setTradeStats(manualStats); } } else { setTradeStats(manualStats); } } catch {} }, []);
  const loadEarnings = useCallback(async () => { try { const r = await fetch(`${BASE}/earnings`); const d = await r.json(); setEarnings(d.earnings||[]); } catch {} }, []);
  const loadWlPrices = useCallback(async (tks: string[]) => { if (!tks.length) return; try { const r = await fetch(`${BASE}/quotes?tickers=${tks.join(",")}`); const d = await r.json(); const m:{[t:string]:number|null}={}; (d.data||[]).forEach((q:any)=>{m[q.ticker]=q.price??null;}); setWlPrices(prev => ({...prev, ...m})); } catch {} }, []);
  const loadHeatmap = async (mode?: string) => { setHeatmapLoading(true); try { const url = (mode||heatmapMode)==="portfolio"&&fidAccount ? `${BASE}/heatmap/portfolio/${fidAccount}` : `${BASE}/heatmap`; const r = await fetch(url); const d = await r.json(); setHeatmapData(d.heatmap||[]); } catch {} setHeatmapLoading(false); };
  const loadDividends = async (key?: string) => { const k = key || fidAccount; if (!k) return; setDivLoading(true); try { const r = await fetch(`${BASE}/dividends/portfolio/${k}`); setDivData(await r.json()); } catch {} setDivLoading(false); };
  const loadPerformance = async (key?: string, period?: string) => { const k = key || fidAccount; if (!k) return; setPerfLoading(true); try { const r = await fetch(`${BASE}/performance/${k}?period=${period||perfPeriod}`); setPerfData(await r.json()); } catch {} setPerfLoading(false); };
  const runBacktest = async () => { if (!btTicker) return; setBtLoading(true); try { const r = await fetch(`${BASE}/backtest/${btTicker}?strategy=${btStrategy}&period=${btPeriod}&fast=${btFast}&slow=${btSlow}`); setBtResult(await r.json()); } catch {} setBtLoading(false); };
  const runOptimize = async () => { if (!btTicker) return; setBtLoading(true); try { const r = await fetch(`${BASE}/backtest/optimize`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ticker: btTicker, strategy: btStrategy, period: btPeriod, fast_range: [5, 8, 10, 12, 15, 20], slow_range: [20, 25, 30, 40, 50, 60] }) }); setBtOptResult(await r.json()); } catch {} setBtLoading(false); };
  const loadSavedScreens = useCallback(async () => { try { const r = await fetch(`${BASE}/screener/saved`); const d = await r.json(); setSavedScreens(d.screens || []); } catch {} }, []);
  const saveScreen = async () => { if (!saveScreenName.trim()) return; await fetch(`${BASE}/screener/saved`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: saveScreenName, universe: screenUniverse, sector: screenSector, min_market_cap: screenMinCap, max_pe: screenMaxPe, custom_tickers: screenCustom }) }); setSaveScreenName(""); setShowSaveScreen(false); loadSavedScreens(); };
  const deleteSavedScreen = async (id: string) => { await fetch(`${BASE}/screener/saved/${id}`, { method: "DELETE" }); loadSavedScreens(); };
  const applySavedScreen = (screen: any) => { setScreenUniverse(screen.universe || "sp500_top"); setScreenSector(screen.sector || ""); if (screen.min_market_cap) setScreenMinCap(screen.min_market_cap); if (screen.max_pe) setScreenMaxPe(screen.max_pe); if (screen.custom_tickers) setScreenCustom(screen.custom_tickers); };
  const loadAnalytics = async (key?: string) => { const k = key || fidAccount; if (!k) return; setAnalyticsLoading(true); try { const r = await fetch(`${BASE}/portfolio/analytics/${k}`); setAnalyticsData(await r.json()); } catch {} setAnalyticsLoading(false); };
  const loadMmStatus = useCallback(async () => { try { const r = await fetch(`${BASE}/moomoo/status`); setMmStatus(await r.json()); } catch {} }, []);
  const loadMmPortfolio = async () => { setMmLoading(true); try { const [pR, oR] = await Promise.all([fetch(`${BASE}/moomoo/portfolio`), fetch(`${BASE}/moomoo/orders`)]); setMmPortfolio(await pR.json()); const od = await oR.json(); setMmOrders(od.orders||[]); } catch {} setMmLoading(false); };
  const calcOptionsPnl = () => { const strike=parseFloat(optCalcStrike); const premium=parseFloat(optCalcPremium); const qty=parseInt(optCalcQty)||1; const spot=parseFloat(optCalcSpot); if(isNaN(strike)||isNaN(premium)) return; const costBasis=premium*100*qty; const breakeven=optCalcType==="call"?strike+premium:strike-premium; const points=[]; for(let p=strike*0.5;p<=strike*1.5;p+=strike*0.005){let pnl=0;if(optCalcType==="call"){pnl=Math.max(0,p-strike)*100*qty-costBasis;}else{pnl=Math.max(0,strike-p)*100*qty-costBasis;}points.push({price:Math.round(p*100)/100,pnl:Math.round(pnl*100)/100});} const maxLoss=-costBasis; const maxProfit=optCalcType==="call"?Infinity:(strike-premium)*100*qty; let currentPnl=null; if(!isNaN(spot)){if(optCalcType==="call"){currentPnl=Math.max(0,spot-strike)*100*qty-costBasis;}else{currentPnl=Math.max(0,strike-spot)*100*qty-costBasis;}} setOptCalcResult({points,breakeven,maxLoss,maxProfit,costBasis,currentPnl,strike,premium,qty,type:optCalcType}); };
  const loadFidAccounts = useCallback(async () => { try { const r = await fetch(`${BASE}/fidelity/accounts`); const d = await r.json(); setFidAccounts(d.accounts||[]); if (d.accounts?.length) setFidAccount(d.accounts[0].key); } catch {} }, []);
  const loadFidPortfolio = async (key?: string) => { const k = key || fidAccount; if (!k) return; setFidLoading(true); try { const r = await fetch(`${BASE}/fidelity/${k}`); setFidPortfolio(await r.json()); } catch {} setFidLoading(false); };
  const loadRhStatus = useCallback(async () => { try { const r = await fetch(`${BASE}/rh/status`); setRhStatus(await r.json()); } catch {} }, []);
  // Phase 9 loaders
  const loadCalendarImpact = async (eventType?: string) => { const t = eventType || calImpactType; setCalImpactLoading(true); try { const r = await fetch(`${BASE}/calendar/impact/${t}`); setCalImpact(await r.json()); } catch {} setCalImpactLoading(false); };
  const loadEarningsHistory = async (ticker?: string) => { const t = (ticker || earningsHistTicker).trim().toUpperCase(); if (!t) return; setEarningsHistTicker(t); setEarningsHistLoading(true); try { const r = await fetch(`${BASE}/earnings/${t}/history`); setEarningsHistory(await r.json()); } catch {} setEarningsHistLoading(false); };
  const loadEarningsImplied = async (ticker: string) => { try { const r = await fetch(`${BASE}/earnings/${ticker.toUpperCase()}/implied-move`); setEarningsImplied(await r.json()); } catch {} };
  // Phase 10 loaders
  const loadAllAccounts = useCallback(async () => { try { const r = await fetch(`${BASE}/accounts`); const d = await r.json(); setAllAccounts(d.accounts || []); } catch {} }, []);
  const createCustomAccount = async () => { if (!newAcctName.trim()) return; await fetch(`${BASE}/accounts`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: newAcctName, broker: newAcctBroker }) }); setNewAcctName(""); loadAllAccounts(); };
  const deleteCustomAccount = async (key: string) => { await fetch(`${BASE}/accounts/${key}`, { method: "DELETE" }); loadAllAccounts(); };
  const submitOrder = async () => { if (!orderForm.ticker || !orderForm.quantity) return; setOrderSubmitting(true); try { const r = await fetch(`${BASE}/rh/orders`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(orderForm) }); setOrderResult(await r.json()); } catch(e) { setOrderResult({ error: "Order submission failed" }); } setOrderSubmitting(false); };
  const cancelOrder = async (orderId: string) => { try { await fetch(`${BASE}/rh/orders/${orderId}/cancel`, { method: "POST" }); } catch {} };
  // Phase 11 loaders
  const enableNotifications = async () => { if ("Notification" in window) { const perm = await Notification.requestPermission(); setNotifEnabled(perm === "granted"); } };
  const loadUnreadAlerts = useCallback(async () => { try { const r = await fetch(`${BASE}/alerts/unread`); const d = await r.json(); setUnreadAlerts(d.unread || []); if (notifEnabled && d.unread?.length > 0) { d.unread.forEach((a: any) => { new Notification(`Alert: ${a.ticker}`, { body: `${a.ticker} ${a.condition} $${a.target_price}`, icon: "/favicon.ico" }); }); await fetch(`${BASE}/alerts/mark-read`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ids: d.unread.map((a: any) => a.ticker + (a.triggered_at || "")) }) }); } } catch {} }, [notifEnabled]);
  const runTaxOptimizer = async () => { if (!taxTicker || !taxShares) return; setTaxLoading(true); try { const r = await fetch(`${BASE}/tax/optimize`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ticker: taxTicker, shares_to_sell: parseFloat(taxShares), account_key: fidAccount }) }); setTaxResult(await r.json()); } catch { setTaxResult({ error: "Optimization failed" }); } setTaxLoading(false); };

  const loadDivCalendar = async () => { setDivCalLoading(true); try { const r = await fetch(`${BASE}/dividends/calendar`); const d = await r.json(); setDivCalendar(d.dividends || []); } catch {} setDivCalLoading(false); };
  const loadDivProjection = async (key?: string) => { const k = key || fidAccount; if (!k) return; setDivProjLoading(true); try { const r = await fetch(`${BASE}/dividends/projection/${k}`); setDivProjection(await r.json()); } catch {} setDivProjLoading(false); };
  const loadDrip = async (key?: string, yrs?: string) => { const k = key || fidAccount; if (!k) return; setDripLoading(true); try { const r = await fetch(`${BASE}/dividends/drip/${k}?years=${yrs || dripYears}`); setDripData(await r.json()); } catch {} setDripLoading(false); };

  // Phase 13+ loaders
  const calcPositionSize = async () => { setPosSizeLoading(true); try { const r = await fetch(`${BASE}/position-size?account_value=${posSizeForm.account_value}&risk_pct=${posSizeForm.risk_pct}&entry_price=${posSizeForm.entry_price}&stop_loss=${posSizeForm.stop_loss}&strategy=${posSizeForm.strategy}`, { method: "POST" }); setPosSizeResult(await r.json()); } catch {} setPosSizeLoading(false); };
  const loadCorrelation = async (tks?: string) => { setCorrLoading(true); try { const r = await fetch(`${BASE}/correlation-matrix?tickers=${encodeURIComponent(tks || corrTickers)}`); setCorrData(await r.json()); } catch {} setCorrLoading(false); };
  const loadSectorRotation = async () => { setSectorLoading(true); try { const r = await fetch(`${BASE}/sector-rotation`); setSectorData(await r.json()); } catch {} setSectorLoading(false); };
  const loadTradePlans = useCallback(async () => { try { const r = await fetch(`${BASE}/trade-plans`); const d = await r.json(); setTradePlans(d.plans || []); } catch {} }, []);
  const createTradePlan = async () => { if (!planForm.name || !planForm.ticker) return; await fetch(`${BASE}/trade-plans`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(planForm) }); setPlanForm({ name: "", ticker: "", direction: "long", entry_zone: "", stop_loss: "", target_1: "", target_2: "", target_3: "", thesis: "", setup_type: "", timeframe: "swing", position_size: "" }); setShowPlanForm(false); loadTradePlans(); };
  const deleteTradePlan = async (id: string) => { await fetch(`${BASE}/trade-plans/${id}`, { method: "DELETE" }); loadTradePlans(); };
  const updatePlanStatus = async (id: string, status: string) => { await fetch(`${BASE}/trade-plans/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) }); loadTradePlans(); };
  const loadPnlCalendar = async () => { setPnlCalLoading(true); try { const r = await fetch(`${BASE}/pnl-calendar`); setPnlCalData(await r.json()); } catch {} setPnlCalLoading(false); };
  const loadSetupStats = async () => { setSetupStatsLoading(true); try { const r = await fetch(`${BASE}/analytics/setup-stats`); setSetupStats(await r.json()); } catch {} setSetupStatsLoading(false); };
  const loadTimeAnalysis = async () => { setTimeAnalysisLoading(true); try { const r = await fetch(`${BASE}/analytics/time-analysis`); setTimeAnalysis(await r.json()); } catch {} setTimeAnalysisLoading(false); };
  const loadDrawdown = async () => { setDrawdownLoading(true); try { const r = await fetch(`${BASE}/analytics/drawdown`); setDrawdownData(await r.json()); } catch {} setDrawdownLoading(false); };
  const loadRatios = async () => { setRatiosLoading(true); try { const r = await fetch(`${BASE}/analytics/ratios`); setRatiosData(await r.json()); } catch {} setRatiosLoading(false); };
  const loadVolumeProfile = async (ticker?: string) => { const t = (ticker || volProfileTicker).trim().toUpperCase(); if (!t) return; setVolProfileTicker(t); setVolProfileLoading(true); try { const r = await fetch(`${BASE}/volume-profile/${t}`); setVolProfile(await r.json()); } catch {} setVolProfileLoading(false); };
  const loadAiPatterns = async (ticker: string) => { setAiPatternsLoading(true); try { const r = await fetch(`${BASE}/ai/pattern-scan/${ticker.toUpperCase()}`); setAiPatterns(await r.json()); } catch {} setAiPatternsLoading(false); };
  const loadAiSentiment = async (ticker?: string) => { const t = (ticker || aiSentimentTicker).trim().toUpperCase(); if (!t) return; setAiSentimentTicker(t); setAiSentimentLoading(true); try { const r = await fetch(`${BASE}/ai/sentiment/${t}`); setAiSentiment(await r.json()); } catch {} setAiSentimentLoading(false); };
  const loadAiRebalance = async () => { setAiRebalanceLoading(true); try { const r = await fetch(`${BASE}/ai/rebalance`); setAiRebalance(await r.json()); } catch {} setAiRebalanceLoading(false); };
  const loadAiEarningsSummary = async (ticker?: string) => { const t = (ticker || aiEarningsSumTicker).trim().toUpperCase(); if (!t) return; setAiEarningsSumTicker(t); setAiEarningsSumLoading(true); try { const r = await fetch(`${BASE}/ai/earnings-summary/${t}`); setAiEarningsSummary(await r.json()); } catch {} setAiEarningsSumLoading(false); };
  const loadWheel = useCallback(async () => { try { const r = await fetch(`${BASE}/wheel`); const d = await r.json(); setWheelPositions(d.positions || []); } catch {} }, []);
  const addWheelPosition = async () => { if (!wheelForm.ticker) return; await fetch(`${BASE}/wheel`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...wheelForm, strike: parseFloat(wheelForm.strike), premium: parseFloat(wheelForm.premium) }) }); setWheelForm({ ticker: "", phase: "csp", strike: "", premium: "", expiry: "" }); setShowWheelForm(false); loadWheel(); };
  const deleteWheelPosition = async (id: string) => { await fetch(`${BASE}/wheel/${id}`, { method: "DELETE" }); loadWheel(); };
  const loadFuturesForex = async () => { setFfLoading(true); try { const r = await fetch(`${BASE}/futures-forex`); const d = await r.json(); setFuturesForex(d.data || []); } catch {} setFfLoading(false); };
  const calcRiskParity = async () => { setRpLoading(true); try { const r = await fetch(`${BASE}/risk-parity`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ tickers: rpTickers.split(",").map(t => t.trim()), amount: parseFloat(rpAmount) }) }); setRpResult(await r.json()); } catch {} setRpLoading(false); };
  const calcBracketOrder = async () => { const entry = parseFloat(bracketForm.entry_price); const stop = parseFloat(bracketForm.stop_loss); if (!entry || !stop) return; const targets = bracketForm.targets.filter(t => t.price).map(t => ({ price: parseFloat(t.price), pct_of_position: parseFloat(t.pct) / 100 })); try { const r = await fetch(`${BASE}/bracket-order`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ entry_price: entry, stop_loss: stop, shares: parseInt(bracketForm.shares), side: bracketForm.side, targets }) }); setBracketResult(await r.json()); } catch {} };
  const loadOptHeatmap = async () => { if (!optHeatForm.strike || !optHeatForm.premium) return; setOptHeatLoading(true); try { const r = await fetch(`${BASE}/options/pnl-heatmap/${optHeatTicker || "SPY"}?option_type=${optHeatForm.type}&strike=${optHeatForm.strike}&premium=${optHeatForm.premium}&qty=${optHeatForm.qty}`); setOptHeatData(await r.json()); } catch {} setOptHeatLoading(false); };
  const saveTheme = async (t: string) => { try { await fetch(`${BASE}/settings/theme`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ theme: t }) }); } catch {} };

  // ── v5.1 Loaders ──────────────────────────────────────────────────
  const runMonteCarlo = async () => { setMcLoading(true); try { const r = await fetch(`${BASE}/monte-carlo`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ initial_value: parseFloat(mcForm.initial_value), daily_return_pct: parseFloat(mcForm.daily_return), daily_volatility_pct: parseFloat(mcForm.daily_volatility), days: parseInt(mcForm.days), simulations: parseInt(mcForm.simulations) }) }); setMcResult(await r.json()); } catch {} setMcLoading(false); };
  const runMptOptimizer = async () => { setMptLoading(true); try { const r = await fetch(`${BASE}/portfolio-optimize`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ tickers: mptTickers.split(",").map(t => t.trim()), amount: parseFloat(mptAmount) }) }); setMptResult(await r.json()); } catch {} setMptLoading(false); };
  const loadBreadth = async () => { setBreadthLoading(true); try { const r = await fetch(`${BASE}/market-breadth`); setBreadthData(await r.json()); } catch {} setBreadthLoading(false); };
  const loadIvRank = async (ticker?: string) => { const t = (ticker || ivTicker).trim().toUpperCase(); if (!t) return; setIvTicker(t); setIvLoading(true); try { const r = await fetch(`${BASE}/iv-rank/${t}`); setIvData(await r.json()); } catch {} setIvLoading(false); };
  const calcGreeks = async () => { setGreeksLoading(true); try { const r = await fetch(`${BASE}/greeks?spot=${greeksForm.spot}&strike=${greeksForm.strike}&dte=${greeksForm.dte}&rate=${greeksForm.rate}&iv=${greeksForm.iv}&option_type=${greeksForm.option_type}`); setGreeksResult(await r.json()); } catch {} setGreeksLoading(false); };
  const buildStrategy = async () => { try { const r = await fetch(`${BASE}/options-strategy`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ticker: stratTicker || "SPY", legs: stratLegs.map(l => ({ type: l.type, side: l.side, strike: parseFloat(l.strike), premium: parseFloat(l.premium), qty: parseInt(l.qty) })) }) }); setStratResult(await r.json()); } catch {} };
  const loadInsider = async (ticker?: string) => { const t = (ticker || insiderTicker).trim().toUpperCase(); if (!t) return; setInsiderTicker(t); setInsiderLoading(true); try { const r = await fetch(`${BASE}/insider/${t}`); setInsiderData(await r.json()); } catch {} setInsiderLoading(false); };
  const loadDarkPool = async (ticker?: string) => { const t = (ticker || dpTicker).trim().toUpperCase(); if (!t) return; setDpTicker(t); setDpLoading(true); try { const r = await fetch(`${BASE}/dark-pool/${t}`); setDpData(await r.json()); } catch {} setDpLoading(false); };
  const loadNotifications = useCallback(async () => { try { const r = await fetch(`${BASE}/notifications`); const d = await r.json(); setNotifications(d.notifications || []); setNotifCount((d.notifications || []).filter((n:any) => !n.read).length); } catch {} }, []);
  const markAllRead = async () => { await fetch(`${BASE}/notifications/read-all`, { method: "POST" }); loadNotifications(); };
  const loadTemplates = useCallback(async () => { try { const r = await fetch(`${BASE}/trade-templates`); const d = await r.json(); setTemplates(d.templates || []); } catch {} }, []);
  const createTemplate = async () => { if (!templateForm.name) return; await fetch(`${BASE}/trade-templates`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(templateForm) }); setTemplateForm({ name: "", strategy: "", entry_rules: "", exit_rules: "", risk_pct: "2", position_type: "swing", notes: "" }); setShowTemplateForm(false); loadTemplates(); };
  const deleteTemplate = async (id: string) => { await fetch(`${BASE}/trade-templates/${id}`, { method: "DELETE" }); loadTemplates(); };
  const loadPeerBenchmarks = async () => { setPeerLoading(true); try { const r = await fetch(`${BASE}/peer-benchmarks`); setPeerData(await r.json()); } catch {} setPeerLoading(false); };
  const loadWebhooks = useCallback(async () => { try { const r = await fetch(`${BASE}/webhooks`); const d = await r.json(); setWebhooks(d.webhooks || []); } catch {} }, []);
  const createWebhook = async () => { if (!webhookForm.url) return; await fetch(`${BASE}/webhooks`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(webhookForm) }); setWebhookForm({ platform: "discord", url: "", events: ["alert_triggered", "trade_closed"] }); setShowWebhookForm(false); loadWebhooks(); };
  const testWebhook = async (id: string) => { await fetch(`${BASE}/webhooks/test`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ webhook_id: id }) }); };
  const loadTradeCoach = async (ticker?: string) => { const t = (ticker || coachTicker).trim().toUpperCase(); if (!t) return; setCoachTicker(t); setCoachLoading(true); try { const r = await fetch(`${BASE}/ai/trade-coach`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ticker: t, position_type: "swing" }) }); setCoachData(await r.json()); } catch {} setCoachLoading(false); };
  const loadWatchlistScan = async () => { setScanLoading(true); try { const r = await fetch(`${BASE}/ai/watchlist-scan`); setScanResult(await r.json()); } catch {} setScanLoading(false); };
  const loadRiskCheck = async () => { setRiskAlertsLoading(true); try { const r = await fetch(`${BASE}/ai/risk-check`); setRiskAlerts(await r.json()); } catch {} setRiskAlertsLoading(false); };
  const loadSentTimeline = async (ticker?: string) => { const t = (ticker || sentTimelineTicker).trim().toUpperCase(); if (!t) return; setSentTimelineTicker(t); setSentTimelineLoading(true); try { const r = await fetch(`${BASE}/ai/sentiment-timeline/${t}`); setSentTimeline(await r.json()); } catch {} setSentTimelineLoading(false); };
  const loadMlPredict = async (ticker?: string) => { const t = (ticker || mlTicker).trim().toUpperCase(); if (!t) return; setMlTicker(t); setMlLoading(true); try { const r = await fetch(`${BASE}/ai/predict/${t}`); setMlPrediction(await r.json()); } catch {} setMlLoading(false); };

  // ── v5.2 Loaders ──────────────────────────────────────────────────
  const runStressTest = async () => { setStressLoading(true); try { const r = await fetch(`${BASE}/stress-test`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ account_key: "default" }) }); setStressResult(await r.json()); } catch {} setStressLoading(false); };
  const loadSeasonality = async (ticker?: string) => { const t = (ticker || seasonTicker).trim().toUpperCase(); if (!t) return; setSeasonTicker(t); setSeasonLoading(true); try { const r = await fetch(`${BASE}/seasonality/${t}`); setSeasonData(await r.json()); } catch {} setSeasonLoading(false); };
  const loadOptionsSkew = async (ticker?: string) => { const t = (ticker || skewTicker).trim().toUpperCase(); if (!t) return; setSkewTicker(t); setSkewLoading(true); try { const r = await fetch(`${BASE}/options-skew/${t}`); setSkewData(await r.json()); } catch {} setSkewLoading(false); };
  const loadAttribution = async () => { setAttribLoading(true); try { const r = await fetch(`${BASE}/attribution`); setAttribData(await r.json()); } catch {} setAttribLoading(false); };
  const runRiskOfRuin = async () => { setRorLoading(true); try { const r = await fetch(`${BASE}/risk-of-ruin`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ win_rate: parseFloat(rorForm.win_rate), avg_win: parseFloat(rorForm.avg_win), avg_loss: parseFloat(rorForm.avg_loss), risk_per_trade: parseFloat(rorForm.risk_per_trade), ruin_threshold: parseFloat(rorForm.ruin_threshold) }) }); setRorResult(await r.json()); } catch {} setRorLoading(false); };
  const loadEquityCurve = async () => { setEqLoading(true); try { const r = await fetch(`${BASE}/equity-curve`); setEqCurve(await r.json()); } catch {} setEqLoading(false); };
  const loadDeepReview = async () => { setDeepReviewLoading(true); try { const r = await fetch(`${BASE}/ai/journal-deep-review`); setDeepReview(await r.json()); } catch {} setDeepReviewLoading(false); };
  const loadDoctor = async () => { setDoctorLoading(true); try { const r = await fetch(`${BASE}/ai/portfolio-doctor`); setDoctorData(await r.json()); } catch {} setDoctorLoading(false); };
  const loadNarrative = async () => { setNarrativeLoading(true); try { const r = await fetch(`${BASE}/ai/market-narrative`); setNarrative(await r.json()); } catch {} setNarrativeLoading(false); };
  const loadComplexAlerts = useCallback(async () => { try { const r = await fetch(`${BASE}/alerts/complex`); const d = await r.json(); setComplexAlerts(d.alerts || []); } catch {} }, []);
  const createComplexAlert = async () => { if (!complexForm.ticker) return; await fetch(`${BASE}/alerts/complex`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...complexForm, conditions: complexForm.conditions.filter(c => c.value) }) }); setShowComplexForm(false); loadComplexAlerts(); };
  const deleteComplexAlert = async (id: string) => { await fetch(`${BASE}/alerts/complex/${id}`, { method: "DELETE" }); loadComplexAlerts(); };
  const loadWorkspaces = useCallback(async () => { try { const r = await fetch(`${BASE}/workspaces`); const d = await r.json(); setWorkspaces(d.workspaces || []); } catch {} }, []);
  const saveWorkspace = async () => { if (!wsName) return; await fetch(`${BASE}/workspaces`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: wsName, active_tab: tab }) }); setWsName(""); setShowWsForm(false); loadWorkspaces(); };
  const deleteWorkspace = async (id: string) => { await fetch(`${BASE}/workspaces/${id}`, { method: "DELETE" }); loadWorkspaces(); };
  const loadLeaderboard = async () => { setLbLoading(true); try { const r = await fetch(`${BASE}/leaderboard`); setLeaderboard(await r.json()); } catch {} setLbLoading(false); };
  const generateReport = async (type?: string) => { setReportLoading(true); try { const r = await fetch(`${BASE}/report/generate?report_type=${type || reportType}`); setReportData(await r.json()); } catch {} setReportLoading(false); };
  const loadNewsComments = useCallback(async () => { try { const r = await fetch(`${BASE}/news/comments`); const d = await r.json(); setNewsComments(d.comments || []); } catch {} }, []);
  const addNewsComment = async (articleId: string, title: string) => { if (!commentText) return; await fetch(`${BASE}/news/comment`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ article_id: articleId, article_title: title, comment: commentText }) }); setCommentText(""); loadNewsComments(); };
  const runNlSearch = async () => { if (!nlQuery) return; setNlLoading(true); try { const r = await fetch(`${BASE}/ai/natural-search`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ query: nlQuery }) }); setNlResult(await r.json()); } catch {} setNlLoading(false); };
  const startVoice = () => { if (!("webkitSpeechRecognition" in window || "SpeechRecognition" in window)) return; const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition; const recognition = new SR(); recognition.continuous = false; recognition.interimResults = false; recognition.lang = "en-US"; recognition.onresult = (e: any) => { const text = e.results[0][0].transcript; setVoiceText(text); setVoiceActive(false); if (text.toLowerCase().includes("analyze")) { const ticker = text.split(" ").pop()?.toUpperCase(); if (ticker) { setAiTicker(ticker); setTab("ai"); setTimeout(() => runAI(ticker), 200); } } else { setNlQuery(text); setTab("ai"); setAiSubTab2("chat" as any); setTimeout(() => runNlSearch(), 200); } }; recognition.onerror = () => setVoiceActive(false); recognition.onend = () => setVoiceActive(false); setVoiceActive(true); recognition.start(); };

  const fetchQuotes = async () => { const syms = tickerInput.split(",").map(t=>t.trim().toUpperCase()).filter(Boolean); if (!syms.length) return; try { const r = await fetch(`${BASE}/quotes?tickers=${syms.join(",")}`); const d = await r.json(); const m:{[t:string]:number|null}={}; (d.data||[]).forEach((q:any)=>{m[q.ticker]=q.price??null;}); setQuotes(m); } catch {} };

  const loadChart = async (ticker?: string, period?: string) => {
    const t = (ticker || chartTicker).trim().toUpperCase(); const p = period || chartPeriod;
    if (!t) return; setChartTicker(t); setChartPeriod(p); setChartLoading(true);
    try {
      const [techRes, quoteRes] = await Promise.all([fetch(`${BASE}/technicals/${t}?period=${p}`), fetch(`${BASE}/quotes?tickers=${t}`)]);
      const techData = await techRes.json(); const quoteData = await quoteRes.json();
      setChartData(techData.candles || []); setChartPrice((quoteData.data || [])[0]?.price ?? null);
    } catch {} setChartLoading(false);
  };

  const goToChart = (ticker: string) => { setTab("charts"); setChartTicker(ticker); setTimeout(() => loadChart(ticker), 100); };

  const runAI = async (ticker?: string) => {
    const t = (ticker || aiTicker).trim().toUpperCase(); if (!t) return;
    setAiTicker(t); setAiLoading(true); setAiResult(null);
    try { const r = await fetch(`${BASE}/ai/analyze/${t}`); setAiResult(await r.json()); } catch (e: any) { setAiResult({ ticker: t, error: e.message }); }
    setAiLoading(false);
  };

  const loadFeeds = async (refresh = false) => { setFeedLoading(true); try { const r = await fetch(refresh ? `${BASE}/feeds/refresh` : `${BASE}/feeds`); const d = await r.json(); setFeedEntries(d.entries||[]); setFeedTrending(d.trending_tickers||[]); } catch {} setFeedLoading(false); };
  const loadStwits = async (ticker?: string) => { const t = (ticker || stwitsTicker).trim().toUpperCase(); if (!t) return; setStwitsTicker(t); setStwitsLoading(true); try { const r = await fetch(`${BASE}/stocktwits/${t}`); setStwits(await r.json()); } catch {} setStwitsLoading(false); };
  const loadSocialFeed = async () => { if (!socialTickers.trim()) return; setSocialLoading(true); try { const r = await fetch(`${BASE}/social/feed?tickers=${socialTickers}`); setSocialFeed(await r.json()); } catch {} setSocialLoading(false); };

  // Community Hub loaders
  const loadDiscordPresence = async () => { setDiscordPresenceLoading(true); try { const r = await fetch(`${BASE}/community/discord/presence`); setDiscordPresence(await r.json()); } catch {} setDiscordPresenceLoading(false); };
  const loadDiscordFeed = async () => { setDiscordFeedLoading(true); try { const r = await fetch(`${BASE}/community/discord/feed`); const d = await r.json(); setDiscordFeed(d.messages || []); } catch {} setDiscordFeedLoading(false); };
  const loadTwitterOembed = async (url?: string) => { const u = (url || twitterTweetUrl).trim(); if (!u) return; setTwitterTweetUrl(u); setTwitterOembedLoading(true); try { const r = await fetch(`${BASE}/community/twitter/oembed?url=${encodeURIComponent(u)}&theme=${dark?"dark":"light"}`); setTwitterOembed(await r.json()); } catch {} setTwitterOembedLoading(false); };
  const loadFeedSources = async () => { try { const r = await fetch(`${BASE}/feeds/sources`); const d = await r.json(); setFeedSources(d.sources || d || []); } catch {} };
  const loadSerenityPrices = async () => { setSerenityLoading(true); try { const tickers = SERENITY_POSITIONS.map(p=>p.ticker).join(","); const r = await fetch(`${BASE}/quotes?tickers=${tickers}`); const d = await r.json(); const prices: Record<string,{price:number;change:number;changePct:number}> = {}; (d.data||[]).forEach((q:any)=>{ if(q.ticker) prices[q.ticker]={price:q.price||0,change:q.change||0,changePct:q.changePercent||0}; }); setSerenityPrices(prices); } catch {} setSerenityLoading(false); };

  const loadSerenitySignals = async () => { setSerenitySignalsLoading(true); try { const [newRes, histRes] = await Promise.all([fetch(`${BASE}/signals?source=serenity&status=new&limit=5`), fetch(`${BASE}/signals?source=serenity&limit=20`)]); const newD = await newRes.json(); const histD = await histRes.json(); setSerenitySignals(newD.signals || newD.data || newD || []); setSerenitySignalHistory(histD.signals || histD.data || histD || []); } catch {} setSerenitySignalsLoading(false); };
  const pollSerenitySignals = async () => { setSerenityPolling(true); try { const r = await fetch(`${BASE}/signals/poll/twitter/aleabitoreddit`, { method: "POST" }); const d = await r.json(); const count = d.new_signals || d.count || 0; setSerenityPolling(false); loadSerenitySignals(); return count; } catch { setSerenityPolling(false); return 0; } };

  // X Curated Feed loaders
  const loadXTimeline = async () => { setXTimelineLoading(true); try { const r = await fetch(`${BASE}/signals/feed/timeline?limit=100`); const d = await r.json(); setXTimeline(d.feed || []); } catch {} setXTimelineLoading(false); };
  const loadXWatchlist = async () => { setXWatchlistLoading(true); try { const r = await fetch(`${BASE}/signals/curated-watchlist`); const d = await r.json(); setXWatchlist(d.watchlist || []); } catch {} setXWatchlistLoading(false); };
  const pollFollowingFeed = async () => { setXPolling(true); try { const r = await fetch(`${BASE}/signals/poll/following`, { method: "POST" }); const d = await r.json(); setXLastPolled(new Date().toLocaleTimeString()); setXPolling(false); loadXTimeline(); loadXWatchlist(); return d.total_new || 0; } catch { setXPolling(false); return 0; } };
  const parseXPosts = async () => {
    const raw = xPasteText.trim(); if (!raw) return;
    setXParsing(true); setXParseResult("");
    // Split posts by double newline or "---" separator
    const chunks = raw.split(/\n{2,}|^-{3,}$/m).map(s => s.trim()).filter(s => s.length > 5);
    // Try to extract @handle from each chunk (first @mention or "From @handle")
    const posts = chunks.map(text => {
      const handleMatch = text.match(/@(\w+)/);
      return { text, source: handleMatch ? handleMatch[1] : "manual" };
    });
    try {
      const r = await fetch(`${BASE}/signals/parse/bulk`, { method: "POST", headers: {"Content-Type":"application/json"}, body: JSON.stringify({ posts }) });
      const d = await r.json();
      setXParseResult(`Parsed ${d.parsed} signal${d.parsed !== 1 ? "s" : ""} from ${posts.length} post${posts.length !== 1 ? "s" : ""}`);
      setXPasteText("");
      loadXTimeline(); loadXWatchlist();
    } catch { setXParseResult("Error parsing posts"); }
    setXParsing(false);
  };
  const addManualSignal = async (text: string, source: string) => { try { await fetch(`${BASE}/signals/manual`, { method: "POST", headers: {"Content-Type":"application/json"}, body: JSON.stringify({ ticker: "SCAN", source, thesis: text, raw_text: text, action: "WATCH" }) }); loadXTimeline(); loadXWatchlist(); } catch {} };

  // ── Signal Intelligence Functions ──
  const loadPnlTracker = async () => { setPnlLoading(true); try { const r = await fetch(`${BASE}/signals/pnl-tracker`); const d = await r.json(); setPnlData(d.signals || []); } catch(e) { console.error(e); } setPnlLoading(false); };
  const loadThemes = async () => { setThemesLoading(true); try { const r = await fetch(`${BASE}/signals/themes`); const d = await r.json(); setThemes(d.themes || []); } catch(e) { console.error(e); } setThemesLoading(false); };
  const loadSignalBrief = async () => { setBriefLoading(true); try { const r = await fetch(`${BASE}/signals/morning-brief`); const d = await r.json(); setSignalBrief(d.brief || ""); } catch(e) { console.error(e); } setBriefLoading(false); };
  const loadPortfolioOverlap = async () => { setOverlapLoading(true); try { const r = await fetch(`${BASE}/signals/portfolio-overlap`); const d = await r.json(); setPortfolioOverlap(d.overlaps || []); } catch(e) { console.error(e); } setOverlapLoading(false); };
  const loadConvictionScores = async () => { setConvictionLoading(true); try { const r = await fetch(`${BASE}/signals/conviction-scores`); const d = await r.json(); setConvictionScores(d.scores || []); } catch(e) { console.error(e); } setConvictionLoading(false); };
  const createAutoAlerts = async () => { try { const r = await fetch(`${BASE}/signals/auto-alerts`, { method: "POST" }); const d = await r.json(); alert(`Created ${d.created || 0} auto-alerts from signal levels`); } catch(e) { console.error(e); } };
  const loadEarningsCross = async () => { setEarningsXLoading(true); try { const r = await fetch(`${BASE}/signals/earnings-crossref`); const d = await r.json(); setEarningsCross(d.tickers || []); } catch(e) { console.error(e); } setEarningsXLoading(false); };
  const loadSectorHeatmapData = async () => { setSectorHeatmapLoading(true); try { const r = await fetch(`${BASE}/signals/sector-heatmap`); const d = await r.json(); setSectorHeatmapData(d.sectors || []); } catch(e) { console.error(e); } setSectorHeatmapLoading(false); };
  const loadDarkpoolData = async () => { setDarkpoolLoading(true); try { const r = await fetch(`${BASE}/signals/darkpool-insider`); const d = await r.json(); setDarkpoolData(d.tickers || []); } catch(e) { console.error(e); } setDarkpoolLoading(false); };

  const runScreener = async (universe?: string, sort?: string, dir?: string) => {
    const u = universe || screenUniverse; const s = sort || screenSort; const d = dir || screenSortDir; setScreenLoading(true);
    try {
      let url = `${BASE}/screener?universe=${u}&sort_by=${s}&sort_dir=${d}&limit=80`;
      if (screenSector) url += `&sector=${encodeURIComponent(screenSector)}`;
      if (screenMinCap) url += `&min_market_cap=${parseFloat(screenMinCap) * 1e9}`;
      if (screenMaxPe) url += `&max_pe=${screenMaxPe}`;
      if (screenMinVol) url += `&min_volume=${parseFloat(screenMinVol) * 1e6}`;
      if (screenCustom) url = `${BASE}/screener?tickers=${screenCustom}&sort_by=${s}&sort_dir=${d}&limit=80`;
      const r = await fetch(url); const data = await r.json();
      setScreenResults(data.results || []); setScreenSectors(data.sectors || []);
    } catch {} setScreenLoading(false);
  };

  // Options
  const loadOptions = async (ticker?: string) => {
    const t = (ticker || optTicker).trim().toUpperCase(); if (!t) return;
    setOptTicker(t); setOptLoading(true);
    try {
      const [chainRes, unusualRes] = await Promise.all([fetch(`${BASE}/options/${t}`), fetch(`${BASE}/options/${t}/unusual`)]);
      const chain = await chainRes.json(); const unusual = await unusualRes.json();
      setOptChain(chain); setOptUnusual(unusual.unusual || []);
    } catch {} setOptLoading(false);
  };

  // Robinhood
  const rhLogin = async (mfaCode?: string) => {
    setRhLoading(true);
    try {
      const body = mfaCode ? { mfa_code: mfaCode } : {};
      const r = await fetch(`${BASE}/rh/login`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const d = await r.json();
      if (d.status === "logged_in") { loadRhPortfolio(); loadRhOrders(); }
      setRhStatus(d);
    } catch {} setRhLoading(false);
  };
  const loadRhPortfolio = async () => { try { const r = await fetch(`${BASE}/rh/portfolio`); setRhPortfolio(await r.json()); } catch {} };
  const loadRhOrders = async () => { try { const r = await fetch(`${BASE}/rh/orders`); const d = await r.json(); setRhOrders(d.orders || []); } catch {} };

  // ── Goals ──────────────────────────────────────────────────────────
  const loadGoals = useCallback(async () => { try { const r = await fetch(`${BASE}/goals`); const d = await r.json(); setGoals(d.goals || []); } catch {} }, []);
  const addGoal = async () => {
    if (!goalForm.name || !goalForm.target_amount) return;
    await fetch(`${BASE}/goals`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: goalForm.name, target_amount: parseFloat(goalForm.target_amount), type: goalForm.type }) });
    setGoalForm({ name: "", target_amount: "", type: "portfolio_value" }); setShowGoalForm(false); loadGoals();
  };
  const deleteGoal = async (id: string) => { await fetch(`${BASE}/goals/${id}`, { method: "DELETE" }); loadGoals(); };

  // ── AI Feature Loaders ──────────────────────────────────────────────
  const loadMorningBriefing = useCallback(async () => {
    setBriefingLoading(true);
    try { const r = await fetch(`${BASE}/ai/morning-briefing`); const d = await r.json(); setMorningBriefing(d); } catch {}
    setBriefingLoading(false);
  }, []);
  const loadRegime = useCallback(async () => {
    try { const r = await fetch(`${BASE}/ai/regime`); const d = await r.json(); setRegime(d); } catch {}
  }, []);

  // ── Init (tracked loading) ──────────────────────────────────────────
  useEffect(() => {
    const bootSteps = [
      { fn: loadMacro, label: "MARKET DATA" },
      { fn: loadNews, label: "NEWS FEEDS" },
      { fn: loadBreaking, label: "BREAKING NEWS" },
      { fn: loadFidelityPositions.bind(null, true), label: "FIDELITY PORTFOLIO" },
      { fn: loadPortfolio, label: "PORTFOLIO" },
      { fn: loadWatchlist, label: "WATCHLIST" },
      { fn: loadRegime, label: "AI REGIME ANALYSIS" },
      { fn: loadAlerts, label: "ALERTS" },
      { fn: loadCalendar, label: "CALENDAR" },
      { fn: loadDailyPnl, label: "P&L DATA" },
      { fn: loadConvictions, label: "CONVICTIONS" },
      { fn: loadKeywords, label: "KEYWORDS" },
      { fn: loadNewsAlerts, label: "NEWS ALERTS" },
      { fn: loadJournal, label: "TRADE JOURNAL" },
      { fn: loadEarnings, label: "EARNINGS" },
      { fn: loadRhStatus, label: "BROKER STATUS" },
      { fn: loadFidAccounts, label: "ACCOUNTS" },
      { fn: loadMmStatus, label: "MARKET MAKER" },
      { fn: loadGoals, label: "GOALS" },
      { fn: loadOutlook, label: "OUTLOOK" },
      { fn: loadNamedWatchlists, label: "WATCHLISTS" },
      { fn: loadSavedScreens, label: "SCREENERS" },
      { fn: loadAllAccounts, label: "ALL ACCOUNTS" },
      { fn: loadTradePlans, label: "TRADE PLANS" },
      { fn: loadWheel, label: "WHEEL STRATEGY" },
      { fn: loadNotifications, label: "NOTIFICATIONS" },
      { fn: loadTemplates, label: "TEMPLATES" },
      { fn: loadWebhooks, label: "WEBHOOKS" },
      { fn: loadComplexAlerts, label: "COMPLEX ALERTS" },
      { fn: loadWorkspaces, label: "WORKSPACES" },
      { fn: loadNewsComments, label: "COMMENTS" },
      { fn: loadNewsIntelligence, label: "NEWS INTELLIGENCE" },
      { fn: loadBookmarks, label: "BOOKMARKS" },
      { fn: loadMarketPulse, label: "MARKET PULSE" },
    ];
    let completed = 0;
    const minDelay = new Promise(r => setTimeout(r, 2500));
    const allLoads = bootSteps.map(step =>
      Promise.resolve(step.fn()).then(() => {
        completed++;
        setLoadProgress(Math.round((completed / bootSteps.length) * 100));
        setLoadPhase(step.label);
      }).catch(() => {
        completed++;
        setLoadProgress(Math.round((completed / bootSteps.length) * 100));
      })
    );
    Promise.all([Promise.all(allLoads), minDelay]).then(() => {
      setLoadPhase("READY");
      setLoadProgress(100);
      setTimeout(() => { setBootFading(true); setTimeout(() => setAppReady(true), 500); }, 300);
    });
    // Load saved theme
    fetch(`${BASE}/settings/theme`).then(r => r.json()).then(d => { if (d.theme === "light") setDark(false); }).catch(() => {});
    if ("Notification" in window && Notification.permission === "granted") setNotifEnabled(true);
    const t1 = setInterval(() => { loadMacro(); loadMarketPulse(); }, 30000);
    const t2 = setInterval(() => { loadNews(); loadBreaking(); loadNewsAlerts(); loadNewsIntelligence(); }, 60000);
    const t3 = setInterval(loadAlerts, 30000);
    const t4 = setInterval(loadUnreadAlerts, 30000);
    // Live Fidelity portfolio refresh every 30s (backend fetches real-time prices)
    const t5 = setInterval(() => { loadFidelityPositions(false); }, 30000);
    return () => { clearInterval(t1); clearInterval(t2); clearInterval(t3); clearInterval(t4); clearInterval(t5); };
  }, []);
  useEffect(() => {
    const portTickers = Object.keys(portfolio);
    const allTickers = [...new Set([...watchlist, ...portTickers])];
    if (allTickers.length) {
      loadWlPrices(allTickers);
      // Retry after 3s to pick up prices that were cold-cached on first fetch
      const retry = setTimeout(() => loadWlPrices(allTickers), 3000);
      // Refresh prices every 15s
      const interval = setInterval(() => loadWlPrices(allTickers), 15000);
      return () => { clearTimeout(retry); clearInterval(interval); };
    }
  }, [watchlist, portfolio]);

  // Sector breakdown loader
  useEffect(() => {
    if (fidelitySummary && !sectorBreakdown) {
      fetch(`${BASE}/portfolio/fidelity-positions/sectors`).then(r => r.json()).then(setSectorBreakdown).catch(() => {});
    }
  }, [fidelitySummary]);

  // Community Hub: Discord polling when on social tab
  useEffect(() => {
    if (tab === "social") {
      loadDiscordPresence(); loadDiscordFeed();
      const interval = setInterval(() => { loadDiscordPresence(); loadDiscordFeed(); }, 30000);
      return () => clearInterval(interval);
    }
  }, [tab]);

  // Community Hub: Load feeds when switching to Substack sub-tab
  useEffect(() => {
    if (tab === "social" && socialSubTab === "substack") { loadFeeds(); loadFeedSources(); }
  }, [tab, socialSubTab]);

  // Community Hub: Load Serenity prices when switching to Serenity sub-tab
  useEffect(() => {
    if (tab === "social" && socialSubTab === "serenity") { loadSerenityPrices(); }
  }, [tab, socialSubTab]);

  // Serenity signals: Load when switching to Serenity sub-tab
  useEffect(() => {
    if (tab === "social" && socialSubTab === "serenity") { loadSerenitySignals(); }
  }, [tab, socialSubTab]);

  // Signal new count: Poll every 30s when on social tab
  useEffect(() => {
    if (tab !== "social") return;
    const fetchCount = async () => { try { const r = await fetch(`${BASE}/signals/stats`); const d = await r.json(); setSignalNewCount(d.by_status?.new || 0); } catch {} };
    fetchCount();
    const iv = setInterval(fetchCount, 30000);
    return () => clearInterval(iv);
  }, [tab]);

  // Community Hub: Load X curated feed when switching to Twitter sub-tab
  useEffect(() => {
    if (tab === "social" && socialSubTab === "twitter") {
      loadXTimeline(); loadXWatchlist();
    }
  }, [tab, socialSubTab]);

  // Community Hub: Load Twitter widget script when switching to Twitter sub-tab
  useEffect(() => {
    if (tab === "social" && (socialSubTab === "twitter" || socialSubTab === "serenity") && !twitterWidgetLoaded) {
      if ((window as any).twttr) { setTwitterWidgetLoaded(true); return; }
      const s = document.createElement("script");
      s.src = "https://platform.twitter.com/widgets.js";
      s.async = true;
      s.onload = () => setTwitterWidgetLoaded(true);
      document.body.appendChild(s);
    }
  }, [tab, socialSubTab, twitterWidgetLoaded]);

  // Community Hub: Re-render Twitter widgets after oEmbed or search changes
  useEffect(() => {
    if (twitterWidgetLoaded) { (window as any).twttr?.widgets?.load(); }
  }, [twitterOembed, twitterSearchTicker, twitterWidgetLoaded, dark]);

  // Community Hub: Re-render Twitter widgets when following view changes
  useEffect(() => {
    if (twitterWidgetLoaded && xFollowingView) { setTimeout(() => (window as any).twttr?.widgets?.load(), 100); }
  }, [xFollowingView, twitterWidgetLoaded]);

  // Community Hub: Re-render Twitter widgets for Serenity tab
  useEffect(() => {
    if (twitterWidgetLoaded && socialSubTab === "serenity") { setTimeout(() => (window as any).twttr?.widgets?.load(), 200); }
  }, [socialSubTab, twitterWidgetLoaded]);

  // ── Keyboard Shortcuts ───────────────────────────────────────────────
  useEffect(() => {
    const SHORTCUT_TABS = ["dashboard","charts","ai","feeds","screener","options","robinhood","quotes","watchlist"];
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isInput = target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.tagName === "SELECT" || target.isContentEditable;
      // Cmd/Ctrl+K — command bar (always)
      if ((e.metaKey || e.ctrlKey) && e.key === "k") { e.preventDefault(); setCmdOpen(o => !o); return; }
      // Escape — close modals
      if (e.key === "Escape") { setCmdOpen(false); setShowShortcuts(false); return; }
      // Don't handle shortcuts when typing in inputs
      if (isInput) return;
      // ? — show shortcuts help
      if (e.key === "?" && !e.metaKey && !e.ctrlKey) { e.preventDefault(); setShowShortcuts(s => !s); return; }
      // 1-9 — switch tabs
      if (e.key >= "1" && e.key <= "9" && !e.metaKey && !e.ctrlKey && !e.altKey) {
        const idx = parseInt(e.key) - 1;
        if (idx < SHORTCUT_TABS.length) { e.preventDefault(); setTab(SHORTCUT_TABS[idx]); }
        return;
      }
      // Ctrl/Cmd+Shift shortcuts
      if ((e.metaKey || e.ctrlKey) && e.shiftKey) {
        switch (e.key.toLowerCase()) {
          case "a": e.preventDefault(); setTab("ai"); break;
          case "c": e.preventDefault(); setTab("charts"); break;
          case "p": e.preventDefault(); setTab("portfolio"); break;
          case "j": e.preventDefault(); setTab("journal"); break;
          case "e": e.preventDefault(); setTab("earnings"); break;
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Portfolio math
  const portfolioRows = Object.entries(portfolio).map(([ticker, h]) => {
    const price = wlPrices[ticker] ?? null;
    const mktVal = price != null ? price * h.shares : null;
    const cost = h.cost_basis * h.shares;
    const pnl = mktVal != null ? mktVal - cost : null;
    const pnlPct = pnl != null && cost > 0 ? (pnl / cost) * 100 : null;
    const weight = 0; // filled below
    return { ticker, ...h, price, mktVal, cost, pnl, pnlPct, weight };
  });
  const totalPnl = portfolioRows.reduce((s,r) => s + (r.pnl ?? 0), 0);
  const totalMktVal = portfolioRows.reduce((s,r) => s + (r.mktVal ?? 0), 0);
  const totalCost = portfolioRows.reduce((s,r) => s + r.cost, 0);
  const optionsValue = portfolioOptions.reduce((s,o) => s + (o.current_value || 0), 0);
  const totalAccountValue = totalMktVal + portfolioCash + optionsValue;
  const totalAccountPnl = totalMktVal - totalCost + portfolioOptions.reduce((s,o) => s + (o.pnl || 0), 0);
  const totalAccountPnlPct = totalCost > 0 ? (totalAccountPnl / totalCost) * 100 : 0;
  portfolioRows.forEach(r => { r.weight = totalAccountValue > 0 ? ((r.mktVal || 0) / totalAccountValue) * 100 : 0; });

  // Risk metrics
  const sortedByWeight = [...portfolioRows].sort((a, b) => (b.weight || 0) - (a.weight || 0));
  const top3Concentration = sortedByWeight.slice(0, 3).reduce((s, r) => s + (r.weight || 0), 0);
  const hhi = portfolioRows.reduce((s, r) => s + (r.weight / 100) ** 2, 0);
  const diversificationScore = Math.round((1 - hhi) * 100);

  // Actions
  const addWatchlist = async () => { const t=wlInput.trim().toUpperCase(); if(!t) return; await fetch(`${BASE}/watchlist`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({ticker:t})}); setWlInput(""); loadWatchlist(); };
  const removeWatchlist = async (t:string) => { await fetch(`${BASE}/watchlist/${t}`,{method:"DELETE"}); loadWatchlist(); };
  const addKeyword = async () => { const k=kwInput.trim().toLowerCase(); if(!k) return; await fetch(`${BASE}/keywords`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({keyword:k})}); setKwInput(""); loadKeywords(); };
  const removeKeyword = async (k:string) => { await fetch(`${BASE}/keywords/${encodeURIComponent(k)}`,{method:"DELETE"}); loadKeywords(); };
  const addAlert = async () => { if(!alTicker||!alPrice) return; await fetch(`${BASE}/alerts`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({ticker:alTicker.toUpperCase(),condition:alCond,price:parseFloat(alPrice)})}); addToast(`Alert set: ${alTicker.toUpperCase()} ${alCond} $${alPrice}`, "success"); setAlTicker(""); setAlPrice(""); loadAlerts(); };
  const deleteAlert = async (id:string) => { await fetch(`${BASE}/alerts/${id}`,{method:"DELETE"}); addToast("Alert removed", "info"); loadAlerts(); };
  const addPortfolio = async () => { if(!ptTicker||!ptShares) return; await fetch(`${BASE}/portfolio/${portfolioName}`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({ticker:ptTicker.toUpperCase(),shares:parseFloat(ptShares),cost_basis:parseFloat(ptCost||"0")})}); addToast(`Added ${ptTicker.toUpperCase()} to portfolio`, "success"); setPtTicker(""); setPtShares(""); setPtCost(""); loadPortfolio(); };
  const deletePortfolio = async (t:string) => { await fetch(`${BASE}/portfolio/${portfolioName}/${t}`,{method:"DELETE"}); addToast(`Removed ${t} from portfolio`, "info"); loadPortfolio(); };
  const addConviction = async () => { if(!convForm.trader||!convForm.ticker) return; await fetch(`${BASE}/convictions`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({...convForm,entry_target:parseFloat(convForm.entry_target||"0"),price_target:parseFloat(convForm.price_target||"0")})}); setConvForm({trader:"",ticker:"",thesis:"",entry_target:"",price_target:"",notes:""}); setShowConvForm(false); loadConvictions(); };
  const updateConvStatus = async (id:string,status:string) => { await fetch(`${BASE}/convictions/${id}`,{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({status})}); loadConvictions(); };
  const deleteConviction = async (id:string) => { await fetch(`${BASE}/convictions/${id}`,{method:"DELETE"}); loadConvictions(); };
  const importGaetano = async () => { for(const t of GAETANO_TICKERS){await fetch(`${BASE}/convictions`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({trader:"Gaetano",ticker:t,thesis:"Photonics/industrial thesis",status:"watching"})});} loadConvictions(); };
  const addTrade = async () => { if(!tradeForm.ticker||!tradeForm.entry_price||!tradeForm.quantity) return; await fetch(`${BASE}/journal`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({ticker:tradeForm.ticker.toUpperCase(),side:tradeForm.side,entry_price:parseFloat(tradeForm.entry_price),quantity:parseFloat(tradeForm.quantity),stop_loss:tradeForm.stop_loss?parseFloat(tradeForm.stop_loss):null,take_profit:tradeForm.take_profit?parseFloat(tradeForm.take_profit):null,notes:tradeForm.notes})}); setTradeForm({ticker:"",side:"long",entry_price:"",quantity:"",stop_loss:"",take_profit:"",notes:""}); setShowTradeForm(false); loadJournal(); };
  const closeTrade = async (id:string, exitPrice:string) => { if(!exitPrice) return; await fetch(`${BASE}/journal/${id}`,{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify({exit_price:parseFloat(exitPrice)})}); loadJournal(); };
  const deleteTrade = async (id:string) => { await fetch(`${BASE}/journal/${id}`,{method:"DELETE"}); loadJournal(); };

  const filteredConvictions = convFilter==="all" ? convictions : convictions.filter(c=>c.status===convFilter);

  // Theme classes — Professional Flat Design
  const bg = dark ? "terminal-bg-dark text-zinc-300" : "terminal-bg-light text-zinc-700";
  const cardBg = dark ? "terminal-card-dark rounded-lg" : "terminal-card-light rounded-lg";
  const headerBg = dark ? "terminal-header-dark" : "terminal-header-light";
  const inputCls = dark ? "bg-zinc-900 border-zinc-700 text-zinc-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20" : "bg-white border-zinc-300 text-zinc-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20";
  const input = `${inputCls} px-3 py-2 text-sm focus:outline-none rounded-md font-mono border transition-colors`;
  const btn = dark ? "bg-blue-600 hover:bg-blue-500 text-white px-3 py-2 text-sm font-medium rounded-md transition-colors" : "bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 text-sm font-medium rounded-md transition-colors";
  const btnOutline = dark ? "border border-zinc-700 text-zinc-400 px-3 py-2 text-sm rounded-md hover:border-zinc-500 hover:text-zinc-200 hover:bg-zinc-800 transition-colors" : "border border-zinc-300 text-zinc-600 px-3 py-2 text-sm rounded-md hover:border-zinc-400 hover:text-zinc-800 hover:bg-zinc-50 transition-colors";
  const dimText = dark ? "text-zinc-500" : "text-zinc-500";
  const dimText2 = dark ? "text-zinc-600" : "text-zinc-400";
  const dimText3 = dark ? "text-zinc-700" : "text-zinc-300";
  const bodyText = dark ? "text-zinc-300" : "text-zinc-700";
  const headText = dark ? "text-zinc-100" : "text-zinc-900";
  const borderDim = dark ? "border-zinc-800" : "border-zinc-200";
  const borderDim2 = dark ? "border-zinc-800/60" : "border-zinc-100";

  const tabs = [
    { id:"dashboard",   label:"Dash",        icon:"◈" },
    { id:"charts",      label:"Charts",      icon:"📊" },
    { id:"ai",          label:"AI",          icon:"🧠" },
    { id:"feeds",       label:"Feeds",       icon:"📡" },
    { id:"screener",    label:"Screen",      icon:"🔍" },
    { id:"options",     label:"Options",     icon:"⚡" },
    { id:"robinhood",   label:"Broker",      icon:"🏦" },
    { id:"quotes",      label:"Quotes",      icon:"$" },
    { id:"watchlist",   label:"Watch",       icon:"👁" },
    { id:"portfolio",   label:"Folio",       icon:"💼" },
    { id:"journal",     label:"Journal",     icon:"📒" },
    { id:"alerts",      label:"Alerts",      icon:"🔔" },
    { id:"news",        label:"News",        icon:"📰" },
    { id:"convictions", label:"Conv",        icon:"🎯" },
    { id:"heatmap",     label:"Heat",        icon:"🟥" },
    { id:"divs",        label:"Divs",        icon:"💰" },
    { id:"perf",        label:"Perf",        icon:"📉" },
    { id:"backtest",    label:"BkTst",       icon:"🔬" },
    { id:"analytics",   label:"Anlytx",      icon:"📈" },
    { id:"optcalc",     label:"OptCalc",     icon:"🔢" },
    { id:"earnings",    label:"Earn",        icon:"📅" },
    { id:"calendar",    label:"Cal",         icon:"🗓" },
    { id:"macro",       label:"Macro",       icon:"🌍" },
    { id:"photonics",  label:"Photon",      icon:"🔬" },
    { id:"crypto",      label:"Crypto",      icon:"₿" },
    { id:"correlation", label:"Corr",        icon:"🔗" },
    { id:"sectors",     label:"Sectors",     icon:"🔄" },
    { id:"plans",       label:"Plans",       icon:"📋" },
    { id:"pnlcal",      label:"P&L Cal",     icon:"📆" },
    { id:"wheel",       label:"Wheel",       icon:"🎡" },
    { id:"futures",     label:"Fx/Fut",      icon:"🌐" },
    { id:"possize",     label:"Size",        icon:"📐" },
    { id:"riskparity",  label:"RiskP",       icon:"⚖️" },
    { id:"bracket",     label:"Bracket",     icon:"🔲" },
    { id:"sentiment",   label:"Sent",        icon:"💬" },
    { id:"patterns",    label:"Patterns",    icon:"🔮" },
    { id:"montecarlo",  label:"MC Sim",      icon:"🎲" },
    { id:"mpt",         label:"MPT",         icon:"📊" },
    { id:"breadth",     label:"Breadth",     icon:"📶" },
    { id:"ivrank",      label:"IV Rank",     icon:"📉" },
    { id:"greeks",      label:"Greeks",      icon:"Δ" },
    { id:"multileg",    label:"MultiLeg",    icon:"🔀" },
    { id:"insider",     label:"Insider",     icon:"👤" },
    { id:"darkpool",    label:"DkPool",      icon:"🌑" },
    { id:"templates",   label:"Tmplts",      icon:"📝" },
    { id:"peers",       label:"Peers",       icon:"🏆" },
    { id:"webhooks",    label:"Hooks",       icon:"🔗" },
    { id:"stresstest",  label:"Stress",      icon:"💥" },
    { id:"seasonality", label:"Season",      icon:"🌿" },
    { id:"skew",        label:"Skew",        icon:"📐" },
    { id:"attribution", label:"Attrib",      icon:"🎯" },
    { id:"riskruin",    label:"Ruin",        icon:"☠️" },
    { id:"eqcurve",     label:"EqCurve",     icon:"📈" },
    { id:"leaderboard", label:"Leader",      icon:"🏅" },
    { id:"report",      label:"Report",      icon:"📄" },
    { id:"social",      label:"Social",      icon:"💬" },
    { id:"warmacro",    label:"War/Macro",   icon:"🎖" },
    { id:"margin",      label:"Margin",      icon:"💸" },
    { id:"health",      label:"Health",      icon:"🩺" },
    { id:"costbasis",   label:"Cost Basis",  icon:"💰" },
    { id:"optchain",    label:"Chain",       icon:"⛓" },
    { id:"growth",      label:"Growth",      icon:"🚀" },
    { id:"ccincome",    label:"CC Income",   icon:"💵" },
    { id:"geomonitor",  label:"Geo",         icon:"🌐" },
    { id:"fidsync",     label:"Fid Sync",    icon:"📤" },
    { id:"eqcurve2",    label:"Eq Curve",    icon:"📉" },
    { id:"dividends",   label:"Divs",        icon:"💎" },
    { id:"tradereplay", label:"Replay",      icon:"🎬" },
    { id:"pricealerts", label:"P Alerts",    icon:"🔔" },
    { id:"corrmatrix",  label:"Corr",        icon:"🔗" },
    { id:"earnprep",    label:"Earn Prep",   icon:"📊" },
    { id:"multiacct",   label:"Accounts",    icon:"🏦" },
    { id:"mktintel",    label:"Intel",       icon:"🧠" },
    { id:"notifcenter", label:"Alerts Hub",  icon:"🔔" },
    { id:"trump",       label:"Trump",      icon:"🏛" },
    { id:"possizer",    label:"Sizer",      icon:"📐" },
    { id:"sectorexp",   label:"Exposure",   icon:"🎯" },
    { id:"instl",       label:"Inst.",      icon:"🏦" },
    { id:"socialfeed",  label:"Signals",    icon:"📡" },
    { id:"serenity",    label:"Serenity",   icon:"🔮" },
  ];

  const cats:{cat:string,items:{id:string,label:string,icon:string}[]}[] = [
    {cat:"Dashboard", items:[{id:"dashboard",label:"Dashboard",icon:"◈"}]},
    {cat:"Charts", items:tabs.filter(t=>["charts","robinhood","quotes","watchlist","heatmap"].includes(t.id))},
    {cat:"Social", items:tabs.filter(t=>["social","feeds","news","sentiment","socialfeed","serenity"].includes(t.id))},
    {cat:"Photonics", items:tabs.filter(t=>["photonics","screener","analytics"].includes(t.id))},
    {cat:"Portfolio", items:tabs.filter(t=>["portfolio","journal","perf","convictions","pnlcal","eqcurve","attribution","margin","health","growth","eqcurve2","dividends","fidsync","corrmatrix","multiacct","sectorexp"].includes(t.id))},
    {cat:"AI", items:tabs.filter(t=>["ai","backtest","patterns","montecarlo","mpt","tradereplay"].includes(t.id))},
    {cat:"Options", items:tabs.filter(t=>["options","optcalc","greeks","multileg","ivrank","skew","wheel","costbasis","optchain","ccincome"].includes(t.id))},
    {cat:"Markets", items:tabs.filter(t=>["sectors","crypto","breadth","macro","correlation","futures","insider","darkpool","warmacro","geomonitor","mktintel","trump","instl"].includes(t.id))},
    {cat:"Planning", items:tabs.filter(t=>["plans","alerts","earnings","calendar","divs","seasonality","pricealerts","earnprep","notifcenter"].includes(t.id))},
    {cat:"Risk", items:tabs.filter(t=>["possize","riskparity","stresstest","riskruin","bracket","peers","leaderboard","report","webhooks","templates","possizer"].includes(t.id))},
  ];

  // Sync activeCategory when tab changes
  useEffect(() => {
    const found = cats.find(c => c.items.some(i => i.id === tab));
    if (found && found.cat !== activeCategory) setActiveCategory(found.cat);
  }, [tab]);

  return (
    <>
    {/* ── LOADING SCREEN ── */}
    {!appReady && (
      <div className={`fixed inset-0 z-[100] flex flex-col items-center justify-center transition-opacity duration-500 ${bootFading ? "opacity-0 pointer-events-none" : "opacity-100"}`}
        style={{ background: "linear-gradient(135deg, #06080d 0%, #0a0f1a 30%, #0d1220 60%, #080c14 100%)" }}>
        <div className="boot-grid absolute inset-0" />
        <div className="boot-scanline" />
        <div className="relative z-10 flex flex-col items-center gap-8 px-6">
          {/* Logo */}
          <div className="text-center">
            <div className="text-4xl sm:text-5xl font-bold tracking-tight text-gradient mb-2">Stock Terminal</div>
            <div className="text-xs font-mono text-slate-600 tracking-[0.3em] uppercase">Professional Trading Platform</div>
          </div>
          {/* Progress */}
          <div className="w-72 sm:w-96 space-y-3">
            <div className="h-1 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
              <div className="h-full rounded-full bg-blue-600 transition-all duration-300 ease-out"
                style={{ width: `${loadProgress}%` }} />
            </div>
            <div className="flex justify-between items-center">
              <div className="text-[11px] font-mono text-blue-500/80 tracking-wider">
                {loadPhase}<span className="terminal-cursor" />
              </div>
              <div className="text-[11px] font-mono text-slate-600">{loadProgress}%</div>
            </div>
          </div>
          {/* Status lines */}
          <div className="text-[10px] font-mono text-slate-700 space-y-1 text-center">
            <div>{loadProgress > 10 ? "✓" : "○"} Market data connection</div>
            <div>{loadProgress > 40 ? "✓" : "○"} Portfolio sync</div>
            <div>{loadProgress > 70 ? "✓" : "○"} AI analysis engine</div>
            <div>{loadProgress > 95 ? "✓" : "○"} Systems ready</div>
          </div>
        </div>
      </div>
    )}

    <div className={`min-h-screen flex flex-col text-sm ${bg} transition-colors duration-300`}>
        <style dangerouslySetInnerHTML={{ __html: GLOBAL_STYLES }} />
      <header className={`sticky top-0 z-40 px-5 py-2 flex items-center gap-3 ${headerBg}`} style={{borderBottom: dark ? "1px solid #27272a" : "1px solid #e4e4e7"}}>
        <div className="flex items-center gap-3">
          <span className={`text-sm font-semibold tracking-tight ${dark?"text-zinc-100":"text-zinc-900"}`}>JK</span>
          <div className={`w-px h-4 ${dark?"bg-zinc-800":"bg-zinc-200"}`}/>
        </div>

        {/* Desktop nav */}
        <nav className="hidden md:flex gap-0.5 overflow-x-auto scrollbar-hide flex-1">
          {cats.map(c => {
            const isActive = c.cat === activeCategory;
            return (
              <button key={c.cat}
                onClick={() => { setActiveCategory(c.cat); if (c.cat !== activeCategory || c.cat === "Dashboard") setTab(c.items[0].id); }}
                className={`px-2.5 py-1.5 text-[13px] rounded-md transition-colors whitespace-nowrap ${isActive?(dark?"bg-zinc-800 text-zinc-100 font-medium":"bg-zinc-100 text-zinc-900 font-medium"):dark?"text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50":"text-zinc-500 hover:text-zinc-700 hover:bg-zinc-50"}`}>
                {c.cat === "Dashboard" ? "Dashboard" : c.cat}
              </button>
            );
          })}
        </nav>

        {/* Mobile hamburger */}
        <button onClick={()=>setMobileNav(v=>!v)} className={`md:hidden text-lg px-1 ${dark?"text-zinc-400":"text-zinc-600"}`}>☰</button>

        <div className="flex items-center gap-1.5 ml-auto shrink-0">
          <button onClick={() => setCmdOpen(true)} className={`px-2.5 py-1 rounded-md text-[13px] transition-colors hidden sm:inline-flex items-center gap-1.5 ${dark?"text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800":"text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100"}`}>
            <span>Search</span><kbd className="text-[10px] opacity-40">⌘K</kbd>
          </button>
          <button onClick={() => { loadNotifications(); setShowNotifDrawer(v => !v); }} className={`relative p-1.5 rounded-md transition-colors ${dark?"text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800":"text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100"}`} title="Notifications">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
            {notifCount > 0 && <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 bg-red-500 text-white text-[8px] font-bold rounded-full flex items-center justify-center">{notifCount > 9 ? "9+" : notifCount}</span>}
          </button>
          <button onClick={()=>{setDark(d=>{const next=!d; saveTheme(next?"dark":"light"); return next;});}} className={`p-1.5 rounded-md transition-colors ${dark?"text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800":"text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100"}`}>
            {dark ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg> : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>}
          </button>
        </div>
      </header>

      {/* Desktop Tier 2 — Sub-tab bar */}
      {activeCategory !== "Dashboard" && (
        <div className={`hidden md:block sticky top-[41px] z-30 border-b ${headerBg} ${borderDim}`}>
          <div key={activeCategory} className="flex gap-0.5 px-4 sm:px-5 overflow-x-auto scrollbar-hide animate-fadeIn">
            {cats.find(c => c.cat === activeCategory)?.items.map(t => (
              <button key={t.id} onClick={() => setTab(t.id)}
                className={`px-3 py-2 text-sm whitespace-nowrap transition-all flex items-center gap-1.5 border-b-2 ${
                  tab === t.id
                    ? (dark ? "border-blue-500 text-blue-400 font-semibold" : "border-blue-600 text-blue-700 font-semibold")
                    : (dark ? "border-transparent text-zinc-500 hover:text-zinc-200 hover:border-zinc-700" : "border-transparent text-zinc-500 hover:text-zinc-900 hover:border-zinc-300")
                }`}>
                <span className="opacity-60 text-sm">{t.icon}</span>{t.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Mobile nav drawer — uses same categories as desktop */}
      {mobileNav && (
        <div className={`md:hidden border-b p-3 space-y-3 overflow-y-auto ${dark?"terminal-card-dark":"terminal-card-light"}`} style={{maxHeight:"80vh"}}>
          {cats.map(grp=>(
            <div key={grp.cat}>
              <div className={`text-[10px] font-bold uppercase tracking-wider mb-1.5 px-1 ${dark?"text-blue-500/60":"text-blue-600"}`}>{grp.cat}</div>
              <div className="grid grid-cols-4 gap-1">
                {grp.items.map(t=>(
                  <button key={t.id} onClick={()=>{setTab(t.id);setMobileNav(false);}}
                    className={`flex flex-col items-center py-2.5 rounded-md text-[11px] font-medium ${tab===t.id?(dark?"bg-blue-600/10 text-blue-400":"bg-blue-50 text-blue-700"):dark?"text-zinc-500 hover:text-zinc-200":"text-zinc-600 hover:text-zinc-900"}`}>
                    <span className="text-lg mb-0.5">{t.icon}</span>
                    {t.label}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <main className="flex-1 p-3 sm:p-4 overflow-y-auto">
        <div key={tab} className="animate-tabEnter">

        {/* ── DASHBOARD ─────────────────────────────────────── */}
        {tab==="dashboard" && (
          <div className="space-y-5">
            <PersonalHeader dark={dark} />

            {/* ── Next Day Outlook Banner ── */}
            {nextDayOutlook?.direction && (
              <div className={`rounded-xl p-4 border ${
                nextDayOutlook.direction === "bullish"
                  ? (dark ? "border-green-800 bg-green-950/40" : "border-green-200 bg-green-50")
                  : nextDayOutlook.direction === "bearish"
                  ? (dark ? "border-red-800 bg-red-950/40" : "border-red-200 bg-red-50")
                  : (dark ? "border-zinc-700 bg-zinc-800/40" : "border-gray-200 bg-gray-50")
              }`}>
                <div className="flex items-center gap-3 mb-2">
                  <span className={`text-2xl font-black font-mono uppercase ${
                    nextDayOutlook.direction === "bullish" ? "text-emerald-500" : nextDayOutlook.direction === "bearish" ? "text-red-500" : (dark ? "text-zinc-400" : "text-gray-500")
                  }`}>
                    {nextDayOutlook.direction === "bullish" ? "BULLISH" : nextDayOutlook.direction === "bearish" ? "BEARISH" : "NEUTRAL"}
                  </span>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                    nextDayOutlook.confidence > 70 ? (dark ? "bg-emerald-900 text-emerald-300" : "bg-emerald-100 text-emerald-700")
                    : nextDayOutlook.confidence > 40 ? (dark ? "bg-yellow-900 text-yellow-300" : "bg-yellow-100 text-yellow-700")
                    : (dark ? "bg-zinc-700 text-zinc-300" : "bg-gray-200 text-gray-600")
                  }`}>
                    {nextDayOutlook.confidence}% confidence
                  </span>
                  <span className={`text-[10px] ml-auto ${dimText}`}>
                    {nextDayOutlook.timestamp ? new Date(nextDayOutlook.timestamp).toLocaleTimeString() : ""}
                  </span>
                </div>
                <div className={`text-sm font-bold mb-2 ${dark ? "text-white" : "text-gray-900"}`}>
                  {nextDayOutlook.headline}
                </div>
                <div className={`text-xs leading-relaxed mb-3 ${dark ? "text-zinc-400" : "text-gray-600"}`}>
                  {nextDayOutlook.reasoning}
                </div>
                <div className="flex gap-4 flex-wrap text-[11px]">
                  {nextDayOutlook.key_levels?.spy_support && (
                    <span className={dimText}>SPY Support: <strong className={`font-mono ${dark ? "text-red-400" : "text-red-600"}`}>${nextDayOutlook.key_levels.spy_support}</strong></span>
                  )}
                  {nextDayOutlook.key_levels?.spy_resistance && (
                    <span className={dimText}>Resistance: <strong className={`font-mono ${dark ? "text-green-400" : "text-green-600"}`}>${nextDayOutlook.key_levels.spy_resistance}</strong></span>
                  )}
                  {nextDayOutlook.vix_signal && (
                    <span className={dimText}>VIX: <strong className={dark ? "text-yellow-400" : "text-yellow-600"}>{nextDayOutlook.vix_signal}</strong></span>
                  )}
                </div>
                {nextDayOutlook.portfolio_action && (
                  <div className={`mt-2 text-xs font-semibold px-3 py-1.5 rounded-lg ${dark ? "bg-blue-950 text-blue-300 border border-blue-800" : "bg-blue-50 text-blue-700 border border-blue-200"}`}>
                    ACTION: {nextDayOutlook.portfolio_action}
                  </div>
                )}
              </div>
            )}

            {/* ── Portfolio Summary Bar ── */}
            {fidelitySummary && (
              <div className={`grid grid-cols-4 gap-3`}>
                <div className={`border rounded-lg p-3 ${cardBg}`}>
                  <div className={`text-[10px] uppercase tracking-wider mb-1 font-medium ${dimText}`}>Portfolio Value</div>
                  <div className={`text-lg font-semibold font-mono ${headText}`}>${fmt(fidelitySummary.total_value)}</div>
                </div>
                <div className={`border rounded-lg p-3 ${cardBg}`}>
                  <div className={`text-[10px] uppercase tracking-wider mb-1 font-medium ${dimText}`}>Total P&L</div>
                  <div className={`text-lg font-semibold font-mono ${clr(fidelitySummary.total_gain)}`}>{fidelitySummary.total_gain>=0?"+":""}${fmt(fidelitySummary.total_gain)}</div>
                  <div className={`text-[10px] font-mono ${clr(fidelitySummary.total_gain_pct)}`}>{fidelitySummary.total_gain_pct>=0?"+":""}{fidelitySummary.total_gain_pct?.toFixed(2)}%</div>
                </div>
                <div className={`border rounded-lg p-3 ${cardBg}`}>
                  <div className={`text-[10px] uppercase tracking-wider mb-1 font-medium ${dimText}`}>Cash</div>
                  <div className={`text-lg font-semibold font-mono ${headText}`}>${fmt(fidelitySummary.total_cash)}</div>
                </div>
                <div className={`border rounded-lg p-3 ${cardBg}`}>
                  <div className={`text-[10px] uppercase tracking-wider mb-1 font-medium ${dimText}`}>Market</div>
                  {(() => {const spy = macro.find(m=>m.symbol==="SPY"); return spy ? (<>
                    <div className={`text-lg font-semibold font-mono ${headText}`}>{fmt(spy.price)}</div>
                    <div className={`text-[10px] font-mono ${clr(spy.change_pct)}`}>SPY {pct(spy.change_pct)}</div>
                  </>) : <div className={`text-lg font-mono ${dimText}`}>---</div>})()}
                </div>
              </div>
            )}

            {/* ── Market Indices Row ── */}
            <div className={`border rounded-lg p-3 ${cardBg}`}>
              <div className="flex items-center justify-between mb-2.5">
                <span className={`text-[10px] uppercase tracking-wider font-medium ${dimText}`}>Markets</span>
                {regime && regime.regime && regime.regime !== "unknown" && (
                  <span className={`text-[10px] font-medium flex items-center gap-1.5 ${
                    regime.regime === "bull" ? "text-emerald-500" : regime.regime === "bear" ? "text-red-500" : "text-amber-500"
                  }`}>
                    <span style={{width:5,height:5,borderRadius:"50%",background:"currentColor"}}/>
                    {regime.regime.toUpperCase()} · {regime.confidence}%
                  </span>
                )}
              </div>
              <div className="grid grid-cols-6 gap-2">
                {macro.filter(m=>["SPY","QQQ","DIA","IWM","GLD","BTC-USD"].includes(m.symbol)).map(m => (
                  <div key={m.symbol} onClick={()=>goToChart(m.symbol)} className={`cursor-pointer rounded-md p-2 transition-colors ${dark?"hover:bg-zinc-800":"hover:bg-zinc-50"}`}>
                    <div className={`text-[10px] font-medium ${dimText}`}>{m.label}</div>
                    <div className={`text-sm font-mono font-semibold ${headText}`}>{m.price != null ? fmt(m.price) : "—"}</div>
                    <div className={`text-[10px] font-mono ${clr(m.change_pct)}`}>{pct(m.change_pct)}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* ── Two Column: Left (Briefing + News) / Right (Portfolio + Stats) ── */}
            <div className="grid grid-cols-12 gap-4">
              {/* Left Column — 7 cols */}
              <div className="col-span-7 space-y-4">
                {/* Market Intelligence Row */}
                {marketPulse && !marketPulse.error && (
                  <div className="grid grid-cols-3 gap-3">
                    <div className={`border rounded-lg p-3 ${cardBg}`}>
                      <div className={`text-[10px] uppercase tracking-wider mb-1 font-medium ${dimText}`}>Fear & Greed</div>
                      <div className="flex items-baseline gap-2">
                        <span className={`text-2xl font-bold font-mono ${
                          (marketPulse.fear_greed?.score || 50) >= 75 ? "text-emerald-500" :
                          (marketPulse.fear_greed?.score || 50) >= 55 ? "text-green-500" :
                          (marketPulse.fear_greed?.score || 50) >= 45 ? "text-amber-500" :
                          (marketPulse.fear_greed?.score || 50) >= 25 ? "text-orange-500" : "text-red-500"
                        }`}>{marketPulse.fear_greed?.score ?? "—"}</span>
                        <span className={`text-[10px] font-medium ${dimText}`}>{marketPulse.fear_greed?.label}</span>
                      </div>
                    </div>
                    <div className={`border rounded-lg p-3 ${cardBg}`}>
                      <div className={`text-[10px] uppercase tracking-wider mb-1 font-medium ${dimText}`}>VIX</div>
                      <div className={`text-2xl font-bold font-mono ${
                        (marketPulse.regime?.vix || 20) < 15 ? "text-emerald-500" :
                        (marketPulse.regime?.vix || 20) < 22 ? "text-green-500" :
                        (marketPulse.regime?.vix || 20) < 30 ? "text-amber-500" : "text-red-500"
                      }`}>{marketPulse.regime?.vix || "—"}</div>
                      <div className={`text-[10px] ${dimText}`}>{(marketPulse.regime?.vol_regime || "").replace("_", " ")}</div>
                    </div>
                    <div className={`border rounded-lg p-3 ${cardBg}`}>
                      <div className={`text-[10px] uppercase tracking-wider mb-1 font-medium ${dimText}`}>Yield Curve</div>
                      <div className={`text-sm font-medium ${headText}`}>{marketPulse.yields?.spread_signal || "Normal"}</div>
                      {marketPulse.yields?.["10y"] && <div className={`text-[10px] font-mono mt-0.5 ${dimText}`}>10Y: {marketPulse.yields["10y"]}%</div>}
                    </div>
                  </div>
                )}

                {/* Sector Performance */}
                {marketPulse?.sectors?.length > 0 && (
                  <div className={`border rounded-lg p-3 ${cardBg}`}>
                    <div className={`text-[10px] uppercase tracking-wider mb-2 font-medium ${dimText}`}>Sectors</div>
                    <div className="grid grid-cols-11 gap-1">
                      {marketPulse.sectors.map((s: any) => {
                        const p = s.change_pct || 0;
                        const intensity = Math.min(Math.abs(p), 3) / 3;
                        return (
                          <div key={s.symbol} className="rounded px-1 py-1.5 text-center" style={{
                            background: p >= 0 ? `rgba(34,197,94,${0.08 + intensity * 0.25})` : `rgba(239,68,68,${0.08 + intensity * 0.25})`,
                          }}>
                            <div className={`text-[8px] font-medium truncate ${dark?"text-zinc-400":"text-zinc-600"}`}>{s.name}</div>
                            <div className={`text-[10px] font-mono font-semibold ${p >= 0 ? "text-emerald-500" : "text-red-500"}`}>{p >= 0 ? "+" : ""}{p.toFixed(1)}%</div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* AI Morning Briefing */}
                {/* AI Morning Briefing */}
                <div className={`border rounded-lg p-3 ${cardBg}`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className={`text-[10px] uppercase tracking-wider font-medium ${dimText}`}>AI Briefing</span>
                    <button onClick={loadMorningBriefing} disabled={briefingLoading} className={`text-[10px] px-2.5 py-1 rounded-md transition-colors ${dark?"text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800":"text-zinc-500 hover:text-zinc-700 hover:bg-zinc-100"}`}>
                      {briefingLoading ? "Loading..." : morningBriefing ? "Refresh" : "Generate"}
                    </button>
                  </div>
                  {morningBriefing && !morningBriefing.error ? (
                    <div className="space-y-2.5">
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] px-2 py-0.5 rounded font-medium uppercase ${
                          morningBriefing.sentiment === "bullish" ? (dark?"bg-emerald-500/10 text-emerald-400":"bg-emerald-50 text-emerald-600") :
                          morningBriefing.sentiment === "bearish" ? (dark?"bg-red-500/10 text-red-400":"bg-red-50 text-red-600") :
                          (dark?"bg-amber-500/10 text-amber-400":"bg-amber-50 text-amber-600")
                        }`}>{morningBriefing.sentiment || "neutral"}</span>
                      </div>
                      <p className={`text-xs leading-relaxed ${bodyText}`}>{morningBriefing.market_summary}</p>
                      {morningBriefing.overnight_moves?.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                          {morningBriefing.overnight_moves.map((m: any, i: number) => (
                            <span key={i} className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${m.change_pct >= 0 ? (dark?"bg-emerald-500/10 text-emerald-400":"bg-emerald-50 text-emerald-600") : (dark?"bg-red-500/10 text-red-400":"bg-red-50 text-red-600")}`}>
                              {m.symbol} {m.change_pct >= 0 ? "+" : ""}{m.change_pct?.toFixed(2)}%
                            </span>
                          ))}
                        </div>
                      )}
                      {morningBriefing.action_items?.length > 0 && (
                        <div className="space-y-1">
                          {morningBriefing.action_items.map((a: string, i: number) => (
                            <div key={i} className={`text-xs ${bodyText} flex gap-2 items-start`}>
                              <span className={`${dimText} mt-0.5`}>-</span>
                              <span>{a}</span>
                            </div>
                          ))}
                        </div>
                      )}
                      {morningBriefing.portfolio_impact && (
                        <div className={`text-xs ${dimText} border-l-2 pl-3 ${dark?"border-zinc-700":"border-zinc-200"}`}>{morningBriefing.portfolio_impact}</div>
                      )}
                    </div>
                  ) : morningBriefing?.error ? (
                    <div className="text-xs text-red-500">{morningBriefing.error}</div>
                  ) : !briefingLoading ? (
                    <div className={`text-xs ${dimText} py-3 text-center`}>Generate an AI morning briefing</div>
                  ) : null}
                </div>

                {/* Latest News */}
                <div className={`border rounded-lg p-3 ${cardBg}`}>
                  <div className={`text-[10px] uppercase tracking-wider mb-2 font-medium ${dimText}`}>News</div>
                  <div className="space-y-1.5 max-h-72 overflow-y-auto">
                    {news.slice(0,10).map((n,i)=>(
                      <a key={i} href={n.link} target="_blank" rel="noreferrer" className={`block text-xs leading-snug py-1.5 border-b transition-colors ${dark?"border-zinc-800 hover:text-blue-400":"border-zinc-100 hover:text-blue-600"} ${bodyText}`}>
                        {n.title}
                        <span className={`text-[10px] ml-2 ${dimText}`}>{n.source}</span>
                      </a>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right Column — 5 cols */}
              <div className="col-span-5 space-y-4">
                {/* Holdings Heatmap */}
                {fidelityPositions.filter((p:any)=>!p.is_option&&!p.is_cash).length > 0 && (
                  <div className={`border rounded-lg p-3 ${cardBg}`}>
                    <div className={`text-[10px] uppercase tracking-wider mb-2 font-medium ${dimText}`}>Holdings</div>
                    <div className="flex gap-0.5 flex-wrap">
                      {fidelityPositions.filter((p:any)=>!p.is_option&&!p.is_cash).sort((a:any,b:any)=>(b.current_value||0)-(a.current_value||0)).slice(0,14).map((r:any) => {
                        const p = r.total_gain_pct || 0;
                        const intensity = Math.min(Math.abs(p), 60) / 60;
                        const isPos = p >= 0;
                        const weight = fidelitySummary?.total_value > 0 ? ((r.current_value||0) / fidelitySummary.total_value) * 100 : 1;
                        return (
                          <div key={r.raw_symbol} onClick={()=>goToChart(r.symbol)}
                            className="cursor-pointer rounded px-1.5 py-1 text-center transition-opacity hover:opacity-80"
                            style={{ background: isPos ? `rgba(34,197,94,${0.08+intensity*0.3})` : `rgba(239,68,68,${0.08+intensity*0.3})`,
                              flex: `${Math.max(1, weight/3)}`, minWidth: 36 }}>
                            <div className={`text-[9px] font-medium truncate ${dark?"text-zinc-300":"text-zinc-700"}`}>{r.symbol}</div>
                            <div className={`text-[9px] font-mono ${isPos?"text-emerald-500":"text-red-500"}`}>{p>=0?"+":""}{p.toFixed(1)}%</div>
                          </div>
                        );
                      })}
                    </div>
                    {/* Biggest Movers */}
                    <div className={`mt-2.5 pt-2.5 border-t ${borderDim}`}>
                      <div className={`text-[10px] uppercase tracking-wider mb-1.5 font-medium ${dimText}`}>Movers</div>
                      <div className="space-y-1">
                        {fidelityPositions.filter((p:any)=>!p.is_option&&!p.is_cash&&p.total_gain_pct!=null).sort((a:any,b:any)=>Math.abs(b.total_gain_pct||0)-Math.abs(a.total_gain_pct||0)).slice(0,5).map((r:any) => (
                          <div key={r.raw_symbol} onClick={()=>goToChart(r.symbol)} className={`flex items-center justify-between text-xs cursor-pointer py-0.5 transition-colors ${dark?"hover:text-zinc-100":"hover:text-zinc-900"}`}>
                            <span className={`font-mono font-medium ${headText}`}>{r.symbol}</span>
                            <span className={`font-mono ${clr(r.total_gain_pct)}`}>{(r.total_gain_pct||0)>=0?"+":""}{r.total_gain_pct?.toFixed(2)}%</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    {/* Options */}
                    {fidelityPositions.filter((p:any)=>p.is_option).length > 0 && (
                      <div className={`mt-2.5 pt-2.5 border-t ${borderDim}`}>
                        <div className="flex items-center justify-between text-xs">
                          <span className={dimText}>Options ({fidelityPositions.filter((p:any)=>p.is_option).length})</span>
                          <span className={headText}>${fmt(fidelityPositions.filter((p:any)=>p.is_option).reduce((s:number,o:any)=>s+(o.current_value||0),0))}</span>
                        </div>
                      </div>
                    )}
                    {fidelityFreshness?.has_data && (
                      <div className={`mt-2 pt-2 border-t text-[10px] flex justify-between ${dimText} ${borderDim}`}>
                        <span>Fidelity · {fidelityFreshness.age_minutes < 60 ? `${Math.round(fidelityFreshness.age_minutes)}m ago` : fidelityFreshness.age_minutes < 1440 ? `${Math.round(fidelityFreshness.age_minutes/60)}h ago` : `${Math.round(fidelityFreshness.age_minutes/1440)}d ago`}</span>
                        <button onClick={()=>loadFidelityPositions(true)} className={`transition-colors ${dark?"hover:text-zinc-200":"hover:text-zinc-700"}`}>Sync</button>
                      </div>
                    )}
                  </div>
                )}

                {/* Sector Allocation */}
                {sectorBreakdown?.sectors?.length > 0 && (
                  <div className={`border rounded-lg p-3 ${cardBg}`}>
                    <div className={`text-[10px] uppercase tracking-wider mb-2 font-medium ${dimText}`}>Allocation</div>
                    <div className="space-y-1.5">
                      {sectorBreakdown.sectors.slice(0,6).map((s: any) => (
                        <div key={s.name} className="flex items-center gap-2">
                          <div className={`text-[10px] w-20 truncate ${dimText}`}>{s.name}</div>
                          <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{background: dark ? "#27272a" : "#e5e7eb"}}>
                            <div className="h-full rounded-full transition-all" style={{width: `${s.pct}%`, background: s.color}} />
                          </div>
                          <div className={`text-[10px] font-mono w-10 text-right ${headText}`}>{s.pct}%</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Quick Stats */}
                <div className="grid grid-cols-2 gap-3">
                  <div className={`border rounded-lg p-3 ${cardBg}`}>
                    <div className={`text-[10px] uppercase tracking-wider mb-1 font-medium ${dimText}`}>Journal</div>
                    <div className="space-y-1 text-xs">
                      <div className="flex justify-between"><span className={dimText}>Open</span><span className={headText}>{tradeStats.open_trades||0}</span></div>
                      <div className="flex justify-between"><span className={dimText}>Win Rate</span><span className="text-emerald-500 font-medium">{tradeStats.win_rate||0}%</span></div>
                      <div className="flex justify-between"><span className={dimText}>P&L</span><span className={clr(tradeStats.total_pnl)}>${fmt(tradeStats.total_pnl||0)}</span></div>
                    </div>
                  </div>
                  {rhStatus?.logged_in && rhPortfolio ? (
                    <div className={`border rounded-lg p-3 ${cardBg}`}>
                      <div className={`text-[10px] uppercase tracking-wider mb-1 font-medium ${dimText}`}>Robinhood</div>
                      <div className="space-y-1 text-xs">
                        <div className="flex justify-between"><span className={dimText}>Equity</span><span className={headText}>${fmt(rhPortfolio.equity)}</span></div>
                        <div className="flex justify-between"><span className={dimText}>Cash</span><span className={headText}>${fmt(rhPortfolio.cash)}</span></div>
                      </div>
                    </div>
                  ) : (
                    <div className={`border rounded-lg p-3 ${cardBg}`}>
                      <div className={`text-[10px] uppercase tracking-wider mb-1 font-medium ${dimText}`}>Goals</div>
                      {goals.length > 0 ? (
                        <div className="space-y-1.5">
                          {goals.slice(0,2).map((g: any) => {
                            const current = g.current_amount || 0;
                            const target = g.target_amount || 1;
                            const p = Math.min((current / target) * 100, 100);
                            return (
                              <div key={g.id}>
                                <div className={`text-[10px] ${headText} mb-0.5`}>{g.name}</div>
                                <div className="flex items-center gap-1.5">
                                  <div className="flex-1 h-1 rounded-full overflow-hidden" style={{background:dark?"#27272a":"#e5e7eb"}}>
                                    <div className={`h-full rounded-full ${p>=100?"bg-emerald-500":"bg-blue-500"}`} style={{width:`${p}%`}}/>
                                  </div>
                                  <span className={`text-[9px] font-mono ${dimText}`}>{p.toFixed(0)}%</span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : <div className={`text-[10px] ${dimText}`}>No goals set</div>}
                      <button onClick={()=>setShowGoalForm(!showGoalForm)} className={`text-[10px] mt-1.5 ${dark?"text-blue-400":"text-blue-600"}`}>{showGoalForm?"Cancel":"+ Add goal"}</button>
                    </div>
                  )}
                </div>

                {/* Goals Form (hidden by default) */}
                {showGoalForm && (
                  <div className={`border rounded-lg p-3 ${cardBg}`}>
                    <div className="space-y-1.5">
                      <input value={goalForm.name} onChange={e=>setGoalForm({...goalForm,name:e.target.value})} placeholder="Goal name" className={`w-full text-xs ${input}`} />
                      <div className="flex gap-1.5">
                        <input value={goalForm.target_amount} onChange={e=>setGoalForm({...goalForm,target_amount:e.target.value})} placeholder="Target $" type="number" className={`flex-1 text-xs ${input}`} />
                        <select value={goalForm.type} onChange={e=>setGoalForm({...goalForm,type:e.target.value})} className={`text-xs ${input}`}>
                          <option value="portfolio_value">Portfolio Value</option>
                          <option value="monthly_income">Monthly Income</option>
                          <option value="win_rate">Win Rate %</option>
                          <option value="savings">Savings</option>
                        </select>
                      </div>
                      <button onClick={addGoal} className={`w-full text-xs py-1.5 rounded-md font-medium ${btn}`}>Add Goal</button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── CHARTS ────────────────────────────────────────── */}
        {tab==="charts" && (
          <RobinhoodChart initialTicker={chartTicker} dark={dark} BASE={BASE} portfolio={portfolio} onTickerChange={(t: string) => setChartTicker(t)} onAIAnalyze={(t: string) => { setTab("ai"); setAiTicker(t); setTimeout(() => runAI(t), 100); }} />
        )}

        {/* ── AI ────────────────────────────────────────────── */}
        {tab==="ai" && (
          <div>
            {/* AI Sub-tabs */}
            <div className="flex gap-1 mb-4 flex-wrap">
              {([["analysis","🧠 Analysis"],["chat","💬 Chat"],["deepdive","🔬 Deep Dive"],["rebalance","⚖️ Rebal"],["earnsummary","📊 Earnings"],["coach","🎓 Coach"],["scanner","🔍 Scanner"],["riskalerts","⚠️ Risk"],["senttime","📈 SentTime"],["predict","🤖 Predict"],["deepreview","📓 DeepReview"],["doctor","🩺 Doctor"],["narrative","📖 Narrative"]] as [string,string][]).map(([key,label])=>(
                <button key={key} onClick={()=>{setAiSubTab(key as any);setAiSubTab2(key as any);}} className={`px-3 py-1.5 text-[10px] rounded-lg ${aiSubTab2===key?(dark?"bg-violet-600 text-white font-bold":"bg-blue-600 text-white font-bold"):`border ${dark?"border-zinc-700 text-zinc-400":"border-gray-300 text-gray-500"}`}`}>{label}</button>
              ))}
            </div>
            {aiSubTab2==="analysis" && (
              <div className="space-y-4 max-w-3xl">
                <div className={`text-xs uppercase tracking-wider ${dimText2}`}>AI Stock Analysis · Powered by Claude</div>
                <div className="flex gap-2">
                  <input value={aiTicker} onChange={e=>setAiTicker(e.target.value.toUpperCase())} placeholder="TICKER" className={`w-28 ${input} uppercase`} onKeyDown={e=>e.key==="Enter"&&runAI()} />
                  <button onClick={()=>runAI()} disabled={aiLoading} className={`${btn} ${aiLoading?"opacity-50":""}`}>{aiLoading?"ANALYZING...":"ANALYZE"}</button>
                </div>
                {aiLoading && <div className="border border-violet-800/50 bg-violet-950/10 rounded-lg p-8 text-center"><div className="text-violet-400 text-sm animate-pulse mb-2">🧠 Analyzing {aiTicker}...</div></div>}
                {aiResult && !aiLoading && !aiResult.error && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-4 flex-wrap">
                      <span className="text-2xl font-bold text-amber-400">{aiResult.ticker}</span>
                      <span className={dimText}>{aiResult.name}</span>
                      <span className={`border rounded-lg px-3 py-1 text-sm font-bold uppercase ${sentimentColor(aiResult.sentiment)}`}>{aiResult.sentiment}</span>
                      <span className={`text-2xl font-bold ${scoreColor(aiResult.score)}`}>{aiResult.score}<span className={`text-sm ${dimText2}`}>/10</span></span>
                      {aiResult.recommendation && <span className={`border rounded-lg px-3 py-1 text-xs font-bold ${aiResult.recommendation==="BUY"?"border-emerald-600 text-emerald-400":aiResult.recommendation==="SELL"?"border-red-600 text-red-400":"border-amber-600 text-amber-400"}`}>{aiResult.recommendation}</span>}
                    </div>
                    {aiResult.summary && <p className={`text-sm leading-relaxed border-l-2 border-amber-400/30 pl-4 ${bodyText}`}>{aiResult.summary}</p>}
                    {aiResult.price_target && (
                      <div className={`flex gap-6 text-xs border rounded-lg p-3 ${cardBg}`}>
                        <span className={dimText}>Targets:</span>
                        <span className="text-red-400">Bear: ${fmt(aiResult.price_target.low)}</span>
                        <span className="text-amber-400">Base: ${fmt(aiResult.price_target.mid)}</span>
                        <span className="text-emerald-400">Bull: ${fmt(aiResult.price_target.high)}</span>
                      </div>
                    )}
                    <div className="grid md:grid-cols-2 gap-4">
                      {aiResult.bull_case && <div className="border border-emerald-800/30 bg-emerald-950/10 rounded-lg p-4"><div className="text-emerald-400 text-xs font-bold uppercase tracking-widest mb-2">🐂 Bull Case</div>{aiResult.bull_case.map((p,i)=><div key={i} className={`text-xs mb-1.5 leading-relaxed ${bodyText}`}>• {p}</div>)}</div>}
                      {aiResult.bear_case && <div className="border border-red-800/30 bg-red-950/10 rounded-lg p-4"><div className="text-red-400 text-xs font-bold uppercase tracking-widest mb-2">🐻 Bear Case</div>{aiResult.bear_case.map((p,i)=><div key={i} className={`text-xs mb-1.5 leading-relaxed ${bodyText}`}>• {p}</div>)}</div>}
                    </div>
                    {aiResult.technicals && <div className={`border rounded-lg p-4 ${cardBg}`}><div className={`text-xs font-bold uppercase tracking-widest mb-2 ${dimText}`}>Technical Analysis</div><p className={`text-xs leading-relaxed ${bodyText}`}>{aiResult.technicals}</p></div>}
                  </div>
                )}
                {aiResult?.error && <div className="border border-red-800 bg-red-950/20 rounded-lg p-4 text-red-400 text-xs">{aiResult.error}</div>}
              </div>
            )}
            {aiSubTab2==="chat" && (
              <AIChat dark={dark} BASE={BASE} />
            )}
            {aiSubTab2==="deepdive" && (
              <div className="space-y-4 max-w-4xl">
                <div className={`text-xs uppercase tracking-wider ${dimText2}`}>Nemeth-Style Deep Dive (7-Layer Framework)</div>
                <div className="flex gap-2">
                  <input value={ddTicker} onChange={e=>setDdTicker(e.target.value.toUpperCase())} onKeyDown={e=>e.key==="Enter"&&runDeepDive()} placeholder="Enter ticker..." className={`px-3 py-2 rounded-lg text-sm font-mono ${dark?"bg-zinc-800 border-zinc-700 text-white":"bg-white border-gray-300 text-gray-900"} border`} style={{width:140}} />
                  <button onClick={()=>runDeepDive()} disabled={ddLoading} className={`px-4 py-2 rounded-lg text-xs font-bold ${dark?"bg-violet-600 text-white":"bg-blue-600 text-white"}`}>{ddLoading?"Analyzing...":"Run Deep Dive"}</button>
                </div>
                {ddLoading && <div className={`text-sm ${dimText}`}>Running 7-layer analysis with Claude... this may take 30-60 seconds.</div>}
                {ddResult && !ddResult.parse_error && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="text-xl font-bold font-mono">{ddResult.name || ddResult.ticker}</span>
                      <span className={`text-sm font-mono ${dark?"text-zinc-400":"text-gray-500"}`}>${ddResult.price}</span>
                      <span className={`text-xs font-bold px-2 py-0.5 rounded ${(ddResult.pct_3m||0)>=0?(dark?"bg-green-900 text-green-300":"bg-green-100 text-green-700"):(dark?"bg-red-900 text-red-300":"bg-red-100 text-red-700")}`}>{ddResult.pct_3m>=0?"+":""}{ddResult.pct_3m}% 3mo</span>
                      {ddResult.cohr_score && <span className={`text-xs font-bold px-2 py-0.5 rounded ${dark?"bg-violet-900 text-violet-300":"bg-violet-100 text-violet-700"}`}>COHR Score: {ddResult.cohr_score}/7</span>}
                      {ddResult.conviction && <span className={`text-xs font-bold px-2 py-0.5 rounded ${ddResult.conviction==="high"?(dark?"bg-green-900 text-green-300":"bg-green-100 text-green-700"):ddResult.conviction==="low"?(dark?"bg-red-900 text-red-300":"bg-red-100 text-red-700"):(dark?"bg-yellow-900 text-yellow-300":"bg-yellow-100 text-yellow-700")}`}>{ddResult.conviction} conviction</span>}
                    </div>
                    {ddResult.verdict && <div className={`text-sm p-3 rounded-lg ${dark?"bg-zinc-800 border-zinc-700":"bg-blue-50 border-blue-200"} border`}>{ddResult.verdict}</div>}
                    {ddResult.layers?.map((layer:any, i:number)=>(
                      <details key={i} className={`rounded-lg border ${dark?"border-zinc-700 bg-zinc-800/50":"border-gray-200 bg-white"}`}>
                        <summary className={`px-4 py-3 cursor-pointer text-sm font-bold ${dark?"text-white":"text-gray-900"}`}>{i+1}. {layer.name}</summary>
                        <div className={`px-4 pb-4 text-sm whitespace-pre-wrap ${dark?"text-zinc-300":"text-gray-700"}`}>{layer.analysis}</div>
                      </details>
                    ))}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className={`p-4 rounded-lg border ${dark?"border-green-800 bg-green-900/20":"border-green-200 bg-green-50"}`}>
                        <div className={`text-xs font-bold uppercase mb-2 ${dark?"text-green-400":"text-green-700"}`}>Bull Case</div>
                        {ddResult.bull_case?.map((b:string,i:number)=><div key={i} className={`text-sm mb-1 ${dark?"text-green-300":"text-green-800"}`}>+ {b}</div>)}
                      </div>
                      <div className={`p-4 rounded-lg border ${dark?"border-red-800 bg-red-900/20":"border-red-200 bg-red-50"}`}>
                        <div className={`text-xs font-bold uppercase mb-2 ${dark?"text-red-400":"text-red-700"}`}>Bear Case</div>
                        {ddResult.bear_case?.map((b:string,i:number)=><div key={i} className={`text-sm mb-1 ${dark?"text-red-300":"text-red-800"}`}>- {b}</div>)}
                      </div>
                    </div>
                    {ddResult.catalysts?.length > 0 && (
                      <div className={`p-4 rounded-lg border ${dark?"border-zinc-700 bg-zinc-800/50":"border-gray-200 bg-white"}`}>
                        <div className={`text-xs font-bold uppercase mb-2 ${dimText2}`}>Catalysts</div>
                        {ddResult.catalysts.map((c:any,i:number)=><div key={i} className={`text-sm mb-1 flex gap-2 ${dark?"text-zinc-300":"text-gray-700"}`}><span className="font-mono text-xs text-blue-400">{c.timeline}</span> {c.event}</div>)}
                      </div>
                    )}
                    {ddResult.key_risks?.length > 0 && (
                      <div className={`p-4 rounded-lg border ${dark?"border-yellow-800 bg-yellow-900/20":"border-yellow-200 bg-yellow-50"}`}>
                        <div className={`text-xs font-bold uppercase mb-2 ${dark?"text-yellow-400":"text-yellow-700"}`}>Key Risks</div>
                        {ddResult.key_risks.map((r:string,i:number)=><div key={i} className={`text-sm mb-1 ${dark?"text-yellow-300":"text-yellow-800"}`}>{i+1}. {r}</div>)}
                      </div>
                    )}
                  </div>
                )}
                {ddResult?.parse_error && <div className={`text-sm whitespace-pre-wrap ${dark?"text-zinc-300":"text-gray-700"}`}>{ddResult.raw_analysis}</div>}
              </div>
            )}
            {aiSubTab2==="rebalance" && (
              <div className="space-y-4 max-w-3xl">
                <div className={`text-xs uppercase tracking-wider ${dimText2}`}>AI Portfolio Rebalancing · Powered by Claude</div>
                <button onClick={loadAiRebalance} className={btn} disabled={aiRebalanceLoading}>{aiRebalanceLoading?"Analyzing Portfolio...":"Analyze & Suggest Rebalancing"}</button>
                {aiRebalance && !aiRebalance.error && (
                  <div className="space-y-4">
                    <div className="flex gap-3 items-center flex-wrap">
                      <span className={`text-[10px] px-2 py-1 rounded ${dark?"bg-zinc-800":"bg-gray-100"}`}>Overall: <span className="text-amber-400 font-bold">{aiRebalance.overall_score}/10</span></span>
                      <span className={`text-[10px] px-2 py-1 rounded ${dark?"bg-zinc-800":"bg-gray-100"}`}>Diversification: <span className="text-amber-400 font-bold">{aiRebalance.diversification_score}/10</span></span>
                      <span className={`text-[10px] px-2 py-1 rounded ${aiRebalance.concentration_risk==="high"?"bg-red-950/50 text-red-400":"bg-emerald-950/50 text-emerald-400"}`}>Concentration: {aiRebalance.concentration_risk}</span>
                    </div>
                    <p className={`text-xs ${bodyText} border-l-2 border-amber-400/30 pl-3`}>{aiRebalance.assessment}</p>
                    {aiRebalance.suggestions?.length > 0 && (
                      <div>
                        <div className={`text-xs uppercase tracking-wider mb-2 ${dimText2}`}>Suggestions</div>
                        <div className="space-y-2">
                          {aiRebalance.suggestions.map((s:any,i:number)=>(
                            <div key={i} className={`border rounded-lg p-3 flex items-center gap-3 ${cardBg}`}>
                              <span className={`text-xs font-bold px-2 py-0.5 rounded ${s.action==="reduce"?"bg-red-950/50 text-red-400":s.action==="increase"?"bg-emerald-950/50 text-emerald-400":s.action==="add"?"bg-blue-950/50 text-blue-400":"bg-amber-950/50 text-amber-400"}`}>{s.action.toUpperCase()}</span>
                              <span className="text-amber-400 font-bold">{s.ticker}</span>
                              <span className={`text-xs flex-1 ${bodyText}`}>{s.reason}</span>
                              <span className={`text-[10px] px-1.5 py-0.5 rounded ${s.urgency==="high"?"bg-red-950/50 text-red-400":s.urgency==="medium"?"bg-amber-950/50 text-amber-400":"bg-zinc-800 text-zinc-400"}`}>{s.urgency}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
                {aiRebalance?.error && <div className="text-xs text-red-400">{aiRebalance.error}</div>}
              </div>
            )}
            {aiSubTab2==="earnsummary" && (
              <div className="space-y-4 max-w-3xl">
                <div className={`text-xs uppercase tracking-wider ${dimText2}`}>AI Earnings Summary · Powered by Claude</div>
                <div className="flex gap-2">
                  <input value={aiEarningsSumTicker} onChange={e=>setAiEarningsSumTicker(e.target.value.toUpperCase())} placeholder="TICKER" className={`w-28 ${input} uppercase`} onKeyDown={e=>e.key==="Enter"&&loadAiEarningsSummary()} />
                  <button onClick={()=>loadAiEarningsSummary()} className={btn} disabled={aiEarningsSumLoading}>{aiEarningsSumLoading?"Summarizing...":"Summarize"}</button>
                </div>
                {aiEarningsSummary && !aiEarningsSummary.error && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="text-xl font-bold text-amber-400">{aiEarningsSummary.company}</span>
                      <span className={`text-[10px] px-2 py-1 rounded font-bold ${aiEarningsSummary.recommendation?.includes("buy")?"bg-emerald-950/50 text-emerald-400 border border-emerald-800":aiEarningsSummary.recommendation?.includes("sell")?"bg-red-950/50 text-red-400 border border-red-800":"bg-amber-950/50 text-amber-400 border border-amber-800"}`}>{aiEarningsSummary.recommendation}</span>
                      <span className={`text-[10px] px-2 py-1 rounded ${aiEarningsSummary.growth_outlook==="strong"?"bg-emerald-950/50 text-emerald-400":"bg-amber-950/50 text-amber-400"}`}>Growth: {aiEarningsSummary.growth_outlook}</span>
                    </div>
                    <p className={`text-xs ${bodyText} border-l-2 border-amber-400/30 pl-3`}>{aiEarningsSummary.summary}</p>
                    {aiEarningsSummary.fair_value_range && (
                      <div className={`flex gap-6 text-xs border rounded-lg p-3 ${cardBg}`}>
                        <span className={dimText}>Fair Value:</span>
                        <span className="text-red-400">Low: ${aiEarningsSummary.fair_value_range.low}</span>
                        <span className="text-amber-400">Mid: ${aiEarningsSummary.fair_value_range.mid}</span>
                        <span className="text-emerald-400">High: ${aiEarningsSummary.fair_value_range.high}</span>
                      </div>
                    )}
                    {aiEarningsSummary.key_metrics?.length > 0 && (
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                        {aiEarningsSummary.key_metrics.map((m:any,i:number)=>(
                          <div key={i} className={`border rounded-lg p-2 ${cardBg}`}>
                            <div className={`text-[10px] ${dimText}`}>{m.metric}</div>
                            <div className={`text-xs font-bold ${headText}`}>{m.value}</div>
                            <div className={`text-[10px] ${m.assessment==="good"?"text-emerald-400":m.assessment==="concern"?"text-red-400":"text-amber-400"}`}>{m.assessment}</div>
                          </div>
                        ))}
                      </div>
                    )}
                    <div className="grid md:grid-cols-2 gap-3">
                      {aiEarningsSummary.catalysts?.length > 0 && (
                        <div className={`border rounded-lg p-3 ${cardBg}`}><div className={`text-xs uppercase tracking-wider mb-1 ${dimText2}`}>Catalysts</div>{aiEarningsSummary.catalysts.map((c:string,i:number)=><div key={i} className={`text-xs ${bodyText}`}>▲ {c}</div>)}</div>
                      )}
                      {aiEarningsSummary.risks?.length > 0 && (
                        <div className={`border rounded-lg p-3 ${cardBg}`}><div className={`text-xs uppercase tracking-wider mb-1 ${dimText2}`}>Risks</div>{aiEarningsSummary.risks.map((r:string,i:number)=><div key={i} className={`text-xs ${bodyText}`}>▼ {r}</div>)}</div>
                      )}
                    </div>
                  </div>
                )}
                {aiEarningsSummary?.error && <div className="text-xs text-red-400">{aiEarningsSummary.error}</div>}
              </div>
            )}

            {/* AI Trade Coach */}
            {aiSubTab2==="coach" && (
              <div className="space-y-4 max-w-3xl">
                <div className={`text-xs uppercase tracking-wider ${dimText2}`}>🎓 AI Trade Coach · Position Review</div>
                <div className="flex gap-2">
                  <input value={coachTicker} onChange={e=>setCoachTicker(e.target.value.toUpperCase())} placeholder="TICKER" className={`w-28 ${input} uppercase`} onKeyDown={e=>e.key==="Enter"&&loadTradeCoach()} />
                  <button onClick={()=>loadTradeCoach()} className={btn} disabled={coachLoading}>{coachLoading?"Coaching...":"Get Coaching"}</button>
                </div>
                {coachData && !coachData.error && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="text-xl font-bold text-amber-400">{coachData.ticker}</span>
                      <span className={`text-[10px] px-2 py-1 rounded font-bold ${coachData.overall_grade==="A"||coachData.overall_grade==="B"?"bg-emerald-950/50 text-emerald-400 border border-emerald-800":"bg-amber-950/50 text-amber-400 border border-amber-800"}`}>Grade: {coachData.overall_grade}</span>
                      <span className={`text-[10px] px-2 py-1 rounded ${coachData.action==="buy"?"bg-emerald-950/50 text-emerald-400":coachData.action==="sell"?"bg-red-950/50 text-red-400":"bg-amber-950/50 text-amber-400"}`}>{coachData.action?.toUpperCase()}</span>
                    </div>
                    <p className={`text-xs ${bodyText} border-l-2 border-amber-400/30 pl-3`}>{coachData.analysis}</p>
                    {coachData.entry_zone && <div className={`flex gap-6 text-xs border rounded-lg p-3 ${cardBg}`}><span className={dimText}>Entry: <span className="text-amber-400">{coachData.entry_zone}</span></span><span className={dimText}>Stop: <span className="text-red-400">{coachData.stop_loss}</span></span><span className={dimText}>Target: <span className="text-emerald-400">{coachData.target}</span></span></div>}
                    {coachData.checklist?.length > 0 && (
                      <div className={`border rounded-lg p-3 ${cardBg}`}>
                        <div className={`text-xs uppercase tracking-wider mb-2 ${dimText2}`}>Trade Checklist</div>
                        {coachData.checklist.map((c:any,i:number)=><div key={i} className={`text-xs ${bodyText} flex gap-2 py-0.5`}><span>{c.pass?"✅":"❌"}</span><span>{c.item}</span></div>)}
                      </div>
                    )}
                    {coachData.improvements?.length > 0 && (
                      <div className={`border rounded-lg p-3 ${cardBg}`}><div className={`text-xs uppercase tracking-wider mb-1 ${dimText2}`}>Improvements</div>{coachData.improvements.map((imp:string,i:number)=><div key={i} className={`text-xs ${bodyText}`}>💡 {imp}</div>)}</div>
                    )}
                  </div>
                )}
                {coachData?.error && <div className="text-xs text-red-400">{coachData.error}</div>}
              </div>
            )}

            {/* AI Watchlist Scanner */}
            {aiSubTab2==="scanner" && (
              <div className="space-y-4 max-w-4xl">
                <div className={`text-xs uppercase tracking-wider ${dimText2}`}>🔍 AI Watchlist Scanner</div>
                <button onClick={loadWatchlistScan} className={btn} disabled={scanLoading}>{scanLoading?"Scanning watchlist...":"Scan My Watchlist"}</button>
                {scanResult && !scanResult.error && (
                  <div className="space-y-3">
                    {scanResult.market_context && <p className={`text-xs ${bodyText} border-l-2 border-amber-400/30 pl-3`}>{scanResult.market_context}</p>}
                    <div className="grid md:grid-cols-2 gap-3">
                      {scanResult.opportunities?.map((o:any,i:number)=>(
                        <div key={i} className={`border rounded-lg p-3 ${cardBg}`}>
                          <div className="flex justify-between items-start mb-1">
                            <span className={`text-xs font-bold ${headText}`}>{o.ticker}</span>
                            <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${o.signal==="buy"?"bg-emerald-950/50 text-emerald-400":o.signal==="sell"?"bg-red-950/50 text-red-400":"bg-amber-950/50 text-amber-400"}`}>{o.signal}</span>
                          </div>
                          <p className={`text-[10px] ${bodyText} mb-1`}>{o.reasoning}</p>
                          <div className="flex gap-3 text-[10px] font-mono">
                            {o.entry && <span className={dimText}>Entry: <span className="text-amber-400">${o.entry}</span></span>}
                            {o.target && <span className={dimText}>Target: <span className="text-emerald-400">${o.target}</span></span>}
                            <span className={dimText}>Conf: <span className="text-amber-400">{o.confidence}%</span></span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {scanResult?.error && <div className="text-xs text-red-400">{scanResult.error}</div>}
              </div>
            )}

            {/* AI Risk Alerts */}
            {aiSubTab2==="riskalerts" && (
              <div className="space-y-4 max-w-3xl">
                <div className={`text-xs uppercase tracking-wider ${dimText2}`}>⚠️ AI Risk Check</div>
                <button onClick={loadRiskCheck} className={btn} disabled={riskAlertsLoading}>{riskAlertsLoading?"Checking risks...":"Run Risk Check"}</button>
                {riskAlerts && !riskAlerts.error && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <span className={`text-lg font-bold px-3 py-1 rounded ${riskAlerts.overall_risk==="low"?"bg-emerald-950/50 text-emerald-400 border border-emerald-800":riskAlerts.overall_risk==="high"?"bg-red-950/50 text-red-400 border border-red-800":"bg-amber-950/50 text-amber-400 border border-amber-800"}`}>Risk: {riskAlerts.overall_risk?.toUpperCase()}</span>
                      <span className={`text-xs ${dimText}`}>Score: {riskAlerts.risk_score}/100</span>
                    </div>
                    {riskAlerts.alerts?.map((a:any,i:number)=>(
                      <div key={i} className={`border rounded-lg p-3 ${cardBg} ${a.severity==="high"?"border-l-2 border-l-red-500":a.severity==="medium"?"border-l-2 border-l-amber-500":"border-l-2 border-l-emerald-500"}`}>
                        <div className="flex justify-between mb-1"><span className={`text-xs font-bold ${headText}`}>{a.type}</span><span className={`text-[10px] font-bold ${a.severity==="high"?"text-red-400":a.severity==="medium"?"text-amber-400":"text-emerald-400"}`}>{a.severity}</span></div>
                        <p className={`text-[10px] ${bodyText}`}>{a.message}</p>
                        {a.action && <p className={`text-[10px] text-amber-400 mt-1`}>→ {a.action}</p>}
                      </div>
                    ))}
                    {riskAlerts.recommendations?.length > 0 && (
                      <div className={`border rounded-lg p-3 ${cardBg}`}><div className={`text-xs uppercase tracking-wider mb-1 ${dimText2}`}>Recommendations</div>{riskAlerts.recommendations.map((r:string,i:number)=><div key={i} className={`text-xs ${bodyText}`}>• {r}</div>)}</div>
                    )}
                  </div>
                )}
                {riskAlerts?.error && <div className="text-xs text-red-400">{riskAlerts.error}</div>}
              </div>
            )}

            {/* Sentiment Timeline */}
            {aiSubTab2==="senttime" && (
              <div className="space-y-4 max-w-3xl">
                <div className={`text-xs uppercase tracking-wider ${dimText2}`}>📈 Sentiment Timeline</div>
                <div className="flex gap-2">
                  <input value={sentTimelineTicker} onChange={e=>setSentTimelineTicker(e.target.value.toUpperCase())} placeholder="TICKER" className={`w-28 ${input} uppercase`} onKeyDown={e=>e.key==="Enter"&&loadSentTimeline()} />
                  <button onClick={()=>loadSentTimeline()} className={btn} disabled={sentTimelineLoading}>{sentTimelineLoading?"Loading...":"Get Timeline"}</button>
                </div>
                {sentTimeline && !sentTimeline.error && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <span className="text-xl font-bold text-amber-400">{sentTimeline.ticker}</span>
                      <span className={`text-[10px] px-2 py-1 rounded ${sentTimeline.current_sentiment==="bullish"?"bg-emerald-950/50 text-emerald-400":sentTimeline.current_sentiment==="bearish"?"bg-red-950/50 text-red-400":"bg-amber-950/50 text-amber-400"}`}>{sentTimeline.current_sentiment}</span>
                      <span className={`text-[10px] ${dimText}`}>Trend: {sentTimeline.trend_direction}</span>
                    </div>
                    {sentTimeline.timeline?.length > 0 && (
                      <div className="h-48">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={sentTimeline.timeline}>
                            <XAxis dataKey="date" tick={{fontSize:9,fill:dark?"#71717a":"#9ca3af"}} />
                            <YAxis tick={{fontSize:9,fill:dark?"#71717a":"#9ca3af"}} domain={[-100,100]} />
                            <Tooltip contentStyle={{background:dark?"#18181b":"#fff",border:`1px solid ${dark?"#3f3f46":"#e5e7eb"}`,fontSize:11}} />
                            <Area type="monotone" dataKey="score" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.15} />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    )}
                    {sentTimeline.key_events?.length > 0 && (
                      <div className={`border rounded-lg p-3 ${cardBg}`}><div className={`text-xs uppercase tracking-wider mb-1 ${dimText2}`}>Key Events</div>{sentTimeline.key_events.map((ev:any,i:number)=><div key={i} className={`text-xs ${bodyText} flex gap-2 py-0.5`}><span className={dimText}>{ev.date}</span><span>{ev.event}</span><span className={ev.impact==="positive"?"text-emerald-400":"text-red-400"}>{ev.impact}</span></div>)}</div>
                    )}
                  </div>
                )}
                {sentTimeline?.error && <div className="text-xs text-red-400">{sentTimeline.error}</div>}
              </div>
            )}

            {/* ML Prediction */}
            {aiSubTab2==="predict" && (
              <div className="space-y-4 max-w-3xl">
                <div className={`text-xs uppercase tracking-wider ${dimText2}`}>🤖 ML Price Prediction</div>
                <div className="flex gap-2">
                  <input value={mlTicker} onChange={e=>setMlTicker(e.target.value.toUpperCase())} placeholder="TICKER" className={`w-28 ${input} uppercase`} onKeyDown={e=>e.key==="Enter"&&loadMlPredict()} />
                  <button onClick={()=>loadMlPredict()} className={btn} disabled={mlLoading}>{mlLoading?"Predicting...":"Predict"}</button>
                </div>
                {mlPrediction && !mlPrediction.error && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="text-xl font-bold text-amber-400">{mlPrediction.ticker}</span>
                      <span className={`text-sm font-bold ${mlPrediction.direction==="up"?"text-emerald-400":"text-red-400"}`}>{mlPrediction.direction==="up"?"▲":"▼"} {mlPrediction.direction}</span>
                      <span className={`text-[10px] px-2 py-1 rounded ${dark?"bg-zinc-800 text-zinc-400":"bg-gray-100 text-gray-600"}`}>Conf: {mlPrediction.confidence}%</span>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      {mlPrediction.predictions?.map((p:any,i:number)=>(
                        <div key={i} className={`border rounded-lg p-3 text-center ${cardBg}`}>
                          <div className={`text-[10px] ${dimText} mb-1`}>{p.timeframe}</div>
                          <div className={`text-sm font-bold ${p.predicted_change>=0?"text-emerald-400":"text-red-400"}`}>{p.predicted_change>=0?"+":""}{p.predicted_change?.toFixed(2)}%</div>
                          <div className={`text-[10px] font-mono ${dimText}`}>${p.predicted_price?.toFixed(2)}</div>
                        </div>
                      ))}
                    </div>
                    {mlPrediction.factors?.length > 0 && (
                      <div className={`border rounded-lg p-3 ${cardBg}`}><div className={`text-xs uppercase tracking-wider mb-1 ${dimText2}`}>Key Factors</div>{mlPrediction.factors.map((f:any,i:number)=><div key={i} className={`text-xs ${bodyText} flex justify-between py-0.5`}><span>{f.factor}</span><span className={f.impact==="positive"?"text-emerald-400":"text-red-400"}>{f.weight}%</span></div>)}</div>
                    )}
                    <p className={`text-[10px] ${dimText} italic`}>⚠️ Predictions are AI-generated estimates, not financial advice.</p>
                  </div>
                )}
                {mlPrediction?.error && <div className="text-xs text-red-400">{mlPrediction.error}</div>}
              </div>
            )}

            {/* AI Deep Review */}
            {aiSubTab2==="deepreview" && (
              <div className="space-y-4 max-w-3xl">
                <div className={`text-xs uppercase tracking-wider ${dimText2}`}>📓 AI Journal Deep Review</div>
                <p className={`text-xs ${dimText}`}>Claude analyzes your entire trading journal to find recurring patterns, emotional biases, and improvement areas.</p>
                <button onClick={loadDeepReview} className={btn} disabled={deepReviewLoading}>{deepReviewLoading?"Analyzing journal...":"Run Deep Review"}</button>
                {deepReview && !deepReview.error && (
                  <div className="space-y-3">
                    {deepReview.patterns?.length > 0 && (
                      <div className={`border rounded-lg p-3 ${cardBg}`}>
                        <div className={`text-xs uppercase tracking-wider mb-2 ${dimText2}`}>Recurring Patterns</div>
                        {deepReview.patterns.map((p:any,i:number)=>(
                          <div key={i} className={`text-xs ${bodyText} py-1 border-b last:border-0 ${borderDim2}`}>
                            <span className="font-bold text-amber-400">{p.pattern}</span>
                            <span className={`ml-2 ${dimText}`}>— {p.description}</span>
                            <span className={`ml-2 text-[10px] ${p.impact==="positive"?"text-emerald-400":"text-red-400"}`}>{p.frequency} occurrences</span>
                          </div>
                        ))}
                      </div>
                    )}
                    {deepReview.biases?.length > 0 && (
                      <div className={`border rounded-lg p-3 ${cardBg}`}>
                        <div className={`text-xs uppercase tracking-wider mb-2 ${dimText2}`}>Detected Biases</div>
                        {deepReview.biases.map((b:any,i:number)=>(
                          <div key={i} className={`text-xs ${bodyText} py-1`}>⚠️ <span className="font-bold">{b.bias}</span>: {b.evidence}</div>
                        ))}
                      </div>
                    )}
                    {deepReview.recommendations?.length > 0 && (
                      <div className={`border rounded-lg p-3 ${cardBg}`}>
                        <div className={`text-xs uppercase tracking-wider mb-2 ${dimText2}`}>Recommendations</div>
                        {deepReview.recommendations.map((r:string,i:number)=>(<div key={i} className={`text-xs ${bodyText} py-0.5`}>✅ {r}</div>))}
                      </div>
                    )}
                    {deepReview.summary && <p className={`text-sm ${bodyText} border-l-2 border-violet-500/30 pl-3`}>{deepReview.summary}</p>}
                  </div>
                )}
                {deepReview?.error && <div className="text-xs text-red-400">{deepReview.error}</div>}
              </div>
            )}

            {/* AI Portfolio Doctor */}
            {aiSubTab2==="doctor" && (
              <div className="space-y-4 max-w-3xl">
                <div className={`text-xs uppercase tracking-wider ${dimText2}`}>🩺 AI Portfolio Doctor</div>
                <p className={`text-xs ${dimText}`}>Get a comprehensive health check on your portfolio with actionable advice.</p>
                <button onClick={loadDoctor} className={btn} disabled={doctorLoading}>{doctorLoading?"Diagnosing...":"Run Health Check"}</button>
                {doctorData && !doctorData.error && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <span className={`text-2xl font-bold ${(doctorData.health_score||0)>=70?"text-emerald-400":(doctorData.health_score||0)>=40?"text-amber-400":"text-red-400"}`}>{doctorData.health_score}<span className={`text-sm ${dimText}`}>/100</span></span>
                      <span className={`text-xs font-bold uppercase px-2 py-1 rounded ${(doctorData.health_score||0)>=70?"bg-emerald-950/40 text-emerald-400":(doctorData.health_score||0)>=40?"bg-amber-950/40 text-amber-400":"bg-red-950/40 text-red-400"}`}>{doctorData.diagnosis}</span>
                    </div>
                    {doctorData.issues?.length > 0 && (
                      <div className={`border rounded-lg p-3 ${cardBg}`}>
                        <div className={`text-xs uppercase tracking-wider mb-2 ${dimText2}`}>Issues Found</div>
                        {doctorData.issues.map((issue:any,i:number)=>(
                          <div key={i} className={`text-xs py-1.5 border-b last:border-0 ${borderDim2}`}>
                            <span className={`font-bold ${issue.severity==="high"?"text-red-400":issue.severity==="medium"?"text-amber-400":"text-blue-400"}`}>{issue.severity==="high"?"🔴":issue.severity==="medium"?"🟡":"🔵"} {issue.issue}</span>
                            <p className={`${dimText} mt-0.5`}>{issue.recommendation}</p>
                          </div>
                        ))}
                      </div>
                    )}
                    {doctorData.strengths?.length > 0 && (
                      <div className={`border rounded-lg p-3 ${cardBg}`}>
                        <div className={`text-xs uppercase tracking-wider mb-2 ${dimText2}`}>Strengths</div>
                        {doctorData.strengths.map((s:string,i:number)=>(<div key={i} className={`text-xs ${bodyText} py-0.5`}>💪 {s}</div>))}
                      </div>
                    )}
                    {doctorData.prescription && <p className={`text-sm ${bodyText} border-l-2 border-emerald-500/30 pl-3`}>💊 {doctorData.prescription}</p>}
                  </div>
                )}
                {doctorData?.error && <div className="text-xs text-red-400">{doctorData.error}</div>}
              </div>
            )}

            {/* AI Market Narrative */}
            {aiSubTab2==="narrative" && (
              <div className="space-y-4 max-w-3xl">
                <div className={`text-xs uppercase tracking-wider ${dimText2}`}>📖 AI Market Narrative</div>
                <p className={`text-xs ${dimText}`}>AI-generated narrative of today's market story — what happened, why, and what to watch.</p>
                <button onClick={loadNarrative} className={btn} disabled={narrativeLoading}>{narrativeLoading?"Crafting narrative...":"Generate Narrative"}</button>
                {narrative && !narrative.error && (
                  <div className="space-y-3">
                    {narrative.headline && <h3 className={`text-lg font-bold ${headText}`}>{narrative.headline}</h3>}
                    {narrative.story && <p className={`text-sm leading-relaxed ${bodyText}`}>{narrative.story}</p>}
                    {narrative.key_themes?.length > 0 && (
                      <div className="flex gap-2 flex-wrap">
                        {narrative.key_themes.map((t:string,i:number)=>(<span key={i} className={`text-[10px] px-2 py-1 rounded-lg ${dark?"bg-violet-950/40 text-violet-300 border border-violet-800/50":"bg-blue-50 text-blue-700 border border-blue-200"}`}>{t}</span>))}
                      </div>
                    )}
                    {narrative.sectors && (
                      <div className={`border rounded-lg p-3 ${cardBg}`}>
                        <div className={`text-xs uppercase tracking-wider mb-2 ${dimText2}`}>Sector Spotlight</div>
                        <div className="grid grid-cols-2 gap-2">
                          {Object.entries(narrative.sectors).map(([sec,val]:any)=>(
                            <div key={sec} className="flex justify-between text-xs">
                              <span className={bodyText}>{sec}</span>
                              <span className={val?.change>=0?"text-emerald-400":"text-red-400"}>{val?.change>=0?"+":""}{val?.change?.toFixed(1)}%</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {narrative.watch_tomorrow?.length > 0 && (
                      <div className={`border rounded-lg p-3 ${cardBg}`}>
                        <div className={`text-xs uppercase tracking-wider mb-2 ${dimText2}`}>Watch Tomorrow</div>
                        {narrative.watch_tomorrow.map((w:string,i:number)=>(<div key={i} className={`text-xs ${bodyText} py-0.5`}>👁 {w}</div>))}
                      </div>
                    )}
                  </div>
                )}
                {narrative?.error && <div className="text-xs text-red-400">{narrative.error}</div>}
              </div>
            )}
          </div>
        )}

        {/* ── OPTIONS FLOW ─────────────────────────────────── */}
        {tab==="options" && (
          <div className="space-y-4">
            <OptionsJournal />
            <div className="border-t border-zinc-800 my-6 pt-4"></div>
            <div className={`text-xs uppercase tracking-wider ${dimText2}`}>Options Flow & Chain</div>
            <div className="flex gap-2 items-center flex-wrap">
              <input value={optTicker} onChange={e=>setOptTicker(e.target.value.toUpperCase())} placeholder="TICKER" className={`w-28 ${input} uppercase`} onKeyDown={e=>e.key==="Enter"&&loadOptions()} />
              <button onClick={()=>loadOptions()} disabled={optLoading} className={`${btn} ${optLoading?"opacity-50":""}`}>{optLoading?"LOADING...":"LOAD CHAIN"}</button>
              <div className="flex gap-0.5">
                <button onClick={()=>setOptType("CALL")} className={`px-3 py-1.5 text-xs rounded-lg ${optType==="CALL"?"bg-emerald-600 text-white font-bold":`border ${dark?"border-zinc-700 text-zinc-500":"border-gray-300 text-gray-500"}`}`}>CALLS</button>
                <button onClick={()=>setOptType("PUT")} className={`px-3 py-1.5 text-xs rounded-lg ${optType==="PUT"?"bg-red-600 text-white font-bold":`border ${dark?"border-zinc-700 text-zinc-500":"border-gray-300 text-gray-500"}`}`}>PUTS</button>
              </div>
              <button onClick={()=>goToChart(optTicker)} className={btnOutline}>📊 Chart</button>
              <button onClick={()=>{setTab("ai");setAiTicker(optTicker);setTimeout(()=>runAI(optTicker),100);}} className={btnOutline}>🧠 AI</button>
            </div>

            {/* Unusual Activity */}
            {optUnusual.length > 0 && (
              <div>
                <div className="text-amber-400 text-xs font-bold uppercase tracking-widest mb-2">⚡ Unusual Activity</div>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs border-collapse min-w-[600px]">
                    <thead><tr className={`text-left border-b ${dark?"text-zinc-600 border-zinc-800":"text-gray-500 border-gray-200"}`}>
                      {["Strike","Type","Exp","Vol","OI","Vol/OI","Last","IV"].map(h=><th key={h} className="py-2 px-2">{h}</th>)}
                    </tr></thead>
                    <tbody>
                      {optUnusual.slice(0,15).map((u:any,i:number)=>(
                        <tr key={i} className={`border-b ${dark?"border-zinc-900/30 hover:bg-zinc-900/50":"border-gray-100 hover:bg-gray-50"}`}>
                          <td className="py-1.5 px-2 font-mono font-bold">${u.strike}</td>
                          <td className={`py-1.5 px-2 font-bold ${u.type==="call"?"text-emerald-400":"text-red-400"}`}>{u.type?.toUpperCase()}</td>
                          <td className={`py-1.5 px-2 ${dimText}`}>{u.expiration}</td>
                          <td className="py-1.5 px-2 text-amber-400 font-bold">{u.volume?.toLocaleString()}</td>
                          <td className={`py-1.5 px-2 ${dimText}`}>{u.openInterest?.toLocaleString()}</td>
                          <td className={`py-1.5 px-2 font-bold ${u.volOiRatio > 3 ? "text-red-400" : u.volOiRatio > 1.5 ? "text-amber-400" : dimText}`}>{u.volOiRatio}x</td>
                          <td className="py-1.5 px-2 font-mono">${u.lastPrice?.toFixed(2)}</td>
                          <td className={`py-1.5 px-2 ${dimText}`}>{u.impliedVol ? (u.impliedVol * 100).toFixed(0) + "%" : "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Options Chain */}
            {optChain?.data?.length > 0 && (
              <div>
                <div className={`text-xs font-bold uppercase tracking-widest mb-2 ${dimText}`}>Chain — {optType}S</div>
                {optChain.data.slice(0,3).map((exp:any,ei:number)=>(
                  <div key={ei} className="mb-4">
                    <div className="text-amber-400 text-xs font-bold mb-1">Exp: {exp.expirationDate}</div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs border-collapse min-w-[700px]">
                        <thead><tr className={`text-left border-b ${dark?"text-zinc-600 border-zinc-800":"text-gray-500 border-gray-200"}`}>
                          {["Strike","Last","Bid","Ask","Vol","OI","IV","Delta","Gamma","Theta"].map(h=><th key={h} className="py-1 px-2">{h}</th>)}
                        </tr></thead>
                        <tbody>
                          {(exp.options?.[optType] || []).slice(0,20).map((opt:any,oi:number)=>{
                            const iv = opt.impliedVolatility ? (opt.impliedVolatility * 100).toFixed(0) : "—";
                            const volHeat = (opt.volume||0) > 500 ? "text-amber-400 font-bold" : dimText;
                            return (
                              <tr key={oi} className={`border-b ${dark?"border-zinc-900/20 hover:bg-zinc-900/30":"border-gray-50 hover:bg-gray-50"}`}>
                                <td className="py-1 px-2 font-mono font-bold">${opt.strike?.toFixed(1)}</td>
                                <td className="py-1 px-2 font-mono">${opt.lastPrice?.toFixed(2) ?? "—"}</td>
                                <td className="py-1 px-2 font-mono text-emerald-400">{opt.bid?.toFixed(2) ?? "—"}</td>
                                <td className="py-1 px-2 font-mono text-red-400">{opt.ask?.toFixed(2) ?? "—"}</td>
                                <td className={`py-1 px-2 ${volHeat}`}>{opt.volume?.toLocaleString() ?? "—"}</td>
                                <td className={`py-1 px-2 ${dimText}`}>{opt.openInterest?.toLocaleString() ?? "—"}</td>
                                <td className={`py-1 px-2 ${Number(iv) > 60 ? "text-red-400 font-bold" : dimText}`}>{iv}%</td>
                                <td className={`py-1 px-2 ${dimText}`}>{opt.delta?.toFixed(3) ?? "—"}</td>
                                <td className={`py-1 px-2 ${dimText}`}>{opt.gamma?.toFixed(4) ?? "—"}</td>
                                <td className={`py-1 px-2 ${dimText}`}>{opt.theta?.toFixed(4) ?? "—"}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {!optChain && !optLoading && <div className={`text-xs text-center py-16 ${dimText3}`}>Enter a ticker and click LOAD CHAIN</div>}
          </div>
        )}

        {/* ── BROKERAGES (Enhanced Phase 10) ──────────────── */}
        {tab==="robinhood" && (
          <div className="space-y-6">
            <div className="flex items-center gap-3 flex-wrap">
              <div className={`text-xs uppercase tracking-wider ${dimText2}`}>Brokerage Accounts</div>
              <button onClick={loadAllAccounts} className={btnOutline}>↻ Refresh All</button>
              <button onClick={() => setShowOrderForm(!showOrderForm)} className={`${showOrderForm ? btn : btnOutline} text-[10px]`}>{showOrderForm ? "✕ Close" : "📝 Place Order"}</button>
            </div>

            {/* All accounts summary cards */}
            {allAccounts.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {allAccounts.map((a: any) => (
                  <div key={a.key} onClick={() => { if (a.broker === "fidelity") { setFidAccount(a.key); loadFidPortfolio(a.key); } }} className={`border rounded-lg p-3 cursor-pointer transition-all ${fidAccount === a.key && a.broker === "fidelity" ? `border-emerald-600 ${dark ? "bg-emerald-950/20" : "bg-emerald-50"}` : cardBg}`}>
                    <div className="flex items-center justify-between mb-1">
                      <span className={`text-xs uppercase tracking-wider ${dimText2}`}>{a.broker}</span>
                      {a.broker === "custom" && <button onClick={(e) => { e.stopPropagation(); deleteCustomAccount(a.key); }} className={`text-[10px] ${dimText3} hover:text-red-400`}>✕</button>}
                    </div>
                    <div className={`text-[10px] font-bold ${headText}`}>{a.name}</div>
                    <div className={`text-lg font-bold font-mono ${headText}`}>${a.total_value?.toLocaleString("en-US", { minimumFractionDigits: 2 })}</div>
                    <div className={`text-[10px] ${dimText}`}>{a.holdings_count} positions</div>
                  </div>
                ))}
              </div>
            )}

            {/* Add custom account */}
            <div className="flex items-center gap-2 flex-wrap">
              <input value={newAcctName} onChange={e => setNewAcctName(e.target.value)} placeholder="Account name" className={`${input} text-xs`} onKeyDown={e => e.key === "Enter" && createCustomAccount()} />
              <select value={newAcctBroker} onChange={e => setNewAcctBroker(e.target.value)} className={input}>
                {["custom", "fidelity", "schwab", "td_ameritrade", "robinhood", "etrade", "moomoo"].map(b => <option key={b} value={b}>{b}</option>)}
              </select>
              <button onClick={createCustomAccount} className={btnOutline}>+ Add Account</button>
            </div>

            {/* Live Order Form (Robinhood) */}
            {showOrderForm && (
              <div className={`border rounded-lg p-4 ${cardBg} space-y-3`}>
                <div className={`text-xs uppercase tracking-wider ${dimText2}`}>📝 Place Order (Robinhood)</div>
                {!rhStatus?.logged_in ? (
                  <div className="text-xs text-amber-400">⚠️ Not connected to Robinhood. Login first via the Robinhood section below.</div>
                ) : (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                      <input value={orderForm.ticker} onChange={e => setOrderForm({ ...orderForm, ticker: e.target.value.toUpperCase() })} placeholder="AAPL" className={`${input} uppercase`} />
                      <select value={orderForm.side} onChange={e => setOrderForm({ ...orderForm, side: e.target.value })} className={input}>
                        <option value="buy">BUY</option>
                        <option value="sell">SELL</option>
                      </select>
                      <input value={orderForm.quantity} onChange={e => setOrderForm({ ...orderForm, quantity: e.target.value })} placeholder="Qty" className={input} type="number" />
                      <select value={orderForm.order_type} onChange={e => setOrderForm({ ...orderForm, order_type: e.target.value })} className={input}>
                        <option value="market">Market</option>
                        <option value="limit">Limit</option>
                        <option value="stop">Stop</option>
                      </select>
                      {(orderForm.order_type === "limit" || orderForm.order_type === "stop") && (
                        <input value={orderForm.limit_price} onChange={e => setOrderForm({ ...orderForm, limit_price: e.target.value })} placeholder="Price" className={input} type="number" step="0.01" />
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <button onClick={submitOrder} disabled={orderSubmitting} className={`${btn} ${orderForm.side === "sell" ? "bg-red-600 hover:bg-red-700" : ""} ${orderSubmitting ? "opacity-50" : ""}`}>{orderSubmitting ? "Submitting..." : `${orderForm.side.toUpperCase()} ${orderForm.quantity || 0} ${orderForm.ticker || "..."}`}</button>
                      {orderResult && (
                        <span className={`text-xs ${orderResult.error ? "text-red-400" : "text-emerald-400"}`}>
                          {orderResult.error || `✅ Order ${orderResult.status}: ${orderResult.order_id?.slice(0, 8)}...`}
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Fidelity Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-3 flex-wrap">
                <span className="text-emerald-400 font-bold text-sm">FIDELITY</span>
                {fidAccounts.length > 0 && (<select value={fidAccount} onChange={e => { setFidAccount(e.target.value); loadFidPortfolio(e.target.value); }} className={input}>{fidAccounts.map((a: any) => <option key={a.key} value={a.key}>{a.name}</option>)}</select>)}
                <button onClick={() => loadFidPortfolio()} disabled={fidLoading} className={`${btn} ${fidLoading ? "opacity-50" : ""}`}>{fidLoading ? "REFRESHING..." : "LIVE PRICES"}</button>
              </div>
              {fidPortfolio?.holdings?.length > 0 && (<div><div className="flex items-center gap-6 mb-3 flex-wrap"><div className={`text-xs font-bold uppercase tracking-widest ${dimText}`}>{fidPortfolio.name}</div><div className={`text-xs ${dimText}`}>Value: <span className={`font-bold ${headText}`}>${fidPortfolio.total_value?.toLocaleString("en-US", { minimumFractionDigits: 2 })}</span></div><div className={`text-xs ${dimText}`}>P&L: <span className={`font-bold ${fidPortfolio.total_gl >= 0 ? "text-emerald-400" : "text-red-400"}`}>{fidPortfolio.total_gl >= 0 ? "+" : ""}${fidPortfolio.total_gl?.toLocaleString("en-US", { minimumFractionDigits: 2 })}</span></div></div><div className="overflow-x-auto"><table className="w-full text-xs border-collapse min-w-[850px]"><thead><tr className={`text-left border-b ${dark ? "text-zinc-600 border-zinc-800" : "text-gray-500 border-gray-200"}`}>{["Ticker", "Name", "Shares", "Avg Cost", "Price", "Value", "P&L $", "P&L %", "Today", ""].map(h => <th key={h} className="py-2 px-2">{h}</th>)}</tr></thead><tbody>{fidPortfolio.holdings.map((h: any, i: number) => (<tr key={i} className={`border-b ${dark ? "border-zinc-900/30 hover:bg-zinc-900/50" : "border-gray-100 hover:bg-gray-50"}`}><td className="py-2 px-2"><span className="text-amber-400 font-bold cursor-pointer hover:text-amber-300" onClick={() => goToChart(h.ticker)}>{h.ticker}</span></td><td className={`py-2 px-2 truncate max-w-[140px] ${dimText}`}>{h.name?.split(" ").slice(0, 3).join(" ")}</td><td className="py-2 px-2 font-mono">{h.shares?.toFixed(h.shares % 1 ? 3 : 0)}</td><td className="py-2 px-2 font-mono">{h.avg_cost != null ? `$${h.avg_cost.toFixed(2)}` : "---"}</td><td className={`py-2 px-2 font-mono ${headText}`}>{h.last_price != null ? `$${h.last_price.toFixed(2)}` : "---"}</td><td className={`py-2 px-2 font-mono font-bold ${headText}`}>{h.current_value != null ? `$${h.current_value.toLocaleString("en-US", { minimumFractionDigits: 2 })}` : "---"}</td><td className={`py-2 px-2 font-mono font-bold ${h.total_gl != null && h.total_gl >= 0 ? "text-emerald-400" : "text-red-400"}`}>{h.total_gl != null ? `${h.total_gl >= 0 ? "+" : ""}$${Math.abs(h.total_gl).toFixed(2)}` : "---"}</td><td className={`py-2 px-2 font-mono ${h.total_gl_pct != null && h.total_gl_pct >= 0 ? "text-emerald-400" : "text-red-400"}`}>{h.total_gl_pct != null ? `${h.total_gl_pct >= 0 ? "+" : ""}${h.total_gl_pct.toFixed(1)}%` : "---"}</td><td className={`py-2 px-2 font-mono text-[11px] ${h.today_gl != null && h.today_gl >= 0 ? "text-emerald-400" : "text-red-400"}`}>{h.today_gl != null ? `${h.today_gl >= 0 ? "+" : ""}$${h.today_gl.toFixed(0)}` : "---"}</td><td className="py-2 px-2"><div className="flex gap-1"><button onClick={() => goToChart(h.ticker)} className={`text-[10px] ${dimText2} hover:text-amber-400`}>C</button><button onClick={() => { setTab("ai"); setAiTicker(h.ticker); setTimeout(() => runAI(h.ticker), 100); }} className={`text-[10px] ${dimText2} hover:text-violet-400`}>A</button></div></td></tr>))}</tbody></table></div></div>)}
              {fidAccounts.length === 0 && <div className={`text-xs text-center py-8 ${dimText3}`}>No Fidelity data.</div>}
            </div>
          </div>
        )}

        {/* ── QUOTES ───────────────────────────────────────── */}
        {tab==="quotes" && (
          <div className="max-w-lg space-y-4">
            <div className={`text-xs uppercase tracking-wider ${dimText2}`}>Live Quote Lookup</div>
            <div className="flex gap-2"><input value={tickerInput} onChange={e=>setTickerInput(e.target.value)} placeholder="AAPL,MSFT,NVDA" className={`flex-1 ${input} uppercase`} onKeyDown={e=>e.key==="Enter"&&fetchQuotes()} /><button onClick={fetchQuotes} className={btn}>GET</button></div>
            {Object.entries(quotes).map(([t,p])=>(<div key={t} className={`flex justify-between items-center border px-3 py-3 rounded-lg cursor-pointer ${cardBg} hover:border-amber-500/50`} onClick={()=>goToChart(t)}><span className="text-amber-400 font-bold text-base">{t}</span><span className={`font-mono font-bold text-base ${headText}`}>{p!=null?`$${fmt(p)}`:"N/A"}</span></div>))}
          </div>
        )}

        {/* ── WATCHLIST ─────────────────────────────────────── */}
        {tab==="watchlist" && (
          <div className="space-y-4 max-w-md">
            <div className="flex items-center justify-between">
              <div className={`text-xs uppercase tracking-wider ${dimText2}`}>Watchlist{activeWatchlist ? ` — ${activeWatchlist}` : ""}</div>
              <button onClick={() => window.open(`${BASE}/export/watchlist`, "_blank")} className={btnOutline} title="Export CSV">Export CSV</button>
            </div>
            {/* Named Watchlists selector */}
            <div className="flex gap-1.5 items-center flex-wrap">
              <button onClick={()=>{setActiveWatchlist("");loadWatchlist();}} className={`text-[10px] px-2 py-1 rounded-lg ${!activeWatchlist?(dark?"bg-amber-600 text-black font-bold":"bg-blue-600 text-white font-bold"):`border ${dark?"border-zinc-700 text-zinc-400":"border-gray-300 text-gray-500"} hover:border-amber-500/50`}`}>Default</button>
              {namedWatchlists.map(n=>(
                <div key={n} className="flex items-center gap-0">
                  <button onClick={()=>loadNamedWatchlist(n)} className={`text-[10px] px-2 py-1 rounded-l-sm ${activeWatchlist===n?(dark?"bg-amber-600 text-black font-bold":"bg-blue-600 text-white font-bold"):`border ${dark?"border-zinc-700 text-zinc-400":"border-gray-300 text-gray-500"} hover:border-amber-500/50`}`}>{n}</button>
                  <button onClick={()=>deleteNamedWatchlist(n)} className={`text-[10px] px-1 py-1 rounded-r-sm border-l-0 ${dark?"border border-zinc-700 text-zinc-600 hover:text-red-400":"border border-gray-300 text-gray-400 hover:text-red-500"}`}>✕</button>
                </div>
              ))}
              <button onClick={()=>setShowNewWl(!showNewWl)} className={`text-[10px] px-2 py-1 rounded-lg border ${dark?"border-zinc-700 text-zinc-500 hover:border-amber-600":"border-gray-300 text-gray-500 hover:border-blue-500"}`}>+ New</button>
            </div>
            {showNewWl && (
              <div className="flex gap-1.5">
                <input value={newWlName} onChange={e=>setNewWlName(e.target.value)} placeholder="Watchlist name" className={`flex-1 text-xs ${input}`} onKeyDown={e=>e.key==="Enter"&&createNamedWatchlist(newWlName)} />
                <button onClick={()=>createNamedWatchlist(newWlName)} className={btn}>Create</button>
              </div>
            )}
            <div className="flex gap-2"><input value={wlInput} onChange={e=>setWlInput(e.target.value)} placeholder="Ticker" className={`flex-1 ${input} uppercase`} onKeyDown={e=>e.key==="Enter"&&addToNamedWatchlist(wlInput)} /><button onClick={()=>addToNamedWatchlist(wlInput)} className={btn}>ADD</button></div>
            {watchlist.map((t, idx)=>(
              <div key={t}
                draggable
                onDragStart={()=>setDragIdx(idx)}
                onDragOver={(e)=>{e.preventDefault();}}
                onDrop={()=>{
                  if (dragIdx===null||dragIdx===idx) return;
                  const arr = [...watchlist];
                  const [item] = arr.splice(dragIdx, 1);
                  arr.splice(idx, 0, item);
                  setWatchlist(arr);
                  setDragIdx(null);
                }}
                onDragEnd={()=>setDragIdx(null)}
                className={`flex justify-between items-center border px-3 py-2 rounded-lg group cursor-grab active:cursor-grabbing ${cardBg} ${dragIdx===idx?"opacity-50":""}`}>
                <div className="flex gap-6 items-center">
                  <span className={`${dimText3} text-[10px] mr-1`}>⠿</span>
                  <span className="text-amber-400 font-bold w-16 cursor-pointer hover:text-amber-300" onClick={()=>goToChart(t)}>{t}</span>
                  <span className={`font-mono ${headText}`}>{wlPrices[t]!=null?`$${fmt(wlPrices[t]!)}`:"—"}</span>
                </div>
                <button onClick={()=>removeFromWatchlist(t)} className={`${dimText3} hover:text-red-400 opacity-0 group-hover:opacity-100`}>✕</button>
              </div>
            ))}
            {!watchlist.length && <div className={`text-xs text-center py-8 ${dimText3}`}>Empty watchlist. Add tickers above.</div>}
          </div>
        )}

        {/* ── PORTFOLIO ─────────────────────────────────────── */}
        {tab==="portfolio" && (
          <div className="space-y-4">
            {/* Header row */}
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-3">
                <div className={`text-xs uppercase tracking-wider ${dimText2}`}>Portfolio{portfolioAccount.name ? ` — ${portfolioAccount.name}` : ""}</div>
                {portfolioAccount.number && <span className={`text-[10px] font-mono px-2 py-0.5 rounded ${dark?"bg-zinc-900 text-zinc-500":"bg-gray-100 text-gray-500"}`}>{portfolioAccount.number}</span>}
                {portfolioAccount.type && <span className={`text-[10px] px-2 py-0.5 rounded ${dark?"bg-amber-950/30 text-amber-500":"bg-amber-50 text-amber-600"}`}>{portfolioAccount.type}</span>}
              </div>
              <div className="flex gap-2">
                <button onClick={() => window.open(`${BASE}/export/portfolio/${portfolioName}`, "_blank")} className={btnOutline} title="Export CSV">Export CSV</button>
              </div>
            </div>

            {/* Summary cards — always use Fidelity data */}
            {fidelitySummary ? (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className={`border rounded-lg p-3 ${cardBg}`}>
                  <div className={`text-xs uppercase tracking-wider mb-1 ${dimText2}`}>Account Value</div>
                  <div className={`text-lg font-bold font-mono ${headText}`}>${fmt(fidelitySummary.total_value)}</div>
                  <div className={`text-[10px] ${dimText}`}>{fidelityPositions.filter((p:any)=>!p.is_option&&!p.is_cash).length} stocks · {fidelityPositions.filter((p:any)=>p.is_option).length} options</div>
                </div>
                <div className={`border rounded-lg p-3 ${cardBg}`}>
                  <div className={`text-xs uppercase tracking-wider mb-1 ${dimText2}`}>Total P&L</div>
                  <div className={`text-lg font-bold font-mono ${clr(fidelitySummary.total_gain)}`}>{fidelitySummary.total_gain>=0?"+":""}${fmt(fidelitySummary.total_gain)}</div>
                  <div className={`text-[10px] font-mono ${clr(fidelitySummary.total_gain_pct)}`}>{fidelitySummary.total_gain_pct>=0?"+":""}{fidelitySummary.total_gain_pct.toFixed(2)}%</div>
                </div>
                <div className={`border rounded-lg p-3 ${cardBg}`}>
                  <div className={`text-xs uppercase tracking-wider mb-1 ${dimText2}`}>Cash</div>
                  <div className={`text-lg font-bold font-mono ${headText}`}>${fmt(fidelitySummary.total_cash)}</div>
                  <div className={`text-[10px] ${dimText2}`}>{fidelitySummary.total_value > 0 ? ((fidelitySummary.total_cash / fidelitySummary.total_value) * 100).toFixed(1) : 0}% of account</div>
                </div>
                <div className={`border rounded-lg p-3 ${cardBg}`}>
                  <div className={`text-xs uppercase tracking-wider mb-1 ${dimText2}`}>Day P&L</div>
                  <div className={`text-lg font-bold font-mono ${clr(fidelitySummary.day_gain)}`}>{(fidelitySummary.day_gain||0)>=0?"+":""}${fmt(fidelitySummary.day_gain||0)}</div>
                  <div className={`text-[10px] ${clr(fidelitySummary.day_gain)}`}>{fidelitySummary.total_value>0?(((fidelitySummary.day_gain||0)/fidelitySummary.total_value)*100).toFixed(2):0}%</div>
                </div>
              </div>
            ) : portfolioRows.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className={`border rounded-lg p-3 ${cardBg}`}>
                  <div className={`text-xs uppercase tracking-wider mb-1 ${dimText2}`}>Account Value</div>
                  <div className={`text-lg font-bold font-mono ${headText}`}>${fmt(totalAccountValue)}</div>
                </div>
                <div className={`border rounded-lg p-3 ${cardBg}`}>
                  <div className={`text-xs uppercase tracking-wider mb-1 ${dimText2}`}>Total P&L</div>
                  <div className={`text-lg font-bold font-mono ${clr(totalAccountPnl)}`}>{totalAccountPnl>=0?"+":""}${fmt(totalAccountPnl)}</div>
                  <div className={`text-[10px] font-mono ${clr(totalAccountPnlPct)}`}>{totalAccountPnlPct>=0?"+":""}{totalAccountPnlPct.toFixed(2)}%</div>
                </div>
                <div className={`border rounded-lg p-3 ${cardBg}`}>
                  <div className={`text-xs uppercase tracking-wider mb-1 ${dimText2}`}>Cash</div>
                  <div className={`text-lg font-bold font-mono ${headText}`}>${fmt(portfolioCash)}</div>
                </div>
                <div className={`border rounded-lg p-3 ${cardBg}`}>
                  <div className={`text-xs uppercase tracking-wider mb-1 ${dimText2}`}>Positions</div>
                  <div className={`text-lg font-bold font-mono ${headText}`}>{portfolioRows.length}</div>
                </div>
              </div>
            )}

            {/* Risk Metrics Row */}
            {portfolioRows.length > 0 && (
              <div className={`grid grid-cols-3 sm:grid-cols-5 gap-2`}>
                <div className={`border rounded-lg p-2 text-center ${cardBg}`}>
                  <div className={`text-[11px] uppercase tracking-wider ${dimText2}`}>Concentration</div>
                  <div className={`text-sm font-bold font-mono ${top3Concentration > 60 ? "text-red-400" : top3Concentration > 40 ? "text-amber-400" : "text-emerald-400"}`}>{top3Concentration.toFixed(1)}%</div>
                  <div className={`text-[8px] ${dimText2}`}>Top 3 holdings</div>
                </div>
                <div className={`border rounded-lg p-2 text-center ${cardBg}`}>
                  <div className={`text-[11px] uppercase tracking-wider ${dimText2}`}>Diversification</div>
                  <div className={`text-sm font-bold font-mono ${diversificationScore > 70 ? "text-emerald-400" : diversificationScore > 50 ? "text-amber-400" : "text-red-400"}`}>{diversificationScore}%</div>
                  <div className={`text-[8px] ${dimText2}`}>1 - HHI</div>
                </div>
                <div className={`border rounded-lg p-2 text-center ${cardBg}`}>
                  <div className={`text-[11px] uppercase tracking-wider ${dimText2}`}>Positions</div>
                  <div className={`text-sm font-bold font-mono ${headText}`}>{portfolioRows.length}</div>
                  <div className={`text-[8px] ${dimText2}`}>{portfolioOptions.length} options</div>
                </div>
                {dailyPnl.length > 0 && (
                  <div className={`border rounded-lg p-2 col-span-2 ${cardBg}`}>
                    <div className={`text-[11px] uppercase tracking-wider mb-1 ${dimText2}`}>30-Day P&L Trend</div>
                    <svg viewBox="0 0 200 40" className="w-full" style={{height: 36}}>
                      {(() => {
                        const pnls = dailyPnl.map(d => d.pnl);
                        const pMin = Math.min(...pnls), pMax = Math.max(...pnls);
                        const pRng = pMax - pMin || 1;
                        const isUp = (pnls[pnls.length-1] || 0) >= 0;
                        const ac = isUp ? "#22c55e" : "#ef4444";
                        const pts = pnls.map((p, i) => `${(i / Math.max(pnls.length-1,1)) * 200},${40 - ((p - pMin) / pRng) * 36 - 2}`).join(" ");
                        return <>
                          <defs><linearGradient id="pnlGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={ac} stopOpacity={0.3}/><stop offset="100%" stopColor={ac} stopOpacity={0}/></linearGradient></defs>
                          <polygon points={`0,40 ${pts} 200,40`} fill="url(#pnlGrad)" />
                          <polyline points={pts} fill="none" stroke={ac} strokeWidth={1.5} />
                        </>;
                      })()}
                    </svg>
                    <div className={`text-[8px] font-mono text-right ${clr(dailyPnl[dailyPnl.length-1]?.pnl)}`}>
                      {(dailyPnl[dailyPnl.length-1]?.pnl || 0) >= 0 ? "+" : ""}${fmt(dailyPnl[dailyPnl.length-1]?.pnl || 0)} ({(dailyPnl[dailyPnl.length-1]?.pnl_pct || 0).toFixed(2)}%)
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Photonics Allocation */}
            {fidelitySummary && (() => {
              const photonicsHoldings = fidelityPositions.filter((p: any) => !p.is_option && !p.is_cash && PHOTONICS_UNIVERSE.includes(p.symbol));
              const photonicsValue = photonicsHoldings.reduce((s: number, p: any) => s + (p.current_value || 0), 0);
              const photonicsCount = photonicsHoldings.length;
              const photonicsUniverse = PHOTONICS_UNIVERSE.length;
              const pctOfPortfolio = fidelitySummary.total_value > 0 ? (photonicsValue / fidelitySummary.total_value * 100) : 0;
              return photonicsCount > 0 ? (
                <div className={`border rounded-lg p-3 ${cardBg} cursor-pointer hover:border-blue-600/30 transition-all`} onClick={() => { setTab("photonics"); }}>
                  <div className="flex items-center justify-between mb-2">
                    <div className={`text-xs uppercase tracking-wider ${dimText2}`}>🔬 Photonics Allocation</div>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full ${dark ? "bg-blue-950/40 text-blue-500" : "bg-blue-50 text-blue-700"}`}>{photonicsCount}/{photonicsUniverse} universe</span>
                  </div>
                  <div className={`text-lg font-bold font-mono ${headText}`}>${fmt(photonicsValue)}</div>
                  <div className={`text-[10px] ${dimText}`}>{pctOfPortfolio.toFixed(1)}% of portfolio</div>
                  <div className="flex gap-1 mt-2 flex-wrap">
                    {photonicsHoldings.slice(0, 8).map((p: any) => (
                      <span key={p.symbol} className={`text-[9px] px-1.5 py-0.5 rounded font-mono ${(p.total_gain_pct || 0) >= 0 ? (dark ? "bg-emerald-950/40 text-emerald-400" : "bg-emerald-50 text-emerald-600") : (dark ? "bg-red-950/40 text-red-400" : "bg-red-50 text-red-600")}`}>{p.symbol} {(p.total_gain_pct||0)>=0?"+":""}{p.total_gain_pct?.toFixed(0)}%</span>
                    ))}
                  </div>
                </div>
              ) : null;
            })()}

            {/* View tabs */}
            <div className="flex items-center gap-2 flex-wrap">
              {(["table","heatmap","options","sectors","performance","risk","fidelity"] as const).map(v => (
                <button key={v} onClick={()=>{setPortView(v); if(v==="sectors"&&!portSectors) loadPortSectors(); if(v==="performance") loadPortHistory(); if(v==="risk"&&!riskAnalytics) { loadRiskAnalytics(); loadStressScenarios(); } if(v==="fidelity"&&fidelityPositions.length===0) loadFidelityPositions(true);}} className={`text-xs uppercase tracking-wider px-3 py-1.5 rounded-lg border transition-all ${portView===v?(v==="fidelity"?(dark?"border-emerald-500 bg-emerald-950/20 text-emerald-400":"border-emerald-500 bg-emerald-50 text-emerald-600"):(dark?"border-amber-500 bg-amber-950/20 text-amber-400":"border-amber-500 bg-amber-50 text-amber-600")):`${dark?"border-zinc-800 text-zinc-500 hover:border-zinc-600":"border-gray-200 text-gray-500 hover:border-gray-400"}`}`}>{v==="table"?"Holdings":v==="heatmap"?"Heatmap":v==="options"?"Options":v==="sectors"?"Sectors":v==="risk"?"Risk":v==="fidelity"?"Fidelity":"Performance"}</button>
              ))}
              <div className="flex-1"/>
              <div className="flex gap-2">
                <input value={ptTicker} onChange={e=>setPtTicker(e.target.value)} placeholder="Ticker" className={`w-20 ${input} uppercase`} />
                <input value={ptShares} onChange={e=>setPtShares(e.target.value)} placeholder="Shares" className={`w-20 ${input}`} />
                <input value={ptCost} onChange={e=>setPtCost(e.target.value)} placeholder="Cost" className={`w-24 ${input}`} />
                <button onClick={addPortfolio} className={btn}>ADD</button>
              </div>
            </div>

            {/* Heatmap View */}
            {portView==="heatmap" && portfolioRows.length > 0 && (
              <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-1">
                {portfolioRows.sort((a,b) => (b.mktVal||0)-(a.mktVal||0)).map(r => {
                  const intensity = Math.min(Math.abs(r.pnlPct || 0), 60) / 60;
                  const isPos = (r.pnlPct || 0) >= 0;
                  const bg = isPos
                    ? `rgba(16,185,129,${0.1 + intensity * 0.5})`
                    : `rgba(239,68,68,${0.1 + intensity * 0.5})`;
                  const size = Math.max(1, Math.min(3, Math.ceil((r.weight || 0) / 5)));
                  return (
                    <div key={r.ticker} onClick={()=>goToChart(r.ticker)}
                      className="cursor-pointer rounded-lg p-2 flex flex-col items-center justify-center text-center transition-transform hover:scale-105 hover:z-10"
                      style={{ background: bg, gridColumn: size > 2 ? "span 2" : undefined, minHeight: size > 1 ? 80 : 60, border: `1px solid ${isPos ? "rgba(16,185,129,0.3)" : "rgba(239,68,68,0.3)"}` }}>
                      <div className="font-bold text-xs">{r.ticker}</div>
                      <div className={`text-[10px] font-mono font-bold ${isPos?"text-emerald-400":"text-red-400"}`}>{pct(r.pnlPct)}</div>
                      <div className={`text-[9px] font-mono ${dimText2}`}>${fmt(r.mktVal, 0)}</div>
                    </div>
                  );
                })}
                {/* Cash tile */}
                {portfolioCash > 0 && (
                  <div className={`rounded-lg p-2 flex flex-col items-center justify-center text-center ${dark?"bg-zinc-900":"bg-gray-100"}`} style={{minHeight: 60}}>
                    <div className={`font-bold text-xs ${dimText}`}>CASH</div>
                    <div className={`text-[10px] font-mono ${headText}`}>${fmt(portfolioCash, 0)}</div>
                    <div className={`text-[9px] ${dimText2}`}>{totalAccountValue > 0 ? ((portfolioCash/totalAccountValue)*100).toFixed(1) : 0}%</div>
                  </div>
                )}
              </div>
            )}

            {/* Holdings Table View */}
            {portView==="table" && (
              <div className="overflow-x-auto">
                <table className="w-full text-xs border-collapse">
                  <thead><tr className={`text-left border-b ${dark?"text-zinc-600 border-zinc-800":"text-gray-500 border-gray-200"}`}>
                    {["Ticker","Shares","Avg Cost","Price","Mkt Val","P&L","P&L%","Weight",""].map(h=><th key={h} className="py-2 px-2">{h}</th>)}
                  </tr></thead>
                  <tbody>
                    {portfolioRows.sort((a,b) => (b.mktVal||0)-(a.mktVal||0)).map(r=>(
                      <tr key={r.ticker} className={`border-b transition-colors ${dark?"border-zinc-900/50 hover:bg-zinc-900/50":"border-gray-100 hover:bg-gray-50"}`}>
                        <td className="py-2 px-2 text-amber-400 font-bold cursor-pointer hover:text-amber-300" onClick={()=>goToChart(r.ticker)}>{r.ticker}</td>
                        <td className="py-2 px-2 font-mono">{r.shares % 1 === 0 ? r.shares : r.shares.toFixed(3)}</td>
                        <td className="py-2 px-2 font-mono">${fmt(r.cost_basis)}</td>
                        <td className="py-2 px-2 font-mono">{r.price!=null?`$${fmt(r.price)}`:<span className={dimText3}>—</span>}</td>
                        <td className="py-2 px-2 font-mono">{r.mktVal!=null?`$${fmt(r.mktVal)}`:"—"}</td>
                        <td className={`py-2 px-2 font-bold font-mono ${clr(r.pnl)}`}>{r.pnl!=null?`${r.pnl>=0?"+":""}$${fmt(r.pnl)}`:"—"}</td>
                        <td className={`py-2 px-2 font-mono ${clr(r.pnlPct)}`}>{pct(r.pnlPct)}</td>
                        <td className="py-2 px-2">
                          <div className="flex items-center gap-1">
                            <div className="w-12 h-1.5 rounded-full overflow-hidden" style={{background:dark?"#27272a":"#e5e7eb"}}>
                              <div className="h-full rounded-full bg-amber-400" style={{width:`${Math.min(r.weight,100)}%`}}/>
                            </div>
                            <span className={`text-[10px] ${dimText2}`}>{r.weight.toFixed(1)}%</span>
                          </div>
                        </td>
                        <td className="py-2 px-2"><button onClick={()=>deletePortfolio(r.ticker)} className={`${dimText3} hover:text-red-400 opacity-0 group-hover:opacity-100`}>✕</button></td>
                      </tr>
                    ))}
                    {/* Cash row */}
                    {portfolioCash > 0 && (
                      <tr className={`border-b ${dark?"border-zinc-900/50":"border-gray-100"}`}>
                        <td className={`py-2 px-2 font-bold ${dimText}`}>CASH (SPAXX)</td>
                        <td className="py-2 px-2"/>
                        <td className="py-2 px-2"/>
                        <td className="py-2 px-2"/>
                        <td className="py-2 px-2 font-mono">${fmt(portfolioCash)}</td>
                        <td className="py-2 px-2"/>
                        <td className="py-2 px-2"/>
                        <td className="py-2 px-2">
                          <div className="flex items-center gap-1">
                            <div className="w-12 h-1.5 rounded-full overflow-hidden" style={{background:dark?"#27272a":"#e5e7eb"}}>
                              <div className="h-full rounded-full bg-blue-400" style={{width:`${totalAccountValue > 0 ? (portfolioCash/totalAccountValue)*100 : 0}%`}}/>
                            </div>
                            <span className={`text-[10px] ${dimText2}`}>{totalAccountValue > 0 ? ((portfolioCash/totalAccountValue)*100).toFixed(1) : 0}%</span>
                          </div>
                        </td>
                        <td/>
                      </tr>
                    )}
                    {/* Totals row */}
                    <tr className={`font-bold ${dark?"border-zinc-700":"border-gray-300"} border-t-2`}>
                      <td className={`py-2 px-2 ${headText}`}>TOTAL</td>
                      <td className="py-2 px-2"/>
                      <td className="py-2 px-2 font-mono">${fmt(totalCost)}</td>
                      <td className="py-2 px-2"/>
                      <td className={`py-2 px-2 font-mono ${headText}`}>${fmt(totalAccountValue)}</td>
                      <td className={`py-2 px-2 font-mono ${clr(totalAccountPnl)}`}>{totalAccountPnl>=0?"+":""}${fmt(totalAccountPnl)}</td>
                      <td className={`py-2 px-2 font-mono ${clr(totalAccountPnlPct)}`}>{totalAccountPnlPct>=0?"+":""}{totalAccountPnlPct.toFixed(2)}%</td>
                      <td className="py-2 px-2"><span className={`text-[10px] ${dimText2}`}>100%</span></td>
                      <td/>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}

            {/* Options View */}
            {portView==="options" && (
              <div className="space-y-3">
                {portfolioOptions.length > 0 ? (
                  <div className="overflow-x-auto">
                    {/* IV Rank Gauges for option tickers */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
                      {(() => {
                        const optTickers = [...new Set(portfolioOptions.map(o => o.ticker))];
                        return optTickers.map(tk => {
                          const iv = ivStats[tk];
                          return (
                            <div key={tk} className={`border rounded-lg p-2 ${cardBg}`}>
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-amber-400 font-bold text-xs cursor-pointer hover:text-amber-300" onClick={()=>goToChart(tk)}>{tk}</span>
                                {!iv && <button onClick={async()=>{try{const r=await fetch(`${BASE}/options/${tk}/iv-stats`);const d=await r.json();setIvStats(p=>({...p,[tk]:d}))}catch{}}} className={`text-[8px] ${dimText2} hover:text-amber-400`}>Load IV</button>}
                              </div>
                              {iv ? (
                                <div>
                                  <div className="flex items-center gap-2">
                                    <svg viewBox="0 0 60 35" style={{width: 60, height: 35}}>
                                      {/* Semi-circle gauge */}
                                      <path d="M 5 30 A 25 25 0 0 1 55 30" fill="none" stroke={dark?"#27272a":"#e5e7eb"} strokeWidth={4} strokeLinecap="round" />
                                      <path d={`M 5 30 A 25 25 0 0 1 ${5 + 50 * Math.sin((iv.ivRank||0)/100 * Math.PI) * 0} ${30 - 25 * (1 - Math.cos((iv.ivRank||0)/100 * Math.PI))}`}
                                        fill="none" stroke={(iv.ivRank||0) < 30 ? "#22c55e" : (iv.ivRank||0) < 60 ? "#f59e0b" : "#ef4444"}
                                        strokeWidth={4} strokeLinecap="round"
                                        strokeDasharray={`${(iv.ivRank||0)/100 * 78.5} 78.5`} />
                                      <text x={30} y={28} textAnchor="middle" fontSize={10} fill={dark?"#f1f1f4":"#111"} fontWeight={700}>{Math.round(iv.ivRank||0)}</text>
                                      <text x={30} y={16} textAnchor="middle" fontSize={6} fill={dark?"#71717a":"#6b7280"}>IV Rank</text>
                                    </svg>
                                    <div className="text-[9px]">
                                      <div className={dimText2}>HV: {iv.currentIV?.toFixed(1)}%</div>
                                      <div className={dimText2}>52w: {iv.iv52Low?.toFixed(0)}-{iv.iv52High?.toFixed(0)}%</div>
                                    </div>
                                  </div>
                                </div>
                              ) : <div className={`text-[9px] ${dimText3}`}>Click "Load IV"</div>}
                            </div>
                          );
                        });
                      })()}
                    </div>
                    <table className="w-full text-xs border-collapse">
                      <thead><tr className={`text-left border-b ${dark?"text-zinc-600 border-zinc-800":"text-gray-500 border-gray-200"}`}>
                        {["Contract","Side","Type","Strike","Expiry","Qty","Cost Basis"].map(h=><th key={h} className="py-2 px-2">{h}</th>)}
                      </tr></thead>
                      <tbody>
                        {portfolioOptions.map((o,i)=>{
                          const isLong = o.side === "long";
                          const contractLabel = `${o.ticker} ${o.expiry?.slice(0,7)} $${o.strike} ${o.type?.toUpperCase()}`;
                          return (
                            <tr key={i} className={`border-b transition-colors ${dark?"border-zinc-900/50 hover:bg-zinc-900/50":"border-gray-100 hover:bg-gray-50"}`}>
                              <td className="py-2 px-2">
                                <span className="font-bold text-amber-400 cursor-pointer hover:text-amber-300" onClick={()=>goToChart(o.ticker)}>{contractLabel}</span>
                              </td>
                              <td className="py-2 px-2">
                                <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold ${isLong?(dark?"bg-emerald-950/40 text-emerald-400 border border-emerald-800":"bg-emerald-50 text-emerald-600 border border-emerald-200"):(dark?"bg-red-950/40 text-red-400 border border-red-800":"bg-red-50 text-red-600 border border-red-200")}`}>{isLong?"LONG":"SHORT"}</span>
                              </td>
                              <td className={`py-2 px-2 font-bold ${o.type==="call"?"text-emerald-400":"text-red-400"}`}>{o.type?.toUpperCase()}</td>
                              <td className="py-2 px-2 font-mono">${o.strike}</td>
                              <td className={`py-2 px-2 font-mono ${dimText}`}>{o.expiry}</td>
                              <td className="py-2 px-2 font-mono">{isLong ? o.qty : `-${o.qty}`}</td>
                              <td className="py-2 px-2 font-mono">${fmt(o.cost_basis)}/contract</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                    {/* Options strategy summary */}
                    <div className={`mt-3 border rounded-lg p-3 ${cardBg}`}>
                      <div className={`text-xs uppercase tracking-wider mb-2 ${dimText2}`}>Options Strategy Summary</div>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                        {(() => {
                          const byTicker: {[t:string]: typeof portfolioOptions} = {};
                          portfolioOptions.forEach(o => { if (!byTicker[o.ticker]) byTicker[o.ticker] = []; byTicker[o.ticker].push(o); });
                          return Object.entries(byTicker).map(([tk, opts]) => {
                            const longs = opts.filter(o => o.side === "long");
                            const shorts = opts.filter(o => o.side === "short");
                            const strikes = opts.map(o => o.strike).sort((a,b)=>a-b);
                            let strategy = "";
                            if (longs.length > 0 && shorts.length > 0) strategy = "Spread";
                            else if (shorts.length > 0 && !longs.length) strategy = "Covered Write";
                            else strategy = "Long Call";
                            return (
                              <div key={tk} className={`border rounded-lg p-2 ${cardBg}`}>
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="text-amber-400 font-bold cursor-pointer hover:text-amber-300" onClick={()=>goToChart(tk)}>{tk}</span>
                                  <span className={`text-[9px] px-1.5 py-0.5 rounded ${dark?"bg-violet-950/40 text-violet-400 border border-violet-800":"bg-violet-50 text-violet-600 border border-violet-200"}`}>{strategy}</span>
                                </div>
                                <div className={`text-[10px] ${dimText}`}>
                                  Strikes: ${strikes.join(", $")} · {opts[0]?.expiry}
                                </div>
                                <div className={`text-[10px] ${dimText}`}>
                                  {longs.length} long, {shorts.length} short
                                </div>
                              </div>
                            );
                          });
                        })()}
                      </div>
                    </div>
                    {/* Expiration Calendar */}
                    <div className={`mt-3 border rounded-lg p-3 ${cardBg}`}>
                      <div className={`text-xs uppercase tracking-wider mb-2 ${dimText2}`}>Expiration Calendar</div>
                      <div className="grid grid-cols-4 sm:grid-cols-7 gap-1">
                        {(() => {
                          const expiryMap: {[date:string]: {contracts: number; notional: number}} = {};
                          portfolioOptions.forEach(o => {
                            const d = o.expiry?.slice(0,10) || "";
                            if (!expiryMap[d]) expiryMap[d] = {contracts: 0, notional: 0};
                            expiryMap[d].contracts += o.qty;
                            expiryMap[d].notional += o.strike * o.qty * 100;
                          });
                          const dates = Object.keys(expiryMap).sort();
                          const maxNotional = Math.max(...Object.values(expiryMap).map(e => e.notional), 1);
                          return dates.map(d => {
                            const e = expiryMap[d];
                            const intensity = e.notional / maxNotional;
                            const daysUntil = Math.ceil((new Date(d).getTime() - Date.now()) / (1000*60*60*24));
                            return (
                              <div key={d} className="text-center p-1.5 rounded-lg" style={{background: `rgba(168,139,250,${0.1+intensity*0.4})`, border: `1px solid rgba(168,139,250,${0.2+intensity*0.3})`}}>
                                <div className={`text-[8px] font-bold ${daysUntil < 7 ? "text-red-400" : daysUntil < 30 ? "text-amber-400" : "text-violet-400"}`}>{d.slice(5)}</div>
                                <div className={`text-[9px] font-mono font-bold ${headText}`}>{e.contracts}</div>
                                <div className={`text-[7px] ${dimText2}`}>{daysUntil}d</div>
                              </div>
                            );
                          });
                        })()}
                      </div>
                    </div>

                    {/* Options P&L Payoff Diagram */}
                    <div className={`mt-3 border rounded-lg p-3 ${cardBg}`}>
                      <div className={`text-xs uppercase tracking-wider mb-2 ${dimText2}`}>P&L at Expiry (by Ticker)</div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {(() => {
                          const byTicker: {[t:string]: typeof portfolioOptions} = {};
                          portfolioOptions.forEach(o => { if (!byTicker[o.ticker]) byTicker[o.ticker] = []; byTicker[o.ticker].push(o); });
                          return Object.entries(byTicker).map(([tk, opts]) => {
                            const strikes = opts.map(o => o.strike);
                            const minStrike = Math.min(...strikes) * 0.7;
                            const maxStrike = Math.max(...strikes) * 1.3;
                            const W = 250, H = 80;
                            const steps = 50;
                            const points: {price: number; pnl: number}[] = [];
                            for (let s = 0; s <= steps; s++) {
                              const price = minStrike + (s / steps) * (maxStrike - minStrike);
                              let pnl = 0;
                              opts.forEach(o => {
                                const mult = o.side === "long" ? 1 : -1;
                                const contractPnl = o.type === "call"
                                  ? Math.max(0, price - o.strike) - o.cost_basis
                                  : Math.max(0, o.strike - price) - o.cost_basis;
                                pnl += contractPnl * o.qty * 100 * mult;
                              });
                              points.push({price, pnl});
                            }
                            const pnls = points.map(p => p.pnl);
                            const pMin = Math.min(...pnls), pMax = Math.max(...pnls);
                            const pRng = pMax - pMin || 1;
                            const zeroY = H - ((-pMin) / pRng) * (H - 10) - 5;
                            const breakevens = points.filter((p, i) => i > 0 && ((points[i-1].pnl < 0 && p.pnl >= 0) || (points[i-1].pnl >= 0 && p.pnl < 0)));
                            return (
                              <div key={tk}>
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="text-amber-400 font-bold text-xs">{tk}</span>
                                  {breakevens.map((be, i) => <span key={i} className={`text-[8px] font-mono ${dimText2}`}>BE: ${be.price.toFixed(0)}</span>)}
                                </div>
                                <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{height: H}}>
                                  <line x1={0} y1={zeroY} x2={W} y2={zeroY} stroke={dark?"#3f3f46":"#d4d4d8"} strokeWidth={0.5} />
                                  {strikes.map((st, i) => {
                                    const x = ((st - minStrike) / (maxStrike - minStrike)) * W;
                                    return <line key={i} x1={x} y1={0} x2={x} y2={H} stroke="#a78bfa" strokeWidth={0.5} strokeDasharray="2,3" strokeOpacity={0.4} />;
                                  })}
                                  <polyline
                                    points={points.map((p, i) => `${(i / steps) * W},${H - ((p.pnl - pMin) / pRng) * (H - 10) - 5}`).join(" ")}
                                    fill="none" stroke="#a78bfa" strokeWidth={1.5} />
                                  {/* Fill profit green, loss red */}
                                  <polyline
                                    points={points.filter(p => p.pnl >= 0).map((p, i, arr) => `${((points.indexOf(p)) / steps) * W},${H - ((p.pnl - pMin) / pRng) * (H - 10) - 5}`).join(" ")}
                                    fill="none" stroke="#22c55e" strokeWidth={1.5} />
                                </svg>
                                <div className="flex justify-between text-[7px]">
                                  <span className={dimText2}>${minStrike.toFixed(0)}</span>
                                  <span className="text-red-400 font-mono">Max Loss: ${Math.abs(Math.min(...pnls)).toFixed(0)}</span>
                                  <span className={dimText2}>${maxStrike.toFixed(0)}</span>
                                </div>
                              </div>
                            );
                          });
                        })()}
                      </div>
                    </div>
                  </div>
                ) : <div className={`text-xs text-center py-8 ${dimText3}`}>No options positions.</div>}
              </div>
            )}

            {/* Sectors View */}
            {portView==="sectors" && (
              <div className="space-y-3">
                {portSectors && Object.keys(portSectors).length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Donut Chart */}
                    <div className={`border rounded-lg p-4 ${cardBg}`}>
                      <div className={`text-xs uppercase tracking-wider mb-3 ${dimText2}`}>Sector Allocation</div>
                      <svg viewBox="0 0 200 200" className="w-full" style={{maxWidth: 250, margin: "0 auto", display: "block"}}>
                        {(() => {
                          const sectorColors: {[k:string]:string} = { Technology: "#3b82f6", Healthcare: "#22c55e", "Financial Services": "#f59e0b", "Consumer Cyclical": "#ec4899", "Communication Services": "#8b5cf6", Industrials: "#6b7280", Energy: "#ef4444", "Consumer Defensive": "#14b8a6", "Real Estate": "#f97316", Utilities: "#06b6d4", "Basic Materials": "#a78bfa", Unknown: "#52525b" };
                          const entries = Object.entries(portSectors as {[k:string]: {value:number; weight:number; tickers:string[]}}).sort((a,b) => b[1].weight - a[1].weight);
                          let cumAngle = 0;
                          const cx = 100, cy = 100, r = 80, ir = 50;
                          return entries.map(([sector, d]) => {
                            const angle = (d.weight / 100) * 360;
                            const start = cumAngle;
                            cumAngle += angle;
                            const a1 = (start - 90) * Math.PI / 180;
                            const a2 = (start + angle - 90) * Math.PI / 180;
                            const largeArc = angle > 180 ? 1 : 0;
                            const x1 = cx + r * Math.cos(a1), y1 = cy + r * Math.sin(a1);
                            const x2 = cx + r * Math.cos(a2), y2 = cy + r * Math.sin(a2);
                            const ix1 = cx + ir * Math.cos(a2), iy1 = cy + ir * Math.sin(a2);
                            const ix2 = cx + ir * Math.cos(a1), iy2 = cy + ir * Math.sin(a1);
                            const path = `M ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} L ${ix1} ${iy1} A ${ir} ${ir} 0 ${largeArc} 0 ${ix2} ${iy2} Z`;
                            const color = sectorColors[sector] || sectorColors.Unknown;
                            return <path key={sector} d={path} fill={color} fillOpacity={0.7} stroke={dark ? "#0a0a0f" : "#fff"} strokeWidth={2}>
                              <title>{sector}: {d.weight.toFixed(1)}%</title>
                            </path>;
                          });
                        })()}
                        <text x={100} y={95} textAnchor="middle" fontSize={11} fill={dark ? "#f1f1f4" : "#111"} fontWeight={700}>${fmt(totalAccountValue, 0)}</text>
                        <text x={100} y={112} textAnchor="middle" fontSize={8} fill={dark ? "#71717a" : "#6b7280"}>Total Value</text>
                      </svg>
                    </div>
                    {/* Sector Legend & Details */}
                    <div className={`border rounded-lg p-4 ${cardBg}`}>
                      <div className={`text-xs uppercase tracking-wider mb-3 ${dimText2}`}>Sectors</div>
                      <div className="space-y-2">
                        {Object.entries(portSectors as {[k:string]: {value:number; weight:number; tickers:string[]; beta?:number|null}}).sort((a,b) => b[1].weight - a[1].weight).map(([sector, d]) => {
                          const sectorColors: {[k:string]:string} = { Technology: "#3b82f6", Healthcare: "#22c55e", "Financial Services": "#f59e0b", "Consumer Cyclical": "#ec4899", "Communication Services": "#8b5cf6", Industrials: "#6b7280", Energy: "#ef4444", "Consumer Defensive": "#14b8a6", Unknown: "#52525b" };
                          const color = sectorColors[sector] || sectorColors.Unknown;
                          return (
                            <div key={sector} className="flex items-center gap-2">
                              <div className="w-2.5 h-2.5 rounded-lg flex-shrink-0" style={{background: color}}/>
                              <span className="text-xs font-semibold flex-1">{sector}</span>
                              <span className="text-xs font-mono font-bold" style={{color}}>{d.weight.toFixed(1)}%</span>
                              <div className="w-16 h-1.5 rounded-full overflow-hidden" style={{background:dark?"#27272a":"#e5e7eb"}}>
                                <div className="h-full rounded-full" style={{width:`${Math.min(d.weight,100)}%`, background: color}}/>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <button onClick={loadPortSectors} className={btn}>Load Sector Data</button>
                    <div className={`text-[10px] mt-2 ${dimText2}`}>Fetches sector info from Yahoo Finance</div>
                  </div>
                )}
              </div>
            )}

            {/* Performance View */}
            {portView==="performance" && (
              <div className="space-y-3">
                {portHistory.length > 0 ? (
                  <div className={`border rounded-lg p-4 ${cardBg}`}>
                    <div className={`text-xs uppercase tracking-wider mb-2 ${dimText2}`}>Portfolio Value Over Time</div>
                    <svg viewBox="0 0 600 200" className="w-full" style={{height: 200}}>
                      {(() => {
                        const vals = portHistory.map(h => h.value || 0);
                        const vMin = Math.min(...vals) * 0.98, vMax = Math.max(...vals) * 1.02;
                        const vRng = vMax - vMin || 1;
                        const isUp = vals[vals.length-1] >= vals[0];
                        const ac = isUp ? "#22c55e" : "#ef4444";
                        const pts = vals.map((v, i) => `${(i / Math.max(vals.length-1,1)) * 600},${200 - ((v - vMin) / vRng) * 190 - 5}`).join(" ");
                        return <>
                          <defs><linearGradient id="perfGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={ac} stopOpacity={0.2}/><stop offset="100%" stopColor={ac} stopOpacity={0}/></linearGradient></defs>
                          {[0.25,0.5,0.75].map(p => <line key={p} x1={0} y1={200*p} x2={600} y2={200*p} stroke={dark?"#1e1e2e":"#e5e7eb"} strokeWidth={0.5}/>)}
                          <polygon points={`0,200 ${pts} 600,200`} fill="url(#perfGrad)" />
                          <polyline points={pts} fill="none" stroke={ac} strokeWidth={2} />
                          <text x={596} y={15} textAnchor="end" fontSize={10} fill={ac} fontWeight={700}>${fmt(vals[vals.length-1])}</text>
                        </>;
                      })()}
                    </svg>
                    <div className="flex justify-between text-[9px] mt-1">
                      <span className={dimText2}>{portHistory[0]?.date?.slice(0,10)}</span>
                      <span className={dimText2}>{portHistory[portHistory.length-1]?.date?.slice(0,10)}</span>
                    </div>
                  </div>
                ) : (
                  <div className={`border rounded-lg p-4 ${cardBg} text-center`}>
                    <div className={`text-xs ${dimText}`}>No portfolio snapshots yet. Snapshots are taken periodically.</div>
                    <button onClick={async () => { await fetch(`${BASE}/portfolio/${portfolioName}/snapshot`, {method:"POST"}); loadPortHistory(); }} className={`${btn} mt-2`}>Take Snapshot Now</button>
                  </div>
                )}
                {/* Daily returns from daily-pnl */}
                {dailyPnl.length > 0 && (
                  <div className={`border rounded-lg p-3 ${cardBg}`}>
                    <div className={`text-xs uppercase tracking-wider mb-2 ${dimText2}`}>Daily Returns (30d)</div>
                    <div className="grid grid-cols-5 sm:grid-cols-10 gap-1">
                      {dailyPnl.slice(-20).map((d, i) => {
                        const intensity = Math.min(Math.abs(d.pnl_pct), 5) / 5;
                        const isPos = d.pnl_pct >= 0;
                        return (
                          <div key={i} className="text-center" title={`${d.date}: ${d.pnl_pct >= 0 ? "+" : ""}${d.pnl_pct.toFixed(2)}%`}>
                            <div className="w-full aspect-square rounded-lg" style={{background: isPos ? `rgba(16,185,129,${0.15+intensity*0.6})` : `rgba(239,68,68,${0.15+intensity*0.6})`}} />
                            <div className={`text-[7px] mt-0.5 ${dimText2}`}>{d.date.slice(5)}</div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Risk Analytics View */}
            {portView==="risk" && (
              <div className="space-y-3">
                {riskAnalyticsLoading ? (
                  <div className={`text-xs animate-pulse py-12 text-center ${dimText}`}>Calculating risk metrics...</div>
                ) : riskAnalytics && !riskAnalytics.error ? (
                  <>
                    {/* Risk Metrics Grid */}
                    <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                      {[
                        {label:"VaR 95%",value:`$${fmt(riskAnalytics.var_95_1d)}`,sub:"1-day",color:"text-red-400"},
                        {label:"CVaR 95%",value:`$${fmt(riskAnalytics.cvar_95_1d)}`,sub:"1-day",color:"text-red-400"},
                        {label:"Sharpe",value:riskAnalytics.sharpe_ratio?.toFixed(2),sub:"annualized",color:riskAnalytics.sharpe_ratio>=1?"text-emerald-400":riskAnalytics.sharpe_ratio>=0.5?"text-amber-400":"text-red-400"},
                        {label:"Sortino",value:riskAnalytics.sortino_ratio?.toFixed(2),sub:"annualized",color:riskAnalytics.sortino_ratio>=1.5?"text-emerald-400":"text-amber-400"},
                        {label:"Beta",value:riskAnalytics.beta?.toFixed(2),sub:"vs SPY",color:riskAnalytics.beta>1.2?"text-red-400":riskAnalytics.beta<0.8?"text-emerald-400":"text-amber-400"},
                        {label:"Max DD",value:`${riskAnalytics.max_drawdown_pct?.toFixed(1)}%`,sub:`${riskAnalytics.lookback_days||90}d`,color:"text-red-400"},
                      ].map(m=>(
                        <div key={m.label} className={`border rounded-lg p-2.5 text-center ${cardBg}`}>
                          <div className={`text-[11px] uppercase tracking-wider ${dimText2}`}>{m.label}</div>
                          <div className={`text-lg font-bold font-mono ${m.color}`}>{m.value}</div>
                          <div className={`text-[9px] ${dimText3}`}>{m.sub}</div>
                        </div>
                      ))}
                    </div>

                    {/* Additional metrics bar */}
                    <div className={`border rounded-lg p-3 ${cardBg}`}>
                      <div className="flex flex-wrap gap-6 justify-center">
                        <div className="text-center"><div className={`text-[9px] uppercase ${dimText2}`}>Ann. Return</div><div className={`text-sm font-bold font-mono ${clr(riskAnalytics.annualized_return)}`}>{riskAnalytics.annualized_return>=0?"+":""}{riskAnalytics.annualized_return?.toFixed(1)}%</div></div>
                        <div className="text-center"><div className={`text-[9px] uppercase ${dimText2}`}>Ann. Vol</div><div className={`text-sm font-bold font-mono ${headText}`}>{riskAnalytics.annualized_vol?.toFixed(1)}%</div></div>
                        <div className="text-center"><div className={`text-[9px] uppercase ${dimText2}`}>Calmar</div><div className={`text-sm font-bold font-mono ${riskAnalytics.calmar_ratio>=1?"text-emerald-400":"text-amber-400"}`}>{riskAnalytics.calmar_ratio?.toFixed(2)}</div></div>
                        <div className="text-center"><div className={`text-[9px] uppercase ${dimText2}`}>VaR 99%</div><div className="text-sm font-bold font-mono text-red-400">${fmt(riskAnalytics.var_99_1d)}</div></div>
                        <div className="text-center"><div className={`text-[9px] uppercase ${dimText2}`}>Portfolio</div><div className={`text-sm font-bold font-mono ${headText}`}>${fmt(riskAnalytics.total_value)}</div></div>
                      </div>
                    </div>

                    {/* Drawdown Chart */}
                    {riskAnalytics.drawdown_series?.length > 0 && (
                      <div className={`border rounded-lg p-3 ${cardBg}`}>
                        <div className={`text-xs uppercase tracking-wider mb-2 ${dimText2}`}>Drawdown from Peak</div>
                        <svg viewBox="0 0 600 150" className="w-full" style={{height:150}}>
                          {(() => {
                            const dd = riskAnalytics.drawdown_series;
                            const minDD = Math.min(...dd.map((d:any) => d.drawdown), -1);
                            const ddRng = Math.abs(minDD) || 1;
                            const pts = dd.map((d:any, i:number) => {
                              const x = (i / Math.max(dd.length - 1, 1)) * 600;
                              const y = (-d.drawdown / ddRng) * 130 + 5;
                              return `${x},${y}`;
                            }).join(" ");
                            return <>
                              <defs>
                                <linearGradient id="ddGrad" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="0%" stopColor="#ef4444" stopOpacity={0.4}/>
                                  <stop offset="100%" stopColor="#ef4444" stopOpacity={0.05}/>
                                </linearGradient>
                              </defs>
                              <line x1={0} y1={5} x2={600} y2={5} stroke={dark?"#333":"#ddd"} strokeWidth={0.5} strokeDasharray="4"/>
                              {[0.25,0.5,0.75].map(p => (
                                <g key={p}>
                                  <line x1={0} y1={p*130+5} x2={600} y2={p*130+5} stroke={dark?"#1e1e2e":"#e5e7eb"} strokeWidth={0.5}/>
                                  <text x={4} y={p*130+2} fontSize={8} fill={dark?"#555":"#aaa"}>-{(ddRng*p).toFixed(1)}%</text>
                                </g>
                              ))}
                              <polygon points={`0,5 ${pts} 600,5`} fill="url(#ddGrad)"/>
                              <polyline points={pts} fill="none" stroke="#ef4444" strokeWidth={1.5}/>
                              <text x={4} y={18} fontSize={9} fill="#555">0%</text>
                              <text x={4} y={140} fontSize={9} fill="#ef4444">{minDD.toFixed(1)}%</text>
                              <text x={590} y={18} textAnchor="end" fontSize={8} fill={dark?"#666":"#999"}>{dd[dd.length-1]?.date?.slice(5)}</text>
                              <text x={10} y={18} fontSize={8} fill={dark?"#666":"#999"}>{dd[0]?.date?.slice(5)}</text>
                            </>;
                          })()}
                        </svg>
                      </div>
                    )}

                    {/* Stress Scenarios */}
                    {stressScenarios?.scenarios?.length > 0 && (
                      <div className={`border rounded-lg p-3 ${cardBg}`}>
                        <div className={`text-xs uppercase tracking-wider mb-2 ${dimText2}`}>Stress Test Scenarios</div>
                        <div className="space-y-1">
                          {stressScenarios.scenarios.map((s:any) => {
                            const isLoss = s.portfolio_impact < 0;
                            const expanded = stressExpanded === s.name;
                            return (
                              <div key={s.name} className={`border rounded-lg ${dark?"border-zinc-800":"border-gray-200"}`}>
                                <div className={`flex items-center justify-between px-3 py-2 cursor-pointer ${dark?"hover:bg-zinc-900/50":"hover:bg-gray-50"}`} onClick={() => setStressExpanded(expanded ? null : s.name)}>
                                  <div className="flex items-center gap-2">
                                    <span className="text-sm">{s.icon}</span>
                                    <span className={`text-xs font-bold ${headText}`}>{s.name}</span>
                                    <span className={`text-[10px] ${dimText2}`}>{s.desc}</span>
                                  </div>
                                  <div className="flex items-center gap-3">
                                    <span className={`text-sm font-bold font-mono ${isLoss?"text-red-400":"text-emerald-400"}`}>
                                      {isLoss?"":"+"}{s.portfolio_impact>=1000||s.portfolio_impact<=-1000?`$${(s.portfolio_impact/1000).toFixed(1)}K`:`$${fmt(s.portfolio_impact)}`}
                                    </span>
                                    <span className={`text-xs font-mono ${isLoss?"text-red-400/70":"text-emerald-400/70"}`}>
                                      ({isLoss?"":"+"}{s.portfolio_impact_pct?.toFixed(1)}%)
                                    </span>
                                    <span className={`text-[10px] ${dimText3} transition-transform ${expanded?"rotate-180":""}`}>▼</span>
                                  </div>
                                </div>
                                {expanded && s.positions && (
                                  <div className={`px-3 pb-2 border-t ${dark?"border-zinc-800":"border-gray-200"}`}>
                                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-1 mt-2">
                                      {s.positions.map((p:any) => (
                                        <div key={p.ticker} className={`flex items-center justify-between text-[10px] px-2 py-1 rounded-lg ${dark?"bg-zinc-900/50":"bg-gray-50"}`}>
                                          <span className="text-amber-400 font-bold">{p.ticker}</span>
                                          <span className={`font-mono ${p.dollar_impact<0?"text-red-400":"text-emerald-400"}`}>
                                            {p.move_pct>=0?"+":""}{p.move_pct}%
                                          </span>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {stressScenariosLoading && <div className={`text-xs animate-pulse py-4 text-center ${dimText}`}>Running stress scenarios...</div>}
                  </>
                ) : riskAnalytics?.error ? (
                  <div className={`text-xs text-center py-12 ${dimText3}`}>{riskAnalytics.error}</div>
                ) : (
                  <div className={`text-xs text-center py-12 ${dimText3}`}>
                    <button onClick={() => { loadRiskAnalytics(); loadStressScenarios(); }} className={btn}>Load Risk Analytics</button>
                  </div>
                )}
              </div>
            )}

            {/* ── FIDELITY POSITIONS VIEW ── */}
            {portView==="fidelity" && (
              <div className="space-y-4">
                {fidelityLoading && fidelityPositions.length===0 ? (
                  <div className={`text-xs animate-pulse py-12 text-center ${dimText}`}>Loading Fidelity positions...</div>
                ) : fidelityPositions.length > 0 ? (() => {
                  const filtered = fidelityAccount==="all" ? fidelityPositions : fidelityPositions.filter(p=>p.account===fidelityAccount);
                  const stocks = filtered.filter(p=>!p.is_option&&!p.is_cash);
                  const options = filtered.filter(p=>p.is_option);
                  const cash = filtered.filter(p=>p.is_cash);
                  const sorted = [...stocks].sort((a,b)=>{const av=a[fidelitySort],bv=b[fidelitySort];if(av==null)return 1;if(bv==null)return -1;return fidelitySortDir==="desc"?bv-av:av-bv;});
                  const totalVal = filtered.reduce((s,p)=>s+(p.current_value||0),0);
                  const totalDayGain = filtered.reduce((s,p)=>s+(p.day_gain_dollar||0),0);
                  const totalGain = filtered.filter(p=>!p.is_cash).reduce((s,p)=>s+(p.total_gain_dollar||0),0);
                  const totalCost = stocks.reduce((s,p)=>s+(p.cost_basis||0),0);
                  const totalCash = cash.reduce((s,p)=>s+(p.current_value||0),0);
                  const best = stocks.length ? stocks.reduce((b,p)=>(p.total_gain_pct||0)>(b.total_gain_pct||0)?p:b,stocks[0]) : null;
                  const worst = stocks.length ? stocks.reduce((w,p)=>(p.total_gain_pct||0)<(w.total_gain_pct||0)?p:w,stocks[0]) : null;
                  return <>
                    {/* Account Filter */}
                    <div className="flex gap-2 items-center">
                      {["all", ...(fidelitySummary?.accounts ? Object.keys(fidelitySummary.accounts) : [])].map(a=>(
                        <button key={a} onClick={()=>setFidelityAccount(a)} className={`text-xs uppercase tracking-wider px-3 py-1.5 rounded-lg border transition-all ${fidelityAccount===a?(dark?"border-emerald-500 bg-emerald-950/20 text-emerald-400":"border-emerald-500 bg-emerald-50 text-emerald-600"):`${dark?"border-zinc-800 text-zinc-500 hover:border-zinc-600":"border-gray-200 text-gray-500 hover:border-gray-400"}`}`}>{a==="all"?"All Accounts":a}</button>
                      ))}
                      <div className="flex-1"/>
                      {fidelityFreshness?.has_data && (
                        <span className={`text-[10px] ${dimText} flex items-center gap-1`}>
                          {fidelityFreshness.newer_available && <span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"/>}
                          {fidelityFreshness.age_minutes < 60
                            ? `${Math.round(fidelityFreshness.age_minutes)}m ago`
                            : fidelityFreshness.age_minutes < 1440
                            ? `${Math.round(fidelityFreshness.age_minutes / 60)}h ago`
                            : `${Math.round(fidelityFreshness.age_minutes / 1440)}d ago`}
                          {fidelityFreshness.newer_available && <span className="text-amber-400 ml-1">· new export available</span>}
                        </span>
                      )}
                      <button onClick={()=>loadFidelityPositions(true)} className={`text-[10px] ${dimText} hover:text-emerald-400 transition-colors`}>↻ Sync</button>
                    </div>

                    {/* Summary Cards */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div className={`border rounded-lg p-3 ${cardBg}`}>
                        <div className={`text-xs uppercase tracking-wider mb-1 ${dimText2}`}>Total Value</div>
                        <div className={`text-lg font-bold font-mono ${headText}`}>${totalVal.toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2})}</div>
                        <div className={`text-[10px] ${dimText}`}>{stocks.length} stocks · {options.length} options</div>
                      </div>
                      <div className={`border rounded-lg p-3 ${cardBg}`}>
                        <div className={`text-xs uppercase tracking-wider mb-1 ${dimText2}`}>Day&apos;s P&amp;L</div>
                        <div className={`text-lg font-bold font-mono ${clr(totalDayGain)}`}>{totalDayGain>=0?"+":""}${totalDayGain.toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2})}</div>
                        <div className={`text-[10px] ${clr(totalDayGain)}`}>{totalVal>0?((totalDayGain/totalVal)*100).toFixed(2):0}%</div>
                      </div>
                      <div className={`border rounded-lg p-3 ${cardBg}`}>
                        <div className={`text-xs uppercase tracking-wider mb-1 ${dimText2}`}>Total P&amp;L</div>
                        <div className={`text-lg font-bold font-mono ${clr(totalGain)}`}>{totalGain>=0?"+":""}${totalGain.toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2})}</div>
                        <div className={`text-[10px] ${clr(totalGain)}`}>{totalCost>0?((totalGain/totalCost)*100).toFixed(2):0}%</div>
                      </div>
                      <div className={`border rounded-lg p-3 ${cardBg}`}>
                        <div className={`text-xs uppercase tracking-wider mb-1 ${dimText2}`}>Cash</div>
                        <div className={`text-lg font-bold font-mono ${headText}`}>${totalCash.toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2})}</div>
                        <div className={`text-[10px] ${dimText}`}>{best?`Best: ${best.symbol} ${best.total_gain_pct>=0?"+":""}${best.total_gain_pct?.toFixed(1)}%`:""}</div>
                      </div>
                    </div>

                    {/* Positions Table */}
                    <div className={`border rounded-lg ${cardBg}`}>
                      <div className="overflow-x-auto">
                        <table className="w-full text-xs border-collapse">
                          <thead><tr className={`text-left border-b ${dark?"text-zinc-600 border-zinc-800":"text-gray-500 border-gray-200"}`}>
                            {[
                              {k:"symbol",l:"Symbol"},
                              {k:"description",l:"Description"},
                              {k:"quantity",l:"Qty"},
                              {k:"last_price",l:"Price"},
                              {k:"price_change",l:"Chg"},
                              {k:"current_value",l:"Value"},
                              {k:"day_gain_dollar",l:"Day P&L"},
                              {k:"day_gain_pct",l:"Day%"},
                              {k:"total_gain_dollar",l:"Total P&L"},
                              {k:"total_gain_pct",l:"Total%"},
                              {k:"pct_of_account",l:"Weight"},
                              {k:"avg_cost",l:"Avg Cost"},
                            ].map(col=>(
                              <th key={col.k} className="py-2 px-2 cursor-pointer hover:text-amber-400 select-none whitespace-nowrap" onClick={()=>{const nd=fidelitySort===col.k&&fidelitySortDir==="desc"?"asc":"desc";setFidelitySort(col.k);setFidelitySortDir(nd);}}>
                                {col.l}{fidelitySort===col.k?(fidelitySortDir==="desc"?" ▼":" ▲"):""}
                              </th>
                            ))}
                          </tr></thead>
                          <tbody>
                            {sorted.map(p=>(
                              <tr key={p.raw_symbol+p.account} onClick={() => {
                                if (expandedHolding === p.symbol) { setExpandedHolding(null); setHoldingDeepDive(null); }
                                else { setExpandedHolding(p.symbol); setHoldingDiveLoading(true); fetch(`${BASE}/holding-deep-dive/${p.symbol}`).then(r=>r.json()).then(d=>{setHoldingDeepDive(d);setHoldingDiveLoading(false);}).catch(()=>setHoldingDiveLoading(false)); }
                              }} className={`border-b transition-colors cursor-pointer ${dark?"border-zinc-900/50 hover:bg-zinc-900/50":"border-gray-100 hover:bg-gray-50"} ${expandedHolding===p.symbol?(dark?"bg-zinc-900/30":"bg-blue-50/50"):""}`}>
                                <td className="py-2 px-2 font-bold text-amber-400 cursor-pointer hover:text-amber-300 whitespace-nowrap" onClick={(e)=>{e.stopPropagation();setTab("charts");setChartTicker(p.symbol);setTimeout(()=>loadChart(p.symbol),100);}}>{p.symbol}</td>
                                <td className={`py-2 px-2 ${dimText} max-w-[200px] truncate`} title={p.description}>{p.description?.split(" ").slice(0,3).join(" ")}</td>
                                <td className={`py-2 px-2 font-mono ${headText}`}>{p.quantity?.toLocaleString()}</td>
                                <td className={`py-2 px-2 font-mono ${headText}`}>${p.last_price?.toFixed(2)}</td>
                                <td className={`py-2 px-2 font-mono ${clr(p.price_change)}`}>{p.price_change>=0?"+":""}{p.price_change?.toFixed(2)}</td>
                                <td className={`py-2 px-2 font-mono font-bold ${headText}`}>${p.current_value?.toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2})}</td>
                                <td className={`py-2 px-2 font-mono ${clr(p.day_gain_dollar)}`}>{p.day_gain_dollar>=0?"+":""}${p.day_gain_dollar?.toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2})}</td>
                                <td className={`py-2 px-2 font-mono ${clr(p.day_gain_pct)}`}>{p.day_gain_pct>=0?"+":""}{p.day_gain_pct?.toFixed(2)}%</td>
                                <td className={`py-2 px-2 font-mono font-bold ${clr(p.total_gain_dollar)}`}>{p.total_gain_dollar>=0?"+":""}${p.total_gain_dollar?.toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2})}</td>
                                <td className={`py-2 px-2 font-mono font-bold ${clr(p.total_gain_pct)}`}>{p.total_gain_pct>=0?"+":""}{p.total_gain_pct?.toFixed(2)}%</td>
                                <td className={`py-2 px-2 font-mono ${dimText}`}>{p.pct_of_account?.toFixed(1)}%</td>
                                <td className={`py-2 px-2 font-mono ${dimText}`}>${p.avg_cost?.toFixed(2)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Holding Deep Dive Panel */}
                    {expandedHolding && (
                      <div className={`border rounded-lg p-4 ${cardBg} animate-fadeIn`}>
                        <div className="flex items-center justify-between mb-3">
                          <div className={`text-xs uppercase tracking-wider font-bold ${headText}`}>Deep Dive: <span className="text-amber-400">{expandedHolding}</span></div>
                          <button onClick={()=>{setExpandedHolding(null);setHoldingDeepDive(null);}} className={`text-xs ${dimText} hover:text-amber-400`}>✕ Close</button>
                        </div>
                        {holdingDiveLoading ? (
                          <div className={`text-xs animate-pulse text-center py-6 ${dimText}`}>Loading deep dive for {expandedHolding}...</div>
                        ) : holdingDeepDive?.ticker === expandedHolding ? (
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            <div className={`border rounded-lg p-3 ${cardBg}`}>
                              <div className={`text-[10px] uppercase tracking-wider mb-2 ${dimText2}`}>Key Stats</div>
                              <div className="space-y-1 text-xs">
                                <div className="flex justify-between"><span className={dimText}>Sector</span><span className={headText}>{holdingDeepDive.stats.sector}</span></div>
                                <div className="flex justify-between"><span className={dimText}>Industry</span><span className={`${headText} text-[10px]`}>{holdingDeepDive.stats.industry}</span></div>
                                <div className="flex justify-between"><span className={dimText}>P/E</span><span className={headText}>{holdingDeepDive.stats.pe?.toFixed(1) ?? "N/A"}</span></div>
                                <div className="flex justify-between"><span className={dimText}>Fwd P/E</span><span className={headText}>{holdingDeepDive.stats.forward_pe?.toFixed(1) ?? "N/A"}</span></div>
                                <div className="flex justify-between"><span className={dimText}>Mkt Cap</span><span className={headText}>{holdingDeepDive.stats.market_cap ? `$${(holdingDeepDive.stats.market_cap/1e9).toFixed(1)}B` : "N/A"}</span></div>
                                <div className="flex justify-between"><span className={dimText}>Beta</span><span className={headText}>{holdingDeepDive.stats.beta?.toFixed(2) ?? "N/A"}</span></div>
                              </div>
                            </div>
                            <div className={`border rounded-lg p-3 ${cardBg}`}>
                              <div className={`text-[10px] uppercase tracking-wider mb-2 ${dimText2}`}>52-Week Range</div>
                              <div className="flex justify-between text-[10px] mb-1">
                                <span className={dimText}>${holdingDeepDive.stats.fifty_two_week_low?.toFixed(2)}</span>
                                <span className={dimText}>${holdingDeepDive.stats.fifty_two_week_high?.toFixed(2)}</span>
                              </div>
                              <div className="h-2 rounded-full overflow-hidden" style={{background: dark ? "#27272a" : "#e5e7eb"}}>
                                <div className="h-full rounded-full bg-gradient-to-r from-red-500 via-amber-500 to-emerald-500" style={{width: `${holdingDeepDive.stats.range_position || 50}%`}} />
                              </div>
                              <div className={`text-center text-[10px] mt-1 font-mono ${headText}`}>${holdingDeepDive.stats.current_price?.toFixed(2)} ({holdingDeepDive.stats.range_position?.toFixed(0)}%)</div>
                              {holdingDeepDive.stats.target_mean && (
                                <div className={`text-center text-[10px] mt-1 ${dimText}`}>Target: <span className={headText}>${holdingDeepDive.stats.target_mean.toFixed(2)}</span></div>
                              )}
                            </div>
                            <div className={`border rounded-lg p-3 ${cardBg}`}>
                              <div className={`text-[10px] uppercase tracking-wider mb-2 ${dimText2}`}>Analyst Consensus</div>
                              {(() => {
                                const a = holdingDeepDive.analyst;
                                const total = (a.strong_buy||0) + (a.buy||0) + (a.hold||0) + (a.sell||0) + (a.strong_sell||0);
                                if (!total) return <div className={`text-xs ${dimText}`}>No analyst data</div>;
                                const buyPct = ((a.strong_buy||0)+(a.buy||0))/total*100;
                                const holdPct = (a.hold||0)/total*100;
                                return <div>
                                  <div className="flex h-3 rounded-full overflow-hidden mb-2">
                                    <div className="bg-emerald-500" style={{width:`${buyPct}%`}} />
                                    <div className="bg-amber-500" style={{width:`${holdPct}%`}} />
                                    <div className="bg-red-500" style={{width:`${100-buyPct-holdPct}%`}} />
                                  </div>
                                  <div className="flex justify-between text-[10px]">
                                    <span className="text-emerald-400">{a.strong_buy||0}+{a.buy||0} Buy</span>
                                    <span className="text-amber-400">{a.hold||0} Hold</span>
                                    <span className="text-red-400">{a.sell||0}+{a.strong_sell||0} Sell</span>
                                  </div>
                                  {holdingDeepDive.stats.recommendation && (
                                    <div className={`text-center text-xs font-bold mt-2 uppercase ${holdingDeepDive.stats.recommendation.includes("buy")?"text-emerald-400":holdingDeepDive.stats.recommendation.includes("sell")?"text-red-400":"text-amber-400"}`}>{holdingDeepDive.stats.recommendation}</div>
                                  )}
                                </div>;
                              })()}
                            </div>
                            <div className={`border rounded-lg p-3 ${cardBg}`}>
                              <div className={`text-[10px] uppercase tracking-wider mb-2 ${dimText2}`}>Recent Insiders</div>
                              {holdingDeepDive.insiders?.length > 0 ? (
                                <div className="space-y-1.5">
                                  {holdingDeepDive.insiders.slice(0,4).map((ins: any, j: number) => (
                                    <div key={j} className={`text-[10px] ${dimText}`}>
                                      <div className={headText}>{ins.name?.slice(0, 25)}</div>
                                      <div>{ins.shares > 0 ? "+" : ""}{ins.shares?.toLocaleString()} shares · {ins.date}</div>
                                    </div>
                                  ))}
                                </div>
                              ) : <div className={`text-xs ${dimText}`}>No recent insider data</div>}
                            </div>
                          </div>
                        ) : <div className={`text-xs text-center py-4 ${dimText}`}>Click a holding to view deep dive</div>}
                      </div>
                    )}

                    {/* Options Positions */}
                    {options.length > 0 && (
                      <div className={`border rounded-lg p-3 ${cardBg}`}>
                        <div className={`text-xs uppercase tracking-wider mb-2 ${dimText2}`}>Options Contracts ({options.length})</div>
                        <table className="w-full text-xs border-collapse">
                          <thead><tr className={`text-left border-b ${dark?"text-zinc-600 border-zinc-800":"text-gray-500 border-gray-200"}`}>
                            {["Contract","Description","Qty","Price","Value","P&L","P&L%"].map(h=><th key={h} className="py-1.5 px-2">{h}</th>)}
                          </tr></thead>
                          <tbody>
                            {options.map(p=>(
                              <tr key={p.raw_symbol+p.account} className={`border-b ${dark?"border-zinc-900/50":"border-gray-100"}`}>
                                <td className={`py-1.5 px-2 font-mono font-bold ${(p.quantity||0)<0?"text-red-400":"text-sky-400"}`}>{p.raw_symbol?.trim()}</td>
                                <td className={`py-1.5 px-2 ${dimText} max-w-[250px] truncate`} title={p.description}>{p.description}</td>
                                <td className={`py-1.5 px-2 font-mono ${(p.quantity||0)<0?"text-red-400":headText}`}>{p.quantity}</td>
                                <td className={`py-1.5 px-2 font-mono ${headText}`}>${p.last_price?.toFixed(2)}</td>
                                <td className={`py-1.5 px-2 font-mono font-bold ${(p.current_value||0)<0?"text-red-400":headText}`}>${p.current_value?.toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2})}</td>
                                <td className={`py-1.5 px-2 font-mono ${clr(p.total_gain_dollar)}`}>{p.total_gain_dollar>=0?"+":""}${p.total_gain_dollar?.toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2})}</td>
                                <td className={`py-1.5 px-2 font-mono ${clr(p.total_gain_pct)}`}>{p.total_gain_pct>=0?"+":""}{p.total_gain_pct?.toFixed(2)}%</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}

                    {/* Account Breakdown */}
                    {fidelitySummary?.accounts && fidelityAccount==="all" && (
                      <div className={`border rounded-lg p-3 ${cardBg}`}>
                        <div className={`text-xs uppercase tracking-wider mb-2 ${dimText2}`}>Account Breakdown</div>
                        <div className="grid grid-cols-2 gap-3">
                          {Object.entries(fidelitySummary.accounts).map(([name, info]:any)=>(
                            <div key={name} className={`border rounded-lg p-3 ${dark?"border-zinc-800":"border-gray-200"} cursor-pointer ${dark?"hover:bg-zinc-900/50":"hover:bg-gray-50"}`} onClick={()=>setFidelityAccount(name)}>
                              <div className={`text-xs font-bold ${headText} mb-1`}>{name}</div>
                              <div className="flex gap-4">
                                <div><div className={`text-[9px] ${dimText2}`}>Value</div><div className={`text-sm font-bold font-mono ${headText}`}>${info.value?.toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2})}</div></div>
                                <div><div className={`text-[9px] ${dimText2}`}>Day P&L</div><div className={`text-sm font-bold font-mono ${clr(info.day_gain)}`}>{info.day_gain>=0?"+":""}${info.day_gain?.toFixed(2)}</div></div>
                                <div><div className={`text-[9px] ${dimText2}`}>Total P&L</div><div className={`text-sm font-bold font-mono ${clr(info.total_gain)}`}>{info.total_gain>=0?"+":""}${info.total_gain?.toFixed(2)}</div></div>
                                <div><div className={`text-[9px] ${dimText2}`}>Positions</div><div className={`text-sm font-bold font-mono ${headText}`}>{info.positions}</div></div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Worst performer */}
                    {worst && (
                      <div className={`text-[10px] text-center ${dimText3}`}>
                        ⚠️ Worst performer: <span className="text-red-400 font-bold">{worst.symbol}</span> ({worst.total_gain_pct?.toFixed(1)}%) · Data snapshot from Fidelity export
                      </div>
                    )}
                  </>;
                })() : (
                  <div className={`text-xs text-center py-12 ${dimText3}`}>
                    <button onClick={()=>loadFidelityPositions(true)} className={btn}>Load Fidelity Positions</button>
                    <div className={`mt-2 text-[10px] ${dimText3}`}>Import from services/api/data/positions.csv</div>
                  </div>
                )}
              </div>
            )}

            {/* Portfolio Performance Strip */}
            {portfolioRows.length > 0 && (
              <div className={`border rounded-lg p-3 ${cardBg}`}>
                <div className={`text-xs uppercase tracking-wider mb-2 ${dimText2}`}>Biggest Winners & Losers</div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-[9px] text-emerald-500 uppercase tracking-widest mb-1">Best Performers</div>
                    {portfolioRows.filter(r=>r.pnlPct!=null&&(r.pnlPct||0)>0).sort((a,b)=>(b.pnlPct||0)-(a.pnlPct||0)).slice(0,3).map(r => (
                      <div key={r.ticker} className="flex items-center justify-between py-1">
                        <span className="text-amber-400 font-bold text-xs cursor-pointer hover:text-amber-300" onClick={()=>goToChart(r.ticker)}>{r.ticker}</span>
                        <span className="text-emerald-400 font-mono text-xs font-bold">+{r.pnlPct?.toFixed(1)}%</span>
                      </div>
                    ))}
                    {portfolioRows.filter(r=>(r.pnlPct||0)>0).length===0 && <div className={`text-[10px] ${dimText3}`}>No winners yet</div>}
                  </div>
                  <div>
                    <div className="text-[9px] text-red-500 uppercase tracking-widest mb-1">Worst Performers</div>
                    {portfolioRows.filter(r=>r.pnlPct!=null&&(r.pnlPct||0)<0).sort((a,b)=>(a.pnlPct||0)-(b.pnlPct||0)).slice(0,3).map(r => (
                      <div key={r.ticker} className="flex items-center justify-between py-1">
                        <span className="text-amber-400 font-bold text-xs cursor-pointer hover:text-amber-300" onClick={()=>goToChart(r.ticker)}>{r.ticker}</span>
                        <span className="text-red-400 font-mono text-xs font-bold">{r.pnlPct?.toFixed(1)}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── JOURNAL ───────────────────────────────────────── */}
        {tab==="journal" && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 flex-wrap">
              <div className={`text-xs uppercase tracking-wider ${dimText2}`}>Trade Journal</div>
              <button onClick={()=>setShowTradeForm(v=>!v)} className={btnOutline}>+ New Trade</button>
              <button onClick={() => window.open(`${BASE}/export/trades`, "_blank")} className={btnOutline}>Export CSV</button>
              {tradeStats.total_trades > 0 && <div className="flex gap-4 text-xs ml-auto"><span className={dimText}>Win: <span className="text-emerald-400 font-bold">{tradeStats.win_rate}%</span></span><span className={dimText}>P&L: <span className={`font-bold ${clr(tradeStats.total_pnl)}`}>${fmt(tradeStats.total_pnl)}</span></span></div>}
            </div>
            {showTradeForm && (
              <div className={`border rounded-lg p-4 space-y-3 ${cardBg}`}>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {[{l:"Ticker",k:"ticker"},{l:"Entry$",k:"entry_price"},{l:"Qty",k:"quantity"},{l:"SL",k:"stop_loss"},{l:"TP",k:"take_profit"}].map(f=><div key={f.k}><div className={`text-[10px] mb-1 ${dimText2}`}>{f.l}</div><input value={(tradeForm as any)[f.k]} onChange={e=>setTradeForm(p=>({...p,[f.k]:e.target.value}))} className={`w-full ${input}`}/></div>)}
                  <div><div className={`text-[10px] mb-1 ${dimText2}`}>Side</div><select value={tradeForm.side} onChange={e=>setTradeForm(p=>({...p,side:e.target.value}))} className={`w-full ${input}`}><option value="long">Long</option><option value="short">Short</option></select></div>
                </div>
                <button onClick={addTrade} className={btn}>Save</button>
              </div>
            )}
            {trades.map(t=>(<div key={t.id} className={`border rounded-lg p-3 ${t.status==="open"?"border-amber-800/30":borderDim}`}><div className="flex items-center gap-3 flex-wrap"><span className="text-amber-400 font-bold cursor-pointer" onClick={()=>goToChart(t.ticker)}>{t.ticker}</span><span className={`text-[10px] px-1.5 py-0.5 rounded-lg border ${t.side==="long"?"border-emerald-700 text-emerald-400":"border-red-700 text-red-400"}`}>{t.side.toUpperCase()}</span><span className={`text-xs ${dimText}`}>Entry: ${fmt(t.entry_price)} ×{t.quantity}</span>{t.pnl!=null&&<span className={`text-xs font-bold ${clr(t.pnl)}`}>{t.pnl>=0?"+":""}${fmt(t.pnl)}</span>}<div className="ml-auto flex gap-1">{t.status==="open"&&<button onClick={()=>{const p=prompt("Exit price?");if(p)closeTrade(t.id,p);}} className="text-[10px] border border-emerald-800 text-emerald-600 px-2 py-0.5 rounded-lg">Close</button>}<button onClick={()=>deleteTrade(t.id)} className={`text-[10px] ${dimText3} hover:text-red-400 px-1`}>✕</button></div></div>{t.notes&&<p className={`text-[10px] mt-1 ${dimText2}`}>{t.notes}</p>}</div>))}
            {!trades.length && <div className={`text-xs text-center py-8 ${dimText3}`}>No trades logged.</div>}
          </div>
        )}

        {/* ── ALERTS (Enhanced Phase 11) ────────────────────── */}
        {tab==="alerts" && (
          <div className="space-y-6 max-w-2xl">
            {/* Notification Controls */}
            <div className={`border rounded-lg p-3 ${cardBg}`}>
              <div className="flex items-center justify-between mb-2">
                <div className={`text-xs uppercase tracking-wider ${dimText2}`}>🔔 Push Notifications</div>
                <button onClick={enableNotifications} className={`text-[10px] px-3 py-1 rounded-lg ${notifEnabled ? "bg-emerald-600/30 border border-emerald-500 text-emerald-300" : `${btnOutline}`}`}>{notifEnabled ? "✅ Enabled" : "Enable Notifications"}</button>
              </div>
              {notifEnabled && (
                <div className="flex gap-4 text-[10px]">
                  <label className="flex items-center gap-1.5 cursor-pointer"><input type="checkbox" checked={notifPrefs.alerts} onChange={e => setNotifPrefs({ ...notifPrefs, alerts: e.target.checked })} /><span className={dimText}>Price Alerts</span></label>
                  <label className="flex items-center gap-1.5 cursor-pointer"><input type="checkbox" checked={notifPrefs.earnings} onChange={e => setNotifPrefs({ ...notifPrefs, earnings: e.target.checked })} /><span className={dimText}>Earnings</span></label>
                  <label className="flex items-center gap-1.5 cursor-pointer"><input type="checkbox" checked={notifPrefs.divs} onChange={e => setNotifPrefs({ ...notifPrefs, divs: e.target.checked })} /><span className={dimText}>Dividends</span></label>
                </div>
              )}
              {unreadAlerts.length > 0 && (
                <div className="mt-2 space-y-1">{unreadAlerts.slice(0, 5).map((a, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs border border-amber-800/30 bg-amber-950/10 px-2 py-1 rounded-lg">
                    <span className="text-amber-400">🔔</span>
                    <span className="text-amber-400 font-bold">{a.ticker}</span>
                    <span className={dimText}>{a.condition} ${a.target_price}</span>
                  </div>
                ))}</div>
              )}
            </div>

            {/* Price Alerts */}
            <div>
              <div className={`text-xs uppercase tracking-wider mb-3 ${dimText2}`}>Price Alerts</div>
              <div className="flex gap-2 flex-wrap mb-4"><input value={alTicker} onChange={e=>setAlTicker(e.target.value)} placeholder="Ticker" className={`w-20 ${input} uppercase`} /><select value={alCond} onChange={e=>setAlCond(e.target.value)} className={input}><option value="above">Above</option><option value="below">Below</option></select><input value={alPrice} onChange={e=>setAlPrice(e.target.value)} placeholder="Price" className={`w-24 ${input}`} /><button onClick={addAlert} className={btn}>SET</button></div>
              {alerts.filter(a=>a.active).map(a=>(<div key={a.id} className={`flex justify-between items-center border px-3 py-2 rounded-lg group ${cardBg}`}><span className="text-amber-400 font-bold w-16">{a.ticker}</span><span className={`text-xs ${dimText}`}>{a.condition} ${fmt(a.price)}</span><button onClick={()=>deleteAlert(a.id)} className={`${dimText3} hover:text-red-400 opacity-0 group-hover:opacity-100`}>✕</button></div>))}
            </div>
            {triggered.length > 0 && <div><div className={`text-xs uppercase tracking-wider mb-2 ${dimText2}`}>Triggered</div>{triggered.slice(0,10).map((t,i)=>(<div key={i} className="flex gap-3 border border-emerald-900/50 bg-emerald-950/10 px-3 py-2 rounded-lg mb-1 text-xs"><span className="text-amber-400 font-bold w-16">{t.ticker}</span><span className={dimText}>{t.condition} ${fmt(t.target)} → ${fmt(t.actual_price)}</span></div>))}</div>}
            <div className={`border-t pt-4 ${borderDim}`}>
              <div className={`text-xs uppercase tracking-wider mb-2 ${dimText2}`}>News Keywords</div>
              <div className="flex gap-2 mb-3"><input value={kwInput} onChange={e=>setKwInput(e.target.value)} placeholder="e.g. nvidia, fomc" className={`flex-1 ${input}`} onKeyDown={e=>e.key==="Enter"&&addKeyword()} /><button onClick={addKeyword} className={btn}>ADD</button></div>
              <div className="flex flex-wrap gap-2">{keywords.map(k=>(<span key={k} className={`flex items-center gap-1 border px-2 py-1 rounded-lg text-xs ${cardBg}`}>{k}<button onClick={()=>removeKeyword(k)} className={`${dimText2} hover:text-red-400 ml-1`}>✕</button></span>))}</div>
            </div>

            {/* Tax Lot Optimizer */}
            <div className={`border-t pt-4 ${borderDim}`}>
              <div className={`text-xs uppercase tracking-wider mb-3 ${dimText2}`}>💰 Tax Lot Optimizer</div>
              <div className="flex gap-2 flex-wrap mb-3">
                <input value={taxTicker} onChange={e => setTaxTicker(e.target.value.toUpperCase())} placeholder="Ticker" className={`w-24 ${input} uppercase`} />
                <input value={taxShares} onChange={e => setTaxShares(e.target.value)} placeholder="Shares to sell" className={`w-32 ${input}`} type="number" />
                {fidAccounts.length > 0 && (<select value={fidAccount} onChange={e => setFidAccount(e.target.value)} className={input}>{fidAccounts.map((a: any) => <option key={a.key} value={a.key}>{a.name}</option>)}</select>)}
                <button onClick={runTaxOptimizer} disabled={taxLoading} className={`${btn} ${taxLoading ? "opacity-50" : ""}`}>{taxLoading ? "Analyzing..." : "OPTIMIZE"}</button>
              </div>
              {taxLoading && <div className={`text-xs animate-pulse ${dimText}`}>Computing optimal selling strategy...</div>}
              {taxResult && !taxLoading && !taxResult.error && (
                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-xs">
                    <span className={dimText}>{taxResult.ticker} @ ${taxResult.current_price}</span>
                    <span className={dimText}>Selling {taxResult.shares_to_sell} of {taxResult.total_shares} shares</span>
                    <span className={dimText}>{taxResult.lots_count} lot(s)</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {taxResult.methods?.map((m: any) => (
                      <div key={m.method} className={`border rounded-lg p-3 text-xs ${m.method === taxResult.recommended ? "border-emerald-500 bg-emerald-950/20" : cardBg}`}>
                        <div className="flex items-center gap-1 mb-1">
                          <span className={`font-bold ${headText}`}>{m.method}</span>
                          {m.method === taxResult.recommended && <span className="text-[9px] text-emerald-400">⭐ BEST</span>}
                        </div>
                        <div className={`font-mono font-bold ${m.total_gain >= 0 ? "text-emerald-400" : "text-red-400"}`}>${m.total_gain?.toLocaleString()}</div>
                        <div className={`text-[10px] mt-1 ${dimText}`}>
                          <div>ST: <span className={m.short_term_gain >= 0 ? "text-emerald-400" : "text-red-400"}>${m.short_term_gain?.toLocaleString()}</span></div>
                          <div>LT: <span className={m.long_term_gain >= 0 ? "text-emerald-400" : "text-red-400"}>${m.long_term_gain?.toLocaleString()}</span></div>
                          <div className="mt-1">Tax: <span className="text-amber-400">${m.estimated_tax?.toLocaleString()}</span></div>
                          <div>Net: <span className="font-bold">${m.after_tax_proceeds?.toLocaleString()}</span></div>
                        </div>
                      </div>
                    ))}
                  </div>
                  {taxResult.tax_savings_vs_fifo > 0 && (
                    <div className="text-xs text-emerald-400">💡 Tax-optimized method saves ${taxResult.tax_savings_vs_fifo.toLocaleString()} vs FIFO</div>
                  )}
                </div>
              )}
              {taxResult?.error && <div className="text-xs text-red-400">{taxResult.error}</div>}
              {!taxResult && !taxLoading && <div className={`text-xs ${dimText3}`}>Enter a ticker, shares to sell, and select an account to compare FIFO, LIFO, Highest Cost, and Tax-Optimized selling methods.</div>}
            </div>
          </div>
        )}

        {/* ── NEWS ──────────────────────────────────────────── */}
        {tab==="news" && (() => {
          const SECTOR_KW_CLIENT: {[s:string]:string[]} = {
            Technology:["tech","software","semiconductor","ai","cloud","saas","aapl","msft","nvda","googl","meta","chip"],
            Finance:["bank","financial","insurance","lending","jpm","bac","gs","wall street","fed","rate"],
            Healthcare:["pharma","biotech","health","medical","drug","fda","vaccine"],
            Energy:["oil","gas","energy","solar","wind","renewable","xom","cvx","opec"],
            Consumer:["retail","consumer","ecommerce","amazon","walmart","amzn","wmt","spending"],
            Crypto:["bitcoin","ethereum","crypto","blockchain","btc","eth","defi","token"],
            Industrials:["manufacturing","industrial","aerospace","defense","supply chain"],
          };
          const intelArticles = newsIntel?.articles || [];
          const fallbackArticles = news.map((n:any,i:number)=>({...n, id:String(i), category:"other", sentiment:0, sentiment_label:"neutral", tickers:[], relative_time:""}));
          const allArticles = intelArticles.length > 0 ? intelArticles : fallbackArticles;
          let filtered = [...allArticles];
          if (newsSubTab !== "all" && newsSubTab !== "watchlist") filtered = filtered.filter((a:any) => a.category === newsSubTab);
          if (newsTopicFilter) filtered = filtered.filter((a:any) => (a.title + " " + (a.summary||"")).toLowerCase().includes(newsTopicFilter));
          if (newsSectorFilter) { const sw = SECTOR_KW_CLIENT[newsSectorFilter]||[]; filtered = filtered.filter((a:any) => { const t = (a.title + " " + (a.summary||"")).toLowerCase(); return sw.some(w => t.includes(w)); }); }
          if (newsSearchQuery) { const q = newsSearchQuery.toLowerCase(); filtered = filtered.filter((a:any) => a.title?.toLowerCase().includes(q) || a.source?.toLowerCase().includes(q) || a.tickers?.some((t:string)=>t.toLowerCase().includes(q))); }
          const bullPct = newsIntel?.stats?.sentiment_breakdown?.bullish_pct ?? 50;
          return (
          <div className="space-y-4">
            {/* Breaking News Banner */}
            {breaking.length > 0 && (
              <div style={{ background: dark ? "linear-gradient(90deg, #1a0a0a, #0a0a12, #1a0a0a)" : "linear-gradient(90deg, #fef2f2, #fff, #fef2f2)", borderBottom: `1px solid ${dark?"#3f0a0a":"#fecaca"}`, padding:"6px 16px", borderRadius:6, overflow:"hidden" }}>
                <div className="flex gap-6 overflow-x-auto whitespace-nowrap scrollbar-hide">
                  {breaking.slice(0,8).map((b:any,i:number) => (
                    <span key={i} className="inline-flex items-center gap-2 text-xs shrink-0">
                      <span className="text-red-500 font-bold text-[10px] animate-pulse">BREAKING</span>
                      <span className={bodyText}>{b.title || b.message}</span>
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Stats Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label:"Articles Today", value: newsIntel?.stats?.total_today || news.length, icon:"📰", color:"text-amber-400" },
                { label:"Top Ticker", value: newsIntel?.stats?.most_mentioned_ticker || "---", icon:"📈", color:"text-amber-400" },
                { label:"Bullish Sentiment", value: `${bullPct.toFixed?.(0) ?? bullPct}%`, icon:"🐂", color: bullPct > 50 ? "text-emerald-400" : "text-red-400" },
                { label:"Trending Topics", value: newsIntel?.stats?.trending_topics_count || 0, icon:"🔥", color:"text-violet-400" },
              ].map((s,i) => (
                <div key={i} className={`border rounded-lg p-3 ${cardBg}`}>
                  <div className={`text-xs uppercase tracking-wider ${dimText2}`}>{s.icon} {s.label}</div>
                  <div className={`text-lg font-bold font-mono ${s.color}`}>{s.value}</div>
                </div>
              ))}
            </div>

            {/* Sub-tabs + Search + Refresh */}
            <div className="flex items-center gap-2 flex-wrap">
              {(["all","market","earnings","crypto","tech","watchlist"] as const).map(st => (
                <button key={st} onClick={() => { setNewsSubTab(st); if (st==="watchlist" && !watchlistNews) loadWatchlistNews(); }}
                  className={`text-[10px] px-3 py-1.5 rounded-lg border transition-colors ${newsSubTab===st ? "bg-amber-400 text-zinc-950 border-amber-400 font-bold" : dark ? "border-zinc-700 text-zinc-400 hover:border-amber-500/50" : "border-gray-300 text-gray-500 hover:border-amber-500/50"}`}>
                  {st==="all"?"All":st==="market"?"Market":st==="earnings"?"Earnings":st==="crypto"?"Crypto":st==="tech"?"Tech":"📋 Watchlist"}
                </button>
              ))}
              <input value={newsSearchQuery} onChange={e=>setNewsSearchQuery(e.target.value)} placeholder="Search news..." className={`ml-auto ${input} max-w-[200px]`} />
              <button onClick={()=>{ fetch(`${BASE}/news/refresh`).then(()=>{loadNews();loadNewsAlerts();loadNewsIntelligence();}); }} className={btnOutline}>↻ Refresh</button>
            </div>

            {/* Keyword Alerts */}
            {newsAlerts.length>0 && (
              <div className={`border rounded-lg p-3 space-y-2 ${dark?"border-amber-800/30 bg-amber-950/10":"border-amber-200 bg-amber-50"}`}>
                <span className={`text-xs font-bold uppercase tracking-widest ${dark?"text-amber-400":"text-amber-600"}`}>⚠ Keyword Alerts</span>
                {newsAlerts.slice(0,5).map((a:any,i:number) => (<div key={i} className="text-xs"><a href={a.link} target="_blank" rel="noreferrer" className={`hover:text-amber-300 ${bodyText}`}>{a.title}</a></div>))}
              </div>
            )}

            {/* Main Content */}
            {newsSubTab === "watchlist" ? (
              <div className="space-y-4">
                {watchlistNewsLoading && <div className={`text-xs animate-pulse py-8 text-center ${dimText}`}>Loading watchlist news...</div>}
                {watchlistNews?.groups?.map((group:any) => (
                  <div key={group.ticker} className={`border rounded-lg p-3 ${cardBg}`}>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-amber-400 font-bold text-sm cursor-pointer hover:text-amber-300" onClick={()=>{ setTab("charts"); }}>${group.ticker}</span>
                      <span className={`text-[10px] ${dimText3}`}>{group.articles.length} articles</span>
                    </div>
                    <div className="space-y-2">
                      {group.articles.slice(0,4).map((a:any,i:number) => (
                        <div key={i} className={`border-b last:border-0 pb-2 last:pb-0 ${borderDim2}`}>
                          <a href={a.link} target="_blank" rel="noreferrer" className={`text-xs hover:text-amber-300 leading-snug block ${bodyText}`}>{a.title}</a>
                          <span className={`text-[10px] ${dimText3}`}>{a.source} · {a.relative_time || a.published?.slice(0,16)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
                {!watchlistNews?.groups?.length && !watchlistNewsLoading && <div className={`text-xs text-center py-12 ${dimText3}`}>No watchlist tickers or no recent news found</div>}
              </div>
            ) : (
              <div className="grid lg:grid-cols-4 gap-4">
                {/* Left: Article Cards */}
                <div className="lg:col-span-3 space-y-3">
                  {newsIntelLoading && !newsIntel && <div className={`text-xs animate-pulse py-12 text-center ${dimText}`}>Analyzing news intelligence...</div>}
                  {filtered.map((article:any,i:number) => (
                    <div key={article.id||i} className={`border rounded-lg p-3 transition-all hover:border-amber-500/30 ${cardBg}`}>
                      <div className="flex items-start gap-3">
                        <div className="mt-1.5 shrink-0">
                          <div className="w-2.5 h-2.5 rounded-full" style={{ background: article.sentiment_label==="bullish"?"#10b981":article.sentiment_label==="bearish"?"#ef4444":dark?"#52525b":"#9ca3af" }} title={`${article.sentiment_label} (${article.sentiment})`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <a href={article.link} target="_blank" rel="noreferrer" className={`text-xs hover:text-amber-300 leading-snug block font-medium ${headText}`}>{article.title}</a>
                          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                            <span className={`text-[10px] font-bold ${dark?"text-zinc-500":"text-gray-400"}`}>{article.source}</span>
                            <span className={`text-[10px] ${dimText3}`}>{article.relative_time || article.published?.slice(0,16)}</span>
                            {article.category && article.category !== "other" && (
                              <span className={`text-[9px] px-1.5 py-0.5 rounded-lg border ${
                                article.category==="earnings"?"border-violet-700/50 text-violet-400 bg-violet-950/20":
                                article.category==="crypto"?"border-orange-700/50 text-orange-400 bg-orange-950/20":
                                article.category==="tech"?"border-blue-700/50 text-blue-400 bg-blue-950/20":
                                "border-amber-700/50 text-amber-400 bg-amber-950/20"}`}>{article.category}</span>
                            )}
                          </div>
                          {article.tickers?.length > 0 && (
                            <div className="flex gap-1 mt-2 flex-wrap">
                              {article.tickers.slice(0,5).map((t:string) => (
                                <span key={t} onClick={()=>{ setTab("charts"); }} className="border border-amber-800/30 bg-amber-950/10 px-1.5 py-0.5 rounded-lg text-[10px] text-amber-400 cursor-pointer hover:bg-amber-950/30 font-mono font-bold">${t}</span>
                              ))}
                            </div>
                          )}
                          {newsExpanded === String(article.id) && article.summary && (
                            <p className={`text-[11px] mt-2 leading-relaxed ${dimText}`}>{article.summary}</p>
                          )}
                        </div>
                        <div className="flex flex-col gap-1 shrink-0">
                          <button onClick={()=>setNewsExpanded(newsExpanded===String(article.id)?null:String(article.id))} className={`text-[10px] px-1.5 py-0.5 rounded-lg ${dimText2} hover:text-amber-400`} title="Expand">{newsExpanded===String(article.id)?"−":"+"}</button>
                          <button onClick={()=>toggleBookmark(article)} className={`text-[10px] px-1.5 py-0.5 rounded-lg ${newsBookmarks.has(String(article.id))?"text-amber-400":dimText3} hover:text-amber-400`} title="Bookmark">{newsBookmarks.has(String(article.id))?"★":"☆"}</button>
                          <button onClick={()=>navigator.clipboard.writeText(article.link)} className={`text-[10px] px-1.5 py-0.5 rounded-lg ${dimText3} hover:text-amber-400`} title="Copy link">↗</button>
                        </div>
                      </div>
                    </div>
                  ))}
                  {filtered.length === 0 && !newsIntelLoading && <div className={`text-xs text-center py-12 ${dimText3}`}>No articles match the current filters</div>}
                </div>

                {/* Right: Sidebar */}
                <div className="lg:col-span-1 space-y-3">
                  {/* Sentiment Gauge */}
                  <div className={`border rounded-lg p-3 ${cardBg}`}>
                    <div className={`text-xs uppercase tracking-wider mb-3 ${dimText2}`}>Market Sentiment</div>
                    <svg viewBox="0 0 200 120" className="w-full">
                      <defs>
                        <linearGradient id="sentGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                          <stop offset="0%" stopColor="#ef4444" />
                          <stop offset="50%" stopColor="#f59e0b" />
                          <stop offset="100%" stopColor="#10b981" />
                        </linearGradient>
                      </defs>
                      <path d="M 20 100 A 80 80 0 0 1 180 100" fill="none" stroke={dark?"#27272a":"#e5e7eb"} strokeWidth="12" strokeLinecap="round" />
                      <path d="M 20 100 A 80 80 0 0 1 180 100" fill="none" stroke="url(#sentGrad)" strokeWidth="12" strokeLinecap="round"
                        strokeDasharray={`${(bullPct / 100) * 251} 251`} />
                      {(() => { const angle = Math.PI - (bullPct / 100) * Math.PI; const nx = 100 + 65 * Math.cos(angle); const ny = 100 - 65 * Math.sin(angle);
                        return <><line x1={100} y1={100} x2={nx} y2={ny} stroke={dark?"#f59e0b":"#d97706"} strokeWidth={2} strokeLinecap="round" /><circle cx={100} cy={100} r={4} fill={dark?"#f59e0b":"#d97706"} /></>; })()}
                      <text x={20} y={115} fontSize={9} fill="#ef4444" textAnchor="start">Bearish</text>
                      <text x={180} y={115} fontSize={9} fill="#10b981" textAnchor="end">Bullish</text>
                      <text x={100} y={90} fontSize={16} fill={dark?"#fff":"#111"} textAnchor="middle" fontWeight="bold" fontFamily="JetBrains Mono">{typeof bullPct==="number"?bullPct.toFixed(0):bullPct}%</text>
                    </svg>
                    {/* Sentiment breakdown */}
                    <div className="flex justify-between text-[10px] mt-1">
                      <span className="text-emerald-400">🐂 {newsIntel?.stats?.sentiment_breakdown?.bullish || 0}</span>
                      <span className={dimText3}>⚖ {newsIntel?.stats?.sentiment_breakdown?.neutral || 0}</span>
                      <span className="text-red-400">🐻 {newsIntel?.stats?.sentiment_breakdown?.bearish || 0}</span>
                    </div>
                  </div>

                  {/* Trending Topics */}
                  <div className={`border rounded-lg p-3 ${cardBg}`}>
                    <div className={`text-xs uppercase tracking-wider mb-2 ${dimText2}`}>🔥 Trending Topics</div>
                    <div className="flex flex-wrap gap-1.5">
                      {(newsIntel?.trending_topics || []).map((topic:any,i:number) => {
                        const maxC = Math.max(...(newsIntel?.trending_topics||[{count:1}]).map((t:any) => t.count));
                        const scale = 0.7 + (topic.count / maxC) * 0.6;
                        const isActive = newsTopicFilter === topic.term;
                        return (
                          <button key={i} onClick={()=>setNewsTopicFilter(isActive?"":topic.term)}
                            className={`rounded-lg px-2 py-1 transition-colors cursor-pointer ${isActive?"bg-amber-400 text-zinc-950 font-bold":dark?"bg-zinc-800/50 text-zinc-400 hover:text-amber-400 border border-zinc-700/50":"bg-gray-100 text-gray-600 hover:text-amber-600 border border-gray-200"}`}
                            style={{fontSize:`${Math.round(10*scale)}px`}}>
                            {topic.term}<span className={`ml-1 ${isActive?"text-zinc-700":dimText3}`} style={{fontSize:"9px"}}>{topic.count}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Sector Coverage */}
                  <div className={`border rounded-lg p-3 ${cardBg}`}>
                    <div className={`text-xs uppercase tracking-wider mb-2 ${dimText2}`}>📊 Sector Coverage</div>
                    <div className="grid grid-cols-2 gap-1">
                      {Object.entries(newsIntel?.sector_heatmap || {}).sort((a:any,b:any) => b[1].count - a[1].count).map(([sector,data]:[string,any]) => {
                        const maxC = Math.max(...Object.values(newsIntel?.sector_heatmap||{}).map((d:any)=>d.count), 1);
                        const intensity = data.count / maxC;
                        const isActive = newsSectorFilter === sector;
                        return (
                          <button key={sector} onClick={()=>setNewsSectorFilter(isActive?"":sector)}
                            className={`rounded-lg p-2 text-center cursor-pointer transition-all ${isActive?"ring-1 ring-amber-400":""}`}
                            style={{ background: dark ? `rgba(245,158,11,${0.05+intensity*0.35})` : `rgba(245,158,11,${0.03+intensity*0.2})`, border:`1px solid ${dark?`rgba(245,158,11,${0.1+intensity*0.3})`:`rgba(245,158,11,${0.1+intensity*0.2})`}` }}>
                            <div className={`text-[10px] font-bold truncate ${dark?"text-amber-300":"text-amber-700"}`}>{sector}</div>
                            <div className={`text-[9px] font-mono ${dimText}`}>{data.count}</div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Timeline */}
                  <div className={`border rounded-lg p-3 ${cardBg}`}>
                    <div className={`text-xs uppercase tracking-wider mb-3 ${dimText2}`}>⏱ Timeline</div>
                    {Object.entries(newsIntel?.timeline_groups || {}).filter(([_,indices]:[string,any]) => indices.length > 0).map(([group,indices]:[string,any]) => (
                      <div key={group} className="mb-3">
                        <div className={`text-[10px] font-bold mb-1.5 ${dark?"text-amber-400":"text-amber-600"}`}>{group}</div>
                        <div className="relative pl-4">
                          <div className="absolute left-1 top-0 bottom-0 w-px" style={{background:dark?"#3f3f46":"#d1d5db"}} />
                          {indices.slice(0,5).map((idx:number) => {
                            const a = (newsIntel?.articles||[])[idx];
                            if (!a) return null;
                            return (
                              <div key={idx} className="relative mb-2 pl-2">
                                <div className="absolute -left-[11px] top-1.5 w-2 h-2 rounded-full" style={{background:a.sentiment_label==="bullish"?"#10b981":a.sentiment_label==="bearish"?"#ef4444":dark?"#52525b":"#9ca3af"}} />
                                <a href={a.link} target="_blank" rel="noreferrer" className={`text-[11px] hover:text-amber-300 leading-snug block ${bodyText}`}>{a.title}</a>
                                <div className={`text-[9px] ${dimText3}`}>{a.relative_time} · {a.source}</div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Top Mentioned Tickers */}
                  {newsIntel?.stats?.ticker_counts && Object.keys(newsIntel.stats.ticker_counts).length > 0 && (
                    <div className={`border rounded-lg p-3 ${cardBg}`}>
                      <div className={`text-xs uppercase tracking-wider mb-2 ${dimText2}`}>📈 Top Tickers</div>
                      <div className="space-y-1">
                        {Object.entries(newsIntel.stats.ticker_counts).slice(0,8).map(([tk,cnt]:[string,any]) => (
                          <div key={tk} className="flex items-center gap-2">
                            <span className="text-amber-400 text-[11px] font-mono font-bold cursor-pointer hover:text-amber-300 w-12" onClick={()=>setTab("charts")}>${tk}</span>
                            <div className={`flex-1 h-1.5 rounded-full ${dark?"bg-zinc-800":"bg-gray-200"}`}>
                              <div className="h-full bg-amber-500/60 rounded-full" style={{width:`${(cnt/Object.values(newsIntel.stats.ticker_counts)[0] as number)*100}%`}} />
                            </div>
                            <span className={`text-[9px] font-mono ${dimText3}`}>{cnt}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
          );
        })()}

        {/* ── FEEDS ─────────────────────────────────────────── */}
        {tab==="feeds" && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 flex-wrap"><div className={`text-xs uppercase tracking-wider ${dimText2}`}>Research Feeds & Social</div><button onClick={()=>loadFeeds(true)} disabled={feedLoading} className={`${btn} ${feedLoading?"opacity-50":""}`}>{feedLoading?"LOADING...":"↻ REFRESH"}</button><button onClick={()=>loadFeeds(false)} className={btnOutline}>Cached</button></div>
            {feedLoading&&<div className={`text-xs animate-pulse py-12 text-center ${dimText}`}>Fetching 40+ Substacks...</div>}
            <div className="grid lg:grid-cols-4 gap-4">
              <div className="lg:col-span-1 space-y-3">
                {/* Social Feed Sentiment */}
                <div className={`border rounded-lg p-3 ${cardBg}`}>
                  <div className="text-violet-400 text-xs uppercase tracking-wider mb-2 font-bold">📡 Social Sentiment</div>
                  <div className="flex gap-1 mb-2">
                    <input value={socialTickers} onChange={e=>setSocialTickers(e.target.value.toUpperCase())} placeholder="SPY,QQQ,..." className={`flex-1 ${input} uppercase text-[11px]`} onKeyDown={e=>e.key==="Enter"&&loadSocialFeed()} />
                    <button onClick={loadSocialFeed} disabled={socialLoading} className={`bg-violet-600 text-white px-2 py-1 text-[10px] rounded-lg ${socialLoading?"opacity-50":""}`}>{socialLoading?"...":"GO"}</button>
                  </div>
                  {socialFeed && (
                    <div>
                      {/* Overall sentiment gauge */}
                      <div className="flex gap-2 mb-2 text-[10px]">
                        <span className="text-emerald-400">🐂 {socialFeed.overall_sentiment?.bullish||0} ({socialFeed.overall_sentiment?.bull_pct||50}%)</span>
                        <span className="text-red-400">🐻 {socialFeed.overall_sentiment?.bearish||0}</span>
                      </div>
                      <div className={`w-full h-2 rounded-full overflow-hidden mb-3 ${dark?"bg-zinc-800":"bg-gray-200"}`}>
                        <div className="h-full bg-emerald-500 rounded-full" style={{width:`${socialFeed.overall_sentiment?.bull_pct||50}%`}} />
                      </div>
                      {/* Per-ticker sentiment bars */}
                      <div className="space-y-1.5">
                        {(socialFeed.tickers||[]).map((tk: any) => (
                          <div key={tk.ticker}>
                            <div className="flex items-center justify-between mb-0.5">
                              <span className="text-amber-400 font-bold text-[10px] cursor-pointer hover:text-amber-300" onClick={()=>goToChart(tk.ticker)}>{tk.ticker}</span>
                              <span className={`text-[9px] ${dimText3}`}>{tk.sentiment?.bull_pct||50}% bull · {tk.volume} msgs</span>
                            </div>
                            <div className={`w-full h-1.5 rounded-full overflow-hidden ${dark?"bg-zinc-800":"bg-gray-200"}`}>
                              <div className="h-full rounded-full" style={{width:`${tk.sentiment?.bull_pct||50}%`, background: (tk.sentiment?.bull_pct||50)>=60?"#10b981":(tk.sentiment?.bull_pct||50)<=40?"#ef4444":"#f59e0b"}} />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {!socialFeed && <div className={`text-[10px] ${dimText3}`}>Click GO to load sentiment</div>}
                </div>
                <div className={`border rounded-lg p-3 ${cardBg}`}><div className="text-amber-400 text-xs uppercase tracking-wider mb-2 font-bold">🔥 Trending</div>{feedTrending.length>0?feedTrending.slice(0,15).map((t:any)=>(<div key={t.ticker} className={`flex items-center justify-between py-1 border-b last:border-0 ${borderDim2}`}><span className="text-amber-400 font-bold text-xs cursor-pointer hover:text-amber-300" onClick={()=>goToChart(t.ticker)}>{t.ticker}</span><span className={`text-[10px] ${dimText}`}>{t.count}×</span></div>)):<div className={`text-xs ${dimText3}`}>Click Refresh</div>}</div>
                <div className={`border rounded-lg p-3 ${cardBg}`}><div className="text-cyan-400 text-xs uppercase tracking-wider mb-2 font-bold">💬 Stocktwits</div><div className="flex gap-1 mb-2"><input value={stwitsTicker} onChange={e=>setStwitsTicker(e.target.value.toUpperCase())} placeholder="TICKER" className={`flex-1 ${input} uppercase text-[11px]`} onKeyDown={e=>e.key==="Enter"&&loadStwits()}/><button onClick={()=>loadStwits()} className="bg-cyan-600 text-white px-2 py-1 text-[10px] rounded-lg">GO</button></div>{stwits&&!stwitsLoading&&(<div><div className="flex gap-2 mb-2 text-[10px]"><span className="text-emerald-400">🐂 {stwits.sentiment?.bullish||0} ({stwits.sentiment?.bull_pct||50}%)</span><span className="text-red-400">🐻 {stwits.sentiment?.bearish||0}</span></div><div className={`w-full h-2 rounded-full overflow-hidden mb-2 ${dark?"bg-zinc-800":"bg-gray-200"}`}><div className="h-full bg-emerald-500 rounded-full" style={{width:`${stwits.sentiment?.bull_pct||50}%`}}/></div><div className="max-h-48 overflow-y-auto space-y-1.5">{(stwits.messages||[]).slice(0,8).map((m:any)=>(<div key={m.id} className={`text-[11px] border-b pb-1 ${borderDim2}`}><span className={`font-bold ${dimText}`}>@{m.user}</span>{m.sentiment==="Bullish"&&<span className="text-emerald-500 text-[9px] ml-1">🐂</span>}{m.sentiment==="Bearish"&&<span className="text-red-500 text-[9px] ml-1">🐻</span>}<p className={`${dimText} leading-relaxed`}>{m.body?.slice(0,150)}</p></div>))}</div></div>)}</div>
                <div className={`border rounded-lg p-3 ${cardBg}`}><div className={`text-xs uppercase tracking-wider mb-2 ${dimText}`}>Filter</div><select value={feedFilter} onChange={e=>setFeedFilter(e.target.value)} className={`w-full ${input} text-[11px]`}><option value="">All Sources</option>{[...new Set(feedEntries.map(e=>e.source))].sort().map(s=><option key={s} value={s}>{s}</option>)}</select><input value={feedTickerFilter} onChange={e=>setFeedTickerFilter(e.target.value.toUpperCase())} placeholder="Filter by ticker" className={`w-full ${input} text-[11px] uppercase mt-2`}/></div>
              </div>
              <div className="lg:col-span-3 space-y-3">
                {feedEntries.filter(e=>!feedFilter||e.source===feedFilter).filter(e=>!feedTickerFilter||e.tickers?.includes(feedTickerFilter)||e.title?.toUpperCase().includes(feedTickerFilter)).map((entry:any,i:number)=>(
                  <div key={i} className={`border rounded-lg p-3 hover:border-amber-500/30 transition-colors ${cardBg}`}>
                    <div className="flex items-center gap-2 mb-1 flex-wrap"><span className="text-[10px] text-amber-400 font-bold uppercase tracking-wide">{entry.source}</span><span className={`text-[10px] ${dimText3}`}>{entry.published?.slice(0,16)}</span></div>
                    <a href={entry.link} target="_blank" rel="noreferrer" className={`text-sm hover:text-amber-300 font-medium leading-snug block mb-1 ${headText}`}>{entry.title}</a>
                    {entry.summary&&<p className={`text-xs leading-relaxed line-clamp-2 ${dimText}`}>{entry.summary?.slice(0,250)}</p>}
                    {entry.tickers?.length>0&&(<div className="flex gap-1.5 mt-2 flex-wrap">{entry.tickers.map((t:string)=>(<span key={t} className="border border-amber-800/30 bg-amber-950/10 px-1.5 py-0.5 rounded-lg text-[10px] text-amber-400 cursor-pointer hover:bg-amber-950/30" onClick={()=>goToChart(t)}>${t}</span>))}</div>)}
                  </div>
                ))}
                {!feedEntries.length&&!feedLoading&&<div className={`text-xs text-center py-16 ${dimText3}`}>Click REFRESH to load feeds</div>}
              </div>
            </div>
          </div>
        )}

        {/* ── SCREENER ──────────────────────────────────────── */}
        {tab==="screener" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className={`text-xs uppercase tracking-wider ${dimText2}`}>Stock Screener</div>
              <div className="flex gap-2">
                <button onClick={()=>setShowSaveScreen(!showSaveScreen)} className={btnOutline}>💾 Save</button>
                {savedScreens.length > 0 && (
                  <div className="relative group">
                    <button className={btnOutline}>📂 Load ({savedScreens.length})</button>
                    <div className={`absolute right-0 top-full mt-1 z-50 border rounded-lg p-2 min-w-[180px] hidden group-hover:block ${dark?"bg-zinc-900 border-zinc-700":"bg-white border-gray-200"}`}>
                      {savedScreens.map((s: any) => (
                        <div key={s.id} className={`flex items-center justify-between py-1.5 px-2 text-xs rounded-lg cursor-pointer ${dark?"hover:bg-zinc-800":"hover:bg-gray-100"}`}>
                          <span onClick={() => { applySavedScreen(s); runScreener(s.universe); }} className={headText}>{s.name}</span>
                          <button onClick={() => deleteSavedScreen(s.id)} className={`${dimText3} hover:text-red-400 ml-2`}>✕</button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
            {showSaveScreen && (
              <div className="flex gap-2">
                <input value={saveScreenName} onChange={e => setSaveScreenName(e.target.value)} placeholder="Screen name" className={`flex-1 text-xs ${input}`} onKeyDown={e => e.key === "Enter" && saveScreen()} />
                <button onClick={saveScreen} className={btn}>Save</button>
              </div>
            )}
            <div className="flex gap-2 flex-wrap items-end">
              <div><div className={`text-[10px] mb-1 ${dimText2}`}>Universe</div><select value={screenUniverse} onChange={e=>{setScreenUniverse(e.target.value);setScreenCustom("");}} className={input}><option value="sp500_top">S&P 500</option><option value="tech">Tech</option><option value="growth">Growth</option><option value="dividend">Dividend</option><option value="small_cap">Small Cap</option></select></div>
              <div><div className={`text-[10px] mb-1 ${dimText2}`}>Sector</div><select value={screenSector} onChange={e=>setScreenSector(e.target.value)} className={`${input} w-32`}><option value="">All</option>{screenSectors.map(s=><option key={s} value={s}>{s}</option>)}</select></div>
              <div><div className={`text-[10px] mb-1 ${dimText2}`}>Min Cap $B</div><input value={screenMinCap} onChange={e=>setScreenMinCap(e.target.value)} className={`w-16 ${input}`}/></div>
              <div><div className={`text-[10px] mb-1 ${dimText2}`}>Max P/E</div><input value={screenMaxPe} onChange={e=>setScreenMaxPe(e.target.value)} className={`w-16 ${input}`}/></div>
              <button onClick={()=>runScreener()} disabled={screenLoading} className={`${btn} ${screenLoading?"opacity-50":""}`}>{screenLoading?"...":"SCAN"}</button>
            </div>
            <div className="flex gap-2 items-center"><div className={`text-[10px] ${dimText2}`}>Custom:</div><input value={screenCustom} onChange={e=>setScreenCustom(e.target.value)} placeholder="AAPL,MSFT,..." className={`flex-1 max-w-md ${input} uppercase`} onKeyDown={e=>e.key==="Enter"&&runScreener()}/></div>
            {screenLoading&&<div className={`text-xs animate-pulse py-12 text-center ${dimText}`}>Scanning stocks...</div>}
            {screenResults.length>0&&!screenLoading&&(
              <div className="overflow-x-auto"><table className="w-full text-xs border-collapse min-w-[950px]"><thead><tr className={`text-left border-b ${dark?"text-zinc-600 border-zinc-800":"text-gray-500 border-gray-200"}`}>
                {[{k:"name",l:"Ticker"},{k:"composite_score",l:"Score"},{k:"price",l:"Price"},{k:"change_pct",l:"Chg%"},{k:"market_cap",l:"MktCap"},{k:"pe",l:"P/E"},{k:"momentum_pctile",l:"MTM%ile"},{k:"volume",l:"Vol"},{k:"dividend_yield",l:"Div%"},{k:"from_52h_pct",l:"vs52H"}].map(col=>(
                  <th key={col.k} className="py-2 px-2 cursor-pointer hover:text-amber-400 select-none" onClick={()=>{const nd=screenSort===col.k&&screenSortDir==="desc"?"asc":"desc";setScreenSort(col.k);setScreenSortDir(nd);setScreenResults(p=>[...p].sort((a,b)=>{const av=a[col.k],bv=b[col.k];if(av==null)return 1;if(bv==null)return-1;return nd==="desc"?bv-av:av-bv;}));}}>{col.l}{screenSort===col.k?(screenSortDir==="desc"?"▼":"▲"):""}</th>
                ))}<th></th>
              </tr></thead><tbody>
                {screenResults.map(r=>{const fs=r.factor_scores;const cs=r.composite_score;return(<tr key={r.ticker} className={`border-b ${dark?"border-zinc-900/30 hover:bg-zinc-900/50":"border-gray-100 hover:bg-gray-50"}`}>
                  <td className="py-1.5 px-2"><span className="text-amber-400 font-bold cursor-pointer" onClick={()=>goToChart(r.ticker)}>{r.ticker}</span><div className={`text-[10px] truncate max-w-[100px] ${dimText2}`}>{r.name}</div></td>
                  <td className="py-1.5 px-2">{cs!=null?(
                    <div className="flex flex-col items-center gap-0.5">
                      <span className={`text-xs font-bold font-mono px-1.5 py-0.5 rounded-lg ${cs>=70?"bg-emerald-500/20 text-emerald-400":cs>=50?"bg-amber-500/20 text-amber-400":"bg-red-500/20 text-red-400"}`}>{cs}</span>
                      {fs&&<div className="flex gap-px w-full mt-0.5">
                        {[{k:"value",c:"#8b5cf6"},{k:"momentum",c:"#3b82f6"},{k:"quality",c:"#10b981"}].map(f=>(
                          <div key={f.k} className="flex-1 h-1 rounded-full overflow-hidden" style={{background:dark?"#27272a":"#e5e7eb"}}>
                            <div className="h-full rounded-full" style={{width:`${fs[f.k]||0}%`,background:f.c}}/>
                          </div>
                        ))}
                      </div>}
                      {fs&&<div className="flex justify-between w-full"><span style={{fontSize:7,color:"#8b5cf6"}}>V</span><span style={{fontSize:7,color:"#3b82f6"}}>M</span><span style={{fontSize:7,color:"#10b981"}}>Q</span></div>}
                    </div>
                  ):<span className={dimText3}>—</span>}</td>
                  <td className={`py-1.5 px-2 font-mono ${headText}`}>${fmt(r.price)}</td>
                  <td className={`py-1.5 px-2 font-mono font-bold ${clr(r.change_pct)}`}>{pct(r.change_pct)}</td>
                  <td className={`py-1.5 px-2 ${bodyText}`}>{r.market_cap>=1e12?`$${(r.market_cap/1e12).toFixed(1)}T`:r.market_cap>=1e9?`$${(r.market_cap/1e9).toFixed(1)}B`:"—"}</td>
                  <td className={`py-1.5 px-2 font-mono ${r.pe<15?"text-emerald-400":r.pe>40?"text-red-400":bodyText}`}>{r.pe?fmt(r.pe,1):"—"}</td>
                  <td className="py-1.5 px-2">{r.momentum_pctile!=null?(
                    <div className="flex items-center gap-1">
                      <div className="w-8 h-1.5 rounded-full overflow-hidden" style={{background:dark?"#27272a":"#e5e7eb"}}>
                        <div className="h-full rounded-full" style={{width:`${r.momentum_pctile}%`,background:r.momentum_pctile>=70?"#10b981":r.momentum_pctile>=40?"#f59e0b":"#ef4444"}}/>
                      </div>
                      <span className={`text-[10px] font-mono ${r.momentum_pctile>=70?"text-emerald-400":r.momentum_pctile>=40?"text-amber-400":"text-red-400"}`}>{r.momentum_pctile}</span>
                    </div>
                  ):<span className={dimText3}>—</span>}</td>
                  <td className={`py-1.5 px-2 ${dimText}`}>{r.volume>=1e6?`${(r.volume/1e6).toFixed(1)}M`:"—"}</td>
                  <td className={`py-1.5 px-2 ${r.dividend_yield>3?"text-emerald-400":dimText}`}>{r.dividend_yield?`${fmt(r.dividend_yield,1)}%`:"—"}</td>
                  <td className={`py-1.5 px-2 font-mono ${clr(r.from_52h_pct)}`}>{pct(r.from_52h_pct)}</td>
                  <td className="py-1.5 px-2"><button onClick={()=>{setTab("ai");setAiTicker(r.ticker);setTimeout(()=>runAI(r.ticker),100);}} className={`text-[10px] ${dimText2} hover:text-violet-400`}>🧠</button></td>
                </tr>)})}
              </tbody></table></div>
            )}
          </div>
        )}

        {/* ── CONVICTIONS ───────────────────────────────────── */}
        {tab==="convictions" && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 flex-wrap">
              <div className={`text-xs uppercase tracking-wider ${dimText2}`}>Convictions</div>
              {["all","watching","entered","closed"].map(s=>(<button key={s} onClick={()=>setConvFilter(s)} className={`px-2 py-1 text-xs rounded-lg ${convFilter===s?"bg-amber-400 text-zinc-950 font-bold":`border ${dark?"border-zinc-800 text-zinc-500":"border-gray-300 text-gray-500"}`}`}>{s}</button>))}
              <button onClick={()=>setShowConvForm(v=>!v)} className={`ml-auto ${btnOutline}`}>+ Add</button>
              {convictions.filter(c=>c.trader==="Gaetano").length===0&&<button onClick={importGaetano} className="text-xs border border-amber-900 px-3 py-1 text-amber-600 rounded-lg">Import Gaetano</button>}
            </div>
            {showConvForm&&(<div className={`border rounded-lg p-4 space-y-3 ${cardBg}`}><div className="grid grid-cols-2 gap-3">{[{l:"Trader",k:"trader"},{l:"Ticker",k:"ticker"},{l:"Entry$",k:"entry_target"},{l:"Target$",k:"price_target"}].map(f=><div key={f.key||f.k}><div className={`text-[10px] mb-1 ${dimText2}`}>{f.l}</div><input value={(convForm as any)[f.k]} onChange={e=>setConvForm(p=>({...p,[f.k]:e.target.value}))} className={`w-full ${input}`}/></div>)}</div><div><div className={`text-[10px] mb-1 ${dimText2}`}>Thesis</div><textarea value={convForm.thesis} onChange={e=>setConvForm(p=>({...p,thesis:e.target.value}))} rows={2} className={`w-full ${input} resize-none`}/></div><button onClick={addConviction} className={btn}>Save</button></div>)}
            {filteredConvictions.map(c=>(<div key={c.id} className={`border rounded-lg p-3 ${c.status==="entered"?"border-emerald-800/30":borderDim}`}><div className="flex items-start justify-between gap-2"><div className="flex items-center gap-2 flex-wrap"><span className="text-amber-400 font-bold cursor-pointer" onClick={()=>goToChart(c.ticker)}>{c.ticker}</span><span className={`text-xs ${dimText2}`}>@{c.trader}</span><span className={`text-[10px] border rounded-lg px-1 ${c.status==="entered"?"border-emerald-700 text-emerald-400":"border-amber-700 text-amber-500"}`}>{c.status}</span></div><div className="flex gap-1 shrink-0">{c.status!=="entered"&&<button onClick={()=>updateConvStatus(c.id,"entered")} className="text-[10px] border border-emerald-800 text-emerald-600 px-2 py-0.5 rounded-lg">Enter</button>}{c.status!=="closed"&&<button onClick={()=>updateConvStatus(c.id,"closed")} className={`text-[10px] border px-2 py-0.5 rounded-lg ${dark?"border-zinc-700 text-zinc-600":"border-gray-300 text-gray-500"}`}>Close</button>}<button onClick={()=>deleteConviction(c.id)} className={`text-[10px] ${dimText3} hover:text-red-400 px-1`}>✕</button></div></div>{c.thesis&&<p className={`text-[11px] mt-1 leading-relaxed ${dimText}`}>{c.thesis}</p>}</div>))}
          </div>
        )}



        {/* ── HEAT MAP ─────────────────────────────────────── */}
        {tab==="heatmap" && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 flex-wrap">
              <div className={`text-xs uppercase tracking-wider ${dimText2}`}>Market Heat Map</div>
              <select value={heatmapMode} onChange={e=>setHeatmapMode(e.target.value as any)} className={input}><option value="market">Top 40</option><option value="portfolio">My Holdings</option></select>
              <button onClick={()=>loadHeatmap()} disabled={heatmapLoading} className={`${btn} ${heatmapLoading?"opacity-50":""}`}>{heatmapLoading?"LOADING...":"LOAD"}</button>
            </div>
            {heatmapData.length > 0 && (<div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-1">{heatmapData.sort((a:any,b:any)=>(b.market_cap||0)-(a.market_cap||0)).map((s:any)=>{const p=s.change_pct||0;const bg=p>3?"bg-emerald-600":p>1.5?"bg-emerald-700":p>0?"bg-emerald-900":p>-1.5?"bg-red-900":p>-3?"bg-red-700":"bg-red-600";return(<div key={s.ticker} onClick={()=>goToChart(s.ticker)} className={`${bg} rounded-lg p-2 cursor-pointer hover:opacity-80 text-center`}><div className="text-[11px] font-bold text-white">{s.ticker}</div><div className="text-[10px] font-mono text-white/80">{p>=0?"+":""}{p.toFixed(1)}%</div><div className="text-[9px] text-white/50">${s.price}</div></div>);})}</div>)}
            {!heatmapData.length && !heatmapLoading && <div className={`text-xs text-center py-16 ${dimText3}`}>Click LOAD to fetch heat map</div>}
          </div>
        )}

        {/* ── DIVIDENDS (Enhanced Phase 9) ───────────────────── */}
        {tab==="divs" && (
          <div className="space-y-4">
            {/* Sub-tabs */}
            <div className="flex items-center gap-2 flex-wrap">
              <div className={`text-xs uppercase tracking-wider ${dimText2} mr-2`}>Dividends</div>
              {(["portfolio", "calendar", "projection", "drip"] as const).map(st => (
                <button key={st} onClick={() => setDivSubTab(st)} className={`text-[10px] px-3 py-1 rounded-lg border ${divSubTab === st ? "bg-emerald-600/30 border-emerald-500 text-emerald-300" : `${dark ? "border-zinc-700 text-zinc-400" : "border-gray-300 text-gray-500"}`}`}>{st === "portfolio" ? "💰 Portfolio" : st === "calendar" ? "📅 Calendar" : st === "projection" ? "📊 Projection" : "🔄 DRIP Calc"}</button>
              ))}
            </div>

            {/* Portfolio Dividends (original enhanced) */}
            {divSubTab === "portfolio" && (
              <div className="space-y-4">
                <div className="flex items-center gap-3 flex-wrap">
                  {fidAccounts.length > 0 && (<select value={fidAccount} onChange={e => setFidAccount(e.target.value)} className={input}>{fidAccounts.map((a: any) => <option key={a.key} value={a.key}>{a.name}</option>)}</select>)}
                  <button onClick={() => loadDividends()} disabled={divLoading} className={`${btn} ${divLoading ? "opacity-50" : ""}`}>{divLoading ? "LOADING..." : "LOAD"}</button>
                </div>
                {divLoading && <div className={`text-xs animate-pulse py-12 text-center ${dimText}`}>Fetching dividend data...</div>}
                {divData && !divLoading && (<div className="space-y-4">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className={`border rounded-lg p-3 ${cardBg}`}><div className={`text-[10px] ${dimText2}`}>Annual Income</div><div className="text-xl font-bold font-mono text-emerald-400">${divData.total_annual_income?.toFixed(2)}</div></div>
                    <div className={`border rounded-lg p-3 ${cardBg}`}><div className={`text-[10px] ${dimText2}`}>Monthly</div><div className={`text-lg font-bold font-mono ${headText}`}>${(divData.total_annual_income / 12)?.toFixed(2)}</div></div>
                    <div className={`border rounded-lg p-3 ${cardBg}`}><div className={`text-[10px] ${dimText2}`}>Payers</div><div className="text-lg font-bold font-mono text-amber-400">{divData.holdings?.filter((h: any) => h.yield_pct > 0).length}/{divData.holdings?.length}</div></div>
                    <div className={`border rounded-lg p-3 ${cardBg}`}><div className={`text-[10px] ${dimText2}`}>Avg Yield</div><div className={`text-lg font-bold font-mono text-violet-400`}>{divData.holdings?.length > 0 ? (divData.holdings.reduce((s: number, h: any) => s + (h.yield_pct || 0), 0) / divData.holdings.filter((h: any) => h.yield_pct > 0).length).toFixed(2) : 0}%</div></div>
                  </div>
                  {/* Yield distribution chart */}
                  {divData.holdings?.filter((h: any) => h.annual_income > 0).length > 0 && (
                    <div style={{ width: "100%", height: 180 }}>
                      <ResponsiveContainer>
                        <BarChart data={divData.holdings?.filter((h: any) => h.annual_income > 0).sort((a: any, b: any) => b.annual_income - a.annual_income).slice(0, 15)} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
                          <XAxis dataKey="ticker" tick={{ fontSize: 9, fill: dark ? "#888" : "#666" }} />
                          <YAxis tick={{ fontSize: 9, fill: dark ? "#888" : "#666" }} tickFormatter={(v: number) => `$${v}`} />
                          <Tooltip contentStyle={{ background: dark ? "#161b22" : "#fff", border: "1px solid #30363d", fontSize: 11 }} />
                          <Bar dataKey="annual_income" name="Annual $" fill="#22c55e" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                  <div className="overflow-x-auto"><table className="w-full text-xs border-collapse"><thead><tr className={`text-left border-b ${dark ? "text-zinc-600 border-zinc-800" : "text-gray-500 border-gray-200"}`}>{["Ticker", "Shares", "Yield", "Rate", "Annual $", "Payout", "Ex-Date"].map(h => <th key={h} className="py-2 px-2">{h}</th>)}</tr></thead><tbody>{divData.holdings?.sort((a: any, b: any) => (b.annual_income || 0) - (a.annual_income || 0)).map((h: any) => (<tr key={h.ticker} className={`border-b ${dark ? "border-zinc-900/30 hover:bg-zinc-900/50" : "border-gray-100 hover:bg-gray-50"}`}><td className="py-1.5 px-2 text-amber-400 font-bold cursor-pointer" onClick={() => goToChart(h.ticker)}>{h.ticker}</td><td className="py-1.5 px-2 font-mono">{h.shares?.toFixed(h.shares % 1 ? 3 : 0)}</td><td className={`py-1.5 px-2 font-mono ${h.yield_pct > 3 ? "text-emerald-400" : h.yield_pct > 0 ? "text-amber-400" : dimText}`}>{h.yield_pct > 0 ? `${h.yield_pct.toFixed(2)}%` : "---"}</td><td className="py-1.5 px-2 font-mono">{h.annual_rate ? `$${h.annual_rate.toFixed(2)}` : "---"}</td><td className={`py-1.5 px-2 font-mono font-bold ${h.annual_income > 0 ? "text-emerald-400" : dimText}`}>{h.annual_income > 0 ? `$${h.annual_income.toFixed(2)}` : "---"}</td><td className={`py-1.5 px-2 ${dimText}`}>{h.payout_ratio > 0 ? `${h.payout_ratio}%` : "---"}</td><td className={`py-1.5 px-2 ${dimText}`}>{h.ex_date || "---"}</td></tr>))}</tbody></table></div>
                </div>)}
                {!divData && !divLoading && <div className={`text-xs text-center py-16 ${dimText3}`}>Select account and click LOAD</div>}
              </div>
            )}

            {/* Dividend Calendar */}
            {divSubTab === "calendar" && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <button onClick={loadDivCalendar} disabled={divCalLoading} className={`${btn} ${divCalLoading ? "opacity-50" : ""}`}>{divCalLoading ? "Loading..." : "📅 Load Calendar"}</button>
                  <span className={`text-[10px] ${dimText}`}>Upcoming ex-dividend dates for your tickers</span>
                </div>
                {divCalLoading && <div className={`text-xs animate-pulse py-8 text-center ${dimText}`}>Loading dividend calendar...</div>}
                {divCalendar.length > 0 && !divCalLoading && (
                  <div className="space-y-3">
                    {/* Calendar grid by month */}
                    {(() => {
                      const byMonth: Record<string, any[]> = {};
                      divCalendar.forEach(d => {
                        const m = d.ex_date?.slice(0, 7) || "Unknown";
                        if (!byMonth[m]) byMonth[m] = [];
                        byMonth[m].push(d);
                      });
                      return Object.entries(byMonth).map(([month, divs]) => (
                        <div key={month} className={`border rounded-lg p-3 ${cardBg}`}>
                          <div className={`text-[10px] font-bold uppercase tracking-wider mb-2 ${dimText2}`}>{month}</div>
                          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                            {divs.map((d, i) => (
                              <div key={i} className={`border rounded-lg p-2 text-xs ${dark ? "border-zinc-800 hover:border-emerald-700" : "border-gray-200 hover:border-emerald-400"} cursor-pointer`} onClick={() => goToChart(d.ticker)}>
                                <div className="flex justify-between">
                                  <span className="text-amber-400 font-bold">{d.ticker}</span>
                                  <span className="text-emerald-400 font-mono">{d.yield_pct}%</span>
                                </div>
                                <div className={`text-[10px] ${dimText}`}>Ex: {d.ex_date}</div>
                                <div className={`text-[10px] font-mono ${dimText}`}>${d.dividend_rate}/yr</div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ));
                    })()}
                  </div>
                )}
                {divCalendar.length === 0 && !divCalLoading && <div className={`text-xs text-center py-8 ${dimText3}`}>Click Load Calendar to see upcoming ex-dates</div>}
              </div>
            )}

            {/* Dividend Income Projection */}
            {divSubTab === "projection" && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 flex-wrap">
                  {fidAccounts.length > 0 && (<select value={fidAccount} onChange={e => setFidAccount(e.target.value)} className={input}>{fidAccounts.map((a: any) => <option key={a.key} value={a.key}>{a.name}</option>)}</select>)}
                  <button onClick={() => loadDivProjection()} disabled={divProjLoading} className={`${btn} ${divProjLoading ? "opacity-50" : ""}`}>{divProjLoading ? "Loading..." : "📊 Project Income"}</button>
                </div>
                {divProjLoading && <div className={`text-xs animate-pulse py-8 text-center ${dimText}`}>Calculating projection...</div>}
                {divProjection && !divProjLoading && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-3 gap-3">
                      <div className={`border rounded-lg p-3 ${cardBg}`}><div className={`text-[10px] ${dimText2}`}>Annual Total</div><div className="text-xl font-bold font-mono text-emerald-400">${divProjection.total_annual?.toFixed(2)}</div></div>
                      <div className={`border rounded-lg p-3 ${cardBg}`}><div className={`text-[10px] ${dimText2}`}>Monthly Avg</div><div className={`text-lg font-bold font-mono ${headText}`}>${divProjection.monthly_avg?.toFixed(2)}</div></div>
                      <div className={`border rounded-lg p-3 ${cardBg}`}><div className={`text-[10px] ${dimText2}`}>Holdings</div><div className="text-lg font-bold font-mono text-amber-400">{divProjection.holdings?.length}</div></div>
                    </div>
                    {/* Monthly income chart */}
                    {divProjection.projection?.length > 0 && (
                      <div style={{ width: "100%", height: 200 }}>
                        <ResponsiveContainer>
                          <BarChart data={divProjection.projection.map((p: any) => ({ ...p, month_label: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][p.month - 1] }))} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
                            <XAxis dataKey="month_label" tick={{ fontSize: 9, fill: dark ? "#888" : "#666" }} />
                            <YAxis tick={{ fontSize: 9, fill: dark ? "#888" : "#666" }} tickFormatter={(v: number) => `$${v}`} />
                            <Tooltip contentStyle={{ background: dark ? "#161b22" : "#fff", border: "1px solid #30363d", fontSize: 11 }} formatter={(v: number) => [`$${v.toFixed(2)}`, "Income"]} />
                            <Bar dataKey="income" name="Monthly Income" fill="#22c55e" />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    )}
                    {/* Holdings breakdown */}
                    {divProjection.holdings?.length > 0 && (
                      <div className="overflow-x-auto">
                        <table className="w-full text-xs border-collapse">
                          <thead><tr className={`text-left border-b ${dark ? "text-zinc-600 border-zinc-800" : "text-gray-500 border-gray-200"}`}>
                            {["Ticker", "Shares", "Annual $", "Quarterly", "Pay Months"].map(h => <th key={h} className="py-1.5 px-2">{h}</th>)}
                          </tr></thead>
                          <tbody>{divProjection.holdings.map((h: any) => (
                            <tr key={h.ticker} className={`border-b ${dark ? "border-zinc-900/30" : "border-gray-100"}`}>
                              <td className="py-1 px-2 text-amber-400 font-bold cursor-pointer" onClick={() => goToChart(h.ticker)}>{h.ticker}</td>
                              <td className="py-1 px-2 font-mono">{h.shares}</td>
                              <td className="py-1 px-2 font-mono text-emerald-400">${h.annual_income}</td>
                              <td className="py-1 px-2 font-mono">${h.quarterly}</td>
                              <td className={`py-1 px-2 font-mono ${dimText}`}>{h.pay_months?.map((m: number) => ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][m - 1]).join(", ")}</td>
                            </tr>
                          ))}</tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}
                {!divProjection && !divProjLoading && <div className={`text-xs text-center py-8 ${dimText3}`}>Select account and click Project Income</div>}
              </div>
            )}

            {/* DRIP Calculator */}
            {divSubTab === "drip" && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 flex-wrap">
                  {fidAccounts.length > 0 && (<select value={fidAccount} onChange={e => setFidAccount(e.target.value)} className={input}>{fidAccounts.map((a: any) => <option key={a.key} value={a.key}>{a.name}</option>)}</select>)}
                  <span className={`text-[10px] ${dimText}`}>Years:</span>
                  <select value={dripYears} onChange={e => setDripYears(e.target.value)} className={input}>
                    {["5", "10", "15", "20", "25", "30"].map(y => <option key={y} value={y}>{y}</option>)}
                  </select>
                  <button onClick={() => loadDrip()} disabled={dripLoading} className={`${btn} ${dripLoading ? "opacity-50" : ""}`}>{dripLoading ? "Loading..." : "🔄 Calculate DRIP"}</button>
                </div>
                {dripLoading && <div className={`text-xs animate-pulse py-8 text-center ${dimText}`}>Calculating DRIP projection...</div>}
                {dripData && !dripLoading && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div className={`border rounded-lg p-3 ${cardBg}`}><div className={`text-[10px] ${dimText2}`}>Initial Value</div><div className={`text-lg font-bold font-mono ${headText}`}>${dripData.initial_value?.toLocaleString()}</div></div>
                      <div className={`border rounded-lg p-3 ${cardBg}`}><div className={`text-[10px] ${dimText2}`}>Final Value ({dripData.years}yr)</div><div className="text-lg font-bold font-mono text-emerald-400">${dripData.final_value?.toLocaleString()}</div></div>
                      <div className={`border rounded-lg p-3 ${cardBg}`}><div className={`text-[10px] ${dimText2}`}>Final Dividends/yr</div><div className="text-lg font-bold font-mono text-amber-400">${dripData.final_dividends?.toLocaleString()}</div></div>
                      <div className={`border rounded-lg p-3 ${cardBg}`}><div className={`text-[10px] ${dimText2}`}>Growth Rate</div><div className="text-lg font-bold font-mono text-violet-400">{dripData.growth_rate_pct}%/yr</div></div>
                    </div>
                    {/* Growth chart */}
                    {dripData.projection?.length > 0 && (
                      <div style={{ width: "100%", height: 220 }}>
                        <ResponsiveContainer>
                          <AreaChart data={dripData.projection} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
                            <XAxis dataKey="year" tick={{ fontSize: 9, fill: dark ? "#888" : "#666" }} label={{ value: "Year", position: "bottom", fontSize: 10 }} />
                            <YAxis tick={{ fontSize: 9, fill: dark ? "#888" : "#666" }} tickFormatter={(v: number) => `$${(v / 1000).toFixed(0)}k`} />
                            <Tooltip contentStyle={{ background: dark ? "#161b22" : "#fff", border: "1px solid #30363d", fontSize: 11 }} formatter={(v: number) => [`$${v.toLocaleString()}`, ""]} />
                            <Area type="monotone" dataKey="portfolio_value" name="Portfolio Value" stroke="#22c55e" fill="#22c55e20" />
                            <Area type="monotone" dataKey="annual_dividends" name="Annual Dividends" stroke="#f59e0b" fill="#f59e0b20" />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    )}
                    {/* Projection table */}
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs border-collapse">
                        <thead><tr className={`text-left border-b ${dark ? "text-zinc-600 border-zinc-800" : "text-gray-500 border-gray-200"}`}>
                          {["Year", "Portfolio Value", "Annual Dividends", "Yield on Cost"].map(h => <th key={h} className="py-1.5 px-2">{h}</th>)}
                        </tr></thead>
                        <tbody>{dripData.projection?.filter((_: any, i: number) => i % (dripData.years > 15 ? 5 : dripData.years > 10 ? 2 : 1) === 0 || i === dripData.projection.length - 1).map((p: any) => (
                          <tr key={p.year} className={`border-b ${dark ? "border-zinc-900/30" : "border-gray-100"}`}>
                            <td className={`py-1 px-2 font-mono ${dimText}`}>{p.year}</td>
                            <td className="py-1 px-2 font-mono text-emerald-400">${p.portfolio_value?.toLocaleString()}</td>
                            <td className="py-1 px-2 font-mono text-amber-400">${p.annual_dividends?.toLocaleString()}</td>
                            <td className="py-1 px-2 font-mono text-violet-400">{p.yield_on_cost}%</td>
                          </tr>
                        ))}</tbody>
                      </table>
                    </div>
                  </div>
                )}
                {!dripData && !dripLoading && <div className={`text-xs text-center py-8 ${dimText3}`}>Select account and years, then click Calculate DRIP</div>}
              </div>
            )}
          </div>
        )}

        {/* ── PERFORMANCE ──────────────────────────────────── */}
        {tab==="perf" && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 flex-wrap">
              <div className={`text-xs uppercase tracking-wider ${dimText2}`}>Portfolio vs SPY</div>
              {fidAccounts.length > 0 && (<select value={fidAccount} onChange={e=>setFidAccount(e.target.value)} className={input}>{fidAccounts.map((a:any)=><option key={a.key} value={a.key}>{a.name}</option>)}</select>)}
              {["1mo","3mo","6mo","1y"].map(p=>(<button key={p} onClick={()=>{setPerfPeriod(p);loadPerformance(undefined,p);}} className={`${perfPeriod===p?btn:btnOutline} text-[10px]`}>{p}</button>))}
            </div>
            {perfLoading && <div className={`text-xs animate-pulse py-12 text-center ${dimText}`}>Building chart...</div>}
            {perfData && !perfLoading && !perfData.error && (<div className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className={`border rounded-lg p-3 ${cardBg}`}><div className={`text-[10px] ${dimText2}`}>Cost Basis</div><div className={`text-lg font-bold font-mono ${headText}`}>${perfData.total_cost?.toLocaleString("en-US",{minimumFractionDigits:0})}</div></div>
                <div className={`border rounded-lg p-3 ${cardBg}`}><div className={`text-[10px] ${dimText2}`}>Current</div><div className={`text-lg font-bold font-mono ${headText}`}>${perfData.current_value?.toLocaleString("en-US",{minimumFractionDigits:0})}</div></div>
                <div className={`border rounded-lg p-3 ${cardBg}`}><div className={`text-[10px] ${dimText2}`}>P&L</div><div className={`text-lg font-bold font-mono ${(perfData.current_value-perfData.total_cost)>=0?"text-emerald-400":"text-red-400"}`}>{(perfData.current_value-perfData.total_cost)>=0?"+":""}${(perfData.current_value-perfData.total_cost)?.toLocaleString("en-US",{minimumFractionDigits:0})}</div></div>
                <div className={`border rounded-lg p-3 ${cardBg}`}><div className={`text-[10px] ${dimText2}`}>vs SPY</div><div className="text-lg font-bold font-mono text-amber-400">{perfData.portfolio?.length>1&&perfData.benchmark?.length>1?`${(((perfData.portfolio[perfData.portfolio.length-1].value/perfData.portfolio[0].value)-(perfData.benchmark[perfData.benchmark.length-1].value/perfData.benchmark[0].value))*100).toFixed(1)}%`:"---"}</div></div>
              </div>
              <div className={`border rounded-lg p-1 ${cardBg}`}><canvas ref={el=>{if(!el||!perfData?.portfolio?.length)return;const c=el.getContext("2d");if(!c)return;const port=perfData.portfolio;const bench=perfData.benchmark||[];const W=el.parentElement?.clientWidth||700;const H=300;el.width=W;el.height=H;const pad={l:65,r:20,t:20,b:30};const allV=[...port.map((p:any)=>p.value),...bench.map((p:any)=>p.value)];const minV=Math.min(...allV)*0.98;const maxV=Math.max(...allV)*1.02;const toX=(i:number,len:number)=>pad.l+((i/(len-1))*(W-pad.l-pad.r));const toY=(v:number)=>pad.t+((maxV-v)/(maxV-minV))*(H-pad.t-pad.b);c.fillStyle=dark?"#09090b":"#f9fafb";c.fillRect(0,0,W,H);c.strokeStyle=dark?"#1c1c1e":"#e5e7eb";c.lineWidth=0.5;for(let i=0;i<5;i++){const y=pad.t+(i/4)*(H-pad.t-pad.b);c.beginPath();c.moveTo(pad.l,y);c.lineTo(W-pad.r,y);c.stroke();const v=maxV-(i/4)*(maxV-minV);c.fillStyle=dark?"#52525b":"#9ca3af";c.font="9px monospace";c.textAlign="right";c.fillText(`$${v.toFixed(0)}`,pad.l-5,y+3);}if(bench.length>1){c.strokeStyle="#52525b";c.lineWidth=1.5;c.setLineDash([4,3]);c.beginPath();bench.forEach((p:any,i:number)=>{i===0?c.moveTo(toX(i,bench.length),toY(p.value)):c.lineTo(toX(i,bench.length),toY(p.value));});c.stroke();c.setLineDash([]);}c.strokeStyle="#f59e0b";c.lineWidth=2.5;c.beginPath();port.forEach((p:any,i:number)=>{i===0?c.moveTo(toX(i,port.length),toY(p.value)):c.lineTo(toX(i,port.length),toY(p.value));});c.stroke();c.fillStyle="#f59e0b";c.font="10px monospace";c.textAlign="left";c.fillText("Portfolio",pad.l+10,pad.t+12);c.fillStyle="#52525b";c.fillText("SPY",pad.l+90,pad.t+12);c.fillStyle=dark?"#52525b":"#9ca3af";c.textAlign="center";c.font="9px monospace";[0,Math.floor(port.length/2),port.length-1].forEach(i=>{if(port[i])c.fillText(port[i].date?.slice(5),toX(i,port.length),H-pad.b+15);});}} className="w-full" style={{height:300}} /></div>
              <div className={`text-[10px] text-center ${dimText2}`}>Amber = Your Portfolio · Gray = SPY normalized</div>
            </div>)}
            {!perfData && !perfLoading && <div className={`text-xs text-center py-16 ${dimText3}`}>Select account and time period</div>}
          </div>
        )}

        {/* ── BACKTESTER ───────────────────────────────────── */}
        {tab==="backtest" && (
          <div className="space-y-4 max-w-4xl">
            <div className={`text-xs uppercase tracking-wider ${dimText2}`}>Strategy Backtester</div>
            <div className="flex gap-2 flex-wrap items-end">
              <div><div className={`text-[10px] mb-1 ${dimText2}`}>Ticker</div><input value={btTicker} onChange={e=>setBtTicker(e.target.value.toUpperCase())} placeholder="AAPL" className={`w-20 ${input} uppercase`}/></div>
              <div><div className={`text-[10px] mb-1 ${dimText2}`}>Strategy</div><select value={btStrategy} onChange={e=>setBtStrategy(e.target.value)} className={input}><option value="sma_cross">SMA Cross</option><option value="rsi">RSI</option><option value="macd_cross">MACD Cross</option><option value="mean_reversion">Mean Reversion</option><option value="breakout">Breakout</option></select></div>
              <div><div className={`text-[10px] mb-1 ${dimText2}`}>Period</div><select value={btPeriod} onChange={e=>setBtPeriod(e.target.value)} className={input}><option value="6mo">6mo</option><option value="1y">1yr</option><option value="2y">2yr</option><option value="5y">5yr</option></select></div>
              <div><div className={`text-[10px] mb-1 ${dimText2}`}>Fast</div><input value={btFast} onChange={e=>setBtFast(e.target.value)} className={`w-14 ${input}`}/></div>
              <div><div className={`text-[10px] mb-1 ${dimText2}`}>Slow</div><input value={btSlow} onChange={e=>setBtSlow(e.target.value)} className={`w-14 ${input}`}/></div>
              <button onClick={runBacktest} disabled={btLoading} className={`${btn} ${btLoading?"opacity-50":""}`}>{btLoading?"RUNNING...":"RUN"}</button>
              <button onClick={runOptimize} disabled={btLoading} className={`${btnOutline} ${btLoading?"opacity-50":""}`}>⚡ Optimize</button>
            </div>
            {/* Optimization results */}
            {btOptResult && btOptResult.results && (
              <div className={`border rounded-lg p-3 ${cardBg}`}>
                <div className="flex items-center justify-between mb-2">
                  <div className={`text-xs uppercase tracking-wider ${dimText2}`}>⚡ Parameter Optimization — {btOptResult.ticker} ({btOptResult.strategy})</div>
                  <button onClick={() => setBtOptResult(null)} className={`text-[10px] ${dimText3} hover:text-red-400`}>✕</button>
                </div>
                {btOptResult.best && (
                  <div className={`text-xs mb-2 p-2 rounded border ${dark?"border-emerald-800/30 bg-emerald-950/10":"border-emerald-200 bg-emerald-50"}`}>
                    <span className="text-emerald-400 font-bold">Best:</span>
                    <span className={dimText}> Fast={btOptResult.best.fast} Slow={btOptResult.best.slow} →</span>
                    <span className={`font-bold ${btOptResult.best.return_pct >= 0 ? "text-emerald-400" : "text-red-400"}`}> {btOptResult.best.return_pct >= 0 ? "+" : ""}{btOptResult.best.return_pct}%</span>
                    <span className={dimText}> ({btOptResult.best.trade_count} trades, {btOptResult.best.win_rate}% win)</span>
                  </div>
                )}
                <div className="max-h-48 overflow-y-auto">
                  <table className="w-full text-xs border-collapse">
                    <thead><tr className={`text-left border-b ${dark?"text-zinc-600 border-zinc-800":"text-gray-500 border-gray-200"}`}>
                      {["Fast","Slow","Return","Final $","Trades","Win%"].map(h => <th key={h} className="py-1 px-2">{h}</th>)}
                    </tr></thead>
                    <tbody>
                      {btOptResult.results.map((r: any, i: number) => (
                        <tr key={i} className={`border-b ${dark?"border-zinc-900/30":"border-gray-100"} ${i===0?"font-bold":""} cursor-pointer ${dark?"hover:bg-zinc-900/50":"hover:bg-gray-50"}`}
                          onClick={() => { setBtFast(String(r.fast)); setBtSlow(String(r.slow)); }}>
                          <td className="py-1 px-2 font-mono">{r.fast}</td>
                          <td className="py-1 px-2 font-mono">{r.slow}</td>
                          <td className={`py-1 px-2 font-mono ${r.return_pct >= 0 ? "text-emerald-400" : "text-red-400"}`}>{r.return_pct >= 0 ? "+" : ""}{r.return_pct}%</td>
                          <td className="py-1 px-2 font-mono">${r.final_equity?.toLocaleString()}</td>
                          <td className="py-1 px-2 font-mono">{r.trade_count}</td>
                          <td className="py-1 px-2 font-mono">{r.win_rate}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className={`text-[9px] mt-1 ${dimText3}`}>Click a row to apply those parameters</div>
              </div>
            )}
            {btResult && !btResult.error && (<div className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[{l:"Strategy",v:`${btResult.total_return_pct>=0?"+":""}${btResult.total_return_pct}%`,c:btResult.total_return_pct>=0?"text-emerald-400":"text-red-400"},{l:"Buy & Hold",v:`${btResult.buy_hold_return_pct>=0?"+":""}${btResult.buy_hold_return_pct}%`,c:btResult.buy_hold_return_pct>=0?"text-emerald-400":"text-red-400"},{l:"Alpha",v:`${btResult.alpha>=0?"+":""}${btResult.alpha}%`,c:btResult.alpha>=0?"text-emerald-400":"text-red-400"},{l:"Win Rate",v:`${btResult.win_rate}%`,c:"text-amber-400"}].map(s=>(<div key={s.l} className={`border rounded-lg p-3 ${cardBg}`}><div className={`text-[10px] ${dimText2}`}>{s.l}</div><div className={`text-lg font-bold font-mono ${s.c}`}>{s.v}</div></div>))}
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[{l:"Final $",v:`$${btResult.final_equity?.toLocaleString("en-US")}`,c:headText},{l:"Trades",v:`${btResult.trade_count}`,c:dimText},{l:"Won",v:`${btResult.winning_trades}`,c:"text-emerald-400"},{l:"Lost",v:`${btResult.losing_trades}`,c:"text-red-400"}].map(s=>(<div key={s.l} className={`border rounded-lg p-3 ${cardBg}`}><div className={`text-[10px] ${dimText2}`}>{s.l}</div><div className={`text-lg font-bold font-mono ${s.c}`}>{s.v}</div></div>))}
              </div>
              {btResult.equity_curve?.length>0 && (<div className={`border rounded-lg p-1 ${cardBg}`}><canvas ref={el=>{if(!el||!btResult?.equity_curve?.length)return;const c=el.getContext("2d");if(!c)return;const pts=btResult.equity_curve;const W=el.parentElement?.clientWidth||700;const H=280;el.width=W;el.height=H;const pad={l:65,r:20,t:20,b:30};const eqs=pts.map((p:any)=>p.equity);const minE=Math.min(...eqs)*0.98;const maxE=Math.max(...eqs)*1.02;const toX=(i:number)=>pad.l+((i/(pts.length-1))*(W-pad.l-pad.r));const toY=(v:number)=>pad.t+((maxE-v)/(maxE-minE))*(H-pad.t-pad.b);c.fillStyle=dark?"#09090b":"#f9fafb";c.fillRect(0,0,W,H);c.strokeStyle=dark?"#3f3f46":"#d1d5db";c.lineWidth=1;c.setLineDash([4,4]);c.beginPath();c.moveTo(pad.l,toY(10000));c.lineTo(W-pad.r,toY(10000));c.stroke();c.setLineDash([]);c.strokeStyle="#f59e0b";c.lineWidth=2;c.beginPath();pts.forEach((p:any,i:number)=>{i===0?c.moveTo(toX(i),toY(p.equity)):c.lineTo(toX(i),toY(p.equity));});c.stroke();btResult.trades?.forEach((t:any)=>{const idx=pts.findIndex((p:any)=>p.date===t.date);if(idx>=0){c.fillStyle=t.action==="BUY"?"#34d399":"#f87171";c.beginPath();c.arc(toX(idx),toY(pts[idx].equity),4,0,Math.PI*2);c.fill();}});c.fillStyle=dark?"#52525b":"#9ca3af";c.font="9px monospace";c.textAlign="right";for(let i=0;i<5;i++){const v=maxE-(i/4)*(maxE-minE);c.fillText(`$${v.toFixed(0)}`,pad.l-5,pad.t+(i/4)*(H-pad.t-pad.b)+3);}c.textAlign="center";[0,Math.floor(pts.length/2),pts.length-1].forEach(i=>{if(pts[i])c.fillText(pts[i].date?.slice(5),toX(i),H-pad.b+15);});}} className="w-full" style={{height:280}} /></div>)}
              <div className={`text-[10px] text-center ${dimText2}`}>Green = Buy · Red = Sell · Dashed = $10k start</div>
              {btResult.trades?.length>0 && (<div className="max-h-48 overflow-y-auto"><table className="w-full text-xs border-collapse"><thead><tr className={`text-left border-b ${dark?"text-zinc-600 border-zinc-800":"text-gray-500 border-gray-200"}`}>{["Date","Action","Price","Shares","P&L"].map(h=><th key={h} className="py-1 px-2">{h}</th>)}</tr></thead><tbody>{btResult.trades.map((t:any,i:number)=>(<tr key={i} className={`border-b ${dark?"border-zinc-900/30":"border-gray-100"}`}><td className={`py-1 px-2 ${dimText}`}>{t.date}</td><td className={`py-1 px-2 font-bold ${t.action==="BUY"?"text-emerald-400":"text-red-400"}`}>{t.action}</td><td className="py-1 px-2 font-mono">${t.price}</td><td className="py-1 px-2 font-mono">{t.shares}</td><td className={`py-1 px-2 font-mono font-bold ${(t.pnl||0)>=0?"text-emerald-400":"text-red-400"}`}>{t.pnl!=null?`${t.pnl>=0?"+":""}$${t.pnl.toFixed(0)}`:""}</td></tr>))}</tbody></table></div>)}
            </div>)}
            {btResult?.error && <div className="text-red-400 text-xs">{btResult.error}</div>}
            {!btResult && !btLoading && <div className={`text-xs text-center py-16 ${dimText3}`}>Enter ticker and click RUN</div>}
          </div>
        )}

        {/* ── ANALYTICS ────────────────────────────────────── */}
        {tab==="analytics" && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 flex-wrap">
              <div className={`text-xs uppercase tracking-wider ${dimText2}`}>Portfolio Analytics</div>
              {fidAccounts.length > 0 && (
                <select value={fidAccount} onChange={e=>{setFidAccount(e.target.value);}} className={input}>
                  {fidAccounts.map((a:any)=><option key={a.key} value={a.key}>{a.name}</option>)}
                </select>
              )}
              <button onClick={()=>loadAnalytics()} disabled={analyticsLoading} className={`${btn} ${analyticsLoading?"opacity-50":""}`}>{analyticsLoading?"ANALYZING...":"ANALYZE"}</button>
            </div>
            {analyticsLoading && <div className={`text-xs animate-pulse py-12 text-center ${dimText}`}>Fetching sector data...</div>}
            {analyticsData && !analyticsLoading && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    {l:"Total Value",v:`$${analyticsData.stats?.total_value?.toLocaleString("en-US",{minimumFractionDigits:2})}`,c:headText},
                    {l:"Total P&L",v:`${analyticsData.stats?.total_pnl>=0?"+":""}$${analyticsData.stats?.total_pnl?.toLocaleString("en-US",{minimumFractionDigits:2})}`,c:analyticsData.stats?.total_pnl>=0?"text-emerald-400":"text-red-400"},
                    {l:"Winners/Losers",v:`${analyticsData.stats?.winners}W / ${analyticsData.stats?.losers}L`,c:"text-amber-400"},
                    {l:"Avg Position",v:`$${analyticsData.stats?.avg_position_size?.toLocaleString("en-US",{minimumFractionDigits:0})}`,c:dimText},
                  ].map(s=>(
                    <div key={s.l} className={`border rounded-lg p-3 ${cardBg}`}><div className={`text-xs uppercase tracking-wider mb-1 ${dimText2}`}>{s.l}</div><div className={`text-lg font-bold font-mono ${s.c}`}>{s.v}</div></div>
                  ))}
                </div>
                <div className="flex gap-4 flex-wrap">
                  <div className={`border rounded-lg p-3 ${cardBg}`}><div className={`text-[10px] ${dimText2}`}>Best</div><span className="text-emerald-400 font-bold">{analyticsData.stats?.best_performer?.ticker}</span> <span className="text-emerald-400 text-xs">{analyticsData.stats?.best_performer?.pnl_pct>=0?"+":""}{analyticsData.stats?.best_performer?.pnl_pct?.toFixed(1)}%</span></div>
                  <div className={`border rounded-lg p-3 ${cardBg}`}><div className={`text-[10px] ${dimText2}`}>Worst</div><span className="text-red-400 font-bold">{analyticsData.stats?.worst_performer?.ticker}</span> <span className="text-red-400 text-xs">{analyticsData.stats?.worst_performer?.pnl_pct?.toFixed(1)}%</span></div>
                </div>

                <div>
                  <div className={`text-xs font-bold uppercase tracking-widest mb-3 ${dimText}`}>Sector Breakdown</div>
                  <div className="space-y-2">
                    {analyticsData.sectors?.map((s:any)=>(
                      <div key={s.sector} className={`border rounded-lg p-3 ${cardBg}`}>
                        <div className="flex items-center justify-between mb-1">
                          <span className={`text-xs font-bold ${headText}`}>{s.sector}</span>
                          <span className="text-xs text-amber-400 font-bold">{s.pct.toFixed(1)}%</span>
                        </div>
                        <div className={`w-full h-2 rounded-full overflow-hidden ${dark?"bg-zinc-800":"bg-gray-200"}`}>
                          <div className="h-full bg-amber-400 rounded-full transition-all" style={{width:`${s.pct}%`}} />
                        </div>
                        <div className={`text-[10px] mt-1 ${dimText2}`}>${s.value?.toLocaleString("en-US",{minimumFractionDigits:0})} · {s.count} positions · {s.tickers.join(", ")}</div>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <div className={`text-xs font-bold uppercase tracking-widest mb-3 ${dimText}`}>Allocation</div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs border-collapse">
                      <thead><tr className={`text-left border-b ${dark?"text-zinc-600 border-zinc-800":"text-gray-500 border-gray-200"}`}>
                        {["Ticker","Sector","Value","Alloc %","P&L %"].map(h=><th key={h} className="py-2 px-2">{h}</th>)}
                      </tr></thead>
                      <tbody>
                        {analyticsData.allocation?.map((a:any)=>(
                          <tr key={a.ticker} className={`border-b ${dark?"border-zinc-900/30 hover:bg-zinc-900/50":"border-gray-100 hover:bg-gray-50"}`}>
                            <td className="py-1.5 px-2 text-amber-400 font-bold cursor-pointer" onClick={()=>goToChart(a.ticker)}>{a.ticker}</td>
                            <td className={`py-1.5 px-2 ${dimText}`}>{a.sector}</td>
                            <td className={`py-1.5 px-2 font-mono ${headText}`}>${a.value?.toLocaleString("en-US",{minimumFractionDigits:0})}</td>
                            <td className="py-1.5 px-2 font-mono text-amber-400">{a.pct.toFixed(1)}%</td>
                            <td className={`py-1.5 px-2 font-mono font-bold ${a.pnl_pct!=null&&a.pnl_pct>=0?"text-emerald-400":"text-red-400"}`}>{a.pnl_pct!=null?`${a.pnl_pct>=0?"+":""}${a.pnl_pct.toFixed(1)}%`:"---"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
            {!analyticsData && !analyticsLoading && <div className={`text-xs text-center py-16 ${dimText3}`}>Select an account and click ANALYZE</div>}

            {/* Analytics Sub-tabs */}
            <div className={`mt-6 border-t pt-4 ${borderDim}`}>
              <div className="flex gap-1 mb-4 overflow-x-auto">
                {(["setups","time","drawdown","ratios","volume"] as const).map(st=>(
                  <button key={st} onClick={()=>{setAnalyticsSubTab(st); if(st==="setups"&&!setupStats)loadSetupStats(); if(st==="time"&&!timeAnalysis)loadTimeAnalysis(); if(st==="drawdown"&&!drawdownData)loadDrawdown(); if(st==="ratios"&&!ratiosData)loadRatios();}} className={`px-3 py-1 text-[10px] rounded-lg whitespace-nowrap ${analyticsSubTab===st?"bg-amber-400 text-zinc-950 font-bold":dark?"text-zinc-500 hover:text-zinc-200":"text-gray-500 hover:text-gray-900"}`}>
                    {st==="setups"?"Win by Setup":st==="time"?"Time Analysis":st==="drawdown"?"Drawdown":st==="ratios"?"Sharpe/Sortino":"Vol Profile"}
                  </button>
                ))}
              </div>

              {/* Setup Stats */}
              {analyticsSubTab==="setups" && (
                <div className="space-y-3">
                  {!setupStats && <button onClick={loadSetupStats} className={btn} disabled={setupStatsLoading}>{setupStatsLoading?"Loading...":"Load Setup Stats"}</button>}
                  {setupStats?.by_setup?.length > 0 && (
                    <>
                      <div className={`border rounded-lg overflow-x-auto ${cardBg}`}>
                        <table className="w-full text-xs">
                          <thead><tr className={`border-b ${borderDim}`}>
                            <th className={`text-left p-2 ${dimText}`}>Setup</th><th className={`p-2 ${dimText}`}>Count</th><th className={`p-2 ${dimText}`}>Win%</th><th className={`p-2 ${dimText}`}>Total P&L</th><th className={`p-2 ${dimText}`}>Avg Win</th><th className={`p-2 ${dimText}`}>Avg Loss</th><th className={`p-2 ${dimText}`}>PF</th>
                          </tr></thead>
                          <tbody>{setupStats.by_setup.map((s:any)=>(
                            <tr key={s.setup} className={`border-b ${borderDim2}`}>
                              <td className={`p-2 font-bold ${headText}`}>{s.setup}</td>
                              <td className={`p-2 text-center ${dimText}`}>{s.count}</td>
                              <td className={`p-2 text-center font-bold ${s.win_rate>=60?"text-emerald-400":s.win_rate<40?"text-red-400":"text-amber-400"}`}>{s.win_rate}%</td>
                              <td className={`p-2 text-center font-mono ${clr(s.total_pnl)}`}>${fmt(s.total_pnl)}</td>
                              <td className="p-2 text-center text-emerald-400 font-mono">${fmt(s.avg_win)}</td>
                              <td className="p-2 text-center text-red-400 font-mono">${fmt(s.avg_loss)}</td>
                              <td className={`p-2 text-center font-mono ${s.profit_factor>=1.5?"text-emerald-400":"text-amber-400"}`}>{s.profit_factor}</td>
                            </tr>
                          ))}</tbody>
                        </table>
                      </div>
                      {setupStats.by_setup.length > 0 && (
                        <ResponsiveContainer width="100%" height={200}>
                          <BarChart data={setupStats.by_setup.slice(0,10)}>
                            <XAxis dataKey="setup" tick={{fontSize:9, fill: dark?"#a1a1aa":"#6b7280"}} />
                            <YAxis tick={{fontSize:10, fill: dark?"#a1a1aa":"#6b7280"}} />
                            <Tooltip contentStyle={{background: dark?"#18181b":"#fff", border: dark?"1px solid #3f3f46":"1px solid #e5e7eb", fontSize:11}} />
                            <Bar dataKey="total_pnl">{setupStats.by_setup.slice(0,10).map((s:any,i:number)=><Cell key={i} fill={s.total_pnl>=0?"#34d399":"#f87171"} />)}</Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      )}
                    </>
                  )}
                </div>
              )}

              {/* Time Analysis */}
              {analyticsSubTab==="time" && (
                <div className="space-y-3">
                  {!timeAnalysis && <button onClick={loadTimeAnalysis} className={btn} disabled={timeAnalysisLoading}>{timeAnalysisLoading?"Loading...":"Load Time Analysis"}</button>}
                  {timeAnalysis && (
                    <div className="grid md:grid-cols-2 gap-4">
                      {timeAnalysis.best_hour && (
                        <div className={`border rounded-lg p-3 ${cardBg}`}>
                          <div className={`text-[10px] ${dimText2}`}>Best Hour: <span className="text-emerald-400 font-bold">{timeAnalysis.best_hour.hour}:00</span> (${fmt(timeAnalysis.best_hour.pnl)} P&L, {timeAnalysis.best_hour.win_rate}% win)</div>
                        </div>
                      )}
                      {timeAnalysis.best_day && (
                        <div className={`border rounded-lg p-3 ${cardBg}`}>
                          <div className={`text-[10px] ${dimText2}`}>Best Day: <span className="text-emerald-400 font-bold">{timeAnalysis.best_day.day}</span> (${fmt(timeAnalysis.best_day.pnl)} P&L, {timeAnalysis.best_day.win_rate}% win)</div>
                        </div>
                      )}
                      {timeAnalysis.daily?.length > 0 && (
                        <div className={`border rounded-lg p-4 ${cardBg}`}>
                          <div className={`text-xs uppercase tracking-wider mb-2 ${dimText2}`}>P&L by Day of Week</div>
                          <ResponsiveContainer width="100%" height={150}>
                            <BarChart data={timeAnalysis.daily}><XAxis dataKey="day" tick={{fontSize:10, fill: dark?"#a1a1aa":"#6b7280"}} /><YAxis tick={{fontSize:10, fill: dark?"#a1a1aa":"#6b7280"}} /><Tooltip /><Bar dataKey="pnl">{timeAnalysis.daily.map((d:any,i:number)=><Cell key={i} fill={d.pnl>=0?"#34d399":"#f87171"} />)}</Bar></BarChart>
                          </ResponsiveContainer>
                        </div>
                      )}
                      {timeAnalysis.monthly?.length > 0 && (
                        <div className={`border rounded-lg p-4 ${cardBg}`}>
                          <div className={`text-xs uppercase tracking-wider mb-2 ${dimText2}`}>Monthly P&L</div>
                          <ResponsiveContainer width="100%" height={150}>
                            <BarChart data={timeAnalysis.monthly}><XAxis dataKey="month" tick={{fontSize:9, fill: dark?"#a1a1aa":"#6b7280"}} /><YAxis tick={{fontSize:10, fill: dark?"#a1a1aa":"#6b7280"}} /><Tooltip /><Bar dataKey="pnl">{timeAnalysis.monthly.map((m:any,i:number)=><Cell key={i} fill={m.pnl>=0?"#34d399":"#f87171"} />)}</Bar></BarChart>
                          </ResponsiveContainer>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Drawdown */}
              {analyticsSubTab==="drawdown" && (
                <div className="space-y-3">
                  {!drawdownData && <button onClick={loadDrawdown} className={btn} disabled={drawdownLoading}>{drawdownLoading?"Loading...":"Load Drawdown"}</button>}
                  {drawdownData && (
                    <>
                      <div className="grid grid-cols-3 gap-3">
                        <div className={`border rounded-lg p-3 text-center ${cardBg}`}>
                          <div className={`text-[10px] ${dimText}`}>Max Drawdown</div>
                          <div className="text-lg font-bold text-red-400">{drawdownData.max_drawdown_pct}%</div>
                        </div>
                        <div className={`border rounded-lg p-3 text-center ${cardBg}`}>
                          <div className={`text-[10px] ${dimText}`}>Current DD</div>
                          <div className={`text-lg font-bold ${drawdownData.current_drawdown_pct<-5?"text-red-400":"text-emerald-400"}`}>{drawdownData.current_drawdown_pct}%</div>
                        </div>
                        <div className={`border rounded-lg p-3 text-center ${cardBg}`}>
                          <div className={`text-[10px] ${dimText}`}>Peak Equity</div>
                          <div className={`text-lg font-bold ${headText}`}>${fmt(drawdownData.peak_equity)}</div>
                        </div>
                      </div>
                      {drawdownData.curve?.length > 0 && (
                        <div className={`border rounded-lg p-4 ${cardBg}`}>
                          <ResponsiveContainer width="100%" height={250}>
                            <AreaChart data={drawdownData.curve}>
                              <XAxis dataKey="date" tick={{fontSize:9, fill: dark?"#a1a1aa":"#6b7280"}} />
                              <YAxis tick={{fontSize:10, fill: dark?"#a1a1aa":"#6b7280"}} />
                              <Tooltip contentStyle={{background: dark?"#18181b":"#fff", border: dark?"1px solid #3f3f46":"1px solid #e5e7eb", fontSize:11}} />
                              <Area type="monotone" dataKey="drawdown_pct" stroke="#f87171" fill="#f8717130" />
                            </AreaChart>
                          </ResponsiveContainer>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}

              {/* Ratios */}
              {analyticsSubTab==="ratios" && (
                <div className="space-y-3">
                  {!ratiosData && <button onClick={loadRatios} className={btn} disabled={ratiosLoading}>{ratiosLoading?"Loading...":"Calculate Ratios"}</button>}
                  {ratiosData && !ratiosData.message && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {[
                        {l:"Sharpe Ratio",v:ratiosData.sharpe,good:ratiosData.sharpe>1},
                        {l:"Sortino Ratio",v:ratiosData.sortino,good:ratiosData.sortino>1.5},
                        {l:"Calmar Ratio",v:ratiosData.calmar,good:ratiosData.calmar>1},
                        {l:"Profit Factor",v:ratiosData.profit_factor,good:ratiosData.profit_factor>1.5},
                        {l:"Win Rate",v:`${ratiosData.win_rate}%`,good:ratiosData.win_rate>50},
                        {l:"Expectancy",v:`$${ratiosData.expectancy}`,good:ratiosData.expectancy>0},
                        {l:"Avg Win",v:`$${ratiosData.avg_win}`,good:true},
                        {l:"Avg Loss",v:`$${ratiosData.avg_loss}`,good:false},
                      ].map(r=>(
                        <div key={r.l} className={`border rounded-lg p-3 text-center ${cardBg}`}>
                          <div className={`text-[10px] ${dimText}`}>{r.l}</div>
                          <div className={`text-lg font-bold font-mono ${r.good?"text-emerald-400":"text-red-400"}`}>{r.v}</div>
                        </div>
                      ))}
                    </div>
                  )}
                  {ratiosData?.message && <div className={`text-xs ${dimText3}`}>{ratiosData.message}</div>}
                </div>
              )}

              {/* Volume Profile */}
              {analyticsSubTab==="volume" && (
                <div className="space-y-3">
                  <div className="flex gap-2">
                    <input value={volProfileTicker} onChange={e=>setVolProfileTicker(e.target.value)} placeholder="Ticker" className={input} onKeyDown={e=>e.key==="Enter"&&loadVolumeProfile()} />
                    <button onClick={()=>loadVolumeProfile()} className={btn} disabled={volProfileLoading}>{volProfileLoading?"Loading...":"Load"}</button>
                  </div>
                  {volProfile && volProfile.profile?.length > 0 && (
                    <div className={`border rounded-lg p-4 ${cardBg}`}>
                      <div className="flex gap-3 text-[10px] mb-3">
                        {volProfile.poc && <span className={dimText}>POC: <span className="text-amber-400 font-bold">${volProfile.poc.price}</span></span>}
                        {volProfile.value_area_high && <span className={dimText}>VAH: <span className="text-emerald-400">${volProfile.value_area_high}</span></span>}
                        {volProfile.value_area_low && <span className={dimText}>VAL: <span className="text-red-400">${volProfile.value_area_low}</span></span>}
                        <span className={dimText}>Price: <span className={headText}>${volProfile.current_price}</span></span>
                      </div>
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={volProfile.profile} layout="vertical">
                          <XAxis type="number" tick={{fontSize:10, fill: dark?"#a1a1aa":"#6b7280"}} />
                          <YAxis dataKey="price" type="category" tick={{fontSize:9, fill: dark?"#a1a1aa":"#6b7280"}} width={60} />
                          <Tooltip contentStyle={{background: dark?"#18181b":"#fff", border: dark?"1px solid #3f3f46":"1px solid #e5e7eb", fontSize:11}} />
                          <Bar dataKey="volume">
                            {volProfile.profile.map((p:any,i:number)=><Cell key={i} fill={p.price===volProfile.poc?.price?"#fbbf24":p.price>=volProfile.value_area_low&&p.price<=volProfile.value_area_high?"#60a5fa":"#3f3f46"} />)}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── OPTIONS CALCULATOR ────────────────────────────── */}
        {tab==="optcalc" && (
          <div className="space-y-4 max-w-4xl">
            <div className={`text-xs uppercase tracking-wider ${dimText2}`}>Options P&L Calculator</div>
            <div className="flex gap-2 flex-wrap items-end">
              <div><div className={`text-[10px] mb-1 ${dimText2}`}>Type</div><select value={optCalcType} onChange={e=>setOptCalcType(e.target.value as any)} className={input}><option value="call">CALL</option><option value="put">PUT</option></select></div>
              <div><div className={`text-[10px] mb-1 ${dimText2}`}>Strike</div><input value={optCalcStrike} onChange={e=>setOptCalcStrike(e.target.value)} placeholder="150.00" className={`w-24 ${input}`}/></div>
              <div><div className={`text-[10px] mb-1 ${dimText2}`}>Premium</div><input value={optCalcPremium} onChange={e=>setOptCalcPremium(e.target.value)} placeholder="5.00" className={`w-20 ${input}`}/></div>
              <div><div className={`text-[10px] mb-1 ${dimText2}`}>Qty</div><input value={optCalcQty} onChange={e=>setOptCalcQty(e.target.value)} placeholder="1" className={`w-14 ${input}`}/></div>
              <div><div className={`text-[10px] mb-1 ${dimText2}`}>Spot (opt)</div><input value={optCalcSpot} onChange={e=>setOptCalcSpot(e.target.value)} placeholder="155.00" className={`w-24 ${input}`}/></div>
              <button onClick={calcOptionsPnl} className={btn}>CALCULATE</button>
            </div>
            {optCalcResult && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className={`border rounded-lg p-3 ${cardBg}`}><div className={`text-[10px] ${dimText2}`}>Breakeven</div><div className={`text-lg font-bold font-mono ${headText}`}>${optCalcResult.breakeven.toFixed(2)}</div></div>
                  <div className={`border rounded-lg p-3 ${cardBg}`}><div className={`text-[10px] ${dimText2}`}>Max Loss</div><div className="text-lg font-bold font-mono text-red-400">${Math.abs(optCalcResult.maxLoss).toFixed(2)}</div></div>
                  <div className={`border rounded-lg p-3 ${cardBg}`}><div className={`text-[10px] ${dimText2}`}>Max Profit</div><div className="text-lg font-bold font-mono text-emerald-400">{optCalcResult.maxProfit===Infinity?"Unlimited":`$${optCalcResult.maxProfit.toFixed(2)}`}</div></div>
                  <div className={`border rounded-lg p-3 ${cardBg}`}><div className={`text-[10px] ${dimText2}`}>Cost Basis</div><div className={`text-lg font-bold font-mono ${headText}`}>${optCalcResult.costBasis.toFixed(2)}</div></div>
                </div>
                {optCalcResult.currentPnl != null && (
                  <div className={`border rounded-lg p-3 ${cardBg}`}>
                    <span className={`text-[10px] ${dimText2}`}>Current P&L at ${optCalcSpot}: </span>
                    <span className={`text-lg font-bold font-mono ${optCalcResult.currentPnl>=0?"text-emerald-400":"text-red-400"}`}>{optCalcResult.currentPnl>=0?"+":""}${optCalcResult.currentPnl.toFixed(2)}</span>
                  </div>
                )}
                <div className={`border rounded-lg p-1 ${cardBg}`}>
                  <canvas ref={el=>{
                    if(!el||!optCalcResult?.points?.length) return;
                    const ctx=el.getContext("2d"); if(!ctx) return;
                    const pts=optCalcResult.points; const W=el.parentElement?.clientWidth||700; const H=300;
                    el.width=W; el.height=H;
                    const pad={l:60,r:20,t:20,b:30};
                    const cW=W-pad.l-pad.r; const cH=H-pad.t-pad.b;
                    const minP=Math.min(...pts.map((p:any)=>p.price)); const maxP=Math.max(...pts.map((p:any)=>p.price));
                    const minPnl=Math.min(...pts.map((p:any)=>p.pnl)); const maxPnl=Math.max(...pts.map((p:any)=>p.pnl));
                    const pnlRange=maxPnl-minPnl||1;
                    const toX=(p:number)=>pad.l+((p-minP)/(maxP-minP))*cW;
                    const toY=(pnl:number)=>pad.t+cH-((pnl-minPnl)/pnlRange)*cH;
                    ctx.fillStyle=dark?"#09090b":"#f9fafb"; ctx.fillRect(0,0,W,H);
                    // Zero line
                    const zeroY=toY(0);
                    ctx.strokeStyle=dark?"#3f3f46":"#d1d5db"; ctx.lineWidth=1; ctx.setLineDash([4,4]);
                    ctx.beginPath(); ctx.moveTo(pad.l,zeroY); ctx.lineTo(W-pad.r,zeroY); ctx.stroke(); ctx.setLineDash([]);
                    // Breakeven line
                    const beX=toX(optCalcResult.breakeven);
                    ctx.strokeStyle="#f59e0b80"; ctx.lineWidth=1; ctx.setLineDash([4,4]);
                    ctx.beginPath(); ctx.moveTo(beX,pad.t); ctx.lineTo(beX,H-pad.b); ctx.stroke(); ctx.setLineDash([]);
                    ctx.fillStyle="#f59e0b"; ctx.font="10px monospace"; ctx.textAlign="center";
                    ctx.fillText(`BE $${optCalcResult.breakeven.toFixed(1)}`,beX,pad.t-5);
                    // Strike line
                    const stX=toX(optCalcResult.strike);
                    ctx.strokeStyle=dark?"#52525b":"#9ca3af"; ctx.lineWidth=1; ctx.setLineDash([2,2]);
                    ctx.beginPath(); ctx.moveTo(stX,pad.t); ctx.lineTo(stX,H-pad.b); ctx.stroke(); ctx.setLineDash([]);
                    // Fill profit/loss areas
                    ctx.beginPath(); ctx.moveTo(toX(pts[0].price),zeroY);
                    pts.forEach((p:any)=>ctx.lineTo(toX(p.price),toY(p.pnl)));
                    ctx.lineTo(toX(pts[pts.length-1].price),zeroY); ctx.closePath();
                    const grad=ctx.createLinearGradient(0,pad.t,0,H-pad.b);
                    grad.addColorStop(0,"rgba(52,211,153,0.15)"); grad.addColorStop(0.5,"rgba(52,211,153,0.05)");
                    grad.addColorStop(0.5,"rgba(248,113,113,0.05)"); grad.addColorStop(1,"rgba(248,113,113,0.15)");
                    ctx.fillStyle=grad; ctx.fill();
                    // P&L line
                    ctx.strokeStyle="#f59e0b"; ctx.lineWidth=2.5; ctx.beginPath();
                    pts.forEach((p:any,i:number)=>{i===0?ctx.moveTo(toX(p.price),toY(p.pnl)):ctx.lineTo(toX(p.price),toY(p.pnl));});
                    ctx.stroke();
                    // Spot marker
                    if(optCalcResult.currentPnl!=null){const sx=toX(parseFloat(optCalcSpot));const sy=toY(optCalcResult.currentPnl);ctx.fillStyle=optCalcResult.currentPnl>=0?"#34d399":"#f87171";ctx.beginPath();ctx.arc(sx,sy,5,0,Math.PI*2);ctx.fill();ctx.strokeStyle=dark?"#09090b":"#fff";ctx.lineWidth=2;ctx.stroke();}
                    // Axes labels
                    ctx.fillStyle=dark?"#52525b":"#9ca3af"; ctx.font="9px monospace"; ctx.textAlign="right";
                    [minPnl,0,maxPnl].forEach(v=>{const y=toY(v);ctx.fillText(`$${v.toFixed(0)}`,pad.l-5,y+3);});
                    ctx.textAlign="center";
                    for(let i=0;i<pts.length;i+=Math.floor(pts.length/6)){ctx.fillText(`$${pts[i].price.toFixed(0)}`,toX(pts[i].price),H-pad.b+15);}
                  }} className="w-full" style={{height:300}} />
                </div>
                <div className={`text-[10px] text-center ${dimText2}`}>
                  {optCalcResult.qty}x {optCalcResult.type.toUpperCase()} @ ${optCalcResult.strike} · Premium ${optCalcResult.premium} · Breakeven ${optCalcResult.breakeven.toFixed(2)}
                </div>
              </div>
            )}
            {!optCalcResult && <div className={`text-xs text-center py-16 ${dimText3}`}>Enter option details and click CALCULATE</div>}
          </div>
        )}

        {/* ── EARNINGS (Enhanced Phase 9) ───────────────────── */}
        {tab==="earnings" && (
          <div className="space-y-4">
            {/* Sub-tabs */}
            <div className="flex items-center gap-2 flex-wrap">
              <div className={`text-xs uppercase tracking-wider ${dimText2} mr-2`}>Earnings</div>
              {(["upcoming", "history", "implied"] as const).map(st => (
                <button key={st} onClick={() => setEarnSubTab(st)} className={`text-[10px] px-3 py-1 rounded-lg border ${earnSubTab === st ? "bg-amber-600/30 border-amber-500 text-amber-300" : `${dark ? "border-zinc-700 text-zinc-400" : "border-gray-300 text-gray-500"}`}`}>{st === "upcoming" ? "📅 Upcoming" : st === "history" ? "📊 Surprise History" : "📈 Implied Move"}</button>
              ))}
              <div className="flex-1" />
              {/* Quick-nav to related tabs */}
              {["risk", "flow", "earnings-intel", "filings", "econ", "credit", "transcripts"].map(t => (
                <button key={t} onClick={() => setTab(t)} style={{ padding: "4px 8px", fontSize: 10, cursor: "pointer", border: "none", borderRadius: 4, background: "transparent", color: dark ? "#888" : "#666", fontFamily: "inherit" }}>{t === "earnings-intel" ? "Intel" : t === "credit" ? "Macro" : t === "transcripts" ? "Calls" : t.charAt(0).toUpperCase() + t.slice(1)}</button>
              ))}
            </div>

            {/* Upcoming Earnings */}
            {earnSubTab === "upcoming" && (
              <div className="space-y-2">
                <div className="flex items-center gap-2"><button onClick={loadEarnings} className={btnOutline}>↻ Refresh</button></div>
                {earnings.map((e, i) => (
                  <div key={i} className={`flex items-center gap-3 px-3 py-2 rounded-lg border text-xs ${cardBg}`}>
                    <span className={`w-24 font-mono ${dimText}`}>{e.date}</span>
                    <span className="text-amber-400 font-bold w-16 cursor-pointer" onClick={() => goToChart(e.symbol)}>{e.symbol}</span>
                    <span className={`w-20 truncate ${dimText}`}>{e.hour === "bmo" ? "☀️ Before Open" : e.hour === "amc" ? "🌙 After Close" : ""}</span>
                    <span className={dimText}>EPS Est: <span className="font-mono">{e.epsEstimate || "—"}</span></span>
                    <span className={dimText}>Rev Est: <span className="font-mono">{e.revenueEstimate ? `$${(e.revenueEstimate / 1e9).toFixed(1)}B` : "—"}</span></span>
                    <button onClick={() => { setEarnSubTab("history"); loadEarningsHistory(e.symbol); }} className="text-violet-400 text-[10px] hover:underline">📊</button>
                    <button onClick={() => { setEarnSubTab("implied"); loadEarningsImplied(e.symbol); setEarningsHistTicker(e.symbol); }} className="text-blue-400 text-[10px] hover:underline">📈</button>
                    <button onClick={() => { setTab("ai"); setAiTicker(e.symbol); setTimeout(() => runAI(e.symbol), 100); }} className="text-violet-400 text-[10px]">🧠</button>
                  </div>
                ))}
                {!earnings.length && <div className={`text-xs text-center py-8 ${dimText3}`}>Click Refresh to load upcoming earnings</div>}
              </div>
            )}

            {/* Earnings Surprise History */}
            {earnSubTab === "history" && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <input value={earningsHistTicker} onChange={e => setEarningsHistTicker(e.target.value.toUpperCase())} placeholder="AAPL" className={`${input} w-24`} onKeyDown={e => e.key === "Enter" && loadEarningsHistory()} />
                  <button onClick={() => loadEarningsHistory()} disabled={earningsHistLoading} className={`${btn} ${earningsHistLoading ? "opacity-50" : ""}`}>{earningsHistLoading ? "Loading..." : "LOAD"}</button>
                </div>
                {earningsHistory && (
                  <div className="space-y-3">
                    <div className={`text-xs font-bold ${headText}`}>{earningsHistory.ticker} — Earnings Surprise History</div>
                    {earningsHistory.quarters?.length > 0 && (
                      <div style={{ width: "100%", height: 200 }}>
                        <ResponsiveContainer>
                          <BarChart data={earningsHistory.quarters} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
                            <XAxis dataKey="quarter" tick={{ fontSize: 9, fill: dark ? "#888" : "#666" }} />
                            <YAxis tick={{ fontSize: 9, fill: dark ? "#888" : "#666" }} />
                            <Tooltip contentStyle={{ background: dark ? "#161b22" : "#fff", border: "1px solid #30363d", fontSize: 11 }} />
                            <Bar dataKey="actual" name="Actual" fill="#22c55e" />
                            <Bar dataKey="estimate" name="Estimate" fill="#6366f1" />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    )}
                    {/* Surprise percentage chart */}
                    {earningsHistory.quarters?.some((q: any) => q.surprise_pct !== null) && (
                      <div style={{ width: "100%", height: 150 }}>
                        <ResponsiveContainer>
                          <BarChart data={earningsHistory.quarters.filter((q: any) => q.surprise_pct !== null)} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
                            <XAxis dataKey="quarter" tick={{ fontSize: 9, fill: dark ? "#888" : "#666" }} />
                            <YAxis tick={{ fontSize: 9, fill: dark ? "#888" : "#666" }} tickFormatter={(v: number) => `${v}%`} />
                            <Tooltip contentStyle={{ background: dark ? "#161b22" : "#fff", border: "1px solid #30363d", fontSize: 11 }} formatter={(v: number) => [`${v}%`, "Surprise"]} />
                            <Bar dataKey="surprise_pct" name="Surprise %">
                              {earningsHistory.quarters.filter((q: any) => q.surprise_pct !== null).map((q: any, idx: number) => (
                                <Cell key={idx} fill={q.beat ? "#22c55e" : "#ef4444"} />
                              ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    )}
                    {/* Table */}
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs border-collapse">
                        <thead><tr className={`text-left border-b ${dark ? "text-zinc-600 border-zinc-800" : "text-gray-500 border-gray-200"}`}>
                          {["Quarter", "Actual", "Estimate", "Surprise", "Beat?"].map(h => <th key={h} className="py-1.5 px-2">{h}</th>)}
                        </tr></thead>
                        <tbody>
                          {earningsHistory.quarters?.map((q: any, i: number) => (
                            <tr key={i} className={`border-b ${dark ? "border-zinc-900/30" : "border-gray-100"}`}>
                              <td className={`py-1 px-2 font-mono ${dimText}`}>{q.quarter}</td>
                              <td className="py-1 px-2 font-mono">{q.actual?.toFixed(2) ?? "—"}</td>
                              <td className="py-1 px-2 font-mono">{q.estimate?.toFixed(2) ?? "—"}</td>
                              <td className={`py-1 px-2 font-mono font-bold ${q.surprise_pct > 0 ? "text-emerald-400" : q.surprise_pct < 0 ? "text-red-400" : dimText}`}>{q.surprise_pct != null ? `${q.surprise_pct > 0 ? "+" : ""}${q.surprise_pct}%` : "—"}</td>
                              <td className="py-1 px-2">{q.beat === true ? "✅" : q.beat === false ? "❌" : "—"}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
                {!earningsHistory && !earningsHistLoading && <div className={`text-xs text-center py-8 ${dimText3}`}>Enter a ticker and click LOAD</div>}
              </div>
            )}

            {/* Implied Move from ATM Straddle */}
            {earnSubTab === "implied" && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <input value={earningsHistTicker} onChange={e => setEarningsHistTicker(e.target.value.toUpperCase())} placeholder="AAPL" className={`${input} w-24`} onKeyDown={e => e.key === "Enter" && loadEarningsImplied(earningsHistTicker)} />
                  <button onClick={() => loadEarningsImplied(earningsHistTicker)} className={btn}>CALCULATE</button>
                </div>
                {earningsImplied && (
                  <div className={`border rounded-lg p-4 ${cardBg}`}>
                    <div className={`text-xs font-bold mb-3 ${headText}`}>{earningsImplied.ticker} — Implied Earnings Move</div>
                    {earningsImplied.error && !earningsImplied.implied_move_pct ? (
                      <div className="text-red-400 text-xs">{earningsImplied.error}</div>
                    ) : (
                      <div className="space-y-3">
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                          <div className={`border rounded-lg p-2.5 ${cardBg}`}>
                            <div className={`text-[10px] ${dimText2}`}>Implied Move</div>
                            <div className="text-2xl font-bold font-mono text-amber-400">±{earningsImplied.implied_move_pct}%</div>
                          </div>
                          <div className={`border rounded-lg p-2.5 ${cardBg}`}>
                            <div className={`text-[10px] ${dimText2}`}>Straddle Price</div>
                            <div className={`text-lg font-bold font-mono ${headText}`}>${earningsImplied.straddle_price}</div>
                          </div>
                          <div className={`border rounded-lg p-2.5 ${cardBg}`}>
                            <div className={`text-[10px] ${dimText2}`}>ATM Strike</div>
                            <div className={`text-lg font-bold font-mono ${headText}`}>${earningsImplied.atm_strike}</div>
                          </div>
                        </div>
                        <div className={`text-[10px] ${dimText}`}>
                          Current Price: ${earningsImplied.price} · Expiration: {earningsImplied.expiration}
                        </div>
                        {/* Visual range bar */}
                        <div className="relative h-8 mt-2">
                          <div className={`absolute inset-0 rounded-lg ${dark ? "bg-zinc-800" : "bg-gray-200"}`} />
                          <div className="absolute top-0 bottom-0 left-1/4 right-1/4 bg-red-500/20 rounded-lg" />
                          <div className="absolute top-0 bottom-0 left-[35%] right-[35%] bg-amber-500/20 rounded-lg" />
                          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[10px] font-bold text-amber-400">${earningsImplied.price}</div>
                          <div className={`absolute top-1/2 left-[20%] -translate-x-1/2 -translate-y-1/2 text-[9px] ${dimText}`}>${(earningsImplied.price * (1 - earningsImplied.implied_move_pct / 100)).toFixed(0)}</div>
                          <div className={`absolute top-1/2 right-[20%] translate-x-1/2 -translate-y-1/2 text-[9px] ${dimText}`}>${(earningsImplied.price * (1 + earningsImplied.implied_move_pct / 100)).toFixed(0)}</div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
                {!earningsImplied && <div className={`text-xs text-center py-8 ${dimText3}`}>Enter a ticker to calculate implied earnings move from ATM straddle</div>}
              </div>
            )}
          </div>
        )}

        {/* ── CALENDAR (Enhanced Phase 9) ───────────────────── */}
        {tab==="calendar" && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 flex-wrap">
              <div className={`text-xs uppercase tracking-wider ${dimText2}`}>Economic Calendar</div>
              <button onClick={()=>fetch(`${BASE}/calendar/refresh`).then(()=>loadCalendar())} className={btnOutline}>↻ Refresh</button>
            </div>
            {/* Countdown to next event */}
            {calendar.length > 0 && (() => {
              const today = new Date().toISOString().slice(0, 10);
              const nextEvent = calendar.find(ev => ev.date >= today);
              if (!nextEvent) return null;
              const diff = Math.ceil((new Date(nextEvent.date).getTime() - new Date(today).getTime()) / 86400000);
              return (
                <div className={`border rounded-lg p-3 flex items-center gap-3 ${dark ? "border-amber-800/40 bg-amber-950/20" : "border-amber-300 bg-amber-50"}`}>
                  <span className="text-amber-400 text-lg">⏱</span>
                  <div>
                    <div className={`text-[10px] ${dimText2}`}>NEXT EVENT{diff === 0 ? " — TODAY" : ` IN ${diff} DAY${diff > 1 ? "S" : ""}`}</div>
                    <div className={`text-xs font-bold ${headText}`}>{nextEvent.event} <span className={dimText}>({nextEvent.date})</span></div>
                  </div>
                </div>
              );
            })()}
            {/* Events List with impact color coding */}
            <div className="space-y-1">
              {calendar.map((ev, i) => {
                const today = new Date().toISOString().slice(0, 10);
                const isToday = ev.date === today;
                const isPast = ev.date < today;
                const impactColor = ev.category === "interest rates" || ev.category === "inflation" ? "border-l-red-500" : ev.category === "employment" ? "border-l-amber-500" : ev.category === "gdp" ? "border-l-blue-500" : "border-l-zinc-500";
                return (
                  <div key={i} className={`flex items-center gap-3 px-3 py-2 rounded-lg border border-l-4 text-xs ${impactColor} ${isToday ? "border-red-600/50 bg-red-950/20" : isPast ? (dark ? "opacity-50" : "opacity-60") : cardBg}`}>
                    <span className={`w-24 font-mono ${dimText}`}>{ev.date}</span>
                    <span className={`border rounded-lg px-1 text-[10px] shrink-0 ${catColor(ev.category)}`}>{ev.category}</span>
                    <span className={`flex-1 ${bodyText}`}>{ev.event}</span>
                    {isToday && <span className="text-red-400 font-bold animate-pulse text-[10px]">TODAY</span>}
                    <button onClick={() => { setCalImpactType(ev.category?.replace(/\s+/g, "_").toLowerCase() || "fomc"); loadCalendarImpact(ev.category?.replace(/\s+/g, "_").toLowerCase()); }} className="text-violet-400 text-[10px] hover:underline">📊</button>
                  </div>
                );
              })}
            </div>
            {!calendar.length && <div className={`text-xs text-center py-8 ${dimText3}`}>Click Refresh</div>}
            {/* Historical Impact Section */}
            <div className={`border rounded-lg p-3 mt-4 ${cardBg}`}>
              <div className={`text-xs uppercase tracking-wider ${dimText2} mb-2`}>📊 Historical SPY Impact</div>
              <div className="flex items-center gap-2 mb-3 flex-wrap">
                {["fomc", "cpi", "nfp", "gdp", "ppi", "ism", "retail", "pce"].map(t => (
                  <button key={t} onClick={() => { setCalImpactType(t); loadCalendarImpact(t); }} className={`text-[10px] px-2 py-1 rounded-lg border ${calImpactType === t ? "bg-violet-600/30 border-violet-500 text-violet-300" : `${dark ? "border-zinc-700 text-zinc-400 hover:border-zinc-500" : "border-gray-300 text-gray-500 hover:border-gray-400"}`}`}>{t.toUpperCase()}</button>
                ))}
              </div>
              {calImpactLoading && <div className={`text-xs animate-pulse ${dimText}`}>Loading impact data...</div>}
              {calImpact && !calImpactLoading && (
                <div className="space-y-2">
                  <div className="flex items-center gap-4 text-xs">
                    <span className={dimText}>Event: <span className={`font-bold ${headText}`}>{calImpact.event}</span></span>
                    <span className={dimText}>Avg. Abs Move: <span className="text-amber-400 font-bold">{calImpact.avg_abs_move}%</span></span>
                    <span className={dimText}>Samples: {calImpact.count}</span>
                  </div>
                  {calImpact.reactions?.length > 0 && (
                    <div style={{ width: "100%", height: 180 }}>
                      <ResponsiveContainer>
                        <BarChart data={calImpact.reactions.slice(-12)} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
                          <XAxis dataKey="date" tick={{ fontSize: 9, fill: dark ? "#888" : "#666" }} />
                          <YAxis tick={{ fontSize: 9, fill: dark ? "#888" : "#666" }} tickFormatter={(v: number) => `${v}%`} />
                          <Tooltip contentStyle={{ background: dark ? "#161b22" : "#fff", border: "1px solid #30363d", fontSize: 11 }} formatter={(v: number) => [`${v}%`, "SPY Move"]} />
                          <Bar dataKey="same_day_pct" name="Same Day">
                            {calImpact.reactions.slice(-12).map((r: any, idx: number) => (
                              <Cell key={idx} fill={r.same_day_pct >= 0 ? "#22c55e" : "#ef4444"} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── MACRO ─────────────────────────────────────────── */}
        {tab==="macro" && (
          <div className="space-y-4">
            <div className="flex items-center gap-3"><div className={`text-xs uppercase tracking-wider ${dimText2}`}>Macro Dashboard</div><button onClick={loadMacro} className={btnOutline}>↻ Refresh</button></div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">{macro.map(m=><MacroCard key={m.symbol} item={m} onClick={()=>goToChart(m.symbol)} dark={dark}/>)}</div>
          </div>
        )}

        {/* ── PHOTONICS COMMAND CENTER ──────────────────────── */}
        {tab==="photonics" && (
          <div><PhotonicsCenter dark={dark} /></div>
        )}

        {/* ── CRYPTO ─────────────────────────────────────────── */}
        {tab==="crypto" && <CryptoPanel />}

        {/* ── CORRELATION MATRIX ──────────────────────────────── */}
        {tab==="correlation" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <h2 className={`text-sm font-bold uppercase tracking-widest ${dimText2}`}>🔗 Correlation Matrix</h2>
              <div className="flex gap-2 items-center">
                <input value={corrTickers} onChange={e=>setCorrTickers(e.target.value)} className={`w-64 ${input}`} placeholder="SPY,QQQ,AAPL,MSFT..." />
                <button onClick={()=>loadCorrelation()} className={btn} disabled={corrLoading}>{corrLoading?"Loading...":"Generate"}</button>
              </div>
            </div>
            {corrData && corrData.tickers?.length > 0 && (
              <div className={`border rounded-lg p-4 overflow-x-auto ${cardBg}`}>
                <table className="w-full text-xs">
                  <thead><tr><th className={`text-left p-1 ${dimText}`}></th>{corrData.tickers.map((t:string)=><th key={t} className="p-1 text-amber-400 font-mono">{t}</th>)}</tr></thead>
                  <tbody>
                    {corrData.tickers.map((t1:string, i:number)=>(
                      <tr key={t1}>
                        <td className="p-1 text-amber-400 font-mono font-bold">{t1}</td>
                        {corrData.matrix[i]?.map((v:number, j:number)=>{
                          const abs = Math.abs(v);
                          const bg = v >= 0.7 ? "bg-emerald-900/60" : v >= 0.3 ? "bg-emerald-900/30" : v <= -0.3 ? "bg-red-900/30" : v <= -0.7 ? "bg-red-900/60" : "";
                          return <td key={j} className={`p-1 text-center font-mono ${bg} ${i===j?"text-zinc-500":abs>=0.7?"font-bold":"text-zinc-300"}`}>{v.toFixed(2)}</td>;
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className={`mt-3 flex gap-4 text-[10px] ${dimText}`}>
                  <span><span className="inline-block w-3 h-3 bg-emerald-900/60 rounded mr-1"></span>Strong +</span>
                  <span><span className="inline-block w-3 h-3 bg-emerald-900/30 rounded mr-1"></span>Moderate +</span>
                  <span><span className="inline-block w-3 h-3 bg-red-900/30 rounded mr-1"></span>Moderate −</span>
                  <span><span className="inline-block w-3 h-3 bg-red-900/60 rounded mr-1"></span>Strong −</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── SECTOR ROTATION ─────────────────────────────────── */}
        {tab==="sectors" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <h2 className={`text-sm font-bold uppercase tracking-widest ${dimText2}`}>🔄 Sector Rotation</h2>
              <button onClick={loadSectorRotation} className={btn} disabled={sectorLoading}>{sectorLoading?"Loading...":"Load Sectors"}</button>
            </div>
            {sectorData && sectorData.sectors?.length > 0 && (
              <>
                <div className="flex gap-2 flex-wrap mb-2">
                  {sectorData.leaders?.length > 0 && <span className="text-[10px] px-2 py-1 rounded bg-emerald-950/50 text-emerald-400 border border-emerald-800">▲ Leaders: {sectorData.leaders.join(", ")}</span>}
                  {sectorData.laggards?.length > 0 && <span className="text-[10px] px-2 py-1 rounded bg-red-950/50 text-red-400 border border-red-800">▼ Laggards: {sectorData.laggards.join(", ")}</span>}
                </div>
                <div className={`border rounded-lg overflow-x-auto ${cardBg}`}>
                  <table className="w-full text-xs">
                    <thead><tr className={`border-b ${borderDim}`}>
                      <th className={`text-left p-2 ${dimText}`}>Sector</th>
                      <th className={`text-right p-2 ${dimText}`}>Price</th>
                      <th className={`text-right p-2 ${dimText}`}>1D</th>
                      <th className={`text-right p-2 ${dimText}`}>1W</th>
                      <th className={`text-right p-2 ${dimText}`}>1M</th>
                      <th className={`text-right p-2 ${dimText}`}>3M</th>
                      <th className={`text-right p-2 ${dimText}`}>Mom.</th>
                      <th className={`text-right p-2 ${dimText}`}>Rel.Str.</th>
                    </tr></thead>
                    <tbody>
                      {sectorData.sectors.map((s:any)=>(
                        <tr key={s.symbol} className={`border-b ${borderDim2} hover:${dark?"bg-zinc-800/50":"bg-gray-50"}`}>
                          <td className="p-2"><span className="text-amber-400 font-bold mr-2">{s.symbol}</span><span className={dimText}>{s.name}</span></td>
                          <td className={`p-2 text-right font-mono ${headText}`}>${s.price}</td>
                          <td className={`p-2 text-right font-mono ${clr(s["1d"])}`}>{s["1d"]>0?"+":""}{s["1d"]}%</td>
                          <td className={`p-2 text-right font-mono ${clr(s["1w"])}`}>{s["1w"]>0?"+":""}{s["1w"]}%</td>
                          <td className={`p-2 text-right font-mono ${clr(s["1m"])}`}>{s["1m"]>0?"+":""}{s["1m"]}%</td>
                          <td className={`p-2 text-right font-mono ${clr(s["3m"])}`}>{s["3m"]>0?"+":""}{s["3m"]}%</td>
                          <td className={`p-2 text-right font-mono font-bold ${clr(s.momentum)}`}>{s.momentum>0?"+":""}{s.momentum}</td>
                          <td className={`p-2 text-right font-mono ${clr(s.relative_strength)}`}>{s.relative_strength>0?"+":""}{s.relative_strength}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {sectorData.sectors?.length > 0 && (
                  <div className={`border rounded-lg p-4 ${cardBg}`}>
                    <div className={`text-xs uppercase tracking-wider mb-2 ${dimText2}`}>Momentum Chart</div>
                    <ResponsiveContainer width="100%" height={250}>
                      <BarChart data={sectorData.sectors.filter((s:any)=>s.symbol!=="SPY")}>
                        <XAxis dataKey="symbol" tick={{fontSize:10, fill: dark?"#a1a1aa":"#6b7280"}} />
                        <YAxis tick={{fontSize:10, fill: dark?"#a1a1aa":"#6b7280"}} />
                        <Tooltip contentStyle={{background: dark?"#18181b":"#fff", border: dark?"1px solid #3f3f46":"1px solid #e5e7eb", fontSize:11}} />
                        <Bar dataKey="momentum">
                          {sectorData.sectors.filter((s:any)=>s.symbol!=="SPY").map((s:any, i:number)=>(
                            <Cell key={i} fill={s.momentum>=0?"#34d399":"#f87171"} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* ── TRADE PLANS ─────────────────────────────────────── */}
        {tab==="plans" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <h2 className={`text-sm font-bold uppercase tracking-widest ${dimText2}`}>📋 Trade Plans</h2>
              <button onClick={()=>setShowPlanForm(!showPlanForm)} className={btn}>{showPlanForm?"Cancel":"+ New Plan"}</button>
            </div>
            {showPlanForm && (
              <div className={`border rounded-lg p-4 space-y-3 ${cardBg}`}>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  <input value={planForm.name} onChange={e=>setPlanForm({...planForm,name:e.target.value})} placeholder="Plan Name" className={input} />
                  <input value={planForm.ticker} onChange={e=>setPlanForm({...planForm,ticker:e.target.value})} placeholder="Ticker" className={input} />
                  <select value={planForm.direction} onChange={e=>setPlanForm({...planForm,direction:e.target.value})} className={input}>
                    <option value="long">Long</option><option value="short">Short</option>
                  </select>
                  <select value={planForm.timeframe} onChange={e=>setPlanForm({...planForm,timeframe:e.target.value})} className={input}>
                    <option value="scalp">Scalp</option><option value="day">Day Trade</option><option value="swing">Swing</option><option value="position">Position</option>
                  </select>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  <input value={planForm.entry_zone} onChange={e=>setPlanForm({...planForm,entry_zone:e.target.value})} placeholder="Entry Zone $" className={input} />
                  <input value={planForm.stop_loss} onChange={e=>setPlanForm({...planForm,stop_loss:e.target.value})} placeholder="Stop Loss $" className={input} />
                  <input value={planForm.target_1} onChange={e=>setPlanForm({...planForm,target_1:e.target.value})} placeholder="Target 1 $" className={input} />
                  <input value={planForm.target_2} onChange={e=>setPlanForm({...planForm,target_2:e.target.value})} placeholder="Target 2 $" className={input} />
                </div>
                <input value={planForm.setup_type} onChange={e=>setPlanForm({...planForm,setup_type:e.target.value})} placeholder="Setup Type (breakout, pullback, etc.)" className={`w-full ${input}`} />
                <textarea value={planForm.thesis} onChange={e=>setPlanForm({...planForm,thesis:e.target.value})} placeholder="Trade thesis..." className={`w-full h-20 ${input}`} />
                <button onClick={createTradePlan} className={btn}>Save Plan</button>
              </div>
            )}
            <div className="grid md:grid-cols-2 gap-3">
              {tradePlans.map((p:any)=>(
                <div key={p.id} className={`border rounded-lg p-4 ${cardBg}`}>
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <span className="text-amber-400 font-bold mr-2">{p.ticker}</span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded uppercase font-bold ${p.direction==="long"?"bg-emerald-950/50 text-emerald-400":"bg-red-950/50 text-red-400"}`}>{p.direction}</span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded ml-1 ${p.status==="active"?"bg-amber-950/50 text-amber-400":"bg-zinc-800 text-zinc-400"}`}>{p.status}</span>
                    </div>
                    <div className="flex gap-1">
                      {p.status==="planned" && <button onClick={()=>updatePlanStatus(p.id,"active")} className={`text-[10px] px-2 py-0.5 rounded bg-emerald-950/50 text-emerald-400 hover:bg-emerald-900/50`}>Activate</button>}
                      {p.status==="active" && <button onClick={()=>updatePlanStatus(p.id,"executed")} className={`text-[10px] px-2 py-0.5 rounded bg-blue-950/50 text-blue-400 hover:bg-blue-900/50`}>Executed</button>}
                      <button onClick={()=>deleteTradePlan(p.id)} className={`text-[10px] text-red-400 hover:text-red-300`}>✕</button>
                    </div>
                  </div>
                  <div className={`text-xs font-bold mb-1 ${headText}`}>{p.name}</div>
                  <div className="grid grid-cols-4 gap-1 text-[10px] font-mono mb-2">
                    <div><span className={dimText}>Entry:</span> <span className={headText}>${p.entry_zone}</span></div>
                    <div><span className={dimText}>Stop:</span> <span className="text-red-400">${p.stop_loss}</span></div>
                    <div><span className={dimText}>T1:</span> <span className="text-emerald-400">${p.target_1}</span></div>
                    <div><span className={dimText}>T2:</span> <span className="text-emerald-400">${p.target_2}</span></div>
                  </div>
                  {p.thesis && <div className={`text-[10px] ${bodyText} line-clamp-2`}>{p.thesis}</div>}
                  {p.setup_type && <span className={`text-[10px] px-1.5 py-0.5 rounded mt-1 inline-block ${dark?"bg-zinc-800 text-zinc-400":"bg-gray-100 text-gray-500"}`}>{p.setup_type}</span>}
                </div>
              ))}
            </div>
            {tradePlans.length === 0 && <div className={`text-center py-8 ${dimText3}`}>No trade plans yet. Create one to plan your trades.</div>}
          </div>
        )}

        {/* ── P&L CALENDAR ────────────────────────────────────── */}
        {tab==="pnlcal" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <h2 className={`text-sm font-bold uppercase tracking-widest ${dimText2}`}>📆 P&L Calendar</h2>
              <button onClick={loadPnlCalendar} className={btn} disabled={pnlCalLoading}>{pnlCalLoading?"Loading...":"Load P&L Data"}</button>
            </div>
            {pnlCalData && (
              <>
                <div className="grid grid-cols-2 md:grid-cols-6 gap-2">
                  <div className={`border rounded-lg p-3 text-center ${cardBg}`}>
                    <div className={`text-[10px] ${dimText}`}>Total P&L</div>
                    <div className={`text-lg font-bold font-mono ${clr(pnlCalData.total_pnl)}`}>${fmt(pnlCalData.total_pnl)}</div>
                  </div>
                  <div className={`border rounded-lg p-3 text-center ${cardBg}`}>
                    <div className={`text-[10px] ${dimText}`}>Win Days</div>
                    <div className="text-lg font-bold text-emerald-400">{pnlCalData.winning_days}</div>
                  </div>
                  <div className={`border rounded-lg p-3 text-center ${cardBg}`}>
                    <div className={`text-[10px] ${dimText}`}>Loss Days</div>
                    <div className="text-lg font-bold text-red-400">{pnlCalData.losing_days}</div>
                  </div>
                  <div className={`border rounded-lg p-3 text-center ${cardBg}`}>
                    <div className={`text-[10px] ${dimText}`}>Best Day</div>
                    <div className="text-lg font-bold text-emerald-400">${fmt(pnlCalData.best_day)}</div>
                  </div>
                  <div className={`border rounded-lg p-3 text-center ${cardBg}`}>
                    <div className={`text-[10px] ${dimText}`}>Worst Day</div>
                    <div className="text-lg font-bold text-red-400">${fmt(pnlCalData.worst_day)}</div>
                  </div>
                  <div className={`border rounded-lg p-3 text-center ${cardBg}`}>
                    <div className={`text-[10px] ${dimText}`}>Avg/Day</div>
                    <div className={`text-lg font-bold font-mono ${clr(pnlCalData.avg_daily)}`}>${fmt(pnlCalData.avg_daily)}</div>
                  </div>
                </div>
                {pnlCalData.calendar?.length > 0 && (
                  <div className={`border rounded-lg p-4 ${cardBg}`}>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={pnlCalData.calendar}>
                        <XAxis dataKey="date" tick={{fontSize:9, fill: dark?"#a1a1aa":"#6b7280"}} angle={-45} textAnchor="end" height={60} />
                        <YAxis tick={{fontSize:10, fill: dark?"#a1a1aa":"#6b7280"}} />
                        <Tooltip contentStyle={{background: dark?"#18181b":"#fff", border: dark?"1px solid #3f3f46":"1px solid #e5e7eb", fontSize:11}} formatter={(v:any)=>`$${Number(v).toFixed(2)}`} />
                        <Bar dataKey="pnl">
                          {pnlCalData.calendar.map((d:any, i:number)=>(
                            <Cell key={i} fill={d.pnl>=0?"#34d399":"#f87171"} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* ── WHEEL STRATEGY TRACKER ──────────────────────────── */}
        {tab==="wheel" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <h2 className={`text-sm font-bold uppercase tracking-widest ${dimText2}`}>🎡 Wheel Strategy Tracker</h2>
              <button onClick={()=>setShowWheelForm(!showWheelForm)} className={btn}>{showWheelForm?"Cancel":"+ New Position"}</button>
            </div>
            {showWheelForm && (
              <div className={`border rounded-lg p-4 ${cardBg}`}>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                  <input value={wheelForm.ticker} onChange={e=>setWheelForm({...wheelForm,ticker:e.target.value})} placeholder="Ticker" className={input} />
                  <select value={wheelForm.phase} onChange={e=>setWheelForm({...wheelForm,phase:e.target.value})} className={input}>
                    <option value="csp">Cash Secured Put</option><option value="assigned">Assigned (Hold)</option><option value="cc">Covered Call</option>
                  </select>
                  <input value={wheelForm.strike} onChange={e=>setWheelForm({...wheelForm,strike:e.target.value})} placeholder="Strike $" type="number" className={input} />
                  <input value={wheelForm.premium} onChange={e=>setWheelForm({...wheelForm,premium:e.target.value})} placeholder="Premium $" type="number" className={input} />
                  <input value={wheelForm.expiry} onChange={e=>setWheelForm({...wheelForm,expiry:e.target.value})} placeholder="Expiry" type="date" className={input} />
                </div>
                <button onClick={addWheelPosition} className={`mt-2 ${btn}`}>Add Position</button>
              </div>
            )}
            <div className="grid md:grid-cols-2 gap-3">
              {wheelPositions.map((p:any)=>(
                <div key={p.id} className={`border rounded-lg p-4 ${cardBg}`}>
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-amber-400 font-bold text-sm">{p.ticker}</span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded uppercase font-bold ${p.phase==="csp"?"bg-blue-950/50 text-blue-400":p.phase==="assigned"?"bg-amber-950/50 text-amber-400":"bg-emerald-950/50 text-emerald-400"}`}>{p.phase==="csp"?"CSP":p.phase==="assigned"?"ASSIGNED":"CC"}</span>
                    </div>
                    <button onClick={()=>deleteWheelPosition(p.id)} className="text-[10px] text-red-400 hover:text-red-300">✕</button>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-[10px] font-mono">
                    <div><span className={dimText}>Strike:</span> ${p.strike}</div>
                    <div><span className={dimText}>Premium:</span> <span className="text-emerald-400">${p.premium}</span></div>
                    <div><span className={dimText}>Expiry:</span> {p.expiry}</div>
                  </div>
                  <div className="mt-2 flex items-center gap-2">
                    <span className={`text-[10px] ${dimText}`}>Total Premium:</span>
                    <span className="text-sm font-bold text-emerald-400">${fmt(p.total_premium)}</span>
                    <span className={`text-[10px] ${dimText}`}>Cycles: {p.cycles?.length || 1}</span>
                  </div>
                </div>
              ))}
            </div>
            {wheelPositions.length === 0 && <div className={`text-center py-8 ${dimText3}`}>No wheel positions. Start by selling a cash-secured put.</div>}
          </div>
        )}

        {/* ── FUTURES & FOREX ─────────────────────────────────── */}
        {tab==="futures" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <h2 className={`text-sm font-bold uppercase tracking-widest ${dimText2}`}>🌐 Futures & Forex</h2>
              <button onClick={loadFuturesForex} className={btn} disabled={ffLoading}>{ffLoading?"Loading...":"Refresh"}</button>
            </div>
            {futuresForex.length > 0 && (
              <>
                <div className={`text-xs uppercase tracking-wider ${dimText2}`}>Futures</div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {futuresForex.filter((f:any)=>f.type==="futures").map((f:any)=>(
                    <div key={f.symbol} className={`border rounded-lg p-3 ${cardBg}`}>
                      <div className={`text-[10px] ${dimText} truncate`}>{f.name}</div>
                      <div className={`text-sm font-bold font-mono ${headText}`}>{f.price < 10 ? f.price.toFixed(4) : fmt(f.price)}</div>
                      <div className={`text-xs font-mono ${clr(f.change_pct)}`}>{f.change_pct>0?"+":""}{f.change_pct}%</div>
                    </div>
                  ))}
                </div>
                <div className={`text-xs uppercase tracking-wider ${dimText2}`}>Forex</div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {futuresForex.filter((f:any)=>f.type==="forex").map((f:any)=>(
                    <div key={f.symbol} className={`border rounded-lg p-3 ${cardBg}`}>
                      <div className={`text-[10px] ${dimText} truncate`}>{f.name}</div>
                      <div className={`text-sm font-bold font-mono ${headText}`}>{f.price.toFixed(4)}</div>
                      <div className={`text-xs font-mono ${clr(f.change_pct)}`}>{f.change_pct>0?"+":""}{f.change_pct}%</div>
                    </div>
                  ))}
                </div>
              </>
            )}
            {futuresForex.length === 0 && !ffLoading && <div className={`text-center py-8 ${dimText3}`}>Click Refresh to load futures & forex data.</div>}
          </div>
        )}

        {/* ── POSITION SIZING ─────────────────────────────────── */}
        {tab==="possize" && (
          <div className="space-y-4">
            <h2 className={`text-sm font-bold uppercase tracking-widest ${dimText2}`}>📐 Position Size Calculator</h2>
            <div className={`border rounded-lg p-4 ${cardBg}`}>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-2 mb-3">
                <div><label className={`text-[10px] block mb-1 ${dimText}`}>Account Value</label><input value={posSizeForm.account_value} onChange={e=>setPosSizeForm({...posSizeForm,account_value:e.target.value})} className={`w-full ${input}`} type="number" /></div>
                <div><label className={`text-[10px] block mb-1 ${dimText}`}>Risk %</label><input value={posSizeForm.risk_pct} onChange={e=>setPosSizeForm({...posSizeForm,risk_pct:e.target.value})} className={`w-full ${input}`} type="number" step="0.5" /></div>
                <div><label className={`text-[10px] block mb-1 ${dimText}`}>Entry Price</label><input value={posSizeForm.entry_price} onChange={e=>setPosSizeForm({...posSizeForm,entry_price:e.target.value})} className={`w-full ${input}`} type="number" /></div>
                <div><label className={`text-[10px] block mb-1 ${dimText}`}>Stop Loss</label><input value={posSizeForm.stop_loss} onChange={e=>setPosSizeForm({...posSizeForm,stop_loss:e.target.value})} className={`w-full ${input}`} type="number" /></div>
                <div className="flex items-end"><button onClick={calcPositionSize} className={`w-full ${btn}`} disabled={posSizeLoading}>{posSizeLoading?"...":"Calculate"}</button></div>
              </div>
            </div>
            {posSizeResult && posSizeResult.methods && (
              <div className="grid md:grid-cols-3 gap-3">
                {posSizeResult.methods.map((m:any)=>(
                  <div key={m.method} className={`border rounded-lg p-4 ${cardBg} ${m.method===posSizeResult.recommended?"ring-1 ring-amber-500":""}`}>
                    {m.method===posSizeResult.recommended && <div className="text-[10px] text-amber-400 font-bold mb-1">★ RECOMMENDED</div>}
                    <div className={`text-xs font-bold ${headText} mb-2`}>{m.method}</div>
                    <div className="space-y-1 text-xs font-mono">
                      <div className="flex justify-between"><span className={dimText}>Shares:</span><span className="text-amber-400 font-bold text-lg">{m.shares}</span></div>
                      <div className="flex justify-between"><span className={dimText}>Position Value:</span><span className={headText}>${fmt(m.position_value)}</span></div>
                      <div className="flex justify-between"><span className={dimText}>% of Portfolio:</span><span className={headText}>{m.pct_of_portfolio}%</span></div>
                      {m.kelly_pct != null && <div className="flex justify-between"><span className={dimText}>Kelly %:</span><span>{m.kelly_pct}%</span></div>}
                      {m.atr_actual != null && <div className="flex justify-between"><span className={dimText}>ATR(14):</span><span>${m.atr_actual}</span></div>}
                    </div>
                  </div>
                ))}
              </div>
            )}
            {posSizeResult && <div className={`text-center text-xs ${dimText} mt-2`}>Max Loss: <span className="text-red-400 font-bold">${fmt(posSizeResult.max_loss)}</span> | Risk/Share: ${fmt(posSizeResult.risk_per_share)}</div>}
          </div>
        )}

        {/* ── RISK PARITY ─────────────────────────────────────── */}
        {tab==="riskparity" && (
          <div className="space-y-4">
            <h2 className={`text-sm font-bold uppercase tracking-widest ${dimText2}`}>⚖️ Risk Parity Calculator</h2>
            <div className={`border rounded-lg p-4 ${cardBg}`}>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mb-3">
                <div><label className={`text-[10px] block mb-1 ${dimText}`}>Tickers (comma-separated)</label><input value={rpTickers} onChange={e=>setRpTickers(e.target.value)} className={`w-full ${input}`} /></div>
                <div><label className={`text-[10px] block mb-1 ${dimText}`}>Total Amount</label><input value={rpAmount} onChange={e=>setRpAmount(e.target.value)} className={`w-full ${input}`} type="number" /></div>
                <div className="flex items-end"><button onClick={calcRiskParity} className={`w-full ${btn}`} disabled={rpLoading}>{rpLoading?"Calculating...":"Calculate"}</button></div>
              </div>
            </div>
            {rpResult && rpResult.allocations?.length > 0 && (
              <>
                <div className={`border rounded-lg p-4 ${cardBg}`}>
                  <div className={`text-xs uppercase tracking-wider mb-3 ${dimText2}`}>Allocations — {rpResult.method}</div>
                  <div className="space-y-2">
                    {rpResult.allocations.map((a:any)=>(
                      <div key={a.ticker} className="flex items-center gap-3">
                        <span className="text-amber-400 font-bold w-10">{a.ticker}</span>
                        <div className="flex-1 h-3 rounded-full overflow-hidden" style={{background:dark?"#27272a":"#e5e7eb"}}>
                          <div className="h-full rounded-full bg-amber-400 transition-all" style={{width:`${a.weight}%`}} />
                        </div>
                        <span className={`text-xs font-mono w-12 text-right ${headText}`}>{a.weight}%</span>
                        <span className={`text-xs font-mono w-20 text-right ${dimText}`}>${fmt(a.dollar_amount)}</span>
                        <span className={`text-xs font-mono w-16 text-right ${dimText}`}>{a.shares} sh</span>
                        <span className={`text-[10px] font-mono ${dimText}`}>Vol: {a.volatility}%</span>
                      </div>
                    ))}
                  </div>
                  <div className={`mt-3 pt-2 border-t ${borderDim} text-xs ${dimText}`}>Portfolio Volatility: <span className="text-amber-400 font-bold">{rpResult.portfolio_volatility}%</span></div>
                </div>
                <div className={`border rounded-lg p-4 ${cardBg}`}>
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie data={rpResult.allocations.map((a:any)=>({name:a.ticker,value:a.weight}))} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({name,value}:{name:string,value:number})=>`${name} ${value}%`}>
                        {rpResult.allocations.map((_:any,i:number)=><Cell key={i} fill={["#fbbf24","#34d399","#60a5fa","#f87171","#a78bfa","#f97316"][i%6]} />)}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </>
            )}
          </div>
        )}

        {/* ── BRACKET ORDER BUILDER ──────────────────────────── */}
        {tab==="bracket" && (
          <div className="space-y-4">
            <h2 className={`text-sm font-bold uppercase tracking-widest ${dimText2}`}>🔲 Bracket Order Builder</h2>
            <div className={`border rounded-lg p-4 ${cardBg}`}>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-3">
                <div><label className={`text-[10px] block mb-1 ${dimText}`}>Entry Price</label><input value={bracketForm.entry_price} onChange={e=>setBracketForm({...bracketForm,entry_price:e.target.value})} className={`w-full ${input}`} type="number" /></div>
                <div><label className={`text-[10px] block mb-1 ${dimText}`}>Stop Loss</label><input value={bracketForm.stop_loss} onChange={e=>setBracketForm({...bracketForm,stop_loss:e.target.value})} className={`w-full ${input}`} type="number" /></div>
                <div><label className={`text-[10px] block mb-1 ${dimText}`}>Shares</label><input value={bracketForm.shares} onChange={e=>setBracketForm({...bracketForm,shares:e.target.value})} className={`w-full ${input}`} type="number" /></div>
                <div><label className={`text-[10px] block mb-1 ${dimText}`}>Side</label><select value={bracketForm.side} onChange={e=>setBracketForm({...bracketForm,side:e.target.value})} className={`w-full ${input}`}><option value="long">Long</option><option value="short">Short</option></select></div>
              </div>
              <div className={`text-xs uppercase tracking-wider mb-2 ${dimText2}`}>Take Profit Targets</div>
              {bracketForm.targets.map((t, i)=>(
                <div key={i} className="flex gap-2 mb-1">
                  <input value={t.price} onChange={e=>{const tgts=[...bracketForm.targets]; tgts[i]={...tgts[i],price:e.target.value}; setBracketForm({...bracketForm,targets:tgts});}} placeholder={`Target ${i+1} Price`} className={`flex-1 ${input}`} type="number" />
                  <input value={t.pct} onChange={e=>{const tgts=[...bracketForm.targets]; tgts[i]={...tgts[i],pct:e.target.value}; setBracketForm({...bracketForm,targets:tgts});}} placeholder="% of pos" className={`w-20 ${input}`} type="number" />
                  <span className={`text-[10px] self-center ${dimText}`}>%</span>
                </div>
              ))}
              <div className="flex gap-2 mt-2">
                <button onClick={()=>setBracketForm({...bracketForm,targets:[...bracketForm.targets,{price:"",pct:""}]})} className={btnOutline}>+ Target</button>
                <button onClick={calcBracketOrder} className={btn}>Build Bracket</button>
              </div>
            </div>
            {bracketResult && (
              <div className={`border rounded-lg p-4 ${cardBg}`}>
                <div className={`text-xs uppercase tracking-wider mb-3 ${dimText2}`}>Order Legs</div>
                <div className="space-y-2">
                  {bracketResult.legs.map((leg:any, i:number)=>(
                    <div key={i} className={`flex items-center justify-between p-2 rounded ${leg.type==="entry"?dark?"bg-zinc-800":"bg-gray-100":leg.type==="stop_loss"?"bg-red-950/30":"bg-emerald-950/30"}`}>
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-bold uppercase ${leg.type==="entry"?"text-amber-400":leg.type==="stop_loss"?"text-red-400":"text-emerald-400"}`}>{leg.type.replace("_"," ")}</span>
                        <span className={`text-xs ${headText}`}>{leg.action}</span>
                      </div>
                      <div className="flex items-center gap-3 text-xs font-mono">
                        <span>${leg.price}</span>
                        <span>{leg.shares} sh</span>
                        {leg.pnl != null && <span className={clr(leg.pnl)}>{leg.pnl>=0?"+":""}${fmt(leg.pnl)}</span>}
                        {leg.risk_reward != null && <span className={dimText}>{leg.risk_reward}R</span>}
                      </div>
                    </div>
                  ))}
                </div>
                <div className={`mt-3 pt-2 border-t ${borderDim} flex justify-between text-xs`}>
                  <span className={dimText}>Risk: <span className="text-red-400 font-bold">${fmt(bracketResult.total_risk)}</span></span>
                  <span className={dimText}>Reward: <span className="text-emerald-400 font-bold">${fmt(bracketResult.total_target_pnl)}</span></span>
                  <span className={dimText}>R:R: <span className="text-amber-400 font-bold">{bracketResult.blended_risk_reward}</span></span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── AI SENTIMENT ────────────────────────────────────── */}
        {tab==="sentiment" && (
          <div className="space-y-4">
            <h2 className={`text-sm font-bold uppercase tracking-widest ${dimText2}`}>💬 AI Sentiment Aggregator</h2>
            <div className="flex gap-2">
              <input value={aiSentimentTicker} onChange={e=>setAiSentimentTicker(e.target.value)} placeholder="Enter ticker..." className={`flex-1 ${input}`} onKeyDown={e=>e.key==="Enter"&&loadAiSentiment()} />
              <button onClick={()=>loadAiSentiment()} className={btn} disabled={aiSentimentLoading}>{aiSentimentLoading?"Analyzing...":"Analyze"}</button>
            </div>
            {aiSentiment && !aiSentiment.error && (
              <div className="grid md:grid-cols-2 gap-4">
                <div className={`border rounded-lg p-4 ${cardBg}`}>
                  <div className="flex items-center gap-3 mb-3">
                    <span className={`text-3xl font-bold font-mono ${(aiSentiment.score||0)>0?"text-emerald-400":(aiSentiment.score||0)<0?"text-red-400":"text-amber-400"}`}>{aiSentiment.score>0?"+":""}{aiSentiment.score}</span>
                    <span className={`text-xs px-2 py-1 rounded uppercase font-bold ${aiSentiment.overall_sentiment?.includes("bull")?"bg-emerald-950/50 text-emerald-400 border border-emerald-800":aiSentiment.overall_sentiment?.includes("bear")?"bg-red-950/50 text-red-400 border border-red-800":"bg-amber-950/50 text-amber-400 border border-amber-800"}`}>{aiSentiment.overall_sentiment}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 mb-3">
                    {[{label:"Social",value:aiSentiment.social_sentiment},{label:"News",value:aiSentiment.news_sentiment},{label:"Technical",value:aiSentiment.technical_sentiment}].map(s=>(
                      <div key={s.label} className={`text-center p-2 rounded ${dark?"bg-zinc-800":"bg-gray-100"}`}>
                        <div className={`text-[10px] ${dimText}`}>{s.label}</div>
                        <div className={`text-xs font-bold ${s.value==="bullish"?"text-emerald-400":s.value==="bearish"?"text-red-400":"text-amber-400"}`}>{s.value}</div>
                      </div>
                    ))}
                  </div>
                  <p className={`text-xs ${bodyText}`}>{aiSentiment.summary}</p>
                </div>
                <div className={`border rounded-lg p-4 ${cardBg}`}>
                  {aiSentiment.key_themes?.length > 0 && (
                    <div className="mb-3">
                      <div className={`text-xs uppercase tracking-wider mb-1 ${dimText2}`}>Key Themes</div>
                      <div className="flex flex-wrap gap-1">{aiSentiment.key_themes.map((t:string,i:number)=><span key={i} className={`text-[10px] px-2 py-0.5 rounded ${dark?"bg-zinc-800 text-zinc-300":"bg-gray-100 text-gray-600"}`}>{t}</span>)}</div>
                    </div>
                  )}
                  {aiSentiment.catalysts?.length > 0 && (
                    <div className="mb-3">
                      <div className={`text-xs uppercase tracking-wider mb-1 ${dimText2}`}>Catalysts</div>
                      {aiSentiment.catalysts.map((c:string,i:number)=><div key={i} className={`text-xs ${bodyText} flex gap-1`}><span className="text-emerald-400">▲</span>{c}</div>)}
                    </div>
                  )}
                  {aiSentiment.risks?.length > 0 && (
                    <div>
                      <div className={`text-xs uppercase tracking-wider mb-1 ${dimText2}`}>Risks</div>
                      {aiSentiment.risks.map((r:string,i:number)=><div key={i} className={`text-xs ${bodyText} flex gap-1`}><span className="text-red-400">▼</span>{r}</div>)}
                    </div>
                  )}
                </div>
              </div>
            )}
            {aiSentiment?.error && <div className="text-xs text-red-400">{aiSentiment.error}</div>}
          </div>
        )}

        {/* ── AI PATTERN RECOGNITION ──────────────────────────── */}
        {tab==="patterns" && (
          <div className="space-y-4">
            <h2 className={`text-sm font-bold uppercase tracking-widest ${dimText2}`}>🔮 AI Pattern Recognition</h2>
            <div className="flex gap-2">
              <input value={chartTicker} onChange={e=>setChartTicker(e.target.value)} placeholder="Enter ticker..." className={`flex-1 ${input}`} onKeyDown={e=>e.key==="Enter"&&loadAiPatterns(chartTicker)} />
              <button onClick={()=>loadAiPatterns(chartTicker)} className={btn} disabled={aiPatternsLoading}>{aiPatternsLoading?"Scanning...":"Scan Patterns"}</button>
            </div>
            {aiPatterns && !aiPatterns.error && (
              <>
                <div className="flex gap-2 flex-wrap mb-2">
                  <span className={`text-[10px] px-2 py-1 rounded ${aiPatterns.trend==="uptrend"?"bg-emerald-950/50 text-emerald-400 border border-emerald-800":aiPatterns.trend==="downtrend"?"bg-red-950/50 text-red-400 border border-red-800":"bg-amber-950/50 text-amber-400 border border-amber-800"}`}>Trend: {aiPatterns.trend}</span>
                  <span className={`text-[10px] px-2 py-1 rounded ${dark?"bg-zinc-800 text-zinc-400":"bg-gray-100 text-gray-600"}`}>Volume: {aiPatterns.volume_trend}</span>
                </div>
                {aiPatterns.summary && <p className={`text-xs ${bodyText} mb-3`}>{aiPatterns.summary}</p>}
                <div className="grid md:grid-cols-2 gap-3">
                  {aiPatterns.patterns?.map((p:any,i:number)=>(
                    <div key={i} className={`border rounded-lg p-4 ${cardBg}`}>
                      <div className="flex justify-between items-start mb-2">
                        <span className={`text-xs font-bold ${headText}`}>{p.pattern}</span>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${p.direction==="bullish"?"bg-emerald-950/50 text-emerald-400":p.direction==="bearish"?"bg-red-950/50 text-red-400":"bg-amber-950/50 text-amber-400"}`}>{p.direction}</span>
                      </div>
                      <div className="flex gap-2 items-center mb-2">
                        <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{background:dark?"#27272a":"#e5e7eb"}}>
                          <div className="h-full rounded-full bg-amber-400" style={{width:`${p.confidence}%`}} />
                        </div>
                        <span className={`text-[10px] font-mono ${dimText}`}>{p.confidence}%</span>
                      </div>
                      <p className={`text-[10px] ${bodyText}`}>{p.description}</p>
                      <div className="flex gap-3 mt-2 text-[10px] font-mono">
                        {p.target_price && <span className={dimText}>Target: <span className="text-emerald-400">${p.target_price}</span></span>}
                        {p.stop_price && <span className={dimText}>Stop: <span className="text-red-400">${p.stop_price}</span></span>}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {aiPatterns.support_levels?.length > 0 && (
                    <div className={`border rounded-lg p-3 ${cardBg}`}>
                      <div className={`text-xs uppercase tracking-wider mb-1 ${dimText2}`}>Support Levels</div>
                      <div className="flex gap-2">{aiPatterns.support_levels.map((s:number,i:number)=><span key={i} className="text-xs font-mono text-emerald-400">${s}</span>)}</div>
                    </div>
                  )}
                  {aiPatterns.resistance_levels?.length > 0 && (
                    <div className={`border rounded-lg p-3 ${cardBg}`}>
                      <div className={`text-xs uppercase tracking-wider mb-1 ${dimText2}`}>Resistance Levels</div>
                      <div className="flex gap-2">{aiPatterns.resistance_levels.map((r:number,i:number)=><span key={i} className="text-xs font-mono text-red-400">${r}</span>)}</div>
                    </div>
                  )}
                </div>
              </>
            )}
            {aiPatterns?.error && <div className="text-xs text-red-400">{aiPatterns.error}</div>}
          </div>
        )}

        {/* ── MONTE CARLO ────────────────────────────────────── */}
        {tab==="montecarlo" && (
          <div className="space-y-4">
            <h2 className={`text-sm font-bold uppercase tracking-widest ${dimText2}`}>🎲 Monte Carlo Simulation</h2>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
              <div><label className={`text-[10px] ${dimText}`}>Initial Value</label><input value={mcForm.initial_value} onChange={e=>setMcForm({...mcForm,initial_value:e.target.value})} className={`w-full ${input}`} /></div>
              <div><label className={`text-[10px] ${dimText}`}>Daily Return %</label><input value={mcForm.daily_return} onChange={e=>setMcForm({...mcForm,daily_return:e.target.value})} className={`w-full ${input}`} /></div>
              <div><label className={`text-[10px] ${dimText}`}>Daily Vol %</label><input value={mcForm.daily_volatility} onChange={e=>setMcForm({...mcForm,daily_volatility:e.target.value})} className={`w-full ${input}`} /></div>
              <div><label className={`text-[10px] ${dimText}`}>Days</label><input value={mcForm.days} onChange={e=>setMcForm({...mcForm,days:e.target.value})} className={`w-full ${input}`} /></div>
              <div><label className={`text-[10px] ${dimText}`}>Simulations</label><input value={mcForm.simulations} onChange={e=>setMcForm({...mcForm,simulations:e.target.value})} className={`w-full ${input}`} /></div>
            </div>
            <button onClick={runMonteCarlo} className={btn} disabled={mcLoading}>{mcLoading?"Running simulations...":"Run Monte Carlo"}</button>
            {mcResult && !mcResult.error && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className={`border rounded-lg p-3 text-center ${cardBg}`}><div className={`text-[10px] ${dimText}`}>Median Outcome</div><div className={`text-lg font-bold text-amber-400`}>${(mcResult.statistics?.median||0).toLocaleString()}</div></div>
                  <div className={`border rounded-lg p-3 text-center ${cardBg}`}><div className={`text-[10px] ${dimText}`}>Mean Outcome</div><div className={`text-lg font-bold ${headText}`}>${(mcResult.statistics?.mean||0).toLocaleString()}</div></div>
                  <div className={`border rounded-lg p-3 text-center ${cardBg}`}><div className={`text-[10px] ${dimText}`}>Best Case (95th)</div><div className="text-lg font-bold text-emerald-400">${(mcResult.statistics?.percentile_95||0).toLocaleString()}</div></div>
                  <div className={`border rounded-lg p-3 text-center ${cardBg}`}><div className={`text-[10px] ${dimText}`}>Worst Case (5th)</div><div className="text-lg font-bold text-red-400">${(mcResult.statistics?.percentile_5||0).toLocaleString()}</div></div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div className={`border rounded-lg p-3 text-center ${cardBg}`}><div className={`text-[10px] ${dimText}`}>P(Profit)</div><div className={`text-sm font-bold text-emerald-400`}>{mcResult.statistics?.prob_profit?.toFixed(1)}%</div></div>
                  <div className={`border rounded-lg p-3 text-center ${cardBg}`}><div className={`text-[10px] ${dimText}`}>Max Drawdown</div><div className="text-sm font-bold text-red-400">{mcResult.statistics?.max_drawdown?.toFixed(1)}%</div></div>
                  <div className={`border rounded-lg p-3 text-center ${cardBg}`}><div className={`text-[10px] ${dimText}`}>Std Dev</div><div className={`text-sm font-bold ${headText}`}>${(mcResult.statistics?.std_dev||0).toLocaleString()}</div></div>
                </div>
                {mcResult.distribution && (
                  <div className="h-48">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={mcResult.distribution}><XAxis dataKey="range" tick={{fontSize:8,fill:dark?"#71717a":"#9ca3af"}} /><YAxis tick={{fontSize:9,fill:dark?"#71717a":"#9ca3af"}} /><Tooltip contentStyle={{background:dark?"#18181b":"#fff",border:`1px solid ${dark?"#3f3f46":"#e5e7eb"}`,fontSize:11}} /><Bar dataKey="count" fill="#f59e0b" radius={[2,2,0,0]} /></BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>
            )}
            {mcResult?.error && <div className="text-xs text-red-400">{mcResult.error}</div>}
          </div>
        )}

        {/* ── MPT OPTIMIZER ─────────────────────────────────── */}
        {tab==="mpt" && (
          <div className="space-y-4">
            <h2 className={`text-sm font-bold uppercase tracking-widest ${dimText2}`}>📊 Portfolio Optimizer (MPT)</h2>
            <div className="flex gap-2">
              <input value={mptTickers} onChange={e=>setMptTickers(e.target.value)} placeholder="Tickers (comma-separated)" className={`flex-1 ${input}`} />
              <input value={mptAmount} onChange={e=>setMptAmount(e.target.value)} placeholder="Amount $" className={`w-32 ${input}`} />
              <button onClick={runMptOptimizer} className={btn} disabled={mptLoading}>{mptLoading?"Optimizing...":"Optimize"}</button>
            </div>
            {mptResult && !mptResult.error && (
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-3">
                  <div className={`border rounded-lg p-3 text-center ${cardBg}`}><div className={`text-[10px] ${dimText}`}>Expected Return</div><div className="text-lg font-bold text-emerald-400">{mptResult.expected_return?.toFixed(2)}%</div></div>
                  <div className={`border rounded-lg p-3 text-center ${cardBg}`}><div className={`text-[10px] ${dimText}`}>Risk (Volatility)</div><div className="text-lg font-bold text-amber-400">{mptResult.risk?.toFixed(2)}%</div></div>
                  <div className={`border rounded-lg p-3 text-center ${cardBg}`}><div className={`text-[10px] ${dimText}`}>Sharpe Ratio</div><div className={`text-lg font-bold ${headText}`}>{mptResult.sharpe_ratio?.toFixed(2)}</div></div>
                </div>
                {mptResult.allocations && (
                  <div className={`border rounded-lg p-4 ${cardBg}`}>
                    <div className={`text-xs uppercase tracking-wider mb-3 ${dimText2}`}>Optimal Allocation</div>
                    <div className="space-y-2">
                      {Object.entries(mptResult.allocations).sort((a:any,b:any)=>b[1]-a[1]).map(([ticker,weight]:any)=>(
                        <div key={ticker} className="flex items-center gap-3">
                          <span className={`text-xs font-bold w-14 ${headText}`}>{ticker}</span>
                          <div className="flex-1 h-3 rounded-full overflow-hidden" style={{background:dark?"#27272a":"#e5e7eb"}}>
                            <div className="h-full rounded-full bg-amber-400" style={{width:`${(weight*100).toFixed(0)}%`}} />
                          </div>
                          <span className={`text-xs font-mono w-14 text-right ${dimText}`}>{(weight*100).toFixed(1)}%</span>
                          <span className={`text-[10px] font-mono w-20 text-right ${headText}`}>${((weight*parseFloat(mptAmount))).toLocaleString(undefined,{maximumFractionDigits:0})}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
            {mptResult?.error && <div className="text-xs text-red-400">{mptResult.error}</div>}
          </div>
        )}

        {/* ── MARKET BREADTH ──────────────────────────────────── */}
        {tab==="breadth" && (
          <div className="space-y-4">
            <h2 className={`text-sm font-bold uppercase tracking-widest ${dimText2}`}>📶 Market Breadth Dashboard</h2>
            <button onClick={loadBreadth} className={btn} disabled={breadthLoading}>{breadthLoading?"Loading...":"Load Breadth Data"}</button>
            {breadthData && !breadthData.error && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className={`border rounded-lg p-3 text-center ${cardBg}`}><div className={`text-[10px] ${dimText}`}>Advance/Decline</div><div className={`text-lg font-bold ${(breadthData.advance_decline_ratio||0)>1?"text-emerald-400":"text-red-400"}`}>{breadthData.advance_decline_ratio?.toFixed(2)}</div></div>
                  <div className={`border rounded-lg p-3 text-center ${cardBg}`}><div className={`text-[10px] ${dimText}`}>% Above 20 SMA</div><div className={`text-lg font-bold text-amber-400`}>{breadthData.pct_above_sma20?.toFixed(0)}%</div></div>
                  <div className={`border rounded-lg p-3 text-center ${cardBg}`}><div className={`text-[10px] ${dimText}`}>% Above 50 SMA</div><div className={`text-lg font-bold text-amber-400`}>{breadthData.pct_above_sma50?.toFixed(0)}%</div></div>
                  <div className={`border rounded-lg p-3 text-center ${cardBg}`}><div className={`text-[10px] ${dimText}`}>% Above 200 SMA</div><div className={`text-lg font-bold text-amber-400`}>{breadthData.pct_above_sma200?.toFixed(0)}%</div></div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className={`border rounded-lg p-3 text-center ${cardBg}`}><div className={`text-[10px] ${dimText}`}>New Highs</div><div className="text-sm font-bold text-emerald-400">{breadthData.new_highs||0}</div></div>
                  <div className={`border rounded-lg p-3 text-center ${cardBg}`}><div className={`text-[10px] ${dimText}`}>New Lows</div><div className="text-sm font-bold text-red-400">{breadthData.new_lows||0}</div></div>
                  <div className={`border rounded-lg p-3 text-center ${cardBg}`}><div className={`text-[10px] ${dimText}`}>McClellan</div><div className={`text-sm font-bold ${(breadthData.mcclellan_oscillator||0)>=0?"text-emerald-400":"text-red-400"}`}>{breadthData.mcclellan_oscillator?.toFixed(1)}</div></div>
                  <div className={`border rounded-lg p-3 text-center ${cardBg}`}><div className={`text-[10px] ${dimText}`}>Breadth Signal</div><div className={`text-sm font-bold ${breadthData.breadth_signal==="bullish"?"text-emerald-400":"text-red-400"}`}>{breadthData.breadth_signal}</div></div>
                </div>
                {breadthData.sector_breadth?.length > 0 && (
                  <div className={`border rounded-lg p-4 ${cardBg}`}>
                    <div className={`text-xs uppercase tracking-wider mb-3 ${dimText2}`}>Sector Breadth</div>
                    <div className="space-y-2">
                      {breadthData.sector_breadth.map((s:any)=>(
                        <div key={s.sector} className="flex items-center gap-3">
                          <span className={`text-xs w-24 ${headText}`}>{s.sector}</span>
                          <div className="flex-1 h-2.5 rounded-full overflow-hidden" style={{background:dark?"#27272a":"#e5e7eb"}}>
                            <div className={`h-full rounded-full ${s.pct_positive>50?"bg-emerald-400":"bg-red-400"}`} style={{width:`${s.pct_positive}%`}} />
                          </div>
                          <span className={`text-[10px] font-mono w-10 text-right ${dimText}`}>{s.pct_positive?.toFixed(0)}%</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ── IV RANK ────────────────────────────────────────── */}
        {tab==="ivrank" && (
          <div className="space-y-4">
            <h2 className={`text-sm font-bold uppercase tracking-widest ${dimText2}`}>📉 IV Rank & Percentile</h2>
            <div className="flex gap-2">
              <input value={ivTicker} onChange={e=>setIvTicker(e.target.value.toUpperCase())} placeholder="Enter ticker..." className={`flex-1 ${input}`} onKeyDown={e=>e.key==="Enter"&&loadIvRank()} />
              <button onClick={()=>loadIvRank()} className={btn} disabled={ivLoading}>{ivLoading?"Loading...":"Analyze IV"}</button>
            </div>
            {ivData && !ivData.error && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className={`border rounded-lg p-3 text-center ${cardBg}`}><div className={`text-[10px] ${dimText}`}>Current IV</div><div className={`text-lg font-bold text-amber-400`}>{ivData.current_iv?.toFixed(1)}%</div></div>
                  <div className={`border rounded-lg p-3 text-center ${cardBg}`}><div className={`text-[10px] ${dimText}`}>IV Rank</div><div className={`text-lg font-bold ${(ivData.iv_rank||0)>50?"text-red-400":"text-emerald-400"}`}>{ivData.iv_rank?.toFixed(1)}%</div></div>
                  <div className={`border rounded-lg p-3 text-center ${cardBg}`}><div className={`text-[10px] ${dimText}`}>IV Percentile</div><div className={`text-lg font-bold ${(ivData.iv_percentile||0)>50?"text-red-400":"text-emerald-400"}`}>{ivData.iv_percentile?.toFixed(1)}%</div></div>
                  <div className={`border rounded-lg p-3 text-center ${cardBg}`}><div className={`text-[10px] ${dimText}`}>HV (30d)</div><div className={`text-lg font-bold ${headText}`}>{ivData.hv_30?.toFixed(1)}%</div></div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className={`border rounded-lg p-3 ${cardBg}`}><div className={`text-[10px] ${dimText}`}>IV-HV Spread</div><div className={`text-sm font-bold ${(ivData.iv_hv_spread||0)>0?"text-amber-400":"text-emerald-400"}`}>{ivData.iv_hv_spread?.toFixed(1)}%</div><div className={`text-[10px] ${dimText}`}>{(ivData.iv_hv_spread||0)>0?"IV Premium (options expensive)":"IV Discount (options cheap)"}</div></div>
                  <div className={`border rounded-lg p-3 ${cardBg}`}><div className={`text-[10px] ${dimText}`}>Recommendation</div><div className={`text-xs font-bold ${headText}`}>{ivData.recommendation}</div></div>
                </div>
              </div>
            )}
            {ivData?.error && <div className="text-xs text-red-400">{ivData.error}</div>}
          </div>
        )}

        {/* ── GREEKS CALCULATOR ──────────────────────────────── */}
        {tab==="greeks" && (
          <div className="space-y-4">
            <h2 className={`text-sm font-bold uppercase tracking-widest ${dimText2}`}>Δ Greeks Calculator (Black-Scholes)</h2>
            <div className="grid grid-cols-2 md:grid-cols-6 gap-2">
              <div><label className={`text-[10px] ${dimText}`}>Spot Price</label><input value={greeksForm.spot} onChange={e=>setGreeksForm({...greeksForm,spot:e.target.value})} className={`w-full ${input}`} placeholder="100" /></div>
              <div><label className={`text-[10px] ${dimText}`}>Strike</label><input value={greeksForm.strike} onChange={e=>setGreeksForm({...greeksForm,strike:e.target.value})} className={`w-full ${input}`} placeholder="100" /></div>
              <div><label className={`text-[10px] ${dimText}`}>DTE</label><input value={greeksForm.dte} onChange={e=>setGreeksForm({...greeksForm,dte:e.target.value})} className={`w-full ${input}`} /></div>
              <div><label className={`text-[10px] ${dimText}`}>Rate %</label><input value={greeksForm.rate} onChange={e=>setGreeksForm({...greeksForm,rate:e.target.value})} className={`w-full ${input}`} /></div>
              <div><label className={`text-[10px] ${dimText}`}>IV %</label><input value={greeksForm.iv} onChange={e=>setGreeksForm({...greeksForm,iv:e.target.value})} className={`w-full ${input}`} /></div>
              <div><label className={`text-[10px] ${dimText}`}>Type</label><select value={greeksForm.option_type} onChange={e=>setGreeksForm({...greeksForm,option_type:e.target.value})} className={`w-full ${input}`}><option value="call">Call</option><option value="put">Put</option></select></div>
            </div>
            <button onClick={calcGreeks} className={btn} disabled={greeksLoading}>{greeksLoading?"Calculating...":"Calculate Greeks"}</button>
            {greeksResult && !greeksResult.error && (
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                <div className={`border rounded-lg p-4 text-center ${cardBg}`}><div className={`text-[10px] ${dimText}`}>Delta (Δ)</div><div className={`text-xl font-bold text-amber-400`}>{greeksResult.delta?.toFixed(4)}</div></div>
                <div className={`border rounded-lg p-4 text-center ${cardBg}`}><div className={`text-[10px] ${dimText}`}>Gamma (Γ)</div><div className={`text-xl font-bold ${headText}`}>{greeksResult.gamma?.toFixed(4)}</div></div>
                <div className={`border rounded-lg p-4 text-center ${cardBg}`}><div className={`text-[10px] ${dimText}`}>Theta (Θ)</div><div className="text-xl font-bold text-red-400">{greeksResult.theta?.toFixed(4)}</div></div>
                <div className={`border rounded-lg p-4 text-center ${cardBg}`}><div className={`text-[10px] ${dimText}`}>Vega (ν)</div><div className={`text-xl font-bold text-emerald-400`}>{greeksResult.vega?.toFixed(4)}</div></div>
                <div className={`border rounded-lg p-4 text-center ${cardBg}`}><div className={`text-[10px] ${dimText}`}>Theo Price</div><div className={`text-xl font-bold ${headText}`}>${greeksResult.price?.toFixed(2)}</div></div>
              </div>
            )}
            {greeksResult?.error && <div className="text-xs text-red-400">{greeksResult.error}</div>}
          </div>
        )}

        {/* ── MULTI-LEG STRATEGY ──────────────────────────────── */}
        {tab==="multileg" && (
          <div className="space-y-4">
            <h2 className={`text-sm font-bold uppercase tracking-widest ${dimText2}`}>🔀 Multi-Leg Options Strategy Builder</h2>
            <div className="flex gap-2 items-end">
              <div><label className={`text-[10px] ${dimText}`}>Ticker</label><input value={stratTicker} onChange={e=>setStratTicker(e.target.value.toUpperCase())} placeholder="SPY" className={`w-24 ${input}`} /></div>
              <button onClick={()=>setStratLegs([...stratLegs,{type:"call",side:"buy",strike:"",premium:"",qty:"1"}])} className={btnOutline}>+ Add Leg</button>
              <button onClick={buildStrategy} className={btn}>Build Strategy</button>
            </div>
            <div className="space-y-2">
              {stratLegs.map((leg,i)=>(
                <div key={i} className={`flex gap-2 items-center border rounded-lg p-2 ${cardBg}`}>
                  <span className={`text-[10px] font-bold ${dimText} w-6`}>L{i+1}</span>
                  <select value={leg.side} onChange={e=>{const n=[...stratLegs];n[i].side=e.target.value;setStratLegs(n);}} className={`w-16 ${input}`}><option value="buy">Buy</option><option value="sell">Sell</option></select>
                  <select value={leg.type} onChange={e=>{const n=[...stratLegs];n[i].type=e.target.value;setStratLegs(n);}} className={`w-16 ${input}`}><option value="call">Call</option><option value="put">Put</option></select>
                  <input value={leg.strike} onChange={e=>{const n=[...stratLegs];n[i].strike=e.target.value;setStratLegs(n);}} placeholder="Strike" className={`w-20 ${input}`} />
                  <input value={leg.premium} onChange={e=>{const n=[...stratLegs];n[i].premium=e.target.value;setStratLegs(n);}} placeholder="Premium" className={`w-20 ${input}`} />
                  <input value={leg.qty} onChange={e=>{const n=[...stratLegs];n[i].qty=e.target.value;setStratLegs(n);}} placeholder="Qty" className={`w-14 ${input}`} />
                  {stratLegs.length>1 && <button onClick={()=>setStratLegs(stratLegs.filter((_,j)=>j!==i))} className="text-red-400 text-xs hover:text-red-300">✕</button>}
                </div>
              ))}
            </div>
            {stratResult && !stratResult.error && (
              <div className="space-y-3">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className={`border rounded-lg p-3 text-center ${cardBg}`}><div className={`text-[10px] ${dimText}`}>Max Profit</div><div className="text-sm font-bold text-emerald-400">{stratResult.max_profit==="unlimited"?"∞":"$"+stratResult.max_profit}</div></div>
                  <div className={`border rounded-lg p-3 text-center ${cardBg}`}><div className={`text-[10px] ${dimText}`}>Max Loss</div><div className="text-sm font-bold text-red-400">{stratResult.max_loss==="unlimited"?"∞":"$"+stratResult.max_loss}</div></div>
                  <div className={`border rounded-lg p-3 text-center ${cardBg}`}><div className={`text-[10px] ${dimText}`}>Net Premium</div><div className={`text-sm font-bold ${headText}`}>${stratResult.net_premium?.toFixed(2)}</div></div>
                  <div className={`border rounded-lg p-3 text-center ${cardBg}`}><div className={`text-[10px] ${dimText}`}>Breakeven</div><div className={`text-sm font-bold text-amber-400`}>{stratResult.breakevens?.map((b:number)=>"$"+b.toFixed(2)).join(", ")}</div></div>
                </div>
                {stratResult.pnl_curve?.length > 0 && (
                  <div className="h-48">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={stratResult.pnl_curve}><XAxis dataKey="price" tick={{fontSize:9,fill:dark?"#71717a":"#9ca3af"}} /><YAxis tick={{fontSize:9,fill:dark?"#71717a":"#9ca3af"}} /><Tooltip contentStyle={{background:dark?"#18181b":"#fff",border:`1px solid ${dark?"#3f3f46":"#e5e7eb"}`,fontSize:11}} /><Area type="monotone" dataKey="pnl" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.15} /></AreaChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ── INSIDER TRADING ────────────────────────────────── */}
        {tab==="insider" && (
          <div className="space-y-4">
            <h2 className={`text-sm font-bold uppercase tracking-widest ${dimText2}`}>👤 Insider Trading Tracker</h2>
            <div className="flex gap-2">
              <input value={insiderTicker} onChange={e=>setInsiderTicker(e.target.value.toUpperCase())} placeholder="Enter ticker..." className={`flex-1 ${input}`} onKeyDown={e=>e.key==="Enter"&&loadInsider()} />
              <button onClick={()=>loadInsider()} className={btn} disabled={insiderLoading}>{insiderLoading?"Loading...":"Track Insiders"}</button>
            </div>
            {insiderData && !insiderData.error && (
              <div className="space-y-3">
                <div className="grid grid-cols-3 gap-3">
                  <div className={`border rounded-lg p-3 text-center ${cardBg}`}><div className={`text-[10px] ${dimText}`}>Net Activity (90d)</div><div className={`text-lg font-bold ${insiderData.net_activity==="buying"?"text-emerald-400":"text-red-400"}`}>{insiderData.net_activity}</div></div>
                  <div className={`border rounded-lg p-3 text-center ${cardBg}`}><div className={`text-[10px] ${dimText}`}>Buy Transactions</div><div className="text-lg font-bold text-emerald-400">{insiderData.total_buys||0}</div></div>
                  <div className={`border rounded-lg p-3 text-center ${cardBg}`}><div className={`text-[10px] ${dimText}`}>Sell Transactions</div><div className="text-lg font-bold text-red-400">{insiderData.total_sells||0}</div></div>
                </div>
                {insiderData.transactions?.length > 0 && (
                  <div className={`border rounded-lg overflow-hidden ${cardBg}`}>
                    <table className="w-full text-xs">
                      <thead><tr className={dark?"bg-zinc-800/50":"bg-gray-50"}><th className="text-left p-2">Date</th><th className="text-left p-2">Insider</th><th className="text-left p-2">Title</th><th className="text-left p-2">Type</th><th className="text-right p-2">Shares</th><th className="text-right p-2">Value</th></tr></thead>
                      <tbody>{insiderData.transactions.slice(0,20).map((t:any,i:number)=>(
                        <tr key={i} className={`border-t ${borderDim}`}><td className="p-2">{t.date}</td><td className={`p-2 ${headText}`}>{t.insider}</td><td className={`p-2 ${dimText}`}>{t.title}</td><td className={`p-2 font-bold ${t.type==="Buy"?"text-emerald-400":"text-red-400"}`}>{t.type}</td><td className="p-2 text-right font-mono">{t.shares?.toLocaleString()}</td><td className="p-2 text-right font-mono">${t.value?.toLocaleString()}</td></tr>
                      ))}</tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
            {insiderData?.error && <div className="text-xs text-red-400">{insiderData.error}</div>}
          </div>
        )}

        {/* ── DARK POOL ──────────────────────────────────────── */}
        {tab==="darkpool" && (
          <div className="space-y-4">
            <h2 className={`text-sm font-bold uppercase tracking-widest ${dimText2}`}>🌑 Dark Pool Scanner</h2>
            <div className="flex gap-2">
              <input value={dpTicker} onChange={e=>setDpTicker(e.target.value.toUpperCase())} placeholder="Enter ticker..." className={`flex-1 ${input}`} onKeyDown={e=>e.key==="Enter"&&loadDarkPool()} />
              <button onClick={()=>loadDarkPool()} className={btn} disabled={dpLoading}>{dpLoading?"Scanning...":"Scan Dark Pool"}</button>
            </div>
            {dpData && !dpData.error && (
              <div className="space-y-3">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className={`border rounded-lg p-3 text-center ${cardBg}`}><div className={`text-[10px] ${dimText}`}>Dark Pool Volume</div><div className={`text-lg font-bold text-amber-400`}>{dpData.dark_pool_volume?.toLocaleString()}</div></div>
                  <div className={`border rounded-lg p-3 text-center ${cardBg}`}><div className={`text-[10px] ${dimText}`}>DP % of Volume</div><div className={`text-lg font-bold ${headText}`}>{dpData.dark_pool_pct?.toFixed(1)}%</div></div>
                  <div className={`border rounded-lg p-3 text-center ${cardBg}`}><div className={`text-[10px] ${dimText}`}>Block Trades</div><div className="text-lg font-bold text-amber-400">{dpData.block_trades||0}</div></div>
                  <div className={`border rounded-lg p-3 text-center ${cardBg}`}><div className={`text-[10px] ${dimText}`}>Signal</div><div className={`text-lg font-bold ${dpData.signal==="accumulation"?"text-emerald-400":"text-red-400"}`}>{dpData.signal}</div></div>
                </div>
                {dpData.large_prints?.length > 0 && (
                  <div className={`border rounded-lg p-4 ${cardBg}`}>
                    <div className={`text-xs uppercase tracking-wider mb-2 ${dimText2}`}>Large Prints</div>
                    <div className="space-y-1">
                      {dpData.large_prints.slice(0,10).map((p:any,i:number)=>(
                        <div key={i} className={`flex justify-between text-xs ${bodyText}`}>
                          <span className={dimText}>{p.time}</span>
                          <span className="font-mono">{p.shares?.toLocaleString()} shares</span>
                          <span className="font-mono">${p.price?.toFixed(2)}</span>
                          <span className="font-mono text-amber-400">${p.value?.toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
            {dpData?.error && <div className="text-xs text-red-400">{dpData.error}</div>}
          </div>
        )}

        {/* ── TRADE TEMPLATES ────────────────────────────────── */}
        {tab==="templates" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className={`text-sm font-bold uppercase tracking-widest ${dimText2}`}>📝 Trade Templates</h2>
              <button onClick={()=>setShowTemplateForm(!showTemplateForm)} className={btn}>{showTemplateForm?"Cancel":"+ New Template"}</button>
            </div>
            {showTemplateForm && (
              <div className={`border rounded-lg p-4 space-y-2 ${cardBg}`}>
                <input value={templateForm.name} onChange={e=>setTemplateForm({...templateForm,name:e.target.value})} placeholder="Template Name" className={`w-full ${input}`} />
                <div className="grid grid-cols-2 gap-2">
                  <input value={templateForm.strategy} onChange={e=>setTemplateForm({...templateForm,strategy:e.target.value})} placeholder="Strategy (e.g. Breakout)" className={input} />
                  <select value={templateForm.position_type} onChange={e=>setTemplateForm({...templateForm,position_type:e.target.value})} className={input}><option value="swing">Swing</option><option value="day">Day</option><option value="scalp">Scalp</option><option value="position">Position</option></select>
                </div>
                <textarea value={templateForm.entry_rules} onChange={e=>setTemplateForm({...templateForm,entry_rules:e.target.value})} placeholder="Entry Rules..." className={`w-full ${input} h-16`} />
                <textarea value={templateForm.exit_rules} onChange={e=>setTemplateForm({...templateForm,exit_rules:e.target.value})} placeholder="Exit Rules..." className={`w-full ${input} h-16`} />
                <div className="flex gap-2">
                  <input value={templateForm.risk_pct} onChange={e=>setTemplateForm({...templateForm,risk_pct:e.target.value})} placeholder="Risk %" className={`w-24 ${input}`} />
                  <textarea value={templateForm.notes} onChange={e=>setTemplateForm({...templateForm,notes:e.target.value})} placeholder="Notes..." className={`flex-1 ${input}`} />
                </div>
                <button onClick={createTemplate} className={btn}>Save Template</button>
              </div>
            )}
            <div className="grid md:grid-cols-2 gap-3">
              {templates.map((t:any)=>(
                <div key={t.id} className={`border rounded-lg p-4 ${cardBg}`}>
                  <div className="flex justify-between items-start mb-2">
                    <div><span className={`text-xs font-bold ${headText}`}>{t.name}</span><span className={`text-[10px] px-1.5 py-0.5 ml-2 rounded ${dark?"bg-zinc-800 text-zinc-400":"bg-gray-100 text-gray-600"}`}>{t.strategy}</span></div>
                    <button onClick={()=>deleteTemplate(t.id)} className="text-red-400 text-xs hover:text-red-300">✕</button>
                  </div>
                  <div className="space-y-1 text-[10px]">
                    {t.entry_rules && <div className={bodyText}><span className="text-emerald-400 font-bold">ENTRY:</span> {t.entry_rules}</div>}
                    {t.exit_rules && <div className={bodyText}><span className="text-red-400 font-bold">EXIT:</span> {t.exit_rules}</div>}
                    <div className={dimText}>Risk: {t.risk_pct}% · Type: {t.position_type}</div>
                  </div>
                </div>
              ))}
            </div>
            {templates.length===0 && !showTemplateForm && <div className={`text-xs ${dimText}`}>No templates yet. Create one to standardize your trading approach.</div>}
          </div>
        )}

        {/* ── PEER BENCHMARKS ────────────────────────────────── */}
        {tab==="peers" && (
          <div className="space-y-4">
            <h2 className={`text-sm font-bold uppercase tracking-widest ${dimText2}`}>🏆 Peer Comparison & Benchmarks</h2>
            <button onClick={loadPeerBenchmarks} className={btn} disabled={peerLoading}>{peerLoading?"Loading...":"Load Benchmarks"}</button>
            {peerData && !peerData.error && (
              <div className="space-y-4">
                <div className={`border rounded-lg p-4 ${cardBg}`}>
                  <div className={`text-xs uppercase tracking-wider mb-3 ${dimText2}`}>Your Stats vs Benchmarks</div>
                  <div className="space-y-3">
                    {peerData.comparisons?.map((c:any,i:number)=>(
                      <div key={i}>
                        <div className="flex justify-between items-center mb-1">
                          <span className={`text-xs ${headText}`}>{c.metric}</span>
                          <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${c.grade==="A"?"bg-emerald-950/50 text-emerald-400 border border-emerald-800":c.grade==="B"?"bg-amber-950/50 text-amber-400 border border-amber-800":"bg-red-950/50 text-red-400 border border-red-800"}`}>{c.grade}</span>
                        </div>
                        <div className="flex items-center gap-3 text-[10px]">
                          <span className={dimText}>You: <span className="text-amber-400 font-bold">{c.your_value}</span></span>
                          <span className={dimText}>Avg: <span className={headText}>{c.benchmark_avg}</span></span>
                          <span className={dimText}>Top 10%: <span className="text-emerald-400">{c.top_10_pct}</span></span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                {peerData.overall_grade && (
                  <div className={`border rounded-lg p-4 text-center ${cardBg}`}>
                    <div className={`text-[10px] ${dimText} mb-1`}>Overall Grade</div>
                    <div className={`text-3xl font-bold ${peerData.overall_grade==="A"?"text-emerald-400":peerData.overall_grade==="B"?"text-amber-400":"text-red-400"}`}>{peerData.overall_grade}</div>
                    <p className={`text-xs ${bodyText} mt-2`}>{peerData.summary}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ── WEBHOOKS ────────────────────────────────────────── */}
        {tab==="webhooks" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className={`text-sm font-bold uppercase tracking-widest ${dimText2}`}>🔗 Discord/Telegram Webhooks</h2>
              <button onClick={()=>setShowWebhookForm(!showWebhookForm)} className={btn}>{showWebhookForm?"Cancel":"+ Add Webhook"}</button>
            </div>
            {showWebhookForm && (
              <div className={`border rounded-lg p-4 space-y-2 ${cardBg}`}>
                <div className="flex gap-2">
                  <select value={webhookForm.platform} onChange={e=>setWebhookForm({...webhookForm,platform:e.target.value})} className={`w-32 ${input}`}><option value="discord">Discord</option><option value="telegram">Telegram</option></select>
                  <input value={webhookForm.url} onChange={e=>setWebhookForm({...webhookForm,url:e.target.value})} placeholder="Webhook URL" className={`flex-1 ${input}`} />
                </div>
                <div className={`text-[10px] ${dimText}`}>Events:</div>
                <div className="flex gap-2 flex-wrap">
                  {["alert_triggered","trade_closed","earnings_alert","goal_reached","risk_alert"].map(evt=>(
                    <label key={evt} className={`flex items-center gap-1 text-[10px] ${bodyText} cursor-pointer`}>
                      <input type="checkbox" checked={webhookForm.events.includes(evt)} onChange={e=>{const evts=e.target.checked?[...webhookForm.events,evt]:webhookForm.events.filter(x=>x!==evt);setWebhookForm({...webhookForm,events:evts});}} />
                      {evt.replace(/_/g," ")}
                    </label>
                  ))}
                </div>
                <button onClick={createWebhook} className={btn}>Save Webhook</button>
              </div>
            )}
            <div className="space-y-2">
              {webhooks.map((w:any)=>(
                <div key={w.id} className={`border rounded-lg p-3 flex items-center justify-between ${cardBg}`}>
                  <div>
                    <span className={`text-xs font-bold ${headText}`}>{w.platform==="discord"?"🎮":"✈️"} {w.platform}</span>
                    <span className={`text-[10px] ml-2 ${dimText}`}>{w.url?.substring(0,50)}...</span>
                    <div className="flex gap-1 mt-1">{w.events?.map((e:string)=><span key={e} className={`text-[9px] px-1.5 py-0.5 rounded ${dark?"bg-zinc-800 text-zinc-500":"bg-gray-100 text-gray-500"}`}>{e}</span>)}</div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={()=>testWebhook(w.id)} className={btnOutline}>Test</button>
                  </div>
                </div>
              ))}
            </div>
            {webhooks.length===0 && !showWebhookForm && <div className={`text-xs ${dimText}`}>No webhooks configured. Add one to get notifications in Discord or Telegram.</div>}
          </div>
        )}

        {/* ── STRESS TEST ────────────────────────────────────── */}
        {tab==="stresstest" && (
          <div className="space-y-4">
            <div className={`text-xs uppercase tracking-wider ${dimText2}`}>💥 Portfolio Stress Test</div>
            <p className={`text-xs ${dimText}`}>Simulate how your portfolio would perform under historical crisis scenarios.</p>
            <button onClick={runStressTest} className={btn} disabled={stressLoading}>{stressLoading?"Running scenarios...":"Run Stress Test"}</button>
            {stressResult && !stressResult.error && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {stressResult.scenarios?.map((s:any,i:number)=>(
                    <div key={i} className={`border rounded-lg p-3 ${cardBg}`}>
                      <div className={`text-xs font-bold ${headText} mb-1`}>{s.scenario}</div>
                      <div className={`text-lg font-bold ${s.portfolio_impact<0?"text-red-400":"text-emerald-400"}`}>{s.portfolio_impact>=0?"+":""}{s.portfolio_impact?.toFixed(2)}%</div>
                      <div className={`text-[10px] ${dimText}`}>Estimated Loss: ${s.estimated_loss?.toLocaleString()}</div>
                      <div className={`text-[10px] ${dimText} mt-1`}>{s.description}</div>
                    </div>
                  ))}
                </div>
                {stressResult.worst_case && (
                  <div className={`border-2 border-red-800/50 rounded-lg p-4 bg-red-950/10`}>
                    <div className={`text-xs font-bold text-red-400 mb-1`}>⚠️ Worst Case: {stressResult.worst_case.scenario}</div>
                    <div className="text-red-300 text-sm">Portfolio Impact: {stressResult.worst_case.portfolio_impact?.toFixed(2)}% (${stressResult.worst_case.estimated_loss?.toLocaleString()})</div>
                  </div>
                )}
                {stressResult.portfolio_beta && <div className={`text-xs ${dimText}`}>Portfolio Beta: {stressResult.portfolio_beta?.toFixed(2)}</div>}
              </div>
            )}
            {stressResult?.error && <div className="text-xs text-red-400">{stressResult.error}</div>}
          </div>
        )}

        {/* ── SEASONALITY ────────────────────────────────────── */}
        {tab==="seasonality" && (
          <div className="space-y-4">
            <div className={`text-xs uppercase tracking-wider ${dimText2}`}>🌿 Seasonality Analysis</div>
            <div className="flex gap-2">
              <input value={seasonTicker} onChange={e=>setSeasonTicker(e.target.value.toUpperCase())} placeholder="TICKER" className={`w-28 ${input} uppercase`} onKeyDown={e=>e.key==="Enter"&&loadSeasonality()} />
              <button onClick={()=>loadSeasonality()} className={btn} disabled={seasonLoading}>{seasonLoading?"Loading...":"Analyze"}</button>
            </div>
            {seasonData && !seasonData.error && (
              <div className="space-y-4">
                <div className={`text-sm font-bold ${headText}`}>{seasonData.ticker} — Monthly Returns</div>
                {seasonData.monthly_returns && (
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={Object.entries(seasonData.monthly_returns).map(([m,v]:any)=>({month:["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"][parseInt(m)-1]||m,return_pct:v}))}>
                        <XAxis dataKey="month" tick={{fontSize:10,fill:dark?"#71717a":"#9ca3af"}} />
                        <YAxis tick={{fontSize:10,fill:dark?"#71717a":"#9ca3af"}} />
                        <Tooltip contentStyle={{background:dark?"#18181b":"#fff",border:`1px solid ${dark?"#3f3f46":"#e5e7eb"}`,fontSize:11}} />
                        <Bar dataKey="return_pct" name="Avg Return %">{Object.values(seasonData.monthly_returns).map((v:any,i:number)=>(<Cell key={i} fill={v>=0?"#10b981":"#ef4444"} />))}</Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
                {seasonData.best_months?.length > 0 && (
                  <div className="grid grid-cols-2 gap-3">
                    <div className={`border rounded-lg p-3 ${cardBg}`}>
                      <div className={`text-xs uppercase tracking-wider mb-1 ${dimText2}`}>Best Months</div>
                      {seasonData.best_months.map((m:any,i:number)=>(<div key={i} className="text-xs text-emerald-400">{m.month}: +{m.avg_return?.toFixed(2)}%</div>))}
                    </div>
                    <div className={`border rounded-lg p-3 ${cardBg}`}>
                      <div className={`text-xs uppercase tracking-wider mb-1 ${dimText2}`}>Worst Months</div>
                      {seasonData.worst_months?.map((m:any,i:number)=>(<div key={i} className="text-xs text-red-400">{m.month}: {m.avg_return?.toFixed(2)}%</div>))}
                    </div>
                  </div>
                )}
              </div>
            )}
            {seasonData?.error && <div className="text-xs text-red-400">{seasonData.error}</div>}
          </div>
        )}

        {/* ── OPTIONS SKEW ────────────────────────────────────── */}
        {tab==="skew" && (
          <div className="space-y-4">
            <div className={`text-xs uppercase tracking-wider ${dimText2}`}>📐 Options Volatility Skew</div>
            <div className="flex gap-2">
              <input value={skewTicker} onChange={e=>setSkewTicker(e.target.value.toUpperCase())} placeholder="TICKER" className={`w-28 ${input} uppercase`} onKeyDown={e=>e.key==="Enter"&&loadOptionsSkew()} />
              <button onClick={()=>loadOptionsSkew()} className={btn} disabled={skewLoading}>{skewLoading?"Loading...":"Load Skew"}</button>
            </div>
            {skewData && !skewData.error && (
              <div className="space-y-4">
                <div className={`text-sm font-bold ${headText}`}>{skewData.ticker} IV Skew</div>
                {skewData.skew_data?.length > 0 && (
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={skewData.skew_data}>
                        <XAxis dataKey="strike" tick={{fontSize:10,fill:dark?"#71717a":"#9ca3af"}} />
                        <YAxis tick={{fontSize:10,fill:dark?"#71717a":"#9ca3af"}} />
                        <Tooltip contentStyle={{background:dark?"#18181b":"#fff",border:`1px solid ${dark?"#3f3f46":"#e5e7eb"}`,fontSize:11}} />
                        <Line type="monotone" dataKey="call_iv" stroke="#10b981" dot={false} name="Call IV" />
                        <Line type="monotone" dataKey="put_iv" stroke="#ef4444" dot={false} name="Put IV" />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                )}
                <div className="grid grid-cols-3 gap-3">
                  <div className={`border rounded-lg p-3 text-center ${cardBg}`}>
                    <div className={`text-[10px] ${dimText}`}>Put Skew</div>
                    <div className={`text-sm font-bold ${headText}`}>{skewData.put_skew?.toFixed(2)}%</div>
                  </div>
                  <div className={`border rounded-lg p-3 text-center ${cardBg}`}>
                    <div className={`text-[10px] ${dimText}`}>ATM IV</div>
                    <div className={`text-sm font-bold ${headText}`}>{skewData.atm_iv?.toFixed(1)}%</div>
                  </div>
                  <div className={`border rounded-lg p-3 text-center ${cardBg}`}>
                    <div className={`text-[10px] ${dimText}`}>Call Skew</div>
                    <div className={`text-sm font-bold ${headText}`}>{skewData.call_skew?.toFixed(2)}%</div>
                  </div>
                </div>
                {skewData.interpretation && <p className={`text-xs ${bodyText} border-l-2 border-amber-400/30 pl-3`}>{skewData.interpretation}</p>}
              </div>
            )}
            {skewData?.error && <div className="text-xs text-red-400">{skewData.error}</div>}
          </div>
        )}

        {/* ── ATTRIBUTION ────────────────────────────────────── */}
        {tab==="attribution" && (
          <div className="space-y-4">
            <div className={`text-xs uppercase tracking-wider ${dimText2}`}>🎯 Performance Attribution</div>
            <p className={`text-xs ${dimText}`}>Break down your portfolio returns by source — what drove your performance.</p>
            <button onClick={loadAttribution} className={btn} disabled={attribLoading}>{attribLoading?"Analyzing...":"Load Attribution"}</button>
            {attribData && !attribData.error && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className={`border rounded-lg p-3 text-center ${cardBg}`}><div className={`text-[10px] ${dimText}`}>Total Return</div><div className={`text-lg font-bold ${(attribData.total_return||0)>=0?"text-emerald-400":"text-red-400"}`}>{attribData.total_return>=0?"+":""}{attribData.total_return?.toFixed(2)}%</div></div>
                  <div className={`border rounded-lg p-3 text-center ${cardBg}`}><div className={`text-[10px] ${dimText}`}>Alpha</div><div className={`text-lg font-bold text-violet-400`}>{attribData.alpha?.toFixed(2)}%</div></div>
                  <div className={`border rounded-lg p-3 text-center ${cardBg}`}><div className={`text-[10px] ${dimText}`}>Benchmark</div><div className={`text-lg font-bold ${dimText}`}>{attribData.benchmark_return?.toFixed(2)}%</div></div>
                  <div className={`border rounded-lg p-3 text-center ${cardBg}`}><div className={`text-[10px] ${dimText}`}>Positions</div><div className={`text-lg font-bold ${headText}`}>{attribData.position_count || 0}</div></div>
                </div>
                {attribData.attribution_by_ticker && (
                  <div className={`border rounded-lg p-3 ${cardBg}`}>
                    <div className={`text-xs uppercase tracking-wider mb-2 ${dimText2}`}>By Position</div>
                    <div className="space-y-1">
                      {Object.entries(attribData.attribution_by_ticker).sort(([,a]:any,[,b]:any)=>(b?.contribution||0)-(a?.contribution||0)).map(([ticker,data]:any)=>(
                        <div key={ticker} className="flex justify-between text-xs py-1">
                          <span className={`font-bold ${headText}`}>{ticker}</span>
                          <div className="flex gap-4">
                            <span className={dimText}>Wt: {(data?.weight*100)?.toFixed(1)}%</span>
                            <span className={data?.return>=0?"text-emerald-400":"text-red-400"}>{data?.return>=0?"+":""}{data?.return?.toFixed(2)}%</span>
                            <span className={data?.contribution>=0?"text-emerald-400":"text-red-400"}>Contrib: {data?.contribution>=0?"+":""}{data?.contribution?.toFixed(2)}%</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
            {attribData?.error && <div className="text-xs text-red-400">{attribData.error}</div>}
          </div>
        )}

        {/* ── RISK OF RUIN ────────────────────────────────────── */}
        {tab==="riskruin" && (
          <div className="space-y-4 max-w-2xl">
            <div className={`text-xs uppercase tracking-wider ${dimText2}`}>☠️ Risk of Ruin Calculator</div>
            <p className={`text-xs ${dimText}`}>Monte Carlo simulation to estimate your probability of catastrophic loss.</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              <div><label className={`text-[10px] ${dimText}`}>Win Rate %</label><input value={rorForm.win_rate} onChange={e=>setRorForm({...rorForm,win_rate:e.target.value})} className={`w-full ${input}`} type="number" /></div>
              <div><label className={`text-[10px] ${dimText}`}>Avg Win %</label><input value={rorForm.avg_win} onChange={e=>setRorForm({...rorForm,avg_win:e.target.value})} className={`w-full ${input}`} type="number" /></div>
              <div><label className={`text-[10px] ${dimText}`}>Avg Loss %</label><input value={rorForm.avg_loss} onChange={e=>setRorForm({...rorForm,avg_loss:e.target.value})} className={`w-full ${input}`} type="number" /></div>
              <div><label className={`text-[10px] ${dimText}`}>Risk/Trade %</label><input value={rorForm.risk_per_trade} onChange={e=>setRorForm({...rorForm,risk_per_trade:e.target.value})} className={`w-full ${input}`} type="number" /></div>
              <div><label className={`text-[10px] ${dimText}`}>Ruin Threshold %</label><input value={rorForm.ruin_threshold} onChange={e=>setRorForm({...rorForm,ruin_threshold:e.target.value})} className={`w-full ${input}`} type="number" /></div>
            </div>
            <button onClick={runRiskOfRuin} className={btn} disabled={rorLoading}>{rorLoading?"Simulating...":"Run Simulation"}</button>
            {rorResult && !rorResult.error && (
              <div className="space-y-3">
                <div className="grid grid-cols-3 gap-3">
                  <div className={`border rounded-lg p-4 text-center ${cardBg}`}>
                    <div className={`text-[10px] ${dimText}`}>Risk of Ruin</div>
                    <div className={`text-2xl font-bold ${(rorResult.risk_of_ruin||0)>25?"text-red-400":(rorResult.risk_of_ruin||0)>10?"text-amber-400":"text-emerald-400"}`}>{rorResult.risk_of_ruin?.toFixed(1)}%</div>
                  </div>
                  <div className={`border rounded-lg p-4 text-center ${cardBg}`}>
                    <div className={`text-[10px] ${dimText}`}>Expected Value</div>
                    <div className={`text-2xl font-bold ${(rorResult.expected_value||0)>=0?"text-emerald-400":"text-red-400"}`}>{rorResult.expected_value>=0?"+":""}{rorResult.expected_value?.toFixed(3)}</div>
                  </div>
                  <div className={`border rounded-lg p-4 text-center ${cardBg}`}>
                    <div className={`text-[10px] ${dimText}`}>Kelly Criterion</div>
                    <div className={`text-2xl font-bold text-violet-400`}>{rorResult.kelly_pct?.toFixed(1)}%</div>
                  </div>
                </div>
                {rorResult.equity_paths?.length > 0 && (
                  <div className="h-48">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={rorResult.equity_paths[0]?.map((_:any,i:number)=>({trade:i,...Object.fromEntries(rorResult.equity_paths.slice(0,10).map((p:any[],j:number)=>[`path${j}`,p[i]]))}))}>
                        <XAxis dataKey="trade" tick={{fontSize:9,fill:dark?"#71717a":"#9ca3af"}} />
                        <YAxis tick={{fontSize:9,fill:dark?"#71717a":"#9ca3af"}} />
                        {rorResult.equity_paths.slice(0,10).map((_:any,j:number)=>(<Line key={j} type="monotone" dataKey={`path${j}`} stroke={`hsl(${j*36},70%,60%)`} dot={false} strokeWidth={1} opacity={0.5} />))}
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                )}
                {rorResult.recommendation && <p className={`text-xs ${bodyText} border-l-2 border-amber-400/30 pl-3`}>💡 {rorResult.recommendation}</p>}
              </div>
            )}
            {rorResult?.error && <div className="text-xs text-red-400">{rorResult.error}</div>}
          </div>
        )}

        {/* ── EQUITY CURVE ────────────────────────────────────── */}
        {tab==="eqcurve" && (
          <div className="space-y-4">
            <div className={`text-xs uppercase tracking-wider ${dimText2}`}>📈 Equity Curve</div>
            <p className={`text-xs ${dimText}`}>Track your portfolio value over time based on closed trades.</p>
            <button onClick={loadEquityCurve} className={btn} disabled={eqLoading}>{eqLoading?"Loading...":"Load Equity Curve"}</button>
            {eqCurve && !eqCurve.error && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className={`border rounded-lg p-3 text-center ${cardBg}`}><div className={`text-[10px] ${dimText}`}>Final Equity</div><div className={`text-lg font-bold ${headText}`}>${eqCurve.final_equity?.toLocaleString()}</div></div>
                  <div className={`border rounded-lg p-3 text-center ${cardBg}`}><div className={`text-[10px] ${dimText}`}>Total Return</div><div className={`text-lg font-bold ${(eqCurve.total_return_pct||0)>=0?"text-emerald-400":"text-red-400"}`}>{eqCurve.total_return_pct>=0?"+":""}{eqCurve.total_return_pct?.toFixed(2)}%</div></div>
                  <div className={`border rounded-lg p-3 text-center ${cardBg}`}><div className={`text-[10px] ${dimText}`}>Max Drawdown</div><div className="text-lg font-bold text-red-400">{eqCurve.max_drawdown_pct?.toFixed(2)}%</div></div>
                  <div className={`border rounded-lg p-3 text-center ${cardBg}`}><div className={`text-[10px] ${dimText}`}>Total Trades</div><div className={`text-lg font-bold ${headText}`}>{eqCurve.total_trades}</div></div>
                </div>
                {eqCurve.curve?.length > 0 && (
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={eqCurve.curve}>
                        <XAxis dataKey="date" tick={{fontSize:9,fill:dark?"#71717a":"#9ca3af"}} />
                        <YAxis tick={{fontSize:10,fill:dark?"#71717a":"#9ca3af"}} />
                        <Tooltip contentStyle={{background:dark?"#18181b":"#fff",border:`1px solid ${dark?"#3f3f46":"#e5e7eb"}`,fontSize:11}} />
                        <Area type="monotone" dataKey="equity" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.15} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>
            )}
            {eqCurve?.error && <div className="text-xs text-red-400">{eqCurve.error}</div>}
          </div>
        )}

        {/* ── LEADERBOARD ────────────────────────────────────── */}
        {tab==="leaderboard" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className={`text-xs uppercase tracking-wider ${dimText2}`}>🏅 Trader Leaderboard</div>
              <button onClick={loadLeaderboard} className={btn} disabled={lbLoading}>{lbLoading?"Loading...":"Refresh"}</button>
            </div>
            {leaderboard && !leaderboard.error && (
              <div>
                <table className={`w-full text-xs ${bodyText}`}>
                  <thead><tr className={`text-[10px] uppercase ${dimText2}`}><th className="text-left py-2 px-2">#</th><th className="text-left py-2">Trader</th><th className="text-right py-2">Win Rate</th><th className="text-right py-2">Total P&L</th><th className="text-right py-2">Trades</th><th className="text-right py-2">Streak</th><th className="text-right py-2 px-2">Score</th></tr></thead>
                  <tbody>
                    {leaderboard.rankings?.map((r:any,i:number)=>(
                      <tr key={i} className={`border-t ${borderDim2} hover:${dark?"bg-zinc-900":"bg-gray-50"}`}>
                        <td className="py-2 px-2"><span className={`font-bold ${i===0?"text-amber-400":i===1?"text-zinc-400":i===2?"text-amber-700":dimText}`}>{i===0?"🥇":i===1?"🥈":i===2?"🥉":i+1}</span></td>
                        <td className={`font-bold ${headText}`}>{r.name}</td>
                        <td className="text-right">{r.win_rate?.toFixed(1)}%</td>
                        <td className={`text-right font-bold ${(r.total_pnl||0)>=0?"text-emerald-400":"text-red-400"}`}>${r.total_pnl?.toLocaleString()}</td>
                        <td className="text-right">{r.total_trades}</td>
                        <td className="text-right">{r.current_streak>=0?`🔥${r.current_streak}`:`❄️${Math.abs(r.current_streak)}`}</td>
                        <td className="text-right px-2 font-bold text-amber-400">{r.score?.toFixed(0)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {(!leaderboard.rankings || leaderboard.rankings.length===0) && <div className={`text-xs text-center py-8 ${dimText}`}>No leaderboard data yet. Close some trades to build rankings.</div>}
              </div>
            )}
            {!leaderboard && !lbLoading && <div className={`text-xs ${dimText}`}>Click Refresh to load the leaderboard.</div>}
          </div>
        )}

        {/* ── REPORT ────────────────────────────────────────── */}
        {tab==="report" && (
          <div className="space-y-4">
            <div className={`text-xs uppercase tracking-wider ${dimText2}`}>📄 Performance Reports</div>
            <div className="flex gap-2 items-center">
              <select value={reportType} onChange={e=>setReportType(e.target.value)} className={`${input} w-36`}>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="quarterly">Quarterly</option>
              </select>
              <button onClick={()=>generateReport()} className={btn} disabled={reportLoading}>{reportLoading?"Generating...":"Generate Report"}</button>
            </div>
            {reportData && !reportData.error && (
              <div className="space-y-4">
                <div className={`border rounded-lg p-4 ${cardBg}`}>
                  <div className={`text-sm font-bold ${headText} mb-3`}>{reportData.title || `${reportType.charAt(0).toUpperCase()+reportType.slice(1)} Report`}</div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                    <div><div className={`text-[10px] ${dimText}`}>Period P&L</div><div className={`text-lg font-bold ${(reportData.total_pnl||0)>=0?"text-emerald-400":"text-red-400"}`}>${reportData.total_pnl?.toLocaleString()}</div></div>
                    <div><div className={`text-[10px] ${dimText}`}>Win Rate</div><div className={`text-lg font-bold ${headText}`}>{reportData.win_rate?.toFixed(1)}%</div></div>
                    <div><div className={`text-[10px] ${dimText}`}>Trades</div><div className={`text-lg font-bold ${headText}`}>{reportData.total_trades}</div></div>
                    <div><div className={`text-[10px] ${dimText}`}>Profit Factor</div><div className={`text-lg font-bold text-amber-400`}>{reportData.profit_factor?.toFixed(2)}</div></div>
                  </div>
                  {reportData.daily_pnl?.length > 0 && (
                    <div className="h-48">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={reportData.daily_pnl}>
                          <XAxis dataKey="date" tick={{fontSize:9,fill:dark?"#71717a":"#9ca3af"}} />
                          <YAxis tick={{fontSize:9,fill:dark?"#71717a":"#9ca3af"}} />
                          <Tooltip contentStyle={{background:dark?"#18181b":"#fff",border:`1px solid ${dark?"#3f3f46":"#e5e7eb"}`,fontSize:11}} />
                          <Bar dataKey="pnl" name="Daily P&L">{reportData.daily_pnl.map((d:any,i:number)=>(<Cell key={i} fill={d.pnl>=0?"#10b981":"#ef4444"} />))}</Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </div>
                {reportData.top_trades?.length > 0 && (
                  <div className={`border rounded-lg p-3 ${cardBg}`}>
                    <div className={`text-xs uppercase tracking-wider mb-2 ${dimText2}`}>Top Trades</div>
                    {reportData.top_trades.map((t:any,i:number)=>(
                      <div key={i} className={`flex justify-between text-xs py-1 border-b last:border-0 ${borderDim2}`}>
                        <span className={`font-bold ${headText}`}>{t.ticker}</span>
                        <span className={t.pnl>=0?"text-emerald-400":"text-red-400"}>{t.pnl>=0?"+":""}${t.pnl?.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                )}
                {reportData.insights?.length > 0 && (
                  <div className={`border rounded-lg p-3 ${cardBg}`}>
                    <div className={`text-xs uppercase tracking-wider mb-2 ${dimText2}`}>Insights</div>
                    {reportData.insights.map((ins:string,i:number)=>(<div key={i} className={`text-xs ${bodyText} py-0.5`}>💡 {ins}</div>))}
                  </div>
                )}
              </div>
            )}
            {reportData?.error && <div className="text-xs text-red-400">{reportData.error}</div>}
          </div>
        )}

        {/* ── SOCIAL HUB ───────────────────────────────────── */}
        {tab==="social" && (
          <div className="space-y-4">
            <div className={`text-xs uppercase tracking-wider ${dimText2}`}>💬 Community Hub</div>

            {/* Sub-tab buttons */}
            <div className="flex gap-2">
              {(["discord","twitter","substack","serenity","signals"] as const).map(st=>(
                <button key={st} onClick={()=>setSocialSubTab(st)} className={`relative px-4 py-1.5 text-xs rounded-lg font-bold uppercase tracking-wider transition-all ${socialSubTab===st?(st==="discord"?"bg-blue-700 text-white":st==="twitter"?"bg-sky-600 text-white":st==="serenity"?"bg-violet-600 text-white":st==="signals"?"bg-amber-600 text-white":"bg-orange-600 text-white"):btnOutline}`}>
                  {st==="discord"?"Discord":st==="twitter"?"Twitter / X":st==="serenity"?"Serenity":st==="signals"?"Signals":"Substack"}
                  {st==="signals" && signalNewCount > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] flex items-center justify-center text-[9px] font-bold bg-amber-500 text-white rounded-full px-1 shadow-lg animate-pulse">{signalNewCount}</span>
                  )}
                </button>
              ))}
            </div>

            {/* ── Discord Sub-tab ── */}
            {socialSubTab==="discord" && (
              <div className="space-y-4">
                {/* Mispriced Assets Server Embed */}
                <div className={`border rounded-lg p-4 ${cardBg}`}>
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <div className={`text-sm font-bold ${headText}`}>Mispriced Assets</div>
                      <div className={`text-[10px] mt-0.5 ${dimText}`}>Live Discord server feed</div>
                    </div>
                    <a href="https://discord.com/channels/1468333686884663326/1468333686884663329" target="_blank" rel="noreferrer" className={`text-[10px] px-2.5 py-1 rounded-md transition-colors ${dark?"text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800":"text-zinc-500 hover:text-zinc-700 hover:bg-zinc-100"}`}>Open in Discord</a>
                  </div>
                  <iframe
                    src={`https://discord.com/widget?id=1468333686884663326&theme=${dark?"dark":"light"}`}
                    width="100%"
                    height="500"
                    sandbox="allow-popups allow-popups-to-escape-sandbox allow-same-origin allow-scripts"
                    className="rounded-lg border-0"
                    title="Mispriced Assets Discord"
                  />
                  <div className={`text-[10px] mt-2 ${dimText}`}>If the widget doesn&apos;t load, the server admin needs to enable the Server Widget in Discord settings.</div>
                </div>

                {/* Bot Feed (when bot is invited) */}
                {discordFeed.length > 0 && (
                  <div className={`border rounded-lg p-4 ${cardBg}`}>
                    <div className={`text-xs uppercase tracking-wider mb-3 ${dimText2}`}>Bot Channel Feed</div>
                    <div className="space-y-2 max-h-[400px] overflow-y-auto scrollbar-hide">
                      {discordFeed.map((m:any)=>(
                        <div key={m.id} className={`border-b pb-2 last:border-0 ${borderDim2}`}>
                          <div className="flex items-center gap-2 mb-0.5">
                            {m.author?.avatar_url && <img src={m.author.avatar_url} className="w-5 h-5 rounded-full" alt="" />}
                            <span className="text-xs font-bold text-amber-400">{m.author?.username || "Unknown"}</span>
                            <span className={`text-[9px] ${dimText}`}>{m.timestamp ? new Date(m.timestamp).toLocaleString() : ""}</span>
                          </div>
                          <div className={`text-xs ${bodyText} pl-7`}>{m.content}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Presence */}
                {discordPresence && !discordPresence.error && (
                  <div className={`border rounded-lg p-4 ${cardBg}`}>
                    <div className={`text-xs uppercase tracking-wider mb-3 ${dimText2}`}>Your Presence</div>
                    <div className="flex items-center gap-3">
                      {discordPresence.avatar_url && <img src={discordPresence.avatar_url} className="w-10 h-10 rounded-full" alt="avatar" />}
                      <div>
                        <div className={`text-sm font-bold ${headText}`}>{discordPresence.username || "Unknown"}</div>
                        <div className="flex items-center gap-1.5">
                          <span className={`w-2.5 h-2.5 rounded-full ${discordPresence.status==="online"?"bg-emerald-400":discordPresence.status==="idle"?"bg-yellow-400":discordPresence.status==="dnd"?"bg-red-400":"bg-zinc-500"}`}></span>
                          <span className={`text-[10px] capitalize ${dimText}`}>{discordPresence.status || "offline"}</span>
                        </div>
                      </div>
                    </div>
                    {discordPresence.spotify && (
                      <div className={`mt-3 border rounded-lg p-2.5 flex items-center gap-2.5 ${dark?"bg-emerald-950/20 border-emerald-800/30":"bg-emerald-50 border-emerald-200"}`}>
                        {discordPresence.spotify.album_art_url && <img src={discordPresence.spotify.album_art_url} className="w-10 h-10 rounded" alt="album" />}
                        <div>
                          <div className={`text-xs font-bold text-emerald-400`}>🎵 {discordPresence.spotify.song}</div>
                          <div className={`text-[10px] ${dimText}`}>{discordPresence.spotify.artist}</div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* ── Twitter / X Sub-tab ── */}
            {socialSubTab==="twitter" && (
              <div className="space-y-4">
                {/* Header with poll button */}
                <div className="flex items-center justify-between">
                  <div>
                    <div className={`text-sm font-bold ${headText}`}>Following Feed Intelligence</div>
                    <div className={`text-[10px] ${dimText}`}>AI-curated positions from your followed accounts (last 14 days){xLastPolled ? ` \u00B7 Last polled ${xLastPolled}` : ""}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-[9px] ${dimText}`}>{xTimeline.length} signals · {xWatchlist.length} tickers</span>
                  </div>
                </div>

                {/* Sub-navigation */}
                <div className="flex gap-1 overflow-x-auto pb-1 scrollbar-hide">
                  {([
                    ["watchlist","📋 Watchlist"],["pnl","📊 P&L"],["convictions","🎯 Convictions"],["themes","🧩 Themes"],["brief","📰 Brief"],
                    ["overlap","🔄 Overlap"],["earnings","📅 Earnings"],["heatmap","🗺️ Sectors"],["darkpool","🕵️ Dark Pool"],
                    ["timeline","📡 Timeline"],["accounts","⚡ Feeds"]
                  ] as const).map(([k,label])=>(
                    <button key={k} onClick={()=>setXSubView(k as any)} className={`text-[10px] px-3 py-1.5 rounded-md font-semibold whitespace-nowrap transition-all ${xSubView===k?(dark?"bg-sky-600 text-white":"bg-sky-500 text-white"):btnOutline}`}>{label}</button>
                  ))}
                </div>

                {/* ── Curated Watchlist View ── */}
                {xSubView==="watchlist" && (
                  <div className="space-y-3">
                  <div className={`border rounded-lg ${cardBg}`}>
                    <div className={`px-4 py-3 border-b ${borderDim} flex items-center justify-between`}>
                      <div className={`text-xs uppercase tracking-wider font-bold ${dimText2}`}>Curated Watchlist from X</div>
                      <div className={`text-[10px] ${dimText}`}>{xWatchlist.length} tickers tracked</div>
                    </div>
                    {xWatchlistLoading && xWatchlist.length===0 ? (
                      <div className={`p-8 text-center text-xs ${dimText}`}>Loading watchlist...</div>
                    ) : xWatchlist.length > 0 ? (
                      <div className="divide-y" style={{borderColor: dark?"#27272a":"#e4e4e7"}}>
                        {xWatchlist.map((w:any,i:number)=>(
                          <div key={w.ticker} className={`px-4 py-3 ${dark?"hover:bg-zinc-800/50":"hover:bg-zinc-50"} transition-colors`}>
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className={`text-sm font-bold font-mono ${headText}`}>{w.ticker}</span>
                                  <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase ${
                                    w.action==="BUY"?(dark?"bg-emerald-900/40 text-emerald-400":"bg-emerald-50 text-emerald-700"):
                                    w.action==="SELL"?(dark?"bg-red-900/40 text-red-400":"bg-red-50 text-red-700"):
                                    w.action==="WATCH"?(dark?"bg-amber-900/40 text-amber-400":"bg-amber-50 text-amber-700"):
                                    (dark?"bg-zinc-800 text-zinc-400":"bg-zinc-100 text-zinc-600")
                                  }`}>{w.action}</span>
                                  {w.serenity_mentioned && <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold ${dark?"bg-violet-900/40 text-violet-400":"bg-violet-50 text-violet-700"}`}>Serenity</span>}
                                  <span className={`text-[9px] ${dimText}`}>{w.signal_count} signal{w.signal_count!==1?"s":""}</span>
                                </div>
                                <div className={`text-xs ${bodyText} leading-relaxed`}>{w.thesis}</div>
                                <div className="flex items-center gap-3 mt-1.5">
                                  {w.entry_target && <span className={`text-[10px] ${dimText}`}>Entry: <span className={`font-mono ${headText}`}>${w.entry_target}</span></span>}
                                  {w.price_target && <span className={`text-[10px] ${dimText}`}>Target: <span className="font-mono text-emerald-400">${w.price_target}</span></span>}
                                  {w.stop_loss && <span className={`text-[10px] ${dimText}`}>Stop: <span className="font-mono text-red-400">${w.stop_loss}</span></span>}
                                  <span className={`text-[10px] ${dimText}`}>Confidence: <span className={`font-mono ${w.avg_confidence>=0.7?"text-emerald-400":w.avg_confidence>=0.4?"text-amber-400":"text-zinc-500"}`}>{Math.round(w.avg_confidence*100)}%</span></span>
                                </div>
                                <div className="flex gap-1 mt-1.5 flex-wrap">
                                  {w.sources?.map((s:string)=>(
                                    <span key={s} className={`text-[9px] px-1.5 py-0.5 rounded ${dark?"bg-zinc-800 text-zinc-500":"bg-zinc-100 text-zinc-500"}`}>@{s}</span>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className={`p-4`}>
                        <div className={`text-xs ${dimText} mb-3 text-center`}>No signals yet. Paste tweets below to build your watchlist.</div>
                      </div>
                    )}
                  </div>

                  {/* Paste Posts Box */}
                  <div className={`border rounded-lg ${cardBg}`}>
                    <div className={`px-4 py-2.5 border-b ${borderDim} flex items-center justify-between`}>
                      <div className={`text-xs uppercase tracking-wider font-bold ${dimText2}`}>Paste Posts</div>
                      <div className={`text-[9px] ${dimText}`}>Separate posts with blank lines — @handles auto-detected</div>
                    </div>
                    <div className="p-3">
                      <textarea
                        value={xPasteText}
                        onChange={e => setXPasteText(e.target.value)}
                        placeholder={"@Serenity $COHR looking strong above $95, targeting $110. Stop at $88.\n\n@unusual_whales Large call sweep on $NVDA 06/20 $140C for $2.1M\n\n@Mr_Derivatives $SPY puts printing, bearish flow all day"}
                        rows={6}
                        className={`w-full text-xs px-3 py-2 rounded-md resize-none font-mono ${inputCls}`}
                      />
                      <div className="flex items-center justify-between mt-2">
                        <div className={`text-[10px] ${dimText}`}>
                          {xParseResult && <span className={xParseResult.includes("Error") ? "text-red-400" : "text-emerald-400"}>{xParseResult}</span>}
                        </div>
                        <button onClick={parseXPosts} disabled={xParsing || !xPasteText.trim()} className={btn}>
                          {xParsing ? "Parsing with AI..." : "Parse & Add to Watchlist"}
                        </button>
                      </div>
                    </div>
                  </div>
                  </div>
                )}

                {/* ── Signal Timeline View ── */}
                {xSubView==="timeline" && (
                  <div className={`border rounded-lg ${cardBg}`}>
                    <div className={`px-4 py-3 border-b ${borderDim} flex items-center justify-between`}>
                      <div className={`text-xs uppercase tracking-wider font-bold ${dimText2}`}>Signal Timeline</div>
                      <div className={`text-[10px] ${dimText}`}>{xTimeline.length} signals</div>
                    </div>
                    {xTimelineLoading && xTimeline.length===0 ? (
                      <div className={`p-8 text-center text-xs ${dimText}`}>Loading timeline...</div>
                    ) : xTimeline.length > 0 ? (
                      <div className="divide-y max-h-[700px] overflow-y-auto scrollbar-hide" style={{borderColor: dark?"#27272a":"#e4e4e7"}}>
                        {xTimeline.map((sig:any)=>(
                          <div key={sig.id} className={`px-4 py-2.5 ${dark?"hover:bg-zinc-800/50":"hover:bg-zinc-50"} transition-colors`}>
                            <div className="flex items-center gap-2 mb-1">
                              <span className={`text-[10px] font-bold ${sig.priority===0?"text-violet-400":sig.priority===1?"text-sky-400":dimText}`}>@{sig.source}</span>
                              <span className={`text-[10px] ${dimText}`}>{sig.source_label}</span>
                              <span className={`text-[9px] font-mono font-bold ${headText}`}>${sig.ticker}</span>
                              <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase ${
                                sig.action==="BUY"?(dark?"bg-emerald-900/40 text-emerald-400":"bg-emerald-50 text-emerald-700"):
                                sig.action==="SELL"?(dark?"bg-red-900/40 text-red-400":"bg-red-50 text-red-700"):
                                (dark?"bg-zinc-800 text-zinc-400":"bg-zinc-100 text-zinc-500")
                              }`}>{sig.action}</span>
                              <span className={`text-[9px] ml-auto ${dimText}`}>{sig.timestamp ? new Date(sig.timestamp).toLocaleDateString() : ""}</span>
                            </div>
                            <div className={`text-[11px] ${bodyText} leading-relaxed`}>{sig.thesis}</div>
                            {sig.url && <a href={sig.url} target="_blank" rel="noreferrer" className="text-[9px] text-sky-500 hover:underline mt-0.5 inline-block">View on X</a>}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className={`p-8 text-center`}>
                        <div className={`text-xs ${dimText} mb-3`}>No signals in timeline yet. Click &quot;Scan Feeds&quot; to start.</div>
                        <button onClick={pollFollowingFeed} disabled={xPolling} className={btn}>{xPolling?"Scanning...":"Scan Now"}</button>
                      </div>
                    )}
                  </div>
                )}

                {/* ── Live Feeds View (individual account embeds) ── */}
                {xSubView==="accounts" && (
                  <div className="space-y-4">
                    <div className={`border rounded-lg p-4 ${cardBg}`}>
                      <div className={`text-xs uppercase tracking-wider mb-3 ${dimText2}`}>View Account Timeline</div>
                      <div className="flex gap-1 flex-wrap mb-3">
                        {[
                          {handle:"unusual_whales",label:"Unusual Whales"},
                          {handle:"DeItaone",label:"Walter Bloomberg"},
                          {handle:"zaborskitrading",label:"Zaborski"},
                          {handle:"jimcramer",label:"Jim Cramer"},
                          {handle:"elikidesign",label:"Eli Ki"},
                          {handle:"chaaborski",label:"ChaBorski"},
                          {handle:"Mr_Derivatives",label:"Mr. Derivatives"},
                          {handle:"OptionsHawk",label:"Options Hawk"},
                          {handle:"traborski",label:"TraBorski"},
                          {handle:"aleaboreddit",label:"Serenity"},
                          {handle:"MispricedAssets",label:"Mispriced Assets"},
                        ].map(a => (
                          <button key={a.handle} onClick={() => setXFollowingView(xFollowingView===a.handle?"":a.handle)} className={`text-[10px] px-2.5 py-1 rounded-md transition-all ${xFollowingView === a.handle ? (dark ? "bg-sky-500/15 text-sky-400 border border-sky-500/50" : "bg-sky-50 text-sky-600 border border-sky-300") : `border ${dark ? "border-zinc-800 text-zinc-500 hover:text-zinc-300 hover:border-zinc-600" : "border-zinc-200 text-zinc-500 hover:text-zinc-700 hover:border-zinc-400"}`}`}>{a.label}</button>
                        ))}
                      </div>
                      {xFollowingView ? (
                        <a key={`following-${xFollowingView}-${dark}`} className="twitter-timeline" data-theme={dark?"dark":"light"} data-height="500" data-chrome="noheader nofooter noborders transparent" href={`https://twitter.com/${xFollowingView}`}>Loading @{xFollowingView}...</a>
                      ) : (
                        <div className={`text-xs ${dimText} py-6 text-center`}>Select an account above to view their timeline</div>
                      )}
                    </div>

                    {/* Ticker search */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className={`border rounded-lg p-4 ${cardBg}`}>
                        <div className={`text-xs uppercase tracking-wider mb-2 ${dimText2}`}>Photonics Twitter</div>
                        <div className="flex gap-1 flex-wrap mb-3">
                          {["COHR","CIEN","MRVL","CRDO","POET","LWLG","AAOI","AEHR"].map(t => (
                            <button key={t} onClick={() => setTwitterSearchTicker(t)} className={`text-[10px] px-2 py-1 rounded-md font-mono transition-all ${twitterSearchTicker === t ? (dark ? "bg-blue-500/15 text-blue-400 border border-blue-500/50" : "bg-blue-50 text-blue-700 border border-blue-400") : `border ${dark ? "border-zinc-800 text-zinc-500 hover:text-zinc-300" : "border-zinc-200 text-zinc-500 hover:text-zinc-700"}`}`}>${t}</button>
                          ))}
                        </div>
                        {twitterSearchTicker && (
                          <a key={`photonics-search-${twitterSearchTicker}-${dark}`} className="twitter-timeline" data-theme={dark?"dark":"light"} data-height="350" data-chrome="noheader nofooter noborders transparent" href={`https://twitter.com/search?q=%24${twitterSearchTicker}%20photonics%20OR%20optics%20OR%20semiconductor&f=live`}>Loading...</a>
                        )}
                      </div>
                      <div className={`border rounded-lg p-4 ${cardBg}`}>
                        <div className={`text-xs uppercase tracking-wider mb-2 ${dimText2}`}>Stock Search</div>
                        <div className="flex gap-2 mb-3">
                          <input value={twitterSearchTicker} onChange={e => setTwitterSearchTicker(e.target.value.toUpperCase())} placeholder="Ticker" className={`w-24 ${input} font-mono uppercase`} />
                          {["SPY","QQQ","NVDA","AAPL","TSLA"].map(t => (
                            <button key={t} onClick={() => setTwitterSearchTicker(t)} className={`text-[10px] px-2 py-1 rounded-md font-mono border ${dark ? "border-zinc-800 text-zinc-500 hover:text-zinc-300" : "border-zinc-200 text-zinc-500 hover:text-zinc-700"}`}>${t}</button>
                          ))}
                        </div>
                        {twitterSearchTicker && (
                          <a key={`stock-search-${twitterSearchTicker}-${dark}`} className="twitter-timeline" data-theme={dark?"dark":"light"} data-height="350" data-chrome="noheader nofooter noborders transparent" href={`https://twitter.com/search?q=%24${twitterSearchTicker}&f=live`}>Loading...</a>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* ── P&L Tracker View ── */}
                {xSubView==="pnl" && (
                  <div className="space-y-3">
                    <div className={`flex items-center justify-between`}>
                      <div className={`text-xs uppercase tracking-wider font-bold ${dimText2}`}>Signal P&L Tracker</div>
                      <button onClick={loadPnlTracker} className={`text-[10px] px-3 py-1.5 rounded-md font-semibold ${dark?"bg-sky-900/30 text-sky-400 border border-sky-800":"bg-sky-50 text-sky-600 border border-sky-200"}`}>{pnlLoading?"Loading...":"↻ Refresh"}</button>
                    </div>
                    {pnlData.length===0 && !pnlLoading ? (
                      <div className={`text-center py-12 ${dimText}`}>
                        <div className="text-3xl mb-2">📊</div>
                        <div className="text-xs">No signals tracked yet. Paste some posts first!</div>
                        <button onClick={loadPnlTracker} className={`mt-3 ${btn}`}>Load P&L Data</button>
                      </div>
                    ) : (
                      <div className="space-y-1.5">
                        {pnlData.map((s:any,i:number)=>(
                          <div key={i} className={`border rounded-lg p-3 ${cardBg} flex items-center justify-between`}>
                            <div className="flex items-center gap-3">
                              <div className={`w-9 h-9 rounded-lg flex items-center justify-center text-xs font-bold ${(s.pnl_pct||0)>=0?"bg-emerald-500/15 text-emerald-400":"bg-red-500/15 text-red-400"}`}>
                                {(s.pnl_pct||0)>=0?"▲":"▼"}
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className={`text-sm font-bold font-mono ${headText}`}>{s.ticker}</span>
                                  <span className={`text-[9px] ${dimText}`}>via {s.source}</span>
                                  {s.source==="Serenity" && <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold ${dark?"bg-violet-900/40 text-violet-400":"bg-violet-50 text-violet-700"}`}>⭐</span>}
                                </div>
                                <span className={`text-[10px] ${dimText}`}>{s.date_mentioned||"—"} · Mentioned at ${s.price_at_mention?.toFixed(2)||"?"}</span>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className={`font-bold font-mono text-sm ${(s.pnl_pct||0)>=0?"text-emerald-400":"text-red-400"}`}>
                                {(s.pnl_pct||0)>=0?"+":""}{(s.pnl_pct||0).toFixed(2)}%
                              </div>
                              <div className={`text-[10px] font-mono ${dimText}`}>Now ${s.current_price?.toFixed(2)||"?"}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* ── Conviction Scores View ── */}
                {xSubView==="convictions" && (
                  <div className="space-y-3">
                    <div className={`flex items-center justify-between`}>
                      <div className={`text-xs uppercase tracking-wider font-bold ${dimText2}`}>Conviction Scores</div>
                      <div className="flex gap-2">
                        <button onClick={createAutoAlerts} className={`text-[10px] px-3 py-1.5 rounded-md font-semibold ${dark?"bg-amber-900/30 text-amber-400 border border-amber-800":"bg-amber-50 text-amber-600 border border-amber-200"}`}>⚡ Auto-Alerts</button>
                        <button onClick={loadConvictionScores} className={`text-[10px] px-3 py-1.5 rounded-md font-semibold ${dark?"bg-sky-900/30 text-sky-400 border border-sky-800":"bg-sky-50 text-sky-600 border border-sky-200"}`}>{convictionLoading?"Loading...":"↻ Refresh"}</button>
                      </div>
                    </div>
                    {convictionScores.length===0 && !convictionLoading ? (
                      <div className={`text-center py-12 ${dimText}`}>
                        <div className="text-3xl mb-2">🎯</div>
                        <div className="text-xs">No conviction data yet. Parse some posts first!</div>
                        <button onClick={loadConvictionScores} className={`mt-3 ${btn}`}>Load Convictions</button>
                      </div>
                    ) : (
                      <div className="space-y-1.5">
                        {convictionScores.map((s:any,i:number)=>(
                          <div key={i} className={`border rounded-lg p-3 ${cardBg}`}>
                            <div className="flex items-center justify-between mb-1.5">
                              <div className="flex items-center gap-2">
                                <span className={`text-sm font-bold font-mono ${headText}`}>{s.ticker}</span>
                                <span className={`text-[9px] ${dimText}`}>{s.mention_count} mentions · {s.unique_sources} source{s.unique_sources!==1?"s":""}</span>
                                {s.has_entry && <span className={`text-[9px] px-1.5 py-0.5 rounded ${dark?"bg-emerald-900/30 text-emerald-400":"bg-emerald-50 text-emerald-600"}`}>Has Entry</span>}
                              </div>
                              <div className="flex items-center gap-2">
                                <div className="w-20 h-1.5 bg-white/10 rounded-full overflow-hidden">
                                  <div className="h-full rounded-full" style={{width:`${s.conviction_score||0}%`,background:`linear-gradient(90deg,#3b82f6,${(s.conviction_score||0)>70?"#10b981":(s.conviction_score||0)>40?"#f59e0b":"#ef4444"})`}}/>
                                </div>
                                <span className={`font-mono font-bold text-xs ${headText}`}>{s.conviction_score||0}</span>
                              </div>
                            </div>
                            <p className={`text-[11px] ${bodyText}`}>{s.primary_thesis||"No thesis extracted"}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* ── Theme Clustering View ── */}
                {xSubView==="themes" && (
                  <div className="space-y-3">
                    <div className={`flex items-center justify-between`}>
                      <div className={`text-xs uppercase tracking-wider font-bold ${dimText2}`}>Theme Clustering</div>
                      <button onClick={loadThemes} className={`text-[10px] px-3 py-1.5 rounded-md font-semibold ${dark?"bg-sky-900/30 text-sky-400 border border-sky-800":"bg-sky-50 text-sky-600 border border-sky-200"}`}>{themesLoading?"Generating...":"🧠 Cluster Themes"}</button>
                    </div>
                    {themes.length===0 && !themesLoading ? (
                      <div className={`text-center py-12 ${dimText}`}>
                        <div className="text-3xl mb-2">🧩</div>
                        <div className="text-xs">Click &quot;Cluster Themes&quot; to see AI-generated thematic baskets from your signals</div>
                      </div>
                    ) : themesLoading ? (
                      <div className={`text-center py-12 ${dimText}`}>
                        <div className="text-3xl mb-2 animate-pulse">🧠</div>
                        <div className="text-xs">AI is clustering your signals into themes...</div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {themes.map((t:any,i:number)=>(
                          <div key={i} className={`border rounded-xl p-4 ${cardBg}`}>
                            <h4 className={`text-sm font-bold mb-1 ${headText}`}>{t.name}</h4>
                            <p className={`text-[10px] ${dimText} mb-3`}>{t.description}</p>
                            <div className="flex flex-wrap gap-1.5">
                              {(t.tickers||[]).map((tk:any,j:number)=>(
                                <span key={j} className={`px-2 py-1 rounded text-[10px] font-mono border cursor-pointer ${dark?"bg-zinc-900 border-zinc-800 text-zinc-300 hover:border-sky-600":"bg-zinc-50 border-zinc-200 text-zinc-700 hover:border-sky-400"}`} onClick={()=>{setTab("charts");setChartTicker(typeof tk==="string"?tk:tk.ticker);}}>
                                  ${typeof tk==="string"?tk:tk.ticker}{tk.current_price?<span className="text-emerald-400 ml-1">${tk.current_price.toFixed(2)}</span>:null}
                                </span>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* ── Morning Brief View ── */}
                {xSubView==="brief" && (
                  <div className="space-y-3">
                    <div className={`flex items-center justify-between`}>
                      <div className={`text-xs uppercase tracking-wider font-bold ${dimText2}`}>AI Morning Brief</div>
                      <button onClick={loadSignalBrief} className={`text-[10px] px-3 py-1.5 rounded-md font-semibold ${dark?"bg-sky-900/30 text-sky-400 border border-sky-800":"bg-sky-50 text-sky-600 border border-sky-200"}`}>{briefLoading?"Generating...":"🧠 Generate Brief"}</button>
                    </div>
                    {!signalBrief && !briefLoading ? (
                      <div className={`text-center py-12 ${dimText}`}>
                        <div className="text-3xl mb-2">📰</div>
                        <div className="text-xs">Click &quot;Generate Brief&quot; for an AI-synthesized morning brief from all your parsed signals</div>
                      </div>
                    ) : briefLoading ? (
                      <div className={`text-center py-12 ${dimText}`}>
                        <div className="text-3xl mb-2 animate-pulse">🧠</div>
                        <div className="text-xs">AI is synthesizing your signals into a morning brief...</div>
                      </div>
                    ) : (
                      <div className={`border rounded-xl p-5 ${cardBg}`}>
                        <div className={`text-xs leading-relaxed whitespace-pre-wrap ${bodyText}`}>{signalBrief}</div>
                      </div>
                    )}
                  </div>
                )}

                {/* ── Portfolio Overlap View ── */}
                {xSubView==="overlap" && (
                  <div className="space-y-3">
                    <div className={`flex items-center justify-between`}>
                      <div className={`text-xs uppercase tracking-wider font-bold ${dimText2}`}>Portfolio Overlap</div>
                      <button onClick={loadPortfolioOverlap} className={`text-[10px] px-3 py-1.5 rounded-md font-semibold ${dark?"bg-sky-900/30 text-sky-400 border border-sky-800":"bg-sky-50 text-sky-600 border border-sky-200"}`}>{overlapLoading?"Loading...":"🔄 Check Overlap"}</button>
                    </div>
                    {portfolioOverlap.length===0 && !overlapLoading ? (
                      <div className={`text-center py-12 ${dimText}`}>
                        <div className="text-3xl mb-2">🔄</div>
                        <div className="text-xs">Click &quot;Check Overlap&quot; to find signals that match your Fidelity holdings</div>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {portfolioOverlap.map((o:any,i:number)=>(
                          <div key={i} className={`border rounded-lg p-4 ${dark?"border-amber-800/30":"border-amber-200"} ${cardBg}`}>
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <span className="text-amber-400">⚠️</span>
                                <span className={`text-sm font-bold font-mono ${headText}`}>{o.ticker}</span>
                                <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold ${dark?"bg-amber-900/40 text-amber-400":"bg-amber-50 text-amber-700"}`}>Portfolio + Signal</span>
                              </div>
                              <span className={`font-mono font-bold text-sm ${(o.portfolio_pnl||0)>=0?"text-emerald-400":"text-red-400"}`}>
                                {(o.portfolio_pnl||0)>=0?"+":""}{(o.portfolio_pnl||0).toFixed(2)}%
                              </span>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <p className={`text-[9px] uppercase tracking-wider mb-1 ${dimText2}`}>Signal Intelligence</p>
                                <p className={`text-[11px] ${bodyText}`}>{o.signal_source}: {o.signal_thesis}</p>
                                <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold mt-1 inline-block ${o.signal_action==="BUY"?(dark?"bg-emerald-900/40 text-emerald-400":"bg-emerald-50 text-emerald-700"):(dark?"bg-red-900/40 text-red-400":"bg-red-50 text-red-700")}`}>{o.signal_action}</span>
                              </div>
                              <div>
                                <p className={`text-[9px] uppercase tracking-wider mb-1 ${dimText2}`}>Your Position</p>
                                <p className={`text-[11px] ${bodyText}`}>{o.portfolio_qty} shares @ ${o.portfolio_avg_cost?.toFixed(2)}</p>
                                <p className={`text-[10px] ${dimText}`}>Current: ${o.current_price?.toFixed(2)}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* ── Earnings Cross-Reference View ── */}
                {xSubView==="earnings" && (
                  <div className="space-y-3">
                    <div className={`flex items-center justify-between`}>
                      <div className={`text-xs uppercase tracking-wider font-bold ${dimText2}`}>Earnings Cross-Reference</div>
                      <button onClick={loadEarningsCross} className={`text-[10px] px-3 py-1.5 rounded-md font-semibold ${dark?"bg-sky-900/30 text-sky-400 border border-sky-800":"bg-sky-50 text-sky-600 border border-sky-200"}`}>{earningsXLoading?"Loading...":"📅 Check Earnings"}</button>
                    </div>
                    {earningsCross.length===0 && !earningsXLoading ? (
                      <div className={`text-center py-12 ${dimText}`}>
                        <div className="text-3xl mb-2">📅</div>
                        <div className="text-xs">Click &quot;Check Earnings&quot; to see which signal tickers have upcoming earnings</div>
                      </div>
                    ) : (
                      <div className="space-y-1.5">
                        {earningsCross.map((e:any,i:number)=>(
                          <div key={i} className={`border rounded-lg p-3 ${(e.days_until_earnings||99)<=7?dark?"border-red-800/40":"border-red-200":(e.days_until_earnings||99)<=14?dark?"border-amber-800/30":"border-amber-200":""} ${cardBg}`}>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <span className={`text-sm font-bold font-mono ${headText}`}>{e.ticker}</span>
                                <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold ${(e.days_until_earnings||99)<=7?(dark?"bg-red-900/40 text-red-400":"bg-red-50 text-red-700"):(e.days_until_earnings||99)<=14?(dark?"bg-amber-900/40 text-amber-400":"bg-amber-50 text-amber-700"):(dark?"bg-zinc-800 text-zinc-400":"bg-zinc-100 text-zinc-600")}`}>
                                  {e.days_until_earnings!=null?`${e.days_until_earnings}d`:"TBD"}
                                </span>
                                <span className={`text-[9px] ${dimText}`}>{e.signal_source}</span>
                              </div>
                              <span className={`text-[10px] ${dimText}`}>{e.earnings_date||"No date"}</span>
                            </div>
                            <p className={`text-[10px] ${dimText} mt-1`}>{e.signal_thesis}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* ── Sector Heatmap View ── */}
                {xSubView==="heatmap" && (
                  <div className="space-y-3">
                    <div className={`flex items-center justify-between`}>
                      <div className={`text-xs uppercase tracking-wider font-bold ${dimText2}`}>Signal Sector Map</div>
                      <button onClick={loadSectorHeatmapData} className={`text-[10px] px-3 py-1.5 rounded-md font-semibold ${dark?"bg-sky-900/30 text-sky-400 border border-sky-800":"bg-sky-50 text-sky-600 border border-sky-200"}`}>{sectorHeatmapLoading?"Loading...":"🗺️ Load Map"}</button>
                    </div>
                    {sectorHeatmapData.length===0 && !sectorHeatmapLoading ? (
                      <div className={`text-center py-12 ${dimText}`}>
                        <div className="text-3xl mb-2">🗺️</div>
                        <div className="text-xs">Click &quot;Load Map&quot; to see where signal tickers cluster by sector</div>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {sectorHeatmapData.map((sec:any,i:number)=>(
                          <div key={i} className={`border rounded-xl p-4 ${cardBg}`}>
                            <div className="flex items-center justify-between mb-3">
                              <h4 className={`text-sm font-bold ${headText}`}>{sec.sector}</h4>
                              <span className={`font-mono text-xs font-bold ${(sec.avg_change||0)>=0?"text-emerald-400":"text-red-400"}`}>
                                {(sec.avg_change||0)>=0?"+":""}{(sec.avg_change||0).toFixed(2)}%
                              </span>
                            </div>
                            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-1.5">
                              {(sec.tickers||[]).map((t:any,j:number)=>(
                                <div key={j} className={`rounded-lg p-2 text-center cursor-pointer ${(t.daily_change_pct||0)>=0?dark?"bg-emerald-500/10 border border-emerald-500/20":"bg-emerald-50 border border-emerald-200":dark?"bg-red-500/10 border border-red-500/20":"bg-red-50 border border-red-200"}`} onClick={()=>{setTab("charts");setChartTicker(t.ticker);}}>
                                  <div className={`font-bold text-[10px] font-mono ${headText}`}>{t.ticker}</div>
                                  <div className={`font-mono text-[9px] ${(t.daily_change_pct||0)>=0?"text-emerald-400":"text-red-400"}`}>
                                    {(t.daily_change_pct||0)>=0?"+":""}{(t.daily_change_pct||0).toFixed(2)}%
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* ── Dark Pool & Insider View ── */}
                {xSubView==="darkpool" && (
                  <div className="space-y-3">
                    <div className={`flex items-center justify-between`}>
                      <div className={`text-xs uppercase tracking-wider font-bold ${dimText2}`}>Dark Pool & Insider Activity</div>
                      <button onClick={loadDarkpoolData} className={`text-[10px] px-3 py-1.5 rounded-md font-semibold ${dark?"bg-sky-900/30 text-sky-400 border border-sky-800":"bg-sky-50 text-sky-600 border border-sky-200"}`}>{darkpoolLoading?"Loading...":"🕵️ Scan Activity"}</button>
                    </div>
                    {darkpoolData.length===0 && !darkpoolLoading ? (
                      <div className={`text-center py-12 ${dimText}`}>
                        <div className="text-3xl mb-2">🕵️</div>
                        <div className="text-xs">Click &quot;Scan Activity&quot; to check insider trades & institutional holdings for signal tickers</div>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {darkpoolData.map((d:any,i:number)=>(
                          <div key={i} className={`border rounded-lg p-4 ${cardBg}`}>
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <span className={`text-sm font-bold font-mono ${headText}`}>{d.ticker}</span>
                                <span className={`text-[9px] ${dimText}`}>Signal: {d.signal_source}</span>
                              </div>
                              <span className={`text-xs font-bold ${(d.insider_net||0)>0?"text-emerald-400":(d.insider_net||0)<0?"text-red-400":dimText}`}>
                                Net Insider: {(d.insider_net||0)>0?"+":""}{d.insider_net||0}
                              </span>
                            </div>
                            <div className="grid grid-cols-3 gap-2">
                              <div className={`rounded-lg p-2 text-center ${dark?"bg-emerald-500/10":"bg-emerald-50"}`}>
                                <div className="text-emerald-400 font-bold text-sm">{d.insider_buys_90d||0}</div>
                                <div className={`text-[9px] ${dimText}`}>Buys (90d)</div>
                              </div>
                              <div className={`rounded-lg p-2 text-center ${dark?"bg-red-500/10":"bg-red-50"}`}>
                                <div className="text-red-400 font-bold text-sm">{d.insider_sells_90d||0}</div>
                                <div className={`text-[9px] ${dimText}`}>Sells (90d)</div>
                              </div>
                              <div className={`rounded-lg p-2 text-center ${dark?"bg-sky-500/10":"bg-sky-50"}`}>
                                <div className="text-sky-400 font-bold text-sm">{d.institutional_holders_count||0}</div>
                                <div className={`text-[9px] ${dimText}`}>Institutions</div>
                              </div>
                            </div>
                            {d.top_institutions&&d.top_institutions.length>0&&(
                              <div className={`mt-2 text-[9px] ${dimText}`}>Top holders: {d.top_institutions.slice(0,3).join(", ")}</div>
                            )}
                            <p className={`text-[10px] ${dimText} mt-1.5`}>{d.signal_thesis}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

              </div>
            )}

            {/* ── Substack Sub-tab ── */}
            {socialSubTab === "substack" && (
              <div className="space-y-4">
                {/* Add Feed Input */}
                <div className="flex gap-2">
                  <input value={substackUrl} onChange={e => setSubstackUrl(e.target.value)} placeholder="Add Substack URL (e.g. https://example.substack.com)" className={`flex-1 ${input}`} />
                  <button onClick={async () => { if (!substackUrl.trim()) return; const name = substackUrl.replace(/https?:\/\//, "").replace(/\.substack\.com.*/, ""); await fetch(`${BASE}/feeds/sources`, { method: "POST", headers: {"Content-Type":"application/json"}, body: JSON.stringify({name, url: substackUrl.trim()}) }); setSubstackUrl(""); loadFeeds(); loadFeedSources(); }} className={btn}>Add</button>
                </div>

                {/* Feed Entries */}
                {feedLoading ? (
                  <div className={`text-xs animate-pulse text-center py-8 ${dimText}`}>Loading feeds...</div>
                ) : feedEntries.length > 0 ? (
                  <div className="space-y-3">
                    {feedEntries.map((entry: any, i: number) => (
                      <div key={i} className={`border rounded-lg p-4 ${cardBg}`}>
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${dark ? "bg-orange-950/40 text-orange-400" : "bg-orange-50 text-orange-600"}`}>{entry.source}</span>
                              <span className={`text-[10px] ${dimText}`}>{entry.published}</span>
                            </div>
                            <a href={entry.link} target="_blank" rel="noreferrer" className={`text-sm font-semibold hover:text-amber-400 block mb-1 ${headText}`}>{entry.title}</a>
                            <p className={`text-xs leading-relaxed ${dimText}`}>{entry.summary?.slice(0, 300)}{entry.summary?.length > 300 ? "..." : ""}</p>
                            {entry.tickers?.length > 0 && (
                              <div className="flex gap-1 mt-2 flex-wrap">
                                {entry.tickers.map((t: string) => (
                                  <span key={t} className={`text-[10px] px-1.5 py-0.5 rounded font-mono font-bold cursor-pointer ${dark ? "bg-blue-950/40 text-blue-500" : "bg-blue-50 text-blue-700"}`} onClick={() => { setTab("charts"); setChartTicker(t); }}>${t}</span>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className={`text-center py-12 ${dimText}`}>
                    <div className="text-lg mb-2">No Substack feeds yet</div>
                    <div className="text-xs">Add a Substack URL above to start reading</div>
                  </div>
                )}

                {/* Feed Sources */}
                {feedSources.length > 0 && (
                  <div className={`border rounded-lg p-3 ${cardBg}`}>
                    <div className={`text-xs uppercase tracking-wider mb-2 ${dimText2}`}>Your Feeds ({feedSources.length})</div>
                    <div className="flex gap-2 flex-wrap">
                      {feedSources.map((s: any) => (
                        <span key={s.name} className={`text-[10px] px-2 py-1 rounded-lg flex items-center gap-1.5 ${dark ? "bg-zinc-800 text-zinc-400" : "bg-gray-100 text-gray-600"}`}>
                          {s.name}
                          <button onClick={async () => { await fetch(`${BASE}/feeds/sources/${encodeURIComponent(s.name)}`, { method: "DELETE" }); loadFeeds(); loadFeedSources(); }} className="hover:text-red-400 text-[10px]">✕</button>
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ── Serenity Sub-tab ── */}
            {socialSubTab==="serenity" && (
              <div className="space-y-4">
                {/* Header */}
                <div className={`border rounded-lg p-4 ${cardBg}`}>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold ${dark?"bg-violet-950 text-violet-400":"bg-violet-100 text-violet-600"}`}>S</div>
                      <div>
                        <div className={`text-sm font-bold ${headText}`}>Serenity <span className={`text-[10px] font-normal ${dimText}`}>@aleabitoreddit</span></div>
                        <div className={`text-[10px] ${dimText}`}>NeoCloud Thesis • $1.5M+ deployed • 316% YTD 2026</div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={loadSerenityPrices} className={`text-[10px] px-3 py-1.5 rounded-lg font-bold ${dark?"bg-violet-900/30 text-violet-400 border border-violet-800":"bg-violet-50 text-violet-600 border border-violet-200"}`}>{serenityLoading?"...":"↻ Refresh"}</button>
                      <button onClick={async()=>{const c=await pollSerenitySignals();alert(`Poll complete: ${c} new signal${c!==1?"s":""} found`);}} disabled={serenityPolling} className={`text-[10px] px-3 py-1.5 rounded-lg font-bold ${dark?"bg-amber-900/30 text-amber-400 border border-amber-800":"bg-amber-50 text-amber-600 border border-amber-200"} disabled:opacity-50`}>{serenityPolling?"Polling...":"⚡ Poll Serenity"}</button>
                      <a href="https://x.com/aleabitoreddit" target="_blank" rel="noreferrer" className={`text-[10px] px-3 py-1.5 rounded-lg font-bold ${dark?"bg-zinc-800 text-zinc-300 border border-zinc-700":"bg-gray-100 text-gray-600 border border-gray-200"}`}>View on 𝕏 →</a>
                    </div>
                  </div>
                  {/* Thesis Summary */}
                  <div className={`border rounded-lg p-3 ${dark?"bg-violet-950/20 border-violet-800/30":"bg-violet-50 border-violet-200"}`}>
                    <div className={`text-[10px] font-bold uppercase tracking-widest mb-1.5 text-violet-400`}>NeoCloud Thesis: Hyperscaler CapEx Funnel</div>
                    <div className={`text-xs leading-relaxed ${bodyText}`}>
                      Hyperscaler CapEx growing from $220B (2024) → $550B (2026) → $800B (2027). The $800B+ AI buildout is compared to 2004 grid modernization. NeoCloud providers (GPU-as-a-service) capture the overflow demand that hyperscalers can&apos;t build fast enough internally. Core positions in Mag7-contracted NeoCloud operators + compute infrastructure plays.
                    </div>
                  </div>
                </div>

                {/* NEW SIGNALS */}
                <div className={`border rounded-lg p-4 ${cardBg}`}>
                  <div className="flex items-center justify-between mb-3">
                    <div className={`text-xs uppercase tracking-wider ${dimText2}`}>⚡ New Signals</div>
                    <button onClick={loadSerenitySignals} className={`text-[10px] px-2 py-1 rounded ${dark?"text-amber-400 hover:bg-amber-900/20":"text-amber-600 hover:bg-amber-50"}`}>{serenitySignalsLoading?"...":"↻"}</button>
                  </div>
                  {serenitySignalsLoading && serenitySignals.length === 0 ? (
                    <div className={`text-xs ${dimText}`}>Loading signals...</div>
                  ) : serenitySignals.length === 0 ? (
                    <div className={`text-xs ${dimText}`}>No new signals — poll Serenity or check back later</div>
                  ) : (
                    <div className="space-y-2">
                      {serenitySignals.map((sig: any, i: number) => (
                        <div key={sig.id || i} className={`border rounded-lg p-3 ${dark?"border-white/[0.06] bg-zinc-900/30":"border-slate-100 bg-slate-50/50"}`}>
                          <div className="flex items-center justify-between mb-1.5">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-mono font-bold text-amber-400">{sig.ticker || "—"}</span>
                              <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase ${sig.action==="BUY"?"bg-emerald-500/20 text-emerald-400":sig.action==="SELL"?"bg-red-500/20 text-red-400":"bg-zinc-500/20 text-zinc-400"}`}>{sig.action || "WATCH"}</span>
                              <span className="text-[9px] px-1.5 py-0.5 rounded font-bold uppercase bg-amber-500/20 text-amber-400 animate-pulse">NEW</span>
                            </div>
                            <div className="flex gap-1.5">
                              <button onClick={async()=>{try{await fetch(`${BASE}/signals/${sig.id}/to-conviction`,{method:"POST"});loadSerenitySignals();}catch{}}} className={`text-[9px] px-2 py-1 rounded font-bold ${dark?"bg-emerald-900/30 text-emerald-400 border border-emerald-800/40 hover:bg-emerald-900/50":"bg-emerald-50 text-emerald-600 border border-emerald-200 hover:bg-emerald-100"}`}>+ Conviction</button>
                              <button onClick={async()=>{try{await fetch(`${BASE}/signals/${sig.id}`,{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({status:"dismissed"})});loadSerenitySignals();}catch{}}} className={`text-[9px] px-2 py-1 rounded font-bold ${dark?"bg-zinc-800 text-zinc-400 border border-zinc-700 hover:bg-zinc-700":"bg-gray-100 text-gray-500 border border-gray-200 hover:bg-gray-200"}`}>Dismiss</button>
                            </div>
                          </div>
                          {sig.thesis && <div className={`text-[10px] leading-relaxed ${bodyText} line-clamp-1`}>{sig.thesis}</div>}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Positions Table */}
                <div className={`border rounded-lg p-4 ${cardBg}`}>
                  <div className={`text-xs uppercase tracking-wider mb-3 ${dimText2}`}>Serenity&apos;s Watchlist — Live Prices</div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className={`border-b ${borderDim2}`}>
                          <th className={`text-left py-2 px-2 font-bold uppercase tracking-wider ${dimText2}`}>Ticker</th>
                          <th className={`text-left py-2 px-2 font-bold uppercase tracking-wider ${dimText2}`}>Name</th>
                          <th className={`text-left py-2 px-2 font-bold uppercase tracking-wider ${dimText2}`}>Bucket</th>
                          <th className={`text-right py-2 px-2 font-bold uppercase tracking-wider ${dimText2}`}>Price</th>
                          <th className={`text-right py-2 px-2 font-bold uppercase tracking-wider ${dimText2}`}>Change</th>
                          <th className={`text-right py-2 px-2 font-bold uppercase tracking-wider ${dimText2}`}>PT</th>
                          <th className={`text-right py-2 px-2 font-bold uppercase tracking-wider ${dimText2}`}>Upside</th>
                        </tr>
                      </thead>
                      <tbody>
                        {SERENITY_POSITIONS.map(p => {
                          const q = serenityPrices[p.ticker];
                          const upside = q && p.pt ? ((parseFloat(p.pt.replace("$","")) - q.price) / q.price * 100) : null;
                          const bucketColor = p.bucket==="Core NeoCloud"?"text-violet-400":p.bucket==="Mag7 Contracts"?"text-sky-400":p.bucket==="Compute"?"text-amber-400":p.bucket==="Macro Thesis"?"text-emerald-400":"text-zinc-400";
                          return (
                            <tr key={p.ticker} className={`border-b ${borderDim2} hover:${dark?"bg-zinc-900/30":"bg-gray-50"} cursor-pointer transition-colors`} onClick={()=>{setTab("charts");setChartTicker(p.ticker);}}>
                              <td className={`py-2 px-2 font-mono font-bold text-amber-400`}>{p.ticker}</td>
                              <td className={`py-2 px-2 ${bodyText}`}>{p.name}</td>
                              <td className={`py-2 px-2`}><span className={`text-[10px] px-1.5 py-0.5 rounded ${bucketColor} ${dark?"bg-zinc-800/50":"bg-gray-100"}`}>{p.bucket}</span></td>
                              <td className={`py-2 px-2 text-right font-mono ${headText}`}>{q ? `$${q.price.toFixed(2)}` : "—"}</td>
                              <td className={`py-2 px-2 text-right font-mono ${q ? clr(q.changePct, dark) : dimText}`}>{q ? `${q.changePct > 0 ? "+" : ""}${q.changePct.toFixed(2)}%` : "—"}</td>
                              <td className={`py-2 px-2 text-right font-mono ${dimText}`}>{p.pt || "—"}{p.timeframe ? <span className={`text-[9px] ml-1 ${dimText2}`}>/{p.timeframe}</span> : ""}</td>
                              <td className={`py-2 px-2 text-right font-mono font-bold ${upside != null ? (upside > 0 ? "text-emerald-400" : "text-red-400") : dimText}`}>{upside != null ? `${upside > 0 ? "+" : ""}${upside.toFixed(0)}%` : "—"}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                  {/* Overlap with your portfolio */}
                  {fidelityPositions.length > 0 && (() => {
                    const overlap = SERENITY_POSITIONS.filter(p => fidelityPositions.some((fp:any) => fp.symbol === p.ticker));
                    return overlap.length > 0 ? (
                      <div className={`mt-3 border-t pt-3 ${borderDim2}`}>
                        <div className={`text-[10px] font-bold uppercase tracking-widest mb-1.5 ${dimText2}`}>You own {overlap.length} of Serenity&apos;s picks</div>
                        <div className="flex gap-1 flex-wrap">
                          {overlap.map(p => {
                            const fp = fidelityPositions.find((f:any) => f.symbol === p.ticker);
                            return (
                              <span key={p.ticker} className={`text-[10px] px-2 py-1 rounded-lg font-mono font-bold ${dark?"bg-emerald-950/30 text-emerald-400 border border-emerald-800/40":"bg-emerald-50 text-emerald-600 border border-emerald-200"}`}>
                                {p.ticker} {fp?.current_value ? `$${Number(fp.current_value).toFixed(0)}` : ""}
                              </span>
                            );
                          })}
                        </div>
                      </div>
                    ) : null;
                  })()}
                </div>

                {/* SIGNAL HISTORY */}
                <div className={`border rounded-lg p-4 ${cardBg}`}>
                  <div className={`text-xs uppercase tracking-wider mb-3 ${dimText2}`}>📋 Signal History</div>
                  {serenitySignalHistory.length === 0 ? (
                    <div className={`text-xs ${dimText}`}>No signal history yet</div>
                  ) : (
                    <div className="space-y-1">
                      {serenitySignalHistory.map((sig: any, i: number) => (
                        <div key={sig.id || i} className={`flex items-center gap-2 py-1.5 ${i < serenitySignalHistory.length - 1 ? `border-b ${borderDim2}` : ""}`}>
                          {sig.status === "new" ? (
                            <span className="w-4 h-4 flex items-center justify-center text-[10px] text-amber-400">●</span>
                          ) : sig.status === "acted" || sig.status === "conviction" ? (
                            <span className="w-4 h-4 flex items-center justify-center text-[10px] text-emerald-400">✓</span>
                          ) : (
                            <span className="w-4 h-4 flex items-center justify-center text-[10px] text-zinc-500">✕</span>
                          )}
                          <span className="text-xs font-mono font-bold text-amber-400 w-12">{sig.ticker || "—"}</span>
                          <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase ${sig.action==="BUY"?"bg-emerald-500/20 text-emerald-400":sig.action==="SELL"?"bg-red-500/20 text-red-400":"bg-zinc-500/20 text-zinc-400"}`}>{sig.action || "WATCH"}</span>
                          <span className={`text-[10px] flex-1 truncate ${bodyText}`}>{sig.thesis || sig.summary || "—"}</span>
                          <span className={`text-[9px] ${dimText}`}>{sig.created_at ? new Date(sig.created_at).toLocaleDateString() : ""}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Serenity's Timeline Embed */}
                <div className={`border rounded-lg p-4 ${cardBg}`}>
                  <div className={`text-xs uppercase tracking-wider mb-3 ${dimText2}`}>Latest Posts from @aleabitoreddit</div>
                  <a key={`serenity-timeline-${dark}`} className="twitter-timeline" data-theme={dark?"dark":"light"} data-height="500" data-chrome="noheader nofooter noborders transparent" href="https://twitter.com/aleabitoreddit">Loading Serenity&apos;s tweets...</a>
                </div>

                {/* Bucket Breakdown */}
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-3">
                  {["Core NeoCloud","Mag7 Contracts","Compute","Swing Trade","Macro Thesis"].map(bucket => {
                    const positions = SERENITY_POSITIONS.filter(p => p.bucket === bucket);
                    if (positions.length === 0) return null;
                    const color = bucket==="Core NeoCloud"?"violet":bucket==="Mag7 Contracts"?"sky":bucket==="Compute"?"amber":bucket==="Macro Thesis"?"emerald":"zinc";
                    return (
                      <div key={bucket} className={`border rounded-lg p-3 ${cardBg}`}>
                        <div className={`text-[10px] font-bold uppercase tracking-widest mb-2 text-${color}-400`}>{bucket}</div>
                        <div className="space-y-1.5">
                          {positions.map(p => {
                            const q = serenityPrices[p.ticker];
                            return (
                              <div key={p.ticker} className="flex items-center justify-between cursor-pointer" onClick={()=>{setTab("charts");setChartTicker(p.ticker);}}>
                                <span className={`text-xs font-mono font-bold ${headText}`}>{p.ticker}</span>
                                <span className={`text-[10px] font-mono ${q ? clr(q.changePct, dark) : dimText}`}>{q ? `$${q.price.toFixed(2)}` : "—"}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          {/* ── Signals Sub-tab (redirects to twitter) ── */}

          </div>
        )}

        </div>{/* end animate-tabEnter wrapper */}
      </main>

      {/* ── NOTIFICATION DRAWER ──────────────────────────── */}
      {showNotifDrawer && (
        <div className={`fixed right-0 top-0 h-full w-80 z-50 border-l shadow-2xl backdrop-blur-2xl ${dark?"bg-slate-950/90 border-white/[0.06]":"bg-white/90 border-slate-200"}`}>
          <div className="flex items-center justify-between p-3 border-b" style={{borderColor:dark?"#27272a":"#e5e7eb"}}>
            <span className={`text-xs font-bold uppercase tracking-widest ${headText}`}>🔔 Notifications</span>
            <div className="flex gap-2">
              <button onClick={markAllRead} className={`text-[10px] ${dimText} hover:text-amber-400`}>Mark all read</button>
              <button onClick={()=>setShowNotifDrawer(false)} className={`text-sm ${dimText} hover:text-amber-400`}>✕</button>
            </div>
          </div>
          <div className="overflow-y-auto h-full pb-16 p-2 space-y-1">
            {notifications.length === 0 ? (
              <div className={`text-xs text-center py-8 ${dimText}`}>No notifications</div>
            ) : (
              notifications.map((n:any,i:number) => (
                <div key={i} className={`border rounded-lg p-2.5 ${n.read?"":`border-l-2 ${dark?"border-l-amber-500":"border-l-blue-500"}`} ${cardBg}`}>
                  <div className="flex justify-between items-start">
                    <span className={`text-[10px] font-bold ${headText}`}>{n.type === "alert" ? "🔔" : n.type === "trade" ? "📊" : "ℹ️"} {n.title}</span>
                    <span className={`text-[9px] ${dimText}`}>{n.time}</span>
                  </div>
                  <p className={`text-[10px] ${bodyText} mt-0.5`}>{n.message}</p>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      <footer className={`border-t px-5 py-2 flex justify-between text-xs backdrop-blur-xl ${dark?"border-white/[0.04] text-slate-600":"border-slate-200 text-slate-400"}`}>
        <span className="font-medium">Stock Terminal v5.2</span>
        <span>MACRO ↻30s · NEWS ↻60s</span>
      </footer>

      {/* ── COMMAND BAR ──────────────────────────────────── */}
      <CommandBar dark={dark} BASE={BASE} onNavigate={(tabId, ticker) => { setTab(tabId); if (ticker) { setChartTicker(ticker); setTimeout(() => loadChart(ticker), 100); } }} isOpen={cmdOpen} onClose={() => setCmdOpen(false)} />

        {/* ── WAR/MACRO ───────────────────────────────────── */}
        {tab==="warmacro" && <WarMacro dark={dark} BASE={BASE} />}

        {/* ── MARGIN TRACKER ─────────────────────────────── */}
        {tab==="margin" && <MarginTracker dark={dark} BASE={BASE} />}

        {/* ── POSITION HEALTH ────────────────────────────── */}
        {tab==="health" && <PositionHealth dark={dark} BASE={BASE} />}

        {/* ── COST BASIS ─────────────────────────────────── */}
        {tab==="costbasis" && <CostBasis dark={dark} BASE={BASE} />}

        {/* ── OPTIONS CHAIN ──────────────────────────────── */}
        {tab==="optchain" && <OptionsChain dark={dark} BASE={BASE} />}

        {/* ── GROWTH TRACKER ─────────────────────────────── */}
        {tab==="growth" && <GrowthTracker dark={dark} BASE={BASE} />}

        {/* ── CC INCOME ──────────────────────────────────── */}
        {tab==="ccincome" && <CCIncome dark={dark} BASE={BASE} />}

        {/* ── GEO MONITOR ────────────────────────────────── */}
        {tab==="geomonitor" && <GeoMonitor dark={dark} BASE={BASE} />}

        {/* ── FIDELITY SYNC ──────────────────────────────── */}
        {tab==="fidsync" && <FidelitySync dark={dark} BASE={BASE} />}

        {/* ── EQUITY CURVE ───────────────────────────────── */}
        {tab==="eqcurve2" && <EquityCurve dark={dark} BASE={BASE} />}

        {/* ── DIVIDENDS ──────────────────────────────────── */}
        {tab==="dividends" && <DividendTracker dark={dark} BASE={BASE} />}

        {/* ── TRADE REPLAY ───────────────────────────────── */}
        {tab==="tradereplay" && <TradeReplay dark={dark} BASE={BASE} />}

        {/* ── PRICE ALERTS ───────────────────────────────── */}
        {tab==="pricealerts" && <PriceAlerts dark={dark} BASE={BASE} />}

        {/* ── CORRELATION MATRIX ─────────────────────────── */}
        {tab==="corrmatrix" && <CorrelationMatrix dark={dark} BASE={BASE} />}

        {/* ── EARNINGS PREP ──────────────────────────────── */}
        {tab==="earnprep" && <EarningsPrep dark={dark} BASE={BASE} />}

        {/* ── MULTI-ACCOUNT ──────────────────────────────── */}
        {tab==="multiacct" && <MultiAccount dark={dark} BASE={BASE} />}

        {/* ── MARKET INTELLIGENCE ────────────────────────── */}
        {tab==="mktintel" && <MarketIntel dark={dark} BASE={BASE} />}

        {/* ── NOTIFICATION CENTER & THESIS VAULT ─────────── */}
        {tab==="notifcenter" && <NotifCenter dark={dark} BASE={BASE} />}

        {/* ── TRUMP MONITOR ──────────────────────────────── */}
        {tab==="trump" && <TrumpMonitor dark={dark} BASE={BASE} />}

        {/* ── POSITION SIZER ─────────────────────────────── */}
        {tab==="possizer" && <PositionSizer dark={dark} BASE={BASE} />}

        {/* ── SECTOR EXPOSURE ────────────────────────────── */}
        {tab==="sectorexp" && <SectorExposure dark={dark} BASE={BASE} />}

        {/* ── INSTITUTIONAL ANALYTICS ────────────────────── */}
        {tab==="instl" && <Institutional dark={dark} BASE={BASE} />}

        {/* ── SOCIAL SIGNAL FEED ─────────────────────────── */}
        {tab==="socialfeed" && <SocialFeed dark={dark} BASE={BASE} />}

        {/* ── SERENITY NEOCLOUD DASHBOARD ─────────────────── */}
        {tab==="serenity" && <SerenityDash dark={dark} BASE={BASE} />}

      {/* ── SHORTCUTS HELP MODAL ──────────────────────────── */}
      {showShortcuts && (
        <div onClick={() => setShowShortcuts(false)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 9998, display: "flex", justifyContent: "center", alignItems: "center", backdropFilter: "blur(4px)" }}>
          <div onClick={e => e.stopPropagation()} style={{ width: 480, background: dark ? "#111118" : "#fff", borderRadius: 16, border: `1px solid ${dark ? "#2a2a3a" : "#e2e8f0"}`, boxShadow: "0 24px 64px rgba(0,0,0,0.3)", padding: 24, maxHeight: "80vh", overflowY: "auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: dark ? "#f1f1f4" : "#111" }}>Keyboard Shortcuts</h3>
              <button onClick={() => setShowShortcuts(false)} style={{ background: "none", border: "none", color: dark ? "#71717a" : "#9ca3af", cursor: "pointer", fontSize: 18 }}>x</button>
            </div>
            {[
              { section: "Navigation", shortcuts: [
                { keys: "1-9", desc: "Switch to tab by number" },
                { keys: "\u2318/Ctrl + K", desc: "Open command bar" },
                { keys: "?", desc: "Show this help" },
                { keys: "Esc", desc: "Close modals" },
              ]},
              { section: "Quick Access", shortcuts: [
                { keys: "\u2318/Ctrl + Shift + A", desc: "AI Analysis" },
                { keys: "\u2318/Ctrl + Shift + C", desc: "Charts" },
                { keys: "\u2318/Ctrl + Shift + P", desc: "Portfolio" },
                { keys: "\u2318/Ctrl + Shift + J", desc: "Journal" },
                { keys: "\u2318/Ctrl + Shift + E", desc: "Earnings" },
              ]},
              { section: "Data Export", shortcuts: [
                { keys: "Export buttons", desc: "Available in Portfolio, Watchlist, Journal, & Options Journal tabs" },
              ]},
            ].map(group => (
              <div key={group.section} style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "#f59e0b", marginBottom: 8 }}>{group.section}</div>
                {group.shortcuts.map(s => (
                  <div key={s.keys} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 0", borderBottom: `1px solid ${dark ? "#1a1a28" : "#f1f5f9"}` }}>
                    <kbd style={{ padding: "2px 8px", borderRadius: 4, fontSize: 11, fontFamily: "'JetBrains Mono', monospace", color: dark ? "#e4e4e7" : "#374151", background: dark ? "#27272a" : "#f3f4f6", border: `1px solid ${dark ? "#3f3f46" : "#d1d5db"}` }}>{s.keys}</kbd>
                    <span style={{ fontSize: 12, color: dark ? "#a1a1aa" : "#6b7280" }}>{s.desc}</span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── TOAST NOTIFICATIONS ─────────────────────────── */}
      {toasts.length > 0 && (
        <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-2" style={{pointerEvents:"none"}}>
          {toasts.map(t => (
            <div key={t.id} className="animate-fadeIn rounded-lg px-4 py-2.5 text-xs font-semibold shadow-xl"
              style={{
                pointerEvents: "auto",
                background: t.type === "success" ? (dark ? "#065f46" : "#d1fae5") : t.type === "error" ? (dark ? "#7f1d1d" : "#fee2e2") : (dark ? "#1e293b" : "#e0f2fe"),
                color: t.type === "success" ? "#34d399" : t.type === "error" ? "#f87171" : (dark ? "#93c5fd" : "#2563eb"),
                border: `1px solid ${t.type === "success" ? "#10b981" : t.type === "error" ? "#ef4444" : "#3b82f6"}40`,
                backdropFilter: "blur(12px)",
                animation: "fadeIn 0.3s ease-out, fadeOut 0.3s ease-in 3.7s forwards",
              }}>
              {t.type === "success" ? "✓ " : t.type === "error" ? "✕ " : "ℹ "}{t.message}
            </div>
          ))}
        </div>
      )}

      <style jsx global>{`
        @keyframes ticker { 0% { transform: translateX(0); } 100% { transform: translateX(-33.333%); } }
        .animate-ticker { animation: ticker 45s linear infinite; }
        .animate-ticker:hover { animation-play-state: paused; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes fadeOut { to { opacity: 0; transform: translateY(8px); } }
        .animate-fadeIn { animation: fadeIn 0.3s ease-out; }
        * { scrollbar-width: thin; scrollbar-color: rgba(100,100,140,0.25) transparent; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
        .scrollbar-hide::-webkit-scrollbar { display: none; }

        @keyframes priceGlow { 0% { text-shadow: 0 0 16px rgba(52,211,153,0.6); } 100% { text-shadow: none; } }
        @keyframes skeletonPulse { 0%, 100% { opacity: 0.4; } 50% { opacity: 1; } }
        .skeleton-pulse { animation: skeletonPulse 1.5s ease-in-out infinite; }
        `}</style>
    </div>
    </>
  );
}
