"use client";

import { useState, useCallback } from "react";
import type { CommissionRecord } from "@/lib/api/payout-grid-api";

interface PayoutGridTableProps {
  readonly records: CommissionRecord[];
  readonly selectedState?: string;
}

const MAX_DISPLAY_ROWS = 500;

export function PayoutGridTable({ records, selectedState }: PayoutGridTableProps): React.ReactElement {
  const displayRows = records.slice(0, MAX_DISPLAY_ROWS);

  if (displayRows.length === 0) {
    return (
      <div style={{ padding: "2rem", textAlign: "center", color: "#64748b" }}>
        No records match the current filters.
      </div>
    );
  }

  return (
    <div className="commission-table-wrap">
      {records.length > MAX_DISPLAY_ROWS && (
        <div className="row-limit-notice">
          Showing {MAX_DISPLAY_ROWS} of {records.length.toLocaleString()} records.
          Use filters to narrow results.
        </div>
      )}
      <div className="table-scroll">
        <table className="commission-table">
          <thead>
            <tr>
              <th>Insurer</th>
              <th>LOB</th>
              <th>Product</th>
              <th>Variant</th>
              <th className="rate-col">Rate</th>
              <th>On Premium</th>
            </tr>
          </thead>
          <tbody>
            {displayRows.map((r, idx) => (
              <CommissionTableRow
                key={`${r.insurer}-${r.product}-${idx}`}
                record={r}
                selectedState={selectedState}
              />
            ))}
          </tbody>
        </table>
      </div>

      <style jsx>{`
        .commission-table-wrap {
          width: 100%;
        }
        .row-limit-notice {
          padding: 0.5rem 1rem;
          background: #fef3c7;
          color: #92400e;
          font-size: 0.8125rem;
          border-bottom: 1px solid #fde68a;
        }
        .table-scroll {
          overflow-x: auto;
          max-height: 70vh;
          overflow-y: auto;
        }
        .commission-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 0.8125rem;
        }
        .commission-table thead {
          position: sticky;
          top: 0;
          z-index: 2;
        }
        .commission-table th {
          background: #f1f5f9;
          padding: 0.5rem 0.75rem;
          text-align: left;
          font-weight: 600;
          font-size: 0.75rem;
          text-transform: uppercase;
          letter-spacing: 0.03em;
          color: #475569;
          border-bottom: 2px solid #e2e8f0;
          white-space: nowrap;
        }
        .commission-table td {
          padding: 0.4rem 0.75rem;
          border-bottom: 1px solid #f1f5f9;
          vertical-align: middle;
        }
        .commission-table tbody tr:hover {
          background: #f8fafc;
        }
        .rate-col {
          min-width: 180px;
        }
      `}</style>
    </div>
  );
}

interface RowProps {
  readonly record: CommissionRecord;
  readonly selectedState?: string;
}

const LOB_COLORS: Record<string, string> = {
  Health: "#10b981",
  Motor: "#3b82f6",
  Life: "#8b5cf6",
  "Non-Motor": "#f59e0b",
};

function CommissionTableRow({ record, selectedState }: RowProps): React.ReactElement {
  const [premium, setPremium] = useState("");
  const [selectedRate, setSelectedRate] = useState<number | null>(null);

  const rateEntries = Object.entries(record.rates)
    .filter(([k]) => k !== "_statewise" && k !== "Basis" && k !== "remark")
    .filter((entry): entry is [string, number | null] => typeof entry[1] !== "object" || entry[1] === null);

  const statewiseData = record.rates._statewise;
  const resolvedStateRate = selectedState && statewiseData
    ? statewiseData[selectedState] ?? null
    : null;

  const firstNumericRate = rateEntries.find(([, v]) => typeof v === "number")?.[1] ?? null;
  const activeRate = selectedRate ?? resolvedStateRate ?? firstNumericRate;

  const commissionAmount = activeRate && premium
    ? ((Number(premium) * activeRate) / 100).toFixed(2)
    : null;

  const handleChipClick = useCallback((val: number) => {
    setSelectedRate(val);
  }, []);

  return (
    <tr>
      <td className="ins-cell">{record.insurer}</td>
      <td>
        <span
          className="lob-badge"
          style={{ backgroundColor: LOB_COLORS[record.lob] ?? "#64748b" }}
        >
          {record.lob}
        </span>
      </td>
      <td>{record.product}</td>
      <td className="variant-cell">{record.variant}</td>
      <td className="rates-cell">
        {rateEntries.map(([k, v]) => {
          if (v === null) return null;
          const isActive = v === activeRate;
          return (
            <button
              key={k}
              type="button"
              className={`rchip clickable ${isActive ? "on" : ""}`}
              onClick={() => handleChipClick(v)}
            >
              <b>{k}</b> {v}%
            </button>
          );
        })}
        {statewiseData && selectedState && resolvedStateRate !== null && (
          <button
            type="button"
            className={`rchip clickable ${resolvedStateRate === activeRate ? "on" : ""}`}
            onClick={() => handleChipClick(resolvedStateRate)}
          >
            <b>{selectedState}</b> {resolvedStateRate}%
          </button>
        )}
        {statewiseData && !selectedState && (
          <span className="rchip state-hint">state grid</span>
        )}
      </td>
      <td className="prem-cell">
        <input
          type="number"
          className="prem-input"
          placeholder="Premium"
          value={premium}
          onChange={(e) => setPremium(e.target.value)}
        />
        {commissionAmount && (
          <span className="prem-out">= ₹{Number(commissionAmount).toLocaleString("en-IN")}</span>
        )}
      </td>

      <style jsx>{`
        .ins-cell {
          font-weight: 500;
          white-space: nowrap;
        }
        .lob-badge {
          font-size: 0.625rem;
          font-weight: 600;
          color: white;
          padding: 0.125rem 0.375rem;
          border-radius: 999px;
          text-transform: uppercase;
          white-space: nowrap;
        }
        .variant-cell {
          color: #64748b;
          font-size: 0.8125rem;
        }
        .rates-cell {
          display: flex;
          flex-wrap: wrap;
          gap: 0.25rem;
          align-items: center;
        }
        .rchip {
          display: inline-block;
          padding: 0.2rem 0.5rem;
          border-radius: 0.375rem;
          background: #f1f5f9;
          font-size: 0.75rem;
          white-space: nowrap;
          border: 1px solid transparent;
          transition: all 0.12s;
        }
        .rchip.clickable {
          cursor: pointer;
        }
        .rchip.clickable:hover {
          border-color: #3b82f6;
          background: #eff6ff;
        }
        .rchip.on {
          background: #3b82f6;
          color: white;
          border-color: #3b82f6;
        }
        .rchip.state-hint {
          color: #94a3b8;
          font-style: italic;
        }
        .prem-cell {
          display: flex;
          align-items: center;
          gap: 0.375rem;
          white-space: nowrap;
        }
        .prem-input {
          width: 90px;
          padding: 0.25rem 0.375rem;
          border: 1px solid #e2e8f0;
          border-radius: 0.25rem;
          font-size: 0.75rem;
        }
        .prem-input:focus {
          outline: none;
          border-color: #3b82f6;
        }
        .prem-out {
          font-weight: 600;
          color: #059669;
          font-size: 0.75rem;
        }
      `}</style>
    </tr>
  );
}
