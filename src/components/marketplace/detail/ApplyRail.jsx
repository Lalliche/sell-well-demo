"use client";

/**
 * ApplyRail — sticky right-rail card on the campaign detail page.
 *
 * Anatomy (top → bottom):
 *   1. Headline commission line ("10% commission" or "5,000 DA per sale")
 *   2. Pricing tiers (PricingTiersList — read-only)
 *   3. Inline meta: Tracking window · Partner Links availability
 *   4. Apply state machine:
 *        - Already applied (any status) → StatusBadge in place of the button
 *        - Not yet applied → Apply button (idle) → click expands a textarea
 *          inline → Submit → submitting state (button morphs to spinner) →
 *          success state (button morphs to a checkmark pill that sticks)
 *
 * Inline-expand pattern was chosen so the partner never leaves the page
 * (no modal lock, no slide-over). Smoothest of the three options researched.
 *
 * Sticky behavior: the parent (`<aside>` in the page composition) carries
 * `position: sticky top-[1.5em]`. If the rail is taller than the viewport
 * sticky stops engaging — that's the desired fallback.
 */

import { useEffect, useRef, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { motion, AnimatePresence } from "motion/react";
import { Check, Link2, Clock, Loader2 } from "lucide-react";
import AppButton from "@/components/ui/Buttons";
import { TextArea } from "@/components/ui/FormInputs";
import StatusBadge from "@/components/shared/data-display/StatusBadge";
import { useAuth } from "@/components/providers/AuthProvider";
import { useToast } from "@/hooks/useToast";
import { applyToCampaign } from "@/lib/mock/campaigns";
import { cn } from "@/lib/utils";
import PricingTiersList from "./PricingTiersList";

const PITCH_MAX = 1000;

/** Re-application cooldown after a rejection. Backend mirror:
 *  PlatformSetting.reapplication_cooldown_days (default 30). Hardcoded
 *  here as the mock — the real value will arrive from the platform
 *  settings endpoint when wiring lands. */
const REAPPLY_COOLDOWN_DAYS = 30;

function daysUntilCooldownEnds(reviewedAt) {
  if (!reviewedAt) return null;
  const end = new Date(reviewedAt).getTime() + REAPPLY_COOLDOWN_DAYS * 86_400_000;
  const remaining = Math.ceil((end - Date.now()) / 86_400_000);
  return remaining > 0 ? remaining : 0;
}

export default function ApplyRail({ campaign }) {
  const t = useTranslations("Marketplace.detail.apply");
  const tMeta = useTranslations("Marketplace.detail.meta");
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuth();
  const partnerId = user?.id;

  // The application status the page loaded with. Mutated on successful
  // submit so the badge replaces the button on the same render.
  const [appStatus, setAppStatus] = useState(
    campaign.partner_application_status ?? null,
  );

  const [expanded, setExpanded] = useState(false);
  const [pitch, setPitch] = useState("");
  const [pitchError, setPitchError] = useState(null);
  const [submitError, setSubmitError] = useState(null);
  const textareaRef = useRef(null);

  const mutation = useMutation({
    mutationFn: (vars) => applyToCampaign(vars),
    onSuccess: () => {
      // Invalidate the listing cache so the StatusBadge appears on the
      // grid card too when the user navigates back.
      queryClient.invalidateQueries({ queryKey: ["marketplace"] });
    },
  });

  // Focus the textarea after the slide-down animation finishes.
  useEffect(() => {
    if (!expanded) return;
    const id = setTimeout(() => textareaRef.current?.focus(), 240);
    return () => clearTimeout(id);
  }, [expanded]);

  const commissionLine =
    campaign.commission_type === "percentage"
      ? t("pctCommission", { value: campaign.commission_value })
      : t("flatCommission", { value: campaign.commission_value.toLocaleString("fr-DZ") });

  const handleSubmit = () => {
    const trimmed = pitch.trim();
    if (trimmed.length < 20) {
      setPitchError(t("errors.tooShort"));
      return;
    }
    setPitchError(null);
    setSubmitError(null);
    mutation.mutate(
      { campaign_id: campaign.id, partner_id: partnerId, pitch: trimmed },
      {
        onSuccess: (row) => {
          setAppStatus(row?.status ?? "pending");
          toast.success(t("toastSuccessBody"), { title: t("toastSuccessTitle") });
        },
        onError: (err) => {
          if (err?.code === "already_applied") {
            setAppStatus("pending");
            toast.info(t("toastAlreadyAppliedBody"), { title: t("toastAlreadyAppliedTitle") });
          } else {
            setSubmitError(t("errors.generic"));
            toast.error(t("errors.generic"));
          }
        },
      },
    );
  };

  return (
    <div className="flex flex-col gap-[1em] p-[1.25em] bg-surface border border-border-light rounded-[0.75em] shadow-sm">
      {/* Headline commission line */}
      <div className="flex flex-col gap-[0.125em]">
        <span className="text-[0.6875em] font-semibold tracking-[0.08em] uppercase text-text-muted">
          {t("headline")}
        </span>
        <span className="font-mono text-[1.5em] font-semibold text-accent leading-tight">
          {commissionLine}
        </span>
      </div>

      <div className="h-[1px] bg-border-light" />

      <PricingTiersList campaign={campaign} />

      <div className="h-[1px] bg-border-light" />

      {/* Inline meta */}
      <div className="flex flex-col gap-[0.5em]">
        <MetaRow
          icon={Clock}
          label={tMeta("trackingWindow")}
          value={tMeta("trackingWindowValue", {
            days: campaign.tracking_window_days,
          })}
        />
        {campaign.partner_links_enabled && (
          <MetaRow
            icon={Link2}
            label={tMeta("partnerLinks")}
            value={tMeta("partnerLinksAvailable")}
          />
        )}
      </div>

      {/* Apply state machine */}
      <ApplyAffordance
        status={appStatus}
        reviewedAt={campaign.partner_application_reviewed_at}
        expanded={expanded}
        setExpanded={setExpanded}
        pitch={pitch}
        setPitch={setPitch}
        pitchError={pitchError}
        setPitchError={setPitchError}
        submitError={submitError}
        setSubmitError={setSubmitError}
        textareaRef={textareaRef}
        isSubmitting={mutation.isPending}
        isSuccess={mutation.isSuccess}
        onSubmit={handleSubmit}
      />
    </div>
  );
}

function MetaRow({ icon: Icon, label, value }) {
  return (
    <div className="flex items-center gap-[0.5em] text-[0.8125em]">
      <Icon className="w-[1em] h-[1em] text-text-muted shrink-0" strokeWidth={1.5} />
      <span className="text-text-muted">{label}</span>
      <span className="text-text font-medium ms-auto">{value}</span>
    </div>
  );
}

function ApplyAffordance({
  status,
  reviewedAt,
  expanded,
  setExpanded,
  pitch,
  setPitch,
  pitchError,
  setPitchError,
  submitError,
  setSubmitError,
  textareaRef,
  isSubmitting,
  isSuccess,
  onSubmit,
}) {
  const t = useTranslations("Marketplace.detail.apply");
  const tApp = useTranslations("Applications.detail.actions");

  // Already applied — show the StatusBadge instead of a button.
  if (status) {
    const cooldownDays =
      status === "rejected" ? daysUntilCooldownEnds(reviewedAt) : null;
    const canReapply = status === "rejected" && cooldownDays === 0;
    return (
      <div className="flex flex-col gap-[0.5em]">
        <span className="text-[0.6875em] font-semibold tracking-[0.08em] uppercase text-text-muted">
          {t("statusHeadline")}
        </span>
        <div className="flex items-center justify-between gap-[0.75em]">
          <span className="text-[0.8125em] text-text-secondary">
            {t(`statusBody.${status}`)}
          </span>
          <StatusBadge status={status} />
        </div>
        {/* Re-application cooldown — derived from reviewed_at +
            PlatformSetting.reapplication_cooldown_days. Surfaced here so a
            partner who lands on a campaign they were rejected on knows
            exactly when they can try again. */}
        {status === "rejected" && typeof cooldownDays === "number" && (
          canReapply ? (
            <span className="inline-flex items-center gap-[0.3em] self-start h-[1.625em] px-[0.625em] rounded-full text-[0.6875em] font-semibold font-body bg-status-approved-bg text-status-approved-text whitespace-nowrap">
              {tApp("reapplyAvailable")}
            </span>
          ) : (
            <span className="inline-flex items-center gap-[0.3em] self-start h-[1.625em] px-[0.625em] rounded-full text-[0.6875em] font-semibold font-mono tabular-nums bg-bg-alt text-text-secondary whitespace-nowrap">
              <Clock className="w-[0.75em] h-[0.75em]" strokeWidth={1.75} />
              {tApp("reapplyCooldown", { days: cooldownDays })}
            </span>
          )
        )}
      </div>
    );
  }

  // Just-applied success state: button morphed into a checkmark pill.
  // Stays for the rest of the session — refresh will show StatusBadge via
  // the parent state once we land it on optimistic.
  if (isSuccess) {
    return (
      <div
        className="flex items-center justify-center gap-[0.5em] h-[2.5em] rounded-[0.5em] bg-status-approved-bg text-status-approved-text font-semibold text-[0.875em]"
        role="status"
        aria-live="polite"
      >
        <Check className="w-[1em] h-[1em]" strokeWidth={2} />
        <span>{t("success")}</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-[0.625em]">
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            key="textarea"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
            style={{ overflow: "hidden" }}
          >
            <div className="flex flex-col gap-[0.375em]">
              <TextArea
                ref={textareaRef}
                label={t("pitchLabel")}
                placeholder={t("pitchPlaceholder")}
                value={pitch}
                onChange={(v) => {
                  setPitch(v.slice(0, PITCH_MAX));
                  if (pitchError) setPitchError(null);
                }}
                rows={5}
                errorMessage={pitchError}
              />
              <div className="flex items-center justify-between">
                <span
                  className={cn(
                    "font-mono text-[0.6875em]",
                    pitch.length > PITCH_MAX - 50
                      ? "text-status-pending-text"
                      : "text-text-muted",
                  )}
                >
                  {pitch.length} / {PITCH_MAX}
                </span>
                {submitError && (
                  <span className="text-[0.75em] text-status-rejected-text">
                    {submitError}
                  </span>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AppButton
        variant="primary"
        size="md"
        className="w-full"
        disabled={isSubmitting}
        onClick={() => {
          if (!expanded) {
            setExpanded(true);
            return;
          }
          onSubmit();
        }}
      >
        <span className="inline-flex items-center justify-center gap-[0.5em]">
          {isSubmitting && (
            <Loader2 className="w-[1em] h-[1em] animate-spin" strokeWidth={2} />
          )}
          {isSubmitting
            ? t("submitting")
            : expanded
              ? t("submit")
              : t("apply")}
        </span>
      </AppButton>

      {expanded && !isSubmitting && (
        <button
          type="button"
          onClick={() => {
            setExpanded(false);
            setPitch("");
            setPitchError(null);
            setSubmitError(null);
          }}
          className="text-[0.75em] text-text-muted hover:text-text-secondary transition-colors duration-150 ease-out self-center"
        >
          {t("cancel")}
        </button>
      )}
    </div>
  );
}
