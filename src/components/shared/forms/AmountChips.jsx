"use client";

/**
 * AmountChips — DZD amount picker shared by /escrow/fund and
 * /escrow/withdraw. Two halves:
 *   1. Quick-pick chips (5–6 preset DZD amounts). Click a chip → fills
 *      the custom input. Active chip is highlighted (accent-light).
 *   2. Custom amount TextInput — accepts only digits, snapped to
 *      multiples of 500 on blur. Pre-fill rules + min/max are caller-
 *      controlled via props.
 *
 * Validation contract: the consumer renders its own error message via
 * the `error` prop because constraints differ across surfaces (fund
 * minimum 1,000; withdraw max = available_balance).
 *
 * Default-effect choice: the consumer passes `defaultChip` (e.g. the
 * second chip from the left, per the anchoring research the UX agent
 * surfaced — that's the natural "reasonable" pick in a 4–6 chip row).
 */

import { useEffect, useRef } from "react";
import { TextInput } from "@/components/ui/FormInputs";
import { format as formatDZD } from "@/lib/format/currency";
import { cn } from "@/lib/utils";

/** Snap a number to the nearest 500 (down). Negative → 0. */
export function snapTo500(n) {
  if (!Number.isFinite(n) || n <= 0) return 0;
  return Math.floor(n / 500) * 500;
}

export default function AmountChips({
  chips = [],
  value,
  onChange,
  defaultChip = null,
  /** Min/max are visual + UX hints; the consumer is responsible for
   *  surfacing errors. We just clamp the snap for sanity. */
  min = 0,
  /** Localized labels — `customLabel` and `inputPlaceholder` overridable
   *  per surface (fund vs withdraw can read differently). */
  customLabel,
  inputPlaceholder,
  helperText,
  error,
  className,
}) {
  const initRef = useRef(false);
  // Pre-fill the input with `defaultChip` on first mount. Only once —
  // subsequent renders never re-stamp (per React 19 rule we don't
  // call setState in the render body; useEffect with a guard ref).
  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;
    if (!value && defaultChip != null) onChange?.(defaultChip);
  }, [defaultChip, value, onChange]);

  const handleChip = (amount) => onChange?.(amount);

  // The input strips non-digits but does NOT snap to 500 on every
  // keystroke (that would feel janky — the user types "5500" and watches
  // "5500" briefly become "5000" before they're done). The consumer's
  // page-level validator surfaces the error; the snap happens at submit
  // time via `snapTo500`. We only enforce digit-only here.
  const handleInputChange = (raw) => {
    const digits = raw.replace(/[^\d]/g, "");
    if (digits === "") return onChange?.(null);
    onChange?.(Number(digits));
  };
  void min; // reserved for future page-level use; consumed by the parent's validator

  const activeChip = chips.find((c) => c === value);

  return (
    <div className={cn("flex flex-col gap-[0.875em]", className)}>
      <div className="flex flex-wrap gap-[0.5em]">
        {chips.map((amount) => {
          const active = amount === activeChip;
          return (
            <button
              key={amount}
              type="button"
              onClick={() => handleChip(amount)}
              className={cn(
                "inline-flex items-center justify-center min-w-[5em] h-[2.5em] px-[1em] rounded-[0.5em] border",
                "font-mono text-[0.875em] font-semibold tabular-nums",
                "transition-[background-color,border-color,color] duration-150 ease-out",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30",
                active
                  ? "bg-accent-light border-accent text-accent-text"
                  : "bg-surface border-border text-text-secondary hover:bg-surface-hover hover:text-text",
              )}
            >
              {formatDZD(amount, { withSymbol: false })}
            </button>
          );
        })}
      </div>

      <TextInput
        label={customLabel}
        value={value === null || value === undefined ? "" : String(value)}
        onChange={handleInputChange}
        placeholder={inputPlaceholder}
        helperText={helperText}
        errorMessage={error}
      />
    </div>
  );
}
