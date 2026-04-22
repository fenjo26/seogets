"use client";

import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Search, Eye, EyeOff, Star, ExternalLink,
  ArrowUpDown, SlidersHorizontal, Sparkles, Percent, MoveUp,
  Globe, Monitor, FileText, ChevronDown, Check,
  Image, Video, Newspaper, Compass,
  Download, Tag, X,
} from "lucide-react";
import { AreaChart, Area, ResponsiveContainer, Tooltip } from "recharts";
import { usePrivacy } from "@/lib/PrivacyContext";

// ─── Types ────────────────────────────────────────────────────────────────────
type Metric = "clicks" | "impressions" | "ctr" | "position";
type SortBy = "az" | "total" | "growth" | "growth_pct";
type Comparison = "disabled" | "previous" | "yoy" | "prev_month" | "custom";
type PeriodView = "day" | "week" | "month";
type SearchType = "web" | "discover" | "news" | "image" | "video";
type BrandedFilter = "all" | "branded" | "nonbranded";

// ─── Metric config ────────────────────────────────────────────────────────────
const MC = {
  clicks:      { label: "Clicks",        color: "#3B82F6", bg: "rgba(59,130,246,0.12)"  },
  impressions: { label: "Impressions",   color: "#8B5CF6", bg: "rgba(139,92,246,0.12)" },
  ctr:         { label: "CTR",           color: "#10B981", bg: "rgba(16,185,129,0.12)" },
  position:    { label: "Avg. Position", color: "#F59E0B", bg: "rgba(245,158,11,0.12)" },
} as const;

// ─── Period helpers ───────────────────────────────────────────────────────────
function buildPeriodGroups() {
  const fmt    = (d: Date) => d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  const fmtDay = (d: Date) => d.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" });
  const today     = new Date();
  const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1);
  const ago   = (n: number) => { const d = new Date(yesterday); d.setDate(yesterday.getDate() - n + 1); return d; };
  const mAgo  = (n: number) => { const d = new Date(yesterday); d.setMonth(d.getMonth() - n); return d; };
  const yAgo  = (n: number) => { const d = new Date(yesterday); d.setFullYear(d.getFullYear() - n); return d; };
  const r = (a: Date, b: Date) => `${fmt(a)} – ${fmt(b)}`;
  return [
    [
      { label: fmtDay(yesterday), value: "yesterday", desc: "" },
      { label: "7 days",   value: "7d",  desc: r(ago(7),  yesterday) },
      { label: "14 days",  value: "14d", desc: r(ago(14), yesterday) },
      { label: "28 days",  value: "28d", desc: r(ago(28), yesterday) },
    ],
    [
      { label: "Last Week",   value: "last_week",   desc: "" },
      { label: "This Month",  value: "this_month",  desc: "" },
      { label: "Last Month",  value: "last_month",  desc: "" },
    ],
    [
      { label: "This Quarter", value: "this_quarter", desc: "" },
      { label: "Last Quarter", value: "last_quarter", desc: "" },
      { label: "Year to Date", value: "ytd",          desc: "" },
    ],
    [
      { label: "3 months",  value: "3m",  desc: r(mAgo(3),  yesterday) },
      { label: "6 months",  value: "6m",  desc: r(mAgo(6),  yesterday) },
      { label: "8 months",  value: "8m",  desc: r(mAgo(8),  yesterday) },
      { label: "12 months", value: "12m", desc: r(mAgo(12), yesterday) },
      { label: "16 months", value: "16m", desc: r(mAgo(16), yesterday) },
    ],
    [
      { label: "2 years", value: "2y",     desc: r(yAgo(2), yesterday) },
      { label: "3 years", value: "3y",     desc: r(yAgo(3), yesterday) },
      { label: "Custom",  value: "custom", desc: "" },
    ],
  ];
}
function getPeriodLabel(v: string) {
  for (const g of buildPeriodGroups()) for (const p of g) if (p.value === v) return p.label;
  return v;
}

// ─── Mock data ────────────────────────────────────────────────────────────────
interface Pt {
  date: string;
  clicks: number; impressions: number; ctr: number; position: number;
  clicksC: number; impressionsC: number; ctrC: number; positionC: number;
  // normalized 0–95 for display
  cN: number; iN: number; tN: number; pN: number;
  cCN: number; iCN: number; tCN: number; pCN: number;
}

function norm(arr: number[]): number[] {
  const lo = Math.min(...arr), hi = Math.max(...arr);
  return hi === lo ? arr.map(() => 50) : arr.map(v => Math.round(((v - lo) / (hi - lo)) * 85 + 5));
}

