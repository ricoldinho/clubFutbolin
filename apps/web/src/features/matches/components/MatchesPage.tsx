import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  ApiError,
} from '@/api/client';
import { useVerifiedAdmin } from '@/features/auth/api/useVerifiedAdmin';
import {
  useGenerateSeasonCalendar,
  useMatchById,
  useSeasonMatches,
  useUpdateMatchScore,
  useUpdateMatchStatus,
  useUpdateSeasonRoundDate,
} from '@/features/matches/api';
import { MatchDetailCard } from './MatchDetailCard';
import { MatchesFilters } from './MatchesFilters';
import { MatchesTable } from './MatchesTable';

export const MatchesPage = () => {
  const [searchParams] = useSearchParams();
  const initialSeasonId = searchParams.get('seasonId')?.trim() ?? '';
  const [draftSeasonId, setDraftSeasonId] = useState(initialSeasonId);
  const [seasonId, setSeasonId] = useState(initialSeasonId);
  const [roundInput, setRoundInput] = useState('');
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [selectedMatchId, setSelectedMatchId] = useState<string | null>(null);
  const [calendarStartDate, setCalendarStartDate] = useState('');
  const [doubleRoundRobin, setDoubleRoundRobin] = useState(false);
  const [roundDateDrafts, setRoundDateDrafts] = useState<Record<number, string>>({});

  const parsedRound = Number.parseInt(roundInput, 10);
  const roundFilter = Number.isInteger(parsedRound) && parsedRound > 0 ? parsedRound : undefined;

  const seasonMatches = useSeasonMatches(seasonId, { page, limit, round: roundFilter });
  const matchDetail = useMatchById(selectedMatchId ?? '');
  const generateCalendar = useGenerateSeasonCalendar();
  const updateScore = useUpdateMatchScore();
  const updateStatus = useUpdateMatchStatus();
  const updateRoundDate = useUpdateSeasonRoundDate();
  const { isVerifiedAdmin: isAdmin } = useVerifiedAdmin();
  const hasNextPage = seasonMatches.data ? page < seasonMatches.data.meta.lastPage : false;

  const roundsWithDates = useMemo(() => {
    if (!seasonMatches.data) return [];
    const byRound = new Map<number, string>();
    for (const match of seasonMatches.data.data) {
      if (!byRound.has(match.round)) {
        byRound.set(match.round, match.date.slice(0, 10));
      }
    }
    return Array.from(byRound.entries())
      .map(([round, date]) => ({ round, date }))
      .sort((a, b) => a.round - b.round);
  }, [seasonMatches.data]);

  useEffect(() => {
    if (roundsWithDates.length === 0) {
      setRoundDateDrafts({});
      return;
    }
    setRoundDateDrafts((prev) => {
      const next = { ...prev };
      for (const item of roundsWithDates) {
        if (!next[item.round]) {
          next[item.round] = item.date;
        }
      }
      return next;
    });
  }, [roundsWithDates]);

  const applyFilters = () => {
    setSeasonId(draftSeasonId.trim());
    setPage(1);
    setSelectedMatchId(null);
  };

  const handleGenerateCalendar = () => {
    if (!seasonId) return;
    if (!calendarStartDate) {
      window.alert('Selecciona una fecha de inicio para generar el calendario.');
      return;
    }
    const confirmed = window.confirm('Se va a generar el calendario de la temporada. ¿Continuar?');
    if (!confirmed) return;
    const [year, month, day] = calendarStartDate.split('-').map(Number);
    const startDate = new Date(Date.UTC(year!, month! - 1, day!, 12, 0, 0)).toISOString();
    generateCalendar.mutate({ seasonId, startDate, doubleRoundRobin });
  };

  const handleUpdateRoundDate = (round: number) => {
    if (!seasonId) return;
    const draftDate = roundDateDrafts[round];
    if (!draftDate) return;
    const [year, month, day] = draftDate.split('-').map(Number);
    const date = new Date(Date.UTC(year!, month! - 1, day!, 12, 0, 0)).toISOString();
    updateRoundDate.mutate({ seasonId, round, date });
  };

  const feedbackMessage = (() => {
    if (generateCalendar.isSuccess) return 'Calendario generado correctamente.';
    if (updateScore.isSuccess) return 'Resultado actualizado correctamente.';
    if (updateStatus.isSuccess) return 'Estado actualizado correctamente.';
    if (updateRoundDate.isSuccess) return 'Fecha de jornada actualizada correctamente.';
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
    if (updateRoundDate.isError)
      return updateRoundDate.error instanceof ApiError
        ? updateRoundDate.error.message
        : 'Error al actualizar fecha de jornada.';
    return null;
  })();

  return (
    <section
      className="flex flex-col gap-4"
      aria-busy={
        seasonMatches.isFetching ||
        matchDetail.isFetching ||
        generateCalendar.isPending ||
        updateScore.isPending ||
        updateStatus.isPending
      }
    >
      <header className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">Matches</h1>
        <p className="mt-1 text-sm text-zinc-600">
          Listado y detalle de partidos por temporada con acciones de administración.
        </p>
        {isAdmin && (
          <div className="mt-3 flex flex-wrap items-end gap-3 rounded-lg border border-zinc-200 bg-zinc-50 p-3">
            <label className="flex flex-col gap-1 text-sm text-zinc-700">
              <span className="font-medium">Inicio de season</span>
              <input
                type="date"
                value={calendarStartDate}
                onChange={(event) => setCalendarStartDate(event.target.value)}
                className="rounded-md border border-zinc-300 px-2 py-1.5"
              />
            </label>
            <label className="flex items-center gap-2 text-sm text-zinc-700">
              <input
                type="checkbox"
                checked={doubleRoundRobin}
                onChange={(event) => setDoubleRoundRobin(event.target.checked)}
              />
              Ida y vuelta (doble de partidos)
            </label>
            <button
              type="button"
              onClick={handleGenerateCalendar}
              disabled={!seasonId || !calendarStartDate || generateCalendar.isPending}
              className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-sky-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
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
        <section
          role="status"
          aria-live="polite"
          className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm"
        >
          <p className="animate-pulse text-sm text-zinc-500">Cargando partidos…</p>
        </section>
      )}

      {seasonMatches.isError && (
        <section
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
        >
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

      {isAdmin && seasonMatches.data && roundsWithDates.length > 0 && (
        <section className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
          <h2 className="text-lg font-semibold text-zinc-900">Ajustar fecha por jornada</h2>
          <p className="mt-1 text-xs text-zinc-600">
            Puedes cambiar manualmente la fecha de cualquier jornada visible.
          </p>
          <div className="mt-3 space-y-2">
            {roundsWithDates.map(({ round }) => (
              <div key={round} className="flex flex-wrap items-center gap-2">
                <span className="min-w-28 text-sm text-zinc-700">Jornada {round}</span>
                <input
                  type="date"
                  value={roundDateDrafts[round] ?? ''}
                  onChange={(event) =>
                    setRoundDateDrafts((prev) => ({ ...prev, [round]: event.target.value }))
                  }
                  className="rounded-md border border-zinc-300 px-2 py-1.5"
                />
                <button
                  type="button"
                  onClick={() => handleUpdateRoundDate(round)}
                  disabled={!roundDateDrafts[round] || updateRoundDate.isPending}
                  className="rounded-md border border-sky-700/70 bg-sky-900/40 px-3 py-1.5 text-sm font-medium text-sky-200 hover:bg-sky-900/70 disabled:opacity-40"
                >
                  Guardar fecha
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      {selectedMatchId && matchDetail.isPending && (
        <section
          role="status"
          aria-live="polite"
          className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm"
        >
          <p className="animate-pulse text-sm text-zinc-500">Cargando detalle…</p>
        </section>
      )}

      {selectedMatchId && matchDetail.isError && (
        <section
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
        >
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
        <section
          role="status"
          aria-live="polite"
          className="rounded-xl border border-zinc-200 bg-white p-4 text-sm text-zinc-700 shadow-sm"
        >
          {feedbackMessage}
        </section>
      )}
    </section>
  );
};
