/**
 * Escrow layer — Supabase-backed for UUID company users.
 *
 * IN SCOPE (Supabase):
 *   fetchWallet, fetchTransactions, fundWallet,
 *   reserveForLead, releaseFromEscrowForLead
 *
 * OUT OF SCOPE (still mock):
 *   fetchWithdrawalRequests, requestWithdrawal, returnToWalletForLead
 *
 * Wallet shape (computed available_balance):
 *   available = total_deposited - total_reserved - total_paid_out - total_withdrawn
 */

import { supabase } from "@/lib/supabase";
import { MOCK_WALLETS, MOCK_WALLET_TRANSACTIONS, MOCK_WITHDRAWAL_REQUESTS } from "./_seed/escrow";
import { getPlatformSetting } from "./admin";
import { MOCK_USERS } from "./_seed/users";
import { MOCK_COMPANY_PROFILES } from "./_seed/company-profiles";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

let _wallets = MOCK_WALLETS.map((w) => ({ ...w }));
let _transactions = MOCK_WALLET_TRANSACTIONS.map((t) => ({ ...t }));
let _withdrawals = MOCK_WITHDRAWAL_REQUESTS.map((w) => ({ ...w }));

/* ── Supabase helpers ────────────────────────────────────────────────── */

/** Fetch the wallet row for a UUID company, creating it on first access. */
async function getOrCreateWallet(companyId) {
  const { data: existing } = await supabase
    .from("wallets")
    .select("*")
    .eq("company_id", companyId)
    .maybeSingle();
  if (existing) return existing;

  // First access — create a zeroed wallet row
  const { data: created, error } = await supabase
    .from("wallets")
    .insert({ company_id: companyId })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return created;
}

/** Compute available_balance from the four counters. */
function availableBalance(w) {
  return (
    Number(w.total_deposited)  -
    Number(w.total_reserved)   -
    Number(w.total_paid_out)   -
    Number(w.total_withdrawn)
  );
}

/** Bridges a WithdrawalRequest.user → CompanyProfile.id so fetchWallet
 *  can decide which pending requests freeze its available balance.
 *  Backend doesn't need this — the request would join via user.company_profile_id.
 *  In the mock, we walk: user (id) → user.role==='company' → CompanyProfile.user. */
function _isWithdrawalForWalletCompany(withdrawal, walletCompanyId) {
  const user = MOCK_USERS.find((u) => u.id === withdrawal.user);
  if (!user || user.role !== "company") return false;
  const profile = MOCK_COMPANY_PROFILES.find((p) => p.user === user.id);
  return profile?.id === walletCompanyId;
}

// fetchWallet() → GET /api/escrow/wallet/
export async function fetchWallet({ companyId } = {}) {
  if (!companyId) return null;

  if (typeof companyId === "string") {
    const wallet = await getOrCreateWallet(companyId);
    const avail = availableBalance(wallet);
    return {
      ...wallet,
      total_deposited:          Number(wallet.total_deposited),
      total_reserved:           Number(wallet.total_reserved),
      total_paid_out:           Number(wallet.total_paid_out),
      total_withdrawn:          Number(wallet.total_withdrawn),
      // total_withdrawn already includes frozen pending withdrawals
      // (requestWithdrawal increments it immediately), so pending_withdrawal = 0
      total_pending_withdrawal: 0,
      available_balance:        avail,
    };
  }

  // Mock fallback
  await sleep(220);
  if (typeof companyId !== "number") return null;
  const wallet = _wallets.find((w) => w.company === companyId);
  if (!wallet) return null;
  const frozen = _withdrawals
    .filter((w) => (w.status === "pending" || w.status === "processing") && _isWithdrawalForWalletCompany(w, wallet.company))
    .reduce((sum, w) => sum + (Number(w.amount) || 0), 0);
  return {
    ...wallet,
    total_pending_withdrawal: frozen,
    available_balance: wallet.total_deposited - wallet.total_reserved - wallet.total_paid_out - wallet.total_withdrawn - frozen,
  };
}

