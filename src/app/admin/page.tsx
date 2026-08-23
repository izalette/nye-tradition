import type { Metadata } from "next";
import Link from "next/link";
import { getDb } from "@/lib/db";
import { allRows, firstRow } from "@/lib/libsql-rows";
import { getPublicBaseUrl } from "@/lib/base-url";
import { getCurrentAdminUserId } from "@/lib/admin-auth";
import { AdminCreateEventModal } from "./admin-create-event-modal";
import { AdminEventsTable, type AdminEventRow } from "./admin-events-table";
import { logoutAction } from "@/app/actions";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const baseUrl = getPublicBaseUrl();
  const db = await getDb();

  const userId = await getCurrentAdminUserId();

  const adminUser = userId
    ? firstRow<{ username: string }>(
        (await db.execute({ sql: `SELECT username FROM admin_users WHERE id = ?`, args: [userId] })).rows,
      )
    : null;

  const eventsRes = await db.execute({
    sql: `SELECT e.slug, e.title, e.draw_closed, e.pop_quiz_enabled,
      (SELECT COUNT(*) FROM participants p WHERE p.event_id = e.id) AS participant_count
     FROM events e
     WHERE e.admin_user_id = ? OR e.admin_user_id IS NULL
     ORDER BY e.created_at DESC`,
    args: [userId ?? ""],
  });

  const eventRows = allRows<{
    slug: string;
    title: string;
    draw_closed: number;
    pop_quiz_enabled: number;
    participant_count: number;
  }>(eventsRes.rows).map((row) => ({
    ...row,
    draw_closed: Number(row.draw_closed),
    pop_quiz_enabled: Number(row.pop_quiz_enabled),
    participant_count: Number(row.participant_count),
  }));

  const membersBySlug = new Map<
    string,
    { id: string; display_name: string; nye_dinner: number }[]
  >();
  if (eventRows.length > 0) {
    const partRes = await db.execute({
      sql: `SELECT e.slug AS slug, p.id AS id, p.display_name AS display_name, p.nye_dinner AS nye_dinner
       FROM participants p
       JOIN events e ON p.event_id = e.id
       WHERE e.admin_user_id = ? OR e.admin_user_id IS NULL`,
      args: [userId ?? ""],
    });
    for (const r of allRows<{
      slug: string;
      id: string;
      display_name: string;
      nye_dinner: number;
    }>(partRes.rows)) {
      const list = membersBySlug.get(r.slug) ?? [];
      list.push({ id: r.id, display_name: r.display_name, nye_dinner: Number(r.nye_dinner) });
      membersBySlug.set(r.slug, list);
    }
    for (const [, members] of membersBySlug) {
      members.sort((a, b) =>
        a.display_name.localeCompare(b.display_name, undefined, { sensitivity: "base" }),
      );
    }
  }

  const events: AdminEventRow[] = eventRows.map((row) => ({
    ...row,
    participantMembers: membersBySlug.get(row.slug) ?? [],
  }));

  return (
    <>
      <h1>Hosting</h1>
      <p className="muted admin-lead">
        Create this year&apos;s game, share the join link in the WhatsApp Group, then run the draw
        when everyone&apos;s in.
      </p>

      <section className="admin-events-section">
        <div className="admin-events-toolbar">
          <h2 className="admin-section-heading">Events</h2>
          <AdminCreateEventModal baseUrl={baseUrl} />
        </div>
        <AdminEventsTable baseUrl={baseUrl} events={events} />
      </section>

      <div style={{ marginTop: "2rem", display: "flex", alignItems: "center", gap: "1.25rem" }}>
        <Link href="/">Home</Link>
        {process.env.ADMIN_SECRET ? (
          <>
            {adminUser ? (
              <span className="muted" style={{ fontSize: "0.9rem" }}>
                Signed in as <strong style={{ color: "var(--text)" }}>{adminUser.username}</strong>
              </span>
            ) : null}
            <form action={logoutAction} style={{ display: "inline" }}>
              <button type="submit" className="btn-secondary" style={{ marginTop: 0, fontSize: "0.9rem", padding: "0.35rem 0.75rem" }}>
                Sign out
              </button>
            </form>
          </>
        ) : (
          <span className="muted" style={{ fontSize: "0.85rem" }}>
            ⚠ Admin is unprotected — set <code>ADMIN_SECRET</code> in your environment variables.
          </span>
        )}
      </div>
    </>
  );
}
