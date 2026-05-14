"use client";

/**
 * UserAvatarMenu — small floating dropdown anchored to the avatar trigger
 * in the top header. Shows: avatar + display name + email + role badge,
 * Manage account button (opens the Profile DetailOverlay), Logout.
 *
 * Display-name resolution mirrors the AuthUser discriminated union exactly:
 *   sales_partner → first_name + last_name
 *   company       → company_name
 *   admin         → "Admin"
 * If the polymorphic profile is ever null for a non-admin role (shouldn't
 * happen given fetchCurrentUser's contract), falls back to email.
 *
 * Logout flow: useAuth().logout() (clears mock session) → router.replace("/login").
 * Manage account: calls onOpenOverlay("profile") and closes the dropdown so
 * the DetailOverlay backdrop doesn't compete with this popover.
 */

import { useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import IconButton from "@/components/shared/data-display/IconButton";
import Popover from "@/components/shared/overlays/Popover";
import Avatar from "@/components/shared/data-display/Avatar";
import AppButton from "@/components/ui/Buttons";
import { useAuth } from "@/components/providers/AuthProvider";
import { LogOut, UserCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

const ROLE_LABEL_KEY = {
  sales_partner: "rolePartner",
  company:       "roleCompany",
  admin:         "roleAdmin",
};

function resolveDisplayName(user) {
  if (!user) return "";
  if (user.role === "sales_partner") {
    if (user.profile) return `${user.profile.first_name} ${user.profile.last_name}`;
    return user.email;
  }
  if (user.role === "company") {
    if (user.profile) return user.profile.company_name;
    return user.email;
  }
  return "Admin";
}

export default function UserAvatarMenu({ onOpenOverlay }) {
  const t = useTranslations("Dashboard.AvatarMenu");
  const tHeader = useTranslations("Dashboard.Header");
  const { user, logout } = useAuth();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const triggerRef = useRef(null);

  if (!user) return null;

  const name = resolveDisplayName(user);
  const roleLabel = t(ROLE_LABEL_KEY[user.role]);
  const avatarSrc =
    user.role === "sales_partner" ? user.profile?.profile_photo :
    user.role === "company"       ? user.profile?.logo :
    undefined;

  async function handleLogout() {
    setOpen(false);
    await logout();
    router.replace("/login");
  }

  function handleManageAccount() {
    setOpen(false);
    onOpenOverlay?.("profile");
  }

  return (
    <div className="relative">
      <IconButton
        ref={triggerRef}
        ariaLabel={tHeader("openAccountMenu")}
        active={open}
        onClick={() => setOpen((v) => !v)}
        size="md"
        className="!w-[2.25em] !h-[2.25em]"
      >
        <Avatar name={name} src={avatarSrc} size="sm" />
      </IconButton>

      <Popover
        open={open}
        onClose={() => setOpen(false)}
        triggerRef={triggerRef}
        className="w-[19em]"
      >
        {/* Identity row */}
        <div className="flex items-center gap-[0.75em] p-[1em] border-b border-border-light">
          <Avatar name={name} src={avatarSrc} size="lg" />
          <div className="flex-1 min-w-0 flex flex-col gap-[0.125em]">
            <span className="text-[0.875em] font-semibold text-text leading-tight truncate">
              {name}
            </span>
            <span className="text-[0.75em] text-text-muted leading-tight truncate">
              {user.email}
            </span>
          </div>
          <span
            className={cn(
              "shrink-0 inline-flex items-center px-[0.5em] py-[0.1875em] rounded-full",
              "bg-accent-light text-accent-text text-[0.6875em] font-semibold uppercase tracking-[0.04em]",
            )}
          >
            {roleLabel}
          </span>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-[0.25em] p-[0.5em]">
          <button
            type="button"
            onClick={handleManageAccount}
            className={cn(
              "flex items-center gap-[0.625em] h-[2.25em] px-[0.625em] rounded-[0.5em]",
              "text-[0.8125em] font-medium text-text-secondary",
              "hover:bg-bg-alt hover:text-text",
              "transition-[background-color,color] duration-150 ease-out",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[--accent-border]",
            )}
          >
            <UserCircle2 size="1em" strokeWidth={1.75} />
            {t("manageAccount")}
          </button>

          <button
            type="button"
            onClick={handleLogout}
            className={cn(
              "flex items-center gap-[0.625em] h-[2.25em] px-[0.625em] rounded-[0.5em]",
              "text-[0.8125em] font-medium text-text-secondary",
              "hover:bg-bg-alt hover:text-text",
              "transition-[background-color,color] duration-150 ease-out",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[--accent-border]",
            )}
          >
            <LogOut size="1em" strokeWidth={1.75} />
            {t("logout")}
          </button>
        </div>
      </Popover>
    </div>
  );
}
