import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ApiError } from '@/api/client';
import { PaginationBar } from '@/app/components/PaginationBar';
import { useTeams } from '@/features/teams/api';

const PAGE_SIZE = 20;

export const TeamsListPage = () => {
  const [page, setPage] = useState(1);
  const query = useTeams(page, PAGE_SIZE);

  return (
    <section className="flex flex-col gap-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-100">Teams</h1>
        <p className="mt-1 text-sm text-zinc-400">
          Listado paginado. Pulsa un equipo para ver su perfil y plantilla.
        </p>
      </header>

      {query.isPending && <p className="text-sm text-zinc-400">Cargando equipos…</p>}

      {query.isError && (
        <p className="text-sm text-red-400" role="alert">
          {query.error instanceof ApiError ? query.error.message : 'No se pudo cargar el listado.'}
        </p>
      )}

      {query.data && (
        <>
          <p className="text-xs text-zinc-500">
            Total: {query.data.meta.total} · Mostrando {query.data.data.length} en esta página
          </p>

          {query.data.data.length === 0 ? (
            <p className="text-sm text-zinc-400">No hay equipos registrados.</p>
          ) : (
            <ul className="divide-y divide-zinc-800 rounded-xl border border-zinc-800 bg-zinc-900/60">
              {query.data.data.map((team) => (
                <li key={team.id ?? team.name} className="px-4 py-3">
                  {team.id ? (
                    <Link
                      to={`/teams/${team.id}`}
                      className="font-medium text-sky-400 hover:underline"
                    >
                      {team.name}
                    </Link>
                  ) : (
                    <span className="font-medium text-zinc-200">{team.name}</span>
                  )}
                  <p className="mt-0.5 text-xs text-zinc-500">
                    Alta: {new Date(team.createdAt).toLocaleDateString()}
                  </p>
                </li>
              ))}
            </ul>
          )}

          <PaginationBar
            page={page}
            lastPage={query.data.meta.lastPage}
            disabled={query.isFetching}
            onPrev={() => setPage((p) => Math.max(1, p - 1))}
            onNext={() => setPage((p) => p + 1)}
          />
        </>
      )}
    </section>
  );
};
