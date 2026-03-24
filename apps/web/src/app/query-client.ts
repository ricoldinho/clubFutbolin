import { QueryClient } from '@tanstack/react-query';
import { ApiError } from '@/api/client';

/**
 * No reintentar errores de cliente ni 401/403 (auth); sí reintentar red/5xx hasta 2 veces.
 */
const queryRetry = (failureCount: number, error: unknown): boolean => {
  if (failureCount >= 2) return false;
  if (error instanceof ApiError) {
    if (error.status === 401 || error.status === 403) return false;
    if (error.status >= 400 && error.status < 500) return false;
  }
  return true;
};

export const createAppQueryClient = (): QueryClient =>
  new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60_000,
        gcTime: 5 * 60_000,
        retry: queryRetry,
        refetchOnWindowFocus: true,
      },
      mutations: {
        retry: false,
      },
    },
  });