function makeSiteData(n = 14): { data: Pt[]; summary: Record<Metric, { value: number; change: number }> } {
  let c = 20 + Math.random() * 150,
      im = c * (12 + Math.random() * 25),
      t  = 2 + Math.random() * 12,
      p  = 5 + Math.random() * 35;

  const rc: number[] = [], ri: number[] = [], rt: number[] = [], rp: number[] = [];
  const rcC: number[] = [], riC: number[] = [], rtC: number[] = [], rpC: number[] = [];

  for (let i = 0; i < n; i++) {
    c  = Math.max(1,   c  + (Math.random() - 0.47) * 25);
    im = Math.max(10,  im + (Math.random() - 0.47) * 300);
    t  = Math.max(0.1, Math.min(50, t + (Math.random() - 0.5) * 2));
    p  = Math.max(1,   Math.min(100, p + (Math.random() - 0.5) * 3));
    rc.push(Math.round(c));   ri.push(Math.round(im));
    rt.push(+t.toFixed(1));   rp.push(+p.toFixed(1));
    const f = 0.45 + Math.random() * 0.65;
    rcC.push(Math.round(c * f));  riC.push(Math.round(im * f));
    rtC.push(+(t * f).toFixed(1)); rpC.push(+Math.min(100, p / f).toFixed(1));
  }

  const nC = norm(rc), nI = norm(ri), nT = norm(rt), nP = norm(rp);
  const nCC = norm(rcC), nIC = norm(riC), nTC = norm(rtC), nPC = norm(rpC);

  const data: Pt[] = rc.map((_, i) => ({
    date: `Day ${i + 1}`,
    clicks: rc[i], impressions: ri[i], ctr: rt[i], position: rp[i],
    clicksC: rcC[i], impressionsC: riC[i], ctrC: rtC[i], positionC: rpC[i],
    cN: nC[i], iN: nI[i], tN: nT[i], pN: nP[i],
    cCN: nCC[i], iCN: nIC[i], tCN: nTC[i], pCN: nPC[i],
  }));

  const last = n - 1, mid = Math.floor(n / 2);
  const pct = (a: number, b: number) => b === 0 ? 0 : Math.round(((a - b) / b) * 100);
  return {
    data,
    summary: {
      clicks:      { value: rc[last],  change: pct(rc[last],  rc[mid]) },
      impressions: { value: ri[last],  change: pct(ri[last],  ri[mid]) },
      ctr:         { value: rt[last],  change: pct(rt[last],  rt[mid]) },
      position:    { value: rp[last],  change: pct(rp[last],  rp[mid]) },
    },
  };
}

function fmtK(n: number) { return n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n); }
function fmtVal(m: Metric, v: number) {
  if (m === "ctr") return `${v}%`;
  if (m === "impressions") return fmtK(v);
  return String(v);
}
function pctStr(curr: number, prev: number) {
  if (prev === 0) return curr > 0 ? "↑∞%" : "";
  const p = Math.round(((curr - prev) / prev) * 100);
  return `${p >= 0 ? "↑" : "↓"}${Math.abs(p)}%`;
}

