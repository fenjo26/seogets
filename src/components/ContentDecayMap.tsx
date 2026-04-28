"use client";

import { useState, useMemo } from "react";
import { useLanguage } from "@/lib/i18n/LanguageProvider";

// ─── Types ─────────────────────────────────────────────────────────────────────
type HeatMetric = "clicks" | "impressions";
type HeatPeriod = "month" | "week";

// Deterministic pseudo-random based on string
function hashVal(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (Math.imul(31, h) + str.charCodeAt(i)) | 0;
  }
  return (h >>> 0) / 4294967296; // returns 0..1
}

const MOCK_PAGES = [
  "/betovo-casino-bonus-code/",
  "/",
  "/betovo-app-download/",
  "/betovo-betting/",
  "/betovo-krithikes/",
  "/epikoinonia/",
  "/casino-review/",
  "/slots-guide/",
];

// Generate month columns for heatmap (16 months back from now)
function getMonthCols(count = 16): { label: string; year: number; month: number }[] {
  const cols: { label: string; year: number; month: number }[] = [];
  const now = new Date();
  for (let i = count - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    cols.push({
      label: d.toLocaleDateString("en-US", { month: "short" }),
      year: d.getFullYear(),
      month: d.getMonth(),
    });
  }
  return cols;
}

function getWeekCols(count = 16): { label: string }[] {
  const cols: { label: string }[] = [];
  const now = new Date();
  for (let i = count - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i * 7);
    cols.push({ label: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }) });
  }
  return cols;
}

// Deterministic-ish values per page+col combo
function seedVal(page: string, col: number, metric: HeatMetric, period: HeatPeriod): number {
  const h1 = hashVal(page + "base"); // 0..1
  const h2 = hashVal(page + "trend"); // 0..1
  
  // trend from -0.8 to +1.5
  const trend = (h2 * 2.3) - 0.8; 
  
  const base = 10 + (h1 * 120); // base value
  
  // apply trend over time (col is 0..15)
  // if trend is negative, it decays. if positive, it grows.
  const timeFactor = Math.max(0.1, 1 + (trend * (col / 15))); 
  
  const h3 = hashVal(page + col + metric + period);
  const jitter = h3 * 0.3 + 0.85; // 0.85 to 1.15 multiplier
  
  let val = metric === "impressions" ? base * 45 : base;
  
  // scale for period: month is ~4.3x week
  if (period === "month") {
    val *= 4.3;
  }
  
  return Math.max(0, Math.round(val * timeFactor * jitter));
}

// Color scale: 0 = white/transparent, high = blue
function heatColor(val: number, max: number, threshold: number): string {
  if (max === 0) return "var(--color-bg)";
  const ratio = Math.min(1, val / max);
  if (ratio < threshold / 100) return "rgba(59,130,246,0.06)";
  // blue gradient
  const alpha = 0.1 + ratio * 0.85;
  const r = Math.round(59 + (30 - 59) * ratio);
  const g = Math.round(130 + (80 - 130) * ratio);
  const b = Math.round(246 + (200 - 246) * ratio);
  return `rgba(${r},${g},${b},${alpha})`;
}

// Decaying pages mock
interface DecayRow {
  page: string;
  clicksLast2m: number;
  clicksYoY: number | null;
  top10Queries: number;
  clicks: number;
  status: "Warning" | "Critical" | "OK";
}

const DECAY_ROWS: DecayRow[] = [
  { page: "/betovo-casino-bonus-code/", clicksLast2m: -2,  clicksYoY: null, top10Queries: -2,  clicks: 0, status: "Warning"  },
  { page: "/casino-review/",           clicksLast2m: -15, clicksYoY: -28,  top10Queries: -8,  clicks: 3, status: "Critical" },
  { page: "/slots-guide/",             clicksLast2m: -6,  clicksYoY: 5,   top10Queries: -1,  clicks: 12, status: "Warning" },
];

