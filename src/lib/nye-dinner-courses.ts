/**
 * Labels assigned to each **pair** in the NYE dinner pool, in order.
 * Up to 6 people (3 pairs): appetizer, main, dessert.
 * More than 6 in the pool: add beverages.
 * More than 8: add an extra shared item.
 * More than 10: add **Breakfast the next day** when a 6th pair exists (12+ people); then
 * rotate suggestions for very large groups.
 */
export function buildDinnerCourseLabels(dinnerPoolSize: number): string[] {
  const labels: string[] = ["Appetizer", "Main course", "Dessert"];
  if (dinnerPoolSize > 6) labels.push("Beverages");
  if (dinnerPoolSize > 8) {
    labels.push("Something extra (e.g. sides, bread, or a cheese board)");
  }
  const pairCount = Math.floor(dinnerPoolSize / 2);
  if (dinnerPoolSize > 10 && labels.length < pairCount) {
    labels.push("Breakfast the next day");
  }
  const more = [
    "Snacks & nibbles",
    "Coffee & tea setup",
    "Another shared dish — decide together",
    "Something to share — pick as a pair",
  ];
  let i = 0;
  while (labels.length < pairCount) {
    labels.push(more[i % more.length]!);
    i++;
  }
  return labels;
}
