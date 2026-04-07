import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { ApiError, AUTH_TOKEN_STORAGE_KEY } from '@/api/client';
import { MatchesPage } from './MatchesPage';

const mockUseSeasonMatches = vi.fn();
const mockUseMatchById = vi.fn();
const mockUseGenerateSeasonCalendar = vi.fn();
const mockUseUpdateMatchScore = vi.fn();
const mockUseUpdateMatchStatus = vi.fn();

vi.mock('@/features/matches/api', () => ({
  useSeasonMatches: (...args: unknown[]) => mockUseSeasonMatches(...args),
  useMatchById: (...args: unknown[]) => mockUseMatchById(...args),
  useGenerateSeasonCalendar: () => mockUseGenerateSeasonCalendar(),
  useUpdateMatchScore: () => mockUseUpdateMatchScore(),
  useUpdateMatchStatus: () => mockUseUpdateMatchStatus(),
}));

const buildJwt = (role: 'ADMIN' | 'USER'): string => {
  const header = btoa(JSON.stringify({ alg: 'none', typ: 'JWT' }));
  const payload = btoa(JSON.stringify({ role }));
  return `${header}.${payload}.signature`;
};

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

describe('MatchesPage', () => {
  it('renderiza listado de partidos', () => {
    // Arrange
    setupDefaultMocks();

    // Act
    render(<MatchesPage />);

    // Assert
    expect(screen.getByRole('heading', { name: 'Matches' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /ver detalle del partido/i })).toBeInTheDocument();
  });

  it('aplica filtro de jornada y temporada', async () => {
    // Arrange
    const user = userEvent.setup();
    setupDefaultMocks();

    // Act
    render(<MatchesPage />);
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

  it('permite generar calendario para admin', async () => {
    // Arrange
    const user = userEvent.setup();
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);
    const mutateGenerate = vi.fn();
    localStorage.setItem(AUTH_TOKEN_STORAGE_KEY, buildJwt('ADMIN'));
    setupDefaultMocks();
    mockUseGenerateSeasonCalendar.mockReturnValue({
      mutate: mutateGenerate,
      isPending: false,
      isSuccess: false,
      isError: false,
      error: null,
    });

    // Act
    render(<MatchesPage />);
    await user.type(screen.getByLabelText('Season ID'), 'season-xyz');
    await user.click(screen.getByRole('button', { name: 'Aplicar filtros' }));
    await user.click(screen.getByRole('button', { name: 'Generar calendario' }));

    // Assert
    expect(mutateGenerate).toHaveBeenCalledWith({ seasonId: 'season-xyz' });
    confirmSpy.mockRestore();
  });

  it('permite actualizar marcador y estado para admin', async () => {
    // Arrange
    const user = userEvent.setup();
    const mutateScore = vi.fn();
    const mutateStatus = vi.fn();
    localStorage.setItem(AUTH_TOKEN_STORAGE_KEY, buildJwt('ADMIN'));
    setupDefaultMocks();
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
    render(<MatchesPage />);
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
    render(<MatchesPage />);

    // Assert
    expect(screen.getByText('Listado inválido')).toBeInTheDocument();
  });
});
