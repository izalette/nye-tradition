"use server";

import { v4 as uuidv4 } from "uuid";
import { getDb } from "@/lib/db";
import { runDraw } from "@/lib/draw";
import { sendDrawReadyEmail, sendJoinConfirmationEmail } from "@/lib/email";
import { allRows, firstRow } from "@/lib/libsql-rows";

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
  const slugRaw = String(formData.get("slug") ?? "").trim();

  if (!title) {
    return { ok: false, error: "Title is required." };
  }

  const slug = slugify(slugRaw || title);
  const id = uuidv4();
  const created_at = new Date().toISOString();

  const db = await getDb();
  try {
    await db.execute({
      sql: `INSERT INTO events (id, slug, title, draw_closed, created_at) VALUES (?, ?, ?, 0, ?)`,
      args: [id, slug, title, created_at],
    });
  } catch (e: unknown) {
    if (isUniqueConstraintError(e)) {
      return { ok: false, error: "That URL slug is already taken. Pick another." };
    }
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }

  return { ok: true, slug };
}

export type JoinState =
  | { ok: true; secret_token: string }
  | { ok: false; error: string };

export async function joinEventAction(
  _prev: JoinState | null,
  formData: FormData,
): Promise<JoinState> {
  const slug = String(formData.get("slug") ?? "").trim();
  const display_name = String(formData.get("display_name") ?? "").trim();
  const emailRaw = String(formData.get("email") ?? "").trim();
  const email = emailRaw || null;

  if (!display_name) {
    return { ok: false, error: "Name is required." };
  }

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
    return { ok: false, error: "Sign-up is closed for this event." };
  }

  const id = uuidv4();
  const secret_token = uuidv4();
  const created_at = new Date().toISOString();

  try {
    await db.execute({
      sql: `INSERT INTO participants (id, event_id, display_name, email, secret_token, created_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
      args: [id, ev.id, display_name, email, secret_token, created_at],
    });
  } catch (e: unknown) {
    if (isUniqueConstraintError(e)) {
      return {
        ok: false,
        error:
          "Someone is already signed up with this name in this event (spaces and letter case are ignored for duplicates).",
      };
    }
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }

  if (email) {
    void sendJoinConfirmationEmail({
      to: email,
      eventTitle: ev.title,
      slug,
      secretToken: secret_token,
    });
  }

  return { ok: true, secret_token };
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
    sql: `SELECT id FROM participants WHERE event_id = ?`,
    args: [ev.id],
  });
  const rows = allRows<{ id: string }>(rowsRes.rows);

  const ids = rows.map((r) => r.id);

  let friend: Map<string, string>;
  let enemy: Map<string, string>;
  let cooking: Map<string, string | null>;
  try {
    const result = runDraw(ids);
    friend = result.friend;
    enemy = result.enemy;
    cooking = result.cooking;
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return { ok: false, error: msg };
  }

  const stmts: { sql: string; args: (string | number | null)[] }[] = [];
  for (const pid of ids) {
    const friendId = friend.get(pid)!;
    const enemyId = enemy.get(pid)!;
    const cookId = cooking.get(pid) ?? null;
    stmts.push({
      sql: `UPDATE participants SET friend_target_id = ?, enemy_target_id = ?, cooking_partner_id = ? WHERE id = ?`,
      args: [friendId, enemyId, cookId, pid],
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

  return { ok: true };
}
