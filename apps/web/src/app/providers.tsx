import { QueryClientProvider } from '@tanstack/react-query';
import { type ReactNode, useState } from 'react';
import { createAppQueryClient } from '@/app/query-client';

interface AppProvidersProps {
  children: ReactNode;
}

/**
 * Providers globales (TanStack Query). El `QueryClient` se crea una vez por montaje
 * para no compartir estado entre tests / evitar sorpresas con HMR.
 */
export const AppProviders = ({ children }: AppProvidersProps) => {
  const [queryClient] = useState(() => createAppQueryClient());
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
};
