"use client";

import { useCallback, useEffect, useState } from "react";

import { useAuth } from "@/components/auth/AuthProvider";
import { useDashboardData } from "@/components/dashboard/DashboardDataProvider";
import ThreadForm from "@/components/forum/ThreadForm";
import ThreadList from "@/components/forum/ThreadList";
import {
  createCategoryThread,
  forumErrorMessage,
  hasGeneralForumAccess,
  listCategories,
  listCategoryThreads,
  type ForumCategory,
  type ThreadInput,
} from "@/services/forums/forums.service";

/* Hilos de una categoría del foro general. */
export default function CategoryThreads({ categoryId }: { categoryId: string }) {
  const { user } = useAuth();
  const { data: dashboard } = useDashboardData();
  const canParticipate = hasGeneralForumAccess(user?.role, dashboard);
  const [category, setCategory] = useState<ForumCategory | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [composing, setComposing] = useState(false);
  const [version, setVersion] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    listCategories(controller.signal)
      .then((categories) => {
        const found = categories.find((item) => item.id === categoryId) ?? null;
        setCategory(found);
        setNotFound(!found);
      })
      .catch((caught: unknown) => {
        if (controller.signal.aborted) return;
        setError(forumErrorMessage(caught, "No pudimos cargar la categoría."));
      });
    return () => controller.abort();
  }, [categoryId]);

  const loadThreads = useCallback(
    (page: number, signal: AbortSignal) => listCategoryThreads(categoryId, page, signal),
    // `version` fuerza una recarga después de publicar un hilo nuevo.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [categoryId, version],
  );

  async function publish(input: ThreadInput) {
    await createCategoryThread(categoryId, input);
    setComposing(false);
    setVersion((current) => current + 1);
  }

  if (error) {
    return (
      <p role="alert" className="bg-danger-subtle text-danger rounded-lg px-3 py-2 text-sm">
        {error}
      </p>
    );
  }

  if (notFound) {
    return <p className="text-text-muted text-sm">Esta categoría no existe o ya no está activa.</p>;
  }

  if (!canParticipate) {
    return (
      <p className="text-text-muted border-border rounded-xl border border-dashed p-8 text-center text-sm">
        Necesitás una suscripción activa o haber comprado un curso para participar del foro general.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-text text-lg font-semibold">{category?.name ?? "Categoría"}</h2>
          {category?.description && <p className="text-text-muted text-sm">{category.description}</p>}
        </div>
        {!composing && (
          <button
            type="button"
            onClick={() => setComposing(true)}
            className="bg-primary-solid hover:bg-primary-solid-hover shrink-0 cursor-pointer rounded-lg px-4 py-2 text-sm font-medium text-white"
          >
            Nuevo hilo
          </button>
        )}
      </div>

      {composing && <ThreadForm onSubmit={publish} onCancel={() => setComposing(false)} />}

      <ThreadList key={version} load={loadThreads} emptyMessage="Todavía no hay hilos en esta categoría." />
    </div>
  );
}
