# Tasks: Next.js 15 + tRPC

A small task manager built for the Artefact Software Engineer case. The backend keeps the tasks
**in memory** and exposes them through **tRPC**. The frontend is a Next.js 15 App Router app.
Following the case's advice, it does a few things and does them well.

## Features

- **CRUD over tRPC**: create, list, update and delete tasks (`id`, `titulo`, `descricao`, `dataCriacao`).
- **Validation in two places**: Zod on the server (the source of truth) and the same rule in the form
  for instant feedback. A task cannot be created without a title.
- **Meaningful errors**: an unknown id returns `NOT_FOUND`, invalid input returns `BAD_REQUEST` with
  field errors, and the UI shows both.
- **SSR list**: the first page of tasks is fetched on the server, so the HTML already has the data.
- **Infinite scroll** (bonus): further pages load as you scroll, with a "Load more" fallback button.
- **Feedback**: loading states on buttons, plus success and error banners for delete, create and update.
- **Tests**: Vitest tests for the router (validation, NOT_FOUND, pagination).

## Running

Requires Node 18.18+ (tested with Node 24).

```bash
npm install
npm run dev      # http://localhost:3000
npm test         # router tests
npm run build && npm start   # production build
```

There are no environment variables or secrets. The app starts with 25 fictional sample tasks so the
infinite scroll has something to show.

## How it works

```
Browser ──(React Query hooks)──► /api/trpc/[trpc] ──► appRouter ──► in-memory Map
Server Component (SSR) ──(createCaller, no HTTP)──────► appRouter ──┘
```

| Path | Role |
| --- | --- |
| `src/server/store.ts` | In-memory `Map` kept on `globalThis` plus the seed data |
| `src/server/routers/task.ts` | Procedures: `list`, `byId`, `create`, `update`, `delete`, with Zod validation |
| `src/server/trpc.ts` | tRPC init: superjson transformer and an error formatter that exposes Zod field errors |
| `src/server/caller.ts` | Server-side caller used by Server Components during SSR |
| `src/app/api/trpc/[trpc]/route.ts` | HTTP adapter for the browser |
| `src/trpc/react.tsx` | Typed React hooks plus the QueryClient provider |
| `src/app/page.tsx` | List page: SSR of the first page, then hands off to `TaskList` |
| `src/components/TaskList.tsx` | Infinite query seeded with the SSR data, delete with feedback |
| `src/components/TaskForm.tsx` | Create/edit form (`useState`), client validation, server error display |
| `src/app/tasks/[id]/edit/page.tsx` | Loads the task on the server; an unknown id shows the 404 page |

## Decisions

- **SSR through `createCaller` instead of `fetch`**: during SSR the page calls the router in-process.
  It runs the same validation and errors, without an extra HTTP round-trip to itself.
- **SSR data as `initialData`**: the client infinite query starts from the server page, so there is no
  loading flash and no duplicate request on first render.
- **superjson**: `dataCriacao` stays a `Date` on both sides instead of turning into a string.
- **Store on `globalThis`**: Next.js bundles the API route and the pages separately, and dev hot reload
  re-evaluates modules. A global keeps one single store in both cases.
- **Offset cursor**: simple and enough for an in-memory list. With a database I would use a keyset
  cursor (`dataCriacao` + `id`) so that inserts and deletes between pages do not shift items.
- **No UI library**: plain CSS. The case asks for a simple layout.
- **Dates shown in UTC**: the server and the browser render the same string, which avoids hydration
  mismatches.

## Limitations and next steps

- Data is lost on restart and is **per process**: on serverless or multiple instances each instance
  would have its own list. The next step would be a database (e.g. Postgres + Prisma/Drizzle) behind
  the same router.
- No authentication. In a real app, procedures would go through a `protectedProcedure` middleware that
  checks the session, and rate limiting would be added.
- With more time: optimistic updates on delete, end-to-end tests (Playwright), and toasts instead of
  inline banners.
