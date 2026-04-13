"use client";

import { useEffect, useState } from "react";
import {
  DEFAULT_CATEGORIES,
  addTransaction,
  updateTransaction,
  type Account,
  type Transaction,
} from "@/lib/data";
import { useToast } from "@/lib/toast";

type Props = {
  accounts: Account[];
  edit?: Transaction;
  onClose?: () => void;
  trigger?: "button" | "external";
  open?: boolean;
};

export default function AddTransactionDialog({
  accounts,
  edit,
  onClose,
  trigger = "button",
  open: openProp,
}: Props) {
  const toast = useToast();
  const [openState, setOpenState] = useState(false);
  const open = trigger === "external" ? !!openProp : openState;

  const blank = () => ({
    accountId: edit?.accountId ?? accounts[0]?.id ?? "",
    date: edit?.date ?? new Date().toISOString().slice(0, 10),
    description: edit?.description ?? "",
    merchant: edit?.merchant ?? "",
    category: edit?.category ?? DEFAULT_CATEGORIES[0],
    amount: edit ? String(Math.abs(edit.amount)).replace(".", ",") : "",
    type: (edit && edit.amount < 0 ? "expense" : "income") as "expense" | "income",
  });
  const [form, setForm] = useState(blank);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) setForm(blank());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, edit?.id]);

  function close() {
    if (trigger === "external") onClose?.();
    else setOpenState(false);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const n = Number(form.amount.replace(",", "."));
    if (!n || !form.accountId) return;
    const payload = {
      accountId: form.accountId,
      date: form.date,
      description: form.description,
      merchant: form.merchant || undefined,
      category: form.category,
      amount: form.type === "expense" ? -Math.abs(n) : Math.abs(n),
    };
    setSaving(true);
    try {
      if (edit?.id) {
        await updateTransaction(edit.id, payload);
        toast.success("Transação atualizada");
      } else {
        await addTransaction(payload);
        toast.success("Transação adicionada");
      }
      close();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao salvar");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      {trigger === "button" && (
        <button
          onClick={() => setOpenState(true)}
          className="rounded-full bg-[var(--accent)] px-4 py-2 text-sm font-medium text-[var(--background)] hover:bg-[var(--accent-strong)]"
        >
          + Nova transação
        </button>
      )}
      {open && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4">
          <form
            onSubmit={submit}
            className="w-full max-w-md rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6"
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold">
                {edit ? "Editar transação" : "Nova transação"}
              </h2>
              <button
                type="button"
                onClick={close}
                className="text-[var(--muted)] hover:text-foreground"
              >
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
                <span className="text-[var(--muted)] text-xs">Data</span>
                <input
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
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
                  placeholder="Ex.: Mercado Extra, iFood, Uber"
                  className="rounded-lg bg-[var(--surface-2)] border border-[var(--border)] px-3 py-2"
                />
              </label>
              <label className="col-span-2 flex flex-col gap-1">
                <span className="text-[var(--muted)] text-xs">Descrição</span>
                <input
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Ex.: Compras da semana"
                  className="rounded-lg bg-[var(--surface-2)] border border-[var(--border)] px-3 py-2"
                />
              </label>
            </div>
            <button
              type="submit"
              disabled={saving}
              className="mt-5 w-full rounded-full bg-[var(--accent)] py-2.5 text-sm font-medium text-[var(--background)] hover:bg-[var(--accent-strong)] disabled:opacity-60"
            >
              {saving ? "Salvando..." : "Salvar"}
            </button>
          </form>
        </div>
      )}
    </>
  );
}
