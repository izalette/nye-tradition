"use client";

import { useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useCreateEventFormState } from "@/app/form-action-state-hooks";

type Props = {
  baseUrl: string;
  /** When true, no outer card or title (e.g. modal body). */
  embedded?: boolean;
  /** Right-align submit and spacing for dialog layout. */
  modal?: boolean;
  /** Called after a successful create (e.g. close modal). */
  onSuccess?: () => void;
};

export function CreateEventForm({
  baseUrl,
  embedded = false,
  modal = false,
  onSuccess,
}: Props) {
  const [state, action, pending] = useCreateEventFormState();
  const router = useRouter();

  useEffect(() => {
    if (state?.ok) {
      router.refresh();
      onSuccess?.();
    }
  }, [state?.ok, router, onSuccess]);

  const joinLink = useMemo(() => {
    if (state?.ok) {
      return `${baseUrl}/e/${state.slug}/join`;
    }
    return null;
  }, [state, baseUrl]);

  const titleId = modal ? "admin-create-event-title-input" : "title";

  return (
    <form
      className={
        embedded
          ? modal
            ? "admin-embedded-form admin-create-event-form-modal"
            : "admin-embedded-form"
          : "card admin-form-card"
      }
      action={action}
    >
      {!embedded ? (
        <p className="admin-draw-heading" style={{ marginTop: 0, marginBottom: "0.35rem" }}>
          Create an event
        </p>
      ) : null}
      {embedded && modal ? (
        <p className="muted" style={{ marginTop: 0, marginBottom: "1rem" }}>
          Name it, switch on pop quiz if you want fun facts, then paste the join link in the Group.
        </p>
      ) : null}
      <label htmlFor={titleId}>Event title</label>
      <input
        id={titleId}
        name="title"
        type="text"
        placeholder="NYE 2026"
        required
        autoComplete="off"
        autoFocus={modal}
      />

      <label
        className="admin-checkbox-label"
        style={{ marginTop: "1rem", display: "flex", gap: "0.5rem", alignItems: "flex-start" }}
      >
        <input
          id={modal ? "admin-create-pop-quiz" : "pop_quiz_enabled"}
          name="pop_quiz_enabled"
          type="checkbox"
          value="1"
          style={{ marginTop: "0.2rem" }}
        />
        <span>
          <strong>Fun fact</strong> — everyone adds one on join (&quot;how well do you know the
          Group?&quot;); the host reads them aloud and people submit guesses on their private page
          (answers after submit).
        </span>
      </label>

      {state && !state.ok && <div className="error">{state.error}</div>}
      {joinLink && (
        <div className="muted" style={{ marginTop: "1rem" }}>
          <strong>Join link</strong> — paste it in the WhatsApp Group.
          <br />
          <code>{joinLink}</code>
        </div>
      )}

      {modal ? (
        <div className="admin-create-event-form-actions">
          <button type="submit" disabled={pending}>
            {pending ? "Creating…" : "Create"}
          </button>
        </div>
      ) : (
        <button type="submit" disabled={pending}>
          {pending ? "Creating…" : "Create"}
        </button>
      )}
    </form>
  );
}
