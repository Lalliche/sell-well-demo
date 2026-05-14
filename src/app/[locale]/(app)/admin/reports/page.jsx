"use client";

import { useTranslations } from "next-intl";
import ComingSoon from "@/components/shared/feedback/ComingSoon";

export default function Page() {
  const t = useTranslations("Admin.reports");
  return <ComingSoon eyebrow={t("eyebrow")} title={t("title")} body={t("body")} />;
}
