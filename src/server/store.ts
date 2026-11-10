/**
 * In-memory task store.
 *
 * The case asks for no database, so tasks live in a Map. It is attached to
 * `globalThis` for two reasons: Next.js bundles the API route and the pages
 * separately (a plain module variable could exist twice), and hot reload in dev
 * re-evaluates modules on every save. In production the data lives as long as
 * the Node process, per instance.
 */

export type Task = {
  id: string;
  titulo: string;
  descricao?: string;
  dataCriacao: Date;
};

const globalForStore = globalThis as unknown as { taskStore?: Map<string, Task> };

function seed(): Map<string, Task> {
  const map = new Map<string, Task>();
  const now = Date.now();
  // Fictional sample data so the list and the infinite scroll have something to show.
  const samples = [
    "Write project README",
    "Review pull request",
    "Plan sprint backlog",
    "Update dependencies",
    "Fix login redirect bug",
    "Prepare demo for stakeholders",
    "Refactor date helpers",
    "Add unit tests for the router",
    "Design empty state screen",
    "Check accessibility of the form",
  ];
  for (let i = 0; i < 25; i++) {
    const id = crypto.randomUUID();
    map.set(id, {
      id,
      titulo: `${samples[i % samples.length]} #${i + 1}`,
      descricao: i % 3 === 0 ? undefined : "Sample task generated at startup.",
      // One minute apart, so the ordering by creation date is visible.
      dataCriacao: new Date(now - (25 - i) * 60_000),
    });
  }
  return map;
}

export const taskStore: Map<string, Task> = globalForStore.taskStore ?? seed();
globalForStore.taskStore = taskStore;
