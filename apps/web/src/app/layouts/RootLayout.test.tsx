import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { AUTH_TOKEN_STORAGE_KEY } from '@/api/client';
import { RootLayout } from './RootLayout';

const renderLayout = () =>
  render(
    <MemoryRouter initialEntries={['/']}>
      <Routes>
        <Route path="/" element={<RootLayout />}>
          <Route index element={<div>Home content</div>} />
        </Route>
      </Routes>
    </MemoryRouter>,
  );

describe('RootLayout', () => {
  it('muestra botón Registro cuando no hay autenticación', () => {
    // Arrange
    localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);

    // Act
    renderLayout();

    // Assert
    expect(screen.getByRole('link', { name: 'Registro' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Login' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Logout' })).not.toBeInTheDocument();
  });

  it('oculta botón Registro cuando hay sesión iniciada', () => {
    // Arrange
    localStorage.setItem(AUTH_TOKEN_STORAGE_KEY, 'token');

    // Act
    renderLayout();

    // Assert
    expect(screen.queryByRole('link', { name: 'Registro' })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Login' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Logout' })).toBeInTheDocument();
  });
});
