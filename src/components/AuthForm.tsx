"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function AuthForm({ mode }: { mode: "login" | "signup" }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setInfo(null);
    const supabase = createClient();
    try {
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        if (!data.session) {
          setInfo("Conta criada. Confirme seu email pra entrar.");
          return;
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
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
          <div className="text-xs text-[var(--muted)]">
            {mode === "login" ? "Entre na sua conta" : "Crie sua conta"}
          </div>
        </div>
      </div>
      <label className="flex flex-col gap-1 text-sm">
        <span className="text-[var(--muted)] text-xs">Email</span>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="rounded-lg bg-[var(--surface-2)] border border-[var(--border)] px-3 py-2"
          autoComplete="email"
        />
      </label>
      <label className="mt-3 flex flex-col gap-1 text-sm">
        <span className="text-[var(--muted)] text-xs">Senha</span>
        <input
          type="password"
          required
          minLength={6}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="rounded-lg bg-[var(--surface-2)] border border-[var(--border)] px-3 py-2"
          autoComplete={mode === "login" ? "current-password" : "new-password"}
        />
      </label>
      {error && (
        <div className="mt-3 rounded-lg border border-[var(--danger)]/40 bg-[var(--danger)]/10 px-3 py-2 text-xs text-[var(--danger)]">
          {error}
        </div>
      )}
      {info && (
        <div className="mt-3 rounded-lg border border-[var(--accent)]/40 bg-[var(--accent)]/10 px-3 py-2 text-xs text-[var(--accent)]">
          {info}
        </div>
      )}
      <button
        type="submit"
        disabled={loading}
        className="mt-5 w-full rounded-full bg-[var(--accent)] py-2.5 text-sm font-medium text-[var(--background)] hover:bg-[var(--accent-strong)] disabled:opacity-60"
      >
        {loading ? "..." : mode === "login" ? "Entrar" : "Criar conta"}
      </button>
      <div className="mt-4 text-center text-xs text-[var(--muted)]">
        {mode === "login" ? (
          <>
            Não tem conta?{" "}
            <Link href="/signup" className="text-[var(--accent)] hover:underline">
              Criar conta
            </Link>
          </>
        ) : (
          <>
            Já tem conta?{" "}
            <Link href="/login" className="text-[var(--accent)] hover:underline">
              Entrar
            </Link>
          </>
        )}
      </div>
    </form>
  );
}
