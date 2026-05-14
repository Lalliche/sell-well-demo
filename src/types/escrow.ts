export type WalletTransactionType =
  | "deposit"
  | "reservation"
  | "release_commission"
  | "release_platform_fee"
  | "return"
  | "withdrawal";

export interface EscrowWallet {
  id: number;
  company: number;
  total_deposited: number;
  total_reserved: number;
  total_paid_out: number;
  total_withdrawn: number;
  /** Computed: total_deposited - total_reserved - total_paid_out - total_withdrawn */
  available_balance: number;
}

export interface WalletTransaction {
  id: number;
  wallet: number;
  /** A row of type `withdrawal` is the manual disbursement moment (admin
   *  completed an offline transfer + uploaded proof), NOT the user's
   *  request. The user's request lives in `WithdrawalRequest`. */
  type: WalletTransactionType;
  amount: number;
  balance_after: number;
  related_lead?: number | null;
  description: string;
  chargily_payment_id?: string | null;
  created_at: string;
}

/** Lifecycle of a single withdrawal request. */
export type WithdrawalStatus =
  | "pending"
  | "processing"
  | "completed"
  | "rejected";

export type WithdrawalPayoutMethod = "ccp" | "bank";

/** Polymorphic on user role — both Tech Companies and Sales Partners use
 *  this same model. Chargily Pay has no outbound API; admin disburses
 *  manually offline and uploads proof of payment. See
 *  shared-specs/escrow-leads-spec.md → Manual Withdrawal Flow. */
export interface WithdrawalRequest {
  id: number;
  user: number;
  amount: number;
  payout_method: WithdrawalPayoutMethod;
  /** Snapshot of destination details at request time (CCP account+key OR
   *  bank name+RIB+account holder). Snapshotted so later edits to banking
   *  details don't change historical requests. */
  destination_snapshot: Record<string, unknown>;
  status: WithdrawalStatus;
  /** URL to admin-uploaded proof-of-payment document (PDF or image).
   *  Required when status='completed'. Visible to the requesting user. */
  proof_document?: string | null;
  proof_uploaded_at?: string | null;
  admin_notes?: string | null;
  /** Linked when status flips to 'completed' for company requests. Null
   *  for partner requests (partner earnings live in a separate balance). */
  wallet_transaction?: number | null;
  requested_at: string;
  processed_at?: string | null;
}
