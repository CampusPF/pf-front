"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { CheckCircle2, Lock, LockOpen, Pin, PinOff, Trash2, Undo2 } from "lucide-react";

import ConfirmDialog from "@/components/ui/ConfirmDialog";
import UserAvatar from "@/components/ui/UserAvatar";
import { formatRelativeTime } from "@/lib/chat-utils";
import { useAuth } from "@/components/auth/AuthProvider";
import PostComposer from "@/components/forum/PostComposer";
import {
  clearThreadSolution,
  createPost,
  deletePost,
  deleteThread,
  forumErrorMessage,
  getThread,
  listPosts,
  moderateThread,
  setThreadSolution,
  type ForumPost,
  type ForumThreadDetail,
} from "@/services/forums/forums.service";

type Pending = { kind: "thread" } | { kind: "post"; post: ForumPost } | null;

/* Hilo completo: encabezado, respuestas y acciones según los permisos que manda
   el back (`permissions` y `author.id`). La UI no decide permisos por su cuenta:
   sólo muestra lo que el back habilita. */
export default function ThreadView({ threadId }: { threadId: string }) {
  const { user } = useAuth();
  const [thread, setThread] = useState<ForumThreadDetail | null>(null);
  const [posts, setPosts] = useState<ForumPost[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [pending, setPending] = useState<Pending>(null);
  const [isConfirming, setIsConfirming] = useState(false);
  const [deleted, setDeleted] = useState(false);

  const refreshThread = useCallback(async () => {
    setThread(await getThread(threadId));
  }, [threadId]);

  const refreshPosts = useCallback(async () => {
    const result = await listPosts(threadId, 1);
    setPosts(result.data);
  }, [threadId]);

  useEffect(() => {
    let cancelled = false;
    Promise.all([getThread(threadId), listPosts(threadId, 1)])
      .then(([detail, page]) => {
        if (cancelled) return;
        setThread(detail);
        setPosts(page.data);
        setStatus("ready");
      })
      .catch((caught: unknown) => {
        if (cancelled) return;
        setError(forumErrorMessage(caught, "No pudimos abrir este hilo."));
        setStatus("error");
      });
    return () => {
      cancelled = true;
    };
  }, [threadId]);

  async function runAction(action: () => Promise<unknown>, fallback: string) {
    setActionError(null);
    try {
      await action();
      await Promise.all([refreshThread(), refreshPosts()]);
    } catch (caught) {
      setActionError(forumErrorMessage(caught, fallback));
    }
  }

  async function confirmPending() {
    if (!pending) return;
    setIsConfirming(true);
    try {
      if (pending.kind === "thread") {
        await deleteThread(threadId);
        setDeleted(true);
      } else {
        await deletePost(pending.post.id);
        await Promise.all([refreshThread(), refreshPosts()]);
      }
      setPending(null);
    } catch (caught) {
      setActionError(forumErrorMessage(caught, "No pudimos borrar."));
      setPending(null);
    } finally {
      setIsConfirming(false);
    }
  }

  if (status === "loading") {
    return <div className="bg-surface-elevated h-48 animate-pulse rounded-xl" aria-busy="true" />;
  }

  if (status === "error" || !thread) {
    return (
      <p role="alert" className="bg-danger-subtle text-danger rounded-lg px-3 py-2 text-sm">
        {error ?? "No pudimos abrir este hilo."}
      </p>
    );
  }

  if (deleted) {
    return (
      <div className="border-border text-text-muted rounded-xl border border-dashed p-8 text-center text-sm">
        El hilo fue borrado.{" "}
        <Link href="/dashboard/foros" className="text-primary underline">
          Volver a Foros
        </Link>
      </div>
    );
  }

  const backHref = thread.course ? `/courses/${thread.course.slug}` : "/dashboard/foros/general";
  const backLabel = thread.course ? thread.course.title : "Foro general";
  const { permissions } = thread;

  return (
    <div className="space-y-6">
      <Link href={backHref} className="text-text-muted hover:text-text text-sm">
        ← {backLabel}
      </Link>

      <article className="bg-surface border-border space-y-4 rounded-xl border p-5">
        <div className="flex flex-wrap items-center gap-2">
          {thread.isPinned && <Badge tone="primary">Fijado</Badge>}
          {thread.isLocked && <Badge tone="muted">Cerrado</Badge>}
          {thread.solutionPostId && <Badge tone="success">Resuelto</Badge>}
        </div>
        <h1 className="text-text text-xl font-bold md:text-2xl">{thread.title}</h1>
        <AuthorLine author={thread.author} date={thread.createdAt} />
        <p className="text-text-secondary leading-relaxed whitespace-pre-line">{thread.body}</p>

        {permissions.canModerate && (
          <div className="border-border flex flex-wrap gap-2 border-t pt-4">
            <ActionButton
              onClick={() => void runAction(() => moderateThread(threadId, { isPinned: !thread.isPinned }), "No pudimos fijar el hilo.")}
            >
              {thread.isPinned ? <PinOff className="size-4" aria-hidden /> : <Pin className="size-4" aria-hidden />}
              {thread.isPinned ? "Quitar fijado" : "Fijar hilo"}
            </ActionButton>
            <ActionButton
              onClick={() => void runAction(() => moderateThread(threadId, { isLocked: !thread.isLocked }), "No pudimos cerrar el hilo.")}
            >
              {thread.isLocked ? <LockOpen className="size-4" aria-hidden /> : <Lock className="size-4" aria-hidden />}
              {thread.isLocked ? "Reabrir hilo" : "Cerrar hilo"}
            </ActionButton>
          </div>
        )}

        {permissions.canEdit && (
          <div className="flex flex-wrap gap-2">
            <ActionButton danger onClick={() => setPending({ kind: "thread" })}>
              <Trash2 className="size-4" aria-hidden /> Borrar hilo
            </ActionButton>
          </div>
        )}
      </article>

      {actionError && (
        <p role="alert" className="bg-danger-subtle text-danger rounded-lg px-3 py-2 text-sm">
          {actionError}
        </p>
      )}

      <section aria-label="Respuestas" className="space-y-3">
        <h2 className="text-text text-sm font-semibold tabular-nums">
          {thread.replyCount} {thread.replyCount === 1 ? "respuesta" : "respuestas"}
        </h2>

        {posts.map((post) => {
          const isOwn = post.author.id === user?.id;
          const canDelete = isOwn || permissions.canModerate;
          return (
            <div
              key={post.id}
              className={`bg-surface rounded-xl border p-4 ${post.isSolution ? "border-success/40" : "border-border"}`}
            >
              <div className="flex flex-wrap items-center gap-2">
                <AuthorLine author={post.author} date={post.createdAt} edited={!!post.editedAt} />
                {post.isSolution && <Badge tone="success">Solución</Badge>}
              </div>
              <p className="text-text-secondary mt-3 leading-relaxed whitespace-pre-line">{post.body}</p>
              {(permissions.canEdit || canDelete) && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {permissions.canEdit && !post.isSolution && (
                    <ActionButton onClick={() => void runAction(() => setThreadSolution(threadId, post.id), "No pudimos marcar la solución.")}>
                      <CheckCircle2 className="size-4" aria-hidden /> Marcar como solución
                    </ActionButton>
                  )}
                  {permissions.canEdit && post.isSolution && (
                    <ActionButton onClick={() => void runAction(() => clearThreadSolution(threadId), "No pudimos quitar la solución.")}>
                      <Undo2 className="size-4" aria-hidden /> Quitar solución
                    </ActionButton>
                  )}
                  {canDelete && (
                    <ActionButton danger onClick={() => setPending({ kind: "post", post })}>
                      <Trash2 className="size-4" aria-hidden /> Borrar
                    </ActionButton>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </section>

      {permissions.canReply ? (
        <PostComposer
          onSubmit={async (body) => {
            await createPost(threadId, body);
            await Promise.all([refreshThread(), refreshPosts()]);
          }}
        />
      ) : (
        <p className="text-text-muted border-border rounded-xl border border-dashed p-4 text-center text-sm">
          Este hilo está cerrado y ya no admite respuestas.
        </p>
      )}

      <ConfirmDialog
        open={pending !== null}
        variant="danger"
        title={pending?.kind === "thread" ? "¿Borrar el hilo?" : "¿Borrar la respuesta?"}
        description="Esta acción no se puede deshacer."
        confirmLabel="Borrar"
        isPending={isConfirming}
        onConfirm={() => void confirmPending()}
        onCancel={() => setPending(null)}
      />
    </div>
  );
}

function AuthorLine({
  author,
  date,
  edited = false,
}: {
  author: ForumPost["author"];
  date: string;
  edited?: boolean;
}) {
  return (
    <div className="flex items-center gap-2.5">
      <UserAvatar name={author.name} avatarUrl={author.avatarUrl} className="size-8 text-xs" />
      <p className="text-text-muted text-sm">
        <span className="text-text font-medium">{author.name}</span>
        {author.isCourseInstructor && <span className="text-primary ml-1.5 text-xs font-medium">Docente</span>}
        {author.role === "admin" && <span className="text-primary ml-1.5 text-xs font-medium">Admin</span>}
        {" · "}
        {formatRelativeTime(date)}
        {edited && " · editado"}
      </p>
    </div>
  );
}

function Badge({ tone, children }: { tone: "primary" | "muted" | "success"; children: React.ReactNode }) {
  const styles = {
    primary: "bg-primary/10 text-primary",
    muted: "bg-surface-elevated text-text-muted",
    success: "bg-success-subtle text-success",
  }[tone];
  return <span className={`${styles} rounded-md px-2 py-0.5 text-xs font-medium`}>{children}</span>;
}

function ActionButton({
  onClick,
  danger = false,
  children,
}: {
  onClick: () => void;
  danger?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex cursor-pointer items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors ${
        danger
          ? "border-danger/30 text-danger hover:bg-danger-subtle"
          : "border-border text-text hover:bg-surface-elevated"
      }`}
    >
      {children}
    </button>
  );
}
