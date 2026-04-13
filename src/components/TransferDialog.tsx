"use client";

import { useState } from "react";
import { addTransfer, type Account } from "@/lib/data";
import { useToast } from "@/lib/toast";

export default function TransferDialog({ accounts }: { accounts: Account[] }) {
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

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const n = Number(form.amount.replace(",", "."));
    if (!n) return;
    setSaving(true);
    try {
      await addTransfer({
        fromAccountId: form.from,
        toAccountId: form.to,
        amount: n,
        date: form.date,
        description: form.description || undefined,
      });
      toast.success("Transferência realizada");
      setOpen(false);
      setForm({ ...form, amount: "", description: "" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro na transferência");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="rounded-full border border-[var(--border)] bg-[var(--surface)] px-4 py-2 text-sm font-medium text-foreground hover:bg-[var(--surface-2)]"
      >
        ↔ Transferir
      </button>
      {open && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4">
          <form
            onSubmit={submit}
            className="w-full max-w-md rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6"
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold">Transferir entre contas</h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="text-[var(--muted)]"
              >
                ✕
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <label className="flex flex-col gap-1">
                <span className="text-[var(--muted)] text-xs">De</span>
                <select
                  value={form.from}
                  onChange={(e) => setForm({ ...form, from: e.target.value })}
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
                <span className="text-[var(--muted)] text-xs">Para</span>
                <select
                  value={form.to}
                  onChange={(e) => setForm({ ...form, to: e.target.value })}
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
              <label className="col-span-2 flex flex-col gap-1">
                <span className="text-[var(--muted)] text-xs">Descrição (opcional)</span>
                <input
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Ex.: Pagamento cartão"
                  className="rounded-lg bg-[var(--surface-2)] border border-[var(--border)] px-3 py-2"
                />
              </label>
            </div>
            <button
              type="submit"
              disabled={saving}
              className="mt-5 w-full rounded-full bg-[var(--accent)] py-2.5 text-sm font-medium text-[var(--background)] hover:bg-[var(--accent-strong)] disabled:opacity-60"
            >
              {saving ? "Transferindo..." : "Confirmar"}
            </button>
          </form>
        </div>
      )}
    </>
  );
}
