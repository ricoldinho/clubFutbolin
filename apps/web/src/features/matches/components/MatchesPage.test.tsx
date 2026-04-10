import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { ApiError } from '@/api/client';
import { MatchesPage } from './MatchesPage';

const mockUseSeasonMatches = vi.fn();
const mockUseMatchById = vi.fn();
const mockUseGenerateSeasonCalendar = vi.fn();
const mockUseUpdateMatchScore = vi.fn();
const mockUseUpdateMatchStatus = vi.fn();
const mockUseVerifiedAdmin = vi.fn();

vi.mock('@/features/matches/api', () => ({
  useSeasonMatches: (...args: unknown[]) => mockUseSeasonMatches(...args),
  useMatchById: (...args: unknown[]) => mockUseMatchById(...args),
  useGenerateSeasonCalendar: () => mockUseGenerateSeasonCalendar(),
  useUpdateMatchScore: () => mockUseUpdateMatchScore(),
  useUpdateMatchStatus: () => mockUseUpdateMatchStatus(),
}));

vi.mock('@/features/auth/api/useVerifiedAdmin', () => ({
  useVerifiedAdmin: () => mockUseVerifiedAdmin(),
}));

const defaultSeasonResponse = {
  data: [
    {
      id: 'match-1',
      seasonId: 'season-1',
      homeTeamSeasonId: 'home-team-123456',
      awayTeamSeasonId: 'away-team-123456',
      homeTeam: { teamId: 'team-home-1', name: 'Team Home' },
      awayTeam: { teamId: 'team-away-1', name: 'Team Away' },
      homeScore: 1,
      awayScore: 0,
      date: new Date().toISOString(),
      round: 3,
      status: 'SCHEDULED',
    },
  ],
  meta: { total: 1, page: 1, lastPage: 1 },
};

const setupDefaultMocks = () => {
  mockUseVerifiedAdmin.mockReturnValue({
    token: null,
    isAdminClaim: false,
    isVerifiedAdmin: false,
    isVerifyingAdmin: false,
  });
  mockUseSeasonMatches.mockReturnValue({
    data: defaultSeasonResponse,
    isFetching: false,
    isPending: false,
    isError: false,
    error: null,
  });
  mockUseMatchById.mockReturnValue({
    data: {
      id: 'match-1',
      seasonId: 'season-1',
      homeTeamSeasonId: 'home-team-123456',
      awayTeamSeasonId: 'away-team-123456',
      homeTeam: { teamId: 'team-home-1', name: 'Team Home' },
      awayTeam: { teamId: 'team-away-1', name: 'Team Away' },
      homeScore: 1,
      awayScore: 0,
      date: new Date().toISOString(),
      round: 3,
      status: 'SCHEDULED',
    },
    isFetching: false,
    isPending: false,
    isError: false,
    error: null,
  });
  mockUseGenerateSeasonCalendar.mockReturnValue({
    mutate: vi.fn(),
    isPending: false,
    isSuccess: false,
    isError: false,
    error: null,
  });
  mockUseUpdateMatchScore.mockReturnValue({
    mutate: vi.fn(),
    isPending: false,
    isSuccess: false,
    isError: false,
    error: null,
  });
  mockUseUpdateMatchStatus.mockReturnValue({
    mutate: vi.fn(),
    isPending: false,
    isSuccess: false,
    isError: false,
    error: null,
  });
};

const renderPage = (initialPath = '/matches') =>
  render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route path="/matches" element={<MatchesPage />} />
      </Routes>
    </MemoryRouter>,
  );

