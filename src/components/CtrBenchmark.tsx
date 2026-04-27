"use client";

import { useState, useMemo } from "react";
import { ExternalLink } from "lucide-react";
import { useLanguage } from "@/lib/i18n/LanguageProvider";

// ─── Types ─────────────────────────────────────────────────────────────────────
interface CtrQuery {
  query: string;
  page: string;
  impressions: number;
  clicks: number;
  position: number;
  actualCtr: number;
}

// ─── Constants ─────────────────────────────────────────────────────────────────
const BENCHMARKS: Record<number, number> = {
  1: 27.6,
  2: 15.8,
  3: 11.0,
  4: 8.4,
  5: 6.3,
  6: 4.9,
  7: 3.9,
  8: 3.3,
  9: 2.7,
  10: 2.4,
};

// ─── Mock Data ─────────────────────────────────────────────────────────────────
const MOCK_DATA: CtrQuery[] = [
  { query: "online casino greece", page: "/casino/", impressions: 12500, clicks: 1200, position: 2.1, actualCtr: 9.6 }, // Expected ~15.8, underperforming
  { query: "best sports betting app", page: "/betting-app/", impressions: 4500, clicks: 210, position: 4.5, actualCtr: 4.6 }, // Expected ~8.4, underperforming
  { query: "roulette rules", page: "/roulette/rules/", impressions: 8200, clicks: 180, position: 5.2, actualCtr: 2.1 }, // Expected ~6.3, underperforming
  { query: "no deposit bonus codes", page: "/bonus/no-deposit/", impressions: 6100, clicks: 95, position: 7.8, actualCtr: 1.5 }, // Expected ~3.3, underperforming
  { query: "how to play blackjack", page: "/blackjack/how-to-play/", impressions: 3400, clicks: 42, position: 9.1, actualCtr: 1.2 }, // Expected ~2.7, underperforming
];

// ─── Helpers ───────────────────────────────────────────────────────────────────
function fmtK(n: number) { return n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n); }

// Get expected CTR for a given position (rounding to nearest whole position for benchmark lookup)
function getExpectedCtr(position: number) {
  const pos = Math.max(1, Math.min(10, Math.round(position)));
  return BENCHMARKS[pos] || 0;
}

