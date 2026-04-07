import { Link, useParams } from 'react-router-dom';
import { ApiError } from '@/api/client';
import { useTeamProfile } from '@/features/teams/api';

export const TeamProfilePage = () => {
  const { teamId = '' } = useParams<{ teamId: string }>();
  const teamProfile = useTeamProfile(teamId);

  if (!teamId) return <p className="text-sm text-red-300">Team ID inválido.</p>;
  if (teamProfile.isLoading) return <p className="text-sm text-zinc-300">Cargando equipo...</p>;
  if (teamProfile.isError) {
    return (
      <p className="text-sm text-red-300">
        {teamProfile.error instanceof ApiError
          ? teamProfile.error.message
          : 'No se pudo cargar el equipo'}
      </p>
    );
  }

  const data = teamProfile.data;
  if (!data) return <p className="text-sm text-red-300">No se encontró el equipo.</p>;
  const { team, leagues, players } = data;
  const currentPlayers = players.filter((p) => p.isCurrent);
  const pastPlayers = players.filter((p) => !p.isCurrent);

  return (
    <section className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">{team.name}</h1>
        <p className="text-sm text-zinc-400">ID: {team.id ?? 'Sin id'}</p>
      </header>

      <article className="rounded-lg border border-zinc-800 bg-zinc-900/40 p-4">
        <h2 className="mb-3 text-lg font-medium">Ligas en las que participa</h2>
        {leagues.length === 0 ? (
          <p className="text-sm text-zinc-400">Sin participaciones registradas.</p>
        ) : (
          <ul className="space-y-2 text-sm">
            {leagues.map((league) => (
              <li key={`${league.id}-${league.seasonId}`} className="text-zinc-200">
                <Link to={`/leagues/${league.id}`} className="text-sky-400 hover:underline">
                  {league.name}
                </Link>
                <span className="text-zinc-400"> - {league.leagueCategory}</span>
                <span className="text-zinc-500"> (Temporada {league.seasonYear})</span>
              </li>
            ))}
          </ul>
        )}
      </article>

      <article className="rounded-lg border border-zinc-800 bg-zinc-900/40 p-4">
        <h2 className="mb-3 text-lg font-medium">Plantilla actual</h2>
        <p className="mb-3 text-sm text-zinc-500">
          Jugadores en la temporada más reciente del equipo (año máximo entre las temporadas en las que
          participa).
        </p>
        {currentPlayers.length === 0 ? (
          <p className="text-sm text-zinc-400">No hay jugadores en la plantilla actual.</p>
        ) : (
          <ul className="space-y-2 text-sm" aria-label="Plantilla actual">
            {currentPlayers.map((player) => (
              <li
                key={player.id}
                className="rounded-md border border-emerald-900/60 bg-emerald-950/30 px-3 py-2 text-zinc-100"
              >
                <Link
                  to={`/players/${player.id}`}
                  className="font-medium text-emerald-300 underline-offset-2 hover:text-emerald-200 hover:underline focus-visible:rounded-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-400"
                >
                  {player.name} {player.lastname}
                </Link>
                <span className="text-zinc-400">
                  {' '}
                  ({player.nickname ?? 'sin nick'} — {player.category})
                </span>
              </li>
            ))}
          </ul>
        )}
      </article>

      <article className="rounded-lg border border-zinc-800 bg-zinc-900/40 p-4">
        <h2 className="mb-3 text-lg font-medium">Histórico</h2>
        <p className="mb-3 text-sm text-zinc-500">
          Jugadores que participaron en temporadas anteriores y ya no forman la plantilla del último
          año.
        </p>
        {pastPlayers.length === 0 ? (
          <p className="text-sm text-zinc-400">No hay jugadores solo en temporadas pasadas.</p>
        ) : (
          <ul className="space-y-2 text-sm" aria-label="Jugadores históricos">
            {pastPlayers.map((player) => (
              <li key={player.id} className="rounded-md border border-zinc-800 bg-zinc-950/40 px-3 py-2">
                <Link
                  to={`/players/${player.id}`}
                  className="text-sky-400 underline-offset-2 hover:underline focus-visible:rounded-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-400"
                >
                  {player.name} {player.lastname}
                </Link>
                <span className="text-zinc-400">
                  {' '}
                  ({player.nickname ?? 'sin nick'} — {player.category})
                </span>
              </li>
            ))}
          </ul>
        )}
      </article>
    </section>
  );
};
