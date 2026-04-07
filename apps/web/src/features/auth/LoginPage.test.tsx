import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { LoginPage } from './LoginPage';

const mockNavigate = vi.fn();
const mockUseLogin = vi.fn();

vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>();
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock('@/features/auth/api/useLogin', () => ({
  useLogin: (...args: unknown[]) => mockUseLogin(...args),
}));

const buildJwtWithSub = (sub: string): string => {
  const header = btoa(JSON.stringify({ alg: 'none', typ: 'JWT' }));
  const payload = btoa(JSON.stringify({ sub, role: 'USER' }));
  return `${header}.${payload}.signature`;
};

describe('LoginPage', () => {
  it('redirige al perfil del jugador tras login exitoso', async () => {
    const user = userEvent.setup();

    mockUseLogin.mockImplementation((options?: { onSuccess?: (data: { token: string }) => void }) => ({
      mutate: () => {
        options?.onSuccess?.({ token: buildJwtWithSub('player-123') });
      },
      isPending: false,
      isError: false,
      isSuccess: false,
      error: null,
    }));

    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>,
    );

    await user.type(screen.getByLabelText('Email'), 'test@example.com');
    await user.type(screen.getByLabelText('Contraseña'), 'password123');
    await user.click(screen.getByRole('button', { name: 'Entrar' }));

    expect(mockNavigate).toHaveBeenCalledWith('/players/player-123');
  });
});
