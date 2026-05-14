"use client";

/**
 * EditPartnerLinksSection — Partner Links editor inside the
 * CampaignEditOverlay. Mirrors the lower half of Step 3 of the wizard:
 *
 *   - partner_links_enabled toggle
 *   - merchant_redirect_url (required when toggle on)
 *   - chargily_webhook_secret (required when toggle on)
 *   - Two copyable integration code snippets (capture + checkout)
 *   - "Test webhook" button → marks webhook_tested=true on success
 *
 * The form `webhook_tested` flag flips back to false whenever the user
 * toggles Partner Links off, or edits either of the two required
 * settings — same behaviour as the wizard, so a stale Test result can't
 * pass the gate after the merchant changes their secret.
 */

import { useState } from "react";
import { useTranslations } from "next-intl";
import { CheckCircle2, Copy } from "lucide-react";
import { TextInput } from "@/components/ui/FormInputs";
import Toggle from "@/components/ui/Toggle";
import AppButton from "@/components/ui/Buttons";
import { useToast } from "@/hooks/useToast";
import { testChargilyWebhook } from "@/lib/mock/campaigns";

const CAPTURE_SNIPPET = `const swClick = new URLSearchParams(window.location.search).get('sw_click');
if (swClick) localStorage.setItem('sw_click', swClick);`;

const CHECKOUT_SNIPPET = `await chargily.checkouts.create({
  items: [...],
  success_url: '...',
  failure_url: '...',
  webhook_endpoint: 'https://sellwell.dz/api/webhooks/chargily',
  metadata: { sw_click: user.sw_click },
});`;

export default function EditPartnerLinksSection({ form, patch, errors, campaignId }) {
  const t = useTranslations("Campaigns.companyDetail.edit.partnerLinks");
  const { toast } = useToast();
  const [testLoading, setTestLoading] = useState(false);

  const enabled = !!form.partner_links_enabled;

  // Toggling off OR editing the redirect URL / secret invalidates the
  // test pass — same UX rule as the wizard.
  const onToggle = (v) => {
    patch("partner_links_enabled")(v);
    patch("webhook_tested")(false);
  };
  const onUrlChange = (v) => {
    patch("merchant_redirect_url")(v);
    if (form.webhook_tested) patch("webhook_tested")(false);
  };
  const onSecretChange = (v) => {
    patch("chargily_webhook_secret")(v);
    if (form.webhook_tested) patch("webhook_tested")(false);
  };

  const handleTest = async () => {
    setTestLoading(true);
    try {
      await testChargilyWebhook(campaignId);
      patch("webhook_tested")(true);
      toast.success(t("testSuccessBody"), { title: t("testSuccessTitle") });
    } catch {
      toast.error(t("testErrorBody"), { title: t("testErrorTitle") });
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
    <div className="flex flex-col gap-[1.25em]">
      {/* Toggle row */}
      <div className="flex items-start justify-between gap-[1em]">
        <div className="flex flex-col gap-[0.25em]">
          <span className="text-[0.875em] font-medium text-text">{t("toggleLabel")}</span>
          <span className="text-[0.8125em] text-text-muted leading-[1.5]">
            {t("toggleHelper")}
          </span>
        </div>
        <Toggle checked={enabled} onChange={onToggle} size="md" />
      </div>

      {enabled && (
        <div className="flex flex-col gap-[1.25em] pt-[0.25em]">
          <TextInput
            label={t("redirectUrlLabel")}
            placeholder="https://yourproduct.dz/pricing"
            value={form.merchant_redirect_url ?? ""}
            onChange={onUrlChange}
            type="url"
            required
            errorMessage={errors.merchant_redirect_url}
            helperText={t("redirectUrlHelper")}
          />
          <TextInput
            label={t("secretLabel")}
            placeholder={t("secretPlaceholder")}
            value={form.chargily_webhook_secret ?? ""}
            onChange={onSecretChange}
            required
            errorMessage={errors.chargily_webhook_secret}
            helperText={t("secretHelper")}
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

          {/* Test webhook row */}
          <div className="flex items-center justify-between gap-[1em] p-[1em] rounded-[0.625em] border border-border-light bg-bg-alt">
            <div className="flex flex-col gap-[0.125em]">
              <span className="text-[0.875em] font-semibold text-text">
                {t("testLabel")}
              </span>
              <span className="text-[0.8125em] text-text-muted">
                {form.webhook_tested ? t("testPassedHelper") : t("testHelper")}
              </span>
            </div>
            {form.webhook_tested ? (
              <span className="inline-flex items-center gap-[0.375em] text-trend-positive text-[0.8125em] font-semibold shrink-0">
                <CheckCircle2 className="w-[1em] h-[1em]" strokeWidth={2} />
                {t("testPassedLabel")}
              </span>
            ) : (
              <AppButton
                variant="secondary"
                size="sm"
                onClick={handleTest}
                isLoading={testLoading}
                disabled={
                  !form.merchant_redirect_url || !form.chargily_webhook_secret
                }
              >
                {t("testCta")}
              </AppButton>
            )}
          </div>
        </div>
      )}
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
          className="inline-flex items-center gap-[0.25em] text-[0.75em] font-semibold text-accent-text hover:text-accent transition-colors duration-150 ease-out"
        >
          <Copy className="w-[0.75em] h-[0.75em]" strokeWidth={2} />
          {t("copy")}
        </button>
      </div>
      <pre className="bg-[#1A1A1A] text-[#E5E3DF] rounded-[0.5em] px-[1em] py-[0.875em] text-[0.75em] leading-[1.6] overflow-x-auto font-mono whitespace-pre">
        {code}
      </pre>
    </div>
  );
}
