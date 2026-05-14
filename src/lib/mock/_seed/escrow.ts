import type { EscrowWallet, WalletTransaction, WithdrawalRequest } from "@/types/escrow";

/**
 * Mock escrow seed.
 *
 * One EscrowWallet per company (data-model-spec.md → EscrowWallet
 * OneToOne CompanyProfile). Companies:
 *   1 Atlas CRM   — HEALTHY (the dashboard test user). Funded heavily so
 *                   the inbox preview can exercise reservable + reserved +
 *                   confirmed-sale states without running into low-balance
 *                   gates. Has 30+ days of activity in MOCK_WALLET_TRANSACTIONS.
 *   2 Sahara Stack — moderate balance.
 *   3 Maghreb HR  — low (just funded the minimum).
 *
 * `available_balance` is denormalized here for the wire shape, but the
 * mock layer recomputes it from `deposited - reserved - paid_out - withdrawn`
 * to stay in sync with seed reality.
 *
 * Reservation totals match the lead seed: for Atlas CRM (campaigns 1, 4, 7)
 * the "reserved" sum equals the total_reservation of leads in
 * (acknowledged | disputed_verifying) status on those campaigns.
 *   - Lead 104 (acknowledged, Atlas CRM)        →  1,600 DA reserved
 *   - Lead 111 (disputed_verifying, Atlas EP)   → 39,600 DA reserved
 *   - Total reserved on Atlas CRM wallet        → 41,200 DA
 *
 * Paid-out matches converted leads on the company's campaigns (commission +
 * platform fee released):
 *   - Lead 106 (converted, Atlas CRM)           →  3,600 DA released
 *   - Lead 108 (converted, Atlas CRM)           →  9,000 DA released
 *   - Total paid-out on Atlas CRM wallet        → 12,600 DA
 */
export const MOCK_WALLETS: EscrowWallet[] = [
  {
    id: 1,
    company: 1,
    total_deposited: 250000,
    total_reserved: 41200,
    total_paid_out: 12600,
    total_withdrawn: 0,
    available_balance: 196200,
  },
  {
    id: 2,
    company: 2,
    total_deposited: 80000,
    total_reserved: 6840,             // Lead 105 acknowledged on Sahara Stack
    total_paid_out: 0,
    total_withdrawn: 0,
    available_balance: 73160,
  },
  {
    id: 3,
    company: 3,
    total_deposited: 8000,
    total_reserved: 7200,             // Lead 103 acknowledged on Maghreb HR
    total_paid_out: 7200,             // Lead 109 converted_verified released
    total_withdrawn: 0,
    available_balance: -6400,         // Negative — represents pending releases that
                                      // outpaced fresh deposits. Triggers "at-risk"
                                      // health badge in the EscrowWalletCard primitive.
  },
];

/**
 * Mock WalletTransaction seed.
 *
 * Atlas CRM (wallet 1) has a realistic 30-day flow: 2 deposits, 2 reservations
 * (matching Atlas CRM leads still in flight), 2 release pairs (commission +
 * platform fee for converted leads 106 + 108).
 *
 * Other wallets are bare — just one deposit each. Enough to render their
 * /escrow page without it looking empty.
 *
 * `balance_after` is the wallet's available_balance after this row applied,
 * computed by replaying the rows in chronological order.
 */
