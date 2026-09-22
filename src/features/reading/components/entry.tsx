/**
 * One entry.
 *
 * It renders and it does not decide: whether marking is allowed, what marking
 * invalidates and what happens afterwards all live in `api.ts`. What arrives
 * here is an entry and a function to call.
 */
import { component } from '@firsthandjs/dom';
import type { Entry } from '@/shared/api/client';

export type EntryProps = {
  readonly entry: Entry;
  readonly busy: boolean;
  readonly onToggle: (entry: Entry) => void;
};

export const EntryCard = component<EntryProps>((props) => () => {
  const entry = props.entry;
  return (
    <li class={entry.read ? 'entry read' : 'entry'}>
      <h2>{entry.title}</h2>
      <p>{entry.summary}</p>
      <footer>
        <span class="meta">
          {entry.author} · {entry.minutes} min
        </span>
        <button
          type="button"
          disabled={props.busy}
          onClick={() => {
            props.onToggle(entry);
          }}
        >
          {entry.read ? 'Mark unread' : 'Mark read'}
        </button>
      </footer>
    </li>
  );
});
