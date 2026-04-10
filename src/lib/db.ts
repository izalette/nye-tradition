import fs from "fs";
import path from "path";
import { createClient, type Client } from "@libsql/client";

let clientSingleton: Client | null = null;

export function getLocalDbFilePath(): string {
  return process.env.DATABASE_PATH ?? path.join(process.cwd(), "data", "app.db");
}

/** Local file (default) or Turso when `TURSO_DATABASE_URL` is set. */
export async function getDb(): Promise<Client> {
  if (clientSingleton) return clientSingleton;

  const tursoUrl = process.env.TURSO_DATABASE_URL?.trim();
  const authToken = process.env.TURSO_AUTH_TOKEN?.trim();

  const filePath = path.resolve(getLocalDbFilePath());
  fs.mkdirSync(path.dirname(filePath), { recursive: true });

  const url = tursoUrl ? tursoUrl : `file:${filePath}`;

  const client = createClient({
    url,
    authToken: authToken || undefined,
  });

  await migrate(client);
  clientSingleton = client;
  return client;
}

async function migrate(db: Client) {
  await db.execute(`
    CREATE TABLE IF NOT EXISTS events (
      id TEXT PRIMARY KEY,
      slug TEXT NOT NULL UNIQUE,
      title TEXT NOT NULL,
      draw_closed INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL
    );
  `);

  try {
    await db.execute(
      `ALTER TABLE events ADD COLUMN pop_quiz_enabled INTEGER NOT NULL DEFAULT 1`,
    );
  } catch {
    /* column already present */
  }

  await db.execute(`
    CREATE TABLE IF NOT EXISTS participants (
      id TEXT PRIMARY KEY,
      event_id TEXT NOT NULL,
      display_name TEXT NOT NULL,
      email TEXT,
      secret_token TEXT NOT NULL UNIQUE,
      friend_target_id TEXT,
      enemy_target_id TEXT,
      cooking_partner_id TEXT,
      fun_fact TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
      FOREIGN KEY (friend_target_id) REFERENCES participants(id),
      FOREIGN KEY (enemy_target_id) REFERENCES participants(id),
      FOREIGN KEY (cooking_partner_id) REFERENCES participants(id)
    );
  `);

  try {
    await db.execute(`ALTER TABLE participants ADD COLUMN email TEXT`);
  } catch {
    /* column already present */
  }

  try {
    await db.execute(`ALTER TABLE participants ADD COLUMN fun_fact TEXT`);
  } catch {
    /* column already present */
  }

  try {
    await db.execute(`ALTER TABLE participants ADD COLUMN off_limits_note TEXT`);
  } catch {
    /* column already present */
  }

  try {
    await db.execute(`ALTER TABLE participants ADD COLUMN group_stay_dates TEXT`);
  } catch {
    /* column already present */
  }

  try {
    await db.execute(
      `ALTER TABLE participants ADD COLUMN nye_dinner INTEGER NOT NULL DEFAULT 1`,
    );
  } catch {
    /* column already present */
  }

  try {
    await db.execute(`ALTER TABLE participants ADD COLUMN food_allergies TEXT`);
  } catch {
    /* column already present */
  }

  try {
    await db.execute(`ALTER TABLE participants ADD COLUMN group_stay_start TEXT`);
  } catch {
    /* column already present */
  }

  try {
    await db.execute(`ALTER TABLE participants ADD COLUMN group_stay_end TEXT`);
  } catch {
    /* column already present */
  }

  try {
    await db.execute(`ALTER TABLE participants ADD COLUMN cooking_course TEXT`);
  } catch {
    /* column already present */
  }

  try {
    await db.execute(`ALTER TABLE participants ADD COLUMN whatsapp_e164 TEXT`);
  } catch {
    /* column already present */
  }

  await db.execute(
    `CREATE INDEX IF NOT EXISTS idx_participants_event ON participants(event_id)`,
  );

  try {
    await db.execute(`
      CREATE UNIQUE INDEX IF NOT EXISTS idx_participant_event_display_norm
      ON participants(event_id, lower(trim(display_name)))
    `);
  } catch (e) {
    console.warn(
      "[db] Could not create unique name index (duplicate names in DB?).",
      e instanceof Error ? e.message : e,
    );
  }

  try {
    await db.execute(`
      CREATE UNIQUE INDEX IF NOT EXISTS idx_participant_event_email_norm
      ON participants(event_id, lower(trim(email)))
      WHERE email IS NOT NULL AND trim(email) != ''
    `);
  } catch (e) {
    console.warn(
      "[db] Could not create unique email index (duplicate emails in DB?).",
      e instanceof Error ? e.message : e,
    );
  }

  try {
    await db.execute(`
      CREATE UNIQUE INDEX IF NOT EXISTS idx_participant_event_whatsapp_e164
      ON participants(event_id, whatsapp_e164)
      WHERE whatsapp_e164 IS NOT NULL AND trim(whatsapp_e164) != ''
    `);
  } catch (e) {
    console.warn(
      "[db] Could not create unique WhatsApp index (duplicate numbers in DB?).",
      e instanceof Error ? e.message : e,
    );
  }

  await db.execute(`
    CREATE TABLE IF NOT EXISTS pop_quiz_votes (
      id TEXT PRIMARY KEY,
      event_id TEXT NOT NULL,
      voter_participant_id TEXT NOT NULL,
      fact_author_id TEXT NOT NULL,
      guessed_participant_id TEXT NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
      FOREIGN KEY (voter_participant_id) REFERENCES participants(id) ON DELETE CASCADE,
      FOREIGN KEY (fact_author_id) REFERENCES participants(id) ON DELETE CASCADE,
      FOREIGN KEY (guessed_participant_id) REFERENCES participants(id) ON DELETE CASCADE,
      UNIQUE (voter_participant_id, fact_author_id)
    );
  `);
}

export type EventRow = {
  id: string;
  slug: string;
  title: string;
  draw_closed: number;
  /** 1 = host enabled the pop-quiz add-on for this event */
  pop_quiz_enabled: number;
  created_at: string;
};

export type ParticipantRow = {
  id: string;
  event_id: string;
  display_name: string;
  email: string | null;
  /** International digits only (no +), for WhatsApp click-to-chat; optional. */
  whatsapp_e164: string | null;
  secret_token: string;
  friend_target_id: string | null;
  enemy_target_id: string | null;
  cooking_partner_id: string | null;
  /** Dish/course for NYE dinner pair (e.g. Appetizer); null if not paired. */
  cooking_course: string | null;
  /** Optional legacy free-text; new sign-ups use `group_stay_start` / `group_stay_end`. */
  group_stay_dates: string | null;
  /** ISO date YYYY-MM-DD (optional range with `group_stay_end`). */
  group_stay_start: string | null;
  group_stay_end: string | null;
  /** 1 = in NYE food pool (default); 0 = opted out at sign-up (not attending 12/31). */
  nye_dinner: number;
  /** Optional; shown to NYE dinner partner after the draw. */
  food_allergies: string | null;
  created_at: string;
};
