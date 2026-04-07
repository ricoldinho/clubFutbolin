import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ApiError } from '@/api/client';
import { PaginationBar } from '@/app/components/PaginationBar';
import { usePlayersList } from '@/features/players/api';

const PAGE_SIZE = 20;

export const PlayersListPage = () => {
  const [page, setPage] = useState(1);
  const query = usePlayersList(page, PAGE_SIZE);

  const authRequired =
    query.isError && query.error instanceof ApiError && query.error.status === 401;

  return (
    <section className="flex flex-col gap-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-100">Players</h1>
        <p className="mt-1 text-sm text-zinc-400">
          Listado paginado (requiere iniciar sesión). Pulsa un jugador para ver su perfil.
        </p>
      </header>

      {authRequired && (
        <p className="rounded-xl border border-amber-900/60 bg-amber-950/40 px-4 py-3 text-sm text-amber-200">
          Necesitas{' '}
          <Link to="/login" className="font-medium text-sky-400 underline-offset-2 hover:underline">
            iniciar sesión
          </Link>{' '}
          para ver el listado de jugadores.
        </p>
      )}

      {query.isPending && !authRequired && (
        <p className="text-sm text-zinc-400">Cargando jugadores…</p>
      )}

      {query.isError && !authRequired && (
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
            <p className="text-sm text-zinc-400">No hay jugadores registrados.</p>
          ) : (
            <ul className="divide-y divide-zinc-800 rounded-xl border border-zinc-800 bg-zinc-900/60">
              {query.data.data.map((player) => {
                const label = [player.name, player.lastname].filter(Boolean).join(' ');
                return (
                  <li key={player.id ?? player.email} className="px-4 py-3">
                    {player.id ? (
                      <Link
                        to={`/players/${player.id}`}
                        className="font-medium text-sky-400 hover:underline"
                      >
                        {label}
                      </Link>
                    ) : (
                      <span className="font-medium text-zinc-200">{label}</span>
                    )}
                    <p className="mt-0.5 text-xs text-zinc-500">
                      {player.category} · {player.email}
                    </p>
                  </li>
                );
              })}
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
