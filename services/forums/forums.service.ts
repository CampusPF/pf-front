import { apiFetch } from "@/services/api-client";
import type { PaginatedResponse } from "@/services/api.types";
import { backendMessageOr } from "@/services/backend-message";

/* Foros de curso y foro general. Espejo de pf-back/src/forums. */

export const THREAD_TITLE_MAX = 150;
export const THREAD_BODY_MAX = 5000;
export const POST_BODY_MAX = 2000;
export const FORUM_PAGE_SIZE = 20;

export type ForumRole = "student" | "teacher" | "admin";

export interface ForumAuthor {
  id: string;
  name: string;
  avatarUrl: string | null;
  role: ForumRole;
  /** Es el docente que dicta el curso del hilo. */
  isCourseInstructor: boolean;
}

export interface ForumThread {
  id: string;
  title: string;
  body: string;
  isPinned: boolean;
  isLocked: boolean;
  replyCount: number;
  solutionPostId: string | null;
  lastActivityAt: string;
  createdAt: string;
  updatedAt: string;
  course: { id: string; title: string; slug: string } | null;
  category: { id: string; name: string; slug: string } | null;
  author: ForumAuthor;
}

export interface ForumThreadDetail extends ForumThread {
  permissions: { canModerate: boolean; canEdit: boolean; canReply: boolean };
}

export interface ForumPost {
  id: string;
  body: string;
  createdAt: string;
  updatedAt: string;
  editedAt: string | null;
  isSolution: boolean;
  author: ForumAuthor;
}

export interface ForumCategory {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  position: number;
  isActive: boolean;
}

export interface ThreadInput {
  title: string;
  body: string;
}

const coursePath = (courseId: string) => `/courses/${encodeURIComponent(courseId)}/forum/threads`;
const categoryPath = (categoryId: string) => `/forum/categories/${encodeURIComponent(categoryId)}/threads`;
const threadPath = (threadId: string, suffix = "") => `/forum/threads/${encodeURIComponent(threadId)}${suffix}`;

export function listCourseThreads(courseId: string, page = 1, signal?: AbortSignal) {
  return apiFetch<PaginatedResponse<ForumThread>>(coursePath(courseId), {
    auth: true,
    query: { page, limit: FORUM_PAGE_SIZE },
    signal,
  });
}

export function createCourseThread(courseId: string, input: ThreadInput) {
  return apiFetch<ForumThread>(coursePath(courseId), { method: "POST", auth: true, body: input });
}

export function listCategories(signal?: AbortSignal) {
  return apiFetch<ForumCategory[]>("/forum/categories", { auth: true, signal });
}

export function listCategoryThreads(categoryId: string, page = 1, signal?: AbortSignal) {
  return apiFetch<PaginatedResponse<ForumThread>>(categoryPath(categoryId), {
    auth: true,
    query: { page, limit: FORUM_PAGE_SIZE },
    signal,
  });
}

export function createCategoryThread(categoryId: string, input: ThreadInput) {
  return apiFetch<ForumThread>(categoryPath(categoryId), { method: "POST", auth: true, body: input });
}

export function getThread(threadId: string, signal?: AbortSignal) {
  return apiFetch<ForumThreadDetail>(threadPath(threadId), { auth: true, signal });
}

export function updateThread(threadId: string, patch: Partial<ThreadInput>) {
  return apiFetch<ForumThread>(threadPath(threadId), { method: "PATCH", auth: true, body: patch });
}

export function deleteThread(threadId: string) {
  return apiFetch<null>(threadPath(threadId), { method: "DELETE", auth: true });
}

export function moderateThread(threadId: string, patch: { isPinned?: boolean; isLocked?: boolean }) {
  return apiFetch<ForumThread>(threadPath(threadId, "/moderation"), { method: "PATCH", auth: true, body: patch });
}

export function setThreadSolution(threadId: string, postId: string) {
  return apiFetch<ForumThread>(threadPath(threadId, "/solution"), { method: "PUT", auth: true, body: { postId } });
}

export function clearThreadSolution(threadId: string) {
  return apiFetch<ForumThread>(threadPath(threadId, "/solution"), { method: "DELETE", auth: true });
}

export function listPosts(threadId: string, page = 1, signal?: AbortSignal) {
  return apiFetch<PaginatedResponse<ForumPost>>(threadPath(threadId, "/posts"), {
    auth: true,
    query: { page, limit: FORUM_PAGE_SIZE },
    signal,
  });
}

export function createPost(threadId: string, body: string) {
  return apiFetch<ForumPost>(threadPath(threadId, "/posts"), { method: "POST", auth: true, body: { body } });
}

/** `PATCH /forum/posts/:postId` — autor o moderador. Setea `editedAt`. */
export function updatePost(postId: string, body: string) {
  return apiFetch<ForumPost>(`/forum/posts/${encodeURIComponent(postId)}`, {
    method: "PATCH",
    auth: true,
    body: { body },
  });
}

export function deletePost(postId: string) {
  return apiFetch<null>(`/forum/posts/${encodeURIComponent(postId)}`, { method: "DELETE", auth: true });
}

export function getMyForumActivity(signal?: AbortSignal) {
  return apiFetch<ForumThread[]>("/forum/me/activity", { auth: true, signal });
}

/* Administración de categorías (sólo admin en el back). */

export function listAllCategories(signal?: AbortSignal) {
  return apiFetch<ForumCategory[]>("/forum/categories/all", { auth: true, signal });
}

export function createCategory(input: { name: string; description?: string; position?: number }) {
  return apiFetch<ForumCategory>("/forum/categories", { method: "POST", auth: true, body: input });
}

export function updateCategory(id: string, patch: Partial<Pick<ForumCategory, "name" | "description" | "position" | "isActive">>) {
  return apiFetch<ForumCategory>(`/forum/categories/${encodeURIComponent(id)}`, {
    method: "PATCH",
    auth: true,
    body: patch,
  });
}

export function forumErrorMessage(error: unknown, fallback = "No pudimos completar la acción en el foro."): string {
  return backendMessageOr(error, fallback);
}
