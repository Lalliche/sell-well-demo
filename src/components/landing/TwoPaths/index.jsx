import { getTranslations } from "next-intl/server";
import TwoPathsClient from "./TwoPathsClient";

export default async function TwoPaths() {
  const t = await getTranslations("TwoPaths");

  return (
    <section className="bg-surface py-[6em]">
      <div className="max-w-[78em] mx-auto px-[2em]">
        <TwoPathsClient
          overline={t("overline")}
          headline={t("headline")}
          companyEyebrow={t("companyEyebrow")}
          companyHeading={t("companyHeading")}
          companyBody={t("companyBody")}
          companyB1={t("companyB1")}
          companyB2={t("companyB2")}
          companyB3={t("companyB3")}
          companyCta={t("companyCta")}
          partnerEyebrow={t("partnerEyebrow")}
          partnerHeading={t("partnerHeading")}
          partnerBody={t("partnerBody")}
          partnerB1={t("partnerB1")}
          partnerB2={t("partnerB2")}
          partnerB3={t("partnerB3")}
          partnerCta={t("partnerCta")}
        />
      </div>
    </section>
  );
}
