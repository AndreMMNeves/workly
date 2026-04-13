"use client";

import { useState } from "react";
import { Plus, Pencil, Trash2, Wallet } from "lucide-react";
import {
  addAccount,
  deleteAccount,
  updateAccount,
  useAccounts,
  useBalances,
  useTransactions,
  type Account,
} from "@/lib/data";
import { brl } from "@/lib/format";
import { useHideValues } from "@/lib/hideValues";
import { useToast } from "@/lib/toast";
import AccountCard from "./AccountCard";
import HideValuesToggle from "./HideValuesToggle";
import Button from "./ui/Button";
import Dialog from "./ui/Dialog";
import EmptyState from "./ui/EmptyState";
import { FieldWrap, Input } from "./ui/Field";
import MoneyInput, { parseBRL } from "./ui/MoneyInput";
import PageHeader from "./ui/PageHeader";

const PALETTE = [
  "#34e3b0",
  "#8a2be2",
  "#0072c6",
  "#f5a524",
  "#ef6b6b",
  "#f06292",
  "#26c6da",
  "#9ccc65",
];

export default function ContasPage() {
  const accounts = useAccounts();
  const transactions = useTransactions();
  const balances = useBalances(accounts, transactions);
  const { mask } = useHideValues();
  const [editing, setEditing] = useState<Account | null>(null);
  const [creating, setCreating] = useState(false);

  async function remove(a: Account) {
    if (
      !confirm(
        `Excluir a conta ${a.name}? Transações relacionadas serão removidas.`,
      )
    )
      return;
    await deleteAccount(a.id);
  }

  return (
    <>
      <PageHeader
        title="Contas"
        description="Gerencie cartões e contas que você acompanha."
        actions={
          <>
            <HideValuesToggle />
            <Button
              onClick={() => setCreating(true)}
              leftIcon={<Plus size={16} strokeWidth={2.5} />}
            >
              Nova conta
            </Button>
          </>
        }
      />

      {accounts.length === 0 ? (
        <div className="mt-6">
          <EmptyState
            icon={<Wallet size={22} />}
            title="Nenhuma conta cadastrada"
            description="Adicione sua primeira conta pra começar a registrar transações."
            action={
              <Button
                onClick={() => setCreating(true)}
                leftIcon={<Plus size={16} strokeWidth={2.5} />}
              >
                Criar conta
              </Button>
            }
          />
        </div>
      ) : (
        <section className="mt-6 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {accounts.map((a) => {
            const bal = balances.get(a.id) ?? 0;
            const count = transactions.filter(
              (t) => t.accountId === a.id,
            ).length;
            return (
              <div key={a.id} className="flex flex-col gap-2">
                <AccountCard account={a} balance={bal} />
                <div className="flex items-center justify-between rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-2.5 text-xs">
                  <span className="text-[var(--muted)]">
                    {count} transações
                  </span>
                  <span className="text-[var(--muted)]">
                    Inicial:{" "}
                    <span className="text-foreground">
                      {mask(brl(a.openingBalance))}
                    </span>
                  </span>
                  <div className="flex gap-1">
                    <button
                      onClick={() => setEditing(a)}
                      aria-label="Editar"
                      className="rounded-lg p-1.5 text-[var(--muted)] hover:text-[var(--accent)] hover:bg-[var(--accent)]/10 transition-colors outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      onClick={() => remove(a)}
                      aria-label="Excluir"
                      className="rounded-lg p-1.5 text-[var(--muted)] hover:text-[var(--danger)] hover:bg-[var(--danger)]/10 transition-colors outline-none focus-visible:ring-2 focus-visible:ring-[var(--danger)]"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </section>
      )}

      <AccountForm
        open={creating || !!editing}
        account={editing ?? undefined}
        onClose={() => {
          setCreating(false);
          setEditing(null);
        }}
      />
    </>
  );
}

function AccountForm({
  open,
  account,
  onClose,
}: {
  open: boolean;
  account?: Account;
  onClose: () => void;
}) {
  const toast = useToast();
  const [form, setForm] = useState({
    name: account?.name ?? "",
    color: account?.color ?? PALETTE[0],
    openingBalance: account
      ? Math.abs(account.openingBalance)
          .toLocaleString("pt-BR", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })
      : "",
  });
  const [saving, setSaving] = useState(false);
  const [touched, setTouched] = useState(false);

  const nameInvalid = touched && !form.name.trim();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setTouched(true);
    if (!form.name.trim()) return;
    const opening = parseBRL(form.openingBalance);
    setSaving(true);
    try {
      if (account) {
        await updateAccount(account.id, {
          name: form.name,
          color: form.color,
          openingBalance: opening,
        });
      } else {
        await addAccount({
          name: form.name,
          kind: "custom",
          color: form.color,
          openingBalance: opening,
        });
      }
      toast.success("Conta salva");
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
      title={account ? "Editar conta" : "Nova conta"}
      description={
        account
          ? "Atualize os dados da sua conta"
          : "Adicione uma nova conta ou cartão"
      }
    >
      <form onSubmit={submit} className="space-y-4">
        <FieldWrap
          label="Nome"
          required
          error={nameInvalid ? "Informe um nome" : undefined}
        >
          <Input
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="Ex.: Nubank, Itaú, Carteira"
            invalid={nameInvalid}
            autoFocus
          />
        </FieldWrap>
        <FieldWrap label="Saldo inicial">
          <MoneyInput
            value={form.openingBalance}
            onChange={(v) => setForm({ ...form, openingBalance: v })}
          />
        </FieldWrap>
        <div>
          <div className="text-[11px] font-medium uppercase tracking-wider text-[var(--muted)] mb-2">
            Cor
          </div>
          <div className="flex flex-wrap gap-2">
            {PALETTE.map((c) => (
              <button
                type="button"
                key={c}
                onClick={() => setForm({ ...form, color: c })}
                aria-label={`Selecionar cor ${c}`}
                className={`relative h-9 w-9 rounded-xl transition-all outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--surface)] focus-visible:ring-[var(--accent)] ${
                  form.color === c
                    ? "scale-110 shadow-lg ring-2 ring-offset-2 ring-offset-[var(--surface)] ring-foreground"
                    : "hover:scale-105"
                }`}
                style={{ background: c }}
              />
            ))}
          </div>
        </div>
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
