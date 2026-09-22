/**
 * What the server runs, once per request.
 *
 * Everything here is per request — the storage, the data store, the owner the
 * render creates and disposes. Nothing is shared between two visitors, which
 * is the only rule server rendering really has.
 *
 * It also installs the transport that reads the store directly, because this
 * process *is* the server and fetching from yourself is a round trip bought
 * for nothing. That is the single place the two sides differ.
 */
import { renderToStringAsync } from '@firsthandjs/server';
import { createData, createMemoryStorage, serialize } from '@firsthandjs/data';
import { App } from '@/app/app';
import { caches } from '@/features/reading/api';
import { useTransport } from '@/shared/api/client';
import { listEntries, served, setRead } from '../../server/store';

useTransport({
  entries: () => Promise.resolve(listEntries()),
  setRead: (id, read) => {
    const entry = setRead(id, read);
    return entry === undefined
      ? Promise.reject(new Error(`No entry ${String(id)}`))
      : Promise.resolve(entry);
  },
});

/*
 * The store, through this module.
 *
 * The API and the render have to share one instance of it, or marking an
 * entry read changes a copy the next render does not look at. Re-exporting
 * here means the server has exactly one server module to load, in development
 * and in production alike.
 */
export { listEntries, setRead } from '../../server/store';

export type Rendered = {
  /** The markup for the element the browser hydrates. */
  readonly html: string;
  /** A script carrying everything this render used, for the browser to start from. */
  readonly state: string;
};

export async function render(): Promise<Rendered> {
  const storage = createMemoryStorage();
  const data = createData({ storage, caches });
  const served_ = served.length;

  const html = await renderToStringAsync(() => <App data={data} served={served_} />, {
    // Two things have to happen before the markup is worth sending: the
    // loaders have to answer, and the view has to be rendered again with the
    // answers in hand. This is the first; the second happens per pass.
    settle: () => data.settle(),
    // And a loader that never answers must not hold the response open.
    timeout: 2_000,
  });

  /*
   * Both halves of what the render used, not just the resource.
   *
   * `served` is rendered into the markup too, so the browser has to start
   * from the same number — hydrating with a different one would rewrite the
   * text the server sent, which is the mismatch this carries it to avoid.
   */
  return {
    html,
    state: `<script>window.__READING__ = ${serialize({
      data: storage.dump(),
      served: served_,
    })}</script>`,
  };
}
