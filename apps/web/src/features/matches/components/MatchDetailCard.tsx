import { type FormEvent, useState } from 'react';
import type { MatchDto } from '@/features/matches/api';
import { MatchStatusBadge } from './MatchStatusBadge';

interface MatchDetailCardProps {
  match: MatchDto;
  isAdmin: boolean;
  isUpdatingScore: boolean;
  isUpdatingStatus: boolean;
  onUpdateScore: (input: { matchId: string; homeScore: number; awayScore: number }) => void;
  onUpdateStatus: (input: { matchId: string; status: 'POSTPONED' | 'CANCELLED' }) => void;
}

const formatDate = (value: string): string =>
  new Intl.DateTimeFormat('es-ES', {
    dateStyle: 'full',
    timeStyle: 'short',
  }).format(new Date(value));

export const MatchDetailCard = ({
  match,
  isAdmin,
  isUpdatingScore,
  isUpdatingStatus,
  onUpdateScore,
  onUpdateStatus,
}: MatchDetailCardProps) => {
  const [homeScore, setHomeScore] = useState(match.homeScore ?? 0);
  const [awayScore, setAwayScore] = useState(match.awayScore ?? 0);
  const hasInvalidScore = !Number.isInteger(homeScore) || !Number.isInteger(awayScore);

  const onSubmitScore = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (homeScore < 0 || awayScore < 0 || hasInvalidScore) return;
    onUpdateScore({ matchId: match.id, homeScore, awayScore });
  };

  return (
    <section
      aria-labelledby="match-detail-title"
      className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm"
    >
      <h2 id="match-detail-title" className="text-lg font-semibold text-zinc-900">
        Detalle del partido
      </h2>
      <div className="mt-3 grid grid-cols-1 gap-2 text-sm text-zinc-700 sm:grid-cols-2">
        <p>
          <span className="font-semibold">Match ID:</span> {match.id}
        </p>
        <p>
          <span className="font-semibold">Season ID:</span> {match.seasonId}
        </p>
        <p>
          <span className="font-semibold">Fecha:</span> {formatDate(match.date)}
        </p>
        <p>
          <span className="font-semibold">Jornada:</span> {match.round}
        </p>
        <p>
          <span className="font-semibold">Resultado:</span> {match.homeScore ?? '-'} -{' '}
          {match.awayScore ?? '-'}
        </p>
        <p>
          <span className="font-semibold">Estado:</span> <MatchStatusBadge status={match.status} />
        </p>
      </div>

      {isAdmin && (
        <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
          <form onSubmit={onSubmitScore} className="rounded-lg border border-zinc-200 p-3">
            <h3 className="text-sm font-semibold text-zinc-900">Actualizar resultado</h3>
            <div className="mt-2 flex flex-wrap gap-2">
              <label htmlFor="match-detail-home-score" className="sr-only">
                Goles equipo local
              </label>
              <input
                id="match-detail-home-score"
                type="number"
                min={0}
                value={homeScore}
                onChange={(event) => setHomeScore(Number.parseInt(event.target.value, 10))}
                className="w-24 rounded-lg border border-zinc-300 px-2 py-1.5 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2"
              />
              <label htmlFor="match-detail-away-score" className="sr-only">
                Goles equipo visitante
              </label>
              <input
                id="match-detail-away-score"
                type="number"
                min={0}
                value={awayScore}
                onChange={(event) => setAwayScore(Number.parseInt(event.target.value, 10))}
                className="w-24 rounded-lg border border-zinc-300 px-2 py-1.5 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2"
              />
              <button
                type="submit"
                disabled={isUpdatingScore || hasInvalidScore}
                className="rounded-lg bg-sky-600 px-3 py-1.5 text-sm font-semibold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2 disabled:opacity-50"
              >
                {isUpdatingScore ? 'Guardando…' : 'Guardar'}
              </button>
            </div>
            {hasInvalidScore && (
              <p role="alert" className="mt-2 text-xs text-red-700">
                Introduce marcadores enteros válidos.
              </p>
            )}
          </form>

          <div className="rounded-lg border border-zinc-200 p-3">
            <h3 className="text-sm font-semibold text-zinc-900">Actualizar estado</h3>
            <div className="mt-2 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => onUpdateStatus({ matchId: match.id, status: 'POSTPONED' })}
                disabled={isUpdatingStatus}
                className="rounded-lg border border-amber-300 bg-amber-50 px-3 py-1.5 text-sm font-semibold text-amber-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2 disabled:opacity-50"
              >
                Marcar aplazado
              </button>
              <button
                type="button"
                onClick={() => onUpdateStatus({ matchId: match.id, status: 'CANCELLED' })}
                disabled={isUpdatingStatus}
                className="rounded-lg border border-red-300 bg-red-50 px-3 py-1.5 text-sm font-semibold text-red-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2 disabled:opacity-50"
              >
                Marcar cancelado
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
