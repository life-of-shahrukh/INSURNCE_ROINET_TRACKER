"use client";

import { SkeletonLine } from "./skeleton-primitives";

interface TableSkeletonProps {
  rows?: number;
  columns?: number;
}

export function TableSkeleton({
  rows = 8,
  columns = 6,
}: TableSkeletonProps): React.ReactElement {
  return (
    <div className="table-wrap skeleton-table">
      <table>
        <thead>
          <tr>
            {Array.from({ length: columns }, (_, i) => (
              <th key={`head-${i}`}>
                <SkeletonLine width={`${60 + (i % 3) * 20}%`} height="0.75rem" />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }, (_, row) => (
            <tr key={`row-${row}`}>
              {Array.from({ length: columns }, (_, col) => (
                <td key={`cell-${row}-${col}`}>
                  <SkeletonLine width={`${50 + ((row + col) % 4) * 12}%`} height="0.875rem" />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