// ─── Info Blocks ───────────────────────────────────────────────────────────────
function InfoBlocks() {
  const { t } = useLanguage();
  return (
    <div style={{
      display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "24px",
      padding: "24px 28px",
      borderBottom: "1px solid var(--color-border)",
      background: "var(--color-bg)",
    }}>
      {/* How it works */}
      <div style={{ background: "var(--color-card)", borderRadius: "8px", border: "1px solid var(--color-border)", padding: "20px" }}>
        <h3 style={{ fontSize: "15px", fontWeight: 700, color: "var(--color-text-primary)", margin: "0 0 14px" }}>{t("cdmHowItWorks")}</h3>
        <p style={{ fontSize: "13px", color: "var(--color-text-secondary)", lineHeight: "1.6", margin: "0 0 12px" }}>
          <span style={{ color: "#3B82F6", cursor: "pointer" }}>{t("ctrHowItWorks1")}</span>{t("ctrHowItWorks2")}
        </p>
        <p style={{ fontSize: "13px", color: "var(--color-text-secondary)", lineHeight: "1.6", margin: "0 0 12px" }}>
          {t("ctrHowItWorks3")}
        </p>
        <p style={{ fontSize: "13px", color: "var(--color-text-secondary)", lineHeight: "1.6", margin: "0" }}>
          {t("ctrHowItWorks4")}
        </p>
      </div>

      {/* How to improve CTR */}
      <div style={{ background: "var(--color-card)", borderRadius: "8px", border: "1px solid var(--color-border)", padding: "20px" }}>
        <h3 style={{ fontSize: "15px", fontWeight: 700, color: "var(--color-text-primary)", margin: "0 0 14px" }}>{t("ctrImprove")}</h3>
        <ol style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: "10px" }}>
          {[
            t("ctrImprove1"),
            t("ctrImprove2"),
            t("ctrImprove3"),
            t("ctrImprove4"),
          ].map((text, i) => (
            <li key={i} style={{ display: "flex", gap: "8px", fontSize: "13px", color: "var(--color-text-secondary)", lineHeight: "1.5" }}>
              <span style={{ color: "var(--color-text-primary)", fontWeight: 600 }}>{i + 1}.</span>
              {text}
            </li>
          ))}
        </ol>
      </div>

      {/* Benchmark */}
      <div style={{ background: "var(--color-card)", borderRadius: "8px", border: "1px solid var(--color-border)", padding: "20px" }}>
        <h3 style={{ fontSize: "15px", fontWeight: 700, color: "var(--color-text-primary)", margin: "0 0 14px" }}>{t("ctrBenchmark")}</h3>
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          {Object.entries(BENCHMARKS).map(([pos, ctr]) => {
            const widthPct = (ctr / 27.6) * 100;
            return (
              <div key={pos} style={{ display: "flex", alignItems: "center", gap: "8px", height: "14px" }}>
                <div style={{ flex: 1, height: "100%", background: "transparent", display: "flex" }}>
                  <div style={{ width: `${widthPct}%`, height: "100%", background: "#93c5fd", borderRadius: "2px" }} />
                </div>
                <span style={{ fontSize: "12px", fontWeight: 500, color: "var(--color-text-primary)", width: "40px" }}>{ctr}%</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── Table ─────────────────────────────────────────────────────────────────────
type SortKey = "impressions" | "clicks" | "position" | "actualCtr" | "diff";

function CtrTable({ data }: { data: CtrQuery[] }) {
  const { t } = useLanguage();
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("diff"); // Sort by worst underperformer by default

  const enhancedData = useMemo(() => {
    return data.map(k => {
      const expectedCtr = getExpectedCtr(k.position);
      return {
        ...k,
        expectedCtr,
        diff: k.actualCtr - expectedCtr,
      };
    });
  }, [data]);

  const filtered = useMemo(() => {
    return enhancedData
      .filter(k => {
        if (search && !k.query.toLowerCase().includes(search.toLowerCase()) && !k.page.toLowerCase().includes(search.toLowerCase())) return false;
        return true;
      })
      .sort((a, b) => {
        if (sortKey === "position") return a[sortKey] - b[sortKey];
        if (sortKey === "diff") return a.diff - b.diff; // Most negative diff first
        return b[sortKey] - a[sortKey];
      });
  }, [enhancedData, search, sortKey]);

  const SortBtn = ({ k, label }: { k: SortKey; label: string }) => (
    <button
      onClick={() => setSortKey(k)}
      style={{
        padding: "4px 10px", borderRadius: "6px", fontSize: "12px", fontWeight: 600,
        border: `1px solid ${sortKey === k ? "#3B82F6" : "var(--color-border)"}`,
        background: sortKey === k ? "rgba(59,130,246,0.1)" : "transparent",
        color: sortKey === k ? "#3B82F6" : "var(--color-text-secondary)",
        cursor: "pointer", transition: "all 0.15s",
      }}
    >{label}</button>
  );

  return (
    <div style={{ padding: "20px 28px" }}>
      {/* Toolbar */}
      <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px", flexWrap: "wrap" }}>
        {/* Search */}
        <div style={{ position: "relative", flex: "1 1 200px", maxWidth: "300px" }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-secondary)" strokeWidth="2" style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)" }}>
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={t("sdkSearch")}
            style={{
              width: "100%", padding: "7px 12px 7px 30px", borderRadius: "8px",
              border: "1px solid var(--color-border)", background: "var(--color-bg)",
              color: "var(--color-text-primary)", fontSize: "13px", outline: "none",
              boxSizing: "border-box",
            }}
          />
        </div>

        {/* Sort */}
        <div style={{ display: "flex", alignItems: "center", gap: "6px", marginLeft: "auto" }}>
          <span style={{ fontSize: "12px", color: "var(--color-text-secondary)" }}>{t("kcSortBy")}</span>
          <SortBtn k="diff"        label={t("ctrSortWorst")} />
          <SortBtn k="impressions" label={t("impressions")} />
          <SortBtn k="position"    label={t("position")} />
        </div>
      </div>

      {/* Summary badge */}
      <div style={{ marginBottom: "16px" }}>
        <div style={{ display: "inline-block", padding: "4px 12px", borderRadius: "20px", background: "rgba(239,68,68,0.1)", fontSize: "12px", fontWeight: 600, color: "#EF4444" }}>
          {filtered.length} {t("ctrBadge")}
        </div>
      </div>

      {/* Table header */}
      <div style={{
        display: "grid", gridTemplateColumns: "1.5fr 1fr 90px 90px 80px 80px 80px",
        padding: "8px 14px", background: "var(--color-bg)",
        borderRadius: "8px 8px 0 0", border: "1px solid var(--color-border)",
        borderBottom: "none", fontSize: "11px", fontWeight: 600, color: "var(--color-text-secondary)",
        textTransform: "uppercase", letterSpacing: "0.05em", gap: "10px"
      }}>
        <div>{t("sdkColQuery")}</div>
        <div>{t("cdmPage")}</div>
        <div style={{ textAlign: "right" }}>{t("impressions")}</div>
        <div style={{ textAlign: "right" }}>{t("position")}</div>
        <div style={{ textAlign: "right" }}>{t("ctrColExpected")}</div>
        <div style={{ textAlign: "right" }}>{t("ctrColActual")}</div>
        <div style={{ textAlign: "right" }}>{t("ctrColDiff")}</div>
      </div>

      {/* Rows */}
      {filtered.length === 0 ? (
        <div style={{
          border: "1px solid var(--color-border)", borderRadius: "0 0 8px 8px",
          padding: "60px 32px", textAlign: "center",
          background: "var(--color-card)",
        }}>
          <div style={{ fontSize: "32px", marginBottom: "12px" }}>✅</div>
          <p style={{ fontSize: "16px", fontWeight: 700, color: "var(--color-text-primary)", margin: "0 0 6px" }}>{t("kcEmptyTitle")}</p>
          <p style={{ fontSize: "13px", color: "var(--color-text-secondary)", margin: 0 }}>{t("ctrEmptyDesc")}</p>
        </div>
      ) : (
        <div style={{ border: "1px solid var(--color-border)", borderRadius: "0 0 8px 8px", overflow: "hidden" }}>
          {filtered.map((item, i) => (
            <div key={`${item.query}-${item.page}`} style={{
              display: "grid", gridTemplateColumns: "1.5fr 1fr 90px 90px 80px 80px 80px",
              padding: "12px 14px", gap: "10px",
              borderBottom: i < filtered.length - 1 ? "1px solid var(--color-border)" : "none",
              background: i % 2 === 0 ? "var(--color-card)" : "rgba(255,255,255,0.02)",
              alignItems: "center", fontSize: "13px",
            }}>
              <div style={{ fontWeight: 600, color: "var(--color-text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {item.query}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "4px", color: "#3B82F6", overflow: "hidden" }}>
                <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}>{item.page}</span>
                <ExternalLink size={12} style={{ flexShrink: 0, opacity: 0.5 }} />
              </div>
              <div style={{ textAlign: "right", fontWeight: 600, color: "var(--color-text-primary)" }}>
                {fmtK(item.impressions)}
              </div>
              <div style={{ textAlign: "right", fontWeight: 600, color: "#F59E0B" }}>
                {item.position.toFixed(1)}
              </div>
              <div style={{ textAlign: "right", color: "var(--color-text-secondary)" }}>
                {item.expectedCtr.toFixed(1)}%
              </div>
              <div style={{ textAlign: "right", fontWeight: 600, color: "var(--color-text-primary)" }}>
                {item.actualCtr.toFixed(1)}%
              </div>
              <div style={{ textAlign: "right", fontWeight: 600, color: item.diff < 0 ? "#EF4444" : "#10B981" }}>
                {item.diff > 0 ? "+" : ""}{item.diff.toFixed(1)}%
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main export ───────────────────────────────────────────────────────────────
export default function CtrBenchmark() {
  return (
    <div style={{ border: "1px solid var(--color-border)", borderRadius: "12px", overflow: "hidden", marginTop: "20px", background: "var(--color-card)" }}>
      <InfoBlocks />
      <CtrTable data={MOCK_DATA} />
    </div>
  );
}
