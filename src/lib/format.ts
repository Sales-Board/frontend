/** Display formatting. No data derivation happens here — see `api/adapters.ts`. */

/**
 * Backend timestamp columns are `DateTime(timezone=True)`, so values normally
 * carry an offset. A value that arrives without one is treated as UTC, matching
 * how the database stores it — parsing it as local time would shift every date.
 */
export function parseDate(value: string | null | undefined): Date | null {
  if (!value) return null;
  const hasZone = /(?:Z|[+-]\d{2}:?\d{2})$/.test(value);
  const date = new Date(hasZone || !value.includes("T") ? value : `${value}Z`);
  return Number.isNaN(date.getTime()) ? null : date;
}

const DATE_TIME = new Intl.DateTimeFormat("en-IN", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  hour12: true,
});

const DATE_ONLY = new Intl.DateTimeFormat("en-IN", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

export function formatDateTime(value: string | null | undefined): string {
  const date = parseDate(value);
  return date ? DATE_TIME.format(date) : "—";
}

export function formatDate(value: string | null | undefined): string {
  const date = parseDate(value);
  return date ? DATE_ONLY.format(date) : "—";
}

/** "3 days ago" / "in 2 hours"; falls back to an absolute date beyond a month. */
export function formatRelative(value: string | null | undefined): string {
  const date = parseDate(value);
  if (!date) return "—";

  const diffMs = date.getTime() - Date.now();
  const diffMin = Math.round(diffMs / 60_000);
  const abs = Math.abs(diffMin);

  if (abs < 1) return "just now";
  if (abs < 60) return relative(diffMin, "minute");
  if (abs < 60 * 24) return relative(Math.round(diffMin / 60), "hour");
  if (abs < 60 * 24 * 30) return relative(Math.round(diffMin / (60 * 24)), "day");
  return DATE_ONLY.format(date);
}

const RELATIVE = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
const relative = (value: number, unit: Intl.RelativeTimeFormatUnit) =>
  RELATIVE.format(value, unit);

const NUMBER = new Intl.NumberFormat("en-IN");

export const formatNumber = (value: number | null | undefined): string =>
  value === null || value === undefined || Number.isNaN(value)
    ? "—"
    : NUMBER.format(value);

/**
 * The backend reports `conversion_rate` as a fraction (0.326), not a percent.
 * Adapters convert to 0–100 before anything reaches this function.
 */
export function formatPercent(value: number | null | undefined, digits = 1): string {
  if (value === null || value === undefined || Number.isNaN(value)) return "—";
  return `${value.toFixed(digits)}%`;
}

/** Seconds to a compact duration, e.g. "4m 12s". */
export function formatDuration(seconds: number | null | undefined): string {
  if (seconds === null || seconds === undefined || Number.isNaN(seconds)) return "—";
  if (seconds < 60) return `${Math.round(seconds)}s`;
  const mins = Math.floor(seconds / 60);
  const rest = Math.round(seconds % 60);
  if (mins < 60) return rest ? `${mins}m ${rest}s` : `${mins}m`;
  const hours = Math.floor(mins / 60);
  return `${hours}h ${mins % 60}m`;
}

/** Turns `lead_created` / `next-best-action` into "Lead created". */
export function humanize(value: string | null | undefined): string {
  if (!value) return "—";
  const spaced = value.replace(/[_-]+/g, " ").trim();
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

/** Non-empty string or an em dash, so tables never render "null". */
export const orDash = (value: string | null | undefined): string =>
  value && value.trim() ? value : "—";
