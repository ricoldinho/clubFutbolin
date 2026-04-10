import { act, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { TeamsListPage } from './TeamsListPage';

const mockUseVerifiedAdmin = vi.fn();
const mockUseTeams = vi.fn();
const mockCreateMutate = vi.fn();
const mockUpdateMutate = vi.fn();
const mockDeleteMutate = vi.fn();

vi.mock('@/features/auth/api/useVerifiedAdmin', () => ({
  useVerifiedAdmin: () => mockUseVerifiedAdmin(),
}));

vi.mock('@/features/teams/api', () => ({
  useTeams: (...args: unknown[]) => mockUseTeams(...args),
  useCreateTeam: () => ({
    mutate: mockCreateMutate,
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

describe('TeamsListPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
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

  it('muestra controles de escritura para admin verificado', async () => {
    // Arrange
    const user = userEvent.setup();
    setupListMock();
    mockUseVerifiedAdmin.mockReturnValue({
      token: 'token-admin',
      isAdminClaim: true,
      isVerifiedAdmin: true,
      isVerifyingAdmin: false,
    });

    // Act
    render(
      <MemoryRouter>
        <TeamsListPage />
      </MemoryRouter>,
    );
    await user.type(screen.getByPlaceholderText('Nombre del equipo'), 'Nuevos');
    await user.click(screen.getByRole('button', { name: 'Crear equipo' }));

    // Assert
    expect(screen.getByRole('button', { name: 'Editar' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Borrar' })).toBeInTheDocument();
    expect(mockCreateMutate).toHaveBeenCalledWith({ name: 'Nuevos' });
  });

  it('oculta controles de escritura cuando no es admin', () => {
    // Arrange
    setupListMock();
    mockUseVerifiedAdmin.mockReturnValue({
      token: null,
      isAdminClaim: false,
      isVerifiedAdmin: false,
      isVerifyingAdmin: false,
    });

    // Act
    render(
      <MemoryRouter>
        <TeamsListPage />
      </MemoryRouter>,
    );

    // Assert
    expect(screen.queryByPlaceholderText('Nombre del equipo')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Editar' })).not.toBeInTheDocument();
  });

  it('permite editar un equipo desde el listado', async () => {
    // Arrange
    const user = userEvent.setup();
    setupListMock();
    mockUseVerifiedAdmin.mockReturnValue({
      token: 'token-admin',
      isAdminClaim: true,
      isVerifiedAdmin: true,
      isVerifyingAdmin: false,
    });

    // Act
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

    // Assert
    expect(mockUpdateMutate).toHaveBeenCalledWith({ teamId: 'team-1', name: 'Atléticos B' });
  });

  it('permite borrar un equipo desde el listado', async () => {
    // Arrange
    const user = userEvent.setup();
    setupListMock();
    mockUseVerifiedAdmin.mockReturnValue({
      token: 'token-admin',
      isAdminClaim: true,
      isVerifiedAdmin: true,
      isVerifyingAdmin: false,
    });

    // Act
    render(
      <MemoryRouter>
        <TeamsListPage />
      </MemoryRouter>,
    );
    await user.click(screen.getByRole('button', { name: 'Borrar' }));

    // Assert
    expect(mockDeleteMutate).toHaveBeenCalledWith('team-1');
  });
});
