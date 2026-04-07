import { useEffect, useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import {
  AUTH_TOKEN_CHANGED_EVENT,
  AUTH_TOKEN_STORAGE_KEY,
  clearStoredAuthToken,
  getStoredAuthToken,
} from '@/api/client';
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
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(() => getStoredAuthToken() !== null);

  useEffect(() => {
    const syncAuth = () => setIsAuthenticated(getStoredAuthToken() !== null);

    const onStorage = (event: StorageEvent) => {
      if (event.key === null || event.key === AUTH_TOKEN_STORAGE_KEY) {
        syncAuth();
      }
    };

    window.addEventListener('storage', onStorage);
    window.addEventListener(AUTH_TOKEN_CHANGED_EVENT, syncAuth);
    return () => {
      window.removeEventListener('storage', onStorage);
      window.removeEventListener(AUTH_TOKEN_CHANGED_EVENT, syncAuth);
    };
  }, []);

  const handleLogout = () => {
    clearStoredAuthToken();
    void navigate('/');
  };

  return (
    <div className="min-h-dvh bg-zinc-950 font-sans text-zinc-100">
      <header className="border-b border-zinc-800">
        <div className="mx-auto flex max-w-3xl flex-wrap items-center gap-4 px-6 py-4">
          <span className="text-lg font-semibold tracking-tight">clubFutbolin</span>
          <nav className="flex flex-wrap gap-1">
            <NavLink to="/" end className={linkClass}>
              Inicio
            </NavLink>
            <NavLink to="/players" className={linkClass}>
              Players
            </NavLink>
            <NavLink to="/teams" className={linkClass}>
              Teams
            </NavLink>
            <NavLink to="/leagues" className={linkClass}>
              Leagues
            </NavLink>
          </nav>
          <div className="ml-auto flex items-center gap-2">
            <NavLink to="/login" className={linkClass}>
              Login
            </NavLink>
            <button
              type="button"
              onClick={handleLogout}
              disabled={!isAuthenticated}
              className="rounded-md px-3 py-1.5 text-sm text-zinc-300 transition-colors hover:bg-zinc-900 hover:text-zinc-100 disabled:cursor-not-allowed disabled:text-zinc-600"
            >
              Logout
            </button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-6 py-8">
        <Outlet />
      </main>
    </div>
  );
};
