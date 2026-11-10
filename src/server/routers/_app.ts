import { router } from "../trpc";
import { taskRouter } from "./task";

export const appRouter = router({
  task: taskRouter,
});

// Only the *type* is shared with the client: no server code ends up in the bundle.
export type AppRouter = typeof appRouter;
