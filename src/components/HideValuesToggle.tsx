"use client";

import { Eye, EyeOff } from "lucide-react";
import { useHideValues } from "@/lib/hideValues";

export default function HideValuesToggle() {
  const { hidden, toggle } = useHideValues();
  return (
    <button
      onClick={toggle}
      title={hidden ? "Mostrar valores" : "Ocultar valores"}
      aria-label={hidden ? "Mostrar valores" : "Ocultar valores"}
      className="grid place-items-center h-10 w-10 rounded-full border border-[var(--border)] bg-[var(--surface)] text-[var(--muted)] hover:text-foreground hover:bg-[var(--surface-2)] hover:border-[var(--border-strong)] transition-all outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] active:scale-95"
    >
      {hidden ? <EyeOff size={18} /> : <Eye size={18} />}
    </button>
  );
}
