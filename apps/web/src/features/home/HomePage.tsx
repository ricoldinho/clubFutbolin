import { Link } from 'react-router-dom';
import { ApiError } from '@/api/client';
import { useLeagues } from '@/features/leagues/api/useLeagues';
import { cn } from '@/lib/cn';

export const HomePage = () => {
  const { data: leagues, isPending, isError, error } = useLeagues();

  return (
    <div className="flex flex-col gap-4">
      <h1 className={cn('text-2xl font-semibold tracking-tight')}>Inicio</h1>
      <p className="text-sm text-zinc-400">
        SPA con Vite, React 19, Tailwind v4, React Router 7 y TanStack Query. El proxy envía{' '}
        <code className="rounded bg-zinc-800 px-1 py-0.5 text-zinc-200">/api</code> al backend.
      </p>

      <section className="rounded-lg border border-zinc-800 p-4">
        <h2 className="mb-2 text-sm font-medium text-zinc-300">Ligas (GET /leagues)</h2>
        {isPending && <p className="text-sm text-zinc-500">Cargando…</p>}
        {isError && (
          <p className="text-sm text-red-400">
            {error instanceof ApiError ? error.message : 'No se pudieron cargar las ligas'}
          </p>
        )}
        {leagues && leagues.length === 0 && (
          <p className="text-sm text-zinc-500">No hay ligas (lista vacía).</p>
        )}
        {leagues && leagues.length > 0 && (
          <ul className="list-inside list-disc text-sm text-zinc-300">
            {leagues.map((l) => (
              <li key={l.id ?? l.name}>
                {l.name}{' '}
                <span className="text-zinc-500">({l.leagueCategory})</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <p className="text-sm">
        <Link to="/login" className="text-sky-400 underline-offset-2 hover:underline">
          Ir a login
        </Link>
      </p>
    </div>
  );
};
