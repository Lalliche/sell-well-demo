"use client";

/**
 * EditOverviewSection — overview-tab fields inside the CampaignEditOverlay.
 * Mirrors Step 1 of the wizard 1:1 — same fields, same order, same labels:
 *   product_name · description · product_image (cover, small thumbnail) ·
 *   category · product_tags · target_industries · requirements
 *
 * Cover image renders as a small ~10em-wide thumbnail (not the full
 * uploader width) so the overlay stays compact. The aspect-square preview
 * shipped by FileInput's variant="image" is constrained by a sized
 * wrapper.
 */

import { useQuery } from "@tanstack/react-query";
import { useTranslations, useLocale } from "next-intl";
import {
  TextInput,
  TextArea,
  DropdownInput,
  FileInput,
} from "@/components/ui/FormInputs";
import { fetchCategories, fetchProductTags } from "@/lib/mock/campaigns";

export default function EditOverviewSection({ form, patch, errors }) {
  const t = useTranslations("Campaigns.companyDetail.edit.overview");
  const locale = useLocale();

  const { data: categories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: fetchCategories,
  });
  const { data: productTags = [] } = useQuery({
    queryKey: ["product-tags"],
    queryFn: fetchProductTags,
  });

  const categoryOptions = categories.map((c) => ({
    value: c.id,
    label: locale === "fr" ? c.name_fr : c.name_en,
  }));
  const tagOptions = productTags.map((tag) => ({
    value: tag.id,
    label: locale === "fr" ? tag.name_fr : tag.name_en,
  }));
  // target_industries reuses the Category list — same shape as in the
  // wizard, so the company can re-select industries the product targets.
  const industryOptions = categoryOptions;

  return (
    <div className="flex flex-col gap-[1em]">
      <TextInput
        label={t("productName")}
        value={form.product_name ?? ""}
        onChange={patch("product_name")}
        required
        errorMessage={errors.product_name}
      />
      <TextArea
        label={t("description")}
        value={form.description ?? ""}
        onChange={patch("description")}
        rows={5}
        required
        errorMessage={errors.description}
      />

      {/* Cover image — wrapper is full-width with a sensible cap so the
          dropzone breathes and content never overflows. The square
          image preview shows once a file is picked. */}
      <div className="flex flex-col gap-[0.375em]">
        <span className="block text-[0.875em] font-medium text-text">
          {t("productImage")}
        </span>
        <div className="w-[70%] mx-auto">
          <FileInput
            value={form.product_image}
            onChange={patch("product_image")}
            accept="image/jpeg,image/png,image/webp"
            maxSizeMb={5}
            variant="image"
            errorMessage={errors.product_image}
          />
        </div>
        <span className="text-[0.75em] text-text-muted">
          {t("productImageHelper")}
        </span>
      </div>

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
        value={form.product_tags ?? []}
        onChange={patch("product_tags")}
        multi
        helperText={t("productTagsHelper")}
      />
      <DropdownInput
        label={t("targetIndustries")}
        options={industryOptions}
        value={form.target_industries ?? []}
        onChange={patch("target_industries")}
        multi
        helperText={t("targetIndustriesHelper")}
      />
      <TextArea
        label={t("requirements")}
        value={form.requirements ?? ""}
        onChange={patch("requirements")}
        rows={3}
        helperText={t("requirementsHelper")}
      />
    </div>
  );
}
