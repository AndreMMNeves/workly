"use client";

import { useState } from "react";
import {
  addVault,
  addVaultMovement,
  deleteVault,
  useAccounts,
  useVaultMovements,
  useVaults,
  type Vault,
} from "@/lib/data";
import { brl, shortDate } from "@/lib/format";
import { useToast } from "@/lib/toast";

const PALETTE = ["#34e3b0", "#8a2be2", "#0072c6", "#f5a524", "#ef6b6b", "#f06292"];

export default function CofresPage() {
  const toast = useToast();
  const accounts = useAccounts();
  const vaults = useVaults();
  const movements = useVaultMovements();

  const [creating, setCreating] = useState(false);
  const [moving, setMoving] = useState<{ vault: Vault; type: "deposit" | "withdraw" } | null>(null);

  const balanceOf = (id: string) =>
    movements.filter((m) => m.vaultId === id).reduce((a, b) => a + b.amount, 0);

  function projection(vault: Vault, balance: number) {
    if (!vault.deadline || vault.goal <= 0) return null;
    const today = new Date();
    const deadline = new Date(vault.deadline + "T12:00:00");
    const daysLeft = Math.max(0, Math.round((deadline.getTime() - today.getTime()) / 86400000));
    const missing = Math.max(0, vault.goal - balance);
    if (daysLeft === 0) {
      return missing === 0 ? "Meta atingida" : `Faltam ${brl(missing)} e o prazo acabou`;
    }
    const monthsLeft = Math.max(1, Math.round(daysLeft / 30));
    const perMonth = missing / monthsLeft;
    return missing === 0
      ? "Meta atingida"
      : `${brl(perMonth)}/mês por ${monthsLeft} ${monthsLeft === 1 ? "mês" : "meses"}`;
  }

  return (
    <>
      <header className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Cofres</h1>
          <p className="text-sm text-[var(--muted)]">
            Junte dinheiro pra metas — viagem, reserva, investimentos.
          </p>
        </div>
        <button
          onClick={() => setCreating(true)}
          className="rounded-full bg-[var(--accent)] px-4 py-2 text-sm font-medium text-[var(--background)] hover:bg-[var(--accent-strong)]"
        >
          + Novo cofre
        </button>
      </header>

      {vaults.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-dashed border-[var(--border)] p-12 text-center text-sm text-[var(--muted)]">
          Crie seu primeiro cofre pra começar a guardar.
        </div>
      ) : (
        <section className="mt-6 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {vaults.map((v) => {
            const bal = balanceOf(v.id);
            const pct = v.goal > 0 ? Math.min(100, (bal / v.goal) * 100) : 0;
            const proj = projection(v, bal);
            return (
              <div
                key={v.id}
                className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5"
              >
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl" style={{ background: v.color }} />
                  <div className="flex-1">
                    <div className="font-semibold">{v.name}</div>
                    <div className="text-xs text-[var(--muted)]">
                      Meta {brl(v.goal)}
                      {v.deadline ? ` · até ${shortDate(v.deadline)}` : ""}
                    </div>
                  </div>
                </div>
                <div className="mt-4">
                  <div className="text-2xl font-semibold">{brl(bal)}</div>
                  <div className="mt-2 h-2 rounded-full bg-[var(--surface-2)] overflow-hidden">
                    <div className="h-full" style={{ width: `${pct}%`, background: v.color }} />
                  </div>
                  <div className="mt-1 text-xs text-[var(--muted)]">{pct.toFixed(0)}% da meta</div>
                  {proj && (
                    <div className="mt-1 text-xs text-[var(--accent)]">{proj}</div>
                  )}
                </div>
                <div className="mt-4 flex gap-2">
                  <button
                    onClick={() => setMoving({ vault: v, type: "deposit" })}
                    className="flex-1 rounded-full bg-[var(--accent)] px-3 py-2 text-xs font-medium text-[var(--background)]"
                  >
                    Depositar
                  </button>
                  <button
                    onClick={() => setMoving({ vault: v, type: "withdraw" })}
                    className="flex-1 rounded-full border border-[var(--border)] px-3 py-2 text-xs"
                  >
                    Retirar
                  </button>
                  <button
                    onClick={async () => {
                      if (!confirm(`Excluir o cofre ${v.name}?`)) return;
                      await deleteVault(v.id);
                    }}
                    className="rounded-full border border-[var(--border)] px-3 py-2 text-xs text-[var(--danger)]"
                  >
                    ✕
                  </button>
                </div>
                <ul className="mt-4 space-y-1 text-xs text-[var(--muted)] max-h-32 overflow-auto">
                  {movements
                    .filter((m) => m.vaultId === v.id)
                    .slice(-5)
                    .reverse()
                    .map((m) => (
                      <li key={m.id} className="flex justify-between">
                        <span>{shortDate(m.date)}{m.note ? ` · ${m.note}` : ""}</span>
                        <span className={m.amount < 0 ? "text-[var(--danger)]" : "text-[var(--accent)]"}>
                          {m.amount < 0 ? "-" : "+"}{brl(Math.abs(m.amount))}
                        </span>
                      </li>
                    ))}
                </ul>
              </div>
            );
          })}
        </section>
      )}

      {creating && <VaultForm onClose={() => setCreating(false)} accounts={accounts} />}
      {moving && (
        <MovementForm
          vault={moving.vault}
          type={moving.type}
          onClose={() => setMoving(null)}
        />
      )}
    </>
  );
}

