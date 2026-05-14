"use client";

import { useQuery } from "@tanstack/react-query";
import { useTranslations, useLocale } from "next-intl";
import { TextInput, TextArea, FileInput, DropdownInput } from "@/components/ui/FormInputs";
import { fetchCategories, fetchProductTags } from "@/lib/mock/campaigns";
import StepSection from "./StepSection";

export default function Step1ProductDetails({ form, setForm, errors = {}, clearError }) {
  const t = useTranslations("Campaigns.wizard.step1");
  const locale = useLocale();

  const { data: categories = [] } = useQuery({ queryKey: ["categories"], queryFn: fetchCategories });
  const { data: productTags = [] } = useQuery({ queryKey: ["product-tags"], queryFn: fetchProductTags });

  const categoryOptions = categories.map((c) => ({
    value: c.id,
    label: locale === "fr" ? c.name_fr : c.name_en,
  }));
  const tagOptions = productTags.map((tag) => ({
    value: tag.id,
    label: locale === "fr" ? tag.name_fr : tag.name_en,
  }));

  const patch = (key) => (val) => {
    clearError?.(key);
    setForm((f) => ({ ...f, [key]: val }));
  };

  return (
    <div className="flex flex-col gap-[1.5em]">
      <StepSection title={t("sectionProduct")}>
        <TextInput
          label={t("productName")}
          placeholder={t("productNamePlaceholder")}
          value={form.product_name}
          onChange={patch("product_name")}
          required
          errorMessage={errors.product_name}
        />
        <TextArea
          label={t("description")}
          placeholder={t("descriptionPlaceholder")}
          value={form.description}
          onChange={patch("description")}
          rows={4}
          required
          errorMessage={errors.description}
        />
        <FileInput
          label={t("productImage")}
          value={form.product_image}
          onChange={patch("product_image")}
          accept="image/jpeg,image/png,image/webp"
          maxSizeMb={5}
          variant="image"
          helperText={t("productImageHelper")}
          errorMessage={errors.product_image}
          required
        />
      </StepSection>

      <StepSection title={t("sectionClassification")}>
        <DropdownInput
          label={t("category")}
          options={categoryOptions}
          value={form.category}
          onChange={patch("category")}
          required
          errorMessage={errors.category}
        />
        <DropdownInput
          label={t("productTags")}
          options={tagOptions}
          value={form.product_tags}
          onChange={patch("product_tags")}
          multi
          helperText={t("productTagsHelper")}
        />
        <DropdownInput
          label={t("targetIndustries")}
          options={categoryOptions}
          value={form.target_industries}
          onChange={patch("target_industries")}
          multi
        />
      </StepSection>

      <StepSection title={t("sectionRequirements")} optional>
        <TextArea
          label={t("requirements")}
          placeholder={t("requirementsPlaceholder")}
          value={form.requirements}
          onChange={patch("requirements")}
          rows={3}
        />
      </StepSection>
    </div>
  );
}
