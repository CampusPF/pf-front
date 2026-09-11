"use client";

import { useCallback, useEffect, useState } from "react";
import { ChevronDown, Loader2, Package, Pencil, Plus, Trash2 } from "lucide-react";

import ConfirmDialog from "@/components/ui/ConfirmDialog";
import LessonEditor from "@/components/admin/LessonEditor";
import {
  BUTTON_GHOST_DANGER,
  BUTTON_PRIMARY,
  BUTTON_SECONDARY,
  CARD,
  ErrorBanner,
} from "@/components/admin/admin-ui";
import { inputClass } from "@/components/ui/input-styles";
import { formatDuration } from "@/lib/course-utils";
import { adminErrorMessage } from "@/services/admin/admin-errors";
import {
  createLesson,
  createModule,
  deleteLesson,
  deleteModule,
  listModuleLessons,
  updateModule,
} from "@/services/admin/admin.service";
import type { RawModule } from "@/services/courses/courses.raw";
import type { Lesson } from "@/types/course.types";

/* Temario de un curso: módulos → lecciones → (contenido + PDFs adjuntos).

   Los módulos vienen en `GET /courses/:id`; las lecciones de cada módulo se
   piden al abrirlo (`GET /lessons?moduleId=`).
   TODO(back): no hay endpoint para reordenar en bloque; el orden se edita
   campo por campo. */

type PendingDelete =
  | { kind: "module"; id: string; title: string }
  | { kind: "lesson"; id: string; title: string; moduleId: string };

