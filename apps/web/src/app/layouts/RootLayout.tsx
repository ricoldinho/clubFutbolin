import { Outlet, NavLink } from 'react-router-dom';
import { cn } from '@/lib/cn';

const linkClass = ({ isActive }: { isActive: boolean }) =>
  cn(
    'rounded-md px-3 py-1.5 text-sm transition-colors',
    isActive ? 'bg-zinc-800 text-zinc-100' : 'text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200',
  );

/**
 * Layout raíz: shell común y `<Outlet />` para rutas hijas.
 */
export const RootLayout = () => {
  const apiBase = import.meta.env.VITE_API_BASE ?? '/api';

  return (
    <div className="min-h-dvh bg-zinc-950 font-sans text-zinc-100">
      <header className="border-b border-zinc-800">
        <div className="mx-auto flex max-w-3xl flex-wrap items-center gap-4 px-6 py-4">
          <span className="text-lg font-semibold tracking-tight">clubFutbolin</span>
          <nav className="flex flex-wrap gap-1">
            <NavLink to="/" end className={linkClass}>
              Inicio
            </NavLink>
            <NavLink to="/login" className={linkClass}>
              Login
            </NavLink>
            <NavLink to="/matches" className={linkClass}>
              Matches
            </NavLink>
          </nav>
          <span className="ml-auto text-xs text-zinc-500">
            API: <code className="text-zinc-400">{apiBase}</code>
          </span>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-6 py-8">
        <Outlet />
      </main>
    </div>
  );
};
