import { getTranslations } from "next-intl/server";
import TrustedByClient from "./TrustedByClient";

export default async function TrustedBy() {
  const t = await getTranslations("TrustedBy");

  return (
    <section className="bg-bg-alt py-[5em]">
      <div className="max-w-[78em] mx-auto px-[2em]">
        <TrustedByClient
          overline={t("overline")}
          headline={t("headline")}
        />
      </div>
    </section>
  );
}
