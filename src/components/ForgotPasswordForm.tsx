"use client";

import Link from "next/link";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const supabase = createClient();
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      setSent(true);
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
          <div className="text-xs text-[var(--muted)]">Recuperar senha</div>
        </div>
      </div>
      {sent ? (
        <div className="rounded-lg border border-[var(--accent)]/40 bg-[var(--accent)]/10 px-3 py-3 text-xs text-[var(--accent)]">
          Se este email existir, você receberá um link pra redefinir a senha.
        </div>
      ) : (
        <>
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-[var(--muted)] text-xs">Email</span>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="rounded-lg bg-[var(--surface-2)] border border-[var(--border)] px-3 py-2"
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
            {loading ? "..." : "Enviar link"}
          </button>
        </>
      )}
      <div className="mt-4 text-center text-xs text-[var(--muted)]">
        <Link href="/login" className="text-[var(--accent)] hover:underline">
          Voltar pro login
        </Link>
      </div>
    </form>
  );
}
