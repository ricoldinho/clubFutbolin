import { useQuery } from '@tanstack/react-query';
import { apiJson } from '@/api/client';
import { queryKeys } from '@/api/query-keys';
import type { SeasonTeamsByCategoryResponseDto } from './types';

export const useSeasonTeamsByCategory = (leagueId: string, seasonId: string) =>
  useQuery({
    queryKey: queryKeys.leagues.seasonTeamsByCategory(leagueId, seasonId),
    queryFn: () =>
      apiJson<SeasonTeamsByCategoryResponseDto>(
        `/leagues/${leagueId}/seasons/${seasonId}/teams-by-category`,
      ),
    enabled: leagueId.length > 0 && seasonId.length > 0,
  });
