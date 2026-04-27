"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import ContentDecayMap from "@/components/ContentDecayMap";
import KeywordCannibalization from "@/components/KeywordCannibalization";
import StrikingDistanceKeywords from "@/components/StrikingDistanceKeywords";
import SiteSettingsTab from "@/components/SiteSettingsTab";
import CtrBenchmark from "@/components/CtrBenchmark";
import { useParams, useRouter } from "next/navigation";
import { usePrivacy } from "@/lib/PrivacyContext";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import {
  ArrowLeft, Sparkles, Eye, Percent, MoveUp,
  SlidersHorizontal, ChevronDown, Smartphone, Monitor, Tablet,
  Users, Activity, Zap, DollarSign, Link2, Check,
  FileText, Globe, Search, ArrowLeftRight, BookmarkCheck, Calendar, X,
} from "lucide-react";
import {
  ComposedChart, AreaChart, Area, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend,
} from "recharts";

// ─── Types ────────────────────────────────────────────────────────────────────
type Metric = "clicks" | "impressions" | "ctr" | "position";

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

// Tab values are always English internally; TabBar translates display labels
function TabBar({ tabs, active, onChange }: { tabs: string[]; active: string; onChange: (t: string) => void }) {
  const { t } = useLanguage();
  const labelMap: Record<string, string> = {
    "All":        t("tabAll"),
    "Growing":    t("tabGrowing"),
    "Decaying":   t("tabDecaying"),
    "Trend":      t("tabTrend"),
    "Comparison": t("tabComparison"),
    "Total":      t("tabTotal"),
    "By Ranking": t("tabByRanking"),
    "Queries":    t("queriesTable"),
    "Pages":      t("pagesTable"),
  };
  return (
    <div style={{ display: "flex", gap: "2px", background: "var(--color-card)", borderRadius: "8px", padding: "3px", border: "1px solid var(--color-border)" }}>
      {tabs.map(tab => (
        <button key={tab} onClick={() => onChange(tab)} style={{
          padding: "4px 12px", borderRadius: "6px", fontSize: "12px", fontWeight: 500, cursor: "pointer",
          background: active === tab ? "var(--color-bg)" : "transparent",
          color: active === tab ? "var(--color-text-primary)" : "var(--color-text-secondary)",
          border: "none", boxShadow: active === tab ? "0 1px 3px rgba(0,0,0,0.2)" : "none",
          transition: "all 0.15s",
        }}>{labelMap[tab] ?? tab}</button>
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
  const { t } = useLanguage();
  const [tab, setTab] = useState("All");
  const sorted = tab === "Growing"
    ? [...rows].sort((a, b) => b.cPct - a.cPct)
    : tab === "Decaying"
    ? [...rows].sort((a, b) => a.cPct - b.cPct)
    : rows;

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "12px" }}>
        <h3 style={{ fontSize: "15px", fontWeight: 700, color: "var(--color-text-primary)" }}>{title}</h3>
        {tabs && <TabBar tabs={tabs} active={tab} onChange={setTab} />}
      </div>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
        <thead>
          <tr style={{ borderBottom: "1px solid var(--color-border)" }}>
            {/* first column: label (no header text) */}
            <th style={{ textAlign: "left", padding: "8px 0", color: "var(--color-text-secondary)", fontWeight: 500 }}></th>
            <th style={{ textAlign: "left", padding: "8px 8px", color: C.clicks, fontWeight: 600 }}>{t("clicks")}</th>
            <th style={{ textAlign: "left", padding: "8px 8px", color: C.impressions, fontWeight: 600 }}>{t("impressions")}</th>
            <th style={{ textAlign: "left", padding: "8px 8px", color: C.ctr, fontWeight: 600 }}>CTR</th>
            <th style={{ textAlign: "left", padding: "8px 0", color: C.position, fontWeight: 600 }}>{t("position")}</th>
          </tr>
        </thead>
        <tbody>
          {sorted.slice(0, 8).map((r, i) => (
            <tr key={i} style={{ borderBottom: "1px solid var(--color-border)", background: i % 2 === 0 ? "rgba(255,255,255,0.03)" : "transparent" }}>
              <td style={{ padding: "8px 8px 8px 0", color: "var(--color-text-primary)", maxWidth: "220px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                <span style={blur ? { filter: "blur(5px)", userSelect: "none", transition: "filter 0.25s", display: "inline-block" } : { transition: "filter 0.25s" }}>
                  {r.label}
                </span>
              </td>
              <td style={{ padding: "8px 8px", color: "var(--color-text-primary)", fontWeight: 500 }}>
                {r.clicks}<Change pct={r.cPct} />
              </td>
              <td style={{ padding: "8px 8px", color: "var(--color-text-secondary)" }}>{fmtK(r.impr)}<Change pct={r.iPct} /></td>
              <td style={{ padding: "8px 8px", color: "var(--color-text-secondary)" }}>{r.ctr}%</td>
              <td style={{ padding: "8px 0", color: "var(--color-text-secondary)" }}>{r.pos}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function CountryTable({ rows }: { rows: ReturnType<typeof makeCountryRows> }) {
  const { t } = useLanguage();
  const [tab, setTab] = useState("All");
  const sorted = tab === "Growing" ? [...rows].sort((a, b) => b.cPct - a.cPct)
    : tab === "Decaying" ? [...rows].sort((a, b) => a.cPct - b.cPct) : rows;
  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "12px" }}>
        <h3 style={{ fontSize: "15px", fontWeight: 700, color: "var(--color-text-primary)" }}>{t("countries")}</h3>
        <TabBar tabs={["All", "Growing", "Decaying"]} active={tab} onChange={setTab} />
      </div>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
        <thead>
          <tr style={{ borderBottom: "1px solid var(--color-border)" }}>
            <th style={{ textAlign: "left", padding: "8px 0", color: "var(--color-text-secondary)", fontWeight: 500 }}></th>
            <th style={{ textAlign: "left", padding: "8px 8px", color: C.clicks, fontWeight: 600 }}>{t("clicks")}</th>
            <th style={{ textAlign: "left", padding: "8px 8px", color: C.impressions, fontWeight: 600 }}>{t("impressions")}</th>
            <th style={{ textAlign: "left", padding: "8px 8px", color: C.ctr, fontWeight: 600 }}>CTR</th>
            <th style={{ textAlign: "left", padding: "8px 0", color: C.position, fontWeight: 600 }}>{t("position")}</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((r, i) => (
            <tr key={i} style={{ borderBottom: "1px solid var(--color-border)", background: i % 2 === 0 ? "rgba(255,255,255,0.03)" : "transparent" }}>
              <td style={{ padding: "8px 8px 8px 0", color: "var(--color-text-primary)" }}>{r.flag} {r.name}</td>
              <td style={{ padding: "8px 8px", fontWeight: 500, color: "var(--color-text-primary)" }}>{r.clicks}<Change pct={r.cPct} /></td>
              <td style={{ padding: "8px 8px", color: "var(--color-text-secondary)" }}>{fmtK(r.impr)}<Change pct={r.iPct} /></td>
              <td style={{ padding: "8px 8px", color: "var(--color-text-secondary)" }}>{r.ctr}%</td>
              <td style={{ padding: "8px 0", color: "var(--color-text-secondary)" }}>{r.pos}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function DeviceTable() {
  const { t } = useLanguage();
  const devices = [
    { name: t("deviceMobile"),  icon: <Smartphone size={14} />, clicks: 138, cPct: 66, impr: 1700, iPct: 75, ctr: 7.9, ctrPct: 5.1, pos: 12.3, posDelta: -1.4 },
    { name: t("deviceDesktop"), icon: <Monitor size={14} />,    clicks: 17,  cPct: 6,  impr: 689,  iPct: 71, ctr: 2.5, ctrPct: 44.9, pos: 17.7, posDelta: -6 },
    { name: t("deviceTablet"),  icon: <Tablet size={14} />,     clicks: 1,   cPct: 999, impr: 13,  iPct: 18, ctr: 7.7, ctrPct: 999, pos: 17.3, posDelta: 4.9 },
  ];
  const [tab, setTab] = useState("All");
  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "12px" }}>
        <h3 style={{ fontSize: "15px", fontWeight: 700, color: "var(--color-text-primary)" }}>{t("devices")}</h3>
        <TabBar tabs={["All", "Growing", "Decaying"]} active={tab} onChange={setTab} />
      </div>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
        <thead>
          <tr style={{ borderBottom: "1px solid var(--color-border)" }}>
            <th style={{ textAlign: "left", padding: "8px 0", color: "var(--color-text-secondary)", fontWeight: 500 }}></th>
            <th style={{ textAlign: "left", padding: "8px 8px", color: C.clicks, fontWeight: 600 }}>{t("clicks")}</th>
            <th style={{ textAlign: "left", padding: "8px 8px", color: C.impressions, fontWeight: 600 }}>{t("impressions")}</th>
            <th style={{ textAlign: "left", padding: "8px 8px", color: C.ctr, fontWeight: 600 }}>CTR</th>
            <th style={{ textAlign: "left", padding: "8px 0", color: C.position, fontWeight: 600 }}>{t("position")}</th>
          </tr>
        </thead>
        <tbody>
          {devices.map((d, i) => (
            <tr key={i} style={{ borderBottom: "1px solid var(--color-border)", background: i % 2 === 0 ? "rgba(255,255,255,0.03)" : "transparent" }}>
              <td style={{ padding: "8px 8px 8px 0", display: "flex", alignItems: "center", gap: "6px", color: "var(--color-text-primary)" }}>
                {d.icon} {d.name}
              </td>
              <td style={{ padding: "8px 8px", fontWeight: 500, color: "var(--color-text-primary)" }}>{d.clicks}<Change pct={d.cPct} /></td>
              <td style={{ padding: "8px 8px", color: "var(--color-text-secondary)" }}>{fmtK(d.impr)}<Change pct={d.iPct} /></td>
              <td style={{ padding: "8px 8px", color: "var(--color-text-secondary)" }}>{d.ctr}%<Change pct={d.ctrPct} /></td>
              <td style={{ padding: "8px 0", color: "var(--color-text-secondary)" }}>{d.pos}<Change pct={d.posDelta} invert /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Placeholder({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div style={{ border: "1px dashed var(--color-border)", borderRadius: "12px", padding: "40px 24px", display: "flex", flexDirection: "column", alignItems: "center", gap: "8px", background: "var(--color-card)" }}>
      <div style={{ color: "var(--color-text-secondary)" }}>{icon}</div>
      <p style={{ fontWeight: 600, color: "var(--color-text-primary)", fontSize: "14px" }}>{title}</p>
      <p style={{ fontSize: "13px", color: "var(--color-text-secondary)" }}>
        <span style={{ color: "#3B82F6", cursor: "pointer" }}>{desc}</span>
      </p>
    </div>
  );
}

// ─── Custom Chart Tooltip ─────────────────────────────────────────────────────
function SiteTooltip({ active, payload, label }: any) {
  const { t } = useLanguage();
  if (!active || !payload?.length) return null;
  const d = payload.reduce((acc: any, p: any) => { acc[p.dataKey] = p.value; return acc; }, {} as any);
  return (
    <div style={{ background: "var(--color-card)", border: "1px solid var(--color-border)", borderRadius: "10px", padding: "10px 14px", fontSize: "12px", color: "var(--color-text-primary)", boxShadow: "0 4px 20px rgba(0,0,0,0.3)" }}>
      <p style={{ fontWeight: 600, marginBottom: "6px", color: "var(--color-text-primary)" }}>{label}</p>
      {[
        { key: "clicks",      label: t("clicks"),      color: C.clicks },
        { key: "impressions", label: t("impressions"),  color: C.impressions },
        { key: "ctr",         label: "CTR",             color: C.ctr, suffix: "%" },
        { key: "position",    label: t("avgPosition"),  color: C.position },
      ].map(({ key, label, color, suffix = "" }) => (
        <div key={key} style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "2px" }}>
          <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: color, flexShrink: 0, display: "inline-block" }} />
          <span style={{ color: "var(--color-text-secondary)", flex: 1 }}>{label}</span>
          <span style={{ fontWeight: 600 }}>{d[key]}{suffix}</span>
        </div>
      ))}
    </div>
  );
}

// ─── GA4 metric types ─────────────────────────────────────────────────────────
type GA4Metric = "sessions" | "engagement" | "events" | "revenue";

const GA4_METRICS: { key: GA4Metric; icon: React.ReactNode; label: string; color: string; bg: string }[] = [
  { key: "sessions",   icon: <Users size={13} />,      label: "Sessions",        color: "#3B82F6", bg: "rgba(59,130,246,0.12)" },
  { key: "engagement", icon: <Activity size={13} />,   label: "Engagement Rate", color: "#8B5CF6", bg: "rgba(139,92,246,0.12)" },
  { key: "events",     icon: <Zap size={13} />,        label: "Key Events",      color: "#10B981", bg: "rgba(16,185,129,0.12)" },
  { key: "revenue",    icon: <DollarSign size={13} />, label: "Revenue",         color: "#F59E0B", bg: "rgba(245,158,11,0.12)" },
];

// Simple dropdown for re-use
function SimpleDropdown({ trigger, children, align = "right" }: { trigger: React.ReactNode; children: React.ReactNode; align?: "left"|"right" }) {
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
        <div style={{ position: "absolute", top: "calc(100% + 6px)", [align === "right" ? "right" : "left"]: 0, background: "var(--color-card)", border: "1px solid var(--color-border)", borderRadius: "12px", boxShadow: "0 8px 32px rgba(0,0,0,0.5)", zIndex: 200, minWidth: "180px", overflow: "hidden" }}
          onClick={() => setOpen(false)}>
          {children}
        </div>
      )}
    </div>
  );
}

// ─── GA4 Tab ──────────────────────────────────────────────────────────────────
function GA4Tab({ domain, period, setPeriod, periodOptions }: {
  domain: string;
  period: string;
  setPeriod: (p: string) => void;
  periodOptions: string[];
}) {
  const [ga4Linked, setGA4Linked] = useState(false);
  const [activeMetrics, setActiveMetrics] = useState<Set<GA4Metric>>(new Set(["sessions", "engagement", "events", "revenue"]));
  const [selectedProp, setSelectedProp] = useState("");

  const mockProps = [
    `${domain} - GA4`,
    `${domain} (All Web Site Data)`,
    `${domain} - Prod`,
  ];

  const toggleMetric = (m: GA4Metric) => setActiveMetrics(p => {
    const n = new Set(p); n.has(m) ? n.delete(m) : n.add(m); return n;
  });

  return (
    <div style={{ padding: "28px 32px", display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* GA4 top controls */}
      <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
        {/* Metric toggles */}
        <div style={{ display: "flex", gap: "4px" }}>
          {GA4_METRICS.map(({ key, icon, label, color, bg }) => {
            const active = activeMetrics.has(key);
            return (
              <button key={key} title={label} onClick={() => toggleMetric(key)} style={{
                display: "flex", alignItems: "center", justifyContent: "center",
                width: "34px", height: "34px", borderRadius: "8px", cursor: "pointer",
                border: `1px solid ${active ? color : "var(--color-border)"}`,
                background: active ? bg : "var(--color-card)",
                color: active ? color : "var(--color-text-secondary)",
                transition: "all 0.15s",
              }}>
                {icon}
              </button>
            );
          })}
        </div>

        <div style={{ flex: 1 }} />

        {/* Period selector */}
        <SimpleDropdown
          align="right"
          trigger={
            <button style={{ display: "flex", alignItems: "center", gap: "6px", padding: "7px 13px", borderRadius: "8px", border: "1px solid var(--color-border)", background: "var(--color-card)", color: "var(--color-text-secondary)", fontSize: "13px", fontWeight: 500, cursor: "pointer" }}>
              {period} <ChevronDown size={13} />
            </button>
          }
        >
          {periodOptions.map(p => (
            <button key={p} onClick={() => setPeriod(p)} style={{ display: "flex", alignItems: "center", gap: "10px", padding: "9px 14px", fontSize: "13px", cursor: "pointer", width: "100%", background: period === p ? "rgba(59,130,246,0.12)" : "transparent", color: period === p ? "#3B82F6" : "var(--color-text-primary)", border: "none" }}>
              {p} {period === p && <Check size={12} style={{ marginLeft: "auto" }} />}
            </button>
          ))}
        </SimpleDropdown>
      </div>

      {/* Onboarding card */}
      {!ga4Linked ? (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "20px", padding: "64px 32px", background: "var(--color-card)", borderRadius: "16px", border: "1px solid var(--color-border)", textAlign: "center" }}>
          {/* GA logo */}
          <div style={{ width: "56px", height: "56px", borderRadius: "14px", background: "linear-gradient(135deg, #e8710a 0%, #f9a825 100%)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "26px", boxShadow: "0 4px 16px rgba(232,113,10,0.3)" }}>
            📊
          </div>
          <div style={{ maxWidth: "420px" }}>
            <h2 style={{ fontSize: "20px", fontWeight: 700, color: "var(--color-text-primary)", marginBottom: "10px" }}>
              Link your GA4 property
            </h2>
            <p style={{ fontSize: "14px", color: "var(--color-text-secondary)", lineHeight: "1.6" }}>
              Unlock the Google Analytics data you know and love, right here in SEO Gets.
            </p>
          </div>

          {/* Property selector */}
          <div style={{ display: "flex", flexDirection: "column", gap: "10px", width: "100%", maxWidth: "380px" }}>
            <select
              value={selectedProp}
              onChange={e => setSelectedProp(e.target.value)}
              style={{ width: "100%", padding: "10px 14px", borderRadius: "10px", border: "1px solid var(--color-border)", background: "var(--color-bg)", color: selectedProp ? "var(--color-text-primary)" : "var(--color-text-secondary)", fontSize: "14px", outline: "none", cursor: "pointer" }}
            >
              <option value="">Select GA4 Property…</option>
              {mockProps.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
            <button
              onClick={() => { if (selectedProp) setGA4Linked(true); }}
              style={{ width: "100%", padding: "10px 20px", borderRadius: "10px", border: "none", background: selectedProp ? "#3B82F6" : "var(--color-border)", color: selectedProp ? "#fff" : "var(--color-text-secondary)", fontSize: "14px", fontWeight: 600, cursor: selectedProp ? "pointer" : "not-allowed", transition: "all 0.15s", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}
            >
              <Link2 size={15} /> Link Property
            </button>
          </div>

          <p style={{ fontSize: "12px", color: "var(--color-text-secondary)" }}>
            You can always unlink your GA4 property later.
          </p>
        </div>
      ) : (
        /* Linked state — placeholder chart area */
        <div style={{ background: "var(--color-card)", borderRadius: "16px", border: "1px solid var(--color-border)", padding: "32px", display: "flex", flexDirection: "column", gap: "24px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            {GA4_METRICS.filter(m => activeMetrics.has(m.key)).map(m => (
              <div key={m.key} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <span style={{ color: m.color }}>{m.icon}</span>
                <span style={{ fontSize: "22px", fontWeight: 700, color: "var(--color-text-primary)" }}>
                  {m.key === "sessions" ? "4.2k" : m.key === "engagement" ? "61.3%" : m.key === "events" ? "128" : "$0"}
                </span>
                <span style={{ fontSize: "12px", color: "#10B981", fontWeight: 600 }}>+18%</span>
              </div>
            ))}
          </div>
          <div style={{ height: "200px", borderRadius: "12px", background: "var(--color-bg)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--color-text-secondary)", fontSize: "13px" }}>
            GA4 chart will appear here
          </div>
          <button onClick={() => setGA4Linked(false)} style={{ alignSelf: "flex-end", fontSize: "12px", color: "var(--color-text-secondary)", background: "none", border: "none", cursor: "pointer", textDecoration: "underline" }}>
            Unlink GA4
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Indexing Tab ─────────────────────────────────────────────────────────────
const INDEX_COLORS = {
  indexed:     "#4ADE80",
  notIndexed:  "#F87171",
  discovered:  "#FBBF24",
  unknown:     "#60A5FA",
};

function makeIndexingData(days = 14) {
  const today = new Date();
  return Array.from({ length: days }, (_, i) => {
    const d = new Date(today); d.setDate(today.getDate() - days + i);
    const label = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    return {
      date: label,
      indexed:    55 + Math.round(Math.random() * 20),
      notIndexed:  6 + Math.round(Math.random() * 8),
      discovered: 55 + Math.round(Math.random() * 20),
      unknown:    70 + Math.round(Math.random() * 15),
    };
  });
}

const INDEX_PAGES = [
  "/", "/cert-manager", "/cert-manager/acme.cert-manager.io/v1/Ch...",
  "/cert-manager/acme.cert-manager.io/v1/Or...", "/cert-manager/acme.cert-manager.io/v1/Certificat...",
  "/cert-manager/acme.cert-manager.io/v1/Certificat...", "/cert-manager/v1/ClusterIssuer",
  "/cert-manager/v1/Issuer",
];
const INDEX_STATUSES = [
  "Submitted and indexed", "Submitted and indexed", "Submitted and indexed",
  "Submitted and indexed", "Submitted and indexed", "Submitted and indexed",
  "Not crawled yet", "Submitted and indexed",
];
const LAST_CRAWLS = ["35 days ago\nJuly 19, 2025","40 days ago\nJuly 6, 2025","35 days ago\nJuly 19, 2025","35 days ago\nJuly 19, 2025","35 days ago\nJuly 19, 2025","35 days ago\nJuly 19, 2025","","39 days ago\nJuly 6, 2025"];
const INSPECTIONS = ["Today\ninspected daily","Yesterday\ninspected daily","Today\ninspected daily","Today\ninspected daily","Today\ninspected daily","Today\ninspected daily","","Yesterday\ninspected daily"];

function IndexingTab() {
  const indexData = useMemo(() => makeIndexingData(14), []);
  const [upgradeOpen, setUpgradeOpen] = useState(true);

  const metrics = [
    { color: INDEX_COLORS.indexed,    value: 66, label: "Submitted and indexed" },
    { color: INDEX_COLORS.notIndexed, value: 9,  label: "Crawled - currently not indexed" },
    { color: INDEX_COLORS.discovered, value: 66, label: "Discovered - currently not indexed" },
    { color: INDEX_COLORS.unknown,    value: 76, label: "URL is unknown to Google" },
  ];

  return (
    <div style={{ position: "relative" }}>
      {/* ── Background content (blurred when modal open) ── */}
      <div style={{ padding: "28px 32px", display: "flex", flexDirection: "column", gap: "24px", filter: upgradeOpen ? "blur(3px)" : "none", pointerEvents: upgradeOpen ? "none" : "auto", transition: "filter 0.2s", userSelect: upgradeOpen ? "none" : "auto" }}>

        {/* Metric summary */}
        <div style={{ display: "flex", gap: "32px", flexWrap: "wrap" }}>
          {metrics.map(({ color, value, label }) => (
            <div key={label} style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: color, flexShrink: 0, display: "inline-block" }} />
                <span style={{ fontSize: "28px", fontWeight: 700, color: "var(--color-text-primary)" }}>{value}</span>
              </div>
              <span style={{ fontSize: "12px", color: "var(--color-text-secondary)", paddingLeft: "14px" }}>{label}</span>
            </div>
          ))}
        </div>

        {/* Stacked bar chart */}
        <div style={{ background: "var(--color-card)", borderRadius: "12px", padding: "16px", border: "1px solid var(--color-border)" }}>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={indexData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }} barSize={18}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border)" />
              <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "var(--color-text-secondary)" }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "var(--color-text-secondary)" }} />
              <Tooltip
                contentStyle={{ background: "var(--color-card)", border: "1px solid var(--color-border)", borderRadius: "10px", fontSize: "12px", color: "var(--color-text-primary)" }}
                cursor={{ fill: "rgba(255,255,255,0.04)" }}
              />
              <Bar dataKey="indexed"    stackId="a" fill={INDEX_COLORS.indexed}    radius={[0,0,0,0]} name="Submitted and indexed" />
              <Bar dataKey="discovered" stackId="a" fill={INDEX_COLORS.discovered} radius={[0,0,0,0]} name="Discovered - not indexed" />
              <Bar dataKey="notIndexed" stackId="a" fill={INDEX_COLORS.notIndexed} radius={[0,0,0,0]} name="Crawled - not indexed" />
              <Bar dataKey="unknown"    stackId="a" fill={INDEX_COLORS.unknown}    radius={[4,4,0,0]} name="Unknown to Google" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Pages table */}
        <div>
          <h3 style={{ fontSize: "13px", fontWeight: 700, color: "var(--color-text-secondary)", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: "12px" }}>PAGES</h3>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--color-border)" }}>
                <th style={{ textAlign: "left", padding: "8px 0", color: "var(--color-text-secondary)", fontWeight: 500, fontSize: "12px" }}>URL</th>
                <th style={{ textAlign: "left", padding: "8px 16px", color: "var(--color-text-secondary)", fontWeight: 500, fontSize: "12px" }}>STATUS</th>
                <th style={{ textAlign: "left", padding: "8px 16px", color: "var(--color-text-secondary)", fontWeight: 500, fontSize: "12px" }}>LAST CRAWL</th>
                <th style={{ textAlign: "left", padding: "8px 16px", color: "var(--color-text-secondary)", fontWeight: 500, fontSize: "12px" }}>RICH RESULTS</th>
                <th style={{ textAlign: "left", padding: "8px 0", color: "var(--color-text-secondary)", fontWeight: 500, fontSize: "12px" }}>LAST INSPECTION</th>
              </tr>
            </thead>
            <tbody>
              {INDEX_PAGES.map((url, i) => {
                const status = INDEX_STATUSES[i];
                const crawl = LAST_CRAWLS[i];
                const insp = INSPECTIONS[i];
                const isIndexed = status === "Submitted and indexed";
                const [inspLine1, inspLine2] = insp.split("\n");
                const [crawlLine1, crawlLine2] = crawl.split("\n");
                return (
                  <tr key={i} style={{ borderBottom: "1px solid var(--color-border)", background: i % 2 === 0 ? "rgba(255,255,255,0.02)" : "transparent" }}>
                    <td style={{ padding: "10px 0", fontSize: "13px", color: "#3B82F6", maxWidth: "240px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{url}</td>
                    <td style={{ padding: "10px 16px", fontSize: "12px", color: isIndexed ? "#4ADE80" : status ? "#FBBF24" : "var(--color-text-secondary)", whiteSpace: "nowrap" }}>
                      {status || <span style={{ color: "#6b7280" }}>Request Indexing ↗</span>}
                    </td>
                    <td style={{ padding: "10px 16px", fontSize: "12px", color: "var(--color-text-secondary)", whiteSpace: "nowrap" }}>
                      {crawlLine1 && <div style={{ color: "var(--color-text-primary)", fontWeight: 500 }}>{crawlLine1}</div>}
                      {crawlLine2 && <div style={{ color: "var(--color-text-secondary)", fontSize: "11px" }}>{crawlLine2}</div>}
                    </td>
                    <td style={{ padding: "10px 16px" }} />
                    <td style={{ padding: "10px 0", fontSize: "12px", whiteSpace: "nowrap" }}>
                      {inspLine1 && <div style={{ color: "#3B82F6", fontWeight: 500 }}>{inspLine1}</div>}
                      {inspLine2 && <div style={{ color: "var(--color-text-secondary)", fontSize: "11px" }}>{inspLine2}</div>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Upgrade modal overlay ── */}
      {upgradeOpen && (
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "flex-start", justifyContent: "center", paddingTop: "32px", zIndex: 10 }}>
          <div style={{ background: "var(--color-card)", borderRadius: "20px", border: "1px solid var(--color-border)", boxShadow: "0 16px 64px rgba(0,0,0,0.5)", width: "100%", maxWidth: "680px", overflow: "hidden" }}>

            {/* Header */}
            <div style={{ padding: "32px 32px 20px", textAlign: "center" }}>
              <h2 style={{ fontSize: "22px", fontWeight: 700, color: "var(--color-text-primary)", marginBottom: "6px" }}>Indexing Report</h2>
              <p style={{ fontSize: "14px", color: "var(--color-text-secondary)" }}>Get insights into your site's indexing status</p>
            </div>

            {/* YouTube preview */}
            <div style={{ margin: "0 32px 24px", borderRadius: "12px", overflow: "hidden", position: "relative", aspectRatio: "16/9", background: "#000", cursor: "pointer" }}
              onClick={() => window.open("https://www.youtube.com/@seogets", "_blank")}>
              {/* Thumbnail mockup */}
              <div style={{ width: "100%", height: "100%", background: "linear-gradient(135deg, #1e3a5f 0%, #0f172a 100%)", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: "8px", position: "relative" }}>
                <div style={{ position: "absolute", inset: 0, opacity: 0.3, background: "repeating-linear-gradient(90deg, rgba(74,222,128,0.3) 0, rgba(74,222,128,0.3) 8px, transparent 8px, transparent 24px)" }} />
                <div style={{ fontSize: "13px", fontWeight: 700, color: "#fff", background: "rgba(0,0,0,0.6)", padding: "6px 12px", borderRadius: "8px", zIndex: 1, textAlign: "center" }}>
                  Super Sites (Index Reports, Extended Storage)
                  <div style={{ fontSize: "11px", color: "#94a3b8", marginTop: "2px" }}>SEO Gets</div>
                </div>
                {/* Play button */}
                <div style={{ width: "64px", height: "64px", borderRadius: "50%", background: "#EF4444", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1, boxShadow: "0 4px 20px rgba(239,68,68,0.5)" }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="#fff"><path d="M8 5v14l11-7z"/></svg>
                </div>
                <div style={{ fontSize: "12px", color: "#94a3b8", zIndex: 1 }}>Watch on YouTube</div>
              </div>
            </div>

            {/* Super Site Includes */}
            <div style={{ margin: "0 32px 24px", background: "var(--color-bg)", borderRadius: "12px", padding: "20px 24px", border: "1px solid var(--color-border)" }}>
              <h3 style={{ fontSize: "15px", fontWeight: 700, color: "var(--color-text-primary)", marginBottom: "16px", textAlign: "center" }}>Super Site Includes</h3>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "10px 16px" }}>
                {[
                  "Extended Storage\n(up to 5 years)",
                  "Index Reporting\n(up to 5k pages)",
                  "More than 50,000\nrows of data",
                  "Historical Indexing\nTrends",
                  "Filter by Index\nStatus",
                  "Weekly Email\nAlerts",
                ].map((feat, i) => {
                  const [line1, line2] = feat.split("\n");
                  return (
                    <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: "8px" }}>
                      <Check size={14} color="#4ADE80" style={{ flexShrink: 0, marginTop: "2px" }} />
                      <div>
                        <div style={{ fontSize: "13px", fontWeight: 600, color: "var(--color-text-primary)" }}>{line1}</div>
                        <div style={{ fontSize: "12px", color: "var(--color-text-secondary)" }}>{line2}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* CTA button */}
            <div style={{ padding: "0 32px 32px" }}>
              <button
                onClick={() => setUpgradeOpen(false)}
                style={{ width: "100%", padding: "14px", borderRadius: "12px", border: "none", background: "linear-gradient(90deg, #2563EB 0%, #0891B2 100%)", color: "#fff", fontSize: "16px", fontWeight: 700, cursor: "pointer", boxShadow: "0 4px 20px rgba(37,99,235,0.4)", transition: "opacity 0.15s" }}
                onMouseOver={e => (e.currentTarget.style.opacity = "0.9")}
                onMouseOut={e => (e.currentTarget.style.opacity = "1")}
              >
                + Upgrade Sites now
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Google G icon ────────────────────────────────────────────────────────────
function GoogleIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
    </svg>
  );
}

// ─── Annotations Filter Dropdown ──────────────────────────────────────────────
function AnnotationsFilterDd() {
  const [open, setOpen] = useState(false);
  const [activeDim, setActiveDim] = useState<string | null>("Query");
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const dims = [
    { icon: <Search size={14}/>,          label: "Query",          disabled: false },
    { icon: <FileText size={14}/>,         label: "Page",           disabled: false },
    { icon: <Globe size={14}/>,            label: "Country",        disabled: false },
    { icon: <Monitor size={14}/>,          label: "Device",         disabled: false },
    { icon: <BookmarkCheck size={14}/>,    label: "Content Group",  disabled: true  },
    { icon: <ArrowLeftRight size={14}/>,   label: "Compare Filters",disabled: false },
  ];

  const divider = <div style={{ height: "1px", background: "var(--color-border)", margin: "4px 0" }} />;
  const sec = (label: string) => (
    <div style={{ padding: "10px 14px 4px", fontSize: "11px", fontWeight: 600, color: "var(--color-text-secondary)", textTransform: "uppercase", letterSpacing: "0.06em" }}>{label}</div>
  );

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button onClick={() => setOpen(o => !o)} style={{ display: "flex", alignItems: "center", gap: "6px", padding: "7px 13px", borderRadius: "8px", border: "1px solid var(--color-border)", background: "var(--color-card)", color: "var(--color-text-secondary)", fontSize: "13px", fontWeight: 500, cursor: "pointer", whiteSpace: "nowrap" }}>
        <SlidersHorizontal size={13} /> Filter
      </button>
      {open && (
        <div style={{ position: "absolute", top: "calc(100% + 6px)", left: 0, background: "var(--color-card)", border: "1px solid var(--color-border)", borderRadius: "12px", boxShadow: "0 8px 32px rgba(0,0,0,0.5)", zIndex: 200, minWidth: "240px", overflow: "hidden" }}>
          {/* Dimension filters */}
          {dims.map(({ icon, label, disabled }) => (
            <button key={label} disabled={disabled} onClick={() => { if (!disabled) setActiveDim(label); }} style={{ display: "flex", alignItems: "center", gap: "10px", padding: "10px 14px", fontSize: "13px", cursor: disabled ? "default" : "pointer", width: "100%", background: activeDim === label ? "rgba(59,130,246,0.12)" : "transparent", color: disabled ? "var(--color-text-secondary)" : activeDim === label ? "#3B82F6" : "var(--color-text-primary)", border: "none", opacity: disabled ? 0.45 : 1 }}>
              {icon} {label}
              {activeDim === label && <Check size={12} style={{ marginLeft: "auto" }} />}
            </button>
          ))}

          {divider}
          {sec("Branded Queries")}
          <div style={{ padding: "4px 14px 10px", fontSize: "12px", color: "var(--color-text-secondary)", lineHeight: 1.5 }}>
            <span style={{ color: "#3B82F6", cursor: "pointer" }}>Define</span> branded keywords<br />to enable branded filters.
          </div>

          {divider}
          {sec("Position Filter")}
          <div style={{ padding: "4px 14px 10px", display: "flex", gap: "8px" }}>
            {["Top 10", "Top 20"].map(v => (
              <button key={v} style={{ display: "flex", alignItems: "center", gap: "5px", padding: "5px 12px", borderRadius: "20px", fontSize: "12px", fontWeight: 600, cursor: "pointer", border: "1px solid var(--color-border)", background: "transparent", color: "#F59E0B" }}>
                <MoveUp size={12} /> {v}
              </button>
            ))}
          </div>

          {divider}
          {sec("Saved Filters")}
          <div style={{ padding: "4px 14px 10px", fontSize: "12px", color: "var(--color-text-secondary)", lineHeight: 1.5 }}>
            Add filters and save them to quickly<br />access them later.
          </div>

          {divider}
          {sec("Preset Filters")}
          {["People Also Ask", "Long Tail Keywords"].map(v => (
            <button key={v} onClick={() => setOpen(false)} style={{ display: "block", width: "100%", textAlign: "left", padding: "9px 14px", fontSize: "13px", fontWeight: 600, cursor: "pointer", background: "transparent", color: "var(--color-text-primary)", border: "none" }}>
              {v}
            </button>
          ))}
          <div style={{ height: "6px" }} />
        </div>
      )}
    </div>
  );
}

// ─── Add Note Modal ───────────────────────────────────────────────────────────
function AddNoteModal({ onClose, onSave }: { onClose: () => void; onSave: (note: { date: string; title: string; desc: string; scope: string }) => void }) {
  const today = new Date();
  const todayStr = today.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  const [title, setTitle] = useState("");
  const [desc, setDesc]   = useState("");
  const [scope, setScope] = useState<"all" | "specific" | "group">("all");

  const scopeOptions = [
    { v: "all",      l: "All Pages" },
    { v: "specific", l: "Specific Page(s)" },
    { v: "group",    l: "Content Group" },
  ] as const;

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.65)", zIndex: 500, display: "flex", alignItems: "center", justifyContent: "center" }}
      onClick={onClose}>
      <div style={{ background: "#fff", borderRadius: "16px", padding: "32px", width: "90%", maxWidth: "640px", color: "#111", boxShadow: "0 20px 60px rgba(0,0,0,0.4)", position: "relative" }}
        onClick={e => e.stopPropagation()}>
        {/* Close */}
        <button onClick={onClose} style={{ position: "absolute", top: "16px", right: "16px", background: "none", border: "none", cursor: "pointer", color: "#9ca3af" }}><X size={20} /></button>

        {/* Label */}
        <p style={{ fontSize: "12px", color: "#9ca3af", fontWeight: 500, marginBottom: "4px" }}>Note</p>

        {/* Date */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "24px" }}>
          <span style={{ fontSize: "24px", fontWeight: 700 }}>{todayStr}</span>
          <Calendar size={18} color="#9ca3af" />
        </div>

        {/* Title */}
        <label style={{ display: "block", fontSize: "14px", fontWeight: 600, color: "#111", marginBottom: "8px" }}>Title</label>
        <input
          autoFocus
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder="What happened on this day?"
          style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: `2px solid ${title ? "#3B82F6" : "#d1d5db"}`, fontSize: "14px", color: "#111", outline: "none", boxSizing: "border-box", marginBottom: "20px" }}
        />

        {/* Description */}
        <label style={{ display: "block", fontSize: "14px", fontWeight: 600, color: "#111", marginBottom: "8px" }}>Description</label>
        <textarea
          value={desc}
          onChange={e => setDesc(e.target.value)}
          rows={5}
          style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid #d1d5db", fontSize: "14px", color: "#111", outline: "none", resize: "vertical", boxSizing: "border-box", marginBottom: "20px", fontFamily: "inherit" }}
        />

        {/* Scope */}
        <p style={{ fontSize: "14px", fontWeight: 600, color: "#111", marginBottom: "12px" }}>Which pages have been impacted?</p>
        <div style={{ display: "flex", gap: "20px", marginBottom: "28px" }}>
          {scopeOptions.map(({ v, l }) => (
            <label key={v} style={{ display: "flex", alignItems: "center", gap: "7px", cursor: "pointer", fontSize: "14px", color: "#374151" }}>
              <div onClick={() => setScope(v)} style={{ width: "18px", height: "18px", borderRadius: "50%", border: `2px solid ${scope === v ? "#3B82F6" : "#d1d5db"}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, cursor: "pointer" }}>
                {scope === v && <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#3B82F6" }} />}
              </div>
              {l}
            </label>
          ))}
        </div>

        {/* Buttons */}
        <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
          <button onClick={onClose} style={{ padding: "10px 22px", borderRadius: "8px", border: "none", background: "#f3f4f6", color: "#374151", fontSize: "14px", fontWeight: 500, cursor: "pointer" }}>Cancel</button>
          <button onClick={() => { if (title.trim()) { onSave({ date: todayStr, title, desc, scope: scopeOptions.find(o => o.v === scope)!.l }); onClose(); } }}
            style={{ padding: "10px 22px", borderRadius: "8px", border: "none", background: title.trim() ? "#374151" : "#9ca3af", color: "#fff", fontSize: "14px", fontWeight: 600, cursor: title.trim() ? "pointer" : "not-allowed" }}>
            Save
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Annotation sparkline ─────────────────────────────────────────────────────
function AnnotationSparkline({ before, after }: { before: number[]; after: number[] }) {
  const data = [...before, ...after].map((v, i) => ({ v, i, isPre: i < before.length }));
  const allData = data.map(d => ({ date: d.i, value: d.v }));
  return (
    <ResponsiveContainer width="100%" height={60}>
      <AreaChart data={allData} margin={{ top: 2, right: 0, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="ann-g" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#3B82F6" stopOpacity={0.2} />
            <stop offset="100%" stopColor="#3B82F6" stopOpacity={0} />
          </linearGradient>
        </defs>
        <Area type="monotone" dataKey="value" stroke="#3B82F6" strokeWidth={1.5} fill="url(#ann-g)" dot={false} isAnimationActive={false} />
        {/* Annotation marker line at midpoint */}
        <line x1="50%" y1="0" x2="50%" y2="100%" stroke="#6b7280" strokeWidth={1} strokeDasharray="3 2" />
      </AreaChart>
    </ResponsiveContainer>
  );
}

// ─── Annotations Tab ──────────────────────────────────────────────────────────
interface AnnotationNote {
  date: string; title: string; scope: string;
  cBefore: number; cAfter: number; cPct: number;
  iBefore: number; iAfter: number; iPct: number;
  tBefore: number; tAfter: number; tPct: number;
  pBefore: number; pAfter: number; pDelta: number;
  dateRange: string;
  sparkBefore: number[]; sparkAfter: number[];
}

const MOCK_ANNOTATIONS: AnnotationNote[] = [
  { date: "Sep 5, 2024",  title: "Moved from WordPress to Astro",          scope: "All Pages",       cBefore: 1500, cAfter: 2000,  cPct: 36,  iBefore: 49200, iAfter: 176300, iPct: 258, tBefore: 3.1, tAfter: 1.2, tPct: 1.9,  pBefore: 55.3, pAfter: 58,   pDelta: 2.7,  dateRange: "Jul 5 to Sep 3 → Sep 6 to Nov 5",    sparkBefore: [20,22,18,25,23,21,28,30], sparkAfter: [32,38,42,45,50,55,58,62] },
  { date: "Jun 28, 2024", title: "301 Redirect Indexing Glossary Page",    scope: "All Pages",       cBefore: 683,  cAfter: 1400,  cPct: 118, iBefore: 37900, iAfter: 46400,  iPct: 22,  tBefore: 1.8, tAfter: 3.2, tPct: 1.4,  pBefore: 65.8, pAfter: 55.9, pDelta: 9.9,  dateRange: "Apr 29 to Jun 27 → Jun 28 to Aug 26", sparkBefore: [15,14,16,13,15,14,16,15], sparkAfter: [18,22,25,28,30,32,35,38] },
  { date: "Aug 21, 2024", title: "Feature Posts Update",                    scope: "Content Group",   cBefore: 16,   cAfter: 80,    cPct: 400, iBefore: 6400,  iAfter: 17100,  iPct: 164, tBefore: 0.2, tAfter: 0.5, tPct: 0.3,  pBefore: 37.4, pAfter: 47.6, pDelta: 10.2, dateRange: "Jun 22 to Aug 20 → Aug 21 to Oct 19", sparkBefore: [5,6,4,7,5,6,5,6],        sparkAfter: [8,12,18,25,32,40,48,55]  },
  { date: "Aug 5, 2024",  title: "Updated /features/branded-keywords",      scope: "Specific Page(s)", cBefore: 4,    cAfter: 32,    cPct: 700, iBefore: 2000,  iAfter: 11200,  iPct: 456, tBefore: 0.2, tAfter: 0.3, tPct: 0.1,  pBefore: 51.3, pAfter: 48.8, pDelta: 2.5,  dateRange: "Jun 6 to Aug 4 → Aug 5 to Oct 3",    sparkBefore: [2,3,2,3,2,3,2,3],        sparkAfter: [4,8,12,18,22,26,30,32]   },
];

function AnnotationsTab({ period, setPeriod, periodOptions }: {
  period: string; setPeriod: (p: string) => void; periodOptions: string[];
}) {
  const [viewMode, setViewMode] = useState<"notes" | "updates">("notes");
  const [onboarding, setOnboarding] = useState(true);
  const [showAddNote, setShowAddNote] = useState(false);
  const [notes, setNotes] = useState<AnnotationNote[]>([]);
  const [activeMetrics, setActiveMetrics] = useState<Set<Metric>>(new Set(["clicks", "impressions", "ctr", "position"]));

  const toggleMetric = (m: Metric) => setActiveMetrics(p => { const n = new Set(p); n.has(m) ? n.delete(m) : n.add(m); return n; });

  const displayNotes = [...notes, ...MOCK_ANNOTATIONS];

  const fK = (n: number) => n >= 1000 ? `${(n/1000).toFixed(1)}k` : String(n);

  return (
    <div style={{ position: "relative" }}>
      {/* ── Sub-header controls ── */}
      <div style={{ padding: "10px 32px", borderBottom: "1px solid var(--color-border)", display: "flex", alignItems: "center", gap: "8px", background: "var(--color-card)", flexWrap: "wrap" }}>
        <AnnotationsFilterDd />

        {/* Notes / Updates toggle */}
        <div style={{ display: "flex", gap: "4px" }}>
          {([
            { key: "notes",   label: "Notes",   icon: <FileText size={13}/> },
            { key: "updates", label: "Updates", icon: <GoogleIcon size={13}/> },
          ] as const).map(({ key, label, icon }) => (
            <button key={key} onClick={() => setViewMode(key)} style={{ display: "flex", alignItems: "center", gap: "6px", padding: "6px 12px", borderRadius: "8px", fontSize: "13px", fontWeight: 500, cursor: "pointer", border: `1px solid ${viewMode === key ? "#3B82F6" : "var(--color-border)"}`, background: viewMode === key ? "rgba(59,130,246,0.1)" : "var(--color-bg)", color: viewMode === key ? "#3B82F6" : "var(--color-text-secondary)", transition: "all 0.15s" }}>
              {icon} {label}
            </button>
          ))}
        </div>

        {/* Metric icons */}
        <div style={{ display: "flex", gap: "4px" }}>
          {([
            { m: "clicks" as Metric,      icon: <Sparkles size={13}/>, color: C.clicks,      bg: "rgba(59,130,246,0.12)"  },
            { m: "impressions" as Metric, icon: <Eye size={13}/>,      color: C.impressions, bg: "rgba(139,92,246,0.12)"  },
            { m: "ctr" as Metric,         icon: <Percent size={13}/>,  color: C.ctr,         bg: "rgba(16,185,129,0.12)"  },
            { m: "position" as Metric,    icon: <MoveUp size={13}/>,   color: C.position,    bg: "rgba(245,158,11,0.12)"  },
          ]).map(({ m, icon, color, bg }) => {
            const active = activeMetrics.has(m);
            return (
              <button key={m} onClick={() => toggleMetric(m)} style={{ width: "32px", height: "32px", borderRadius: "8px", cursor: "pointer", border: `1px solid ${active ? color : "var(--color-border)"}`, background: active ? bg : "var(--color-card)", color: active ? color : "var(--color-text-secondary)", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.15s" }}>
                {icon}
              </button>
            );
          })}
        </div>

        <div style={{ flex: 1 }} />

        {/* Period */}
        <SimpleDropdown align="right" trigger={
          <button style={{ display: "flex", alignItems: "center", gap: "6px", padding: "7px 13px", borderRadius: "8px", border: "1px solid var(--color-border)", background: "var(--color-card)", color: "var(--color-text-secondary)", fontSize: "13px", fontWeight: 500, cursor: "pointer" }}>
            {period} <ChevronDown size={13} />
          </button>
        }>
          {periodOptions.map(p => (
            <button key={p} onClick={() => setPeriod(p)} style={{ display: "flex", alignItems: "center", gap: "10px", padding: "9px 14px", fontSize: "13px", cursor: "pointer", width: "100%", background: period === p ? "rgba(59,130,246,0.12)" : "transparent", color: period === p ? "#3B82F6" : "var(--color-text-primary)", border: "none" }}>
              {p} {period === p && <Check size={12} style={{ marginLeft: "auto" }} />}
            </button>
          ))}
        </SimpleDropdown>
      </div>

      {/* ── Background content ── */}
      <div style={{ filter: onboarding ? "blur(2px)" : "none", pointerEvents: onboarding ? "none" : "auto", userSelect: onboarding ? "none" : "auto", transition: "filter 0.2s" }}>
        {displayNotes.map((note, idx) => (
          <div key={idx} style={{ display: "grid", gridTemplateColumns: "280px 1fr auto", gap: "0", borderBottom: "1px solid var(--color-border)", alignItems: "center", padding: "0 32px" }}>
            {/* Left: date + title + scope */}
            <div style={{ padding: "18px 24px 18px 0" }}>
              <div style={{ fontSize: "13px", fontWeight: 700, color: "var(--color-text-primary)", marginBottom: "4px" }}>{note.title}</div>
              <div style={{ fontSize: "12px", color: "var(--color-text-secondary)" }}>
                {note.date} · {note.scope}
              </div>
            </div>

            {/* Center: sparkline + date range */}
            <div style={{ padding: "12px 24px" }}>
              <AnnotationSparkline before={note.sparkBefore} after={note.sparkAfter} />
              <div style={{ fontSize: "10px", color: "var(--color-text-secondary)", textAlign: "center", marginTop: "2px" }}>{note.dateRange}</div>
            </div>

            {/* Right: metrics before → after */}
            <div style={{ padding: "18px 0 18px 0", display: "flex", flexDirection: "column", gap: "4px", minWidth: "260px" }}>
              {activeMetrics.has("clicks") && (
                <div style={{ fontSize: "12px", display: "flex", alignItems: "center", gap: "5px" }}>
                  <Sparkles size={11} color={C.clicks} />
                  <span style={{ color: "var(--color-text-secondary)" }}>{fK(note.cBefore)}</span>
                  <span style={{ color: "var(--color-text-secondary)" }}>→</span>
                  <span style={{ color: "var(--color-text-primary)", fontWeight: 600 }}>{fK(note.cAfter)} clicks</span>
                  <span style={{ color: "#10B981", fontSize: "11px", fontWeight: 600 }}>+{note.cPct}%</span>
                </div>
              )}
              {activeMetrics.has("impressions") && (
                <div style={{ fontSize: "12px", display: "flex", alignItems: "center", gap: "5px" }}>
                  <Eye size={11} color={C.impressions} />
                  <span style={{ color: "var(--color-text-secondary)" }}>{fK(note.iBefore)}</span>
                  <span style={{ color: "var(--color-text-secondary)" }}>→</span>
                  <span style={{ color: "var(--color-text-primary)", fontWeight: 600 }}>{fK(note.iAfter)} impressions</span>
                  <span style={{ color: "#10B981", fontSize: "11px", fontWeight: 600 }}>+{note.iPct}%</span>
                </div>
              )}
              {activeMetrics.has("ctr") && (
                <div style={{ fontSize: "12px", display: "flex", alignItems: "center", gap: "5px" }}>
                  <Percent size={11} color={C.ctr} />
                  <span style={{ color: "var(--color-text-secondary)" }}>{note.tBefore}</span>
                  <span style={{ color: "var(--color-text-secondary)" }}>→</span>
                  <span style={{ color: "var(--color-text-primary)", fontWeight: 600 }}>{note.tAfter}</span>
                  <span style={{ color: "#10B981", fontSize: "11px", fontWeight: 600 }}>+{note.tPct}%</span>
                </div>
              )}
              {activeMetrics.has("position") && (
                <div style={{ fontSize: "12px", display: "flex", alignItems: "center", gap: "5px" }}>
                  <MoveUp size={11} color={C.position} />
                  <span style={{ color: "var(--color-text-secondary)" }}>{note.pBefore}</span>
                  <span style={{ color: "var(--color-text-secondary)" }}>→</span>
                  <span style={{ color: "var(--color-text-primary)", fontWeight: 600 }}>{note.pAfter} avg. position</span>
                  <span style={{ color: "#6b7280", fontSize: "11px", fontWeight: 600 }}>+{note.pDelta}</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* ── Onboarding overlay ── */}
      {onboarding && (
        <div style={{ position: "absolute", top: "61px", left: 0, right: 0, bottom: 0, display: "flex", alignItems: "flex-start", justifyContent: "center", paddingTop: "24px", zIndex: 10 }}>
          <div style={{ background: "var(--color-card)", borderRadius: "20px", border: "1px solid var(--color-border)", boxShadow: "0 16px 64px rgba(0,0,0,0.45)", width: "100%", maxWidth: "620px", overflow: "hidden", padding: "32px" }}>
            <h2 style={{ fontSize: "22px", fontWeight: 700, color: "var(--color-text-primary)", textAlign: "center", marginBottom: "6px" }}>Annotations</h2>
            <p style={{ fontSize: "14px", color: "var(--color-text-secondary)", textAlign: "center", marginBottom: "24px" }}>Create your first note to get started</p>

            {/* YouTube preview */}
            <div style={{ borderRadius: "12px", overflow: "hidden", aspectRatio: "16/9", background: "#0f172a", cursor: "pointer", marginBottom: "24px", position: "relative" }}
              onClick={() => window.open("https://www.youtube.com/@seogets", "_blank")}>
              <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "12px", background: "linear-gradient(135deg, #1e293b 0%, #0f172a 100%)", position: "relative" }}>
                {/* Mock screenshot bg */}
                <div style={{ position: "absolute", inset: 0, opacity: 0.15, background: "repeating-linear-gradient(0deg, rgba(59,130,246,0.4) 0, rgba(59,130,246,0.4) 1px, transparent 1px, transparent 30px)" }} />
                {/* SEO Gets logo area */}
                <div style={{ display: "flex", alignItems: "center", gap: "10px", background: "rgba(0,0,0,0.5)", borderRadius: "8px", padding: "8px 16px", zIndex: 1 }}>
                  <div style={{ width: "32px", height: "32px", borderRadius: "6px", background: "#8B5CF6", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "14px", fontWeight: 800, color: "#fff" }}>S</div>
                  <div>
                    <div style={{ fontSize: "13px", fontWeight: 700, color: "#fff" }}>Google Core Updates and Annotations</div>
                    <div style={{ fontSize: "11px", color: "#94a3b8" }}>SEO Gets</div>
                  </div>
                </div>
                {/* Play button */}
                <div style={{ width: "56px", height: "56px", borderRadius: "50%", background: "#EF4444", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1, boxShadow: "0 4px 20px rgba(239,68,68,0.5)" }}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="#fff"><path d="M8 5v14l11-7z"/></svg>
                </div>
                {/* YouTube watermark */}
                <div style={{ position: "absolute", bottom: "12px", right: "12px", display: "flex", alignItems: "center", gap: "6px", background: "rgba(0,0,0,0.6)", borderRadius: "6px", padding: "4px 10px", zIndex: 1 }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="#EF4444"><path d="M23 7s-.3-2-1.2-2.8c-1.1-1.2-2.4-1.2-3-1.3C16.4 2.8 12 2.8 12 2.8s-4.4 0-6.8.1c-.6.1-1.9.1-3 1.3C1.3 5 1 7 1 7S.7 9.1.7 11.2v2c0 2.1.3 4.2.3 4.2s.3 2 1.2 2.8c1.1 1.2 2.6 1.1 3.3 1.2C7.5 21.6 12 21.7 12 21.7s4.4 0 6.8-.2c.6-.1 1.9-.1 3-1.3.9-.8 1.2-2.8 1.2-2.8s.3-2.1.3-4.2v-2C23.3 9.1 23 7 23 7zM9.7 15.5V8.3l8.1 3.6-8.1 3.6z"/></svg>
                  <span style={{ fontSize: "11px", color: "#fff", fontWeight: 600 }}>YouTube</span>
                </div>
              </div>
            </div>

            {/* CTA */}
            <button
              onClick={() => { setOnboarding(false); setShowAddNote(true); }}
              style={{ width: "100%", padding: "13px", borderRadius: "10px", border: "none", background: "linear-gradient(90deg, #2563EB 0%, #7C3AED 100%)", color: "#fff", fontSize: "15px", fontWeight: 700, cursor: "pointer", marginBottom: "14px", boxShadow: "0 4px 16px rgba(37,99,235,0.35)" }}>
              + Create your first note
            </button>

            <p style={{ textAlign: "center", fontSize: "13px", color: "var(--color-text-secondary)" }}>
              or try it with{" "}
              <button onClick={() => { setOnboarding(false); setViewMode("updates"); }} style={{ display: "inline-flex", alignItems: "center", gap: "4px", background: "none", border: "none", cursor: "pointer", color: "var(--color-text-primary)", fontWeight: 600, fontSize: "13px", padding: 0 }}>
                <GoogleIcon size={14} /> Updates
              </button>
            </p>
          </div>
        </div>
      )}

      {/* ── Add Note Modal ── */}
      {showAddNote && (
        <AddNoteModal
          onClose={() => setShowAddNote(false)}
          onSave={note => setNotes(prev => [{ ...note, cBefore: 0, cAfter: 0, cPct: 0, iBefore: 0, iAfter: 0, iPct: 0, tBefore: 0, tAfter: 0, tPct: 0, pBefore: 0, pAfter: 0, pDelta: 0, dateRange: "", sparkBefore: [], sparkAfter: [] }, ...prev])}
        />
      )}

      {/* Add note FAB when onboarding dismissed */}
      {!onboarding && (
        <div style={{ position: "fixed", bottom: "32px", right: "32px", zIndex: 50 }}>
          <button onClick={() => setShowAddNote(true)} style={{ display: "flex", alignItems: "center", gap: "8px", padding: "12px 20px", borderRadius: "12px", border: "none", background: "#3B82F6", color: "#fff", fontSize: "14px", fontWeight: 700, cursor: "pointer", boxShadow: "0 4px 20px rgba(59,130,246,0.4)" }}>
            + Add Note
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Optimize Tab ─────────────────────────────────────────────────────────────
const OPTIMIZE_TOOLS = [
  {
    id: "cdm",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="23 18 13.5 8.5 8.5 13.5 1 6"/>
        <polyline points="17 18 23 18 23 12"/>
      </svg>
    ),
    iconBg: "rgba(239,68,68,0.1)",
    titleKey: "optContentDecay",
    descKey: "optContentDecayDesc",
  },
  {
    id: "kc",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#3B82F6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/>
        <line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/>
      </svg>
    ),
    iconBg: "rgba(59,130,246,0.1)",
    titleKey: "optCannibalization",
    descKey: "optCannibalizationDesc",
  },
  {
    id: "sdk",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="20" x2="12" y2="10"/>
        <line x1="12" y1="6" x2="12" y2="6"/>
        <polyline points="8 14 12 10 16 14"/>
        <circle cx="12" cy="6" r="1" fill="#F59E0B"/>
      </svg>
    ),
    iconBg: "rgba(245,158,11,0.1)",
    titleKey: "optStriking",
    descKey: "optStrikingDesc",
  },
  {
    id: "ctr",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="19" y1="5" x2="5" y2="19"/>
        <circle cx="6.5" cy="6.5" r="2.5"/>
        <circle cx="17.5" cy="17.5" r="2.5"/>
      </svg>
    ),
    iconBg: "rgba(16,185,129,0.1)",
    titleKey: "optCtr",
    descKey: "optCtrDesc",
  },
];

function OptimizeTab() {
  const [active, setActive] = useState<string | null>(null);
  const { blur } = usePrivacy();
  const { t } = useLanguage();
  // We grab domain from useParams here for ContentDecayMap
  const params = useParams();
  const domain = decodeURIComponent(params.id as string);

  return (
    <div style={{ padding: "24px 32px", display: "flex", flexDirection: "column", gap: "0" }}>
      {OPTIMIZE_TOOLS.map(({ id, icon, iconBg, titleKey, descKey }, i) => {
        const isActive = active === id;
        const title = t(titleKey as any);
        const desc = t(descKey as any);
        return (
          <div key={id}>
            {/* Card header row */}
            <div
              onClick={() => setActive(isActive ? null : id)}
              style={{
                display: "flex", alignItems: "center", gap: "18px",
                padding: "22px 20px",
                border: `1px solid ${isActive ? "#3B82F6" : "var(--color-border)"}`,
                borderRadius: isActive
                  ? "12px 12px 0 0"
                  : i === 0
                    ? "12px 12px 0 0"
                    : i === OPTIMIZE_TOOLS.length - 1
                      ? "0 0 12px 12px"
                      : "0",
                borderBottom: isActive
                  ? "none"
                  : i < OPTIMIZE_TOOLS.length - 1
                    ? "1px solid var(--color-border)"
                    : "1px solid var(--color-border)",
                background: isActive ? "rgba(59,130,246,0.07)" : "var(--color-card)",
                cursor: "pointer",
                transition: "all 0.15s",
                position: "relative",
                marginTop: i > 0 && !isActive ? "-1px" : "0",
              }}
              onMouseOver={e => { if (!isActive) (e.currentTarget as HTMLDivElement).style.background = "rgba(255,255,255,0.04)"; }}
              onMouseOut={e => { if (!isActive) (e.currentTarget as HTMLDivElement).style.background = "var(--color-card)"; }}
            >
              <div style={{ width: "44px", height: "44px", borderRadius: "10px", background: isActive ? iconBg : iconBg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                {icon}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: "17px", fontWeight: 700, color: isActive ? "#3B82F6" : "var(--color-text-primary)", marginBottom: "4px" }}>{title}</div>
                <div style={{ fontSize: "13px", color: "var(--color-text-secondary)" }}>{desc}</div>
              </div>
              <div style={{ color: isActive ? "#3B82F6" : "var(--color-text-secondary)", opacity: isActive ? 1 : 0.4, flexShrink: 0, transform: isActive ? "rotate(90deg)" : "none", transition: "transform 0.2s" }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="9 18 15 12 9 6"/>
                </svg>
              </div>
            </div>

            {/* Expanded panel */}
            {isActive && (
              <div style={{
                border: "1px solid #3B82F6",
                borderTop: "none",
                borderRadius: "0 0 12px 12px",
                overflow: "hidden",
                marginBottom: "12px",
              }}>
                {id === "cdm" ? (
                  <ContentDecayMap domain={domain} />
                ) : id === "kc" ? (
                  <KeywordCannibalization />
                ) : id === "sdk" ? (
                  <StrikingDistanceKeywords />
                ) : id === "ctr" ? (
                  <CtrBenchmark />
                ) : (
                  <div style={{ padding: "40px 32px", background: "var(--color-card)", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: "10px" }}>
                    <div style={{ fontSize: "28px" }}>🚧</div>
                    <p style={{ fontSize: "16px", fontWeight: 700, color: "var(--color-text-primary)" }}>{title}</p>
                    <p style={{ fontSize: "13px", color: "var(--color-text-secondary)" }}>{t("optComingSoon")}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Stub tab ──────────────────────────────────────────────────────────────────
function StubTab({ label }: { label: string }) {
  return (
    <div style={{ padding: "80px 32px", display: "flex", flexDirection: "column", alignItems: "center", gap: "12px" }}>
      <div style={{ fontSize: "32px" }}>🚧</div>
      <p style={{ fontSize: "16px", fontWeight: 600, color: "var(--color-text-primary)" }}>{label}</p>
      <p style={{ fontSize: "13px", color: "var(--color-text-secondary)" }}>Coming soon</p>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function SitePage() {
  const { t } = useLanguage();
  const params = useParams();
  const router = useRouter();
  const domain = decodeURIComponent(params.id as string);
  const { blur } = usePrivacy();
  const blurStyle: React.CSSProperties = blur
    ? { filter: "blur(6px)", userSelect: "none", transition: "filter 0.25s" }
    : { transition: "filter 0.25s" };

  // Use index so tab state doesn't break on language change
  const TAB_KEYS = ["dashboard", "ga4", "indexing", "annotations", "optimize", "settings"] as const;
  type TabKey = typeof TAB_KEYS[number];
  const [activeTab, setActiveTab] = useState<TabKey>("dashboard");
  const [period, setPeriod]       = useState("7 days");

  const TABS: { key: TabKey; label: string }[] = [
    { key: "dashboard",   label: t("tabDashboard") },
    { key: "ga4",         label: t("tabGA4") },
    { key: "indexing",    label: t("tabIndexing") },
    { key: "annotations", label: t("tabAnnotations") },
    { key: "optimize",    label: t("tabOptimize") },
    { key: "settings",    label: t("tabSettings") },
  ];

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

  const periodOptions = ["7 days", "14 days", "28 days", "3 months", "6 months", "12 months"];

  return (
    <div style={{ minHeight: "100vh", background: "var(--color-bg)", color: "var(--color-text-primary)", fontFamily: "Inter, sans-serif" }}>
      {/* Top nav */}
      <div style={{ borderBottom: "1px solid var(--color-border)", padding: "0 32px", display: "flex", alignItems: "center", justifyContent: "space-between", background: "var(--color-card)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0" }}>
          {/* Breadcrumb */}
          <button onClick={() => router.push("/")} style={{ display: "flex", alignItems: "center", gap: "6px", padding: "16px 0", color: "var(--color-text-secondary)", fontSize: "14px", fontWeight: 600, cursor: "pointer", border: "none", background: "none" }}>
            <span style={{ opacity: 0.6 }}>SEO Gets</span>
          </button>
          <span style={{ color: "var(--color-text-secondary)", margin: "0 8px" }}>/</span>
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={`https://www.google.com/s2/favicons?domain=${domain}&sz=32`} width={14} height={14} alt="" style={{ borderRadius: "2px" }} onError={e => ((e.target as HTMLImageElement).style.display = "none")} />
            <span style={{ fontSize: "14px", fontWeight: 600, ...blurStyle }}>{domain}</span>
          </div>
          <span style={{ margin: "0 24px", color: "var(--color-border)" }}>|</span>
          {/* Tab nav */}
          <nav style={{ display: "flex", gap: "0" }}>
            {TABS.map(({ key, label }) => (
              <button key={key} onClick={() => setActiveTab(key)} style={{
                padding: "16px 14px", fontSize: "13px", fontWeight: activeTab === key ? 600 : 400,
                color: activeTab === key ? "var(--color-text-primary)" : "var(--color-text-secondary)",
                cursor: "pointer", border: "none",
                borderBottom: activeTab === key ? "2px solid var(--color-text-primary)" : "2px solid transparent",
                background: "none", transition: "all 0.15s",
              }}>{label}</button>
            ))}
          </nav>
        </div>

        {/* Right controls — only shown on Dashboard tab */}
        {activeTab === "dashboard" && (
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <button style={{ display: "flex", alignItems: "center", gap: "5px", padding: "6px 12px", borderRadius: "8px", border: "1px solid var(--color-border)", background: "var(--color-card)", color: "var(--color-text-secondary)", fontSize: "12px", cursor: "pointer" }}>
              <SlidersHorizontal size={13} /> {t("filter")}
            </button>
            {[
              { icon: <Sparkles size={13} />, color: C.clicks },
              { icon: <Eye size={13} />, color: C.impressions },
              { icon: <Percent size={13} />, color: C.ctr },
              { icon: <MoveUp size={13} />, color: C.position },
            ].map(({ icon, color }, i) => (
              <button key={i} style={{ width: "30px", height: "30px", borderRadius: "6px", border: "1px solid var(--color-border)", background: "var(--color-card)", color, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                {icon}
              </button>
            ))}
            <select value={period} onChange={e => setPeriod(e.target.value)} style={{ padding: "6px 10px", borderRadius: "8px", border: "1px solid var(--color-border)", fontSize: "12px", color: "var(--color-text-primary)", background: "var(--color-card)", cursor: "pointer", outline: "none" }}>
              {periodOptions.map(p => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* ── GA4 tab ── */}
      {activeTab === "ga4" && (
        <GA4Tab domain={domain} period={period} setPeriod={setPeriod} periodOptions={periodOptions} />
      )}

      {/* ── Indexing tab ── */}
      {activeTab === "indexing" && <IndexingTab />}

      {/* ── Annotations tab ── */}
      {activeTab === "annotations" && (
        <AnnotationsTab period={period} setPeriod={setPeriod} periodOptions={periodOptions} />
      )}

      {/* ── Optimize tab ── */}
      {activeTab === "optimize" && <OptimizeTab />}

      {/* ── Settings tab ── */}
      {activeTab === "settings" && (
        <SiteSettingsTab domain={domain} />
      )}

      {/* ── Dashboard tab content ── */}
      {activeTab === "dashboard" && (
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
              <span style={{ fontSize: "22px", fontWeight: 700, color: "var(--color-text-primary)" }}>{val}</span>
              <span style={{ fontSize: "13px", color: "#10B981", fontWeight: 600 }}>+{pct}%</span>
            </div>
          ))}
        </div>

        {/* Main chart */}
        <div style={{ background: "var(--color-card)", borderRadius: "12px", padding: "16px", border: "1px solid var(--color-border)" }}>
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
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border)" />
              <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "var(--color-text-secondary)" }} />
              <YAxis yAxisId="left"  axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "var(--color-text-secondary)" }} />
              <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "var(--color-text-secondary)" }} />
              <Tooltip content={<SiteTooltip />} cursor={{ stroke: "var(--color-border)", strokeWidth: 1 }} />
              <Line yAxisId="left"  type="monotone" dataKey="clicksC"      stroke={C.clicks}      strokeWidth={1} strokeDasharray="4 3" dot={false} legendType="none" />
              <Line yAxisId="right" type="monotone" dataKey="impressionsC" stroke={C.impressions}  strokeWidth={1} strokeDasharray="4 3" dot={false} legendType="none" />
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
            <h3 style={{ fontSize: "15px", fontWeight: 700, marginBottom: "12px", color: "var(--color-text-primary)" }}>{t("topicClusters")}</h3>
            <Placeholder icon={<MoveUp size={28} />} title={t("missingTopicClusters")} desc={`${t("define")} ${t("activateReportDesc")}`} />
          </div>
          <div>
            <h3 style={{ fontSize: "15px", fontWeight: 700, marginBottom: "12px", color: "var(--color-text-primary)" }}>{t("contentGroups")}</h3>
            <Placeholder icon={
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="8" y="8" width="8" height="8" rx="1"/><rect x="3" y="3" width="5" height="5" rx="1"/><rect x="16" y="3" width="5" height="5" rx="1"/><rect x="3" y="16" width="5" height="5" rx="1"/><rect x="16" y="16" width="5" height="5" rx="1"/></svg>
            } title={t("missingContentGroups")} desc={`${t("define")} ${t("activateReportDesc")}`} />
          </div>
        </div>

        {/* Queries + Pages */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "32px" }}>
          <DataTable title={t("queriesTable")} rows={queryRows} tabs={["All", "Growing", "Decaying"]} blur={blur} />
          <DataTable title={t("pagesTable")}   rows={pageRows}  tabs={["All", "Growing", "Decaying"]} blur={blur} />
        </div>

        {/* Branded + Query Counting */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "12px" }}>
              <h3 style={{ fontSize: "15px", fontWeight: 700, color: "var(--color-text-primary)" }}>{t("brandedVsNonBranded")}</h3>
              <TabBar tabs={["Trend", "Comparison"]} active="Trend" onChange={() => {}} />
            </div>
            <Placeholder icon={
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="9"/><path d="M9 9h1.5a1.5 1.5 0 0 1 0 3H9v3m3-6h1.5"/></svg>
            } title={t("missingBrandedKeywords")} desc={`${t("define")} ${t("activateReportDesc")}`} />
          </div>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "12px" }}>
              <h3 style={{ fontSize: "15px", fontWeight: 700, color: "var(--color-text-primary)" }}>{t("queryCounting")}</h3>
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
                    <span style={{ fontSize: "12px", fontWeight: 600, color: "var(--color-text-primary)" }}>{label}</span>
                  </div>
                  <span style={{ fontSize: "11px", color: "#10B981", fontWeight: 500 }}>+{pct}%</span>
                </div>
              ))}
            </div>
            <ResponsiveContainer width="100%" height={160}>
              <AreaChart data={qcData} margin={{ top: 4, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border)" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "var(--color-text-secondary)" }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "var(--color-text-secondary)" }} />
                <Tooltip contentStyle={{ fontSize: "12px", borderRadius: "8px", background: "var(--color-card)", border: "1px solid var(--color-border)", color: "var(--color-text-primary)" }} />
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
              <h3 style={{ fontSize: "15px", fontWeight: 700, color: "var(--color-text-primary)" }}>{t("newRankings")}</h3>
              <TabBar tabs={["Queries", "Pages"]} active="Queries" onChange={() => {}} />
            </div>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--color-border)" }}>
                  <th style={{ textAlign: "left", padding: "8px 0", color: "var(--color-text-secondary)", fontWeight: 500 }}></th>
                  <th style={{ textAlign: "left", padding: "8px 8px", color: C.clicks, fontWeight: 600, fontSize: "12px" }}>{t("clicks")}</th>
                  <th style={{ textAlign: "left", padding: "8px 8px", color: C.impressions, fontWeight: 600, fontSize: "12px" }}>{t("impressions")}</th>
                  <th style={{ textAlign: "left", padding: "8px 8px", color: C.ctr, fontWeight: 600, fontSize: "12px" }}>CTR</th>
                  <th style={{ textAlign: "left", padding: "8px 0", color: C.position, fontWeight: 600, fontSize: "12px" }}>{t("position")}</th>
                </tr>
              </thead>
              <tbody>
                {QUERIES.slice(0, 8).map((q, i) => (
                  <tr key={i} style={{ borderBottom: "1px solid var(--color-border)", background: i % 2 === 0 ? "rgba(255,255,255,0.03)" : "transparent" }}>
                    <td style={{ padding: "7px 8px 7px 0", maxWidth: "200px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontSize: "12px", color: "var(--color-text-primary)" }}>{q}</td>
                    <td style={{ padding: "7px 8px", fontSize: "12px", color: "var(--color-text-primary)" }}>0 <span style={{ color: "var(--color-text-secondary)" }}>~0%</span></td>
                    <td style={{ padding: "7px 8px", fontSize: "12px", color: "var(--color-text-secondary)" }}>{rndInt(1, 40)} <span style={{ color: "#10B981" }}>+∞%</span></td>
                    <td style={{ padding: "7px 8px", fontSize: "12px", color: "var(--color-text-secondary)" }}>0%</td>
                    <td style={{ padding: "7px 0", fontSize: "12px", color: "var(--color-text-secondary)" }}>{+rnd(5, 60).toFixed(1)} <span style={{ color: "var(--color-text-secondary)" }}>~0</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Devices */}
        <DeviceTable />

        {/* Footer */}
        <div style={{ borderTop: "1px solid var(--color-border)", paddingTop: "20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <div style={{ width: "20px", height: "20px", borderRadius: "4px", background: "#8B5CF6" }} />
              <span style={{ fontSize: "14px", fontWeight: 700, color: "var(--color-text-primary)" }}>SEO Gets</span>
            </div>
            <span style={{ fontSize: "13px", color: "var(--color-text-secondary)", cursor: "pointer" }}>{t("changelog")}</span>
          </div>
          <span style={{ fontSize: "12px", color: "var(--color-text-secondary)" }}>{t("copyright")}</span>
        </div>
      </div>
      )}
    </div>
  );
}