function getDomain(url: string) {
  return url.replace("sc-domain:", "").replace(/^https?:\/\//, "").replace(/\/$/, "");
}

// ─── Export helpers ───────────────────────────────────────────────────────────
const EXPORT_COLS = [
  { key: "date",    label: "Date",    rows: 7   },
  { key: "page",    label: "Page",    rows: 35  },
  { key: "query",   label: "Query",   rows: 200 },
  { key: "country", label: "Country", rows: 56  },
  { key: "device",  label: "Device",  rows: 3   },
] as const;
type ExportCol = typeof EXPORT_COLS[number]["key"];

function generateCSV(domain: string, cols: Set<ExportCol>): string {
  const dimCols = EXPORT_COLS.filter(c => cols.has(c.key)).map(c => c.key);
  const header = [...dimCols, "Clicks", "Impressions", "CTR", "Avg Position"].join(",");
  const devices = ["MOBILE", "DESKTOP", "TABLET"];
  const countries = ["grc", "usa", "gbr", "deu", "fra"];
  const rows: string[] = [header];
  const today = new Date();
  const n = cols.has("query") ? 200 : cols.has("page") ? 35 : cols.has("country") ? 56 : 7;
  for (let i = 0; i < n; i++) {
    const d = new Date(today); d.setDate(today.getDate() - Math.floor(Math.random() * 90));
    const row: string[] = [];
    if (cols.has("date"))    row.push(`"${d.toISOString().split("T")[0]}"`);
    if (cols.has("page"))    row.push(`"https://${domain}/page-${i+1}/"`);
    if (cols.has("query"))   row.push(`"keyword ${i+1}"`);
    if (cols.has("country")) row.push(`"${countries[i % countries.length]}"`);
    if (cols.has("device"))  row.push(`"${devices[i % devices.length]}"`);
    const clicks = Math.floor(Math.random() * 50);
    const impr   = clicks * (5 + Math.floor(Math.random() * 20));
    const ctr    = impr > 0 ? +((clicks / impr) * 100).toFixed(2) : 0;
    const pos    = +(1 + Math.random() * 50).toFixed(1);
    row.push(String(clicks), String(impr), String(ctr), String(pos));
    rows.push(row.join(","));
  }
  return rows.join("\n");
}

function downloadCSV(domain: string, cols: Set<ExportCol>) {
  const csv  = generateCSV(domain, cols);
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href = url;
  a.download = `${domain}_${[...cols].join("_")}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// ─── Advanced Export Modal ────────────────────────────────────────────────────
function ExportModal({ domain, onClose }: { domain: string; onClose: () => void }) {
  const [selected, setSelected] = useState<Set<ExportCol>>(new Set());

  const toggle = (k: ExportCol) => setSelected(p => {
    const n = new Set(p); n.has(k) ? n.delete(k) : n.add(k); return n;
  });

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center" }}
      onClick={onClose}>
      <div style={{ background: "#fff", borderRadius: "16px", padding: "28px 32px", maxWidth: "640px", width: "90%", color: "#111", boxShadow: "0 20px 60px rgba(0,0,0,0.4)", border: "2px solid #3B82F6", position: "relative" }}
        onClick={e => e.stopPropagation()}>
        <button onClick={onClose} style={{ position: "absolute", top: "16px", right: "16px", background: "none", border: "none", cursor: "pointer", color: "#888" }}>
          <X size={20} />
        </button>
        <h2 style={{ fontSize: "20px", fontWeight: 700, marginBottom: "8px" }}>Advanced Export</h2>
        <p style={{ fontSize: "14px", color: "#555", marginBottom: "24px" }}>Which columns would you like to include in the export?</p>

        <div style={{ display: "flex", gap: "24px", flexWrap: "wrap", marginBottom: "28px" }}>
          {EXPORT_COLS.map(({ key, label, rows }) => {
            const active = selected.has(key);
            return (
              <label key={key} style={{ display: "flex", alignItems: "flex-start", gap: "8px", cursor: "pointer" }}>
                <div onClick={() => toggle(key)} style={{
                  width: "18px", height: "18px", borderRadius: "4px", flexShrink: 0, marginTop: "1px",
                  border: `2px solid ${active ? "#3B82F6" : "#d1d5db"}`,
                  background: active ? "#3B82F6" : "#fff",
                  display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer",
                }}>
                  {active && <Check size={11} color="#fff" strokeWidth={3} />}
                </div>
                <div>
                  <div style={{ fontSize: "14px", fontWeight: 600 }}>{label}</div>
                  <div style={{ fontSize: "12px", color: "#999" }}>{rows} rows</div>
                </div>
              </label>
            );
          })}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "16px", flexWrap: "wrap" }}>
          <button
            onClick={() => { if (selected.size > 0) { downloadCSV(domain, selected); onClose(); } }}
            style={{
              padding: "10px 22px", borderRadius: "8px", fontSize: "14px", fontWeight: 600, cursor: selected.size > 0 ? "pointer" : "not-allowed",
              background: selected.size > 0 ? "#4b5563" : "#9ca3af", color: "#fff", border: "none",
            }}
          >
            Export to CSV
          </button>
          <p style={{ fontSize: "12px", color: "#888", flex: 1 }}>
            This export has unlimited rows and may take a while to complete if you select too many columns, please be patient.
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── Custom tooltip ───────────────────────────────────────────────────────────
function ChartTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload as Pt;
  if (!d) return null;
  const rows: { m: Metric; curr: string; prev: string; pct: string }[] = [
    { m: "clicks",      curr: String(d.clicks),    prev: String(d.clicksC),     pct: pctStr(d.clicks, d.clicksC) },
    { m: "impressions", curr: fmtK(d.impressions), prev: fmtK(d.impressionsC),  pct: pctStr(d.impressions, d.impressionsC) },
    { m: "ctr",         curr: `${d.ctr}%`,         prev: `${d.ctrC}%`,          pct: pctStr(d.ctr, d.ctrC) },
    { m: "position",    curr: String(d.position),  prev: String(d.positionC),   pct: pctStr(d.position, d.positionC) },
  ];
  return (
    <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: "10px", padding: "10px 14px", fontSize: "12px", color: "#111", minWidth: "210px", boxShadow: "0 4px 20px rgba(0,0,0,0.15)" }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 90px 50px", gap: "2px 8px", marginBottom: "6px", paddingBottom: "6px", borderBottom: "1px solid #e5e7eb", color: "#888", fontSize: "11px" }}>
        <div />
        <div style={{ textAlign: "right", fontWeight: 500 }}>{d.date}</div>
        <div style={{ textAlign: "right", borderBottom: "2px dashed #ccc", paddingBottom: "2px" }}>Prev</div>
      </div>
      {rows.map(({ m, curr, prev, pct }) => (
        <div key={m} style={{ display: "grid", gridTemplateColumns: "1fr 90px 50px", gap: "2px 8px", marginBottom: "3px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
            <span style={{ width: "7px", height: "7px", borderRadius: "50%", background: MC[m].color, flexShrink: 0, display: "inline-block" }} />
            <span style={{ color: "#555" }}>{MC[m].label}</span>
          </div>
          <div style={{ textAlign: "right", fontWeight: 600 }}>
            {curr}
            {pct && <span style={{ fontSize: "10px", marginLeft: "3px", color: pct.startsWith("↑") ? "#10B981" : "#EF4444" }}> {pct}</span>}
          </div>
          <div style={{ textAlign: "right", color: "#999" }}>{prev}</div>
        </div>
      ))}
    </div>
  );
}

// ─── Multi-metric chart ───────────────────────────────────────────────────────
function MultiMetricChart({ data, activeMetrics }: { data: Pt[]; activeMetrics: Set<Metric> }) {
  const metrics: { m: Metric; nKey: string; cKey: string }[] = [
    { m: "clicks",      nKey: "cN",  cKey: "cCN" },
    { m: "impressions", nKey: "iN",  cKey: "iCN" },
    { m: "ctr",         nKey: "tN",  cKey: "tCN" },
    { m: "position",    nKey: "pN",  cKey: "pCN" },
  ];
  return (
    <ResponsiveContainer width="100%" height={90}>
      <AreaChart data={data} margin={{ top: 2, right: 0, left: 0, bottom: 0 }}>
        <defs>
          {metrics.map(({ m }) => (
            <linearGradient key={m} id={`g-${m}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={MC[m].color} stopOpacity={0.2} />
              <stop offset="100%" stopColor={MC[m].color} stopOpacity={0} />
            </linearGradient>
          ))}
        </defs>
        <Tooltip content={<ChartTooltip />} cursor={{ stroke: "#aaa", strokeWidth: 1, strokeDasharray: "3 2" }} />
        {/* Comparison dashed lines first (behind) */}
        {metrics.map(({ m, cKey }) => activeMetrics.has(m) && (
          <Area key={`c-${m}`} type="monotone" dataKey={cKey}
            stroke={MC[m].color} strokeWidth={1} strokeDasharray="4 3"
            fill="none" dot={false} isAnimationActive={false} legendType="none" />
        ))}
        {/* Main solid lines */}
        {metrics.map(({ m, nKey }) => activeMetrics.has(m) && (
          <Area key={m} type="monotone" dataKey={nKey}
            stroke={MC[m].color} strokeWidth={1.5}
            fill={`url(#g-${m})`} dot={false} isAnimationActive={false} />
        ))}
      </AreaChart>
    </ResponsiveContainer>
  );
}

