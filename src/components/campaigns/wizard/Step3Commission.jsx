"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { CheckCircle2, Copy } from "lucide-react";
import { TextInput, DropdownInput } from "@/components/ui/FormInputs";
import Toggle from "@/components/ui/Toggle";
import AppButton from "@/components/ui/Buttons";
import StepSection from "./StepSection";
import { useToast } from "@/hooks/useToast";
import { testChargilyWebhook } from "@/lib/mock/campaigns";
import { cn } from "@/lib/utils";

const COMMISSION_TYPE_OPTIONS = (t) => [
  { value: "percentage", label: t("commissionTypePercentage") },
  { value: "flat",       label: t("commissionTypeFlat") },
];

const TRACKING_OPTIONS = (t) => [
  { value: 30, label: t("tracking30") },
  { value: 60, label: t("tracking60") },
  { value: 90, label: t("tracking90") },
];

const CAPTURE_SNIPPET = `const swClick = new URLSearchParams(window.location.search).get('sw_click');
if (swClick) localStorage.setItem('sw_click', swClick);`;

const CHECKOUT_SNIPPET = `await chargily.checkouts.create({
  items: [...],
  success_url: '...',
  failure_url: '...',
  webhook_endpoint: 'https://sellwell.dz/api/webhooks/chargily',
  metadata: { sw_click: user.sw_click },
});`;

export default function Step3Commission({ form, setForm, errors = {}, clearError }) {
  const t = useTranslations("Campaigns.wizard.step3");
  const { toast } = useToast();
  const [testLoading, setTestLoading] = useState(false);

  const patch = (key) => (val) => {
    clearError?.(key);
    setForm((f) => ({ ...f, [key]: val }));
  };

  const handleTestWebhook = async () => {
    setTestLoading(true);
    try {
      await testChargilyWebhook();
      setForm((f) => ({ ...f, webhook_tested: true }));
      toast.success(t("testWebhookSuccess"), { title: t("testWebhookSuccessTitle") });
    } catch {
      toast.error(t("testWebhookError"), { title: t("testWebhookErrorTitle") });
    } finally {
      setTestLoading(false);
    }
  };

  const copySnippet = (text, label) => {
    navigator.clipboard.writeText(text).then(() => {
      toast.success(t("snippetCopied", { label }));
    });
  };

  return (
    <div className="flex flex-col gap-[1.5em]">
      <StepSection title={t("sectionCommission")}>
        <DropdownInput
          label={t("commissionType")}
          options={COMMISSION_TYPE_OPTIONS(t)}
          value={form.commission_type}
          onChange={patch("commission_type")}
          required
        />
        <TextInput
          label={
            form.commission_type === "percentage"
              ? t("commissionValuePct")
              : t("commissionValueFlat")
          }
          placeholder={form.commission_type === "percentage" ? "10" : "5000"}
          value={form.commission_value}
          onChange={patch("commission_value")}
          type="number"
          required
          errorMessage={errors.commission_value}
          helperText={
            form.commission_type === "percentage"
              ? t("commissionPctHelper")
              : t("commissionFlatHelper")
          }
        />
      </StepSection>

      <StepSection title={t("sectionTracking")}>
        <DropdownInput
          label={t("trackingWindow")}
          options={TRACKING_OPTIONS(t)}
          value={form.tracking_window_days}
          onChange={patch("tracking_window_days")}
          required
          helperText={t("trackingWindowHelper")}
        />
      </StepSection>

      <StepSection title={t("sectionPartnerLinks")}>
        <div className="flex items-start justify-between gap-[1em]">
          <div className="flex flex-col gap-[0.25em]">
            <span className="text-[0.875em] font-medium text-text">
              {t("partnerLinksLabel")}
            </span>
            <span className="text-[0.8125em] text-text-muted leading-[1.5]">
              {t("partnerLinksHelper")}
            </span>
          </div>
          <Toggle
            checked={form.partner_links_enabled}
            onChange={(v) => {
              clearError?.("merchant_redirect_url");
              clearError?.("chargily_webhook_secret");
              setForm((f) => ({ ...f, partner_links_enabled: v, webhook_tested: false }));
            }}
            size="md"
          />
        </div>

        {form.partner_links_enabled && (
          <div className="flex flex-col gap-[1.25em] pt-[0.25em]">
            <TextInput
              label={t("merchantRedirectUrl")}
              placeholder="https://yourproduct.dz/pricing"
              value={form.merchant_redirect_url}
              onChange={patch("merchant_redirect_url")}
              type="url"
              required
              errorMessage={errors.merchant_redirect_url}
              helperText={t("merchantRedirectHelper")}
            />
            <TextInput
              label={t("webhookSecret")}
              placeholder={t("webhookSecretPlaceholder")}
              value={form.chargily_webhook_secret}
              onChange={patch("chargily_webhook_secret")}
              required
              errorMessage={errors.chargily_webhook_secret}
              helperText={t("webhookSecretHelper")}
            />

            <div className="flex flex-col gap-[0.75em]">
              <span className="text-[0.8125em] font-semibold text-text">
                {t("snippetsTitle")}
              </span>
              <CodeSnippet
                label={t("snippetCapture")}
                code={CAPTURE_SNIPPET}
                onCopy={() => copySnippet(CAPTURE_SNIPPET, t("snippetCapture"))}
                t={t}
              />
              <CodeSnippet
                label={t("snippetCheckout")}
                code={CHECKOUT_SNIPPET}
                onCopy={() => copySnippet(CHECKOUT_SNIPPET, t("snippetCheckout"))}
                t={t}
              />
            </div>

            <div className="flex items-center justify-between gap-[1em] p-[1em] rounded-[0.625em] border border-border-light bg-bg-alt">
              <div className="flex flex-col gap-[0.125em]">
                <span className="text-[0.875em] font-semibold text-text">
                  {t("testWebhookLabel")}
                </span>
                <span className="text-[0.8125em] text-text-muted">
                  {form.webhook_tested ? t("testWebhookPassed") : t("testWebhookHelper")}
                </span>
              </div>
              {form.webhook_tested ? (
                <span className="inline-flex items-center gap-[0.375em] text-trend-positive text-[0.8125em] font-semibold shrink-0">
                  <CheckCircle2 size="1em" strokeWidth={2} />
                  {t("testWebhookPassedLabel")}
                </span>
              ) : (
                <AppButton
                  variant="secondary"
                  size="sm"
                  onClick={handleTestWebhook}
                  isLoading={testLoading}
                  disabled={!form.merchant_redirect_url || !form.chargily_webhook_secret}
                >
                  {t("testWebhookCta")}
                </AppButton>
              )}
            </div>
          </div>
        )}
      </StepSection>
    </div>
  );
}

function CodeSnippet({ label, code, onCopy, t }) {
  return (
    <div className="flex flex-col gap-[0.375em]">
      <div className="flex items-center justify-between gap-[0.5em]">
        <span className="text-[0.75em] font-semibold text-text-secondary uppercase tracking-[0.04em]">
          {label}
        </span>
        <button
          type="button"
          onClick={onCopy}
          className="inline-flex items-center gap-[0.25em] text-[0.75em] font-semibold text-accent-text hover:text-accent transition-colors duration-150"
        >
          <Copy size="0.75em" strokeWidth={2} />
          {t("copy")}
        </button>
      </div>
      <pre className="bg-[#1A1A1A] text-[#E5E3DF] rounded-[0.5em] px-[1em] py-[0.875em] text-[0.75em] leading-[1.6] overflow-x-auto font-mono whitespace-pre">
        {code}
      </pre>
    </div>
  );
}
