"use client";

import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

export interface DealsByStatusData {
  hot: number;
  warm: number;
  cold: number;
  /** Raw status breakdown when H/W/C counts don't cover all statuses */
  byStatus?: Array<{ status: string; count: number }>;
}

interface Props {
  data: DealsByStatusData;
}

const KNOWN_COLORS: Record<string, string> = {
  H: "#e63946",
  W: "#f4a261",
  C: "#6c8bb8",
  D: "#22c55e",
  ACTIVE: "#6366f1",
  ISSUED: "#22c55e",
  PENDING: "#f59e0b",
  CANCELLED: "#9ca3af",
};

const PALETTE = ["#6366f1", "#f59e0b", "#22c55e", "#e63946", "#f4a261", "#6c8bb8", "#a78bfa"];

const STATUS_LABEL: Record<string, string> = {
  H: "Hot", W: "Warm", C: "Cold", D: "Done",
  ACTIVE: "Active", ISSUED: "Issued", PENDING: "Pending",
  CANCELLED: "Cancelled",
};

export function DealsByStatusChart({ data }: Props): React.ReactElement {
  // Prefer byStatus (raw) over hotCount/warmCount/coldCount
  let chartData: { name: string; value: number; color: string }[] = [];

  if (data.byStatus && data.byStatus.length > 0) {
    chartData = data.byStatus
      .filter((s) => s.count > 0)
      .map((s, i) => ({
        name: STATUS_LABEL[s.status] ?? s.status,
        value: s.count,
        color: KNOWN_COLORS[s.status] ?? PALETTE[i % PALETTE.length],
      }));
  } else {
    // Fallback to H/W/C
    const slices = [
      { key: "hot" as const, name: "Hot", color: "#e63946" },
      { key: "warm" as const, name: "Warm", color: "#f4a261" },
      { key: "cold" as const, name: "Cold", color: "#6c8bb8" },
    ];
    chartData = slices
      .filter((s) => data[s.key] > 0)
      .map((s) => ({ name: s.name, value: data[s.key], color: s.color }));
  }

  if (chartData.length === 0) {
    return <div className="empty">No deal data yet.</div>;
  }

  return (
    <ResponsiveContainer width="100%" height={260}>
      <PieChart>
        <Pie
          data={chartData}
          cx="50%"
          cy="50%"
          innerRadius={60}
          outerRadius={95}
          paddingAngle={3}
          dataKey="value"
        >
          {chartData.map((entry) => (
            <Cell key={entry.name} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip formatter={(value) => [value, "Deals"]} />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
}
