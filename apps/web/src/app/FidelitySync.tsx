"use client";
import { useState } from "react";
import { getTheme, cardStyle, labelStyle, btnPrimaryStyle, btnSecondaryStyle } from "./theme";

interface FidelitySyncProps { dark: boolean; BASE: string; }

export default function FidelitySync({ dark, BASE }: FidelitySyncProps) {
  const t = getTheme(dark);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [histResult, setHistResult] = useState<any>(null);
  const [dragOver, setDragOver] = useState(false);

  const upload = async (file: File, type: "positions" | "history") => {
    setUploading(true);
    const form = new FormData();
    form.append("file", file);
    try {
      const endpoint = type === "positions" ? "/fidelity/upload-positions" : "/fidelity/upload-history";
      const r = await fetch(`${BASE}${endpoint}`, { method: "POST", body: form });
      const d = await r.json();
      if (type === "positions") setResult(d);
      else setHistResult(d);
    } catch (e: any) {
      if (type === "positions") setResult({ error: e.message });
      else setHistResult({ error: e.message });
    } finally { setUploading(false); }
  };

  const DropZone = ({ label, hint, type }: { label: string; hint: string; type: "positions" | "history" }) => (
    <div
      onDragOver={e => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={e => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files[0]; if (f) upload(f, type); }}
      style={{
        ...cardStyle(t), padding: 32, textAlign: "center", cursor: "pointer",
        border: `2px dashed ${dragOver ? t.accent : t.border}`,
        background: dragOver ? t.blueBg : t.bgCard,
        transition: "all 0.2s",
      }}
      onClick={() => {
        const input = document.createElement("input");
        input.type = "file"; input.accept = ".csv";
        input.onchange = () => { if (input.files?.[0]) upload(input.files[0], type); };
        input.click();
      }}
    >
      <div style={{ fontSize: 36, marginBottom: 8 }}>{type === "positions" ? "📊" : "📋"}</div>
      <div style={{ fontSize: 16, fontWeight: 700, color: t.text, marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 12, color: t.textMuted }}>{hint}</div>
      <div style={{ fontSize: 11, color: t.textMuted, marginTop: 8 }}>Drag & drop or click to browse</div>
    </div>
  );

  return (
    <div style={{ fontFamily: t.fontBody, color: t.text }}>
      <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>Fidelity Sync</h2>
      <div style={{ fontSize: 12, color: t.textMuted, marginBottom: 20 }}>
        Upload your Fidelity CSVs to update positions and options journal
      </div>

      <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginBottom: 20 }}>
        <div style={{ flex: 1, minWidth: 280 }}>
          <DropZone label="Positions CSV" hint="Export from Fidelity: Accounts → Positions → Download" type="positions" />
        </div>
        <div style={{ flex: 1, minWidth: 280 }}>
          <DropZone label="Activity/Orders CSV" hint="Export from Fidelity: Accounts → Activity → Download" type="history" />
        </div>
      </div>

      {uploading && <div style={{ color: t.accent, padding: 16, textAlign: "center", fontSize: 14 }}>Uploading and processing...</div>}

      {result && (
        <div style={{ ...cardStyle(t), padding: 16, borderLeft: `3px solid ${result.error ? t.red : t.green}` }}>
          <div style={{ ...labelStyle(t), marginBottom: 8 }}>POSITIONS UPLOAD RESULT</div>
          {result.error ? (
            <div style={{ color: t.red }}>{result.error}</div>
          ) : (
            <div>
              <div style={{ fontSize: 14, color: t.green, fontWeight: 600, marginBottom: 4 }}>
                {result.positions_count} positions imported — ${result.total_value?.toLocaleString()} total value
              </div>
              <div style={{ fontSize: 12, color: t.textMuted, fontFamily: t.fontMono }}>
                {result.tickers?.join(", ")}
              </div>
            </div>
          )}
        </div>
      )}

      {histResult && (
        <div style={{ ...cardStyle(t), padding: 16, borderLeft: `3px solid ${histResult.error ? t.red : t.green}` }}>
          <div style={{ ...labelStyle(t), marginBottom: 8 }}>ACTIVITY UPLOAD RESULT</div>
          {histResult.error ? (
            <div style={{ color: t.red }}>{histResult.error}</div>
          ) : (
            <div>
              <div style={{ fontSize: 14, color: t.green, fontWeight: 600, marginBottom: 4 }}>
                Options journal updated — {histResult.summary?.total_trades} total trades
              </div>
              <div style={{ fontSize: 12, color: t.textSecondary }}>
                P&L: ${histResult.summary?.total_pnl} | Win Rate: {histResult.summary?.win_rate}% | {histResult.summary?.winners}W / {histResult.summary?.losers}L
              </div>
            </div>
          )}
        </div>
      )}

      <div style={{ ...cardStyle(t), padding: 16, marginTop: 16 }}>
        <div style={{ ...labelStyle(t), marginBottom: 8 }}>HOW TO EXPORT FROM FIDELITY</div>
        <div style={{ fontSize: 13, color: t.textSecondary, lineHeight: 1.8 }}>
          <div><strong>Positions:</strong> Log in → Accounts & Trade → Positions → Click the download icon (top right of positions table)</div>
          <div><strong>Activity:</strong> Log in → Accounts & Trade → Activity & Orders → Select date range → Download CSV</div>
        </div>
      </div>
    </div>
  );
}
