import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { publicProcedure, router } from "../trpc";
import { taskStore, type Task } from "../store";

// Shared validation: the same rules apply to create and update.
const titulo = z
  .string({ required_error: "Title is required" })
  .trim()
  .min(1, "Title is required")
  .max(120, "Title must be at most 120 characters");

const descricao = z
  .string()
  .trim()
  .max(1000, "Description must be at most 1000 characters")
  .optional()
  // An empty description is stored as "no description".
  .transform((value) => (value ? value : undefined));

const id = z.string().min(1);

function getOrThrow(taskId: string): Task {
  const task = taskStore.get(taskId);
  if (!task) {
    throw new TRPCError({ code: "NOT_FOUND", message: `Task ${taskId} not found` });
  }
  return task;
}

export const taskRouter = router({
  /**
   * Paginated list, newest first.
   * The cursor is the offset of the next page. That is enough for an in-memory
   * list; with a real database I would use a keyset cursor (dataCriacao + id)
   * so that inserts and deletes between pages cannot shift items.
   */
  list: publicProcedure
    .input(
      z
        .object({
          cursor: z.number().int().min(0).nullish(),
          limit: z.number().int().min(1).max(50).default(10),
        })
        .default({}),
    )
    .query(({ input }) => {
      const start = input.cursor ?? 0;
      const all = [...taskStore.values()].sort(
        (a, b) => b.dataCriacao.getTime() - a.dataCriacao.getTime(),
      );
      const items = all.slice(start, start + input.limit);
      const next = start + items.length;
      return {
        items,
        nextCursor: next < all.length ? next : null,
        total: all.length,
      };
    }),

  byId: publicProcedure.input(z.object({ id })).query(({ input }) => getOrThrow(input.id)),

  create: publicProcedure
    .input(z.object({ titulo, descricao }))
    .mutation(({ input }) => {
      const task: Task = {
        id: crypto.randomUUID(),
        titulo: input.titulo,
        descricao: input.descricao,
        dataCriacao: new Date(),
      };
      taskStore.set(task.id, task);
      return task;
    }),

  update: publicProcedure
    .input(z.object({ id, titulo, descricao }))
    .mutation(({ input }) => {
      const current = getOrThrow(input.id);
      // dataCriacao is never changed by an update.
      const updated: Task = { ...current, titulo: input.titulo, descricao: input.descricao };
      taskStore.set(updated.id, updated);
      return updated;
    }),

  delete: publicProcedure.input(z.object({ id })).mutation(({ input }) => {
    const task = getOrThrow(input.id);
    taskStore.delete(task.id);
    return { id: task.id };
  }),
});
