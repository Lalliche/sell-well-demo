"use client";

import { useTranslations } from "next-intl";
import { ArrowLeft } from "lucide-react";
import { Link } from "@/i18n/navigation";
import AppButton from "@/components/ui/Buttons";

/**
 * Locale-level 404 — rendered when `notFound()` is called anywhere under
 * `/[locale]/*` or the router can't match a path. Inherits the locale
 * layout so fonts, globals.css, and all providers are active.
 */
export default function NotFound() {
  const t = useTranslations("NotFound");

  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-center gap-[1.25em] px-[2em] py-[4em] bg-bg">
      <span className="font-heading text-[7em] font-bold leading-none tracking-[-0.04em] text-text select-none">
        404
      </span>

      <div className="flex flex-col gap-[0.5em] max-w-[32ch]">
        <h1 className="text-[1.25em] font-semibold text-text">
          {t("title")}
        </h1>
        <p className="text-[0.9375em] text-text-secondary leading-[1.6]">
          {t("description")}
        </p>
      </div>

      <Link href="/" className="mt-[0.5em]">
        <AppButton variant="primary" size="md">
          <span className="inline-flex items-center gap-[0.5em]">
            <ArrowLeft className="w-[1em] h-[1em]" strokeWidth={2} />
            {t("backHome")}
          </span>
        </AppButton>
      </Link>
    </div>
  );
}
