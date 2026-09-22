/// <reference types="vitest/config" />
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import { firsthand } from '@firsthandjs/compiler/vite';

export default defineConfig({
  plugins: [
    // TSX into DOM instructions for the browser, and into markup for the
    // server. Which of the two is not configured here: Vite says which build
    // it is running and the plugin asks. `hydratable` is the one thing this
    // project has to declare, and it declares it once.
    firsthand({ packageName: 'firsthand-ssr', hydratable: true }),
  ],
  // The same `@/` the tsconfig declares, so the editor and the bundler agree.
  resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
  build: { manifest: true },
  /*
   * Node, not a DOM emulation — and that is the whole test strategy.
   *
   * Vitest compiles a module the way the environment implies: for a browser
   * under `happy-dom`, and for a server under `node`. This project's tests are
   * about the rules and about what the server sends, and neither needs a DOM.
   * That the browser then adopts the markup is the framework's guarantee, and
   * the framework asserts it over thirty shapes in three engines rather than
   * here.
   */
  test: { environment: 'node' },
});
