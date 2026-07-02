import { useEffect } from "react";

// Application-wide deletion/confirmation dialog. Renders an in-app modal (never a
// native `confirm()`), and always shows the name/title of the thing being acted on,
// truncated with an ellipsis when long. Reused verbatim by every deletion UX in the
// app (Place delete, Room delete, ...): render it controlled by an `open` flag and
// wire `onConfirm`/`onCancel`. The trigger button stays page-specific; this component
// owns the confirmation surface and its testids.
//
// Testids (stable across reuse):
//   confirm-dialog          — the dialog container (role="dialog")
//   confirm-dialog-message  — the message line, includes the truncated name
//   confirm-dialog-confirm  — confirm button
//   confirm-dialog-cancel   — cancel button
//   confirm-dialog-error    — error text (only when `error` is set)

const MAX_NAME_LENGTH = 80;

// Truncate long names to a single ellipsised line so the confirmation stays readable.
function truncateName(name: string, max: number = MAX_NAME_LENGTH): string {
  const trimmed = name.trim();
  if (trimmed.length <= max) return trimmed;
  return `${trimmed.slice(0, max - 1).trimEnd()}…`;
}

export function ConfirmDialog({
  open,
  heading,
  itemName,
  body,
  confirmLabel = "Delete",
  cancelLabel = "Cancel",
  busy = false,
  error = "",
  onConfirm,
  onCancel,
}: {
  open: boolean;
  heading: string;
  itemName: string;
  body?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  busy?: boolean;
  error?: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  // Escape cancels, unless a request is in flight.
  useEffect(() => {
    if (!open) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !busy) onCancel();
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, busy, onCancel]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
      onClick={() => {
        if (!busy) onCancel();
      }}
    >
      <div
        aria-labelledby="confirm-dialog-heading"
        aria-modal="true"
        className="w-full max-w-md border border-[#deded8] bg-white p-6 shadow-xl"
        data-testid="confirm-dialog"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
      >
        <h2
          className="text-xl font-semibold text-[#111113]"
          id="confirm-dialog-heading"
        >
          {heading}
        </h2>

        <p
          className="mt-3 break-words text-sm text-[#4f4f4a]"
          data-testid="confirm-dialog-message"
        >
          {body ? `${body} ` : ""}
          <span className="font-semibold text-[#171719]">
            {truncateName(itemName)}
          </span>
          ? This cannot be undone.
        </p>

        {error && (
          <p
            className="mt-4 border border-[#e4e4de] bg-[#fafaf8] px-3 py-2 text-sm text-[#9a2d2d]"
            data-testid="confirm-dialog-error"
            role="alert"
          >
            {error}
          </p>
        )}

        <div className="mt-6 flex justify-end gap-2">
          <button
            className="inline-flex h-11 items-center border border-[#d8d8d2] bg-white px-5 text-sm font-semibold text-[#3f3f3a] transition hover:border-[#b9b9b1] hover:text-[#18181a] disabled:cursor-not-allowed disabled:opacity-60"
            data-testid="confirm-dialog-cancel"
            disabled={busy}
            onClick={onCancel}
            type="button"
          >
            {cancelLabel}
          </button>
          <button
            className="inline-flex h-11 items-center border border-[#c4423a] bg-[#a4423a] px-5 text-sm font-semibold text-white transition hover:bg-[#8f3630] disabled:cursor-not-allowed disabled:opacity-60"
            data-testid="confirm-dialog-confirm"
            disabled={busy}
            onClick={onConfirm}
            type="button"
          >
            {busy ? "Deleting..." : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
