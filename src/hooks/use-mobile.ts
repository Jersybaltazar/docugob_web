"use client";

/**
 * DocuGob — Viewport-size detection hook.
 *
 * React 19 — uses `useSyncExternalStore`, the canonical pattern for
 * subscribing to browser APIs. It eliminates the previous
 * `set-state-in-effect` warning AND prevents tearing during
 * concurrent renders.
 *
 * SSR: returns `false` (desktop) until the client mounts; the first
 * client render then reads the actual viewport size in a single
 * commit instead of a deferred `useEffect` flip.
 */

import * as React from "react";

const MOBILE_BREAKPOINT = 768;
const MEDIA_QUERY = `(max-width: ${MOBILE_BREAKPOINT - 1}px)`;

function subscribe(callback: () => void): () => void {
  const mql = window.matchMedia(MEDIA_QUERY);
  mql.addEventListener("change", callback);
  return () => mql.removeEventListener("change", callback);
}

function getSnapshot(): boolean {
  return window.matchMedia(MEDIA_QUERY).matches;
}

function getServerSnapshot(): boolean {
  return false;
}

export function useIsMobile(): boolean {
  return React.useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
