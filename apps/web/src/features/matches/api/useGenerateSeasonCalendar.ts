import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiJson } from '@/api/client';
import { queryKeys } from '@/api/query-keys';
import type {
  GenerateSeasonCalendarInput,
  GenerateSeasonCalendarResponseDto,
} from './types';

export const useGenerateSeasonCalendar = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ seasonId, startDate, doubleRoundRobin }: GenerateSeasonCalendarInput) =>
      apiJson<GenerateSeasonCalendarResponseDto>(`/seasons/${seasonId}/calendar/generate`, {
        method: 'POST',
        body: {
          ...(startDate ? { startDate } : {}),
          ...(doubleRoundRobin !== undefined ? { doubleRoundRobin } : {}),
        },
      }),
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.matches.season(variables.seasonId),
      });
    },
  });
};
