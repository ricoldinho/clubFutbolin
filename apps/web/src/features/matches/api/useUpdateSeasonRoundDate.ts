import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiJson } from '@/api/client';
import { queryKeys } from '@/api/query-keys';
import type {
  UpdateSeasonRoundDateInput,
  UpdateSeasonRoundDateResponseDto,
} from './types';

export const useUpdateSeasonRoundDate = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ seasonId, round, date }: UpdateSeasonRoundDateInput) =>
      apiJson<UpdateSeasonRoundDateResponseDto>(`/seasons/${seasonId}/rounds/${round}/date`, {
        method: 'PATCH',
        body: { date },
      }),
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.matches.season(variables.seasonId),
      });
    },
  });
};
