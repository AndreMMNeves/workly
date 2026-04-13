"use client";

import { useMemo } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useAccounts, useTransactions } from "@/lib/data";
import { brl, monthKey } from "@/lib/format";

const WEEK_DAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

export default function RelatoriosPage() {
  const accounts = useAccounts();
  const transactions = useTransactions();

  const monthlyCompare = useMemo(() => {
    const map = new Map<string, { income: number; expense: number }>();
    for (const t of transactions) {
      const k = monthKey(t.date);
      const cur = map.get(k) ?? { income: 0, expense: 0 };
      if (t.amount > 0) cur.income += t.amount;
      else cur.expense += -t.amount;
      map.set(k, cur);
    }
    return Array.from(map.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-12)
      .map(([k, v]) => {
        const [y, m] = k.split("-");
        return {
          label: new Date(Number(y), Number(m) - 1, 1).toLocaleDateString("pt-BR", {
            month: "short",
          }),
          Entradas: v.income,
          Saídas: v.expense,
        };
      });
  }, [transactions]);

  const weekdayFreq = useMemo(() => {
    const arr = WEEK_DAYS.map((d) => ({ label: d, count: 0, total: 0 }));
    for (const t of transactions) {
      if (t.amount >= 0) continue;
      const d = new Date(t.date + "T12:00:00").getDay();
      arr[d].count += 1;
      arr[d].total += -t.amount;
    }
    return arr;
  }, [transactions]);

  const topCategories = useMemo(() => {
    const map = new Map<string, number>();
    for (const t of transactions) {
      if (t.amount >= 0) continue;
      map.set(t.category, (map.get(t.category) ?? 0) + -t.amount);
    }
    return Array.from(map.entries())
      .sort(([, a], [, b]) => b - a)
      .slice(0, 8)
      .map(([name, value]) => ({ name, value }));
  }, [transactions]);

  const topMerchants = useMemo(() => {
    const map = new Map<string, { total: number; count: number }>();
    for (const t of transactions) {
      if (t.amount >= 0) continue;
      const key = t.merchant?.trim() || t.description?.trim() || "(sem nome)";
      const cur = map.get(key) ?? { total: 0, count: 0 };
      cur.total += -t.amount;
      cur.count += 1;
      map.set(key, cur);
    }
    return Array.from(map.entries())
      .sort(([, a], [, b]) => b.total - a.total)
      .slice(0, 10)
      .map(([name, v]) => ({ name, ...v }));
  }, [transactions]);

  const totalExpense = topCategories.reduce((a, b) => a + b.value, 0);

  const accountShare = useMemo(() => {
    const map = new Map<string, number>();
    for (const t of transactions) {
      if (t.amount >= 0) continue;
      map.set(t.accountId, (map.get(t.accountId) ?? 0) + -t.amount);
    }
    return accounts
      .map((a) => ({ name: a.name, color: a.color, value: map.get(a.id) ?? 0 }))
      .filter((x) => x.value > 0)
      .sort((a, b) => b.value - a.value);
  }, [accounts, transactions]);

  const tooltipStyle = {
    background: "#111a2e",
    border: "1px solid #1f2d47",
    borderRadius: 12,
    color: "#e6ecf5",
  } as const;

  return (
    <>
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Relatórios</h1>
        <p className="text-sm text-[var(--muted)]">
          Compare meses, descubra onde está gastando e detecte padrões.
        </p>
      </header>

      <section className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card title="Entradas × Saídas (12 meses)">
          {monthlyCompare.length === 0 ? (
            <Empty />
          ) : (
            <div className="h-72">
              <ResponsiveContainer>
                <BarChart data={monthlyCompare}>
                  <CartesianGrid stroke="#1f2d47" vertical={false} />
                  <XAxis dataKey="label" stroke="#8a97b1" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#8a97b1" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => brl(Number(v)).replace("R$", "").trim()} width={70} />
                  <Tooltip contentStyle={tooltipStyle} formatter={(v) => brl(Number(v))} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Bar dataKey="Entradas" fill="#34e3b0" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="Saídas" fill="#ef6b6b" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>

        <Card title="Frequência de gastos por dia da semana">
          {transactions.length === 0 ? (
            <Empty />
          ) : (
            <div className="h-72">
              <ResponsiveContainer>
                <BarChart data={weekdayFreq}>
                  <CartesianGrid stroke="#1f2d47" vertical={false} />
                  <XAxis dataKey="label" stroke="#8a97b1" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#8a97b1" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip
                    contentStyle={tooltipStyle}
                    formatter={(v, name, p) => [
                      `${v} transações · ${brl(p.payload.total)}`,
                      "Frequência",
                    ]}
                  />
                  <Bar dataKey="count" fill="#34e3b0" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>

        <Card title="Top categorias de gasto">
          {topCategories.length === 0 ? (
            <Empty />
          ) : (
            <ul className="space-y-3">
              {topCategories.map((c) => {
                const pct = totalExpense ? (c.value / totalExpense) * 100 : 0;
                return (
                  <li key={c.name}>
                    <div className="flex items-center justify-between text-sm">
                      <span>{c.name}</span>
                      <span className="text-[var(--muted)]">
                        {brl(c.value)} · {pct.toFixed(0)}%
                      </span>
                    </div>
                    <div className="mt-1 h-2 rounded-full bg-[var(--surface-2)] overflow-hidden">
                      <div
                        className="h-full bg-[var(--accent)]"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>

        <Card title="Onde você mais gasta">
          {topMerchants.length === 0 ? (
            <Empty />
          ) : (
            <ul className="divide-y divide-[var(--border)]">
              {topMerchants.map((m) => (
                <li key={m.name} className="flex items-center justify-between py-2 text-sm">
                  <div>
                    <div className="font-medium">{m.name}</div>
                    <div className="text-xs text-[var(--muted)]">{m.count} compras</div>
                  </div>
                  <div className="text-[var(--danger)] font-semibold">-{brl(m.total)}</div>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card title="Gasto por conta" className="lg:col-span-2">
          {accountShare.length === 0 ? (
            <Empty />
          ) : (
            <div className="h-64">
              <ResponsiveContainer>
                <BarChart data={accountShare} layout="vertical">
                  <CartesianGrid stroke="#1f2d47" horizontal={false} />
                  <XAxis type="number" stroke="#8a97b1" fontSize={12} tickFormatter={(v) => brl(Number(v)).replace("R$", "").trim()} />
                  <YAxis dataKey="name" type="category" stroke="#8a97b1" fontSize={12} width={120} />
                  <Tooltip contentStyle={tooltipStyle} formatter={(v) => brl(Number(v))} />
                  <Bar dataKey="value" radius={[0, 6, 6, 0]}>
                    {accountShare.map((a) => (
                      <Cell key={a.name} fill={a.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>
      </section>
    </>
  );
}

function Card({ title, children, className = "" }: { title: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 ${className}`}>
      <h2 className="text-sm font-semibold mb-4">{title}</h2>
      {children}
    </div>
  );
}

function Empty() {
  return (
    <div className="h-48 grid place-items-center text-sm text-[var(--muted)]">
      Sem dados ainda.
    </div>
  );
}
