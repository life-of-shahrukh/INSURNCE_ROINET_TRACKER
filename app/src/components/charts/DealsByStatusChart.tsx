"use client";

import {
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import type { Deal } from "@/lib/types";

interface Props {
  deals: Deal[];
}

const STATUS_DATA = [
  { key: "H", name: "Hot", color: "#e63946" },
  { key: "W", name: "Warm", color: "#f4a261" },
  { key: "C", name: "Cold", color: "#6c8bb8" },
] as const;

export function DealsByStatusChart({ deals }: Props): React.ReactElement {
  const data = STATUS_DATA.map(({ key, name, color }) => ({
    name,
    value: deals.filter((d) => d.status === key).length,
    color,
  }));

  return (
    <ResponsiveContainer width="100%" height={260}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={60}
          outerRadius={95}
          paddingAngle={3}
          dataKey="value"
        >
          {data.map((entry) => (
            <Cell key={entry.name} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip formatter={(value) => [value, "Deals"]} />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
}
