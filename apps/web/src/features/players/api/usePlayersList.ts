import { useQuery } from '@tanstack/react-query';
import { apiJson } from '@/api/client';
import { queryKeys } from '@/api/query-keys';
import type { PaginatedResponse } from '@/api/types';
import type { PlayerDto } from '@/features/players/api/types';

const listQuery = (page: number, limit: number) =>
  `/players?${new URLSearchParams({
    page: String(page),
    limit: String(limit),
  })}`;

export const usePlayersList = (page: number, limit: number) =>
  useQuery({
    queryKey: queryKeys.players.list({ page, limit }),
    queryFn: () => apiJson<PaginatedResponse<PlayerDto>>(listQuery(page, limit)),
  });
