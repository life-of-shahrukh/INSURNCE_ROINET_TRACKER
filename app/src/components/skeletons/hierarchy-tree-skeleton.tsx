"use client";

import { SkeletonCircle, SkeletonLine } from "./skeleton-primitives";

interface HierarchyTreeSkeletonProps {
  rows?: number;
}

export function HierarchyTreeSkeleton({
  rows = 8,
}: HierarchyTreeSkeletonProps): React.ReactElement {
  return (
    <div className="skeleton-hierarchy" style={{ padding: "8px 0" }}>
      {Array.from({ length: rows }, (_, i) => (
        <div
          key={i}
          className="skeleton-hierarchy-row"
          style={{ paddingLeft: `${(i % 3) * 24}px` }}
        >
          <SkeletonCircle size="1.75rem" />
          <div className="skeleton-hierarchy-row-text">
            <SkeletonLine width={`${45 + (i % 4) * 10}%`} height="0.875rem" />
            <SkeletonLine width={`${30 + (i % 3) * 8}%`} height="0.7rem" />
          </div>
        </div>
      ))}
    </div>
  );
}
