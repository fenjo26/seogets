"use client";

import { useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { usePrivacy } from "@/lib/PrivacyContext";
import {
  ArrowLeft, Sparkles, Eye, Percent, MoveUp,
  SlidersHorizontal, ChevronDown, Smartphone, Monitor, Tablet,
} from "lucide-react";
import {
  ComposedChart, AreaChart, Area, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend,
} from "recharts";

// ─── Colors ───────────────────────────────────────────────────────────────────
const C = {
  clicks:      "#3B82F6",
  impressions: "#8B5CF6",
  ctr:         "#10B981",
  position:    "#F59E0B",
};

// ─── Mock data ────────────────────────────────────────────────────────────────
function rnd(lo: number, hi: number) { return lo + Math.random() * (hi - lo); }
function rndInt(lo: number, hi: number) { return Math.round(rnd(lo, hi)); }

function makeChartData(days = 7) {
  const today = new Date();
  return Array.from({ length: days }, (_, i) => {
    const d = new Date(today); d.setDate(today.getDate() - days + i);
    const label = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    const clicks = rndInt(5, 30);
    const impr   = rndInt(100, 500);
    return {
      date: label,
      clicks, impressions: impr,
      ctr:      +((clicks / impr) * 100).toFixed(1),
      position: +rnd(4, 20).toFixed(1),
      clicksC:      rndInt(3, 25),
      impressionsC: rndInt(80, 400),
      ctrC:      +rnd(2, 12).toFixed(1),
      positionC: +rnd(5, 22).toFixed(1),
    };
  });
}

const QUERIES = [
  "μασαζ στο σπιτι θεσσαλονικη","λεμφικο μασαζ θεσσαλονικη","μασαζ κατοικον θεσσαλονίκη",
  "erotic massage thessaloniki","μασαζ κατοικον θεσσαλονικη","relaxing massage thessaloniki",
  "therapeutic massage","thai massage thessaloniki","deep tissue massage","sports massage greece",
];
const PAGES = [
  "/masaz-kat-oikon-thessaloniki/","/en/massage-thessaloniki/",
  "/masaz-sto-spiti-thessaloniki-kat-oikon-therapeia/","/",
  "/to-kalytero-lemfiko-masaz-thessaloniki/","/sports-massage/",
  "/thai-massage/","/deep-tissue-massage/",
];
const COUNTRIES = [
  { name: "Greece", flag: "🇬🇷" },{ name: "Cyprus", flag: "🇨🇾" },
  { name: "Türkiye", flag: "🇹🇷" },{ name: "North Macedonia", flag: "🇲🇰" },
  { name: "Sweden", flag: "🇸🇪" },{ name: "Italy", flag: "🇮🇹" },
  { name: "Serbia", flag: "🇷🇸" },{ name: "Ireland", flag: "🇮🇪" },
];

function makeRows(labels: string[], baseClicks: number) {
  return labels.map((label, i) => {
    const clicks = Math.max(0, Math.round(baseClicks * Math.exp(-i * 0.3) * (0.7 + Math.random() * 0.6)));
    const impr   = clicks * rndInt(5, 25);
    const ctr    = impr > 0 ? +((clicks / impr) * 100).toFixed(1) : 0;
    const pos    = +rnd(1, 30).toFixed(1);
    const cPct   = rndInt(-20, 300);
    const iPct   = rndInt(-10, 200);
    return { label, clicks, impr, ctr, pos, cPct, iPct };
  });
}

function makeCountryRows() {
  return COUNTRIES.map(({ name, flag }, i) => {
    const clicks = Math.max(0, rndInt(1, 130) * Math.exp(-i * 0.3) | 0);
    const impr   = clicks * rndInt(8, 20);
    const ctr    = impr > 0 ? +((clicks / impr) * 100).toFixed(1) : 0;
    const pos    = +rnd(4, 25).toFixed(1);
    return { name, flag, clicks, impr, ctr, pos, cPct: rndInt(0, 200), iPct: rndInt(10, 400) };
  });
}

// ─── Shared components ────────────────────────────────────────────────────────
function Change({ pct, invert = false }: { pct: number; invert?: boolean }) {
  const good = invert ? pct <= 0 : pct >= 0;
  const color = good ? "#10B981" : "#EF4444";
  const sign = pct >= 0 ? "+" : "";
  return (
    <span style={{ fontSize: "11px", color, fontWeight: 500, marginLeft: "3px" }}>
      {sign}{pct}%
    </span>
  );
}

function fmtK(n: number) { return n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n); }

