"use client";

import { Download } from "lucide-react";
import { exportAll } from "@/lib/data";
import Button from "./ui/Button";
import PageHeader from "./ui/PageHeader";

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
      <PageHeader
        title="Ajustes"
        description="Backup e exportação dos seus dados."
      />

      <section className="mt-6 space-y-3">
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6">
          <h2 className="font-semibold text-[15px]">Exportar dados</h2>
          <p className="text-sm text-[var(--muted)] mt-1">
            Baixe um JSON com contas, transações e cofres. Útil pra backup.
          </p>
          <Button
            onClick={exportData}
            leftIcon={<Download size={16} />}
            className="mt-4"
          >
            Exportar JSON
          </Button>
        </div>
      </section>
    </>
  );
}
