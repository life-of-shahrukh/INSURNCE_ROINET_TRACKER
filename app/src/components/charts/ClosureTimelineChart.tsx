"use client";

import {
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import type { Lead } from "@/lib/api/lead-api";

interface Props {
  leads: Lead[];
}

const TIMELINE_CONFIG = [
  { key: "THIS_MONTH", label: "This Month", color: "#e63946" },
  { key: "T_PLUS_1", label: "T+1 Month", color: "#f4a261" },
  { key: "T_PLUS_2", label: "T+2 Months", color: "#3282b8" },
  { key: "LATER", label: "Later", color: "#6c8bb8" },
] as const;

export function ClosureTimelineChart({ leads }: Props): React.ReactElement {
  const data = TIMELINE_CONFIG.map(({ key, label, color }) => ({
    name: label,
    value: leads.filter((l) => l.closureTimeline === key).length,
    color,
  })).filter((d) => d.value > 0);

  if (data.length === 0) {
    return <div className="empty">No closure timeline data.</div>;
  }

  return (
    <ResponsiveContainer width="100%" height={260}>
      <PieChart>
        <Pie
          data={data}
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
          {data.map((entry) => (
            <Cell key={entry.name} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip formatter={(v) => [v, "Leads"]} />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
}
