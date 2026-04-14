import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { LeagueDetailPage } from './LeagueDetailPage';

const mockUseLeagueSeasons = vi.fn();
const mockUseSeasonTeamsByCategory = vi.fn();
const mockUseSeasonMatches = vi.fn();
const mockUseVerifiedAdmin = vi.fn();
const mockCreateSeasonMutate = vi.fn();
const mockRegisterTeamToSeasonMutate = vi.fn();

vi.mock('@/features/leagues/api', () => ({
  useLeagueSeasons: (...args: unknown[]) => mockUseLeagueSeasons(...args),
  useSeasonTeamsByCategory: (...args: unknown[]) => mockUseSeasonTeamsByCategory(...args),
  useCreateSeason: () => ({
    mutate: mockCreateSeasonMutate,
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

vi.mock('@/features/matches/api', () => ({
  useSeasonMatches: (...args: unknown[]) => mockUseSeasonMatches(...args),
}));

vi.mock('@/features/auth/api/useVerifiedAdmin', () => ({
  useVerifiedAdmin: () => mockUseVerifiedAdmin(),
}));

vi.mock('@/features/teams/api', () => ({
  useTeams: () => ({
    data: { data: [] },
    isPending: false,
    isFetching: false,
  }),
}));

describe('LeagueDetailPage', () => {
  it('incluye acceso a gestión de partidos con seasonId seleccionado', () => {
    // Arrange
    mockUseVerifiedAdmin.mockReturnValue({
      token: null,
      isAdminClaim: false,
      isVerifiedAdmin: false,
      isVerifyingAdmin: false,
    });
    mockUseLeagueSeasons.mockReturnValue({
      isLoading: false,
      isError: false,
      data: { data: [{ id: 'season-1', year: 2026, leagueId: 'league-1', championId: null, secondId: null }] },
    });
    mockUseSeasonTeamsByCategory.mockReturnValue({
      isLoading: false,
      isError: false,
      data: { seasonId: 'season-1', categories: [] },
    });
    mockUseSeasonMatches.mockReturnValue({
      isLoading: false,
      isError: false,
      data: { data: [], meta: { total: 0, page: 1, lastPage: 0 } },
    });

    // Act
    render(
      <MemoryRouter initialEntries={['/leagues/league-1']}>
        <Routes>
          <Route path="/leagues/:leagueId" element={<LeagueDetailPage />} />
        </Routes>
      </MemoryRouter>,
    );

    // Assert
    const manageMatchesLink = screen.getByRole('link', { name: 'Gestionar partidos de esta season' });
    expect(manageMatchesLink).toHaveAttribute('href', '/matches?seasonId=season-1');
  });

  it('muestra acciones de admin para crear season y asociar equipos', () => {
    // Arrange
    mockUseVerifiedAdmin.mockReturnValue({
      token: 'token-admin',
      isAdminClaim: true,
      isVerifiedAdmin: true,
      isVerifyingAdmin: false,
    });
    mockUseLeagueSeasons.mockReturnValue({
      isLoading: false,
      isError: false,
      data: { data: [{ id: 'season-1', year: 2026, leagueId: 'league-1', championId: null, secondId: null }] },
    });
    mockUseSeasonTeamsByCategory.mockReturnValue({
      isLoading: false,
      isError: false,
      data: { seasonId: 'season-1', categories: [] },
    });
    mockUseSeasonMatches.mockReturnValue({
      isLoading: false,
      isError: false,
      data: { data: [], meta: { total: 0, page: 1, lastPage: 0 } },
    });

    // Act
    render(
      <MemoryRouter initialEntries={['/leagues/league-1']}>
        <Routes>
          <Route path="/leagues/:leagueId" element={<LeagueDetailPage />} />
        </Routes>
      </MemoryRouter>,
    );

    // Assert
    expect(screen.getByRole('button', { name: 'Crear season' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Asociar equipos' })).toBeInTheDocument();
  });
});
