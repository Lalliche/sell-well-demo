import { getTranslations } from "next-intl/server";
import CTABannerClient from "./CTABannerClient";

export default async function CTABanner() {
  const t = await getTranslations("CTABanner");

  return (
    <section className="bg-bg py-[6em]">
      <div className="max-w-[78em] mx-auto px-[2em]">
        <CTABannerClient
          overline={t("overline")}
          headline={t("headline")}
          subcopy={t("subcopy")}
          ctaCompany={t("ctaCompany")}
          ctaPartner={t("ctaPartner")}
          reassurance={t("reassurance")}
        />
      </div>
    </section>
  );
}
