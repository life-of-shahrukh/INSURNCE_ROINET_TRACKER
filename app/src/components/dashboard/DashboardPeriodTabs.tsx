"use client";

export type DashboardPeriod = "day" | "month" | "year" | "custom";

const PERIODS: { id: DashboardPeriod; label: string }[] = [
  { id: "day", label: "Day" },
  { id: "month", label: "Month" },
  { id: "year", label: "Year" },
  { id: "custom", label: "Custom" },
];

interface DashboardPeriodTabsProps {
  value: DashboardPeriod;
  onChange: (period: DashboardPeriod) => void;
  dateFrom: string;
  dateTo: string;
  onDateFromChange: (v: string) => void;
  onDateToChange: (v: string) => void;
}

export function DashboardPeriodTabs({
  value,
  onChange,
  dateFrom,
  dateTo,
  onDateFromChange,
  onDateToChange,
}: DashboardPeriodTabsProps): React.ReactElement {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
      <div className="dashboard-period-tabs" role="tablist" aria-label="Dashboard period">
        {PERIODS.map((period) => (
          <button
            key={period.id}
            type="button"
            role="tab"
            aria-selected={value === period.id}
            className={`dashboard-period-tab${value === period.id ? " dashboard-period-tab--active" : ""}`}
            onClick={() => onChange(period.id)}
          >
            {period.label}
          </button>
        ))}
      </div>

      {value === "custom" && (
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <label style={{ fontSize: "13px", color: "#6b7280", whiteSpace: "nowrap" }}>
            From
          </label>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => onDateFromChange(e.target.value)}
            style={{ fontSize: "13px", padding: "4px 8px", borderRadius: "6px", border: "1px solid #d1d5db" }}
          />
          <label style={{ fontSize: "13px", color: "#6b7280", whiteSpace: "nowrap" }}>
            To
          </label>
          <input
            type="date"
            value={dateTo}
            min={dateFrom || undefined}
            onChange={(e) => onDateToChange(e.target.value)}
            style={{ fontSize: "13px", padding: "4px 8px", borderRadius: "6px", border: "1px solid #d1d5db" }}
          />
        </div>
      )}
    </div>
  );
}

export function dashboardPeriodLabel(
  period: DashboardPeriod,
  dateFrom?: string,
  dateTo?: string,
): string {
  if (period === "day") return "today";
  if (period === "month") return "this month";
  if (period === "year") return "this year";
  if (dateFrom && dateTo) return `${dateFrom} – ${dateTo}`;
  return "custom range";
}
