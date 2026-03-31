import { act, renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { apiJson } from '@/api/client';
import { queryKeys } from '@/api/query-keys';
import { createQueryClientWrapper, createTestQueryClient } from '@/test/query-client';
import { useGenerateSeasonCalendar } from './useGenerateSeasonCalendar';
import { useMatchById } from './useMatchById';
import { useSeasonMatches } from './useSeasonMatches';
import { useUpdateMatchScore } from './useUpdateMatchScore';
import { useUpdateMatchStatus } from './useUpdateMatchStatus';

vi.mock('@/api/client', async () => {
  const actual = await vi.importActual<typeof import('@/api/client')>('@/api/client');
  return {
    ...actual,
    apiJson: vi.fn(),
  };
});

describe('matches api hooks', () => {
  it('useSeasonMatches consulta listado paginado con filtros', async () => {
    // Arrange
    const mockedApiJson = vi.mocked(apiJson);
    mockedApiJson.mockResolvedValueOnce({
      data: [],
      meta: { total: 0, page: 1, lastPage: 0 },
    });
    const client = createTestQueryClient();
    const wrapper = createQueryClientWrapper(client);

    // Act
    const { result } = renderHook(
      () => useSeasonMatches('season-1', { page: 1, limit: 20, round: 3 }),
      { wrapper },
    );
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    // Assert
    expect(mockedApiJson).toHaveBeenCalledWith('/seasons/season-1/matches?page=1&limit=20&round=3');
  });

  it('useMatchById consulta detalle por id', async () => {
    // Arrange
    const mockedApiJson = vi.mocked(apiJson);
    mockedApiJson.mockResolvedValueOnce({
      id: 'match-1',
      seasonId: 'season-1',
      homeTeamSeasonId: 'home-1',
      awayTeamSeasonId: 'away-1',
      homeScore: null,
      awayScore: null,
      date: new Date().toISOString(),
      round: 1,
      status: 'SCHEDULED',
    });
    const client = createTestQueryClient();
    const wrapper = createQueryClientWrapper(client);

    // Act
    const { result } = renderHook(() => useMatchById('match-1'), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    // Assert
    expect(mockedApiJson).toHaveBeenCalledWith('/matches/match-1');
  });

  it('useGenerateSeasonCalendar invalida listado de la temporada', async () => {
    // Arrange
    const mockedApiJson = vi.mocked(apiJson);
    mockedApiJson.mockResolvedValueOnce({ matchesCount: 12 });
    const client = createTestQueryClient();
    const invalidateSpy = vi.spyOn(client, 'invalidateQueries');
    const wrapper = createQueryClientWrapper(client);

    // Act
    const { result } = renderHook(() => useGenerateSeasonCalendar(), { wrapper });
    await act(async () => {
      await result.current.mutateAsync({ seasonId: 'season-1' });
    });

    // Assert
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: queryKeys.matches.season('season-1'),
    });
  });

  it('useUpdateMatchScore invalida listado global y detalle', async () => {
    // Arrange
    const mockedApiJson = vi.mocked(apiJson);
    mockedApiJson.mockResolvedValueOnce({ matchId: 'match-1' });
    const client = createTestQueryClient();
    const invalidateSpy = vi.spyOn(client, 'invalidateQueries');
    const wrapper = createQueryClientWrapper(client);

    // Act
    const { result } = renderHook(() => useUpdateMatchScore(), { wrapper });
    await act(async () => {
      await result.current.mutateAsync({ matchId: 'match-1', homeScore: 2, awayScore: 1 });
    });

    // Assert
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: queryKeys.matches.all });
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: queryKeys.matches.detail('match-1'),
    });
  });

  it('useUpdateMatchStatus invalida listado global y detalle', async () => {
    // Arrange
    const mockedApiJson = vi.mocked(apiJson);
    mockedApiJson.mockResolvedValueOnce({ matchId: 'match-1' });
    const client = createTestQueryClient();
    const invalidateSpy = vi.spyOn(client, 'invalidateQueries');
    const wrapper = createQueryClientWrapper(client);

    // Act
    const { result } = renderHook(() => useUpdateMatchStatus(), { wrapper });
    await act(async () => {
      await result.current.mutateAsync({ matchId: 'match-1', status: 'POSTPONED' });
    });

    // Assert
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: queryKeys.matches.all });
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: queryKeys.matches.detail('match-1'),
    });
  });
});
