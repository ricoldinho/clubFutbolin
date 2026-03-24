import { StrictMode, Suspense } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import { AppProviders } from '@/app/providers';
import { router } from '@/app/router';
import '@/index.css';

const rootEl = document.getElementById('root');
if (!rootEl) {
  throw new Error('No se encontró #root');
}

const routerFallback = (
  <div className="flex min-h-dvh items-center justify-center bg-zinc-950 font-sans text-sm text-zinc-400">
    Cargando…
  </div>
);

createRoot(rootEl).render(
  <StrictMode>
    <AppProviders>
      <Suspense fallback={routerFallback}>
        <RouterProvider router={router} />
      </Suspense>
    </AppProviders>
  </StrictMode>,
);
