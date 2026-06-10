"use client";

import {
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

export interface TimelineRow {
  timeline: string;
  count: number;
}

interface Props {
  data: TimelineRow[];
}

const TIMELINE_CONFIG: Record<string, { label: string; color: string }> = {
  THIS_MONTH: { label: "This Month", color: "#e63946" },
  T_PLUS_1: { label: "T+1 Month", color: "#f4a261" },
  T_PLUS_2: { label: "T+2 Months", color: "#3282b8" },
  LATER: { label: "Later", color: "#6c8bb8" },
};

export function ClosureTimelineChart({ data }: Props): React.ReactElement {
  const chartData = data
    .map(({ timeline, count }) => ({
      name: TIMELINE_CONFIG[timeline]?.label ?? timeline,
      value: count,
      color: TIMELINE_CONFIG[timeline]?.color ?? "#888",
    }))
    .filter((d) => d.value > 0);

  if (chartData.length === 0) {
    return <div className="empty">No closure timeline data.</div>;
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
          label={({
            name,
            percent,
          }: {
            name?: string;
            percent?: number;
          }) => `${name ?? ""} ${((percent ?? 0) * 100).toFixed(0)}%`}
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
