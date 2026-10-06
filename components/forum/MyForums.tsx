"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { ThreadItem } from "@/components/forum/ThreadList";
import {
  forumErrorMessage,
  getMyForumActivity,
  type ForumThread,
} from "@/services/forums/forums.service";

/* "Mis foros": actividad reciente de mis cursos y de mis hilos, más el acceso
   al foro general. */
export default function MyForums() {
  const [threads, setThreads] = useState<ForumThread[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    getMyForumActivity(controller.signal)
      .then(setThreads)
      .catch((caught: unknown) => {
        if (controller.signal.aborted) return;
        setError(forumErrorMessage(caught, "No pudimos cargar tu actividad."));
      });
    return () => controller.abort();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-text-muted text-sm">Hilos de tus cursos y tus propias participaciones.</p>
        <Link
          href="/dashboard/foros/general"
          className="border-border text-text hover:bg-surface-elevated rounded-lg border px-4 py-2 text-sm font-medium"
        >
          Foro general
        </Link>
      </div>

      {error && (
        <p role="alert" className="bg-danger-subtle text-danger rounded-lg px-3 py-2 text-sm">
          {error}
        </p>
      )}

      {!error && !threads && <div className="bg-surface-elevated h-24 animate-pulse rounded-xl" aria-busy="true" />}

      {threads && threads.length === 0 && (
        <p className="text-text-muted border-border rounded-xl border border-dashed p-8 text-center text-sm">
          Todavía no tenés actividad en los foros. Entrá al foro de un curso para empezar.
        </p>
      )}

      {threads && threads.length > 0 && (
        <ul className="space-y-3">
          {threads.map((thread) => (
            <li key={thread.id}>
              <ThreadItem thread={thread} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
