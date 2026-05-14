"use client";

/**
 * AdminSettingsPage — /admin/settings route (9.8).
 *
 * Layout: grouped cards by category (Fees & Escrow · Time windows · Files
 * & Uploads). Each row is edit-in-place: label + help text + a typed input
 * with the right unit suffix + a Save button that only enables when the
 * value differs from what's on the server.
 *
 * Every setting goes through `getPlatformSetting(key)` in the readers I
 * wired earlier (leads.js, escrow.js, profile.js, FormInputs.jsx, etc.),
 * so admin edits here actually shift the platform's behavior immediately:
 * new commissions read the new fee %, new deposits enforce the new
 * minimum, etc. Forward-only — existing seed values stay frozen.
 *
 * Sub-row state lives in a single `dirty` map keyed by setting key. We
 * don't store all 8 controlled values in state — each row uses an
 * uncontrolled-since-fetch pattern with `defaultValue` and reads the
 * current input value via ref at Save time. That keeps the page idle
 * unless the admin is actively typing.
 *
 * File-size discipline: page stays under the 250-line cap by extracting
 * the per-row render into a sibling component (`SettingRow`).
 */

import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";

import PageHeader from "@/components/shared/layout/PageHeader";
import ConfirmDialog from "@/components/shared/feedback/ConfirmDialog";
import { useToast } from "@/hooks/useToast";
import { fetchPlatformSettings, updatePlatformSetting } from "@/lib/mock/admin";
import SettingRow from "./SettingRow";

/** Category ordering on the page. Matches the category strings stamped
 *  on PLATFORM_SETTING_DEFAULTS in lib/mock/admin.js. */
const CATEGORY_ORDER = ["fees_escrow", "windows", "files"];

export default function AdminSettingsPage() {
  const t = useTranslations("Admin.settings");
  const { toast } = useToast();
  const qc = useQueryClient();

  // { setting, nextValue } — the pending edit waiting on ConfirmDialog
  // approval. null = no dialog open. We don't call updatePlatformSetting
  // until admin confirms.
  const [pending, setPending] = useState(null);

  const { data: settings = [], isLoading } = useQuery({
    queryKey: ["admin", "platform-settings"],
    queryFn: fetchPlatformSettings,
  });

  const groups = useMemo(() => {
    const byCategory = new Map();
    for (const cat of CATEGORY_ORDER) byCategory.set(cat, []);
    for (const s of settings) {
      const cat = s.category ?? "other";
      if (!byCategory.has(cat)) byCategory.set(cat, []);
      byCategory.get(cat).push(s);
    }
    return CATEGORY_ORDER
      .filter((cat) => (byCategory.get(cat) ?? []).length > 0)
      .map((cat) => ({ key: cat, rows: byCategory.get(cat) }));
  }, [settings]);

  const mutation = useMutation({
    mutationFn: ({ key, value }) => updatePlatformSetting(key, value),
    onSuccess: (_, { key, value }) => {
      qc.invalidateQueries({ queryKey: ["admin", "platform-settings"] });
      const label = t(`keys.${key}.label`);
      toast.success(t("toasts.savedBody", { label, value }), {
        title: t("toasts.savedTitle"),
      });
      setPending(null);
    },
    onError: () => {
      toast.error(t("toasts.errorBody"), { title: t("toasts.errorTitle") });
      setPending(null);
    },
  });

  const handleRequestSave = (setting, nextValue) => {
    setPending({ setting, nextValue });
  };
  const handleConfirm = () => {
    if (!pending) return;
    mutation.mutate({ key: pending.setting.key, value: pending.nextValue });
  };
  const handleCancel = () => setPending(null);

  return (
    <div className="flex flex-col gap-[1.5em] px-[2em] py-[2em]">
      <PageHeader title={t("title")} description={t("description")} />

      <div className="flex flex-col gap-[1.5em]">
        {isLoading && groups.length === 0 ? (
          <SettingsSkeleton />
        ) : (
          groups.map((group) => (
            <CategoryCard
              key={group.key}
              titleKey={group.key}
              rows={group.rows}
              t={t}
              onSave={(key, value) => {
                const setting = settings.find((s) => s.key === key);
                if (setting) handleRequestSave(setting, value);
              }}
              saving={mutation.isPending}
              savingKey={mutation.variables?.key}
            />
          ))
        )}
      </div>

      {pending ? (
        <ConfirmDialog
          open
          onCancel={handleCancel}
          onConfirm={handleConfirm}
          title={t("confirm.title", {
            label: t(`keys.${pending.setting.key}.label`),
          })}
          description={t("confirm.body", {
            label: t(`keys.${pending.setting.key}.label`),
            from: formatValueForConfirm(pending.setting, pending.setting.value, t),
            to: formatValueForConfirm(pending.setting, pending.nextValue, t),
            help: t(`keys.${pending.setting.key}.help`),
          })}
          confirmLabel={t("confirm.confirm")}
          cancelLabel={t("actions.cancel")}
          destructive={isDestructiveSetting(pending.setting.key)}
        />
      ) : null}
    </div>
  );
}

