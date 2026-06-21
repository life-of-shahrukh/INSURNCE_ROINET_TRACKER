"use client";

import { SkeletonLine } from "./skeleton-primitives";

interface KpiGridSkeletonProps {
  count?: number;
}

export function KpiGridSkeleton({
  count = 8,
}: KpiGridSkeletonProps): React.ReactElement {
  return (
    <div className="kpi-grid">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="kpi-card skeleton-kpi-card">
          <SkeletonLine width="55%" height="0.7rem" />
          <SkeletonLine width="45%" height="1.75rem" />
          <SkeletonLine width="70%" height="0.75rem" />
        </div>
      ))}
    </div>
  );
}
