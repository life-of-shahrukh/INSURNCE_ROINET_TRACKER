"use client";

import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

export interface LeadStatusRow {
  status: string;
  count: number;
}

interface Props {
  data: LeadStatusRow[];
}

const PIPELINE_COLORS: Record<string, string> = {
  NEW:           "#6366f1",
  CONTACTED:     "#0284c7",
  QUALIFIED:     "#7c3aed",
  PROPOSAL_SENT: "#d97706",
  WON:           "#16a34a",
  LOST:          "#dc2626",
};

const PIPELINE_LABELS: Record<string, string> = {
  NEW:           "New",
  CONTACTED:     "Contacted",
  QUALIFIED:     "Qualified",
  PROPOSAL_SENT: "Proposal Sent",
  WON:           "Won",
  LOST:          "Lost",
};

const FALLBACK_PALETTE = ["#6366f1", "#0284c7", "#7c3aed", "#d97706", "#16a34a", "#dc2626"];

export function LeadStatusChart({ data }: Props): React.ReactElement {
  const chartData = data
    .filter((row) => row.count > 0)
    .map((row, i) => ({
      name: PIPELINE_LABELS[row.status] ?? row.status,
      value: row.count,
      color: PIPELINE_COLORS[row.status] ?? FALLBACK_PALETTE[i % FALLBACK_PALETTE.length],
    }));

  if (chartData.length === 0) {
    return <div className="empty">No lead status data yet.</div>;
  }

  return (
    <ResponsiveContainer width="100%" height={260}>
      <PieChart>
        <Pie
          data={chartData}
          cx="50%"
          cy="50%"
          outerRadius={95}
          paddingAngle={2}
          dataKey="value"
          label={({ name, percent }: { name?: string; percent?: number }) =>
            `${name ?? ""} ${((percent ?? 0) * 100).toFixed(0)}%`
          }
          labelLine={false}
        >
          {chartData.map((entry) => (
            <Cell key={entry.name} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip formatter={(v) => [v, "Leads"]} />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
}
