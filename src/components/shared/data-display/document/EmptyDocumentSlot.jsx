"use client";

/**
 * EmptyDocumentSlot — dashed-border placeholder shown in a document grid
 * when a known slot has no document attached. Different from a generic
 * EmptyState because it occupies one cell of a grid alongside real
 * DocumentCards, signalling the gap visually.
 *
 * Used by SalesKitSection when the partial-kit pattern applies (some
 * named slots filled, others not). Stays out of the way: same height as
 * a populated card, dashed border, muted copy, no buttons.
 *
 * Props:
 *   icon       Lucide-style component (slot's natural icon kind) — optional
 *   title      "Pitch Deck" / "Demo Video" / etc.
 *   subtitle   "No pitch deck yet" / per-slot explainer
 */

import DocumentIcon from "./DocumentIcon";
import { cn } from "@/lib/utils";

export default function EmptyDocumentSlot({
  iconKind = "other",
  title,
  subtitle,
  className,
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-[0.875em] p-[1em] rounded-[0.625em]",
        "border border-dashed border-border bg-bg-alt/40",
        className,
      )}
      aria-disabled
    >
      <div className="flex items-start gap-[0.625em] min-w-0">
        <DocumentIcon kind={iconKind} size="md" className="opacity-60" />
        <div className="flex flex-col flex-1 min-w-0 gap-[0.125em]">
          <span className="text-[0.875em] font-semibold text-text-muted leading-[1.3] truncate">
            {title}
          </span>
          {subtitle && (
            <span className="text-[0.75em] text-text-muted leading-[1.4]">
              {subtitle}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