function VaultForm({ onClose, accounts }: { onClose: () => void; accounts: ReturnType<typeof useAccounts> }) {
  const toast = useToast();
  const [form, setForm] = useState({
    name: "",
    goal: "",
    color: PALETTE[0],
    accountId: accounts[0]?.id ?? "",
    deadline: "",
  });
  const [saving, setSaving] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name) return;
    setSaving(true);
    try {
      await addVault({
        name: form.name,
        goal: Number(form.goal.replace(",", ".")) || 0,
        color: form.color,
        accountId: form.accountId || undefined,
        deadline: form.deadline || undefined,
      });
      toast.success("Cofre criado");
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao salvar");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal title="Novo cofre" onClose={onClose}>
      <form onSubmit={submit} className="space-y-3 text-sm">
        <Field label="Nome">
          <input
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="w-full rounded-lg bg-[var(--surface-2)] border border-[var(--border)] px-3 py-2"
            required
          />
        </Field>
        <Field label="Meta (R$)">
          <input
            inputMode="decimal"
            value={form.goal}
            onChange={(e) => setForm({ ...form, goal: e.target.value })}
            className="w-full rounded-lg bg-[var(--surface-2)] border border-[var(--border)] px-3 py-2"
            placeholder="0,00"
          />
        </Field>
        <Field label="Prazo (opcional)">
          <input
            type="date"
            value={form.deadline}
            onChange={(e) => setForm({ ...form, deadline: e.target.value })}
            className="w-full rounded-lg bg-[var(--surface-2)] border border-[var(--border)] px-3 py-2"
          />
        </Field>
        <Field label="Cor">
          <div className="flex flex-wrap gap-2">
            {PALETTE.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setForm({ ...form, color: c })}
                className={`h-8 w-8 rounded-full border-2 ${form.color === c ? "border-foreground" : "border-transparent"}`}
                style={{ background: c }}
              />
            ))}
          </div>
        </Field>
        <button
          type="submit"
          disabled={saving}
          className="w-full rounded-full bg-[var(--accent)] py-2.5 font-medium text-[var(--background)] disabled:opacity-60"
        >
          {saving ? "Salvando..." : "Criar cofre"}
        </button>
      </form>
    </Modal>
  );
}

function MovementForm({
  vault,
  type,
  onClose,
}: {
  vault: Vault;
  type: "deposit" | "withdraw";
  onClose: () => void;
}) {
  const toast = useToast();
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [saving, setSaving] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const n = Number(amount.replace(",", ".")) || 0;
    if (!n) return;
    setSaving(true);
    try {
      await addVaultMovement({
        vaultId: vault.id,
        amount: type === "deposit" ? Math.abs(n) : -Math.abs(n),
        date,
        note: note || undefined,
      });
      toast.success(type === "deposit" ? "Depositado" : "Retirado");
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao salvar");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal title={`${type === "deposit" ? "Depositar" : "Retirar"} · ${vault.name}`} onClose={onClose}>
      <form onSubmit={submit} className="space-y-3 text-sm">
        <Field label="Valor (R$)">
          <input
            inputMode="decimal"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0,00"
            className="w-full rounded-lg bg-[var(--surface-2)] border border-[var(--border)] px-3 py-2"
            autoFocus
          />
        </Field>
        <Field label="Data">
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full rounded-lg bg-[var(--surface-2)] border border-[var(--border)] px-3 py-2"
          />
        </Field>
        <Field label="Nota (opcional)">
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="w-full rounded-lg bg-[var(--surface-2)] border border-[var(--border)] px-3 py-2"
          />
        </Field>
        <button
          type="submit"
          disabled={saving}
          className="w-full rounded-full bg-[var(--accent)] py-2.5 font-medium text-[var(--background)] disabled:opacity-60"
        >
          {saving ? "Salvando..." : "Confirmar"}
        </button>
      </form>
    </Modal>
  );
}

function Modal({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4">
      <div className="w-full max-w-md rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">{title}</h2>
          <button onClick={onClose} className="text-[var(--muted)]">✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-[var(--muted)] text-xs">{label}</span>
      {children}
    </label>
  );
}
