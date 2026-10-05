import { apiFetch } from "@/services/api-client";
import { withCatalogRevalidation } from "@/services/admin/catalog-revalidation";
import { toCourse, toLesson } from "@/services/courses/courses.adapter";
import type {
  RawCategory,
  RawCourse,
  RawDifficulty,
  RawLesson,
  RawLessonView,
  RawModule,
} from "@/services/courses/courses.raw";
import type { Course } from "@/types/course.types";

/* Todo lo que usa el panel de administración. Requiere Bearer y, en el back,
   rol admin.

   TODO(back): hoy TODOS los endpoints de escritura de cursos, módulos y
   lecciones son `@Roles(ADMIN)`. El panel ya deja entrar a los teachers (sólo
   a sus cursos); hasta que el back les abra los permisos, sus escrituras van
   a volver 403 y la UI lo muestra con `adminErrorMessage`. */

/* ── Cursos ───────────────────────────────────────────────────── */

export interface CoursePayload {
  title: string;
  description?: string;
  slug?: string;
  difficulty?: RawDifficulty;
  categoryId: string;
  priceInCents?: number;
  currency?: string;
}

/** Incluye inactivos, para poder restaurarlos. */
export async function listAdminCourses(): Promise<Course[]> {
  const raw = await apiFetch<RawCourse[]>("/courses", {
    query: { includeInactive: true },
    auth: true,
  });
  return raw.map(toCourse);
}

/** El detalle crudo: el form de edición necesita `category.id` y los módulos. */
export function getAdminCourse(id: string) {
  return apiFetch<RawCourse>(`/courses/${encodeURIComponent(id)}`, { auth: true });
}

/* Las escrituras de cursos y categorías pasan por withCatalogRevalidation:
   si no, la landing (revalidate = 300) mostraba el dato viejo hasta 5 min. */

export function createCourse(payload: CoursePayload) {
  return withCatalogRevalidation(
    apiFetch<RawCourse>("/courses", { method: "POST", body: payload, auth: true }),
  );
}

export function updateCourse(id: string, payload: Partial<CoursePayload>) {
  return withCatalogRevalidation(
    apiFetch<RawCourse>(`/courses/${encodeURIComponent(id)}`, {
      method: "PATCH",
      body: payload,
      auth: true,
    }),
  );
}

/** Baja lógica (`isActive = false`). */
export function deactivateCourse(id: string) {
  return withCatalogRevalidation(
    apiFetch<null>(`/courses/${encodeURIComponent(id)}`, { method: "DELETE", auth: true }),
  );
}

export function restoreCourse(id: string) {
  return withCatalogRevalidation(
    apiFetch<RawCourse>(`/courses/${encodeURIComponent(id)}/restore`, {
      method: "PATCH",
      auth: true,
    }),
  );
}

/* ── Categorías ───────────────────────────────────────────────── */

export interface CategoryPayload {
  name: string;
  description?: string;
}

export function listAdminCategories() {
  return apiFetch<RawCategory[]>("/categories", {
    query: { includeInactive: true },
    auth: true,
  });
}

export function createCategory(payload: CategoryPayload) {
  return withCatalogRevalidation(
    apiFetch<RawCategory>("/categories", { method: "POST", body: payload, auth: true }),
  );
}

export function updateCategory(id: string, payload: Partial<CategoryPayload>) {
  return withCatalogRevalidation(
    apiFetch<RawCategory>(`/categories/${encodeURIComponent(id)}`, {
      method: "PATCH",
      body: payload,
      auth: true,
    }),
  );
}

export function deactivateCategory(id: string) {
  return withCatalogRevalidation(
    apiFetch<null>(`/categories/${encodeURIComponent(id)}`, { method: "DELETE", auth: true }),
  );
}

export function restoreCategory(id: string) {
  return withCatalogRevalidation(
    apiFetch<RawCategory>(`/categories/${encodeURIComponent(id)}/restore`, {
      method: "PATCH",
      auth: true,
    }),
  );
}

/* ── Temario: módulos y lecciones ─────────────────────────────── */

export function createModule(courseId: string, title: string, order?: number) {
  return apiFetch<RawModule>("/course-modules", {
    method: "POST",
    body: { courseId, title, order },
    auth: true,
  });
}

export function updateModule(id: string, payload: { title?: string; order?: number }) {
  return apiFetch<RawModule>(`/course-modules/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: payload,
    auth: true,
  });
}

export function deleteModule(id: string) {
  return apiFetch<null>(`/course-modules/${encodeURIComponent(id)}`, {
    method: "DELETE",
    auth: true,
  });
}

export async function listModuleLessons(moduleId: string) {
  const raw = await apiFetch<RawLesson[]>("/lessons", { query: { moduleId }, auth: true });
  return raw.map(toLesson);
}

export interface LessonPayload {
  title: string;
  moduleId: string;
  content?: string;
  videoUrl?: string;
  order?: number;
  durationMinutes?: number;
  isFree?: boolean;
}

/** Admin siempre tiene acceso, así que trae content/videoUrl completos. */
export function getAdminLesson(id: string) {
  return apiFetch<RawLessonView>(`/lessons/${encodeURIComponent(id)}`, { auth: true });
}

export function createLesson(payload: LessonPayload) {
  return apiFetch<RawLesson>("/lessons", { method: "POST", body: payload, auth: true });
}

export function updateLesson(id: string, payload: Partial<LessonPayload>) {
  return apiFetch<RawLesson>(`/lessons/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: payload,
    auth: true,
  });
}

export function deleteLesson(id: string) {
  return apiFetch<null>(`/lessons/${encodeURIComponent(id)}`, { method: "DELETE", auth: true });
}

/* ── Usuarios ─────────────────────────────────────────────────── */

export type UserRole = "student" | "teacher" | "admin";
export type UserStatus = "active" | "inactive" | "banned" | "deleted";

/** Lo que devuelve `GET /users` (vista reducida: sin datos personales). */
export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  createdAt: string;
}

/**
 * `GET /users` — sólo admin.
 *
 * Por defecto el back excluye a los dados de baja (`status: deleted`); con
 * `includeDeleted` vienen todos, que es lo que necesita el panel para poder
 * restaurarlos (`restoreUser`).
 */
export function listUsers(includeDeleted = false) {
  return apiFetch<AdminUser[]>(
    includeDeleted ? "/users?includeDeleted=true" : "/users",
    { auth: true },
  );
}

/** `PATCH /users/:id/restore` — vuelve a dejar la cuenta en `active`. Sólo admin. */
export function restoreUser(id: string) {
  return apiFetch<AdminUser>(`/users/${encodeURIComponent(id)}/restore`, {
    method: "PATCH",
    auth: true,
  });
}

/**
 * `PATCH /users/:id` con `{ role }` — sólo admin (el back rechaza con 403 a
 * cualquier otro que intente cambiar un rol, incluso el propio).
 */
export function updateUserRole(id: string, role: UserRole) {
  return apiFetch<AdminUser>(`/users/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: { role },
    auth: true,
  });
}

/** `DELETE /users/:id` — baja lógica (`status: deleted`), no borra la fila. */
export function deleteUser(id: string) {
  return apiFetch<AdminUser>(`/users/${encodeURIComponent(id)}`, {
    method: "DELETE",
    auth: true,
  });
}

/* Las métricas del resumen viven en `admin-stats.service.ts` (GET /admin/stats). */
