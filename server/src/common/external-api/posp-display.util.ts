import type { ExternalPospData } from './external-api.types';

/** Cognitensor POSP display name (`username`); falls back to UserCode. */
export function resolvePospDisplayName(
  row: Pick<ExternalPospData, 'username' | 'UserCode'>,
): string {
  const name = row.username?.trim();
  return name && name.length > 0 ? name : row.UserCode;
}

/** Human label: `SHIVRAJ WANOLE (CSP023057)` — code only when name equals code. */
export function formatPospLabel(name: string, code: string): string {
  const trimmed = name.trim();
  if (!trimmed || trimmed.toUpperCase() === code.toUpperCase()) {
    return code;
  }
  return `${trimmed} (${code})`;
}
