import { getTranslations } from "next-intl/server";
import HowItWorksClient from "./HowItWorksClient";

export default async function HowItWorks() {
  const t = await getTranslations("HowItWorks");

  return (
    <section id="how-it-works" className="bg-bg py-[6em]">
      <div className="max-w-[78em] mx-auto px-[2em]">
        <HowItWorksClient
          overline={t("overline")}
          headline={t("headline")}
          body={t("body")}
          ctaLabel={t("ctaLabel")}
          closeLabel={t("closeLabel")}
          stage1Title={t("stage1Title")} stage1Blurb={t("stage1Blurb")}
          stage1B1={t("stage1B1")} stage1B2={t("stage1B2")} stage1B3={t("stage1B3")}
          stage2Title={t("stage2Title")} stage2Blurb={t("stage2Blurb")}
          stage2B1={t("stage2B1")} stage2B2={t("stage2B2")} stage2B3={t("stage2B3")}
          stage3Title={t("stage3Title")} stage3Blurb={t("stage3Blurb")}
          stage3B1={t("stage3B1")} stage3B2={t("stage3B2")} stage3B3={t("stage3B3")}
          stage4Title={t("stage4Title")} stage4Blurb={t("stage4Blurb")}
          stage4B1={t("stage4B1")} stage4B2={t("stage4B2")} stage4B3={t("stage4B3")}
        />
      </div>
    </section>
  );
}
