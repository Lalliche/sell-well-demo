"use client";

/**
 * SubmitToCompanyButton — flips a draft lead to `submitted`. Visible in
 * the LeadDetailOverlay footer only when the lead is currently a draft.
 *
 * On success: invalidates partner-leads so the overlay/list re-render
 * reflects the new status; closes the overlay so the partner sees the
 * lead leave the Drafts tab.
 */

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Send } from "lucide-react";
import AppButton from "@/components/ui/Buttons";
import { useToast } from "@/hooks/useToast";
import { submitLead } from "@/lib/mock/leads";

export default function SubmitToCompanyButton({ lead, onSubmitted, t }) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const mutation = useMutation({
    mutationFn: () => submitLead(lead.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["partner-leads"] });
      queryClient.invalidateQueries({ queryKey: ["partner-stats"] });
      toast.success(t("actions.sentBody"), { title: t("actions.sentTitle") });
      onSubmitted?.();
    },
    onError: () => toast.error("Something went wrong. Please try again."),
  });

  return (
    <AppButton
      variant="accent"
      size="sm"
      onClick={() => mutation.mutate()}
      isLoading={mutation.isPending}
    >
      <span className="inline-flex items-center gap-[0.375em]">
        <Send className="w-[0.875em] h-[0.875em]" strokeWidth={1.75} />
        {mutation.isPending ? t("actions.sending") : t("actions.sendToCompany")}
      </span>
    </AppButton>
  );
}
