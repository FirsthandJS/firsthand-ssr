/**
 * The reading list, and the one thing that can be done to it.
 *
 * The only file where `useResource` and `useAction` appear. A page asks for
 * `useEntries()` and gets state — loading, loaded, failed — without knowing
 * that there is an HTTP API on one side and a plain array on the other.
 */
import { tag, useAction, useResource } from '@firsthandjs/data';
import { api, cache } from '@/shared/api/client';
import type { Entry } from '@/shared/api/client';

/**
 * Every entry.
 *
 * `persist` is the name this answer crosses the wire under. The server render
 * fills a storage with it and the page carries it, so the browser finds the
 * list already answered during this resource's first run — which is what makes
 * the first paint the markup rather than a spinner replacing it.
 *
 * `tags` is what an invalidation is about. Marking an entry read says it
 * changed `entries`, and this is the resource that hears it.
 */
export function useEntries() {
  return useResource(
    ({ request, tags }) => {
      tags(tag('entries'));
      return api.entries(request);
    },
    { persist: 'entries' },
  );
}

/**
 * Marking one read, and what that changes.
 *
 * The action declares `entries` as invalidated, so the list reloads itself
 * without this file — or the page — saying so. The cache is handed the same
 * invalidation, which is why the reload is not answered out of the ten seconds
 * it was holding.
 */
export function useEntryActions() {
  const mark = useAction(
    ({ id, read }: { id: number; read: boolean }, { request, invalidates }) => {
      invalidates(tag('entries'));
      return api.setRead(id, read, request);
    },
  );

  return { mark, busy: mark.running };
}

export type { Entry };

/** Given to `createData`, so an invalidation empties what the transport holds. */
export const caches = [cache];
