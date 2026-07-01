"use client";

import { useState, useCallback } from "react";
import type {
  CommissionMeta,
  CommissionSearchParams,
} from "@/lib/api/payout-grid-api";

interface PayoutGridFiltersProps {
  readonly meta: CommissionMeta | null;
  readonly filters: CommissionSearchParams;
  readonly view: "cards" | "table";
  readonly onFilterChange: (filters: CommissionSearchParams) => void;
  readonly onViewChange: (view: "cards" | "table") => void;
  readonly loading: boolean;
}

export function PayoutGridFilters({
  meta,
  filters,
  view,
  onFilterChange,
  onViewChange,
  loading,
}: PayoutGridFiltersProps): React.ReactElement {
  const [localQuery, setLocalQuery] = useState(filters.query ?? "");

  const handleQueryKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        onFilterChange({ ...filters, query: localQuery || undefined });
      }
    },
    [filters, localQuery, onFilterChange],
  );

  const handleLobClick = useCallback(
    (lob: string) => {
      const next = filters.lob === lob ? undefined : lob;
      onFilterChange({ ...filters, lob: next });
    },
    [filters, onFilterChange],
  );

  const handleReset = useCallback(() => {
    setLocalQuery("");
    onFilterChange({});
  }, [onFilterChange]);

  return (
    <div className="commission-filters">
      {/* LOB Pills */}
      <div className="lob-pills">
        {meta?.lobs.map((l) => (
          <button
            key={l.name}
            type="button"
            className={`lob-pill ${filters.lob === l.name ? "active" : ""}`}
            onClick={() => handleLobClick(l.name)}
            data-lob={l.name}
          >
            {l.name} <span className="pill-count">{l.count}</span>
          </button>
        ))}
      </div>

      {/* Filters Row */}
      <div className="filter-row">
        <div className="filter-group">
          <label htmlFor="insurer-select">Insurer</label>
          <select
            id="insurer-select"
            value={filters.insurer ?? ""}
            onChange={(e) =>
              onFilterChange({ ...filters, insurer: e.target.value || undefined })
            }
            disabled={loading}
          >
            <option value="">All Insurers</option>
            {meta?.insurers.map((ins) => (
              <option key={ins} value={ins}>{ins}</option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <label htmlFor="state-select">State</label>
          <select
            id="state-select"
            value={filters.state ?? ""}
            onChange={(e) =>
              onFilterChange({ ...filters, state: e.target.value || undefined })
            }
            disabled={loading}
          >
            <option value="">All States</option>
            {meta?.states.map((s) => (
              <option key={s.stateCode} value={s.stateCode}>
                {s.stateName}
              </option>
            ))}
          </select>
        </div>

        <div className="filter-group search-group">
          <label htmlFor="query-input">Search</label>
          <input
            id="query-input"
            type="text"
            placeholder="e.g. Pvt car Maharashtra, Reliance health..."
            value={localQuery}
            onChange={(e) => setLocalQuery(e.target.value)}
            onKeyDown={handleQueryKeyDown}
          />
        </div>

        <button
          className="btn btn-primary"
          onClick={() =>
            onFilterChange({ ...filters, query: localQuery || undefined })
          }
          type="button"
        >
          Search
        </button>

        <button
          className="btn btn-ghost"
          onClick={handleReset}
          type="button"
        >
          Reset
        </button>

        <div className="view-toggle">
          <button
            type="button"
            className={`toggle-btn ${view === "cards" ? "active" : ""}`}
            onClick={() => onViewChange("cards")}
            title="Card view"
          >
            ▦
          </button>
          <button
            type="button"
            className={`toggle-btn ${view === "table" ? "active" : ""}`}
            onClick={() => onViewChange("table")}
            title="Table view"
          >
            ≡
          </button>
        </div>
      </div>

      <style jsx>{`
        .commission-filters {
          margin-bottom: 1rem;
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }
        .lob-pills {
          display: flex;
          gap: 0.5rem;
          flex-wrap: wrap;
        }
        .lob-pill {
          padding: 0.375rem 0.875rem;
          border-radius: 999px;
          border: 1px solid #e2e8f0;
          background: white;
          font-size: 0.8125rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.15s;
          color: #475569;
        }
        .lob-pill:hover {
          border-color: #94a3b8;
        }
        .lob-pill.active {
          background: #1e293b;
          border-color: #1e293b;
          color: white;
        }
        .lob-pill[data-lob="Health"].active { background: #10b981; border-color: #10b981; }
        .lob-pill[data-lob="Motor"].active { background: #3b82f6; border-color: #3b82f6; }
        .lob-pill[data-lob="Life"].active { background: #8b5cf6; border-color: #8b5cf6; }
        .lob-pill[data-lob="Non-Motor"].active { background: #f59e0b; border-color: #f59e0b; }
        .pill-count {
          font-size: 0.6875rem;
          opacity: 0.7;
          margin-left: 0.25rem;
        }
        .filter-row {
          display: flex;
          align-items: flex-end;
          gap: 0.75rem;
          flex-wrap: wrap;
        }
        .filter-group {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }
        .filter-group label {
          font-size: 0.6875rem;
          font-weight: 500;
          color: #64748b;
          text-transform: uppercase;
          letter-spacing: 0.03em;
        }
        .filter-group select,
        .filter-group input {
          padding: 0.5rem 0.75rem;
          border: 1px solid #e2e8f0;
          border-radius: 0.375rem;
          font-size: 0.8125rem;
          min-width: 150px;
          background: white;
        }
        .filter-group select:focus,
        .filter-group input:focus {
          outline: none;
          border-color: #3b82f6;
          box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
        }
        .search-group {
          flex: 1;
          min-width: 220px;
        }
        .search-group input {
          width: 100%;
        }
        .btn {
          padding: 0.5rem 1rem;
          border-radius: 0.375rem;
          font-size: 0.8125rem;
          font-weight: 500;
          cursor: pointer;
          border: 1px solid transparent;
          transition: all 0.15s;
          white-space: nowrap;
        }
        .btn-primary {
          background: #3b82f6;
          color: white;
        }
        .btn-primary:hover {
          background: #2563eb;
        }
        .btn-ghost {
          background: transparent;
          color: #64748b;
          border-color: #e2e8f0;
        }
        .btn-ghost:hover {
          background: #f8fafc;
        }
        .view-toggle {
          display: flex;
          border: 1px solid #e2e8f0;
          border-radius: 0.375rem;
          overflow: hidden;
        }
        .toggle-btn {
          padding: 0.5rem 0.625rem;
          background: white;
          border: none;
          cursor: pointer;
          font-size: 1rem;
          color: #64748b;
          transition: all 0.12s;
        }
        .toggle-btn:hover {
          background: #f8fafc;
        }
        .toggle-btn.active {
          background: #1e293b;
          color: white;
        }
        .toggle-btn + .toggle-btn {
          border-left: 1px solid #e2e8f0;
        }
      `}</style>
    </div>
  );
}
