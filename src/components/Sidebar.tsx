"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const items = [
  { href: "/", label: "Overview", icon: "◎" },
  { href: "/contas", label: "Contas", icon: "▦" },
  { href: "/transacoes", label: "Transações", icon: "⇅" },
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
      <div className="mt-auto space-y-2">
        <div className="rounded-xl bg-[var(--surface-2)] p-3 text-xs">
          <div className="text-[var(--muted)]">Logado como</div>
          <div className="truncate">{userEmail}</div>
        </div>
        <button
          onClick={signOut}
          className="w-full rounded-xl border border-[var(--border)] px-3 py-2 text-xs text-[var(--muted)] hover:text-foreground hover:bg-[var(--surface-2)]"
        >
          Sair
        </button>
      </div>
    </aside>
  );
}
