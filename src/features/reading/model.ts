/**
 * What "matching" means, and what is left after it.
 *
 * Rules, not markup — so they are functions here rather than expressions
 * inside a component, and `model.test.ts` checks them without a DOM.
 */
import type { Entry } from '@/shared/api/client';

/** An entry matches when the words typed appear in what a reader can see. */
export function matches(entry: Entry, needle: string): boolean {
  const wanted = needle.trim().toLowerCase();
  if (wanted === '') {
    return true;
  }
  return (
    entry.title.toLowerCase().includes(wanted) ||
    entry.author.toLowerCase().includes(wanted) ||
    entry.summary.toLowerCase().includes(wanted)
  );
}

export function filterEntries(entries: readonly Entry[], needle: string): readonly Entry[] {
  return needle.trim() === '' ? entries : entries.filter((one) => matches(one, needle));
}

/** How long the unread ones would take, which is the only number worth showing. */
export function minutesLeft(entries: readonly Entry[]): number {
  return entries.reduce((total, one) => (one.read ? total : total + one.minutes), 0);
}
