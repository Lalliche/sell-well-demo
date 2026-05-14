"use client";

/**
 * EscrowWithdrawRouter — role branch for /escrow/withdraw.
 *
 * Companies see EscrowWithdrawPage. Partners SPA-redirect to
 * /earnings (where they request commission payouts via the same
 * underlying WithdrawalRequest mechanism — Phase 6.9). Admins see a
 * forwarder.
 *
 * Will collapse into role-prefixed routes during the Option B
 * refactor noted at the top of CLAUDE.md.
 */

import { useEffect } from "react";
import { useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";
import { useAuth } from "@/components/providers/AuthProvider";
import EscrowWithdrawPage from "./EscrowWithdrawPage";

export default function EscrowWithdrawRouter() {
  const { user, ready } = useAuth();
  const router = useRouter();
  const t = useTranslations("Escrow.adminForward");

  useEffect(() => {
    if (!ready) return;
    if (user?.role === "sales_partner") router.replace("/earnings");
  }, [ready, user?.role, router]);

  if (!ready) return null;
  if (!user) return null;
  if (user.role === "company") return <EscrowWithdrawPage />;
  if (user.role === "sales_partner") return null;

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
