import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { PlayerProfilePage } from './PlayerProfilePage';

const mockUsePlayerById = vi.fn();
const mockUsePlayerMemberships = vi.fn();

vi.mock('@/features/players/api', () => ({
  usePlayerById: (...args: unknown[]) => mockUsePlayerById(...args),
  usePlayerMemberships: (...args: unknown[]) => mockUsePlayerMemberships(...args),
}));

const renderProfile = () =>
  render(
    <MemoryRouter initialEntries={['/players/player-1']}>
      <Routes>
        <Route path="/players/:playerId" element={<PlayerProfilePage />} />
      </Routes>
    </MemoryRouter>,
  );

describe('PlayerProfilePage', () => {
  it('renderiza información del jugador y sus membresías', () => {
    mockUsePlayerById.mockReturnValue({
      isLoading: false,
      isError: false,
      data: {
        id: 'player-1',
        name: 'Juan',
        lastname: 'Pérez',
        nickname: 'JP',
        email: 'juan@example.com',
        phoneNumber: '600000000',
        birthdate: '1990-01-01',
        category: 'PRIMERA',
        role: 'USER',
      },
    });
    mockUsePlayerMemberships.mockReturnValue({
      isLoading: false,
      isError: false,
      data: {
        data: [
          {
            teamSeasonId: 'team-season-1',
            team: { id: 'team-1', name: 'Equipo Norte' },
            season: { id: 'season-1', year: 2026 },
            league: { id: 'league-1', name: 'Liga Coruña' },
          },
        ],
      },
    });

    renderProfile();

    expect(screen.getByRole('heading', { name: 'Perfil del jugador' })).toBeInTheDocument();
    expect(screen.getByText('Juan')).toBeInTheDocument();
    expect(screen.getByText(/Equipo Norte/)).toBeInTheDocument();
    expect(screen.getByText(/Liga Coruña/)).toBeInTheDocument();
  });
});
