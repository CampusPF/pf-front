import { Bookmark, Star } from "lucide-react";

type Course = {
  category: string;
  gradient: string;
  tags: string[];
  rating: string;
  students: string;
  title: string;
  instructor: string;
  duration: string;
  projects: string;
};

const COURSES: Course[] = [
  {
    category: "Desarrollo Web",
    gradient: "from-blue-600 to-indigo-800",
    tags: ["next/server", "App Router", "TS"],
    rating: "4.9",
    students: "1.2k alumnos",
    title: "Fullstack con Next.js y TypeScript",
    instructor: "Fernando García · Tech Lead en MercadoLibre",
    duration: "36 horas",
    projects: "4 proyectos",
  },
  {
    category: "Inteligencia Artificial",
    gradient: "from-green-600 to-emerald-800",
    tags: ["LangChain", "RAG", "Vector DBs"],
    rating: "4.95",
    students: "74k alumnos",
    title: "Fundamentos de IA y Prompt Engineering",
    instructor: "Sofía Albornoz · AI Researcher & Ex-Cohere",
    duration: "28 horas",
    projects: "6 prácticas",
  },
  {
    category: "Bases de Datos & Backend",
    gradient: "from-orange-500 to-red-700",
    tags: ["PostgreSQL", "Redis", "Docker"],
    rating: "4.88",
    students: "1.2k alumnos",
    title: "Arquitectura Cloud y Node.js Avanzado",
    instructor: "Mateo Vega · Solutions Architect en AWS",
    duration: "42 horas",
    projects: "5 proyectos",
  },
];

function CourseCard({ course }: { course: Course }) {
  return (
    <article className="bg-surface border-border overflow-hidden rounded-xl border shadow-sm">
      <div
        className={`bg-gradient-to-br ${course.gradient} flex h-32 flex-col justify-between p-4`}
      >
        <div className="flex items-start justify-between gap-2">
          <span className="rounded-full bg-white/20 px-2 py-0.5 text-xs text-white">
            {course.category}
          </span>
          <button
            type="button"
            aria-label={`Guardar ${course.title}`}
            className="cursor-pointer text-white/70 transition-colors duration-150 hover:text-white"
          >
            <Bookmark className="size-4" aria-hidden />
          </button>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {course.tags.map((tag) => (
            <span
              key={tag}
              className="rounded bg-black/30 px-2 py-0.5 font-mono text-xs text-white/90"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>

      <div className="bg-surface p-4">
        <div className="text-text-muted flex items-center gap-1.5 text-sm">
          <Star className="size-4 fill-warning text-warning" aria-hidden />
          <span className="text-text font-medium">{course.rating}</span>
          <span>({course.students})</span>
        </div>

        <h3 className="text-text mt-2 font-semibold">{course.title}</h3>
        <p className="text-text-muted mt-1 text-sm">{course.instructor}</p>

        <div className="border-border mt-4 flex items-center justify-between border-t pt-3">
          <p className="text-text-muted text-sm">
            {course.duration} · {course.projects}
          </p>
          <a
            href="#cursos"
            className="text-primary hover:text-primary-hover cursor-pointer text-sm font-medium transition-colors duration-150"
          >
            Ver curso →
          </a>
        </div>
      </div>
    </article>
  );
}

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
        <a
          href="#cursos"
          className="text-primary hover:text-primary-hover cursor-pointer text-sm font-medium transition-colors duration-150"
        >
          Explorar todo el catálogo →
        </a>
      </div>

      <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-3">
        {COURSES.map((course) => (
          <CourseCard key={course.title} course={course} />
        ))}
      </div>
    </section>
  );
}