function TabBar({ tabs, active, onChange }: { tabs: string[]; active: string; onChange: (t: string) => void }) {
  return (
    <div style={{ display: "flex", gap: "2px", background: "#f3f4f6", borderRadius: "8px", padding: "3px" }}>
      {tabs.map(t => (
        <button key={t} onClick={() => onChange(t)} style={{
          padding: "4px 12px", borderRadius: "6px", fontSize: "12px", fontWeight: 500, cursor: "pointer",
          background: active === t ? "#fff" : "transparent",
          color: active === t ? "#111" : "#6b7280",
          border: "none", boxShadow: active === t ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
          transition: "all 0.15s",
        }}>{t}</button>
      ))}
    </div>
  );
}

function DataTable({ title, rows, tabs, blur = false }: {
  title: string;
  rows: { label: string; clicks: number; impr: number; ctr: number; pos: number; cPct: number; iPct: number }[];
  tabs?: string[];
  blur?: boolean;
}) {
  const [tab, setTab] = useState("All");
  const sorted = tab === "Growing"
    ? [...rows].sort((a, b) => b.cPct - a.cPct)
    : tab === "Decaying"
    ? [...rows].sort((a, b) => a.cPct - b.cPct)
    : rows;

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "12px" }}>
        <h3 style={{ fontSize: "15px", fontWeight: 700, color: "#111" }}>{title}</h3>
        {tabs && <TabBar tabs={tabs} active={tab} onChange={setTab} />}
      </div>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
        <thead>
          <tr style={{ borderBottom: "1px solid #e5e7eb" }}>
            <th style={{ textAlign: "left", padding: "8px 0", color: C.clicks, fontWeight: 600 }}>Clicks</th>
            <th style={{ textAlign: "left", padding: "8px 8px", color: C.impressions, fontWeight: 600 }}>Impressions</th>
            <th style={{ textAlign: "left", padding: "8px 8px", color: C.ctr, fontWeight: 600 }}>CTR</th>
            <th style={{ textAlign: "left", padding: "8px 0", color: C.position, fontWeight: 600 }}>Position</th>
          </tr>
        </thead>
        <tbody>
          {sorted.slice(0, 8).map((r, i) => (
            <tr key={i} style={{ borderBottom: "1px solid #f3f4f6", background: i % 2 === 0 ? "#fafafa" : "#fff" }}>
              <td style={{ padding: "8px 0 8px 8px", color: "#374151", maxWidth: "220px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} colSpan={0}>
                <span style={blur ? { filter: "blur(5px)", userSelect: "none", transition: "filter 0.25s", display: "inline-block" } : { transition: "filter 0.25s" }}>
                  {r.label}
                </span>
              </td>
              <td style={{ padding: "8px 0", color: "#111", fontWeight: 500 }}>
                {r.clicks}<Change pct={r.cPct} />
              </td>
              <td style={{ padding: "8px 8px", color: "#6b7280" }}>{fmtK(r.impr)}<Change pct={r.iPct} /></td>
              <td style={{ padding: "8px 8px", color: "#6b7280" }}>{r.ctr}%</td>
              <td style={{ padding: "8px 0", color: "#6b7280" }}>{r.pos}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function CountryTable({ rows }: { rows: ReturnType<typeof makeCountryRows> }) {
  const [tab, setTab] = useState("All");
  const sorted = tab === "Growing" ? [...rows].sort((a, b) => b.cPct - a.cPct)
    : tab === "Decaying" ? [...rows].sort((a, b) => a.cPct - b.cPct) : rows;
  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "12px" }}>
        <h3 style={{ fontSize: "15px", fontWeight: 700, color: "#111" }}>Countries</h3>
        <TabBar tabs={["All", "Growing", "Decaying"]} active={tab} onChange={setTab} />
      </div>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
        <thead>
          <tr style={{ borderBottom: "1px solid #e5e7eb" }}>
            <th style={{ textAlign: "left", padding: "8px 0", color: "#9ca3af", fontWeight: 500 }}></th>
            <th style={{ textAlign: "left", color: C.clicks, fontWeight: 600 }}>Clicks</th>
            <th style={{ textAlign: "left", padding: "8px", color: C.impressions, fontWeight: 600 }}>Impressions</th>
            <th style={{ textAlign: "left", padding: "8px", color: C.ctr, fontWeight: 600 }}>CTR</th>
            <th style={{ textAlign: "left", color: C.position, fontWeight: 600 }}>Position</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((r, i) => (
            <tr key={i} style={{ borderBottom: "1px solid #f3f4f6", background: i % 2 === 0 ? "#fafafa" : "#fff" }}>
              <td style={{ padding: "8px 0 8px 8px" }}>{r.flag} {r.name}</td>
              <td style={{ fontWeight: 500 }}>{r.clicks}<Change pct={r.cPct} /></td>
              <td style={{ padding: "8px" }}>{fmtK(r.impr)}<Change pct={r.iPct} /></td>
              <td style={{ padding: "8px" }}>{r.ctr}%</td>
              <td>{r.pos}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function DeviceTable() {
  const devices = [
    { name: "Mobile", icon: <Smartphone size={14} />, clicks: 138, cPct: 66, impr: 1700, iPct: 75, ctr: 7.9, ctrPct: 5.1, pos: 12.3, posDelta: -1.4 },
    { name: "Desktop", icon: <Monitor size={14} />, clicks: 17, cPct: 6, impr: 689, iPct: 71, ctr: 2.5, ctrPct: 44.9, pos: 17.7, posDelta: -6 },
    { name: "Tablet", icon: <Tablet size={14} />, clicks: 1, cPct: 999, impr: 13, iPct: 18, ctr: 7.7, ctrPct: 999, pos: 17.3, posDelta: 4.9 },
  ];
  const [tab, setTab] = useState("All");
  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "12px" }}>
        <h3 style={{ fontSize: "15px", fontWeight: 700, color: "#111" }}>Devices</h3>
        <TabBar tabs={["All", "Growing", "Decaying"]} active={tab} onChange={setTab} />
      </div>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
        <thead>
          <tr style={{ borderBottom: "1px solid #e5e7eb" }}>
            <th style={{ textAlign: "left", padding: "8px 0", color: "#9ca3af", fontWeight: 500 }}></th>
            <th style={{ textAlign: "left", color: C.clicks, fontWeight: 600 }}>Clicks</th>
            <th style={{ textAlign: "left", padding: "8px", color: C.impressions, fontWeight: 600 }}>Impressions</th>
            <th style={{ textAlign: "left", padding: "8px", color: C.ctr, fontWeight: 600 }}>CTR</th>
            <th style={{ textAlign: "left", color: C.position, fontWeight: 600 }}>Position</th>
          </tr>
        </thead>
        <tbody>
          {devices.map((d, i) => (
            <tr key={i} style={{ borderBottom: "1px solid #f3f4f6", background: i % 2 === 0 ? "#fafafa" : "#fff" }}>
              <td style={{ padding: "8px 0 8px 8px", display: "flex", alignItems: "center", gap: "6px", color: "#374151" }}>
                {d.icon} {d.name}
              </td>
              <td style={{ fontWeight: 500 }}>{d.clicks}<Change pct={d.cPct} /></td>
              <td style={{ padding: "8px" }}>{fmtK(d.impr)}<Change pct={d.iPct} /></td>
              <td style={{ padding: "8px" }}>{d.ctr}%<Change pct={d.ctrPct} /></td>
              <td>{d.pos}<Change pct={d.posDelta} invert /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Placeholder({ icon, title, linkText }: { icon: React.ReactNode; title: string; linkText: string }) {
  return (
    <div style={{ border: "1px dashed #d1d5db", borderRadius: "12px", padding: "40px 24px", display: "flex", flexDirection: "column", alignItems: "center", gap: "8px", background: "#fafafa" }}>
      <div style={{ color: "#9ca3af" }}>{icon}</div>
      <p style={{ fontWeight: 600, color: "#374151", fontSize: "14px" }}>{title}</p>
      <p style={{ fontSize: "13px", color: "#6b7280" }}>
        <span style={{ color: "#3B82F6", cursor: "pointer" }}>{linkText}</span> a {title.toLowerCase().replace("missing ", "").replace(" setup", "")} to activate this report.
      </p>
    </div>
  );
}

// ─── Custom Chart Tooltip ─────────────────────────────────────────────────────
function SiteTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  const d = payload.reduce((acc: any, p: any) => { acc[p.dataKey] = p.value; return acc; }, {} as any);
  return (
    <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: "10px", padding: "10px 14px", fontSize: "12px", color: "#111", boxShadow: "0 4px 20px rgba(0,0,0,0.12)" }}>
      <p style={{ fontWeight: 600, marginBottom: "6px", color: "#374151" }}>{label}</p>
      {[
        { key: "clicks", label: "Clicks", color: C.clicks },
        { key: "impressions", label: "Impressions", color: C.impressions },
        { key: "ctr", label: "CTR", color: C.ctr, suffix: "%" },
        { key: "position", label: "Avg. Position", color: C.position },
      ].map(({ key, label, color, suffix = "" }) => (
        <div key={key} style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "2px" }}>
          <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: color, flexShrink: 0, display: "inline-block" }} />
          <span style={{ color: "#6b7280", flex: 1 }}>{label}</span>
          <span style={{ fontWeight: 600 }}>{d[key]}{suffix}</span>
        </div>
      ))}
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
const TABS = ["Dashboard", "GA4", "Indexing", "Annotations", "Optimize", "Settings"];

export default function SitePage() {
  const params = useParams();
  const router = useRouter();
  const domain = decodeURIComponent(params.id as string);
  const { blur } = usePrivacy();
  const blurStyle: React.CSSProperties = blur
    ? { filter: "blur(6px)", userSelect: "none", transition: "filter 0.25s" }
    : { transition: "filter 0.25s" };

  const [activeTab, setActiveTab] = useState("Dashboard");
  const [period, setPeriod]       = useState("7 days");

  const chartData    = useMemo(() => makeChartData(7), []);
  const queryRows    = useMemo(() => makeRows(QUERIES, 20), []);
  const pageRows     = useMemo(() => makeRows(PAGES, 80), []);
  const countryRows  = useMemo(() => makeCountryRows(), []);

  // Summary metrics
  const totalClicks  = chartData.reduce((s, d) => s + d.clicks, 0);
  const totalImpr    = chartData.reduce((s, d) => s + d.impressions, 0);
  const avgCtr       = +(chartData.reduce((s, d) => s + d.ctr, 0) / chartData.length).toFixed(1);
  const avgPos       = +(chartData.reduce((s, d) => s + d.position, 0) / chartData.length).toFixed(1);

  // Query counting mock
  const qcData = chartData.map(d => ({
    date: d.date,
    "1-3":   rndInt(1, 5),
    "4-10":  rndInt(3, 15),
    "11-20": rndInt(5, 20),
    "21+":   rndInt(8, 30),
  }));

  return (
    <div style={{ minHeight: "100vh", background: "#fff", color: "#111", fontFamily: "Inter, sans-serif" }}>
      {/* Top nav */}
      <div style={{ borderBottom: "1px solid #e5e7eb", padding: "0 32px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0" }}>
          {/* Breadcrumb */}
          <button onClick={() => router.push("/")} style={{ display: "flex", alignItems: "center", gap: "6px", padding: "16px 0", color: "#374151", fontSize: "14px", fontWeight: 600, cursor: "pointer", border: "none", background: "none" }}>
            <span style={{ opacity: 0.5 }}>SEO Gets</span>
          </button>
          <span style={{ color: "#9ca3af", margin: "0 8px" }}>/</span>
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={`https://www.google.com/s2/favicons?domain=${domain}&sz=32`} width={14} height={14} alt="" style={{ borderRadius: "2px" }} onError={e => ((e.target as HTMLImageElement).style.display = "none")} />
            <span style={{ fontSize: "14px", fontWeight: 600, ...blurStyle }}>{domain}</span>
          </div>
          <span style={{ margin: "0 24px", color: "#e5e7eb" }}>|</span>
          {/* Tab nav */}
          <nav style={{ display: "flex", gap: "0" }}>
            {TABS.map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)} style={{
                padding: "16px 14px", fontSize: "13px", fontWeight: activeTab === tab ? 600 : 400,
                color: activeTab === tab ? "#111" : "#6b7280",
                borderBottom: activeTab === tab ? "2px solid #111" : "2px solid transparent",
                cursor: "pointer", border: "none", borderBottom: activeTab === tab ? "2px solid #111" : "2px solid transparent",
                background: "none", transition: "all 0.15s",
              }}>{tab}</button>
            ))}
          </nav>
        </div>

        {/* Right controls */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <button style={{ display: "flex", alignItems: "center", gap: "5px", padding: "6px 12px", borderRadius: "8px", border: "1px solid #e5e7eb", background: "#fff", color: "#6b7280", fontSize: "12px", cursor: "pointer" }}>
            <SlidersHorizontal size={13} /> Filter
          </button>
          {[
            { icon: <Sparkles size={13} />, color: C.clicks },
            { icon: <Eye size={13} />, color: C.impressions },
            { icon: <Percent size={13} />, color: C.ctr },
            { icon: <MoveUp size={13} />, color: C.position },
          ].map(({ icon, color }, i) => (
            <button key={i} style={{ width: "30px", height: "30px", borderRadius: "6px", border: "1px solid #e5e7eb", background: "#fff", color, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
              {icon}
            </button>
          ))}
          <select value={period} onChange={e => setPeriod(e.target.value)} style={{ padding: "6px 10px", borderRadius: "8px", border: "1px solid #e5e7eb", fontSize: "12px", color: "#374151", cursor: "pointer", outline: "none" }}>
            {["7 days", "14 days", "28 days", "3 months", "6 months", "12 months"].map(p => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: "28px 32px", display: "flex", flexDirection: "column", gap: "32px" }}>

        {/* Metric summary */}
        <div style={{ display: "flex", alignItems: "center", gap: "28px" }}>
          {[
            { icon: <Sparkles size={14} style={{ color: C.clicks }} />, val: totalClicks, pct: 54 },
            { icon: <Eye size={14} style={{ color: C.impressions }} />, val: fmtK(totalImpr), pct: 74 },
            { icon: <Percent size={14} style={{ color: C.ctr }} />, val: `${avgCtr}`, pct: 11.1 },
            { icon: <MoveUp size={14} style={{ color: C.position }} />, val: avgPos, pct: 2.7 },
          ].map(({ icon, val, pct }, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: "5px" }}>
              {icon}
              <span style={{ fontSize: "22px", fontWeight: 700, color: "#111" }}>{val}</span>
              <span style={{ fontSize: "13px", color: "#10B981", fontWeight: 600 }}>+{pct}%</span>
            </div>
          ))}
        </div>

        {/* Main chart */}
        <div style={{ background: "#fff", borderRadius: "12px" }}>
          <ResponsiveContainer width="100%" height={300}>
            <ComposedChart data={chartData} margin={{ top: 8, right: 50, left: 0, bottom: 0 }}>
              <defs>
                {(["clicks", "impressions", "ctr", "position"] as const).map(m => (
                  <linearGradient key={m} id={`sg-${m}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={C[m]} stopOpacity={0.18} />
                    <stop offset="100%" stopColor={C[m]} stopOpacity={0} />
                  </linearGradient>
                ))}
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
              <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#9ca3af" }} />
              <YAxis yAxisId="left"  axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#9ca3af" }} />
              <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#9ca3af" }} />
              <Tooltip content={<SiteTooltip />} cursor={{ stroke: "#e5e7eb", strokeWidth: 1 }} />
              {/* Comparison dashed */}
              <Line yAxisId="left"  type="monotone" dataKey="clicksC"      stroke={C.clicks}      strokeWidth={1} strokeDasharray="4 3" dot={false} legendType="none" />
              <Line yAxisId="right" type="monotone" dataKey="impressionsC" stroke={C.impressions}  strokeWidth={1} strokeDasharray="4 3" dot={false} legendType="none" />
              {/* Main */}
              <Area yAxisId="left"  type="monotone" dataKey="clicks"      stroke={C.clicks}      strokeWidth={2} fill={`url(#sg-clicks)`}      dot={false} />
              <Area yAxisId="right" type="monotone" dataKey="impressions" stroke={C.impressions}  strokeWidth={2} fill={`url(#sg-impressions)`} dot={false} />
              <Line yAxisId="left"  type="monotone" dataKey="ctr"         stroke={C.ctr}          strokeWidth={1.5} dot={false} />
              <Line yAxisId="left"  type="monotone" dataKey="position"    stroke={C.position}     strokeWidth={1.5} dot={false} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        {/* Topic Clusters + Content Groups */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
          <div>
            <h3 style={{ fontSize: "15px", fontWeight: 700, marginBottom: "12px" }}>Topic Clusters</h3>
            <Placeholder icon={<MoveUp size={28} />} title="Missing Topic Clusters" linkText="Define" />
          </div>
          <div>
            <h3 style={{ fontSize: "15px", fontWeight: 700, marginBottom: "12px" }}>Content Groups</h3>
            <Placeholder icon={
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="8" y="8" width="8" height="8" rx="1"/><rect x="3" y="3" width="5" height="5" rx="1"/><rect x="16" y="3" width="5" height="5" rx="1"/><rect x="3" y="16" width="5" height="5" rx="1"/><rect x="16" y="16" width="5" height="5" rx="1"/></svg>
            } title="Missing Content Groups" linkText="Define" />
          </div>
        </div>

        {/* Queries + Pages */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "32px" }}>
          <DataTable title="Queries" rows={queryRows} tabs={["All", "Growing", "Decaying"]} blur={blur} />
          <DataTable title="Pages"   rows={pageRows}  tabs={["All", "Growing", "Decaying"]} blur={blur} />
        </div>

        {/* Branded + Query Counting */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "12px" }}>
              <h3 style={{ fontSize: "15px", fontWeight: 700 }}>Branded vs Non-Branded Clicks</h3>
              <TabBar tabs={["Trend", "Comparison"]} active="Trend" onChange={() => {}} />
            </div>
            <Placeholder icon={
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="9"/><path d="M9 9h1.5a1.5 1.5 0 0 1 0 3H9v3m3-6h1.5"/></svg>
            } title="Missing Branded Keywords" linkText="Define" />
          </div>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "12px" }}>
              <h3 style={{ fontSize: "15px", fontWeight: 700 }}>Query Counting</h3>
              <TabBar tabs={["Total", "By Ranking"]} active="Total" onChange={() => {}} />
            </div>
            <div style={{ display: "flex", gap: "16px", marginBottom: "12px" }}>
              {[
                { label: "1-3", color: "#F59E0B", pct: 50 },
                { label: "4-10", color: "#1e40af", pct: 32 },
                { label: "11-20", color: "#3B82F6", pct: 56 },
                { label: "21+", color: "#93c5fd", pct: 19 },
              ].map(({ label, color, pct }) => (
                <div key={label} style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                    <div style={{ width: "12px", height: "12px", background: color, borderRadius: "2px" }} />
                    <span style={{ fontSize: "12px", fontWeight: 600, color: "#374151" }}>{label}</span>
                  </div>
                  <span style={{ fontSize: "11px", color: "#10B981", fontWeight: 500 }}>+{pct}%</span>
                </div>
              ))}
            </div>
            <ResponsiveContainer width="100%" height={160}>
              <AreaChart data={qcData} margin={{ top: 4, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "#9ca3af" }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "#9ca3af" }} />
                <Tooltip contentStyle={{ fontSize: "12px", borderRadius: "8px" }} />
                <Area type="monotone" dataKey="1-3"   stroke="#F59E0B" strokeWidth={1.5} fill="rgba(245,158,11,0.15)"  dot={false} />
                <Area type="monotone" dataKey="4-10"  stroke="#1e40af" strokeWidth={1.5} fill="rgba(30,64,175,0.15)"  dot={false} />
                <Area type="monotone" dataKey="11-20" stroke="#3B82F6" strokeWidth={1.5} fill="rgba(59,130,246,0.15)" dot={false} />
                <Area type="monotone" dataKey="21+"   stroke="#93c5fd" strokeWidth={1.5} fill="rgba(147,197,253,0.15)" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Countries + New Rankings */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "32px" }}>
          <CountryTable rows={countryRows} />
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "12px" }}>
              <h3 style={{ fontSize: "15px", fontWeight: 700 }}>New Rankings</h3>
              <TabBar tabs={["Queries", "Pages"]} active="Queries" onChange={() => {}} />
            </div>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid #e5e7eb" }}>
                  <th style={{ textAlign: "left", padding: "8px 0", color: "#9ca3af", fontWeight: 500 }}></th>
                  <th style={{ textAlign: "left", color: "#6b7280", fontWeight: 600, fontSize: "12px" }}>Clicks</th>
                  <th style={{ textAlign: "left", padding: "8px", color: C.impressions, fontWeight: 600, fontSize: "12px" }}>Impressions</th>
                  <th style={{ textAlign: "left", padding: "8px", color: C.ctr, fontWeight: 600, fontSize: "12px" }}>CTR</th>
                  <th style={{ textAlign: "left", color: C.position, fontWeight: 600, fontSize: "12px" }}>Position</th>
                </tr>
              </thead>
              <tbody>
                {QUERIES.slice(0, 8).map((q, i) => (
                  <tr key={i} style={{ borderBottom: "1px solid #f3f4f6" }}>
                    <td style={{ padding: "7px 0 7px 0", maxWidth: "200px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontSize: "12px", color: "#374151" }}>{q}</td>
                    <td style={{ fontSize: "12px" }}>0 <span style={{ color: "#6b7280" }}>~0%</span></td>
                    <td style={{ padding: "7px 8px", fontSize: "12px" }}>{rndInt(1, 40)} <span style={{ color: "#10B981" }}>+∞%</span></td>
                    <td style={{ padding: "7px 8px", fontSize: "12px" }}>0%</td>
                    <td style={{ fontSize: "12px" }}>{+rnd(5, 60).toFixed(1)} <span style={{ color: "#6b7280" }}>~0</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Devices */}
        <DeviceTable />

        {/* Footer */}
        <div style={{ borderTop: "1px solid #e5e7eb", paddingTop: "20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <div style={{ width: "20px", height: "20px", borderRadius: "4px", background: "#8B5CF6" }} />
              <span style={{ fontSize: "14px", fontWeight: 700 }}>SEO Gets</span>
            </div>
            <span style={{ fontSize: "13px", color: "#6b7280", cursor: "pointer" }}>Changelog</span>
          </div>
          <span style={{ fontSize: "12px", color: "#9ca3af" }}>© 2026 SEO Gets LLC. All rights reserved.</span>
        </div>
      </div>
    </div>
  );
}
