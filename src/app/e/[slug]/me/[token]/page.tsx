import Link from "next/link";
import { notFound } from "next/navigation";
import { getDb } from "@/lib/db";
import { firstRow } from "@/lib/libsql-rows";

type Props = { params: Promise<{ slug: string; token: string }> };

export default async function MePage({ params }: Props) {
  const { slug, token } = await params;
  const db = await getDb();

  const res = await db.execute({
    sql: `SELECT
        p.display_name AS self_name,
        p.friend_target_id,
        p.enemy_target_id,
        p.cooking_partner_id,
        e.title AS event_title,
        e.draw_closed,
        f.display_name AS friend_name,
        x.display_name AS enemy_name,
        c.display_name AS cooking_name
      FROM participants p
      JOIN events e ON p.event_id = e.id
      LEFT JOIN participants f ON p.friend_target_id = f.id
      LEFT JOIN participants x ON p.enemy_target_id = x.id
      LEFT JOIN participants c ON p.cooking_partner_id = c.id
      WHERE e.slug = ? AND p.secret_token = ?`,
    args: [slug, token],
  });

  const row = firstRow<{
    self_name: string;
    friend_target_id: string | null;
    enemy_target_id: string | null;
    cooking_partner_id: string | null;
    event_title: string;
    draw_closed: number;
    friend_name: string | null;
    enemy_name: string | null;
    cooking_name: string | null;
  }>(res.rows);

  if (!row) notFound();

  return (
    <>
      <h1>{row.event_title}</h1>
      <p className="muted">Hi, {row.self_name}.</p>

      {!row.draw_closed || !row.friend_target_id ? (
        <div className="card">
          <p>
            The organiser has not run the draw yet. Keep this page bookmarked; your
            assignments will show up here after the draw.
          </p>
        </div>
      ) : (
        <div className="card">
          <div className="result-row">
            <strong>Secret friend</strong>
            <span>{row.friend_name}</span>
            <p className="muted" style={{ marginBottom: 0, marginTop: "0.35rem" }}>
              You are this person&apos;s secret friend (support them / gift / cheer —
              however your group defines it).
            </p>
          </div>
          <div className="result-row">
            <strong>Secret enemy</strong>
            <span>{row.enemy_name}</span>
            <p className="muted" style={{ marginBottom: 0, marginTop: "0.35rem" }}>
              Playful rivalry only — follow your group&apos;s ground rules.
            </p>
          </div>
          <div className="result-row">
            <strong>NYE cooking partner</strong>
            <span>
              {row.cooking_name ?? (
                <em className="muted">No partner (odd number) — pair up in the chat.</em>
              )}
            </span>
          </div>
        </div>
      )}

      <p style={{ marginTop: "1.5rem" }}>
        <Link href="/">Home</Link>
      </p>
    </>
  );
}
