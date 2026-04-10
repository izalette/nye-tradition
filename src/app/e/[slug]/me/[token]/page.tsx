import Link from "next/link";
import { notFound } from "next/navigation";
import { getDb } from "@/lib/db";
import { allRows, firstRow } from "@/lib/libsql-rows";
import { PopQuizVotePanel } from "./pop-quiz-vote-panel";

type Props = { params: Promise<{ slug: string; token: string }> };

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

type AllergyRow = { display_name: string; food_allergies: string };

/** Split combined notes: "apples, nuts" / "dairy and soy" → separate items. */
function splitAllergyItems(raw: string): string[] {
  const s = raw.normalize("NFKC").trim();
  if (!s) return [];
  const parts = s
    .split(/[,;|]+/)
    .flatMap((p) => p.split(/\s+(?:and|&)\s+/i))
    .map((t) => t.trim())
    .filter(Boolean);
  return parts.length > 0 ? parts : [s];
}

/** Stable key so "Apples", "apples", " apples " match. */
function itemGroupingKey(item: string): string {
  return item
    .normalize("NFKC")
    .trim()
    .toLowerCase()
    .replace(/[,;|•·/\\]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** One line per item (after split + normalize); same item from different people or lists groups together. */
function groupAllergiesByText(rows: AllergyRow[]): { key: string; allergy: string; names: string[] }[] {
  const map = new Map<string, { allergy: string; names: string[] }>();
  for (const r of rows) {
    const items = splitAllergyItems(String(r.food_allergies));
    for (const item of items) {
      const k = itemGroupingKey(item);
      if (!k) continue;
      const cur = map.get(k);
      const label = item.trim();
      if (cur) {
        if (!cur.names.includes(r.display_name)) {
          cur.names.push(r.display_name);
        }
      } else {
        map.set(k, { allergy: label, names: [r.display_name] });
      }
    }
  }
  return [...map.entries()]
    .map(([key, v]) => ({
      key,
      allergy: v.allergy,
      names: [...new Set(v.names)].sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" })),
    }))
    .sort((a, b) =>
      a.allergy.localeCompare(b.allergy, undefined, { sensitivity: "base" }),
    );
}

export default async function MePage({ params }: Props) {
  const { slug, token } = await params;
  const db = await getDb();

  const res = await db.execute({
    sql: `SELECT
        p.id AS self_id,
        e.id AS event_id,
        p.display_name AS self_name,
        p.friend_target_id,
        p.enemy_target_id,
        p.cooking_partner_id,
        p.cooking_course AS self_cooking_course,
        p.nye_dinner AS self_nye_dinner,
        p.food_allergies AS self_food_allergies,
        e.title AS event_title,
        e.draw_closed,
        e.pop_quiz_enabled AS pop_quiz_enabled,
        f.display_name AS friend_name,
        x.display_name AS enemy_name,
        x.off_limits_note AS enemy_target_off_limits,
        c.display_name AS cooking_name,
        c.food_allergies AS cooking_partner_allergies
      FROM participants p
      JOIN events e ON p.event_id = e.id
      LEFT JOIN participants f ON p.friend_target_id = f.id
      LEFT JOIN participants x ON p.enemy_target_id = x.id
      LEFT JOIN participants c ON p.cooking_partner_id = c.id
      WHERE e.slug = ? AND p.secret_token = ?`,
    args: [slug, token],
  });

  const row = firstRow<{
    self_id: string;
    event_id: string;
    self_name: string;
    friend_target_id: string | null;
    enemy_target_id: string | null;
    cooking_partner_id: string | null;
    self_cooking_course: string | null;
    self_nye_dinner: number;
    self_food_allergies: string | null;
    event_title: string;
    draw_closed: number;
    pop_quiz_enabled: number;
    friend_name: string | null;
    enemy_name: string | null;
    enemy_target_off_limits: string | null;
    cooking_name: string | null;
    cooking_partner_allergies: string | null;
  }>(res.rows);

  if (!row) notFound();

  const popQuiz = row.pop_quiz_enabled !== 0;
  const drawDone = row.draw_closed !== 0 && row.friend_target_id !== null;

  let quizFacts: {
    authorId: string;
    authorName: string;
    fun_fact: string;
  }[] = [];
  let initialGuesses: Record<string, string> = {};
  let voteOptions: { id: string; display_name: string }[] = [];

  if (popQuiz && drawDone) {
    const othersRes = await db.execute({
      sql: `SELECT id, display_name, fun_fact FROM participants
       WHERE event_id = ? AND id != ?
       AND fun_fact IS NOT NULL AND trim(fun_fact) != ''`,
      args: [row.event_id, row.self_id],
    });
    const othersRaw = allRows<{ id: string; display_name: string; fun_fact: string }>(
      othersRes.rows,
    );
    quizFacts = shuffle(
      othersRaw.map((o) => ({
        authorId: o.id,
        authorName: o.display_name,
        fun_fact: o.fun_fact,
      })),
    );

    const votesRes = await db.execute({
      sql: `SELECT fact_author_id, guessed_participant_id FROM pop_quiz_votes
       WHERE voter_participant_id = ?`,
      args: [row.self_id],
    });
    for (const v of allRows<{ fact_author_id: string; guessed_participant_id: string }>(
      votesRes.rows,
    )) {
      initialGuesses[v.fact_author_id] = v.guessed_participant_id;
    }

    const namesRes = await db.execute({
      sql: `SELECT id, display_name FROM participants
       WHERE event_id = ? AND id != ? ORDER BY lower(display_name)`,
      args: [row.event_id, row.self_id],
    });
    voteOptions = allRows<{ id: string; display_name: string }>(namesRes.rows);
  }

  let groupAllergyRows: { id: string; display_name: string; food_allergies: string }[] = [];
  if (drawDone) {
    const allergyRes = await db.execute({
      sql: `SELECT id, display_name, food_allergies FROM participants
       WHERE event_id = ? AND food_allergies IS NOT NULL AND trim(food_allergies) != ''
       ORDER BY lower(display_name)`,
      args: [row.event_id],
    });
    groupAllergyRows = allRows<{ id: string; display_name: string; food_allergies: string }>(
      allergyRes.rows,
    );
  }
  const groupedAllergies = groupAllergiesByText(groupAllergyRows);

  return (
    <>
      <h1>{row.event_title}</h1>
      <p className="muted">Hi, {row.self_name}.</p>

      {!row.draw_closed || !row.friend_target_id ? (
        <div className="card">
          <p>Draw not run yet — check back here after the host runs it.</p>
        </div>
      ) : (
        <div className="card">
          <div className="result-row">
            <strong>Secret friend</strong>
            <span>{row.friend_name}</span>
          </div>
          <div className="result-row">
            <strong>Secret enemy</strong>
            <span>{row.enemy_name}</span>
            {row.enemy_target_off_limits && String(row.enemy_target_off_limits).trim() !== "" ? (
              <div
                className="enemy-off-limits"
                style={{
                  marginTop: "0.75rem",
                  padding: "0.65rem 0.75rem",
                  borderRadius: "var(--radius)",
                  background: "rgba(251, 113, 133, 0.08)",
                  border: "1px solid rgba(251, 113, 133, 0.25)",
                }}
              >
                <strong style={{ display: "block", marginBottom: "0.35rem" }}>Off limits</strong>
                <span>{row.enemy_target_off_limits}</span>
              </div>
            ) : null}
          </div>
          <div className="result-row">
            <strong>NYE dinner pairing</strong>
            {Number(row.self_nye_dinner) === 0 ? (
              <div style={{ marginTop: "0.35rem" }}>
                <p style={{ margin: "0 0 0.35rem" }}>
                  You don&apos;t have a NYE cooking assignment.
                </p>
                <p className="muted" style={{ margin: 0 }}>
                  You opted out of food planning for <strong>12/31</strong> when you signed up, so you
                  weren&apos;t put in a dinner pair. If that was a mistake, ask the organiser when sign-up
                  is open (or if they can reopen it).
                </p>
              </div>
            ) : row.cooking_name ? (
              <>
                {row.self_cooking_course && String(row.self_cooking_course).trim() !== "" ? (
                  <div className="nye-dinner-assignment">
                    <p
                      style={{
                        margin: "0.5rem 0 0",
                        lineHeight: 1.5,
                        fontSize: "1.05rem",
                      }}
                    >
                      For NYE, you and <strong>{row.cooking_name}</strong> are
                      teaming up on <strong>{row.self_cooking_course}</strong>.
                    </p>
                  </div>
                ) : (
                  <div className="nye-dinner-assignment">
                    <p style={{ margin: "0.5rem 0 0.75rem", lineHeight: 1.5 }}>
                      You and <strong>{row.cooking_name}</strong> are paired for the NYE meal.{" "}
                      <span className="muted">No course label on file — check with the host.</span>
                    </p>
                  </div>
                )}
              </>
            ) : (
              <p className="muted" style={{ marginTop: "0.35rem", marginBottom: 0 }}>
                Odd number of people in the dinner pool — you weren&apos;t given a partner. Sort who
                covers what in the Group chat.
              </p>
            )}
            {Number(row.self_nye_dinner) !== 0 && row.cooking_name ? (
              <>
                {row.cooking_partner_allergies &&
                String(row.cooking_partner_allergies).trim() !== "" ? (
                  <div
                    className="food-allergies-callout"
                    style={{
                      marginTop: "0.75rem",
                      padding: "0.65rem 0.75rem",
                      borderRadius: "var(--radius)",
                      background: "rgba(252, 211, 77, 0.08)",
                      border: "1px solid rgba(252, 211, 77, 0.35)",
                    }}
                  >
                    <strong style={{ display: "block", marginBottom: "0.35rem" }}>Theirs</strong>
                    <span>{row.cooking_partner_allergies}</span>
                  </div>
                ) : null}
              </>
            ) : Number(row.self_nye_dinner) !== 0 && !row.cooking_name ? (
              row.self_food_allergies && String(row.self_food_allergies).trim() !== "" ? (
                <p className="muted" style={{ marginBottom: 0, marginTop: "0.65rem" }}>
                  <strong>Yours:</strong> {row.self_food_allergies}
                </p>
              ) : null
            ) : null}
          </div>
        </div>
      )}

      {drawDone ? (
        <div className="card" style={{ marginTop: "1rem" }}>
          <div className="result-row">
            <strong>Allergies &amp; dietary</strong>
            {groupedAllergies.length === 0 ? (
              <p className="muted" style={{ marginTop: "0.75rem", marginBottom: 0 }}>
                No one listed allergies or dietary needs.
              </p>
            ) : (
              <div className="allergy-by-ingredient">
                {groupedAllergies.map((g) => (
                  <div key={g.key} className="allergy-ingredient-line">
                    <span className="allergy-diet-key">{g.allergy}</span>
                    <span className="muted allergy-ingredient-colon">: </span>
                    <span className="allergy-ingredient-people">{g.names.join(", ")}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : null}

      {popQuiz && drawDone && quizFacts.length > 0 && voteOptions.length > 0 ? (
        <PopQuizVotePanel
          slug={slug}
          token={token}
          facts={quizFacts}
          voteOptions={voteOptions}
          initialGuesses={initialGuesses}
        />
      ) : null}

      <p style={{ marginTop: "1.5rem" }}>
        <Link href="/">Home</Link>
      </p>
    </>
  );
}
