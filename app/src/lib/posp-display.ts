/** Human label: `SHIVRAJ WANOLE (CSP023057)` — code only when name equals code. */
export function formatPospLabel(name: string, code: string): string {
  const trimmed = name.trim();
  if (!trimmed || trimmed.toUpperCase() === code.toUpperCase()) {
    return code;
  }
  return `${trimmed} (${code})`;
}

export function pospLabelFromParts(
  posp: { name: string; code: string } | null | undefined,
): string {
  if (!posp) return "—";
  return formatPospLabel(posp.name, posp.code);
}
