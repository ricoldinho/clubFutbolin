import { useQuery } from '@tanstack/react-query';
import { apiJson } from '@/api/client';
import { queryKeys } from '@/api/query-keys';
import type { PaginatedResponse } from '@/api/types';
import type { TeamListItemDto } from './types';

const listQuery = (page: number, limit: number) =>
  `/teams?${new URLSearchParams({
    page: String(page),
    limit: String(limit),
  })}`;

export const useTeams = (page: number, limit: number) =>
  useQuery({
    queryKey: queryKeys.teams.list({ page, limit }),
    queryFn: () => apiJson<PaginatedResponse<TeamListItemDto>>(listQuery(page, limit)),
  });
