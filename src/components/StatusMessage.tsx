export type Status = { kind: "success" | "error"; text: string } | null;

/** Small banner for success / error feedback. `role` makes screen readers announce it. */
export function StatusMessage({ status, onClose }: { status: Status; onClose?: () => void }) {
  if (!status) return null;
  return (
    <div
      className={`status status-${status.kind}`}
      role={status.kind === "error" ? "alert" : "status"}
    >
      <span>{status.text}</span>
      {onClose && (
        <button type="button" className="link" onClick={onClose} aria-label="Dismiss message">
          ×
        </button>
      )}
    </div>
  );
}
