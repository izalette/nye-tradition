import Link from "next/link";
import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { getDb } from "@/lib/db";
import { firstRow } from "@/lib/libsql-rows";
import { getPublicBaseUrl } from "@/lib/base-url";
import { JoinForm } from "./join-form";
import { JoinSignupGamesIntro } from "./join-signup-games-intro";
import { ResendLinkForm } from "./resend-link-form";

type Props = { params: Promise<{ slug: string }> };

export default async function JoinPage({ params }: Props) {
  const { slug } = await params;
  const db = await getDb();
  const evRes = await db.execute({
    sql: `SELECT id, title, draw_closed, pop_quiz_enabled FROM events WHERE slug = ?`,
    args: [slug],
  });
  const ev = firstRow<{
    id: string;
    title: string;
    draw_closed: number;
    pop_quiz_enabled: number;
  }>(evRes.rows);

  if (!ev) notFound();

  const cookieStore = await cookies();
  const regToken = cookieStore.get(`nye_evt_${slug}`)?.value;
  if (regToken && !ev.draw_closed) {
    const ok = await db.execute({
      sql: `SELECT 1 FROM participants WHERE event_id = ? AND secret_token = ?`,
      args: [ev.id, regToken],
    });
    if (ok.rows.length > 0) {
      redirect(`/e/${slug}/me/${regToken}`);
    }
  }

  const baseUrl = getPublicBaseUrl();

  return (
    <div className="join-page">
      <header className="join-page-hero">
        <h1 className="home-title">You&apos;ve been invited</h1>
        <p className="muted join-page-event-name">
          {ev.title} edition
        </p>
      </header>

      {ev.draw_closed ? (
        <>
          <p className="muted">Sign-up closed — open your saved private link for assignments.</p>
          <ResendLinkForm slug={slug} />
        </>
      ) : (
        <>
          <JoinSignupGamesIntro />
          <JoinForm slug={slug} baseUrl={baseUrl} popQuizEnabled={ev.pop_quiz_enabled !== 0} />
        </>
      )}
      <p style={{ marginTop: "1.5rem" }}>
        <Link href="/">Home</Link>
      </p>
    </div>
  );
}
