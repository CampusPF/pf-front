import { Loader2 } from "lucide-react";

/* Pantalla de carga de las rutas que se renderizan en el server contra el
   back (catálogo, detalle de curso). Next la muestra al instante vía
   loading.tsx mientras el server espera la respuesta: con el back dormido
   (Render free) eso son hasta ~1 minuto, y sin esto el navegador quedaba en
   la página anterior sin ninguna señal de que algo pasaba. */
export default function PageLoading({ label }: { label: string }) {
  return (
    <main
      className="bg-bg flex flex-1 flex-col items-center justify-center gap-3 px-6 pt-32 pb-24 text-center"
      aria-busy="true"
    >
      <Loader2 className="text-primary size-8 animate-spin" aria-hidden />
      <p className="text-text font-medium" role="status">
        {label}
      </p>
      <p className="text-text-muted max-w-sm text-sm">
        Si el servidor estaba inactivo puede tardar hasta un minuto en responder.
      </p>
    </main>
  );
}
