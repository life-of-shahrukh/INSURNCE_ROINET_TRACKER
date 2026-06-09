"use client";

import {
  Bar,
  BarChart,
  Cell,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { Deal } from "@/lib/types";

interface Props {
  deals: Deal[];
}

const FUNNEL_COLORS = ["#6c8bb8", "#f4a261", "#e63946", "#2a9d8f"];

export function ConversionFunnelChart({ deals }: Props): React.ReactElement {
  const total = deals.length;
  const hot = deals.filter((d) => d.status === "H").length;
  const warm = deals.filter((d) => d.status === "W").length;
  const issued = deals.filter((d) => d.policyNo).length;

  const data = [
    { stage: "All Deals", count: total },
    { stage: "Warm+", count: warm + hot },
    { stage: "Hot", count: hot },
    { stage: "Issued", count: issued },
  ];

  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart
        data={data}
        layout="vertical"
        margin={{ top: 8, right: 56, left: 8, bottom: 8 }}
      >
        <XAxis type="number" hide />
        <YAxis type="category" dataKey="stage" width={80} tick={{ fontSize: 12 }} />
        <Tooltip formatter={(v) => [v, "Count"]} />
        <Bar dataKey="count" radius={[0, 4, 4, 0]}>
          {data.map((_, idx) => (
            <Cell key={idx} fill={FUNNEL_COLORS[idx]} />
          ))}
          <LabelList
            dataKey="count"
            position="right"
            style={{ fontSize: 13, fontWeight: 600, fill: "#333" }}
          />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
