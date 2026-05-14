"use client";

/**
 * StatusTabs — segmented tab strip for primary status segmentation on
 * list views. Linear / Notion / Mercury pattern: a single rail with one
 * active "pill" against a muted track. Each tab has an icon + label,
 * and an optional numeric count in a subtle chip on the right.
 *
 * Used by:
 *   - /applications (All · Pending · Approved · Rejected)
 *   - /marketplace  (All · Unapplied · Pending · Approved · Rejected)
 *   - any future status-driven list (e.g. /leads filter chips)
 *
 * NOT a replacement for `FilterBar`'s `chips` slot. Those are pill-shaped
 * filter chips that sit inline next to search and behave like
 * multi-pickable secondary filters. `StatusTabs` is for the *primary*
 * status segmentation — one selection at a time, the page's main lens.
 *
 * Props:
 *   tabs        Array<{
 *                 key:   string,
 *                 label: string,           — already-translated display text
 *                 icon?: ReactNode | Component, — optional icon (Lucide / react-icons)
 *               }>
 *   activeKey   string — the currently selected tab's key
 *   onChange    (key) => void
 *   counts?     Record<string, number> — optional per-key count.
 *                When provided AND a key has an entry, a small mono chip
 *                renders on the right of that tab. Tabs with no entry
 *                render without a count chip — so callers can mix
 *                counted + uncounted tabs in the same strip.
 *   className?  extra classes on the outer rail
 *
 * The tabs auto-wrap on narrow widths via `flex-wrap`, so this works in
 * a stacked-by-mobile FilterBar row without overflowing.
 */

import { isValidElement, createElement } from "react";
import { cn } from "@/lib/utils";

export default function StatusTabs({
  tabs = [],
  activeKey,
  onChange,
  counts,
  className,
}) {
  return (
    <div
      className={cn(
        // `self-start` keeps the rail at its natural width even when the
        // parent is a flex row that would otherwise stretch us. `w-fit`
        // backs it up for non-flex parents. No `flex-wrap` — the rail
        // is one segmented control, not a wrapping chip cloud.
        "inline-flex items-center self-start w-fit gap-[0.25em] bg-bg-alt rounded-[0.5em] p-[0.1875em]",
        className,
      )}
      role="tablist"
    >
      {tabs.map((tab) => {
        const isActive = tab.key === activeKey;
        const count = counts?.[tab.key];
        const hasCount = typeof count === "number";

        return (
          <button
            key={tab.key}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange?.(tab.key)}
            className={cn(
              "inline-flex items-center gap-[0.5em] h-[2em] px-[0.875em] rounded-[0.375em]",
              "text-[0.8125em] font-medium font-body whitespace-nowrap",
              "transition-[background-color,color,box-shadow] duration-150 ease-out",
              "focus-visible:outline-none focus-visible:shadow-[0_0_0_2px_rgba(59,110,204,0.25)]",
              isActive
                ? "bg-surface text-text shadow-xs"
                : "text-text-secondary hover:text-text",
            )}
          >
            {tab.icon && <TabIcon icon={tab.icon} />}
            <span>{tab.label}</span>
            {hasCount && (
              <span
                className={cn(
                  "inline-flex items-center justify-center min-w-[1.5em] h-[1.25em] rounded-full px-[0.375em]",
                  "text-[0.6875em] font-semibold font-mono tabular-nums",
                  isActive
                    ? "bg-accent-light text-accent-text"
                    : "bg-surface text-text-muted",
                )}
              >
                {count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

/** Accept either a rendered ReactElement (e.g. `<FiInbox size="1em" />`) or
 *  an icon Component (e.g. `FiInbox`) so callers can pass either form. */
function TabIcon({ icon }) {
  if (isValidElement(icon)) return icon;
  if (typeof icon === "function") {
    return createElement(icon, { size: "0.875em", strokeWidth: 2 });
  }
  return null;
}
