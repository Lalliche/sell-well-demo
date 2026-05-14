"use client";

import { useTranslations } from "next-intl";
import {
  CheckCircle2, Phone, Users, PhoneOff, MailX,
  BadgeCheck, Banknote, Megaphone,
} from "lucide-react";

/* Detail content blocks rendered inside the hover popovers on each event
 * row. Each block is a tiny static UI mock built from the Solution i18n
 * keys (popXxx*). All number formatting goes through `fmt` so locale-aware
 * grouping stays consistent in en + fr. */

const fmt = (n) => n.toLocaleString("en-US");

export function CallLogDetail() {
  const t = useTranslations("Solution");
  const calls = [
    { name: "Boumediene Trading", statusKey: "callStatusInterested", icon: CheckCircle2, positive: true },
    { name: "Sahara Logistics",   statusKey: "callStatusInterested", icon: CheckCircle2, positive: true },
    { name: "Tipaza Digital",     statusKey: "callStatusNoAnswer",   icon: PhoneOff },
    { name: "Annaba Foods Co.",   statusKey: "callStatusVoicemail",  icon: PhoneOff },
    { name: "Oran Tech Group",    statusKey: "callStatusWrongNumber", icon: MailX },
  ];
  return (
    <div className="flex flex-col gap-[0.4375em]">
      <p className="font-body text-[0.625em] font-semibold uppercase tracking-[0.08em] text-text-muted mb-[0.125em]">
        {t("popOutreachTitle")}
      </p>
      {calls.map((c) => (
        <div key={c.name} className="flex items-center gap-[0.4375em]">
          <c.icon size={11} strokeWidth={1.75} className={`${c.positive ? "text-trend-positive" : "text-text-muted"} shrink-0`} />
          <span className="font-body text-[0.6875em] text-text truncate flex-1">{c.name}</span>
          <span className="font-body text-[0.625em] text-text-muted shrink-0">{t(c.statusKey)}</span>
        </div>
      ))}
      <div className="mt-[0.25em] pt-[0.4375em] border-t border-border-light flex items-center justify-between">
        <span className="font-body text-[0.625em] text-text-muted">{t("popOutreachTimeLabel")}</span>
        <span className="font-mono text-[0.6875em] font-semibold text-text-secondary tabular-nums">{t("popOutreachTimeValue")}</span>
      </div>
    </div>
  );
}

export function TeamCostDetail() {
  const t = useTranslations("Solution");
  const team = [
    { roleKey: "popPayrollRoleManager", cost: 180000 },
    { roleKey: "popPayrollRoleRep",     cost: 100000 },
  ];
  return (
    <div className="flex flex-col gap-[0.4375em]">
      <p className="font-body text-[0.625em] font-semibold uppercase tracking-[0.08em] text-text-muted mb-[0.125em]">
        {t("popPayrollTitle")}
      </p>
      {team.map((r) => (
        <div key={r.roleKey} className="flex items-center gap-[0.4375em]">
          <Users size={11} strokeWidth={1.75} className="text-text-muted shrink-0" />
          <span className="font-body text-[0.6875em] text-text truncate flex-1">{t(r.roleKey)}</span>
          <span className="font-mono text-[0.625em] font-semibold text-trend-negative tabular-nums shrink-0">
            −{fmt(r.cost)}
          </span>
        </div>
      ))}
      <div className="mt-[0.25em] pt-[0.4375em] border-t border-border-light flex items-center justify-between">
        <span className="font-body text-[0.625em] text-text-muted">{t("popPayrollTotalLabel")}</span>
        <span className="font-mono text-[0.75em] font-bold text-trend-negative tabular-nums">−280,000 DZD</span>
      </div>
      <p className="font-body text-[0.625em] text-text-muted leading-snug pt-[0.25em]">
        {t("popPayrollFootnote")}
      </p>
    </div>
  );
}

