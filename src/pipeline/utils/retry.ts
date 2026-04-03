import { childLogger } from "./logger.js";

const log = childLogger("retry");

export interface RetryOptions {
  maxRetries?: number;
  baseDelayMs?: number;
  /** Maximum delay between retries in ms */
  maxDelayMs?: number;
}

const DEFAULTS: Required<RetryOptions> = {
  maxRetries: 3,
  baseDelayMs: 1000,
  maxDelayMs: 10_000,
};

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function withRetry<T>(
  fn: () => Promise<T>,
  label: string,
  opts?: RetryOptions,
): Promise<T> {
  const { maxRetries, baseDelayMs, maxDelayMs } = { ...DEFAULTS, ...opts };

  for (let attempt = 1; attempt <= maxRetries + 1; attempt++) {
    try {
      return await fn();
    } catch (err) {
      const isLast = attempt > maxRetries;
      if (isLast) {
        log.error({ err, label, attempt }, "All retries exhausted");
        throw err;
      }
      const delay = Math.min(baseDelayMs * 2 ** (attempt - 1), maxDelayMs);
      log.warn({ err, label, attempt, delay }, "Retrying after failure");
      await sleep(delay);
    }
  }

  throw new Error("unreachable");
}

export async function fetchWithRetry(
  url: string,
  init?: RequestInit,
  opts?: RetryOptions,
): Promise<Response> {
  return withRetry(
    async () => {
      const res = await fetch(url, init);
      if (!res.ok) {
        throw new Error(`HTTP ${res.status} ${res.statusText} from ${url}`);
      }
      return res;
    },
    `GET ${url}`,
    opts,
  );
}
