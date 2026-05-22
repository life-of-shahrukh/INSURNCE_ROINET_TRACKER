"use client";

import { Card } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";
import { computeCommissions, marginPercent } from "@/lib/crm-calculations";
import { fmtINR } from "@/lib/formatters";
import { useCrm } from "@/providers/crm-provider";
import { useMemo } from "react";

export default function CommissionsPage() {
  const { deals, posp, loading } = useCrm();
  const rows = useMemo(() => computeCommissions(deals, posp), [deals, posp]);

  const totals = useMemo(
    () =>
      rows.reduce(
        (a, r) => ({
          premium: a.premium + r.premium,
          coa: a.coa + r.coa,
          margin: a.margin + r.margin,
          dealCount: a.dealCount + r.dealCount,
          issued: a.issued + r.issued,
        }),
        { premium: 0, coa: 0, margin: 0, dealCount: 0, issued: 0 },
      ),
    [rows],
  );

  if (loading) return <div className="empty">Loading…</div>;

  return (
    <>
      <PageHeader
        title="Commissions"
        subtitle="Cost of Acquisition (COA) and Retained Margin by POSP"
      />

      <Card>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>POSP</th>
                <th>Code</th>
                <th>Deals</th>
                <th>Issued</th>
                <th>Total Premium</th>
                <th>Total COA</th>
                <th>Retained Margin</th>
                <th>Margin %</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.posp.id}>
                  <td>
                    <strong>{r.posp.name}</strong>
                  </td>
                  <td>{r.posp.code}</td>
                  <td>{r.dealCount}</td>
                  <td>{r.issued}</td>
                  <td className="num-right">{fmtINR(r.premium)}</td>
                  <td className="num-right">{fmtINR(r.coa)}</td>
                  <td className="num-right">{fmtINR(r.margin)}</td>
                  <td className="num-right">{marginPercent(r.margin, r.premium)}</td>
                </tr>
              ))}
              <tr className="row-total">
                <td colSpan={2}>Total</td>
                <td>{totals.dealCount}</td>
                <td>{totals.issued}</td>
                <td className="num-right">{fmtINR(totals.premium)}</td>
                <td className="num-right">{fmtINR(totals.coa)}</td>
                <td className="num-right">{fmtINR(totals.margin)}</td>
                <td className="num-right">{marginPercent(totals.margin, totals.premium)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </Card>
    </>
  );
}
