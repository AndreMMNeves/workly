"use client";

import { useMemo, useState } from "react";
import {
  DEFAULT_CATEGORIES,
  deleteBudget,
  upsertBudget,
  useBudgets,
  useTransactions,
} from "@/lib/data";
import { brl, monthKey } from "@/lib/format";
import { useToast } from "@/lib/toast";

export default function OrcamentosPage() {
  const toast = useToast();
  const budgets = useBudgets();
  const transactions = useTransactions();
  const [creating, setCreating] = useState(false);

  const currentMonth = monthKey(new Date().toISOString());

  const spentByCategory = useMemo(() => {
    const map = new Map<string, number>();
    for (const t of transactions) {
      if (t.amount >= 0) continue;
      if (monthKey(t.date) !== currentMonth) continue;
      map.set(t.category, (map.get(t.category) ?? 0) + -t.amount);
    }
    return map;
  }, [transactions, currentMonth]);

  const totalLimit = budgets.reduce((a, b) => a + b.monthlyLimit, 0);
  const totalSpent = budgets.reduce(
    (a, b) => a + (spentByCategory.get(b.category) ?? 0),
    0,
  );

  async function remove(id: string) {
    if (!confirm("Excluir este orçamento?")) return;
    try {
      await deleteBudget(id);
      toast.success("Orçamento excluído");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro");
    }
  }

  return (
    <>
      <header className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Orçamentos</h1>
          <p className="text-sm text-[var(--muted)]">
            Defina limites por categoria e acompanhe o progresso do mês.
          </p>
        </div>
        <button
          onClick={() => setCreating(true)}
          className="rounded-full bg-[var(--accent)] px-4 py-2 text-sm font-medium text-[var(--background)] hover:bg-[var(--accent-strong)]"
        >
          + Novo orçamento
        </button>
      </header>

      {budgets.length > 0 && (
        <section className="mt-6 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5">
          <div className="flex items-center justify-between text-sm">
            <span className="text-[var(--muted)]">Total do mês</span>
            <span>
              <span className="text-foreground font-semibold">{brl(totalSpent)}</span>{" "}
              <span className="text-[var(--muted)]">/ {brl(totalLimit)}</span>
            </span>
          </div>
          <ProgressBar value={totalSpent} max={totalLimit} />
        </section>
      )}

      <section className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
        {budgets.length === 0 ? (
          <div className="md:col-span-2 rounded-2xl border border-dashed border-[var(--border)] p-12 text-center text-sm text-[var(--muted)]">
            Nenhum orçamento ainda. Crie um pra começar.
          </div>
        ) : (
          budgets.map((b) => {
            const spent = spentByCategory.get(b.category) ?? 0;
            const pct = b.monthlyLimit > 0 ? (spent / b.monthlyLimit) * 100 : 0;
            const over = pct > 100;
            return (
              <div
                key={b.id}
                className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="font-semibold">{b.category}</div>
                    <div className="text-xs text-[var(--muted)]">
                      Limite mensal {brl(b.monthlyLimit)}
                    </div>
                  </div>
                  <button
                    onClick={() => remove(b.id)}
                    className="text-xs text-[var(--muted)] hover:text-[var(--danger)]"
                  >
                    Excluir
                  </button>
                </div>
                <div className="mt-4 flex items-baseline justify-between">
                  <div className="text-2xl font-semibold">{brl(spent)}</div>
                  <div
                    className={`text-xs font-medium ${
                      over ? "text-[var(--danger)]" : "text-[var(--muted)]"
                    }`}
                  >
                    {pct.toFixed(0)}%
                  </div>
                </div>
                <ProgressBar value={spent} max={b.monthlyLimit} />
                <div className="mt-2 text-xs text-[var(--muted)]">
                  {over
                    ? `Excedeu em ${brl(spent - b.monthlyLimit)}`
                    : `Resta ${brl(b.monthlyLimit - spent)}`}
                </div>
              </div>
            );
          })
        )}
      </section>

      {creating && <BudgetForm onClose={() => setCreating(false)} />}
    </>
  );
}

function ProgressBar({ value, max }: { value: number; max: number }) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  const over = max > 0 && value > max;
  return (
    <div className="mt-3 h-2 rounded-full bg-[var(--surface-2)] overflow-hidden">
      <div
        className="h-full transition-all"
        style={{
          width: `${pct}%`,
          background: over ? "var(--danger)" : "var(--accent)",
        }}
      />
    </div>
  );
}

function BudgetForm({ onClose }: { onClose: () => void }) {
  const toast = useToast();
  const budgets = useBudgets();
  const existing = new Set(budgets.map((b) => b.category));
  const available = DEFAULT_CATEGORIES.filter((c) => !existing.has(c));
  const [category, setCategory] = useState(available[0] ?? DEFAULT_CATEGORIES[0]);
  const [limit, setLimit] = useState("");
  const [saving, setSaving] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const n = Number(limit.replace(",", "."));
    if (!n) return;
    setSaving(true);
    try {
      await upsertBudget(category, n);
      toast.success("Orçamento salvo");
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao salvar");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4">
      <form
        onSubmit={submit}
        className="w-full max-w-sm rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6"
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Novo orçamento</h2>
          <button type="button" onClick={onClose} className="text-[var(--muted)]">
            ✕
          </button>
        </div>
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-[var(--muted)] text-xs">Categoria</span>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="rounded-lg bg-[var(--surface-2)] border border-[var(--border)] px-3 py-2"
          >
            {DEFAULT_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </label>
        <label className="mt-3 flex flex-col gap-1 text-sm">
          <span className="text-[var(--muted)] text-xs">Limite mensal (R$)</span>
          <input
            inputMode="decimal"
            value={limit}
            onChange={(e) => setLimit(e.target.value)}
            placeholder="0,00"
            className="rounded-lg bg-[var(--surface-2)] border border-[var(--border)] px-3 py-2"
            required
          />
        </label>
        <button
          type="submit"
          disabled={saving}
          className="mt-5 w-full rounded-full bg-[var(--accent)] py-2.5 text-sm font-medium text-[var(--background)] hover:bg-[var(--accent-strong)] disabled:opacity-60"
        >
          {saving ? "Salvando..." : "Salvar"}
        </button>
      </form>
    </div>
  );
}
