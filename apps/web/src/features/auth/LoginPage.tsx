import { type FormEvent, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ApiError } from '@/api/client';
import { useLogin } from '@/features/auth/api/useLogin';
import { cn } from '@/lib/cn';

/**
 * Login con `useMutation` + invalidación de queries tras éxito.
 */
export const LoginPage = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const login = useLogin({
    onSuccess: ({ playerId }) => {
      void navigate(`/players/${playerId}`);
    },
  });

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    login.mutate({ email, password });
  };

  return (
    <div className="flex flex-col gap-4">
      <h1 className={cn('text-2xl font-semibold tracking-tight')}>Login</h1>

      <form onSubmit={onSubmit} className="flex max-w-sm flex-col gap-3">
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-zinc-400">Email</span>
          <input
            type="email"
            value={email}
            onChange={(ev) => setEmail(ev.target.value)}
            autoComplete="email"
            required
            className="rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-zinc-100"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-zinc-400">Contraseña</span>
          <input
            type="password"
            value={password}
            onChange={(ev) => setPassword(ev.target.value)}
            autoComplete="current-password"
            required
            className="rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-zinc-100"
          />
        </label>
        <button
          type="submit"
          disabled={login.isPending}
          className="rounded-md bg-sky-600 px-3 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          {login.isPending ? 'Entrando…' : 'Entrar'}
        </button>
      </form>

      {login.isError && (
        <p className="text-sm text-red-400">
          {login.error instanceof ApiError ? login.error.message : 'Error de login'}
        </p>
      )}
      {login.isSuccess && (
        <p className="text-sm text-emerald-400">Sesión iniciada.</p>
      )}

      <div className="flex gap-4 text-sm">
        <Link to="/register" className="text-sky-400 underline-offset-2 hover:underline">
          Crear cuenta
        </Link>
        <Link to="/" className="text-sky-400 underline-offset-2 hover:underline">
          Volver al inicio
        </Link>
      </div>
    </div>
  );
};
