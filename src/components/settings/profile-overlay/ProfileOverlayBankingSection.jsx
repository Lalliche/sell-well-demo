"use client";

/**
 * ProfileOverlayBankingSection — Banking section of the Profile detail
 * overlay (Phase 6/7 settings refactor 2026-05-13).
 *
 * Renders the user's BankingInfo row as an editable form. Mirrors the
 * field set from `auth-onboarding-spec.md` → Banking Info:
 *   - payout_method (radio: ccp · bank · both)
 *   - account_holder_name (always required)
 *   - ccp_account + ccp_key (required when method is ccp or both)
 *   - bank_name + rib (required when method is bank or both)
 *
 * Wires through `fetchBankingInfo(userId)` + `saveBankingInfo(userId, patch)`
 * from `lib/mock/profile.js`. Polymorphic over partner + company (the
 * BankingInfo model was generalized to `OneToOne → User` in the same
 * refactor — see data-model-spec.md).
 *
 * Save fires through `useMutation` + invalidates the banking query so the
 * dashboard's "set up banking" gate flips off the moment a partner saves a
 * valid row. Companies use the same flow on /escrow/withdraw to source
 * their destination_snapshot.
 */

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { Landmark } from "lucide-react";

import { TextInput, DropdownInput } from "@/components/ui/FormInputs";
import AppButton from "@/components/ui/Buttons";
import { fetchBankingInfo, saveBankingInfo } from "@/lib/mock/profile";
import { useToast } from "@/hooks/useToast";
import { cn } from "@/lib/utils";

export default function ProfileOverlayBankingSection({ user }) {
  const t = useTranslations("Profile.banking");
  const tCommon = useTranslations("Common");
  const { toast } = useToast();
  const qc = useQueryClient();

  const { data: existing, isLoading } = useQuery({
    queryKey: ["bankingInfo", user?.id],
    queryFn: () => fetchBankingInfo(user.id),
    enabled: !!user?.id,
  });

  const [form, setForm] = useState(null);
  const current = form ?? existing ?? EMPTY_FORM;

  const setField = (key, value) => setForm({ ...current, [key]: value });

  const methodOptions = [
    { value: "ccp",  label: t("methods.ccp")  },
    { value: "bank", label: t("methods.bank") },
    { value: "both", label: t("methods.both") },
  ];

  const showCcp  = current.payout_method === "ccp"  || current.payout_method === "both";
  const showBank = current.payout_method === "bank" || current.payout_method === "both";

  const mutation = useMutation({
    mutationFn: (patch) => saveBankingInfo(user.id, patch),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["bankingInfo", user?.id] });
      toast.success(t("toasts.savedBody"), { title: t("toasts.savedTitle") });
      setForm(null); // re-read from server
    },
    onError: () => {
      toast.error(t("toasts.errorBody"), { title: t("toasts.errorTitle") });
    },
  });

  const validate = () => {
    if (!current.account_holder_name?.trim()) return "account_holder_name";
    if (showCcp && !current.ccp_account?.trim()) return "ccp_account";
    if (showCcp && !current.ccp_key?.trim())     return "ccp_key";
    if (showBank && !current.bank_name?.trim())  return "bank_name";
    if (showBank && !current.rib?.trim())        return "rib";
    return null;
  };

  const onSave = () => {
    const err = validate();
    if (err) {
      toast.warning(tCommon("formErrorsBody"), { title: tCommon("formErrorsTitle") });
      return;
    }
    mutation.mutate(current);
  };

  if (isLoading) {
    return <p className="text-[0.875em] text-text-muted">{t("loading")}</p>;
  }

  return (
    <div className="flex flex-col gap-[1em]">
      <div className="flex items-center gap-[0.5em] text-[0.8125em] text-text-secondary">
        <Landmark size="0.9375em" strokeWidth={1.75} className="text-text-muted" />
        {existing ? t("descriptionOnFile") : t("descriptionSetup")}
      </div>

      <DropdownInput
        label={t("payoutMethod")}
        options={methodOptions}
        value={current.payout_method}
        onChange={(v) => setField("payout_method", v)}
      />

      <TextInput
        label={t("accountHolderName")}
        value={current.account_holder_name ?? ""}
        onChange={(v) => setField("account_holder_name", v)}
        required
      />

      {showCcp && (
        <div className="flex flex-col gap-[0.75em] sm:flex-row">
          <TextInput
            label={t("ccpAccount")}
            value={current.ccp_account ?? ""}
            onChange={(v) => setField("ccp_account", v)}
            required
            className={cn("flex-1")}
          />
          <TextInput
            label={t("ccpKey")}
            value={current.ccp_key ?? ""}
            onChange={(v) => setField("ccp_key", v)}
            required
            className={cn("flex-1")}
          />
        </div>
      )}

      {showBank && (
        <div className="flex flex-col gap-[0.75em]">
          <TextInput
            label={t("bankName")}
            value={current.bank_name ?? ""}
            onChange={(v) => setField("bank_name", v)}
            required
          />
          <TextInput
            label={t("rib")}
            value={current.rib ?? ""}
            onChange={(v) => setField("rib", v)}
            required
            helperText={t("ribHelper")}
          />
        </div>
      )}

      <div className="flex items-center justify-end gap-[0.5em] pt-[0.5em]">
        <AppButton
          variant="primary"
          size="md"
          onClick={onSave}
          disabled={mutation.isPending}
          isLoading={mutation.isPending}
        >
          {existing ? t("actions.update") : t("actions.create")}
        </AppButton>
      </div>
    </div>
  );
}

const EMPTY_FORM = {
  payout_method: "bank",
  account_holder_name: "",
  ccp_account: "",
  ccp_key: "",
  bank_name: "",
  rib: "",
};
