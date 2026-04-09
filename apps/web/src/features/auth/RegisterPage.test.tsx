import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { RegisterPage } from './RegisterPage';

const mockNavigate = vi.fn();
const mockUseRegister = vi.fn();
const mockMutate = vi.fn();

vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>();
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock('@/features/auth/api/useRegister', () => ({
  useRegister: () => mockUseRegister(),
}));

vi.mock('@/features/players/api', () => ({
  PLAYER_CATEGORIES: ['CUARTA', 'TERCERA', 'SEGUNDA', 'PRIMERA', 'ELITE'],
}));

describe('RegisterPage', () => {
  it('registra un usuario sin permitir elegir role', async () => {
    // Arrange
    const user = userEvent.setup();
    mockUseRegister.mockReturnValue({
      mutate: mockMutate,
      isPending: false,
      isError: false,
      isSuccess: false,
      error: null,
    });

    // Act
    render(
      <MemoryRouter>
        <RegisterPage />
      </MemoryRouter>,
    );
    await user.type(screen.getByLabelText('Nombre'), 'Pedro');
    await user.type(screen.getByLabelText('Apellidos'), 'López');
    await user.type(screen.getByLabelText('Email'), 'pedro@seed.local');
    await user.type(screen.getByLabelText('Teléfono'), '600000003');
    await user.type(screen.getByLabelText('Fecha de nacimiento'), '1994-05-10');
    await user.type(screen.getByLabelText('Contraseña'), 'password123');
    await user.click(screen.getByRole('button', { name: 'Crear cuenta' }));

    // Assert
    expect(screen.queryByLabelText(/role/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/admin/i)).not.toBeInTheDocument();
    expect(mockMutate).toHaveBeenCalledWith(
      expect.not.objectContaining({ role: expect.anything() }),
      expect.any(Object),
    );
  });
});
