import CourseCard from "@/components/course/CourseCard";
import { RECOMMENDED_COURSES } from "@/data/dashboard.mock";

/* Reusa la CourseCard del catálogo para que las recomendaciones se vean y
   linkeen igual que en /courses. */
export default function RecommendedSection() {
  return (
    <section aria-labelledby="recommended-title">
      <div className="mb-4">
        <h2
          id="recommended-title"
          className="text-text text-lg font-semibold"
        >
          Recomendado para vos
        </h2>
        <p className="text-text-muted mt-0.5 text-sm">
          Basado en tus intereses de desarrollo fullstack
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {RECOMMENDED_COURSES.map((course) => (
          <CourseCard key={course.id} course={course} />
        ))}
      </div>
    </section>
  );
}
