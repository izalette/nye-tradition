"use client";

import { useActionState } from "react";
import { resendLinkAction } from "@/app/actions";

export function ResendLinkForm({ slug }: { slug: string }) {
  const [state, action, pending] = useActionState(resendLinkAction, null);

  if (state?.ok) {
    if (state.sent) {
      return (
        <p className="muted" style={{ marginTop: "1rem" }}>
          Link sent — check your email.
        </p>
      );
    }
    return (
      <div style={{ marginTop: "1rem" }}>
        <p className="muted" style={{ marginBottom: "0.35rem" }}>Your private link:</p>
        <a href={state.link} style={{ wordBreak: "break-all" }}>
          {state.link}
        </a>
      </div>
    );
  }

  return (
    <form action={action} style={{ marginTop: "1.25rem" }}>
      <input type="hidden" name="slug" value={slug} />
      <p className="muted" style={{ marginBottom: "0.5rem" }}>
        Lost your link? Enter the name or email you signed up with.
      </p>
      <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
        <input
          type="text"
          name="query"
          placeholder="Name or email"
          autoComplete="off"
          style={{ flex: "1", minWidth: "10rem" }}
          required
        />
        <button type="submit" disabled={pending} style={{ marginTop: 0, flexShrink: 0 }}>
          {pending ? "Looking…" : "Send link"}
        </button>
      </div>
      {state?.error ? (
        <p className="error" role="alert" style={{ marginTop: "0.5rem" }}>
          {state.error}
        </p>
      ) : null}
    </form>
  );
}
