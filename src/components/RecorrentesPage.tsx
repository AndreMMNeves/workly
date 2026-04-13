"use client";

import { useState } from "react";
import {
  Plus,
  RefreshCw,
  Trash2,
  Repeat,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
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
import Button from "./ui/Button";
import Dialog from "./ui/Dialog";
import EmptyState from "./ui/EmptyState";
import { FieldWrap, Input, Select } from "./ui/Field";
import MoneyInput, { parseBRL } from "./ui/MoneyInput";
import PageHeader from "./ui/PageHeader";

export default function RecorrentesPage() {
  const toast = useToast();
  const accounts = useAccounts();
  const recurring = useRecurring();
  const [creating, setCreating] = useState(false);
  const [running, setRunning] = useState(false);

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
    setRunning(true);
    try {
      await materializeRecurring();
      toast.success("Recorrências processadas");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro");
    } finally {
      setRunning(false);
    }
  }

  return (
    <>
      <PageHeader
        title="Recorrentes"
        description="Assinaturas, salário, aluguel — lançamento automático."
        actions={
          <>
            <Button
              variant="secondary"
              onClick={runNow}
              loading={running}
              leftIcon={<RefreshCw size={16} />}
            >
              Rodar agora
            </Button>
            <Button
              onClick={() => setCreating(true)}
              leftIcon={<Plus size={16} strokeWidth={2.5} />}
            >
              Nova recorrência
            </Button>
          </>
        }
      />

      <section className="mt-6">
        {recurring.length === 0 ? (
          <EmptyState
            icon={<Repeat size={22} />}
            title="Nenhuma recorrência cadastrada"
            description="Cadastre lançamentos que se repetem — assinaturas, salário, contas fixas."
            action={
              <Button
                onClick={() => setCreating(true)}
                leftIcon={<Plus size={16} strokeWidth={2.5} />}
              >
                Nova recorrência
              </Button>
            }
          />
        ) : (
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] overflow-hidden">
            <ul className="divide-y divide-[var(--border)]">
              {recurring.map((r) => {
                const acc = accMap.get(r.accountId);
                const negative = r.amount < 0;
                return (
                  <li
                    key={r.id}
                    className="group flex items-center gap-4 px-4 py-3 hover:bg-[var(--surface-2)]/40 transition-colors"
                  >
                    <span
                      className="h-10 w-10 shrink-0 rounded-xl grid place-items-center text-xs font-bold shadow-sm"
                      style={{
                        background: acc?.color ?? "#334",
                        color: "#fff",
                      }}
                    >
                      {acc?.name.slice(0, 2).toUpperCase()}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <div className="truncate font-medium text-sm">
                          {r.description || r.category}
                        </div>
                        {!r.active && (
                          <span className="text-[10px] uppercase tracking-wider text-[var(--muted)] bg-[var(--surface-2)] px-1.5 py-0.5 rounded">
                            Pausada
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-[var(--muted)] truncate mt-0.5">
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
                      className={`text-sm font-semibold tabular-nums whitespace-nowrap ${
                        negative
                          ? "text-[var(--danger)]"
                          : "text-[var(--accent)]"
                      }`}
                    >
                      {negative ? "−" : "+"}
                      {brl(Math.abs(r.amount))}
                    </div>
                    <button
                      onClick={() => toggleActive(r)}
                      className={`text-[10px] uppercase tracking-wider font-semibold rounded-full px-2.5 py-1 border transition-colors ${
                        r.active
                          ? "border-[var(--accent)]/40 text-[var(--accent)] bg-[var(--accent)]/10 hover:bg-[var(--accent)]/20"
                          : "border-[var(--border)] text-[var(--muted)] hover:text-foreground hover:border-[var(--border-strong)]"
                      }`}
                    >
                      {r.active ? "Ativa" : "Pausada"}
                    </button>
                    <button
                      onClick={() => remove(r)}
                      aria-label="Excluir"
                      className="opacity-0 group-hover:opacity-100 transition-opacity rounded-lg p-1.5 text-[var(--muted)] hover:text-[var(--danger)] hover:bg-[var(--danger)]/10 outline-none focus-visible:ring-2 focus-visible:ring-[var(--danger)]"
                    >
                      <Trash2 size={14} />
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </section>

      <RecurringForm
        open={creating}
        accounts={accounts}
        onClose={() => setCreating(false)}
      />
    </>
  );
}

function RecurringForm({
  open,
  accounts,
  onClose,
}: {
  open: boolean;
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
  const [touched, setTouched] = useState(false);

  const amountValue = parseBRL(form.amount);
  const amountInvalid = touched && amountValue <= 0;
  const descInvalid = touched && !form.description;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setTouched(true);
    if (amountValue <= 0 || !form.accountId || !form.description) return;
    setSaving(true);
    try {
      await addRecurring({
        accountId: form.accountId,
        description: form.description,
        merchant: form.merchant || undefined,
        category: form.category,
        amount:
          form.type === "expense"
            ? -Math.abs(amountValue)
            : Math.abs(amountValue),
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

  const isExpense = form.type === "expense";

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Nova recorrência"
      description="Cadastre um lançamento que se repete mensalmente ou semanalmente"
    >
      <form onSubmit={submit} className="space-y-4">
        <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-[var(--surface-2)] border border-[var(--border)]">
          <button
            type="button"
            onClick={() => setForm({ ...form, type: "expense" })}
            className={`flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-all ${
              isExpense
                ? "bg-[var(--danger)]/15 text-[var(--danger)] shadow-sm"
                : "text-[var(--muted)] hover:text-foreground"
            }`}
          >
            <TrendingDown size={16} />
            Despesa
          </button>
          <button
            type="button"
            onClick={() => setForm({ ...form, type: "income" })}
            className={`flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-all ${
              !isExpense
                ? "bg-[var(--accent)]/15 text-[var(--accent)] shadow-sm"
                : "text-[var(--muted)] hover:text-foreground"
            }`}
          >
            <TrendingUp size={16} />
            Receita
          </button>
        </div>

        <FieldWrap
          label="Valor"
          required
          error={amountInvalid ? "Informe um valor válido" : undefined}
        >
          <MoneyInput
            value={form.amount}
            onChange={(v) => setForm({ ...form, amount: v })}
            invalid={amountInvalid}
          />
        </FieldWrap>

        <FieldWrap
          label="Descrição"
          required
          error={descInvalid ? "Informe uma descrição" : undefined}
        >
          <Input
            value={form.description}
            onChange={(e) =>
              setForm({ ...form, description: e.target.value })
            }
            placeholder="Ex.: Netflix, Salário, Aluguel"
            invalid={descInvalid}
          />
        </FieldWrap>

        <div className="grid grid-cols-2 gap-3">
          <FieldWrap label="Conta">
            <Select
              value={form.accountId}
              onChange={(e) =>
                setForm({ ...form, accountId: e.target.value })
              }
            >
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </Select>
          </FieldWrap>
          <FieldWrap label="Categoria">
            <Select
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
            >
              {DEFAULT_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </Select>
          </FieldWrap>
          <FieldWrap label="Frequência">
            <Select
              value={form.frequency}
              onChange={(e) =>
                setForm({
                  ...form,
                  frequency: e.target.value as "monthly" | "weekly",
                })
              }
            >
              <option value="monthly">Mensal</option>
              <option value="weekly">Semanal</option>
            </Select>
          </FieldWrap>
          {form.frequency === "monthly" ? (
            <FieldWrap label="Dia do mês">
              <Input
                type="number"
                min={1}
                max={31}
                value={form.dayOfMonth}
                onChange={(e) =>
                  setForm({ ...form, dayOfMonth: e.target.value })
                }
              />
            </FieldWrap>
          ) : (
            <FieldWrap label="Início">
              <Input
                type="date"
                value={form.startDate}
                onChange={(e) =>
                  setForm({ ...form, startDate: e.target.value })
                }
              />
            </FieldWrap>
          )}
        </div>

        {form.frequency === "monthly" && (
          <FieldWrap label="Primeira ocorrência">
            <Input
              type="date"
              value={form.startDate}
              onChange={(e) =>
                setForm({ ...form, startDate: e.target.value })
              }
            />
          </FieldWrap>
        )}

        <FieldWrap label="Estabelecimento">
          <Input
            value={form.merchant}
            onChange={(e) => setForm({ ...form, merchant: e.target.value })}
            placeholder="Opcional"
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
            {saving ? "Salvando..." : "Criar"}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
