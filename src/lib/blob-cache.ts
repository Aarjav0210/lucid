// ── blob-cache.ts ───────────────────────────────────────────────────────
//
// Thin wrapper around Vercel Blob used as a cross-user, persistent cache
// for screening-pipeline artifacts (InterPro JSON, ESMFold PDBs, Foldseek
// JSON). Entries are keyed by a deterministic pathname — typically
// `<bucket>/<sha256>.{json|pdb}` — so different users screening the
// same sequence hit the same blob.
//
// Activated when `BLOB_READ_WRITE_TOKEN` is set (Vercel wires this env var
// automatically for linked Blob stores). When the token is missing — e.g.
// local dev without Blob configured — all helpers no-op so callers can
// transparently fall back to their local filesystem cache.

import { list, put } from "@vercel/blob";

export function blobCacheEnabled(): boolean {
  return !!process.env.BLOB_READ_WRITE_TOKEN;
}

/**
 * Look up a blob by its exact pathname. Returns null if the token is
 * unset, the blob is missing, or the fetch fails for any reason.
 */
async function findBlobUrl(pathname: string): Promise<string | null> {
  try {
    // `list` with an exact-pathname prefix returns at most that single
    // blob (plus anything with a longer pathname that starts with it;
    // our pathnames always end in `.json` / `.pdb` so no collision).
    const { blobs } = await list({ prefix: pathname, limit: 1 });
    const match = blobs.find((b) => b.pathname === pathname);
    return match?.url ?? null;
  } catch (err) {
    console.warn(`[blob-cache] list failed for ${pathname}:`, err);
    return null;
  }
}

/**
 * Read a text blob by pathname. Returns null on miss or error.
 */
export async function readBlobText(pathname: string): Promise<string | null> {
  if (!blobCacheEnabled()) return null;

  const url = await findBlobUrl(pathname);
  if (!url) return null;

  try {
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) return null;
    return await res.text();
  } catch (err) {
    console.warn(`[blob-cache] fetch failed for ${pathname}:`, err);
    return null;
  }
}

/**
 * Write a text blob at a deterministic pathname. Overwrites any existing
 * blob at the same pathname. No-ops when the token is unset.
 *
 * Returns the public URL of the stored blob on success, or null if the
 * blob store is disabled or the write failed.
 */
export async function writeBlobText(
  pathname: string,
  content: string,
  contentType: string = "application/json"
): Promise<string | null> {
  if (!blobCacheEnabled()) return null;

  try {
    const { url } = await put(pathname, content, {
      access: "public",
      addRandomSuffix: false,
      allowOverwrite: true,
      contentType,
    });
    return url;
  } catch (err) {
    console.warn(`[blob-cache] write failed for ${pathname}:`, err);
    return null;
  }
}
