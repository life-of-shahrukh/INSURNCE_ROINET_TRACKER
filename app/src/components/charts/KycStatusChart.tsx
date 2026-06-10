"use client";

import {
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

export interface KycStatusRow {
  kycStatus: string;
  count: number;
}

interface Props {
  data: KycStatusRow[];
}

const KYC_CONFIG: Record<string, { label: string; color: string }> = {
  VERIFIED: { label: "Verified", color: "#2a9d8f" },
  PENDING: { label: "Pending", color: "#f4a261" },
  REJECTED: { label: "Rejected", color: "#e63946" },
};

export function KycStatusChart({ data }: Props): React.ReactElement {
  const chartData = data
    .map(({ kycStatus, count }) => ({
      name: KYC_CONFIG[kycStatus]?.label ?? kycStatus,
      value: count,
      color: KYC_CONFIG[kycStatus]?.color ?? "#888",
    }))
    .filter((d) => d.value > 0);

  if (chartData.length === 0) {
    return <div className="empty">No customer KYC data.</div>;
  }

  return (
    <ResponsiveContainer width="100%" height={260}>
      <PieChart>
        <Pie
          data={chartData}
          cx="50%"
          cy="50%"
          innerRadius={55}
          outerRadius={95}
          paddingAngle={3}
          dataKey="value"
        >
          {chartData.map((entry) => (
            <Cell key={entry.name} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip formatter={(v) => [v, "Customers"]} />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
}
