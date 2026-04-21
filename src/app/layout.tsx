import type { Metadata } from "next";
import "./globals.css";
import { LanguageProvider } from "@/lib/i18n/LanguageProvider";
import ClientSessionProvider from "@/components/ClientSessionProvider";
import DashboardShell from "@/components/DashboardShell";

export const metadata: Metadata = {
  title: "SEO Gets Dashboard",
  description: "Advanced Search Console Analytics without Limits",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <ClientSessionProvider>
          <LanguageProvider>
            <DashboardShell>
              {children}
            </DashboardShell>
          </LanguageProvider>
        </ClientSessionProvider>
      </body>
    </html>
  );
}
