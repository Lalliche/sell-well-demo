"use client";

/**
 * UserProfileSection — single source of truth for the "Profile" section of
 * any role-aware user detail overlay (admin verifications, admin users, and
 * anywhere else admin needs to look at a partner or company profile).
 *
 * Renders different content per role:
 *   - sales_partner → photo / name / phone / LinkedIn / bio / categories /
 *                     skill tags / CV link
 *   - company       → logo / name / industry / website / business description
 *
 * Props:
 *   user           — the row returned by `fetchUserById` / `fetchVerifications`.
 *                    Expected shape: `{ role, profile, display_name }` where
 *                    `profile` is either a `SalesPartnerProfile` or
 *                    `CompanyProfile`.
 *   locale         — current next-intl locale ("en" | "fr"). Used to pick the
 *                    name_en vs name_fr field on Category + SkillTag joins.
 *   onPreviewDoc   — callback fired when admin clicks Preview on the partner's
 *                    CV. Caller owns the DocumentPreviewModal state and renders
 *                    it (CLAUDE.md §2: parent owns the modal).
 *   labels         — translated strings. Caller-supplied so the component
 *                    works inside any next-intl namespace.
 *                    Required keys:
 *                      profileMissing, bio, categories, skills, cv, cvTitle,
 *                      previewCv, downloadCv, linkedin, description
 *                    Optional keys:
 *                      openInNewTab — forwarded to DocumentCard for CVs
 *                                     stored as URLs; harmless when omitted.
 *                    `cvTitle` accepts a `{name}` placeholder; the component
 *                    interpolates it before rendering.
 *
 * Why this exists: prior to extraction this section was copy-pasted between
 * `VerificationDetailOverlay.jsx` and `AdminUserDetailOverlay.jsx`. Both
 * already render an identical layout; the only thing diverging was the i18n
 * namespace key. Per Skills/nextjs-architecture.md "Extract to
 * `src/components/shared/` the moment a pattern appears in 2+ places.
 * Zero tolerance."
 */

import { Phone, Globe, ExternalLink } from "lucide-react";
import { FiLinkedin } from "react-icons/fi";

import Avatar from "@/components/shared/data-display/Avatar";
import DocumentCard from "@/components/shared/data-display/document/DocumentCard";
import { fileNameFromUrl } from "@/lib/format/file";
import { cn } from "@/lib/utils";

import { MOCK_CATEGORIES } from "@/lib/mock/_seed/categories";
import { MOCK_SKILL_TAGS } from "@/lib/mock/_seed/skill-tags";

/* ── tiny dl-style row ────────────────────────────────────────────────── */
function Field({ label, children, mono = false }) {
  return (
    <div className="flex flex-col gap-[0.25em]">
      <span className="text-[0.6875em] font-semibold uppercase tracking-[0.06em] text-text-muted font-body">
        {label}
      </span>
      <span className={cn("text-[0.875em] text-text", mono && "font-mono tabular-nums")}>
        {children ?? <span className="text-text-muted">—</span>}
      </span>
    </div>
  );
}

function interpolate(template, vars) {
  if (typeof template !== "string") return template;
  return template.replace(/\{(\w+)\}/g, (_, key) => vars?.[key] ?? `{${key}}`);
}

