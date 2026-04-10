import { buildDinnerCourseLabels } from "./nye-dinner-courses";
import { shuffle } from "./shuffle";

export type DrawResult = {
  friend: Map<string, string>;
  enemy: Map<string, string>;
  cooking: Map<string, string | null>;
  /** Dish/course for this person’s dinner pair; null if not in pool or odd-one-out. */
  cookingCourse: Map<string, string | null>;
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

/** True iff a and b may be NYE cooking partners (mutual constraints). */
function canCookTogether(
  a: string,
  b: string,
  friend: Map<string, string>,
  enemy: Map<string, string>,
): boolean {
  if (a === b) return false;
  if (friend.get(a) === b || enemy.get(a) === b) return false;
  if (friend.get(b) === a || enemy.get(b) === a) return false;
  return true;
}

/**
 * Random disjoint pairs among `eligible`; if N is odd, one person has no partner (null).
 * Never pairs someone with their secret friend or secret enemy (or the symmetric case).
 */
function constrainedCookingPartners(
  eligible: string[],
  friend: Map<string, string>,
  enemy: Map<string, string>,
): Map<string, string | null> {
  const out = new Map<string, string | null>();
  for (const id of eligible) out.set(id, null);

  if (eligible.length === 0) return out;

  const MAX_ATTEMPTS = 25000;
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const unmatched = shuffle([...eligible]);
    const partner = new Map<string, string | null>();
    for (const id of eligible) partner.set(id, null);

    let failed = false;
    while (unmatched.length > 0) {
      if (unmatched.length === 1) {
        const solo = unmatched.pop()!;
        partner.set(solo, null);
        break;
      }
      const a = unmatched.pop()!;
      const candidates = unmatched.filter((b) => canCookTogether(a, b, friend, enemy));
      if (candidates.length === 0) {
        failed = true;
        break;
      }
      const b = candidates[Math.floor(Math.random() * candidates.length)]!;
      const idx = unmatched.indexOf(b);
      unmatched.splice(idx, 1);
      partner.set(a, b);
      partner.set(b, a);
    }

    if (failed) continue;

    for (const id of eligible) {
      const p = partner.get(id) ?? null;
      if (p !== null && !canCookTogether(id, p, friend, enemy)) {
        failed = true;
        break;
      }
    }
    if (failed) continue;

    return partner;
  }

  throw new Error(
    "Could not assign NYE cooking partners without using someone’s secret friend or secret enemy. Try running the draw again, or change who opted into the NYE dinner pool.",
  );
}

/**
 * Builds secret friend, secret enemy, and NYE dinner cooking partner assignments.
 * - No self for friend or enemy (derangements).
 * - Enemy !== friend for each person when possible (required if N ≥ 3; with N = 2 the only derangement forces them to match — cooking pairs still avoid that person when they are in the dinner pool).
 * - Cooking pairs only people in `dinnerEligibleIds` (those in the NYE food pool at sign-up);
 *   everyone else gets no dinner partner or course.
 * - Each pair shares one course label (appetizer / main / dessert; beverages and extras
 *   when the pool is larger — see `buildDinnerCourseLabels`).
 */
export function runDraw(participantIds: string[], dinnerEligibleIds: string[]): DrawResult {
  const ids = [...participantIds];
  if (ids.length < 2) {
    throw new Error("Need at least 2 participants to run the draw.");
  }

  const eligibleSet = new Set(
    dinnerEligibleIds.filter((id) => ids.includes(id)),
  );

  const friendPerm = randomDerangement(ids);
  const friend = new Map<string, string>();
  ids.forEach((id, i) => friend.set(id, friendPerm[i]));

  let enemyPerm: string[];
  if (ids.length === 2) {
    // Only derangement of 2 people is the swap — same as friend — unavoidable.
    enemyPerm = friendPerm;
  } else {
    let tries = 0;
    do {
      enemyPerm = randomDerangement(ids);
      tries++;
      if (tries > 20000) {
        throw new Error(
          "Could not pick a secret enemy different from everyone’s secret friend. Try running the draw again.",
        );
      }
    } while (ids.some((id, i) => enemyPerm[i] === friendPerm[i]));
  }

  const enemy = new Map<string, string>();
  ids.forEach((id, i) => enemy.set(id, enemyPerm[i]));

  const { cooking, cookingCourse } = assignCookingPartners(
    ids,
    [...eligibleSet],
    friend,
    enemy,
  );

  return { friend, enemy, cooking, cookingCourse };
}

function assignCookingPartners(
  allParticipantIds: string[],
  dinnerEligibleIds: string[],
  friend: Map<string, string>,
  enemy: Map<string, string>,
): {
  cooking: Map<string, string | null>;
  cookingCourse: Map<string, string | null>;
} {
  const cooking = new Map<string, string | null>();
  const cookingCourse = new Map<string, string | null>();
  for (const id of allParticipantIds) {
    cooking.set(id, null);
    cookingCourse.set(id, null);
  }

  const eligible = dinnerEligibleIds.filter((id) => allParticipantIds.includes(id));
  if (eligible.length === 0) {
    return { cooking, cookingCourse };
  }

  const partnerById = constrainedCookingPartners(eligible, friend, enemy);
  for (const [id, partner] of partnerById) {
    cooking.set(id, partner);
  }

  const pairList: [string, string][] = [];
  const seenPair = new Set<string>();
  for (const id of eligible) {
    const p = partnerById.get(id);
    if (p === null || p === undefined) continue;
    const a = id < p ? id : p;
    const b = id < p ? p : id;
    const key = `${a}:${b}`;
    if (seenPair.has(key)) continue;
    seenPair.add(key);
    pairList.push([a, b]);
  }

  shuffle(pairList);
  const courses = buildDinnerCourseLabels(eligible.length);
  for (let i = 0; i < pairList.length; i++) {
    const label = courses[i];
    if (!label) continue;
    const [a, b] = pairList[i]!;
    cookingCourse.set(a, label);
    cookingCourse.set(b, label);
  }

  return { cooking, cookingCourse };
}
