import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiJson } from '@/api/client';
import { queryKeys } from '@/api/query-keys';
import type { MatchMutationResponseDto, UpdateMatchStatusInput } from './types';

export const useUpdateMatchStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ matchId, status }: UpdateMatchStatusInput) =>
      apiJson<MatchMutationResponseDto>(`/matches/${matchId}/status`, {
        method: 'PATCH',
        body: { status },
      }),
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.matches.all });
      void queryClient.invalidateQueries({
        queryKey: queryKeys.matches.detail(variables.matchId),
      });
    },
  });
};
