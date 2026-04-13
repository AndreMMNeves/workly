"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const items = [
  { href: "/", label: "Overview", icon: "◎" },
  { href: "/contas", label: "Contas", icon: "▦" },
  { href: "/transacoes", label: "Transações", icon: "⇅" },
  { href: "/recorrentes", label: "Recorrentes", icon: "↻" },
  { href: "/orcamentos", label: "Orçamentos", icon: "◈" },
  { href: "/relatorios", label: "Relatórios", icon: "◢" },
  { href: "/cofres", label: "Cofres", icon: "✦" },
  { href: "/ajustes", label: "Ajustes", icon: "⚙" },
];

export default function Sidebar({ userEmail }: { userEmail: string }) {
  const pathname = usePathname();
  const router = useRouter();

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.replace("/login");
    router.refresh();
  }

  return (
    <aside className="hidden md:flex w-56 shrink-0 flex-col border-r border-[var(--border)] bg-[var(--surface)] p-4">
      <Link href="/" className="flex items-center gap-2 px-2 py-3">
        <div className="h-8 w-8 rounded-lg bg-[var(--accent)] grid place-items-center text-[var(--background)] font-bold">
          W
        </div>
        <span className="font-semibold tracking-tight">Workly</span>
      </Link>
      <nav className="mt-6 flex flex-col gap-1">
        {items.map((it) => {
          const isActive =
            it.href === "/" ? pathname === "/" : pathname.startsWith(it.href);
          return (
            <Link
              key={it.href}
              href={it.href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
                isActive
                  ? "bg-[var(--accent)] text-[var(--background)] font-medium"
                  : "text-[var(--muted)] hover:bg-[var(--surface-2)] hover:text-foreground"
              }`}
            >
              <span className="text-base">{it.icon}</span>
              {it.label}
            </Link>
          );
        })}
      </nav>
      <div className="mt-auto">
        <div className="flex items-center gap-2 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] p-2">
          <div
            className="h-9 w-9 shrink-0 rounded-lg bg-[var(--accent)] grid place-items-center text-[var(--background)] text-sm font-bold"
            aria-hidden
          >
            {userEmail.charAt(0).toUpperCase() || "?"}
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-[10px] uppercase tracking-wider text-[var(--muted)]">
              Conta
            </div>
            <div className="truncate text-xs font-medium" title={userEmail}>
              {userEmail}
            </div>
          </div>
          <button
            onClick={signOut}
            title="Sair"
            aria-label="Sair"
            className="shrink-0 rounded-lg p-2 text-[var(--muted)] hover:text-[var(--danger)] hover:bg-[var(--surface)] transition-colors"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
          </button>
        </div>
      </div>
    </aside>
  );
}
