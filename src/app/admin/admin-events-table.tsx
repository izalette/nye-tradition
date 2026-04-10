"use client";

import { useRouter } from "next/navigation";
import { Fragment, useCallback, useState } from "react";
import { closeAndDrawAction, deleteEventAction, reopenSignUpAction } from "@/app/actions";

export type AdminEventRow = {
  slug: string;
  title: string;
  draw_closed: number;
  pop_quiz_enabled: number;
  participant_count: number;
  /** Signed-up names, sorted A–Z */
  participants: string[];
};

type ActionKey = "" | "run" | "facts" | "reopen" | "delete";

export function AdminEventsTable({
  baseUrl,
  events,
}: {
  baseUrl: string;
  events: AdminEventRow[];
}) {
  const router = useRouter();
  const [pick, setPick] = useState<Record<string, ActionKey>>({});
  const [busySlug, setBusySlug] = useState<string | null>(null);
  const [copiedSlug, setCopiedSlug] = useState<string | null>(null);
  const [joinedOpen, setJoinedOpen] = useState<Record<string, boolean>>({});

  const joinUrl = useCallback(
    (slug: string) => `${baseUrl}/e/${slug}/join`,
    [baseUrl],
  );

  const copyJoinLink = useCallback(
    async (slug: string) => {
      const url = joinUrl(slug);
      try {
        await navigator.clipboard.writeText(url);
        setCopiedSlug(slug);
        window.setTimeout(() => {
          setCopiedSlug((s) => (s === slug ? null : s));
        }, 2000);
      } catch {
        window.prompt("Copy this link:", url);
      }
    },
    [joinUrl],
  );

  const apply = useCallback(
    async (slug: string) => {
      const action = pick[slug] ?? "";
      if (!action) return;

      if (action === "run") {
        const row = events.find((e) => e.slug === slug);
        if (!row || row.draw_closed) return;
        if (row.participant_count < 2) {
          window.alert("Need at least 2 participants to run the draw.");
          setPick((p) => ({ ...p, [slug]: "" }));
          return;
        }
        if (
          !window.confirm(
            `Run the draw for “${row.title}”? Sign-up closes — everyone gets their assignments. If people left an email, they’ll get a heads-up too.`,
          )
        ) {
          return;
        }
        setBusySlug(slug);
        const fd = new FormData();
        fd.set("slug", slug);
        const res = await closeAndDrawAction(null, fd);
        setBusySlug(null);
        setPick((p) => ({ ...p, [slug]: "" }));
        if (!res.ok) {
          window.alert(res.error);
          return;
        }
        router.refresh();
        return;
      }

      if (action === "facts") {
        const row = events.find((e) => e.slug === slug);
        if (!row?.pop_quiz_enabled) return;
        setPick((p) => ({ ...p, [slug]: "" }));
        window.open(`/admin/events/${encodeURIComponent(slug)}/fun-facts`, "_blank");
        return;
      }

      if (action === "reopen") {
        const row = events.find((e) => e.slug === slug);
        if (!row || !row.draw_closed) return;
        if (
          !window.confirm(
            `Reopen sign-up for “${row.title}”? Everyone’s secret friend, enemy, and dinner assignments will be cleared. Current participants keep their links — you can run a new draw when you’re ready.`,
          )
        ) {
          return;
        }
        setBusySlug(slug);
        const fd = new FormData();
        fd.set("slug", slug);
        const res = await reopenSignUpAction(null, fd);
        setBusySlug(null);
        setPick((p) => ({ ...p, [slug]: "" }));
        if (!res.ok) {
          window.alert(res.error);
          return;
        }
        router.refresh();
        return;
      }

      if (action === "delete") {
        const row = events.find((e) => e.slug === slug);
        if (!row) return;
        if (
          !window.confirm(
            `Delete “${row.title}” permanently? All sign-ups, pop-quiz votes, and draw assignments will be removed. Private links for this event will stop working.`,
          )
        ) {
          return;
        }
        setBusySlug(slug);
        const fd = new FormData();
        fd.set("slug", slug);
        const res = await deleteEventAction(null, fd);
        setBusySlug(null);
        setPick((p) => ({ ...p, [slug]: "" }));
        if (!res.ok) {
          window.alert(res.error);
          return;
        }
        router.refresh();
      }
    },
    [events, pick, router],
  );

  if (events.length === 0) {
    return (
      <p className="muted admin-events-empty">
        No events yet — use <strong>Create an event</strong> above to start.
      </p>
    );
  }

  return (
    <div className="admin-events-wrap">
      <table className="admin-events-table">
        <thead>
          <tr>
            <th scope="col">Event</th>
            <th scope="col" className="admin-events-num">
              Joined
            </th>
            <th scope="col">Draw</th>
            <th scope="col">Action</th>
          </tr>
        </thead>
        <tbody>
          {events.map((ev) => {
            const canRun = ev.draw_closed === 0 && ev.participant_count >= 2;
            const canReopen = ev.draw_closed !== 0;
            const canFacts = ev.pop_quiz_enabled !== 0;
            const choice = pick[ev.slug] ?? "";
            const running = busySlug === ev.slug;
            const showJoinedList = joinedOpen[ev.slug] ?? false;
            const canToggleJoined = ev.participant_count > 0;
            return (
              <Fragment key={ev.slug}>
              <tr>
                <td>
                  <div className="admin-event-title-cell">
                    <strong>{ev.title}</strong>
                    <button
                      type="button"
                      className={
                        copiedSlug === ev.slug
                          ? "admin-event-copy-link is-copied"
                          : "admin-event-copy-link"
                      }
                      onClick={() => void copyJoinLink(ev.slug)}
                      aria-label={`Copy join link for ${ev.title}`}
                      title={copiedSlug === ev.slug ? "Copied" : "Copy join link"}
                    >
                      {copiedSlug === ev.slug ? (
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          aria-hidden="true"
                        >
                          <path d="M20 6L9 17l-5-5" />
                        </svg>
                      ) : (
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          aria-hidden="true"
                        >
                          <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                          <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                        </svg>
                      )}
                    </button>
                  </div>
                </td>
                <td className="admin-events-num">
                  <div className="admin-joined-cell">
                    <span className="admin-joined-count">{ev.participant_count}</span>
                    {canToggleJoined ? (
                      <button
                        type="button"
                        className="admin-joined-toggle"
                        aria-expanded={showJoinedList}
                        aria-controls={`joined-list-${ev.slug}`}
                        id={`joined-toggle-${ev.slug}`}
                        aria-label={showJoinedList ? "Hide joined names" : "Show joined names"}
                        title={showJoinedList ? "Hide joined names" : "Show joined names"}
                        onClick={() =>
                          setJoinedOpen((o) => ({
                            ...o,
                            [ev.slug]: !showJoinedList,
                          }))
                        }
                      >
                        <span className="admin-joined-toggle-chevron" aria-hidden>
                          {showJoinedList ? "▴" : "▾"}
                        </span>
                      </button>
                    ) : null}
                  </div>
                </td>
                <td>{ev.draw_closed ? "Done" : "Open"}</td>
                <td>
                  <div className="admin-events-actions">
                    <select
                      value={choice}
                      onChange={(e) =>
                        setPick((p) => ({ ...p, [ev.slug]: e.target.value as ActionKey }))
                      }
                      className="admin-events-action-select"
                      aria-label={`Action for ${ev.title}`}
                    >
                      <option value="" />
                      <option value="run" disabled={!canRun}>
                        Run the draw
                      </option>
                      <option value="facts" disabled={!canFacts}>
                        Load fun facts
                      </option>
                      <option value="reopen" disabled={!canReopen}>
                        Reopen sign-up
                      </option>
                      <option value="delete">Delete event…</option>
                    </select>
                    <button
                      type="button"
                      className="btn admin-events-go"
                      disabled={!choice || running}
                      onClick={() => void apply(ev.slug)}
                    >
                      {running ? "…" : "Go"}
                    </button>
                  </div>
                </td>
              </tr>
              {showJoinedList ? (
                <tr className="admin-event-participants-row">
                  <td colSpan={4} id={`joined-list-${ev.slug}`} role="region" aria-labelledby={`joined-toggle-${ev.slug}`}>
                    <span className="admin-event-participants-label">Joined:</span>{" "}
                    {ev.participants.length === 0 ? (
                      <span className="muted">No one yet.</span>
                    ) : (
                      <span className="admin-event-participants-names">{ev.participants.join(", ")}</span>
                    )}
                  </td>
                </tr>
              ) : null}
              </Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
