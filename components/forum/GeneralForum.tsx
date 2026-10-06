"use client";

import Link from "next/link";
import { MessagesSquare } from "lucide-react";
import { useEffect, useState } from "react";

import { forumErrorMessage, listCategories, type ForumCategory } from "@/services/forums/forums.service";

/* Foro general: el listado de categorías activas. */
export default function GeneralForum() {
  const [categories, setCategories] = useState<ForumCategory[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    listCategories(controller.signal)
      .then(setCategories)
      .catch((caught: unknown) => {
        if (controller.signal.aborted) return;
        setError(forumErrorMessage(caught, "No pudimos cargar las categorías."));
      });
    return () => controller.abort();
  }, []);

  if (error) {
    return (
      <p role="alert" className="bg-danger-subtle text-danger rounded-lg px-3 py-2 text-sm">
        {error}
      </p>
    );
  }

  if (!categories) {
    return <div className="bg-surface-elevated h-24 animate-pulse rounded-xl" aria-busy="true" />;
  }

  if (categories.length === 0) {
    return (
      <p className="text-text-muted border-border rounded-xl border border-dashed p-8 text-center text-sm">
        Todavía no hay categorías en el foro general.
      </p>
    );
  }

  return (
    <ul className="grid gap-3 sm:grid-cols-2">
      {categories.map((category) => (
        <li key={category.id}>
          <Link
            href={`/dashboard/foros/general/${category.id}`}
            className="bg-surface border-border hover:border-primary/40 flex h-full gap-4 rounded-xl border p-4 transition-colors"
          >
            <span className="bg-primary/10 text-primary flex size-10 shrink-0 items-center justify-center rounded-lg">
              <MessagesSquare className="size-5" aria-hidden />
            </span>
            <span className="min-w-0">
              <span className="text-text block font-semibold">{category.name}</span>
              {category.description && (
                <span className="text-text-muted mt-0.5 block text-sm">{category.description}</span>
              )}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
