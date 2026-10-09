"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import {
  CheckCircle2,
  Loader2,
  Lock,
  Pencil,
  Pin,
  PinOff,
  Trash2,
  Undo2,
} from "lucide-react";

import ConfirmDialog from "@/components/ui/ConfirmDialog";
import UserAvatar from "@/components/ui/UserAvatar";
import MarkdownRenderer from "@/components/lesson-player/MarkdownRenderer";
import { formatRelativeTime } from "@/lib/chat-utils";
import { useAuth } from "@/components/auth/AuthProvider";
import PostComposer from "@/components/forum/PostComposer";
import PostEditor from "@/components/forum/PostEditor";
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
  updatePost,
  updateThread,
  POST_BODY_MAX,
  THREAD_BODY_MAX,
  type ForumPost,
  type ForumThreadDetail,
} from "@/services/forums/forums.service";
import { joinThreadRoom, leaveThreadRoom, onThreadChanged } from "@/services/forums/forum.socket";

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
  /* Paginación: el back manda de a 20 y antes acá se pedía SIEMPRE la página 1
     y nada más, así que en un hilo con más de 20 respuestas las siguientes no
     se veían nunca (ni la propia recién escrita). `loadedPages` recuerda hasta
     dónde se cargó para poder recargar lo mismo después de editar o borrar. */
  const [loadedPages, setLoadedPages] = useState(1);
  const [totalPosts, setTotalPosts] = useState(0);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [editing, setEditing] = useState<{ kind: "thread" } | { kind: "post"; id: string } | null>(null);

  const refreshThread = useCallback(async () => {
    setThread(await getThread(threadId));
  }, [threadId]);

  /** Recarga todas las páginas que ya estaban a la vista, sin perder el lugar. */
  const refreshPosts = useCallback(async () => {
    const pages = await Promise.all(
      Array.from({ length: loadedPages }, (_, index) => listPosts(threadId, index + 1)),
    );
    setPosts(pages.flatMap((page) => page.data));
    setTotalPosts(pages[pages.length - 1]?.meta.total ?? 0);
  }, [threadId, loadedPages]);

  async function loadMore() {
    setIsLoadingMore(true);
    setActionError(null);
    try {
      const next = loadedPages + 1;
      const page = await listPosts(threadId, next);
      setPosts((current) => {
        const seen = new Set(current.map((post) => post.id));
        return [...current, ...page.data.filter((post) => !seen.has(post.id))];
      });
      setTotalPosts(page.meta.total);
      setLoadedPages(next);
    } catch (caught) {
      setActionError(forumErrorMessage(caught, "No pudimos cargar más respuestas."));
    } finally {
      setIsLoadingMore(false);
    }
  }

  useEffect(() => {
    let cancelled = false;
    Promise.all([getThread(threadId), listPosts(threadId, 1)])
      .then(([detail, page]) => {
        if (cancelled) return;
        setThread(detail);
        setPosts(page.data);
        setTotalPosts(page.meta.total);
        // Volver a la primera página: cambiar de hilo reinicia la paginación.
        setLoadedPages(1);
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

  /* Refresco en vivo: mientras el hilo está abierto, cualquier cambio (una
     respuesta nueva, una edición, un borrado, fijar/cerrar, marcar solución)
     en cualquier sesión llega acá por WebSocket y recarga desde el REST —
     el socket sólo avisa "cambió", nunca manda el contenido. */
  useEffect(() => {
    joinThreadRoom(threadId);
    const unsubscribe = onThreadChanged((payload) => {
      if (payload.threadId !== threadId) return;
      void refreshThread();
      void refreshPosts();
    });
    return () => {
      unsubscribe();
      leaveThreadRoom(threadId);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
  const backLabel = thread.course ? thread.course.title : "Foros generales";
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
        <AuthorLine author={thread.author} date={thread.createdAt} edited={!!thread.updatedAt && thread.updatedAt !== thread.createdAt} />

        {editing?.kind === "thread" ? (
          <PostEditor
            initialBody={thread.body}
            maxLength={THREAD_BODY_MAX}
            label="Editar el mensaje del hilo"
            onCancel={() => setEditing(null)}
            onSave={async (body) => {
              await updateThread(threadId, { body });
              await refreshThread();
              setEditing(null);
            }}
          />
        ) : (
          /* Markdown en vez de texto plano: en un foro de programación se pega
             código y stack traces constantemente, y con `whitespace-pre-line`
             quedaban ilegibles. Es el mismo renderer de las lecciones, que no
             inyecta HTML y filtra los href (ver `safeHref`) — importante acá,
             donde el texto lo escribe cualquier alumno. */
          <div className="text-text-secondary leading-relaxed">
            <MarkdownRenderer markdown={thread.body} />
          </div>
        )}

        {permissions.canModerate && (
          <div className="border-border flex flex-wrap gap-2 border-t pt-4">
            <ActionButton
              onClick={() => void runAction(() => moderateThread(threadId, { isPinned: !thread.isPinned }), "No pudimos fijar el hilo.")}
            >
              {thread.isPinned ? <PinOff className="size-4" aria-hidden /> : <Pin className="size-4" aria-hidden />}
              {thread.isPinned ? "Quitar fijado" : "Fijar hilo"}
            </ActionButton>
            {/* Cerrar es definitivo: una vez cerrado no se puede reabrir (el back
                también lo rechaza), así que el botón desaparece. */}
            {!thread.isLocked && (
              <ActionButton
                onClick={() => void runAction(() => moderateThread(threadId, { isLocked: true }), "No pudimos cerrar el hilo.")}
              >
                <Lock className="size-4" aria-hidden />
                Cerrar hilo
              </ActionButton>
            )}
          </div>
        )}

        {permissions.canEdit && !editing && (
          <div className="flex flex-wrap gap-2">
            <ActionButton onClick={() => setEditing({ kind: "thread" })}>
              <Pencil className="size-4" aria-hidden /> Editar
            </ActionButton>
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
          // Editar una respuesta: su autor o un moderador (lo mismo que el back).
          const canEditPost = isOwn || permissions.canModerate;
          const isEditing = editing?.kind === "post" && editing.id === post.id;
          return (
            <div
              key={post.id}
              className={`bg-surface rounded-xl border p-4 ${post.isSolution ? "border-success/40" : "border-border"}`}
            >
              <div className="flex flex-wrap items-center gap-2">
                <AuthorLine author={post.author} date={post.createdAt} edited={!!post.editedAt} />
                {post.isSolution && <Badge tone="success">Solución</Badge>}
              </div>

              {isEditing ? (
                <PostEditor
                  initialBody={post.body}
                  maxLength={POST_BODY_MAX}
                  label="Editar la respuesta"
                  onCancel={() => setEditing(null)}
                  onSave={async (body) => {
                    await updatePost(post.id, body);
                    await refreshPosts();
                    setEditing(null);
                  }}
                />
              ) : (
                <div className="text-text-secondary mt-3 leading-relaxed">
                  <MarkdownRenderer markdown={post.body} />
                </div>
              )}

              {!isEditing && (permissions.canEdit || canDelete || canEditPost) && (
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
                  {canEditPost && (
                    <ActionButton onClick={() => setEditing({ kind: "post", id: post.id })}>
                      <Pencil className="size-4" aria-hidden /> Editar
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

        {posts.length < totalPosts && (
          <button
            type="button"
            onClick={() => void loadMore()}
            disabled={isLoadingMore}
            className="border-border text-text-secondary hover:bg-surface-elevated flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed py-3 text-sm disabled:cursor-not-allowed"
          >
            {isLoadingMore && <Loader2 className="size-4 animate-spin" aria-hidden />}
            Ver {totalPosts - posts.length} {totalPosts - posts.length === 1 ? "respuesta más" : "respuestas más"}
          </button>
        )}
      </section>

      {permissions.canReply ? (
        <PostComposer
          onSubmit={async (body) => {
            await createPost(threadId, body);
            /* Tu respuesta va al final del hilo: si quedó en una página que
               todavía no se cargó, no la verías. Traemos todo hasta la última. */
            const created = await listPosts(threadId, 1);
            const lastPage = Math.max(1, created.meta.totalPages);
            const pages = await Promise.all(
              Array.from({ length: lastPage }, (_, index) => listPosts(threadId, index + 1)),
            );
            setPosts(pages.flatMap((page) => page.data));
            setTotalPosts(created.meta.total);
            setLoadedPages(lastPage);
            await refreshThread();
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
