/** Lifecycle of a single click record. Pending at creation, becomes
 *  attributed on a successful webhook lookup, expired once the
 *  attribution window passes, or unattributed if reconciliation can't
 *  match a successful payment back to it. */
export type AttributionStatus = "pending" | "attributed" | "unattributed" | "expired";

export interface PartnerLink {
  id: number;
  campaign: number;
  sales_partner: number;
  code: string;
  url: string;
  total_clicks: number;
  total_conversions: number;
  created_at: string;
}

export interface PartnerLinkClick {
  id: number;
  partner_link: number;
  /** Opaque ID passed in `?sw_click=...`. Lookup target for the Chargily
   *  webhook handler. */
  external_click_id: string;
  ip_hash: string;
  user_agent?: string | null;
  referrer?: string | null;
  attribution_status: AttributionStatus;
  /** clicked_at + partner_link_attribution_window_days (default 90).
   *  Conversions arriving after this don't attribute. */
  attribution_window_expires_at: string;
  clicked_at: string;
}

export interface PartnerLinkSale {
  id: number;
  partner_link: number;
  /** Always null in V1 — the merchant runs their own checkout, so the
   *  sale doesn't map to a SellWell pricing tier. Kept for
   *  forward-compatibility. */
  pricing_tier?: number | null;
  /** Foreign key by value to PartnerLinkClick.external_click_id. Identifies
   *  which click produced this sale. */
  external_click_id: string;
  sale_amount: number;
  commission_amount: number;
  platform_fee_amount: number;
  /** Unique. Idempotency guard against duplicate Chargily webhook deliveries. */
  chargily_payment_id: string;
  created_at: string;
}
