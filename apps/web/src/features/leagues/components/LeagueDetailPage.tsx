import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ApiError } from '@/api/client';
import { useLeagueSeasons, useSeasonTeamsByCategory } from '@/features/leagues/api';
import { useSeasonMatches } from '@/features/matches/api';
import type { MatchDto } from '@/features/matches/api/types';

type LeagueSeasonView = 'classification' | 'calendar';

type TeamStanding = {
  teamId: string;
  name: string;
  played: number;
  points: number;
};

const navClass = (active: boolean): string =>
  active
    ? 'rounded-md bg-sky-600 px-3 py-1.5 text-sm font-medium text-white'
    : 'rounded-md bg-zinc-800 px-3 py-1.5 text-sm text-zinc-200 hover:bg-zinc-700';

const formatDate = (value: string): string =>
  new Intl.DateTimeFormat('es-ES', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));

const isPlayedMatch = (match: MatchDto): boolean =>
  match.homeScore !== null && match.awayScore !== null && match.status === 'FINISHED';

const buildStandings = (matches: MatchDto[]): TeamStanding[] => {
  const table = new Map<string, TeamStanding>();

  const ensure = (teamId: string, teamName: string): TeamStanding => {
    const existing = table.get(teamId);
    if (existing) return existing;
    const created: TeamStanding = { teamId, name: teamName, played: 0, points: 0 };
    table.set(teamId, created);
    return created;
  };

  for (const match of matches) {
    const home = ensure(match.homeTeam.teamId, match.homeTeam.name);
    const away = ensure(match.awayTeam.teamId, match.awayTeam.name);
    if (!isPlayedMatch(match)) continue;

    home.played += 1;
    away.played += 1;
    home.points += match.homeScore ?? 0;
    away.points += match.awayScore ?? 0;
  }

  return [...table.values()].sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    if (a.played !== b.played) return a.played - b.played;
    return a.name.localeCompare(b.name);
  });
};

