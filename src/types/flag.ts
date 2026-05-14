/**
 * Flag — append-only audit log of every fraud/abuse flag admin has ever
 * issued against a user. See `shared-specs/data-model-spec.md` → Flag.
 *
 * Replaces the `flag_count` integer that previously lived on
 * `SalesPartnerProfile` / `CompanyProfile`. Flag count is now computed by
 * counting Flag rows where `Flag.user` matches.
 *
 * Backend swap (Phase 11+): GET /api/admin/flags/.
 */
export interface Flag {
  id: number;
  /** FK to User — the flagged user (partner or company). */
  user: number;
  /** FK to User — the admin who issued the flag. Always role=admin. */
  flagged_by: number;
  /** FK to Lead — nullable so future non-dispute flagging paths work. */
  lead: number | null;
  /** Human-readable reason. Auto-populated by resolveDispute for the V1
   *  dispute-driven flow; free text for any future admin-initiated paths. */
  reason: string;
  created_at: string;
}
