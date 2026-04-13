"use client";

import { forwardRef, type InputHTMLAttributes } from "react";

type Props = Omit<InputHTMLAttributes<HTMLInputElement>, "onChange" | "value"> & {
  value: string;
  onChange: (value: string) => void;
  invalid?: boolean;
};

function formatBRL(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (!digits) return "";
  const n = Number(digits) / 100;
  return n.toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function parseBRL(formatted: string): number {
  const digits = formatted.replace(/\D/g, "");
  if (!digits) return 0;
  return Number(digits) / 100;
}

const MoneyInput = forwardRef<HTMLInputElement, Props>(function MoneyInput(
  { value, onChange, invalid, className = "", ...rest },
  ref,
) {
  return (
    <div
      className={`flex items-center rounded-lg bg-[var(--surface-2)] border transition-colors focus-within:ring-2 focus-within:ring-[var(--accent)]/20 ${
        invalid
          ? "border-[var(--danger)]/60"
          : "border-[var(--border)] focus-within:border-[var(--accent)]/60"
      }`}
    >
      <span className="pl-3 text-sm text-[var(--muted)] select-none font-medium">
        R$
      </span>
      <input
        ref={ref}
        inputMode="decimal"
        value={value}
        onChange={(e) => onChange(formatBRL(e.target.value))}
        placeholder="0,00"
        className={`flex-1 bg-transparent px-3 py-2 text-sm outline-none placeholder:text-[var(--muted)]/60 tabular-nums ${className}`}
        {...rest}
      />
    </div>
  );
});

export default MoneyInput;
