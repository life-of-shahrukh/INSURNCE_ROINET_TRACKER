"use client";

import { Button } from "@/components/ui/Button";
import type { PaginationMeta } from "@/lib/api/pagination-types";

interface PaginationProps {
  meta: PaginationMeta;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
}

export function Pagination({
  meta,
  onPageChange,
  onPageSizeChange,
}: PaginationProps): React.ReactElement {
  const { page, pageSize, total, totalPages } = meta;

  if (total === 0) return <></>;

  const from = (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);

  return (
    <div className="pagination-bar">
      <div className="pagination-info">
        Showing {from}–{to} of {total}
      </div>
      <div className="pagination-controls">
        {onPageSizeChange ? (
          <select
            className="pagination-size"
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            aria-label="Rows per page"
          >
            {[10, 25, 50, 100].map((n) => (
              <option key={n} value={n}>
                {n} / page
              </option>
            ))}
          </select>
        ) : null}
        <Button
          variant="secondary"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
        >
          Previous
        </Button>
        <span className="pagination-page">
          Page {page} of {totalPages}
        </span>
        <Button
          variant="secondary"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
        >
          Next
        </Button>
      </div>
    </div>
  );
}
