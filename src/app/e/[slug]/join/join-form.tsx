"use client";

import { useMemo } from "react";
import { useJoinFormState } from "@/app/form-action-state-hooks";

type Props = {
  slug: string;
  baseUrl: string;
  popQuizEnabled: boolean;
};

export function JoinForm({ slug, baseUrl, popQuizEnabled }: Props) {
  const [state, action, pending] = useJoinFormState();

  const personalLink = useMemo(() => {
    if (state?.ok) {
      return `${baseUrl}/e/${slug}/me/${state.secret_token}`;
    }
    return null;
  }, [state, baseUrl, slug]);

  return (
    <form className="card" action={action}>
      <input type="hidden" name="slug" value={slug} />

      <label htmlFor="display_name">Name</label>
      <input
        id="display_name"
        name="display_name"
        type="text"
        required
        autoComplete="name"
        placeholder="Alex"
      />

      {popQuizEnabled ? (
        <>
          <label htmlFor="fun_fact" style={{ marginTop: "1rem" }}>
            Fun fact / hobby
          </label>
          <p id="fun_fact_hint" className="muted" style={{ marginTop: "0.2rem", marginBottom: "0.35rem" }}>
            One line others might guess is you (used for the quiz).
          </p>
          <textarea
            id="fun_fact"
            name="fun_fact"
            required
            rows={2}
            placeholder="e.g. plays the cello"
            aria-describedby="fun_fact_hint"
          />
        </>
      ) : null}

      <label
        className="admin-checkbox-label"
        style={{ marginTop: "1rem", display: "flex", gap: "0.5rem", alignItems: "flex-start" }}
      >
        <input
          id="exclude_nye_food"
          name="exclude_nye_food"
          type="checkbox"
          value="1"
          style={{ marginTop: "0.2rem" }}
        />
        <span>Not coming for dinner on <strong>12/31</strong> — skip me for food pairing.</span>
      </label>

      <label htmlFor="email" style={{ marginTop: "1rem" }}>
        Email <span className="muted">(required)</span>
      </label>
      <p id="email_hint" className="muted" style={{ marginTop: "0.2rem", marginBottom: "0.35rem" }}>
        We use this to send your private link and a note when the draw is run.
      </p>
      <input
        id="email"
        name="email"
        type="email"
        required
        autoComplete="email"
        placeholder="you@example.com"
        aria-describedby="email_hint"
      />

      <hr className="join-form-optional-rule" aria-hidden="true" />
      <p className="join-form-optional-title">Optional</p>

      <label htmlFor="off_limits_note" style={{ marginTop: "0.25rem" }}>
        Off limits
      </label>
      <p id="off_limits_hint" className="muted" style={{ marginTop: "0.2rem", marginBottom: "0.35rem" }}>
        Only your secret enemy sees this (topics or gifts to avoid).
      </p>
      <textarea
        id="off_limits_note"
        name="off_limits_note"
        rows={2}
        placeholder="Optional"
        aria-describedby="off_limits_hint"
      />

      <label htmlFor="food_allergies" style={{ marginTop: "1rem" }}>
        Allergies &amp; dietary
      </label>
      <p
        id="food_allergies_hint"
        className="muted"
        style={{ marginTop: "0.2rem", marginBottom: "0.35rem" }}
      >
        For shared meals — list ingredients or diets to avoid.
      </p>
      <textarea
        id="food_allergies"
        name="food_allergies"
        rows={2}
        placeholder="Optional"
        aria-describedby="food_allergies_hint"
      />

      {state && !state.ok && <div className="error">{state.error}</div>}

      {personalLink && state?.ok ? (
        <div style={{ marginTop: "1rem" }}>
          {state.join_email_sent ? (
            <p className="muted" style={{ marginBottom: "0.5rem" }}>
              Check your inbox — we sent this link by email too.
            </p>
          ) : (
            <p className="muted" style={{ marginBottom: "0.5rem" }}>
              We couldn&apos;t send email (host may not have mail set up). Save this link.
            </p>
          )}
          <p className="muted" style={{ marginBottom: "0.5rem" }}>
            Your <strong>private link</strong> (only for you):
          </p>
          <p>
            <code>{personalLink}</code>
          </p>
          <div className="join-form-success-actions">
            <a className="btn" href={personalLink}>
              Open my page
            </a>
          </div>
        </div>
      ) : !personalLink ? (
        <div className="join-form-actions">
          <button type="submit" disabled={pending}>
            {pending ? "Joining…" : "Join"}
          </button>
        </div>
      ) : null}
    </form>
  );
}
