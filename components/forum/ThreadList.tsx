"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Lock, MessageSquare, Pin, CheckCircle2 } from "lucide-react";

import UserAvatar from "@/components/ui/UserAvatar";
import { formatRelativeTime } from "@/lib/chat-utils";
import type { PaginatedResponse } from "@/services/api.types";
import { forumErrorMessage, type ForumThread } from "@/services/forums/forums.service";

type LoadPage = (page: number, signal: AbortSignal) => Promise<PaginatedResponse<ForumThread>>;

/* Lista paginada de hilos. Recibe `load` memoizado por el padre: cuando cambia,
   se vuelve a pedir la primera página. */
export default function ThreadList({
  load,
  emptyMessage,
}: {
  load: LoadPage;
  emptyMessage: string;
}) {
  const [threads, setThreads] = useState<ForumThread[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [error, setError] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    load(1, controller.signal)
      .then((result) => {
        setThreads(result.data);
        setPage(1);
        setTotalPages(result.meta.totalPages);
        setStatus("ready");
      })
      .catch((caught: unknown) => {
        if (controller.signal.aborted) return;
        setError(forumErrorMessage(caught, "No pudimos cargar los hilos."));
        setStatus("error");
      });
    return () => controller.abort();
  }, [load]);

  async function loadMore() {
    setLoadingMore(true);
    try {
      const result = await load(page + 1, new AbortController().signal);
      setThreads((current) => [...current, ...result.data]);
      setPage(page + 1);
      setTotalPages(result.meta.totalPages);
    } catch (caught) {
      setError(forumErrorMessage(caught, "No pudimos cargar más hilos."));
    } finally {
      setLoadingMore(false);
    }
  }

  if (status === "loading") {
    return (
      <div className="space-y-3" aria-busy="true">
        {[0, 1, 2].map((item) => (
          <div key={item} className="bg-surface-elevated h-20 animate-pulse rounded-xl" />
        ))}
      </div>
    );
  }

  if (status === "error") {
    return (
      <p role="alert" className="bg-danger-subtle text-danger rounded-lg px-3 py-2 text-sm">
        {error}
      </p>
    );
  }

  if (threads.length === 0) {
    return (
      <p className="text-text-muted border-border rounded-xl border border-dashed p-8 text-center text-sm">
        {emptyMessage}
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <ul className="space-y-3">
        {threads.map((thread) => (
          <li key={thread.id}>
            <ThreadItem thread={thread} />
          </li>
        ))}
      </ul>
      {page < totalPages && (
        <div className="flex justify-center pt-2">
          <button
            type="button"
            onClick={() => void loadMore()}
            disabled={loadingMore}
            className="border-border text-text hover:bg-surface-elevated cursor-pointer rounded-lg border px-4 py-2 text-sm font-medium disabled:opacity-50"
          >
            {loadingMore ? "Cargando…" : "Ver más"}
          </button>
        </div>
      )}
    </div>
  );
}

export function ThreadItem({ thread }: { thread: ForumThread }) {
  return (
    <Link
      href={`/dashboard/foros/hilo/${thread.id}`}
      className="bg-surface border-border hover:border-primary/40 flex gap-4 rounded-xl border p-4 transition-colors"
    >
      <UserAvatar name={thread.author.name} avatarUrl={thread.author.avatarUrl} className="size-10 shrink-0 text-sm" />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          {thread.isPinned && (
            <span className="bg-primary/10 text-primary inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium">
              <Pin className="size-3" aria-hidden /> Fijado
            </span>
          )}
          {thread.isLocked && (
            <span className="bg-surface-elevated text-text-muted inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium">
              <Lock className="size-3" aria-hidden /> Cerrado
            </span>
          )}
          {thread.solutionPostId && (
            <span className="bg-success-subtle text-success inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium">
              <CheckCircle2 className="size-3" aria-hidden /> Resuelto
            </span>
          )}
          <h3 className="text-text truncate font-semibold">{thread.title}</h3>
        </div>
        <p className="text-text-muted mt-1 text-xs">
          {thread.author.name}
          {thread.author.isCourseInstructor && " · Docente"}
          {thread.course && ` · ${thread.course.title}`}
          {thread.category && ` · ${thread.category.name}`}
          {" · "}
          {formatRelativeTime(thread.lastActivityAt)}
        </p>
      </div>
      <span className="text-text-muted flex shrink-0 items-center gap-1 self-start text-sm tabular-nums">
        <MessageSquare className="size-4" aria-hidden />
        {thread.replyCount}
      </span>
    </Link>
  );
}
