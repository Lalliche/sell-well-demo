"use client";

/**
 * Email-not-verified pill. Click → popover with the full text and a
 * "Resend" button. Mirrors the original AuthBanners EmailBanner logic
 * (resendMutation flips a one-shot `resent` flag) but with the new
 * compact UI.
 */

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useMutation } from "@tanstack/react-query";
import { Mail } from "lucide-react";
import AppButton from "@/components/ui/Buttons";
import BannerPill from "./BannerPill";
import { verifyEmail } from "@/lib/mock/auth";

export default function EmailBanner({ email }) {
  const t = useTranslations("Auth.Banners.email");
  const [resent, setResent] = useState(false);

  const resendMutation = useMutation({
    mutationFn: verifyEmail,
    onSuccess: () => setResent(true),
  });

  return (
    <BannerPill
      icon={<Mail size="0.875em" strokeWidth={1.75} />}
      iconBg="bg-accent-light"
      iconColor="text-accent"
      pillTitle={t("pillTitle")}
      title={t("title")}
      body={t("body", { email })}
      ariaLabel={t("title")}
      action={
        <AppButton
          variant="secondary"
          size="sm"
          isLoading={resendMutation.isPending}
          disabled={resent}
          onClick={() => resendMutation.mutate({ email })}
        >
          {resent ? t("resent") : t("cta")}
        </AppButton>
      }
    />
  );
}
