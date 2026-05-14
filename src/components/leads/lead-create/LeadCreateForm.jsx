"use client";

/**
 * Renders the three form sections (Campaign · Client · Context) plus the
 * footer Cancel/Submit row for /leads/new. State + validation come in
 * via the form-controller object (`useLeadCreateForm` hook), so this
 * file is pure UI.
 */

import { Link as IntlLink } from "@/i18n/navigation";
import { ArrowLeft, Save } from "lucide-react";
import AppButton from "@/components/ui/Buttons";
import { TextInput, TextArea, DropdownInput, FileInput } from "@/components/ui/FormInputs";
import FormSection from "./FormSection";

export default function LeadCreateForm({ form, eligibleCampaigns, t }) {
  const campaignOptions = eligibleCampaigns.map((c) => ({
    value: c.id,
    label: c.company?.company_name
      ? `${c.product_name} — ${c.company.company_name}`
      : c.product_name,
  }));
  const tierOptions = form.tiers.map((tier) => ({
    value: tier.id,
    label: `${tier.name} · ${Number(tier.price).toLocaleString("fr-DZ")} DA`,
  }));

  return (
    <div className="lg:col-span-8 flex flex-col gap-[2em] bg-surface border border-border-light rounded-[0.625em] shadow-xs p-[2em]">
      <FormSection title={t("section.campaign")}>
        <DropdownInput
          label={t("campaign.label")}
          placeholder={t("campaign.placeholder")}
          options={campaignOptions}
          value={form.campaignId}
          onChange={form.handleCampaignChange}
          required
          errorMessage={form.errors.campaign}
          helperText={t("campaign.helper")}
        />
        {form.isMultiTier && (
          <DropdownInput
            label={t("tier.label")}
            placeholder={t("tier.placeholder")}
            options={tierOptions}
            value={form.tierId}
            onChange={(v) => {
              form.setTierId(v);
              form.clearError("tier");
            }}
            required
            errorMessage={form.errors.tier}
            helperText={t("tier.helper")}
          />
        )}
      </FormSection>

      <FormSection title={t("section.client")}>
        <ClientFields form={form} t={t} />
      </FormSection>

      <FormSection title={t("section.context")}>
        <TextArea
          label={t("firstNote.label")}
          placeholder={t("firstNote.placeholder")}
          value={form.firstNote}
          onChange={form.setFirstNote}
          rows={5}
          maxLength={2000}
          helperText={t("firstNote.helper")}
        />
      </FormSection>

      <FormSection title={t("section.attachments")}>
        <FileInput
          label={t("attachments.label")}
          accept=".pdf,.docx,.pptx,.jpg,.jpeg,.png,.zip"
          value={form.attachments}
          onChange={form.setAttachments}
          maxSizeMb={10}
          multi
          helperText={t("attachments.helper")}
        />
      </FormSection>

      <FormFooter form={form} t={t} />
    </div>
  );
}

function ClientFields({ form, t }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-[1em]">
      <TextInput
        label={t("client.fullNameLabel")}
        placeholder={t("client.fullNamePlaceholder")}
        value={form.clientName}
        onChange={(v) => {
          form.setClientName(v);
          form.clearError("clientName");
        }}
        required
        errorMessage={form.errors.clientName}
      />
      <TextInput
        label={t("client.companyLabel")}
        placeholder={t("client.companyPlaceholder")}
        value={form.clientCompany}
        onChange={form.setClientCompany}
      />
      <TextInput
        label={t("client.phoneLabel")}
        placeholder={t("client.phonePlaceholder")}
        value={form.clientPhone}
        onChange={(v) => {
          form.setClientPhone(v);
          form.clearError("clientPhone");
        }}
        required
        type="tel"
        errorMessage={form.errors.clientPhone}
      />
      <TextInput
        label={t("client.emailLabel")}
        placeholder={t("client.emailPlaceholder")}
        value={form.clientEmail}
        onChange={(v) => {
          form.setClientEmail(v);
          form.clearError("clientEmail");
        }}
        type="email"
        errorMessage={form.errors.clientEmail}
      />
    </div>
  );
}

function FormFooter({ form, t }) {
  return (
    <div className="flex items-center justify-between gap-[1em] pt-[1em] border-t border-border-light">
      <IntlLink href="/leads">
        <AppButton variant="ghost" size="md" disabled={form.isSubmitting}>
          <span className="inline-flex items-center gap-[0.375em]">
            <ArrowLeft className="w-[1em] h-[1em]" strokeWidth={1.75} />
            {t("cancel")}
          </span>
        </AppButton>
      </IntlLink>
      <AppButton variant="primary" size="md" onClick={form.handleSubmit} isLoading={form.isSubmitting}>
        <span className="inline-flex items-center gap-[0.5em]">
          <Save className="w-[0.875em] h-[0.875em]" strokeWidth={1.75} />
          {form.isSubmitting ? t("savingDraft") : t("saveDraft")}
        </span>
      </AppButton>
    </div>
  );
}
