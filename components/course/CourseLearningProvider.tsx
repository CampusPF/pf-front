"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";

import { useAuth } from "@/components/auth/AuthProvider";
import { loadSyllabus } from "@/services/courses/courses.service";
import {
  getCourseProgress,
  type CourseProgress,
} from "@/services/progress/course-progress.service";
import type { Course } from "@/types/course.types";

/* Lo que el detalle del curso sólo puede saber del lado del cliente, porque
   depende de la sesión (el token vive en localStorage):
   - el temario completo, si el back mandó sólo los módulos;
   - el progreso del usuario (inscripción + lecciones completadas).

   La página (server) pasa el curso público y este provider lo completa. El
   hero (EnrollCTA) y las tabs (CourseTabs) leen de acá. */

interface CourseLearningValue {
  course: Course;
  progress: CourseProgress | null;
  /** true mientras se resuelve la sesión / el progreso. */
  isLoading: boolean;
  isAuthenticated: boolean;
  refreshProgress: () => Promise<void>;
}

const CourseLearningContext = createContext<CourseLearningValue | null>(null);

export function useCourseLearning(): CourseLearningValue {
  const value = useContext(CourseLearningContext);
  if (!value) throw new Error("useCourseLearning tiene que usarse adentro de <CourseLearningProvider>");
  return value;
}

export default function CourseLearningProvider({
  initialCourse,
  children,
}: {
  initialCourse: Course;
  children: React.ReactNode;
}) {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [course, setCourse] = useState(initialCourse);
  const [progress, setProgress] = useState<CourseProgress | null>(null);
  const [progressLoading, setProgressLoading] = useState(true);

  const refreshProgress = useCallback(async () => {
    try {
      setProgress(await getCourseProgress(initialCourse.id));
    } catch {
      setProgress(null);
    }
  }, [initialCourse.id]);

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setProgressLoading(false);
      return;
    }

    let cancelled = false;

    Promise.all([
      loadSyllabus(initialCourse).catch(() => initialCourse),
      getCourseProgress(initialCourse.id).catch(() => null),
    ]).then(([fullCourse, fetchedProgress]) => {
      if (cancelled) return;
      setCourse(fullCourse);
      setProgress(fetchedProgress);
      setProgressLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [authLoading, isAuthenticated, initialCourse]);

  return (
    <CourseLearningContext.Provider
      value={{
        course,
        progress,
        isLoading: authLoading || progressLoading,
        isAuthenticated,
        refreshProgress,
      }}
    >
      {children}
    </CourseLearningContext.Provider>
  );
}
