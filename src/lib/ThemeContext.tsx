"use client";

import { createContext, useContext, useState, useEffect } from "react";

interface ThemeCtx { dark: boolean; setDark: (v: boolean) => void; }

const Ctx = createContext<ThemeCtx>({ dark: true, setDark: () => {} });

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [dark, setDarkState] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem("theme");
    const isDark = stored !== "light"; // default dark
    setDarkState(isDark);
    document.documentElement.setAttribute("data-theme", isDark ? "dark" : "light");
  }, []);

  const setDark = (v: boolean) => {
    setDarkState(v);
    localStorage.setItem("theme", v ? "dark" : "light");
    document.documentElement.setAttribute("data-theme", v ? "dark" : "light");
  };

  return <Ctx.Provider value={{ dark, setDark }}>{children}</Ctx.Provider>;
}

export const useTheme = () => useContext(Ctx);
