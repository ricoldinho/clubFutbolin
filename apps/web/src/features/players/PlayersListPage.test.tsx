import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { PlayersListPage } from './PlayersListPage';

const mockUseVerifiedAdmin = vi.fn();
const mockUsePlayersList = vi.fn();
const mockCreateMutate = vi.fn();
const mockUpdateMutate = vi.fn();
const mockDeleteMutate = vi.fn();

vi.mock('@/features/auth/api/useVerifiedAdmin', () => ({
  useVerifiedAdmin: () => mockUseVerifiedAdmin(),
}));

vi.mock('@/features/players/api', () => ({
  PLAYER_CATEGORIES: ['CUARTA', 'TERCERA', 'SEGUNDA', 'PRIMERA', 'ELITE'],
  PLAYER_ROLES: ['USER', 'ADMIN'],
  usePlayersList: (...args: unknown[]) => mockUsePlayersList(...args),
  useCreatePlayer: () => ({
    mutate: mockCreateMutate,
    isPending: false,
    isError: false,
    error: null,
  }),
  useUpdatePlayer: () => ({
    mutate: mockUpdateMutate,
    isPending: false,
    isError: false,
    error: null,
  }),
  useDeletePlayer: () => ({
    mutate: mockDeleteMutate,
    isPending: false,
    isError: false,
    error: null,
  }),
}));

const setupListMock = () => {
  mockUsePlayersList.mockReturnValue({
    isPending: false,
    isError: false,
    error: null,
    isFetching: false,
    data: {
      data: [
        {
          id: 'player-1',
          name: 'Juan',
          lastname: 'Pérez',
          nickname: 'jp',
          email: 'juan@example.com',
          phoneNumber: '600000001',
          birthdate: '1990-01-01',
          category: 'PRIMERA',
          role: 'USER',
        },
      ],
      meta: { total: 1, page: 1, lastPage: 1 },
    },
  });
};

describe('PlayersListPage', () => {
  it('oculta acciones de escritura cuando no es admin verificado', () => {
    // Arrange
    setupListMock();
    mockUseVerifiedAdmin.mockReturnValue({
      token: null,
      isAdminClaim: false,
      isVerifiedAdmin: false,
      isVerifyingAdmin: false,
    });

    // Act
    render(
      <MemoryRouter>
        <PlayersListPage />
      </MemoryRouter>,
    );

    // Assert
    expect(screen.queryByRole('heading', { name: 'Crear Player' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Editar' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Borrar' })).not.toBeInTheDocument();
  });

  it('muestra acciones de admin y crea un player', async () => {
    // Arrange
    const user = userEvent.setup();
    setupListMock();
    mockUseVerifiedAdmin.mockReturnValue({
      token: 'token-admin',
      isAdminClaim: true,
      isVerifiedAdmin: true,
      isVerifyingAdmin: false,
    });

    // Act
    render(
      <MemoryRouter>
        <PlayersListPage />
      </MemoryRouter>,
    );
    await user.type(screen.getByPlaceholderText('Nombre'), 'María');
    await user.type(screen.getByPlaceholderText('Apellidos'), 'Gómez');
    await user.type(screen.getByPlaceholderText('Email'), 'maria@example.com');
    await user.type(screen.getByPlaceholderText('Teléfono'), '600000002');
    await user.type(screen.getByPlaceholderText('Contraseña (mínimo 8)'), 'password123');
    await user.type(screen.getByDisplayValue(''), '1992-02-02');
    await user.click(screen.getByRole('button', { name: 'Crear' }));

    // Assert
    expect(screen.getByRole('heading', { name: 'Crear Player' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Editar' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Borrar' })).toBeInTheDocument();
    expect(mockCreateMutate).toHaveBeenCalled();
  });
});
