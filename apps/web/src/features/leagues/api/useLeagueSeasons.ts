import { useQuery } from '@tanstack/react-query';
import { apiJson } from '@/api/client';
import { queryKeys } from '@/api/query-keys';
import type { LeagueSeasonsResponseDto } from './types';

export const useLeagueSeasons = (leagueId: string) =>
  useQuery({
    queryKey: queryKeys.leagues.seasons(leagueId),
    queryFn: () => apiJson<LeagueSeasonsResponseDto>(`/leagues/${leagueId}/seasons`),
    enabled: leagueId.length > 0,
  });