export function MonthEndDetail() {
  const t = useTranslations("Solution");
  return (
    <div className="flex flex-col gap-[0.4375em]">
      <p className="font-body text-[0.625em] font-semibold uppercase tracking-[0.08em] text-text-muted mb-[0.125em]">
        {t("popMonthEndTitle")}
      </p>
      <div className="flex justify-between items-baseline">
        <span className="font-body text-[0.6875em] text-text-secondary">Boumediene Trading</span>
        <span className="font-mono text-[0.6875em] font-semibold text-trend-positive tabular-nums">+180,000</span>
      </div>
      <div className="flex justify-between items-baseline">
        <span className="font-body text-[0.6875em] text-text-secondary">Sahara Logistics</span>
        <span className="font-mono text-[0.6875em] font-semibold text-trend-positive tabular-nums">+180,000</span>
      </div>
      <div className="mt-[0.25em] pt-[0.4375em] border-t border-border-light flex justify-between items-baseline">
        <span className="font-body text-[0.6875em] font-semibold text-text">{t("popMonthEndRevenueLabel")}</span>
        <span className="font-mono text-[0.75em] font-bold text-trend-positive tabular-nums">+360,000 DZD</span>
      </div>
      <p className="font-body text-[0.625em] text-text-muted leading-snug pt-[0.25em]">
        {t("popMonthEndFootnote")}
      </p>
    </div>
  );
}

export function MarketingSpendDetail() {
  const t = useTranslations("Solution");
  const channels = [
    { key: "popAdsLinkedIn", cost: 12000 },
    { key: "popAdsGoogle",   cost: 6000  },
    { key: "popAdsList",     cost: 2000  },
  ];
  return (
    <div className="flex flex-col gap-[0.4375em]">
      <p className="font-body text-[0.625em] font-semibold uppercase tracking-[0.08em] text-text-muted mb-[0.125em]">
        {t("popAdsTitle")}
      </p>
      {channels.map((c) => (
        <div key={c.key} className="flex items-center gap-[0.4375em]">
          <Megaphone size={11} strokeWidth={1.75} className="text-text-muted shrink-0" />
          <span className="font-body text-[0.6875em] text-text truncate flex-1">{t(c.key)}</span>
          <span className="font-mono text-[0.625em] font-semibold text-trend-negative tabular-nums shrink-0">
            −{fmt(c.cost)}
          </span>
        </div>
      ))}
      <div className="mt-[0.25em] pt-[0.4375em] border-t border-border-light flex items-center justify-between">
        <span className="font-body text-[0.625em] text-text-muted">{t("popAdsTotalLabel")}</span>
        <span className="font-mono text-[0.75em] font-bold text-trend-negative tabular-nums">−20,000 DZD</span>
      </div>
      <p className="font-body text-[0.625em] text-text-muted leading-snug pt-[0.25em]">
        {t("popAdsFootnote")}
      </p>
    </div>
  );
}

export function SetupDetail() {
  const t = useTranslations("Solution");
  const steps = [
    { titleKey: "popSetupStep1Title", subKey: "popSetupStep1Sub" },
    { titleKey: "popSetupStep2Title", subKey: "popSetupStep2Sub" },
    { titleKey: "popSetupStep3Title", subKey: "popSetupStep3Sub" },
  ];
  return (
    <div className="flex flex-col gap-[0.5em]">
      <p className="font-body text-[0.625em] font-semibold uppercase tracking-[0.08em] text-accent-text">
        {t("popSetupTitle")}
      </p>
      {steps.map((s, i) => (
        <div key={s.titleKey} className="flex items-start gap-[0.4375em]">
          <span className="shrink-0 mt-[0.0625em] w-[1em] h-[1em] rounded-full bg-(--accent-light) text-accent flex items-center justify-center font-mono text-[0.5em] font-bold tabular-nums">
            {i + 1}
          </span>
          <div className="flex-1 min-w-0">
            <p className="font-body text-[0.6875em] font-semibold text-text leading-snug">{t(s.titleKey)}</p>
            <p className="font-body text-[0.5625em] text-text-muted leading-snug">{t(s.subKey)}</p>
          </div>
        </div>
      ))}
      <p className="font-body text-[0.625em] text-text-muted leading-snug pt-[0.25em] border-t border-border-light">
        {t("popSetupFootnote")}
      </p>
    </div>
  );
}

