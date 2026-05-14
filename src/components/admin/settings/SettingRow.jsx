"use client";

/**
 * SettingRow — one row inside an AdminSettings category card.
 *
 * Layout (left → right):
 *   ┌─ label + Info icon (popover with full impact copy)
 *   │  help-text muted line
 *   └─ ────────── grows ──────────  [ number input ][ unit ]   [ Save ]
 *
 * The unit ("DA" / "%" / "days" / "min" / "MB") sits OUTSIDE the input's
 * bordered box as a small label between the input and the Save button.
 * Earlier revision rendered the unit inside the input border + the Save
 * button to the right; on narrow widths the two collided visually. Pulling
 * them apart eliminates the overlap and reads cleaner.
 *
 * Per-type input behavior:
 *   - "percent"  → number input, 0–100 range, "%" unit
 *   - "currency" → number input, min 0, "DA" unit
 *   - "days"     → integer input, min 0, "days" unit
 *   - "minutes"  → integer input, min 0, "min" unit
 *   - "mb"       → integer input, min 1, "MB" unit
 *
 * Validation is intentionally light — admin tooling, not user input.
 * `validateValue` returns a structured error key the caller maps to copy.
 *
 * Save flow: clicking Save asks the page to open a ConfirmDialog (the page
 * owns the dialog). The row's input value flows up via `onSave(value)`;
 * no mutation fires until admin confirms.
 *
 * The Info icon (Lucide) opens a Popover anchored to the icon containing
 * a "What this controls" + "What changes when you edit it" explanation
 * pulled from i18n keys (`info.{key}.controls` and `info.{key}.effects`).
 */

import { useState, useRef, useEffect } from "react";
import { Save, Info } from "lucide-react";

import AppButton from "@/components/ui/Buttons";
import Popover from "@/components/shared/overlays/Popover";
import { cn } from "@/lib/utils";

function validateValue(type, raw) {
  if (raw === "" || raw === null || raw === undefined) return "required";
  const n = Number(raw);
  if (!Number.isFinite(n)) return "notANumber";
  if (n < 0) return "negative";
  if (type === "percent" && (n < 0 || n > 100)) return "tooLowPercent";
  return null;
}

