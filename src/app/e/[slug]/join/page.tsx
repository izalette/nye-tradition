import Link from "next/link";
import { notFound } from "next/navigation";
import { getDb } from "@/lib/db";
import { firstRow } from "@/lib/libsql-rows";
import { getPublicBaseUrl } from "@/lib/base-url";
import { JoinForm } from "./join-form";

type Props = { params: Promise<{ slug: string }> };

export default async function JoinPage({ params }: Props) {
  const { slug } = await params;
  const db = await getDb();
  const evRes = await db.execute({
    sql: `SELECT title, draw_closed FROM events WHERE slug = ?`,
    args: [slug],
  });
  const ev = firstRow<{ title: string; draw_closed: number }>(evRes.rows);

  if (!ev) notFound();

  const baseUrl = getPublicBaseUrl();

  return (
    <>
      <h1>{ev.title}</h1>
      {ev.draw_closed ? (
        <p>Sign-up is closed. Use the link you saved to open your assignments.</p>
      ) : (
        <>
          <p>Join once. You will get a private link — keep it secret.</p>
          <JoinForm slug={slug} baseUrl={baseUrl} />
        </>
      )}
      <p style={{ marginTop: "1.5rem" }}>
        <Link href="/">Home</Link>
      </p>
    </>
  );
}