export function LeadDeliveredDetail() {
  const t = useTranslations("Solution");
  return (
    <div className="flex flex-col gap-[0.5em]">
      <div className="flex items-center gap-[0.4375em]">
        <div className="w-[1.5em] h-[1.5em] rounded-full bg-(--accent-light) text-accent flex items-center justify-center font-heading text-[0.5625em] font-bold shrink-0">AB</div>
        <div className="flex-1 min-w-0">
          <p className="font-body text-[0.6875em] font-semibold text-text">{t("popLeadPartnerName")}</p>
          <p className="font-body text-[0.5625em] text-text-muted">{t("popLeadPartnerSub")}</p>
        </div>
      </div>
      <div className="bg-bg/60 border border-border-light rounded-[0.375em] p-[0.5em]">
        <p className="font-body text-[0.5625em] text-text-muted mb-[0.1875em]">{t("popLeadLeadLabel")}</p>
        <p className="font-body text-[0.75em] font-semibold text-text">{t("popLeadCompanyName")}</p>
        <p className="font-body text-[0.625em] text-text-muted">{t("popLeadCompanySub")}</p>
      </div>
      <p className="font-body text-[0.625em] text-text-muted leading-snug">
        {t("popLeadFootnote")}
      </p>
    </div>
  );
}

export function DemoDetail() {
  const t = useTranslations("Solution");
  return (
    <div className="flex flex-col gap-[0.5em]">
      <p className="font-body text-[0.625em] font-semibold uppercase tracking-[0.08em] text-text-muted">
        {t("popDemoTitle")}
      </p>
      <div className="flex flex-col gap-[0.3125em]">
        {["popDemoCheck1", "popDemoCheck2", "popDemoCheck3"].map((k) => (
          <div key={k} className="flex items-center gap-[0.4375em]">
            <CheckCircle2 size={11} strokeWidth={2} className="text-trend-positive shrink-0" />
            <span className="font-body text-[0.6875em] text-text">{t(k)}</span>
          </div>
        ))}
      </div>
      <p className="font-body text-[0.625em] text-text-muted leading-snug pt-[0.25em] border-t border-border-light">
        {t("popDemoFootnote")}
      </p>
    </div>
  );
}

export function ClosedDealDetail() {
  const t = useTranslations("Solution");
  return (
    <div className="flex flex-col gap-[0.4375em]">
      <p className="font-body text-[0.625em] font-semibold uppercase tracking-[0.08em] text-text-muted mb-[0.125em]">
        {t("popDealTitle")}
      </p>
      <div className="flex justify-between items-baseline">
        <span className="font-body text-[0.6875em] text-text-secondary">{t("popDealSaleLabel")}</span>
        <span className="font-mono text-[0.75em] font-semibold text-text tabular-nums">180,000 DZD</span>
      </div>
      <div className="flex justify-between items-baseline">
        <span className="font-body text-[0.6875em] text-text-secondary">{t("popDealCommissionLabel")}</span>
        <span className="font-mono text-[0.6875em] text-text-secondary tabular-nums">−18,000</span>
      </div>
      <div className="flex justify-between items-baseline">
        <span className="font-body text-[0.6875em] text-text-secondary">{t("popDealFeeLabel")}</span>
        <span className="font-mono text-[0.6875em] text-text-secondary tabular-nums">−18,000</span>
      </div>
      <div className="mt-[0.25em] pt-[0.4375em] border-t border-border-light flex justify-between items-baseline">
        <span className="font-body text-[0.6875em] font-semibold text-text">{t("popDealNetLabel")}</span>
        <span className="font-mono text-[0.875em] font-bold text-trend-positive tabular-nums">+144,000 DZD</span>
      </div>
    </div>
  );
}

export function PaidOnResultDetail() {
  const t = useTranslations("Solution");
  return (
    <div className="flex flex-col gap-[0.625em]">
      <p className="font-body text-[0.625em] font-semibold uppercase tracking-[0.08em] text-accent-text">
        {t("popPaidTitle")}
      </p>
      <div className="flex items-start gap-[0.4375em]">
        <BadgeCheck size={12} strokeWidth={2} className="text-trend-positive shrink-0 mt-[0.0625em]" />
        <p className="font-body text-[0.6875em] text-text leading-snug">{t("popPaidLine1")}</p>
      </div>
      <div className="flex items-start gap-[0.4375em]">
        <Banknote size={12} strokeWidth={2} className="text-accent shrink-0 mt-[0.0625em]" />
        <p className="font-body text-[0.6875em] text-text leading-snug">{t("popPaidLine2")}</p>
      </div>
      <p className="font-body text-[0.625em] text-text-muted leading-snug pt-[0.25em] border-t border-border-light">
        {t("popPaidFootnote")}
      </p>
    </div>
  );
}
