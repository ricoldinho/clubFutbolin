import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { LeaguesListPage } from './LeaguesListPage';

const mockUseVerifiedAdmin = vi.fn();
const mockUseLeagues = vi.fn();
const mockCreateMutate = vi.fn();
const mockUpdateMutate = vi.fn();
const mockDeleteMutate = vi.fn();
const mockRegisterTeamToSeasonMutate = vi.fn();

vi.mock('@/features/auth/api/useVerifiedAdmin', () => ({
  useVerifiedAdmin: () => mockUseVerifiedAdmin(),
}));

vi.mock('@/features/leagues/api', () => ({
  LEAGUE_CATEGORIES: ['ELITE', 'PRO', 'AVANZADO', 'MASTER', 'PRIMERA', 'SEGUNDA', 'TERCERA', 'CUARTA'],
  useLeagues: (...args: unknown[]) => mockUseLeagues(...args),
  useCreateLeague: () => ({
    mutate: mockCreateMutate,
    isPending: false,
    isError: false,
    error: null,
  }),
  useUpdateLeague: () => ({
    mutate: mockUpdateMutate,
    isPending: false,
    isError: false,
    error: null,
  }),
  useDeleteLeague: () => ({
    mutate: mockDeleteMutate,
    isPending: false,
    isError: false,
    error: null,
  }),
  useRegisterTeamToSeason: () => ({
    mutate: mockRegisterTeamToSeasonMutate,
    reset: vi.fn(),
    isPending: false,
    isError: false,
    error: null,
  }),
}));

vi.mock('@/features/teams/api', () => ({
  useTeams: () => ({
    data: { data: [] },
    isPending: false,
    isFetching: false,
  }),
}));

const setupListMock = () => {
  mockUseLeagues.mockReturnValue({
    isPending: false,
    isError: false,
    error: null,
    isFetching: false,
    data: {
      data: [{ id: 'league-1', name: 'Liga Norte', leagueCategory: 'TERCERA' }],
      meta: { total: 1, page: 1, lastPage: 1 },
    },
  });
};

describe('LeaguesListPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCreateMutate.mockImplementation(() => {});
    mockRegisterTeamToSeasonMutate.mockImplementation(() => {});
  });

  it('muestra controles de escritura para admin verificado', async () => {
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
        <LeaguesListPage />
      </MemoryRouter>,
    );
    await user.type(screen.getByPlaceholderText('Nombre de la liga'), 'Liga Sur');
    await user.click(screen.getByRole('button', { name: 'Crear liga' }));

    // Assert
    expect(screen.getByRole('button', { name: 'Editar' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Borrar' })).toBeInTheDocument();
    expect(mockCreateMutate).toHaveBeenCalled();
  });

  it('abre modal de asociar equipos tras crear liga con season inicial', async () => {
    // Arrange
    const user = userEvent.setup();
    setupListMock();
    mockUseVerifiedAdmin.mockReturnValue({
      token: 'token-admin',
      isAdminClaim: true,
      isVerifiedAdmin: true,
      isVerifyingAdmin: false,
    });
    mockCreateMutate.mockImplementation((_input, options) => {
      options?.onSuccess?.({
        id: 'league-2',
        name: 'Liga Centro',
        leagueCategory: 'SEGUNDA',
        initialSeason: {
          id: 'season-2',
          year: 2026,
          leagueId: 'league-2',
          championId: null,
          secondId: null,
        },
      });
    });

    // Act
    render(
      <MemoryRouter>
        <LeaguesListPage />
      </MemoryRouter>,
    );
    await user.type(screen.getByPlaceholderText('Nombre de la liga'), 'Liga Centro');
    await user.click(screen.getByRole('button', { name: 'Crear liga' }));

    // Assert
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Asociar equipos a la season 2026')).toBeInTheDocument();
  });

  it('oculta controles de escritura cuando no es admin', () => {
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
        <LeaguesListPage />
      </MemoryRouter>,
    );

    // Assert
    expect(screen.queryByPlaceholderText('Nombre de la liga')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Editar' })).not.toBeInTheDocument();
  });

  it('permite editar una liga desde el listado', async () => {
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
        <LeaguesListPage />
      </MemoryRouter>,
    );
    await user.click(screen.getByRole('button', { name: 'Editar' }));
    const nameInput = screen.getByDisplayValue('Liga Norte');
    await user.clear(nameInput);
    await user.type(nameInput, 'Liga Oeste');
    await user.click(screen.getByRole('button', { name: 'Guardar' }));

    // Assert
    expect(mockUpdateMutate).toHaveBeenCalledWith(
      expect.objectContaining({
        leagueId: 'league-1',
        name: 'Liga Oeste',
      }),
    );
  });

  it('permite borrar una liga desde el listado', async () => {
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
        <LeaguesListPage />
      </MemoryRouter>,
    );
    await user.click(screen.getByRole('button', { name: 'Borrar' }));

    // Assert
    expect(mockDeleteMutate).toHaveBeenCalledWith('league-1');
  });
});
