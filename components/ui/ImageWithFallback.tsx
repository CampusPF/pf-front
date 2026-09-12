"use client";

import { useState } from "react";

/* <img> que se rinde con elegancia: si la URL no carga (dominio que no
   existe, archivo borrado en Cloudinary, sin internet), muestra el
   `fallback` en vez de dejar el ícono de imagen rota del navegador.

   Hace falta porque las portadas son URLs externas que no controlamos: los
   cursos del seed apuntan a un CDN de ejemplo que no existe
   (cdn.campuslite.com), y cualquier imagen vieja puede caerse con el tiempo.

   Se usa <img> y no next/image a propósito: las URLs son dinámicas y no
   queremos atar `remotePatterns` a cada dominio que aparezca. */

export default function ImageWithFallback({
  src,
  alt = "",
  className = "",
  fallback = null,
  children,
}: {
  src?: string | null;
  alt?: string;
  className?: string;
  /** Qué mostrar si no hay imagen o si falló la carga. */
  fallback?: React.ReactNode;
  /** Se dibuja encima de la imagen (overlay) — sólo si la imagen se ve. */
  children?: React.ReactNode;
}) {
  // Guardamos QUÉ url falló, no un booleano: así, si cambia el `src`, el
  // componente vuelve a intentar solo, sin necesidad de resetear nada.
  const [failedSrc, setFailedSrc] = useState<string | null>(null);

  if (!src || failedSrc === src) return <>{fallback}</>;

  return (
    <>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt}
        className={className}
        onError={() => setFailedSrc(src)}
      />
      {children}
    </>
  );
}
