"use client";

import { useState } from "react";
import { Plus, PiggyBank, Minus, Trash2 } from "lucide-react";
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
];

export default function CofresPage() {
  const accounts = useAccounts();
  const vaults = useVaults();
  const movements = useVaultMovements();

  const [creating, setCreating] = useState(false);
  const [moving, setMoving] = useState<{
    vault: Vault;
    type: "deposit" | "withdraw";
  } | null>(null);

  const balanceOf = (id: string) =>
    movements.filter((m) => m.vaultId === id).reduce((a, b) => a + b.amount, 0);

  function projection(vault: Vault, balance: number) {
    if (!vault.deadline || vault.goal <= 0) return null;
    const today = new Date();
    const deadline = new Date(vault.deadline + "T12:00:00");
    const daysLeft = Math.max(
      0,
      Math.round((deadline.getTime() - today.getTime()) / 86400000),
    );
    const missing = Math.max(0, vault.goal - balance);
    if (daysLeft === 0) {
      return missing === 0
        ? "Meta atingida"
        : `Faltam ${brl(missing)} e o prazo acabou`;
    }
    const monthsLeft = Math.max(1, Math.round(daysLeft / 30));
    const perMonth = missing / monthsLeft;
    return missing === 0
      ? "Meta atingida"
      : `${brl(perMonth)}/mês por ${monthsLeft} ${monthsLeft === 1 ? "mês" : "meses"}`;
  }

  return (
    <>
      <PageHeader
        title="Cofres"
        description="Junte dinheiro pra metas — viagem, reserva, investimentos."
        actions={
          <Button
            onClick={() => setCreating(true)}
            leftIcon={<Plus size={16} strokeWidth={2.5} />}
          >
            Novo cofre
          </Button>
        }
      />

      {vaults.length === 0 ? (
        <div className="mt-6">
          <EmptyState
            icon={<PiggyBank size={22} />}
            title="Nenhum cofre ainda"
            description="Crie seu primeiro cofre pra começar a guardar dinheiro pra metas."
            action={
              <Button
                onClick={() => setCreating(true)}
                leftIcon={<Plus size={16} strokeWidth={2.5} />}
              >
                Criar cofre
              </Button>
            }
          />
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
                className="group rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 hover:border-[var(--border-strong)] transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div
                    className="h-11 w-11 rounded-xl shadow-md"
                    style={{ background: v.color }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold truncate">{v.name}</div>
                    <div className="text-xs text-[var(--muted)]">
                      Meta {brl(v.goal)}
                      {v.deadline ? ` · até ${shortDate(v.deadline)}` : ""}
                    </div>
                  </div>
                  <button
                    onClick={async () => {
                      if (!confirm(`Excluir o cofre ${v.name}?`)) return;
                      await deleteVault(v.id);
                    }}
                    aria-label="Excluir"
                    className="opacity-0 group-hover:opacity-100 transition-opacity rounded-lg p-1.5 text-[var(--muted)] hover:text-[var(--danger)] hover:bg-[var(--danger)]/10"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
                <div className="mt-4">
                  <div className="flex items-baseline justify-between">
                    <div className="text-2xl font-semibold tabular-nums">
                      {brl(bal)}
                    </div>
                    <div className="text-xs font-semibold text-[var(--muted)]">
                      {pct.toFixed(0)}%
                    </div>
                  </div>
                  <div className="mt-2 h-2 rounded-full bg-[var(--surface-2)] overflow-hidden">
                    <div
                      className="h-full rounded-full transition-[width] duration-500 ease-out"
                      style={{ width: `${pct}%`, background: v.color }}
                    />
                  </div>
                  {proj && (
                    <div className="mt-2 text-xs text-[var(--accent)]">
                      {proj}
                    </div>
                  )}
                </div>
                <div className="mt-4 flex gap-2">
                  <Button
                    size="sm"
                    fullWidth
                    onClick={() => setMoving({ vault: v, type: "deposit" })}
                    leftIcon={<Plus size={14} />}
                  >
                    Depositar
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    fullWidth
                    onClick={() => setMoving({ vault: v, type: "withdraw" })}
                    leftIcon={<Minus size={14} />}
                  >
                    Retirar
                  </Button>
                </div>
                {movements.some((m) => m.vaultId === v.id) && (
                  <ul className="mt-4 space-y-1 text-xs text-[var(--muted)] max-h-32 overflow-auto pr-1">
                    {movements
                      .filter((m) => m.vaultId === v.id)
                      .slice(-5)
                      .reverse()
                      .map((m) => (
                        <li key={m.id} className="flex justify-between">
                          <span>
                            {shortDate(m.date)}
                            {m.note ? ` · ${m.note}` : ""}
                          </span>
                          <span
                            className={`tabular-nums font-semibold ${
                              m.amount < 0
                                ? "text-[var(--danger)]"
                                : "text-[var(--accent)]"
                            }`}
                          >
                            {m.amount < 0 ? "−" : "+"}
                            {brl(Math.abs(m.amount))}
                          </span>
                        </li>
                      ))}
                  </ul>
                )}
              </div>
            );
          })}
        </section>
      )}

      <VaultForm
        open={creating}
        onClose={() => setCreating(false)}
        accounts={accounts}
      />
      <MovementForm
        open={!!moving}
        vault={moving?.vault}
        type={moving?.type ?? "deposit"}
        onClose={() => setMoving(null)}
      />
    </>
  );
}

