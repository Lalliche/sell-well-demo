"use client";

/**
 * EscrowRouter — role branch for /escrow.
 *
 * Companies see EscrowPage (the wallet detail). Partners are redirected
 * to /earnings (their own withdrawals + commission balance, Phase 6.9
 * placeholder for now). Admins land on a forwarder pointing at /admin.
 *
 * Same shape as ApplicationsRouter / LeadsRouter / CampaignSlugRouter.
 */

import { useEffect } from "react";
import { useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";
import { useAuth } from "@/components/providers/AuthProvider";
import EscrowPage from "./EscrowPage";

export default function EscrowRouter() {
  const { user, ready } = useAuth();
  const router = useRouter();
  const t = useTranslations("Escrow.adminForward");

  useEffect(() => {
    if (!ready) return;
    if (user?.role === "sales_partner") router.replace("/earnings");
  }, [ready, user?.role, router]);

  if (!ready) return null;
  if (!user) return null;

  if (user.role === "company") return <EscrowPage />;

  // Sales partner branch — redirect runs in the effect; render nothing
  // while the navigation lands.
  if (user.role === "sales_partner") return null;

  // Admin branch — minimal forwarder.
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
