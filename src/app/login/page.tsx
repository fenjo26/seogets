"use client";

import { signIn } from "next-auth/react";
import { BarChart2 } from "lucide-react";

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z" fill="#34A853"/>
      <path d="M3.964 10.707c-.18-.54-.282-1.117-.282-1.707s.102-1.167.282-1.707V4.961H.957C.347 6.175 0 7.548 0 9s.348 2.825.957 4.039l3.007-2.332z" fill="#FBBC05"/>
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.961L3.964 7.293C4.672 5.166 6.656 3.58 9 3.58z" fill="#EA4335"/>
    </svg>
  );
}

export default function LoginPage() {
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

      <div style={{ width: "100%", maxWidth: "400px", position: "relative", zIndex: 1 }}>
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
            Your personal Google Search Console dashboard
          </p>
        </div>

        {/* Card */}
        <div className="card" style={{ padding: "36px 32px", textAlign: "center" }}>
          <p style={{ fontSize: "14px", color: "var(--color-text-secondary)", marginBottom: "28px", lineHeight: 1.6 }}>
            Sign in with your Google account to access<br />all your Search Console properties.
          </p>

          <button
            onClick={() => signIn("google", { callbackUrl: "/" })}
            style={{
              display: "flex", alignItems: "center", justifyContent: "center", gap: "12px",
              width: "100%", padding: "13px 20px",
              borderRadius: "10px",
              background: "#fff",
              color: "#1f2937",
              fontSize: "15px", fontWeight: 600,
              border: "none", cursor: "pointer",
              boxShadow: "0 2px 8px rgba(0,0,0,0.25)",
              transition: "box-shadow 0.2s, transform 0.1s",
            }}
            onMouseOver={e => {
              e.currentTarget.style.boxShadow = "0 4px 16px rgba(0,0,0,0.35)";
              e.currentTarget.style.transform = "translateY(-1px)";
            }}
            onMouseOut={e => {
              e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.25)";
              e.currentTarget.style.transform = "translateY(0)";
            }}
          >
            <GoogleIcon />
            Sign in with Google
          </button>

          <p style={{ fontSize: "12px", color: "var(--color-text-secondary)", marginTop: "20px", opacity: 0.7 }}>
            You can connect multiple Google accounts<br />after signing in.
          </p>
        </div>
      </div>
    </div>
  );
}
