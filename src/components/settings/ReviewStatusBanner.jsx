"use client";

/**
 * ReviewStatusBanner — closes the verification loop on /settings.
 *
 * Renders above the profile-edit form when the user is in one of the two
 * "needs the user to act" review states:
 *
 *   more_info_requested → amber card with the admin's note + a primary
 *                         "Submit for re-review" CTA. No cooldown.
 *   rejected            → amber/red card with the admin's reason +
 *                         either a "Submit for re-review" CTA (cooldown
 *                         elapsed) or a cooldown countdown.
 *
 * For pending_review and approved users this returns null.
 *
 * The CTA hits `resubmitForReview(userId)` (mock layer mutates MOCK_USERS,
 * flips status back to pending_review, clears the review notes), then
 * calls `useAuth().refetch()` so the AuthProvider's snapshot re-reads from
 * the seed and the banner pill in the top header updates accordingly.
 * A success toast confirms the resubmit.
 *
 * Cooldown semantics:
 *   reapplication_cooldown_days = 30 (matches PlatformSetting default).
 *   `application_reviewed_at` is the start of the cooldown clock. We avoid
 *   computing dates during render — the parent passes `now` so the
 *   countdown stays deterministic across re-renders within one frame.
 *
 * Props:
 *   user        { id, application_status, application_reviewed_at,
 *                 application_review_notes, ... }
 *   onResubmit  callback the parent uses to invalidate / refetch any
 *               profile queries after the status flips
 */

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { useMutation } from "@tanstack/react-query";
import { AlertCircle, XCircle, Clock, ArrowUpCircle } from "lucide-react";

import AppButton from "@/components/ui/Buttons";
import { useAuth } from "@/components/providers/AuthProvider";
import { useToast } from "@/hooks/useToast";
import { resubmitForReview } from "@/lib/mock/profile";
import { getPlatformSetting } from "@/lib/mock/admin";
import { cn } from "@/lib/utils";

function daysSinceReview(reviewedAt, now) {
  if (!reviewedAt || !now) return null;
  return Math.floor(
    (now - new Date(reviewedAt).getTime()) / (24 * 60 * 60 * 1000),
  );
}

export default function ReviewStatusBanner({ user, onResubmit }) {
  const t = useTranslations("Settings.reviewBanner");
  const { refetch } = useAuth();
  const { toast } = useToast();

  // Read `Date.now()` via effect (per the no-setState-in-effect-body rule
  // we wrap in rAF). Keeps the cooldown deterministic per frame.
  const [now, setNow] = useState(null);
  useEffect(() => {
    const raf = requestAnimationFrame(() => setNow(Date.now()));
    return () => cancelAnimationFrame(raf);
  }, [user?.application_reviewed_at]);

  const resubmitMut = useMutation({
    mutationFn: () => resubmitForReview(user.id),
    onSuccess: async (result) => {
      if (result && !result.error) {
        await refetch();
        toast.success(t("toast.successBody"), {
          title: t("toast.successTitle"),
        });
        onResubmit?.();
      } else {
        toast.error(t("toast.errorBody"), { title: t("toast.errorTitle") });
      }
    },
  });

  const status = user?.application_status;
  if (status !== "more_info_requested" && status !== "rejected") {
    return null;
  }

  const isMoreInfo = status === "more_info_requested";
  const isRejected = status === "rejected";

  const elapsedDays =
    isRejected ? daysSinceReview(user.application_reviewed_at, now) : null;
  // Live read from PlatformSetting — admin edits in /admin/settings
  // instantly shift the cooldown for every rejected partner banner.
  const cooldownDays = getPlatformSetting("reapplication_cooldown_days", 30);
  const cooldownActive =
    isRejected && elapsedDays !== null && elapsedDays < cooldownDays;
  const remainingDays = cooldownActive
    ? cooldownDays - elapsedDays
    : 0;

  // Tones: more_info → amber (pending palette), rejected → red.
  const tones = isMoreInfo
    ? {
        wrap: "bg-status-pending-bg/40 border-status-pending-text/30",
        iconBg: "bg-status-pending-bg",
        iconColor: "text-status-pending-text",
        title: "text-status-pending-text",
      }
    : {
        wrap: "bg-status-rejected-bg/40 border-status-rejected-text/30",
        iconBg: "bg-status-rejected-bg",
        iconColor: "text-status-rejected-text",
        title: "text-status-rejected-text",
      };

  const Icon = isMoreInfo ? AlertCircle : XCircle;

  // CTA state machine:
  //   more_info_requested → always submittable.
  //   rejected, cooldown active → disabled + countdown copy.
  //   rejected, cooldown elapsed → submittable.
  const canResubmit = isMoreInfo || (isRejected && !cooldownActive);

  return (
    <div
      role="region"
      aria-label={isMoreInfo ? t("moreInfo.aria") : t("rejected.aria")}
      className={cn(
        "flex flex-col gap-[1em] p-[1.25em] border rounded-[0.625em] shadow-xs",
        tones.wrap,
      )}
    >
      {/* Heading row */}
      <div className="flex items-start gap-[0.75em]">
        <span
          className={cn(
            "shrink-0 flex items-center justify-center w-[2.25em] h-[2.25em] rounded-full",
            tones.iconBg,
          )}
        >
          <Icon size="1.125em" strokeWidth={1.75} className={tones.iconColor} />
        </span>
        <div className="flex flex-col gap-[0.25em] min-w-0 flex-1">
          <span className={cn("text-[0.9375em] font-semibold leading-[1.3]", tones.title)}>
            {isMoreInfo ? t("moreInfo.title") : t("rejected.title")}
          </span>
          <span className="text-[0.8125em] text-text-secondary leading-[1.5]">
            {isMoreInfo ? t("moreInfo.body") : t("rejected.body")}
          </span>
        </div>
      </div>

      {/* Admin note callout */}
      {user.application_review_notes && (
        <div className="flex flex-col gap-[0.375em] bg-surface border border-border-light rounded-[0.5em] p-[0.875em]">
          <span className="text-[0.6875em] uppercase tracking-[0.08em] text-text-muted font-semibold">
            {isMoreInfo ? t("moreInfo.noteHeading") : t("rejected.noteHeading")}
          </span>
          <p className="text-[0.875em] text-text leading-[1.55] whitespace-pre-wrap">
            {user.application_review_notes}
          </p>
        </div>
      )}

      {/* Action row */}
      <div className="flex items-center justify-between gap-[0.75em] flex-wrap">
        {cooldownActive ? (
          <div className="flex items-center gap-[0.5em] text-[0.8125em] text-text-secondary">
            <Clock size="0.9375em" strokeWidth={1.75} className="text-text-muted" />
            <span>{t("rejected.cooldownCountdown", { days: remainingDays })}</span>
          </div>
        ) : (
          <span className="text-[0.8125em] text-text-secondary">
            {isMoreInfo ? t("moreInfo.actionHint") : t("rejected.actionHint")}
          </span>
        )}

        <AppButton
          variant="primary"
          size="md"
          onClick={() => resubmitMut.mutate()}
          disabled={!canResubmit || resubmitMut.isPending}
          isLoading={resubmitMut.isPending}
        >
          <span className="inline-flex items-center gap-[0.4em]">
            <ArrowUpCircle size="0.9375em" strokeWidth={1.75} />
            {t("submitCta")}
          </span>
        </AppButton>
      </div>
    </div>
  );
}
