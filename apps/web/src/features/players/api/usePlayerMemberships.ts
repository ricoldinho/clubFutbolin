import { useQuery } from '@tanstack/react-query';
import { apiJson } from '@/api/client';
import { queryKeys } from '@/api/query-keys';
import type { PlayerMembershipsResponseDto } from './types';

export const usePlayerMemberships = (playerId: string) =>
  useQuery({
    queryKey: queryKeys.players.memberships(playerId),
    queryFn: () =>
      apiJson<PlayerMembershipsResponseDto>(`/players/${playerId}/memberships`),
    enabled: playerId.length > 0,
  });
