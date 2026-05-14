"use client";

/**
 * WizardShell — 5-step campaign creation wizard frame.
 *
 * Animation: Morphing Ring stepper (Framer Motion).
 *   Pending : muted outlined circle + step number
 *   Active  : spinning SVG arc on a accent ring (progress-loader feel)
 *   Done    : solid accent fill + motion.path checkmark draws on (pathLength 0→1)
 *   Connector: motion.div width spring 0→100% as steps complete
 *   Content : AnimatePresence mode="wait" — slides x:60→0 (forward) / x:-60→0
 *             (back) with opacity + scale spring so each step feels distinct
 *
 * Validation: validateForStep() runs on "Next". Errors passed as props to
 * the active step. toast.warning fires alongside inline field errors.
 */

import { useState, useCallback, useRef } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import {
  motion, AnimatePresence, useSpring, useTransform,
} from "motion/react";
import { useAuth } from "@/components/providers/AuthProvider";
import { useToast } from "@/hooks/useToast";
import { cn } from "@/lib/utils";
import AppButton from "@/components/ui/Buttons";
import PageHeader from "@/components/shared/layout/PageHeader";
import Step1ProductDetails from "./Step1ProductDetails";
import Step2PricingTiers from "./Step2PricingTiers";
import Step3Commission from "./Step3Commission";
import Step4SalesKit from "./Step4SalesKit";
import Step5Review from "./Step5Review";
import { saveCampaignDraft, publishCampaign } from "@/lib/mock/campaigns";

const TOTAL_STEPS = 5;

/* ── Form initial state ─────────────────────────────────────────────── */

export function buildInitialForm() {
  return {
    product_name: "",
    description: "",
    product_image: null,
    category: null,
    product_tags: [],
    target_industries: [],
    target_company_size: [],
    requirements: "",

    pricing_tiers: [{ id: "tier-0", name: "", price: "" }],

    commission_type: "percentage",
    commission_value: "",
    tracking_window_days: 30,
    partner_links_enabled: false,
    merchant_redirect_url: "",
    chargily_webhook_secret: "",
    webhook_tested: false,

    sales_kit: {
      pitch_deck: null,
      one_pager: null,
      pricing_sheet: null,
      demo_video_url: "",
      other: [],
    },
  };
}

/* ── Validators ─────────────────────────────────────────────────────── */

function validateStep1(form, t) {
  const errs = {};
  if (!form.product_name.trim())  errs.product_name  = t("validation.required");
  if (!form.description.trim())   errs.description   = t("validation.required");
  if (!form.product_image)        errs.product_image = t("validation.imageRequired");
  if (!form.category)             errs.category      = t("validation.required");
  return errs;
}

function validateStep2(form, t) {
  const errs = {};
  form.pricing_tiers.forEach((tier, i) => {
    if (!String(tier.price).trim())
      errs[`tier_price_${i}`] = t("validation.required");
  });
  return errs;
}

function validateStep3(form, t) {
  const errs = {};
  const cv = Number(form.commission_value);
  if (!String(form.commission_value).trim())
    errs.commission_value = t("validation.required");
  else if (form.commission_type === "percentage" && (cv < 1 || cv > 99))
    errs.commission_value = t("validation.commissionRange");
  if (form.partner_links_enabled) {
    if (!form.merchant_redirect_url.trim())
      errs.merchant_redirect_url = t("validation.required");
    if (!form.chargily_webhook_secret.trim())
      errs.chargily_webhook_secret = t("validation.required");
  }
  return errs;
}

function validateForStep(stepNumber, form, t) {
  if (stepNumber === 1) return validateStep1(form, t);
  if (stepNumber === 2) return validateStep2(form, t);
  if (stepNumber === 3) return validateStep3(form, t);
  return {};
}

/* ── Shell ──────────────────────────────────────────────────────────── */

