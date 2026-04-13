"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import Button from "./ui/Button";
import { FieldWrap, Input } from "./ui/Field";

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
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
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
      className="w-full max-w-sm rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-8 shadow-2xl"
    >
      <div className="flex items-center gap-3 mb-8">
        <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-[var(--accent)] to-[var(--accent-strong)] grid place-items-center text-[var(--background)] font-bold text-lg shadow-lg shadow-[var(--accent)]/20">
          W
        </div>
        <div>
          <div className="font-semibold text-[15px]">Workly</div>
          <div className="text-xs text-[var(--muted)]">
            {mode === "login" ? "Entre na sua conta" : "Crie sua conta"}
          </div>
        </div>
      </div>
      <div className="space-y-4">
        <FieldWrap label="Email">
          <Input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            placeholder="voce@exemplo.com"
          />
        </FieldWrap>
        <FieldWrap label="Senha">
          <Input
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete={mode === "login" ? "current-password" : "new-password"}
            placeholder="••••••••"
          />
        </FieldWrap>
      </div>
      {error && (
        <div className="mt-4 flex items-start gap-2 rounded-lg border border-[var(--danger)]/40 bg-[var(--danger)]/10 px-3 py-2.5 text-xs text-[var(--danger)]">
          <AlertCircle size={14} className="shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}
      {info && (
        <div className="mt-4 flex items-start gap-2 rounded-lg border border-[var(--accent)]/40 bg-[var(--accent)]/10 px-3 py-2.5 text-xs text-[var(--accent)]">
          <CheckCircle2 size={14} className="shrink-0 mt-0.5" />
          <span>{info}</span>
        </div>
      )}
      <Button
        type="submit"
        loading={loading}
        fullWidth
        size="lg"
        className="mt-6"
      >
        {loading ? "Aguarde..." : mode === "login" ? "Entrar" : "Criar conta"}
      </Button>
      <div className="mt-5 text-center text-xs text-[var(--muted)] space-y-2">
        {mode === "login" ? (
          <>
            <div>
              Não tem conta?{" "}
              <Link
                href="/signup"
                className="text-[var(--accent)] hover:underline font-medium"
              >
                Criar conta
              </Link>
            </div>
            <div>
              <Link
                href="/forgot-password"
                className="hover:text-foreground transition-colors"
              >
                Esqueci minha senha
              </Link>
            </div>
          </>
        ) : (
          <div>
            Já tem conta?{" "}
            <Link
              href="/login"
              className="text-[var(--accent)] hover:underline font-medium"
            >
              Entrar
            </Link>
          </div>
        )}
      </div>
    </form>
  );
}
