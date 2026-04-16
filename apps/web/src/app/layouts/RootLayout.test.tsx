import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it, beforeEach, vi } from 'vitest';
import { AppProviders } from '@/app/providers';
import { RootLayout } from './RootLayout';

const renderLayout = (initialEntries: string[] = ['/']) =>
  render(
    <AppProviders>
      <MemoryRouter initialEntries={initialEntries}>
        <Routes>
          <Route path="/" element={<RootLayout />}>
            <Route index element={<div>Home content</div>} />
            <Route path="teams" element={<div>Teams content</div>} />
          </Route>
        </Routes>
      </MemoryRouter>
    </AppProviders>,
  );

describe('RootLayout', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('muestra botón Registro cuando no hay autenticación', async () => {
    // Arrange
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ message: 'Token de autenticación requerido' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      }),
    );

    // Act
    renderLayout();
    await waitFor(() => {
      expect(globalThis.fetch).toHaveBeenCalled();
    });

    // Assert
    expect(screen.getByRole('link', { name: 'Registro' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Login' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Logout' })).not.toBeInTheDocument();
  });

  it('oculta botón Registro cuando hay sesión iniciada', async () => {
    // Arrange
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ playerId: 'player-1', role: 'USER' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    );

    // Act
    renderLayout();
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Logout' })).toBeInTheDocument();
    });

    // Assert
    expect(screen.queryByRole('link', { name: 'Registro' })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Login' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Logout' })).toBeInTheDocument();
  });

  it('mantiene el cierre de sesión en UI aunque falle /auth/logout', async () => {
    // Arrange
    vi.spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ playerId: 'player-1', role: 'USER' }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }),
      )
      .mockRejectedValueOnce(new Error('network down'))
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ message: 'Token de autenticación requerido' }), {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        }),
      );

    // Act
    renderLayout(['/teams']);
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Logout' })).toBeInTheDocument();
    });
    fireEvent.click(screen.getByRole('button', { name: 'Logout' }));

    // Assert
    await waitFor(() => {
      expect(screen.getByText('Home content')).toBeInTheDocument();
    });
    await waitFor(() => {
      expect(screen.getByRole('link', { name: 'Login' })).toBeInTheDocument();
    });
    expect(globalThis.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/auth/logout'),
      expect.objectContaining({ method: 'POST' }),
    );
  });
});
