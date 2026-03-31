import type { MatchDto } from '@/features/matches/api';
import { MatchStatusBadge } from './MatchStatusBadge';

interface MatchesTableProps {
  matches: MatchDto[];
  selectedMatchId: string | null;
  onSelectMatch: (matchId: string) => void;
}

const formatDate = (value: string): string =>
  new Intl.DateTimeFormat('es-ES', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));

export const MatchesTable = ({ matches, selectedMatchId, onSelectMatch }: MatchesTableProps) => (
  <section
    aria-labelledby="matches-table-title"
    className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm"
  >
    <h2 id="matches-table-title" className="sr-only">
      Tabla de partidos
    </h2>
    <div className="overflow-x-auto">
      <table className="min-w-full border-separate border-spacing-0 text-left text-sm">
        <caption className="sr-only">Listado de partidos filtrados por temporada y jornada</caption>
        <thead>
          <tr className="text-zinc-600">
            <th scope="col" className="border-b border-zinc-200 px-3 py-2 font-semibold">
              Jornada
            </th>
            <th scope="col" className="border-b border-zinc-200 px-3 py-2 font-semibold">
              Fecha
            </th>
            <th scope="col" className="border-b border-zinc-200 px-3 py-2 font-semibold">
              Equipos
            </th>
            <th scope="col" className="border-b border-zinc-200 px-3 py-2 font-semibold">
              Resultado
            </th>
            <th scope="col" className="border-b border-zinc-200 px-3 py-2 font-semibold">
              Estado
            </th>
            <th scope="col" className="border-b border-zinc-200 px-3 py-2 font-semibold">
              Acción
            </th>
          </tr>
        </thead>
        <tbody>
          {matches.map((match) => {
            const isSelected = selectedMatchId === match.id;
            return (
              <tr key={match.id} className="text-zinc-800">
                <td className="border-b border-zinc-100 px-3 py-2">{match.round}</td>
                <td className="border-b border-zinc-100 px-3 py-2">{formatDate(match.date)}</td>
                <td className="border-b border-zinc-100 px-3 py-2">
                  {match.homeTeamSeasonId.slice(0, 8)} vs {match.awayTeamSeasonId.slice(0, 8)}
                </td>
                <td className="border-b border-zinc-100 px-3 py-2">
                  {match.homeScore ?? '-'} - {match.awayScore ?? '-'}
                </td>
                <td className="border-b border-zinc-100 px-3 py-2">
                  <MatchStatusBadge status={match.status} />
                </td>
                <td className="border-b border-zinc-100 px-3 py-2">
                  <button
                    type="button"
                    onClick={() => onSelectMatch(match.id)}
                    className="rounded-lg border border-sky-300 px-2 py-1 text-xs font-semibold text-sky-700 hover:bg-sky-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2"
                    aria-pressed={isSelected}
                    aria-label={
                      isSelected
                        ? `Partido ${match.id} actualmente seleccionado`
                        : `Ver detalle del partido ${match.id}`
                    }
                  >
                    {isSelected ? 'Seleccionado' : 'Ver detalle'}
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  </section>
);
