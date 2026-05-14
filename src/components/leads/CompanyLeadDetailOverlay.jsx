"use client";

/**
 * CompanyLeadDetailOverlay — company-side lead detail overlay.
 *
 * Sections (5, mirrors partner-side `LeadDetailOverlay`):
 *   1. Client       — pre-reservation: LockedSection. Post-reservation:
 *                     ClientSection (reused) WITHOUT its inner notes
 *                     (notes get their own section so we can split
 *                     partner-vs-company timelines).
 *   2. Notes        — pre-reservation: LockedSection. Post-reservation:
 *                     LeadNotesSplit (partner read-only + company composer).
 *   3. Timeline     — always visible. Same TimelineSection as partner.
 *   4. Documents    — pre-reservation: LockedSection. Post-reservation:
 *                     DocumentsSection (reused, read-only since !isDraft).
 *   5. Campaign     — always visible. Same CampaignSection as partner.
 *   6. Commission   — always visible. Same CommissionSection as partner.
 *
 * Footer — state-driven:
 *   - submitted | pending_escrow → primary "Reserve & view"
 *   - acknowledged → "Confirm sale" + "Did not convert" (deferred to 7.7)
 *   - terminal states → muted state chip (inherits partner-side helper)
 */

import { useEffect, useMemo, useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import {
  User, Activity, Box, CreditCard, Paperclip, MessageSquare, ShieldCheck,
  CheckCircle2, X as XIcon,
} from "lucide-react";
import DetailOverlay from "@/components/shared/overlays/DetailOverlay";
import AppButton from "@/components/ui/Buttons";
import ClientSectionIdentityOnly from "./lead-detail/ClientSectionIdentityOnly";
import TimelineSection from "./lead-detail/TimelineSection";
import CampaignSection from "./lead-detail/CampaignSection";
import CommissionSection from "./lead-detail/CommissionSection";
import DocumentsSection from "./lead-detail/documents/DocumentsSection";
import LeadNotesSplit from "./lead-detail/LeadNotesSplit";
import LockedSection from "./lead-detail/LockedSection";
import FooterStateChip from "./lead-detail/FooterStateChip";
import { EXPIRING_SOON_MS, daysLeft, msUntil } from "./lead-detail/lead-detail-helpers";

export default function CompanyLeadDetailOverlay({
  open,
  onClose,
  lead,
  onReserveClick,
  onConfirmSaleClick,
  onDenyConversionClick,
}) {
  const t = useTranslations("Leads.detail");
  const tCompany = useTranslations("Leads.companyDetail");
  const locale = useLocale();

  const [now, setNow] = useState(null);
  useEffect(() => {
    if (!lead) return;
    const raf = requestAnimationFrame(() => setNow(Date.now()));
    return () => cancelAnimationFrame(raf);
  }, [lead]);

  const data = useMemo(() => {
    if (!lead) return null;
    const c = lead.campaign;
    const category = c?.category_resolved;
    const remainingMs =
      now !== null ? msUntil(lead.tracking_window_expires_at, now) : null;
    const isExpiringSoon =
      lead.status === "acknowledged" &&
      remainingMs !== null &&
      remainingMs > 0 &&
      remainingMs <= EXPIRING_SOON_MS;
    return {
      campaign: c,
      categoryName: category
        ? locale === "fr" ? category.name_fr : category.name_en
        : null,
      isExpiringSoon,
      daysRemaining: now !== null ? daysLeft(lead.tracking_window_expires_at, now) : null,
    };
  }, [lead, locale, now]);

  if (!lead || !data) {
    return <DetailOverlay open={open} onClose={onClose} sections={[]} />;
  }

  const { campaign, categoryName, isExpiringSoon, daysRemaining } = data;
  const revealed = lead.contact_revealed === true;
  const isActionable = lead.status === "submitted" || lead.status === "pending_escrow";

  const title = revealed
    ? lead.client_full_name
    : tCompany("titleLocked");
  const subtitle = campaign?.product_name
    ? (categoryName ? `${campaign.product_name} · ${categoryName}` : campaign.product_name)
    : "";

  const sections = [
    {
      key: "client",
      label: t("sections.client"),
      icon: <User size="0.875em" />,
      content: revealed ? (
        <ClientSectionIdentityOnly lead={lead} t={t} />
      ) : (
        <LockedSection kind="client" lead={lead} onReserveClick={onReserveClick} t={tCompany} />
      ),
    },
    {
      key: "notes",
      label: tCompany("sections.notes"),
      icon: <MessageSquare size="0.875em" />,
      content: revealed ? (
        <LeadNotesSplit lead={lead} locale={locale} t={tCompany} />
      ) : (
        <LockedSection kind="notes" lead={lead} onReserveClick={onReserveClick} t={tCompany} />
      ),
    },
    {
      key: "timeline",
      label: t("sections.timeline"),
      icon: <Activity size="0.875em" />,
      content: (
        <TimelineSection
          lead={lead}
          locale={locale}
          isExpiringSoon={isExpiringSoon}
          daysRemaining={daysRemaining}
          t={t}
        />
      ),
    },
    {
      key: "documents",
      label: t("sections.documents"),
      icon: <Paperclip size="0.875em" />,
      content: revealed ? (
        <DocumentsSection lead={lead} t={t} />
      ) : (
        <LockedSection kind="documents" lead={lead} onReserveClick={onReserveClick} t={tCompany} />
      ),
    },
    {
      key: "campaign",
      label: t("sections.campaign"),
      icon: <Box size="0.875em" />,
      content: <CampaignSection campaign={campaign} categoryName={categoryName} t={t} />,
    },
    {
      key: "commission",
      label: t("sections.commission"),
      icon: <CreditCard size="0.875em" />,
      content: <CommissionSection lead={lead} t={t} />,
    },
  ];

  const isAcknowledged = lead.status === "acknowledged";

  let footer;
  if (isActionable) {
    footer = (
      <AppButton
        variant="accent"
        size="sm"
        onClick={() => onReserveClick?.(lead)}
      >
        <span className="inline-flex items-center gap-[0.375em]">
          <ShieldCheck className="w-[0.875em] h-[0.875em]" strokeWidth={1.75} />
          {tCompany("footer.reserveAndView")}
        </span>
      </AppButton>
    );
  } else if (isAcknowledged) {
    footer = (
      <>
        {/* Did not convert — outlined-destructive: red text + red
            border + tinted hover. Reads as a real button next to the
            primary green Confirm sale, not a ghost link. */}
        <button
          type="button"
          onClick={() => onDenyConversionClick?.(lead)}
          className="inline-flex items-center gap-[0.375em] h-[2.5em] px-[1em] rounded-[0.5em] border border-status-rejected-text/40 bg-surface text-[0.8125em] font-semibold text-status-rejected-text hover:bg-status-rejected-bg hover:border-status-rejected-text/60 transition-[background-color,border-color] duration-150 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-status-rejected-text/30"
        >
          <XIcon className="w-[0.875em] h-[0.875em]" strokeWidth={2} />
          {tCompany("footer.didNotConvert")}
        </button>
        <AppButton
          variant="accent"
          size="md"
          onClick={() => onConfirmSaleClick?.(lead)}
        >
          <span className="inline-flex items-center gap-[0.375em]">
            <CheckCircle2 className="w-[0.875em] h-[0.875em]" strokeWidth={1.75} />
            {tCompany("footer.confirmSale")}
          </span>
        </AppButton>
      </>
    );
  } else {
    footer = (
      <FooterStateChip
        lead={lead}
        isExpiringSoon={isExpiringSoon}
        daysRemaining={daysRemaining}
        t={t}
      />
    );
  }

  return (
    <DetailOverlay
      open={open}
      onClose={onClose}
      title={title}
      subtitle={subtitle}
      sections={sections}
      footer={footer}
      defaultSection={revealed ? "client" : "client"}
    />
  );
}
