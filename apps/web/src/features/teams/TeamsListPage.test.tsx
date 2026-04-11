import { act, fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { TeamsListPage } from './TeamsListPage';

const mockUseVerifiedAdmin = vi.fn();
const mockUseTeams = vi.fn();
const mockUsePlayersList = vi.fn();
const mockCreateMutate = vi.fn();
const mockUpdateMutate = vi.fn();
const mockDeleteMutate = vi.fn();

vi.mock('@/features/auth/api/useVerifiedAdmin', () => ({
  useVerifiedAdmin: () => mockUseVerifiedAdmin(),
}));

vi.mock('@/features/players/api', () => ({
  usePlayersList: (...args: unknown[]) => mockUsePlayersList(...args),
}));

vi.mock('@/features/teams/api', () => ({
  useTeams: (...args: unknown[]) => mockUseTeams(...args),
  useCreateTeam: () => ({
    mutate: mockCreateMutate,
    reset: vi.fn(),
    isPending: false,
    isError: false,
    error: null,
  }),
  useUpdateTeam: () => ({
    mutate: mockUpdateMutate,
    isPending: false,
    isError: false,
    error: null,
  }),
  useDeleteTeam: () => ({
    mutate: mockDeleteMutate,
    isPending: false,
    isError: false,
    error: null,
  }),
}));

const createdAt = new Date().toISOString();

const setupListMock = (teams?: Array<{ id: string; name: string }>) => {
  const data =
    teams?.map((t) => ({ ...t, createdAt })) ?? [
      { id: 'team-1', name: 'Atléticos', createdAt },
    ];
  mockUseTeams.mockReturnValue({
    isPending: false,
    isError: false,
    error: null,
    isFetching: false,
    data: {
      data,
      meta: { total: data.length, page: 1, lastPage: 1 },
    },
  });
};

const playerA = {
  id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  name: 'Ana',
  lastname: 'García',
  nickname: 'Ag',
  email: 'a@test.com',
  phoneNumber: '600',
  birthdate: '2000-01-01',
  category: 'PRIMERA' as const,
  role: 'USER' as const,
};

const playerB = {
  id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
  name: 'Ben',
  lastname: 'López',
  nickname: null,
  email: 'b@test.com',
  phoneNumber: '601',
  birthdate: '2001-01-01',
  category: 'PRIMERA' as const,
  role: 'USER' as const,
};

describe('TeamsListPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUsePlayersList.mockReturnValue({
      isPending: false,
      isFetching: false,
      isError: false,
      error: null,
      data: { data: [], meta: { total: 0, page: 1, lastPage: 0 } },
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('aplica la búsqueda al hook tras el debounce', () => {
    vi.useFakeTimers();
    setupListMock();
    mockUseVerifiedAdmin.mockReturnValue({
      token: null,
      isAdminClaim: false,
      isVerifiedAdmin: false,
      isVerifyingAdmin: false,
    });

    render(
      <MemoryRouter>
        <TeamsListPage />
      </MemoryRouter>,
    );

    fireEvent.change(screen.getByLabelText('Buscar equipos por nombre'), {
      target: { value: 'fc' },
    });
    expect(mockUseTeams.mock.calls.at(-1)).toEqual([1, 20, '']);

    act(() => {
      vi.advanceTimersByTime(350);
    });
    expect(mockUseTeams.mock.calls.at(-1)).toEqual([1, 20, 'fc']);
  });

  it('ordena alfabéticamente la página al pulsar Ordenar A-Z', async () => {
    const user = userEvent.setup();
    setupListMock([
      { id: 'a', name: 'Zamora FC' },
      { id: 'b', name: 'Albacete' },
    ]);
    mockUseVerifiedAdmin.mockReturnValue({
      token: null,
      isAdminClaim: false,
      isVerifiedAdmin: false,
      isVerifyingAdmin: false,
    });

    render(
      <MemoryRouter>
        <TeamsListPage />
      </MemoryRouter>,
    );

    const links = () => screen.getAllByRole('link', { name: /FC|Albacete/ });
    expect(links()[0]).toHaveTextContent('Zamora FC');

    await user.click(screen.getByRole('button', { name: 'Ordenar A-Z' }));
    expect(links()[0]).toHaveTextContent('Albacete');
    expect(links()[1]).toHaveTextContent('Zamora FC');
  });

  it('abre el modal y crea equipo con al menos 2 jugadores', async () => {
    const user = userEvent.setup();
    setupListMock();
    mockUseVerifiedAdmin.mockReturnValue({
      token: 'token-admin',
      isAdminClaim: true,
      isVerifiedAdmin: true,
      isVerifyingAdmin: false,
    });

    mockUsePlayersList.mockImplementation((_page, _limit, q?: string) => {
      const trimmed = q?.trim() ?? '';
      if (trimmed === 'ana') {
        return {
          isPending: false,
          isFetching: false,
          isError: false,
          error: null,
          data: { data: [playerA], meta: { total: 1, page: 1, lastPage: 1 } },
        };
      }
      if (trimmed === 'ben') {
        return {
          isPending: false,
          isFetching: false,
          isError: false,
          error: null,
          data: { data: [playerB], meta: { total: 1, page: 1, lastPage: 1 } },
        };
      }
      return {
        isPending: false,
        isFetching: false,
        isError: false,
        error: null,
        data: { data: [], meta: { total: 0, page: 1, lastPage: 0 } },
      };
    });

    render(
      <MemoryRouter>
        <TeamsListPage />
      </MemoryRouter>,
    );

    await user.click(screen.getByRole('button', { name: 'Crear equipo' }));
    const modal = screen.getByRole('dialog');
    await user.type(screen.getByLabelText('Nombre del equipo'), 'Nuevos');

    const playerSearch = screen.getByLabelText('Buscar jugador por nombre o alias');
    await user.type(playerSearch, 'ana');
    await act(async () => {
      await new Promise((r) => setTimeout(r, 400));
    });
    await user.click(within(modal).getByRole('button', { name: /Asociar a Ana García/ }));

    await user.clear(playerSearch);
    await user.type(playerSearch, 'ben');
    await act(async () => {
      await new Promise((r) => setTimeout(r, 400));
    });
    await user.click(within(modal).getByRole('button', { name: /Asociar a Ben López/ }));

    const submitCreate = screen.getByRole('button', { name: 'Finalizar creación' });
    expect(submitCreate).not.toBeDisabled();
    await user.click(submitCreate);

    expect(mockCreateMutate).toHaveBeenCalledWith(
      { name: 'Nuevos', playerIds: [playerA.id, playerB.id] },
      expect.any(Object),
    );
    expect(screen.getByRole('button', { name: 'Editar' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Borrar' })).toBeInTheDocument();
  });

  it('oculta controles de escritura cuando no es admin', () => {
    setupListMock();
    mockUseVerifiedAdmin.mockReturnValue({
      token: null,
      isAdminClaim: false,
      isVerifiedAdmin: false,
      isVerifyingAdmin: false,
    });

    render(
      <MemoryRouter>
        <TeamsListPage />
      </MemoryRouter>,
    );

    expect(screen.queryByRole('button', { name: 'Crear equipo' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Editar' })).not.toBeInTheDocument();
  });

  it('permite editar un equipo desde el listado', async () => {
    const user = userEvent.setup();
    setupListMock();
    mockUseVerifiedAdmin.mockReturnValue({
      token: 'token-admin',
      isAdminClaim: true,
      isVerifiedAdmin: true,
      isVerifyingAdmin: false,
    });

    render(
      <MemoryRouter>
        <TeamsListPage />
      </MemoryRouter>,
    );
    await user.click(screen.getByRole('button', { name: 'Editar' }));
    const nameInput = screen.getByDisplayValue('Atléticos');
    await user.clear(nameInput);
    await user.type(nameInput, 'Atléticos B');
    await user.click(screen.getByRole('button', { name: 'Guardar' }));

    expect(mockUpdateMutate).toHaveBeenCalledWith({ teamId: 'team-1', name: 'Atléticos B' });
  });

  it('permite borrar un equipo desde el listado', async () => {
    const user = userEvent.setup();
    setupListMock();
    mockUseVerifiedAdmin.mockReturnValue({
      token: 'token-admin',
      isAdminClaim: true,
      isVerifiedAdmin: true,
      isVerifyingAdmin: false,
    });

    render(
      <MemoryRouter>
        <TeamsListPage />
      </MemoryRouter>,
    );
    await user.click(screen.getByRole('button', { name: 'Borrar' }));

    expect(mockDeleteMutate).toHaveBeenCalledWith('team-1');
  });
});
