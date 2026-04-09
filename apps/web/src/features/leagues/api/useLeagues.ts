import { useQuery } from '@tanstack/react-query';
import { apiJson } from '@/api/client';
import { queryKeys } from '@/api/query-keys';
import type { PaginatedResponse } from '@/api/types';
import type { LeagueDto } from './types';

const listQuery = (page: number, limit: number) =>
  `/leagues?${new URLSearchParams({
    page: String(page),
    limit: String(limit),
  })}`;

export const useLeagues = (page: number, limit: number) =>
  useQuery({
    queryKey: queryKeys.leagues.list({ page, limit }),
    queryFn: () => apiJson<PaginatedResponse<LeagueDto>>(listQuery(page, limit)),
  });
