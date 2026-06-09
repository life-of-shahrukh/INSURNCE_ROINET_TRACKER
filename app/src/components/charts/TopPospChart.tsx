"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { fmtINRShort } from "@/lib/formatters";
import type { Deal, Posp } from "@/lib/types";

interface Props {
  deals: Deal[];
  posp: Posp[];
}

export function TopPospChart({ deals, posp }: Props): React.ReactElement {
  const data = posp
    .map((p) => ({
      name: p.name,
      premium: deals
        .filter((d) => d.pospId === p.id)
        .reduce((a, d) => a + (+d.premium || 0), 0),
    }))
    .sort((a, b) => b.premium - a.premium)
    .slice(0, 5);

  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart
        data={data}
        layout="vertical"
        margin={{ top: 8, right: 80, left: 8, bottom: 8 }}
      >
        <CartesianGrid strokeDasharray="3 3" horizontal={false} />
        <XAxis
          type="number"
          tickFormatter={(v: number) => fmtINRShort(v)}
          tick={{ fontSize: 11 }}
        />
        <YAxis type="category" dataKey="name" width={110} tick={{ fontSize: 12 }} />
        <Tooltip formatter={(v) => [fmtINRShort(Number(v)), "Premium"]} />
        <Bar dataKey="premium" fill="#0f4c75" radius={[0, 4, 4, 0]}>
          <LabelList
            dataKey="premium"
            position="right"
            formatter={(v: unknown) => fmtINRShort(Number(v))}
            style={{ fontSize: 11, fill: "#555" }}
          />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
