export type LeadStatus =
  | "draft"
  | "submitted"
  | "pending_escrow"
  | "acknowledged"
  | "converted"
  | "converted_verified"
  | "not_converted"
  | "disputed_verifying"
  | "expired"
  | "expired_verifying";

export type OutreachMethod = "email" | "phone" | "sms";
export type VerificationResult =
  | "reached_confirmed_sale"
  | "reached_no_sale"
  | "no_answer"
  | "pending";

export interface Lead {
  id: number;
  campaign: number;
  sales_partner: number;
  pricing_tier: number;
  /** URL-safe identifier used in user-facing routes (`/leads/[slug]`,
   *  `/admin/disputes/[slug]`). Shape: `{client-firstname}-{client-lastname}-{short-suffix}`
   *  (e.g. `mehdi-touati-7k2`). Short random suffix breaks enumeration.
   *  See shared-specs/data-model-spec.md → Lead. */
  slug: string;
  client_full_name: string;
  client_company_name?: string | null;
  /** Hidden from company until status is 'acknowledged' or beyond */
  client_phone: string;
  /** Hidden from company until status is 'acknowledged' or beyond */
  client_email?: string | null;
  status: LeadStatus;
  commission_amount: number;
  platform_fee_amount: number;
  total_reservation: number;
  actual_sale_amount?: number | null;
  acknowledged_at?: string | null;
  tracking_window_expires_at?: string | null;
  /** Stamped when the partner flips a draft to `submitted` (clicks
   *  "Send to company"). Null while `status === 'draft'`. */
  submitted_at?: string | null;
  /** When the partner first saved the draft. Used for sort + relative
   *  "created N days ago" copy. */
  created_at: string;
  resolved_at?: string | null;
  /** Company's reason on "did not convert" (status = `not_converted` /
   *  `disputed_verifying` / `expired_verifying`). Free text. Surfaced to
   *  the partner inside the lead detail when a denial happens.
   *  See shared-specs/data-model-spec.md → Lead.denial_reason. */
  denial_reason?: string | null;
}

/** Author role on a LeadNote. Both sides post notes:
 *  - "partner" — the sales partner who submitted the lead. Visible to
 *    the company only after reservation. Read-only for the company.
 *  - "company" — posted by the company after they reserved escrow.
 *    Visible to the company on the lead detail (their internal notes).
 *  Future-compatible with admin/system notes if we add them. */
export type LeadNoteAuthor = "partner" | "company";

/** Append-only note row attached to a Lead. Replaces the old single
 *  `Lead.conversation_notes` field — both partners and companies can
 *  capture an evolving record of conversation moments. See
 *  shared-specs/data-model-spec.md → LeadNote. */
export interface LeadNote {
  id: number;
  lead: number;
  body: string;
  /** Defaults to "partner" for legacy rows; backend serializer will
   *  populate from request.user.role on insert. */
  author: LeadNoteAuthor;
  created_at: string;
}

/** File or external link the partner attaches to a Lead. Free-row
 *  bucket (no fixed slots — unlike CampaignDocument). Editable while
 *  the lead is `draft`, read-only after the partner submits.
 *  See shared-specs/data-model-spec.md → LeadDocument. */
export type LeadDocumentKind = "file" | "url";

export interface LeadDocument {
  id: number;
  lead: number;
  kind: LeadDocumentKind;
  /** Required when kind === 'file'. Backend serves a download URL here. */
  file?: string | null;
  /** Required when kind === 'url'. Loom / Drive / Dropbox / etc. */
  url?: string | null;
  label: string;
  sort_order: number;
  created_at: string;
}

export interface LeadVerification {
  id: number;
  lead: number;
  outreach_method: OutreachMethod;
  outreach_date: string;
  result: VerificationResult;
  admin_notes?: string | null;
  resolved_by?: number | null;
  created_at: string;
}
