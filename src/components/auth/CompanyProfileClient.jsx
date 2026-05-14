"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { motion } from "motion/react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { ArrowLeft, ArrowRight, Building2, Image as ImageIcon } from "lucide-react";
import { useRouter } from "@/i18n/navigation";
import AppButton from "@/components/ui/Buttons";
import {
  TextInput,
  TextArea,
  DropdownInput,
  FileInput,
} from "@/components/ui/FormInputs";
import { fetchCategories } from "@/lib/mock/campaigns";
import { saveCompanyProfile } from "@/lib/mock/auth";
import StepIndicator from "./StepIndicator";
import StepBody from "./StepBody";

const URL_RE = /^https?:\/\/.+/i;

export default function CompanyProfileClient() {
  const t = useTranslations("Auth.CompanyProfile");
  const router = useRouter();

  const STEPS = [
    { icon: Building2, label: t("stepIdentityLabel") },
    { icon: ImageIcon, label: t("stepStoryLabel") },
  ];

  const { data: categories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: fetchCategories,
  });

  const [currentStep, setCurrentStep] = useState(0);

  const [companyName, setCompanyName] = useState("");
  const [industryId, setIndustryId] = useState(null);
  const [website, setWebsite] = useState("");
  const [description, setDescription] = useState("");
  const [logo, setLogo] = useState(null);

  const [errors, setErrors] = useState({});

  const submitMutation = useMutation({
    mutationFn: saveCompanyProfile,
    onSuccess: () => router.push("/verify-email?state=sent"),
  });

  const validateStep = (step) => {
    const next = { ...errors };
    let ok = true;

    if (step === 0) {
      if (!companyName.trim())              { next.companyName = t("errorRequired"); ok = false; } else delete next.companyName;
      if (!industryId)                       { next.industry    = t("errorRequired"); ok = false; } else delete next.industry;
      if (website && !URL_RE.test(website))  { next.website     = t("errorWebsite");  ok = false; } else delete next.website;
    }
    if (step === 1) {
      if (!description.trim()) { next.description = t("errorRequired"); ok = false; } else delete next.description;
      if (!logo)                { next.logo        = t("errorRequired"); ok = false; } else delete next.logo;
    }

    setErrors(next);
    return ok;
  };

  const goNext = () => {
    if (!validateStep(currentStep)) return;
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      submitMutation.mutate({ companyName, industryId, website, description, logo });
    }
  };

  const goBack = () => {
    if (currentStep === 0) {
      router.back();
      return;
    }
    setCurrentStep(currentStep - 1);
  };

  const industryOptions = categories.map((c) => ({ value: String(c.id), label: c.name_en }));
  const isLastStep = currentStep === STEPS.length - 1;

  return (
    <div className="flex flex-col gap-[1.5em]">
      <StepIndicator
        steps={STEPS}
        currentStep={currentStep}
        pillId="company-profile-pill"
      />

      <motion.div
        layout
        style={{ originY: 0, transformOrigin: "top center" }}
        transition={{ type: "spring", stiffness: 280, damping: 34, mass: 1.0 }}
        className="bg-surface border border-border rounded-[0.625em]"
      >
        <div className="p-[1.75em] flex flex-col gap-[1em]">
          <StepBody stepKey={`heading-${currentStep}`}>
            <div className="flex flex-col gap-[0.375em] text-center">
              <h1 className="font-heading font-bold text-[1.25em] tracking-[-0.02em] text-text leading-[1.2]">
                {[t("stepIdentityHeading"), t("stepStoryHeading")][currentStep]}
              </h1>
              <p className="text-[0.8125em] text-text-secondary">
                {[t("stepIdentitySub"), t("stepStorySub")][currentStep]}
              </p>
            </div>
          </StepBody>

          <StepBody stepKey={`fields-${currentStep}`}>
            {currentStep === 0 && (
              <>
                <TextInput
                  label={t("companyNameLabel")}
                  value={companyName}
                  onChange={setCompanyName}
                  required
                  errorMessage={errors.companyName}
                />
                <DropdownInput
                  label={t("industryLabel")}
                  options={industryOptions}
                  value={industryId}
                  onChange={setIndustryId}
                  placeholder={t("industryPlaceholder")}
                  required
                  errorMessage={errors.industry}
                />
                <TextInput
                  type="url"
                  label={t("websiteLabel")}
                  value={website}
                  onChange={setWebsite}
                  placeholder={t("websitePlaceholder")}
                  errorMessage={errors.website}
                />
              </>
            )}

            {currentStep === 1 && (
              <>
                <TextArea
                  label={t("descriptionLabel")}
                  value={description}
                  onChange={setDescription}
                  placeholder={t("descriptionPlaceholder")}
                  rows={4}
                  required
                  errorMessage={errors.description}
                />
                <FileInput
                  label={t("logoLabel")}
                  value={logo}
                  onChange={setLogo}
                  accept="image/png,image/jpeg,image/svg+xml"
                  maxSizeMb={5}
                  required
                  errorMessage={errors.logo}
                  variant="image"
                />
              </>
            )}
          </StepBody>

          <div className="flex items-center justify-between gap-[0.75em] pt-[0.5em]">
            <AppButton
              variant="ghost"
              size="md"
              onClick={goBack}
              type="button"
            >
              <ArrowLeft size="1em" strokeWidth={2} />
              {t("back")}
            </AppButton>
            <AppButton
              variant="primary"
              size="md"
              type="button"
              onClick={goNext}
              isLoading={submitMutation.isPending}
            >
              {isLastStep ? t("submit") : t("continue")}
              <ArrowRight size="1em" strokeWidth={2} />
            </AppButton>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
