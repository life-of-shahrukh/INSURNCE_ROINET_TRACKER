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
import type { Deal } from "@/lib/types";

interface Props {
  deals: Deal[];
}

export function PremiumByPolicyChart({ deals }: Props): React.ReactElement {
  const pSums: Record<string, number> = {};
  deals.forEach((d) => {
    pSums[d.policy] = (pSums[d.policy] ?? 0) + (+d.premium || 0);
  });

  const data = Object.entries(pSums).map(([policy, premium]) => ({
    policy,
    premium,
  }));

  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data} margin={{ top: 8, right: 16, left: 8, bottom: 8 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="policy" tick={{ fontSize: 12 }} />
        <YAxis tickFormatter={(v: number) => fmtINRShort(v)} tick={{ fontSize: 11 }} width={72} />
        <Tooltip formatter={(v) => [fmtINRShort(Number(v)), "Premium"]} />
        <Bar dataKey="premium" fill="#3282b8" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
