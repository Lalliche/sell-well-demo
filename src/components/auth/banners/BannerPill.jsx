"use client";

/**
 * Compact verification banner pill — fits inside the dashboard top header
 * strip (3.5em tall). One pill per active gate (email-not-verified +
 * application-status). Click → opens a Popover with the full title, body,
 * optional admin notes, and the action button.
 *
 * Visual: small icon-circle (bg + tone driven by the parent) + one-line
 * title + caret. Hover deepens the pill background. Reads as an
 * affordance, never as a static notice.
 *
 * The popover uses our shared `Popover` primitive so the open/close
 * animation matches every other dropdown in the chrome (bell, avatar,
 * language).
 *
 * Props:
 *   icon         ReactNode — Lucide icon element (rendered inside iconCircle).
 *   iconBg       Tailwind class for the icon-circle background (e.g. "bg-accent-light").
 *   iconColor    Tailwind class for the icon foreground.
 *   pillTitle    string — short label shown on the pill itself.
 *   title        string — full title shown in the popover header.
 *   body         string — explanation paragraph shown in the popover body.
 *   noteHeading  string — optional heading shown above `notes`.
 *   notes        string — optional admin note (shown only when present).
 *   action       ReactNode — primary action (button) rendered at the
 *                bottom of the popover. May be null.
 *   ariaLabel    string — pill's accessible label (announces what
 *                clicking it opens).
 */

import { useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import { useTranslations } from "next-intl";
import Popover from "@/components/shared/overlays/Popover";
import { cn } from "@/lib/utils";

export default function BannerPill({
  icon,
  iconBg,
  iconColor,
  pillTitle,
  title,
  body,
  noteHeading,
  notes,
  action,
  ariaLabel,
}) {
  const t = useTranslations("Auth.Banners");
  const [open, setOpen] = useState(false);
  const triggerRef = useRef(null);

  return (
    <div className="relative">
      {/* Trigger.
          Below xs (≤499px) the pill collapses to icon-only: same circular
          hit-target as the bell, just the icon-circle is visible. Title +
          caret are hidden via `xs:` so they only render once we have
          breathing room. The aria-label still announces what clicking
          opens, so screen readers + the native title tooltip get the
          full message either way. */}
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={ariaLabel ?? t("openDetails")}
        aria-expanded={open}
        title={pillTitle}
        className={cn(
          "inline-flex items-center justify-center",
          // Sub-xs: square-ish icon-only button, no padding for label.
          "h-[2.25em] w-[2.25em] rounded-full",
          // xs and up: pill with icon + label + caret.
          "xs:w-auto xs:gap-[0.5em] xs:pl-[0.375em] xs:pr-[0.625em] xs:rounded-[1.125em]",
          "bg-surface border border-border-light",
          "hover:bg-bg-alt hover:border-border",
          "transition-[background-color,border-color] duration-150 ease-out",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[--accent-border]",
          "xs:max-w-[18em]",
        )}
      >
        <span
          aria-hidden="true"
          className={cn(
            "shrink-0 flex items-center justify-center w-[1.5em] h-[1.5em] rounded-full",
            iconBg,
          )}
        >
          <span className={iconColor}>{icon}</span>
        </span>
        <span className="hidden xs:inline text-[0.75em] font-medium text-text leading-none truncate">
          {pillTitle}
        </span>
        <ChevronDown
          aria-hidden="true"
          size="0.875em"
          strokeWidth={2}
          className={cn(
            "hidden xs:inline shrink-0 text-text-muted transition-transform duration-150 ease-out",
            open && "rotate-180",
          )}
        />
      </button>

      <Popover
        open={open}
        onClose={() => setOpen(false)}
        triggerRef={triggerRef}
        align="left"
        className="w-[22em] max-w-[calc(100vw-2em)] p-[1em]"
      >
        <div className="flex items-start gap-[0.625em]">
          <span
            aria-hidden="true"
            className={cn(
              "shrink-0 flex items-center justify-center w-[2em] h-[2em] rounded-full",
              iconBg,
            )}
          >
            <span className={iconColor}>{icon}</span>
          </span>
          <div className="flex-1 min-w-0 flex flex-col gap-[0.25em]">
            <span className="text-[0.875em] font-semibold text-text leading-[1.3]">
              {title}
            </span>
            <span className="text-[0.8125em] text-text-secondary leading-[1.5]">
              {body}
            </span>
          </div>
        </div>

        {notes && (
          <div className="mt-[0.875em] flex flex-col gap-[0.375em]">
            <span className="text-[0.6875em] uppercase tracking-[0.08em] text-text-muted font-semibold">
              {noteHeading ?? t("noteHeading")}
            </span>
            <p className="text-[0.8125em] text-text-secondary leading-[1.5] bg-bg-alt border border-border-light rounded-[0.5em] p-[0.625em]">
              {notes}
            </p>
          </div>
        )}

        {action && <div className="mt-[1em] flex justify-end">{action}</div>}
      </Popover>
    </div>
  );
}
