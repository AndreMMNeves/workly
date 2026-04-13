"use client";

import { useState } from "react";
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
import AccountCard from "./AccountCard";
import HideValuesToggle from "./HideValuesToggle";

const PALETTE = ["#34e3b0", "#8a2be2", "#0072c6", "#f5a524", "#ef6b6b", "#f06292", "#26c6da", "#9ccc65"];

export default function ContasPage() {
  const accounts = useAccounts();
  const transactions = useTransactions();
  const balances = useBalances(accounts, transactions);
  const { mask } = useHideValues();
  const [editing, setEditing] = useState<Account | null>(null);
  const [creating, setCreating] = useState(false);

  async function remove(a: Account) {
    if (!confirm(`Excluir a conta ${a.name}? Transações relacionadas serão removidas.`)) return;
    await deleteAccount(a.id);
  }

  return (
    <>
      <header className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Contas</h1>
          <p className="text-sm text-[var(--muted)]">
            Gerencie cartões e contas que você acompanha.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <HideValuesToggle />
          <button
            onClick={() => setCreating(true)}
            className="rounded-full bg-[var(--accent)] px-4 py-2 text-sm font-medium text-[var(--background)] hover:bg-[var(--accent-strong)]"
          >
            + Nova conta
          </button>
        </div>
      </header>

      <section className="mt-6 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {accounts.map((a) => {
          const bal = balances.get(a.id) ?? 0;
          const count = transactions.filter((t) => t.accountId === a.id).length;
          return (
            <div key={a.id} className="flex flex-col gap-3">
              <AccountCard account={a} balance={bal} />
              <div className="flex items-center justify-between rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-2 text-xs">
                <span className="text-[var(--muted)]">{count} transações</span>
                <span className="text-[var(--muted)]">
                  Inicial: <span className="text-foreground">{mask(brl(a.openingBalance))}</span>
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => setEditing(a)}
                    className="text-[var(--accent)] hover:underline"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => remove(a)}
                    className="text-[var(--danger)] hover:underline"
                  >
                    Excluir
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </section>

      {(creating || editing) && (
        <AccountForm
          account={editing ?? undefined}
          onClose={() => {
            setCreating(false);
            setEditing(null);
          }}
        />
      )}
    </>
  );
}

function AccountForm({ account, onClose }: { account?: Account; onClose: () => void }) {
  const [form, setForm] = useState({
    name: account?.name ?? "",
    color: account?.color ?? PALETTE[0],
    openingBalance: account ? String(account.openingBalance).replace(".", ",") : "0",
  });
  const [saving, setSaving] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const opening = Number(form.openingBalance.replace(",", ".")) || 0;
    if (!form.name) return;
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
      onClose();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Erro ao salvar");
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
          <h2 className="text-lg font-semibold">{account ? "Editar conta" : "Nova conta"}</h2>
          <button type="button" onClick={onClose} className="text-[var(--muted)]">✕</button>
        </div>
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-[var(--muted)] text-xs">Nome</span>
          <input
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="rounded-lg bg-[var(--surface-2)] border border-[var(--border)] px-3 py-2"
            required
          />
        </label>
        <label className="mt-3 flex flex-col gap-1 text-sm">
          <span className="text-[var(--muted)] text-xs">Saldo inicial (R$)</span>
          <input
            inputMode="decimal"
            value={form.openingBalance}
            onChange={(e) => setForm({ ...form, openingBalance: e.target.value })}
            className="rounded-lg bg-[var(--surface-2)] border border-[var(--border)] px-3 py-2"
          />
        </label>
        <div className="mt-3">
          <span className="text-[var(--muted)] text-xs">Cor</span>
          <div className="mt-2 flex flex-wrap gap-2">
            {PALETTE.map((c) => (
              <button
                type="button"
                key={c}
                onClick={() => setForm({ ...form, color: c })}
                className={`h-8 w-8 rounded-full border-2 ${form.color === c ? "border-foreground" : "border-transparent"}`}
                style={{ background: c }}
              />
            ))}
          </div>
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
  );
}
