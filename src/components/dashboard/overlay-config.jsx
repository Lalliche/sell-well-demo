"use client";

/**
 * Configuration for the DetailOverlays opened from the sidebar bottom dock
 * and the top-header avatar menu's "Manage account" item.
 *
 * Active overlays:
 *   - profile : opened by the dock's Profile row AND UserAvatarMenu.
 *               Three sections (Profile · Banking · Security) wired to
 *               real components — profile edit form, banking-info form,
 *               and a password/security read-only section. Section 1
 *               also hosts the ReviewStatusBanner so the resubmit loop
 *               stays closed for `more_info_requested` / `rejected` users.
 *   - help    : opened by the dock's Help row. Placeholder content; will
 *               grow into a real Help destination later.
 *
 * Settings is intentionally NOT here — admin has /admin/settings as a
 * separate top-nav item, and the partner/company settings route was
 * removed when General + Notifications moved into Profile overlay +
 * /notifications respectively (refactor 2026-05-13).
 *
 * The Language control is NOT a DetailOverlay — it's a direct EN/FR switch
 * (popover when collapsed, inline segmented control when expanded) rendered
 * by SidebarBottomDock.
 */

import { User, HelpCircle, Lock, FileText } from "lucide-react";

import PartnerProfileForm from "@/components/settings/PartnerProfileForm";
import CompanyProfileForm from "@/components/settings/CompanyProfileForm";
import ReviewStatusBanner from "@/components/settings/ReviewStatusBanner";
import ProfileOverlayBankingSection from "@/components/settings/profile-overlay/ProfileOverlayBankingSection";
import ProfileOverlaySecuritySection from "@/components/settings/profile-overlay/ProfileOverlaySecuritySection";

const HELP_PLACEHOLDER_NOTE = (label) =>
  `${label} content lands in a later phase. The overlay shell, navigation, and animation are wired now so the content can be plugged in without architectural changes.`;

/**
 * Build the DetailOverlay props for the given overlay name.
 * Returns null when name is null (i.e. no overlay should render).
 *
 * The profile overlay reads `user` + `profile` from props (passed by
 * DashboardShell, which already has `useAuth` + a profile query).
 */
export function buildOverlayProps({ name, displayName, user, t, tSection, profile }) {
  if (!name) return null;
  if (name === "help") return buildHelpOverlay({ t, tSection });
  if (name === "profile") return buildProfileOverlay({ displayName, user, t, tSection, profile });
  return null;
}

/* ── Profile overlay (3 sections: Profile / Banking / Security) ──────── */
function buildProfileOverlay({ displayName, user, t, tSection, profile }) {
  const isPartner = user?.role === "sales_partner";
  const isCompany = user?.role === "company";

  const ProfileForm = isPartner
    ? PartnerProfileForm
    : isCompany
    ? CompanyProfileForm
    : null;

  return {
    title: displayName,
    subtitle: t("profile.subtitle"),
    sections: [
      {
        key: "info",
        label: tSection("profile.info"),
        icon: <User size="1em" strokeWidth={1.75} />,
        content: (
          <div className="flex flex-col gap-[1.25em]">
            <ReviewStatusBanner user={user} />
            {ProfileForm && profile ? (
              <ProfileForm user={user} profile={profile} />
            ) : (
              <p className="text-[0.875em] text-text-muted">
                {tSection("placeholder.loading")}
              </p>
            )}
          </div>
        ),
      },
      {
        key: "banking",
        label: tSection("profile.banking"),
        icon: <FileText size="1em" strokeWidth={1.75} />,
        content: <ProfileOverlayBankingSection user={user} />,
      },
      {
        key: "security",
        label: tSection("profile.security"),
        icon: <Lock size="1em" strokeWidth={1.75} />,
        content: <ProfileOverlaySecuritySection user={user} />,
      },
    ],
  };
}

/* ── Help overlay (placeholder until real help content lands) ────────── */
function buildHelpOverlay({ t, tSection }) {
  const defs = [
    { key: "guides", labelKey: "help.guides", icon: <FileText size="1em" strokeWidth={1.75} /> },
    { key: "support", labelKey: "help.support", icon: <HelpCircle size="1em" strokeWidth={1.75} /> },
  ];
  return {
    title: t("help.title"),
    subtitle: t("help.subtitle"),
    sections: defs.map((s) => {
      const label = tSection(s.labelKey);
      return {
        key: s.key,
        label,
        icon: s.icon,
        content: (
          <div className="flex flex-col gap-[0.5em]">
            <span className="text-[0.6875em] uppercase tracking-[0.08em] text-text-muted font-semibold">
              {tSection("placeholder.label")}
            </span>
            <p className="text-[0.875em] text-text-secondary leading-[1.6]">
              {HELP_PLACEHOLDER_NOTE(label)}
            </p>
          </div>
        ),
      };
    }),
  };
}
