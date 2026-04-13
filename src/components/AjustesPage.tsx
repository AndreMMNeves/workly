"use client";

import { exportAll } from "@/lib/data";

export default function AjustesPage() {
  async function exportData() {
    const data = await exportAll();
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `workly-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <>
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Ajustes</h1>
        <p className="text-sm text-[var(--muted)]">Backup e exportação dos seus dados.</p>
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
      </section>
    </>
  );
}
