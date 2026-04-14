import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiJson } from '@/api/client';
import { queryKeys } from '@/api/query-keys';
import type {
  CreateLeagueInput,
  CreateSeasonInput,
  CreatedLeagueDto,
  LeagueDto,
  RegisterTeamToSeasonInput,
  RegisterTeamToSeasonResponseDto,
  SeasonDto,
  UpdateLeagueInput,
} from './types';

export const useCreateLeague = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateLeagueInput) =>
      apiJson<CreatedLeagueDto>('/leagues', {
        method: 'POST',
        body: input,
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.leagues.all });
    },
  });
};

export const useUpdateLeague = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ leagueId, ...input }: UpdateLeagueInput) =>
      apiJson<LeagueDto>(`/leagues/${leagueId}`, {
        method: 'PATCH',
        body: input,
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.leagues.all });
    },
  });
};

export const useDeleteLeague = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (leagueId: string) =>
      apiJson<void>(`/leagues/${leagueId}`, {
        method: 'DELETE',
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.leagues.all });
    },
  });
};

export const useCreateSeason = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateSeasonInput) =>
      apiJson<SeasonDto>('/seasons', {
        method: 'POST',
        body: input,
      }),
    onSuccess: (_season, variables) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.leagues.seasons(variables.leagueId) });
    },
  });
};

export const useRegisterTeamToSeason = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ leagueId: _leagueId, ...input }: RegisterTeamToSeasonInput) =>
      apiJson<RegisterTeamToSeasonResponseDto>('/rosters/register', {
        method: 'POST',
        body: input,
      }),
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.leagues.all });
      void queryClient.invalidateQueries({ queryKey: queryKeys.leagues.seasons(variables.leagueId) });
      void queryClient.invalidateQueries({
        queryKey: queryKeys.leagues.seasonTeamsByCategory(variables.leagueId, variables.seasonId),
      });
    },
  });
};