// fetchWithdrawalRequests() → GET /api/escrow/withdrawals/
export async function fetchWithdrawalRequests({ userId, limit } = {}) {
  if (!userId) return [];

  if (typeof userId === "string") {
    let query = supabase
      .from("withdrawal_requests")
      .select("*")
      .eq("user_id", userId)
      .order("requested_at", { ascending: false });
    if (typeof limit === "number") query = query.limit(limit);
    const { data } = await query;
    return (data ?? []).map((r) => ({
      ...r,
      amount: Number(r.amount),
    }));
  }

  // Mock fallback
  await sleep(220);
  let rows = typeof userId === "number"
    ? _withdrawals.filter((w) => w.user === userId)
    : _withdrawals;
  rows = [...rows].sort((a, b) => new Date(b.requested_at) - new Date(a.requested_at));
  if (typeof limit === "number") rows = rows.slice(0, limit);
  return rows;
}

// fetchTransactions() → GET /api/escrow/transactions/
export async function fetchTransactions({ companyId, limit } = {}) {
  if (!companyId) return [];

  if (typeof companyId === "string") {
    const wallet = await getOrCreateWallet(companyId);
    let query = supabase
      .from("wallet_transactions")
      .select("*")
      .eq("wallet_id", wallet.id)
      .order("created_at", { ascending: false });
    if (typeof limit === "number") query = query.limit(limit);
    const { data } = await query;
    return (data ?? []).map((t) => ({
      ...t,
      amount:       Number(t.amount),
      balance_after: Number(t.balance_after),
    }));
  }

  // Mock fallback
  await sleep(260);
  if (typeof companyId !== "number") return [];
  const wallet = _wallets.find((w) => w.company === companyId);
  if (!wallet) return [];
  let rows = [..._transactions.filter((t) => t.wallet === wallet.id)]
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  if (typeof limit === "number") rows = rows.slice(0, limit);
  return rows;
}

// fundWallet() → POST /api/escrow/fund/
// Bumps total_deposited and writes a deposit transaction.
export async function fundWallet({ companyId, amount }) {
  if (!Number.isFinite(amount) || amount <= 0) {
    const err = new Error("invalid_amount"); err.code = "invalid_amount"; throw err;
  }

  if (typeof companyId === "string") {
    const wallet = await getOrCreateWallet(companyId);

    // Increment total_deposited
    const newDeposited = Number(wallet.total_deposited) + amount;
    const { data: updated, error: wErr } = await supabase
      .from("wallets")
      .update({ total_deposited: newDeposited, updated_at: new Date().toISOString() })
      .eq("id", wallet.id)
      .select()
      .single();
    if (wErr) throw new Error(wErr.message);

    const balanceAfter = availableBalance(updated);

    const { data: tx, error: tErr } = await supabase
      .from("wallet_transactions")
      .insert({
        wallet_id: wallet.id,
        type: "deposit",
        amount,
        balance_after: balanceAfter,
        description: "Wallet top-up",
        chargily_payment_id: `chrg_demo_${Date.now()}`,
      })
      .select()
      .single();
    if (tErr) throw new Error(tErr.message);
    return { ...tx, amount: Number(tx.amount), balance_after: Number(tx.balance_after) };
  }

  // Mock fallback
  await sleep(450);
  const platformMin = getPlatformSetting("escrow_min_deposit_da", 1000);
  if (amount < platformMin) {
    const err = new Error("below_platform_minimum"); err.code = "below_platform_minimum"; err.platformMin = platformMin; throw err;
  }
  const wallet = _wallets.find((w) => w.company === companyId);
  if (!wallet) { const err = new Error("wallet_not_found"); err.code = "wallet_not_found"; throw err; }
  const idx = _wallets.findIndex((w) => w.id === wallet.id);
  _wallets[idx] = { ...wallet, total_deposited: wallet.total_deposited + amount };
  const seedIdx = MOCK_WALLETS.findIndex((w) => w.id === wallet.id);
  if (seedIdx !== -1) MOCK_WALLETS[seedIdx] = _wallets[idx];
  const availableNow = _wallets[idx].total_deposited - _wallets[idx].total_reserved - _wallets[idx].total_paid_out - _wallets[idx].total_withdrawn;
  const nextId = _transactions.reduce((m, t) => Math.max(m, t.id), 0) + 1;
  const tx = { id: nextId, wallet: wallet.id, type: "deposit", amount, balance_after: availableNow, related_lead: null, description: "Wallet top-up", chargily_payment_id: `chrg_demo_${Date.now()}`, created_at: new Date().toISOString() };
  _transactions.push(tx); MOCK_WALLET_TRANSACTIONS.push(tx);
  return tx;
}

