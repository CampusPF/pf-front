"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

import {
  BUTTON_PRIMARY,
  CARD,
  ErrorBanner,
  LABEL,
  SuccessBanner,
} from "@/components/admin/admin-ui";
import ImageUploader from "@/components/ui/ImageUploader";
import { inputClass } from "@/components/ui/input-styles";
import { adminErrorMessage } from "@/services/admin/admin-errors";
import {
  createCourse,
  listAdminCategories,
  updateCourse,
  type CoursePayload,
} from "@/services/admin/admin.service";
import { LEVEL_LABEL } from "@/services/courses/courses.adapter";
import type { RawCategory, RawCourse, RawDifficulty } from "@/services/courses/courses.raw";
import { uploadCourseImage } from "@/services/uploads/entity-images.service";

/* Alta y edición de curso.

   La portada NO es un campo del form (ya no se pide URL a mano): se sube con
   `POST /courses/:id/image`, que necesita el id. Por eso en la creación el
   uploader aparece recién después de guardar: se crea el curso y se redirige
   a su pantalla de edición, donde ya está el uploader. */

interface Values {
  title: string;
  description: string;
  difficulty: RawDifficulty;
  categoryId: string;
  /** En unidades (ej. "49.99"); se manda en centavos. */
  price: string;
  currency: string;
}

function initialValues(course?: RawCourse): Values {
  return {
    title: course?.title ?? "",
    description: course?.description ?? "",
    difficulty: course?.difficulty ?? "beginner",
    categoryId: course?.category?.id ?? "",
    price: course ? (course.priceInCents / 100).toFixed(2) : "0",
    currency: course?.currency ?? "usd",
  };
}

function validate(values: Values): Partial<Record<keyof Values, string>> {
  const errors: Partial<Record<keyof Values, string>> = {};
  if (!values.title.trim()) errors.title = "El título es obligatorio.";
  else if (values.title.length > 150) errors.title = "Máximo 150 caracteres.";
  if (!values.categoryId) errors.categoryId = "Elegí una categoría.";
  const price = Number(values.price);
  if (!Number.isFinite(price) || price < 0) errors.price = "Ingresá un precio válido (0 = gratis).";
  if (!/^[a-z]{3}$/i.test(values.currency)) errors.currency = "Código de 3 letras (ej. usd).";
  return errors;
}

