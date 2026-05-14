/**
 * Frontend deep-link resolver for notifications.
 *
 * Maps `(related_object_type, related_object_id)` to a locale-aware app
 * path. Used by NotificationRow click → `router.push(href)` to navigate
 * the user from a notification to the entity it references.
 *
 * Role-aware: admin sees disputes / withdrawals / verifications in
 * different routes than partners + companies. The resolver branches
 * on `userRole`. Per the authority constraint, admin's lead-typed
 * notifications always route into `/admin/disputes` (the only admin
 * surface that exposes leads — see FRONTEND_TODO Phase 9 header).
 *
 * The Spotlight project uses a backend-precomputed `n.link` field; we
 * resolve client-side instead because the backend models in
 * `data-model-spec.md` only carry `related_object_type` + `related_object_id`.
 * If/when we want backend-driven deep links (e.g. to disambiguate routes
 * per role), that becomes a new optional field on `Notification`.
 *
 * Routes that don't exist yet (some land in Phase 9) still resolve here
 * — Next will 404 until those routes ship. Acceptable for V1.
 *
 * Returns `null` when there's no related object (system notifications);
 * caller should treat null as "do not navigate" and just close the popover.
 *
 * Must stay in sync with `client/src/types/notification.ts`'s
 * `NotificationObjectType` union and `data-model-spec.md` →
 * "Notification related_object_type enum" per the data-contract-sync rule.
 */

const PARTNER_COMPANY_ROUTES = {
  lead:         (id) => `/leads/${id}`,
  campaign:     (id) => `/campaigns/${id}`,
  application:  () => `/applications`,
  wallet:       () => `/escrow`,
  partner_link: () => `/partner-links`,
};

const ADMIN_ROUTES = {
  // Admin only ever sees lead notifications when they're disputes
  // (per the Phase 9 authority constraint). Route to the disputes
  // queue with a query so the row auto-opens once /admin/disputes ships.
  lead:         (id) => `/admin/disputes?open=${id}`,
  // Admin doesn't get campaign-level notifications in V1; falling
  // back to the campaigns admin queue if one ever arrives.
  campaign:     () => `/admin/campaigns`,
  // `application` on the notification side is overloaded: partner-side
  // CampaignApplication events use it too. For admin we interpret it
  // as a signup verification event — that's the only `application`
  // notification the seed sends to admin users.
  application:  () => `/admin/verifications`,
  // Wallet-typed notifications to admin are withdrawal events.
  wallet:       () => `/admin/withdrawals`,
  partner_link: () => `/admin/campaigns`,
};

export function notificationHref(notification, userRole) {
  const t = notification?.related_object_type;
  const id = notification?.related_object_id;
  if (!t) return null;
  const table = userRole === "admin" ? ADMIN_ROUTES : PARTNER_COMPANY_ROUTES;
  const builder = table[t];
  if (!builder) return null;
  return builder(id);
}
