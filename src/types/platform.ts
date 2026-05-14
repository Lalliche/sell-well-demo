/**
 * Platform settings — admin-editable global config knobs.
 *
 * Backed by `MOCK_PLATFORM_SETTINGS` in `lib/mock/admin.js` today; will
 * become a Django `PlatformSetting` model + REST endpoint at Phase 11+.
 * Every business value that varies platform behavior reads through
 * `getPlatformSetting(key, fallback)` so admin edits in /admin/settings
 * actually change the platform's behavior. See
 * `shared-specs/data-model-spec.md` → PlatformSetting for the full table.
 */

/** Type of value the setting holds, used by the admin /admin/settings page
 *  to render the right input control + suffix (% / DA / days / minutes / MB).
 *  Backend serializer returns the same string. */
export type PlatformSettingType =
  | "percent"
  | "currency"
  | "days"
  | "minutes"
  | "mb";

export interface PlatformSetting {
  key: string;
  value: number;
  type: PlatformSettingType;
  description: string;
  updated_at?: string;
}

/** Full enumeration of every PlatformSetting key the codebase reads. Adding
 *  a new key requires (1) updating this union, (2) appending to
 *  `PLATFORM_SETTING_DEFAULTS` in `lib/mock/admin.js`, (3) adding the spec
 *  row in `data-model-spec.md` → PlatformSetting, (4) wiring at least one
 *  reader via `getPlatformSetting(key, fallback)`. Per the data-contract-
 *  sync rule. */
export type PlatformSettingKey =
  | "platform_fee_percentage"
  | "escrow_min_deposit_da"
  | "lead_acknowledgment_window_days"
  | "client_verification_timeout_days"
  | "reapplication_cooldown_days"
  | "max_upload_size_mb"
  | "click_dedup_window_minutes"
  | "partner_link_attribution_window_days";
