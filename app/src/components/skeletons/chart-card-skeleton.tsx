"use client";

import { SkeletonBlock, SkeletonLine } from "./skeleton-primitives";

interface ChartCardSkeletonProps {
  title?: boolean;
}

export function ChartCardSkeleton({
  title = true,
}: ChartCardSkeletonProps): React.ReactElement {
  return (
    <div className="card skeleton-chart-card">
      {title && (
        <div className="card-header">
          <SkeletonLine width="40%" height="1rem" />
        </div>
      )}
      <SkeletonBlock height="220px" borderRadius="8px" />
    </div>
  );
}
