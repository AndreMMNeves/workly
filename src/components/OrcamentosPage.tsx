"use client";

import { useMemo, useState } from "react";
import { Plus, Target, Trash2 } from "lucide-react";
import {
  DEFAULT_CATEGORIES,
  deleteBudget,
  upsertBudget,
  useBudgets,
  useTransactions,
} from "@/lib/data";
import { brl, monthKey } from "@/lib/format";
import { useToast } from "@/lib/toast";
import Button from "./ui/Button";
import Dialog from "./ui/Dialog";
import EmptyState from "./ui/EmptyState";
import { FieldWrap, Select } from "./ui/Field";
import MoneyInput, { parseBRL } from "./ui/MoneyInput";
import PageHeader from "./ui/PageHeader";

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
      <PageHeader
        title="Orçamentos"
        description="Defina limites por categoria e acompanhe o progresso do mês."
        actions={
          <Button
            onClick={() => setCreating(true)}
            leftIcon={<Plus size={16} strokeWidth={2.5} />}
          >
            Novo orçamento
          </Button>
        }
      />

      {budgets.length > 0 && (
        <section className="mt-6 rounded-2xl border border-[var(--border)] bg-gradient-to-br from-[var(--surface)] to-[var(--surface-2)] p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="text-[11px] uppercase tracking-wider text-[var(--muted)] font-medium">
                Total do mês
              </div>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="text-3xl font-semibold tabular-nums">
                  {brl(totalSpent)}
                </span>
                <span className="text-sm text-[var(--muted)]">
                  / {brl(totalLimit)}
                </span>
              </div>
            </div>
            <div className="text-right text-xs text-[var(--muted)]">
              {totalLimit > 0 &&
                `${Math.round((totalSpent / totalLimit) * 100)}%`}
            </div>
          </div>
          <ProgressBar value={totalSpent} max={totalLimit} className="mt-4" />
        </section>
      )}

      <section className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
        {budgets.length === 0 ? (
          <div className="md:col-span-2">
            <EmptyState
              icon={<Target size={22} />}
              title="Nenhum orçamento ainda"
              description="Crie um orçamento por categoria pra começar a acompanhar seus limites."
              action={
                <Button
                  onClick={() => setCreating(true)}
                  leftIcon={<Plus size={16} strokeWidth={2.5} />}
                >
                  Criar orçamento
                </Button>
              }
            />
          </div>
        ) : (
          budgets.map((b) => {
            const spent = spentByCategory.get(b.category) ?? 0;
            const pct = b.monthlyLimit > 0 ? (spent / b.monthlyLimit) * 100 : 0;
            const over = pct > 100;
            return (
              <div
                key={b.id}
                className="group rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 hover:border-[var(--border-strong)] transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="font-semibold text-[15px]">
                      {b.category}
                    </div>
                    <div className="text-xs text-[var(--muted)] mt-0.5">
                      Limite mensal {brl(b.monthlyLimit)}
                    </div>
                  </div>
                  <button
                    onClick={() => remove(b.id)}
                    aria-label="Excluir"
                    className="opacity-0 group-hover:opacity-100 transition-opacity rounded-lg p-1.5 text-[var(--muted)] hover:text-[var(--danger)] hover:bg-[var(--danger)]/10 outline-none focus-visible:ring-2 focus-visible:ring-[var(--danger)]"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
                <div className="mt-4 flex items-baseline justify-between">
                  <div className="text-2xl font-semibold tabular-nums">
                    {brl(spent)}
                  </div>
                  <div
                    className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                      over
                        ? "text-[var(--danger)] bg-[var(--danger)]/15"
                        : pct > 80
                          ? "text-[var(--warning)] bg-[var(--warning)]/15"
                          : "text-[var(--accent)] bg-[var(--accent)]/15"
                    }`}
                  >
                    {pct.toFixed(0)}%
                  </div>
                </div>
                <ProgressBar
                  value={spent}
                  max={b.monthlyLimit}
                  className="mt-3"
                />
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

      <BudgetForm open={creating} onClose={() => setCreating(false)} />
    </>
  );
}

function ProgressBar({
  value,
  max,
  className = "",
}: {
  value: number;
  max: number;
  className?: string;
}) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  const over = max > 0 && value > max;
  const nearLimit = pct > 80 && !over;
  return (
    <div
      className={`h-2 rounded-full bg-[var(--surface-2)] overflow-hidden ${className}`}
    >
      <div
        className="h-full rounded-full transition-[width] duration-500 ease-out"
        style={{
          width: `${pct}%`,
          background: over
            ? "var(--danger)"
            : nearLimit
              ? "var(--warning)"
              : "var(--accent)",
        }}
      />
    </div>
  );
}

function BudgetForm({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const toast = useToast();
  const budgets = useBudgets();
  const existing = new Set(budgets.map((b) => b.category));
  const available = DEFAULT_CATEGORIES.filter((c) => !existing.has(c));
  const [category, setCategory] = useState(
    available[0] ?? DEFAULT_CATEGORIES[0],
  );
  const [limit, setLimit] = useState("");
  const [saving, setSaving] = useState(false);
  const [touched, setTouched] = useState(false);

  const limitValue = parseBRL(limit);
  const limitInvalid = touched && limitValue <= 0;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setTouched(true);
    if (limitValue <= 0) return;
    setSaving(true);
    try {
      await upsertBudget(category, limitValue);
      toast.success("Orçamento salvo");
      setLimit("");
      setTouched(false);
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao salvar");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Novo orçamento"
      description="Define um limite de gastos mensal para uma categoria"
      size="sm"
    >
      <form onSubmit={submit} className="space-y-4">
        <FieldWrap label="Categoria">
          <Select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            {DEFAULT_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </Select>
        </FieldWrap>
        <FieldWrap
          label="Limite mensal"
          required
          error={limitInvalid ? "Informe um valor válido" : undefined}
        >
          <MoneyInput
            value={limit}
            onChange={setLimit}
            invalid={limitInvalid}
            autoFocus
          />
        </FieldWrap>
        <div className="flex gap-2 pt-2">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            fullWidth
          >
            Cancelar
          </Button>
          <Button type="submit" loading={saving} fullWidth>
            {saving ? "Salvando..." : "Salvar"}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
