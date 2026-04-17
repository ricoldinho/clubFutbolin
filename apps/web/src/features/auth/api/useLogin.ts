import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiJson, notifyAuthSessionChanged } from '@/api/client';
import { queryKeys } from '@/api/query-keys';

export interface LoginInput {
  email: string;
  password: string;
}

export interface LoginResponse {
  playerId: string;
  role: string;
  expiresIn: string;
}

interface UseLoginOptions {
  onSuccess?: (data: LoginResponse) => void;
}

/**
 * Login de sesión basada en cookies httpOnly y posterior invalidación de queries.
 */
export const useLogin = (options: UseLoginOptions = {}) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: LoginInput) =>
      apiJson<LoginResponse>('/auth/login', {
        method: 'POST',
        body: { email: input.email, password: input.password },
      }),
    onSuccess: (data) => {
      notifyAuthSessionChanged();
      void queryClient.invalidateQueries({ queryKey: queryKeys.auth.all });
      void queryClient.invalidateQueries({ queryKey: queryKeys.leagues.all });
      void queryClient.invalidateQueries({ queryKey: queryKeys.players.all });
      options.onSuccess?.(data);
    },
  });
};
