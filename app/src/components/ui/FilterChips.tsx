"use client";

export interface FilterOption {
  value: string;
  label: string;
}

interface FilterChipsProps {
  options: FilterOption[];
  value: string;
  onChange: (value: string) => void;
}

export function FilterChips({ options, value, onChange }: FilterChipsProps) {
  return (
    <>
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          className={`filter-chip ${value === opt.value ? "active" : ""}`}
          onClick={() => onChange(opt.value)}
        >
          {opt.label}
        </button>
      ))}
    </>
  );
}