export default function CourseForm({
  course,
  onSaved,
}: {
  course?: RawCourse;
  onSaved?: (updated: RawCourse) => void;
}) {
  const router = useRouter();
  const isEdit = Boolean(course);
  const [values, setValues] = useState<Values>(() => initialValues(course));
  const [touched, setTouched] = useState(false);
  const [categories, setCategories] = useState<RawCategory[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState(course?.imageUrl ?? null);

  useEffect(() => {
    listAdminCategories()
      .then((list) => setCategories(list.filter((c) => c.isActive || c.id === course?.category?.id)))
      .catch(() => setCategories(course?.category ? [course.category] : []));
  }, [course?.category]);

  const errors = validate(values);
  const showError = (field: keyof Values) => (touched ? errors[field] : undefined);

  function set<K extends keyof Values>(field: K, value: Values[K]) {
    setValues((prev) => ({ ...prev, [field]: value }));
    setSaved(null);
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setTouched(true);
    if (Object.keys(errors).length > 0) return;

    const payload: CoursePayload = {
      title: values.title.trim(),
      description: values.description.trim() || undefined,
      difficulty: values.difficulty,
      categoryId: values.categoryId,
      priceInCents: Math.round(Number(values.price) * 100),
      currency: values.currency.toLowerCase(),
    };

    setIsSaving(true);
    setError(null);
    try {
      if (course) {
        const updated = await updateCourse(course.id, payload);
        setSaved("Cambios guardados.");
        onSaved?.({ ...course, ...updated });
      } else {
        const created = await createCourse(payload);
        // Con el id ya se puede subir la portada: vamos a la pantalla de edición.
        router.replace(`/dashboard/admin/cursos/${created.id}?nuevo=1`);
      }
    } catch (caught) {
      setError(adminErrorMessage(caught));
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <section className={CARD} aria-labelledby="course-form-title">
      <h2 id="course-form-title" className="text-text text-lg font-semibold">
        {isEdit ? "Datos del curso" : "Nuevo curso"}
      </h2>
      {!isEdit && (
        <p className="text-text-muted mt-1 text-sm">
          Después de crearlo vas a poder subir la portada y armar el temario.
        </p>
      )}

      {course && (
        <div className="mt-5">
          <p className={LABEL}>Portada</p>
          <ImageUploader
            label={imageUrl ? "Cambiar portada" : "Subir portada"}
            currentUrl={imageUrl}
            upload={(file) => uploadCourseImage<RawCourse>(course.id, file)}
            onUploaded={(updated) => {
              setImageUrl(updated.imageUrl ?? null);
              onSaved?.({ ...course, ...updated });
            }}
          />
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate className="mt-6 grid gap-4 md:grid-cols-2">
        {error && (
          <div className="md:col-span-2">
            <ErrorBanner message={error} />
          </div>
        )}
        {saved && (
          <div className="md:col-span-2">
            <SuccessBanner message={saved} />
          </div>
        )}

        <Field label="Título" error={showError("title")} className="md:col-span-2">
          {(props) => (
            <input
              {...props}
              type="text"
              value={values.title}
              onChange={(e) => set("title", e.target.value)}
              maxLength={150}
              className={inputClass(Boolean(showError("title")))}
            />
          )}
        </Field>

        <Field label="Descripción" className="md:col-span-2">
          {(props) => (
            <textarea
              {...props}
              rows={4}
              value={values.description}
              onChange={(e) => set("description", e.target.value)}
              className={inputClass(false)}
            />
          )}
        </Field>

        <Field label="Categoría" error={showError("categoryId")}>
          {(props) => (
            <select
              {...props}
              value={values.categoryId}
              onChange={(e) => set("categoryId", e.target.value)}
              className={inputClass(Boolean(showError("categoryId")))}
            >
              <option value="">Elegí una categoría…</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          )}
        </Field>

        <Field label="Nivel">
          {(props) => (
            <select
              {...props}
              value={values.difficulty}
              onChange={(e) => set("difficulty", e.target.value as RawDifficulty)}
              className={inputClass(false)}
            >
              {Object.entries(LEVEL_LABEL).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          )}
        </Field>

        <Field label="Precio (0 = gratis)" error={showError("price")}>
          {(props) => (
            <input
              {...props}
              type="number"
              min={0}
              step="0.01"
              inputMode="decimal"
              value={values.price}
              onChange={(e) => set("price", e.target.value)}
              className={inputClass(Boolean(showError("price")))}
            />
          )}
        </Field>

        <Field label="Moneda" error={showError("currency")}>
          {(props) => (
            <input
              {...props}
              type="text"
              maxLength={3}
              value={values.currency}
              onChange={(e) => set("currency", e.target.value)}
              className={`${inputClass(Boolean(showError("currency")))} uppercase`}
            />
          )}
        </Field>

        <div className="flex justify-end md:col-span-2">
          <button type="submit" disabled={isSaving} className={BUTTON_PRIMARY}>
            {isSaving && <Loader2 className="size-4 animate-spin" aria-hidden />}
            {isEdit ? "Guardar cambios" : "Crear curso"}
          </button>
        </div>
      </form>
    </section>
  );
}

let fieldCounter = 0;

function Field({
  label,
  error,
  className = "",
  children,
}: {
  label: string;
  error?: string;
  className?: string;
  children: (props: { id: string; "aria-invalid": boolean; "aria-describedby"?: string }) => React.ReactNode;
}) {
  const [id] = useState(() => `course-field-${++fieldCounter}`);
  return (
    <div className={className}>
      <label htmlFor={id} className={LABEL}>
        {label}
      </label>
      {children({
        id,
        "aria-invalid": Boolean(error),
        "aria-describedby": error ? `${id}-error` : undefined,
      })}
      {error && (
        <p id={`${id}-error`} role="alert" className="text-danger mt-1 text-xs">
          {error}
        </p>
      )}
    </div>
  );
}
