import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiJson } from '@/api/client';
import { queryKeys } from '@/api/query-keys';
import type { RegisterTeamToSeasonInput, RegisterTeamToSeasonResponseDto } from './types';

/**
 * Inscribe un equipo en una temporada (POST /rosters/register). Solo ADMIN.
 * Invalida equipos por categoría de la liga y partidos de la season afectada.
 */
export const useRegisterTeamToSeason = (leagueId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: RegisterTeamToSeasonInput) =>
      apiJson<RegisterTeamToSeasonResponseDto>('/rosters/register', {
        method: 'POST',
        body: input,
      }),
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.leagues.seasonTeamsByCategory(leagueId, variables.seasonId),
      });
      void queryClient.invalidateQueries({
        queryKey: ['matches', 'season', variables.seasonId],
      });
    },
  });
};
