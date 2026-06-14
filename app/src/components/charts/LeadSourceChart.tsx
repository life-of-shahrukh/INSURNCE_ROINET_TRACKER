"use client";

import {
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";

const COLORS = [
  "#0f4c75", "#1b6ca8", "#2196f3", "#64b5f6",
  "#90caf9", "#bbdefb", "#e3f2fd", "#b0bec5",
];

interface Row {
  source: string;
  count: number;
}

interface Props {
  data: Row[];
}

export function LeadSourceChart({ data }: Props): React.ReactElement {
  if (data.length === 0) {
    return <div className="chart-empty">No lead source data.</div>;
  }

  return (
    <ResponsiveContainer width="100%" height={240}>
      <PieChart>
        <Pie
          data={data}
          dataKey="count"
          nameKey="source"
          cx="50%"
          cy="50%"
          outerRadius={80}
          label={({ source, percent }: { source: string; percent: number }) =>
            `${source} ${(percent * 100).toFixed(0)}%`
          }
          labelLine={false}
        >
          {data.map((_, i) => (
            <Cell key={i} fill={COLORS[i % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip formatter={(v: unknown) => [String(v), "Leads"]} />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
}
