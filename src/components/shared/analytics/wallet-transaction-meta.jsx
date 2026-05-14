"use client";

/**
 * wallet-transaction-meta — shared icon + tone map for every
 * `WalletTransaction.type`. Reused by:
 *   - ReservationsActivityFeed (the right half of the wallet header
 *     on /leads, top 5 entries)
 *   - The wallet history table on /escrow (full transaction list)
 *
 * Tones map to existing status tokens so transaction rows feel
 * consistent with StatusBadge across the app.
 *
 * Each entry returns the Icon component + a small string config the
 * caller composes into a chip / cell.
 */

import {
  ArrowDownToLine,
  ArrowUpFromLine,
  Lock,
  RotateCcw,
  Send,
  ReceiptText,
} from "lucide-react";

export const TRANSACTION_TYPE_META = {
  deposit:              { Icon: ArrowDownToLine, bg: "bg-status-approved-bg", iconCls: "text-status-approved-text", sign: "+" },
  reservation:          { Icon: Lock,            bg: "bg-status-active-bg",   iconCls: "text-accent",                sign: "−" },
  release_commission:   { Icon: Send,            bg: "bg-status-approved-bg", iconCls: "text-status-approved-text", sign: "−" },
  release_platform_fee: { Icon: ReceiptText,     bg: "bg-status-approved-bg", iconCls: "text-status-approved-text", sign: "−" },
  return:               { Icon: RotateCcw,       bg: "bg-status-approved-bg", iconCls: "text-status-approved-text", sign: "+" },
  withdrawal:           { Icon: ArrowUpFromLine, bg: "bg-status-pending-bg",  iconCls: "text-status-pending-text",  sign: "−" },
};
