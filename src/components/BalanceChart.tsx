"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { brl } from "@/lib/format";

export default function BalanceChart({
  data,
}: {
  data: { label: string; value: number }[];
}) {
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="balanceFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#34e3b0" stopOpacity={0.5} />
              <stop offset="100%" stopColor="#34e3b0" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="#1f2d47" vertical={false} />
          <XAxis dataKey="label" stroke="#8a97b1" fontSize={12} tickLine={false} axisLine={false} />
          <YAxis
            stroke="#8a97b1"
            fontSize={12}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v) => brl(Number(v)).replace("R$", "").trim()}
            width={70}
          />
          <Tooltip
            contentStyle={{
              background: "#111a2e",
              border: "1px solid #1f2d47",
              borderRadius: 12,
              color: "#e6ecf5",
            }}
            formatter={(v) => brl(Number(v))}
          />
          <Area
            type="monotone"
            dataKey="value"
            stroke="#34e3b0"
            strokeWidth={2}
            fill="url(#balanceFill)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
