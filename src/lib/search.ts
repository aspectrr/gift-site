/** Pure search matching — shared by the client-side instant filter and tests. */

export function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/\s+/g, " ")
    .trim();
}

/** All whitespace-separated tokens must appear in the haystack. */
export function matches(haystack: string, query: string): boolean {
  const q = normalize(query);
  if (!q) return true;
  const h = normalize(haystack);
  return q
    .split(" ")
    .filter(Boolean)
    .every((token) => h.includes(token));
}
