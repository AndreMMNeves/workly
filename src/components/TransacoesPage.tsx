"use client";

import { useMemo, useState } from "react";
import { db, DEFAULT_CATEGORIES, type Transaction } from "@/lib/db";
import { useAccounts, useTransactions } from "@/lib/hooks";
import { brl, shortDate } from "@/lib/format";
import AddTransactionDialog from "./AddTransactionDialog";

type Filters = {
  accountId: string;
  category: string;
  type: "all" | "income" | "expense";
  from: string;
  to: string;
  q: string;
};

const EMPTY_FILTERS: Filters = {
  accountId: "all",
  category: "all",
  type: "all",
  from: "",
  to: "",
  q: "",
};

export default function TransacoesPage() {
  const accounts = useAccounts();
  const transactions = useTransactions();
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
  const [editing, setEditing] = useState<Transaction | null>(null);

  const accMap = new Map(accounts.map((a) => [a.id, a]));

  const filtered = useMemo(() => {
    return transactions.filter((t) => {
      if (filters.accountId !== "all" && t.accountId !== filters.accountId) return false;
      if (filters.category !== "all" && t.category !== filters.category) return false;
      if (filters.type === "income" && t.amount <= 0) return false;
      if (filters.type === "expense" && t.amount >= 0) return false;
      if (filters.from && t.date < filters.from) return false;
      if (filters.to && t.date > filters.to) return false;
      if (filters.q) {
        const q = filters.q.toLowerCase();
        const hay = `${t.description} ${t.merchant ?? ""} ${t.category}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [transactions, filters]);

  const totals = useMemo(() => {
    let income = 0;
    let expense = 0;
    for (const t of filtered) {
      if (t.amount > 0) income += t.amount;
      else expense += t.amount;
    }
    return { income, expense, net: income + expense };
  }, [filtered]);

  async function remove(t: Transaction) {
    if (!t.id) return;
    if (!confirm("Excluir esta transação?")) return;
    await db.transactions.delete(t.id);
  }

  return (
    <>
      <header className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Transações</h1>
          <p className="text-sm text-[var(--muted)]">
            {filtered.length} de {transactions.length} · líquido {brl(totals.net)}
          </p>
        </div>
        <AddTransactionDialog accounts={accounts} />
      </header>

      <section className="mt-6 grid grid-cols-2 md:grid-cols-6 gap-3 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 text-sm">
        <input
          placeholder="Buscar..."
          value={filters.q}
          onChange={(e) => setFilters({ ...filters, q: e.target.value })}
          className="md:col-span-2 rounded-lg bg-[var(--surface-2)] border border-[var(--border)] px-3 py-2"
        />
        <select
          value={filters.accountId}
          onChange={(e) => setFilters({ ...filters, accountId: e.target.value })}
          className="rounded-lg bg-[var(--surface-2)] border border-[var(--border)] px-3 py-2"
        >
          <option value="all">Todas contas</option>
          {accounts.map((a) => (
            <option key={a.id} value={a.id}>{a.name}</option>
          ))}
        </select>
        <select
          value={filters.category}
          onChange={(e) => setFilters({ ...filters, category: e.target.value })}
          className="rounded-lg bg-[var(--surface-2)] border border-[var(--border)] px-3 py-2"
        >
          <option value="all">Todas categorias</option>
          {DEFAULT_CATEGORIES.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        <select
          value={filters.type}
          onChange={(e) => setFilters({ ...filters, type: e.target.value as Filters["type"] })}
          className="rounded-lg bg-[var(--surface-2)] border border-[var(--border)] px-3 py-2"
        >
          <option value="all">Tipo</option>
          <option value="income">Receitas</option>
          <option value="expense">Despesas</option>
        </select>
        <div className="md:col-span-6 flex flex-wrap gap-2">
          <label className="flex items-center gap-2 text-xs text-[var(--muted)]">
            De
            <input
              type="date"
              value={filters.from}
              onChange={(e) => setFilters({ ...filters, from: e.target.value })}
              className="rounded-lg bg-[var(--surface-2)] border border-[var(--border)] px-2 py-1"
            />
          </label>
          <label className="flex items-center gap-2 text-xs text-[var(--muted)]">
            Até
            <input
              type="date"
              value={filters.to}
              onChange={(e) => setFilters({ ...filters, to: e.target.value })}
              className="rounded-lg bg-[var(--surface-2)] border border-[var(--border)] px-2 py-1"
            />
          </label>
          <button
            onClick={() => setFilters(EMPTY_FILTERS)}
            className="ml-auto text-xs text-[var(--muted)] hover:text-foreground"
          >
            Limpar filtros
          </button>
        </div>
      </section>

      <section className="mt-4 rounded-2xl border border-[var(--border)] bg-[var(--surface)] overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-8 text-center text-sm text-[var(--muted)]">
            Nenhuma transação encontrada.
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-[var(--surface-2)] text-xs uppercase text-[var(--muted)]">
              <tr>
                <th className="text-left px-4 py-3">Data</th>
                <th className="text-left px-4 py-3">Estabelecimento / Descrição</th>
                <th className="text-left px-4 py-3 hidden md:table-cell">Categoria</th>
                <th className="text-left px-4 py-3 hidden md:table-cell">Conta</th>
                <th className="text-right px-4 py-3">Valor</th>
                <th className="px-2 py-3" />
              </tr>
            </thead>
            <tbody>
              {filtered.map((t) => {
                const acc = accMap.get(t.accountId);
                const negative = t.amount < 0;
                return (
                  <tr key={t.id} className="border-t border-[var(--border)] hover:bg-[var(--surface-2)]/50">
                    <td className="px-4 py-3 whitespace-nowrap text-[var(--muted)]">{shortDate(t.date)}</td>
                    <td className="px-4 py-3">
                      <div className="font-medium">{t.merchant || t.description || t.category}</div>
                      {t.merchant && t.description && (
                        <div className="text-xs text-[var(--muted)]">{t.description}</div>
                      )}
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell text-[var(--muted)]">{t.category}</td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <span className="inline-flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full" style={{ background: acc?.color }} />
                        {acc?.name}
                      </span>
                    </td>
                    <td className={`px-4 py-3 text-right font-semibold whitespace-nowrap ${negative ? "text-[var(--danger)]" : "text-[var(--accent)]"}`}>
                      {negative ? "-" : "+"}{brl(Math.abs(t.amount))}
                    </td>
                    <td className="px-2 py-3 text-right whitespace-nowrap">
                      <button onClick={() => setEditing(t)} className="text-xs text-[var(--accent)] hover:underline">Editar</button>
                      <button onClick={() => remove(t)} className="ml-2 text-xs text-[var(--danger)] hover:underline">Excluir</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot className="bg-[var(--surface-2)] text-xs">
              <tr>
                <td colSpan={4} className="px-4 py-3 text-[var(--muted)]">Totais filtrados</td>
                <td className="px-4 py-3 text-right">
                  <div className="text-[var(--accent)]">+{brl(totals.income)}</div>
                  <div className="text-[var(--danger)]">{brl(totals.expense)}</div>
                </td>
                <td />
              </tr>
            </tfoot>
          </table>
        )}
      </section>

      {editing && (
        <AddTransactionDialog
          accounts={accounts}
          edit={editing}
          trigger="external"
          open
          onClose={() => setEditing(null)}
        />
      )}
    </>
  );
}
