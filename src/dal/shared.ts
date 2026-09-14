import "server-only";
import { ApiError } from "@/lib/api/client";
import type { LoadIssue } from "./types";

/**
 * Helpers for screens that aggregate several independent reads.
 *
 * A fresh database returns empty lists, and a stopped backend fails every call.
 * Neither should blank a whole page, so loaders collect per-read failures as
 * `LoadIssue`s and render whatever did succeed.
 */

/** Converts a tolerated read failure into a reportable issue. */
export function toIssue(source: string, error: ApiError | null): LoadIssue | null {
  if (!error) return null;
  return {
    source,
    message: error.message,
    unreachable: error.isUnreachable,
  };
}

export const collectIssues = (
  ...issues: (LoadIssue | null)[]
): LoadIssue[] => issues.filter((issue): issue is LoadIssue => issue !== null);

/** True when every read failed because the backend is down, not just empty. */
export const isBackendDown = (issues: LoadIssue[]): boolean =>
  issues.length > 0 && issues.every((issue) => issue.unreachable);

/**
 * Backend list routes cap `limit` at 500. Pages that aggregate over the whole
 * table (workload, pipeline) read up to this many rows.
 */
export const MAX_PAGE_SIZE = 500;
