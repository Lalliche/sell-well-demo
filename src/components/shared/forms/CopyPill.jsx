"use client";

/**
 * CopyPill — monospaced value in a tinted pill with a trailing copy
 * button that flips its label `Copy → Copied ✓` for 1.5s on click.
 *
 * Pattern adapted from Stripe Connect / Rewardful: the button itself is
 * the primary feedback surface (label flip + check icon). A success toast
 * fires as a secondary confirmation when the caller passes a
 * `toastSuccess` label — useful on dense surfaces (table rows, sidebars)
 * where the partner's eye may not be on the button when they click.
 *
 * Shared primitive — promoted on first need (the partner-links table on
 * /partner-links). Reusable for any displayable identifier the user
 * needs to copy: link URLs, partner codes, webhook secrets, account
 * numbers, etc.
 *
 * Props:
 *   value           string — the actual text to copy (and to render).
 *   displayValue    string — optional override for what's rendered
 *                     (e.g. truncated URL while the full URL is copied).
 *                     Defaults to `value`.
 *   labels          {
 *                     copy:           localized button label ("Copy")
 *                     copied:         localized button label ("Copied")
 *                     toastSuccess?:  localized toast body ("Link copied")
 *                                       — when present, fires toast.success
 *                                       on a successful copy. Omit to keep
 *                                       the click silent (button-only feedback).
 *                   }
 *   size            "sm" | "md" — height + font scaling. Default "md".
 *   onCopy          optional callback fired after a successful copy.
 *   className       extra classes for the wrapper.
 *
 * Hard rules respected:
 *   - No state-driven setState in useEffect body — the timeout is set
 *     inside the click handler (a callback), and cleared on unmount.
 *   - Tailwind tokens only, em sizing.
 */

import { useEffect, useRef, useState } from "react";
import { Copy, Check } from "lucide-react";
import { useToast } from "@/hooks/useToast";
import { cn } from "@/lib/utils";

const SIZE = {
  sm: { pill: "h-[2em] text-[0.75em]",     btn: "h-[2em] px-[0.625em] text-[0.6875em]" },
  md: { pill: "h-[2.5em] text-[0.8125em]", btn: "h-[2.5em] px-[0.75em] text-[0.75em]" },
};

export default function CopyPill({
  value,
  displayValue,
  labels = { copy: "Copy", copied: "Copied" },
  size = "md",
  onCopy,
  className,
}) {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  const timerRef = useRef(null);

  // Cancel pending flip on unmount so the next mount doesn't flip a
  // stale state. No setState in effect body — only cleanup runs.
  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current); }, []);

  const handleCopy = async () => {
    if (!value) return;
    try {
      await navigator.clipboard.writeText(value);
    } catch {
      // Silent — older browsers or insecure contexts. The pill stays
      // selectable so the user can copy manually.
      return;
    }
    setCopied(true);
    onCopy?.(value);
    if (labels.toastSuccess) toast.success(labels.toastSuccess);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setCopied(false), 1500);
  };

  const s = SIZE[size] ?? SIZE.md;

  return (
    <span
      className={cn(
        "inline-flex items-stretch rounded-[0.5em] border border-border bg-bg-alt overflow-hidden max-w-full shadow-xs",
        className,
      )}
    >
      <span
        className={cn(
          "inline-flex items-center px-[0.75em] font-mono tabular-nums text-text truncate",
          s.pill,
        )}
        title={value}
      >
        {displayValue ?? value}
      </span>
      <button
        type="button"
        onClick={handleCopy}
        className={cn(
          "inline-flex items-center gap-[0.375em] shrink-0 font-semibold border-l border-border bg-surface text-text-secondary hover:bg-surface-hover hover:text-text",
          "transition-[background-color,color] duration-150 ease-out focus-visible:outline-none focus-visible:bg-surface-hover focus-visible:text-text",
          s.btn,
        )}
        aria-label={copied ? labels.copied : labels.copy}
      >
        {copied ? (
          <Check className="w-[0.875em] h-[0.875em] text-trend-positive" strokeWidth={2.25} />
        ) : (
          <Copy className="w-[0.875em] h-[0.875em]" strokeWidth={1.75} />
        )}
        {copied ? labels.copied : labels.copy}
      </button>
    </span>
  );
}
