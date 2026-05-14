"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useMutation } from "@tanstack/react-query";
import { ArrowLeft, ArrowRight, Mail } from "lucide-react";
import { Link } from "@/i18n/navigation";
import AppButton from "@/components/ui/Buttons";
import { TextInput } from "@/components/ui/FormInputs";
import { requestPasswordReset } from "@/lib/mock/auth";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function ForgotPasswordClient() {
  const t = useTranslations("Auth.ForgotPassword");
  const tSignup = useTranslations("Auth.Signup");

  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState(null);
  const [sent, setSent] = useState(false);

  const resetMutation = useMutation({
    mutationFn: requestPasswordReset,
    onSuccess: () => setSent(true),
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!EMAIL_RE.test(email)) {
      setEmailError(tSignup("errorEmailFormat"));
      return;
    }
    setEmailError(null);
    resetMutation.mutate({ email });
  };

  if (sent) {
    return (
      <div className="flex flex-col gap-[1.25em] text-center">
        <div className="flex items-center justify-center w-[3.5em] h-[3.5em] rounded-full bg-bg-alt mx-auto">
          <Mail size="2em" strokeWidth={1.5} className="text-accent" />
        </div>
        <div className="flex flex-col gap-[0.5em]">
          <h1 className="font-heading font-bold text-[1.5em] tracking-[-0.02em] text-text leading-[1.2]">
            {t("sentHeading")}
          </h1>
          <p className="text-[0.9375em] text-text-secondary leading-[1.5]">
            {t.rich("sentBody", {
              strong: (chunks) => <strong className="text-text font-semibold">{chunks}</strong>,
              email,
            })}
          </p>
        </div>
        <AppButton
          variant="secondary"
          size="md"
          className="w-full"
          onClick={() => resetMutation.mutate({ email })}
          isLoading={resetMutation.isPending}
        >
          {t("sentResend")}
        </AppButton>
        <Link
          href="/login"
          className="self-center text-[0.8125em] text-text-secondary hover:text-text underline underline-offset-2 decoration-border hover:decoration-text transition-colors"
        >
          {t("back")}
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-[1.5em]">
      <div className="flex flex-col gap-[0.5em] text-center">
        <h1 className="font-heading font-bold text-[1.5em] tracking-[-0.02em] text-text leading-[1.2]">
          {t("heading")}
        </h1>
        <p className="text-[0.875em] text-text-secondary">{t("subheading")}</p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="bg-surface border border-border rounded-[0.625em] p-[1.25em] flex flex-col gap-[0.875em]"
      >
        <TextInput
          type="email"
          label={t("emailLabel")}
          value={email}
          onChange={setEmail}
          placeholder={t("emailPlaceholder")}
          required
          errorMessage={emailError}
        />
        <AppButton
          type="submit"
          variant="primary"
          size="md"
          className="w-full"
          isLoading={resetMutation.isPending}
        >
          {t("submit")}
          <ArrowRight size="1em" strokeWidth={2} />
        </AppButton>
      </form>

      <Link
        href="/login"
        className="self-center inline-flex items-center gap-[0.375em] text-[0.8125em] text-text-secondary hover:text-text transition-colors"
      >
        <ArrowLeft size="0.875em" strokeWidth={2} />
        {t("back")}
      </Link>
    </div>
  );
}
