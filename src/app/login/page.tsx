"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Lock, Mail, BarChart2 } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    setLoading(false);

    if (result?.error) {
      setError("Invalid email or password");
    } else {
      router.push("/");
      router.refresh();
    }
  };

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "var(--color-bg)",
      padding: "24px",
    }}>
      {/* Background glow */}
      <div style={{
        position: "fixed", top: "20%", left: "50%", transform: "translateX(-50%)",
        width: "600px", height: "400px", borderRadius: "50%",
        background: "radial-gradient(ellipse, rgba(139,92,246,0.12) 0%, transparent 70%)",
        pointerEvents: "none",
      }} />

      <div style={{
        width: "100%",
        maxWidth: "420px",
        position: "relative",
        zIndex: 1,
      }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: "40px" }}>
          <div style={{
            display: "inline-flex", alignItems: "center", justifyContent: "center",
            width: "56px", height: "56px", borderRadius: "14px",
            background: "var(--color-accent-purple)",
            marginBottom: "16px",
          }}>
            <BarChart2 size={28} color="#fff" />
          </div>
          <h1 style={{ fontSize: "28px", fontWeight: 700, letterSpacing: "-0.03em", color: "#fff" }}>
            SEO Gets
          </h1>
          <p className="title-sm" style={{ marginTop: "8px" }}>
            Sign in to your analytics dashboard
          </p>
        </div>

        {/* Card */}
        <div className="card" style={{ padding: "32px" }}>
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>

            {/* Email field */}
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <label style={{ fontSize: "13px", fontWeight: 500, color: "var(--color-text-secondary)" }}>
                Email
              </label>
              <div style={{ position: "relative" }}>
                <Mail size={16} style={{
                  position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)",
                  color: "var(--color-text-secondary)", pointerEvents: "none",
                }} />
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="admin@seogets.local"
                  required
                  style={{
                    width: "100%", padding: "12px 14px 12px 42px",
                    borderRadius: "8px", border: "1px solid var(--color-border)",
                    background: "rgba(255,255,255,0.04)", color: "#fff",
                    fontSize: "14px", outline: "none",
                    boxSizing: "border-box",
                    transition: "border-color 0.2s",
                  }}
                  onFocus={e => e.target.style.borderColor = "var(--color-accent-purple)"}
                  onBlur={e => e.target.style.borderColor = "var(--color-border)"}
                />
              </div>
            </div>

            {/* Password field */}
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <label style={{ fontSize: "13px", fontWeight: 500, color: "var(--color-text-secondary)" }}>
                Password
              </label>
              <div style={{ position: "relative" }}>
                <Lock size={16} style={{
                  position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)",
                  color: "var(--color-text-secondary)", pointerEvents: "none",
                }} />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Enter password"
                  required
                  style={{
                    width: "100%", padding: "12px 44px 12px 42px",
                    borderRadius: "8px", border: "1px solid var(--color-border)",
                    background: "rgba(255,255,255,0.04)", color: "#fff",
                    fontSize: "14px", outline: "none",
                    boxSizing: "border-box",
                    transition: "border-color 0.2s",
                  }}
                  onFocus={e => e.target.style.borderColor = "var(--color-accent-purple)"}
                  onBlur={e => e.target.style.borderColor = "var(--color-border)"}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: "absolute", right: "14px", top: "50%", transform: "translateY(-50%)",
                    color: "var(--color-text-secondary)", padding: "4px",
                  }}
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {/* Error message */}
            {error && (
              <div style={{
                padding: "12px 16px", borderRadius: "8px",
                background: "rgba(239, 68, 68, 0.1)", border: "1px solid rgba(239, 68, 68, 0.3)",
                color: "#f87171", fontSize: "13px",
              }}>
                {error}
              </div>
            )}

            {/* Submit button */}
            <button
              type="submit"
              disabled={loading}
              style={{
                padding: "13px", borderRadius: "8px",
                background: loading ? "rgba(139,92,246,0.5)" : "var(--color-accent-purple)",
                color: "#fff", fontWeight: 600, fontSize: "14px",
                transition: "opacity 0.2s",
                cursor: loading ? "not-allowed" : "pointer",
              }}
            >
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>
        </div>

        <p className="title-sm" style={{ textAlign: "center", marginTop: "24px" }}>
          Access is restricted to authorized administrators only.
        </p>
      </div>
    </div>
  );
}
