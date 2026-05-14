"use client";

/**
 * AuthBanners — surfaces the two parallel verification gates from
 * auth-onboarding-spec.md → Verification Policy.
 *
 * As of Phase 5.4 follow-up: banners no longer render as full-width cards
 * above the dashboard chrome. They live INSIDE the TopHeader strip as
 * compact pills (one per active gate). Click → popover with the full
 * title, body, optional admin notes, and the action button.
 *
 * Container layout: a horizontal flex row that fits inside the 3.5em
 * header. Each pill is its own component (EmailBanner, ApplicationBanner)
 * built on the shared BannerPill primitive in `./banners/`.
 *
 * Gate visibility:
 *   email   → user.is_email_verified === false
 *   app     → user.application_status ∈ { pending_review, more_info_requested }
 *
 * `rejected` status is NOT surfaced here — it's a full-screen block
 * (RejectedScreen) because rejected users can't access the dashboard at
 * all. AppShell still owns that branch.
 */

import { useAuth } from "@/components/providers/AuthProvider";
import EmailBanner from "./banners/EmailBanner";
import ApplicationBanner from "./banners/ApplicationBanner";

export default function AuthBanners() {
  const { user } = useAuth();
  if (!user) return null;

  const showEmail = !user.is_email_verified;
  const showApp =
    user.application_status === "pending_review" ||
    user.application_status === "more_info_requested";

  if (!showEmail && !showApp) return null;

  return (
    <div className="flex items-center gap-[0.5em] min-w-0">
      {showEmail && <EmailBanner email={user.email} />}
      {showApp && (
        <ApplicationBanner
          status={user.application_status}
          notes={user.application_review_notes}
        />
      )}
    </div>
  );
}
