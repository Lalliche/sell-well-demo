import type { LeadVerification } from "@/types/lead";

/**
 * Mock LeadVerification seed.
 *
 * A `LeadVerification` row is admin's outreach record on a disputed or
 * expired-verifying lead. Each row captures one contact attempt with the
 * client + the result. Multiple rows per lead are normal — admin may
 * email first, then phone, then resolve.
 *
 * Seed strategy: cover the two lifecycle ends.
 *   - Lead 111 (`hassan-tabet-2c4`, status `disputed_verifying`): one
 *     `pending` email outreach so the dispute detail page renders an
 *     active outreach log on first paint.
 *   - Lead 109 (`walid-saadi-5h0`, status `converted_verified`): two
 *     rows showing the full resolution arc — initial email attempt with
 *     no answer, follow-up phone call that reached the client and
 *     confirmed the sale. Resolved by admin (user id 10).
 *
 * `resolved_by` is `null` until the row is the one that closed the
 * verification (i.e. result ≠ 'pending' AND it's the final entry).
 *
 * Backend swap (Phase 11+): GET /api/leads/:slug/verifications/.
 */
export const MOCK_LEAD_VERIFICATIONS: LeadVerification[] = [
  // ── Lead 111 — disputed_verifying (Hassan Tabet) ─────────────────
  {
    id: 1,
    lead: 111,
    outreach_method: "email",
    outreach_date: "2026-05-08T10:00:00Z",
    result: "pending",
    admin_notes:
      "Initial outreach sent to the client's email asking whether they completed a purchase from Sahara Stack. Awaiting reply — auto-escalate to phone if no response within 5 business days.",
    resolved_by: null,
    created_at: "2026-05-08T10:00:00Z",
  },

  // ── Lead 109 — converted_verified (Walid Saadi) ──────────────────
  {
    id: 2,
    lead: 109,
    outreach_method: "email",
    outreach_date: "2026-04-26T09:00:00Z",
    result: "no_answer",
    admin_notes:
      "First email sent. No reply after 48 hours — escalating to phone.",
    resolved_by: null,
    created_at: "2026-04-26T09:00:00Z",
  },
  {
    id: 3,
    lead: 109,
    outreach_method: "phone",
    outreach_date: "2026-04-29T14:30:00Z",
    result: "reached_confirmed_sale",
    admin_notes:
      "Spoke with the client by phone. They confirmed they purchased the product from the company two weeks ago and were surprised the company denied it. Ruling: sale happened. Commission released to partner, company flag incremented.",
    resolved_by: 10,
    created_at: "2026-04-29T14:30:00Z",
  },

  // ── Lead 113 — expired_verifying (Tarek Bouguerra) ───────────────
  // Tracking window expired without company action; admin sent the
  // client an email asking whether they ever purchased.
  {
    id: 4,
    lead: 113,
    outreach_method: "email",
    outreach_date: "2026-04-17T10:00:00Z",
    result: "no_answer",
    admin_notes:
      "Email sent the day after the tracking window expired. No reply yet — will escalate to phone if silence persists past the verification timeout.",
    resolved_by: null,
    created_at: "2026-04-17T10:00:00Z",
  },
];
