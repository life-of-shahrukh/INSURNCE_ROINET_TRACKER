/** Strip non-digits and leading zeros so typing "4" on "0" yields "4", not "04". */
export function sanitizeIntegerInput(text: string): string {
  const digits = text.replace(/\D/g, '');
  if (digits === '') {
    return '';
  }
  const parsed = parseInt(digits, 10);
  return Number.isNaN(parsed) ? '' : String(parsed);
}

/** Format stored number for an editable field — zero/empty shows blank with placeholder. */
export function formatNumericFieldValue(value: number | null | undefined): string {
  if (value == null || value === 0) {
    return '';
  }
  return String(value);
}
