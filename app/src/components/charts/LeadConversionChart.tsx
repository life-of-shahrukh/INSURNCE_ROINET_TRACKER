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
import type { Lead } from "@/lib/api/lead-api";

interface Props {
  leads: Lead[];
}

const PRODUCTS = ["HEALTH", "MOTOR", "LIFE", "TRAVEL", "COMMERCIAL_LINES", "RURAL", "HOME"] as const;

export function LeadConversionChart({ leads }: Props): React.ReactElement {
  const data = PRODUCTS.map((product) => {
    const group = leads.filter((l) => l.product === product);
    return {
      product,
      Won: group.filter((l) => l.status === "WON").length,
      Lost: group.filter((l) => l.status === "LOST").length,
      Active: group.filter((l) => l.status !== "WON" && l.status !== "LOST").length,
    };
  });

  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data} margin={{ top: 8, right: 16, left: 8, bottom: 8 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="product" tick={{ fontSize: 12 }} />
        <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
        <Tooltip />
        <Legend />
        <Bar dataKey="Won" stackId="a" fill="#2a9d8f" radius={[0, 0, 0, 0]} />
        <Bar dataKey="Active" stackId="a" fill="#f4a261" />
        <Bar dataKey="Lost" stackId="a" fill="#e63946" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
