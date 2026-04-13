"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ArrowLeftRight,
  Target,
  BarChart3,
  Menu,
} from "lucide-react";

const items = [
  { href: "/", label: "Início", icon: LayoutDashboard },
  { href: "/transacoes", label: "Transações", icon: ArrowLeftRight },
  { href: "/orcamentos", label: "Orçamento", icon: Target },
  { href: "/relatorios", label: "Relatórios", icon: BarChart3 },
  { href: "/ajustes", label: "Mais", icon: Menu },
];

export default function MobileNav() {
  const pathname = usePathname();
  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 border-t border-[var(--border)] bg-[var(--surface)] pb-[env(safe-area-inset-bottom)]">
      <div className="grid grid-cols-5">
        {items.map((it) => {
          const Icon = it.icon;
          const active =
            it.href === "/" ? pathname === "/" : pathname.startsWith(it.href);
          return (
            <Link
              key={it.href}
              href={it.href}
              className={`flex flex-col items-center justify-center gap-1 py-2.5 text-[10px] font-medium transition-colors relative ${
                active
                  ? "text-[var(--accent)]"
                  : "text-[var(--muted)] hover:text-foreground"
              }`}
            >
              {active && (
                <span className="absolute top-0 inset-x-6 h-0.5 rounded-full bg-[var(--accent)]" />
              )}
              <Icon size={20} strokeWidth={active ? 2.5 : 2} />
              {it.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
