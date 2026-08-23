"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { v4 as uuidv4 } from "uuid";
import { getDb } from "@/lib/db";
import { runDraw } from "@/lib/draw";
import { sendDrawReadyEmail, sendJoinConfirmationEmail } from "@/lib/email";
import { allRows, firstRow } from "@/lib/libsql-rows";

// ── Admin auth ────────────────────────────────────────────────────────────────

export type LoginState = { error: string } | null;

export async function loginAction(
  _prev: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const password = String(formData.get("password") ?? "");
  const secret = process.env.ADMIN_SECRET?.trim();

  if (!secret) {
    return { error: "Admin access is not configured. Set ADMIN_SECRET in your environment variables." };
  }
  if (password !== secret) {
    return { error: "Wrong password." };
  }

  const cookieStore = await cookies();
  cookieStore.set("nye_admin_session", secret, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });

  redirect("/admin");
}

export async function logoutAction(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set("nye_admin_session", "", { path: "/", maxAge: 0 });
  redirect("/admin/login");
}

// ── Helpers ────────────────────────────────────────────────────────────────

function slugify(input: string): string {
  const s = input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return s.slice(0, 64) || "event";
}

function isUniqueConstraintError(e: unknown): boolean {
  const msg = e instanceof Error ? e.message : String(e);
  return msg.includes("UNIQUE") || msg.includes("SQLITE_CONSTRAINT");
}

export type CreateEventState =
  | { ok: true; slug: string }
  | { ok: false; error: string };

export async function createEventAction(
  _prev: CreateEventState | null,
  formData: FormData,
): Promise<CreateEventState> {
  const title = String(formData.get("title") ?? "").trim();

  if (!title) {
    return { ok: false, error: "Title is required." };
  }
  if (title.length > 80) {
    return { ok: false, error: "Title must be 80 characters or fewer." };
  }

  const pop_quiz_enabled = formData.get("pop_quiz_enabled") === "1" ? 1 : 0;

  const slug = slugify(title);
  const id = uuidv4();
  const created_at = new Date().toISOString();

  const db = await getDb();
  try {
    await db.execute({
      sql: `INSERT INTO events (id, slug, title, draw_closed, pop_quiz_enabled, created_at) VALUES (?, ?, ?, 0, ?, ?)`,
      args: [id, slug, title, pop_quiz_enabled, created_at],
    });
  } catch (e: unknown) {
    if (isUniqueConstraintError(e)) {
      return {
        ok: false,
        error: "An event with that title already exists — tweak the name.",
      };
    }
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }

  revalidatePath("/admin");
  return { ok: true, slug };
}

export type JoinState =
  | {
      ok: true;
      secret_token: string;
      /** True if Resend delivered the join confirmation. */
      join_email_sent: boolean;
    }
  | { ok: false; error: string };

