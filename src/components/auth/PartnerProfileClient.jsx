"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { motion } from "motion/react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { ArrowLeft, ArrowRight, User, BookOpen, Tag, Upload } from "lucide-react";
import { useRouter } from "@/i18n/navigation";
import AppButton from "@/components/ui/Buttons";
import {
  TextInput,
  TextArea,
  DropdownInput,
  FileInput,
} from "@/components/ui/FormInputs";
import { fetchCategories, fetchSkillTags } from "@/lib/mock/campaigns";
import { savePartnerProfile } from "@/lib/mock/auth";
import StepIndicator from "./StepIndicator";
import StepBody from "./StepBody";

const LINKEDIN_RE = /^https:\/\/(www\.)?linkedin\.com\/.+/i;

export default function PartnerProfileClient() {
  const t = useTranslations("Auth.PartnerProfile");
  const router = useRouter();

  const STEPS = [
    { icon: User,     label: t("stepIdentityLabel") },
    { icon: BookOpen, label: t("stepStoryLabel") },
    { icon: Tag,      label: t("stepTagsLabel") },
    { icon: Upload,   label: t("stepFilesLabel") },
  ];

  const { data: categories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: fetchCategories,
  });
  const { data: skillTags = [] } = useQuery({
    queryKey: ["skill-tags"],
    queryFn: fetchSkillTags,
  });

  const [currentStep, setCurrentStep] = useState(0);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [bio, setBio] = useState("");
  const [linkedin, setLinkedin] = useState("");
  const [categoryIds, setCategoryIds] = useState([]);
  const [skillIds, setSkillIds] = useState([]);
  const [photo, setPhoto] = useState(null);
  const [cv, setCv] = useState(null);

  const [errors, setErrors] = useState({});

  const submitMutation = useMutation({
    mutationFn: savePartnerProfile,
    onSuccess: () => router.push("/verify-email?state=sent"),
  });

  const validateStep = (step) => {
    const next = { ...errors };
    let ok = true;

    if (step === 0) {
      if (!firstName.trim()) { next.firstName = t("errorRequired"); ok = false; } else delete next.firstName;
      if (!lastName.trim())  { next.lastName  = t("errorRequired"); ok = false; } else delete next.lastName;
    }
    if (step === 1) {
      if (!bio.trim())                                         { next.bio      = t("errorRequired"); ok = false; } else delete next.bio;
      if (!linkedin || !LINKEDIN_RE.test(linkedin))            { next.linkedin = t("errorLinkedin"); ok = false; } else delete next.linkedin;
    }
    if (step === 2) {
      if (categoryIds.length === 0) { next.categories = t("errorRequired"); ok = false; } else delete next.categories;
      if (skillIds.length === 0)    { next.skills     = t("errorRequired"); ok = false; } else delete next.skills;
    }
    if (step === 3) {
      if (!photo) { next.photo = t("errorRequired"); ok = false; } else delete next.photo;
      if (!cv)    { next.cv    = t("errorRequired"); ok = false; } else delete next.cv;
    }

    setErrors(next);
    return ok;
  };

  const goNext = () => {
    if (!validateStep(currentStep)) return;
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      submitMutation.mutate({
        firstName, lastName, phone, bio, linkedin,
        categoryIds, skillIds, photo, cv,
      });
    }
  };

  const goBack = () => {
    if (currentStep === 0) {
      router.back();
      return;
    }
    setCurrentStep(currentStep - 1);
  };

  const categoryOptions = categories.map((c) => ({ value: String(c.id), label: c.name_en }));
  const skillOptions = skillTags.map((s) => ({ value: String(s.id), label: s.name_en }));

  const isLastStep = currentStep === STEPS.length - 1;

  return (
    <div className="flex flex-col gap-[1.5em]">
      {/* Step indicator */}
      <StepIndicator
        steps={STEPS}
        currentStep={currentStep}
        pillId="partner-profile-pill"
      />

      {/* Card with morphing height — grows downward only (originY: 0)
          so the step indicator above stays anchored. */}
      <motion.div
        layout
        style={{ originY: 0, transformOrigin: "top center" }}
        transition={{ type: "spring", stiffness: 280, damping: 34, mass: 1.0 }}
        className="bg-surface border border-border rounded-[0.625em]"
      >
        <div className="p-[1.75em] flex flex-col gap-[1em]">
          {/* Heading area */}
          <StepBody stepKey={`heading-${currentStep}`}>
            <div className="flex flex-col gap-[0.375em] text-center">
              <h1 className="font-heading font-bold text-[1.25em] tracking-[-0.02em] text-text leading-[1.2]">
                {[t("stepIdentityHeading"), t("stepStoryHeading"), t("stepTagsHeading"), t("stepFilesHeading")][currentStep]}
              </h1>
              <p className="text-[0.8125em] text-text-secondary">
                {[t("stepIdentitySub"), t("stepStorySub"), t("stepTagsSub"), t("stepFilesSub")][currentStep]}
              </p>
            </div>
          </StepBody>

          {/* Step body */}
          <StepBody stepKey={`fields-${currentStep}`}>
            {currentStep === 0 && (
              <>
                <TextInput
                  label={t("firstNameLabel")}
                  value={firstName}
                  onChange={setFirstName}
                  required
                  errorMessage={errors.firstName}
                />
                <TextInput
                  label={t("lastNameLabel")}
                  value={lastName}
                  onChange={setLastName}
                  required
                  errorMessage={errors.lastName}
                />
                <TextInput
                  type="tel"
                  label={t("phoneLabel")}
                  value={phone}
                  onChange={setPhone}
                  placeholder={t("phonePlaceholder")}
                />
              </>
            )}

            {currentStep === 1 && (
              <>
                <TextArea
                  label={t("bioLabel")}
                  value={bio}
                  onChange={setBio}
                  placeholder={t("bioPlaceholder")}
                  rows={4}
                  required
                  errorMessage={errors.bio}
                />
                <TextInput
                  type="url"
                  label={t("linkedinLabel")}
                  value={linkedin}
                  onChange={setLinkedin}
                  placeholder={t("linkedinPlaceholder")}
                  required
                  errorMessage={errors.linkedin}
                />
              </>
            )}

            {currentStep === 2 && (
              <>
                <DropdownInput
                  label={t("categoriesLabel")}
                  options={categoryOptions}
                  value={categoryIds}
                  onChange={setCategoryIds}
                  multi
                  placeholder={t("categoriesPlaceholder")}
                  required
                  errorMessage={errors.categories}
                />
                <DropdownInput
                  label={t("skillsLabel")}
                  options={skillOptions}
                  value={skillIds}
                  onChange={setSkillIds}
                  multi
                  placeholder={t("skillsPlaceholder")}
                  required
                  errorMessage={errors.skills}
                />
              </>
            )}

            {currentStep === 3 && (
              <>
                <FileInput
                  label={t("photoLabel")}
                  value={photo}
                  onChange={setPhoto}
                  accept="image/png,image/jpeg"
                  maxSizeMb={5}
                  required
                  errorMessage={errors.photo}
                  variant="image"
                />
                <FileInput
                  label={t("cvLabel")}
                  value={cv}
                  onChange={setCv}
                  accept=".pdf,.docx"
                  maxSizeMb={10}
                  required
                  errorMessage={errors.cv}
                  helperText={t("cvHelper")}
                />
              </>
            )}
          </StepBody>

          {/* Actions — outside StepBody so they stay mounted across steps */}
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
