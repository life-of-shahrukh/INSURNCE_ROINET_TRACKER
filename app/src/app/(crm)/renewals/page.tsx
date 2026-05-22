"use client";

import { Card } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";
import { computeRenewals, pospName } from "@/lib/crm-calculations";
import { fmtDate, fmtINR } from "@/lib/formatters";
import { useCrm } from "@/providers/crm-provider";
import { useMemo } from "react";

export default function RenewalsPage() {
  const { deals, posp, loading } = useCrm();
  const upcoming = useMemo(() => computeRenewals(deals), [deals]);

  if (loading) return <div className="empty">Loading…</div>;

  return (
    <>
      <PageHeader
        title="Renewals"
        subtitle="Policies due within next 90 days (auto-calculated from issuance date)"
      />

      <Card>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Customer</th>
                <th>Policy #</th>
                <th>Type</th>
                <th>Premium</th>
                <th>POSP</th>
                <th>Issued</th>
                <th>Renewal Due</th>
                <th>Days Left</th>
              </tr>
            </thead>
            <tbody>
              {upcoming.length === 0 ? (
                <tr>
                  <td colSpan={8} className="empty">
                    No renewals in the next 90 days. Mark a deal as issued (with a policy
                    number + issuance date) to see it here.
                  </td>
                </tr>
              ) : (
                upcoming.map((d) => (
                  <tr key={d.id}>
                    <td>
                      <strong>{d.customer}</strong>
                    </td>
                    <td>{d.policyNo}</td>
                    <td>{d.policy}</td>
                    <td className="num-right">{fmtINR(d.premium)}</td>
                    <td>{pospName(posp, d.pospId)}</td>
                    <td>{fmtDate(d.issued)}</td>
                    <td>{fmtDate(d.renew)}</td>
                    <td>
                      {d.daysLeft < 0 ? (
                        <span className="badge badge-hot">
                          Overdue {Math.abs(d.daysLeft)}d
                        </span>
                      ) : d.daysLeft < 30 ? (
                        <span className="badge badge-warm">{d.daysLeft} days</span>
                      ) : (
                        <span className="badge badge-cold">{d.daysLeft} days</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </>
  );
}
