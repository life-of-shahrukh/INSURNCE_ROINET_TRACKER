import type { PaginationQueryDto } from '../dto/pagination-query.dto';
import type {
  PaginatedResult,
  PaginationMeta,
} from '../interfaces/paginated-result.interface';

export interface ResolvedPagination {
  page: number;
  pageSize: number;
  skip: number;
  take: number;
}

export function resolvePagination(
  query: PaginationQueryDto,
): ResolvedPagination {
  const page = query.page ?? 1;
  const pageSize = query.pageSize ?? 25;
  return {
    page,
    pageSize,
    skip: (page - 1) * pageSize,
    take: pageSize,
  };
}

export function buildPaginationMeta(
  total: number,
  page: number,
  pageSize: number,
): PaginationMeta {
  return {
    page,
    pageSize,
    total,
    totalPages: total === 0 ? 0 : Math.ceil(total / pageSize),
  };
}

export function buildPaginatedResult<T>(
  data: T[],
  total: number,
  page: number,
  pageSize: number,
): PaginatedResult<T> {
  return {
    data,
    meta: buildPaginationMeta(total, page, pageSize),
  };
}
