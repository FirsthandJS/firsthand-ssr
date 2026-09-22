/**
 * The rules, without a DOM.
 *
 * They are the reason `model.ts` exists: "an empty filter matches everything"
 * and "read entries do not count towards what is left" are statements about
 * a reading list, not about markup, and nothing has to be rendered to check
 * them.
 */
import { describe, expect, it } from 'vitest';
import { filterEntries, matches, minutesLeft } from '@/features/reading/model';
import type { Entry } from '@/shared/api/client';

const entry = (over: Partial<Entry> = {}): Entry => ({
  id: 1,
  title: 'A render that happens once',
  author: 'Firsthand',
  summary: 'What it returns is wired up, not re-run.',
  minutes: 4,
  read: false,
  ...over,
});

describe('matching', () => {
  it('matches everything when nothing has been typed', () => {
    expect(matches(entry(), '')).toBe(true);
    expect(matches(entry(), '   ')).toBe(true);
  });

  it('looks at the title, the author and the summary', () => {
    expect(matches(entry(), 'render')).toBe(true);
    expect(matches(entry(), 'firsthand')).toBe(true);
    expect(matches(entry(), 'wired up')).toBe(true);
  });

  it('ignores case, and the spaces around what was typed', () => {
    expect(matches(entry(), '  RENDER  ')).toBe(true);
  });

  it('says no when the words are not there', () => {
    expect(matches(entry(), 'kanban')).toBe(false);
  });
});

describe('filtering', () => {
  const entries = [entry(), entry({ id: 2, title: 'Parts, not diffs' })];

  it('hands back the same list when there is nothing to filter by', () => {
    expect(filterEntries(entries, '')).toBe(entries);
  });

  it('keeps the ones that match', () => {
    expect(filterEntries(entries, 'parts').map((one) => one.id)).toEqual([2]);
  });
});

describe('what is left to read', () => {
  it('adds up the unread ones only', () => {
    expect(minutesLeft([entry({ minutes: 4 }), entry({ id: 2, minutes: 6, read: true })])).toBe(4);
  });

  it('is nothing when everything has been read', () => {
    expect(minutesLeft([entry({ read: true })])).toBe(0);
  });
});
