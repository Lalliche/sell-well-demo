/**
 * Mock notifications layer.
 *
 * Backed by MOCK_NOTIFICATIONS seed. Swap-ready: when the backend ships,
 * each function's body changes to hit GET/POST /api/notifications/* — the
 * function signatures and return shapes stay identical.
 */

import { MOCK_NOTIFICATIONS } from "./_seed/notifications";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** Mutable per-process copy so mark-read mutations persist across calls
 *  during a session. (Real backend obviously persists in DB.) */
let _notifications = MOCK_NOTIFICATIONS.map((n) => ({ ...n }));

/** GET /api/notifications/?user=:id
 *  Filters by `user` (current authenticated user). Sorted newest-first. */
export async function fetchNotifications({ userId } = {}) {
  await sleep(200);
  // Mock seeds use numeric IDs; real Supabase users have UUID strings.
  // Return empty array for UUID users — notifications are mocked only for
  // the seeded numeric-ID dev users.
  if (!userId) return [];
  if (typeof userId === "string") return []; // real Supabase user → no mock notifs
  const rows = _notifications.filter((n) => n.user === userId);
  return [...rows].sort(
    (a, b) => new Date(b.created_at) - new Date(a.created_at),
  );
}

/** POST /api/notifications/:id/read/ */
export async function markRead(id) {
  await sleep(150);
  _notifications = _notifications.map((n) =>
    n.id === id ? { ...n, is_read: true } : n,
  );
  return null;
}

/** POST /api/notifications/read-all/ */
export async function markAllRead({ userId } = {}) {
  await sleep(200);
  _notifications = _notifications.map((n) =>
    typeof userId === "number" && n.user !== userId
      ? n
      : { ...n, is_read: true },
  );
  return null;
}
