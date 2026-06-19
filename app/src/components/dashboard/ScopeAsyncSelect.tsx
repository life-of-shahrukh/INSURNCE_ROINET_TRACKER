"use client";

import { useEffect, useState } from "react";
import {
  AutoComplete,
  type AutoCompleteChangeEvent,
  type AutoCompleteCompleteEvent,
} from "primereact/autocomplete";

export interface GeoOption {
  id: string;
  name: string;
}

interface ScopeAsyncSelectProps {
  placeholder: string;
  /** Currently selected id from the parent scope (used to detect resets). */
  selectedId?: string;
  onSearch: (query: string) => Promise<GeoOption[]>;
  onSelect: (item: GeoOption | undefined) => void;
}

/**
 * Single-value server-side typeahead for big geo datasets (districts, cities)
 * in the dashboard scope bar, built on PrimeReact's AutoComplete. Selecting a
 * suggestion emits the chosen option; clearing the field emits `undefined`.
 */
export function ScopeAsyncSelect({
  placeholder,
  selectedId,
  onSearch,
  onSelect,
}: ScopeAsyncSelectProps): React.ReactElement {
  const [value, setValue] = useState<GeoOption | string>("");
  const [suggestions, setSuggestions] = useState<GeoOption[]>([]);

  // Clear the visible value when the parent scope resets this dimension.
  useEffect(() => {
    if (!selectedId) setValue("");
  }, [selectedId]);

  const complete = async (e: AutoCompleteCompleteEvent): Promise<void> => {
    setSuggestions(await onSearch(e.query));
  };

  const handleChange = (e: AutoCompleteChangeEvent): void => {
    setValue(e.value);
    if (e.value === "" || e.value == null) {
      onSelect(undefined);
    } else if (typeof e.value === "object") {
      onSelect(e.value as GeoOption);
    }
  };

  return (
    <AutoComplete
      className="scope-bar__autocomplete"
      inputClassName="scope-bar__select"
      placeholder={placeholder}
      value={value}
      suggestions={suggestions}
      completeMethod={(e) => void complete(e)}
      field="name"
      delay={250}
      dropdown
      forceSelection
      onChange={handleChange}
      aria-label={placeholder}
    />
  );
}
