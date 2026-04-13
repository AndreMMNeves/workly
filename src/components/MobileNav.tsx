"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  { href: "/", label: "Início", icon: "◎" },
  { href: "/transacoes", label: "Transações", icon: "⇅" },
  { href: "/orcamentos", label: "Orçamento", icon: "◈" },
  { href: "/relatorios", label: "Relatórios", icon: "◢" },
  { href: "/ajustes", label: "Mais", icon: "⚙" },
];

export default function MobileNav() {
  const pathname = usePathname();
  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 border-t border-[var(--border)] bg-[var(--surface)]/95 backdrop-blur">
      <div className="grid grid-cols-5">
        {items.map((it) => {
          const active =
            it.href === "/" ? pathname === "/" : pathname.startsWith(it.href);
          return (
            <Link
              key={it.href}
              href={it.href}
              className={`flex flex-col items-center justify-center gap-0.5 py-3 text-[10px] ${
                active ? "text-[var(--accent)]" : "text-[var(--muted)]"
              }`}
            >
              <span className="text-lg leading-none">{it.icon}</span>
              {it.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
