export interface PaginationParams {
  readonly page: number;
  readonly limit: number;
}

export interface PaginatedResult<T> {
  readonly data: T[];
  readonly total: number;
  readonly page: number;
  readonly lastPage: number;
}

export function computeLastPage(total: number, limit: number): number {
  return total === 0 ? 0 : Math.ceil(total / limit);
}
