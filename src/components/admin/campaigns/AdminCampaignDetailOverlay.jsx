"use client";

/**
 * AdminCampaignDetailOverlay — row-click overlay for /admin/campaigns.
 *
 * Reuses the partner-facing campaign-detail primitives (DetailHero,
 * DetailContentSections, SalesKitSection) wrapped inside the shared
 * DetailOverlay shell. The partner-only ApplyRail is replaced by an admin
 * action rail in the overlay footer.
 *
 * Sections:
 *   1. Overview — DetailHero + DetailContentSections + KPI mini-grid
 *                 (status · partners · leads · converted · commission
 *                  headline · tracking window · partner-links toggle).
 *   2. Sales Kit — SalesKitSection (auto-hides chrome if empty).
 *   3. Company  — Profile + Account + Activity sections of the company
 *                 owner-user. Same components + same fetchUserById call
 *                 used by /admin/users so the data is identical across
 *                 admin surfaces.
 *
 * Footer actions: Force-pause/Force-resume · Force-close.
 * Each action goes through ConfirmDialog. Mutations live in this overlay
 * (the table is read-only — no row-level kebab).
 *
 * Data: `fetchCampaignBySlug(slug)` returns the same enriched shape the
 * partner-facing page consumes — no admin-specific fetch needed. The page
 * passes `campaignId`; we resolve to slug by looking it up in the cached
 * admin-campaigns query.
 */

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslations, useLocale } from "next-intl";
import {
  FileText,
  Briefcase,
  Building2,
  PauseCircle,
  PlayCircle,
  XCircle,
} from "lucide-react";

import DetailOverlay from "@/components/shared/overlays/DetailOverlay";
import ConfirmDialog from "@/components/shared/feedback/ConfirmDialog";
import AppButton from "@/components/ui/Buttons";
import SalesKitSection from "@/components/marketplace/detail/SalesKitSection";
import UserProfileSection from "@/components/shared/user-profile/UserProfileSection";
import UserAccountSection from "@/components/shared/user-profile/UserAccountSection";
import UserActivitySection from "@/components/shared/user-profile/UserActivitySection";
import { profileLabels, accountLabels, activityLabels } from "@/components/shared/user-profile/labels";
import { useToast } from "@/hooks/useToast";
import { fetchCampaignBySlug } from "@/lib/mock/campaigns";
import {
  fetchAllCampaigns,
  fetchUserById,
  forcePauseCampaign,
  forceResumeCampaign,
  forceCloseCampaign,
} from "@/lib/mock/admin";
import AdminCampaignOverviewSection from "./AdminCampaignOverviewSection";

