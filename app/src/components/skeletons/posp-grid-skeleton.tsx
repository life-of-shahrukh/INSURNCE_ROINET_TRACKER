"use client";

import { SkeletonBlock, SkeletonLine } from "./skeleton-primitives";

interface PospGridSkeletonProps {
  cards?: number;
}

export function PospGridSkeleton({
  cards = 20,
}: PospGridSkeletonProps): React.ReactElement {
  return (
    <div className="posp-grid skeleton-posp-grid">
      {Array.from({ length: cards }, (_, i) => (
        <div key={i} className="posp-roster-card skeleton-posp-card">
          <SkeletonBlock height="3px" borderRadius="0" />
          <div style={{ padding: "10px 12px", display: "grid", gap: "8px" }}>
            <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
              <SkeletonBlock width="40px" height="40px" borderRadius="10px" />
              <div style={{ flex: 1, display: "grid", gap: "4px" }}>
                <SkeletonLine width="75%" height="0.85rem" />
                <SkeletonLine width="50%" height="0.65rem" />
              </div>
            </div>
            <SkeletonLine width="90%" height="0.7rem" />
            <div className="skeleton-posp-card-stats">
              <SkeletonBlock height="2.5rem" borderRadius="8px" />
              <SkeletonBlock height="2.5rem" borderRadius="8px" />
            </div>
            <SkeletonLine width="100%" height="2rem" />
          </div>
        </div>
      ))}
    </div>
  );
}
