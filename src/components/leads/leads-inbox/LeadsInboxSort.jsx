"use client";

/**
 * LeadsInboxSort — popover sort selector for the company-side leads
 * inbox. Mirrors `MarketplaceSort` (same `Popover` primitive, same
 * radio-style row layout) so the two surfaces feel consistent.
 *
 * Three options:
 *   - newest             (default — submitted_at desc)
 *   - reservation_high   (total_reservation desc)
 *   - reservation_low    (total_reservation asc)
 *
 * Time + reservation cover the "what should I look at next?" mental
 * model on this page: oldest unreserved leads first, OR biggest
 * reservation first if escrow is tight.
 */

import { useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { ArrowUpDown, Check } from "lucide-react";
import Popover from "@/components/shared/overlays/Popover";
import { cn } from "@/lib/utils";

const OPTIONS = ["newest", "reservation_high", "reservation_low"];

export default function LeadsInboxSort({ value, onChange }) {
  const t = useTranslations("Leads.companyInbox.sort");
  const [open, setOpen] = useState(false);
  const triggerRef = useRef(null);

  return (
    <div className="relative">
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={t("ariaLabel")}
        className={cn(
          "inline-flex items-center gap-[0.5em] h-[2.375em] px-[0.875em] rounded-[0.5em]",
          "border border-border bg-surface",
          "text-[0.8125em] font-medium text-text-secondary",
          "hover:bg-surface-hover hover:text-text",
          "transition-[background-color,color] duration-150 ease-out",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[--accent-border]",
        )}
      >
        <ArrowUpDown size="0.875em" strokeWidth={1.75} />
        <span className="hidden sm:inline">{t("label")}</span>
        <span className="font-semibold text-text">{t(value)}</span>
      </button>

      <Popover
        open={open}
        onClose={() => setOpen(false)}
        triggerRef={triggerRef}
        className="w-[22em] p-[0.375em]"
      >
        <ul role="listbox" className="flex flex-col gap-[0.125em]">
          {OPTIONS.map((opt) => {
            const active = opt === value;
            return (
              <li key={opt}>
                <button
                  type="button"
                  role="option"
                  aria-selected={active}
                  onClick={() => {
                    onChange(opt);
                    setOpen(false);
                  }}
                  className={cn(
                    "w-full flex items-center justify-between gap-[0.5em] px-[0.625em] h-[2.25em] rounded-[0.375em]",
                    "text-[0.8125em] font-medium text-left whitespace-nowrap",
                    "transition-[background-color,color] duration-150 ease-out",
                    "focus-visible:outline-none focus-visible:bg-bg-alt",
                    active
                      ? "bg-accent-light text-accent-text"
                      : "text-text-secondary hover:bg-bg-alt hover:text-text",
                  )}
                >
                  <span className="truncate">{t(opt)}</span>
                  {active && <Check size="0.875em" strokeWidth={2} />}
                </button>
              </li>
            );
          })}
        </ul>
      </Popover>
    </div>
  );
}
