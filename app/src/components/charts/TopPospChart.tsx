"use client";

import { Bar } from "react-chartjs-2";
import { registerCharts } from "@/lib/chart-setup";
import { fmtINRShort } from "@/lib/formatters";
import type { Deal, Posp } from "@/lib/types";

registerCharts();

interface Props {
  deals: Deal[];
  posp: Posp[];
}

export function TopPospChart({ deals, posp }: Props) {
  const pospTotals = posp
    .map((p) => ({
      name: p.name,
      total: deals.filter((d) => d.pospId === p.id).reduce((a, d) => a + (+d.premium || 0), 0),
    }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 5);

  return (
    <div className="chart-wrap">
      <Bar
        data={{
          labels: pospTotals.map((p) => p.name),
          datasets: [
            { label: "Premium", data: pospTotals.map((p) => p.total), backgroundColor: "#0f4c75" },
          ],
        }}
        options={{
          indexAxis: "y" as const,
          plugins: { legend: { display: false } },
          maintainAspectRatio: false,
          scales: {
            x: { ticks: { callback: (v) => fmtINRShort(Number(v)) } },
          },
        }}
      />
    </div>
  );
}
