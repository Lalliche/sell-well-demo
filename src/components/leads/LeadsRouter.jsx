"use client";

/**
 * LeadsRouter — role branch for /leads.
 *
 * Partners see the existing partner-side `LeadsPage` (their submitted +
 * draft leads). Companies see `CompanyLeadsInbox` (incoming queue +
 * sticky wallet rail). Admins land on a forwarder pointing at /admin.
 *
 * Same pattern as ApplicationsRouter + CampaignSlugRouter. Will collapse
 * into role-prefixed routes when we execute the Option B migration
 * (see CLAUDE.md "CRITICAL REFACTOR DEBT — Routing model").
 */

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { useAuth } from "@/components/providers/AuthProvider";
import LeadsPage from "./LeadsPage";
import CompanyLeadsInbox from "./CompanyLeadsInbox";

export default function LeadsRouter() {
  const { user, ready } = useAuth();
  const t = useTranslations("Leads.adminForward");

  if (!ready) return null;
  if (!user) return null;

  if (user.role === "company") return <CompanyLeadsInbox />;
  if (user.role === "sales_partner") return <LeadsPage />;

  return (
    <div className="px-[2em] py-[2em] flex flex-col gap-[1em]">
      <p className="text-[0.9375em] text-text font-semibold">{t("title")}</p>
      <p className="text-[0.875em] text-text-secondary max-w-[55ch]">{t("body")}</p>
      <Link
        href="/admin"
        className="self-start inline-flex items-center h-[2.5em] px-[1.125em] rounded-[0.5em] bg-cta text-cta-text text-[0.8125em] font-semibold shadow-sm hover:bg-cta-hover transition-[background-color,box-shadow] duration-150 ease-out"
      >
        {t("cta")}
      </Link>
    </div>
  );
}
