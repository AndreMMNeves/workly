"use client";

import { useState } from "react";
import { ArrowRight, ArrowLeftRight } from "lucide-react";
import { addTransfer, type Account } from "@/lib/data";
import { useToast } from "@/lib/toast";
import Button from "./ui/Button";
import Dialog from "./ui/Dialog";
import { FieldWrap, Input, Select } from "./ui/Field";
import MoneyInput, { parseBRL } from "./ui/MoneyInput";

export default function TransferDialog({
  accounts,
}: {
  accounts: Account[];
}) {
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    from: accounts[0]?.id ?? "",
    to: accounts[1]?.id ?? accounts[0]?.id ?? "",
    amount: "",
    date: new Date().toISOString().slice(0, 10),
    description: "",
  });
  const [saving, setSaving] = useState(false);
  const [touched, setTouched] = useState(false);

  const fromAccount = accounts.find((a) => a.id === form.from);
  const toAccount = accounts.find((a) => a.id === form.to);
  const sameAccount = form.from === form.to;
  const amountValue = parseBRL(form.amount);
  const amountInvalid = touched && amountValue <= 0;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setTouched(true);
    if (amountValue <= 0 || sameAccount) return;
    setSaving(true);
    try {
      await addTransfer({
        fromAccountId: form.from,
        toAccountId: form.to,
        amount: amountValue,
        date: form.date,
        description: form.description || undefined,
      });
      toast.success("Transferência realizada");
      setOpen(false);
      setForm({ ...form, amount: "", description: "" });
      setTouched(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro na transferência");
    } finally {
      setSaving(false);
    }
  }

  function swap() {
    setForm({ ...form, from: form.to, to: form.from });
  }

  return (
    <>
      <Button
        variant="secondary"
        onClick={() => setOpen(true)}
        leftIcon={<ArrowLeftRight size={16} />}
      >
        Transferir
      </Button>
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title="Transferir entre contas"
        description="Movimente dinheiro sem criar despesa ou receita"
      >
        <form onSubmit={submit} className="space-y-4">
          {/* From → To visual */}
          <div className="rounded-2xl bg-[var(--surface-2)] border border-[var(--border)] p-4 space-y-3">
            <FieldWrap label="De">
              <Select
                value={form.from}
                onChange={(e) => setForm({ ...form, from: e.target.value })}
              >
                {accounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </Select>
            </FieldWrap>
            <div className="flex items-center justify-center">
              <button
                type="button"
                onClick={swap}
                title="Inverter contas"
                aria-label="Inverter contas"
                className="grid place-items-center h-9 w-9 rounded-full bg-[var(--surface)] border border-[var(--border)] text-[var(--muted)] hover:text-[var(--accent)] hover:border-[var(--accent)]/40 transition-all outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
              >
                <ArrowRight
                  size={16}
                  className="rotate-90 transition-transform"
                />
              </button>
            </div>
            <FieldWrap
              label="Para"
              error={sameAccount ? "Selecione contas diferentes" : undefined}
            >
              <Select
                value={form.to}
                onChange={(e) => setForm({ ...form, to: e.target.value })}
              >
                {accounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </Select>
            </FieldWrap>
          </div>

          {fromAccount && toAccount && !sameAccount && (
            <div className="flex items-center justify-center gap-2 text-xs text-[var(--muted)]">
              <span
                className="h-2 w-2 rounded-full"
                style={{ background: fromAccount.color }}
              />
              <span>{fromAccount.name}</span>
              <ArrowRight size={12} />
              <span
                className="h-2 w-2 rounded-full"
                style={{ background: toAccount.color }}
              />
              <span>{toAccount.name}</span>
            </div>
          )}

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

          <FieldWrap label="Data">
            <Input
              type="date"
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
            />
          </FieldWrap>

          <FieldWrap label="Descrição (opcional)">
            <Input
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
              placeholder="Ex.: Pagamento cartão"
            />
          </FieldWrap>

          <div className="flex gap-2 pt-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setOpen(false)}
              fullWidth
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              loading={saving}
              disabled={sameAccount}
              fullWidth
            >
              {saving ? "Transferindo..." : "Confirmar"}
            </Button>
          </div>
        </form>
      </Dialog>
    </>
  );
}
