"use client";

import { useCallback, useEffect, useState } from "react";
import { FolderTree, Loader2, Pencil, Plus, RotateCcw, Trash2 } from "lucide-react";

import ConfirmDialog from "@/components/ui/ConfirmDialog";
import ImageUploader from "@/components/ui/ImageUploader";
import { inputClass } from "@/components/ui/input-styles";
import {
  BUTTON_GHOST_DANGER,
  BUTTON_PRIMARY,
  BUTTON_SECONDARY,
  CARD,
  ErrorBanner,
  LABEL,
  Loading,
  StatusBadge,
} from "@/components/admin/admin-ui";
import { adminErrorMessage } from "@/services/admin/admin-errors";
import {
  createCategory,
  deactivateCategory,
  listAdminCategories,
  restoreCategory,
  updateCategory,
} from "@/services/admin/admin.service";
import type { RawCategory } from "@/services/courses/courses.raw";
import { uploadCategoryImage } from "@/services/uploads/entity-images.service";

/* CRUD de categorías (sólo admin). La imagen se sube con
   `POST /categories/:id/image`; ya no hay campo de URL manual, así que en el
   alta primero se crea y después aparece el uploader en su fila. */
export default function CategoriesManager() {
  const [categories, setCategories] = useState<RawCategory[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | "new" | null>(null);
  const [toDeactivate, setToDeactivate] = useState<RawCategory | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const list = await listAdminCategories();
      setCategories([...list].sort((a, b) => a.name.localeCompare(b.name)));
    } catch (caught) {
      setError(adminErrorMessage(caught));
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  async function run(id: string, action: () => Promise<unknown>) {
    setPendingId(id);
    setError(null);
    try {
      await action();
      await load();
    } catch (caught) {
      setError(adminErrorMessage(caught));
    } finally {
      setPendingId(null);
      setToDeactivate(null);
    }
  }

  function replace(updated: RawCategory) {
    setCategories((prev) => prev?.map((c) => (c.id === updated.id ? { ...c, ...updated } : c)) ?? null);
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-text-muted text-sm">{categories ? `${categories.length} categorías` : " "}</p>
        <button type="button" onClick={() => setEditingId("new")} className={BUTTON_PRIMARY}>
          <Plus className="size-4" aria-hidden />
          Nueva categoría
        </button>
      </div>

      {error && <ErrorBanner message={error} />}

      {editingId === "new" && (
        <CategoryForm
          onCancel={() => setEditingId(null)}
          onSaved={async (created) => {
            await load();
            // Queda abierta en modo edición para subir la imagen.
            setEditingId(created.id);
          }}
        />
      )}

      {!categories && !error && <Loading label="Cargando categorías…" />}

      <div className="flex flex-col gap-3">
        {categories?.map((category) =>
          editingId === category.id ? (
            <CategoryForm
              key={category.id}
              category={category}
              onCancel={() => setEditingId(null)}
              onSaved={async (updated) => {
                replace(updated);
                setEditingId(null);
              }}
              onImageUploaded={replace}
            />
          ) : (
            <div key={category.id} className={`${CARD} flex items-center gap-4`}>
              <div className="bg-surface-elevated flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-lg">
                {category.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={category.imageUrl} alt="" className="h-full w-full object-cover" />
                ) : (
                  <FolderTree className="text-text-muted size-6" aria-hidden />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-text flex items-center gap-2 font-medium">
                  <span className="truncate">{category.name}</span>
                  <StatusBadge active={category.isActive} />
                </p>
                {category.description && (
                  <p className="text-text-muted line-clamp-1 text-sm">{category.description}</p>
                )}
              </div>
              <button type="button" onClick={() => setEditingId(category.id)} className={BUTTON_SECONDARY}>
                <Pencil className="size-3.5" aria-hidden />
                Editar
              </button>
              {category.isActive ? (
                <button
                  type="button"
                  onClick={() => setToDeactivate(category)}
                  className={BUTTON_GHOST_DANGER}
                  aria-label={`Desactivar ${category.name}`}
                >
                  <Trash2 className="size-4" aria-hidden />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => run(category.id, () => restoreCategory(category.id))}
                  disabled={pendingId === category.id}
                  className={BUTTON_SECONDARY}
                >
                  <RotateCcw className="size-3.5" aria-hidden />
                  Restaurar
                </button>
              )}
            </div>
          ),
        )}
      </div>

      <ConfirmDialog
        open={toDeactivate !== null}
        variant="danger"
        title="¿Desactivar la categoría?"
        description={`"${toDeactivate?.name ?? ""}" deja de aparecer en los filtros del catálogo. Podés restaurarla después.`}
        confirmLabel="Sí, desactivar"
        isPending={pendingId !== null}
        onConfirm={() => toDeactivate && run(toDeactivate.id, () => deactivateCategory(toDeactivate.id))}
        onCancel={() => setToDeactivate(null)}
      />
    </div>
  );
}

function CategoryForm({
  category,
  onCancel,
  onSaved,
  onImageUploaded,
}: {
  category?: RawCategory;
  onCancel: () => void;
  onSaved: (saved: RawCategory) => Promise<void> | void;
  onImageUploaded?: (updated: RawCategory) => void;
}) {
  const [name, setName] = useState(category?.name ?? "");
  const [description, setDescription] = useState(category?.description ?? "");
  const [imageUrl, setImageUrl] = useState(category?.imageUrl ?? null);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const nameError =
    name.trim().length > 0 && (name.trim().length < 3 || name.trim().length > 50)
      ? "Entre 3 y 50 caracteres."
      : null;

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!name.trim() || nameError) return;

    setIsSaving(true);
    setError(null);
    try {
      const payload = { name: name.trim(), description: description.trim() || undefined };
      const saved = category ? await updateCategory(category.id, payload) : await createCategory(payload);
      await onSaved(saved);
    } catch (caught) {
      setError(adminErrorMessage(caught));
    } finally {
      setIsSaving(false);
    }
  }

  const prefix = category?.id ?? "new";

  return (
    <form onSubmit={handleSubmit} noValidate className={`${CARD} flex flex-col gap-4`}>
      <h2 className="text-text font-semibold">{category ? "Editar categoría" : "Nueva categoría"}</h2>
      {error && <ErrorBanner message={error} />}

      {category && (
        <div>
          <p className={LABEL}>Imagen</p>
          <ImageUploader
            label={imageUrl ? "Cambiar imagen" : "Subir imagen"}
            currentUrl={imageUrl}
            upload={(file) => uploadCategoryImage<RawCategory>(category.id, file)}
            onUploaded={(updated) => {
              setImageUrl(updated.imageUrl ?? null);
              onImageUploaded?.(updated);
            }}
          />
        </div>
      )}

      <div>
        <label htmlFor={`${prefix}-name`} className={LABEL}>
          Nombre
        </label>
        <input
          id={`${prefix}-name`}
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={50}
          aria-invalid={Boolean(nameError)}
          className={inputClass(Boolean(nameError))}
        />
        {nameError && <p className="text-danger mt-1 text-xs">{nameError}</p>}
      </div>

      <div>
        <label htmlFor={`${prefix}-description`} className={LABEL}>
          Descripción <span className="text-text-muted font-normal">(opcional)</span>
        </label>
        <textarea
          id={`${prefix}-description`}
          rows={2}
          maxLength={500}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className={inputClass(false)}
        />
      </div>

      {!category && (
        <p className="text-text-muted text-xs">Después de crearla vas a poder subir la imagen.</p>
      )}

      <div className="flex justify-end gap-2">
        <button type="button" onClick={onCancel} className={BUTTON_SECONDARY}>
          {category ? "Cerrar" : "Cancelar"}
        </button>
        <button type="submit" disabled={isSaving || !name.trim() || Boolean(nameError)} className={BUTTON_PRIMARY}>
          {isSaving && <Loader2 className="size-4 animate-spin" aria-hidden />}
          {category ? "Guardar" : "Crear"}
        </button>
      </div>
    </form>
  );
}
