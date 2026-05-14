import { getTranslations } from "next-intl/server";
import SolutionClient from "./SolutionClient";

export default async function Solution() {
  const t = await getTranslations("Solution");

  return (
    <section className="bg-bg py-[6em]">
      <div className="max-w-[78em] mx-auto px-[2em]">
        <SolutionClient
          overline={t("overline")}
          headline={t("headline")}
          body={t("body")}
          bullet1={t("bullet1")}
          bullet2={t("bullet2")}
          bullet3={t("bullet3")}
        />
      </div>
    </section>
  );
}
