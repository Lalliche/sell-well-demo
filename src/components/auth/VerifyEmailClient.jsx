"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { Mail, CheckCircle2, AlertCircle, Lock } from "lucide-react";
import { Link, useRouter } from "@/i18n/navigation";
import AppButton from "@/components/ui/Buttons";
import { verifyEmail, fetchCurrentUser } from "@/lib/mock/auth";

const STATES = ["sent", "success", "expired", "already"];

export default function VerifyEmailClient() {
  const t = useTranslations("Auth.VerifyEmail");
  const searchParams = useSearchParams();
  const router = useRouter();

  const stateParam = searchParams.get("state");
  const state = STATES.includes(stateParam) ? stateParam : "sent";
  const email = searchParams.get("email") || t("fallbackEmail");

  const [resent, setResent] = useState(false);
  const [goingToDash, setGoingToDash] = useState(false);

  const handleDashboard = async () => {
    setGoingToDash(true);
    // Ensure Supabase session is resolved + role cookie is set
    // before the middleware-guarded /dashboard route is hit.
    await fetchCurrentUser();
    router.push("/dashboard");
  };

  const resendMutation = useMutation({
    mutationFn: verifyEmail,
    onSuccess: () => setResent(true),
  });

  if (state === "success") {
    return (
      <Card
        icon={<CheckCircle2 size="2em" strokeWidth={1.5} className="text-[var(--color-status-approved-text)]" />}
        heading={t("successHeading")}
        body={t("successBody")}
      >
        <Link href="/dashboard">
          <AppButton variant="primary" size="md" className="w-full">
            {t("successCta")}
          </AppButton>
        </Link>
      </Card>
    );
  }

  if (state === "expired") {
    return (
      <Card
        icon={<AlertCircle size="2em" strokeWidth={1.5} className="text-[var(--color-status-pending-text)]" />}
        heading={t("expiredHeading")}
        body={t("expiredBody")}
      >
        <AppButton
          variant="primary"
          size="md"
          className="w-full"
          isLoading={resendMutation.isPending}
          onClick={() => resendMutation.mutate({ email })}
        >
          {resent ? t("sentResent") : t("expiredCta")}
        </AppButton>
      </Card>
    );
  }

  if (state === "already") {
    return (
      <Card
        icon={<Lock size="2em" strokeWidth={1.5} className="text-text-muted" />}
        heading={t("alreadyHeading")}
        body={t("alreadyBody")}
      >
        <Link href="/login">
          <AppButton variant="primary" size="md" className="w-full">
            {t("alreadyCta")}
          </AppButton>
        </Link>
      </Card>
    );
  }

  // default: sent
  return (
    <Card
      icon={<Mail size="2em" strokeWidth={1.5} className="text-accent" />}
      heading={t("sentHeading")}
      body={t("sentBody")}
    >
      <div className="flex flex-col items-center gap-[0.75em] w-full">
        <AppButton
          variant="primary"
          size="md"
          className="w-full"
          isLoading={resendMutation.isPending}
          disabled={resent}
          onClick={() => resendMutation.mutate({ email })}
        >
          {resent ? t("sentResent") : t("sentResend")}
        </AppButton>
        <AppButton
          variant="secondary"
          size="md"
          className="w-full"
          isLoading={goingToDash}
          onClick={handleDashboard}
        >
          {t("sentDashboardCta")}
        </AppButton>
        <Link
          href="/login"
          className="text-[0.8125em] text-text-muted hover:text-text underline underline-offset-2 decoration-border hover:decoration-text transition-colors"
        >
          {t("sentLoginCta")}
        </Link>
      </div>
    </Card>
  );
}

function Card({ icon, heading, body, children }) {
  return (
    <div className="flex flex-col gap-[1.25em] text-center">
      <div className="flex items-center justify-center w-[3.5em] h-[3.5em] rounded-full bg-bg-alt mx-auto">
        {icon}
      </div>
      <div className="flex flex-col gap-[0.5em]">
        <h1 className="font-heading font-bold text-[1.5em] tracking-[-0.02em] text-text leading-[1.2]">
          {heading}
        </h1>
        <p className="text-[0.9375em] text-text-secondary leading-[1.5]">{body}</p>
      </div>
      {children}
    </div>
  );
}
