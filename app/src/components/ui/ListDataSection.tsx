"use client";

import type { ReactNode } from "react";

interface ListDataSectionProps {
  isInitialLoading: boolean;
  isRefreshing: boolean;
  children: ReactNode;
  className?: string;
  /** Pin pagination to the bottom of a fixed-height table area. */
  stretch?: boolean;
}

export function ListDataSection({
  isInitialLoading,
  isRefreshing,
  children,
  className,
  stretch = false,
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
        <div className="list-data-section-placeholder">Loading…</div>
      </div>
    );
  }

  return (
    <div className={sectionClass} aria-busy={isRefreshing}>
      {children}
    </div>
  );
}
