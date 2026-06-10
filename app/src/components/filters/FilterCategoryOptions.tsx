"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { FilterAccordionGroup } from "@/components/filters/FilterAccordionGroup";
import { FilterCheckboxRow } from "@/components/filters/FilterCheckboxRow";
import { getProductSubTypeGroups } from "@/lib/filters/filter-option-groups";
import {
  isMultiFilterKey,
  selectableOptions,
  type FilterOption,
  type FilterState,
} from "@/lib/filters/filter-utils";
import type { QueryFilterKey, ViewFilterDimension } from "@/lib/filters/table-filter-config";

interface FilterCategoryOptionsProps {
  dimension: ViewFilterDimension;
  filters: FilterState;
  queryValues: Record<QueryFilterKey, string | undefined>;
  onFilterChange: (key: keyof FilterState, value: string | string[]) => void;
  onQueryChange: (key: QueryFilterKey, value: string) => void;
  onPospSearch?: (query: string) => Promise<FilterOption[]>;
}

function QueryTextField({
  id,
  label,
  value,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
}): React.ReactElement {
  return (
    <div className="filter-popover-text-field">
      <label htmlFor={id} className="filter-popover-text-label">
        {label}
      </label>
      <input
        id={id}
        type="text"
        className="filter-popover-text-input"
        placeholder={label}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

function MultiCheckboxList({
  dimensionId,
  allLabel,
  options,
  selectedValues,
  onChange,
}: {
  dimensionId: string;
  allLabel: string;
  options: FilterOption[];
  selectedValues: string[];
  onChange: (values: string[]) => void;
}): React.ReactElement {
  const selectable = useMemo(() => selectableOptions(options), [options]);
  const allSelected = selectedValues.length === 0;

  const handleToggle = useCallback(
    (value: string, checked: boolean) => {
      if (checked) {
        onChange([...selectedValues, value]);
        return;
      }
      onChange(selectedValues.filter((v) => v !== value));
    },
    [selectedValues, onChange],
  );

  return (
    <div className="filter-popover-options-list">
      <FilterCheckboxRow
        id={`filter-${dimensionId}-all`}
        label={allLabel}
        checked={allSelected}
        onChange={() => onChange([])}
      />
      {selectable.map((opt) => (
        <FilterCheckboxRow
          key={opt.value}
          id={`filter-${dimensionId}-${opt.value}`}
          label={opt.label}
          checked={selectedValues.includes(opt.value)}
          onChange={(checked) => handleToggle(opt.value, checked)}
        />
      ))}
    </div>
  );
}

function SingleCheckboxList({
  dimensionId,
  options,
  selectedValue,
  onChange,
}: {
  dimensionId: string;
  options: FilterOption[];
  selectedValue: string;
  onChange: (value: string) => void;
}): React.ReactElement {
  return (
    <div className="filter-popover-options-list">
      {options.map((opt) => {
        const isEmpty = opt.value === "" || opt.value === "all";
        const checked = isEmpty
          ? !selectedValue || selectedValue === "all"
          : selectedValue === opt.value;

        return (
          <FilterCheckboxRow
            key={opt.value || "all"}
            id={`filter-${dimensionId}-${opt.value || "all"}`}
            label={opt.label}
            checked={checked}
            onChange={(nextChecked) => {
              if (isEmpty || !nextChecked) {
                onChange("");
                return;
              }
              onChange(opt.value);
            }}
          />
        );
      })}
    </div>
  );
}

function PospOptions({
  dimensionId,
  selectedValues,
  onChange,
  onPospSearch,
}: {
  dimensionId: string;
  selectedValues: string[];
  onChange: (values: string[]) => void;
  onPospSearch: (query: string) => Promise<FilterOption[]>;
}): React.ReactElement {
  const [search, setSearch] = useState("");
  const [options, setOptions] = useState<FilterOption[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const run = async (): Promise<void> => {
      setLoading(true);
      try {
        const results = await onPospSearch(search.trim());
        if (!cancelled) setOptions(results);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    void run();
    return () => {
      cancelled = true;
    };
  }, [search, onPospSearch]);

  const mergedOptions = useMemo(() => {
    const map = new Map<string, FilterOption>();
    for (const opt of options) map.set(opt.value, opt);
    for (const val of selectedValues) {
      if (!map.has(val)) map.set(val, { value: val, label: val });
    }
    return Array.from(map.values());
  }, [options, selectedValues]);

  const handleToggle = useCallback(
    (value: string, checked: boolean) => {
      if (checked) {
        onChange([...selectedValues, value]);
        return;
      }
      onChange(selectedValues.filter((v) => v !== value));
    },
    [selectedValues, onChange],
  );

  return (
    <div className="filter-popover-options-list">
      <div className="filter-popover-search">
        <input
          type="text"
          className="filter-popover-search-input"
          placeholder="Search POSP…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label="Search POSP"
        />
      </div>
      <FilterCheckboxRow
        id={`filter-${dimensionId}-all`}
        label="All POSPs"
        checked={selectedValues.length === 0}
        onChange={() => onChange([])}
      />
      {loading && mergedOptions.length === 0 && (
        <p className="filter-popover-empty">Loading…</p>
      )}
      {!loading && mergedOptions.length === 0 && (
        <p className="filter-popover-empty">No POSPs found</p>
      )}
      {mergedOptions.map((opt) => (
        <FilterCheckboxRow
          key={opt.value}
          id={`filter-${dimensionId}-${opt.value}`}
          label={opt.label}
          checked={selectedValues.includes(opt.value)}
          onChange={(checked) => handleToggle(opt.value, checked)}
        />
      ))}
    </div>
  );
}

function ProductSubTypeOptions({
  dimensionId,
  filters,
  onFilterChange,
}: {
  dimensionId: string;
  filters: FilterState;
  onFilterChange: (key: keyof FilterState, value: string | string[]) => void;
}): React.ReactElement {
  const groups = useMemo(
    () => getProductSubTypeGroups(filters.productLine),
    [filters.productLine],
  );

  const selectedValues = filters.productSubType;

  const handleToggle = useCallback(
    (value: string, checked: boolean) => {
      const next = checked
        ? [...selectedValues, value]
        : selectedValues.filter((v) => v !== value);
      onFilterChange("productSubType", next);
    },
    [selectedValues, onFilterChange],
  );

  if (groups.length === 0) {
    return <p className="filter-popover-empty">No sub-types available</p>;
  }

  return (
    <div className="filter-popover-options-list">
      <FilterCheckboxRow
        id={`filter-${dimensionId}-all`}
        label="All sub-types"
        checked={selectedValues.length === 0}
        onChange={() => onFilterChange("productSubType", [])}
      />
      {groups.map((group, index) => (
        <FilterAccordionGroup
          key={group.id}
          groupId={group.id}
          label={group.label}
          options={group.options}
          selectedValues={selectedValues}
          onToggle={handleToggle}
          defaultExpanded={index === 0}
        />
      ))}
    </div>
  );
}

export function FilterCategoryOptions({
  dimension,
  filters,
  queryValues,
  onFilterChange,
  onQueryChange,
  onPospSearch,
}: FilterCategoryOptionsProps): React.ReactElement {
  const dimensionId = dimension.queryKey ?? String(dimension.key);

  if (dimension.queryKey) {
    const qKey = dimension.queryKey;
    const qVal = queryValues[qKey] ?? "";

    if (dimension.options.length <= 1) {
      return (
        <QueryTextField
          id={`filter-q-${qKey}`}
          label={dimension.label}
          value={qVal}
          onChange={(next) => onQueryChange(qKey, next)}
        />
      );
    }

    return (
      <SingleCheckboxList
        dimensionId={dimensionId}
        options={dimension.options}
        selectedValue={qVal}
        onChange={(next) => onQueryChange(qKey, next)}
      />
    );
  }

  if (dimension.key === "productSubType") {
    return (
      <ProductSubTypeOptions
        dimensionId={dimensionId}
        filters={filters}
        onFilterChange={onFilterChange}
      />
    );
  }

  if (dimension.key === "posp" && onPospSearch) {
    return (
      <PospOptions
        dimensionId={dimensionId}
        selectedValues={filters.posp}
        onChange={(values) => onFilterChange("posp", values)}
        onPospSearch={onPospSearch}
      />
    );
  }

  if (isMultiFilterKey(dimension.key)) {
    const selectedValues = filters[dimension.key];
    const allLabel = dimension.placeholder ?? `All ${dimension.label}`;

    if (dimension.options.length === 0) {
      return (
        <p className="filter-popover-empty">No {dimension.label.toLowerCase()} options available</p>
      );
    }

    return (
      <MultiCheckboxList
        dimensionId={dimensionId}
        allLabel={allLabel}
        options={dimension.options}
        selectedValues={selectedValues}
        onChange={(values) => onFilterChange(dimension.key, values)}
      />
    );
  }

  if (dimension.key === "dateRange") {
    const showCustomDates = filters.dateRange === "custom";

    return (
      <div className="filter-popover-options-list">
        <SingleCheckboxList
          dimensionId={dimensionId}
          options={dimension.options}
          selectedValue={filters.dateRange}
          onChange={(next) => onFilterChange("dateRange", next || "all")}
        />
        {showCustomDates && (
          <div className="filter-popover-date-range">
            <label htmlFor="filter-dateFrom" className="filter-popover-text-label">
              From
            </label>
            <input
              id="filter-dateFrom"
              type="date"
              className="filter-popover-date-input"
              value={filters.dateFrom}
              onChange={(e) => onFilterChange("dateFrom", e.target.value)}
            />
            <label htmlFor="filter-dateTo" className="filter-popover-text-label">
              To
            </label>
            <input
              id="filter-dateTo"
              type="date"
              className="filter-popover-date-input"
              value={filters.dateTo}
              onChange={(e) => onFilterChange("dateTo", e.target.value)}
            />
          </div>
        )}
      </div>
    );
  }

  if (dimension.key === "premiumRange") {
    return (
      <SingleCheckboxList
        dimensionId={dimensionId}
        options={dimension.options}
        selectedValue={filters.premiumRange}
        onChange={(next) => onFilterChange("premiumRange", next)}
      />
    );
  }

  return <p className="filter-popover-empty">No options available</p>;
}