function VaultForm({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
  accounts: ReturnType<typeof useAccounts>;
}) {
  const toast = useToast();
  const [form, setForm] = useState({
    name: "",
    goal: "",
    color: PALETTE[0],
    deadline: "",
  });
  const [saving, setSaving] = useState(false);
  const [touched, setTouched] = useState(false);

  const nameInvalid = touched && !form.name.trim();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setTouched(true);
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      await addVault({
        name: form.name,
        goal: parseBRL(form.goal),
        color: form.color,
        deadline: form.deadline || undefined,
      });
      toast.success("Cofre criado");
      setForm({ name: "", goal: "", color: PALETTE[0], deadline: "" });
      setTouched(false);
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao salvar");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onClose={onClose} title="Novo cofre">
      <form onSubmit={submit} className="space-y-4">
        <FieldWrap
          label="Nome"
          required
          error={nameInvalid ? "Informe um nome" : undefined}
        >
          <Input
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="Ex.: Viagem, Reserva de emergência"
            invalid={nameInvalid}
            autoFocus
          />
        </FieldWrap>
        <FieldWrap label="Meta">
          <MoneyInput
            value={form.goal}
            onChange={(v) => setForm({ ...form, goal: v })}
          />
        </FieldWrap>
        <FieldWrap label="Prazo (opcional)">
          <Input
            type="date"
            value={form.deadline}
            onChange={(e) => setForm({ ...form, deadline: e.target.value })}
          />
        </FieldWrap>
        <div>
          <div className="text-[11px] font-medium uppercase tracking-wider text-[var(--muted)] mb-2">
            Cor
          </div>
          <div className="flex flex-wrap gap-2">
            {PALETTE.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setForm({ ...form, color: c })}
                aria-label={`Selecionar cor ${c}`}
                className={`h-9 w-9 rounded-xl transition-all outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--surface)] focus-visible:ring-[var(--accent)] ${
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
            {saving ? "Salvando..." : "Criar cofre"}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}

function MovementForm({
  open,
  vault,
  type,
  onClose,
}: {
  open: boolean;
  vault?: Vault;
  type: "deposit" | "withdraw";
  onClose: () => void;
}) {
  const toast = useToast();
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [saving, setSaving] = useState(false);
  const [touched, setTouched] = useState(false);

  const amountValue = parseBRL(amount);
  const amountInvalid = touched && amountValue <= 0;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setTouched(true);
    if (!vault || amountValue <= 0) return;
    setSaving(true);
    try {
      await addVaultMovement({
        vaultId: vault.id,
        amount:
          type === "deposit" ? Math.abs(amountValue) : -Math.abs(amountValue),
        date,
        note: note || undefined,
      });
      toast.success(type === "deposit" ? "Depositado" : "Retirado");
      setAmount("");
      setNote("");
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
      title={`${type === "deposit" ? "Depositar" : "Retirar"}${vault ? ` · ${vault.name}` : ""}`}
      size="sm"
    >
      <form onSubmit={submit} className="space-y-4">
        <FieldWrap
          label="Valor"
          required
          error={amountInvalid ? "Informe um valor válido" : undefined}
        >
          <MoneyInput
            value={amount}
            onChange={setAmount}
            invalid={amountInvalid}
            autoFocus
          />
        </FieldWrap>
        <FieldWrap label="Data">
          <Input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </FieldWrap>
        <FieldWrap label="Nota (opcional)">
          <Input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Ex.: Bônus do mês"
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
            {saving ? "Salvando..." : "Confirmar"}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
