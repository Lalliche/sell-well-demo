"use client";

/**
 * InfoPopover — the inline `(i)` info-circle pattern Mercury, Wise, Stripe,
 * and Coinbase use everywhere. Click the small icon next to a "scary" word
 * (Escrow, Fee, Refundable, Hold, Reserved) and a tight 1-paragraph panel
 * appears explaining what it means.
 *
 * Convention from research: it's an info-circle, NOT a question mark.
 * Question marks read as "you don't know what this means"; info-circles
 * read as "here's an explanation if you want it."
 *
 * Wraps the shared `Popover` overlay so the same outside-click + Escape
 * behavior applies. Click toggles open; another click on the trigger
 * closes; pressing Esc closes.
 *
 * Usage:
 *   <InfoPopover label="What's escrow?" body="Your wallet…" />
 *
 * Optional `link` renders a "Learn more →" footer that calls onClick or
 * navigates via Link from @/i18n/navigation.
 */

import { useRef, useState } from "react";
import { Info } from "lucide-react";
import Popover from "@/components/shared/overlays/Popover";
import { cn } from "@/lib/utils";

export default function InfoPopover({
  label,
  body,
  size = "md",
  align = "left",
  className,
}) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef(null);
  const iconSize = size === "sm" ? "w-[0.875em] h-[0.875em]" : "w-[1em] h-[1em]";

  return (
    <span className={cn("relative inline-flex", className)}>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label={label}
        aria-expanded={open}
        className={cn(
          "inline-flex items-center justify-center rounded-full",
          "text-text-muted hover:text-accent",
          "transition-colors duration-150 ease-out",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30",
        )}
      >
        <Info className={iconSize} strokeWidth={1.75} />
      </button>

      <Popover
        open={open}
        onClose={() => setOpen(false)}
        triggerRef={triggerRef}
        placement="bottom"
        align={align}
        className="w-[20em] p-[0.875em]"
      >
        <p className="text-[0.6875em] font-semibold tracking-[0.06em] uppercase text-text-muted mb-[0.375em]">
          {label}
        </p>
        <p className="text-[0.8125em] text-text-secondary font-body leading-[1.55]">
          {body}
        </p>
      </Popover>
    </span>
  );
}
