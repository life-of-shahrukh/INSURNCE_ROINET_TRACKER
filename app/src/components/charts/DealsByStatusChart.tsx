"use client";

import { Doughnut } from "react-chartjs-2";
import { registerCharts } from "@/lib/chart-setup";
import type { Deal } from "@/lib/types";

registerCharts();

interface Props {
  deals: Deal[];
}

export function DealsByStatusChart({ deals }: Props) {
  const sCounts = { Hot: 0, Warm: 0, Cold: 0 };
  deals.forEach((d) => {
    const key = { H: "Hot", W: "Warm", C: "Cold" }[d.status] as keyof typeof sCounts;
    sCounts[key]++;
  });

  return (
    <div className="chart-wrap">
      <Doughnut
        data={{
          labels: Object.keys(sCounts),
          datasets: [
            {
              data: Object.values(sCounts),
              backgroundColor: ["#e63946", "#f4a261", "#6c8bb8"],
              borderWidth: 0,
            },
          ],
        }}
        options={{
          plugins: { legend: { position: "bottom" } },
          maintainAspectRatio: false,
        }}
      />
    </div>
  );
}
