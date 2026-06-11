"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { Deal } from "@/lib/types";

interface Props {
  deals: Deal[];
}

const STAGE_COLORS: Record<string, string> = {
  Leads: "#bbe1fa",
  "Warm+": "#f4a261",
  Hot: "#e63946",
  Issued: "#2a9d8f",
};

const STAGES = ["Leads", "Warm+", "Hot", "Issued"] as const;

export function ProductFunnelChart({ deals }: Props): React.ReactElement {
  const products = [...new Set(deals.map((d) => d.policy))];

  const data = products.map((product) => {
    const items = deals.filter((d) => d.policy === product);
    return {
      product,
      Leads: items.length,
      "Warm+": items.filter((d) => d.status === "W" || d.status === "H").length,
      Hot: items.filter((d) => d.status === "H").length,
      Issued: items.filter((d) => d.policyNo).length,
    };
  });

  return (
    <ResponsiveContainer width="100%" height={320}>
      <BarChart data={data} margin={{ top: 8, right: 16, left: 8, bottom: 8 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="product" tick={{ fontSize: 12 }} />
        <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
        <Tooltip />
        <Legend />
        {STAGES.map((stage) => (
          <Bar key={stage} dataKey={stage} fill={STAGE_COLORS[stage]} radius={[3, 3, 0, 0]} />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}
