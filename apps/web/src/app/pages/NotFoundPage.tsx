import { Link } from 'react-router-dom';

export const NotFoundPage = () => (
  <div className="flex flex-col gap-4">
    <h1 className="text-2xl font-semibold">404</h1>
    <p className="text-sm text-zinc-400">Esta ruta no existe.</p>
    <Link to="/" className="text-sm text-sky-400 underline-offset-2 hover:underline">
      Ir al inicio
    </Link>
  </div>
);
