# How this project is laid out

Two rules, and everything below follows from them.

1. **A component renders. It does not decide.** What to load, what a mutation
   changes, what counts as a match for the filter — none of that belongs in a
   file whose job is to produce markup.
2. **Things that change together live together.** A feature is a folder: its
   operations, its rules, its page and the components only it uses.

The third rule the [kanban project](https://github.com/FirsthandJS/firsthand-kanban)
keeps — one responsibility per component — is here too, but with one feature
and two components there is nothing to demonstrate. This project is small on
purpose: it is about the seam between a server and a browser, and everything
that is not that seam is kept out of the way.

## The shape

```
server/                   not part of the application; it serves it
  store.ts                five entries, and how many requests were answered
  api.mjs                 GET /api/entries, PATCH /api/entries/:id
  main.mjs                node:http; Vite in development, dist/ in production

src/
  app/
    app.tsx               the page, and the status line under it
    app.css
    entry-server.tsx      one render, per request
    entry-client.tsx      one hydration, per tab

  features/reading/
    api.ts                useEntries, useEntryActions
    model.ts              matching, filtering, the total
    model.test.ts         beside what it tests
    components/entry.tsx  one entry, and the button on it
    pages/list.tsx        lays out the page; owns the filter

  shared/
    api/client.ts         the transport, the cache, and the seam
```

## Where the logic goes

`features/reading/api.ts` is the only file in which `useResource` and
`useAction` appear:

```ts
export function useEntries() {
  return useResource(
    ({ request, tags }) => {
      tags(tag('entries'));
      return api.entries(request);
    },
    { persist: 'entries' },
  );
}
```

The page then reads `const entries = useEntries()` and gets state — loading,
loaded, failed — without knowing that there is an HTTP API on one side and an
array on the other. Three things follow, and they are the point:

- **The page has no idea how anything is fetched.** Swapping `fetch` for
  something else touches `shared/api/client.ts` and nothing else. The server
  already does exactly that swap, for real.
- **The rules are testable without a DOM.** `model.test.ts` is eight tests over
  three functions, and it never mounts anything.
- **A component's imports say what it does.** A file that imports the
  transport is doing transport; a file that imports its feature's hooks is
  doing layout.

What deliberately stays in a component is **local interaction state**: the
filter text in `pages/list.tsx`. It is not a rule, nobody else needs it, and
lifting it into `api.ts` would turn one signal into a prop, a callback and a
comment explaining the pair.

## The two entry points

This is the only structure server rendering imposes, and it is small.

```
entry-server.tsx          entry-client.tsx
  a storage, per request    the storage the page carried
  a data store, per request a data store for the tab
  renderToStringAsync       hydrate
  → { html, state }         → the same tree, now alive
```

Everything above them — `app.tsx` and everything it reaches — is written once
and compiled twice. The compiler emits the same traversal against
`@firsthandjs/server/internal` instead of `@firsthandjs/dom/internal`, and
Vite's `ssr` flag is what chooses. No component has a branch in it for which
side it is on.

**Per request, and nothing shared.** The storage, the data store and the owner
the render creates all live for one render and are disposed with it. Module
state on a server is state shared between visitors, which is the only rule
server rendering really has, and the way to keep it is to put nothing in a
module that a request can write to. `server/store.ts` is the exception, and it
is the thing standing in for a database.

**The data travels with the page.** `renderToStringAsync` settles the
resources, and `storage.dump()` is everything they answered, keyed by the
`persist` name. `serialize` writes it into the page and the client's
`createMemoryStorage(sent.data)` starts from it. Two rules about that script:
it is written where the browser will find it before the module runs, and
nothing in it can close the element it sits in — which
[a test asserts](src/app/entry-server.test.ts), because the day it can is the
day this is an injection.

**Anything the server rendered that the browser must agree about travels too.**
The status line's request count is rendered into the markup, so the browser has
to begin with the same number — not zero, and not its own guess. Hydrating with
a different one would rewrite text the server sent. That is what a mismatch
costs here: the page is still right, and the work hydration saved is spent.

## The server is not the application

`server/` is plain JavaScript, deliberately: nothing there compiles TSX,
imports the framework, or knows what a component is. It loads one module —
`entry-server.tsx` — and asks it for `{ html, state }`.

Two decisions in it are worth the words:

- **One module, one store.** The renderer re-exports the store rather than the
  server loading it separately, because the API and the render have to change
  the same array. Two copies is a bug that passes every test and fails on the
  second click.
- **The transport is injected, not imported conditionally.** `entry-server.tsx`
  installs a transport that reads the store directly. Writing
  `if (import.meta.env.SSR) import('./store')` inside a shared file would ship
  the store to the browser, with every entry in it, to be thrown away.

## Testing

Two files, and neither of them mounts a component.

- `model.test.ts` — the rules: what matches a filter, what the total is when
  everything is read.
- `entry-server.test.ts` — what the server sends: the entries are in the
  markup, the total was worked out there, the region markers are present, the
  state carries what the render loaded, and the script cannot be closed by its
  own data.

What is deliberately **not** asserted here is that the browser adopts this
markup. That is the framework's guarantee, and the framework asserts it over
thirty shapes in three engines; repeating it in an example would mean
rebuilding that harness to prove something already proven.

These run under `environment: 'node'`, which is what makes them possible:
Vitest compiles a module the way the environment implies, so `App` is compiled
for a server there exactly as `npm run build` compiles it.
