import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

/**
 * Optional overrides for long-running CLI jobs (e.g. `pipeline:seed` on Supabase):
 * - `USE_DIRECT_URL_FOR_PIPELINE=1` — use `DIRECT_URL` (session/direct on port 5432) instead of the pooler in `DATABASE_URL`.
 * - `PIPELINE_DATABASE_URL` — if set, used as the datasource URL (unless `USE_DIRECT_URL_FOR_PIPELINE` supplies `DIRECT_URL` first).
 *
 * Transaction poolers can drop very long sessions; direct/session mode is safer for bulk upserts.
 */
function pipelineDatasourceUrl(): string | undefined {
  if (
    process.env.USE_DIRECT_URL_FOR_PIPELINE === "1" ||
    process.env.USE_DIRECT_URL_FOR_PIPELINE === "true"
  ) {
    const d = process.env.DIRECT_URL?.trim();
    if (d) return d;
  }
  return process.env.PIPELINE_DATABASE_URL?.trim() || undefined;
}

function createPrismaClient(): PrismaClient {
  const url = pipelineDatasourceUrl();
  return new PrismaClient({
    ...(url ? { datasources: { db: { url } } } : {}),
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "warn", "error"]
        : ["warn", "error"],
  });
}

export const prisma =
  globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
