"use client";

import { useState, useMemo } from "react";
import { ExternalLink } from "lucide-react";
import { useLanguage } from "@/lib/i18n/LanguageProvider";

// ─── Types ─────────────────────────────────────────────────────────────────────
interface StrikingKeyword {
  query: string;
  page: string;
  impressions: number;
  clicks: number;
  ctr: number;
  position: number;
}

// ─── Mock data ─────────────────────────────────────────────────────────────────
const MOCK_KEYWORDS: StrikingKeyword[] = [
  { query: "online betting sites greece", page: "/betting-sites/", impressions: 1450, clicks: 12, ctr: 0.8, position: 11.2 },
  { query: "best casino bonus no deposit", page: "/bonuses/no-deposit/", impressions: 3200, clicks: 45, ctr: 1.4, position: 12.5 },
  { query: "sports betting app download", page: "/app-download/", impressions: 890, clicks: 8, ctr: 0.9, position: 14.1 },
  { query: "live casino roulette tricks", page: "/live-casino/roulette/", impressions: 620, clicks: 5, ctr: 0.8, position: 16.8 },
  { query: "betovo reviews 2026", page: "/reviews/betovo/", impressions: 410, clicks: 14, ctr: 3.4, position: 4.5 },
  { query: "greek super league odds", page: "/sports/super-league/", impressions: 2100, clicks: 32, ctr: 1.5, position: 8.9 },
  { query: "slot games free spins", page: "/slots/free-spins/", impressions: 5600, clicks: 110, ctr: 2.0, position: 6.2 },
  { query: "crypto casino fast withdrawal", page: "/crypto-casino/", impressions: 1120, clicks: 9, ctr: 0.8, position: 18.4 },
  { query: "poker texas holdem rules", page: "/poker/rules/", impressions: 340, clicks: 2, ctr: 0.6, position: 21.3 },
];

// ─── Helpers ───────────────────────────────────────────────────────────────────
function fmtK(n: number) { return n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n); }

