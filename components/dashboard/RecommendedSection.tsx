"use client";

import { useEffect, useState } from "react";

import CourseCard from "@/components/course/CourseCard";
import { useDashboardData } from "@/components/dashboard/DashboardDataProvider";
import { getCourses } from "@/services/courses/courses.service";
import type { Course } from "@/types/course.types";

/* Reusa la CourseCard del catálogo para que las recomendaciones se vean y
   linkeen igual que en /courses.

   REAL: cursos del catálogo en los que el usuario todavía no está inscripto.
   TODO(back): no hay motor de recomendación (intereses, historial); se
   muestran los más nuevos que no cursa. */
export default function RecommendedSection() {
  const { data } = useDashboardData();
  const [courses, setCourses] = useState<Course[] | null>(null);

  const enrolledKey = (data?.activeCourses ?? []).map((c) => c.courseId).join(",");

  useEffect(() => {
    let cancelled = false;
    const enrolled = new Set(enrolledKey.split(",").filter(Boolean));

    getCourses({ limit: 50 })
      .then((result) => {
        if (cancelled) return;
        setCourses(result.data.filter((c) => !enrolled.has(c.id)).slice(0, 3));
      })
      .catch(() => {
        if (!cancelled) setCourses([]);
      });

    return () => {
      cancelled = true;
    };
  }, [enrolledKey]);

  if (courses !== null && courses.length === 0) return null;

  return (
    <section aria-labelledby="recommended-title">
      <div className="mb-4">
        <h2 id="recommended-title" className="text-text text-lg font-semibold">
          Recomendado para vos
        </h2>
        <p className="text-text-muted mt-0.5 text-sm">Cursos que todavía no empezaste</p>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {courses === null
          ? Array.from({ length: 3 }, (_, i) => (
              <div key={i} className="bg-surface-elevated h-72 animate-pulse rounded-xl" aria-hidden />
            ))
          : courses.map((course) => <CourseCard key={course.id} course={course} />)}
      </div>
    </section>
  );
}