/**
 * reserveForLead — called by acknowledgeLead ("Reserve & View").
 * For UUID companyId: hits Supabase atomically.
 * For numeric companyId: mock in-memory mutation.
 */
export async function reserveForLead({ companyId, leadId, amount, description }) {
  if (typeof companyId === "string") {
    const wallet = await getOrCreateWallet(companyId);
    const avail = availableBalance(wallet);
    if (avail < amount) {
      const err = new Error("insufficient_funds"); err.code = "insufficient_funds"; throw err;
    }
    const newReserved = Number(wallet.total_reserved) + amount;
    const { data: updated, error: wErr } = await supabase
      .from("wallets")
      .update({ total_reserved: newReserved, updated_at: new Date().toISOString() })
      .eq("id", wallet.id).select().single();
    if (wErr) throw new Error(wErr.message);

    const balanceAfter = availableBalance(updated);
    const { data: tx } = await supabase.from("wallet_transactions")
      .insert({
        wallet_id: wallet.id,
        type: "reservation",
        amount: -amount,
        balance_after: balanceAfter,
        related_lead_id: leadId ?? null,
        description: description ?? `Reserved for lead`,
      }).select().single();
    return tx;
  }

  // Mock fallback (sync — kept sync for existing callers)
  const wallet = _wallets.find((w) => w.company === companyId);
  if (!wallet) throw new Error("wallet_not_found");
  const available = wallet.total_deposited - wallet.total_reserved - wallet.total_paid_out - wallet.total_withdrawn;
  if (available < amount) { const err = new Error("insufficient_funds"); err.code = "insufficient_funds"; throw err; }
  const idx = _wallets.findIndex((w) => w.id === wallet.id);
  _wallets[idx] = { ...wallet, total_reserved: wallet.total_reserved + amount };
  const seedIdx = MOCK_WALLETS.findIndex((w) => w.id === wallet.id);
  if (seedIdx !== -1) MOCK_WALLETS[seedIdx] = _wallets[idx];
  const balance_after = available - amount;
  const nextId = _transactions.reduce((m, t) => Math.max(m, t.id), 0) + 1;
  const tx = { id: nextId, wallet: wallet.id, type: "reservation", amount: -amount, balance_after, related_lead: leadId, description: description ?? `Reserved for lead #${leadId}`, chargily_payment_id: null, created_at: new Date().toISOString() };
  _transactions.push(tx); MOCK_WALLET_TRANSACTIONS.push(tx);
  return tx;
}

/**
 * releaseFromEscrowForLead — called by confirmSale.
 * Moves reservation → paid_out and writes release transactions.
 */
