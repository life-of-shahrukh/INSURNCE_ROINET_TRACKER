"use client";

import {
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import type { Deal, Posp } from "@/lib/types";
import { formatPospLabel } from "@/lib/posp-display";

interface Props {
  deals: Deal[];
  posp: Posp[];
}

function normalize(value: number, max: number): number {
  if (max === 0) return 0;
  return Math.round((value / max) * 100);
}

export function PospActivityRadarChart({ deals, posp }: Props): React.ReactElement {
  if (posp.length === 0) {
    return <div className="empty">No POSP data available.</div>;
  }

  const pospStats = posp.map((p) => {
    const pDeals = deals.filter((d) => d.pospId === p.id);
    const total = pDeals.length;
    const premium = pDeals.reduce((a, d) => a + (+d.premium || 0), 0);
    const hotCount = pDeals.filter((d) => d.status === "H").length;
    const issuedCount = pDeals.filter((d) => d.policyNo).length;
    const totalMargin = pDeals.reduce((a, d) => a + (+d.margin || 0), 0);
    const avgMargin = total > 0 ? totalMargin / total : 0;
    const label = formatPospLabel(p.name, p.code);
    return { label, total, premium, hotCount, issuedCount, avgMargin };
  });

  const maxTotal = Math.max(...pospStats.map((s) => s.total), 1);
  const maxPremium = Math.max(...pospStats.map((s) => s.premium), 1);
  const maxHot = Math.max(...pospStats.map((s) => s.hotCount), 1);
  const maxIssued = Math.max(...pospStats.map((s) => s.issuedCount), 1);
  const maxMargin = Math.max(...pospStats.map((s) => s.avgMargin), 1);

  const top3 = pospStats.sort((a, b) => b.premium - a.premium).slice(0, 3);

  const COLORS = ["#0f4c75", "#e63946", "#2a9d8f"];

  const radarData = [
    { metric: "Deal Count" },
    { metric: "Total Premium" },
    { metric: "Hot Deals" },
    { metric: "Issued" },
    { metric: "Avg Margin" },
  ].map((row, i) => {
    const result: Record<string, string | number> = { metric: row.metric };
    top3.forEach((p) => {
      const values = [
        normalize(p.total, maxTotal),
        normalize(p.premium, maxPremium),
        normalize(p.hotCount, maxHot),
        normalize(p.issuedCount, maxIssued),
        normalize(p.avgMargin, maxMargin),
      ];
      result[p.label] = values[i];
    });
    return result;
  });

  return (
    <ResponsiveContainer width="100%" height={320}>
      <RadarChart data={radarData} margin={{ top: 16, right: 40, left: 40, bottom: 16 }}>
        <PolarGrid />
        <PolarAngleAxis dataKey="metric" tick={{ fontSize: 12 }} />
        <PolarRadiusAxis angle={30} domain={[0, 100]} tickCount={5} tick={{ fontSize: 10 }} />
        {top3.map((p, i) => (
          <Radar
            key={p.label}
            name={p.label}
            dataKey={p.label}
            stroke={COLORS[i]}
            fill={COLORS[i]}
            fillOpacity={0.15}
            strokeWidth={2}
          />
        ))}
        <Tooltip formatter={(v, name) => [`${Number(v)}/100`, String(name)]} />
      </RadarChart>
    </ResponsiveContainer>
  );
}
