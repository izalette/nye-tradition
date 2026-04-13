"use client";

import { useMemo } from "react";
import { useJoinFormState } from "@/app/form-action-state-hooks";
import { usePokerCardShell } from "./use-poker-card-shell";

type Props = {
  slug: string;
  baseUrl: string;
  popQuizEnabled: boolean;
};

export function JoinForm({ slug, baseUrl, popQuizEnabled }: Props) {
  const [state, action, pending] = useJoinFormState();
  const primaryCard = usePokerCardShell();
  const optionalCard = usePokerCardShell({ entranceDelayMs: 140 });

  const personalLink = useMemo(() => {
    if (state?.ok) {
      return `${baseUrl}/e/${slug}/me/${state.secret_token}`;
    }
    return null;
  }, [state, baseUrl, slug]);

  return (
    <form className="poker-card-form join-form-split" action={action}>
      <input type="hidden" name="slug" value={slug} />

      <div className="join-form-cards">
        <div
          className={`poker-card-wrap ${primaryCard.entranceReady ? "poker-card-wrap--in" : ""}`}
        >
          <div
            ref={primaryCard.cardRef}
            className={`poker-card ${primaryCard.tiltEnabled ? "poker-card--tilt" : ""}`}
          >
            <span className="poker-card-index poker-card-index--tl" aria-hidden="true">
              <span className="poker-card-rank">A</span>
              <span className="poker-card-suit">♠</span>
            </span>
            <span className="poker-card-index poker-card-index--br" aria-hidden="true">
              <span className="poker-card-rank">A</span>
              <span className="poker-card-suit">♠</span>
            </span>

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
                <p
                  id="fun_fact_hint"
                  className="muted"
                  style={{ marginTop: "0.2rem", marginBottom: "0.35rem" }}
                >
                  Share one thing you&apos;re proud of or passionate about.
                </p>
                <input
                  id="fun_fact"
                  name="fun_fact"
                  type="text"
                  required
                  autoComplete="off"
                  placeholder="e.g. plays the saxophone"
                  aria-describedby="fun_fact_hint"
                />
              </>
            ) : null}

            <label htmlFor="email" style={{ marginTop: "1rem" }}>
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              placeholder="you@example.com"
            />
          </div>
        </div>

        <div
          className={`poker-card-wrap ${optionalCard.entranceReady ? "poker-card-wrap--in" : ""}`}
        >
          <div
            ref={optionalCard.cardRef}
            className={`poker-card ${optionalCard.tiltEnabled ? "poker-card--tilt" : ""}`}
          >
            <span
              className="poker-card-index poker-card-index--tl poker-card-index--red"
              aria-hidden="true"
            >
              <span className="poker-card-rank">2</span>
              <span className="poker-card-suit">♦</span>
            </span>
            <span
              className="poker-card-index poker-card-index--br poker-card-index--red"
              aria-hidden="true"
            >
              <span className="poker-card-rank">2</span>
              <span className="poker-card-suit">♦</span>
            </span>

            <p className="join-form-optional-title" style={{ marginTop: 0 }}>
              Optional
            </p>

            <label htmlFor="off_limits_note" style={{ marginTop: "0.25rem" }}>
              Off limits
            </label>
            <p
              id="off_limits_hint"
              className="muted"
              style={{ marginTop: "0.2rem", marginBottom: "0.35rem" }}
            >
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
          </div>
        </div>
      </div>

      {state && !state.ok && <div className="error join-form-trailer">{state.error}</div>}

      {personalLink && state?.ok ? (
        <div className="join-form-trailer">
          <p className="join-form-success-announce">
            Assignments go out by end of today — keep an eye on the group chat. See you on the other
            side.
          </p>
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
        <div className="join-form-actions join-form-trailer">
          <button type="submit" disabled={pending}>
            {pending ? "Joining…" : "Join"}
          </button>
        </div>
      ) : null}
    </form>
  );
}
