"use client";

import { useLocale } from "next-intl";
import { useRouter, usePathname } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

const LOCALES = [
  { code: "en", label: "EN" },
  { code: "fr", label: "FR" },
];

/* Segmented EN/FR locale switcher. Used in navbar, footer, dashboard
 * sidebar (expanded), and the collapsed-sidebar locale popover.
 *
 * Variants:
 *   "default" (default) — bg-bg-alt container with a bg-surface active
 *                          pill. For use on white surfaces (navbar, footer,
 *                          inside popovers when nested).
 *   "onAlt"             — same visuals but with bg-bg container so it
 *                          reads on a `bg-bg-alt` surface (e.g. when sat
 *                          directly on the dashboard sidebar surface).
 *
 * The active pill always uses bg-surface — it reads on either container.
 *
 * Optional `onAfterChange` fires AFTER the locale switch is dispatched
 * (callers can use this to close a containing popover, etc.). Fires on
 * every click, including clicks on the already-active locale.
 */
export default function LocaleSwitcher({ variant = "default", onAfterChange }) {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  function switchLocale(next) {
    if (next !== locale) router.replace(pathname, { locale: next });
    onAfterChange?.(next);
  }

  return (
    <div
      className={cn(
        "flex items-center gap-[0.125em] rounded-[0.5em] p-[0.1875em]",
        variant === "onAlt" ? "bg-bg" : "bg-bg-alt",
      )}
    >
      {LOCALES.map(({ code, label }) => (
        <button
          key={code}
          type="button"
          onClick={() => switchLocale(code)}
          aria-label={`Switch to ${code.toUpperCase()}`}
          className={cn(
            "px-[0.625em] py-[0.25em] rounded-[0.375em] text-[0.75em] font-semibold",
            "transition-[background-color,color] duration-150 ease-out",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[--accent-border]",
            locale === code
              ? "bg-surface text-text shadow-xs"
              : "text-text-muted hover:text-text-secondary",
          )}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
