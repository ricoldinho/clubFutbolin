import { useMutation } from '@tanstack/react-query';
import { apiJson } from '@/api/client';
import type { PlayerDto } from '@/features/players/api';

export interface RegisterInput {
  name: string;
  lastname: string;
  nickname: string | null;
  email: string;
  phoneNumber: string;
  birthdate: string;
  category: 'CUARTA' | 'TERCERA' | 'SEGUNDA' | 'PRIMERA' | 'ELITE';
  password: string;
}

/**
 * Registro público de player. El backend asigna siempre role USER.
 */
export const useRegister = () =>
  useMutation({
    mutationFn: (input: RegisterInput) =>
      apiJson<PlayerDto>('/players', {
        method: 'POST',
        body: input,
      }),
  });
