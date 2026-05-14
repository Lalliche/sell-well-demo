"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { motion } from "motion/react";
import { useMutation } from "@tanstack/react-query";
import { ArrowRight, Mail, Building2, Briefcase, ChevronRight, Clock } from "lucide-react";
import { Link, useRouter, usePathname } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import AppButton from "@/components/ui/Buttons";
import { TextInput } from "@/components/ui/FormInputs";
import { signupCompany, signupPartner } from "@/lib/mock/auth";
import GoogleIcon from "./GoogleIcon";
import MorphAuthButton from "./MorphAuthButton";

const ROLES = [
  { id: "company", icon: Building2, titleKey: "roleCompanyTitle", blurbKey: "roleCompanyBlurb" },
  { id: "partner", icon: Briefcase, titleKey: "rolePartnerTitle", blurbKey: "rolePartnerBlurb" },
];

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function SignupClient() {
  const t = useTranslations("Auth.Signup");
  const tCommon = useTranslations("Common");
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Role is driven by the ?role= query param — single source of truth.
  // Back/forward buttons, refresh, and deep links all work for free.
  const roleParam = searchParams.get("role");
  const role = roleParam === "company" || roleParam === "partner" ? roleParam : null;

  const setRole = (next) => {
    if (next) {
      router.replace(`${pathname}?role=${next}`, { scroll: false });
    } else {
      router.replace(pathname, { scroll: false });
    }
  };

  const [emailExpanded, setEmailExpanded] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [emailError, setEmailError] = useState(null);
  const [passwordError, setPasswordError] = useState(null);
  const [confirmError, setConfirmError] = useState(null);
  const [showComingSoon, setShowComingSoon] = useState(false);

  const [signupError, setSignupError] = useState(null);

  const signupMutation = useMutation({
    mutationFn: async (payload) => {
      const result = role === "company"
        ? await signupCompany(payload)
        : await signupPartner(payload);
      // Treat { ok: false } as a thrown error so onError fires
      if (result?.ok === false) throw new Error(result.error ?? "Signup failed");
      return result;
    },
    onSuccess: () => {
      setSignupError(null);
      router.push(`/signup/profile?role=${role}`);
    },
    onError: (err) => {
      setSignupError(err.message);
    },
  });

  const handleGoogle = () => {
    setShowComingSoon(true);
  };

  const validate = () => {
    let ok = true;
    if (!EMAIL_RE.test(email)) {
      setEmailError(t("errorEmailFormat"));
      ok = false;
    } else setEmailError(null);

    if (password.length < 8) {
      setPasswordError(t("errorPasswordLength"));
      ok = false;
    } else setPasswordError(null);

    if (confirm !== password) {
      setConfirmError(t("errorPasswordMatch"));
      ok = false;
    } else setConfirmError(null);

    return ok;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;
    signupMutation.mutate({ email, password });
  };

  /* ───────────────── Step 0 — Role picker ───────────────── */
  if (!role) {
    return (
      <div className="flex flex-col gap-[1.5em]">
        <div className="flex flex-col gap-[0.5em] text-center">
          <h1 className="font-heading font-bold text-[1.5em] tracking-[-0.02em] text-text leading-[1.2]">
            {t("step0Heading")}
          </h1>
          <p className="text-[0.875em] text-text-secondary">
            {t("step0Subheading")}
          </p>
        </div>

        <div className="flex flex-col gap-[0.625em]">
          {ROLES.map(({ id, icon: Icon, titleKey, blurbKey }) => (
            <motion.button
              key={id}
              type="button"
              onClick={() => setRole(id)}
              whileHover={{ y: -1 }}
              whileTap={{ scale: 0.99 }}
              transition={{ type: "spring", stiffness: 520, damping: 40, mass: 0.9 }}
              className={cn(
                "group w-full text-left bg-surface border border-border rounded-[0.625em]",
                "p-[1em] flex items-center gap-[0.875em]",
                "transition-[background-color,box-shadow] duration-200 ease-out",
                "hover:bg-surface-hover hover:shadow-sm",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-1",
              )}
            >
              <span className="shrink-0 flex items-center justify-center w-[2.25em] h-[2.25em] rounded-[0.5em] bg-bg-alt text-text-secondary group-hover:bg-accent-light group-hover:text-accent transition-colors duration-200">
                <Icon size="1.125em" strokeWidth={1.5} />
              </span>
              <span className="flex-1 flex flex-col gap-[0.125em]">
                <span className="font-heading font-semibold text-[0.9375em] text-text leading-[1.2]">
                  {t(titleKey)}
                </span>
                <span className="text-[0.8125em] text-text-secondary leading-[1.4]">
                  {t(blurbKey)}
                </span>
              </span>
              <ChevronRight
                size="1em"
                strokeWidth={1.5}
                className="shrink-0 text-text-muted group-hover:text-text group-hover:translate-x-[0.125em] transition-[color,transform] duration-200"
              />
            </motion.button>
          ))}
        </div>

        <p className="text-center text-[0.8125em] text-text-secondary">
          {t("switchPrompt")}{" "}
          <Link
            href="/login"
            className="text-text font-medium underline underline-offset-2 decoration-border hover:decoration-text transition-colors"
          >
            {t("switchCta")}
          </Link>
        </p>
      </div>
    );
  }

  /* ───────────────── Step 1 — Email + password ───────────────── */
  const headingKey = role === "company" ? "step1HeadingCompany" : "step1HeadingPartner";

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
      {/* Heading row with change-role button */}
      <div className="flex flex-col gap-[0.5em] text-center">
        <h1 className="font-heading font-bold text-[1.5em] tracking-[-0.02em] text-text leading-[1.2]">
          {t(headingKey)}
        </h1>
        <button
          type="button"
          onClick={() => {
            setRole(null);
            setEmailExpanded(false);
          }}
          className="self-center text-[0.8125em] text-text-secondary hover:text-text underline underline-offset-2 decoration-border hover:decoration-text transition-colors"
        >
          {t("changeRole")}
        </button>
      </div>

      {/* Auth method stack */}
      <div className="flex flex-col gap-[0.625em]">
        {/* Google — fades out via CSS when email expands. No layout animation
            on this sibling, so it doesn't compete with the morph. */}
        <button
          type="button"
          onClick={handleGoogle}
          disabled={signupMutation.isPending || emailExpanded}
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

        <MorphAuthButton
          id="signup-email-morph"
          expanded={emailExpanded}
          onExpand={() => setEmailExpanded(true)}
          onCollapse={() => {
            setEmailExpanded(false);
            setEmailError(null);
            setPasswordError(null);
            setConfirmError(null);
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
              errorMessage={emailError}
            />
            <TextInput
              type="password"
              label={null}
              placeholder={t("passwordPlaceholder")}
              value={password}
              onChange={setPassword}
              required
              errorMessage={passwordError}
            />
            <TextInput
              type="password"
              label={null}
              placeholder={t("confirmPlaceholder")}
              value={confirm}
              onChange={setConfirm}
              required
              errorMessage={confirmError}
            />
            {signupError && (
              <p className="text-[0.8125em] text-[#B13B3B] text-center">{signupError}</p>
            )}
            <AppButton
              type="submit"
              variant="primary"
              size="md"
              isLoading={signupMutation.isPending}
              className="w-full mt-[0.25em]"
            >
              {t("submit")}
              <ArrowRight size="1em" strokeWidth={2} />
            </AppButton>
          </form>
        </MorphAuthButton>
      </div>

      {/* Switch link */}
      <p className="text-center text-[0.8125em] text-text-secondary">
        {t("switchPrompt")}{" "}
        <Link
          href="/login"
          className="text-text font-medium underline underline-offset-2 decoration-border hover:decoration-text transition-colors"
        >
          {t("switchCta")}
        </Link>
      </p>
    </div>
  );
}
