import type { Course } from "@/types/course.types";
import CourseCard from "@/components/course/CourseCard";

export default function CourseGrid({ courses }: { courses: Course[] }) {
  if (courses.length === 0) {
    return (
      <p className="text-text-muted border-border rounded-xl border border-dashed p-10 text-center text-sm">
        No hay cursos que coincidan con esos filtros.
      </p>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
      {courses.map((course) => (
        <CourseCard key={course.id} course={course} />
      ))}
    </div>
  );
}
