"use client";

import type { ReactNode } from "react";

type Props = {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
};

export default function EmptyState({
  icon,
  title,
  description,
  action,
  className = "",
}: Props) {
  return (
    <div
      className={`rounded-2xl border border-dashed border-[var(--border)] bg-[var(--surface)]/40 p-10 text-center ${className}`}
    >
      {icon && (
        <div className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-full bg-[var(--surface-2)] text-[var(--muted)]">
          {icon}
        </div>
      )}
      <div className="text-sm font-medium text-foreground">{title}</div>
      {description && (
        <div className="mt-1 text-xs text-[var(--muted)]">{description}</div>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
