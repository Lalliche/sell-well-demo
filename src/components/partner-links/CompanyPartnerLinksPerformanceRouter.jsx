"use client";

/**
 * CompanyPartnerLinksPerformanceRouter — role branch for the company-only
 * `/partner-links/performance` route.
 *
 * Companies see the performance page. Partners + admins see an in-shell
 * "page not found" card (no redirect — keeps the user oriented inside
 * the dashboard layout). Will collapse into a role-prefixed route during
 * the Option B refactor noted at the top of CLAUDE.md.
 */

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { useAuth } from "@/components/providers/AuthProvider";
import { ArrowLeft } from "lucide-react";
import CompanyPartnerLinksPerformancePage from "./CompanyPartnerLinksPerformancePage";

export default function CompanyPartnerLinksPerformanceRouter() {
  const { user, ready } = useAuth();
  if (!ready) return null;
  if (user?.role === "company") return <CompanyPartnerLinksPerformancePage />;
  return <NotFoundInShell />;
}

function NotFoundInShell() {
  const t = useTranslations("PartnerLinksPerf.notFound");
  return (
    <div className="px-[2em] py-[2em] flex flex-col gap-[1em] max-w-[40em]">
      <p className="text-[0.6875em] font-semibold tracking-[0.06em] uppercase text-text-muted">
        {t("eyebrow")}
      </p>
      <h1 className="font-heading text-[1.5em] font-bold tracking-[-0.02em] text-text">
        {t("title")}
      </h1>
      <p className="text-[0.9375em] text-text-secondary leading-[1.55] max-w-[55ch]">
        {t("body")}
      </p>
      <Link
        href="/dashboard"
        className="self-start inline-flex items-center gap-[0.375em] h-[2.5em] px-[1.125em] rounded-[0.5em] border border-border text-[0.8125em] font-semibold text-text hover:bg-surface-hover transition-[background-color] duration-150 ease-out"
      >
        <ArrowLeft className="w-[1em] h-[1em]" strokeWidth={1.5} />
        {t("cta")}
      </Link>
    </div>
  );
}
