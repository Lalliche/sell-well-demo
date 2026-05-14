"use client";

/**
 * DashboardShell — the L-shaped chrome that wraps every protected app
 * route. Composition:
 *   ┌───────────────────────────────────────────────┐
 *   │ bg-bg-alt (page bg, the off-white surround)   │
 *   │  ┌─────┐ ┌──────────────────────────────────┐ │
 *   │  │ Side│ │ TopHeader (no border, blends)    │ │
 *   │  │ bar │ ├──────────────────────────────────┤ │
 *   │  │     │ │  white content card              │ │
 *   │  │     │ │  rounded, children render here   │ │
 *   │  │     │ │                                  │ │
 *   │  └─────┘ └──────────────────────────────────┘ │
 *   └───────────────────────────────────────────────┘
 *
 * State this component owns:
 *   - `userCollapsed` : the user's preferred collapsed state, persisted
 *                       to localStorage so it survives navigation.
 *   - `mobileForced`  : true when viewport is below `sm` (640px). Forced
 *                       collapsed regardless of user preference. Updated
 *                       via a matchMedia listener.
 *   - `activeOverlay` : null | "profile" | "help".
 *                       Drives the DetailOverlay instance below. Settings is
 *                       a route page (`/settings` or `/admin/settings`), not
 *                       an overlay — the dock renders it as a `<Link>`. The
 *                       Language switcher is NOT a DetailOverlay either — it's
 *                       a direct EN/FR popover handled inside SidebarBottomDock.
 *
 * The toggle lives in the Sidebar's top-left slot (not the TopHeader), and
 * is disabled on mobile since collapse is forced.
 *
 * No Framer Motion. Sidebar width transitions via CSS. The content card's
 * margin/padding are static.
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { useQuery } from "@tanstack/react-query";
import Sidebar from "./Sidebar";
import TopHeader from "./TopHeader";
import DetailOverlay from "@/components/shared/overlays/DetailOverlay";
import { useAuth } from "@/components/providers/AuthProvider";
import { fetchCurrentUserProfile } from "@/lib/mock/profile";
import { buildOverlayProps } from "./overlay-config";

const STORAGE_KEY = "sellwell:sidebar-collapsed";
const MOBILE_QUERY = "(max-width: 639.98px)";

function readStoredCollapsed() {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

function writeStoredCollapsed(value) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, value ? "1" : "0");
  } catch {
    /* ignore */
  }
}

function resolveDisplayName(user) {
  if (!user) return "";
  if (user.role === "sales_partner" && user.profile) {
    return `${user.profile.first_name} ${user.profile.last_name}`;
  }
  if (user.role === "company" && user.profile) return user.profile.company_name;
  if (user.role === "admin") return "Admin";
  return user.email ?? "";
}

export default function DashboardShell({ children }) {
  const { user } = useAuth();
  const t = useTranslations("Dashboard.Overlay");
  const tSection = useTranslations("Dashboard.Overlay");

  // Profile is needed by the Profile overlay's `info` section (the role-
  // specific edit form). Fetched once at the shell level so opening the
  // overlay is instant (no inner spinner on Section 1). Admin role gets
  // no profile (admins don't have one) — the Profile dock item is hidden
  // for admin anyway via SidebarBottomDock's SHORTCUTS_FOR_ROLE.
  const { data: currentProfile } = useQuery({
    queryKey: ["currentUserProfile", user?.id],
    queryFn: () => fetchCurrentUserProfile(user.id),
    enabled: !!user?.id && user.role !== "admin",
  });

  const [userCollapsed, setUserCollapsed] = useState(false);
  const [mobileForced, setMobileForced]   = useState(false);
  const [activeOverlay, setActiveOverlay] = useState(null);

  // Hydrate collapsed pref from localStorage + listen for sm breakpoint.
  // Both initial state reads are deferred via rAF — per the project hard
  // rule (CLAUDE.md → "Never call setState synchronously in a useEffect
  // body"). The matchMedia `change` callback is already legal because
  // setState fires inside an event handler.
  useEffect(() => {
    const mq = window.matchMedia(MOBILE_QUERY);
    const sync = () => setMobileForced(mq.matches);

    const rafId = requestAnimationFrame(() => {
      setUserCollapsed(readStoredCollapsed());
      setMobileForced(mq.matches);
    });

    mq.addEventListener("change", sync);
    return () => {
      cancelAnimationFrame(rafId);
      mq.removeEventListener("change", sync);
    };
  }, []);

  const collapsed = mobileForced || userCollapsed;

  const handleToggle = useCallback(() => {
    if (mobileForced) return;
    setUserCollapsed((prev) => {
      const next = !prev;
      writeStoredCollapsed(next);
      return next;
    });
  }, [mobileForced]);

  const handleOpenOverlay = useCallback((name) => {
    setActiveOverlay(name);
  }, []);

  const handleCloseOverlay = useCallback(() => {
    setActiveOverlay(null);
  }, []);

  // Build overlay props for the active overlay name. Returns null when
  // no overlay is active so the DetailOverlay can stay unmounted (its
  // own `open` prop also gates rendering — see DetailOverlay.jsx).
  // The Profile overlay reads `user` + `profile` to render the role-
  // specific edit form + the live ReviewStatusBanner.
  const overlayProps = useMemo(() => {
    return buildOverlayProps({
      name: activeOverlay,
      displayName: resolveDisplayName(user),
      user,
      profile: currentProfile,
      t,
      tSection,
    });
  }, [activeOverlay, user, currentProfile, t, tSection]);

  return (
    <div className="h-screen flex  bg-bg-alt">
      <Sidebar
        collapsed={collapsed}
        onToggle={handleToggle}
        toggleDisabled={mobileForced}
        onOpenOverlay={handleOpenOverlay}
        activeOverlay={activeOverlay}
      />

      <div className="flex-1 min-w-0 flex flex-col">
        <TopHeader onOpenOverlay={handleOpenOverlay} />

        
        <main
          className="flex-1 min-h-0 mr-[0.625em] mb-[0.625em]  bg-surface rounded-[1em] border border-border shadow-xs overflow-hidden"
        >
          {/* `relative` makes this the containing block for any
              `position: absolute` overlays portaled into it (FilterPanel,
              future inline popovers). Without it, absolute coords resolve
              against <body> and the overlay drifts off the trigger. */}
          <div className="relative h-full overflow-y-auto">{children}</div>
        </main>
      </div>

      {overlayProps && (
        <DetailOverlay
          open={!!activeOverlay}
          onClose={handleCloseOverlay}
          title={overlayProps.title}
          subtitle={overlayProps.subtitle}
          sections={overlayProps.sections}
        />
      )}
    </div>
  );
}
