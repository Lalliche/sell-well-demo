"use client";

/**
 * Form state + validation + submit handler for /leads/new.
 *
 * Owns the controlled form state, the field-level validation, and the
 * createLead mutation. Returns a flat object the form component spreads
 * into its inputs. Lives outside the component file so the JSX renderer
 * stays focused on layout.
 *
 * Behavior: createLead saves the row as `status='draft'` (per the
 * data-model-spec.md update — partners now have a private pre-submission
 * stage). The first-note field is optional — when provided, a LeadNote
 * row is appended to the new draft. The partner explicitly submits to
 * the company later from the LeadDetailOverlay footer.
 */

import { useEffect, useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { useToast } from "@/hooks/useToast";
import { createLead } from "@/lib/mock/leads";

function isValidEmail(s) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
}
function isValidPhone(s) {
  return s.replace(/\D/g, "").length >= 8;
}

export function useLeadCreateForm({ userId, eligibleCampaigns, preselectedSlug }) {
  const t = useTranslations("LeadForm");
  const tCommon = useTranslations("Common");
  const router = useRouter();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [campaignId, setCampaignId] = useState(null);
  const [tierId, setTierId] = useState(null);
  const [clientName, setClientName] = useState("");
  const [clientCompany, setClientCompany] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [firstNote, setFirstNote] = useState("");
  const [attachments, setAttachments] = useState([]); // File[] — optional
  const [errors, setErrors] = useState({});

  // Pre-select campaign by slug from the URL once eligible list loads.
  // setState wrapped in rAF per the project's setState-in-effect rule.
  useEffect(() => {
    if (!preselectedSlug || campaignId !== null) return;
    const id = window.requestAnimationFrame(() => {
      const match = eligibleCampaigns.find((c) => c.slug === preselectedSlug);
      if (match) setCampaignId(match.id);
    });
    return () => window.cancelAnimationFrame(id);
  }, [preselectedSlug, eligibleCampaigns, campaignId]);

  const selectedCampaign = useMemo(
    () => eligibleCampaigns.find((c) => c.id === campaignId) ?? null,
    [eligibleCampaigns, campaignId],
  );
  const tiers = selectedCampaign?.pricing_tiers ?? [];
  const isMultiTier = tiers.length > 1;

  // Auto-select the only tier on single-tier campaigns.
  useEffect(() => {
    if (!selectedCampaign || isMultiTier) return;
    if (tiers.length === 1 && tierId !== tiers[0].id) {
      const id = window.requestAnimationFrame(() => setTierId(tiers[0].id));
      return () => window.cancelAnimationFrame(id);
    }
  }, [selectedCampaign, isMultiTier, tiers, tierId]);

  const handleCampaignChange = (id) => {
    setCampaignId(id);
    setTierId(null);
    if (errors.campaign) setErrors((e) => ({ ...e, campaign: null }));
  };
  const clearError = (key) =>
    errors[key] && setErrors((e) => ({ ...e, [key]: null }));

  const mutation = useMutation({
    mutationFn: createLead,
    onSuccess: (row) => {
      queryClient.invalidateQueries({ queryKey: ["partner-leads"] });
      queryClient.invalidateQueries({ queryKey: ["partner-stats"] });
      toast.success(t("draftSavedBody"), { title: t("draftSavedTitle") });
      // Land the partner on /leads with the draft tab active so the new
      // row is visible and they can keep iterating before submitting.
      router.push(`/leads?tab=draft&new=${row.slug}`);
    },
    onError: () => toast.error("Something went wrong. Please try again."),
  });

  const validate = () => {
    const next = {};
    if (!campaignId) next.campaign = t("errors.campaignRequired");
    if (isMultiTier && !tierId) next.tier = t("errors.tierRequired");
    if (!clientName.trim()) next.clientName = t("errors.required");
    if (!clientPhone.trim()) next.clientPhone = t("errors.required");
    else if (!isValidPhone(clientPhone)) next.clientPhone = t("errors.phoneFormat");
    if (clientEmail.trim() && !isValidEmail(clientEmail))
      next.clientEmail = t("errors.emailFormat");
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) {
      toast.warning(tCommon("formErrorsBody"), { title: tCommon("formErrorsTitle") });
      return;
    }
    // Attachments → LeadDocument seed payload. Each File becomes a
    // file-kind row with an object URL (mock-only — backend will accept
    // multipart/form-data on the real createLead endpoint).
    const documents = (attachments ?? []).map((f) => ({
      kind: "file",
      file: typeof window !== "undefined" && f instanceof File
        ? URL.createObjectURL(f)
        : null,
      label: (f?.name ?? "Untitled").replace(/\.[^.]+$/, ""),
    }));
    mutation.mutate({
      campaign_id: campaignId,
      partner_id: userId,
      pricing_tier_id: tierId ?? tiers[0]?.id,
      client_full_name: clientName.trim(),
      client_company_name: clientCompany.trim() || null,
      client_phone: clientPhone.trim(),
      client_email: clientEmail.trim() || null,
      first_note: firstNote.trim() || null,
      documents: documents.length ? documents : undefined,
    });
  };

  return {
    // values
    campaignId, tierId, clientName, clientCompany, clientPhone, clientEmail, firstNote, attachments,
    // setters
    setTierId, setClientName, setClientCompany, setClientPhone, setClientEmail, setFirstNote, setAttachments,
    handleCampaignChange,
    clearError,
    // derived
    selectedCampaign,
    tiers,
    isMultiTier,
    errors,
    // submit
    handleSubmit,
    isSubmitting: mutation.isPending,
  };
}
