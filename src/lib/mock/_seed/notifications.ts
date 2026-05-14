import type { Notification } from "@/types";

/**
 * Mock notifications — exact `Notification` shape per shared-specs/data-model-spec.md.
 *
 * Seeded for the default partner / company / admin mock users so that the
 * notification bell shows a realistic unread count during click-testing of
 * the dashboard chrome. All `type` strings match the event identifiers
 * documented in escrow-leads-spec.md and partner-links-dashboards-admin-spec.md.
 *
 * Every `related_object_id` resolves to a real row in its matching seed
 * (lead 104, application 2, lead 106, lead 101, application 6) — confirmed
 * after the 2026-05-09 seed-integrity audit. Recipient `user` matches the
 * notification copy: partner-side rows go to user 1 (partner@sellwell.dz),
 * company-side rows go to user 7 (company@sellwell.dz, owner of Atlas CRM).
 *
 * When the backend ships, `fetchNotifications()` swaps to GET /api/notifications/
 * and this seed file is unused. The wire shape stays identical.
 */
export const MOCK_NOTIFICATIONS: Notification[] = [
  {
    id: 1,
    user: 1, // partner@sellwell.dz
    type: "lead_acknowledged",
    title: "Lead reserved by Atlas CRM",
    body: "Atlas CRM reserved escrow on your lead for Lina Hadj-Saïd. Tracking window started — 60 days.",
    is_read: false,
    related_object_type: "lead",
    related_object_id: 104,
    created_at: "2026-05-08T14:22:00Z",
  },
  {
    id: 2,
    user: 1,
    type: "application_approved",
    title: "Application approved",
    body: "Sahara Stack approved your application. You can now submit leads and generate Partner Links.",
    is_read: false,
    related_object_type: "application",
    related_object_id: 2,
    created_at: "2026-05-07T09:10:00Z",
  },
  {
    id: 3,
    user: 1,
    type: "sale_confirmed",
    title: "Commission paid · 1,800 DA",
    body: "Atlas CRM confirmed the sale on your lead for Karim Benali. Commission released to your earnings balance.",
    is_read: true,
    related_object_type: "lead",
    related_object_id: 106,
    created_at: "2026-05-05T16:45:00Z",
  },
  {
    id: 4,
    user: 7, // company@sellwell.dz (Atlas CRM)
    type: "lead_submitted",
    title: "New hot lead · Atlas CRM",
    body: "Ahmed B. submitted a hot lead for the Pro tier. Reserve 3,600 DA to view contact details.",
    is_read: false,
    related_object_type: "lead",
    related_object_id: 101,
    created_at: "2026-05-08T15:01:00Z",
  },
  {
    id: 5,
    user: 7,
    type: "application_received",
    title: "New application · Yasmine Khelifi",
    body: "Yasmine Khelifi applied to your Atlas CRM campaign. Review their pitch and profile.",
    is_read: true,
    related_object_type: "application",
    related_object_id: 6,
    created_at: "2026-05-06T11:33:00Z",
  },

  /* ── Admin notifications (user 10) ────────────────────────────────────
   * Per Phase 9.12: admin gets at least one routed event per type
   * (dispute → lead, withdrawal → wallet, verification → application).
   * Routing is role-aware via notification-routes.js — these rows
   * resolve to /admin/disputes, /admin/withdrawals, /admin/verifications
   * respectively when the recipient is an admin user. */
  {
    id: 6,
    user: 10, // admin@sellwell.dz
    type: "dispute_opened",
    title: "New dispute · Sahara Stack denied a sale",
    body: "Sahara Stack denied the sale on Lead #111 (Hassan Tabet). Contact the client to verify and rule.",
    is_read: false,
    related_object_type: "lead",
    related_object_id: 111,
    created_at: "2026-05-08T11:30:00Z",
  },
  {
    id: 7,
    user: 10,
    type: "withdrawal_requested",
    title: "Withdrawal pending · 5,000 DA",
    body: "Atlas CRM requested a withdrawal of 5,000 DA via CCP. Review the queue and process the disbursement.",
    is_read: false,
    related_object_type: "wallet",
    related_object_id: 1,
    created_at: "2026-04-28T08:00:00Z",
  },
  {
    id: 8,
    user: 10,
    type: "verification_pending",
    title: "Pending review · pending@sellwell.dz",
    body: "A Sales Partner signed up and is awaiting admin approval. Review their profile in the verification queue.",
    is_read: false,
    related_object_type: "application",
    related_object_id: 4,
    created_at: "2026-05-05T16:30:00Z",
  },
];
