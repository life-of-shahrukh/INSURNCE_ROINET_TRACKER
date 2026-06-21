"use client";

import type { ReactNode } from "react";
import {
  KanbanSkeleton,
  PospGridSkeleton,
  TableSkeleton,
} from "@/components/skeletons";

export type ListSkeletonVariant = "table" | "posp-grid" | "kanban";

interface ListDataSectionProps {
  isInitialLoading: boolean;
  isRefreshing: boolean;
  children: ReactNode;
  className?: string;
  /** Pin pagination to the bottom of a fixed-height table area. */
  stretch?: boolean;
  skeletonVariant?: ListSkeletonVariant;
}

function renderListSkeleton(variant: ListSkeletonVariant): React.ReactElement {
  switch (variant) {
    case "posp-grid":
      return <PospGridSkeleton />;
    case "kanban":
      return <KanbanSkeleton />;
    default:
      return <TableSkeleton />;
  }
}

export function ListDataSection({
  isInitialLoading,
  isRefreshing,
  children,
  className,
  stretch = false,
  skeletonVariant = "table",
}: ListDataSectionProps): React.ReactElement {
  const sectionClass = [
    "list-data-section",
    stretch ? "list-data-section--stretch" : "",
    isRefreshing ? "list-data-section--refreshing" : "",
    className ?? "",
  ]
    .filter(Boolean)
    .join(" ");

  if (isInitialLoading) {
    return (
      <div className={`${sectionClass} list-data-section--loading`.trim()}>
        {renderListSkeleton(skeletonVariant)}
      </div>
    );
  }

  return (
    <div className={sectionClass} aria-busy={isRefreshing}>
      {children}
    </div>
  );
}