export default function SettingRow({ setting, t, onSave, saving }) {
  const inputRef = useRef(null);
  const infoTriggerRef = useRef(null);
  const [dirty, setDirty] = useState(false);
  const [error, setError] = useState(null);
  const [infoOpen, setInfoOpen] = useState(false);

  // Reset dirty + error when the server value changes (after a confirm
  // → save → invalidation cycle). Keeps the Save button quiet once the
  // server has caught up to what the admin typed.
  useEffect(() => {
    setDirty(false);
    setError(null);
    if (inputRef.current) inputRef.current.value = String(setting.value);
  }, [setting.value]);

  const unit = t(`units.${setting.type}`);
  const minByType = setting.type === "mb" ? 1 : 0;
  const stepByType = setting.type === "percent" ? "0.5" : "1";

  const onChange = (e) => {
    const raw = e.target.value;
    const next = raw === "" ? "" : Number(raw);
    const isDirty = next !== setting.value && raw !== "";
    setDirty(isDirty);
    const errKey = validateValue(setting.type, raw);
    setError(errKey);
  };

  const onSubmit = () => {
    if (!inputRef.current) return;
    const raw = inputRef.current.value;
    const errKey = validateValue(setting.type, raw);
    if (errKey) {
      setError(errKey);
      return;
    }
    const next = Number(raw);
    if (next === setting.value) return;
    // Hand the proposed value up to the page. Page opens ConfirmDialog
    // and only fires updatePlatformSetting on confirmation.
    onSave(next);
  };

  const canSave = dirty && !error && !saving;

  return (
    <li className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-[1em] px-[1.5em] py-[1.125em]">
      <div className="flex flex-col gap-[0.25em] min-w-0 sm:max-w-[34em]">
        <div className="flex items-center gap-[0.5em]">
          <span className="text-[0.875em] font-semibold text-text font-body">
            {t(`keys.${setting.key}.label`)}
          </span>
          {/* Popover anchors `position: absolute` to its nearest positioned
           *  ancestor — wrap trigger + Popover in a `relative` span sized
           *  to the icon so the panel opens directly below the Info button. */}
          <span className="relative inline-flex shrink-0">
            <button
              ref={infoTriggerRef}
              type="button"
              onClick={() => setInfoOpen((v) => !v)}
              aria-label={t("info.openAria")}
              className={cn(
                "inline-flex items-center justify-center w-[1.375em] h-[1.375em] rounded-full",
                "text-text-muted hover:text-accent hover:bg-bg-alt",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-border",
                "transition-colors duration-100",
              )}
            >
              <Info size="0.9375em" strokeWidth={1.75} />
            </button>
            <Popover
              open={infoOpen}
              onClose={() => setInfoOpen(false)}
              triggerRef={infoTriggerRef}
              placement="bottom"
              align="left"
              className="w-[24em] max-w-[90vw] p-[1em]"
            >
              <div className="flex flex-col gap-[0.75em]" onClick={(e) => e.stopPropagation()}>
                <div className="flex flex-col gap-[0.25em]">
                  <span className="text-[0.6875em] font-semibold uppercase tracking-[0.07em] text-text-muted font-body">
                    {t("info.controlsHeading")}
                  </span>
                  <p className="text-[0.8125em] text-text leading-[1.55]">
                    {t(`info.${setting.key}.controls`)}
                  </p>
                </div>
                <div className="flex flex-col gap-[0.25em]">
                  <span className="text-[0.6875em] font-semibold uppercase tracking-[0.07em] text-text-muted font-body">
                    {t("info.effectsHeading")}
                  </span>
                  <p className="text-[0.8125em] text-text-secondary leading-[1.55]">
                    {t(`info.${setting.key}.effects`)}
                  </p>
                </div>
              </div>
            </Popover>
          </span>
        </div>
        <span className="text-[0.75em] text-text-muted leading-normal">
          {t(`keys.${setting.key}.help`)}
        </span>
      </div>

      <div className="flex items-start gap-[0.625em] shrink-0">
        <div className="flex flex-col gap-[0.25em]">
          <div className="flex items-center gap-[0.5em]">
            <div
              className={cn(
                "flex items-center h-[2.25em] w-[7em] rounded-[0.5em] border bg-bg",
                "transition-[border-color,box-shadow] duration-100",
                "focus-within:border-accent focus-within:shadow-[0_0_0_3px_var(--accent-border)]",
                error ? "border-status-rejected-text" : "border-border",
              )}
            >
              <input
                ref={inputRef}
                type="number"
                defaultValue={String(setting.value)}
                min={minByType}
                step={stepByType}
                max={setting.type === "percent" ? 100 : undefined}
                onChange={onChange}
                disabled={saving}
                className={cn(
                  "w-full bg-transparent px-[0.75em] outline-none",
                  "text-[0.875em] font-mono tabular-nums text-text",
                )}
              />
            </div>
            <span className="text-[0.75em] font-semibold uppercase tracking-wider text-text-muted min-w-[2.5em]">
              {unit}
            </span>
          </div>
          {error && (
            <span className="text-[0.6875em] text-status-rejected-text">
              {t(`validation.${error}`)}
            </span>
          )}
        </div>

        <AppButton
          variant="secondary"
          size="md"
          onClick={onSubmit}
          disabled={!canSave}
          className="shrink-0"
        >
          <span className="inline-flex items-center gap-[0.375em]">
            <Save size="0.9375em" strokeWidth={1.75} />
            {saving ? t("actions.saving") : t("actions.save")}
          </span>
        </AppButton>
      </div>
    </li>
  );
}
