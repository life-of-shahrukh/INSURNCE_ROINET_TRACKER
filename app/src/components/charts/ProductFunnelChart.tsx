"use client";

import { Bar } from "react-chartjs-2";
import { registerCharts } from "@/lib/chart-setup";
import type { Deal } from "@/lib/types";

registerCharts();

const STAGE_COLORS: Record<string, string> = {
  Leads: "#bbe1fa",
  "Warm+": "#f4a261",
  Hot: "#e63946",
  Issued: "#2a9d8f",
};

interface Props {
  deals: Deal[];
}

export function ProductFunnelChart({ deals }: Props) {
  const products = [...new Set(deals.map((d) => d.policy))];
  const stages = Object.keys(STAGE_COLORS);

  const stageData = (stage: string) =>
    products.map((prod) => {
      const items = deals.filter((d) => d.policy === prod);
      if (stage === "Leads") return items.length;
      if (stage === "Warm+") return items.filter((d) => d.status === "W" || d.status === "H").length;
      if (stage === "Hot") return items.filter((d) => d.status === "H").length;
      if (stage === "Issued") return items.filter((d) => d.policyNo).length;
      return 0;
    });

  return (
    <div className="chart-wrap tall">
      <Bar
        data={{
          labels: products,
          datasets: stages.map((stage) => ({
            label: stage,
            data: stageData(stage),
            backgroundColor: STAGE_COLORS[stage],
            borderWidth: 0,
          })),
        }}
        options={{
          maintainAspectRatio: false,
          plugins: {
            legend: { position: "bottom" },
            tooltip: { mode: "index", intersect: false },
          },
          scales: {
            x: { stacked: false, ticks: { autoSkip: false } },
            y: { beginAtZero: true, ticks: { stepSize: 1, precision: 0 } },
          },
        }}
      />
    </div>
  );
}
