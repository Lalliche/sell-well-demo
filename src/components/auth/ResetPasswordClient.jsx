"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { ArrowRight, CheckCircle2, AlertCircle } from "lucide-react";
import { Link, useRouter } from "@/i18n/navigation";
import AppButton from "@/components/ui/Buttons";
import { TextInput } from "@/components/ui/FormInputs";
import { resetPassword } from "@/lib/mock/auth";

export default function ResetPasswordClient() {
  const t = useTranslations("Auth.ResetPassword");
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [passwordError, setPasswordError] = useState(null);
  const [confirmError, setConfirmError] = useState(null);
  const [success, setSuccess] = useState(false);

  const resetMutation = useMutation({
    mutationFn: resetPassword,
    onSuccess: () => setSuccess(true),
  });

  // Treat absent / "invalid" tokens as the invalid state.
  const isInvalidToken = !token || token === "invalid";

  if (isInvalidToken) {
    return (
      <div className="flex flex-col gap-[1.25em] text-center">
        <div className="flex items-center justify-center w-[3.5em] h-[3.5em] rounded-full bg-bg-alt mx-auto">
          <AlertCircle size="2em" strokeWidth={1.5} className="text-[var(--color-status-pending-text)]" />
        </div>
        <div className="flex flex-col gap-[0.5em]">
          <h1 className="font-heading font-bold text-[1.5em] tracking-[-0.02em] text-text leading-[1.2]">
            {t("invalidHeading")}
          </h1>
          <p className="text-[0.9375em] text-text-secondary leading-[1.5]">{t("invalidBody")}</p>
        </div>
        <Link href="/forgot-password">
          <AppButton variant="primary" size="md" className="w-full">
            {t("invalidCta")}
          </AppButton>
        </Link>
      </div>
    );
  }

  if (success) {
    return (
      <div className="flex flex-col gap-[1.25em] text-center">
        <div className="flex items-center justify-center w-[3.5em] h-[3.5em] rounded-full bg-bg-alt mx-auto">
          <CheckCircle2 size="2em" strokeWidth={1.5} className="text-[var(--color-status-approved-text)]" />
        </div>
        <div className="flex flex-col gap-[0.5em]">
          <h1 className="font-heading font-bold text-[1.5em] tracking-[-0.02em] text-text leading-[1.2]">
            {t("successHeading")}
          </h1>
          <p className="text-[0.9375em] text-text-secondary leading-[1.5]">{t("successBody")}</p>
        </div>
        <AppButton
          variant="primary"
          size="md"
          className="w-full"
          onClick={() => router.push("/login")}
        >
          {t("successCta")}
        </AppButton>
      </div>
    );
  }

  const handleSubmit = (e) => {
    e.preventDefault();
    let ok = true;
    if (password.length < 8) {
      setPasswordError(t("errorPasswordLength"));
      ok = false;
    } else setPasswordError(null);
    if (confirm !== password) {
      setConfirmError(t("errorPasswordMatch"));
      ok = false;
    } else setConfirmError(null);
    if (!ok) return;
    resetMutation.mutate({ token, password });
  };

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
          type="password"
          label={t("passwordLabel")}
          value={password}
          onChange={setPassword}
          placeholder={t("passwordPlaceholder")}
          required
          errorMessage={passwordError}
        />
        <TextInput
          type="password"
          label={t("confirmLabel")}
          value={confirm}
          onChange={setConfirm}
          placeholder={t("confirmPlaceholder")}
          required
          errorMessage={confirmError}
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
    </div>
  );
}