export default function WizardShell() {
  const t = useTranslations("Campaigns.wizard");
  const tCommon = useTranslations("Common");
  const router = useRouter();
  const { user } = useAuth();
  const { toast } = useToast();

  const [step, setStep] = useState(1);
  // direction: 1 = forward (Next), -1 = backward (Back). Used for slide direction.
  const direction = useRef(1);
  const [form, setForm] = useState(buildInitialForm);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const isApproved = user?.application_status === "approved";
  const isEmailVerified = !!user?.is_email_verified;
  const canPublish =
    isApproved &&
    isEmailVerified &&
    (!form.partner_links_enabled || form.webhook_tested);

  const handleNext = useCallback(() => {
    const errs = validateForStep(step, form, t);
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      toast.warning(tCommon("formErrorsBody"), { title: tCommon("formErrorsTitle") });
      return;
    }
    setErrors({});
    direction.current = 1;
    setStep((s) => s + 1);
  }, [step, form, t, tCommon, toast]);

  const handleBack = useCallback(() => {
    setErrors({});
    direction.current = -1;
    setStep((s) => s - 1);
  }, []);

  const handleSaveDraft = useCallback(async () => {
    setSaving(true);
    try {
      await saveCampaignDraft({ ...form, companyId: user?.profile?.id ?? user?.id });
      toast.success(t("toast.draftSaved"), { title: t("toast.draftSavedTitle") });
      router.push("/campaigns");
    } catch {
      toast.error(t("toast.saveError"), { title: t("toast.saveErrorTitle") });
    } finally {
      setSaving(false);
    }
  }, [form, router, toast, t, user]);

  const handlePublish = useCallback(async () => {
    setSaving(true);
    try {
      await publishCampaign({ ...form, companyId: user?.profile?.id ?? user?.id });
      toast.success(t("toast.published"), { title: t("toast.publishedTitle") });
      router.push("/campaigns");
    } catch {
      toast.error(t("toast.publishError"), { title: t("toast.publishErrorTitle") });
    } finally {
      setSaving(false);
    }
  }, [form, router, toast, t, user]);

  const publishTooltip = !isApproved
    ? t("publishGate.pendingReview")
    : !isEmailVerified
    ? t("publishGate.emailUnverified")
    : form.partner_links_enabled && !form.webhook_tested
    ? t("publishGate.webhookRequired")
    : null;

  const setFormAndClearError = useCallback((updater) => setForm(updater), []);
  const clearError = useCallback((key) => {
    setErrors((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }, []);

  return (
    <div className="px-[2em] py-[2em] flex flex-col gap-[2em] max-w-[52em] mx-auto">
      <PageHeader title={t("title")} description={t("description")} />

      <Stepper step={step} total={TOTAL_STEPS} t={t} />

      {/* Step content — AnimatePresence slides old out, new in */}
      <div className="bg-surface border border-border-light rounded-[0.75em] shadow-xs p-[2em] overflow-hidden">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={step}
            custom={direction.current}
            variants={contentVariants}
            initial="enter"
            animate="center"
            exit="exit"
          >
            {step === 1 && (
              <Step1ProductDetails form={form} setForm={setFormAndClearError}
                errors={errors} clearError={clearError} />
            )}
            {step === 2 && (
              <Step2PricingTiers form={form} setForm={setFormAndClearError}
                errors={errors} clearError={clearError} />
            )}
            {step === 3 && (
              <Step3Commission form={form} setForm={setFormAndClearError}
                errors={errors} clearError={clearError} />
            )}
            {step === 4 && <Step4SalesKit form={form} setForm={setFormAndClearError} />}
            {step === 5 && <Step5Review form={form} />}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navigation bar */}
      <div className="flex items-center justify-between gap-[1em]">
        <div className="flex items-center gap-[0.75em]">
          {step > 1 && (
            <AppButton variant="ghost" size="md" onClick={handleBack}>
              {t("nav.back")}
            </AppButton>
          )}
          <AppButton
            variant="secondary"
            size="md"
            onClick={handleSaveDraft}
            isLoading={saving}
            disabled={saving}
          >
            {t("nav.saveDraft")}
          </AppButton>
        </div>

        {step < TOTAL_STEPS ? (
          <AppButton variant="primary" size="md" onClick={handleNext}>
            {t("nav.next")}
          </AppButton>
        ) : (
          <span title={publishTooltip ?? undefined}>
            <AppButton
              variant="primary"
              size="md"
              onClick={handlePublish}
              isLoading={saving}
              disabled={!canPublish || saving}
            >
              {t("nav.publish")}
            </AppButton>
          </span>
        )}
      </div>
    </div>
  );
}

/* ── Content slide variants ─────────────────────────────────────────── */

const SPRING = { type: "spring", stiffness: 280, damping: 30 };

const contentVariants = {
  enter:  (dir) => ({ x: dir > 0 ? 60 : -60, opacity: 0, scale: 0.97 }),
  center: { x: 0, opacity: 1, scale: 1, transition: SPRING },
  exit:   (dir) => ({
    x: dir > 0 ? -60 : 60,
    opacity: 0,
    scale: 0.97,
    transition: { duration: 0.18, ease: "easeIn" },
  }),
};

/* ── Animated Stepper ───────────────────────────────────────────────── */

function Stepper({ step, total, t }) {
  const steps = Array.from({ length: total }, (_, i) => i + 1);
  return (
    <div className="flex items-center">
      {steps.map((n, idx) => (
        <StepperItem
          key={n}
          n={n}
          label={t(`steps.${n}`)}
          state={n < step ? "done" : n === step ? "active" : "pending"}
          isLast={idx === steps.length - 1}
          prevDone={n <= step}
        />
      ))}
    </div>
  );
}

