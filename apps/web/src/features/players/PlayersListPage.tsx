import { type FormEvent, useState } from 'react';
import { Link } from 'react-router-dom';
import { ApiError } from '@/api/client';
import { PaginationBar } from '@/app/components/PaginationBar';
import { useVerifiedAdmin } from '@/features/auth/api/useVerifiedAdmin';
import {
  PLAYER_CATEGORIES,
  PLAYER_ROLES,
  useCreatePlayer,
  useDeletePlayer,
  usePlayersList,
  useUpdatePlayer,
} from '@/features/players/api';

const PAGE_SIZE = 20;

export const PlayersListPage = () => {
  const [page, setPage] = useState(1);
  const [newName, setNewName] = useState('');
  const [newLastname, setNewLastname] = useState('');
  const [newNickname, setNewNickname] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPhoneNumber, setNewPhoneNumber] = useState('');
  const [newBirthdate, setNewBirthdate] = useState('');
  const [newCategory, setNewCategory] = useState<(typeof PLAYER_CATEGORIES)[number]>('CUARTA');
  const [newPassword, setNewPassword] = useState('');
  const [editingPlayerId, setEditingPlayerId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [editingLastname, setEditingLastname] = useState('');
  const [editingNickname, setEditingNickname] = useState('');
  const [editingCategory, setEditingCategory] = useState<(typeof PLAYER_CATEGORIES)[number]>('CUARTA');
  const [editingRole, setEditingRole] = useState<(typeof PLAYER_ROLES)[number]>('USER');
  const query = usePlayersList(page, PAGE_SIZE);
  const createPlayer = useCreatePlayer();
  const updatePlayer = useUpdatePlayer();
  const deletePlayer = useDeletePlayer();
  const { isVerifiedAdmin, isVerifyingAdmin } = useVerifiedAdmin();

  const authRequired =
    query.isError && query.error instanceof ApiError && query.error.status === 401;

  const onSubmitCreate = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    createPlayer.mutate({
      name: newName,
      lastname: newLastname,
      nickname: newNickname.trim().length > 0 ? newNickname : null,
      email: newEmail,
      phoneNumber: newPhoneNumber,
      birthdate: newBirthdate,
      category: newCategory,
      password: newPassword,
    });
  };

  const onSubmitUpdate = (event: FormEvent<HTMLFormElement>, playerId: string) => {
    event.preventDefault();
    updatePlayer.mutate({
      playerId,
      name: editingName,
      lastname: editingLastname,
      nickname: editingNickname.trim().length > 0 ? editingNickname : null,
      category: editingCategory,
      role: editingRole,
    });
  };

  return (
    <section className="flex flex-col gap-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-100">Players</h1>
        <p className="mt-1 text-sm text-zinc-400">
          Listado paginado (requiere iniciar sesión). Pulsa un jugador para ver su perfil.
        </p>
      </header>

      {isVerifyingAdmin && (
        <p className="text-xs text-zinc-500">Verificando permisos de administrador...</p>
      )}

      {isVerifiedAdmin && (
        <form
          onSubmit={onSubmitCreate}
          className="grid grid-cols-1 gap-2 rounded-xl border border-zinc-800 bg-zinc-900/60 p-4 md:grid-cols-2"
        >
          <h2 className="md:col-span-2 text-lg font-medium text-zinc-100">Crear Player</h2>
          <input value={newName} onChange={(e) => setNewName(e.target.value)} required placeholder="Nombre" className="rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100" />
          <input value={newLastname} onChange={(e) => setNewLastname(e.target.value)} required placeholder="Apellidos" className="rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100" />
          <input value={newNickname} onChange={(e) => setNewNickname(e.target.value)} placeholder="Alias (opcional)" className="rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100" />
          <input type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} required placeholder="Email" className="rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100" />
          <input value={newPhoneNumber} onChange={(e) => setNewPhoneNumber(e.target.value)} required placeholder="Teléfono" className="rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100" />
          <input type="date" value={newBirthdate} onChange={(e) => setNewBirthdate(e.target.value)} required className="rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100" />
          <select value={newCategory} onChange={(e) => setNewCategory(e.target.value as (typeof PLAYER_CATEGORIES)[number])} className="rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100">
            {PLAYER_CATEGORIES.map((category) => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>
          <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required minLength={8} placeholder="Contraseña (mínimo 8)" className="rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100" />
          <div className="md:col-span-2 flex items-center gap-2">
            <button type="submit" disabled={createPlayer.isPending} className="rounded-md bg-sky-600 px-3 py-2 text-sm font-medium text-white disabled:opacity-50">
              {createPlayer.isPending ? 'Creando...' : 'Crear'}
            </button>
            {createPlayer.isError && (
              <p className="text-xs text-red-400">
                {createPlayer.error instanceof ApiError ? createPlayer.error.message : 'No se pudo crear el player.'}
              </p>
            )}
          </div>
        </form>
      )}

      {authRequired && (
        <p className="rounded-xl border border-amber-900/60 bg-amber-950/40 px-4 py-3 text-sm text-amber-200">
          Necesitas{' '}
          <Link to="/login" className="font-medium text-sky-400 underline-offset-2 hover:underline">
            iniciar sesión
          </Link>{' '}
          para ver el listado de jugadores.
        </p>
      )}

      {query.isPending && !authRequired && (
        <p className="text-sm text-zinc-400">Cargando jugadores…</p>
      )}

      {query.isError && !authRequired && (
        <p className="text-sm text-red-400" role="alert">
          {query.error instanceof ApiError ? query.error.message : 'No se pudo cargar el listado.'}
        </p>
      )}

      {query.data && (
        <>
          <p className="text-xs text-zinc-500">
            Total: {query.data.meta.total} · Mostrando {query.data.data.length} en esta página
          </p>

          {query.data.data.length === 0 ? (
            <p className="text-sm text-zinc-400">No hay jugadores registrados.</p>
          ) : (
            <ul className="divide-y divide-zinc-800 rounded-xl border border-zinc-800 bg-zinc-900/60">
              {query.data.data.map((player) => {
                const label = [player.name, player.lastname].filter(Boolean).join(' ');
                return (
                  <li key={player.id ?? player.email} className="px-4 py-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        {player.id ? (
                          <Link
                            to={`/players/${player.id}`}
                            className="font-medium text-sky-400 hover:underline"
                          >
                            {label}
                          </Link>
                        ) : (
                          <span className="font-medium text-zinc-200">{label}</span>
                        )}
                        <p className="mt-0.5 text-xs text-zinc-500">
                          {player.category} · {player.role} · {player.email}
                        </p>
                      </div>
                      {isVerifiedAdmin && player.id && (
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingPlayerId(player.id);
                              setEditingName(player.name);
                              setEditingLastname(player.lastname);
                              setEditingNickname(player.nickname ?? '');
                              setEditingCategory(player.category);
                              setEditingRole(player.role);
                            }}
                            className="rounded-md border border-zinc-700 px-2 py-1 text-xs text-zinc-200"
                          >
                            Editar
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              const confirmed = window.confirm(
                                'Se va a eliminar el player. Esta acción no se puede deshacer. ¿Continuar?',
                              );
                              if (!confirmed) return;
                              deletePlayer.mutate(player.id!);
                            }}
                            disabled={deletePlayer.isPending}
                            className="rounded-md border border-red-800 px-2 py-1 text-xs text-red-300 disabled:opacity-50"
                          >
                            Borrar
                          </button>
                        </div>
                      )}
                    </div>
                    {isVerifiedAdmin && editingPlayerId === player.id && (
                      <form onSubmit={(event) => onSubmitUpdate(event, player.id!)} className="mt-3 grid grid-cols-1 gap-2 md:grid-cols-2">
                        <input value={editingName} onChange={(e) => setEditingName(e.target.value)} required className="rounded-md border border-zinc-700 bg-zinc-950 px-2 py-1.5 text-xs text-zinc-100" />
                        <input value={editingLastname} onChange={(e) => setEditingLastname(e.target.value)} required className="rounded-md border border-zinc-700 bg-zinc-950 px-2 py-1.5 text-xs text-zinc-100" />
                        <input value={editingNickname} onChange={(e) => setEditingNickname(e.target.value)} placeholder="Alias (opcional)" className="rounded-md border border-zinc-700 bg-zinc-950 px-2 py-1.5 text-xs text-zinc-100" />
                        <select value={editingCategory} onChange={(e) => setEditingCategory(e.target.value as (typeof PLAYER_CATEGORIES)[number])} className="rounded-md border border-zinc-700 bg-zinc-950 px-2 py-1.5 text-xs text-zinc-100">
                          {PLAYER_CATEGORIES.map((category) => (
                            <option key={category} value={category}>{category}</option>
                          ))}
                        </select>
                        <select value={editingRole} onChange={(e) => setEditingRole(e.target.value as (typeof PLAYER_ROLES)[number])} className="rounded-md border border-zinc-700 bg-zinc-950 px-2 py-1.5 text-xs text-zinc-100">
                          {PLAYER_ROLES.map((role) => (
                            <option key={role} value={role}>{role}</option>
                          ))}
                        </select>
                        <div className="flex items-center gap-2">
                          <button type="submit" disabled={updatePlayer.isPending} className="rounded-md bg-sky-600 px-2 py-1 text-xs font-medium text-white disabled:opacity-50">
                            Guardar
                          </button>
                          <button type="button" onClick={() => setEditingPlayerId(null)} className="rounded-md border border-zinc-700 px-2 py-1 text-xs text-zinc-200">
                            Cancelar
                          </button>
                        </div>
                        {updatePlayer.isError && (
                          <p className="md:col-span-2 text-xs text-red-400">
                            {updatePlayer.error instanceof ApiError ? updatePlayer.error.message : 'No se pudo actualizar el player.'}
                          </p>
                        )}
                      </form>
                    )}
                  </li>
                );
              })}
            </ul>
          )}

          <PaginationBar
            page={page}
            lastPage={query.data.meta.lastPage}
            disabled={query.isFetching}
            onPrev={() => setPage((p) => Math.max(1, p - 1))}
            onNext={() => setPage((p) => p + 1)}
          />
        </>
      )}
    </section>
  );
};
