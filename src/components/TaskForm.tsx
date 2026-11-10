"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import type { TRPCClientErrorLike } from "@trpc/client";
import type { AppRouter } from "@/server/routers/_app";
import { trpc } from "@/trpc/react";
import { StatusMessage, type Status } from "./StatusMessage";

type Props = {
  /** When present the form edits this task; otherwise it creates a new one. */
  task?: { id: string; titulo: string; descricao?: string };
};

const TITLE_MAX = 120;

/** Same rules as the backend, checked before sending to give instant feedback. */
function validate(titulo: string): string | null {
  if (!titulo.trim()) return "Title is required";
  if (titulo.trim().length > TITLE_MAX) return `Title must be at most ${TITLE_MAX} characters`;
  return null;
}

export function TaskForm({ task }: Props) {
  const router = useRouter();
  const utils = trpc.useUtils();
  const isEdit = Boolean(task);

  const [titulo, setTitulo] = useState(task?.titulo ?? "");
  const [descricao, setDescricao] = useState(task?.descricao ?? "");
  const [titleError, setTitleError] = useState<string | null>(null);
  const [status, setStatus] = useState<Status>(null);

  const onSuccess = async () => {
    await utils.task.invalidate();
    router.push(`/?status=${isEdit ? "updated" : "created"}`);
  };
  const onError = (error: TRPCClientErrorLike<AppRouter>) => {
    // Field errors from the backend validation go next to the field; the rest go to the banner.
    const serverTitleError = error.data?.zodError?.fieldErrors.titulo?.[0];
    if (serverTitleError) setTitleError(serverTitleError);
    setStatus({ kind: "error", text: serverTitleError ? "Please fix the errors below." : error.message });
  };

  const create = trpc.task.create.useMutation({ onSuccess, onError });
  const update = trpc.task.update.useMutation({ onSuccess, onError });
  const isSaving = create.isPending || update.isPending;

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setStatus(null);
    const error = validate(titulo);
    setTitleError(error);
    if (error) return; // Do not send an invalid form.

    const data = { titulo, descricao };
    if (task) update.mutate({ id: task.id, ...data });
    else create.mutate(data);
  }

  return (
    <form className="form" onSubmit={handleSubmit} noValidate>
      <StatusMessage status={status} />

      <div className="field">
        <label htmlFor="titulo">Title *</label>
        <input
          id="titulo"
          value={titulo}
          maxLength={TITLE_MAX + 20}
          aria-invalid={Boolean(titleError)}
          aria-describedby={titleError ? "titulo-error" : undefined}
          onChange={(e) => {
            setTitulo(e.target.value);
            if (titleError) setTitleError(validate(e.target.value));
          }}
          autoFocus
        />
        {titleError && (
          <span id="titulo-error" className="field-error">
            {titleError}
          </span>
        )}
      </div>

      <div className="field">
        <label htmlFor="descricao">Description</label>
        <textarea
          id="descricao"
          rows={4}
          value={descricao}
          onChange={(e) => setDescricao(e.target.value)}
        />
      </div>

      <div className="actions">
        <button type="submit" disabled={isSaving}>
          {isSaving ? "Saving…" : isEdit ? "Save changes" : "Create task"}
        </button>
        <Link href="/" className="button button-secondary">
          Cancel
        </Link>
      </div>
    </form>
  );
}
