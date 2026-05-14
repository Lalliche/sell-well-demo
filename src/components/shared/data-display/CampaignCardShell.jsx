"use client";

/**
 * CampaignCardShell — shared visual frame for campaign cards across roles.
 *
 * Used by:
 *   - `marketplace/MarketplaceCard.jsx`  (sales partner view: company + apply)
 *   - `campaigns/CompanyCampaignCard.jsx` (company view: status + counts + kebab)
 *
 * Both variants share the same outer frame, hover treatment, heading
 * style, description clamp, and footer divider — but their top row and
 * footer-right zones are role-specific. Instead of stuffing both into a
 * single component with `variant="..."` conditionals, we expose those
 * zones as named slots and let each caller render its own content there.
 *
 * Slot contract:
 *   topRow         ReactNode — first row inside the card (logo + meta on
 *                              the partner side; cover image + status on
 *                              the company side).
 *   title          string    — product name (becomes the h3 heading).
 *   description    string    — 2-line clamp body text.
 *   commissionLine ReactNode — accent-colored mono commission string +
 *                              optional inline pills (Partner Links badge,
 *                              status, etc.).
 *   footerLeft     ReactNode — left half of the bottom-row footer (typically
 *                              meta — partner count + lead count).
 *   footerRight    ReactNode — right half of the bottom-row footer (status
 *                              badge, Apply pill, View CTA, kebab menu).
 *
 * Wrapper contract:
 *   href     string  — when provided, the card renders as a `<Link>` so the
 *                      whole frame is clickable. When omitted, renders as a
 *                      plain `<div>` (use this when the card has its own
 *                      inline interactive controls and you don't want the
 *                      wrapper to swallow their clicks).
 *   onClick  () => void — called on click when no `href` is set.
 *
 * Hover (per project card-hover memory rule): y-lift -2px, shadow grows,
 * heading shifts to text-accent-text via group-hover. NO appearing border.
 *
 * Anything that isn't shared (logo + apply state on the partner side; cover
 * image + status badge + kebab on the company side) lives in the caller.
 */

import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

export default function CampaignCardShell({
  href,
  onClick,
  topRow,
  title,
  description,
  commissionLine,
  footerLeft,
  footerRight,
  className,
}) {
  // Common visual treatment for both Link + div paths. Kept inline so
  // there's a single source of truth for the card's hover/shadow/padding.
  const sharedClass = cn(
    "group flex flex-col h-full p-[1.25em] gap-[0.875em]",
    "bg-surface border border-border-light rounded-[0.75em] shadow-xs",
    "hover:shadow-md hover:-translate-y-[2px]",
    "transition-[box-shadow,transform] duration-200 ease-out",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[--accent-border]",
    className,
  );

  const body = (
    <>
      {topRow}

      <h3
        className={cn(
          "font-heading font-semibold text-[1em] tracking-[-0.01em]",
          "text-text leading-[1.3] line-clamp-2",
          "transition-[color] duration-200 ease-out",
          "group-hover:text-accent-text",
        )}
      >
        {title}
      </h3>

      {description && (
        <p className="text-[0.8125em] text-text-secondary leading-[1.5] line-clamp-2">
          {description}
        </p>
      )}

      {/* Spacer pushes footer to the bottom of the card so cards in the
          same row line up regardless of description length. */}
      <div className="flex-1" />

      <div className="flex flex-col gap-[0.625em] pt-[0.75em] border-t border-border-light">
        {commissionLine && (
          <div className="flex items-center justify-between gap-[0.5em]">
            {commissionLine}
          </div>
        )}
        {(footerLeft || footerRight) && (
          <div className="flex items-center justify-between gap-[0.5em]">
            {footerLeft ?? <span />}
            {footerRight}
          </div>
        )}
      </div>
    </>
  );

  if (href) {
    return (
      <Link href={href} className={sharedClass}>
        {body}
      </Link>
    );
  }
  return (
    <div onClick={onClick} className={sharedClass}>
      {body}
    </div>
  );
}
