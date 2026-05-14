"use client";

/**
 * PartnerCell — first column of the company-side /applications table.
 * Avatar + partner name + LinkedIn-derived bio fragment as the muted
 * second line. Mirrors `CampaignCell`'s visual cadence so the two
 * tables feel consistent across roles.
 *
 * `row.partner` is the slice returned by `fetchCompanyApplications`:
 *   { id, first_name, last_name, profile_photo, bio, linkedin_url,
 *     categories, skill_tags }
 */

import Avatar from "@/components/shared/data-display/Avatar";

export default function PartnerCell({ row, fallback }) {
  const p = row.partner;
  const name = p ? `${p.first_name} ${p.last_name}` : (fallback ?? "—");
  // First sentence of the bio capped at ~70 chars — keeps the table dense
  // while giving the company a quick read on the partner's pitch context.
  const bioFrag = (() => {
    if (!p?.bio) return null;
    const period = p.bio.indexOf(". ");
    if (period > 20 && period < 80) return p.bio.slice(0, period + 1);
    return p.bio.length > 70 ? `${p.bio.slice(0, 67)}…` : p.bio;
  })();

  return (
    <div className="flex items-center gap-[0.625em] min-w-0">
      {p?.profile_photo ? (
        <span className="inline-flex w-[2em] h-[2em] rounded-full overflow-hidden bg-bg shrink-0 border border-border-light">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={p.profile_photo} alt={name} className="w-full h-full object-cover" />
        </span>
      ) : (
        <Avatar name={name} size="sm" />
      )}
      <div className="flex flex-col gap-[0.125em] min-w-0">
        <span className="text-[0.875em] font-semibold text-text truncate">{name}</span>
        {bioFrag && (
          <span className="text-[0.6875em] text-text-muted truncate font-body">
            {bioFrag}
          </span>
        )}
      </div>
    </div>
  );
}
