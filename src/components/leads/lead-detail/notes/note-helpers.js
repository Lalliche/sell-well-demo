/**
 * Pure formatting + time helpers for the NotesTimeline composer + rows.
 * Kept in their own file so the JSX components stay scoped to layout.
 */

export function formatNoteDate(iso, locale) {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString(locale, {
    month: "short", day: "numeric", year: "numeric",
  });
}

export function formatNoteTime(iso, locale) {
  if (!iso) return "";
  return new Date(iso).toLocaleTimeString(locale, {
    hour: "2-digit", minute: "2-digit",
  });
}

export function nowYMD() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function nowHM() {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

export function toIso(ymd, hm) {
  // Local-tz interpretation; the backend will normalize to UTC.
  const [y, m, d] = ymd.split("-").map(Number);
  const [h, min] = hm.split(":").map(Number);
  return new Date(y, m - 1, d, h, min, 0, 0).toISOString();
}
