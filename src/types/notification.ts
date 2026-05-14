/**
 * Mirror of the Notification model documented in
 * `shared-specs/data-model-spec.md` → Notifications.
 *
 * The `NotificationObjectType` union below MUST stay in lockstep with:
 *   - `data-model-spec.md` → "Notification related_object_type enum"
 *   - `client/src/components/dashboard/Notifications/notification-icons.js`
 *   - `client/src/components/dashboard/Notifications/notification-routes.js`
 *
 * Per the data-contract-sync rule. Adding a new value here without updating
 * the icon map or the route resolver will result in unmapped notifications
 * silently falling back to the generic Bell icon and routing to /dashboard.
 */
export type NotificationObjectType =
  | "lead"
  | "campaign"
  | "application"
  | "wallet"
  | "partner_link";

export interface Notification {
  id: number;
  user: number;
  /** Stable string event identifier — see data-model-spec.md. Not an enum
   *  on the backend; new event types may appear without a migration. */
  type: string;
  /** Localized — shown in popover rows and feed page. */
  title: string;
  /** Localized — shown on the feed page only. The popover is title-only. */
  body: string;
  is_read: boolean;
  /** Null for system-level notifications with no related entity. */
  related_object_type?: NotificationObjectType | null;
  /** Always null when `related_object_type` is null; otherwise required. */
  related_object_id?: number | null;
  created_at: string;
}

/**
 * Per-event channel preference. Mirror of the `NotificationPreference` model
 * in `shared-specs/data-model-spec.md`.
 *
 * One row per `(user, event_type)` pair. Missing row = system default for the
 * event (defaults baked into the frontend event catalog at
 * `client/src/lib/mock/_seed/notification-events.ts`).
 *
 * V1 scope reminder: `in_app` is kept on the wire but in-app muting is not
 * yet wired — the Preferences tab renders the in-app toggle as a disabled
 * "Coming soon" affordance for every row. Only `email` is actively writable.
 */
export interface NotificationPreference {
  user: number;
  /** Matches `Notification.type` — stable string identifier. */
  event_type: string;
  in_app: boolean;
  email: boolean;
  updated_at: string;
}

/**
 * Channel availability per event, surfaced as a flag on each catalog row.
 * `in_app_only` events have no email surface (e.g. partner-side
 * `verification_started`, company-side `application_received`); the Preferences
 * tab renders the email toggle as a muted "No email" label for those rows.
 */
export type NotificationChannelMode = "in_app_and_email" | "in_app_only";

/**
 * One entry in the frontend-owned event catalog. Drives the rendering of the
 * Preferences tab and the per-event defaults applied at fire time. Lives in
 * `client/src/lib/mock/_seed/notification-events.ts` — backend never ships
 * this shape; it ships the `NotificationPreference` rows referenced above.
 */
export interface NotificationEventCatalogEntry {
  /** Matches `Notification.type` + `NotificationPreference.event_type`. */
  event_type: string;
  /** Which dashboard role this event surfaces for. */
  role: "sales_partner" | "company";
  /** Visual grouping in the Preferences tab. */
  group:
    | "leads_sales"
    | "applications"
    | "partner_links"
    | "earnings_withdrawals"
    | "escrow"
    | "withdrawals";
  /** Whether the event has an email channel per spec. */
  channels: NotificationChannelMode;
  /** Default `email` value when no `NotificationPreference` row exists. */
  default_email: boolean;
  /** Default `in_app` value — kept for V2 when in-app muting wires up. */
  default_in_app: boolean;
}
