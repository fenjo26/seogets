"use client";

import { createContext, useContext, useState, useEffect } from "react";

export type LayoutMode = "wide" | "default";

interface LayoutCtx { layout: LayoutMode; setLayout: (v: LayoutMode) => void; }

const Ctx = createContext<LayoutCtx>({ layout: "wide", setLayout: () => {} });

export function LayoutProvider({ children }: { children: React.ReactNode }) {
  const [layout, setLayoutState] = useState<LayoutMode>("wide");

  useEffect(() => {
    const stored = localStorage.getItem("layout") as LayoutMode | null;
    if (stored === "default" || stored === "wide") setLayoutState(stored);
  }, []);

  const setLayout = (v: LayoutMode) => {
    setLayoutState(v);
    localStorage.setItem("layout", v);
  };

  return <Ctx.Provider value={{ layout, setLayout }}>{children}</Ctx.Provider>;
}

export const useLayout = () => useContext(Ctx);
