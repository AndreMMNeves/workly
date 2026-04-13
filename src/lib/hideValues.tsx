"use client";

import { createContext, useContext, useEffect, useState } from "react";

const STORAGE_KEY = "workly-hide-values";

type Ctx = {
  hidden: boolean;
  toggle: () => void;
  mask: (formatted: string) => string;
};

const HideValuesContext = createContext<Ctx | null>(null);

export function HideValuesProvider({ children }: { children: React.ReactNode }) {
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    setHidden(localStorage.getItem(STORAGE_KEY) === "1");
  }, []);

  function toggle() {
    setHidden((h) => {
      const next = !h;
      localStorage.setItem(STORAGE_KEY, next ? "1" : "0");
      return next;
    });
  }

  function mask(formatted: string) {
    if (!hidden) return formatted;
    // Preserves the "R$ " prefix when present
    if (formatted.startsWith("R$")) return "R$ ••••••";
    return "••••••";
  }

  return (
    <HideValuesContext.Provider value={{ hidden, toggle, mask }}>
      {children}
    </HideValuesContext.Provider>
  );
}

export function useHideValues() {
  const ctx = useContext(HideValuesContext);
  if (!ctx) throw new Error("useHideValues must be used within HideValuesProvider");
  return ctx;
}
