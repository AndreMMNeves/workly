"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { AlertCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import Button from "./ui/Button";
import { FieldWrap, Input } from "./ui/Field";

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
      className="w-full max-w-sm rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-8 shadow-2xl"
    >
      <div className="flex items-center gap-3 mb-8">
        <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-[var(--accent)] to-[var(--accent-strong)] grid place-items-center text-[var(--background)] font-bold text-lg shadow-lg shadow-[var(--accent)]/20">
          W
        </div>
        <div>
          <div className="font-semibold text-[15px]">Workly</div>
          <div className="text-xs text-[var(--muted)]">Definir nova senha</div>
        </div>
      </div>
      <FieldWrap label="Nova senha">
        <Input
          type="password"
          required
          minLength={6}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          autoComplete="new-password"
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
        {loading ? "Salvando..." : "Salvar nova senha"}
      </Button>
    </form>
  );
}
