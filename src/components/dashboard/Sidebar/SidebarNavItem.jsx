"use client";

/**
 * Single nav row in the sidebar. Active state visually matches the hover
 * state for the background (`bg-bg`), only the text + icon switch to
 * accent color so the current section is recognizable without the strong
 * accent-tinted pill. NO appearing border on hover (per the card-hover
 * memory rule, generalized to all chrome). Label fades + slides out when
 * sidebar collapses.
 *
 * The row animates color smoothly on active-change via a CSS transition
 * on background-color and color (no Framer Motion).
 */

import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

export default function SidebarNavItem({ item, collapsed }) {
  const t = useTranslations("Dashboard.Nav");
  const pathname = usePathname();
  const Icon = item.icon;

  // Active match: exact path OR a prefix that matches the item's href.
  // Keep `/dashboard` exact-only so it doesn't claim every dashboard sub-route.
  const isActive =
    item.href === "/dashboard"
      ? pathname === "/dashboard"
      : pathname === item.href || pathname.startsWith(item.href + "/");

  return (
    <Link
      href={item.href}
      aria-current={isActive ? "page" : undefined}
      title={collapsed ? t(item.key) : undefined}
      className={cn(
        "group relative flex items-center h-[2.5em] rounded-[0.5em]",
        "transition-[background-color,color] duration-150 ease-out",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[--accent-border]",
        collapsed ? "justify-center px-0" : "gap-[0.625em] px-[0.75em]",
        isActive
          ? "bg-bg text-accent-text"
          : "text-text-secondary hover:bg-bg hover:text-text",
      )}
    >
      <span className="shrink-0 inline-flex items-center justify-center">
        <Icon size="1.125em" strokeWidth={isActive ? 2 : 1.75} />
      </span>
      <span
        className={cn(
          "text-[0.8125em] font-medium leading-[1] whitespace-nowrap",
          "transition-[opacity,transform] duration-150 ease-out",
          collapsed
            ? "opacity-0 -translate-x-1 pointer-events-none w-0 overflow-hidden"
            : "opacity-100 translate-x-0",
        )}
      >
        {t(item.key)}
      </span>
    </Link>
  );
}
