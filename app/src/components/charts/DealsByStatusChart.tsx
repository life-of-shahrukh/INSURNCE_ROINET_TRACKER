"use client";

import {
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

export interface DealsByStatusData {
  hot: number;
  warm: number;
  cold: number;
}

interface Props {
  data: DealsByStatusData;
}

const STATUS_SLICES = [
  { key: "hot" as const, name: "Hot", color: "#e63946" },
  { key: "warm" as const, name: "Warm", color: "#f4a261" },
  { key: "cold" as const, name: "Cold", color: "#6c8bb8" },
];

export function DealsByStatusChart({ data }: Props): React.ReactElement {
  const chartData = STATUS_SLICES.map(({ key, name, color }) => ({
    name,
    value: data[key],
    color,
  }));

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
