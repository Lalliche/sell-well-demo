"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import Image from "next/image";
import Typemark from "@/assets/SellWell-Typemark-nobg.png";
import LocaleSwitcher from "@/components/shared/LocaleSwitcher";

/* Footer — calm bottom-of-page anchor.
 *
 * Per the premium-SaaS footer research (Mercury / Linear / Polar / Notion
 * convention): 3 nav columns + brand block, no tagline, no social icons,
 * no newsletter, no second CTA (CTABanner above already closes). Background
 * --bg-alt with a 1px --border-light top divider. Bottom row: copyright +
 * locale switcher (Stripe/Notion bottom-left convention) + inline legal
 * links + "Made in Algiers" muted on the right.
 *
 * Footer links to pages that may not yet exist (e.g. /about, /privacy);
 * those pages are tracked in FRONTEND_TODO.md Phase 10.5 (Static & Legal
 * Pages) and built before the Phase 11 freeze. */

const PLATFORM_LINKS = [
  { key: "marketplace", href: "/marketplace" },
  { key: "howItWorks",  href: "/#how-it-works" },
  { key: "twoPaths",    href: "/#two-paths" },
  { key: "faq",         href: "/#faq" },
];

const ACCOUNT_LINKS = [
  { key: "login",  href: "/login" },
  { key: "signup", href: "/signup" },
];

const COMPANY_LINKS = [
  { key: "about",   href: "/about" },
  { key: "contact", href: "/contact" },
  { key: "privacy", href: "/privacy" },
  { key: "terms",   href: "/terms" },
];

function Column({ title, links, t }) {
  return (
    <div className="flex flex-col gap-[0.875em]">
      <h3 className="font-body text-[0.6875em] font-semibold uppercase tracking-[0.08em] text-text-muted">
        {title}
      </h3>
      <ul className="flex flex-col gap-[0.5em]">
        {links.map(({ key, href }) => (
          <li key={key}>
            <Link
              href={href}
              className="font-body text-[0.875em] text-text-secondary hover:text-text transition-colors duration-150"
            >
              {t(key)}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function Footer() {
  const t = useTranslations("Footer");
  const year = new Date().getFullYear();

  return (
    <footer className="bg-bg border-t border-border-light">
      <div className="max-w-[78em] mx-auto px-[2em] py-[5em] sm:py-[6em]">
        {/* Top row: brand + 3 columns */}
        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr] gap-[2em] lg:gap-[2.5em]">
          <div className="col-span-2 lg:col-span-1 flex flex-col gap-[0.875em]">
            <Link href="/" className="inline-flex items-center self-start" aria-label="SellWell">
              <Image
                src={Typemark}
                alt="SellWell"
                height={128}
                className="w-auto"
              />
            </Link>
            <p className="font-body text-[0.8125em] leading-[1.55] text-text-muted max-w-[22em]">
              {t("brandDescription")}
            </p>
          </div>

          <Column title={t("colPlatform")} links={PLATFORM_LINKS} t={t} />
          <Column title={t("colAccount")}  links={ACCOUNT_LINKS}  t={t} />
          <Column title={t("colCompany")}  links={COMPANY_LINKS}  t={t} />
        </div>

        {/* Divider */}
        <div className="mt-[3em] pt-[2em] border-t border-border-light">
          {/* Bottom row */}
          <div className="flex flex-col gap-[1em] sm:flex-row sm:items-center sm:justify-between">
            {/* Left group: copyright + locale */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-[1em]">
              <p className="font-body text-[0.8125em] text-text-muted">
                © {year} SellWell.
              </p>
              <LocaleSwitcher />
            </div>

            {/* Center group: legal inline */}
            <div className="flex items-center gap-[0.75em] font-body text-[0.8125em] text-text-muted">
              <Link href="/privacy" className="hover:text-text transition-colors duration-150">
                {t("privacy")}
              </Link>
              <span aria-hidden="true">·</span>
              <Link href="/terms" className="hover:text-text transition-colors duration-150">
                {t("terms")}
              </Link>
            </div>

            {/* Right group: made in algiers */}
            <p className="font-body text-[0.75em] text-text-muted">
              {t("madeIn")}
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
