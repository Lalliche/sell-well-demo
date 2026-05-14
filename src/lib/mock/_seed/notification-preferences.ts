import type { NotificationPreference } from "@/types";

/**
 * Mock NotificationPreference seed.
 *
 * Starts empty — every user is on system defaults (the channel defaults
 * baked into `NOTIFICATION_EVENT_CATALOG`). Rows are appended only when the
 * user explicitly flips a default in the Preferences tab.
 *
 * When the backend ships, this seed is unused; the `NotificationPreference`
 * Django model owns the rows and `fetchNotificationPreferences(userId)`
 * swaps to `GET /api/me/notification-preferences/`.
 *
 * Why empty by default: the catalog defaults already encode the intended
 * behavior. Pre-seeding overrides would mean every test user starts with
 * unexplained drift from the defaults the spec describes.
 */
export const MOCK_NOTIFICATION_PREFERENCES: NotificationPreference[] = [];
