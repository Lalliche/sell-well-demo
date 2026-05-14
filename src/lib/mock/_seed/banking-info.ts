import type { BankingInfo } from "@/types/user";

/**
 * Mock BankingInfo seed.
 *
 * BankingInfo is polymorphic over partners + companies (generalized
 * 2026-05-13 from the original partner-only model). FK is to User, not
 * to the role-specific profile, so the same row shape covers both.
 *
 * Seeded rows:
 *   - User 1 (Ahmed Benali, partner) — full bank-account row so the
 *     partner dashboard's "Add banking info" action does NOT fire on the
 *     default test user. Other partners (users 2–6) have no row — they
 *     hit the "set up banking" gate when they try to withdraw.
 *   - User 7 (Atlas CRM, company) — full bank-account row so the company
 *     /escrow/withdraw flow has destination details to pre-fill.
 */
export const MOCK_BANKING_INFO: BankingInfo[] = [
  {
    id: 1,
    user: 1,
    payout_method: "bank",
    ccp_account: null,
    ccp_key: null,
    bank_name: "BNA — Banque Nationale d'Algérie",
    rib: "002 00040 0123456789 12",
    account_holder_name: "Ahmed Benali",
  },
  {
    id: 2,
    user: 7,
    payout_method: "bank",
    ccp_account: null,
    ccp_key: null,
    bank_name: "CPA — Crédit Populaire d'Algérie",
    rib: "004 00120 9876543210 33",
    account_holder_name: "Atlas CRM SARL",
  },
];
