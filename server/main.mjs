/**
 * The smallest server that can serve this.
 *
 * `node:http` and Vite, and nothing else — there is nothing here a framework
 * would do. In development Vite is a middleware and the modules are loaded
 * through it, so an edit is on the page before the request finishes. In
 * production the two builds are read off disk.
 *
 *   npm run dev                   development
 *   npm run build && npm start    production
 */
import { createServer } from 'node:http';
import { readFileSync, readdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { handleApi } from './api.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const production = process.env.NODE_ENV === 'production';
const port = Number(process.env.PORT ?? 5180);

const vite = production
  ? null
  : await (
      await import('vite')
    ).createServer({ root, appType: 'custom', server: { middlewareMode: true } });

/**
 * The one server module: the renderer, and the store it renders from.
 *
 * Both come from the same place, which matters — the API and the render have
 * to share one instance of the store, or marking an entry read changes a copy
 * the next render does not look at. In development Vite hands back the same
 * module it just rebuilt; in production it is the SSR bundle.
 */
const serverModule = () =>
  production
    ? import('../dist/server/entry-server.js')
    : vite.ssrLoadModule('/src/app/entry-server.tsx');

const template = production ? readFileSync(resolve(root, 'dist/client/index.html'), 'utf8') : null;

/**
 * The built assets, read once and served by name.
 *
 * A request never reaches the file system: the URL is a key into a map built
 * from what the bundler produced. Joining a path with something a visitor
 * typed is how a server ends up serving `/etc/passwd`, and there is no reason
 * to do it when the set of files is known before the first request arrives.
 */
const TYPES = {
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.woff2': 'font/woff2',
};

const assets = new Map();
if (production) {
  const directory = resolve(root, 'dist', 'client', 'assets');
  for (const name of readdirSync(directory)) {
    assets.set(`/assets/${name}`, {
      body: readFileSync(resolve(directory, name)),
      type: TYPES[name.slice(name.lastIndexOf('.'))] ?? 'application/octet-stream',
    });
  }
}

async function page(request, response, server) {
  const page = production
    ? template
    : await vite.transformIndexHtml(
        request.url ?? '/',
        readFileSync(resolve(root, 'index.html'), 'utf8'),
      );

  const { html, state } = await server.render();
  response.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
  response.end(page.replace('<!--app-html-->', html).replace('<!--app-state-->', state));
}

async function serve(request, response) {
  try {
    const server = await serverModule();
    if (await handleApi(request, response, server)) {
      return;
    }
    const asset = assets.get((request.url ?? '/').split('?')[0]);
    if (asset !== undefined) {
      response.writeHead(200, { 'content-type': asset.type });
      response.end(asset.body);
      return;
    }
    await page(request, response, server);
  } catch (error) {
    vite?.ssrFixStacktrace(error);
    // To the log, not to the visitor: a stack trace names the files a server
    // is made of, and whoever asked for this page is not who should read it.
    console.error(error);
    response.writeHead(500, { 'content-type': 'text/plain; charset=utf-8' });
    response.end('Internal Server Error');
  }
}

createServer((request, response) => {
  if (production) {
    void serve(request, response);
    return;
  }
  // Vite answers for anything it owns — modules, assets, its own client — and
  // calls through for everything else.
  vite.middlewares(request, response, () => {
    void serve(request, response);
  });
}).listen(port, () => {
  console.log(`  Firsthand SSR example on http://localhost:${String(port)}/`);
});
