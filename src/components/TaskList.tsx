"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { inferRouterOutputs } from "@trpc/server";
import type { AppRouter } from "@/server/routers/_app";
import { trpc } from "@/trpc/react";
import { StatusMessage, type Status } from "./StatusMessage";

type ListPage = inferRouterOutputs<AppRouter>["task"]["list"];

// Fixed time zone so the date rendered on the server matches the one on the client
// (otherwise React reports a hydration mismatch).
const dateFormat = new Intl.DateTimeFormat("en-GB", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "UTC",
});

export function TaskList({
  initialPage,
  pageSize,
  initialMessage,
}: {
  initialPage: ListPage;
  pageSize: number;
  initialMessage?: string;
}) {
  const utils = trpc.useUtils();
  const [status, setStatus] = useState<Status>(
    initialMessage ? { kind: "success", text: initialMessage } : null,
  );
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Infinite query seeded with the SSR page: no loading flash on first render.
  const query = trpc.task.list.useInfiniteQuery(
    { limit: pageSize },
    {
      getNextPageParam: (lastPage) => lastPage.nextCursor,
      initialData: { pages: [initialPage], pageParams: [null] },
    },
  );

  const deleteTask = trpc.task.delete.useMutation({
    onMutate: ({ id }) => setDeletingId(id),
    onSuccess: () => setStatus({ kind: "success", text: "Task deleted." }),
    onError: (error) => setStatus({ kind: "error", text: `Could not delete: ${error.message}` }),
    onSettled: async () => {
      setDeletingId(null);
      await utils.task.list.invalidate();
    },
  });

  // Infinite scroll: when the sentinel at the bottom becomes visible, load the next page.
  const sentinelRef = useRef<HTMLDivElement>(null);
  const { hasNextPage, isFetchingNextPage, fetchNextPage } = query;
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el || !hasNextPage) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !isFetchingNextPage) void fetchNextPage();
      },
      { rootMargin: "200px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const tasks = query.data?.pages.flatMap((page) => page.items) ?? [];
  const total = query.data?.pages.at(-1)?.total ?? 0;

  return (
    <>
      <StatusMessage status={status} onClose={() => setStatus(null)} />

      {tasks.length === 0 ? (
        <p className="center">
          No tasks yet. <Link href="/tasks/new">Create the first one</Link>.
        </p>
      ) : (
        <>
          <p className="meta">
            Showing {tasks.length} of {total}
          </p>
          <ul className="task-list">
            {tasks.map((task) => (
              <li key={task.id} className="task">
                <div>
                  <h2>{task.titulo}</h2>
                  {task.descricao && <p>{task.descricao}</p>}
                  <p className="meta">Created {dateFormat.format(task.dataCriacao)} UTC</p>
                </div>
                <div className="actions">
                  <Link href={`/tasks/${task.id}/edit`} className="button button-secondary">
                    Edit
                  </Link>
                  <button
                    type="button"
                    className="button-danger"
                    disabled={deletingId === task.id}
                    onClick={() => deleteTask.mutate({ id: task.id })}
                  >
                    {deletingId === task.id ? "Deleting…" : "Delete"}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </>
      )}

      <div ref={sentinelRef} />
      {isFetchingNextPage && <p className="center">Loading more…</p>}
      {query.isError && (
        <StatusMessage status={{ kind: "error", text: `Could not load tasks: ${query.error.message}` }} />
      )}
      {/* Fallback for when the observer does not fire (e.g. very tall screens). */}
      {hasNextPage && !isFetchingNextPage && (
        <p className="center">
          <button type="button" className="button-secondary" onClick={() => void fetchNextPage()}>
            Load more
          </button>
        </p>
      )}
    </>
  );
}
