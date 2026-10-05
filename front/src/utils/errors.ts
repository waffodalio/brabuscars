/**
 * Extracts a user-facing message from a caught value. `catch` blocks type
 * their parameter `unknown`, so every call site needs this same check
 * before it can show the error — centralised here instead of repeated at
 * each of them.
 */
export function errorMessage(err: unknown, fallback: string): string {
  return err instanceof Error ? err.message : fallback;
}
