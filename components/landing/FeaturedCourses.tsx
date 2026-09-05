import Link from "next/link";

import { MOCK_COURSES } from "@/data/courses.mock";
import CourseCard from "@/components/course/CourseCard";

/* Los cursos destacados salen del mismo mock que el catálogo, así la landing no
   miente: cada card linkea a un curso que existe en /courses/[slug]. */
const FEATURED = MOCK_COURSES.slice(0, 3);

export default function FeaturedCourses() {
  return (
    <section id="cursos" className="mx-auto max-w-6xl px-6 py-20">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-primary text-xs font-semibold tracking-wider uppercase">
            Catálogo oficial
          </p>
          <h2 className="text-text mt-2 text-2xl font-bold md:text-3xl">
            Cursos destacados por la comunidad
          </h2>
          <p className="text-text-secondary mt-2">
            Aprendé habilidades demandadas en tecnología con proyectos reales y
            feedback de IA.
          </p>
        </div>
        <Link
          href="/courses"
          className="text-primary hover:text-primary-hover cursor-pointer text-sm font-medium transition-colors duration-150"
        >
          Explorar todo el catálogo →
        </Link>
      </div>

      <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {FEATURED.map((course) => (
          <CourseCard key={course.id} course={course} />
        ))}
      </div>
    </section>
  );
}
