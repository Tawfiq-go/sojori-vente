/**
 * Lightweight client/server logger.
 *
 * Keeps the browser console quiet by default. Verbose levels (debug/info/warn)
 * only print when NEXT_PUBLIC_DEBUG=true. Real errors always print so we never
 * silently swallow failures.
 *
 * Enable verbose logs locally with `NEXT_PUBLIC_DEBUG=true` in `.env.local`.
 */

const DEBUG =
  typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_DEBUG === 'true';

export const logger = {
  debug: (...args: unknown[]): void => {
    if (DEBUG) console.debug(...args);
  },
  info: (...args: unknown[]): void => {
    if (DEBUG) console.info(...args);
  },
  warn: (...args: unknown[]): void => {
    if (DEBUG) console.warn(...args);
  },
  error: (...args: unknown[]): void => {
    console.error(...args);
  },
};

export default logger;
