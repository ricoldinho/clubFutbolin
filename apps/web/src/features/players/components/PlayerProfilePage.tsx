import { Link, useParams } from 'react-router-dom';
import { ApiError } from '@/api/client';
import { usePlayerById, usePlayerMemberships } from '@/features/players/api';

export const PlayerProfilePage = () => {
  const { playerId = '' } = useParams<{ playerId: string }>();
  const playerQuery = usePlayerById(playerId);
  const membershipsQuery = usePlayerMemberships(playerId);

  if (!playerId) {
    return <p className="text-sm text-red-300">No se ha indicado un playerId válido.</p>;
  }

  if (playerQuery.isLoading || membershipsQuery.isLoading) {
    return <p className="text-sm text-zinc-300">Cargando perfil del jugador...</p>;
  }

  if (playerQuery.isError) {
    return (
      <p className="text-sm text-red-300">
        {playerQuery.error instanceof ApiError
          ? playerQuery.error.message
          : 'No se pudo cargar el perfil del jugador'}
      </p>
    );
  }

  if (membershipsQuery.isError) {
    return (
      <p className="text-sm text-red-300">
        {membershipsQuery.error instanceof ApiError
          ? membershipsQuery.error.message
          : 'No se pudieron cargar las membresías del jugador'}
      </p>
    );
  }

  const player = playerQuery.data;
  const memberships = membershipsQuery.data?.data ?? [];
  if (!player) {
    return <p className="text-sm text-red-300">No se encontró la información del jugador.</p>;
  }

  return (
    <section className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">Perfil del jugador</h1>
        <p className="text-sm text-zinc-400">ID: {player.id ?? 'Sin id'}</p>
      </header>

      <article className="rounded-lg border border-zinc-800 bg-zinc-900/40 p-4">
        <h2 className="mb-3 text-lg font-medium">Información personal</h2>
        <dl className="grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-zinc-400">Nombre</dt>
            <dd>{player.name}</dd>
          </div>
          <div>
            <dt className="text-zinc-400">Apellidos</dt>
            <dd>{player.lastname}</dd>
          </div>
          <div>
            <dt className="text-zinc-400">Nick</dt>
            <dd>{player.nickname ?? 'Sin nickname'}</dd>
          </div>
          <div>
            <dt className="text-zinc-400">Email</dt>
            <dd>{player.email}</dd>
          </div>
          <div>
            <dt className="text-zinc-400">Teléfono</dt>
            <dd>{player.phoneNumber}</dd>
          </div>
          <div>
            <dt className="text-zinc-400">Categoría</dt>
            <dd>{player.category}</dd>
          </div>
        </dl>
      </article>

      <article className="rounded-lg border border-zinc-800 bg-zinc-900/40 p-4">
        <h2 className="mb-3 text-lg font-medium">Ligas y equipos</h2>
        {memberships.length === 0 ? (
          <p className="text-sm text-zinc-400">No participa en ninguna liga/equipo actualmente.</p>
        ) : (
          <ul className="space-y-2 text-sm">
            {memberships.map((membership) => (
              <li
                key={membership.teamSeasonId}
                className="rounded-md border border-zinc-800 bg-zinc-950/40 px-3 py-2"
              >
                <Link to={`/teams/${membership.team.id}`} className="font-medium text-sky-400 hover:underline">
                  {membership.team.name}
                </Link>
                <span className="text-zinc-400"> - </span>
                <Link to={`/leagues/${membership.league.id}`} className="text-sky-400 hover:underline">
                  {membership.league.name}
                </Link>
                <span className="text-zinc-500"> (Temporada {membership.season.year})</span>
              </li>
            ))}
          </ul>
        )}
      </article>
    </section>
  );
};
