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

interface Row {
  month: string;
  premium: number;
  count: number;
}

interface Props {
  data: Row[];
}

export function MonthlyPremiumChart({ data }: Props): React.ReactElement {
  if (data.length === 0) {
    return <div className="chart-empty">No trend data for this period.</div>;
  }

  const displayData = data.map((d) => ({
    ...d,
    label: d.month.slice(0, 7), // "YYYY-MM"
  }));

  return (
    <ResponsiveContainer width="100%" height={240}>
      <AreaChart data={displayData} margin={{ top: 8, right: 16, left: 8, bottom: 8 }}>
        <defs>
          <linearGradient id="premGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#0f4c75" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#0f4c75" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="label" tick={{ fontSize: 11 }} />
        <YAxis tickFormatter={(v: number) => fmtINRShort(v)} tick={{ fontSize: 11 }} width={72} />
        <Tooltip
          formatter={(v: unknown, name: string) => [
            name === "premium" ? fmtINRShort(Number(v)) : v,
            name === "premium" ? "Premium" : "Deals",
          ]}
        />
        <Area
          type="monotone"
          dataKey="premium"
          stroke="#0f4c75"
          fill="url(#premGrad)"
          strokeWidth={2}
          dot={false}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
