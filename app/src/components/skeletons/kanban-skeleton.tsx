"use client";

import { SkeletonBlock, SkeletonLine } from "./skeleton-primitives";

interface KanbanSkeletonProps {
  columns?: number;
  cardsPerCol?: number;
}

export function KanbanSkeleton({
  columns = 4,
  cardsPerCol = 3,
}: KanbanSkeletonProps): React.ReactElement {
  return (
    <div className="kanban skeleton-kanban">
      {Array.from({ length: columns }, (_, col) => (
        <div key={col} className="kanban-col">
          <div className="kanban-col-header">
            <SkeletonLine width="55%" height="0.875rem" />
            <SkeletonLine width="2rem" height="1.25rem" />
          </div>
          {Array.from({ length: cardsPerCol }, (_, card) => (
            <div key={card} className="skeleton-kanban-card">
              <SkeletonLine width="80%" height="0.875rem" />
              <SkeletonLine width="60%" height="0.75rem" />
              <SkeletonBlock height="1.75rem" borderRadius="4px" />
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