/* ── Stepper item ───────────────────────────────────────────────────── */

const SIZE = 36; // px — SVG canvas
const RADIUS = 14;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

function StepperItem({ n, label, state, isLast, prevDone }) {
  const isDone    = state === "done";
  const isActive  = state === "active";
  const isPending = state === "pending";

  // Spring-driven connector fill (0 = empty, 1 = full).
  const fillProgress = useSpring(prevDone ? 1 : 0, {
    stiffness: 120, damping: 20,
  });
  const connectorWidth = useTransform(fillProgress, [0, 1], ["0%", "100%"]);

  return (
    <div className="flex items-center flex-1 min-w-0">
      <div className="flex flex-col items-center gap-[0.375em] shrink-0">

        {/* Ring dot */}
        <div className="relative" style={{ width: SIZE, height: SIZE }}>
          <svg
            width={SIZE}
            height={SIZE}
            viewBox={`0 0 ${SIZE} ${SIZE}`}
            style={{ overflow: "visible" }}
          >
            {/* Background circle — always present */}
            <circle
              cx={SIZE / 2}
              cy={SIZE / 2}
              r={RADIUS}
              fill="none"
              stroke={isPending ? "var(--color-border-light)" : "var(--color-accent)"}
              strokeWidth={isPending ? 1.5 : 2}
              style={{
                transition: "stroke 0.3s ease",
              }}
            />

            {/* Done: solid accent fill */}
            {isDone && (
              <motion.circle
                cx={SIZE / 2}
                cy={SIZE / 2}
                r={RADIUS}
                fill="var(--color-accent)"
                initial={{ scale: 0.4, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 340, damping: 24 }}
              />
            )}

            {/* Active: spinning arc */}
            {isActive && (
              <motion.circle
                cx={SIZE / 2}
                cy={SIZE / 2}
                r={RADIUS}
                fill="none"
                stroke="var(--color-accent)"
                strokeWidth={2.5}
                strokeDasharray={CIRCUMFERENCE}
                strokeDashoffset={CIRCUMFERENCE * 0.25}
                strokeLinecap="round"
                style={{ rotate: -90 + "deg" }}
                animate={{ rotate: ["-90deg", "270deg"] }}
                transition={{
                  duration: 2.4,
                  repeat: Infinity,
                  ease: "linear",
                }}
              />
            )}

            {/* Active: faint accent fill ring */}
            {isActive && (
              <circle
                cx={SIZE / 2}
                cy={SIZE / 2}
                r={RADIUS - 1}
                fill="var(--color-accent)"
                fillOpacity={0.08}
              />
            )}

            {/* Done: checkmark draws on */}
            {isDone && (
              <motion.path
                d="M10 18 L15.5 23.5 L26 12"
                fill="none"
                stroke="white"
                strokeWidth={2.25}
                strokeLinecap="round"
                strokeLinejoin="round"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={{ duration: 0.35, delay: 0.1, ease: "easeOut" }}
              />
            )}

            {/* Pending / Active: step number */}
            {!isDone && (
              <text
                x={SIZE / 2}
                y={SIZE / 2}
                dominantBaseline="central"
                textAnchor="middle"
                fontSize={12}
                fontWeight={600}
                fontFamily="var(--font-body)"
                fill={isActive ? "var(--color-accent)" : "var(--color-text-muted)"}
                style={{ transition: "fill 0.25s ease" }}
              >
                {n}
              </text>
            )}
          </svg>

          {/* Active: glowing halo ring */}
          {isActive && (
            <motion.div
              className="absolute inset-0 rounded-full"
              style={{
                boxShadow: "0 0 0 3px var(--accent-border)",
              }}
              animate={{
                boxShadow: [
                  "0 0 0 3px rgba(59,110,204,0.15)",
                  "0 0 0 5px rgba(59,110,204,0.08)",
                  "0 0 0 3px rgba(59,110,204,0.15)",
                ],
              }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            />
          )}
        </div>

        {/* Label */}
        <motion.span
          className="text-[0.6875em] font-medium whitespace-nowrap"
          animate={{
            color: isDone
              ? "var(--color-text-secondary)"
              : isActive
              ? "var(--color-accent)"
              : "var(--color-text-muted)",
          }}
          transition={{ duration: 0.25 }}
        >
          {label}
        </motion.span>
      </div>

      {/* Connector — spring fills left-to-right when step completes */}
      {!isLast && (
        <div className="relative flex-1 h-px mx-[0.5em] mb-[1.5em] bg-border-light overflow-hidden">
          <motion.div
            className="absolute inset-y-0 left-0 bg-accent/40"
            style={{ width: connectorWidth }}
          />
        </div>
      )}
    </div>
  );
}
