import { shuffle } from "./shuffle";

export type DrawResult = {
  friend: Map<string, string>;
  enemy: Map<string, string>;
  cooking: Map<string, string | null>;
};

/**
 * Random derangement: permutation P where P[i] !== ids[i] for every index.
 * Requires ids.length >= 2.
 */
function randomDerangement(ids: string[]): string[] {
  const n = ids.length;
  if (n < 2) {
    throw new Error("Need at least 2 people for a derangement.");
  }
  let perm: string[];
  let guard = 0;
  do {
    perm = shuffle([...ids]);
    guard++;
    if (guard > 10000) {
      throw new Error("Could not sample a derangement; try again.");
    }
  } while (perm.some((p, i) => p === ids[i]));
  return perm;
}

/**
 * Cooking partners: disjoint pairs; if N is odd, one person has no partner (null).
 * Never assigns someone to themselves.
 */
function randomCookingPartners(ids: string[]): Map<string, string | null> {
  const out = new Map<string, string | null>();
  for (const id of ids) out.set(id, null);

  const shuffled = shuffle([...ids]);
  if (shuffled.length % 2 === 1) {
    const solo = shuffled.pop()!;
    out.set(solo, null);
  }
  for (let i = 0; i < shuffled.length; i += 2) {
    const a = shuffled[i];
    const b = shuffled[i + 1];
    out.set(a, b);
    out.set(b, a);
  }
  return out;
}

/**
 * Builds secret friend, secret enemy, and cooking partner assignments.
 * - No self for friend or enemy (derangements).
 * - Tries to make enemy !== friend for each person when possible.
 * - Cooking is symmetric; odd group leaves one person without a partner.
 */
export function runDraw(participantIds: string[]): DrawResult {
  const ids = [...participantIds];
  if (ids.length < 2) {
    throw new Error("Need at least 2 participants to run the draw.");
  }

  const friendPerm = randomDerangement(ids);
  const friend = new Map<string, string>();
  ids.forEach((id, i) => friend.set(id, friendPerm[i]));

  let enemyPerm: string[];
  let tries = 0;
  do {
    enemyPerm = randomDerangement(ids);
    tries++;
    if (tries > 5000) {
      break;
    }
  } while (ids.some((id, i) => enemyPerm[i] === friendPerm[i]));

  const enemy = new Map<string, string>();
  ids.forEach((id, i) => enemy.set(id, enemyPerm[i]));

  const cooking = randomCookingPartners(ids);

  return { friend, enemy, cooking };
}
