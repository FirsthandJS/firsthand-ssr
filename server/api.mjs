/**
 * The API, which is two routes.
 *
 * It is here rather than behind a second process for the same reason kanban's
 * GraphQL server is a Vite plugin: a reader should be able to start this with
 * one command and have everything running.
 *
 * The store is loaded through the caller, so that development gets it through
 * Vite — the same module instance the server render uses, so marking an entry
 * read is visible to the next render.
 */

/** Answers `/api/...`, or says it did not. */
export async function handleApi(request, response, store) {
  const url = (request.url ?? '/').split('?')[0];

  if (url === '/api/entries' && request.method === 'GET') {
    json(response, 200, store.listEntries());
    return true;
  }

  const marked = /^\/api\/entries\/(\d+)$/.exec(url);
  if (marked !== null && request.method === 'PATCH') {
    const body = await read(request);
    const entry = store.setRead(Number(marked[1]), body.read === true);
    if (entry === undefined) {
      json(response, 404, { error: 'No such entry' });
      return true;
    }
    json(response, 200, entry);
    return true;
  }

  if (url.startsWith('/api/')) {
    json(response, 404, { error: 'No such route' });
    return true;
  }
  return false;
}

function json(response, status, body) {
  response.writeHead(status, { 'content-type': 'application/json; charset=utf-8' });
  response.end(JSON.stringify(body));
}

/** The body, with a bound: a request is not allowed to be a denial of service. */
async function read(request) {
  const chunks = [];
  let size = 0;
  for await (const chunk of request) {
    size += chunk.length;
    if (size > 4096) {
      throw new Error('Request body too large');
    }
    chunks.push(chunk);
  }
  return chunks.length === 0 ? {} : JSON.parse(Buffer.concat(chunks).toString('utf8'));
}
