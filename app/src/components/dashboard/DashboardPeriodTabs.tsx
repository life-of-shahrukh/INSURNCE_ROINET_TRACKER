"use client";

export type DashboardPeriod = "month" | "quarter" | "year";

const PERIODS: { id: DashboardPeriod; label: string }[] = [
  { id: "month", label: "Month" },
  { id: "quarter", label: "Quarter" },
  { id: "year", label: "Year" },
];

interface DashboardPeriodTabsProps {
  value: DashboardPeriod;
  onChange: (period: DashboardPeriod) => void;
}

export function DashboardPeriodTabs({
  value,
  onChange,
}: DashboardPeriodTabsProps): React.ReactElement {
  return (
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
  );
}

export function dashboardPeriodLabel(period: DashboardPeriod): string {
  if (period === "month") return "this month";
  if (period === "quarter") return "this quarter";
  return "this year";
}
