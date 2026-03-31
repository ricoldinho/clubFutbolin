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

  const onSubmitScore = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (homeScore < 0 || awayScore < 0) return;
    onUpdateScore({ matchId: match.id, homeScore, awayScore });
  };

  return (
    <section className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
      <h2 className="text-lg font-semibold text-zinc-900">Detalle del partido</h2>
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
              <input
                type="number"
                min={0}
                value={homeScore}
                onChange={(event) => setHomeScore(Number(event.target.value))}
                className="w-24 rounded-lg border border-zinc-300 px-2 py-1.5 text-sm"
              />
              <input
                type="number"
                min={0}
                value={awayScore}
                onChange={(event) => setAwayScore(Number(event.target.value))}
                className="w-24 rounded-lg border border-zinc-300 px-2 py-1.5 text-sm"
              />
              <button
                type="submit"
                disabled={isUpdatingScore}
                className="rounded-lg bg-sky-600 px-3 py-1.5 text-sm font-semibold text-white disabled:opacity-50"
              >
                {isUpdatingScore ? 'Guardando…' : 'Guardar'}
              </button>
            </div>
          </form>

          <div className="rounded-lg border border-zinc-200 p-3">
            <h3 className="text-sm font-semibold text-zinc-900">Actualizar estado</h3>
            <div className="mt-2 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => onUpdateStatus({ matchId: match.id, status: 'POSTPONED' })}
                disabled={isUpdatingStatus}
                className="rounded-lg border border-amber-300 bg-amber-50 px-3 py-1.5 text-sm font-semibold text-amber-800 disabled:opacity-50"
              >
                Marcar aplazado
              </button>
              <button
                type="button"
                onClick={() => onUpdateStatus({ matchId: match.id, status: 'CANCELLED' })}
                disabled={isUpdatingStatus}
                className="rounded-lg border border-red-300 bg-red-50 px-3 py-1.5 text-sm font-semibold text-red-800 disabled:opacity-50"
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
