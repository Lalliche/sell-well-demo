import { getTranslations } from "next-intl/server";
import FAQClient from "./FAQClient";

/* Builds the four-tab FAQ data set from i18n keys. Each tab has 5 Q+A pairs.
 * Keeping the shape construction here means the client component stays pure
 * UI — it just receives the structured data. */

export default async function FAQ() {
  const t = await getTranslations("FAQ");

  const tabs = [
    { key: "company",  label: t("tabCompany")  },
    { key: "partner",  label: t("tabPartner")  },
    { key: "links",    label: t("tabLinks")    },
    { key: "pricing",  label: t("tabPricing")  },
  ];

  const faqByCategory = {
    company: [1, 2, 3, 4, 5].map((n) => ({ q: t(`company${n}Q`), a: t(`company${n}A`) })),
    partner: [1, 2, 3, 4, 5].map((n) => ({ q: t(`partner${n}Q`), a: t(`partner${n}A`) })),
    links:   [1, 2, 3, 4, 5].map((n) => ({ q: t(`links${n}Q`),   a: t(`links${n}A`)   })),
    pricing: [1, 2, 3, 4, 5].map((n) => ({ q: t(`pricing${n}Q`), a: t(`pricing${n}A`) })),
  };

  return (
    <section id="faq" className="bg-surface py-[6em]">
      <div className="max-w-[78em] mx-auto px-[2em]">
        <FAQClient
          overline={t("overline")}
          headline={t("headline")}
          subtitle={t("subtitle")}
          tabs={tabs}
          faqByCategory={faqByCategory}
        />
      </div>
    </section>
  );
}
