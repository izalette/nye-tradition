import Link from "next/link";
import { getDb } from "@/lib/db";
import { allRows } from "@/lib/libsql-rows";
import { getPublicBaseUrl } from "@/lib/base-url";
import { AdminCreateEventModal } from "./admin-create-event-modal";
import { AdminEventsTable, type AdminEventRow } from "./admin-events-table";

export default async function AdminPage() {
  const baseUrl = getPublicBaseUrl();
  const db = await getDb();
  const eventsRes = await db.execute({
    sql: `SELECT e.slug, e.title, e.draw_closed, e.pop_quiz_enabled,
      (SELECT COUNT(*) FROM participants p WHERE p.event_id = e.id) AS participant_count
     FROM events e
     ORDER BY e.created_at DESC`,
    args: [],
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

  const namesBySlug = new Map<string, string[]>();
  if (eventRows.length > 0) {
    const partRes = await db.execute({
      sql: `SELECT e.slug AS slug, p.display_name AS display_name
       FROM participants p
       JOIN events e ON p.event_id = e.id`,
      args: [],
    });
    for (const r of allRows<{ slug: string; display_name: string }>(partRes.rows)) {
      const list = namesBySlug.get(r.slug) ?? [];
      list.push(r.display_name);
      namesBySlug.set(r.slug, list);
    }
    for (const [, names] of namesBySlug) {
      names.sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" }));
    }
  }

  const events: AdminEventRow[] = eventRows.map((row) => ({
    ...row,
    participants: namesBySlug.get(row.slug) ?? [],
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

      <div style={{ marginTop: "2rem" }}>
        <Link href="/">Home</Link>
      </div>
    </>
  );
}
