import { useQuery } from '@tanstack/react-query';
import { apiJson } from '@/api/client';
import { queryKeys } from '@/api/query-keys';
import type { MatchDto } from './types';

export const useMatchById = (matchId: string) =>
  useQuery({
    queryKey: queryKeys.matches.detail(matchId),
    queryFn: () => apiJson<MatchDto>(`/matches/${matchId}`),
    enabled: matchId.length > 0,
  });
