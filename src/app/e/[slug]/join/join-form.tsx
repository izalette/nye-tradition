"use client";

import { useActionState, useMemo } from "react";
import { joinEventAction, type JoinState } from "@/app/actions";

type Props = {
  slug: string;
  baseUrl: string;
};

export function JoinForm({ slug, baseUrl }: Props) {
  const [state, action, pending] = useActionState<JoinState | null, FormData>(
    joinEventAction,
    null,
  );

  const personalLink = useMemo(() => {
    if (state?.ok) {
      return `${baseUrl}/e/${slug}/me/${state.secret_token}`;
    }
    return null;
  }, [state, baseUrl, slug]);

  return (
    <form className="card" action={action}>
      <input type="hidden" name="slug" value={slug} />

      <label htmlFor="display_name">Your name (as the group knows you)</label>
      <input
        id="display_name"
        name="display_name"
        type="text"
        required
        autoComplete="name"
        placeholder="Alex"
      />

      <label htmlFor="email" style={{ marginTop: "1rem" }}>
        Email (optional — for your private link and when the draw runs)
      </label>
      <input
        id="email"
        name="email"
        type="email"
        autoComplete="email"
        placeholder="you@example.com"
      />
      <p className="muted" style={{ marginTop: "0.35rem", marginBottom: 0 }}>
        Same name as someone else in this event is not allowed (ignoring spaces and
        capitalisation). Leave email blank if you prefer only the in-browser link.
      </p>

      {state && !state.ok && <p className="error">{state.error}</p>}

      {personalLink ? (
        <div style={{ marginTop: "1rem" }}>
          <p>
            <strong>Saved.</strong> Bookmark your private page — this is the only place
            you will see your assignments:
          </p>
          <p>
            <code>{personalLink}</code>
          </p>
          <a className="btn" href={personalLink}>
            Open my assignments
          </a>
        </div>
      ) : (
        <button type="submit" disabled={pending}>
          {pending ? "Joining…" : "Join"}
        </button>
      )}
    </form>
  );
}
