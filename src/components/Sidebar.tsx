"use client";

import { LayoutDashboard, Globe, Settings, TrendingUp, Anchor, BarChart2 } from "lucide-react";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { usePathname, useRouter } from "next/navigation";

interface NavItem {
  key: string;
  icon: React.ReactNode;
  labelKey: keyof ReturnType<typeof useLanguage>['t'] extends (k: infer K) => string ? K : never;
  href: string;
}

export default function Sidebar() {
  const { t } = useLanguage();
  const pathname = usePathname();
  const router = useRouter();

  const navItems = [
    { href: "/", icon: <LayoutDashboard size={18} />, label: t("menuDashboard") },
    { href: "/portfolio", icon: <Globe size={18} />, label: t("menuPortfolio") },
    { href: "/performance", icon: <TrendingUp size={18} />, label: t("menuPerformance") },
    { href: "/cannibalization", icon: <Anchor size={18} />, label: t("menuCannibalization") },
    { href: "/testing", icon: <BarChart2 size={18} />, label: t("menuTesting") },
  ];

  return (
    <aside className="sidebar">
      <div style={{ padding: "0 12px" }}>
        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "40px" }}>
          <div style={{ width: "28px", height: "28px", borderRadius: "6px", background: "var(--color-accent-purple)" }} />
          <h1 style={{ fontSize: "18px", fontWeight: 600, letterSpacing: "-0.02em", color: "#fff" }}>
            SEO Gets
          </h1>
        </div>

        {/* Navigation */}
        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
          <div className="title-sm" style={{ marginBottom: "12px", fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.05em" }}>
            {t("menu")}
          </div>

          {navItems.map(({ href, icon, label }) => {
            const isActive = pathname === href;
            return (
              <button
                key={href}
                onClick={() => router.push(href)}
                style={{
                  display: "flex", alignItems: "center", gap: "12px",
                  padding: "10px 12px", borderRadius: "8px",
                  backgroundColor: isActive ? "rgba(255,255,255,0.1)" : "transparent",
                  color: isActive ? "#fff" : "var(--color-text-secondary)",
                  transition: "all 0.15s",
                  width: "100%",
                }}
                onMouseOver={e => { if (!isActive) e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.05)"; }}
                onMouseOut={e => { if (!isActive) e.currentTarget.style.backgroundColor = "transparent"; }}
              >
                {icon}
                <span style={{ fontSize: "14px", fontWeight: isActive ? 600 : 400 }}>{label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Bottom: Settings */}
      <div style={{ marginTop: "auto", padding: "0 12px" }}>
        <div style={{ borderTop: "1px solid var(--color-border)", paddingTop: "16px" }}>
          <button
            onClick={() => router.push("/settings")}
            style={{
              display: "flex", alignItems: "center", gap: "12px",
              padding: "10px 12px", borderRadius: "8px",
              backgroundColor: pathname === "/settings" ? "rgba(255,255,255,0.1)" : "transparent",
              color: pathname === "/settings" ? "#fff" : "var(--color-text-secondary)",
              width: "100%", transition: "all 0.15s",
            }}
            onMouseOver={e => { if (pathname !== "/settings") e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.05)"; }}
            onMouseOut={e => { if (pathname !== "/settings") e.currentTarget.style.backgroundColor = "transparent"; }}
          >
            <Settings size={18} />
            <span style={{ fontSize: "14px", fontWeight: pathname === "/settings" ? 600 : 400 }}>
              {t("menuSettings")}
            </span>
          </button>
        </div>
      </div>
    </aside>
  );
}
