import { type FormEvent, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ApiError } from '@/api/client';
import { useRegister } from '@/features/auth/api/useRegister';
import { PLAYER_CATEGORIES } from '@/features/players/api';
import { cn } from '@/lib/cn';

export const RegisterPage = () => {
  const navigate = useNavigate();
  const register = useRegister();
  const [name, setName] = useState('');
  const [lastname, setLastname] = useState('');
  const [nickname, setNickname] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [birthdate, setBirthdate] = useState('');
  const [category, setCategory] = useState<(typeof PLAYER_CATEGORIES)[number]>('CUARTA');
  const [password, setPassword] = useState('');

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    register.mutate(
      {
        name,
        lastname,
        nickname: nickname.trim().length > 0 ? nickname : null,
        email,
        phoneNumber,
        birthdate,
        category,
        password,
      },
      {
        onSuccess: () => {
          void navigate('/login');
        },
      },
    );
  };

  return (
    <div className="flex flex-col gap-4">
      <h1 className={cn('text-2xl font-semibold tracking-tight')}>Registro</h1>

      <form onSubmit={onSubmit} className="grid max-w-xl grid-cols-1 gap-3 md:grid-cols-2">
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-zinc-400">Nombre</span>
          <input
            type="text"
            value={name}
            onChange={(event) => setName(event.target.value)}
            required
            className="rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-zinc-100"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-zinc-400">Apellidos</span>
          <input
            type="text"
            value={lastname}
            onChange={(event) => setLastname(event.target.value)}
            required
            className="rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-zinc-100"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-zinc-400">Alias (opcional)</span>
          <input
            type="text"
            value={nickname}
            onChange={(event) => setNickname(event.target.value)}
            className="rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-zinc-100"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-zinc-400">Email</span>
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            autoComplete="email"
            required
            className="rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-zinc-100"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-zinc-400">Teléfono</span>
          <input
            type="text"
            value={phoneNumber}
            onChange={(event) => setPhoneNumber(event.target.value)}
            required
            className="rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-zinc-100"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-zinc-400">Fecha de nacimiento</span>
          <input
            type="date"
            value={birthdate}
            onChange={(event) => setBirthdate(event.target.value)}
            required
            className="rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-zinc-100"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-zinc-400">Categoría</span>
          <select
            value={category}
            onChange={(event) =>
              setCategory(event.target.value as (typeof PLAYER_CATEGORIES)[number])
            }
            className="rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-zinc-100"
          >
            {PLAYER_CATEGORIES.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-zinc-400">Contraseña</span>
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="new-password"
            minLength={8}
            required
            className="rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-zinc-100"
          />
        </label>
        <div className="md:col-span-2">
          <button
            type="submit"
            disabled={register.isPending}
            className="rounded-md bg-sky-600 px-3 py-2 text-sm font-medium text-white disabled:opacity-50"
          >
            {register.isPending ? 'Registrando…' : 'Crear cuenta'}
          </button>
        </div>
      </form>

      {register.isError && (
        <p className="text-sm text-red-400">
          {register.error instanceof ApiError ? register.error.message : 'Error de registro'}
        </p>
      )}

      {register.isSuccess && (
        <p className="text-sm text-emerald-400">
          Registro completado. Redirigiendo a login...
        </p>
      )}

      <Link to="/login" className="text-sm text-sky-400 underline-offset-2 hover:underline">
        Ya tengo cuenta
      </Link>
    </div>
  );
};
