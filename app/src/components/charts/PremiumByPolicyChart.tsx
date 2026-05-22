"use client";

import { Bar } from "react-chartjs-2";
import { registerCharts } from "@/lib/chart-setup";
import { fmtINRShort } from "@/lib/formatters";
import type { Deal } from "@/lib/types";

registerCharts();

interface Props {
  deals: Deal[];
}

export function PremiumByPolicyChart({ deals }: Props) {
  const pSums: Record<string, number> = {};
  deals.forEach((d) => {
    pSums[d.policy] = (pSums[d.policy] || 0) + (+d.premium || 0);
  });

  return (
    <div className="chart-wrap">
      <Bar
        data={{
          labels: Object.keys(pSums),
          datasets: [{ label: "Premium", data: Object.values(pSums), backgroundColor: "#3282b8" }],
        }}
        options={{
          plugins: { legend: { display: false } },
          maintainAspectRatio: false,
          scales: {
            y: { ticks: { callback: (v) => fmtINRShort(Number(v)) } },
          },
        }}
      />
    </div>
  );
}