export default function UserProfileSection({
  user,
  locale,
  onPreviewDoc,
  labels,
}) {
  const profile = user?.profile;

  if (!profile) {
    return (
      <p className="text-[0.875em] text-text-muted">
        {labels.profileMissing}
      </p>
    );
  }

  /* ── Sales Partner ─────────────────────────────────────────────────── */
  if (user.role === "sales_partner") {
    const categories = (profile.categories ?? [])
      .map((id) => MOCK_CATEGORIES.find((c) => c.id === id))
      .filter(Boolean)
      .map((c) => (locale === "fr" ? c.name_fr : c.name_en));
    const skills = (profile.skill_tags ?? [])
      .map((id) => MOCK_SKILL_TAGS.find((s) => s.id === id))
      .filter(Boolean)
      .map((s) => (locale === "fr" ? s.name_fr : s.name_en));

    const fullName = `${profile.first_name} ${profile.last_name}`;

    return (
      <div className="flex flex-col gap-[1.5em]">
        <div className="flex items-start gap-[1em]">
          {profile.profile_photo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={profile.profile_photo}
              alt={fullName}
              className="w-[4em] h-[4em] rounded-[0.625em] object-cover border border-border-light shrink-0"
            />
          ) : (
            <Avatar name={fullName} size="lg" />
          )}
          <div className="flex flex-col gap-[0.25em] min-w-0">
            <span className="text-[1.125em] font-semibold text-text font-heading">
              {fullName}
            </span>
            {profile.phone && (
              <span className="inline-flex items-center gap-[0.375em] text-[0.8125em] text-text-secondary">
                <Phone size="0.8125em" strokeWidth={1.75} />
                {profile.phone}
              </span>
            )}
            {profile.linkedin_url && (
              <a
                href={profile.linkedin_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-[0.375em] text-[0.8125em] text-accent hover:underline w-fit"
              >
                <FiLinkedin size="0.8125em" strokeWidth={1.75} />
                {labels.linkedin}
                <ExternalLink size="0.75em" strokeWidth={1.5} />
              </a>
            )}
          </div>
        </div>

        {profile.bio && (
          <Field label={labels.bio}>
            <p className="text-[0.875em] text-text-secondary leading-[1.6] whitespace-pre-wrap">
              {profile.bio}
            </p>
          </Field>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-[1em]">
          {categories.length > 0 && (
            <Field label={labels.categories}>
              <div className="flex flex-wrap gap-[0.375em]">
                {categories.map((c) => (
                  <span
                    key={c}
                    className="inline-flex items-center px-[0.625em] py-[0.1875em] bg-bg-alt rounded-[0.375em] text-[0.75em] text-text-secondary"
                  >
                    {c}
                  </span>
                ))}
              </div>
            </Field>
          )}
          {skills.length > 0 && (
            <Field label={labels.skills}>
              <div className="flex flex-wrap gap-[0.375em]">
                {skills.map((s) => (
                  <span
                    key={s}
                    className="inline-flex items-center px-[0.625em] py-[0.1875em] bg-accent-light text-accent-text rounded-[0.375em] text-[0.75em] font-medium"
                  >
                    {s}
                  </span>
                ))}
              </div>
            </Field>
          )}
        </div>

        {profile.cv_file && (
          <Field label={labels.cv}>
            <DocumentCard
              document={{
                kind: "file",
                fileUrl: profile.cv_file,
                title: interpolate(labels.cvTitle, { name: fullName }),
                subtitle: fileNameFromUrl(profile.cv_file),
              }}
              variant="row"
              onPreview={onPreviewDoc}
              labels={{
                preview:      labels.previewCv,
                download:     labels.downloadCv,
                openInNewTab: labels.openInNewTab,
              }}
              className="bg-surface border border-border-light"
            />
          </Field>
        )}
      </div>
    );
  }

  /* ── Company ───────────────────────────────────────────────────────── */
  const industry = MOCK_CATEGORIES.find((c) => c.id === profile.industry);
  const industryName = industry
    ? (locale === "fr" ? industry.name_fr : industry.name_en)
    : null;

  return (
    <div className="flex flex-col gap-[1.5em]">
      <div className="flex items-start gap-[1em]">
        {profile.logo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={profile.logo}
            alt={profile.company_name}
            className="w-[4em] h-[4em] rounded-[0.625em] object-cover border border-border-light shrink-0 bg-bg"
          />
        ) : (
          <Avatar name={profile.company_name} size="lg" />
        )}
        <div className="flex flex-col gap-[0.25em] min-w-0">
          <span className="text-[1.125em] font-semibold text-text font-heading">
            {profile.company_name}
          </span>
          {industryName && (
            <span className="text-[0.8125em] text-text-secondary">{industryName}</span>
          )}
          {profile.website && (
            <a
              href={profile.website}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-[0.375em] text-[0.8125em] text-accent hover:underline w-fit"
            >
              <Globe size="0.8125em" strokeWidth={1.75} />
              {profile.website.replace(/^https?:\/\//, "")}
              <ExternalLink size="0.75em" strokeWidth={1.5} />
            </a>
          )}
        </div>
      </div>

      {profile.description && (
        <Field label={labels.description}>
          <p className="text-[0.875em] text-text-secondary leading-[1.6] whitespace-pre-wrap">
            {profile.description}
          </p>
        </Field>
      )}
    </div>
  );
}
