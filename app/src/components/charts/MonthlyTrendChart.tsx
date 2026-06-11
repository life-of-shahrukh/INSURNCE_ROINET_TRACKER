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
import { fmtINRShort } from "@/lib/formatters";
import type { Deal } from "@/lib/types";

interface Props {
  deals: Deal[];
}

export function MonthlyTrendChart({ deals }: Props): React.ReactElement {
  const monthly: Record<string, number> = {};
  deals.forEach((d) => {
    if (!d.expected) return;
    const m = new Date(d.expected).toISOString().slice(0, 7);
    monthly[m] = (monthly[m] ?? 0) + (+d.premium || 0);
  });

  const data = Object.keys(monthly)
    .sort()
    .map((month) => ({ month, premium: monthly[month] }));

  return (
    <ResponsiveContainer width="100%" height={260}>
      <AreaChart data={data} margin={{ top: 8, right: 16, left: 8, bottom: 8 }}>
        <defs>
          <linearGradient id="premiumGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#3282b8" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#3282b8" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="month" tick={{ fontSize: 11 }} />
        <YAxis
          tickFormatter={(v: number) => fmtINRShort(v)}
          tick={{ fontSize: 11 }}
          width={72}
        />
        <Tooltip formatter={(v) => [fmtINRShort(Number(v)), "Expected Premium"]} />
        <Area
          type="monotone"
          dataKey="premium"
          stroke="#0f4c75"
          strokeWidth={2}
          fill="url(#premiumGradient)"
          dot={{ r: 4, fill: "#0f4c75" }}
          activeDot={{ r: 6 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
