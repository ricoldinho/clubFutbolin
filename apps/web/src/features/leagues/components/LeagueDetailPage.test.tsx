import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { LeagueDetailPage } from './LeagueDetailPage';

const mockUseLeagueSeasons = vi.fn();
const mockUseSeasonTeamsByCategory = vi.fn();
const mockUseSeasonMatches = vi.fn();

vi.mock('@/features/leagues/api', () => ({
  useLeagueSeasons: (...args: unknown[]) => mockUseLeagueSeasons(...args),
  useSeasonTeamsByCategory: (...args: unknown[]) => mockUseSeasonTeamsByCategory(...args),
}));

vi.mock('@/features/matches/api', () => ({
  useSeasonMatches: (...args: unknown[]) => mockUseSeasonMatches(...args),
}));

describe('LeagueDetailPage', () => {
  it('incluye acceso a gestión de partidos con seasonId seleccionado', () => {
    // Arrange
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
});
