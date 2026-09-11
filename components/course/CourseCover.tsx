import type { Course } from "@/types/course.types";

/* Portada del curso: la imagen de Cloudinary si tiene, el gradiente si no.
   Los hijos (badges, tags) se dibujan encima en los dos casos. */
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
      {course.imageUrl && (
        <>
          {/* <img> y no next/image: URLs de Cloudinary/externas dinámicas. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={course.imageUrl}
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
          />
          {/* Oscurece un poco para que el texto blanco de encima se lea. */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-black/10" aria-hidden />
        </>
      )}
      <div className="relative h-full">{children}</div>
    </div>
  );
}
