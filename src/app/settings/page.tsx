"use client";

import { useEffect, useState } from "react";
import { signIn, signOut } from "next-auth/react";
import { Plus, Trash2, CheckCircle, AlertCircle, RefreshCw, LogOut, Globe } from "lucide-react";
import { useLanguage } from "@/lib/i18n/LanguageProvider";

interface ConnectedAccount {
  id: string;
  email: string;
  picture: string | null;
  connected: boolean;
}

export default function SettingsPage() {
  const { language, setLanguage } = useLanguage();
  const [accounts, setAccounts] = useState<ConnectedAccount[]>([]);
  const [loadingAccounts, setLoadingAccounts] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<{ sites: number; accounts: number } | null>(null);

  const fetchAccounts = async () => {
    setLoadingAccounts(true);
    const res = await fetch("/api/gsc/accounts");
    const data = await res.json();
    setAccounts(data.accounts || []);
    setLoadingAccounts(false);
  };

  useEffect(() => {
    fetchAccounts();
  }, []);

  const handleAddAccount = () => {
    signIn("google", { callbackUrl: "/settings" });
  };

  const handleRemove = async (accountId: string) => {
    if (!confirm("Disconnect this Google account?")) return;
    await fetch("/api/gsc/accounts", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ accountId }),
    });
    fetchAccounts();
  };

  const handleSync = async () => {
    setSyncing(true);
    setSyncResult(null);
    const res = await fetch("/api/gsc/sites");
    const data = await res.json();
    setSyncing(false);
    setSyncResult({ sites: data.sites?.length || 0, accounts: data.connected_accounts || 0 });
  };

  return (
    <div style={{ maxWidth: "760px" }}>
      <header className="topbar" style={{ marginBottom: "32px" }}>
        <div>
          <h1 className="title">Settings</h1>
          <p className="title-sm" style={{ marginTop: "4px" }}>
            Manage your Google Search Console connections and preferences.
          </p>
        </div>
      </header>

      {/* ── Google Integrations ─────────────────────────────────── */}
      <section className="card" style={{ marginBottom: "24px" }}>
        <div className="card-header" style={{ marginBottom: "24px" }}>
          <h2 style={{ fontSize: "16px", fontWeight: 600 }}>Google Search Console Accounts</h2>
          <button
            onClick={handleSync}
            disabled={syncing}
            style={{
              display: "flex", alignItems: "center", gap: "8px",
              padding: "8px 16px", borderRadius: "8px",
              background: "rgba(16,185,129,0.1)", color: "var(--color-success)",
              border: "1px solid rgba(16,185,129,0.3)",
              fontSize: "13px", fontWeight: 500,
              opacity: syncing ? 0.6 : 1,
            }}
          >
            <RefreshCw size={14} style={{ animation: syncing ? "spin 1s linear infinite" : "none" }} />
            {syncing ? "Syncing..." : "Sync All Sites"}
          </button>
        </div>

        {syncResult && (
          <div style={{
            marginBottom: "20px", padding: "12px 16px", borderRadius: "8px",
            background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.2)",
            color: "var(--color-success)", fontSize: "13px", display: "flex", gap: "8px", alignItems: "center",
          }}>
            <CheckCircle size={15} />
            Synced {syncResult.sites} sites from {syncResult.accounts} Google account{syncResult.accounts !== 1 ? 's' : ''}
          </div>
        )}

        {loadingAccounts ? (
          <div style={{ color: "var(--color-text-secondary)", fontSize: "14px", padding: "20px 0" }}>
            Loading connected accounts...
          </div>
        ) : accounts.length === 0 ? (
          <div style={{
            textAlign: "center", padding: "40px 24px",
            border: "1px dashed var(--color-border)", borderRadius: "10px",
          }}>
            <Globe size={32} style={{ color: "var(--color-text-secondary)", marginBottom: "12px" }} />
            <p style={{ color: "var(--color-text-secondary)", fontSize: "14px", marginBottom: "16px" }}>
              No Google accounts connected yet.<br />
              Add your first account to start syncing sites.
            </p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {accounts.map((acc) => (
              <div key={acc.id} style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "14px 16px", borderRadius: "10px",
                background: "rgba(255,255,255,0.03)", border: "1px solid var(--color-border)",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  {acc.picture ? (
                    <img src={acc.picture} alt="avatar" style={{ width: "36px", height: "36px", borderRadius: "50%" }} />
                  ) : (
                    <div style={{
                      width: "36px", height: "36px", borderRadius: "50%",
                      background: "var(--color-accent-purple)",
                      display: "flex", alignItems: "center", justifyContent: "center", fontSize: "14px",
                    }}>
                      {acc.email[0].toUpperCase()}
                    </div>
                  )}
                  <div>
                    <div style={{ fontSize: "14px", fontWeight: 500 }}>{acc.email}</div>
                    <div style={{ display: "flex", alignItems: "center", gap: "4px", marginTop: "2px" }}>
                      {acc.connected ? (
                        <><CheckCircle size={12} color="var(--color-success)" /><span style={{ fontSize: "12px", color: "var(--color-success)" }}>Active</span></>
                      ) : (
                        <><AlertCircle size={12} color="#f59e0b" /><span style={{ fontSize: "12px", color: "#f59e0b" }}>Token expired</span></>
                      )}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => handleRemove(acc.id)}
                  style={{ padding: "8px", borderRadius: "6px", color: "var(--color-text-secondary)", transition: "color 0.2s" }}
                  onMouseOver={e => e.currentTarget.style.color = "#f87171"}
                  onMouseOut={e => e.currentTarget.style.color = "var(--color-text-secondary)"}
                >
                  <Trash2 size={15} />
                </button>
              </div>
            ))}
          </div>
        )}

        <button
          onClick={handleAddAccount}
          style={{
            display: "flex", alignItems: "center", gap: "8px",
            marginTop: "16px", padding: "11px 20px",
            borderRadius: "8px", border: "1px dashed var(--color-border)",
            color: "var(--color-text-secondary)", fontSize: "13px", fontWeight: 500,
            width: "100%", justifyContent: "center",
            transition: "border-color 0.2s, color 0.2s",
          }}
          onMouseOver={e => { e.currentTarget.style.borderColor = "var(--color-accent-purple)"; e.currentTarget.style.color = "#fff"; }}
          onMouseOut={e => { e.currentTarget.style.borderColor = "var(--color-border)"; e.currentTarget.style.color = "var(--color-text-secondary)"; }}
        >
          <Plus size={15} />
          Connect another Google account
        </button>
      </section>

      {/* ── Language ──────────────────────────────────────────────── */}
      <section className="card" style={{ marginBottom: "24px" }}>
        <h2 style={{ fontSize: "16px", fontWeight: 600, marginBottom: "20px" }}>Language / Язык</h2>
        <div style={{ display: "flex", gap: "12px" }}>
          {[
            { code: "en" as const, label: "English", flag: "🇺🇸" },
            { code: "ru" as const, label: "Русский", flag: "🇷🇺" },
          ].map(({ code, label, flag }) => (
            <button
              key={code}
              onClick={() => setLanguage(code)}
              style={{
                padding: "12px 20px", borderRadius: "8px",
                border: `1px solid ${language === code ? "var(--color-accent-purple)" : "var(--color-border)"}`,
                background: language === code ? "rgba(139,92,246,0.1)" : "transparent",
                color: language === code ? "#fff" : "var(--color-text-secondary)",
                fontSize: "14px", fontWeight: 500,
                display: "flex", alignItems: "center", gap: "8px",
                transition: "all 0.2s",
              }}
            >
              <span style={{ fontSize: "18px" }}>{flag}</span>
              {label}
            </button>
          ))}
        </div>
      </section>

      {/* ── Session ───────────────────────────────────────────────── */}
      <section className="card">
        <h2 style={{ fontSize: "16px", fontWeight: 600, marginBottom: "20px" }}>Session</h2>
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          style={{
            display: "flex", alignItems: "center", gap: "8px",
            padding: "10px 20px", borderRadius: "8px",
            background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)",
            color: "#f87171", fontSize: "13px", fontWeight: 500,
          }}
        >
          <LogOut size={15} />
          Sign out from dashboard
        </button>
      </section>
    </div>
  );
}
