"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { usePathname } from "@/i18n/navigation";
import { Link } from "@/i18n/navigation";
import Image from "next/image";
import Typemark from "@/assets/SellWell-Typemark-nobg.png";
import { Menu } from "lucide-react";
import { cn } from "@/lib/utils";
import AppButton from "@/components/ui/Buttons";
import NavDrawer from "@/components/landing/NavDrawer";
import LocaleSwitcher from "@/components/shared/LocaleSwitcher";

const NAV_LINKS = [
  { key: "home", href: "/" },
  { key: "howItWorks", href: "/#how-it-works" },
  { key: "faq", href: "/#faq" },
];

export default function Navbar() {
  const t = useTranslations("Nav");
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  return (
    <>
      <header
        className={cn(
          "fixed top-0 left-0 right-0 z-40 h-[4em] flex items-center",
          "transition-[background-color,border-color] duration-300 ease-out",
          scrolled
            ? "bg-surface border-b border-border-light shadow-xs"
            : "bg-transparent border-b border-transparent"
        )}
      >
        <div className="w-full max-w-[75em] mx-auto px-[2em] flex items-center justify-between gap-[2em]">

          <Link href="/" className="flex items-center shrink-0" aria-label="SellWell">
            <Image
              src={Typemark}
              alt="SellWell"
              height={64}
              className="h-full w-auto"
              priority
            />
          </Link>

          {/* Desktop nav links */}
          <nav className="hidden lg:flex items-center gap-[2.25em]">
            {NAV_LINKS.map(({ key, href }) => (
              <Link
                key={key}
                href={href}
                className={cn(
                  "text-[0.875em] font-medium text-text-secondary",
                  "relative after:absolute after:bottom-[-2px] after:left-0 after:w-0 after:h-[1.5px]",
                  "after:bg-accent after:transition-[width] after:duration-250 after:ease-out",
                  "hover:text-text hover:after:w-full",
                  "focus-visible:outline-none focus-visible:text-text",
                  pathname === href && "text-text after:w-full"
                )}
              >
                {t(key)}
              </Link>
            ))}
          </nav>

          {/* Desktop actions */}
          <div className="hidden lg:flex items-center gap-[0.75em]">
            <LocaleSwitcher />
            <Link href="/login">
              <AppButton variant="ghost" size="md">
                {t("login")}
              </AppButton>
            </Link>
            <Link href="/signup">
              <AppButton variant="primary" size="md">
                {t("getStarted")}
              </AppButton>
            </Link>
          </div>

          {/* Mobile: locale switcher + hamburger */}
          <div className="flex lg:hidden items-center gap-[0.75em]">
            <LocaleSwitcher />
            <button
              type="button"
              onClick={() => setDrawerOpen(true)}
              aria-label="Open navigation menu"
              className={cn(
                "flex items-center justify-center w-[2.5em] h-[2.5em] rounded-[0.5em]",
                "text-text-secondary hover:text-text hover:bg-surface-hover",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[--accent-border]",
                "transition-colors duration-150"
              )}
            >
              <Menu size={20} strokeWidth={1.5} />
            </button>
          </div>

        </div>
      </header>

      {/* Spacer so content starts below fixed navbar */}
      <div className="h-[4em]" aria-hidden="true" />

      <NavDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </>
  );
}
