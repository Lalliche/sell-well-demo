"use client";

/**
 * DestinationComposer — payout destination picker for /escrow/withdraw.
 *
 * V1 ships an inline composer (radio CCP / bank + 3-4 fields). When
 * Phase 7.12 lands the `/settings` page, companies will save banking
 * info once and this composer will pre-fill from the stored profile,
 * collapse to a Plaid-style verified tile (bank logo + last-4 +
 * holder name), and surface an "Edit in Settings" link.
 *
 * The output is a `destination_snapshot` object that mirrors the
 * `WithdrawalRequest.destination_snapshot` JSON field:
 *   - CCP: { ccp_account, ccp_key, account_holder_name }
 *   - Bank: { bank_name, rib, account_holder_name }
 *
 * The page-level validator surfaces missing-field errors via a single
 * boolean `valid` flag we expose through onChange.
 */

import { TextInput } from "@/components/ui/FormInputs";
import { cn } from "@/lib/utils";

const METHODS = ["ccp", "bank"];

export default function DestinationComposer({ value, onChange, t }) {
  const method = value?.method ?? "ccp";

  const patch = (next) => onChange?.({ ...value, ...next });
  const patchSnapshot = (key, v) =>
    patch({ snapshot: { ...(value?.snapshot ?? {}), [key]: v } });

  return (
    <div className="flex flex-col gap-[0.875em]">
      {/* Method radio */}
      <div className="grid grid-cols-2 gap-[0.5em]">
        {METHODS.map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => patch({ method: m, snapshot: {} })}
            className={cn(
              "flex flex-col items-start gap-[0.125em] p-[0.875em] rounded-[0.625em] border bg-surface text-left",
              "transition-[background-color,border-color] duration-150 ease-out",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30",
              method === m
                ? "border-accent bg-accent-light"
                : "border-border hover:bg-surface-hover",
            )}
          >
            <span className={cn(
              "text-[0.875em] font-semibold",
              method === m ? "text-accent-text" : "text-text",
            )}>
              {t(`method.${m}.name`)}
            </span>
            <span className="text-[0.6875em] text-text-muted font-body">
              {t(`method.${m}.helper`)}
            </span>
          </button>
        ))}
      </div>

      {/* Method-specific fields */}
      {method === "ccp" ? (
        <div className="grid grid-cols-2 gap-[0.625em]">
          <TextInput
            label={t("ccp.account")}
            value={value?.snapshot?.ccp_account ?? ""}
            onChange={(v) => patchSnapshot("ccp_account", v)}
            placeholder="0012345678"
          />
          <TextInput
            label={t("ccp.key")}
            value={value?.snapshot?.ccp_key ?? ""}
            onChange={(v) => patchSnapshot("ccp_key", v)}
            placeholder="12"
          />
          <TextInput
            label={t("ccp.holder")}
            value={value?.snapshot?.account_holder_name ?? ""}
            onChange={(v) => patchSnapshot("account_holder_name", v)}
            placeholder={t("ccp.holderPlaceholder")}
            className="col-span-2"
          />
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-[0.625em]">
          <TextInput
            label={t("bank.name")}
            value={value?.snapshot?.bank_name ?? ""}
            onChange={(v) => patchSnapshot("bank_name", v)}
            placeholder={t("bank.namePlaceholder")}
            className="col-span-2"
          />
          <TextInput
            label={t("bank.rib")}
            value={value?.snapshot?.rib ?? ""}
            onChange={(v) => patchSnapshot("rib", v)}
            placeholder="00400123456789012345 67"
            className="col-span-2"
          />
          <TextInput
            label={t("bank.holder")}
            value={value?.snapshot?.account_holder_name ?? ""}
            onChange={(v) => patchSnapshot("account_holder_name", v)}
            placeholder={t("bank.holderPlaceholder")}
            className="col-span-2"
          />
        </div>
      )}
    </div>
  );
}

/** Pure: determines whether a destination snapshot has every field
 *  the spec requires. Page-level validator uses this to gate the
 *  Confirm button + drive the form-validation toast. */
export function isDestinationValid(value) {
  if (!value || !value.method || !value.snapshot) return false;
  const s = value.snapshot;
  if (value.method === "ccp") {
    return !!(s.ccp_account?.trim() && s.ccp_key?.trim() && s.account_holder_name?.trim());
  }
  if (value.method === "bank") {
    return !!(s.bank_name?.trim() && s.rib?.trim() && s.account_holder_name?.trim());
  }
  return false;
}