export const MOCK_WALLET_TRANSACTIONS: WalletTransaction[] = [
  /* ── Atlas CRM (wallet 1) ─────────────────────────────────────────── */

  // 1. Initial deposit — onboarding top-up.
  {
    id: 1,
    wallet: 1,
    type: "deposit",
    amount: 100000,
    balance_after: 100000,
    related_lead: null,
    description: "Initial escrow funding",
    chargily_payment_id: "chrg_demo_init_atlas",
    created_at: "2026-04-15T10:00:00Z",
  },

  // 2. Reservation — Lead 104 (acknowledged, 1,600 DA).
  {
    id: 2,
    wallet: 1,
    type: "reservation",
    amount: -1600,
    balance_after: 98400,
    related_lead: 104,
    description: "Reserved for lead — Lina Hadj-Saïd",
    chargily_payment_id: null,
    created_at: "2026-04-28T10:00:00Z",
  },

  // 3. Reservation — Lead 106 (will convert).
  {
    id: 3,
    wallet: 1,
    type: "reservation",
    amount: -3600,
    balance_after: 94800,
    related_lead: 106,
    description: "Reserved for lead — Karim Benali",
    chargily_payment_id: null,
    created_at: "2026-05-02T09:00:00Z",
  },

  // 4. Release commission — Lead 106 converted.
  {
    id: 4,
    wallet: 1,
    type: "release_commission",
    amount: -1800,
    balance_after: 94800,             // reservation already debited; this is escrow → partner
    related_lead: 106,
    description: "Commission released — Karim Benali (Atlas CRM)",
    chargily_payment_id: null,
    created_at: "2026-05-05T14:00:00Z",
  },

  // 5. Release platform fee — Lead 106.
  {
    id: 5,
    wallet: 1,
    type: "release_platform_fee",
    amount: -1800,
    balance_after: 94800,
    related_lead: 106,
    description: "Platform fee released — Karim Benali",
    chargily_payment_id: null,
    created_at: "2026-05-05T14:00:01Z",
  },

  // 6. Reservation — Lead 108 (older, converted last month).
  {
    id: 6,
    wallet: 1,
    type: "reservation",
    amount: -9000,
    balance_after: 85800,
    related_lead: 108,
    description: "Reserved for lead — Amine Cherif",
    chargily_payment_id: null,
    created_at: "2026-04-08T10:00:00Z",
  },

  // 7. Release commission — Lead 108 converted.
  {
    id: 7,
    wallet: 1,
    type: "release_commission",
    amount: -4500,
    balance_after: 85800,
    related_lead: 108,
    description: "Commission released — Amine Cherif (Atlas CRM)",
    chargily_payment_id: null,
    created_at: "2026-04-19T16:00:00Z",
  },

  // 8. Release platform fee — Lead 108.
  {
    id: 8,
    wallet: 1,
    type: "release_platform_fee",
    amount: -4500,
    balance_after: 85800,
    related_lead: 108,
    description: "Platform fee released — Amine Cherif",
    chargily_payment_id: null,
    created_at: "2026-04-19T16:00:01Z",
  },

  // 9. Reservation — Lead 111 (disputed, big ticket).
  {
    id: 9,
    wallet: 1,
    type: "reservation",
    amount: -39600,
    balance_after: 46200,
    related_lead: 111,
    description: "Reserved for lead — Hassan Tabet",
    chargily_payment_id: null,
    created_at: "2026-03-20T11:00:00Z",
  },

  // 10. Top-up deposit — recent.
  {
    id: 10,
    wallet: 1,
    type: "deposit",
    amount: 150000,
    balance_after: 196200,
    related_lead: null,
    description: "Wallet top-up",
    chargily_payment_id: "chrg_demo_topup_atlas_2",
    created_at: "2026-05-06T11:00:00Z",
  },

  /* ── Sahara Stack (wallet 2) ──────────────────────────────────────── */
  {
    id: 11,
    wallet: 2,
    type: "deposit",
    amount: 80000,
    balance_after: 80000,
    related_lead: null,
    description: "Initial escrow funding",
    chargily_payment_id: "chrg_demo_init_sahara",
    created_at: "2026-04-19T11:00:00Z",
  },
  {
    id: 12,
    wallet: 2,
    type: "reservation",
    amount: -6840,
    balance_after: 73160,
    related_lead: 105,
    description: "Reserved for lead — Karim Bouzid",
    chargily_payment_id: null,
    created_at: "2026-04-15T11:00:00Z",
  },

  /* ── Maghreb HR (wallet 3) — low balance ──────────────────────────── */
  {
    id: 13,
    wallet: 3,
    type: "deposit",
    amount: 8000,
    balance_after: 8000,
    related_lead: null,
    description: "Initial escrow funding",
    chargily_payment_id: "chrg_demo_init_maghreb",
    created_at: "2026-04-22T08:00:00Z",
  },
  {
    id: 14,
    wallet: 3,
    type: "reservation",
    amount: -7200,
    balance_after: 800,
    related_lead: 103,
    description: "Reserved for lead — Sofiane Belkacem",
    chargily_payment_id: null,
    created_at: "2026-03-12T09:00:00Z",
  },
  {
    id: 15,
    wallet: 3,
    type: "release_commission",
    amount: -5000,
    balance_after: 800,
    related_lead: 109,
    description: "Commission released — Walid Saadi (Maghreb HR)",
    chargily_payment_id: null,
    created_at: "2026-04-30T15:00:00Z",
  },
  {
    id: 16,
    wallet: 3,
    type: "release_platform_fee",
    amount: -2200,
    balance_after: 800,
    related_lead: 109,
    description: "Platform fee released — Walid Saadi",
    chargily_payment_id: null,
    created_at: "2026-04-30T15:00:01Z",
  },
];

