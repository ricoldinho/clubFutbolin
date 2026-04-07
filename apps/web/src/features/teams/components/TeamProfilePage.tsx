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
        <h2 className="mb-3 text-lg font-medium">Jugadores del equipo</h2>
        {players.length === 0 ? (
          <p className="text-sm text-zinc-400">No hay jugadores asignados.</p>
        ) : (
          <ul className="space-y-2 text-sm">
            {players.map((player) => (
              <li key={player.id} className="text-zinc-200">
                {player.name} {player.lastname}
                <span className="text-zinc-400">
                  {' '}
                  ({player.nickname ?? 'sin nick'} - {player.category})
                </span>
              </li>
            ))}
          </ul>
        )}
      </article>
    </section>
  );
};
