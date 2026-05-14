import type { NotificationEventCatalogEntry } from "@/types";

/**
 * Frontend-owned catalog of every notification event the platform fires.
 *
 * Each entry drives:
 *   - The row that appears in the Preferences tab (per role)
 *   - Which group/card the row lives in
 *   - Whether the email column is actively writable or muted ("No email")
 *   - The default `email` + `in_app` value applied when no
 *     `NotificationPreference` row exists for this user-event pair
 *
 * Source of truth for event identifiers + channel modes is the spec:
 *   - escrow-leads-spec.md → "Notifications Triggered" table
 *   - partner-links-dashboards-admin-spec.md → "Notification System" + dashboard sections
 *
 * Consistency rule (enforced manually): every `event_type` here must
 * correspond to a real event the system fires. If a row in this catalog
 * doesn't match a `Notification.type` value the backend will eventually
 * produce, we ship a "phantom" preference the user can flip with no effect.
 * Don't add rows speculatively — anchor each one to a spec line or an
 * existing seed row in `_seed/notifications.ts`.
 *
 * In-app channel V1 caveat: the in-app toggle in the Preferences tab is
 * rendered as a disabled "Coming soon" affordance for every row. The
 * `default_in_app` value stays here so V2 (in-app muting) is a one-line
 * UI change, not a data migration. Today it's effectively cosmetic.
 *
 * Admin role: admins do not surface preferences in V1 (the admin nav has no
 * Notifications tab — admin reads notifications via the bell + the disputes /
 * withdrawals / verifications queues). If admin notifications ever get their
 * own preferences surface, append `role: "admin"` rows here.
 */
export const NOTIFICATION_EVENT_CATALOG: NotificationEventCatalogEntry[] = [
  /* ── SALES PARTNER ─────────────────────────────────────────────────── */

  // Spec (escrow-leads-spec.md): "Lead reserved & viewed" — in-app only.
  // Email column renders as muted "No email" per the channel mode.
  // Seed anchor: notification row id 1 (`type: lead_acknowledged`).
  {
    event_type: "lead_acknowledged",
    role: "sales_partner",
    group: "leads_sales",
    channels: "in_app_only",
    default_email: false,
    default_in_app: true,
  },
  // Spec: "Lead expired (7-day timeout)" — in-app + email.
  {
    event_type: "lead_expired",
    role: "sales_partner",
    group: "leads_sales",
    channels: "in_app_and_email",
    default_email: true,
    default_in_app: true,
  },
  // Spec: "Sale confirmed" — in-app + email.
  // Seed anchor: notification row id 3.
  {
    event_type: "sale_confirmed",
    role: "sales_partner",
    group: "leads_sales",
    channels: "in_app_and_email",
    default_email: true,
    default_in_app: true,
  },
  // Spec: "Sale denied — verification started" — in-app only (partner-side).
  {
    event_type: "verification_started",
    role: "sales_partner",
    group: "leads_sales",
    channels: "in_app_only",
    default_email: false,
    default_in_app: true,
  },
  // Spec: "Verification result" — in-app + email.
  {
    event_type: "verification_result",
    role: "sales_partner",
    group: "leads_sales",
    channels: "in_app_and_email",
    default_email: true,
    default_in_app: true,
  },

  // Spec: "Application approved/rejected" — in-app + email.
  // Seed anchor: notification row id 2 (`type: application_approved`).
  {
    event_type: "application_approved",
    role: "sales_partner",
    group: "applications",
    channels: "in_app_and_email",
    default_email: true,
    default_in_app: true,
  },

  // Partner Link sale — partner-links-dashboards-admin-spec.md
  // ("Click → Conversion Lifecycle" + "Partner Link Dashboard"). Treated as
  // an in-app + email event (commission moves to the partner's balance).
  {
    event_type: "partner_link_sale",
    role: "sales_partner",
    group: "partner_links",
    channels: "in_app_and_email",
    default_email: true,
    default_in_app: true,
  },

  // Withdrawal status changes — escrow-leads-spec.md Manual Withdrawal Flow.
  // Email + in-app on every transition (`pending` → `processing` →
  // `completed` / `rejected`). One catalog row covers all status changes.
  {
    event_type: "withdrawal_status",
    role: "sales_partner",
    group: "earnings_withdrawals",
    channels: "in_app_and_email",
    default_email: true,
    default_in_app: true,
  },

  /* ── TECH COMPANY ──────────────────────────────────────────────────── */

  // Spec: "New lead submitted" → company, in-app + email.
  // Seed anchor: notification row id 4.
  {
    event_type: "lead_submitted",
    role: "company",
    group: "leads_sales",
    channels: "in_app_and_email",
    default_email: true,
    default_in_app: true,
  },
  // Spec: "Tracking window expiring (3 days before)" — in-app + email.
  {
    event_type: "tracking_window_expiring",
    role: "company",
    group: "leads_sales",
    channels: "in_app_and_email",
    default_email: true,
    default_in_app: true,
  },
  // Spec: "Verification result" (company-side) — in-app + email.
  {
    event_type: "verification_result",
    role: "company",
    group: "leads_sales",
    channels: "in_app_and_email",
    default_email: true,
    default_in_app: true,
  },

  // Spec: "Insufficient escrow for new lead" — in-app + email.
  {
    event_type: "lead_pending_escrow",
    role: "company",
    group: "escrow",
    channels: "in_app_and_email",
    default_email: true,
    default_in_app: true,
  },
  // Spec: "Low escrow balance warning" — in-app + email.
  {
    event_type: "low_escrow_balance",
    role: "company",
    group: "escrow",
    channels: "in_app_and_email",
    default_email: true,
    default_in_app: true,
  },

  // Spec: "Campaign application received" — in-app only (company-side).
  // Seed anchor: notification row id 5.
  {
    event_type: "application_received",
    role: "company",
    group: "applications",
    channels: "in_app_only",
    default_email: false,
    default_in_app: true,
  },

  // Withdrawal status changes — same as partner-side, company-scoped.
  {
    event_type: "withdrawal_status",
    role: "company",
    group: "withdrawals",
    channels: "in_app_and_email",
    default_email: true,
    default_in_app: true,
  },
];
