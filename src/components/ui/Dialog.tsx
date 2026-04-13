"use client";

import { useEffect, type ReactNode } from "react";
import { X } from "lucide-react";

type Props = {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  size?: "sm" | "md" | "lg";
};

const sizes = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-xl",
};

export default function Dialog({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = "md",
}: Props) {
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="dialog-title"
      className="fixed inset-0 z-50 grid place-items-center p-4 animate-[fadeIn_100ms_ease-out]"
    >
      <div
        className="absolute inset-0 bg-black/70"
        onClick={onClose}
        aria-hidden
      />
      <div
        className={`relative w-full ${sizes[size]} rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-2xl animate-[slideUp_120ms_ease-out] will-change-transform`}
      >
        <div className="flex items-start justify-between gap-4 px-6 pt-6 pb-4">
          <div className="min-w-0">
            <h2
              id="dialog-title"
              className="text-lg font-semibold tracking-tight"
            >
              {title}
            </h2>
            {description && (
              <p className="mt-1 text-xs text-[var(--muted)]">{description}</p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar"
            className="shrink-0 rounded-full p-1.5 text-[var(--muted)] hover:text-foreground hover:bg-[var(--surface-2)] transition-colors outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
          >
            <X size={18} />
          </button>
        </div>
        <div className="px-6 pb-6">{children}</div>
        {footer && (
          <div className="border-t border-[var(--border)] px-6 py-4 bg-[var(--surface-2)]/40 rounded-b-2xl">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
