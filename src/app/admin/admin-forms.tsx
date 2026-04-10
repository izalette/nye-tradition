"use client";

import { useActionState, useMemo } from "react";
import {
  closeAndDrawAction,
  createEventAction,
  type CreateEventState,
  type DrawState,
} from "@/app/actions";

type Props = {
  baseUrl: string;
};

export function CreateEventForm({ baseUrl }: Props) {
  const [state, action, pending] = useActionState<CreateEventState | null, FormData>(
    createEventAction,
    null,
  );

  const joinLink = useMemo(() => {
    if (state?.ok) {
      return `${baseUrl}/e/${state.slug}/join`;
    }
    return null;
  }, [state, baseUrl]);

  return (
    <form className="card" action={action}>
      <h2 style={{ marginTop: 0 }}>New event</h2>
      <label htmlFor="title">Title</label>
      <input id="title" name="title" type="text" placeholder="NYE 2026" required />

      <label htmlFor="slug" style={{ marginTop: "1rem" }}>
        URL slug (optional)
      </label>
      <input
        id="slug"
        name="slug"
        type="text"
        placeholder="nye-2026 — leave blank to derive from title"
      />

      {state && !state.ok && <p className="error">{state.error}</p>}
      {joinLink && (
        <p className="muted" style={{ marginTop: "1rem" }}>
          Share this join link in WhatsApp:
          <br />
          <code>{joinLink}</code>
        </p>
      )}

      <button type="submit" disabled={pending}>
        {pending ? "Creating…" : "Create event"}
      </button>
    </form>
  );
}

export function CloseDrawForm({ baseUrl }: { baseUrl: string }) {
  const [state, action, pending] = useActionState<DrawState | null, FormData>(
    closeAndDrawAction,
    null,
  );

  return (
    <form className="card" action={action}>
      <h2 style={{ marginTop: 0 }}>Close sign-up &amp; run draw</h2>
      <p className="muted">
        Everyone must join before you run this. Assignments are random: secret friend
        and secret enemy are never yourself; enemy is usually someone different from
        your friend. Cooking partners are pairs; with an odd number, one person has no
        partner.
      </p>
      <label htmlFor="draw_slug">Event slug</label>
      <input id="draw_slug" name="slug" type="text" placeholder="nye-2026" required />

      {state && !state.ok && <p className="error">{state.error}</p>}
      {state?.ok && (
        <p className="muted" style={{ marginTop: "1rem" }}>
          Draw complete. Participants use their personal links, e.g.{" "}
          <code>{baseUrl}/e/your-slug/me/&lt;token&gt;</code>
        </p>
      )}

      <button type="submit" disabled={pending}>
        {pending ? "Running…" : "Run draw"}
      </button>
    </form>
  );
}
