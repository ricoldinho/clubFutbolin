import { useQuery } from '@tanstack/react-query';
import { apiJson } from '@/api/client';
import { queryKeys } from '@/api/query-keys';
import type { TeamProfileDto } from './types';

export const useTeamProfile = (teamId: string) =>
  useQuery({
    queryKey: queryKeys.teams.profile(teamId),
    queryFn: () => apiJson<TeamProfileDto>(`/teams/${teamId}/profile`),
    enabled: teamId.length > 0,
  });