// ─── Dropdown ─────────────────────────────────────────────────────────────────
function Dropdown({ trigger, children, align = "left" }: { trigger: React.ReactNode; children: React.ReactNode; align?: "left" | "right" }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);
  return (
    <div ref={ref} style={{ position: "relative" }}>
      <div onClick={() => setOpen(o => !o)}>{trigger}</div>
      {open && (
        <div style={{ position: "absolute", top: "calc(100% + 6px)", [align === "right" ? "right" : "left"]: 0, background: "#1a1a1a", border: "1px solid var(--color-border)", borderRadius: "12px", boxShadow: "0 8px 32px rgba(0,0,0,0.6)", zIndex: 100, minWidth: "200px", overflow: "hidden" }}>
          {children}
        </div>
      )}
    </div>
  );
}

// Style helpers
const mi = (active = false): React.CSSProperties => ({
  display: "flex", alignItems: "center", gap: "10px", padding: "9px 14px", fontSize: "13px", cursor: "pointer", width: "100%",
  background: active ? "rgba(59,130,246,0.12)" : "transparent",
  color: active ? "#3B82F6" : "var(--color-text-primary)", transition: "background 0.1s",
});
const ms = (label: string) => (
  <div style={{ padding: "10px 14px 4px", fontSize: "11px", fontWeight: 600, color: "var(--color-text-secondary)", textTransform: "uppercase", letterSpacing: "0.06em" }}>{label}</div>
);
const md = <div style={{ height: "1px", background: "var(--color-border)", margin: "4px 0" }} />;
const tbBtn = (active = false): React.CSSProperties => ({
  display: "flex", alignItems: "center", gap: "6px", padding: "7px 13px", borderRadius: "8px",
  border: `1px solid ${active ? "#3B82F6" : "var(--color-border)"}`,
  background: active ? "rgba(59,130,246,0.1)" : "var(--color-card)",
  color: active ? "#3B82F6" : "var(--color-text-secondary)",
  fontSize: "13px", fontWeight: 500, cursor: "pointer", whiteSpace: "nowrap" as const,
});

