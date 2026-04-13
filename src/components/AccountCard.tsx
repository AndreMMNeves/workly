"use client";

import { brl } from "@/lib/format";
import { useHideValues } from "@/lib/hideValues";
import type { Account } from "@/lib/data";

export default function AccountCard({
  account,
  balance,
}: {
  account: Account;
  balance: number;
}) {
  const { mask } = useHideValues();
  return (
    <div
      className="relative overflow-hidden rounded-2xl p-5 text-white shadow-lg"
      style={{
        background: `linear-gradient(135deg, ${account.color}, ${account.color}88 60%, #0b1220)`,
      }}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs uppercase tracking-widest opacity-80">
          {account.name}
        </span>
        <span className="text-xs opacity-70">•••• 0000</span>
      </div>
      <div className="mt-8">
        <div className="text-xs opacity-70">Saldo atual</div>
        <div className="text-2xl font-semibold tracking-tight">
          {mask(brl(balance))}
        </div>
      </div>
      <div className="pointer-events-none absolute -right-10 -bottom-10 h-32 w-32 rounded-full bg-white/10 blur-2xl" />
    </div>
  );
}
