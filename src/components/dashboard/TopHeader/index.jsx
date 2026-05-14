"use client";

/**
 * TopHeader — top chrome strip.
 *
 * Layout:
 *   [ AuthBanners (compact pills) ────── flex spacer ────── Bell · Avatar ]
 *
 * The sidebar collapse toggle lives in the SIDEBAR's top row (not here)
 * so it sits at top-left of the L-shape, where users expect it.
 *
 * AuthBanners is the new home for the email-not-verified and
 * application-status pills (was previously a top-of-page band rendered
 * by AppShell). Each pill opens a Popover for full details. When neither
 * gate is active, AuthBanners renders nothing and the left side stays
 * empty.
 *
 * Visual: same `bg-bg-alt` as the sidebar, no bottom border. The header
 * and sidebar form one continuous off-white L-shape that wraps the
 * white content card.
 */

import AuthBanners from "@/components/auth/AuthBanners";
import NotificationBell from "./NotificationBell";
import UserAvatarMenu from "./UserAvatarMenu";

export default function TopHeader({ onOpenOverlay }) {
  return (
    <header className="shrink-0 flex items-center gap-[0.5em] h-[3.5em] px-[0.625em] bg-bg-alt">
      <div className="flex-1 min-w-0 flex items-center">
        <AuthBanners />
      </div>
      <div className="shrink-0 flex items-center gap-[0.25em]">
        <NotificationBell />
        <UserAvatarMenu onOpenOverlay={onOpenOverlay} />
      </div>
    </header>
  );
}
