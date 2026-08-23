import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getFunFactsForEventAction } from "@/app/actions";
import { PopQuizCard } from "@/app/admin/admin-pop-quiz";
import { getDb } from "@/lib/db";
import { firstRow } from "@/lib/libsql-rows";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

type Props = { params: Promise<{ slug: string }> };

export default async function AdminFunFactsPage({ params }: Props) {
  const { slug } = await params;
  const db = await getDb();
  const evRes = await db.execute({
    sql: `SELECT title FROM events WHERE slug = ?`,
    args: [slug],
  });
  const ev = firstRow<{ title: string }>(evRes.rows);
  if (!ev) notFound();

  const data = await getFunFactsForEventAction(slug);

  return (
    <>
      <p className="muted" style={{ marginBottom: "0.75rem" }}>
        <Link href="/admin">← Admin</Link>
      </p>
      <h1>Fun facts</h1>
      <p className="muted" style={{ marginTop: "0.25rem", marginBottom: "1.25rem" }}>
        <strong>{ev.title}</strong> — for the host: read each fact aloud, then reveal who it
        belongs to.
      </p>

      {!data.ok ? (
        <div className="error" role="alert">
          {data.error}
        </div>
      ) : data.items.length === 0 ? (
        <p className="muted">No fun facts yet — people add them when they join (pop quiz on).</p>
      ) : (
        <div className="panel-pop-quiz-inline">
          <ul className="pop-quiz-list pop-quiz-list-admin">
            {data.items.map((item, index) => (
              <PopQuizCard
                key={`${item.display_name}-${index}`}
                index={index + 1}
                {...item}
              />
            ))}
          </ul>
        </div>
      )}
    </>
  );
}
