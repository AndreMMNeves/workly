"use client";

import { useMemo } from "react";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { brl, monthKey } from "@/lib/format";
import { useAccounts, useTransactions, useBalances } from "@/lib/data";
import { useHideValues } from "@/lib/hideValues";
import AccountCard from "./AccountCard";
import BalanceChart from "./BalanceChart";
import RecentTransactions from "./RecentTransactions";
import AddTransactionDialog from "./AddTransactionDialog";
import HideValuesToggle from "./HideValuesToggle";
import TransferDialog from "./TransferDialog";
import PageHeader from "./ui/PageHeader";

export default function Overview() {
  const accounts = useAccounts();
  const transactions = useTransactions();
  const balances = useBalances(accounts, transactions);
  const { mask } = useHideValues();

  const total = useMemo(
    () => Array.from(balances.values()).reduce((a, b) => a + b, 0),
    [balances],
  );

  const chartData = useMemo(() => {
    const byMonth = new Map<string, number>();
    for (const t of [...transactions].reverse()) {
      const k = monthKey(t.date);
      byMonth.set(k, (byMonth.get(k) ?? 0) + t.amount);
    }
    let running = 0;
    return Array.from(byMonth.entries()).map(([k, delta]) => {
      running += delta;
      const [y, m] = k.split("-");
      const label = new Date(Number(y), Number(m) - 1, 1).toLocaleDateString(
        "pt-BR",
        { month: "short" },
      );
      return { label, value: running };
    });
  }, [transactions]);

  const now = monthKey(new Date().toISOString());
  const monthExpense = useMemo(
    () =>
      transactions
        .filter((t) => monthKey(t.date) === now && t.amount < 0)
        .reduce((a, t) => a + t.amount, 0),
    [transactions, now],
  );
  const monthIncome = useMemo(
    () =>
      transactions
        .filter((t) => monthKey(t.date) === now && t.amount > 0)
        .reduce((a, t) => a + t.amount, 0),
    [transactions, now],
  );

  return (
    <>
      <PageHeader
        title="Overview"
        description="Suas contas e transações em um só lugar."
        actions={
          <>
            <HideValuesToggle />
            <TransferDialog accounts={accounts} />
            <AddTransactionDialog accounts={accounts} />
          </>
        }
      />

      <section className="mt-6 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {accounts.map((a) => (
          <AccountCard
            key={a.id}
            account={a}
            balance={balances.get(a.id) ?? 0}
          />
        ))}
      </section>

      <section className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6">
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div>
              <div className="text-[11px] uppercase tracking-wider text-[var(--muted)] font-medium">
                Saldo total
              </div>
              <div className="mt-1 text-3xl font-semibold tabular-nums">
                {mask(brl(total))}
              </div>
            </div>
            <div className="flex gap-3">
              <div className="rounded-xl bg-[var(--accent)]/10 border border-[var(--accent)]/20 px-3 py-2 min-w-[110px]">
                <div className="flex items-center gap-1 text-[10px] uppercase tracking-wider text-[var(--accent)] font-semibold">
                  <ArrowUpRight size={12} />
                  Entradas mês
                </div>
                <div className="mt-0.5 text-[var(--accent)] font-semibold text-sm tabular-nums">
                  {mask(brl(monthIncome))}
                </div>
              </div>
              <div className="rounded-xl bg-[var(--danger)]/10 border border-[var(--danger)]/20 px-3 py-2 min-w-[110px]">
                <div className="flex items-center gap-1 text-[10px] uppercase tracking-wider text-[var(--danger)] font-semibold">
                  <ArrowDownRight size={12} />
                  Saídas mês
                </div>
                <div className="mt-0.5 text-[var(--danger)] font-semibold text-sm tabular-nums">
                  {mask(brl(Math.abs(monthExpense)))}
                </div>
              </div>
            </div>
          </div>
          <div className="mt-6">
            {chartData.length > 0 ? (
              <BalanceChart data={chartData} />
            ) : (
              <div className="h-64 grid place-items-center rounded-xl border border-dashed border-[var(--border)] text-sm text-[var(--muted)]">
                Adicione transações pra ver o gráfico.
              </div>
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold">Transações recentes</h2>
            <span className="text-[10px] uppercase tracking-wider text-[var(--muted)] bg-[var(--surface-2)] px-2 py-0.5 rounded-full">
              {transactions.length} total
            </span>
          </div>
          <RecentTransactions
            items={transactions.slice(0, 8)}
            accounts={accounts}
          />
        </div>
      </section>
    </>
  );
}
