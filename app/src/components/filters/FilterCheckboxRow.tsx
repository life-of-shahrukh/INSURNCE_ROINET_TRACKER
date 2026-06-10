"use client";

interface FilterCheckboxRowProps {
  id: string;
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  indent?: boolean;
}

export function FilterCheckboxRow({
  id,
  label,
  checked,
  onChange,
  indent = false,
}: FilterCheckboxRowProps): React.ReactElement {
  return (
    <label
      htmlFor={id}
      className={`filter-checkbox-row${indent ? " filter-checkbox-row--indent" : ""}`}
    >
      <input
        id={id}
        type="checkbox"
        className="filter-checkbox-input"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span
        className={`filter-checkbox${checked ? " filter-checkbox--checked" : ""}`}
        aria-hidden
      >
        {checked && (
          <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
            <path
              d="M2 6l3 3 5-5"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </span>
      <span className="filter-checkbox-label">{label}</span>
    </label>
  );
}
