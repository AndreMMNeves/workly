"use client";

import Link from "next/link";
import { useState } from "react";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import Button from "./ui/Button";
import { FieldWrap, Input } from "./ui/Field";

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
      className="w-full max-w-sm rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-8 shadow-2xl"
    >
      <div className="flex items-center gap-3 mb-8">
        <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-[var(--accent)] to-[var(--accent-strong)] grid place-items-center text-[var(--background)] font-bold text-lg shadow-lg shadow-[var(--accent)]/20">
          W
        </div>
        <div>
          <div className="font-semibold text-[15px]">Workly</div>
          <div className="text-xs text-[var(--muted)]">Recuperar senha</div>
        </div>
      </div>
      {sent ? (
        <div className="flex items-start gap-2 rounded-lg border border-[var(--accent)]/40 bg-[var(--accent)]/10 px-3 py-3 text-xs text-[var(--accent)]">
          <CheckCircle2 size={14} className="shrink-0 mt-0.5" />
          <span>
            Se este email existir, você receberá um link pra redefinir a senha.
          </span>
        </div>
      ) : (
        <>
          <FieldWrap label="Email">
            <Input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="voce@exemplo.com"
              autoComplete="email"
            />
          </FieldWrap>
          {error && (
            <div className="mt-4 flex items-start gap-2 rounded-lg border border-[var(--danger)]/40 bg-[var(--danger)]/10 px-3 py-2.5 text-xs text-[var(--danger)]">
              <AlertCircle size={14} className="shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}
          <Button
            type="submit"
            loading={loading}
            fullWidth
            size="lg"
            className="mt-6"
          >
            {loading ? "Enviando..." : "Enviar link"}
          </Button>
        </>
      )}
      <div className="mt-5 text-center text-xs text-[var(--muted)]">
        <Link
          href="/login"
          className="text-[var(--accent)] hover:underline font-medium"
        >
          Voltar pro login
        </Link>
      </div>
    </form>
  );
}
