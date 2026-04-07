import { createBrowserRouter } from 'react-router-dom';
import { RootLayout } from '@/app/layouts/RootLayout';
import { NotFoundPage } from '@/app/pages/NotFoundPage';
import { HomePage } from '@/features/home/HomePage';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <RootLayout />,
    children: [
      { index: true, element: <HomePage /> },
      {
        path: 'login',
        lazy: async () => {
          const { LoginPage } = await import('@/features/auth/LoginPage');
          return { Component: LoginPage };
        },
      },
      {
        path: 'matches',
        lazy: async () => {
          const { MatchesPage } = await import('@/features/matches/MatchesPage');
          return { Component: MatchesPage };
        },
      },
      {
        path: 'players/:playerId',
        lazy: async () => {
          const { PlayerProfilePage } = await import('@/features/players/PlayerProfilePage');
          return { Component: PlayerProfilePage };
        },
      },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
]);
