interface MatchesFiltersProps {
  seasonId: string;
  page: number;
  limit: number;
  round: string;
  onSeasonIdChange: (value: string) => void;
  onRoundChange: (value: string) => void;
  onApplyFilters: () => void;
  onPrevPage: () => void;
  onNextPage: () => void;
  canGoPrev: boolean;
  canGoNext: boolean;
  disabled?: boolean;
}

export const MatchesFilters = ({
  seasonId,
  page,
  limit,
  round,
  onSeasonIdChange,
  onRoundChange,
  onApplyFilters,
  onPrevPage,
  onNextPage,
  canGoPrev,
  canGoNext,
  disabled = false,
}: MatchesFiltersProps) => (
  <section
    aria-labelledby="matches-filters-title"
    className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm"
  >
    <h2 id="matches-filters-title" className="sr-only">
      Filtros de partidos
    </h2>
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
      <label className="flex flex-col gap-1 text-sm text-zinc-700">
        <span id="matches-season-id-label" className="font-medium">
          Season ID
        </span>
        <input
          id="matches-season-id"
          aria-labelledby="matches-season-id-label"
          value={seasonId}
          onChange={(event) => onSeasonIdChange(event.target.value)}
          placeholder="UUID de temporada"
          className="rounded-lg border border-zinc-300 px-3 py-2 text-zinc-900 outline-none ring-sky-500 transition focus-visible:ring-2"
        />
      </label>
      <label className="flex flex-col gap-1 text-sm text-zinc-700">
        <span id="matches-round-label" className="font-medium">
          Jornada (opcional)
        </span>
        <input
          id="matches-round"
          aria-labelledby="matches-round-label"
          value={round}
          onChange={(event) => onRoundChange(event.target.value)}
          placeholder="Ej. 3"
          inputMode="numeric"
          className="rounded-lg border border-zinc-300 px-3 py-2 text-zinc-900 outline-none ring-sky-500 transition focus-visible:ring-2"
        />
      </label>
      <div className="flex items-end">
        <button
          type="button"
          onClick={onApplyFilters}
          disabled={disabled}
          className="w-full rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-sky-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Aplicar filtros
        </button>
      </div>
    </div>

    <div className="mt-4 flex flex-wrap items-center gap-2">
      <span className="text-sm text-zinc-600">Page {page}</span>
      <span className="text-sm text-zinc-600">Limit {limit}</span>
      <button
        type="button"
        onClick={onPrevPage}
        disabled={!canGoPrev || disabled}
        className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm text-zinc-700 transition hover:bg-zinc-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
      >
        Anterior
      </button>
      <button
        type="button"
        onClick={onNextPage}
        disabled={!canGoNext || disabled}
        className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm text-zinc-700 transition hover:bg-zinc-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
      >
        Siguiente
      </button>
    </div>
  </section>
);