/* ── Helpers ──────────────────────────────────────────────────────────── */

/** Format a numeric setting value the way it appears on the page (with
 *  unit) so the confirm dialog reads naturally: "10%" / "1000 DA" /
 *  "7 days" / "30 min" / "10 MB". */
function formatValueForConfirm(setting, value, t) {
  const unit = t(`units.${setting.type}`);
  if (setting.type === "percent") return `${value}${unit}`;
  return `${value} ${unit}`;
}

/** Settings whose change has serious downstream consequences (changes
 *  every new lead's commission math, blocks deposits below a higher
 *  floor, etc.) get the red destructive treatment on the confirm dialog. */
function isDestructiveSetting(key) {
  return key === "platform_fee_percentage" || key === "escrow_min_deposit_da";
}

/* ── Category card ───────────────────────────────────────────────────────
 * No `overflow-hidden` on the card — the per-row Info popover needs to
 * escape the card to render below its trigger icon. The header gets
 * explicit top-corner rounding so its bg-alt fill still hugs the card's
 * corners. */
function CategoryCard({ titleKey, rows, t, onSave, saving, savingKey }) {
  return (
    <section className="bg-surface border border-border-light rounded-[0.75em]">
      <header className="flex flex-col gap-[0.25em] px-[1.5em] py-[1.125em] bg-bg-alt border-b border-border-light rounded-t-[0.75em]">
        <h2 className="text-[1em] font-semibold font-heading text-text">
          {t(`categories.${titleKey}.title`)}
        </h2>
        <p className="text-[0.8125em] text-text-muted">
          {t(`categories.${titleKey}.subtitle`)}
        </p>
      </header>
      <ul className="flex flex-col divide-y divide-border-light">
        {rows.map((row) => (
          <SettingRow
            key={row.key}
            setting={row}
            t={t}
            onSave={(value) => onSave(row.key, value)}
            saving={saving && savingKey === row.key}
          />
        ))}
      </ul>
    </section>
  );
}

/* ── Loading skeleton ──────────────────────────────────────────────────── */
function SettingsSkeleton() {
  return (
    <div className="flex flex-col gap-[1.5em]">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="bg-surface border border-border-light rounded-[0.75em] p-[1.5em] animate-[skeleton-pulse_1.4s_ease-in-out_infinite]"
        >
          <div className="h-[1em] w-[12em] bg-bg-alt rounded-[0.375em] mb-[0.75em]" />
          <div className="h-[0.75em] w-[24em] bg-bg-alt rounded-[0.375em] mb-[1.5em]" />
          <div className="flex flex-col gap-[0.875em]">
            <div className="h-[2.5em] bg-bg-alt rounded-[0.5em]" />
            <div className="h-[2.5em] bg-bg-alt rounded-[0.5em]" />
          </div>
        </div>
      ))}
    </div>
  );
}
