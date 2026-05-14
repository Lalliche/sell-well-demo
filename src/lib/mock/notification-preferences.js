/**
 * Mock notification-preferences layer.
 *
 * Two endpoints (forward-looking):
 *   fetchNotificationPreferences({ userId })
 *     → GET /api/me/notification-preferences/
 *   updateNotificationPreference({ userId, eventType, patch })
 *     → PATCH /api/me/notification-preferences/:event_type/
 *
 * The frontend reads the catalog from `_seed/notification-events.ts` and
 * merges it with the user's `NotificationPreference` overrides (if any).
 * That merge happens in the page layer (NotificationPreferencesTab) so the
 * mock fns stay thin and the wire shape matches backend exactly.
 *
 * Mutation semantics: `updateNotificationPreference` is an upsert. If a row
 * exists for the `(userId, eventType)` pair it's updated; otherwise it's
 * created. Writing the catalog default back is allowed — it overrides any
 * earlier flip. Pruning default-matching rows is an optimization the real
 * backend can do; the mock keeps them for simplicity.
 */

import { MOCK_NOTIFICATION_PREFERENCES } from "./_seed/notification-preferences";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** In-session mutable copy. Mark-read mutations on the notifications module
 *  use the same pattern. */
let _prefs = MOCK_NOTIFICATION_PREFERENCES.map((p) => ({ ...p }));

/** GET /api/me/notification-preferences/
 *  Returns every row for the current user. The caller (Preferences tab)
 *  merges with the catalog defaults to compute per-event values. */
export async function fetchNotificationPreferences({ userId } = {}) {
  await sleep(200);
  if (typeof userId !== "number") return [];
  return _prefs.filter((p) => p.user === userId).map((p) => ({ ...p }));
}

/** PATCH /api/me/notification-preferences/:event_type/
 *  Upsert. `patch` carries the changed channels — currently `{ email }` only
 *  (the in-app column is disabled in the UI per the V1 caveat). The full
 *  row is always returned so React Query can patch the cache without a
 *  refetch. */
export async function updateNotificationPreference({ userId, eventType, patch }) {
  await sleep(180);
  if (typeof userId !== "number" || !eventType) {
    throw new Error("updateNotificationPreference: userId + eventType required");
  }

  const now = new Date().toISOString();
  const existing = _prefs.find(
    (p) => p.user === userId && p.event_type === eventType,
  );

  if (existing) {
    const next = { ...existing, ...patch, updated_at: now };
    _prefs = _prefs.map((p) =>
      p.user === userId && p.event_type === eventType ? next : p,
    );
    return { ...next };
  }

  // No row yet — create one with the patched value(s). Channels not in the
  // patch fall back to the catalog defaults; the caller is responsible for
  // passing values consistent with the catalog mode (e.g. don't patch
  // `email: true` for an in-app-only event — the UI prevents this).
  const created = {
    user: userId,
    event_type: eventType,
    // Sensible defaults so the row is well-formed even if only `email` is
    // patched. Real backend will read defaults from a server-side catalog.
    in_app: true,
    email: true,
    ...patch,
    updated_at: now,
  };
  _prefs = [..._prefs, created];
  return { ...created };
}
