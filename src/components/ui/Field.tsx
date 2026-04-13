"use client";

import {
  forwardRef,
  type InputHTMLAttributes,
  type SelectHTMLAttributes,
  type ReactNode,
} from "react";

const fieldBase =
  "w-full rounded-lg bg-[var(--surface-2)] border border-[var(--border)] px-3 py-2 text-sm text-foreground placeholder:text-[var(--muted)]/60 transition-colors outline-none focus:border-[var(--accent)]/60 focus:ring-2 focus:ring-[var(--accent)]/20 disabled:opacity-60 disabled:cursor-not-allowed";

type LabelProps = {
  label?: string;
  hint?: string;
  error?: string;
  required?: boolean;
  children: ReactNode;
  className?: string;
};

export function FieldWrap({
  label,
  hint,
  error,
  required,
  children,
  className = "",
}: LabelProps) {
  return (
    <label className={`flex flex-col gap-1.5 ${className}`}>
      {label && (
        <span className="text-[11px] font-medium uppercase tracking-wider text-[var(--muted)]">
          {label}
          {required && <span className="text-[var(--danger)] ml-0.5">*</span>}
        </span>
      )}
      {children}
      {error ? (
        <span className="text-[11px] text-[var(--danger)]">{error}</span>
      ) : hint ? (
        <span className="text-[11px] text-[var(--muted)]/80">{hint}</span>
      ) : null}
    </label>
  );
}

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  leftAddon?: ReactNode;
  rightAddon?: ReactNode;
  invalid?: boolean;
};

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { leftAddon, rightAddon, invalid, className = "", ...rest },
  ref,
) {
  if (leftAddon || rightAddon) {
    return (
      <div
        className={`flex items-center rounded-lg bg-[var(--surface-2)] border transition-colors focus-within:ring-2 focus-within:ring-[var(--accent)]/20 ${
          invalid
            ? "border-[var(--danger)]/60"
            : "border-[var(--border)] focus-within:border-[var(--accent)]/60"
        }`}
      >
        {leftAddon && (
          <span className="pl-3 text-[var(--muted)] text-sm select-none">
            {leftAddon}
          </span>
        )}
        <input
          ref={ref}
          className={`flex-1 bg-transparent px-3 py-2 text-sm outline-none placeholder:text-[var(--muted)]/60 ${className}`}
          {...rest}
        />
        {rightAddon && (
          <span className="pr-3 text-[var(--muted)] text-sm select-none">
            {rightAddon}
          </span>
        )}
      </div>
    );
  }
  return (
    <input
      ref={ref}
      className={`${fieldBase} ${invalid ? "border-[var(--danger)]/60 focus:border-[var(--danger)]/60 focus:ring-[var(--danger)]/20" : ""} ${className}`}
      {...rest}
    />
  );
});

type SelectProps = SelectHTMLAttributes<HTMLSelectElement>;

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  function Select({ className = "", children, ...rest }, ref) {
    return (
      <div className="relative">
        <select
          ref={ref}
          className={`${fieldBase} appearance-none pr-9 cursor-pointer ${className}`}
          {...rest}
        >
          {children}
        </select>
        <svg
          className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[var(--muted)]"
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </div>
    );
  },
);