describe('MatchesPage', () => {
  it('renderiza listado de partidos', () => {
    // Arrange
    setupDefaultMocks();

    // Act
    renderPage();

    // Assert
    expect(screen.getByRole('heading', { name: 'Matches' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /ver detalle del partido/i })).toBeInTheDocument();
  });

  it('aplica filtro de jornada y temporada', async () => {
    // Arrange
    const user = userEvent.setup();
    setupDefaultMocks();

    // Act
    renderPage();
    await user.type(screen.getByLabelText('Season ID'), 'season-xyz');
    await user.type(screen.getByLabelText('Jornada (opcional)'), '3');
    await user.click(screen.getByRole('button', { name: 'Aplicar filtros' }));

    // Assert
    await waitFor(() => {
      expect(mockUseSeasonMatches).toHaveBeenLastCalledWith('season-xyz', {
        page: 1,
        limit: 20,
        round: 3,
      });
    });
  });

  it('permite generar calendario para admin verificado', async () => {
    // Arrange
    const user = userEvent.setup();
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);
    const mutateGenerate = vi.fn();
    setupDefaultMocks();
    mockUseVerifiedAdmin.mockReturnValue({
      token: 'token-admin',
      isAdminClaim: true,
      isVerifiedAdmin: true,
      isVerifyingAdmin: false,
    });
    mockUseGenerateSeasonCalendar.mockReturnValue({
      mutate: mutateGenerate,
      isPending: false,
      isSuccess: false,
      isError: false,
      error: null,
    });

    // Act
    renderPage();
    await user.type(screen.getByLabelText('Season ID'), 'season-xyz');
    await user.click(screen.getByRole('button', { name: 'Aplicar filtros' }));
    await user.click(screen.getByRole('button', { name: 'Generar calendario' }));

    // Assert
    expect(mutateGenerate).toHaveBeenCalledWith({ seasonId: 'season-xyz' });
    confirmSpy.mockRestore();
  });

  it('permite actualizar marcador y estado para admin verificado', async () => {
    // Arrange
    const user = userEvent.setup();
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);
    const mutateScore = vi.fn();
    const mutateStatus = vi.fn();
    setupDefaultMocks();
    mockUseVerifiedAdmin.mockReturnValue({
      token: 'token-admin',
      isAdminClaim: true,
      isVerifiedAdmin: true,
      isVerifyingAdmin: false,
    });
    mockUseUpdateMatchScore.mockReturnValue({
      mutate: mutateScore,
      isPending: false,
      isSuccess: false,
      isError: false,
      error: null,
    });
    mockUseUpdateMatchStatus.mockReturnValue({
      mutate: mutateStatus,
      isPending: false,
      isSuccess: false,
      isError: false,
      error: null,
    });

    // Act
    renderPage();
    await user.clear(screen.getByLabelText('Goles equipo local'));
    await user.type(screen.getByLabelText('Goles equipo local'), '2');
    await user.clear(screen.getByLabelText('Goles equipo visitante'));
    await user.type(screen.getByLabelText('Goles equipo visitante'), '1');
    await user.click(screen.getByRole('button', { name: 'Guardar' }));
    await user.click(screen.getByRole('button', { name: 'Marcar aplazado' }));

    // Assert
    expect(mutateScore).toHaveBeenCalledWith({
      matchId: 'match-1',
      homeScore: 2,
      awayScore: 1,
    });
    expect(mutateStatus).toHaveBeenCalledWith({
      matchId: 'match-1',
      status: 'POSTPONED',
    });
    expect(confirmSpy).toHaveBeenCalledTimes(2);
    confirmSpy.mockRestore();
  });

  it('muestra error de API en el listado', () => {
    // Arrange
    setupDefaultMocks();
    mockUseSeasonMatches.mockReturnValue({
      data: undefined,
      isFetching: false,
      isPending: false,
      isError: true,
      error: new ApiError(400, 'Listado inválido'),
    });

    // Act
    renderPage();

    // Assert
    expect(screen.getByText('Listado inválido')).toBeInTheDocument();
  });

  it('no envía mutaciones si el usuario cancela la confirmación', async () => {
    // Arrange
    const user = userEvent.setup();
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false);
    const mutateScore = vi.fn();
    const mutateStatus = vi.fn();
    setupDefaultMocks();
    mockUseVerifiedAdmin.mockReturnValue({
      token: 'token-admin',
      isAdminClaim: true,
      isVerifiedAdmin: true,
      isVerifyingAdmin: false,
    });
    mockUseUpdateMatchScore.mockReturnValue({
      mutate: mutateScore,
      isPending: false,
      isSuccess: false,
      isError: false,
      error: null,
    });
    mockUseUpdateMatchStatus.mockReturnValue({
      mutate: mutateStatus,
      isPending: false,
      isSuccess: false,
      isError: false,
      error: null,
    });

    // Act
    renderPage();
    await user.click(screen.getByRole('button', { name: 'Guardar' }));
    await user.click(screen.getByRole('button', { name: 'Marcar aplazado' }));

    // Assert
    expect(confirmSpy).toHaveBeenCalledTimes(2);
    expect(mutateScore).not.toHaveBeenCalled();
    expect(mutateStatus).not.toHaveBeenCalled();
    confirmSpy.mockRestore();
  });

  it('precarga el seasonId desde query params', async () => {
    // Arrange
    setupDefaultMocks();

    // Act
    renderPage('/matches?seasonId=season-from-query');

    // Assert
    await waitFor(() => {
      expect(mockUseSeasonMatches).toHaveBeenLastCalledWith('season-from-query', {
        page: 1,
        limit: 20,
        round: undefined,
      });
    });
  });
});
