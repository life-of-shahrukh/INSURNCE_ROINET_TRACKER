"use client";

import { ConversionFunnelChart } from "@/components/charts/ConversionFunnelChart";
import { LeadConversionChart } from "@/components/charts/LeadConversionChart";
import { MonthlyTrendChart } from "@/components/charts/MonthlyTrendChart";
import { PospActivityRadarChart } from "@/components/charts/PospActivityRadarChart";
import { ProductFunnelChart } from "@/components/charts/ProductFunnelChart";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";
import { computePolicySummary, marginPercent } from "@/lib/crm-calculations";
import { fmtINR } from "@/lib/formatters";
import { useLeads } from "@/hooks/useLeads";
import { useCrm } from "@/providers/crm-provider";
import { useMemo } from "react";

export default function ReportsPage() {
  const { deals, posp, loading, exportCsv } = useCrm();
  const { data: leads = [] } = useLeads();
  const summary = useMemo(() => computePolicySummary(deals), [deals]);

  if (loading) return <div className="empty">Loading…</div>;

  return (
    <>
      <PageHeader
        title="Reports"
        subtitle="Cuts of your data for review and export"
        actions={
          <Button variant="secondary" onClick={() => exportCsv()}>
            ⬇ Export CSV
          </Button>
        }
      />

      <div className="row-2">
        <Card title="Monthly Premium Trend">
          <MonthlyTrendChart deals={deals} />
        </Card>
        <Card title="Conversion Funnel">
          <ConversionFunnelChart deals={deals} />
        </Card>
      </div>

      <Card title="Funnel by Product (Leads → Warm+ → Hot → Issued)">
        <ProductFunnelChart deals={deals} />
      </Card>

      <div className="row-2">
        <Card title="Top POSP Performance (Radar)">
          <PospActivityRadarChart deals={deals} posp={posp} />
        </Card>
        <Card title="Lead Conversion by Product">
          <LeadConversionChart leads={leads} />
        </Card>
      </div>

      <Card title="Summary by Policy Type">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Policy Type</th>
                <th>Deals</th>
                <th>Premium</th>
                <th>COA</th>
                <th>Margin</th>
                <th>Margin %</th>
              </tr>
            </thead>
            <tbody>
              {summary.map((row) => (
                <tr key={row.policy}>
                  <td>
                    <strong>{row.policy}</strong>
                  </td>
                  <td>{row.count}</td>
                  <td className="num-right">{fmtINR(row.premium)}</td>
                  <td className="num-right">{fmtINR(row.coa)}</td>
                  <td className="num-right">{fmtINR(row.margin)}</td>
                  <td className="num-right">{marginPercent(row.margin, row.premium)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </>
  );
}
