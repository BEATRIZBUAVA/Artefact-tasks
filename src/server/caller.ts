import "server-only";
import { createCallerFactory } from "./trpc";
import { appRouter } from "./routers/_app";

/**
 * Server-side caller used by Server Components.
 * During SSR the page calls the router directly (same validation, same errors)
 * instead of making an HTTP request to its own API.
 */
export const serverCaller = createCallerFactory(appRouter)({});
