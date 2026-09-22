/**
 * What the browser runs, once.
 *
 * `hydrate` instead of `render`, over a storage seeded from what the server
 * put in the page. That is the whole difference — the view is the same view,
 * and this file is the only one in `src/` that mentions either.
 *
 * It installs no transport: the one in `shared/api/client.ts` is already the
 * browser's.
 */
import { hydrate } from '@firsthandjs/dom/hydrate';
import { createData, createMemoryStorage } from '@firsthandjs/data';
import { App, hydratedIn } from '@/app/app';
import { caches } from '@/features/reading/api';

declare global {
  interface Window {
    __READING__?: { data: Record<string, unknown>; served: number };
  }
}

/*
 * What the server used, read back before anything renders. The named resource
 * finds its value here during its first run, so the first thing the browser
 * does with the list is recognise the one already on the page — and `served`
 * is the number the markup already shows.
 */
const sent = window.__READING__ ?? { data: {}, served: 0 };
const data = createData({ storage: createMemoryStorage(sent.data), caches });

const started = performance.now();
hydrate(
  () => <App data={data} served={sent.served} />,
  document.getElementById('app') as HTMLElement,
);
// Written after hydration rather than during it, so that what the server
// rendered and what the browser adopted are the same markup. The status line
// is a part, so it updates itself.
hydratedIn.value = performance.now() - started;
