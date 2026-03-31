import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiJson } from '@/api/client';
import { queryKeys } from '@/api/query-keys';
import type { MatchMutationResponseDto, UpdateMatchScoreInput } from './types';

export const useUpdateMatchScore = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ matchId, homeScore, awayScore }: UpdateMatchScoreInput) =>
      apiJson<MatchMutationResponseDto>(`/matches/${matchId}/score`, {
        method: 'PATCH',
        body: { homeScore, awayScore },
      }),
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.matches.all });
      void queryClient.invalidateQueries({
        queryKey: queryKeys.matches.detail(variables.matchId),
      });
    },
  });
};