// ─── Main page ────────────────────────────────────────────────────────────────
export default function PortfolioPage() {
  const [sites, setSites]       = useState<any[]>([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState("");
  const { blur } = usePrivacy();
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const router = useRouter();
  const [hidden,    setHidden]    = useState<Set<string>>(new Set());
  const [exportSite, setExportSite] = useState<string | null>(null);

  const [activeMetrics, setActiveMetrics] = useState<Set<Metric>>(new Set(["clicks", "impressions", "ctr", "position"]));
  const [sortBy, setSortBy]     = useState<SortBy>("az");
  const [period, setPeriod]     = useState("3m");
  const [periodView, setPeriodView] = useState<PeriodView>("day");
  const [comparison, setComparison] = useState<Comparison>("previous");
  const [prevTrend, setPrevTrend]   = useState(true);
  const [matchWd, setMatchWd]       = useState(true);
  const [showPct, setShowPct]       = useState(true);
  const [searchType, setSearchType] = useState<SearchType>("web");
  const [branded, setBranded]       = useState<BrandedFilter>("all");

  useEffect(() => {
    fetch("/api/gsc/sites").then(r => r.json()).then(d => { if (d.sites) setSites(d.sites); }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const sitesWithData = useMemo(() => sites.map(s => ({ ...s, ...makeSiteData() })), [sites]);
  const filtered    = sitesWithData.filter(s => getDomain(s.url).toLowerCase().includes(search.toLowerCase()));
  const favSites    = filtered.filter(s => favorites.has(s.id) && !hidden.has(s.id));
  const restSites   = filtered.filter(s => !favorites.has(s.id) && !hidden.has(s.id));
  const hiddenSites = filtered.filter(s => hidden.has(s.id));

  const toggleMetric = (m: Metric) => setActiveMetrics(p => { const n = new Set(p); n.has(m) ? n.delete(m) : n.add(m); return n; });
  const toggleFav    = (id: string) => setFavorites(p => { const n = new Set(p); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const toggleHide   = (id: string) => setHidden(p => { const n = new Set(p); n.has(id) ? n.delete(id) : n.add(id); return n; });

  const periodGroups = buildPeriodGroups();

  // Sort dropdown
  const SortDd = (
    <Dropdown trigger={<button style={tbBtn()}><ArrowUpDown size={13} /> Sort</button>}>
      {(["az","total","growth","growth_pct"] as SortBy[]).map(v => {
        const lbl: Record<SortBy,string> = { az:"A to Z", total:"Total", growth:"Growth", growth_pct:"Growth %" };
        return <button key={v} style={mi(sortBy===v)} onClick={() => setSortBy(v)}>{lbl[v]}{sortBy===v && <Check size={12} style={{marginLeft:"auto"}} />}</button>;
      })}
      {md}{ms("Metric")}
      {(["clicks","impressions","ctr","position"] as Metric[]).map(m => (
        <button key={m} style={mi(activeMetrics.has(m))} onClick={() => toggleMetric(m)}>
          <span style={{color:MC[m].color}}>●</span> {MC[m].label}
          {activeMetrics.has(m) && <Check size={12} style={{marginLeft:"auto"}} />}
        </button>
      ))}
    </Dropdown>
  );

  // Filter dropdown
  const FilterDd = (
    <Dropdown trigger={<button style={tbBtn()}><SlidersHorizontal size={13} /> Filter</button>}>
      {[{l:"Query",i:<Search size={13}/>},{l:"Page",i:<FileText size={13}/>},{l:"Country",i:<Globe size={13}/>},{l:"Device",i:<Monitor size={13}/>}]
        .map(({l,i}) => <button key={l} style={mi()}>{i} {l}</button>)}
      {md}{ms("Branded Queries")}
      <div style={{padding:"6px 14px 10px",display:"flex",gap:"6px"}}>
        {(["all","branded","nonbranded"] as BrandedFilter[]).map(v => (
          <button key={v} onClick={() => setBranded(v)} style={{padding:"4px 10px",borderRadius:"20px",fontSize:"12px",fontWeight:500,cursor:"pointer",border:`1px solid ${branded===v?"#3B82F6":"var(--color-border)"}`,background:branded===v?"rgba(59,130,246,0.1)":"transparent",color:branded===v?"#3B82F6":"var(--color-text-secondary)"}}>
            {v==="all"?"All":v==="branded"?"B":"🚫B"}
          </button>
        ))}
      </div>
      {md}{ms("Preset Filters")}
      <button style={mi()}>People Also Ask</button>
      <button style={mi()}>Long Tail Keywords</button>
    </Dropdown>
  );

  // Period dropdown
  const PeriodDd = (
    <Dropdown trigger={<button style={{...tbBtn(),gap:"8px"}}>{getPeriodLabel(period)} <ChevronDown size={13}/></button>} align="right">
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",minWidth:"460px"}}>
        {/* Left: comparison */}
        <div style={{borderRight:"1px solid var(--color-border)"}}>
          {ms("Comparison Period")}
          {([{l:"Disabled",v:"disabled"},{l:"Previous Period",v:"previous"},{l:"Year Over Year",v:"yoy"},{l:"Previous Month",v:"prev_month"},{l:"Custom",v:"custom"}] as {l:string;v:Comparison}[]).map(({l,v}) => (
            <button key={v} style={{...mi(comparison===v),fontWeight:comparison===v?600:400,color:comparison===v?"#fff":"var(--color-text-secondary)"}} onClick={()=>setComparison(v)}>{l}</button>
          ))}
          {md}{ms("Comparison Settings")}
          {([{l:"Previous Trend Line",val:prevTrend,set:setPrevTrend},{l:"Match Weekdays",val:matchWd,set:setMatchWd},{l:"Show change %",val:showPct,set:setShowPct}]).map(({l,val,set}) => (
            <button key={l} style={mi()} onClick={()=>set(!val)}>
              <div style={{width:"16px",height:"16px",borderRadius:"4px",flexShrink:0,border:`2px solid ${val?"#3B82F6":"var(--color-border)"}`,background:val?"#3B82F6":"transparent",display:"flex",alignItems:"center",justifyContent:"center"}}>
                {val && <Check size={10} color="#fff" />}
              </div>
              {l}
            </button>
          ))}
          {md}{ms("Search Type")}
          {([{l:"Web",v:"web",i:<Globe size={13}/>},{l:"Discover",v:"discover",i:<Compass size={13}/>},{l:"News",v:"news",i:<Newspaper size={13}/>},{l:"Image",v:"image",i:<Image size={13}/>},{l:"Video",v:"video",i:<Video size={13}/>}] as {l:string;v:SearchType;i:React.ReactNode}[]).map(({l,v,i}) => (
            <button key={v} style={mi(searchType===v)} onClick={()=>setSearchType(v)}>{i} {l}{searchType===v&&<Check size={12} style={{marginLeft:"auto"}}/>}</button>
          ))}
        </div>
        {/* Right: periods */}
        <div>
          <div style={{display:"flex",borderBottom:"1px solid var(--color-border)",padding:"6px 8px",gap:"4px"}}>
            {(["day","week","month"] as PeriodView[]).map(v => (
              <button key={v} onClick={()=>setPeriodView(v)} style={{flex:1,padding:"5px 0",borderRadius:"6px",fontSize:"13px",fontWeight:periodView===v?600:400,cursor:"pointer",background:periodView===v?"#fff":"transparent",color:periodView===v?"#111":"var(--color-text-secondary)",border:"none",transition:"all 0.15s"}}>
                {v.charAt(0).toUpperCase()+v.slice(1)}
              </button>
            ))}
          </div>
          <div style={{maxHeight:"420px",overflowY:"auto"}}>
            {periodGroups.map((grp, gi) => (
              <div key={gi}>
                {grp.map(({label,value,desc}) => {
                  const active = period===value;
                  return (
                    <button key={value} style={{...mi(active),flexDirection:"column",alignItems:"flex-start",gap:"1px",padding:"8px 16px"}} onClick={()=>setPeriod(value)}>
                      <span style={{fontWeight:active?700:400,fontSize:"13px"}}>{label}</span>
                      {desc && <span style={{fontSize:"11px",color:"var(--color-text-secondary)",marginTop:"1px"}}>{desc}</span>}
                    </button>
                  );
                })}
                {gi < periodGroups.length-1 && md}
              </div>
            ))}
          </div>
        </div>
      </div>
    </Dropdown>
  );

  // Site card
  function SiteCard({ site }: { site: any }) {
    const domain = getDomain(site.url);
    const isFav  = favorites.has(site.id);
    const sum: Record<Metric,{value:number;change:number}> = site.summary;

    return (
      <div className="card" style={{padding:"14px 16px",display:"flex",flexDirection:"column",gap:"8px",cursor:"pointer"}}
        onClick={() => router.push(`/site/${encodeURIComponent(domain)}`)}>
        {/* Header */}
        <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",gap:"8px"}}>
          {/* Domain */}
          <div style={{display:"flex",alignItems:"center",gap:"6px",minWidth:0}}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={`https://www.google.com/s2/favicons?domain=${domain}&sz=32`} width={16} height={16} alt=""
              style={{borderRadius:"3px",flexShrink:0}} onError={e=>((e.target as HTMLImageElement).style.display="none")} />
            <span style={{fontWeight:500,fontSize:"13px",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",filter:blur?"blur(5px)":"none",transition:"filter 0.25s"}}>
              {domain}
            </span>
            <a href={`https://${domain}`} target="_blank" rel="noreferrer" onClick={e=>e.stopPropagation()} style={{color:"var(--color-text-secondary)",flexShrink:0}}>
              <ExternalLink size={10}/>
            </a>
          </div>

          {/* Metrics 2×2 */}
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"3px 14px",flexShrink:0}}>
            {(["clicks","impressions","ctr","position"] as Metric[]).map(m => {
              if (!activeMetrics.has(m)) return null;
              const {value,change} = sum[m];
              // For position: going UP (positive change) is actually BAD
              const good = m==="position" ? change<=0 : change>=0;
              return (
                <div key={m} style={{display:"flex",alignItems:"center",gap:"4px",fontSize:"12px",whiteSpace:"nowrap"}}>
                  <span style={{color:MC[m].color,fontSize:"10px",fontWeight:700}}>
                    {m==="clicks"?"✦":m==="impressions"?"◉":m==="ctr"?"%":"↑"}
                  </span>
                  <span style={{fontWeight:600}}>{fmtVal(m,value)}</span>
                  <span style={{fontSize:"10px",color:good?"#10B981":"#EF4444",fontWeight:500}}>
                    {change>=0?"↑":"↓"}{Math.abs(change)}%
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Chart */}
        <MultiMetricChart data={site.data} activeMetrics={activeMetrics} />

        {/* Footer: 4 action icons */}
        <div style={{display:"flex",justifyContent:"flex-end",gap:"14px",paddingTop:"2px"}} onClick={e=>e.stopPropagation()}>
          {/* Export */}
          <button title="Advanced Export" onClick={()=>setExportSite(domain)}
            style={{color:"var(--color-text-secondary)",opacity:0.5,transition:"all 0.15s",lineHeight:1}}
            onMouseOver={e=>(e.currentTarget.style.opacity="1")} onMouseOut={e=>(e.currentTarget.style.opacity="0.5")}>
            <Download size={13}/>
          </button>
          {/* Tags */}
          <button title="Tags"
            style={{color:"var(--color-text-secondary)",opacity:0.5,transition:"all 0.15s",lineHeight:1}}
            onMouseOver={e=>(e.currentTarget.style.opacity="1")} onMouseOut={e=>(e.currentTarget.style.opacity="0.5")}>
            <Tag size={13}/>
          </button>
          {/* Hide site */}
          <button title={hidden.has(site.id)?"Unhide site":"Hide site"} onClick={()=>toggleHide(site.id)}
            style={{color:hidden.has(site.id)?"#3B82F6":"var(--color-text-secondary)",opacity:hidden.has(site.id)?1:0.5,transition:"all 0.15s",lineHeight:1}}
            onMouseOver={e=>(e.currentTarget.style.opacity="1")} onMouseOut={e=>{if(!hidden.has(site.id))e.currentTarget.style.opacity="0.5";}}>
            <EyeOff size={13}/>
          </button>
          {/* Favorite */}
          <button title={isFav?"Remove from favorites":"Add to favorites"} onClick={()=>toggleFav(site.id)}
            style={{color:isFav?"var(--color-warning)":"var(--color-text-secondary)",opacity:isFav?1:0.5,transition:"all 0.15s",lineHeight:1}}
            onMouseOver={e=>(e.currentTarget.style.opacity="1")} onMouseOut={e=>{if(!isFav)e.currentTarget.style.opacity="0.5";}}>
            <Star size={13} fill={isFav?"var(--color-warning)":"none"}/>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="main-content">
      {/* Toolbar */}
      <div style={{display:"flex",alignItems:"center",gap:"8px",flexWrap:"wrap"}}>
        <div style={{position:"relative",flex:"1 1 180px"}}>
          <Search size={14} style={{position:"absolute",left:"10px",top:"50%",transform:"translateY(-50%)",color:"var(--color-text-secondary)"}}/>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search sites…"
            style={{width:"100%",padding:"7px 12px 7px 32px",borderRadius:"8px",border:"1px solid var(--color-border)",background:"var(--color-card)",color:"#fff",fontSize:"13px",outline:"none"}}/>
        </div>
        {SortDd}
        {FilterDd}

        {/* Metric icons */}
        <div style={{display:"flex",gap:"4px"}}>
          {([
            {m:"clicks",      icon:<Sparkles size={14}/>, color:"#3B82F6", bg:"rgba(59,130,246,0.12)", title:"Clicks"},
            {m:"impressions", icon:<Eye size={14}/>,      color:"#8B5CF6", bg:"rgba(139,92,246,0.12)", title:"Impressions"},
            {m:"ctr",         icon:<Percent size={14}/>,  color:"#10B981", bg:"rgba(16,185,129,0.12)", title:"CTR"},
            {m:"position",    icon:<MoveUp size={14}/>,   color:"#F59E0B", bg:"rgba(245,158,11,0.12)", title:"Avg Position"},
          ] as {m:Metric;icon:React.ReactNode;color:string;bg:string;title:string}[]).map(({m,icon,color,bg,title}) => {
            const active = activeMetrics.has(m);
            return (
              <button key={m} title={title} onClick={()=>toggleMetric(m)} style={{display:"flex",alignItems:"center",justifyContent:"center",width:"34px",height:"34px",borderRadius:"8px",cursor:"pointer",border:`1px solid ${active?color:"var(--color-border)"}`,background:active?bg:"var(--color-card)",color:active?color:"var(--color-text-secondary)",transition:"all 0.15s"}}>
                {icon}
              </button>
            );
          })}
        </div>

        {PeriodDd}
      </div>

      {/* Body */}
      {loading ? (
        <div style={{textAlign:"center",color:"var(--color-text-secondary)",padding:"80px 0",fontSize:"14px"}}>Loading your sites…</div>
      ) : sites.length===0 ? (
        <div style={{textAlign:"center",color:"var(--color-text-secondary)",padding:"80px 0",fontSize:"14px"}}>
          No sites yet. <a href="/settings" style={{color:"var(--color-accent-purple)"}}>Connect your Google account →</a>
        </div>
      ) : (
        <>
          {favSites.length>0 && (
            <section>
              <div style={{fontSize:"11px",color:"var(--color-text-secondary)",fontWeight:600,marginBottom:"12px",textTransform:"uppercase",letterSpacing:"0.07em"}}>⭐ Favorites ({favSites.length})</div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(340px,1fr))",gap:"12px"}}>
                {favSites.map((s,i)=><SiteCard key={s.id||i} site={s}/>)}
              </div>
            </section>
          )}
          <section>
            <div style={{fontSize:"11px",color:"var(--color-text-secondary)",fontWeight:600,marginBottom:"12px",textTransform:"uppercase",letterSpacing:"0.07em"}}>All Sites ({restSites.length})</div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(340px,1fr))",gap:"12px"}}>
              {restSites.map((s,i)=><SiteCard key={s.id||i} site={s}/>)}
            </div>
          </section>

          {hiddenSites.length>0 && (
            <section>
              <div style={{fontSize:"11px",color:"var(--color-text-secondary)",fontWeight:600,marginBottom:"12px",textTransform:"uppercase",letterSpacing:"0.07em",opacity:0.6}}>🙈 Hidden ({hiddenSites.length})</div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(340px,1fr))",gap:"12px",opacity:0.5}}>
                {hiddenSites.map((s,i)=><SiteCard key={s.id||i} site={s}/>)}
              </div>
            </section>
          )}
        </>
      )}

      {/* Export modal */}
      {exportSite && <ExportModal domain={exportSite} onClose={()=>setExportSite(null)} />}
    </div>
  );
}
