"use client";

import { useState } from "react";
import {
  DEFAULT_CATEGORIES,
  addRecurring,
  deleteRecurring,
  materializeRecurring,
  updateRecurring,
  useAccounts,
  useRecurring,
  type RecurringTransaction,
} from "@/lib/data";
import { brl, shortDate } from "@/lib/format";
import { useToast } from "@/lib/toast";

export default function RecorrentesPage() {
  const toast = useToast();
  const accounts = useAccounts();
  const recurring = useRecurring();
  const [creating, setCreating] = useState(false);

  const accMap = new Map(accounts.map((a) => [a.id, a]));

  async function remove(r: RecurringTransaction) {
    if (!confirm(`Excluir a recorrência "${r.description}"?`)) return;
    try {
      await deleteRecurring(r.id);
      toast.success("Recorrência excluída");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro");
    }
  }

  async function toggleActive(r: RecurringTransaction) {
    try {
      await updateRecurring(r.id, { active: !r.active });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro");
    }
  }

  async function runNow() {
    try {
      await materializeRecurring();
      toast.success("Recorrências processadas");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro");
    }
  }

  return (
    <>
      <header className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Recorrentes</h1>
          <p className="text-sm text-[var(--muted)]">
            Assinaturas, salário, aluguel — lança automático.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={runNow}
            className="rounded-full border border-[var(--border)] bg-[var(--surface)] px-4 py-2 text-sm hover:bg-[var(--surface-2)]"
          >
            ⟳ Rodar agora
          </button>
          <button
            onClick={() => setCreating(true)}
            className="rounded-full bg-[var(--accent)] px-4 py-2 text-sm font-medium text-[var(--background)] hover:bg-[var(--accent-strong)]"
          >
            + Nova recorrência
          </button>
        </div>
      </header>

      <section className="mt-6 rounded-2xl border border-[var(--border)] bg-[var(--surface)] overflow-hidden">
        {recurring.length === 0 ? (
          <div className="p-8 text-center text-sm text-[var(--muted)]">
            Nenhuma recorrência cadastrada.
          </div>
        ) : (
          <ul className="divide-y divide-[var(--border)]">
            {recurring.map((r) => {
              const acc = accMap.get(r.accountId);
              const negative = r.amount < 0;
              return (
                <li key={r.id} className="flex items-center gap-4 px-4 py-3">
                  <span
                    className="h-9 w-9 rounded-full grid place-items-center text-xs font-semibold"
                    style={{ background: acc?.color ?? "#334", color: "#fff" }}
                  >
                    {acc?.name.slice(0, 2).toUpperCase()}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="truncate font-medium text-sm">
                      {r.description || r.category}
                    </div>
                    <div className="text-xs text-[var(--muted)]">
                      {acc?.name} · {r.category} ·{" "}
                      {r.frequency === "monthly"
                        ? `todo dia ${r.dayOfMonth ?? "—"}`
                        : "semanal"}
                      {r.lastGeneratedDate
                        ? ` · último: ${shortDate(r.lastGeneratedDate)}`
                        : ""}
                    </div>
                  </div>
                  <div
                    className={`text-sm font-semibold ${
                      negative ? "text-[var(--danger)]" : "text-[var(--accent)]"
                    }`}
                  >
                    {negative ? "-" : "+"}
                    {brl(Math.abs(r.amount))}
                  </div>
                  <button
                    onClick={() => toggleActive(r)}
                    className={`text-xs rounded-full px-2 py-1 border ${
                      r.active
                        ? "border-[var(--accent)] text-[var(--accent)]"
                        : "border-[var(--border)] text-[var(--muted)]"
                    }`}
                  >
                    {r.active ? "Ativa" : "Pausada"}
                  </button>
                  <button
                    onClick={() => remove(r)}
                    className="text-xs text-[var(--danger)] hover:underline"
                  >
                    Excluir
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {creating && (
        <RecurringForm accounts={accounts} onClose={() => setCreating(false)} />
      )}
    </>
  );
}

function RecurringForm({
  accounts,
  onClose,
}: {
  accounts: ReturnType<typeof useAccounts>;
  onClose: () => void;
}) {
  const toast = useToast();
  const [form, setForm] = useState({
    accountId: accounts[0]?.id ?? "",
    description: "",
    merchant: "",
    category: DEFAULT_CATEGORIES[0],
    amount: "",
    type: "expense" as "expense" | "income",
    frequency: "monthly" as "monthly" | "weekly",
    dayOfMonth: String(new Date().getDate()),
    startDate: new Date().toISOString().slice(0, 10),
  });
  const [saving, setSaving] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const n = Number(form.amount.replace(",", "."));
    if (!n || !form.accountId) return;
    setSaving(true);
    try {
      await addRecurring({
        accountId: form.accountId,
        description: form.description,
        merchant: form.merchant || undefined,
        category: form.category,
        amount: form.type === "expense" ? -Math.abs(n) : Math.abs(n),
        frequency: form.frequency,
        dayOfMonth:
          form.frequency === "monthly" ? Number(form.dayOfMonth) : undefined,
        startDate: form.startDate,
      });
      toast.success("Recorrência criada");
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
        className="w-full max-w-md rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6"
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Nova recorrência</h2>
          <button type="button" onClick={onClose} className="text-[var(--muted)]">
            ✕
          </button>
        </div>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <label className="col-span-2 flex flex-col gap-1">
            <span className="text-[var(--muted)] text-xs">Conta</span>
            <select
              value={form.accountId}
              onChange={(e) => setForm({ ...form, accountId: e.target.value })}
              className="rounded-lg bg-[var(--surface-2)] border border-[var(--border)] px-3 py-2"
            >
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-[var(--muted)] text-xs">Tipo</span>
            <select
              value={form.type}
              onChange={(e) =>
                setForm({ ...form, type: e.target.value as "expense" | "income" })
              }
              className="rounded-lg bg-[var(--surface-2)] border border-[var(--border)] px-3 py-2"
            >
              <option value="expense">Despesa</option>
              <option value="income">Receita</option>
            </select>
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-[var(--muted)] text-xs">Valor (R$)</span>
            <input
              inputMode="decimal"
              value={form.amount}
              onChange={(e) => setForm({ ...form, amount: e.target.value })}
              placeholder="0,00"
              className="rounded-lg bg-[var(--surface-2)] border border-[var(--border)] px-3 py-2"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-[var(--muted)] text-xs">Frequência</span>
            <select
              value={form.frequency}
              onChange={(e) =>
                setForm({
                  ...form,
                  frequency: e.target.value as "monthly" | "weekly",
                })
              }
              className="rounded-lg bg-[var(--surface-2)] border border-[var(--border)] px-3 py-2"
            >
              <option value="monthly">Mensal</option>
              <option value="weekly">Semanal</option>
            </select>
          </label>
          {form.frequency === "monthly" && (
            <label className="flex flex-col gap-1">
              <span className="text-[var(--muted)] text-xs">Dia do mês</span>
              <input
                type="number"
                min={1}
                max={31}
                value={form.dayOfMonth}
                onChange={(e) => setForm({ ...form, dayOfMonth: e.target.value })}
                className="rounded-lg bg-[var(--surface-2)] border border-[var(--border)] px-3 py-2"
              />
            </label>
          )}
          <label className="flex flex-col gap-1">
            <span className="text-[var(--muted)] text-xs">Primeira ocorrência</span>
            <input
              type="date"
              value={form.startDate}
              onChange={(e) => setForm({ ...form, startDate: e.target.value })}
              className="rounded-lg bg-[var(--surface-2)] border border-[var(--border)] px-3 py-2"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-[var(--muted)] text-xs">Categoria</span>
            <select
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              className="rounded-lg bg-[var(--surface-2)] border border-[var(--border)] px-3 py-2"
            >
              {DEFAULT_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </label>
          <label className="col-span-2 flex flex-col gap-1">
            <span className="text-[var(--muted)] text-xs">Estabelecimento</span>
            <input
              value={form.merchant}
              onChange={(e) => setForm({ ...form, merchant: e.target.value })}
              placeholder="Ex.: Netflix, Academia"
              className="rounded-lg bg-[var(--surface-2)] border border-[var(--border)] px-3 py-2"
            />
          </label>
          <label className="col-span-2 flex flex-col gap-1">
            <span className="text-[var(--muted)] text-xs">Descrição</span>
            <input
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="rounded-lg bg-[var(--surface-2)] border border-[var(--border)] px-3 py-2"
              required
            />
          </label>
        </div>
        <button
          type="submit"
          disabled={saving}
          className="mt-5 w-full rounded-full bg-[var(--accent)] py-2.5 text-sm font-medium text-[var(--background)] hover:bg-[var(--accent-strong)] disabled:opacity-60"
        >
          {saving ? "Salvando..." : "Criar"}
        </button>
      </form>
    </div>
  );
}
