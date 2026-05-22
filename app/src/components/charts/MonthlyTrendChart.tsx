"use client";

import { Line } from "react-chartjs-2";
import { registerCharts } from "@/lib/chart-setup";
import { fmtINRShort } from "@/lib/formatters";
import type { Deal } from "@/lib/types";

registerCharts();

interface Props {
  deals: Deal[];
}

export function MonthlyTrendChart({ deals }: Props) {
  const monthly: Record<string, number> = {};
  deals.forEach((d) => {
    if (!d.expected) return;
    const m = d.expected.slice(0, 7);
    monthly[m] = (monthly[m] || 0) + (+d.premium || 0);
  });
  const months = Object.keys(monthly).sort();

  return (
    <div className="chart-wrap">
      <Line
        data={{
          labels: months,
          datasets: [
            {
              label: "Expected Premium",
              data: months.map((m) => monthly[m]),
              borderColor: "#0f4c75",
              backgroundColor: "rgba(50,130,184,0.15)",
              fill: true,
              tension: 0.3,
              pointBackgroundColor: "#0f4c75",
            },
          ],
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
