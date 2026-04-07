import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ApiError } from '@/api/client';
import { useLeagueSeasons, useSeasonTeamsByCategory } from '@/features/leagues/api';

export const LeagueDetailPage = () => {
  const { leagueId = '' } = useParams<{ leagueId: string }>();
  const seasonsQuery = useLeagueSeasons(leagueId);
  const [selectedSeasonId, setSelectedSeasonId] = useState('');

  useEffect(() => {
    if (!selectedSeasonId && seasonsQuery.data?.data.length) {
      setSelectedSeasonId(seasonsQuery.data.data[0].id);
    }
  }, [selectedSeasonId, seasonsQuery.data]);

  const teamsByCategoryQuery = useSeasonTeamsByCategory(leagueId, selectedSeasonId);

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
                onClick={() => setSelectedSeasonId(season.id)}
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
    </section>
  );
};
