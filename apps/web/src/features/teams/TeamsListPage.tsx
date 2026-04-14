import { type FormEvent, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ApiError } from '@/api/client';
import { PaginationBar } from '@/app/components/PaginationBar';
import { useDebouncedValue } from '@/app/hooks/useDebouncedValue';
import { useVerifiedAdmin } from '@/features/auth/api/useVerifiedAdmin';
import { usePlayersList } from '@/features/players/api';
import type { PlayerDto } from '@/features/players/api/types';
import { useCreateTeam, useDeleteTeam, useTeams, useUpdateTeam } from '@/features/teams/api';
import type { TeamListItemDto } from '@/features/teams/api/types';

const PAGE_SIZE = 20;
const SEARCH_DEBOUNCE_MS = 350;
const PLAYER_PICK_PAGE_SIZE = 15;
const MAX_PLAYERS_PER_NEW_TEAM = 4;

const nameCollator = new Intl.Collator('es', { sensitivity: 'base' });

function compareTeamsByName(a: TeamListItemDto, b: TeamListItemDto): number {
  return nameCollator.compare(a.name, b.name);
}

function formatPlayerLabel(p: PlayerDto): string {
  const nick = p.nickname ? ` (${p.nickname})` : '';
  return `${p.name} ${p.lastname}${nick}`.trim();
}

