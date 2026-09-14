import Link from "next/link";
import { Compass } from "lucide-react";

/* Cuerpo del 404. Lo usan app/not-found.tsx (rutas inexistentes: trae su
   propio Navbar/Footer) y app/(marketing)/not-found.tsx (notFound() dentro de
   un curso o una página pública, que ya tiene el chrome del layout). */
export default function NotFoundContent() {
  return (
    <main className="bg-bg flex flex-1 flex-col items-center justify-center px-6 pt-32 pb-24 text-center">
      <span className="bg-primary/10 text-primary flex size-14 items-center justify-center rounded-2xl">
        <Compass className="size-7" aria-hidden />
      </span>
      <p className="text-primary mt-6 text-sm font-semibold tracking-wider uppercase">Error 404</p>
      <h1 className="text-text mt-2 text-3xl font-bold md:text-4xl">No encontramos esta página</h1>
      <p className="text-text-secondary mt-3 max-w-md">
        Puede que el link esté mal escrito o que la página ya no exista.
      </p>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Link
          href="/"
          className="bg-primary-solid hover:bg-primary-solid-hover rounded-lg px-5 py-2.5 text-sm font-medium text-white transition-colors duration-150"
        >
          Volver al inicio
        </Link>
        <Link
          href="/courses"
          className="border-border text-text-secondary hover:bg-surface-elevated hover:text-text rounded-lg border px-5 py-2.5 text-sm font-medium transition-colors duration-150"
        >
          Ver cursos
        </Link>
      </div>
    </main>
  );
}
