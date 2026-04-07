/**
 * Contratos comunes de respuestas HTTP del API (paginación).
 */
export interface PaginatedMeta {
  total: number;
  page: number;
  lastPage: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: PaginatedMeta;
}
