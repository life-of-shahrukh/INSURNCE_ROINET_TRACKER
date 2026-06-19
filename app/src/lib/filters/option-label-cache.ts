/**
 * Process-wide cache of value→label for server-searched filter options
 * (districts, cities, POSPs, members). These options are never loaded in bulk,
 * so when an id is selected we remember its label here and active-filter chips
 * can render the human-readable name instead of the raw id.
 */
const cache = new Map<string, string>();

export function rememberOptionLabel(value: string, label: string): void {
  if (value && label && value !== label) cache.set(value, label);
}

export function rememberOptionLabels(
  items: Array<{ value: string; label: string }>,
): void {
  for (const item of items) rememberOptionLabel(item.value, item.label);
}

export function getCachedOptionLabel(value: string): string | undefined {
  return cache.get(value);
}
