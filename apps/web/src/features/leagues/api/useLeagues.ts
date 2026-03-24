import { useQuery } from '@tanstack/react-query';
import { apiJson } from '@/api/client';
import { queryKeys } from '@/api/query-keys';

export interface LeagueDto {
  id: string | null;
  name: string;
  leagueCategory: string;
}

export const useLeagues = () =>
  useQuery({
    queryKey: queryKeys.leagues.all,
    queryFn: () => apiJson<LeagueDto[]>('/leagues'),
  });