/**
 * Mock WithdrawalRequest seed — polymorphic on user role per the data-model
 * spec. Both flows live in the same table:
 *
 *   - COMPANY rows (escrow refunds): user.role === 'company'. On completion
 *     a WalletTransaction of type `withdrawal` is written into the company's
 *     EscrowWallet ledger and linked via `wallet_transaction`.
 *   - PARTNER rows (commission payouts): user.role === 'sales_partner'.
 *     No WalletTransaction is written (partner earnings live in a separate
 *     balance, not in EscrowWallet). `wallet_transaction` stays null.
 *
 * Seeded mix below covers:
 *   - All 4 lifecycle states (pending · processing · completed · rejected)
 *   - Both roles in each state where relevant
 *   - Both payout methods (CCP + bank)
 *   - Range of amounts (3,000 → 80,000 DA)
 *   - Range of days waiting (1d to ~25d) so age-tone escalation is visible
 *
 * Today reference: 2026-05-12 (see CLAUDE.md `currentDate`).
 */
export const MOCK_WITHDRAWAL_REQUESTS: WithdrawalRequest[] = [
  /* ── pending (5 rows, mixed roles + methods) ───────────────────────── */
  {
    // Brand-new, <1d ago — green/neutral age tone.
    id: 1,
    user: 7,                                  // Atlas CRM (company)
    amount: 5000,
    payout_method: "bank",
    destination_snapshot: {
      bank_name: "Banque Extérieure d'Algérie",
      rib: "00400123456789012345 67",
      account_holder_name: "Atlas CRM SARL",
    },
    status: "pending",
    proof_document: null,
    proof_uploaded_at: null,
    admin_notes: null,
    wallet_transaction: null,
    requested_at: "2026-05-12T08:30:00Z",
    processed_at: null,
  },
  {
    // Partner payout — Ahmed Benali (user 1). 2d waiting → amber age tone.
    id: 5,
    user: 1,                                  // Ahmed Benali (sales_partner)
    amount: 9000,
    payout_method: "ccp",
    destination_snapshot: {
      ccp_account: "0098765432",
      ccp_key: "47",
      account_holder_name: "Ahmed Benali",
    },
    status: "pending",
    proof_document: null,
    proof_uploaded_at: null,
    admin_notes: null,
    wallet_transaction: null,
    requested_at: "2026-05-10T11:00:00Z",
    processed_at: null,
  },
  {
    // Partner payout — Yasmine Khelifi (user 2). 3d waiting.
    id: 6,
    user: 2,                                  // Yasmine Khelifi (sales_partner)
    amount: 14500,
    payout_method: "bank",
    destination_snapshot: {
      bank_name: "Crédit Populaire d'Algérie",
      rib: "00500876543210987654 32",
      account_holder_name: "Yasmine Khelifi",
    },
    status: "pending",
    proof_document: null,
    proof_uploaded_at: null,
    admin_notes: null,
    wallet_transaction: null,
    requested_at: "2026-05-09T15:00:00Z",
    processed_at: null,
  },
  {
    // Company refund — Sahara Stack (user 8). 4d waiting.
    id: 7,
    user: 8,                                  // Sahara Stack (company)
    amount: 30000,
    payout_method: "bank",
    destination_snapshot: {
      bank_name: "Banque Nationale d'Algérie",
      rib: "00100222333444555666 99",
      account_holder_name: "Sahara Stack SARL",
    },
    status: "pending",
    proof_document: null,
    proof_uploaded_at: null,
    admin_notes: null,
    wallet_transaction: null,
    requested_at: "2026-05-08T09:00:00Z",
    processed_at: null,
  },
  {
    // Stale pending — 9d waiting → red age tone. Shows admin neglect.
    id: 8,
    user: 3,                                  // Karim Boudiaf (sales_partner)
    amount: 3500,
    payout_method: "ccp",
    destination_snapshot: {
      ccp_account: "0067891234",
      ccp_key: "08",
      account_holder_name: "Karim Boudiaf",
    },
    status: "pending",
    proof_document: null,
    proof_uploaded_at: null,
    admin_notes: null,
    wallet_transaction: null,
    requested_at: "2026-05-03T10:00:00Z",
    processed_at: null,
  },

  /* ── processing (1 row) ────────────────────────────────────────────── */
  {
    id: 2,
    user: 7,
    amount: 12000,
    payout_method: "bank",
    destination_snapshot: {
      bank_name: "Banque Extérieure d'Algérie",
      rib: "00400123456789012345 67",
      account_holder_name: "Atlas CRM SARL",
    },
    status: "processing",                      // Admin started the offline disbursement
    proof_document: null,
    proof_uploaded_at: null,
    admin_notes: null,
    wallet_transaction: null,
    requested_at: "2026-05-06T14:15:00Z",
    processed_at: "2026-05-08T10:00:00Z",
  },

  /* ── completed (3 rows — mixed roles, both with real-ish proof URLs) ── */
  {
    // Company completed + proof. Uses Mozilla's pdf.js test PDF so the
    // DocumentPreviewModal's iframe actually renders.
    id: 3,
    user: 7,
    amount: 25000,
    payout_method: "ccp",
    destination_snapshot: {
      ccp_account: "0012345678",
      ccp_key: "12",
      account_holder_name: "Atlas CRM SARL",
    },
    status: "completed",
    proof_document:
      "https://mozilla.github.io/pdf.js/web/compressed.tracemonkey-pldi-09.pdf",
    proof_uploaded_at: "2026-04-30T16:00:00Z",
    admin_notes: null,
    wallet_transaction: null,                  // Will be set when admin retroactively replays
    requested_at: "2026-04-25T11:00:00Z",
    processed_at: "2026-04-30T16:00:00Z",
  },
  {
    // Partner commission payout, completed. No wallet_transaction (partner
    // earnings live outside EscrowWallet).
    id: 9,
    user: 1,                                  // Ahmed Benali (sales_partner)
    amount: 18000,
    payout_method: "ccp",
    destination_snapshot: {
      ccp_account: "0098765432",
      ccp_key: "47",
      account_holder_name: "Ahmed Benali",
    },
    status: "completed",
    proof_document:
      "https://mozilla.github.io/pdf.js/web/compressed.tracemonkey-pldi-09.pdf",
    proof_uploaded_at: "2026-04-22T13:00:00Z",
    admin_notes: null,
    wallet_transaction: null,
    requested_at: "2026-04-18T10:00:00Z",
    processed_at: "2026-04-22T13:00:00Z",
  },
  {
    // Older completed company — image proof (different DocumentCard kind).
    id: 10,
    user: 8,                                  // Sahara Stack (company)
    amount: 40000,
    payout_method: "bank",
    destination_snapshot: {
      bank_name: "Banque Nationale d'Algérie",
      rib: "00100222333444555666 99",
      account_holder_name: "Sahara Stack SARL",
    },
    status: "completed",
    proof_document:
      "https://placehold.co/800x1100/EDF2FA/3B6ECC.png?text=Bank+Transfer+Receipt",
    proof_uploaded_at: "2026-04-12T11:30:00Z",
    admin_notes: null,
    wallet_transaction: null,
    requested_at: "2026-04-08T09:00:00Z",
    processed_at: "2026-04-12T11:30:00Z",
  },

  /* ── rejected (1 row) ──────────────────────────────────────────────── */
  {
    id: 4,
    user: 7,
    amount: 80000,
    payout_method: "bank",
    destination_snapshot: {
      bank_name: "Banque Extérieure d'Algérie",
      rib: "00400123456789012345 67",
      account_holder_name: "Atlas CRM SARL",
    },
    status: "rejected",
    proof_document: null,
    proof_uploaded_at: null,
    admin_notes:
      "Active reservations would have left available balance below your typical campaign reservation. Top up first or wait for in-flight leads to resolve, then re-submit.",
    wallet_transaction: null,
    requested_at: "2026-04-15T09:30:00Z",
    processed_at: "2026-04-16T14:00:00Z",
  },
];
