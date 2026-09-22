# Firsthand SSR

A reading list of five entries, rendered on a server and adopted by the
browser, built with [Firsthand](https://github.com/FirsthandJS/firsthand).

It exists to show one thing end to end and nothing more: the page arrives with
its content in it, the browser takes over the nodes that are already there, and
everything the render loaded travels with the page so that nothing is fetched
twice. Roughly four hundred lines, most of them comments.

## Running it

```bash
npm install
npm run dev
```

It needs Firsthand 0.9.1 or later: a keyed row whose component returns a render
function — which is what an entry here is — was written into the page as the
function's own source before that.

There is no second server to start: `server/main.mjs` is `node:http` with Vite
as middleware, and it answers the API, the page and the modules together.

Then **view source**. The five entries are in the markup, the total —
"25 min left" — was worked out on the server, and a `<script>` at the end
carries the answer the render used. Then type in the filter: it responds
without a request, because the browser adopted that markup rather than
replacing it.

## What there is to look at

**The same components, compiled twice.** Nothing under `src/` is written for a
server or for a browser. `vite.config.ts` names the compiler once; Vite says
which build is which, and the compiler emits the same traversal against a
string writer instead of the DOM. `src/app/entry-server.tsx` and
`src/app/entry-client.tsx` are the only two files that know which side they are
on, and they are eleven lines of difference.

**The browser adopts, it does not rebuild.** Watch the DOM in devtools while
the page loads: no element under `<main>` is replaced. `<!--[-->` in the markup
says where a dynamic child begins; the rest of the navigation is the template
the browser already has. Where a dynamic child is its element's only content,
there is no marker at all — `<strong>5</strong>` in the status line is written
exactly as a static page would write it.

**The data crosses with the page.** `useEntries()` is declared with
`persist: 'entries'`. The server render fills a storage under that name, the
page carries it as `window.__READING__`, and the browser's store starts from
it — so the resource's first run finds the list already answered, and the first
paint is the markup rather than a spinner replacing it.

**What the browser then does is revalidate, not load.** A resource asks again
when it mounts, so there is one `/api/entries` in the network tab — and what
matters is what happens when it answers: nothing on the page is rebuilt. Every
element under `#app` after hydration _and_ after that answer is the element the
server sent, which is what `computed` in `pages/list.tsx` is there for. A list
whose data is worked out inside the run would be built again every time the run
happened; a derivation made in the setup is read from the markup, so the rows
update where they are.

**Marking an entry read proves the rest.** The action declares that it
invalidates `entries`; the list reloads because of that declaration and not
because any component said so, and the ten-second transport cache is emptied by
the same invalidation rather than answering out of date.

**The status line is evidence, not a claim.** It says "Rendered on the server"
in the markup, and the browser writes the hydration time into it once
`hydrate()` returns. The number of requests the process has answered is
rendered on the server _and_ carried in the state, because the browser has to
start from the same one — hydrating with a different number would rewrite text
the server sent, which is the mismatch this avoids by carrying it.

## The shape of it

```
server/
  store.ts              five entries in an array, and who has been served
  api.mjs               GET /api/entries, PATCH /api/entries/:id
  main.mjs              node:http, Vite in development, dist/ in production
src/
  app/
    app.tsx             the page, and the status line under it
    entry-server.tsx    render() → { html, state }
    entry-client.tsx    hydrate(), from the state the page carried
  features/reading/
    api.ts              useEntries, useEntryActions — the only file that has them
    model.ts            filtering and the total; no DOM, no framework
    components/entry.tsx
    pages/list.tsx      lays out the page and owns the filter
  shared/api/client.ts  the transport, and the seam the server replaces
```

Two rules, written out in [ARCHITECTURE.md](ARCHITECTURE.md): a component
renders and does not decide, and things that change together live together.
Imports are absolute — `@/features/reading/api`, never `../../../`.

## The server

`node:http` and nothing else. Two things in it are deliberate rather than
incidental:

- **The renderer and the API share one module.** `entry-server.tsx` re-exports
  the store, so there is exactly one instance of it. Loading the store
  separately would give the API a copy the next render does not look at, and
  marking an entry read would appear to work and then undo itself.
- **On the server, the transport reads the store directly.** The same
  `api.entries()` a component calls goes over HTTP in the browser and straight
  into the array on the server, because a process fetching from itself is a
  round trip bought for nothing. That swap is one function, installed in
  `entry-server.tsx`, and it is the only place the two sides differ.

Built assets are served from a `Map` built at startup, keyed by name. A request
never reaches the file system.

## Scripts

| Command         | What it does                                 |
| --------------- | -------------------------------------------- |
| `npm run dev`   | The server, with Vite as middleware          |
| `npm run build` | Two builds: `dist/client` and `dist/server`  |
| `npm start`     | The same server, serving those               |
| `npm run check` | `tsc --noEmit`                               |
| `npm test`      | Vitest: the model, and what the server sends |

## Documentation

The [server rendering guide](https://github.com/FirsthandJS/firsthand/blob/main/docs/guide/17-server-rendering.md)
covers `renderToStringAsync`, hydration and what `persist` does;
the [data guide](https://github.com/FirsthandJS/firsthand/blob/main/docs/guide/09-data.md)
covers resources, actions, tags and the cache.

For a project that shows the framework doing a whole job — routing, drag and
drop, GraphQL, two languages — see
[firsthand-kanban](https://github.com/FirsthandJS/firsthand-kanban). This one
is deliberately the opposite: one page, one resource, one action.

MIT licensed.
