import { notFound } from "next/navigation";
import { TRPCError } from "@trpc/server";
import { TaskForm } from "@/components/TaskForm";
import { serverCaller } from "@/server/caller";

export const dynamic = "force-dynamic";

export default async function EditTaskPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  // The task is loaded on the server (SSR); a missing id renders the 404 page.
  const task = await serverCaller.task.byId({ id }).catch((error: unknown) => {
    if (error instanceof TRPCError && error.code === "NOT_FOUND") notFound();
    throw error;
  });

  return (
    <>
      <h1>Edit task</h1>
      <TaskForm task={{ id: task.id, titulo: task.titulo, descricao: task.descricao }} />
    </>
  );
}
