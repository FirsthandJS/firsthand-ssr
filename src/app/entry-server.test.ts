/**
 * What the server sends.
 *
 * The claim this project exists to make is that the page arrives with its
 * content in it, and that everything the render used travels with it. Both are
 * invisible when they stop being true — a page that loads its data in the
 * browser looks the same a moment later — so both are asserted here.
 *
 * These run under `environment: 'node'`, which is what makes them possible:
 * Vitest compiles a module the way the environment implies, so `App` is
 * compiled for a server here exactly as `npm run build` compiles it.
 *
 * What is *not* asserted here is that the browser adopts this markup. That is
 * the framework's guarantee, and the framework asserts it over thirty shapes
 * in three engines; repeating it in an example would mean rebuilding that
 * harness to prove something already proven.
 */
import { describe, expect, it } from 'vitest';
import { render } from '@/app/entry-server';

/** The `<script>` the page carries, read back the way a browser reads it. */
function stateOf(markup: string): { data: Record<string, unknown>; served: number } {
  const found = /window\.__READING__ = (.*)<\/script>/.exec(markup);
  if (found === null) {
    throw new Error('The render carried no state.');
  }
  return JSON.parse(found[1] as string) as { data: Record<string, unknown>; served: number };
}

describe('a server render', () => {
  it('puts the entries in the markup, rather than a spinner', async () => {
    const { html } = await render();

    expect(html).toContain('A render that happens once');
    expect(html).toContain('Parts, not diffs');
    expect(html).not.toContain('Loading…');
  });

  it('works out what depends on the data, on the server', async () => {
    const { html } = await render();

    // The five entries add up to twenty-five minutes, and the page says so
    // because the server got that far — not because the browser will.
    expect(html).toContain('25');
  });

  it('marks where every dynamic child begins, so the browser can adopt it', async () => {
    const { html } = await render();

    expect(html).toContain('<!--[-->');
  });

  it('carries the answer it loaded, under the name the resource has', async () => {
    const { state } = await render();
    const sent = stateOf(state);

    expect(Object.keys(sent.data)).toEqual(['entries']);
    expect(sent.data['entries']).toHaveLength(5);
  });

  it('carries the number it rendered, so the browser renders the same one', async () => {
    const { html, state } = await render();
    const sent = stateOf(state);

    // Hydrating with a different count would rewrite text the server sent.
    // No region marker around it: the number is its element's only child, so
    // where the element's children start is where the region starts and the
    // markup says nothing it does not have to.
    expect(html).toContain(`<strong>${String(sent.served)}</strong>`);
  });

  it('cannot have its data close the script element it is written into', async () => {
    const { state } = await render();

    expect(state.indexOf('</script>')).toBe(state.length - '</script>'.length);
  });
});
