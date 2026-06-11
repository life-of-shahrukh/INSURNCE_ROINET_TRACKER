"use client";

import { useCallback, useMemo, useState } from "react";
import { FilterCheckboxRow } from "@/components/filters/FilterCheckboxRow";
import type { FilterOption } from "@/lib/filters/filter-utils";

interface FilterAccordionGroupProps {
  groupId: string;
  label: string;
  options: FilterOption[];
  selectedValues: string[];
  onToggle: (value: string, checked: boolean) => void;
  defaultExpanded?: boolean;
}

export function FilterAccordionGroup({
  groupId,
  label,
  options,
  selectedValues,
  onToggle,
  defaultExpanded = false,
}: FilterAccordionGroupProps): React.ReactElement {
  const [expanded, setExpanded] = useState(defaultExpanded);

  const selectedInGroup = useMemo(
    () => options.filter((o) => selectedValues.includes(o.value)),
    [options, selectedValues],
  );

  const allSelected = selectedInGroup.length === options.length && options.length > 0;
  const someSelected = selectedInGroup.length > 0 && !allSelected;

  const handleGroupToggle = useCallback((): void => {
    if (allSelected || someSelected) {
      for (const opt of options) {
        if (selectedValues.includes(opt.value)) {
          onToggle(opt.value, false);
        }
      }
      return;
    }
    for (const opt of options) {
      if (!selectedValues.includes(opt.value)) {
        onToggle(opt.value, true);
      }
    }
  }, [allSelected, someSelected, options, selectedValues, onToggle]);

  return (
    <div className="filter-accordion-group">
      <div className="filter-accordion-header">
        <FilterCheckboxRow
          id={`filter-group-${groupId}`}
          label={label}
          checked={allSelected}
          onChange={() => handleGroupToggle()}
        />
        <button
          type="button"
          className="filter-accordion-toggle"
          onClick={() => setExpanded((open) => !open)}
          aria-expanded={expanded}
          aria-label={`${expanded ? "Collapse" : "Expand"} ${label}`}
        >
          <svg
            width="12"
            height="12"
            viewBox="0 0 20 20"
            fill="currentColor"
            className={expanded ? "filter-accordion-chevron--open" : ""}
            aria-hidden
          >
            <path
              fillRule="evenodd"
              d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
              clipRule="evenodd"
            />
          </svg>
        </button>
      </div>
      {expanded && (
        <div className="filter-accordion-body">
          {options.map((opt) => (
            <FilterCheckboxRow
              key={opt.value}
              id={`filter-${groupId}-${opt.value}`}
              label={opt.label}
              checked={selectedValues.includes(opt.value)}
              onChange={(checked) => onToggle(opt.value, checked)}
              indent
            />
          ))}
        </div>
      )}
    </div>
  );
}
