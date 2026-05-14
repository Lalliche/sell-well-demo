"use client";

/**
 * Bottom-dock of the sidebar.
 *
 * Two shortcut rows (Profile · Help) + a Language control for partner +
 * company; Language only for admin. Shortcuts come in two flavors:
 *
 *   - `kind: "link"`     → renders as a locale-aware `<Link>` to a real
 *                          route. Active state lights up when the current
 *                          pathname matches the link's href. Unused today
 *                          (Settings was dropped from the dock 2026-05-13)
 *                          but the kind is kept for future shortcut routes.
 *
 *   - `kind: "overlay"`  → triggers a DetailOverlay via `onOpenOverlay(name)`.
 *                          Profile + Help use this. The Profile overlay
 *                          hosts the role-specific edit form + banking +
 *                          security sections (see overlay-config.jsx).
 *
 * Order (top → bottom): Profile · Help · Language.
 *
 * Language control is NOT an overlay:
 *   - expanded   : inline segmented EN/FR LocaleSwitcher with a small
 *                   "LANGUAGE" overline label.
 *   - collapsed  : a Globe IconButton; clicking opens a small Popover
 *                   anchored to the icon, holding the same EN/FR pills.
 *                   Picking a locale closes the popover automatically.
 */

import { useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { User, HelpCircle, Globe } from "lucide-react";
import { Link, usePathname } from "@/i18n/navigation";
import { useAuth } from "@/components/providers/AuthProvider";
import IconButton from "@/components/shared/data-display/IconButton";
import Popover from "@/components/shared/overlays/Popover";
import LocaleSwitcher from "@/components/shared/LocaleSwitcher";
import { cn } from "@/lib/utils";

/** Partner + company dock: Profile (overlay) · Help (overlay) · Language
 *  (popover or inline switcher).
 *  Admin dock: Language only — admins have no profile to edit, and Help /
 *  changelog UX was deferred. Decision: 2026-05-13 (post-UX research).
 *
 *  Settings was dropped from the dock entirely on 2026-05-13 — admin has
 *  /admin/settings as a top-nav item, and the partner/company /settings
 *  route was removed (General tab → Profile overlay, Notifications tab →
 *  /notifications second tab).
 *  Role gate lives in `SHORTCUTS_FOR_ROLE` below. */
const ALL_SHORTCUTS = [
  { name: "profile",  Icon: User,       tKey: "profile",  kind: "overlay" },
  { name: "help",     Icon: HelpCircle, tKey: "help",     kind: "overlay" },
];

function SHORTCUTS_FOR_ROLE(role) {
  if (role === "admin") return [];
  return ALL_SHORTCUTS;
}

/** No shortcut kinds need href resolution today — Profile + Help are
 *  overlay-triggers, Language is a separate widget. Kept as a stub so
 *  the existing dock-row component signatures stay stable. */
function resolveHref(_name, _role) {
  return null;
}

export default function SidebarBottomDock({ collapsed, onOpenOverlay, activeOverlay }) {
  const t = useTranslations("Dashboard.Dock");
  const { user } = useAuth();
  const pathname = usePathname();
  const role = user?.role;

  const shortcuts = SHORTCUTS_FOR_ROLE(role);

  return (
    <div className="shrink-0 flex flex-col gap-[0.25em] px-[0.5em] py-[0.625em]">
      {shortcuts.map(({ name, Icon, tKey, kind }) => {
        if (kind === "link") {
          const href = resolveHref(name, role);
          if (!href) return null;
          const isActive = pathname === href || pathname.startsWith(`${href}/`);
          return (
            <ShortcutLinkRow
              key={name}
              collapsed={collapsed}
              label={t(tKey)}
              isActive={isActive}
              href={href}
              Icon={Icon}
              ariaLabel={t(tKey)}
            />
          );
        }
        return (
          <ShortcutOverlayRow
            key={name}
            collapsed={collapsed}
            label={t(tKey)}
            isActive={activeOverlay === name}
            onClick={() => onOpenOverlay(name)}
            Icon={Icon}
            ariaLabel={t(tKey)}
          />
        );
      })}

      <LanguageControl collapsed={collapsed} />
    </div>
  );
}

/* ── Shared row chrome ────────────────────────────────────────────────── */

/** Inner content shared by the link + overlay row variants. Active styling
 *  matches the rest of the sidebar nav (bg-accent-light + accent-text). */
function RowInner({ Icon, label, isActive }) {
  return (
    <>
      <span className="shrink-0 inline-flex items-center justify-center">
        <Icon size="1.125em" strokeWidth={isActive ? 2 : 1.75} />
      </span>
      <span className="text-[0.8125em] font-medium leading-none whitespace-nowrap">
        {label}
      </span>
    </>
  );
}

const ROW_CLASS = (isActive) =>
  cn(
    "flex items-center gap-[0.625em] h-[2.5em] px-[0.75em] rounded-[0.5em]",
    "transition-[background-color,color] duration-150 ease-out",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[--accent-border]",
    isActive
      ? "bg-accent-light text-accent-text"
      : "text-text-secondary hover:bg-bg hover:text-text",
  );

/* ── Link row (Settings) ──────────────────────────────────────────────── */

/** Collapsed-state Link styled to match IconButton's square hit-target —
 *  we can't use IconButton directly because it renders a hard `<button>`
 *  and `<a>` cannot contain `<button>`. Style values mirror IconButton.
 *  If IconButton ever grows a polymorphic `as` prop, swap this back. */
function ShortcutLinkRow({ collapsed, label, isActive, href, Icon, ariaLabel }) {
  if (collapsed) {
    return (
      <Link
        href={href}
        aria-label={ariaLabel}
        className={cn(
          "shrink-0 inline-flex items-center justify-center rounded-[0.5em] mx-auto",
          "w-[2.25em] h-[2.25em]",
          "transition-[background-color,color,transform] duration-150 ease-out",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[--accent-border]",
          "active:scale-95",
          isActive
            ? "bg-accent-light text-accent-text"
            : "text-text-secondary hover:bg-bg-alt hover:text-text",
        )}
      >
        <Icon size="1.125em" strokeWidth={isActive ? 2 : 1.75} />
      </Link>
    );
  }
  return (
    <Link href={href} aria-label={ariaLabel} className={ROW_CLASS(isActive)}>
      <RowInner Icon={Icon} label={label} isActive={isActive} />
    </Link>
  );
}

/* ── Overlay row (Profile / Help) ─────────────────────────────────────── */

function ShortcutOverlayRow({ collapsed, label, isActive, onClick, Icon, ariaLabel }) {
  if (collapsed) {
    return (
      <IconButton
        ariaLabel={ariaLabel}
        active={isActive}
        onClick={onClick}
        size="md"
        className="mx-auto"
      >
        <Icon size="1.125em" strokeWidth={isActive ? 2 : 1.75} />
      </IconButton>
    );
  }
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      className={ROW_CLASS(isActive)}
    >
      <RowInner Icon={Icon} label={label} isActive={isActive} />
    </button>
  );
}

/* ── Language control (popover when collapsed, inline when expanded) ──── */

function LanguageControl({ collapsed }) {
  const t = useTranslations("Dashboard.Dock");
  const [open, setOpen] = useState(false);
  const triggerRef = useRef(null);

  if (collapsed) {
    return (
      <div className="relative mx-auto">
        <IconButton
          ref={triggerRef}
          ariaLabel={t("language")}
          active={open}
          onClick={() => setOpen((v) => !v)}
          size="md"
        >
          <Globe size="1.125em" strokeWidth={1.75} />
        </IconButton>
        <Popover
          open={open}
          onClose={() => setOpen(false)}
          placement="top"
          align="left"
          triggerRef={triggerRef}
          className="p-[0.625em]"
        >
          <LocaleSwitcher onAfterChange={() => setOpen(false)} />
        </Popover>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between gap-[0.5em] px-[0.25em] h-[2.5em]">
      <span className="text-[0.6875em] uppercase tracking-[0.08em] text-text-muted font-semibold">
        {t("language")}
      </span>
      <LocaleSwitcher variant="onAlt" />
    </div>
  );
}
