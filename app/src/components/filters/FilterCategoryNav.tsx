"use client";

import {
  getDimensionId,
  isDimensionActive,
} from "@/lib/filters/filter-dimension-utils";
import type { FilterState } from "@/lib/filters/filter-utils";
import type { QueryFilterKey, ViewFilterDimension } from "@/lib/filters/table-filter-config";

interface FilterCategoryNavProps {
  dimensions: ViewFilterDimension[];
  selectedId: string;
  filters: FilterState;
  queryValues: Record<QueryFilterKey, string | undefined>;
  onSelect: (id: string) => void;
}

function CategoryIcon({ dim }: { dim: ViewFilterDimension }): React.ReactElement {
  const key = dim.queryKey ?? String(dim.key);

  if (key === "dateRange" || key === "closureTimeline") {
    return (
      <svg width="14" height="14" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
        <path
          fillRule="evenodd"
          d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z"
          clipRule="evenodd"
        />
      </svg>
    );
  }

  if (key === "premiumRange") {
    return (
      <svg width="14" height="14" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
        <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
        <path
          fillRule="evenodd"
          d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z"
          clipRule="evenodd"
        />
      </svg>
    );
  }

  if (
    key === "productLine" ||
    key === "productSubType" ||
    key === "policyStatus" ||
    key === "kycStatus"
  ) {
    return (
      <svg width="14" height="14" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
        <path
          fillRule="evenodd"
          d="M17.707 9.293a1 1 0 010 1.414l-7 7a1 1 0 01-1.414 0l-7-7A.997.997 0 012 10V5a3 3 0 013-3h5c.256 0 .512.098.707.293l7 7zM5 6a1 1 0 100-2 1 1 0 000 2z"
          clipRule="evenodd"
        />
      </svg>
    );
  }

  if (key === "posp" || key === "designation" || key === "teamStatus" || key === "active") {
    return (
      <svg width="14" height="14" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
        <path
          fillRule="evenodd"
          d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
          clipRule="evenodd"
        />
      </svg>
    );
  }

  if (key === "insurer") {
    return (
      <svg width="14" height="14" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
        <path
          fillRule="evenodd"
          d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a1 1 0 110 2h-3a1 1 0 01-1-1v-2a1 1 0 00-1-1H9a1 1 0 00-1 1v2a1 1 0 01-1 1H4a1 1 0 110-2V4zm3 1h2v2H7V5zm2 4H7v2h2V9zm2-4h2v2h-2V5zm2 4h-2v2h2V9z"
          clipRule="evenodd"
        />
      </svg>
    );
  }

  if (key === "zone" || key === "region" || key === "area" || key === "district" || key === "territory") {
    return (
      <svg width="14" height="14" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
        <path
          fillRule="evenodd"
          d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z"
          clipRule="evenodd"
        />
      </svg>
    );
  }

  if (key === "source") {
    return (
      <svg width="14" height="14" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
        <path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z" />
        <path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z" />
      </svg>
    );
  }

  return (
    <svg width="14" height="14" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
      <path
        fillRule="evenodd"
        d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z"
        clipRule="evenodd"
      />
    </svg>
  );
}

export function FilterCategoryNav({
  dimensions,
  selectedId,
  filters,
  queryValues,
  onSelect,
}: FilterCategoryNavProps): React.ReactElement {
  return (
    <nav className="filter-popover-nav" aria-label="Filter categories">
      {dimensions.map((dim) => {
        const id = getDimensionId(dim);
        const isSelected = id === selectedId;
        const hasActive = isDimensionActive(dim, filters, queryValues);

        return (
          <button
            key={id}
            type="button"
            className={`filter-popover-nav-item${isSelected ? " filter-popover-nav-item--selected" : ""}`}
            onClick={() => onSelect(id)}
            aria-current={isSelected ? "true" : undefined}
          >
            <span className="filter-popover-nav-check" aria-hidden>
              {hasActive && (
                <svg width="12" height="12" viewBox="0 0 20 20" fill="currentColor">
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              )}
            </span>
            <span className="filter-popover-nav-icon">
              <CategoryIcon dim={dim} />
            </span>
            <span className="filter-popover-nav-label">{dim.label}</span>
            {isSelected && (
              <span className="filter-popover-nav-chevron" aria-hidden>
                <svg width="10" height="10" viewBox="0 0 20 20" fill="currentColor">
                  <path
                    fillRule="evenodd"
                    d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              </span>
            )}
          </button>
        );
      })}
    </nav>
  );
}
