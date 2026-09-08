/**
 * Escapes the LIKE metacharacters (`%`, `_`) and the escape char itself so a
 * user-supplied string is matched literally inside a `LIKE` pattern. Prevents
 * a caller from turning a search box into an expensive wildcard scan.
 */
export function escapeLike(value: string): string {
  return value.replace(/[\\%_]/g, (char) => `\\${char}`);
}
