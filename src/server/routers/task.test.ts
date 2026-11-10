import { beforeEach, describe, expect, it } from "vitest";
import { TRPCError } from "@trpc/server";
import { createCallerFactory } from "../trpc";
import { appRouter } from "./_app";
import { taskStore } from "../store";

const caller = createCallerFactory(appRouter)({});

describe("task router", () => {
  beforeEach(() => taskStore.clear());

  it("creates a task with id and creation date", async () => {
    const task = await caller.task.create({ titulo: "  Buy coffee  ", descricao: "" });
    expect(task.id).toBeTruthy();
    expect(task.titulo).toBe("Buy coffee");
    expect(task.descricao).toBeUndefined();
    expect(task.dataCriacao).toBeInstanceOf(Date);
  });

  it("rejects a task without title", async () => {
    await expect(caller.task.create({ titulo: "   " })).rejects.toMatchObject({
      code: "BAD_REQUEST",
    });
    expect(taskStore.size).toBe(0);
  });

  it("updates a task and keeps its creation date", async () => {
    const task = await caller.task.create({ titulo: "Old" });
    const updated = await caller.task.update({ id: task.id, titulo: "New", descricao: "Details" });
    expect(updated).toMatchObject({ id: task.id, titulo: "New", descricao: "Details" });
    expect(updated.dataCriacao).toEqual(task.dataCriacao);
  });

  it("returns NOT_FOUND when updating or deleting a missing task", async () => {
    const update = caller.task.update({ id: "missing", titulo: "x" });
    await expect(update).rejects.toBeInstanceOf(TRPCError);
    await expect(update).rejects.toMatchObject({ code: "NOT_FOUND" });
    await expect(caller.task.delete({ id: "missing" })).rejects.toMatchObject({
      code: "NOT_FOUND",
    });
  });

  it("deletes a task", async () => {
    const task = await caller.task.create({ titulo: "Temp" });
    await caller.task.delete({ id: task.id });
    expect(taskStore.has(task.id)).toBe(false);
  });

  it("paginates newest first with a cursor", async () => {
    for (let i = 0; i < 5; i++) {
      taskStore.set(`t${i}`, { id: `t${i}`, titulo: `Task ${i}`, dataCriacao: new Date(i * 1000) });
    }
    const first = await caller.task.list({ limit: 2 });
    expect(first.items.map((t) => t.id)).toEqual(["t4", "t3"]);
    expect(first.nextCursor).toBe(2);

    const last = await caller.task.list({ limit: 2, cursor: 4 });
    expect(last.items.map((t) => t.id)).toEqual(["t0"]);
    expect(last.nextCursor).toBeNull();
    expect(last.total).toBe(5);
  });
});
