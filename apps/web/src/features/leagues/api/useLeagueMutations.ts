import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiJson } from '@/api/client';
import { queryKeys } from '@/api/query-keys';
import type { CreateLeagueInput, LeagueDto, UpdateLeagueInput } from './types';

export const useCreateLeague = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateLeagueInput) =>
      apiJson<LeagueDto>('/leagues', {
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
