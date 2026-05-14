"use client";

/**
 * Sidebar — fixed-left dashboard chrome.
 *
 * Vertical stack:
 *   1. Toggle row    — collapse/expand button at the top-left, sized to
 *                       align with the top header strip's height so the
 *                       toggle and the header bell/avatar sit on the same
 *                       horizontal axis.
 *   2. SidebarBrand  — non-interactive logo + wordmark, sits BELOW the
 *                       toggle (matches the "S SellWell" → nav layout
 *                       requested in the design tweak).
 *   3. SidebarNavList    — middle, role-aware nav from getNavForRole(role).
 *   4. SidebarBottomDock — bottom, three shortcut buttons that open
 *                           DetailOverlays (Profile, Settings, Help) +
 *                           the LocaleSwitcher (segmented inline when
 *                           expanded, popover when collapsed).
 *
 * Width animates between `13.5em` (expanded) and `4em` (collapsed) via a
 * single CSS transition. No Framer Motion. Visual: shares `bg-bg-alt`
 * with the top header so the L-shape of chrome reads as one piece.
 */

import { useAuth } from "@/components/providers/AuthProvider";
import { cn } from "@/lib/utils";
import SidebarBrand from "./SidebarBrand";
import SidebarNavList from "./SidebarNavList";
import SidebarBottomDock from "./SidebarBottomDock";
import SidebarToggleButton from "@/components/dashboard/TopHeader/SidebarToggleButton";

const W_EXPANDED = "13.5em";
const W_COLLAPSED = "4em";

export default function Sidebar({
  collapsed,
  onToggle,
  toggleDisabled,
  onOpenOverlay,
  activeOverlay,
}) {
  const { user } = useAuth();
  if (!user) return null;

  return (
    <aside
      aria-label="Dashboard navigation"
      // `z-10` (paired with the existing `sticky`) lifts the sidebar above
      // the sibling content column. Without this, anything that visually
      // overflows the sidebar's right edge (e.g. the collapsed-mode
      // language popover hanging off the bottom Globe icon) renders ON
      // TOP visually but sits BELOW the content card in the stacking
      // order — so clicks on the protruding portion get swallowed.
      className="shrink-0 h-screen sticky top-0 z-10 flex flex-col bg-bg-alt"
      style={{
        width: collapsed ? W_COLLAPSED : W_EXPANDED,
        transition: "width 220ms ease-out",
      }}
    >
      {/* Toggle row — same height as the top header so the toggle and
          the header's right-side controls visually align. The `px-[0.5em]`
          on the row matches SidebarNavList + SidebarBottomDock, so when
          collapsed the toggle, brand, nav icons, and dock icons all land
          on the same 3em centerline (inside the 4em sidebar). */}
      <div
        className={cn(
          "shrink-0 h-[3.5em] flex  items-center px-[0.5em]",
          collapsed ? "justify-center" : "justify-start",
        )}
      >
        <SidebarToggleButton
          collapsed={collapsed}
          onToggle={onToggle}
          disabled={toggleDisabled}
        />
      </div>

      {/* Brand row — sits below the toggle. Non-interactive. Shares the
          same px-[0.5em] column as every other row. */}
      <div className="shrink-0 px-[0.5em] pb-[0.375em]">
        <SidebarBrand collapsed={collapsed} />
      </div>

      <SidebarNavList role={user.role} collapsed={collapsed} />

      <SidebarBottomDock
        collapsed={collapsed}
        onOpenOverlay={onOpenOverlay}
        activeOverlay={activeOverlay}
      />
    </aside>
  );
}