// ─── Info block ────────────────────────────────────────────────────────────────
function InfoBlock({
  posFrom, setPosFrom, posTo, setPosTo
}: {
  posFrom: number; setPosFrom: (v: number) => void;
  posTo: number; setPosTo: (v: number) => void;
}) {
  const { t } = useLanguage();
  return (
    <div style={{
      display: "grid", gridTemplateColumns: "1fr 1fr", gap: "32px",
      padding: "24px 28px",
      borderBottom: "1px solid var(--color-border)",
      background: "var(--color-card)",
    }}>
      {/* Position range */}
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "14px" }}>
          <div style={{ width: "28px", height: "28px", borderRadius: "6px", background: "rgba(245,158,11,0.12)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="20" x2="12" y2="10"/>
              <line x1="12" y1="6" x2="12" y2="6"/>
              <polyline points="8 14 12 10 16 14"/>
            </svg>
          </div>
          <span style={{ fontSize: "14px", fontWeight: 700, color: "var(--color-text-primary)" }}>{t("sdkPosRange")}</span>
        </div>
        <p style={{ fontSize: "13px", color: "var(--color-text-secondary)", lineHeight: "1.6", margin: "0 0 16px" }}>
          {t("sdkPosRangeDesc")}
        </p>
        
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--color-text-secondary)" }}>{t("sdkFrom")}</span>
          <input 
            type="number" 
            value={posFrom} 
            onChange={e => setPosFrom(Number(e.target.value))}
            style={{ 
              width: "70px", padding: "8px 12px", borderRadius: "8px", 
              border: "1px solid var(--color-border)", background: "var(--color-bg)", 
              color: "var(--color-text-primary)", fontSize: "14px", fontWeight: 600,
              outline: "none", textAlign: "center"
            }} 
          />
          <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--color-text-secondary)" }}>{t("sdkTo")}</span>
          <input 
            type="number" 
            value={posTo} 
            onChange={e => setPosTo(Number(e.target.value))}
            style={{ 
              width: "70px", padding: "8px 12px", borderRadius: "8px", 
              border: "1px solid var(--color-border)", background: "var(--color-bg)", 
              color: "var(--color-text-primary)", fontSize: "14px", fontWeight: 600,
              outline: "none", textAlign: "center"
            }} 
          />
        </div>
      </div>

      {/* What to do */}
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "14px" }}>
          <div style={{ width: "28px", height: "28px", borderRadius: "6px", background: "rgba(16,185,129,0.12)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
            </svg>
          </div>
          <span style={{ fontSize: "14px", fontWeight: 700, color: "var(--color-text-primary)" }}>{t("cdmWhatToDo")}</span>
        </div>
        <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: "10px" }}>
          {[
            t("sdkWhatToDo1"),
            t("sdkWhatToDo2"),
          ].map((text, i) => (
            <li key={i} style={{ display: "flex", gap: "10px", fontSize: "13px", color: "var(--color-text-secondary)", lineHeight: "1.55" }}>
              <span style={{ width: "18px", height: "18px", borderRadius: "50%", background: "rgba(16,185,129,0.1)", color: "#10B981", fontSize: "11px", fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: "1px" }}>{i + 1}</span>
              {text}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

// ─── Table ─────────────────────────────────────────────────────────────────────
type SortKey = "impressions" | "clicks" | "position" | "ctr";

function KeywordsTable({ data }: { data: StrikingKeyword[] }) {
  const { t } = useLanguage();
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("impressions");

  const filtered = useMemo(() => {
    return data
      .filter(k => {
        if (search && !k.query.toLowerCase().includes(search.toLowerCase()) && !k.page.toLowerCase().includes(search.toLowerCase())) return false;
        return true;
      })
      .sort((a, b) => {
        if (sortKey === "position") return a[sortKey] - b[sortKey];
        return b[sortKey] - a[sortKey];
      });
  }, [data, search, sortKey]);

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
          <SortBtn k="impressions" label={t("impressions")} />
          <SortBtn k="clicks"      label={t("clicks")} />
          <SortBtn k="position"    label={t("position")} />
        </div>
      </div>

      {/* Summary badge */}
      <div style={{ marginBottom: "16px" }}>
        <div style={{ display: "inline-block", padding: "4px 12px", borderRadius: "20px", background: "rgba(59,130,246,0.1)", fontSize: "12px", fontWeight: 600, color: "#3B82F6" }}>
          {filtered.length} {t("sdkBadge")}
        </div>
      </div>

      {/* Table header */}
      <div style={{
        display: "grid", gridTemplateColumns: "1.5fr 1fr 90px 90px 80px 90px",
        padding: "8px 14px", background: "var(--color-bg)",
        borderRadius: "8px 8px 0 0", border: "1px solid var(--color-border)",
        borderBottom: "none", fontSize: "11px", fontWeight: 600, color: "var(--color-text-secondary)",
        textTransform: "uppercase", letterSpacing: "0.05em", gap: "10px"
      }}>
        <div>{t("sdkColQuery")}</div>
        <div>{t("cdmPage")}</div>
        <div style={{ textAlign: "right" }}>{t("impressions")}</div>
        <div style={{ textAlign: "right" }}>{t("clicks")}</div>
        <div style={{ textAlign: "right" }}>{t("kcColCtr")}</div>
        <div style={{ textAlign: "right" }}>{t("position")}</div>
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
          <p style={{ fontSize: "13px", color: "var(--color-text-secondary)", margin: 0 }}>{t("sdkEmptyDesc")}</p>
        </div>
      ) : (
        <div style={{ border: "1px solid var(--color-border)", borderRadius: "0 0 8px 8px", overflow: "hidden" }}>
          {filtered.map((item, i) => (
            <div key={`${item.query}-${item.page}`} style={{
              display: "grid", gridTemplateColumns: "1.5fr 1fr 90px 90px 80px 90px",
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
              <div style={{ textAlign: "right", color: "var(--color-text-secondary)" }}>
                {item.clicks}
              </div>
              <div style={{ textAlign: "right", color: "var(--color-text-secondary)" }}>
                {item.ctr}%
              </div>
              <div style={{ textAlign: "right", fontWeight: 600, color: "#F59E0B" }}>
                {item.position.toFixed(1)}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main export ───────────────────────────────────────────────────────────────
export default function StrikingDistanceKeywords() {
  const [posFrom, setPosFrom] = useState(3);
  const [posTo, setPosTo] = useState(10);

  const filteredData = useMemo(() => {
    return MOCK_KEYWORDS.filter(k => k.position >= posFrom && k.position <= posTo);
  }, [posFrom, posTo]);

  return (
    <div style={{ border: "1px solid var(--color-border)", borderRadius: "12px", overflow: "hidden", marginTop: "20px", background: "var(--color-card)" }}>
      <InfoBlock 
        posFrom={posFrom} setPosFrom={setPosFrom} 
        posTo={posTo} setPosTo={setPosTo} 
      />
      <KeywordsTable data={filteredData} />
    </div>
  );
}
