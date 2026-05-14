"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useMutation } from "@tanstack/react-query";
import { ArrowRight, Mail, Clock } from "lucide-react";
import { Link, useRouter } from "@/i18n/navigation";
import AppButton from "@/components/ui/Buttons";
import { TextInput } from "@/components/ui/FormInputs";
import { useAuth } from "@/components/providers/AuthProvider";
import GoogleIcon from "./GoogleIcon";
import MorphAuthButton from "./MorphAuthButton";

export default function LoginClient() {
  const t = useTranslations("Auth.Login");
  const tCommon = useTranslations("Common");
  const router = useRouter();
  const { login } = useAuth();

  const [emailExpanded, setEmailExpanded] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [formError, setFormError] = useState(null);
  const [showComingSoon, setShowComingSoon] = useState(false);

  const loginMutation = useMutation({
    mutationFn: ({ email, password }) => login(email, password),
    onSuccess: (user) => {
      if (!user) {
        setFormError(t("errorInvalid"));
        return;
      }
      router.push("/dashboard");
    },
    onError: () => setFormError(t("errorGeneric")),
  });

  const handleGoogle = () => {
    setShowComingSoon(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setFormError(null);
    if (!email || !password) {
      setFormError(t("errorInvalid"));
      return;
    }
    loginMutation.mutate({ email, password });
  };

  return (
    <div className="flex flex-col gap-[1.5em]">
      {/* Coming soon modal for Google sign-in */}
      {showComingSoon && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ backdropFilter: "blur(4px)", WebkitBackdropFilter: "blur(4px)", background: "rgba(26,26,26,0.4)" }}
          onClick={() => setShowComingSoon(false)}
        >
          <div
            className="bg-surface rounded-[0.75em] p-[2em] shadow-xl flex flex-col gap-[1em] max-w-[22em] w-full mx-[1em]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-[0.625em]">
              <div className="flex items-center justify-center w-[2.5em] h-[2.5em] rounded-full bg-accent-light shrink-0">
                <Clock size="1.125em" strokeWidth={1.5} className="text-accent" />
              </div>
              <h2 className="font-heading font-semibold text-[1.0625em] text-text">
                {tCommon("comingSoonTitle")}
              </h2>
            </div>
            <p className="text-[0.875em] text-text-secondary leading-normal">
              {tCommon("comingSoonBody")}
            </p>
            <AppButton
              variant="secondary"
              size="sm"
              className="self-end"
              onClick={() => setShowComingSoon(false)}
            >
              {tCommon("close")}
            </AppButton>
          </div>
        </div>
      )}

      {/* Heading */}
      <div className="flex flex-col gap-[0.375em] text-center">
        <h1 className="font-heading font-bold text-[1.5em] tracking-[-0.02em] text-text leading-[1.2]">
          {t("heading")}
        </h1>
      </div>

      {/* Auth method stack */}
      <div className="flex flex-col gap-[0.625em]">
        {/* Google — fades out via CSS when email expands. No layout animation
            on this sibling, so it doesn't compete with the morph. */}
        <button
          type="button"
          onClick={handleGoogle}
          disabled={loginMutation.isPending || emailExpanded}
          aria-hidden={emailExpanded}
          tabIndex={emailExpanded ? -1 : 0}
          style={{
            opacity: emailExpanded ? 0 : 1,
            maxHeight: emailExpanded ? 0 : "2.875em",
            marginBottom: emailExpanded ? "-0.625em" : 0,
            pointerEvents: emailExpanded ? "none" : "auto",
            transition:
              "opacity 180ms ease-out, max-height 280ms ease-out, margin-bottom 280ms ease-out",
          }}
          className="w-full h-[2.875em] overflow-hidden flex items-center justify-center gap-[0.5em] bg-surface border border-border rounded-[0.625em] text-[0.9375em] font-medium text-text font-body hover:bg-surface-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <GoogleIcon size="1.125em" />
          <span>{t("google")}</span>
        </button>

        {/* Email morph button */}
        <MorphAuthButton
          id="login-email-morph"
          expanded={emailExpanded}
          onExpand={() => setEmailExpanded(true)}
          onCollapse={() => {
            setEmailExpanded(false);
            setFormError(null);
          }}
          icon={<Mail size="1.125em" strokeWidth={1.5} />}
          label={t("email")}
          title={t("email")}
        >
          <form onSubmit={handleSubmit} className="flex flex-col gap-[0.75em]">
            <TextInput
              type="email"
              label={null}
              placeholder={t("emailPlaceholder")}
              value={email}
              onChange={setEmail}
              required
            />
            <TextInput
              type="password"
              label={null}
              placeholder={t("passwordPlaceholder")}
              value={password}
              onChange={setPassword}
              required
              errorMessage={formError}
            />
            <AppButton
              type="submit"
              variant="primary"
              size="md"
              isLoading={loginMutation.isPending}
              className="w-full mt-[0.25em]"
            >
              {t("submit")}
              <ArrowRight size="1em" strokeWidth={2} />
            </AppButton>
            <Link
              href="/forgot-password"
              className="self-center text-[0.8125em] text-text-secondary hover:text-text underline underline-offset-2 decoration-border hover:decoration-text transition-colors mt-[0.125em]"
            >
              {t("forgot")}
            </Link>
          </form>
        </MorphAuthButton>
      </div>

      {/* Switch link */}
      <p className="text-center text-[0.8125em] text-text-secondary">
        {t("switchPrompt")}{" "}
        <Link
          href="/signup"
          className="text-text font-medium underline underline-offset-2 decoration-border hover:decoration-text transition-colors"
        >
          {t("switchCta")}
        </Link>
      </p>
    </div>
  );
}
