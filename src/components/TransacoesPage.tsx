"use client";

import { useMemo, useState } from "react";
import { Pencil, Search, Trash2, X } from "lucide-react";
import {
  DEFAULT_CATEGORIES,
  deleteTransaction,
  useAccounts,
  useTransactions,
  type Transaction,
} from "@/lib/data";
import { brl, shortDate } from "@/lib/format";
import AddTransactionDialog from "./AddTransactionDialog";
import EmptyState from "./ui/EmptyState";
import { Input, Select } from "./ui/Field";
import PageHeader from "./ui/PageHeader";

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
      if (filters.accountId !== "all" && t.accountId !== filters.accountId)
        return false;
      if (filters.category !== "all" && t.category !== filters.category)
        return false;
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
    if (!confirm("Excluir esta transação?")) return;
    await deleteTransaction(t.id);
  }

  const hasActiveFilters = JSON.stringify(filters) !== JSON.stringify(EMPTY_FILTERS);

  return (
    <>
      <PageHeader
        title="Transações"
        description={`${filtered.length} de ${transactions.length} · líquido ${brl(totals.net)}`}
        actions={<AddTransactionDialog accounts={accounts} />}
      />

      <section className="mt-6 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4">
        <div className="grid grid-cols-2 md:grid-cols-6 gap-3 text-sm">
          <Input
            placeholder="Buscar..."
            value={filters.q}
            onChange={(e) => setFilters({ ...filters, q: e.target.value })}
            leftAddon={<Search size={14} />}
            className="md:col-span-2"
          />
          <Select
            value={filters.accountId}
            onChange={(e) =>
              setFilters({ ...filters, accountId: e.target.value })
            }
          >
            <option value="all">Todas contas</option>
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </Select>
          <Select
            value={filters.category}
            onChange={(e) =>
              setFilters({ ...filters, category: e.target.value })
            }
          >
            <option value="all">Todas categorias</option>
            {DEFAULT_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </Select>
          <Select
            value={filters.type}
            onChange={(e) =>
              setFilters({ ...filters, type: e.target.value as Filters["type"] })
            }
          >
            <option value="all">Todos tipos</option>
            <option value="income">Receitas</option>
            <option value="expense">Despesas</option>
          </Select>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <label className="flex items-center gap-2 text-xs text-[var(--muted)]">
            De
            <Input
              type="date"
              value={filters.from}
              onChange={(e) => setFilters({ ...filters, from: e.target.value })}
              className="!py-1.5 !text-xs w-auto"
            />
          </label>
          <label className="flex items-center gap-2 text-xs text-[var(--muted)]">
            Até
            <Input
              type="date"
              value={filters.to}
              onChange={(e) => setFilters({ ...filters, to: e.target.value })}
              className="!py-1.5 !text-xs w-auto"
            />
          </label>
          {hasActiveFilters && (
            <button
              onClick={() => setFilters(EMPTY_FILTERS)}
              className="ml-auto flex items-center gap-1 text-xs text-[var(--muted)] hover:text-foreground transition-colors"
            >
              <X size={12} />
              Limpar filtros
            </button>
          )}
        </div>
      </section>

      <section className="mt-4">
        {filtered.length === 0 ? (
          <EmptyState
            icon={<Search size={22} />}
            title="Nenhuma transação encontrada"
            description={
              hasActiveFilters
                ? "Tente ajustar os filtros acima."
                : "Clique em Nova transação pra começar."
            }
          />
        ) : (
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-[var(--surface-2)] text-[10px] uppercase tracking-wider text-[var(--muted)] font-semibold">
                <tr>
                  <th className="text-left px-4 py-3">Data</th>
                  <th className="text-left px-4 py-3">Descrição</th>
                  <th className="text-left px-4 py-3 hidden md:table-cell">
                    Categoria
                  </th>
                  <th className="text-left px-4 py-3 hidden md:table-cell">
                    Conta
                  </th>
                  <th className="text-right px-4 py-3">Valor</th>
                  <th className="px-2 py-3 w-px" />
                </tr>
              </thead>
              <tbody>
                {filtered.map((t) => {
                  const acc = accMap.get(t.accountId);
                  const negative = t.amount < 0;
                  return (
                    <tr
                      key={t.id}
                      className="group border-t border-[var(--border)] hover:bg-[var(--surface-2)]/50 transition-colors"
                    >
                      <td className="px-4 py-3 whitespace-nowrap text-[var(--muted)] text-xs">
                        {shortDate(t.date)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium">
                          {t.merchant || t.description || t.category}
                        </div>
                        {t.merchant && t.description && (
                          <div className="text-xs text-[var(--muted)]">
                            {t.description}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell text-[var(--muted)] text-xs">
                        {t.category}
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        <span className="inline-flex items-center gap-2 text-xs">
                          <span
                            className="h-2 w-2 rounded-full"
                            style={{ background: acc?.color }}
                          />
                          {acc?.name}
                        </span>
                      </td>
                      <td
                        className={`px-4 py-3 text-right font-semibold tabular-nums whitespace-nowrap ${
                          negative
                            ? "text-[var(--danger)]"
                            : "text-[var(--accent)]"
                        }`}
                      >
                        {negative ? "−" : "+"}
                        {brl(Math.abs(t.amount))}
                      </td>
                      <td className="px-2 py-3 whitespace-nowrap">
                        <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => setEditing(t)}
                            aria-label="Editar"
                            className="rounded-lg p-1.5 text-[var(--muted)] hover:text-[var(--accent)] hover:bg-[var(--accent)]/10 transition-colors"
                          >
                            <Pencil size={14} />
                          </button>
                          <button
                            onClick={() => remove(t)}
                            aria-label="Excluir"
                            className="rounded-lg p-1.5 text-[var(--muted)] hover:text-[var(--danger)] hover:bg-[var(--danger)]/10 transition-colors"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot className="bg-[var(--surface-2)] text-xs">
                <tr>
                  <td
                    colSpan={4}
                    className="px-4 py-3 text-[var(--muted)] uppercase tracking-wider font-semibold text-[10px]"
                  >
                    Totais filtrados
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums">
                    <div className="text-[var(--accent)] font-semibold">
                      +{brl(totals.income)}
                    </div>
                    <div className="text-[var(--danger)] font-semibold">
                      {brl(totals.expense)}
                    </div>
                  </td>
                  <td />
                </tr>
              </tfoot>
            </table>
          </div>
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
