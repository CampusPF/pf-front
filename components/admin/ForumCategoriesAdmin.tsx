"use client";

import { useEffect, useState } from "react";

import { BUTTON_PRIMARY, CARD, ErrorBanner, LABEL } from "@/components/admin/admin-ui";
import { inputClass } from "@/components/ui/input-styles";
import {
  createCategory,
  forumErrorMessage,
  listAllCategories,
  updateCategory,
  type ForumCategory,
} from "@/services/forums/forums.service";

/* Administración del foro general: alta de categorías y ocultarlas/mostrarlas.
   Ocultar no borra: los hilos siguen existiendo. */
export default function ForumCategoriesAdmin() {
  const [categories, setCategories] = useState<ForumCategory[] | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [version, setVersion] = useState(0);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    listAllCategories(controller.signal)
      .then(setCategories)
      .catch((caught: unknown) => {
        if (controller.signal.aborted) return;
        setError(forumErrorMessage(caught, "No pudimos cargar las categorías."));
      });
    return () => controller.abort();
  }, [version]);

  async function handleCreate(event: React.FormEvent) {
    event.preventDefault();
    if (name.trim().length < 2) return;
    setSaving(true);
    setError(null);
    try {
      await createCategory({ name: name.trim(), description: description.trim() || undefined });
      setName("");
      setDescription("");
      setVersion((current) => current + 1);
    } catch (caught) {
      setError(forumErrorMessage(caught, "No pudimos crear la categoría."));
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(category: ForumCategory) {
    setError(null);
    try {
      await updateCategory(category.id, { isActive: !category.isActive });
      setVersion((current) => current + 1);
    } catch (caught) {
      setError(forumErrorMessage(caught, "No pudimos actualizar la categoría."));
    }
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleCreate} className={`${CARD} space-y-4 p-5`}>
        <h2 className="text-text text-lg font-semibold">Nueva categoría</h2>
        <div>
          <label htmlFor="forum-category-name" className={LABEL}>Nombre</label>
          <input
            id="forum-category-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={inputClass(false)}
            maxLength={80}
          />
        </div>
        <div>
          <label htmlFor="forum-category-description" className={LABEL}>Descripción</label>
          <input
            id="forum-category-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className={inputClass(false)}
            maxLength={300}
          />
        </div>
        {error && <ErrorBanner message={error} />}
        <div className="flex justify-end">
          <button type="submit" disabled={saving || name.trim().length < 2} className={BUTTON_PRIMARY}>
            Crear categoría
          </button>
        </div>
      </form>

      {categories === null ? (
        <div className="bg-surface-elevated h-24 animate-pulse rounded-xl" aria-busy="true" />
      ) : (
        <ul className="space-y-3">
          {categories.map((category) => (
            <li key={category.id} className={`${CARD} flex items-center justify-between gap-4 p-4`}>
              <div className="min-w-0">
                <p className="text-text font-semibold">
                  {category.name}
                  {!category.isActive && <span className="text-text-muted ml-2 text-xs">(oculta)</span>}
                </p>
                <p className="text-text-muted truncate text-sm">{category.description ?? "Sin descripción"}</p>
              </div>
              <button
                type="button"
                onClick={() => void toggleActive(category)}
                className="border-border text-text hover:bg-surface-elevated shrink-0 cursor-pointer rounded-lg border px-3 py-1.5 text-sm font-medium"
              >
                {category.isActive ? "Ocultar" : "Mostrar"}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
