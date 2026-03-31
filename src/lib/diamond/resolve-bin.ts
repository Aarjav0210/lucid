import { accessSync, constants } from "fs";
import path from "path";

/**
 * Resolve the Diamond binary path.
 * - If a bundled Linux binary exists at `bin/diamond`, use it (Vercel).
 * - Otherwise fall back to `diamond` on the system PATH (local dev).
 */
export function getDiamondBin(): string {
  const bundled = path.resolve(process.cwd(), "bin", "diamond");
  try {
    accessSync(bundled, constants.X_OK);
    return bundled;
  } catch {
    return "diamond";
  }
}

/**
 * On Vercel (serverless), the only writable directory is /tmp.
 * Locally, use data/diamond/tmp as before.
 */
export function getTmpDir(): string {
  if (process.env.VERCEL) {
    return "/tmp/diamond";
  }
  return path.resolve(process.cwd(), "data", "diamond", "tmp");
}
