/**
 * The placeholder of a dropdown whose options depend on an earlier choice: the "pick … first" hint while it is
 * blocked (`blockedHint` is not null), "Loading…" while its options load, otherwise its normal prompt.
 */
export function dependentPlaceholder(blockedHint: string | null, loading: boolean, prompt: string): string {
  if (blockedHint) return blockedHint;
  if (loading) return "Loading…";
  return prompt;
}
