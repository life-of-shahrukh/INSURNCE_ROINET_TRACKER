"use client";

import {
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import type { Customer } from "@/lib/types";

interface Props {
  customers: Customer[];
}

const KYC_CONFIG = [
  { key: "VERIFIED", label: "Verified", color: "#2a9d8f" },
  { key: "PENDING", label: "Pending", color: "#f4a261" },
  { key: "REJECTED", label: "Rejected", color: "#e63946" },
] as const;

export function KycStatusChart({ customers }: Props): React.ReactElement {
  const data = KYC_CONFIG.map(({ key, label, color }) => ({
    name: label,
    value: customers.filter((c) => c.kycStatus === key).length,
    color,
  })).filter((d) => d.value > 0);

  if (data.length === 0) {
    return <div className="empty">No customer KYC data.</div>;
  }

  return (
    <ResponsiveContainer width="100%" height={260}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={55}
          outerRadius={95}
          paddingAngle={3}
          dataKey="value"
        >
          {data.map((entry) => (
            <Cell key={entry.name} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip formatter={(v) => [v, "Customers"]} />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
}