const ACTION_MAP = {
  forcePause:  { fn: forcePauseCampaign,  toastTitle: "pauseTitle",     toastBody: "pauseSuccess"     },
  forceResume: { fn: forceResumeCampaign, toastTitle: "resumeTitle",    toastBody: "resumeSuccess"    },
  forceClose:  { fn: forceCloseCampaign,  toastTitle: "closeTitle",     toastBody: "closeSuccess"     },
};
export default function AdminCampaignDetailOverlay({ campaignId, open, onClose }) {
  const t = useTranslations("Admin.campaigns");
  // Reuse the Admin.users.overlay.* namespace for the company-user sections
  // so the same labels show on /admin/users AND inside this overlay — single
  // source of truth, lockstep en + fr.
  const tUser = useTranslations("Admin.users");
  const locale = useLocale();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [confirm, setConfirm] = useState(null);

  // Resolve id → slug via the admin-campaigns query cache. fetchCampaignBySlug
  // is the partner-facing enriched fetch and the source of truth for the
  // detail shape; reusing it keeps admin + partner views in sync.
  const slug = useResolveSlug(campaignId);

  const { data: campaign } = useQuery({
    queryKey: ["admin", "campaigns", "detail", slug],
    queryFn: () => fetchCampaignBySlug(slug),
    enabled: open && !!slug,
  });

  // Pull the FULL user row for the company owner via the exact same call
  // /admin/users uses — fetchUserById(userId). Returns user + profile +
  // activity. Single source of truth across admin surfaces (CLAUDE.md hard
  // rule: never fork a profile-fetch path per page).
  const companyUserId = campaign?.company?.user ?? null;
  const { data: companyUser } = useQuery({
    queryKey: ["admin", "users", "byId", companyUserId],
    queryFn: () => fetchUserById(companyUserId),
    enabled: open && companyUserId != null,
  });

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["admin", "campaigns"] });
  };

  const mutation = useMutation({
    mutationFn: ({ kind }) => ACTION_MAP[kind].fn(campaign.id),
    onSuccess: (_, { kind }) => {
      invalidate();
      const cfg = ACTION_MAP[kind];
      toast.success(t(`toasts.${cfg.toastBody}`, { name: campaign.product_name }), {
        title: t(`toasts.${cfg.toastTitle}`),
      });
      setConfirm(null);
    },
  });

  if (!campaign) return null;

  const sections = [
    {
      key:   "overview",
      label: t("overlay.sections.overview"),
      icon:  <Briefcase size="1em" strokeWidth={1.75} />,
      content: <AdminCampaignOverviewSection campaign={campaign} t={t} />,
    },
    {
      key:   "salesKit",
      label: t("overlay.sections.salesKit"),
      icon:  <FileText size="1em" strokeWidth={1.75} />,
      content: campaign.documents?.length
        ? <SalesKitSection documents={campaign.documents} />
        : <p className="text-[0.875em] text-text-muted">{t("overlay.noSalesKit")}</p>,
    },
    {
      key:   "company",
      label: t("overlay.sections.company"),
      icon:  <Building2 size="1em" strokeWidth={1.75} />,
      content: companyUser ? (
        <div className="flex flex-col gap-[1.75em]">
          <UserProfileSection
            user={companyUser}
            locale={locale}
            labels={profileLabels(tUser)}
          />
          <UserAccountSection
            user={companyUser}
            locale={locale}
            labels={accountLabels(tUser)}
          />
          <UserActivitySection
            user={companyUser}
            locale={locale}
            labels={activityLabels(tUser)}
          />
        </div>
      ) : (
        <p className="text-[0.875em] text-text-muted">{tUser("overlay.profileMissing")}</p>
      ),
    },
  ];

  const footer = (
    <div className="flex items-center justify-end gap-[0.5em] w-full flex-wrap">
      <div className="flex items-center gap-[0.5em]">
        {campaign.status === "active" && (
          <AppButton variant="secondary" size="md" onClick={() => setConfirm({ kind: "forcePause" })}>
            <span className="inline-flex items-center gap-[0.5em]">
              <PauseCircle size="1em" strokeWidth={1.75} />
              {t("actions.forcePause")}
            </span>
          </AppButton>
        )}
        {campaign.status === "paused" && (
          <AppButton variant="secondary" size="md" onClick={() => setConfirm({ kind: "forceResume" })}>
            <span className="inline-flex items-center gap-[0.5em]">
              <PlayCircle size="1em" strokeWidth={1.75} />
              {t("actions.forceResume")}
            </span>
          </AppButton>
        )}
        {campaign.status !== "closed" && (
          <AppButton
            variant="primary"
            size="md"
            onClick={() => setConfirm({ kind: "forceClose" })}
            className="bg-status-rejected-text hover:bg-status-rejected-text/90 text-white"
          >
            <span className="inline-flex items-center gap-[0.5em]">
              <XCircle size="1em" strokeWidth={1.75} />
              {t("actions.forceClose")}
            </span>
          </AppButton>
        )}
      </div>
    </div>
  );

  return (
    <>
      <DetailOverlay
        open={open}
        onClose={onClose}
        title={campaign.product_name}
        subtitle={campaign.company?.company_name}
        sections={sections}
        defaultSection="overview"
        footer={footer}
      />
      {confirm ? (
        <ConfirmDialog
          open
          onCancel={() => setConfirm(null)}
          onConfirm={() => mutation.mutate(confirm)}
          title={t(`confirm.${confirm.kind}.title`, { name: campaign.product_name })}
          description={t(`confirm.${confirm.kind}.body`, { name: campaign.product_name })}
          confirmLabel={t(`confirm.${confirm.kind}.confirm`)}
          cancelLabel={t("actions.cancel")}
          destructive={confirm.kind === "forcePause" || confirm.kind === "forceClose"}
        />
      ) : null}
    </>
  );
}
/** Resolve a campaignId → slug via the already-cached admin-campaigns table.
 *  Falls back to a one-shot list fetch if the cache is cold. */
function useResolveSlug(campaignId) {
  const { data: list = [] } = useQuery({
    queryKey: ["admin", "campaigns", "all-for-slug-lookup"],
    queryFn: () => fetchAllCampaigns({}),
    enabled: campaignId != null,
    staleTime: 60_000,
  });
  if (campaignId == null) return null;
  return list.find((c) => c.id === campaignId)?.slug ?? null;
}
