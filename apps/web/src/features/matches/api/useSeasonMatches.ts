import { useQuery } from '@tanstack/react-query';
import { apiJson } from '@/api/client';
import { queryKeys } from '@/api/query-keys';
import type { SeasonMatchesFilters, SeasonMatchesResponseDto } from './types';

const toQueryString = (filters: SeasonMatchesFilters): string => {
  const params = new URLSearchParams({
    page: String(filters.page),
    limit: String(filters.limit),
  });

  if (typeof filters.round === 'number') {
    params.set('round', String(filters.round));
  }

  return params.toString();
};

export const useSeasonMatches = (seasonId: string, filters: SeasonMatchesFilters) =>
  useQuery({
    queryKey: queryKeys.matches.seasonList(seasonId, filters),
    queryFn: () =>
      apiJson<SeasonMatchesResponseDto>(
        `/seasons/${seasonId}/matches?${toQueryString(filters)}`,
      ),
    enabled: seasonId.length > 0,
  });
