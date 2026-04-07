export const HomePage = () => {
  return (
    <article className="flex flex-col gap-6">
      <header className="flex flex-col gap-3">
        <h1 className="text-3xl font-semibold tracking-tight text-zinc-100">Sobre Nosotros</h1>
        <p className="text-sm text-zinc-300">
          Club Futbolin 981 es un espacio para disfrutar del futbolin en A Coruna, compartir
          torneos y construir comunidad entre jugadores de todos los niveles.
        </p>
      </header>

      <section className="overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900">
        <img
          src="/about-club-placeholder.svg"
          alt="Imagen ilustrativa del club de futbolin con mesas y ambiente de torneo"
          className="h-64 w-full object-cover"
        />
      </section>

      <section className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
        <h2 className="text-lg font-semibold text-zinc-100">Nuestra historia</h2>
        <p className="mt-2 text-sm leading-6 text-zinc-300">
          Nacimos como un pequeno grupo de amigos que se reunia cada viernes para jugar unas
          partidas despues del trabajo. Con el tiempo, el boca a boca hizo que cada semana se
          sumaran mas personas y lo que empezo como una quedada informal se convirtio en un club
          local con ligas, eventos sociales y formaciones para jugadores nuevos. Hoy seguimos con
          la misma idea del primer dia: competir con respeto, aprender en equipo y pasarlo bien.
        </p>
      </section>

      <section className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
        <h2 className="text-lg font-semibold text-zinc-100">Donde estamos</h2>
        <address className="mt-2 not-italic text-sm leading-6 text-zinc-300">
          Calle: JUAN GONZALEZ RODRIGUEZ 6, BJ
          <br />
          15011 A Coruna - A Coruna
        </address>
        <a
          href="https://www.google.com/maps/search/?api=1&query=JUAN+GONZALEZ+RODRIGUEZ+6+BJ+15011+A+Coruna"
          target="_blank"
          rel="noreferrer"
          className="mt-3 inline-flex rounded-lg border border-sky-400 px-3 py-1.5 text-sm font-medium text-sky-300 transition hover:bg-sky-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-900"
        >
          Ver en Google Maps
        </a>
      </section>

      <section className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
        <h2 className="text-lg font-semibold text-zinc-100">Redes sociales</h2>
        <div className="mt-3 flex flex-wrap gap-3">
          <a
            href="https://www.instagram.com/futbolin981/"
            target="_blank"
            rel="noreferrer"
            className="inline-flex rounded-lg bg-zinc-800 px-3 py-1.5 text-sm text-zinc-100 transition hover:bg-zinc-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-900"
          >
            Instagram
          </a>
          <a
            href="https://www.facebook.com/Liga981Futbolin/"
            target="_blank"
            rel="noreferrer"
            className="inline-flex rounded-lg bg-zinc-800 px-3 py-1.5 text-sm text-zinc-100 transition hover:bg-zinc-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-900"
          >
            Facebook
          </a>
        </div>
      </section>
    </article>
  );
};
