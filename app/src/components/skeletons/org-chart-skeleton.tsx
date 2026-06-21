"use client";

import { SkeletonBlock, SkeletonCircle, SkeletonLine } from "./skeleton-primitives";

export function OrgChartSkeleton(): React.ReactElement {
  return (
    <div className="skeleton-org-chart">
      <div className="skeleton-org-chart-node skeleton-org-chart-node--root">
        <SkeletonCircle size="2.5rem" />
        <SkeletonLine width="6rem" height="0.875rem" />
      </div>
      <div className="skeleton-org-chart-level">
        {[1, 2, 3].map((i) => (
          <div key={i} className="skeleton-org-chart-node">
            <SkeletonCircle size="2rem" />
            <SkeletonLine width="5rem" height="0.75rem" />
          </div>
        ))}
      </div>
      <div className="skeleton-org-chart-level skeleton-org-chart-level--wide">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="skeleton-org-chart-node skeleton-org-chart-node--sm">
            <SkeletonCircle size="1.75rem" />
            <SkeletonLine width="4rem" height="0.7rem" />
          </div>
        ))}
      </div>
      <SkeletonBlock height="120px" borderRadius="8px" />
    </div>
  );
}
