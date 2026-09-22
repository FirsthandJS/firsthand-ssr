/**
 * The whole database: an array, in the server's memory.
 *
 * A real one would be somewhere else, which is the point of it being this
 * small — nothing in `src/` knows what this is, and swapping it for a real
 * store touches this file and `shared/api/client.ts`.
 *
 * Restarting the process forgets everything, including what you marked read.
 */

export type Entry = {
  readonly id: number;
  readonly title: string;
  readonly author: string;
  readonly summary: string;
  readonly minutes: number;
  read: boolean;
};

const entries: Entry[] = [
  {
    id: 1,
    title: 'A render that happens once',
    author: 'Firsthand',
    summary:
      'A component is a function that runs one time per instance. What it returns is wired up, not re-run, which is why there is no memo to remember.',
    minutes: 4,
    read: false,
  },
  {
    id: 2,
    title: 'Parts, not diffs',
    author: 'Firsthand',
    summary:
      'Each dynamic position is its own subscription. A change wakes the positions that read it and leaves the rest of the page alone.',
    minutes: 6,
    read: false,
  },
  {
    id: 3,
    title: 'The compiler writes the templates',
    author: 'Firsthand',
    summary:
      'Static markup is parsed once into a template and cloned per instance. A server writes the same shape as a string instead.',
    minutes: 5,
    read: false,
  },
  {
    id: 4,
    title: 'Hydration adopts',
    author: 'Firsthand',
    summary:
      'The browser takes over the nodes the server sent rather than building its own. Nothing is parsed twice and nothing flashes.',
    minutes: 7,
    read: false,
  },
  {
    id: 5,
    title: 'Data has names, resources do not',
    author: 'Firsthand',
    summary:
      'A resource belongs to its call site. A named one has somewhere to be put, which is how an answer crosses the wire with the page.',
    minutes: 3,
    read: false,
  },
];

/** Every request this process has answered. The page shows the count. */
export const served: string[] = [];

export function listEntries(): readonly Entry[] {
  served.push('entries');
  return entries;
}

/**
 * Marks one entry read or unread, and says what it became.
 *
 * Returns `undefined` for an id that is not here, which the caller turns into
 * a 404 — a store does not know about status codes.
 */
export function setRead(id: number, read: boolean): Entry | undefined {
  const entry = entries.find((one) => one.id === id);
  if (entry === undefined) {
    return undefined;
  }
  served.push('setRead');
  entry.read = read;
  return entry;
}
