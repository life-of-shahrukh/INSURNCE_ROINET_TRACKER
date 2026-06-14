/** Generic RFC-4180 CSV builder. */

export interface CsvColumn<T> {
  header: string;
  value: (row: T) => string | number | boolean | null | undefined;
}

function escapeCsvCell(
  val: string | number | boolean | null | undefined,
): string {
  const str = val == null ? '' : String(val);
  // Wrap in quotes if the value contains commas, quotes, or newlines.
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function toCsv<T>(rows: T[], columns: CsvColumn<T>[]): string {
  const header = columns.map((c) => escapeCsvCell(c.header)).join(',');
  const body = rows
    .map((row) => columns.map((c) => escapeCsvCell(c.value(row))).join(','))
    .join('\n');
  return body.length ? `${header}\n${body}` : header;
}
