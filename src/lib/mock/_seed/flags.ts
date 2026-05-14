import type { Flag } from "@/types/flag";

/**
 * Mock Flag seed.
 *
 * Append-only audit log of admin-issued flags. Replaces the previously
 * denormalized `flag_count` integer on `SalesPartnerProfile` /
 * `CompanyProfile`. The flag count for a user is now computed by:
 *
 *   MOCK_FLAGS.filter(f => f.user === userId).length
 *
 * Seed strategy: reproduce the pre-extraction counts so /admin/flags +
 * /admin/disputes + /admin/users overlays all render with the same data
 * after the migration.
 *
 *   - Atlas CRM owner (User 7) — 2 flags. One tied to a real past dispute,
 *     one historical (`lead: null`) representing a flag issued before the
 *     visible lead seed.
 *   - Yasmine Khelifi (User 2) — 2 flags. Two past `no_sale` rulings on
 *     fake leads she submitted. Both tied to `lead: null` since the
 *     fake-lead history isn't surfaced in MOCK_LEADS.
 *   - Karim Boudiaf (User 3) — 1 flag. One historical `no_sale` ruling.
 *
 * `flagged_by` is always User 10 (the seeded admin).
 *
 * Backend swap (Phase 11+): GET /api/admin/flags/.
 */
export const MOCK_FLAGS: Flag[] = [
  /* ── Atlas CRM (User 7) — 2 flags ──────────────────────────────────── */
  {
    id: 1,
    user: 7,
    flagged_by: 10,
    lead: 109,
    reason:
      "Ruled 'sale_happened' on lead walid-saadi-5h0 — Atlas CRM denied a confirmed sale. Client verified by phone that they purchased the product. Commission released to partner.",
    created_at: "2026-04-29T14:30:00Z",
  },
  {
    id: 2,
    user: 7,
    flagged_by: 10,
    lead: null, // historical — predates the visible lead seed
    reason:
      "Ruled 'sale_happened' on a denied lead (March 2026). Pattern: company has now denied two confirmed sales in 60 days. Watch list — one more trips the ≥3-flag suspension review.",
    created_at: "2026-03-18T10:00:00Z",
  },

  /* ── Yasmine Khelifi (User 2) — 2 flags ───────────────────────────── */
  {
    id: 3,
    user: 2,
    flagged_by: 10,
    lead: null,
    reason:
      "Ruled 'no_sale' on a confirmed-fake lead (April 2026). Client phone number went to voicemail and client confirmed by email they had never heard of the product. Reservation returned to the company.",
    created_at: "2026-04-22T15:00:00Z",
  },
  {
    id: 4,
    user: 2,
    flagged_by: 10,
    lead: null,
    reason:
      "Ruled 'no_sale' on a confirmed-fake lead (March 2026). Client unreachable through every channel; SellWell investigation found the phone number was a placeholder. Reservation returned.",
    created_at: "2026-03-04T09:15:00Z",
  },

  /* ── Karim Boudiaf (User 3) — 1 flag ──────────────────────────────── */
  {
    id: 5,
    user: 3,
    flagged_by: 10,
    lead: null,
    reason:
      "Ruled 'no_sale' on a confirmed-fake lead (February 2026). Client confirmed they had not been approached by anyone at the partner's company. First offense — coaching note sent.",
    created_at: "2026-02-14T11:00:00Z",
  },
];
