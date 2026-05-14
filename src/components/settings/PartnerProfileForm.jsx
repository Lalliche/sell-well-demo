"use client";

/**
 * PartnerProfileForm — full-page edit form for SalesPartnerProfile.
 *
 * Rendered on the Profile tab of /settings for sales_partner users. Mirrors
 * the fields collected during signup (auth/PartnerProfileClient.jsx) plus
 * the ability to view + replace existing files.
 *
 * Files:
 *   - profile_photo : existing photo shown inline; FileInput replaces.
 *   - cv_file       : existing CV rendered through the shared DocumentCard
 *                     (preview + download via DocumentPreviewModal) per
 *                     CLAUDE.md §2; FileInput replaces.
 *
 * Save semantics:
 *   - On submit we call `updatePartnerProfile(userId, patch)` with only the
 *     fields that actually changed (so the patch is small + server can
 *     diff cheaply later).
 *   - For file replacements, V1 mock stores the URL string the FileInput
 *     hands back (createObjectURL or the original placeholder). Backend
 *     swap will upload to S3 and store the returned URL.
 *   - Failed validation fires the inline red errors AND a warning toast
 *     keyed by Common.formErrors{Title,Body} per the project's form rule.
 *
 * Validation rules (mirroring PartnerProfileClient at signup):
 *   first_name + last_name  : required, ≥ 2 chars
 *   bio                     : required, ≥ 40 chars
 *   linkedin_url            : required, must contain "linkedin.com"
 *   categories              : required, ≥ 1
 *   skill_tags              : required, ≥ 1
 *   photo + cv              : files are optional on edit (already on file),
 *                             but if a new value is supplied it must satisfy
 *                             the size/type constraints (the FileInput
 *                             already enforces those visually).
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
import DocumentCard from "@/components/shared/data-display/document/DocumentCard";
import DocumentPreviewModal from "@/components/shared/data-display/document/DocumentPreviewModal";
import { useToast } from "@/hooks/useToast";
import { fileNameFromUrl } from "@/lib/format/file";
import {
  fetchCategories,
  fetchSkillTags,
} from "@/lib/mock/campaigns";
import { updatePartnerProfile } from "@/lib/mock/profile";

export default function PartnerProfileForm({ user, profile, onSaved }) {
  const t = useTranslations("Settings.profile.partner");
  const tCommon = useTranslations("Common");
  const locale = useLocale();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // ── Form state — initialized from profile ─────────────────────────────
  const [firstName, setFirstName] = useState(profile.first_name ?? "");
  const [lastName,  setLastName ] = useState(profile.last_name ?? "");
  const [phone,     setPhone    ] = useState(profile.phone ?? "");
  const [bio,       setBio      ] = useState(profile.bio ?? "");
  const [linkedin,  setLinkedin ] = useState(profile.linkedin_url ?? "");
  const [categoryIds, setCategoryIds] = useState(profile.categories ?? []);
  const [skillIds,  setSkillIds ] = useState(profile.skill_tags ?? []);
  const [newPhoto,  setNewPhoto ] = useState(null); // File | null
  const [newCv,     setNewCv    ] = useState(null); // File | null
  const [errors,    setErrors   ] = useState({});
  const [previewDoc, setPreviewDoc] = useState(null);

  // ── Option lists ──────────────────────────────────────────────────────
  const { data: categories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: fetchCategories,
  });
  const { data: skillTags = [] } = useQuery({
    queryKey: ["skill-tags"],
    queryFn: fetchSkillTags,
  });
  const categoryOptions = useMemo(
    () => categories.map((c) => ({
      value: c.id,
      label: locale === "fr" ? c.name_fr : c.name_en,
    })),
    [categories, locale],
  );
  const skillOptions = useMemo(
    () => skillTags.map((s) => ({
      value: s.id,
      label: locale === "fr" ? s.name_fr : s.name_en,
    })),
    [skillTags, locale],
  );

  // ── Existing-CV display ───────────────────────────────────────────────
  const cvDoc = profile.cv_file
    ? {
        kind: "file",
        fileUrl: profile.cv_file,
        title: t("cvCurrentTitle", { name: `${firstName} ${lastName}`.trim() }),
        subtitle: fileNameFromUrl(profile.cv_file),
      }
    : null;

  // ── Validation ────────────────────────────────────────────────────────
  const validate = () => {
    const next = {};
    if (firstName.trim().length < 2) next.firstName = t("errors.firstName");
    if (lastName.trim().length  < 2) next.lastName  = t("errors.lastName");
    if (bio.trim().length      < 40) next.bio       = t("errors.bio");
    if (!/linkedin\.com/i.test(linkedin)) next.linkedin = t("errors.linkedin");
    if (!Array.isArray(categoryIds) || categoryIds.length === 0) next.categories = t("errors.categories");
    if (!Array.isArray(skillIds)    || skillIds.length === 0)    next.skills     = t("errors.skills");
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  // ── Submit ────────────────────────────────────────────────────────────
  const saveMut = useMutation({
    mutationFn: (patch) => updatePartnerProfile(user.id, patch),
    onSuccess: (updated) => {
      if (!updated) {
        toast.error(t("toast.errorBody"), { title: t("toast.errorTitle") });
        return;
      }
      // Invalidate any profile-tied queries (current + future).
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
    // Diff against current profile so the patch only contains real changes.
    const patch = {};
    if (firstName !== profile.first_name)        patch.first_name   = firstName.trim();
    if (lastName  !== profile.last_name)         patch.last_name    = lastName.trim();
    if ((phone || null) !== (profile.phone || null)) patch.phone   = phone.trim() || null;
    if (bio       !== profile.bio)               patch.bio          = bio.trim();
    if (linkedin  !== profile.linkedin_url)      patch.linkedin_url = linkedin.trim();
    if (!sameIdArray(categoryIds, profile.categories))  patch.categories = categoryIds;
    if (!sameIdArray(skillIds,    profile.skill_tags))  patch.skill_tags = skillIds;
    if (newPhoto instanceof File)                patch.profile_photo = URL.createObjectURL(newPhoto);
    if (newCv    instanceof File)                patch.cv_file       = URL.createObjectURL(newCv);
    saveMut.mutate(patch);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-[1.5em] rounded-[0.625em]  p-[1.5em]"
    >
      <header className="flex flex-col gap-[0.25em]">
        <h2 className="font-heading text-[1.125em] font-semibold text-text">
          {t("heading")}
        </h2>
        <p className="text-[0.8125em] text-text-secondary leading-[1.5]">
          {t("subheading")}
        </p>
      </header>

      {/* Identity row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-[1em]">
        <TextInput
          label={t("firstNameLabel")}
          value={firstName}
          onChange={setFirstName}
          required
          errorMessage={errors.firstName}
        />
        <TextInput
          label={t("lastNameLabel")}
          value={lastName}
          onChange={setLastName}
          required
          errorMessage={errors.lastName}
        />
      </div>
      <TextInput
        type="tel"
        label={t("phoneLabel")}
        value={phone}
        onChange={setPhone}
        helperText={t("phoneHelper")}
      />

      {/* Bio + LinkedIn */}
      <TextArea
        label={t("bioLabel")}
        value={bio}
        onChange={setBio}
        rows={5}
        required
        errorMessage={errors.bio}
        helperText={t("bioHelper")}
      />
      <TextInput
        type="url"
        label={t("linkedinLabel")}
        value={linkedin}
        onChange={setLinkedin}
        placeholder="https://linkedin.com/in/…"
        required
        errorMessage={errors.linkedin}
      />

      {/* Categories + Skills */}
      <DropdownInput
        label={t("categoriesLabel")}
        options={categoryOptions}
        value={categoryIds}
        onChange={setCategoryIds}
        multi
        placeholder={t("categoriesPlaceholder")}
        required
        errorMessage={errors.categories}
      />
      <DropdownInput
        label={t("skillsLabel")}
        options={skillOptions}
        value={skillIds}
        onChange={setSkillIds}
        multi
        placeholder={t("skillsPlaceholder")}
        required
        errorMessage={errors.skills}
      />

      {/* Photo */}
      <div className="flex flex-col gap-[0.5em]">
        <span className="text-[0.875em] font-medium text-text">
          {t("photoLabel")}
        </span>
        {profile.profile_photo && !newPhoto && (
          <div className="flex items-center gap-[0.75em]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={profile.profile_photo}
              alt={`${firstName} ${lastName}`}
              className="w-[3.5em] h-[3.5em] rounded-[0.5em] object-cover border border-border-light"
            />
            <span className="text-[0.8125em] text-text-muted">
              {t("photoCurrent")}
            </span>
          </div>
        )}
        <FileInput
          label={null}
          value={newPhoto}
          onChange={setNewPhoto}
          accept="image/png,image/jpeg"
          maxSizeMb={5}
          helperText={t("photoHelper")}
          variant="image"
        />
      </div>

      {/* CV — existing rendered via DocumentCard, replaceable via FileInput */}
      <div className="flex flex-col gap-[0.5em]">
        <span className="text-[0.875em] font-medium text-text">
          {t("cvLabel")}
        </span>
        {cvDoc && (
          <DocumentCard
            document={cvDoc}
            variant="row"
            onPreview={setPreviewDoc}
            labels={{
              preview:      t("cvPreview"),
              download:     t("cvDownload"),
              openInNewTab: t("cvOpenInNewTab"),
            }}
            className="bg-surface border border-border-light"
          />
        )}
        <FileInput
          label={null}
          value={newCv}
          onChange={setNewCv}
          accept=".pdf,.docx"
          maxSizeMb={10}
          helperText={t("cvHelper")}
        />
      </div>

      {/* Save */}
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

      <DocumentPreviewModal
        open={!!previewDoc}
        onClose={() => setPreviewDoc(null)}
        document={previewDoc}
        labels={{
          previewLabel:       t("previewModal.label"),
          close:              tCommon("close"),
          openInNewTab:       t("cvOpenInNewTab"),
          download:           t("cvDownload"),
          unpreviewableTitle: t("previewModal.unpreviewableTitle"),
          unpreviewableBody:  t("previewModal.unpreviewableBody"),
        }}
      />
    </form>
  );
}

function sameIdArray(a, b) {
  if (!Array.isArray(a) || !Array.isArray(b)) return false;
  if (a.length !== b.length) return false;
  const sa = [...a].sort((x, y) => x - y);
  const sb = [...b].sort((x, y) => x - y);
  return sa.every((v, i) => v === sb[i]);
}
