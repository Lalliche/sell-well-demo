import { getTranslations } from "next-intl/server";
import ProblemCards from "./ProblemCards";

export default async function Problem() {
  const t = await getTranslations("Problem");

  const cards = [
    { iconKey: "users",     title: t("card1Title"), body: t("card1Body") },
    { iconKey: "megaphone", title: t("card2Title"), body: t("card2Body") },
    { iconKey: "list",      title: t("card3Title"), body: t("card3Body") },
  ];

  return (
    <section className="bg-surface py-[6em]">
      <div className="max-w-[75em] mx-auto px-[2em]">
        <ProblemCards
          cards={cards}
          closing={t("closing")}
          overline={t("overline")}
          headline={t("headline")}
        />
      </div>
    </section>
  );
}
