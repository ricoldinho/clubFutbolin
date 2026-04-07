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
        path: 'players',
        lazy: async () => {
          const { PlayersListPage } = await import('@/features/players/PlayersListPage');
          return { Component: PlayersListPage };
        },
      },
      {
        path: 'teams',
        lazy: async () => {
          const { TeamsListPage } = await import('@/features/teams/TeamsListPage');
          return { Component: TeamsListPage };
        },
      },
      {
        path: 'leagues',
        lazy: async () => {
          const { LeaguesListPage } = await import('@/features/leagues/LeaguesListPage');
          return { Component: LeaguesListPage };
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
      {
        path: 'teams/:teamId',
        lazy: async () => {
          const { TeamProfilePage } = await import('@/features/teams/TeamProfilePage');
          return { Component: TeamProfilePage };
        },
      },
      {
        path: 'leagues/:leagueId',
        lazy: async () => {
          const { LeagueDetailPage } = await import('@/features/leagues/LeagueDetailPage');
          return { Component: LeagueDetailPage };
        },
      },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
]);
