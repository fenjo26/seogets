"use client";

import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { ExternalLink, Sparkles, Database, BarChart3, Settings } from "lucide-react";

export default function SiteSettingsTab({ domain }: { domain: string }) {
  const { t } = useLanguage();

  return (
    <div style={{ padding: "24px 32px", display: "flex", flexDirection: "column", gap: "24px", maxWidth: "1200px" }}>
      
      {/* Hero */}
      <div style={{ 
        background: "linear-gradient(to right, rgba(167,139,250,0.05), rgba(167,139,250,0.15))", 
        borderRadius: "12px", border: "1px solid rgba(167,139,250,0.2)", padding: "32px",
        position: "relative", overflow: "hidden" 
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px" }}>
          <div style={{ width: "32px", height: "32px", borderRadius: "8px", background: "rgba(59,130,246,0.1)", display: "flex", alignItems: "center", justifyContent: "center", color: "#3B82F6" }}>
            <Settings size={18} />
          </div>
          <h2 style={{ fontSize: "20px", fontWeight: 700, color: "var(--color-text-primary)", margin: 0 }}>
            {t("setHelpTitle")}
          </h2>
        </div>
        <p style={{ fontSize: "14px", color: "var(--color-text-secondary)", maxWidth: "800px", lineHeight: "1.6", marginBottom: "24px" }}>
          {t("setHelpDesc")}
        </p>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "24px" }}>
          <div style={{ display: "flex", gap: "12px" }}>
            <div style={{ width: "24px", height: "24px", borderRadius: "6px", background: "rgba(16,185,129,0.1)", color: "#10B981", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <div style={{ width: "10px", height: "10px", borderRadius: "50%", border: "2px solid currentColor" }} />
            </div>
            <div>
              <h4 style={{ fontSize: "14px", fontWeight: 700, color: "var(--color-text-primary)", margin: "0 0 6px" }}>{t("setBrandMonitor")}</h4>
              <p style={{ fontSize: "13px", color: "var(--color-text-secondary)", lineHeight: "1.5", margin: 0 }}>{t("setBrandMonitorDesc")}</p>
            </div>
          </div>
          <div style={{ display: "flex", gap: "12px" }}>
            <div style={{ width: "24px", height: "24px", borderRadius: "6px", background: "rgba(167,139,250,0.1)", color: "#A78BFA", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
            </div>
            <div>
              <h4 style={{ fontSize: "14px", fontWeight: 700, color: "var(--color-text-primary)", margin: "0 0 6px" }}>{t("setContentGroups")}</h4>
              <p style={{ fontSize: "13px", color: "var(--color-text-secondary)", lineHeight: "1.5", margin: 0 }}>{t("setContentGroupsDesc")}</p>
            </div>
          </div>
          <div style={{ display: "flex", gap: "12px" }}>
            <div style={{ width: "24px", height: "24px", borderRadius: "6px", background: "rgba(245,158,11,0.1)", color: "#F59E0B", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 3 21 3 21 9"/><line x1="9" y1="21" x2="21" y2="3"/><line x1="21" y1="21" x2="3" y2="3"/></svg>
            </div>
            <div>
              <h4 style={{ fontSize: "14px", fontWeight: 700, color: "var(--color-text-primary)", margin: "0 0 6px" }}>{t("setClientPortal")}</h4>
              <p style={{ fontSize: "13px", color: "var(--color-text-secondary)", lineHeight: "1.5", margin: 0 }}>{t("setClientPortalDesc")}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Branded Keywords */}
      <div style={{ background: "var(--color-card)", borderRadius: "12px", border: "1px solid var(--color-border)", padding: "24px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div style={{ color: "#3B82F6" }}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="9"/><path d="M9 9h1.5a1.5 1.5 0 0 1 0 3H9v3m3-6h1.5"/></svg></div>
            <h3 style={{ fontSize: "16px", fontWeight: 700, color: "var(--color-text-primary)", margin: 0 }}>{t("setBrandedKw")}</h3>
            <a href="#" style={{ fontSize: "12px", color: "#3B82F6", textDecoration: "none", display: "flex", alignItems: "center", gap: "4px" }}>
              {t("setHelpGuide")} <ExternalLink size={12} />
            </a>
          </div>
          <button style={{ 
            display: "flex", alignItems: "center", gap: "6px", 
            padding: "8px 16px", borderRadius: "8px", border: "1px solid rgba(167,139,250,0.3)", 
            background: "rgba(167,139,250,0.05)", color: "var(--color-text-primary)", 
            fontSize: "13px", fontWeight: 600, cursor: "pointer",
            boxShadow: "0 0 10px rgba(167,139,250,0.2)"
          }}>
            <Sparkles size={14} color="#A78BFA" /> {t("setOneClickBranded")}
          </button>
        </div>
        <p style={{ fontSize: "13px", color: "var(--color-text-primary)", marginBottom: "12px" }}>
          {t("setBrandedDesc1").replace("{domain}", domain)}
        </p>
        <p style={{ fontSize: "13px", color: "var(--color-text-secondary)", marginBottom: "4px" }}>
          {t("setBrandedDesc2")}
        </p>
        <p style={{ fontSize: "13px", color: "var(--color-text-secondary)", marginBottom: "20px" }}>
          {t("setBrandedDesc3")}
        </p>
        <div style={{ display: "flex", gap: "12px" }}>
          <input type="text" placeholder={t("setEnterKw")} style={{ 
            width: "300px", padding: "10px 14px", borderRadius: "8px", border: "1px solid var(--color-border)", 
            background: "var(--color-bg)", color: "var(--color-text-primary)", fontSize: "14px", outline: "none" 
          }} />
          <button style={{ 
            padding: "10px 24px", borderRadius: "8px", border: "1px solid var(--color-border)", 
            background: "var(--color-bg)", color: "var(--color-text-primary)", fontSize: "14px", fontWeight: 600, cursor: "pointer" 
          }}>{t("setAdd")}</button>
        </div>
      </div>

      {/* Topic Clusters */}
      <div style={{ background: "var(--color-card)", borderRadius: "12px", border: "1px solid var(--color-border)", padding: "24px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div style={{ color: "#3B82F6" }}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></svg></div>
            <h3 style={{ fontSize: "16px", fontWeight: 700, color: "var(--color-text-primary)", margin: 0 }}>{t("setTopicClusters")}</h3>
            <a href="#" style={{ fontSize: "12px", color: "#3B82F6", textDecoration: "none", display: "flex", alignItems: "center", gap: "4px" }}>
              {t("setHelpGuide")} <ExternalLink size={12} />
            </a>
          </div>
          <button style={{ 
            display: "flex", alignItems: "center", gap: "6px", 
            padding: "8px 16px", borderRadius: "8px", border: "1px solid rgba(167,139,250,0.3)", 
            background: "rgba(167,139,250,0.05)", color: "var(--color-text-primary)", 
            fontSize: "13px", fontWeight: 600, cursor: "pointer",
            boxShadow: "0 0 10px rgba(167,139,250,0.2)"
          }}>
            <Sparkles size={14} color="#A78BFA" /> {t("setOneClickTopic")}
          </button>
        </div>
        <p style={{ fontSize: "13px", color: "var(--color-text-primary)", marginBottom: "4px" }}>
          {t("setTopicDesc1")}
        </p>
        <p style={{ fontSize: "13px", color: "var(--color-text-secondary)", marginBottom: "20px" }}>
          {t("setTopicDesc2")}
        </p>
        <button style={{ 
          padding: "10px 16px", borderRadius: "8px", border: "1px solid var(--color-border)", 
          background: "var(--color-bg)", color: "var(--color-text-primary)", fontSize: "14px", fontWeight: 600, cursor: "pointer" 
        }}>{t("setNewTopic")}</button>
      </div>

      {/* Content Groups */}
      <div style={{ background: "var(--color-card)", borderRadius: "12px", border: "1px solid var(--color-border)", padding: "24px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div style={{ color: "#3B82F6" }}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="8" y="8" width="8" height="8" rx="1"/><rect x="3" y="3" width="5" height="5" rx="1"/><rect x="16" y="3" width="5" height="5" rx="1"/><rect x="3" y="16" width="5" height="5" rx="1"/><rect x="16" y="16" width="5" height="5" rx="1"/></svg></div>
            <h3 style={{ fontSize: "16px", fontWeight: 700, color: "var(--color-text-primary)", margin: 0 }}>{t("setContentGroupsTab")}</h3>
            <a href="#" style={{ fontSize: "12px", color: "#3B82F6", textDecoration: "none", display: "flex", alignItems: "center", gap: "4px" }}>
              {t("setHelpGuide")} <ExternalLink size={12} />
            </a>
          </div>
          <button style={{ 
            display: "flex", alignItems: "center", gap: "6px", 
            padding: "8px 16px", borderRadius: "8px", border: "1px solid rgba(167,139,250,0.3)", 
            background: "rgba(167,139,250,0.05)", color: "var(--color-text-primary)", 
            fontSize: "13px", fontWeight: 600, cursor: "pointer",
            boxShadow: "0 0 10px rgba(167,139,250,0.2)"
          }}>
            <Sparkles size={14} color="#A78BFA" /> {t("setOneClickContent")}
          </button>
        </div>
        <p style={{ fontSize: "13px", color: "var(--color-text-primary)", marginBottom: "4px" }}>
          {t("setContentDesc1")}
        </p>
        <p style={{ fontSize: "13px", color: "var(--color-text-secondary)", marginBottom: "20px" }}>
          {t("setContentDesc2")}
        </p>
        <button style={{ 
          padding: "10px 16px", borderRadius: "8px", border: "1px solid var(--color-border)", 
          background: "var(--color-bg)", color: "var(--color-text-primary)", fontSize: "14px", fontWeight: 600, cursor: "pointer" 
        }}>{t("setNewContent")}</button>
      </div>

      {/* Shared Link */}
      <div style={{ background: "var(--color-card)", borderRadius: "12px", border: "1px solid var(--color-border)", padding: "24px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px" }}>
          <div style={{ color: "#3B82F6" }}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg></div>
          <h3 style={{ fontSize: "16px", fontWeight: 700, color: "var(--color-text-primary)", margin: 0 }}>{t("setSharedLink")}</h3>
        </div>
        <p style={{ fontSize: "13px", color: "var(--color-text-primary)", marginBottom: "4px" }}>
          {t("setSharedLinkDesc1").replace("{domain}", domain)} <span style={{ color: "#3B82F6", cursor: "pointer" }}>{t("setSharedLinkExample")}</span> {t("setSharedLinkDesc2")}
        </p>
        <p style={{ fontSize: "13px", color: "var(--color-text-primary)", marginBottom: "20px" }}>
          {t("setSharedLinkDesc3")} <span style={{ color: "#3B82F6", cursor: "pointer" }}>SPP</span> and <span style={{ color: "#3B82F6", cursor: "pointer" }}>Agency Analytics</span>.
        </p>
        <button style={{ 
          padding: "10px 16px", borderRadius: "8px", border: "1px solid var(--color-border)", 
          background: "var(--color-bg)", color: "var(--color-text-primary)", fontSize: "14px", fontWeight: 600, cursor: "pointer", marginBottom: "12px"
        }}>{t("setGenerateLink")}</button>
        <p style={{ fontSize: "12px", color: "var(--color-text-secondary)", margin: 0 }}>
          {t("setSharedLinkNote")}
        </p>
      </div>

      {/* Super Site Page Selection */}
      <div style={{ background: "var(--color-card)", borderRadius: "12px", border: "1px solid var(--color-border)", padding: "24px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "12px" }}>
          <div style={{ color: "#A78BFA" }}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg></div>
          <h3 style={{ fontSize: "16px", fontWeight: 700, color: "var(--color-text-primary)", margin: 0 }}>{t("setSuperSite")}</h3>
        </div>
        <p style={{ fontSize: "13px", color: "var(--color-text-primary)", marginBottom: "4px" }}>
          {t("setSuperSiteDesc1")}
        </p>
        <p style={{ fontSize: "13px", color: "var(--color-text-secondary)", marginBottom: "16px" }}>
          {t("setSuperSiteDesc2")}
        </p>
        
        <div style={{ background: "rgba(245,158,11,0.05)", border: "1px solid rgba(245,158,11,0.2)", borderRadius: "8px", padding: "12px 16px", marginBottom: "16px", display: "inline-flex", alignItems: "center", gap: "8px" }}>
          <span>👑</span>
          <span style={{ fontSize: "13px", color: "var(--color-text-primary)" }}>
            {t("setUpgradeDomain").replace("{domain}", domain)} <span style={{ color: "#3B82F6", cursor: "pointer" }}>{t("setSuperSitesLink")}</span> {t("setUnlockSelection")}
          </span>
        </div>

        <textarea 
          placeholder={t("setSitemapPlaceholder")}
          style={{
            width: "100%", height: "100px", padding: "12px", borderRadius: "8px", border: "1px solid var(--color-border)",
            background: "var(--color-bg)", color: "var(--color-text-primary)", fontSize: "13px", fontFamily: "monospace",
            resize: "none", outline: "none", boxSizing: "border-box", marginBottom: "12px"
          }}
        />
        <p style={{ fontSize: "12px", color: "var(--color-text-secondary)", marginBottom: "16px" }}>
          {t("setSitemapNote")}
        </p>
        
        <div style={{ display: "flex", gap: "12px" }}>
          <button style={{ 
            padding: "10px 24px", borderRadius: "8px", border: "none", 
            background: "var(--color-text-secondary)", color: "#fff", fontSize: "14px", fontWeight: 600, cursor: "pointer" 
          }}>{t("setSave")}</button>
          <button style={{ 
            display: "flex", alignItems: "center", gap: "6px",
            padding: "10px 16px", borderRadius: "8px", border: "1px solid var(--color-border)", 
            background: "var(--color-bg)", color: "var(--color-text-secondary)", fontSize: "14px", fontWeight: 600, cursor: "pointer" 
          }}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg> {t("setValidateSitemaps")}</button>
        </div>
      </div>

      {/* Data Source */}
      <div style={{ background: "var(--color-card)", borderRadius: "12px", border: "1px solid var(--color-border)", padding: "24px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "12px" }}>
          <div style={{ color: "#3B82F6" }}><Database size={16} /></div>
          <h3 style={{ fontSize: "16px", fontWeight: 700, color: "var(--color-text-primary)", margin: 0 }}>{t("setDataSource")}</h3>
        </div>
        <p style={{ fontSize: "13px", color: "var(--color-text-primary)", marginBottom: "20px" }}>
          {t("setDataSourceDesc").replace("{domain}", domain)}
        </p>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px" }}>
          {/* GSC */}
          <div style={{ background: "var(--color-bg)", borderRadius: "8px", padding: "16px", border: "1px solid var(--color-border)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
              <div style={{ color: "#10B981" }}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg></div>
              <span style={{ fontSize: "14px", fontWeight: 700, color: "var(--color-text-primary)" }}>📊 {t("setGsc")}</span>
            </div>
            <p style={{ fontSize: "13px", color: "var(--color-text-secondary)", margin: 0, lineHeight: "1.5" }}>
              {t("setGscDesc")}
            </p>
          </div>

          {/* Extended Storage */}
          <div style={{ background: "var(--color-bg)", borderRadius: "8px", padding: "16px", border: "1px solid transparent" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
              <div style={{ width: "14px", height: "14px", borderRadius: "50%", border: "2px solid var(--color-border)", flexShrink: 0 }} />
              <span style={{ fontSize: "14px", fontWeight: 700, color: "var(--color-text-primary)" }}>✨ {t("setExtended")}</span>
            </div>
            <p style={{ fontSize: "13px", color: "var(--color-text-secondary)", margin: 0, lineHeight: "1.5" }}>
              {t("setExtendedDesc1")} <span style={{ color: "#3B82F6", cursor: "pointer" }}>{t("setLearnMore")}</span> {t("setExtendedDesc2")}
            </p>
          </div>

          {/* BigQuery */}
          <div style={{ background: "var(--color-bg)", borderRadius: "8px", padding: "16px", border: "1px solid transparent" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
              <div style={{ width: "14px", height: "14px", borderRadius: "50%", border: "2px solid var(--color-border)", flexShrink: 0 }} />
              <span style={{ fontSize: "14px", fontWeight: 700, color: "var(--color-text-primary)" }}>🔍 {t("setBigQuery")}</span>
            </div>
            <p style={{ fontSize: "13px", color: "var(--color-text-secondary)", margin: 0, lineHeight: "1.5" }}>
              {t("setBigQueryDesc")}
            </p>
          </div>
        </div>
      </div>

      {/* GA4 */}
      <div style={{ padding: "0 24px", paddingBottom: "32px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "12px" }}>
          <div style={{ color: "#F59E0B" }}><BarChart3 size={16} /></div>
          <h3 style={{ fontSize: "16px", fontWeight: 700, color: "var(--color-text-primary)", margin: 0 }}>{t("setGa4")}</h3>
        </div>
        <p style={{ fontSize: "13px", color: "var(--color-text-primary)", marginBottom: "16px" }}>
          {t("setGa4Desc")}
        </p>

        <select style={{ 
          width: "300px", padding: "10px 14px", borderRadius: "8px", border: "1px solid var(--color-border)", 
          background: "var(--color-card)", color: "var(--color-text-primary)", fontSize: "13px", outline: "none",
          marginBottom: "16px", appearance: "none", cursor: "pointer"
        }}>
          <option value="">{t("setSelectGa4")}</option>
        </select>

        <div style={{ background: "var(--color-bg)", border: "1px solid var(--color-border)", borderRadius: "8px", padding: "12px 16px", maxWidth: "600px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "6px", color: "#3B82F6" }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
            <span style={{ fontSize: "12px", fontWeight: 600 }}>{t("setGa4Note")}</span>
          </div>
          <p style={{ fontSize: "12px", color: "var(--color-text-secondary)", margin: 0, lineHeight: "1.5" }}>
            {t("setGa4Sources")}
          </p>
        </div>
      </div>

    </div>
  );
}
