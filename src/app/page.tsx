import { TaskList } from "@/components/TaskList";
import { serverCaller } from "@/server/caller";

// The task list changes at runtime, so this page must be rendered on every request (SSR),
// never prerendered at build time.
export const dynamic = "force-dynamic";

const PAGE_SIZE = 10;

const messages: Record<string, string> = {
  created: "Task created.",
  updated: "Task updated.",
};

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  // SSR: the first page is fetched on the server, so the HTML already contains the tasks.
  const firstPage = await serverCaller.task.list({ limit: PAGE_SIZE });

  return (
    <>
      <h1>Tasks</h1>
      <TaskList
        initialPage={firstPage}
        pageSize={PAGE_SIZE}
        initialMessage={status ? messages[status] : undefined}
      />
    </>
  );
}
