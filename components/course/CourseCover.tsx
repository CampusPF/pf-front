"use client";

import ImageWithFallback from "@/components/ui/ImageWithFallback";
import type { Course } from "@/types/course.types";

/* Portada del curso: la imagen de Cloudinary si tiene, el gradiente si no.
   Los hijos (badges, tags) se dibujan encima en los dos casos.

   Es client sólo por el fallback: si la URL no carga (el seed apunta a un CDN
   de ejemplo que no existe), queda el gradiente en vez de una imagen rota. */
export default function CourseCover({
  course,
  className = "",
  children,
}: {
  course: Pick<Course, "imageUrl" | "coverGradient">;
  className?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className={`relative overflow-hidden bg-gradient-to-br ${course.coverGradient} ${className}`}>
      <ImageWithFallback
        src={course.imageUrl}
        className="absolute inset-0 h-full w-full object-cover"
      >
        {/* Oscurece un poco para que el texto blanco de encima se lea. */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-black/10" aria-hidden />
      </ImageWithFallback>

      <div className="relative h-full">{children}</div>
    </div>
  );
}
