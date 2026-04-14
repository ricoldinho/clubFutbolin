import { useEffect, useMemo, useState } from 'react';
import { ApiError } from '@/api/client';
import { useDebouncedValue } from '@/app/hooks/useDebouncedValue';
import { useRegisterTeamToSeason } from '@/features/leagues/api';
import { useTeams } from '@/features/teams/api';
import type { TeamListItemDto } from '@/features/teams/api/types';

const SEARCH_DEBOUNCE_MS = 350;
const SEARCH_PAGE_SIZE = 15;

type AssociateTeamsModalProps = {
  isOpen: boolean;
  leagueId: string;
  seasonId: string;
  seasonYear: number;
  existingTeamIds: string[];
  onClose: () => void;
};

export const AssociateTeamsModal = ({
  isOpen,
  leagueId,
  seasonId,
  seasonYear,
  existingTeamIds,
  onClose,
}: AssociateTeamsModalProps) => {
  const [searchText, setSearchText] = useState('');
  const [sessionAssociatedIds, setSessionAssociatedIds] = useState<string[]>([]);
  const debouncedSearch = useDebouncedValue(searchText, SEARCH_DEBOUNCE_MS);
  const registerTeamToSeason = useRegisterTeamToSeason();
  const teamsQuery = useTeams(1, SEARCH_PAGE_SIZE, debouncedSearch);

  useEffect(() => {
    if (!isOpen) {
      setSearchText('');
      setSessionAssociatedIds([]);
      registerTeamToSeason.reset();
    }
  }, [isOpen]);

  const disabledTeamIds = useMemo(
    () => new Set([...existingTeamIds, ...sessionAssociatedIds]),
    [existingTeamIds, sessionAssociatedIds],
  );

  const candidateTeams = useMemo(
    () =>
      (teamsQuery.data?.data ?? []).filter(
        (team): team is TeamListItemDto & { id: string } => team.id !== null,
      ),
    [teamsQuery.data],
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="associate-teams-modal-title"
        className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl border border-zinc-700 bg-zinc-950 p-5 shadow-xl"
        onClick={(event) => event.stopPropagation()}
      >
        <h2 id="associate-teams-modal-title" className="text-lg font-semibold text-zinc-100">
          Asociar equipos a la season {seasonYear}
        </h2>
        <p className="mt-1 text-xs text-zinc-500">
          Busca equipos por nombre y pulsa "Asociar". No se permiten asociaciones duplicadas.
        </p>

        <div className="mt-4 flex flex-col gap-2">
          <label htmlFor="season-team-search" className="text-xs font-medium text-zinc-400">
            Buscar equipo
          </label>
          <input
            id="season-team-search"
            type="search"
            value={searchText}
            onChange={(event) => setSearchText(event.target.value)}
            placeholder="Nombre del equipo..."
            maxLength={100}
            className="rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100"
          />
          {searchText !== debouncedSearch && (
            <p className="text-[11px] text-zinc-600">Aplicando busqueda...</p>
          )}
        </div>

        {registerTeamToSeason.isError && (
          <p className="mt-3 text-xs text-red-400">
            {registerTeamToSeason.error instanceof ApiError
              ? registerTeamToSeason.error.message
              : 'No se pudo asociar el equipo.'}
          </p>
        )}

        {searchText.trim().length > 0 && (
          <div className="mt-4 rounded-md border border-zinc-800 bg-zinc-900/90">
            {teamsQuery.isPending || teamsQuery.isFetching ? (
              <p className="px-3 py-2 text-xs text-zinc-500">Cargando equipos...</p>
            ) : candidateTeams.length === 0 ? (
              <p className="px-3 py-2 text-xs text-zinc-500">Sin resultados para esta busqueda.</p>
            ) : (
              <ul className="divide-y divide-zinc-800">
                {candidateTeams.map((team) => {
                  const isDisabled = disabledTeamIds.has(team.id);
                  return (
                    <li key={team.id} className="flex items-center justify-between gap-2 px-3 py-2">
                      <span className="min-w-0 truncate text-sm text-zinc-200">{team.name}</span>
                      {isDisabled ? (
                        <span className="text-[11px] text-zinc-500">Ya asociado</span>
                      ) : (
                        <button
                          type="button"
                          disabled={registerTeamToSeason.isPending}
                          onClick={() =>
                            registerTeamToSeason.mutate(
                              { leagueId, seasonId, teamId: team.id },
                              {
                                onSuccess: () => {
                                  setSessionAssociatedIds((prev) => [...prev, team.id]);
                                },
                              },
                            )
                          }
                          className="rounded border border-sky-800 bg-sky-950/40 px-2 py-0.5 text-xs text-sky-200 hover:bg-sky-900/50 disabled:opacity-40"
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

        <div className="mt-4 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-zinc-600 px-4 py-2 text-sm text-zinc-200 hover:bg-zinc-800"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