export async function releaseFromEscrowForLead({ companyId, leadId, originalReservation, entries }) {
  if (typeof companyId === "string") {
    const wallet = await getOrCreateWallet(companyId);
    const totalReleased = entries.reduce((s, e) => s + e.amount, 0);
    const leftoverReturn = originalReservation - totalReleased;

    const { data: updated, error: wErr } = await supabase
      .from("wallets")
      .update({
        total_reserved: Math.max(0, Number(wallet.total_reserved) - originalReservation),
        total_paid_out: Number(wallet.total_paid_out) + totalReleased,
        updated_at: new Date().toISOString(),
      })
      .eq("id", wallet.id).select().single();
    if (wErr) throw new Error(wErr.message);

    const balanceAfter = availableBalance(updated);
    const txRows = entries.map((e) => ({
      wallet_id: wallet.id,
      type: e.type,
      amount: -e.amount,
      balance_after: balanceAfter,
      related_lead_id: leadId ?? null,
      description: e.description,
    }));
    if (leftoverReturn > 0) {
      txRows.push({
        wallet_id: wallet.id,
        type: "return",
        amount: leftoverReturn,
        balance_after: balanceAfter + leftoverReturn,
        related_lead_id: leadId ?? null,
        description: "Returned to wallet — sale closed below tier price",
      });
    }
    const { data: txs } = await supabase.from("wallet_transactions").insert(txRows).select();
    return txs ?? [];
  }

  // Mock fallback
  const wallet = _wallets.find((w) => w.company === companyId);
  if (!wallet) throw new Error("wallet_not_found");
  const totalReleased = entries.reduce((s, e) => s + e.amount, 0);
  const leftoverReturn = originalReservation - totalReleased;
  const idx = _wallets.findIndex((w) => w.id === wallet.id);
  _wallets[idx] = { ...wallet, total_reserved: wallet.total_reserved - originalReservation, total_paid_out: wallet.total_paid_out + totalReleased };
  const seedIdx = MOCK_WALLETS.findIndex((w) => w.id === wallet.id);
  if (seedIdx !== -1) MOCK_WALLETS[seedIdx] = _wallets[idx];
  let availableNow = _wallets[idx].total_deposited - _wallets[idx].total_reserved - _wallets[idx].total_paid_out - _wallets[idx].total_withdrawn - leftoverReturn;
  let nextId = _transactions.reduce((m, t) => Math.max(m, t.id), 0) + 1;
  const writtenTxs = [];
  for (const entry of entries) {
    const tx = { id: nextId++, wallet: wallet.id, type: entry.type, amount: -entry.amount, balance_after: availableNow, related_lead: leadId, description: entry.description, chargily_payment_id: null, created_at: new Date().toISOString() };
    _transactions.push(tx); MOCK_WALLET_TRANSACTIONS.push(tx); writtenTxs.push(tx);
  }
  if (leftoverReturn > 0) {
    availableNow += leftoverReturn;
    const tx = { id: nextId++, wallet: wallet.id, type: "return", amount: leftoverReturn, balance_after: availableNow, related_lead: leadId, description: "Returned to wallet — sale closed below tier price", chargily_payment_id: null, created_at: new Date().toISOString() };
    _transactions.push(tx); MOCK_WALLET_TRANSACTIONS.push(tx); writtenTxs.push(tx);
  }
  return writtenTxs;
}

/**
 * returnToWalletForLead — internal helper for the "Did not convert"
 * + verification-failed flows. Releases the full reservation back to
 * available balance (no commission, no platform fee paid). Writes a
 * single `return` WalletTransaction.
 */
export function returnToWalletForLead({ companyId, leadId, amount, description }) {
  const wallet = _wallets.find((w) => w.company === companyId);
  if (!wallet) throw new Error("wallet_not_found");

  const idx = _wallets.findIndex((w) => w.id === wallet.id);
  _wallets[idx] = {
    ...wallet,
    total_reserved: wallet.total_reserved - amount,
  };
  const seedIdx = MOCK_WALLETS.findIndex((w) => w.id === wallet.id);
  if (seedIdx !== -1) MOCK_WALLETS[seedIdx] = _wallets[idx];

  const availableNow =
    _wallets[idx].total_deposited -
    _wallets[idx].total_reserved -
    _wallets[idx].total_paid_out -
    _wallets[idx].total_withdrawn;

  const nextId = _transactions.reduce((m, t) => Math.max(m, t.id), 0) + 1;
  const tx = {
    id: nextId,
    wallet: wallet.id,
    type: "return",
    amount,
    balance_after: availableNow,
    related_lead: leadId,
    description: description ?? `Returned to wallet — lead #${leadId}`,
    chargily_payment_id: null,
    created_at: new Date().toISOString(),
  };
  _transactions.push(tx);
  MOCK_WALLET_TRANSACTIONS.push(tx);
  return tx;
}

