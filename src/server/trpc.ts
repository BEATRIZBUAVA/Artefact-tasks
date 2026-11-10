import { initTRPC } from "@trpc/server";
import superjson from "superjson";
import { ZodError } from "zod";

/**
 * tRPC initialisation.
 *
 * - superjson lets `Date` (dataCriacao) travel over the wire as a real Date
 *   instead of a string, so client and server share the exact same types.
 * - The error formatter adds the flattened Zod errors to the response so the
 *   form can show field-level messages coming from the backend.
 */
const t = initTRPC.create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError:
          error.code === "BAD_REQUEST" && error.cause instanceof ZodError
            ? error.cause.flatten()
            : null,
      },
    };
  },
});

export const router = t.router;
export const publicProcedure = t.procedure;
export const createCallerFactory = t.createCallerFactory;
