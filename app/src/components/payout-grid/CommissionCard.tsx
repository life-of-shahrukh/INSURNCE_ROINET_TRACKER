"use client";

import { useState, useCallback } from "react";
import type { CommissionRecord } from "@/lib/api/payout-grid-api";

interface CommissionCardProps {
  readonly record: CommissionRecord;
  readonly selectedState?: string;
}

const LOB_COLORS: Record<string, string> = {
  Health: "#10b981",
  Motor: "#3b82f6",
  Life: "#8b5cf6",
  "Non-Motor": "#f59e0b",
};

export function CommissionCard({ record, selectedState }: CommissionCardProps): React.ReactElement {
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
    <div className="commission-card">
      <div className="card-top">
        <span className="card-insurer">{record.insurer}</span>
        <span
          className="card-lob"
          style={{ backgroundColor: LOB_COLORS[record.lob] ?? "#64748b" }}
        >
          {record.lob}
        </span>
      </div>
      <div className="card-product">{record.product}</div>
      {record.variant && <div className="card-variant">{record.variant}</div>}

      <div className="card-rates">
        {rateEntries.map(([k, v]) => {
          if (v === null) return null;
          const isNumeric = typeof v === "number";
          const isActive = isNumeric && v === activeRate;
          return (
            <button
              key={k}
              type="button"
              className={`rate-chip ${isNumeric ? "clickable" : "text"} ${isActive ? "active" : ""}`}
              onClick={isNumeric ? () => handleChipClick(v) : undefined}
              disabled={!isNumeric}
            >
              <span className="chip-key">{k}</span>
              <span className="chip-val">{isNumeric ? `${v}%` : String(v)}</span>
            </button>
          );
        })}

        {statewiseData && selectedState && (
          <button
            type="button"
            className={`rate-chip clickable ${resolvedStateRate === activeRate ? "active" : ""}`}
            onClick={() => resolvedStateRate !== null && handleChipClick(resolvedStateRate)}
            disabled={resolvedStateRate === null}
          >
            <span className="chip-key">{selectedState}</span>
            <span className="chip-val">
              {resolvedStateRate === null ? "—" : `${resolvedStateRate}%`}
            </span>
          </button>
        )}
        {statewiseData && !selectedState && (
          <span className="rate-chip text">
            <span className="chip-key">State Grid</span>
            <span className="chip-val">Select state</span>
          </span>
        )}
      </div>

      {activeRate !== null && (
        <div className="card-calc">
          <input
            type="number"
            className="premium-input"
            placeholder="Premium amount"
            value={premium}
            onChange={(e) => setPremium(e.target.value)}
          />
          {commissionAmount && (
            <span className="commission-result">
              = ₹{Number(commissionAmount).toLocaleString("en-IN")}
            </span>
          )}
        </div>
      )}

      {record.remark && <div className="card-remark">{record.remark}</div>}

      <style jsx>{`
        .commission-card {
          border: 1px solid #e2e8f0;
          border-radius: 0.75rem;
          padding: 1rem;
          background: white;
          transition: box-shadow 0.15s;
        }
        .commission-card:hover {
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
        }
        .card-top {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.5rem;
        }
        .card-insurer {
          font-weight: 600;
          font-size: 0.9375rem;
          color: #1e293b;
        }
        .card-lob {
          font-size: 0.6875rem;
          font-weight: 600;
          color: white;
          padding: 0.125rem 0.5rem;
          border-radius: 999px;
          text-transform: uppercase;
          letter-spacing: 0.03em;
        }
        .card-product {
          font-size: 0.875rem;
          color: #334155;
          font-weight: 500;
        }
        .card-variant {
          font-size: 0.8125rem;
          color: #64748b;
          margin-top: 0.125rem;
        }
        .card-rates {
          display: flex;
          flex-wrap: wrap;
          gap: 0.375rem;
          margin-top: 0.75rem;
        }
        .rate-chip {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 0.375rem 0.625rem;
          border-radius: 0.5rem;
          border: 1px solid #e2e8f0;
          background: #f8fafc;
          font-size: 0.75rem;
          min-width: 52px;
        }
        .rate-chip.clickable {
          cursor: pointer;
          transition: all 0.15s;
        }
        .rate-chip.clickable:hover {
          border-color: #3b82f6;
          background: #eff6ff;
        }
        .rate-chip.active {
          border-color: #3b82f6;
          background: #3b82f6;
          color: white;
        }
        .rate-chip.active .chip-key {
          color: rgba(255, 255, 255, 0.8);
        }
        .rate-chip.active .chip-val {
          color: white;
        }
        .rate-chip.text {
          cursor: default;
          opacity: 0.7;
        }
        .chip-key {
          font-size: 0.625rem;
          color: #64748b;
          text-transform: uppercase;
          letter-spacing: 0.02em;
        }
        .chip-val {
          font-weight: 700;
          font-size: 0.8125rem;
          color: #1e293b;
          font-variant-numeric: tabular-nums;
        }
        .card-calc {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin-top: 0.75rem;
          padding-top: 0.625rem;
          border-top: 1px solid #f1f5f9;
        }
        .premium-input {
          flex: 1;
          padding: 0.375rem 0.5rem;
          border: 1px solid #e2e8f0;
          border-radius: 0.375rem;
          font-size: 0.8125rem;
          max-width: 140px;
        }
        .premium-input:focus {
          outline: none;
          border-color: #3b82f6;
        }
        .commission-result {
          font-weight: 600;
          font-size: 0.875rem;
          color: #059669;
          white-space: nowrap;
        }
        .card-remark {
          font-size: 0.75rem;
          color: #94a3b8;
          margin-top: 0.5rem;
          font-style: italic;
        }
      `}</style>
    </div>
  );
}
