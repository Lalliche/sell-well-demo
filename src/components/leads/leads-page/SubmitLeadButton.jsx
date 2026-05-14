"use client";

/**
 * SubmitLeadButton — primary CTA used both in the /leads PageHeader and
 * (potentially) other surfaces. Single source of truth so the icon +
 * label + size + variant stays consistent.
 */

import { Link as IntlLink } from "@/i18n/navigation";
import { FiPlus } from "react-icons/fi";
import AppButton from "@/components/ui/Buttons";

export default function SubmitLeadButton({ label, size = "md", campaignSlug }) {
  const href = campaignSlug ? `/leads/new?campaign=${campaignSlug}` : "/leads/new";
  return (
    <IntlLink href={href}>
      <AppButton size={size} variant="primary">
        <span className="inline-flex items-center gap-[0.375em]">
          <FiPlus size="0.875em" strokeWidth={2.25} />
          {label}
        </span>
      </AppButton>
    </IntlLink>
  );
}
