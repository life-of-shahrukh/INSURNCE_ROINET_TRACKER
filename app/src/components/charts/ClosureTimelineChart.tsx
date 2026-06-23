"use client";

import {
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { CLOSURE_TIMELINE_META } from "@/lib/closure-timeline";

export interface TimelineRow {
  timeline: string;
  count: number;
}

interface Props {
  data: TimelineRow[];
}

export function ClosureTimelineChart({ data }: Props): React.ReactElement {
  const chartData = data
    .map(({ timeline, count }) => {
      const meta =
        CLOSURE_TIMELINE_META[timeline as keyof typeof CLOSURE_TIMELINE_META];
      return {
        name: meta ? `${meta.label} (${meta.subtitle})` : timeline,
        value: count,
        color: meta?.color ?? "#888",
      };
    })
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
