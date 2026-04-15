import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { AUTH_SESSION_CHANGED_EVENT, apiJson, notifyAuthSessionChanged } from '@/api/client';
import { queryKeys } from '@/api/query-keys';
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
  const queryClient = useQueryClient();
  const sessionQuery = useQuery({
    queryKey: queryKeys.auth.session(0),
    queryFn: () => apiJson<{ playerId: string; role: string }>('/auth/session'),
    retry: false,
  });
  const isAuthenticated = sessionQuery.isSuccess;

  useEffect(() => {
    const onSessionChanged = () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.auth.all });
    };
    window.addEventListener(AUTH_SESSION_CHANGED_EVENT, onSessionChanged);
    return () => {
      window.removeEventListener(AUTH_SESSION_CHANGED_EVENT, onSessionChanged);
    };
  }, [queryClient]);

  const handleLogout = async () => {
    await apiJson<void>('/auth/logout', { method: 'POST' });
    notifyAuthSessionChanged();
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
            {!isAuthenticated && (
              <NavLink to="/register" className={linkClass}>
                Registro
              </NavLink>
            )}
            {!isAuthenticated && (
              <NavLink to="/login" className={linkClass}>
                Login
              </NavLink>
            )}
            {isAuthenticated && (
              <button
                type="button"
                onClick={handleLogout}
                className="rounded-md px-3 py-1.5 text-sm text-zinc-300 transition-colors hover:bg-zinc-900 hover:text-zinc-100"
              >
                Logout
              </button>
            )}
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-6 py-8">
        <Outlet />
      </main>
    </div>
  );
};
