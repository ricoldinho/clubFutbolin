import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiJson, setStoredAuthToken } from '@/api/client';
import { queryKeys } from '@/api/query-keys';

export interface LoginInput {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  expiresIn: string;
}

/**
 * Login: guarda el JWT y invalida listas que dependen del usuario autenticado (p. ej. ligas).
 */
export const useLogin = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: LoginInput) =>
      apiJson<LoginResponse>('/auth/login', {
        method: 'POST',
        body: { email: input.email, password: input.password },
      }),
    onSuccess: (data) => {
      setStoredAuthToken(data.token);
      void queryClient.invalidateQueries({ queryKey: queryKeys.leagues.all });
    },
  });
};
