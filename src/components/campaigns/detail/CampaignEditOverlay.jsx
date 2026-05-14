"use client";

/**
 * CampaignEditOverlay — Edit a campaign in-place via the shared
 * DetailOverlay primitive. Two-pane: sectioned sidebar nav on the left,
 * editable form on the right, single Save button in the footer.
 *
 * Sections (mirror the wizard 1:1, minus the wizard's "Review" step):
 *   1. Overview      — product name, description, cover image,
 *                      category, product tags, target industries, requirements
 *   2. Pricing       — tier list editor (single or multi)
 *   3. Commission    — type, value, tracking window
 *   4. Sales Kit     — 4 named slots + "other" rows (mirrors wizard Step 4)
 *   5. Partner Links — toggle + redirect URL + webhook secret + snippets
 *                      + Test webhook (mirrors wizard Step 3 lower half)
 *
 * Save semantics:
 *   - Validates on submit only. Required fields: product_name,
 *     description, product_image, category, commission_value > 0,
 *     every pricing_tier.price > 0, and (when partner_links_enabled is
 *     true) merchant_redirect_url + chargily_webhook_secret are filled.
 *   - On invalid: inline errors + toast.warning per the form-validation
 *     hard rule (`Common.formErrors{Title,Body}`).
 *   - On valid: calls `updateCampaign(id, patch)`, invalidates
 *     ["campaign", slug] + ["campaigns"], fires toast.success, closes
 *     the overlay.
 *
 * `target_description` and `target_company_size` are intentionally NOT
 * here — the wizard doesn't expose them today. If/when they're added to
 * Step 1, they'll come back here automatically (the data shape persists).
 */

import { useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { FileText, DollarSign, Percent, FolderOpen, Link2 } from "lucide-react";
import DetailOverlay from "@/components/shared/overlays/DetailOverlay";
import AppButton from "@/components/ui/Buttons";
import Avatar from "@/components/shared/data-display/Avatar";
import { useToast } from "@/hooks/useToast";
import { updateCampaign } from "@/lib/mock/campaigns";
import EditOverviewSection from "./edit/EditOverviewSection";
import EditPricingSection from "./edit/EditPricingSection";
import EditCommissionSection from "./edit/EditCommissionSection";
import EditSalesKitSection from "./edit/EditSalesKitSection";
import EditPartnerLinksSection from "./edit/EditPartnerLinksSection";

/** Build the wizard-shaped `sales_kit` form chunk from the persisted
 *  CampaignDocument rows. Named slots resolve to either the file URL
 *  (file slot) or the URL string (demo_video_url slot); the `other`
 *  bucket carries one row per OTHER document. */
function buildSalesKit(documents = []) {
  const named = { pitch_deck: null, one_pager: null, pricing_sheet: null };
  let video = "";
  const other = [];
  for (const d of documents) {
    if (d.slot === "demo_video_url") video = d.url ?? "";
    else if (d.slot === "other") {
      other.push({ id: `seed-${d.id}`, file: d.file ?? null, label: d.label ?? "" });
    } else if (d.slot in named) {
      named[d.slot] = d.file ?? null;
    }
  }
  return { ...named, demo_video_url: video, other };
}

function buildInitial(campaign) {
  return {
    product_name: campaign.product_name ?? "",
    description: campaign.description ?? "",
    product_image: campaign.product_image ?? null,
    category: campaign.category ?? null,
    product_tags: campaign.product_tags ?? [],
    target_industries: campaign.target_industries ?? [],
    requirements: campaign.requirements ?? "",
    pricing_tiers: (campaign.pricing_tiers ?? []).map((t) => ({
      id: t.id,
      name: t.name ?? "",
      price: t.price,
      sort_order: t.sort_order ?? 0,
    })),
    commission_type: campaign.commission_type,
    commission_value: campaign.commission_value,
    tracking_window_days: campaign.tracking_window_days,
    partner_links_enabled: !!campaign.partner_links_enabled,
    merchant_redirect_url: campaign.merchant_redirect_url ?? "",
    chargily_webhook_secret: campaign.chargily_webhook_secret ?? "",
    // The campaign is already published — if Partner Links was on at
    // load time, its webhook was tested at create-time. Treat that as
    // pre-tested; user edits to the URL/secret flip this back to false.
    webhook_tested: !!campaign.partner_links_enabled,
    sales_kit: buildSalesKit(campaign.documents),
  };
}

function validate(form) {
  const errs = {};
  if (!form.product_name?.trim()) errs.product_name = "required";
  if (!form.description?.trim()) errs.description = "required";
  if (!form.product_image) errs.product_image = "required";
  if (!form.category) errs.category = "required";

  const cv = Number(form.commission_value);
  if (!Number.isFinite(cv) || cv <= 0) errs.commission_value = "required";

  (form.pricing_tiers ?? []).forEach((t, i) => {
    const p = Number(t.price);
    if (!Number.isFinite(p) || p <= 0) errs[`pricing_tiers.${i}.price`] = "required";
  });

  if (form.partner_links_enabled) {
    if (!form.merchant_redirect_url?.trim()) errs.merchant_redirect_url = "required";
    if (!form.chargily_webhook_secret?.trim()) errs.chargily_webhook_secret = "required";
  }

  return errs;
}

function patchFromForm(form) {
  return {
    product_name: form.product_name.trim(),
    description: form.description.trim(),
    product_image: form.product_image,
    category: form.category,
    product_tags: form.product_tags ?? [],
    target_industries: form.target_industries ?? [],
    requirements: form.requirements?.trim() || null,
    pricing_tiers: (form.pricing_tiers ?? []).map((t, i) => ({
      id: t.id > 0 ? t.id : undefined,
      name: t.name?.trim() || null,
      price: Number(t.price),
      sort_order: i,
    })),
    commission_type: form.commission_type,
    commission_value: Number(form.commission_value),
    tracking_window_days: Number(form.tracking_window_days),
    partner_links_enabled: !!form.partner_links_enabled,
    merchant_redirect_url: form.partner_links_enabled
      ? form.merchant_redirect_url?.trim() || null
      : null,
    chargily_webhook_secret: form.partner_links_enabled
      ? form.chargily_webhook_secret?.trim() || null
      : null,
    sales_kit: form.sales_kit,
  };
}

export default function CampaignEditOverlay({ open, onClose, campaign }) {
  const t = useTranslations("Campaigns.companyDetail.edit");
  const tCommon = useTranslations("Common");
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [form, setForm] = useState(() => buildInitial(campaign));
  const [errors, setErrors] = useState({});

  const patch = (key) => (val) => {
    setForm((f) => ({ ...f, [key]: val }));
    if (errors[key]) {
      setErrors((e) => {
        const next = { ...e };
        delete next[key];
        return next;
      });
    }
  };

  const mutation = useMutation({
    mutationFn: (payload) => updateCampaign(campaign.id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["campaign", campaign.slug] });
      queryClient.invalidateQueries({ queryKey: ["campaigns"] });
      toast.success(t("toastSuccessBody"), { title: t("toastSuccessTitle") });
      onClose?.();
    },
    onError: () => {
      toast.error(t("toastErrorBody"), { title: t("toastErrorTitle") });
    },
  });

  const handleSave = () => {
    const errs = validate(form);
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      toast.warning(tCommon("formErrorsBody"), {
        title: tCommon("formErrorsTitle"),
      });
      return;
    }
    mutation.mutate(patchFromForm(form));
  };

  const sections = useMemo(
    () => [
      {
        key: "overview",
        label: t("nav.overview"),
        icon: <FileText size="0.875em" strokeWidth={1.75} />,
        content: <EditOverviewSection form={form} patch={patch} errors={errors} />,
      },
      {
        key: "pricing",
        label: t("nav.pricing"),
        icon: <DollarSign size="0.875em" strokeWidth={1.75} />,
        content: <EditPricingSection form={form} patch={patch} errors={errors} />,
      },
      {
        key: "commission",
        label: t("nav.commission"),
        icon: <Percent size="0.875em" strokeWidth={1.75} />,
        content: <EditCommissionSection form={form} patch={patch} errors={errors} />,
      },
      {
        key: "salesKit",
        label: t("nav.salesKit"),
        icon: <FolderOpen size="0.875em" strokeWidth={1.75} />,
        content: <EditSalesKitSection form={form} patch={patch} />,
      },
      {
        key: "partnerLinks",
        label: t("nav.partnerLinks"),
        icon: <Link2 size="0.875em" strokeWidth={1.75} />,
        content: (
          <EditPartnerLinksSection
            form={form}
            patch={patch}
            errors={errors}
            campaignId={campaign.id}
          />
        ),
      },
    ],
    [form, errors, t, campaign.id],
  );

  return (
    <DetailOverlay
      open={open}
      onClose={onClose}
      title={campaign.product_name}
      subtitle={t("subtitle")}
      avatar={<Avatar name={campaign.product_name} size="md" />}
      sections={sections}
      defaultSection="overview"
      footer={
        <>
          <AppButton variant="ghost" onClick={onClose} disabled={mutation.isPending}>
            {t("cancel")}
          </AppButton>
          <AppButton
            variant="primary"
            onClick={handleSave}
            isLoading={mutation.isPending}
            disabled={mutation.isPending}
          >
            {t("save")}
          </AppButton>
        </>
      }
    />
  );
}
