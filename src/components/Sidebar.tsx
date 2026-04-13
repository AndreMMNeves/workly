"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Wallet,
  ArrowLeftRight,
  Repeat,
  Target,
  BarChart3,
  PiggyBank,
  Settings,
  LogOut,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

const items = [
  { href: "/", label: "Overview", icon: LayoutDashboard },
  { href: "/contas", label: "Contas", icon: Wallet },
  { href: "/transacoes", label: "Transações", icon: ArrowLeftRight },
  { href: "/recorrentes", label: "Recorrentes", icon: Repeat },
  { href: "/orcamentos", label: "Orçamentos", icon: Target },
  { href: "/relatorios", label: "Relatórios", icon: BarChart3 },
  { href: "/cofres", label: "Cofres", icon: PiggyBank },
  { href: "/ajustes", label: "Ajustes", icon: Settings },
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
    <aside className="hidden md:flex w-60 shrink-0 flex-col border-r border-[var(--border)] bg-[var(--surface)]/80 backdrop-blur-xl p-4">
      <Link
        href="/"
        className="flex items-center gap-2.5 px-2 py-3 outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] rounded-lg"
      >
        <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-[var(--accent)] to-[var(--accent-strong)] grid place-items-center text-[var(--background)] font-bold shadow-lg shadow-[var(--accent)]/20">
          W
        </div>
        <span className="font-semibold tracking-tight text-[15px]">
          Workly
        </span>
      </Link>
      <nav className="mt-6 flex flex-col gap-0.5">
        {items.map((it) => {
          const Icon = it.icon;
          const isActive =
            it.href === "/" ? pathname === "/" : pathname.startsWith(it.href);
          return (
            <Link
              key={it.href}
              href={it.href}
              className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] ${
                isActive
                  ? "bg-[var(--accent)] text-[var(--background)] font-semibold shadow-md shadow-[var(--accent)]/20"
                  : "text-[var(--muted)] hover:bg-[var(--surface-2)] hover:text-foreground"
              }`}
            >
              <Icon
                size={18}
                className={
                  isActive
                    ? ""
                    : "text-[var(--muted)] group-hover:text-foreground transition-colors"
                }
              />
              {it.label}
            </Link>
          );
        })}
      </nav>
      <div className="mt-auto">
        <div className="flex items-center gap-2 rounded-2xl bg-[var(--surface-2)] border border-[var(--border)] p-2.5">
          <div
            className="h-9 w-9 shrink-0 rounded-xl bg-gradient-to-br from-[var(--accent)] to-[var(--accent-strong)] grid place-items-center text-[var(--background)] text-sm font-bold"
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
            className="shrink-0 rounded-lg p-2 text-[var(--muted)] hover:text-[var(--danger)] hover:bg-[var(--surface)] transition-colors outline-none focus-visible:ring-2 focus-visible:ring-[var(--danger)]"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </aside>
  );
}
