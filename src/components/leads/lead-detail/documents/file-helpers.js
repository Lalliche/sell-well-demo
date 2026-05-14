/**
 * Tiny helpers for the LeadDocument composer + grid. Pure functions only.
 *
 * Mock layer: the backend will store files on S3 / disk; here we generate
 * an object URL per uploaded `File` so the existing DocumentPreviewModal
 * can render them. Object URLs aren't revoked when the partner removes the
 * row — the next session will collect them; not worth tracking lifecycles
 * in mock-only code.
 */

export function objectUrlFor(file) {
  if (typeof window === "undefined" || !(file instanceof File)) return null;
  return URL.createObjectURL(file);
}

export function isValidUrl(s) {
  try {
    const u = new URL(s);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

/** Default label for a fresh File upload — drops the extension so the
 *  partner sees something readable without typing. They can still edit. */
export function defaultLabelFromFile(file) {
  if (!file) return "";
  return (file.name ?? "Untitled").replace(/\.[^.]+$/, "");
}
