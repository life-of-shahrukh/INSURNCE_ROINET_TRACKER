"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { fmtINRShort } from "@/lib/formatters";

export interface PolicyPremiumRow {
  policy: string;
  premium: number;
  count: number;
}

interface Props {
  data: PolicyPremiumRow[];
}

export function PremiumByPolicyChart({ data }: Props): React.ReactElement {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data} margin={{ top: 8, right: 16, left: 8, bottom: 8 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="policy" tick={{ fontSize: 12 }} />
        <YAxis
          tickFormatter={(v: number) => fmtINRShort(v)}
          tick={{ fontSize: 11 }}
          width={72}
        />
        <Tooltip formatter={(v) => [fmtINRShort(Number(v)), "Premium"]} />
        <Bar dataKey="premium" fill="#3282b8" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