export default function SyllabusEditor({
  courseId,
  modules,
  onChanged,
}: {
  courseId: string;
  modules: RawModule[];
  onChanged: () => Promise<void> | void;
}) {
  const [newModuleTitle, setNewModuleTitle] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<PendingDelete | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  // Contador para que un módulo recargue sus lecciones tras borrar una.
  const [lessonsVersion, setLessonsVersion] = useState(0);

  const sorted = [...modules].filter((m) => m.isActive !== false).sort((a, b) => a.order - b.order);

  async function handleAddModule(event: React.FormEvent) {
    event.preventDefault();
    if (!newModuleTitle.trim()) return;
    setIsCreating(true);
    setError(null);
    try {
      await createModule(courseId, newModuleTitle.trim());
      setNewModuleTitle("");
      await onChanged();
    } catch (caught) {
      setError(adminErrorMessage(caught));
    } finally {
      setIsCreating(false);
    }
  }

  async function handleDelete() {
    if (!pendingDelete) return;
    setIsDeleting(true);
    setError(null);
    try {
      if (pendingDelete.kind === "module") {
        await deleteModule(pendingDelete.id);
        await onChanged();
      } else {
        await deleteLesson(pendingDelete.id);
        setLessonsVersion((v) => v + 1);
      }
    } catch (caught) {
      setError(adminErrorMessage(caught));
    } finally {
      setIsDeleting(false);
      setPendingDelete(null);
    }
  }

  return (
    <section className={CARD} aria-labelledby="syllabus-title">
      <h2 id="syllabus-title" className="text-text text-lg font-semibold">
        Temario
      </h2>
      <p className="text-text-muted mt-1 text-sm">
        Módulos y lecciones. Abrí una lección para editar su contenido y subir PDFs.
      </p>

      {error && (
        <div className="mt-4">
          <ErrorBanner message={error} />
        </div>
      )}

      <div className="mt-5 flex flex-col gap-3">
        {sorted.length === 0 && (
          <p className="text-text-muted border-border rounded-xl border border-dashed p-6 text-center text-sm">
            Todavía no hay módulos. Creá el primero abajo.
          </p>
        )}

        {sorted.map((courseModule) => (
          <ModuleRow
            key={courseModule.id}
            courseModule={courseModule}
            lessonsVersion={lessonsVersion}
            onRenamed={onChanged}
            onError={setError}
            onDeleteModule={() =>
              setPendingDelete({ kind: "module", id: courseModule.id, title: courseModule.title })
            }
            onDeleteLesson={(lesson) =>
              setPendingDelete({
                kind: "lesson",
                id: lesson.id,
                title: lesson.title,
                moduleId: courseModule.id,
              })
            }
          />
        ))}
      </div>

      <form onSubmit={handleAddModule} className="mt-4 flex gap-2">
        <label htmlFor="new-module" className="sr-only">
          Título del nuevo módulo
        </label>
        <input
          id="new-module"
          type="text"
          value={newModuleTitle}
          onChange={(e) => setNewModuleTitle(e.target.value)}
          placeholder="Título del nuevo módulo"
          className={inputClass(false)}
        />
        <button type="submit" disabled={isCreating || !newModuleTitle.trim()} className={BUTTON_PRIMARY}>
          {isCreating ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <Plus className="size-4" aria-hidden />}
          Módulo
        </button>
      </form>

      <ConfirmDialog
        open={pendingDelete !== null}
        variant="danger"
        title={pendingDelete?.kind === "module" ? "¿Eliminar el módulo?" : "¿Eliminar la lección?"}
        description={`Se va a desactivar "${pendingDelete?.title ?? ""}" y deja de verse en el curso.`}
        confirmLabel="Sí, eliminar"
        isPending={isDeleting}
        onConfirm={handleDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </section>
  );
}

function ModuleRow({
  courseModule,
  lessonsVersion,
  onRenamed,
  onError,
  onDeleteModule,
  onDeleteLesson,
}: {
  courseModule: RawModule;
  lessonsVersion: number;
  onRenamed: () => Promise<void> | void;
  onError: (message: string) => void;
  onDeleteModule: () => void;
  onDeleteLesson: (lesson: Lesson) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [lessons, setLessons] = useState<Lesson[] | null>(null);
  const [isRenaming, setIsRenaming] = useState(false);
  const [title, setTitle] = useState(courseModule.title);
  const [order, setOrder] = useState(String(courseModule.order));
  const [newLessonTitle, setNewLessonTitle] = useState("");
  const [isBusy, setIsBusy] = useState(false);
  const [openLessonId, setOpenLessonId] = useState<string | null>(null);

  const loadLessons = useCallback(async () => {
    try {
      const list = await listModuleLessons(courseModule.id);
      setLessons([...list].sort((a, b) => a.order - b.order));
    } catch (caught) {
      onError(adminErrorMessage(caught));
    }
  }, [courseModule.id, onError]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (isOpen) loadLessons();
  }, [isOpen, loadLessons, lessonsVersion]);

  async function saveModule(event: React.FormEvent) {
    event.preventDefault();
    setIsBusy(true);
    try {
      await updateModule(courseModule.id, { title: title.trim(), order: Number(order) || 0 });
      setIsRenaming(false);
      await onRenamed();
    } catch (caught) {
      onError(adminErrorMessage(caught));
    } finally {
      setIsBusy(false);
    }
  }

  async function addLesson(event: React.FormEvent) {
    event.preventDefault();
    if (!newLessonTitle.trim()) return;
    setIsBusy(true);
    try {
      const created = await createLesson({ moduleId: courseModule.id, title: newLessonTitle.trim() });
      setNewLessonTitle("");
      await loadLessons();
      setOpenLessonId(created.id);
    } catch (caught) {
      onError(adminErrorMessage(caught));
    } finally {
      setIsBusy(false);
    }
  }

  const panelId = `admin-module-${courseModule.id}`;

  return (
    <div className="border-border overflow-hidden rounded-xl border">
      <div className="bg-surface-elevated/50 flex items-center gap-2 px-3 py-2.5">
        {isRenaming ? (
          <form onSubmit={saveModule} className="flex flex-1 flex-wrap items-center gap-2">
            <input
              aria-label="Orden del módulo"
              type="number"
              value={order}
              onChange={(e) => setOrder(e.target.value)}
              className={`${inputClass(false)} w-20`}
            />
            <input
              aria-label="Título del módulo"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className={`${inputClass(false)} min-w-40 flex-1`}
            />
            <button type="submit" disabled={isBusy || !title.trim()} className={BUTTON_PRIMARY}>
              Guardar
            </button>
            <button type="button" onClick={() => setIsRenaming(false)} className={BUTTON_SECONDARY}>
              Cancelar
            </button>
          </form>
        ) : (
          <>
            <button
              type="button"
              onClick={() => setIsOpen((open) => !open)}
              aria-expanded={isOpen}
              aria-controls={panelId}
              className="flex min-w-0 flex-1 cursor-pointer items-center gap-3 text-left"
            >
              <Package className="text-primary size-5 shrink-0" aria-hidden />
              <span className="text-text truncate font-semibold">
                Módulo {courseModule.order} · {courseModule.title}
              </span>
              <ChevronDown
                className={`text-text-muted ml-auto size-4 shrink-0 transition-transform ${isOpen ? "rotate-180" : ""}`}
                aria-hidden
              />
            </button>
            <button
              type="button"
              onClick={() => setIsRenaming(true)}
              className={BUTTON_SECONDARY}
              aria-label={`Editar módulo ${courseModule.title}`}
            >
              <Pencil className="size-3.5" aria-hidden />
            </button>
            <button
              type="button"
              onClick={onDeleteModule}
              className={BUTTON_GHOST_DANGER}
              aria-label={`Eliminar módulo ${courseModule.title}`}
            >
              <Trash2 className="size-4" aria-hidden />
            </button>
          </>
        )}
      </div>

      {isOpen && (
        <div id={panelId} className="border-border flex flex-col gap-2 border-t p-3">
          {lessons === null && (
            <p className="text-text-muted flex items-center gap-2 text-sm">
              <Loader2 className="size-4 animate-spin" aria-hidden /> Cargando lecciones…
            </p>
          )}
          {lessons?.length === 0 && <p className="text-text-muted text-sm">Sin lecciones todavía.</p>}

          {lessons?.map((lesson) => (
            <div key={lesson.id} className="border-border rounded-lg border">
              <div className="flex items-center gap-2 px-3 py-2">
                <button
                  type="button"
                  onClick={() => setOpenLessonId((id) => (id === lesson.id ? null : lesson.id))}
                  aria-expanded={openLessonId === lesson.id}
                  className="flex min-w-0 flex-1 cursor-pointer items-center gap-2 text-left text-sm"
                >
                  <span className="text-text-muted w-5 shrink-0 text-right text-xs tabular-nums">{lesson.order}</span>
                  <span className="text-text truncate">{lesson.title}</span>
                  <span className="text-text-muted shrink-0 text-xs">
                    {formatDuration(lesson.durationMinutes)}
                  </span>
                  {lesson.isFree && (
                    <span className="bg-success/10 text-success shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium">
                      Gratis
                    </span>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => onDeleteLesson(lesson)}
                  className={BUTTON_GHOST_DANGER}
                  aria-label={`Eliminar lección ${lesson.title}`}
                >
                  <Trash2 className="size-4" aria-hidden />
                </button>
              </div>

              {openLessonId === lesson.id && (
                <div className="border-border border-t p-4">
                  <LessonEditor
                    lessonId={lesson.id}
                    onSaved={loadLessons}
                  />
                </div>
              )}
            </div>
          ))}

          <form onSubmit={addLesson} className="mt-1 flex gap-2">
            <label htmlFor={`new-lesson-${courseModule.id}`} className="sr-only">
              Título de la nueva lección
            </label>
            <input
              id={`new-lesson-${courseModule.id}`}
              type="text"
              value={newLessonTitle}
              onChange={(e) => setNewLessonTitle(e.target.value)}
              placeholder="Título de la nueva lección"
              className={inputClass(false)}
            />
            <button type="submit" disabled={isBusy || !newLessonTitle.trim()} className={BUTTON_SECONDARY}>
              <Plus className="size-4" aria-hidden />
              Lección
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
