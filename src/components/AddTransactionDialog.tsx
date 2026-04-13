"use client";

import { useEffect, useState } from "react";
import { Plus, TrendingDown, TrendingUp } from "lucide-react";
import {
  DEFAULT_CATEGORIES,
  addTransaction,
  updateTransaction,
  type Account,
  type Transaction,
} from "@/lib/data";
import { useToast } from "@/lib/toast";
import Button from "./ui/Button";
import Dialog from "./ui/Dialog";
import { FieldWrap, Input, Select } from "./ui/Field";
import MoneyInput, { parseBRL } from "./ui/MoneyInput";

type Props = {
  accounts: Account[];
  edit?: Transaction;
  onClose?: () => void;
  trigger?: "button" | "external";
  open?: boolean;
};

function toBRLString(n: number): string {
  return n.toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

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
    amount: edit ? toBRLString(Math.abs(edit.amount)) : "",
    type: (edit && edit.amount < 0 ? "expense" : "income") as
      | "expense"
      | "income",
  });
  const [form, setForm] = useState(blank);
  const [saving, setSaving] = useState(false);
  const [touched, setTouched] = useState(false);

  useEffect(() => {
    if (open) {
      setForm(blank());
      setTouched(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, edit?.id]);

  function close() {
    if (trigger === "external") onClose?.();
    else setOpenState(false);
  }

  const amountValue = parseBRL(form.amount);
  const amountInvalid = touched && amountValue <= 0;
  const accountInvalid = touched && !form.accountId;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setTouched(true);
    if (amountValue <= 0 || !form.accountId) return;
    const payload = {
      accountId: form.accountId,
      date: form.date,
      description: form.description,
      merchant: form.merchant || undefined,
      category: form.category,
      amount:
        form.type === "expense"
          ? -Math.abs(amountValue)
          : Math.abs(amountValue),
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

  const isExpense = form.type === "expense";

  return (
    <>
      {trigger === "button" && (
        <Button
          onClick={() => setOpenState(true)}
          leftIcon={<Plus size={16} strokeWidth={2.5} />}
        >
          Nova transação
        </Button>
      )}
      <Dialog
        open={open}
        onClose={close}
        title={edit ? "Editar transação" : "Nova transação"}
        description={
          edit
            ? "Atualize os detalhes da transação"
            : "Registre uma nova entrada ou saída"
        }
      >
        <form onSubmit={submit} className="space-y-4">
          {/* Type toggle */}
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

          {/* Amount — hero field */}
          <FieldWrap
            label="Valor"
            required
            error={amountInvalid ? "Informe um valor válido" : undefined}
          >
            <MoneyInput
              value={form.amount}
              onChange={(v) => setForm({ ...form, amount: v })}
              invalid={amountInvalid}
              autoFocus
            />
          </FieldWrap>

          <div className="grid grid-cols-2 gap-3">
            <FieldWrap
              label="Conta"
              required
              error={accountInvalid ? "Selecione uma conta" : undefined}
            >
              <Select
                value={form.accountId}
                onChange={(e) =>
                  setForm({ ...form, accountId: e.target.value })
                }
              >
                {accounts.length === 0 && <option value="">—</option>}
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
                onChange={(e) =>
                  setForm({ ...form, category: e.target.value })
                }
              >
                {DEFAULT_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </Select>
            </FieldWrap>
          </div>

          <FieldWrap label="Data">
            <Input
              type="date"
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
            />
          </FieldWrap>

          <FieldWrap label="Estabelecimento">
            <Input
              value={form.merchant}
              onChange={(e) => setForm({ ...form, merchant: e.target.value })}
              placeholder="Ex.: Mercado Extra, iFood, Uber"
            />
          </FieldWrap>

          <FieldWrap label="Descrição">
            <Input
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
              placeholder="Ex.: Compras da semana"
            />
          </FieldWrap>

          <div className="flex gap-2 pt-2">
            <Button
              type="button"
              variant="secondary"
              onClick={close}
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
    </>
  );
}
