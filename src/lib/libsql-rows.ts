import type { Row } from "@libsql/client";

export function firstRow<T>(rows: Row[]): T | undefined {
  const r = rows[0];
  if (r === undefined) return undefined;
  return r as unknown as T;
}

export function allRows<T>(rows: Row[]): T[] {
  return rows.map((r) => r as unknown as T);
}
