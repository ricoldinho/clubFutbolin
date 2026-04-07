import { useQuery } from '@tanstack/react-query';
import { apiJson } from '@/api/client';
import { queryKeys } from '@/api/query-keys';
import type { PlayerDto } from './types';

export const usePlayerById = (playerId: string) =>
  useQuery({
    queryKey: queryKeys.players.detail(playerId),
    queryFn: () => apiJson<PlayerDto>(`/players/${playerId}`),
    enabled: playerId.length > 0,
  });