export async function joinEventAction(
  _prev: JoinState | null,
  formData: FormData,
): Promise<JoinState> {
  const slug = String(formData.get("slug") ?? "").trim();
  const display_name = String(formData.get("display_name") ?? "").trim();
  const emailRaw = String(formData.get("email") ?? "").trim();
  const email = emailRaw || null;
  if (!email) {
    return { ok: false, error: "Email is required." };
  }
  const db = await getDb();
  const evRes = await db.execute({
    sql: `SELECT id, draw_closed, title, pop_quiz_enabled FROM events WHERE slug = ?`,
    args: [slug],
  });
  const ev = firstRow<{
    id: string;
    draw_closed: number;
    title: string;
    pop_quiz_enabled: number;
  }>(evRes.rows);

  if (!ev) {
    return { ok: false, error: "Event not found." };
  }

  const popQuiz = ev.pop_quiz_enabled !== 0;
  const fun_fact_raw = String(formData.get("fun_fact") ?? "").trim();
  const off_limits_raw = String(formData.get("off_limits_note") ?? "").trim();
  const off_limits_note = off_limits_raw || null;
  /** Dinner pool is set by the host in admin; new sign-ups default to included. */
  const nye_dinner: 0 | 1 = 1;
  const food_allergies_raw = String(formData.get("food_allergies") ?? "").trim();
  const food_allergies = food_allergies_raw || null;

  if (!display_name) {
    return { ok: false, error: "Name is required." };
  }
  if (display_name.length > 80) {
    return { ok: false, error: "Name must be 80 characters or fewer." };
  }
  if (popQuiz && !fun_fact_raw) {
    return { ok: false, error: "Add a fun fact for the pop quiz." };
  }
  if (fun_fact_raw.length > 400) {
    return { ok: false, error: "Fun fact must be 400 characters or fewer." };
  }
  if (off_limits_raw.length > 400) {
    return { ok: false, error: "Off limits note must be 400 characters or fewer." };
  }
  if (food_allergies_raw.length > 400) {
    return { ok: false, error: "Allergies/dietary note must be 400 characters or fewer." };
  }

  const fun_fact: string | null = popQuiz ? fun_fact_raw : null;

  if (ev.draw_closed) {
    return { ok: false, error: "Sign-up is closed for this event." };
  }

  const cookieStore = await cookies();
  const cookieName = `nye_evt_${slug}`;
  const existingToken = cookieStore.get(cookieName)?.value;
  if (existingToken) {
    const already = await db.execute({
      sql: `SELECT 1 FROM participants WHERE event_id = ? AND secret_token = ?`,
      args: [ev.id, existingToken],
    });
    if (already.rows.length > 0) {
      return {
        ok: false,
        error:
          "Already joined on this browser — open your saved link, or use another device to sign up again.",
      };
    }
    cookieStore.set(cookieName, "", { path: "/", maxAge: 0 });
  }

  const id = uuidv4();
  const secret_token = uuidv4();
  const created_at = new Date().toISOString();

  try {
    await db.execute({
      sql: `INSERT INTO participants (id, event_id, display_name, email, whatsapp_e164, secret_token, fun_fact, off_limits_note, group_stay_dates, group_stay_start, group_stay_end, nye_dinner, food_allergies, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        id,
        ev.id,
        display_name,
        email,
        null,
        secret_token,
        fun_fact,
        off_limits_note,
        null,
        null,
        null,
        nye_dinner,
        food_allergies,
        created_at,
      ],
    });
  } catch (e: unknown) {
    if (isUniqueConstraintError(e)) {
      const msg = e instanceof Error ? e.message : String(e);
      if (msg.toLowerCase().includes("email") || msg.includes("idx_participant_event_email")) {
        return {
          ok: false,
          error: "That email is already on this event.",
        };
      }
      return {
        ok: false,
        error: "That name is already taken (spaces/case ignored).",
      };
    }
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }

  cookieStore.set(cookieName, secret_token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 400,
  });

  let join_email_sent = false;
  if (email) {
    const sendRes = await sendJoinConfirmationEmail({
      to: email,
      eventTitle: ev.title,
      slug,
      secretToken: secret_token,
    });
    join_email_sent = sendRes.ok;
  }

  return {
    ok: true,
    secret_token,
    join_email_sent,
  };
}

export type DrawState = { ok: true } | { ok: false; error: string };

export async function closeAndDrawAction(
  _prev: DrawState | null,
  formData: FormData,
): Promise<DrawState> {
  const slug = String(formData.get("slug") ?? "").trim();

  const db = await getDb();
  const evRes = await db.execute({
    sql: `SELECT id, draw_closed, title FROM events WHERE slug = ?`,
    args: [slug],
  });
  const ev = firstRow<{ id: string; draw_closed: number; title: string }>(evRes.rows);

  if (!ev) {
    return { ok: false, error: "Event not found." };
  }
  if (ev.draw_closed) {
    return { ok: false, error: "Draw already ran for this event." };
  }

  const rowsRes = await db.execute({
    sql: `SELECT id, nye_dinner FROM participants WHERE event_id = ?`,
    args: [ev.id],
  });
  const rows = allRows<{ id: string; nye_dinner: number }>(rowsRes.rows);

  const ids = rows.map((r) => r.id);
  const dinnerEligibleIds = rows.filter((r) => Number(r.nye_dinner) !== 0).map((r) => r.id);

  let friend: Map<string, string>;
  let enemy: Map<string, string>;
  let cooking: Map<string, string | null>;
  let cookingCourse: Map<string, string | null>;
  try {
    const result = runDraw(ids, dinnerEligibleIds);
    friend = result.friend;
    enemy = result.enemy;
    cooking = result.cooking;
    cookingCourse = result.cookingCourse;
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return { ok: false, error: msg };
  }

  const stmts: { sql: string; args: (string | number | null)[] }[] = [];
  for (const pid of ids) {
    const friendId = friend.get(pid)!;
    const enemyId = enemy.get(pid)!;
    const cookId = cooking.get(pid) ?? null;
    const course = cookingCourse.get(pid) ?? null;
    stmts.push({
      sql: `UPDATE participants SET friend_target_id = ?, enemy_target_id = ?, cooking_partner_id = ?, cooking_course = ? WHERE id = ?`,
      args: [friendId, enemyId, cookId, course, pid],
    });
  }
  stmts.push({
    sql: `UPDATE events SET draw_closed = 1 WHERE id = ?`,
    args: [ev.id],
  });

  try {
    await db.batch(stmts, "write");
  } catch (e: unknown) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }

  const notifyRes = await db.execute({
    sql: `SELECT email, secret_token FROM participants
     WHERE event_id = ? AND email IS NOT NULL AND trim(email) != ''`,
    args: [ev.id],
  });
  const toNotify = allRows<{ email: string; secret_token: string }>(notifyRes.rows);

  for (const row of toNotify) {
    void sendDrawReadyEmail({
      to: row.email,
      eventTitle: ev.title,
      slug,
      secretToken: row.secret_token,
    });
  }

  revalidatePath("/admin");
  return { ok: true };
}

export type ReopenSignUpState = { ok: true } | { ok: false; error: string };

/** Opens sign-up again and clears all draw assignments so you can add people and run a fresh draw. */
export async function reopenSignUpAction(
  _prev: ReopenSignUpState | null,
  formData: FormData,
): Promise<ReopenSignUpState> {
  const slug = String(formData.get("slug") ?? "").trim();
  if (!slug) {
    return { ok: false, error: "Missing event." };
  }

  const db = await getDb();
  const evRes = await db.execute({
    sql: `SELECT id, draw_closed FROM events WHERE slug = ?`,
    args: [slug],
  });
  const ev = firstRow<{ id: string; draw_closed: number }>(evRes.rows);

  if (!ev) {
    return { ok: false, error: "Event not found." };
  }
  if (!ev.draw_closed) {
    return { ok: false, error: "Sign-up is already open for this event." };
  }

  try {
    await db.batch(
      [
        {
          sql: `UPDATE participants SET friend_target_id = NULL, enemy_target_id = NULL, cooking_partner_id = NULL, cooking_course = NULL WHERE event_id = ?`,
          args: [ev.id],
        },
        {
          sql: `UPDATE events SET draw_closed = 0 WHERE id = ?`,
          args: [ev.id],
        },
      ],
      "write",
    );
  } catch (e: unknown) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }

  revalidatePath("/admin");
  revalidatePath(`/e/${slug}`, "layout");

  return { ok: true };
}

export type DeleteEventState = { ok: true } | { ok: false; error: string };

export type DeleteParticipantState = { ok: true } | { ok: false; error: string };

/** Remove one sign-up from an event; clears others’ assignments pointing at them. */
export async function deleteParticipantAction(
  _prev: DeleteParticipantState | null,
  formData: FormData,
): Promise<DeleteParticipantState> {
  const slug = String(formData.get("slug") ?? "").trim();
  const participantId = String(formData.get("participant_id") ?? "").trim();
  if (!slug || !participantId) {
    return { ok: false, error: "Missing event or participant." };
  }

  const db = await getDb();
  const evRes = await db.execute({
    sql: `SELECT id FROM events WHERE slug = ?`,
    args: [slug],
  });
  const ev = firstRow<{ id: string }>(evRes.rows);
  if (!ev) {
    return { ok: false, error: "Event not found." };
  }

  const pRes = await db.execute({
    sql: `SELECT id, display_name, secret_token FROM participants WHERE id = ? AND event_id = ?`,
    args: [participantId, ev.id],
  });
  const victim = firstRow<{ id: string; display_name: string; secret_token: string }>(pRes.rows);
  if (!victim) {
    return { ok: false, error: "Participant not found for this event." };
  }

  try {
    await db.batch(
      [
        {
          sql: `UPDATE participants SET friend_target_id = NULL WHERE friend_target_id = ?`,
          args: [participantId],
        },
        {
          sql: `UPDATE participants SET enemy_target_id = NULL WHERE enemy_target_id = ?`,
          args: [participantId],
        },
        {
          sql: `UPDATE participants SET cooking_partner_id = NULL WHERE cooking_partner_id = ?`,
          args: [participantId],
        },
        {
          sql: `DELETE FROM participants WHERE id = ? AND event_id = ?`,
          args: [participantId, ev.id],
        },
      ],
      "write",
    );
  } catch (e: unknown) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }

  revalidatePath("/admin");
  revalidatePath(`/e/${slug}`, "layout");
  revalidatePath(`/admin/events/${slug}/fun-facts`);

  return { ok: true };
}

export type SetParticipantNyeDinnerState = { ok: true } | { ok: false; error: string };

/** Host sets whether someone is in the NYE dinner / food-pairing pool (sign-up must be open). */
export async function setParticipantNyeDinnerAction(
  _prev: SetParticipantNyeDinnerState | null,
  formData: FormData,
): Promise<SetParticipantNyeDinnerState> {
  const slug = String(formData.get("slug") ?? "").trim();
  const participantId = String(formData.get("participant_id") ?? "").trim();
  const raw = String(formData.get("nye_dinner") ?? "").trim();
  if (!slug || !participantId) {
    return { ok: false, error: "Missing event or participant." };
  }
  const nye_dinner: 0 | 1 = raw === "1" ? 1 : 0;

  const db = await getDb();
  const evRes = await db.execute({
    sql: `SELECT id, draw_closed FROM events WHERE slug = ?`,
    args: [slug],
  });
  const ev = firstRow<{ id: string; draw_closed: number }>(evRes.rows);
  if (!ev) {
    return { ok: false, error: "Event not found." };
  }
  if (ev.draw_closed) {
    return {
      ok: false,
      error: "Sign-up is closed. Reopen sign-up from admin if you need to change dinner pairing.",
    };
  }

  const exists = await db.execute({
    sql: `SELECT 1 FROM participants WHERE id = ? AND event_id = ?`,
    args: [participantId, ev.id],
  });
  if (exists.rows.length === 0) {
    return { ok: false, error: "Participant not found for this event." };
  }

  try {
    await db.execute({
      sql: `UPDATE participants SET nye_dinner = ? WHERE id = ? AND event_id = ?`,
      args: [nye_dinner, participantId, ev.id],
    });
  } catch (e: unknown) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }

  revalidatePath("/admin");
  revalidatePath(`/e/${slug}/join`);
  const tokensRes = await db.execute({
    sql: `SELECT secret_token FROM participants WHERE event_id = ?`,
    args: [ev.id],
  });
  for (const row of allRows<{ secret_token: string }>(tokensRes.rows)) {
    revalidatePath(`/e/${slug}/me/${row.secret_token}`);
  }

  return { ok: true };
}

/** Permanently removes the event, all participants, and pop-quiz votes. */
export async function deleteEventAction(
  _prev: DeleteEventState | null,
  formData: FormData,
): Promise<DeleteEventState> {
  const slug = String(formData.get("slug") ?? "").trim();
  if (!slug) {
    return { ok: false, error: "Missing event." };
  }

  const db = await getDb();
  const evRes = await db.execute({
    sql: `SELECT id, title FROM events WHERE slug = ?`,
    args: [slug],
  });
  const ev = firstRow<{ id: string; title: string }>(evRes.rows);

  if (!ev) {
    return { ok: false, error: "Event not found." };
  }

  try {
    await db.batch(
      [
        {
          sql: `DELETE FROM pop_quiz_votes WHERE event_id = ?`,
          args: [ev.id],
        },
        {
          sql: `UPDATE participants SET friend_target_id = NULL, enemy_target_id = NULL, cooking_partner_id = NULL WHERE event_id = ?`,
          args: [ev.id],
        },
        {
          sql: `DELETE FROM participants WHERE event_id = ?`,
          args: [ev.id],
        },
        {
          sql: `DELETE FROM events WHERE id = ?`,
          args: [ev.id],
        },
      ],
      "write",
    );
  } catch (e: unknown) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }

  revalidatePath("/admin");
  revalidatePath(`/e/${slug}/join`);
  revalidatePath(`/admin/events/${slug}/fun-facts`);

  return { ok: true };
}

export type FunFactsState =
  | { ok: true; items: { display_name: string; fun_fact: string }[] }
  | { ok: false; error: string };

export async function getFunFactsForEventAction(slug: string): Promise<FunFactsState> {
  const trimmed = slug.trim();
  if (!trimmed) {
    return { ok: false, error: "Missing event slug." };
  }

  const db = await getDb();
  const evRes = await db.execute({
    sql: `SELECT id, pop_quiz_enabled FROM events WHERE slug = ?`,
    args: [trimmed],
  });
  const ev = firstRow<{ id: string; pop_quiz_enabled: number }>(evRes.rows);
  if (!ev) {
    return { ok: false, error: "Event not found." };
  }
  if (!ev.pop_quiz_enabled) {
    return {
      ok: false,
      error: "Pop quiz isn’t on for this event.",
    };
  }

  const res = await db.execute({
    sql: `SELECT display_name, fun_fact FROM participants
     WHERE event_id = ? AND fun_fact IS NOT NULL AND trim(fun_fact) != ''
     ORDER BY RANDOM()`,
    args: [ev.id],
  });

  const items = allRows<{ display_name: string; fun_fact: string }>(res.rows);
  return { ok: true, items };
}

export type PopQuizVoteState = { ok: true } | { ok: false; error: string };

/** Save all fun-fact guesses at once; validation matches per-fact rules. */
export async function submitPopQuizVotesBatchAction(
  _prev: PopQuizVoteState | null,
  formData: FormData,
): Promise<PopQuizVoteState> {
  const slug = String(formData.get("slug") ?? "").trim();
  const token = String(formData.get("token") ?? "").trim();

  if (!slug || !token) {
    return { ok: false, error: "Missing link." };
  }

  const db = await getDb();
  const meRes = await db.execute({
    sql: `SELECT p.id AS pid, p.event_id, e.pop_quiz_enabled AS pop_quiz_enabled
     FROM participants p JOIN events e ON p.event_id = e.id
     WHERE e.slug = ? AND p.secret_token = ?`,
    args: [slug, token],
  });
  const me = firstRow<{ pid: string; event_id: string; pop_quiz_enabled: number }>(
    meRes.rows,
  );
  if (!me) {
    return { ok: false, error: "Link not valid." };
  }
  if (!me.pop_quiz_enabled) {
    return { ok: false, error: "Pop quiz is not enabled for this event." };
  }

  const authorsRes = await db.execute({
    sql: `SELECT id FROM participants
     WHERE event_id = ? AND id != ? AND fun_fact IS NOT NULL AND trim(fun_fact) != ''
     ORDER BY id`,
    args: [me.event_id, me.pid],
  });
  const authorIds = allRows<{ id: string }>(authorsRes.rows).map((r) => r.id);
  if (authorIds.length === 0) {
    return { ok: false, error: "No facts to vote on." };
  }

  const allParticipantsRes = await db.execute({
    sql: `SELECT id FROM participants WHERE event_id = ?`,
    args: [me.event_id],
  });
  const validIds = new Set(allRows<{ id: string }>(allParticipantsRes.rows).map((r) => r.id));

  type Pair = { authorId: string; guessedId: string };
  const pairs: Pair[] = [];
  for (const authorId of authorIds) {
    const guessedId = String(formData.get(`guess_${authorId}`) ?? "").trim();
    if (!guessedId) {
      return { ok: false, error: "Pick someone for every fact before submitting." };
    }
    if (me.pid === guessedId) {
      return { ok: false, error: "Guess someone other than yourself for each fact." };
    }
    if (!validIds.has(guessedId)) {
      return { ok: false, error: "Invalid choice." };
    }
    pairs.push({ authorId, guessedId });
  }

  const voteRowsRes = await db.execute({
    sql: `SELECT id, fact_author_id FROM pop_quiz_votes WHERE voter_participant_id = ?`,
    args: [me.pid],
  });
  const existingByAuthor = new Map(
    allRows<{ id: string; fact_author_id: string }>(voteRowsRes.rows).map((r) => [
      r.fact_author_id,
      r.id,
    ]),
  );

  const now = new Date().toISOString();
  const stmts: { sql: string; args: (string | number | null)[] }[] = [];
  for (const { authorId, guessedId } of pairs) {
    const exId = existingByAuthor.get(authorId);
    if (exId) {
      stmts.push({
        sql: `UPDATE pop_quiz_votes SET guessed_participant_id = ?, created_at = ? WHERE id = ?`,
        args: [guessedId, now, exId],
      });
    } else {
      stmts.push({
        sql: `INSERT INTO pop_quiz_votes (id, event_id, voter_participant_id, fact_author_id, guessed_participant_id, created_at)
         VALUES (?, ?, ?, ?, ?, ?)`,
        args: [uuidv4(), me.event_id, me.pid, authorId, guessedId, now],
      });
    }
  }

  try {
    await db.batch(stmts, "write");
  } catch (e: unknown) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }

  revalidatePath(`/e/${slug}/me/${token}`);
  return { ok: true };
}
