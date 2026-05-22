"use client";

import { Bar } from "react-chartjs-2";
import { registerCharts } from "@/lib/chart-setup";
import type { Deal } from "@/lib/types";

registerCharts();

interface Props {
  deals: Deal[];
}

export function ConversionFunnelChart({ deals }: Props) {
  const total = deals.length;
  const hot = deals.filter((d) => d.status === "H").length;
  const warm = deals.filter((d) => d.status === "W").length;
  const issued = deals.filter((d) => d.policyNo).length;

  return (
    <div className="chart-wrap">
      <Bar
        data={{
          labels: ["All Deals", "Warm+", "Hot", "Issued"],
          datasets: [
            {
              data: [total, warm + hot, hot, issued],
              backgroundColor: ["#6c8bb8", "#f4a261", "#e63946", "#2a9d8f"],
            },
          ],
        }}
        options={{
          indexAxis: "y" as const,
          plugins: { legend: { display: false } },
          maintainAspectRatio: false,
        }}
      />
    </div>
  );
}
