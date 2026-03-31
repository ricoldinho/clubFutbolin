import { useEffect, useState } from 'react';
import {
  AUTH_TOKEN_CHANGED_EVENT,
  AUTH_TOKEN_STORAGE_KEY,
  ApiError,
  getStoredAuthToken,
} from '@/api/client';
import {
  useGenerateSeasonCalendar,
  useMatchById,
  useSeasonMatches,
  useUpdateMatchScore,
  useUpdateMatchStatus,
} from '@/features/matches/api';
import { MatchDetailCard } from './MatchDetailCard';
import { MatchesFilters } from './MatchesFilters';
import { MatchesTable } from './MatchesTable';

const parseAdminRoleFromToken = (token: string | null): boolean => {
  if (!token) return false;

  const chunks = token.split('.');
  if (chunks.length !== 3) return false;

  try {
    const payload = JSON.parse(atob(chunks[1].replace(/-/g, '+').replace(/_/g, '/'))) as {
      role?: string;
    };
    return payload.role === 'ADMIN';
  } catch {
    return false;
  }
};

export const MatchesPage = () => {
  const [draftSeasonId, setDraftSeasonId] = useState('');
  const [seasonId, setSeasonId] = useState('');
  const [roundInput, setRoundInput] = useState('');
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [selectedMatchId, setSelectedMatchId] = useState<string | null>(null);

  const roundFilter =
    roundInput.trim().length > 0 && Number(roundInput) > 0 ? Number(roundInput) : undefined;

  const seasonMatches = useSeasonMatches(seasonId, { page, limit, round: roundFilter });
  const matchDetail = useMatchById(selectedMatchId ?? '');
  const generateCalendar = useGenerateSeasonCalendar();
  const updateScore = useUpdateMatchScore();
  const updateStatus = useUpdateMatchStatus();
  const [isAdmin, setIsAdmin] = useState<boolean>(() =>
    parseAdminRoleFromToken(getStoredAuthToken()),
  );
  const hasNextPage = seasonMatches.data ? page < seasonMatches.data.meta.lastPage : false;

  useEffect(() => {
    const syncAdminRole = () => setIsAdmin(parseAdminRoleFromToken(getStoredAuthToken()));

    const onStorage = (event: StorageEvent) => {
      if (event.key === null || event.key === AUTH_TOKEN_STORAGE_KEY) {
        syncAdminRole();
      }
    };

    window.addEventListener('storage', onStorage);
    window.addEventListener(AUTH_TOKEN_CHANGED_EVENT, syncAdminRole);
    return () => {
      window.removeEventListener('storage', onStorage);
      window.removeEventListener(AUTH_TOKEN_CHANGED_EVENT, syncAdminRole);
    };
  }, []);

  const applyFilters = () => {
    setSeasonId(draftSeasonId.trim());
    setPage(1);
    setSelectedMatchId(null);
  };

  const handleGenerateCalendar = () => {
    if (!seasonId) return;
    const confirmed = window.confirm('Se va a generar el calendario de la temporada. ¿Continuar?');
    if (!confirmed) return;
    generateCalendar.mutate({ seasonId });
  };

  const feedbackMessage = (() => {
    if (generateCalendar.isSuccess) return 'Calendario generado correctamente.';
    if (updateScore.isSuccess) return 'Resultado actualizado correctamente.';
    if (updateStatus.isSuccess) return 'Estado actualizado correctamente.';
    if (generateCalendar.isError)
      return generateCalendar.error instanceof ApiError
        ? generateCalendar.error.message
        : 'Error al generar calendario.';
    if (updateScore.isError)
      return updateScore.error instanceof ApiError
        ? updateScore.error.message
        : 'Error al actualizar resultado.';
    if (updateStatus.isError)
      return updateStatus.error instanceof ApiError
        ? updateStatus.error.message
        : 'Error al actualizar estado.';
    return null;
  })();

  return (
    <div className="flex flex-col gap-4">
      <header className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">Matches</h1>
        <p className="mt-1 text-sm text-zinc-600">
          Listado y detalle de partidos por temporada con acciones de administración.
        </p>
        {isAdmin && (
          <div className="mt-3">
            <button
              type="button"
              onClick={handleGenerateCalendar}
              disabled={!seasonId || generateCalendar.isPending}
              className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {generateCalendar.isPending ? 'Generando calendario…' : 'Generar calendario'}
            </button>
          </div>
        )}
      </header>

      <MatchesFilters
        seasonId={draftSeasonId}
        page={page}
        limit={limit}
        round={roundInput}
        onSeasonIdChange={setDraftSeasonId}
        onRoundChange={setRoundInput}
        onApplyFilters={applyFilters}
        onPrevPage={() => setPage((prev) => Math.max(1, prev - 1))}
        onNextPage={() => setPage((prev) => prev + 1)}
        canGoPrev={page > 1}
        canGoNext={hasNextPage}
        disabled={seasonMatches.isFetching}
      />

      {!seasonId && (
        <section className="rounded-xl border border-zinc-200 bg-zinc-50 p-4 text-sm text-zinc-700">
          Introduce una temporada y pulsa &quot;Aplicar filtros&quot; para cargar partidos.
        </section>
      )}

      {seasonMatches.isPending && seasonId && (
        <section className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
          <p className="animate-pulse text-sm text-zinc-500">Cargando partidos…</p>
        </section>
      )}

      {seasonMatches.isError && (
        <section className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {seasonMatches.error instanceof ApiError
            ? seasonMatches.error.message
            : 'No se pudo cargar el listado de partidos.'}
        </section>
      )}

      {seasonMatches.data && seasonMatches.data.data.length === 0 && (
        <section className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm text-sm text-zinc-600">
          No hay partidos para los filtros actuales.
        </section>
      )}

      {seasonMatches.data && seasonMatches.data.data.length > 0 && (
        <MatchesTable
          matches={seasonMatches.data.data}
          selectedMatchId={selectedMatchId}
          onSelectMatch={setSelectedMatchId}
        />
      )}

      {selectedMatchId && matchDetail.isPending && (
        <section className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
          <p className="animate-pulse text-sm text-zinc-500">Cargando detalle…</p>
        </section>
      )}

      {selectedMatchId && matchDetail.isError && (
        <section className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {matchDetail.error instanceof ApiError
            ? matchDetail.error.message
            : 'No se pudo cargar el detalle del partido.'}
        </section>
      )}

      {matchDetail.data && (
        <MatchDetailCard
          key={matchDetail.data.id}
          match={matchDetail.data}
          isAdmin={isAdmin}
          isUpdatingScore={updateScore.isPending}
          isUpdatingStatus={updateStatus.isPending}
          onUpdateScore={updateScore.mutate}
          onUpdateStatus={updateStatus.mutate}
        />
      )}

      {feedbackMessage && (
        <section className="rounded-xl border border-zinc-200 bg-white p-4 text-sm text-zinc-700 shadow-sm">
          {feedbackMessage}
        </section>
      )}
    </div>
  );
};
