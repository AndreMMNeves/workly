"use client";

import { brl, shortDate } from "@/lib/format";
import type { Account, Transaction } from "@/lib/data";
import { useHideValues } from "@/lib/hideValues";

export default function RecentTransactions({
  items,
  accounts,
}: {
  items: Transaction[];
  accounts: Account[];
}) {
  const accMap = new Map(accounts.map((a) => [a.id, a]));
  const { mask } = useHideValues();
  if (items.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-[var(--border)] p-8 text-center text-sm text-[var(--muted)]">
        Sem transações ainda. Clique em Nova transação pra começar.
      </div>
    );
  }
  return (
    <ul className="divide-y divide-[var(--border)]">
      {items.map((t) => {
        const acc = accMap.get(t.accountId);
        const negative = t.amount < 0;
        return (
          <li
            key={t.id}
            className="flex items-center justify-between gap-3 py-3"
          >
            <div className="flex items-center gap-3 min-w-0">
              <span
                className="h-9 w-9 shrink-0 rounded-xl grid place-items-center text-[11px] font-bold shadow-sm"
                style={{ background: acc?.color ?? "#334", color: "#fff" }}
              >
                {acc?.name.slice(0, 2).toUpperCase()}
              </span>
              <div className="min-w-0">
                <div className="truncate text-sm font-medium">
                  {t.merchant || t.description || t.category}
                </div>
                <div className="text-xs text-[var(--muted)] truncate">
                  {t.category} · {shortDate(t.date)}
                </div>
              </div>
            </div>
            <div
              className={`text-sm font-semibold tabular-nums whitespace-nowrap ${
                negative ? "text-[var(--danger)]" : "text-[var(--accent)]"
              }`}
            >
              {negative ? "−" : "+"}
              {mask(brl(Math.abs(t.amount)))}
            </div>
          </li>
        );
      })}
    </ul>
  );
}

RecentTransactions.displayName = "RecentTransactions";
