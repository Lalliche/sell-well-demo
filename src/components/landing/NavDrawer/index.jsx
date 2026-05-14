"use client";

import { useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import { usePathname, Link } from "@/i18n/navigation";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import AppButton from "@/components/ui/Buttons";
import LocaleSwitcher from "@/components/shared/LocaleSwitcher";

const NAV_LINKS = [
  { key: "home", href: "/" },
  { key: "howItWorks", href: "/#how-it-works" },
  { key: "faq", href: "/#faq" },
];

export default function NavDrawer({ open, onClose }) {
  const t = useTranslations("Nav");
  const pathname = usePathname();
  const closeRef = useRef(null);
  const firstFocusRef = useRef(null);

  // Scroll lock
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
      // Delay focus so transition has started
      const raf = requestAnimationFrame(() => closeRef.current?.focus());
      return () => {
        cancelAnimationFrame(raf);
        document.body.style.overflow = "";
      };
    } else {
      document.body.style.overflow = "";
    }
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  return (
    <>
      {/* Backdrop */}
      <div
        aria-hidden="true"
        onClick={onClose}
        className={cn(
          "fixed inset-0 z-50 bg-text/40 backdrop-blur-[4px]",
          "transition-opacity duration-250 ease-out",
          open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        )}
      />

      {/* Drawer panel */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Navigation menu"
        className={cn(
          "fixed top-0 left-0 bottom-0 z-50 w-[min(18em,85vw)]",
          "bg-surface border-r border-border-light shadow-xl",
          "flex flex-col",
          "transition-transform duration-300 ease-out",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Drawer header */}
        <div className="flex items-center justify-between px-[1.5em] h-[4em] border-b border-border-light shrink-0">
          <Link href="/" onClick={onClose} className="font-heading font-bold text-[1.125em] tracking-[-0.02em] text-text">
            Sell<span className="text-accent">Well</span>
          </Link>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label="Close navigation menu"
            className={cn(
              "flex items-center justify-center w-[2.5em] h-[2.5em] rounded-[0.5em]",
              "text-text-secondary hover:text-text hover:bg-surface-hover",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[--accent-border]",
              "transition-colors duration-150"
            )}
          >
            <X size={18} strokeWidth={1.5} />
          </button>
        </div>

        {/* Nav links */}
        <nav className="flex flex-col gap-[0.25em] p-[1em] flex-1">
          {NAV_LINKS.map(({ key, href }) => (
            <Link
              key={key}
              href={href}
              onClick={onClose}
              className={cn(
                "flex items-center h-[2.75em] px-[0.875em] rounded-[0.5em]",
                "text-[0.9375em] font-medium",
                "transition-colors duration-150",
                pathname === href
                  ? "bg-accent-light text-accent-text"
                  : "text-text-secondary hover:bg-surface-hover hover:text-text",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[--accent-border]"
              )}
            >
              {t(key)}
            </Link>
          ))}
        </nav>

        {/* Footer actions */}
        <div className="flex flex-col gap-[0.75em] p-[1.5em] border-t border-border-light shrink-0">
          <div className="flex justify-start">
            <LocaleSwitcher />
          </div>
          <Link href="/login" onClick={onClose} className="w-full">
            <AppButton variant="secondary" size="md" className="w-full justify-center">
              {t("login")}
            </AppButton>
          </Link>
          <Link href="/signup" onClick={onClose} className="w-full">
            <AppButton variant="primary" size="md" className="w-full justify-center">
              {t("getStarted")}
            </AppButton>
          </Link>
        </div>
      </div>
    </>
  );
}