// requestWithdrawal() → POST /api/escrow/withdrawals/
// Creates a pending request and freezes the amount from available_balance
// (via total_withdrawn increment — fetchWallet subtracts it from available).
export async function requestWithdrawal({
  companyId,
  userId,
  amount,
  payout_method,
  destination_snapshot,
}) {
  if (!Number.isFinite(amount) || amount <= 0) {
    const err = new Error("invalid_amount"); err.code = "invalid_amount"; throw err;
  }
  if (!payout_method || !destination_snapshot) {
    const err = new Error("missing_destination"); err.code = "missing_destination"; throw err;
  }

  if (typeof userId === "string") {
    const wallet = await getOrCreateWallet(companyId);
    const avail = availableBalance(wallet);
    if (avail < amount) {
      const err = new Error("insufficient_funds"); err.code = "insufficient_funds"; throw err;
    }

    // Freeze by incrementing total_withdrawn (treated as "pending withdrawal" deduction).
    // On admin completion, a real withdrawal WalletTransaction is written.
    const { data: updated, error: wErr } = await supabase
      .from("wallets")
      .update({
        total_withdrawn: Number(wallet.total_withdrawn) + amount,
        updated_at: new Date().toISOString(),
      })
      .eq("id", wallet.id)
      .select()
      .single();
    if (wErr) throw new Error(wErr.message);

    const balanceAfter = availableBalance(updated);

    // Write the withdrawal transaction row
    const { data: tx } = await supabase
      .from("wallet_transactions")
      .insert({
        wallet_id: wallet.id,
        type: "withdrawal",
        amount: -amount,
        balance_after: balanceAfter,
        description: "Withdrawal request submitted",
      })
      .select()
      .single();

    // Create the withdrawal_request row
    const { data: row, error: rErr } = await supabase
      .from("withdrawal_requests")
      .insert({
        user_id: userId,
        wallet_id: wallet.id,
        amount,
        payout_method,
        destination_snapshot,
        status: "pending",
        wallet_transaction_id: tx?.id ?? null,
      })
      .select()
      .single();
    if (rErr) throw new Error(rErr.message);
    return { ...row, amount: Number(row.amount) };
  }

  // Mock fallback
  await sleep(400);
  const wallet = _wallets.find((w) => w.company === companyId);
  if (!wallet) { const err = new Error("wallet_not_found"); err.code = "wallet_not_found"; throw err; }
  const frozen = _withdrawals
    .filter((w) => (w.status === "pending" || w.status === "processing") && _isWithdrawalForWalletCompany(w, wallet.company))
    .reduce((sum, w) => sum + (Number(w.amount) || 0), 0);
  const available = wallet.total_deposited - wallet.total_reserved - wallet.total_paid_out - wallet.total_withdrawn - frozen;
  if (available < amount) { const err = new Error("insufficient_funds"); err.code = "insufficient_funds"; throw err; }
  const nextId = _withdrawals.reduce((m, w) => Math.max(m, w.id), 0) + 1;
  const row = { id: nextId, user: userId, amount, payout_method, destination_snapshot, status: "pending", proof_document: null, proof_uploaded_at: null, admin_notes: null, wallet_transaction: null, requested_at: new Date().toISOString(), processed_at: null };
  _withdrawals.push(row); MOCK_WITHDRAWAL_REQUESTS.push(row);
  return row;
}
