"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import LocaleSwitcher from "@/components/shared/LocaleSwitcher";

/**
 * AuthShell — Linear-faithful centered column.
 *
 * Layout:
 *   - Top: small SellWell wordmark (links home), locale switcher in the corner.
 *   - Middle: content column (max-w-[30em]), vertically centered by default.
 *   - Bottom: fine-print Terms + Privacy line.
 *
 * No left brand panel. No marketing copy. No illustrations.
 * Surface: bg-bg (warm cream).
 *
 * Props:
 *   align     "center" | "top"  — vertical alignment of the column.
 *               "center" (default) for short flows so they sit mid-viewport.
 *               "top" for tall multi-step flows so the step indicator stays
 *               anchored as the card grows.
 *   children  page contents
 */
export default function AuthShell({ children, align = "center" }) {
  const t = useTranslations("Auth");

  return (
    <div className="min-h-screen flex flex-col bg-bg">
      {/* Header strip — wordmark + locale switcher */}
      <header className="w-full">
        <div className="max-w-[75em] mx-auto px-[2em] h-[4em] flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded-[0.25em]"
            aria-label="SellWell home"
          >
            <span className="font-heading font-bold text-[1.125em] tracking-[-0.02em] text-text">
              Sell<span className="text-accent">Well</span>
            </span>
          </Link>
          <LocaleSwitcher />
        </div>
      </header>

      {/* Main — column. Vertical alignment per `align` prop. */}
      <main
        className={
          align === "top"
            ? "flex-1 flex items-start justify-center px-[1.5em] pt-[3em] pb-[2em]"
            : "flex-1 flex items-center justify-center px-[1.5em] py-[2em]"
        }
      >
        <div className="w-full max-w-[30em] flex flex-col">
          {children}
        </div>
      </main>

      {/* Footer fine-print */}
      <footer className="w-full">
        <div className="max-w-[30em] mx-auto px-[1.5em] pb-[2em] text-center">
          <p className="text-[0.75em] text-text-muted leading-[1.5]">
            {t.rich("termsLine", {
              terms: (chunks) => (
                <Link
                  href="/terms"
                  className="text-text-secondary underline underline-offset-2 decoration-border hover:text-text hover:decoration-text transition-colors"
                >
                  {chunks}
                </Link>
              ),
              privacy: (chunks) => (
                <Link
                  href="/privacy"
                  className="text-text-secondary underline underline-offset-2 decoration-border hover:text-text hover:decoration-text transition-colors"
                >
                  {chunks}
                </Link>
              ),
            })}
          </p>
        </div>
      </footer>
    </div>
  );
}