export const TeamsListPage = () => {
  const [page, setPage] = useState(1);
  const [searchText, setSearchText] = useState('');
  const debouncedSearch = useDebouncedValue(searchText, SEARCH_DEBOUNCE_MS);
  const [sortAlphabetically, setSortAlphabetically] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [modalTeamName, setModalTeamName] = useState('');
  const [modalPlayerSearch, setModalPlayerSearch] = useState('');
  const debouncedPlayerSearch = useDebouncedValue(modalPlayerSearch, SEARCH_DEBOUNCE_MS);
  const [modalSelectedPlayers, setModalSelectedPlayers] = useState<PlayerDto[]>([]);
  const [associateMessage, setAssociateMessage] = useState<string | null>(null);
  const [editingTeamId, setEditingTeamId] = useState<string | null>(null);
  const [editingTeamName, setEditingTeamName] = useState('');
  const query = useTeams(page, PAGE_SIZE, debouncedSearch);
  const playersForModal = usePlayersList(1, PLAYER_PICK_PAGE_SIZE, debouncedPlayerSearch, {
    enabled: createModalOpen,
  });
  const createTeam = useCreateTeam();
  const updateTeam = useUpdateTeam();
  const deleteTeam = useDeleteTeam();
  const { isVerifiedAdmin, isVerifyingAdmin } = useVerifiedAdmin();

  const handleSearchChange = (value: string) => {
    setSearchText(value);
    setPage(1);
  };

  const displayedTeams = useMemo(() => {
    if (!query.data) return [];
    const rows = [...query.data.data];
    if (sortAlphabetically) {
      rows.sort(compareTeamsByName);
    }
    return rows;
  }, [query.data, sortAlphabetically]);

  const playerSearchRows = useMemo(
    () => (playersForModal.data?.data ?? []).filter((p): p is PlayerDto & { id: string } => p.id !== null),
    [playersForModal.data],
  );

  const playerSearchHasQuery = debouncedPlayerSearch.trim().length > 0;
  const playerSearchLoading =
    playerSearchHasQuery && (playersForModal.isPending || playersForModal.isFetching);

  const canSubmitCreate =
    modalTeamName.trim().length > 0 &&
    modalSelectedPlayers.length >= 2 &&
    modalSelectedPlayers.length <= MAX_PLAYERS_PER_NEW_TEAM;

  const addPlayerFromPicker = (player: PlayerDto) => {
    setAssociateMessage(null);
    if (!player.id) return;
    if (modalSelectedPlayers.length >= MAX_PLAYERS_PER_NEW_TEAM) {
      setAssociateMessage(`Como máximo ${MAX_PLAYERS_PER_NEW_TEAM} jugadores en la plantilla inicial.`);
      return;
    }
    if (modalSelectedPlayers.some((p) => p.id === player.id)) {
      setAssociateMessage('Ese jugador ya está en la lista.');
      return;
    }
    setModalSelectedPlayers((prev) => [...prev, player]);
    setModalPlayerSearch('');
  };

  const onSubmitCreateModal = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canSubmitCreate) return;
    const ids = modalSelectedPlayers.map((p) => p.id).filter((id): id is string => id !== null);
    createTeam.mutate(
      { name: modalTeamName.trim(), playerIds: ids },
      {
        onSuccess: () => {
          setCreateModalOpen(false);
        },
      },
    );
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
          onChange={(e) => handleSearchChange(e.target.value)}
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
        <div>
          <button
            type="button"
            onClick={() => {
              setModalTeamName('');
              setModalPlayerSearch('');
              setModalSelectedPlayers([]);
              setAssociateMessage(null);
              createTeam.reset();
              setCreateModalOpen(true);
            }}
            className="rounded-md bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-500"
          >
            Crear equipo
          </button>
        </div>
      )}

      {createModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          role="presentation"
          onClick={() => setCreateModalOpen(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="create-team-modal-title"
            className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl border border-zinc-700 bg-zinc-950 p-5 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 id="create-team-modal-title" className="text-lg font-semibold text-zinc-100">
              Nuevo equipo
            </h2>
            <p className="mt-1 text-xs text-zinc-500">
              Se necesitan al menos 2 jugadores para crear el equipo. El botón &quot;Crear&quot; solo se activa
              cuando el nombre es válido y hay 2 o más jugadores asociados.
            </p>
            <form onSubmit={onSubmitCreateModal} className="mt-4 flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <label htmlFor="modal-team-name" className="text-xs font-medium text-zinc-400">
                  Nombre del equipo
                </label>
                <input
                  id="modal-team-name"
                  value={modalTeamName}
                  onChange={(e) => setModalTeamName(e.target.value)}
                  required
                  maxLength={100}
                  placeholder="Nombre del equipo"
                  className="rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100"
                />
              </div>

              <div className="flex flex-col gap-2">
                <span className="text-xs font-medium text-zinc-400">Asociar jugadores</span>
                <p className="text-[11px] leading-snug text-zinc-500">
                  Escribe el nombre o el alias: verás la lista de jugadores que coinciden y puedes pulsar
                  &quot;Asociar&quot; en cada fila para sumarlo a la plantilla. Debes asociar como mínimo 2
                  jugadores distintos.
                </p>
                <div
                  className="flex items-start gap-2 rounded-lg border border-emerald-900/45 bg-emerald-950/25 px-3 py-2"
                  role="note"
                  aria-label="Asociación de jugadores al equipo que estás creando"
                >
                  <svg
                    className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden
                  >
                    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
                  </svg>
                  <p className="text-[11px] leading-snug text-emerald-100/90">
                    Los jugadores que elijas con{' '}
                    <span className="font-medium text-emerald-200">Asociar</span> pasarán a la plantilla de{' '}
                    <span className="font-medium text-emerald-50">
                      {modalTeamName.trim() ? `«${modalTeamName.trim()}»` : 'este equipo nuevo'}
                    </span>
                    .
                  </p>
                </div>
                <input
                  id="modal-player-search"
                  value={modalPlayerSearch}
                  onChange={(e) => setModalPlayerSearch(e.target.value)}
                  placeholder="Nombre o nickname…"
                  maxLength={100}
                  aria-label="Buscar jugador por nombre o alias"
                  aria-controls="player-search-results"
                  aria-autocomplete="list"
                  className="w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100"
                />
                {modalPlayerSearch !== debouncedPlayerSearch && (
                  <p className="text-[11px] text-zinc-600">Aplicando búsqueda…</p>
                )}
                {associateMessage && (
                  <p className="text-[11px] text-amber-400" role="status">
                    {associateMessage}
                  </p>
                )}
                {playerSearchHasQuery && (
                  <div
                    id="player-search-results"
                    className="max-h-48 overflow-y-auto rounded-md border border-zinc-800 bg-zinc-900/90"
                    role="region"
                    aria-label="Jugadores que coinciden con la búsqueda"
                  >
                    {playerSearchLoading ? (
                      <p className="px-3 py-2 text-[11px] text-zinc-500">Cargando coincidencias…</p>
                    ) : playerSearchRows.length === 0 ? (
                      <p className="px-3 py-2 text-[11px] text-zinc-500">Sin resultados para esta búsqueda.</p>
                    ) : (
                      <ul className="divide-y divide-zinc-800">
                        {playerSearchRows.map((p) => {
                          const already = modalSelectedPlayers.some((s) => s.id === p.id);
                          const rosterFull = modalSelectedPlayers.length >= MAX_PLAYERS_PER_NEW_TEAM;
                          return (
                            <li
                              key={p.id}
                              className="flex items-center justify-between gap-2 px-3 py-2 text-sm text-zinc-200"
                            >
                              <span className="min-w-0 truncate">{formatPlayerLabel(p)}</span>
                              {already ? (
                                <span className="shrink-0 text-[11px] text-zinc-500">En el equipo</span>
                              ) : (
                                <button
                                  type="button"
                                  disabled={rosterFull}
                                  title={
                                    rosterFull
                                      ? `Máximo ${MAX_PLAYERS_PER_NEW_TEAM} jugadores`
                                      : `Asociar a ${formatPlayerLabel(p)} a la plantilla de este equipo`
                                  }
                                  aria-label={`Asociar a ${formatPlayerLabel(p)} a la plantilla de este equipo`}
                                  onClick={() => addPlayerFromPicker(p)}
                                  className="shrink-0 rounded border border-sky-800 bg-sky-950/40 px-2 py-0.5 text-xs text-sky-200 hover:bg-sky-900/50 disabled:cursor-not-allowed disabled:opacity-40"
                                >
                                  Asociar
                                </button>
                              )}
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </div>
                )}
              </div>

              {modalSelectedPlayers.length > 0 && (
                <div>
                  <p className="mb-1 text-xs text-zinc-500">
                    Jugadores seleccionados ({modalSelectedPlayers.length}/{MAX_PLAYERS_PER_NEW_TEAM})
                  </p>
                  <ul className="flex flex-col gap-1 rounded-md border border-zinc-800 bg-zinc-900/80 p-2">
                    {modalSelectedPlayers.map((p) => (
                      <li
                        key={p.id!}
                        className="flex items-center justify-between gap-2 text-sm text-zinc-200"
                      >
                        <span>{formatPlayerLabel(p)}</span>
                        <button
                          type="button"
                          onClick={() =>
                            setModalSelectedPlayers((prev) => prev.filter((x) => x.id !== p.id))
                          }
                          className="rounded border border-zinc-600 px-2 py-0.5 text-xs text-zinc-400 hover:bg-zinc-800"
                        >
                          Quitar
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {createTeam.isError && (
                <p className="text-xs text-red-400">
                  {createTeam.error instanceof ApiError
                    ? createTeam.error.message
                    : 'No se pudo crear el equipo.'}
                </p>
              )}

              <div className="flex flex-wrap gap-2 border-t border-zinc-800 pt-4">
                <button
                  type="submit"
                  disabled={!canSubmitCreate || createTeam.isPending}
                  className="rounded-md bg-sky-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-40"
                >
                  {createTeam.isPending ? 'Creando…' : 'Finalizar creación'}
                </button>
                <button
                  type="button"
                  onClick={() => setCreateModalOpen(false)}
                  className="rounded-md border border-zinc-600 px-4 py-2 text-sm text-zinc-200 hover:bg-zinc-800"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
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
