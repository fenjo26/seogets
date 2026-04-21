"use client";

import { usePathname } from "next/navigation";
import Sidebar from "./Sidebar";

// Pages that should NOT show the sidebar (auth pages)
const AUTH_PATHS = ["/login"];

export default function DashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAuthPage = AUTH_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/"));

  if (isAuthPage) {
    return <>{children}</>;
  }

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">
        {children}
      </main>
    </div>
  );
}