export const LeagueDetailPage = () => {
  const { leagueId = '' } = useParams<{ leagueId: string }>();
  const seasonsQuery = useLeagueSeasons(leagueId);
  const [selectedSeasonId, setSelectedSeasonId] = useState('');
  const [selectedView, setSelectedView] = useState<LeagueSeasonView>('classification');
  const [expandedRound, setExpandedRound] = useState<number | null>(null);

  useEffect(() => {
    if (!selectedSeasonId && seasonsQuery.data?.data.length) {
      setSelectedSeasonId(seasonsQuery.data.data[0].id);
    }
  }, [selectedSeasonId, seasonsQuery.data]);

  const teamsByCategoryQuery = useSeasonTeamsByCategory(leagueId, selectedSeasonId);
  const seasonMatchesQuery = useSeasonMatches(selectedSeasonId, { page: 1, limit: 100 });

  if (!leagueId) return <p className="text-sm text-red-300">League ID inválido.</p>;
  if (seasonsQuery.isLoading) return <p className="text-sm text-zinc-300">Cargando seasons...</p>;
  if (seasonsQuery.isError) {
    return (
      <p className="text-sm text-red-300">
        {seasonsQuery.error instanceof ApiError ? seasonsQuery.error.message : 'Error al cargar seasons'}
      </p>
    );
  }

  const seasons = seasonsQuery.data?.data ?? [];

  return (
    <section className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Liga</h1>
        <p className="text-sm text-zinc-400">ID: {leagueId}</p>
      </header>

      <article className="rounded-lg border border-zinc-800 bg-zinc-900/40 p-4">
        <h2 className="mb-3 text-lg font-medium">Seasons</h2>
        {seasons.length === 0 ? (
          <p className="text-sm text-zinc-400">Esta liga no tiene seasons.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {seasons.map((season) => (
              <button
                key={season.id}
                type="button"
                onClick={() => {
                  setSelectedSeasonId(season.id);
                  setExpandedRound(null);
                }}
                className={`rounded-md px-3 py-1.5 text-sm ${
                  selectedSeasonId === season.id
                    ? 'bg-sky-600 text-white'
                    : 'bg-zinc-800 text-zinc-200 hover:bg-zinc-700'
                }`}
              >
                {season.year}
              </button>
            ))}
          </div>
        )}
      </article>

      <article className="rounded-lg border border-zinc-800 bg-zinc-900/40 p-4">
        <h2 className="mb-3 text-lg font-medium">Equipos por categoría</h2>
        {!selectedSeasonId || teamsByCategoryQuery.isLoading ? (
          <p className="text-sm text-zinc-400">Cargando equipos...</p>
        ) : teamsByCategoryQuery.isError ? (
          <p className="text-sm text-red-300">
            {teamsByCategoryQuery.error instanceof ApiError
              ? teamsByCategoryQuery.error.message
              : 'Error al cargar equipos de la season'}
          </p>
        ) : teamsByCategoryQuery.data ? (
          <div className="space-y-4">
            {teamsByCategoryQuery.data.categories.map((categoryBlock) => (
              <section key={categoryBlock.category}>
                <h3 className="text-sm font-semibold text-zinc-300">{categoryBlock.category}</h3>
                <ul className="mt-2 space-y-1 text-sm text-zinc-200">
                  {categoryBlock.teams.map((team) => (
                    <li key={team.id}>
                      <Link to={`/teams/${team.id}`} className="text-sky-400 hover:underline">
                        {team.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        ) : (
          <p className="text-sm text-zinc-400">No hay equipos para esta season.</p>
        )}
      </article>

      <article className="rounded-lg border border-zinc-800 bg-zinc-900/40 p-4">
        <h2 className="mb-3 text-lg font-medium">Season</h2>
        <nav className="mb-4 flex flex-wrap gap-2" aria-label="Navegación de season">
          <button
            type="button"
            className={navClass(selectedView === 'classification')}
            onClick={() => setSelectedView('classification')}
          >
            Clasificación
          </button>
          <button
            type="button"
            className={navClass(selectedView === 'calendar')}
            onClick={() => setSelectedView('calendar')}
          >
            Calendario
          </button>
        </nav>

        {!selectedSeasonId || seasonMatchesQuery.isLoading ? (
          <p className="text-sm text-zinc-400">Cargando partidos de la season...</p>
        ) : seasonMatchesQuery.isError ? (
          <p className="text-sm text-red-300">
            {seasonMatchesQuery.error instanceof ApiError
              ? seasonMatchesQuery.error.message
              : 'Error al cargar partidos de la season'}
          </p>
        ) : seasonMatchesQuery.data ? (
          selectedView === 'classification' ? (
            <div className="space-y-3">
              {seasonMatchesQuery.data.meta.lastPage > 1 && (
                <p className="text-xs text-amber-300">
                  Solo se muestran los primeros 100 partidos para la clasificación.
                </p>
              )}
              <div className="overflow-x-auto">
                <table className="min-w-full border-separate border-spacing-0 text-left text-sm">
                  <thead>
                    <tr className="text-zinc-300">
                      <th className="border-b border-zinc-700 px-3 py-2 font-semibold">Equipo</th>
                      <th className="border-b border-zinc-700 px-3 py-2 font-semibold">Partidos</th>
                      <th className="border-b border-zinc-700 px-3 py-2 font-semibold">Puntos</th>
                    </tr>
                  </thead>
                  <tbody>
                    {buildStandings(seasonMatchesQuery.data.data).map((standing) => (
                      <tr key={standing.teamId} className="text-zinc-100">
                        <td className="border-b border-zinc-800 px-3 py-2">{standing.name}</td>
                        <td className="border-b border-zinc-800 px-3 py-2">{standing.played}</td>
                        <td className="border-b border-zinc-800 px-3 py-2">{standing.points}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {Object.entries(
                seasonMatchesQuery.data.data.reduce<Record<number, MatchDto[]>>((acc, match) => {
                  const roundMatches = acc[match.round] ?? [];
                  roundMatches.push(match);
                  acc[match.round] = roundMatches;
                  return acc;
                }, {}),
              )
                .sort(([a], [b]) => Number(a) - Number(b))
                .map(([round, matches]) => {
                  const roundNumber = Number(round);
                  const mainDate = matches
                    .map((m) => m.date)
                    .sort((a, b) => new Date(a).getTime() - new Date(b).getTime())[0];
                  const isOpen = expandedRound === roundNumber;
                  return (
                    <section key={round} className="rounded-md border border-zinc-800 bg-zinc-900/60">
                      <button
                        type="button"
                        className="flex w-full items-center justify-between px-3 py-2 text-left"
                        onClick={() => setExpandedRound((prev) => (prev === roundNumber ? null : roundNumber))}
                      >
                        <span className="text-sm font-medium text-zinc-100">
                          Jornada {roundNumber}
                        </span>
                        <span className="text-xs text-zinc-400">{formatDate(mainDate)}</span>
                      </button>
                      {isOpen && (
                        <ul className="space-y-1 border-t border-zinc-800 px-3 py-2 text-sm text-zinc-200">
                          {matches
                            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                            .map((match) => (
                              <li key={match.id} className="flex items-center justify-between gap-3">
                                <span>
                                  {match.homeTeam.name} vs {match.awayTeam.name}
                                </span>
                                <span className="text-zinc-300">
                                  {match.homeScore ?? '-'} - {match.awayScore ?? '-'}
                                </span>
                              </li>
                            ))}
                        </ul>
                      )}
                    </section>
                  );
                })}
            </div>
          )
        ) : (
          <p className="text-sm text-zinc-400">No hay datos de partidos para esta season.</p>
        )}
      </article>
    </section>
  );
};
