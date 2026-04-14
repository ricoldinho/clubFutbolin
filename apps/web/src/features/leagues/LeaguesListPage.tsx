import { type FormEvent, useState } from 'react';
import { Link } from 'react-router-dom';
import { ApiError } from '@/api/client';
import { PaginationBar } from '@/app/components/PaginationBar';
import { useVerifiedAdmin } from '@/features/auth/api/useVerifiedAdmin';
import {
  LEAGUE_CATEGORIES,
  useCreateLeague,
  useDeleteLeague,
  useLeagues,
  useUpdateLeague,
} from '@/features/leagues/api';
import type { CreatedLeagueDto } from '@/features/leagues/api';
import { AssociateTeamsModal } from '@/features/leagues/components/AssociateTeamsModal';

const PAGE_SIZE = 20;

export const LeaguesListPage = () => {
  const [page, setPage] = useState(1);
  const [newLeagueName, setNewLeagueName] = useState('');
  const [newLeagueCategory, setNewLeagueCategory] =
    useState<(typeof LEAGUE_CATEGORIES)[number]>('TERCERA');
  const [editingLeagueId, setEditingLeagueId] = useState<string | null>(null);
  const [editingLeagueName, setEditingLeagueName] = useState('');
  const [editingLeagueCategory, setEditingLeagueCategory] =
    useState<(typeof LEAGUE_CATEGORIES)[number]>('TERCERA');
  const [associateModalState, setAssociateModalState] = useState<{
    leagueId: string;
    seasonId: string;
    seasonYear: number;
  } | null>(null);
  const query = useLeagues(page, PAGE_SIZE);
  const createLeague = useCreateLeague();
  const updateLeague = useUpdateLeague();
  const deleteLeague = useDeleteLeague();
  const { isVerifiedAdmin, isVerifyingAdmin } = useVerifiedAdmin();

  const onSubmitCreate = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    createLeague.mutate(
      { name: newLeagueName, leagueCategory: newLeagueCategory },
      {
        onSuccess: (created: CreatedLeagueDto) => {
          setNewLeagueName('');
          if (created.id !== null && created.initialSeason.id !== null) {
            setAssociateModalState({
              leagueId: created.id,
              seasonId: created.initialSeason.id,
              seasonYear: created.initialSeason.year,
            });
          }
        },
      },
    );
  };

  const onSubmitUpdate = (event: FormEvent<HTMLFormElement>, leagueId: string) => {
    event.preventDefault();
    updateLeague.mutate({
      leagueId,
      name: editingLeagueName,
      leagueCategory: editingLeagueCategory,
    });
  };

  return (
    <section className="flex flex-col gap-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-100">Leagues</h1>
        <p className="mt-1 text-sm text-zinc-400">
          Listado paginado. Pulsa una liga para ver temporadas y equipos.
        </p>
      </header>

      {isVerifyingAdmin && (
        <p className="text-xs text-zinc-500">Verificando permisos de administrador...</p>
      )}

      {isVerifiedAdmin && (
        <form onSubmit={onSubmitCreate} className="flex flex-wrap items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900/60 p-4">
          <input value={newLeagueName} onChange={(e) => setNewLeagueName(e.target.value)} required placeholder="Nombre de la liga" className="min-w-56 rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100" />
          <select value={newLeagueCategory} onChange={(e) => setNewLeagueCategory(e.target.value as (typeof LEAGUE_CATEGORIES)[number])} className="rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100">
            {LEAGUE_CATEGORIES.map((category) => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>
          <button type="submit" disabled={createLeague.isPending} className="rounded-md bg-sky-600 px-3 py-2 text-sm font-medium text-white disabled:opacity-50">
            {createLeague.isPending ? 'Creando...' : 'Crear liga'}
          </button>
          {createLeague.isError && (
            <p className="text-xs text-red-400">
              {createLeague.error instanceof ApiError ? createLeague.error.message : 'No se pudo crear la liga.'}
            </p>
          )}
        </form>
      )}

      {query.isPending && <p className="text-sm text-zinc-400">Cargando ligas…</p>}

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
            <p className="text-sm text-zinc-400">No hay ligas registradas.</p>
          ) : (
            <ul className="divide-y divide-zinc-800 rounded-xl border border-zinc-800 bg-zinc-900/60">
              {query.data.data.map((league) => (
                <li key={league.id ?? league.name} className="px-4 py-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      {league.id ? (
                        <Link
                          to={`/leagues/${league.id}`}
                          className="font-medium text-sky-400 hover:underline"
                        >
                          {league.name}
                        </Link>
                      ) : (
                        <span className="font-medium text-zinc-200">{league.name}</span>
                      )}
                      <p className="mt-0.5 text-xs text-zinc-500">{league.leagueCategory}</p>
                    </div>
                    {isVerifiedAdmin && league.id && (
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingLeagueId(league.id);
                            setEditingLeagueName(league.name);
                            setEditingLeagueCategory(league.leagueCategory);
                          }}
                          className="rounded-md border border-zinc-700 px-2 py-1 text-xs text-zinc-200"
                        >
                          Editar
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteLeague.mutate(league.id!)}
                          disabled={deleteLeague.isPending}
                          className="rounded-md border border-red-800 px-2 py-1 text-xs text-red-300 disabled:opacity-50"
                        >
                          Borrar
                        </button>
                      </div>
                    )}
                  </div>
                  {isVerifiedAdmin && editingLeagueId === league.id && (
                    <form onSubmit={(event) => onSubmitUpdate(event, league.id!)} className="mt-3 flex flex-wrap items-center gap-2">
                      <input value={editingLeagueName} onChange={(e) => setEditingLeagueName(e.target.value)} required className="rounded-md border border-zinc-700 bg-zinc-950 px-2 py-1.5 text-xs text-zinc-100" />
                      <select value={editingLeagueCategory} onChange={(e) => setEditingLeagueCategory(e.target.value as (typeof LEAGUE_CATEGORIES)[number])} className="rounded-md border border-zinc-700 bg-zinc-950 px-2 py-1.5 text-xs text-zinc-100">
                        {LEAGUE_CATEGORIES.map((category) => (
                          <option key={category} value={category}>{category}</option>
                        ))}
                      </select>
                      <button type="submit" disabled={updateLeague.isPending} className="rounded-md bg-sky-600 px-2 py-1 text-xs font-medium text-white disabled:opacity-50">
                        Guardar
                      </button>
                      <button type="button" onClick={() => setEditingLeagueId(null)} className="rounded-md border border-zinc-700 px-2 py-1 text-xs text-zinc-200">
                        Cancelar
                      </button>
                      {updateLeague.isError && (
                        <p className="text-xs text-red-400">
                          {updateLeague.error instanceof ApiError ? updateLeague.error.message : 'No se pudo actualizar la liga.'}
                        </p>
                      )}
                    </form>
                  )}
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

      {associateModalState && (
        <AssociateTeamsModal
          isOpen
          leagueId={associateModalState.leagueId}
          seasonId={associateModalState.seasonId}
          seasonYear={associateModalState.seasonYear}
          existingTeamIds={[]}
          onClose={() => setAssociateModalState(null)}
        />
      )}
    </section>
  );
};
