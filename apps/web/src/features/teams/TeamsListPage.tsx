import { type FormEvent, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ApiError } from '@/api/client';
import { PaginationBar } from '@/app/components/PaginationBar';
import { useDebouncedValue } from '@/app/hooks/useDebouncedValue';
import { useVerifiedAdmin } from '@/features/auth/api/useVerifiedAdmin';
import { useCreateTeam, useDeleteTeam, useTeams, useUpdateTeam } from '@/features/teams/api';
import type { TeamListItemDto } from '@/features/teams/api/types';

const PAGE_SIZE = 20;
const SEARCH_DEBOUNCE_MS = 350;

const nameCollator = new Intl.Collator('es', { sensitivity: 'base' });

function compareTeamsByName(a: TeamListItemDto, b: TeamListItemDto): number {
  return nameCollator.compare(a.name, b.name);
}

export const TeamsListPage = () => {
  const [page, setPage] = useState(1);
  const [searchText, setSearchText] = useState('');
  const debouncedSearch = useDebouncedValue(searchText, SEARCH_DEBOUNCE_MS);
  const [sortAlphabetically, setSortAlphabetically] = useState(false);
  const [newTeamName, setNewTeamName] = useState('');
  const [editingTeamId, setEditingTeamId] = useState<string | null>(null);
  const [editingTeamName, setEditingTeamName] = useState('');
  const query = useTeams(page, PAGE_SIZE, debouncedSearch);
  const createTeam = useCreateTeam();
  const updateTeam = useUpdateTeam();
  const deleteTeam = useDeleteTeam();
  const { isVerifiedAdmin, isVerifyingAdmin } = useVerifiedAdmin();

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch]);

  const displayedTeams = useMemo(() => {
    if (!query.data) return [];
    const rows = [...query.data.data];
    if (sortAlphabetically) {
      rows.sort(compareTeamsByName);
    }
    return rows;
  }, [query.data, sortAlphabetically]);

  const onSubmitCreate = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    createTeam.mutate({ name: newTeamName });
  };

  const onSubmitUpdate = (event: FormEvent<HTMLFormElement>, teamId: string) => {
    event.preventDefault();
    updateTeam.mutate({ teamId, name: editingTeamName });
  };

  return (
    <section className="flex flex-col gap-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-100">Teams</h1>
        <p className="mt-1 text-sm text-zinc-400">
          Listado paginado. Busca por nombre; pulsa un equipo para ver su perfil y plantilla.
        </p>
      </header>

      <div className="flex max-w-md flex-col gap-1">
        <label htmlFor="teams-search" className="text-xs font-medium text-zinc-400">
          Buscar
        </label>
        <input
          id="teams-search"
          type="search"
          enterKeyHint="search"
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          placeholder="Nombre del equipo…"
          maxLength={100}
          aria-label="Buscar equipos por nombre"
          className="rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600"
        />
        {searchText !== debouncedSearch && (
          <p className="text-xs text-zinc-500">Aplicando búsqueda en un momento…</p>
        )}
      </div>

      {isVerifyingAdmin && (
        <p className="text-xs text-zinc-500">Verificando permisos de administrador...</p>
      )}

      {isVerifiedAdmin && (
        <form onSubmit={onSubmitCreate} className="flex flex-wrap items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900/60 p-4">
          <input value={newTeamName} onChange={(e) => setNewTeamName(e.target.value)} required placeholder="Nombre del equipo" className="min-w-56 rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100" />
          <button type="submit" disabled={createTeam.isPending} className="rounded-md bg-sky-600 px-3 py-2 text-sm font-medium text-white disabled:opacity-50">
            {createTeam.isPending ? 'Creando...' : 'Crear equipo'}
          </button>
          {createTeam.isError && (
            <p className="text-xs text-red-400">
              {createTeam.error instanceof ApiError ? createTeam.error.message : 'No se pudo crear el equipo.'}
            </p>
          )}
        </form>
      )}

      {query.isPending && <p className="text-sm text-zinc-400">Cargando equipos…</p>}

      {query.isError && (
        <p className="text-sm text-red-400" role="alert">
          {query.error instanceof ApiError ? query.error.message : 'No se pudo cargar el listado.'}
        </p>
      )}

      {query.data && (
        <>
          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
            <p className="text-xs text-zinc-500">
              Total: {query.data.meta.total} · Mostrando {query.data.data.length} en esta página
            </p>
            <div className="flex flex-col gap-1">
              <button
                type="button"
                onClick={() => setSortAlphabetically((v) => !v)}
                aria-pressed={sortAlphabetically}
                className={`self-start rounded-md border px-3 py-1.5 text-xs font-medium ${
                  sortAlphabetically
                    ? 'border-sky-600 bg-sky-950/50 text-sky-200'
                    : 'border-zinc-600 bg-zinc-900 text-zinc-200 hover:bg-zinc-800'
                }`}
              >
                {sortAlphabetically ? 'Quitar orden A-Z' : 'Ordenar A-Z'}
              </button>
              <p className="text-[11px] text-zinc-600">El orden A-Z solo afecta a los equipos de esta página.</p>
            </div>
          </div>

          {query.data.data.length === 0 ? (
            <p className="text-sm text-zinc-400">No hay equipos registrados.</p>
          ) : (
            <ul className="divide-y divide-zinc-800 rounded-xl border border-zinc-800 bg-zinc-900/60">
              {displayedTeams.map((team) => (
                <li key={team.id ?? team.name} className="px-4 py-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
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
                    </div>
                    {isVerifiedAdmin && team.id && (
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingTeamId(team.id);
                            setEditingTeamName(team.name);
                          }}
                          className="rounded-md border border-zinc-700 px-2 py-1 text-xs text-zinc-200"
                        >
                          Editar
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteTeam.mutate(team.id!)}
                          disabled={deleteTeam.isPending}
                          className="rounded-md border border-red-800 px-2 py-1 text-xs text-red-300 disabled:opacity-50"
                        >
                          Borrar
                        </button>
                      </div>
                    )}
                  </div>
                  {isVerifiedAdmin && editingTeamId === team.id && (
                    <form onSubmit={(event) => onSubmitUpdate(event, team.id!)} className="mt-3 flex flex-wrap items-center gap-2">
                      <input value={editingTeamName} onChange={(e) => setEditingTeamName(e.target.value)} required className="rounded-md border border-zinc-700 bg-zinc-950 px-2 py-1.5 text-xs text-zinc-100" />
                      <button type="submit" disabled={updateTeam.isPending} className="rounded-md bg-sky-600 px-2 py-1 text-xs font-medium text-white disabled:opacity-50">
                        Guardar
                      </button>
                      <button type="button" onClick={() => setEditingTeamId(null)} className="rounded-md border border-zinc-700 px-2 py-1 text-xs text-zinc-200">
                        Cancelar
                      </button>
                      {updateTeam.isError && (
                        <p className="text-xs text-red-400">
                          {updateTeam.error instanceof ApiError ? updateTeam.error.message : 'No se pudo actualizar el equipo.'}
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
    </section>
  );
};
