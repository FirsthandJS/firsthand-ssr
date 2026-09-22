/**
 * The page: lays out the list, and holds the one thing nobody else can use.
 *
 * The filter is local interaction state. It is not a rule, nobody else needs
 * it, and lifting it into the feature's api would turn one signal into a prop,
 * a callback and a comment explaining the pair.
 *
 * What is shown and what is left to read are `computed` in the setup rather
 * than worked out inside the run. Both are derivations of the same two
 * signals, and a derivation made in the setup is read from the markup — so a
 * new answer from the server updates the rows and the total where they are,
 * without the run below being made again.
 */
import { component, computed, signal } from '@firsthandjs/dom';
import { useEntries, useEntryActions } from '@/features/reading/api';
import { EntryCard } from '@/features/reading/components/entry';
import { filterEntries, minutesLeft } from '@/features/reading/model';
import type { Entry } from '@/shared/api/client';

export const ReadingList = component(() => {
  const entries = useEntries();
  const { mark, busy } = useEntryActions();
  const filter = signal('');
  const shown = computed(() => filterEntries(entries.data.value ?? [], filter.value));
  const left = computed(() => minutesLeft(entries.data.value ?? []));

  const toggle = (entry: Entry): void => {
    void mark.run({ id: entry.id, read: !entry.read });
  };

  return () => {
    // Read in a statement, because a list that has not arrived yet is a
    // different page rather than a different value. It is the one thing here
    // that makes the run happen again.
    if (entries.status.value === 'loading') {
      return <p class="empty">Loading…</p>;
    }

    return (
      <>
        <label class="filter">
          <span>Filter</span>
          <input
            value={filter.value}
            placeholder="a word from a title, an author, a summary…"
            onInput={(event) => {
              filter.value = (event.target as HTMLInputElement).value;
            }}
          />
          <span class="left">{left.value} min left</span>
        </label>

        <ul class="entries">
          {shown.value.map((entry) => (
            <EntryCard key={entry.id} entry={entry} busy={busy.value} onToggle={toggle} />
          ))}
        </ul>

        {shown.value.length === 0 ? <p class="empty">Nothing matches “{filter.value}”.</p> : null}
      </>
    );
  };
});