// ─── How it works block ────────────────────────────────────────────────────────
function HowItWorks() {
  const { t } = useLanguage();
  return (
    <div style={{
      display: "grid", gridTemplateColumns: "1fr 1fr", gap: "32px",
      padding: "24px 28px",
      borderBottom: "1px solid var(--color-border)",
      background: "var(--color-card)",
    }}>
      {/* Left */}
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
          <div style={{ width: "28px", height: "28px", borderRadius: "6px", background: "rgba(59,130,246,0.12)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#3B82F6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
          </div>
          <span style={{ fontSize: "14px", fontWeight: 700, color: "var(--color-text-primary)" }}>{t("cdmHowItWorks")}</span>
        </div>
        <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: "8px" }}>
          {[
            t("cdmHowItWorks1"),
            t("cdmHowItWorks2"),
            t("cdmHowItWorks3"),
          ].map((text, i) => (
            <li key={i} style={{ display: "flex", gap: "10px", fontSize: "13px", color: "var(--color-text-secondary)", lineHeight: "1.55" }}>
              <span style={{ width: "18px", height: "18px", borderRadius: "50%", background: "rgba(59,130,246,0.1)", color: "#3B82F6", fontSize: "11px", fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: "1px" }}>{i + 1}</span>
              {text}
            </li>
          ))}
        </ul>
      </div>

      {/* Right */}
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
          <div style={{ width: "28px", height: "28px", borderRadius: "6px", background: "rgba(16,185,129,0.12)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
            </svg>
          </div>
          <span style={{ fontSize: "14px", fontWeight: 700, color: "var(--color-text-primary)" }}>{t("cdmWhatToDo")}</span>
        </div>
        <ol style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: "8px", counterReset: "steps" }}>
          {[
            t("cdmWhatToDo1"),
            t("cdmWhatToDo2"),
            t("cdmWhatToDo3"),
            t("cdmWhatToDo4"),
          ].map((text, i) => (
            <li key={i} style={{ display: "flex", gap: "10px", fontSize: "13px", color: "var(--color-text-secondary)", lineHeight: "1.55" }}>
              <span style={{ width: "18px", height: "18px", borderRadius: "50%", background: "rgba(16,185,129,0.1)", color: "#10B981", fontSize: "11px", fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: "1px" }}>{i + 1}</span>
              {text}
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}

// ─── Decaying Pages Table ──────────────────────────────────────────────────────
function DecayingPagesTable() {
  const { t } = useLanguage();
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const rows = DECAY_ROWS.slice(0, rowsPerPage);

  const statusColor = (s: DecayRow["status"]) =>
    s === "Critical" ? "#EF4444" : s === "Warning" ? "#F59E0B" : "#10B981";

  return (
    <div style={{ padding: "20px 28px", borderBottom: "1px solid var(--color-border)" }}>
      <div style={{ fontSize: "15px", fontWeight: 700, color: "var(--color-text-primary)", marginBottom: "14px" }}>
        {t("cdmTableTitle")}
      </div>

      {/* Table header */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "1fr 140px 110px 130px 80px 90px",
        gap: "0",
        padding: "8px 12px",
        background: "var(--color-bg)",
        borderRadius: "8px 8px 0 0",
        border: "1px solid var(--color-border)",
        borderBottom: "none",
        fontSize: "12px", fontWeight: 600, color: "var(--color-text-secondary)",
      }}>
        <div>{t("cdmPage")}</div>
        <div style={{ textAlign: "right" }}>{t("cdmClicksLast2m")}</div>
        <div style={{ textAlign: "right" }}>{t("cdmClicksYoY")}</div>
        <div style={{ textAlign: "right" }}>{t("cdmTop10Queries")}</div>
        <div style={{ textAlign: "right" }}>{t("clicks")}</div>
        <div style={{ textAlign: "right" }}>{t("cdmStatus")}</div>
      </div>

      {/* Rows */}
      <div style={{ border: "1px solid var(--color-border)", borderRadius: "0 0 8px 8px", overflow: "hidden" }}>
        {rows.map((row, i) => (
          <div key={row.page} style={{
            display: "grid",
            gridTemplateColumns: "1fr 140px 110px 130px 80px 90px",
            padding: "12px 12px",
            borderBottom: i < rows.length - 1 ? "1px solid var(--color-border)" : "none",
            background: i % 2 === 0 ? "var(--color-card)" : "rgba(255,255,255,0.02)",
            alignItems: "center",
            fontSize: "13px",
          }}>
            <div style={{ color: "#3B82F6", fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{row.page}</div>
            <div style={{ textAlign: "right", color: "#EF4444", fontWeight: 600 }}>
              <span style={{ fontSize: "11px" }}>↘</span> {row.clicksLast2m} ({Math.abs(row.clicksLast2m * 50)}%)
            </div>
            <div style={{ textAlign: "right", color: "var(--color-text-secondary)" }}>
              {row.clicksYoY === null ? "—" : <span style={{ color: row.clicksYoY < 0 ? "#EF4444" : "#10B981" }}>{row.clicksYoY > 0 ? "+" : ""}{row.clicksYoY}%</span>}
            </div>
            <div style={{ textAlign: "right", color: "#EF4444", fontWeight: 600 }}>
              <span style={{ fontSize: "11px" }}>↘</span> {row.top10Queries} ({Math.abs(row.top10Queries * 50)}%)
            </div>
            <div style={{ textAlign: "right", color: "var(--color-text-secondary)" }}>{row.clicks}</div>
            <div style={{ textAlign: "right" }}>
              <span style={{
                display: "inline-block", padding: "3px 10px", borderRadius: "20px",
                fontSize: "12px", fontWeight: 600,
                color: statusColor(row.status),
                background: `${statusColor(row.status)}18`,
                border: `1px solid ${statusColor(row.status)}40`,
              }}>{row.status}</span>
            </div>
          </div>
        ))}

        {/* Footer */}
        <div style={{
          padding: "10px 12px",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          background: "var(--color-bg)",
          borderTop: "1px solid var(--color-border)",
          fontSize: "12px", color: "var(--color-text-secondary)",
        }}>
          <span>{t("cdmShowingRows").replace("{start}", "1").replace("{end}", String(rows.length)).replace("{total}", String(DECAY_ROWS.length))}</span>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span>{t("cdmRowsPerPage")}</span>
            <select
              value={rowsPerPage}
              onChange={e => setRowsPerPage(Number(e.target.value))}
              style={{
                padding: "3px 8px", borderRadius: "6px", fontSize: "12px",
                border: "1px solid var(--color-border)",
                background: "var(--color-card)", color: "var(--color-text-primary)",
                cursor: "pointer", outline: "none",
              }}
            >
              {[5, 10, 25, 50].map(n => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Heatmap ───────────────────────────────────────────────────────────────────
function Heatmap({ domain }: { domain: string }) {
  const { t } = useLanguage();
  const [metric, setMetric] = useState<HeatMetric>("clicks");
  const [period, setPeriod] = useState<HeatPeriod>("month");
  const [threshold, setThreshold] = useState(30);

  const monthCols = useMemo(() => getMonthCols(16), []);
  const weekCols  = useMemo(() => getWeekCols(16), []);
  const cols = period === "month" ? monthCols : weekCols;

  // Group cols by year for header
  const yearGroups: { year: string; count: number }[] = [];
  if (period === "month") {
    const seen: Record<string, number> = {};
    monthCols.forEach(c => { seen[c.year] = (seen[c.year] ?? 0) + 1; });
    for (const [yr, cnt] of Object.entries(seen)) yearGroups.push({ year: yr, count: cnt });
  }

  // Build matrix: pages × cols
  const matrix = useMemo(() => {
    return MOCK_PAGES.map(page => ({
      page,
      vals: cols.map((_, ci) => seedVal(page, ci, metric, period)),
    }));
  }, [cols, metric, period]);

  // Row for "All pages"
  const allVals = useMemo(() =>
    cols.map((_, ci) => matrix.reduce((s, r) => s + r.vals[ci], 0)),
    [cols, matrix]
  );

  const globalMax = Math.max(...allVals, ...matrix.flatMap(r => r.vals));

  const cellStyle = (val: number): React.CSSProperties => ({
    width: "42px", minWidth: "42px",
    height: "32px",
    display: "flex", alignItems: "center", justifyContent: "center",
    fontSize: "11px", fontWeight: val > 0 ? 600 : 400,
    color: val > 0 ? "var(--color-text-primary)" : "var(--color-text-secondary)",
    background: heatColor(val, globalMax, threshold),
    borderRadius: "4px",
    transition: "background 0.2s",
    cursor: "default",
  });

  return (
    <div style={{ padding: "20px 28px" }}>
      {/* Controls row */}
      <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px", flexWrap: "wrap" }}>
        {/* Metric toggles */}
        <div style={{ display: "flex", gap: "4px" }}>
          {(["clicks", "impressions"] as HeatMetric[]).map(m => (
            <button
              key={m}
              onClick={() => setMetric(m)}
              style={{
                display: "flex", alignItems: "center", gap: "6px",
                padding: "6px 13px", borderRadius: "8px", fontSize: "13px", fontWeight: 500,
                cursor: "pointer", border: `1px solid ${metric === m ? "#3B82F6" : "var(--color-border)"}`,
                background: metric === m ? "rgba(59,130,246,0.1)" : "var(--color-card)",
                color: metric === m ? "#3B82F6" : "var(--color-text-secondary)",
                transition: "all 0.15s",
              }}
            >
              {m === "clicks"
                ? <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
                : <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
              }
              {metric === "clicks" ? t("clicks") : t("impressions")}
            </button>
          ))}
        </div>

        {/* Period toggles */}
        <div style={{ display: "flex", gap: "4px" }}>
          {(["month", "week"] as HeatPeriod[]).map(p => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              style={{
                padding: "6px 13px", borderRadius: "8px", fontSize: "13px", fontWeight: period === p ? 700 : 400,
                cursor: "pointer",
                background: period === p ? "#fff" : "transparent",
                color: period === p ? "#111" : "var(--color-text-secondary)",
                border: `1px solid ${period === p ? "rgba(0,0,0,0.15)" : "var(--color-border)"}`,
                transition: "all 0.15s",
              }}
            >{p === "month" ? t("periodMonth") : t("periodWeek")}</button>
          ))}
        </div>

        {/* Threshold slider */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginLeft: "4px" }}>
          <span style={{ fontSize: "13px", color: "var(--color-text-secondary)", fontWeight: 500 }}>{t("cdmThreshold")}</span>
          <input
            type="range" min={0} max={90} step={5}
            value={threshold}
            onChange={e => setThreshold(Number(e.target.value))}
            style={{ width: "120px", accentColor: "#3B82F6", cursor: "pointer" }}
          />
          <span style={{ fontSize: "12px", color: "#3B82F6", fontWeight: 700, minWidth: "30px" }}>{threshold}%</span>
        </div>
      </div>

      {/* Heatmap table */}
      <div style={{ overflowX: "auto" }}>
        <table style={{ borderCollapse: "separate", borderSpacing: "3px", width: "100%" }}>
          <thead>
            {/* Year row (only for month view) */}
            {period === "month" && (
              <tr>
                <th style={{ minWidth: "200px" }} />
                {yearGroups.map(({ year, count }) => (
                  <th
                    key={year}
                    colSpan={count}
                    style={{
                      textAlign: "center", fontSize: "12px", fontWeight: 700,
                      color: "var(--color-text-secondary)", paddingBottom: "4px",
                      letterSpacing: "0.04em",
                    }}
                  >{year}</th>
                ))}
                <th style={{ minWidth: "60px" }} />
              </tr>
            )}
            {/* Col labels */}
            <tr>
              <th style={{
                textAlign: "left", fontSize: "11px", color: "var(--color-text-secondary)",
                fontWeight: 600, paddingBottom: "6px", paddingRight: "12px", minWidth: "200px",
              }}>
                {domain.toUpperCase()}
              </th>
              {cols.map((c, ci) => (
                <th key={ci} style={{
                  textAlign: "center", fontSize: "10px", color: "var(--color-text-secondary)",
                  fontWeight: 500, paddingBottom: "6px", minWidth: "42px", width: "42px",
                }}>
                  {"label" in c ? c.label : ""}
                </th>
              ))}
              <th style={{ textAlign: "center", fontSize: "11px", fontWeight: 700, color: "var(--color-text-secondary)", paddingBottom: "6px", paddingLeft: "8px" }}>{t("cdmTotal")}</th>
            </tr>
          </thead>
          <tbody>
            {/* All pages row */}
            <tr>
              <td style={{ fontSize: "13px", fontWeight: 700, color: "var(--color-text-primary)", paddingRight: "12px", paddingBottom: "3px" }}>{t("cdmAllPages")}</td>
              {allVals.map((v, ci) => (
                <td key={ci} style={{ padding: "1px" }}>
                  <div style={cellStyle(v)}>{v}</div>
                </td>
              ))}
              <td style={{ padding: "1px 1px 1px 8px" }}>
                <div style={{ ...cellStyle(allVals.reduce((a, b) => a + b, 0)), width: "52px", minWidth: "52px", background: "rgba(59,130,246,0.15)", fontWeight: 700 }}>
                  {allVals.reduce((a, b) => a + b, 0)}
                </div>
              </td>
            </tr>

            {/* Page rows */}
            {matrix.map(({ page, vals }) => {
              const total = vals.reduce((a, b) => a + b, 0);
              return (
                <tr key={page}>
                  <td style={{
                    fontSize: "12px", color: "#3B82F6", fontWeight: 500,
                    paddingRight: "12px", paddingBottom: "3px",
                    maxWidth: "200px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                  }}>
                    {page}
                  </td>
                  {vals.map((v, ci) => (
                    <td key={ci} style={{ padding: "1px" }}>
                      <div style={cellStyle(v)}>{v === 0 ? <span style={{ opacity: 0.35 }}>0</span> : v}</div>
                    </td>
                  ))}
                  <td style={{ padding: "1px 1px 1px 8px" }}>
                    <div style={{ ...cellStyle(total), width: "52px", minWidth: "52px", fontWeight: 700 }}>{total}</div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Main export ───────────────────────────────────────────────────────────────
export default function ContentDecayMap({ domain }: { domain: string }) {
  return (
    <div style={{
      border: "1px solid var(--color-border)",
      borderRadius: "12px",
      overflow: "hidden",
      marginTop: "20px",
      background: "var(--color-card)",
    }}>
      <HowItWorks />
      <DecayingPagesTable />
      <Heatmap domain={domain} />
    </div>
  );
}
