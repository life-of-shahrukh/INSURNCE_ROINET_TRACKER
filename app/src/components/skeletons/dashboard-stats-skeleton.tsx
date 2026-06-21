"use client";

import { ChartCardSkeleton } from "./chart-card-skeleton";
import { KpiGridSkeleton } from "./kpi-grid-skeleton";

export function DashboardStatsSkeleton(): React.ReactElement {
  return (
    <>
      <KpiGridSkeleton count={8} />
      <div className="row-2">
        <ChartCardSkeleton />
        <ChartCardSkeleton />
      </div>
      <ChartCardSkeleton />
      <div className="row-2">
        <ChartCardSkeleton />
        <ChartCardSkeleton />
      </div>
      <div className="row-2">
        <ChartCardSkeleton />
        <ChartCardSkeleton />
      </div>
    </>
  );
}
