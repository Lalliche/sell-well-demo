"use client";

/**
 * PartnerSection — company-side partner profile snapshot inside the
 * application detail overlay.
 *
 * Surfaces the FULL set of fields the sales partner submits at signup
 * (per `auth-onboarding-spec.md` Step 2):
 *   - Avatar + full name + LinkedIn URL (header)
 *   - Phone number (contact row, optional)
 *   - Bio (full text)
 *   - CV file (download row with icon + filename) — required at signup
 *   - Preferred categories (chips)
 *   - Skill tags (chips)
 *
 * Mock contract — `application.partner` returned by
 * `fetchCompanyApplications` carries every field above. Backend will
 * mirror this slice via the same serializer.
 */

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocale, useTranslations } from "next-intl";
import { ExternalLink, Phone } from "lucide-react";
import Avatar from "@/components/shared/data-display/Avatar";
import {
  DocumentCard,
  DocumentPreviewModal,
} from "@/components/shared/data-display/document";
import { fetchCategories, fetchSkillTags } from "@/lib/mock/campaigns";

export default function PartnerSection({ partner, t }) {
  const locale = useLocale();
  const tCv = useTranslations("Applications.companyDetail.partner.cvLabels");
  const [previewing, setPreviewing] = useState(null);
  const { data: categories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: fetchCategories,
  });
  const { data: skillTags = [] } = useQuery({
    queryKey: ["skill-tags"],
    queryFn: fetchSkillTags,
  });

  if (!partner) return null;

  const fullName = `${partner.first_name} ${partner.last_name}`;
  const labelFor = (list, id) => {
    const row = list.find((r) => r.id === id);
    if (!row) return null;
    return locale === "fr" ? row.name_fr : row.name_en;
  };

  const categoryLabels = (partner.categories ?? [])
    .map((id) => labelFor(categories, id))
    .filter(Boolean);
  const skillLabels = (partner.skill_tags ?? [])
    .map((id) => labelFor(skillTags, id))
    .filter(Boolean);

  // CV filename derived from the URL — backend will return a real
  // filename via Content-Disposition; here we just split the URL.
  const cvFilename = partner.cv_file
    ? decodeURIComponent(partner.cv_file.split("/").pop().split("?")[0])
    : null;

  // Adapt the partner's cv_file URL to the shape DocumentCard expects.
  // Same pattern the Sales Kit + Lead Documents surfaces use; gives
  // us preview-on-click + download out of the box.
  const cvDoc = partner.cv_file
    ? {
        id: `partner-cv-${partner.id}`,
        kind: "file",
        fileUrl: partner.cv_file,
        title: cvFilename ?? t("partner.cvDefaultLabel"),
        subtitle: t("partner.cvHint"),
      }
    : null;

  const cvLabels = {
    preview: tCv("preview"),
    download: tCv("download"),
    watch: tCv("watch"),
    openInNewTab: tCv("openInNewTab"),
    close: tCv("close"),
    unpreviewableTitle: tCv("unpreviewableTitle"),
    unpreviewableBody: tCv("unpreviewableBody"),
  };

  return (
    <div className="flex flex-col gap-[1.25em]">
      {/* Header — avatar + name + LinkedIn link */}
      <div className="flex items-center gap-[0.875em]">
        {partner.profile_photo ? (
          <span className="inline-flex w-[3em] h-[3em] rounded-full overflow-hidden bg-bg shrink-0 border border-border-light">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={partner.profile_photo}
              alt={fullName}
              className="w-full h-full object-cover"
            />
          </span>
        ) : (
          <Avatar name={fullName} size="lg" />
        )}
        <div className="flex flex-col min-w-0">
          <span className="text-[1em] font-semibold text-text truncate">
            {fullName}
          </span>
          {partner.linkedin_url && (
            <a
              href={partner.linkedin_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-[0.25em] text-[0.75em] text-accent-text hover:text-accent transition-colors duration-150 ease-out truncate"
            >
              <span className="truncate">{t("partner.linkedin")}</span>
              <ExternalLink className="w-[0.75em] h-[0.75em]" strokeWidth={1.75} />
            </a>
          )}
        </div>
      </div>

      {/* Phone — optional, surfaces as a tap-to-call link on mobile. */}
      {partner.phone && (
        <div className="flex flex-col gap-[0.375em]">
          <span className="text-[0.6875em] font-semibold uppercase tracking-[0.06em] text-text-muted font-body">
            {t("partner.phone")}
          </span>
          <a
            href={`tel:${partner.phone.replace(/\s+/g, "")}`}
            className="inline-flex items-center gap-[0.5em] self-start font-mono text-[0.875em] tabular-nums text-text hover:text-accent-text transition-colors duration-150 ease-out"
          >
            <Phone className="w-[0.875em] h-[0.875em] text-text-muted" strokeWidth={1.75} />
            {partner.phone}
          </a>
        </div>
      )}

      {/* Bio */}
      {partner.bio && (
        <div className="flex flex-col gap-[0.375em]">
          <span className="text-[0.6875em] font-semibold uppercase tracking-[0.06em] text-text-muted font-body">
            {t("partner.bio")}
          </span>
          <p className="text-[0.875em] text-text-secondary font-body leading-[1.65] whitespace-pre-line">
            {partner.bio}
          </p>
        </div>
      )}

      {/* CV file — shared DocumentCard (row variant) + DocumentPreviewModal.
          Same primitive the Sales Kit + lead attachments use, so PDF
          preview, download, and open-in-new-tab all work out of the box. */}
      {cvDoc && (
        <div className="flex flex-col gap-[0.375em]">
          <span className="text-[0.6875em] font-semibold uppercase tracking-[0.06em] text-text-muted font-body">
            {t("partner.cv")}
          </span>
          <DocumentCard
            document={cvDoc}
            variant="row"
            onPreview={setPreviewing}
            labels={cvLabels}
          />
        </div>
      )}

      {/* Categories */}
      {categoryLabels.length > 0 && (
        <div className="flex flex-col gap-[0.375em]">
          <span className="text-[0.6875em] font-semibold uppercase tracking-[0.06em] text-text-muted font-body">
            {t("partner.categories")}
          </span>
          <div className="flex flex-wrap gap-[0.375em]">
            {categoryLabels.map((label) => (
              <span
                key={label}
                className="text-[0.75em] px-[0.625em] py-[0.25em] rounded-[0.375em] bg-accent-light text-accent-text font-medium"
              >
                {label}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Skill tags */}
      {skillLabels.length > 0 && (
        <div className="flex flex-col gap-[0.375em]">
          <span className="text-[0.6875em] font-semibold uppercase tracking-[0.06em] text-text-muted font-body">
            {t("partner.skills")}
          </span>
          <div className="flex flex-wrap gap-[0.375em]">
            {skillLabels.map((label) => (
              <span
                key={label}
                className="text-[0.75em] px-[0.625em] py-[0.25em] rounded-[0.375em] bg-bg-alt text-text-secondary font-medium"
              >
                {label}
              </span>
            ))}
          </div>
        </div>
      )}

      <DocumentPreviewModal
        open={!!previewing}
        onClose={() => setPreviewing(null)}
        document={previewing}
        labels={cvLabels}
      />
    </div>
  );
}
