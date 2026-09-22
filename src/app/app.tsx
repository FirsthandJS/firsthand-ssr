/**
 * The application as a whole, and it is one page.
 *
 * Nothing in here is written for a server or for a browser. It is the same
 * component tree either way; what differs is which compiler ran over the file
 * and which of the two entry points called it.
 */
import { component, provide, signal } from '@firsthandjs/dom';
import { DataContext } from '@firsthandjs/data';
import type { DataStore } from '@firsthandjs/data';
import { ReadingList } from '@/features/reading/pages/list';

/**
 * Filled in by the browser once hydration has returned.
 *
 * Before that it is `null`, which is what a server renders and what the markup
 * therefore carries — so the status line is proof of where the page was made
 * rather than a claim about it.
 */
export const hydratedIn = signal<number | null>(null);

export type AppProps = {
  /** One per request on a server; one for the tab in a browser. */
  readonly data: DataStore;
  /** How many requests the process rendering this has answered. */
  readonly served: number;
};

const Status = component<{ readonly served: number }>((props) => () => {
  const time = hydratedIn.value;
  return (
    <footer class="status">
      <span>
        Requests answered by this process: <strong>{props.served}</strong>
      </span>
      <span>{time === null ? 'Rendered on the server' : `Hydrated in ${time.toFixed(1)} ms`}</span>
    </footer>
  );
});

export const App = component<AppProps>((props) => {
  provide(DataContext, props.data);
  return (
    <main>
      <h1>Reading list</h1>
      <p class="lead">
        This page arrived from the server with its content in it, and the browser took over the
        nodes that were already here. View source, then use the filter: it answers without asking
        the server anything.
      </p>
      <ReadingList />
      <Status served={props.served} />
    </main>
  );
});
