"use client";

/**
 * ApplicationsRouter — role branch for /applications.
 *
 * Partners see the existing partner-side `ApplicationsPage` (their
 * outgoing applications). Companies see `CompanyApplicationsPage` (the
 * incoming applications queue). Admins see a forwarder pointing at
 * /admin (Phase 9 owns the admin-facing applications view).
 */

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { useAuth } from "@/components/providers/AuthProvider";
import ApplicationsPage from "./ApplicationsPage";
import CompanyApplicationsPage from "./CompanyApplicationsPage";

export default function ApplicationsRouter() {
  const { user, ready } = useAuth();
  const t = useTranslations("Applications.adminForward");

  if (!ready) return null;
  if (!user) return null;

  if (user.role === "company") return <CompanyApplicationsPage />;
  if (user.role === "sales_partner") return <ApplicationsPage />;

  // Admin branch — minimal forwarder, same pattern as the campaigns
  // slug router. The real admin queue ships in Phase 9.
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
