"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function ResetPasswordForm() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const supabase = createClient();
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      router.replace("/");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro inesperado");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={submit}
      className="w-full max-w-sm rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-8"
    >
      <div className="flex items-center gap-2 mb-6">
        <div className="h-9 w-9 rounded-lg bg-[var(--accent)] grid place-items-center text-[var(--background)] font-bold">
          W
        </div>
        <div>
          <div className="font-semibold">Workly</div>
          <div className="text-xs text-[var(--muted)]">Definir nova senha</div>
        </div>
      </div>
      <label className="flex flex-col gap-1 text-sm">
        <span className="text-[var(--muted)] text-xs">Nova senha</span>
        <input
          type="password"
          required
          minLength={6}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="rounded-lg bg-[var(--surface-2)] border border-[var(--border)] px-3 py-2"
          autoComplete="new-password"
        />
      </label>
      {error && (
        <div className="mt-3 rounded-lg border border-[var(--danger)]/40 bg-[var(--danger)]/10 px-3 py-2 text-xs text-[var(--danger)]">
          {error}
        </div>
      )}
      <button
        type="submit"
        disabled={loading}
        className="mt-5 w-full rounded-full bg-[var(--accent)] py-2.5 text-sm font-medium text-[var(--background)] hover:bg-[var(--accent-strong)] disabled:opacity-60"
      >
        {loading ? "..." : "Salvar nova senha"}
      </button>
    </form>
  );
}
