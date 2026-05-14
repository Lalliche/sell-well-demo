"use client";

/**
 * RejectedScreen — full-screen block for users with
 * `application_status === "rejected"`. Replaces the protected layout's
 * children entirely so the user cannot reach any dashboard surface.
 *
 * Per spec (auth-onboarding-spec.md → Verification Policy): rejected users
 * can re-apply after `reapplication_cooldown_days` (default 30 days).
 * Rejection reason is shown in a card. Two CTAs: Log out (primary) and
 * Contact support (mailto).
 */

import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { AlertCircle } from "lucide-react";
import AppButton from "@/components/ui/Buttons";
import { useAuth } from "@/components/providers/AuthProvider";

const SUPPORT_EMAIL = "hello@sellwell.dz";

export default function RejectedScreen() {
  const t = useTranslations("Auth.Rejected");
  const { user, logout } = useAuth();
  const router = useRouter();

  if (!user) return null;

  const handleLogout = async () => {
    await logout();
    router.replace("/login");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg px-[1.5em] py-[2em]">
      <div className="w-full max-w-[32em] flex flex-col items-center gap-[1.5em] text-center">
        {/* Icon */}
        <div className="flex items-center justify-center w-[3.5em] h-[3.5em] rounded-full bg-[var(--color-status-rejected-bg)]">
          <AlertCircle
            size="1.75em"
            strokeWidth={1.5}
            className="text-[var(--color-status-rejected-text)]"
          />
        </div>

        {/* Heading */}
        <div className="flex flex-col gap-[0.5em]">
          <h1 className="font-heading font-bold text-[1.625em] tracking-[-0.02em] text-text leading-[1.15]">
            {t("heading")}
          </h1>
          <p className="text-[0.9375em] text-text-secondary leading-[1.55]">
            {t("body")}
          </p>
        </div>

        {/* Reason card */}
        {user.application_review_notes && (
          <div className="w-full bg-surface border border-border rounded-[0.625em] p-[1.25em] flex flex-col gap-[0.375em] text-left">
            <span className="text-[0.6875em] uppercase tracking-[0.06em] font-semibold text-text-muted">
              {t("reasonLabel")}
            </span>
            <p className="text-[0.875em] text-text leading-[1.55]">
              {user.application_review_notes}
            </p>
          </div>
        )}

        {/* CTAs */}
        <div className="w-full flex flex-col gap-[0.5em] mt-[0.25em]">
          <AppButton
            variant="primary"
            size="md"
            className="w-full"
            onClick={handleLogout}
          >
            {t("logout")}
          </AppButton>
          <a
            href={`mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent("Application appeal")}`}
            className="text-[0.8125em] text-text-secondary hover:text-text underline underline-offset-2 decoration-border hover:decoration-text transition-colors text-center py-[0.625em]"
          >
            {t("contact", { email: SUPPORT_EMAIL })}
          </a>
        </div>
      </div>
    </div>
  );
}
