"use client";

import { db } from "@/lib/db";

export default function AjustesPage() {
  async function exportData() {
    const [accounts, transactions, vaults, vaultMovements] = await Promise.all([
      db.accounts.toArray(),
      db.transactions.toArray(),
      db.vaults.toArray(),
      db.vaultMovements.toArray(),
    ]);
    const blob = new Blob(
      [JSON.stringify({ accounts, transactions, vaults, vaultMovements }, null, 2)],
      { type: "application/json" },
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `workly-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function wipe() {
    if (!confirm("Apagar TODOS os dados locais? Essa ação é irreversível.")) return;
    await db.transaction(
      "rw",
      [db.accounts, db.transactions, db.vaults, db.vaultMovements],
      async () => {
        await db.transactions.clear();
        await db.accounts.clear();
        await db.vaultMovements.clear();
        await db.vaults.clear();
      },
    );
    location.reload();
  }

  return (
    <>
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Ajustes</h1>
        <p className="text-sm text-[var(--muted)]">Backup e manutenção dos seus dados.</p>
      </header>

      <section className="mt-6 space-y-3">
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5">
          <h2 className="font-semibold">Exportar dados</h2>
          <p className="text-sm text-[var(--muted)] mt-1">
            Baixe um JSON com contas, transações e cofres. Útil pra backup.
          </p>
          <button
            onClick={exportData}
            className="mt-3 rounded-full bg-[var(--accent)] px-4 py-2 text-sm font-medium text-[var(--background)]"
          >
            Exportar JSON
          </button>
        </div>

        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5">
          <h2 className="font-semibold text-[var(--danger)]">Apagar tudo</h2>
          <p className="text-sm text-[var(--muted)] mt-1">
            Remove todos os dados locais. Não dá pra desfazer.
          </p>
          <button
            onClick={wipe}
            className="mt-3 rounded-full border border-[var(--danger)] px-4 py-2 text-sm font-medium text-[var(--danger)]"
          >
            Apagar dados
          </button>
        </div>
      </section>
    </>
  );
}
