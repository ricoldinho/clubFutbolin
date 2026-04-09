import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiJson } from '@/api/client';
import { queryKeys } from '@/api/query-keys';
import type { CreateTeamInput, TeamListItemDto, UpdateTeamInput } from './types';

export const useCreateTeam = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateTeamInput) =>
      apiJson<TeamListItemDto>('/teams', {
        method: 'POST',
        body: input,
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.teams.all });
    },
  });
};

export const useUpdateTeam = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ teamId, name }: UpdateTeamInput) =>
      apiJson<TeamListItemDto>(`/teams/${teamId}`, {
        method: 'PATCH',
        body: { name },
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.teams.all });
    },
  });
};

export const useDeleteTeam = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (teamId: string) =>
      apiJson<void>(`/teams/${teamId}`, {
        method: 'DELETE',
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.teams.all });
    },
  });
};
