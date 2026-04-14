import { Link } from 'react-router-dom';

type SectionLandingPageProps = {
  title: string;
};

export const SectionLandingPage = ({ title }: SectionLandingPageProps) => {
  return (
    <section className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
      <h1 className="text-2xl font-semibold tracking-tight text-zinc-100">{title}</h1>
      <p className="mt-2 text-sm text-zinc-300">
        Esta seccion estara conectada con el listado completo en los siguientes pasos.
      </p>
      <Link to="/matches" className="mt-4 inline-block text-sm text-sky-400 hover:underline">
        Ir a Matches
      </Link>
    </section>
  );
};
