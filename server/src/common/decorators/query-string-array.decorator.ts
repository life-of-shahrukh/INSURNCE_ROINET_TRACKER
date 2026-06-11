import { Transform } from 'class-transformer';
import { normalizeQueryArray } from '../utils/query-array.util';

/** DTO transform: repeated or comma-separated query params → string[] */
export function QueryStringArray(): PropertyDecorator {
  return Transform(({ value }: { value: string | string[] | undefined }) =>
    normalizeQueryArray(value),
  );
}
