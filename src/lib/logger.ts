/**
 * DocuGob — Logger.
 *
 * AUDIT §10.5 — wrap `console.*` so debug noise stays out of production
 * bundles. In production only `warn` and `error` go through; `debug`
 * and `info` are no-ops.
 *
 * When we add Sentry/Axiom (sprint 9+) this is the single place to wire
 * the transport — no need to grep for `console.log` across the codebase.
 */

const isDev = process.env.NODE_ENV !== "production";

type LogArgs = unknown[];

function noop(): void {
  /* no-op in production */
}

export const logger = {
  debug: isDev ? (...args: LogArgs) => console.debug(...args) : noop,
  info: isDev ? (...args: LogArgs) => console.info(...args) : noop,
  warn: (...args: LogArgs) => console.warn(...args),
  error: (...args: LogArgs) => console.error(...args),
};
