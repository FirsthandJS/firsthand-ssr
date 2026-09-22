/**
 * The transport, and the one thing server rendering changes about it.
 *
 * In the browser a loader makes a request. On a server the data is already in
 * this process, and asking yourself over HTTP is a round trip, a port and a
 * failure mode bought for nothing. So there are two transports and the entry
 * point installs one:
 *
 *     entry-client   fetch('/api/entries')      — the default, below
 *     entry-server   listEntries()              — installed in entry-server
 *
 * Installed rather than detected. A `typeof window` check would read as less
 * code and cost more: the branch would still be in the browser's bundle, and
 * with it the import of the store — which is the data, all of it, shipped to
 * a page that was given the answer already.
 *
 * Nothing above this file knows which transport is in place.
 */

import { createCacheClient } from '@firsthandjs/data';
import type { DataRequest } from '@firsthandjs/data';

export type Entry = {
  readonly id: number;
  readonly title: string;
  readonly author: string;
  readonly summary: string;
  readonly minutes: number;
  readonly read: boolean;
};

export type Transport = {
  entries(request: DataRequest): Promise<readonly Entry[]>;
  setRead(id: number, read: boolean, request: DataRequest): Promise<Entry>;
};

/**
 * The transport's own memory, and the only cache here.
 *
 * Ten seconds, so two components asking for the same thing in one render ask
 * once. An invalidation reaches through it — that is what `force` on the
 * request is for — so marking an entry read is not answered out of the ten
 * seconds the list was being held for.
 */
export const cache = createCacheClient({ ttl: 10_000 });

async function send<T>(path: string, request: DataRequest, init?: RequestInit): Promise<T> {
  const response = await fetch(path, { ...init, signal: request.signal });
  if (!response.ok) {
    throw new Error(`${init?.method ?? 'GET'} ${path} failed: ${String(response.status)}`);
  }
  return (await response.json()) as T;
}

/** What a browser does: ask the server, and remember the answer briefly. */
const http: Transport = {
  entries: (request) =>
    cache.read<readonly Entry[]>('entries', (one) => send('/api/entries', one))(request),
  setRead: (id, read, request) =>
    send(`/api/entries/${String(id)}`, request, {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ read }),
    }),
};

let installed: Transport = http;

/** Called once, by an entry point, before anything renders. */
export function useTransport(next: Transport): void {
  installed = next;
}

export const api: Transport = {
  entries: (request) => installed.entries(request),
  setRead: (id, read, request) => installed.setRead(id, read, request),
};
