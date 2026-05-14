"use client";

/**
 * CompanyProfileForm — full-page edit form for CompanyProfile.
 *
 * Rendered on the Profile tab of /settings for company users. Mirrors the
 * fields collected during signup (auth/CompanyProfileClient.jsx).
 *
 * Fields:
 *   company_name : required, ≥ 2 chars
 *   industry     : required (single-select from categories list)
 *   website      : optional, must look like a URL when present
 *   description  : required, ≥ 40 chars (matches the partner bio rule —
 *                  prevents marketing-template descriptions)
 *   logo         : existing logo shown inline; FileInput replaces.
 *
 * Save semantics are the same as PartnerProfileForm:
 *   - only changed fields go in the PATCH
 *   - failed validation fires inline red + warning toast per the form rule
 *   - success invalidates the profile query + fires a success toast.
 */

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslations, useLocale } from "next-intl";

import AppButton from "@/components/ui/Buttons";
import {
  TextInput,
  TextArea,
  DropdownInput,
  FileInput,
} from "@/components/ui/FormInputs";
import { useToast } from "@/hooks/useToast";
import { fetchCategories } from "@/lib/mock/campaigns";
import { updateCompanyProfile } from "@/lib/mock/profile";

const URL_RE = /^https?:\/\/[^\s]+$/i;

export default function CompanyProfileForm({ user, profile, onSaved }) {
  const t = useTranslations("Settings.profile.company");
  const tCommon = useTranslations("Common");
  const locale = useLocale();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [companyName, setCompanyName] = useState(profile.company_name ?? "");
  const [industry,    setIndustry  ] = useState(profile.industry ?? null);
  const [website,     setWebsite   ] = useState(profile.website ?? "");
  const [description, setDescription] = useState(profile.description ?? "");
  const [newLogo,     setNewLogo   ] = useState(null); // File | null
  const [errors,      setErrors    ] = useState({});

  const { data: categories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: fetchCategories,
  });
  const industryOptions = useMemo(
    () => categories.map((c) => ({
      value: c.id,
      label: locale === "fr" ? c.name_fr : c.name_en,
    })),
    [categories, locale],
  );

  const validate = () => {
    const next = {};
    if (companyName.trim().length < 2)            next.companyName = t("errors.companyName");
    if (typeof industry !== "number")             next.industry    = t("errors.industry");
    if (description.trim().length < 40)           next.description = t("errors.description");
    if (website && !URL_RE.test(website.trim())) next.website     = t("errors.website");
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const saveMut = useMutation({
    mutationFn: (patch) => updateCompanyProfile(user.id, patch),
    onSuccess: (updated) => {
      if (!updated) {
        toast.error(t("toast.errorBody"), { title: t("toast.errorTitle") });
        return;
      }
      queryClient.invalidateQueries({ queryKey: ["currentUserProfile", user.id] });
      toast.success(t("toast.successBody"), { title: t("toast.successTitle") });
      onSaved?.(updated);
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) {
      toast.warning(tCommon("formErrorsBody"), {
        title: tCommon("formErrorsTitle"),
      });
      return;
    }
    const patch = {};
    if (companyName !== profile.company_name) patch.company_name = companyName.trim();
    if (industry    !== profile.industry)     patch.industry     = industry;
    if ((website || "") !== (profile.website || "")) patch.website = website.trim() || null;
    if (description !== profile.description)  patch.description  = description.trim();
    if (newLogo instanceof File)              patch.logo         = URL.createObjectURL(newLogo);
    saveMut.mutate(patch);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-[1.5em]  rounded-[0.625em]  p-[1.5em]"
    >
      <header className="flex flex-col gap-[0.25em]">
        <h2 className="font-heading text-[1.125em] font-semibold text-text">
          {t("heading")}
        </h2>
        <p className="text-[0.8125em] text-text-secondary leading-[1.5]">
          {t("subheading")}
        </p>
      </header>

      <TextInput
        label={t("companyNameLabel")}
        value={companyName}
        onChange={setCompanyName}
        required
        errorMessage={errors.companyName}
      />

      <DropdownInput
        label={t("industryLabel")}
        value={industry}
        onChange={setIndustry}
        options={industryOptions}
        placeholder={t("industryPlaceholder")}
        required
        errorMessage={errors.industry}
      />

      <TextInput
        type="url"
        label={t("websiteLabel")}
        value={website}
        onChange={setWebsite}
        placeholder="https://example.com"
        helperText={t("websiteHelper")}
        errorMessage={errors.website}
      />

      <TextArea
        label={t("descriptionLabel")}
        value={description}
        onChange={setDescription}
        rows={5}
        required
        errorMessage={errors.description}
        helperText={t("descriptionHelper")}
      />

      <div className="flex flex-col gap-[0.5em]">
        <span className="text-[0.875em] font-medium text-text">
          {t("logoLabel")}
        </span>
        {profile.logo && !newLogo && (
          <div className="flex items-center gap-[0.75em]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={profile.logo}
              alt={companyName}
              className="w-[3.5em] h-[3.5em] rounded-[0.5em] object-cover border border-border-light bg-bg"
            />
            <span className="text-[0.8125em] text-text-muted">
              {t("logoCurrent")}
            </span>
          </div>
        )}
        <FileInput
          label={null}
          value={newLogo}
          onChange={setNewLogo}
          accept="image/png,image/jpeg,image/svg+xml"
          maxSizeMb={5}
          helperText={t("logoHelper")}
          variant="image"
        />
      </div>

      <div className="flex items-center justify-end pt-[0.5em]">
        <AppButton
          type="submit"
          variant="primary"
          size="md"
          isLoading={saveMut.isPending}
        >
          {t("saveCta")}
        </AppButton>
      </div>
    </form>
  );
}
