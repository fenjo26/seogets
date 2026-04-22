"use client";

import { createContext, useContext, useState, useEffect } from "react";

interface PrivacyCtx { blur: boolean; setBlur: (v: boolean) => void; }

const Ctx = createContext<PrivacyCtx>({ blur: false, setBlur: () => {} });

export function PrivacyProvider({ children }: { children: React.ReactNode }) {
  const [blur, setBlurState] = useState(false);

  // Persist across page navigations (sessionStorage — clears on tab close)
  useEffect(() => {
    const stored = sessionStorage.getItem("privacy_blur");
    if (stored === "1") setBlurState(true);
  }, []);

  const setBlur = (v: boolean) => {
    setBlurState(v);
    sessionStorage.setItem("privacy_blur", v ? "1" : "0");
  };

  return <Ctx.Provider value={{ blur, setBlur }}>{children}</Ctx.Provider>;
}

export const usePrivacy = () => useContext(Ctx);
