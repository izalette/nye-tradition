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
}

export type EventRow = {
  id: string;
  slug: string;
  title: string;
  draw_closed: number;
  created_at: string;
};

export type ParticipantRow = {
  id: string;
  event_id: string;
  display_name: string;
  email: string | null;
  secret_token: string;
  friend_target_id: string | null;
  enemy_target_id: string | null;
  cooking_partner_id: string | null;
  created_at: string;
};
