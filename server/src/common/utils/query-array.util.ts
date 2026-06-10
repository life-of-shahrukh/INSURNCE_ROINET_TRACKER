/** Normalize query param values to string[] (supports repeated keys and comma-separated). */
export function normalizeQueryArray(
  value: string | string[] | undefined,
): string[] | undefined {
  if (value === undefined || value === null) return undefined;

  const raw = Array.isArray(value) ? value : [value];
  const flattened = raw
    .flatMap((item) => item.split(','))
    .map((item) => item.trim())
    .filter((item) => item.length > 0);

  return flattened.length > 0 ? flattened : undefined;
}
