"use client";

/**
 * CampaignActionsMenu — kebab menu on a company-side campaign card.
 *
 * Uses the shared `Popover` primitive for the dropdown panel and the
 * shared `ConfirmDialog` primitive for destructive confirmations.
 *
 * Available actions (driven by campaign.status):
 *   draft  → Edit · Delete
 *   active → Edit · Pause · Close
 *   paused → Edit · Resume · Close
 *   closed → Edit
 *
 * Click handling — the menu lives inside the `<Link>`-wrapped card shell.
 * Every interactive element here calls `stopPropagation()` so clicks on
 * the kebab / menu items don't navigate the card. `preventDefault()` is
 * also used on the kebab button so the parent `<a>` doesn't fire.
 *
 * Mutations are placeholder — real `pauseCampaign` / `resumeCampaign` /
 * `closeCampaign` mock calls land in Phase 7.4 alongside `/campaigns/[slug]`.
 * The menu fires the API call, shows a toast, and the parent invalidates
 * its React Query key on success. Mock layer currently no-ops.
 */

import { useRef, useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { MoreHorizontal, Pencil, Pause, Play, X as XIcon } from "lucide-react";
import Popover from "@/components/shared/overlays/Popover";
import ConfirmDialog from "@/components/shared/feedback/ConfirmDialog";
import { useToast } from "@/hooks/useToast";
import {
  pauseCampaign,
  resumeCampaign,
  closeCampaign,
} from "@/lib/mock/campaigns";
import { cn } from "@/lib/utils";

export default function CampaignActionsMenu({ campaign, disabled }) {
  const t = useTranslations("Campaigns.companyList.menu");
  const router = useRouter();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const triggerRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [confirm, setConfirm] = useState(null); // null | "pause" | "resume" | "close"

  // Stop the kebab click from triggering the parent `<Link>` card.
  const swallow = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleToggle = (e) => {
    swallow(e);
    if (disabled) return;
    setOpen((v) => !v);
  };

  const handleEdit = (e) => {
    swallow(e);
    setOpen(false);
    router.push(`/campaigns/${campaign.slug}`);
  };

  const openConfirm = (action) => (e) => {
    swallow(e);
    setOpen(false);
    setConfirm(action);
  };

  const closeConfirm = useCallback(() => setConfirm(null), []);

  const runAction = useCallback(async () => {
    try {
      if (confirm === "pause")  await pauseCampaign(campaign.id);
      if (confirm === "resume") await resumeCampaign(campaign.id);
      if (confirm === "close")  await closeCampaign(campaign.id);
      toast.success(t(`toast.${confirm}.body`), { title: t(`toast.${confirm}.title`) });
      queryClient.invalidateQueries({ queryKey: ["company-campaigns"] });
    } catch {
      toast.error(t("toast.error.body"), { title: t("toast.error.title") });
    } finally {
      setConfirm(null);
    }
  }, [confirm, campaign.id, queryClient, toast, t]);

  const showResume = campaign.status === "paused";
  const showPause  = campaign.status === "active";
  const showClose  = campaign.status === "active" || campaign.status === "paused";

  return (
    <span className="relative inline-flex" onClick={swallow}>
      <button
        ref={triggerRef}
        type="button"
        aria-label={t("trigger")}
        aria-haspopup="menu"
        aria-expanded={open}
        disabled={disabled}
        onClick={handleToggle}
        className={cn(
          "inline-flex items-center justify-center w-[2em] h-[2em] rounded-[0.5em]",
          "text-text-muted hover:text-text hover:bg-bg-alt",
          "transition-[background-color,color] duration-150 ease-out",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[--accent-border]",
          "disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-text-muted",
        )}
      >
        <MoreHorizontal size="1em" strokeWidth={2} />
      </button>

      <Popover
        open={open}
        onClose={() => setOpen(false)}
        triggerRef={triggerRef}
        align="right"
        // Open upward from the kebab — the kebab sits at the bottom of the
        // card so a downward-opening menu would clip behind the next row
        // and feel detached from its trigger.
        placement="top"
        className="min-w-[12em] py-[0.375em]"
      >
        <ul role="menu" className="flex flex-col">
          <MenuItem icon={<Pencil size="0.875em" strokeWidth={1.75} />} onClick={handleEdit}>
            {t("edit")}
          </MenuItem>
          {showResume && (
            <MenuItem
              icon={<Play size="0.875em" strokeWidth={1.75} />}
              onClick={openConfirm("resume")}
            >
              {t("resume")}
            </MenuItem>
          )}
          {showPause && (
            <MenuItem
              icon={<Pause size="0.875em" strokeWidth={1.75} />}
              onClick={openConfirm("pause")}
            >
              {t("pause")}
            </MenuItem>
          )}
          {showClose && (
            <>
              <li role="separator" aria-hidden="true" className="my-[0.25em] mx-[0.625em] h-px bg-border-light" />
              <MenuItem
                icon={<XIcon size="0.875em" strokeWidth={1.75} />}
                onClick={openConfirm("close")}
                destructive
              >
                {t("close")}
              </MenuItem>
            </>
          )}
        </ul>
      </Popover>

      {confirm && (
        <ConfirmDialog
          open={!!confirm}
          onCancel={closeConfirm}
          onConfirm={runAction}
          destructive={confirm === "close"}
          title={t(`confirm.${confirm}.title`, { name: campaign.product_name })}
          description={t(`confirm.${confirm}.body`)}
          confirmLabel={t(`confirm.${confirm}.confirm`)}
          cancelLabel={t("confirm.cancel")}
        />
      )}
    </span>
  );
}

function MenuItem({ icon, onClick, destructive, children }) {
  return (
    <li role="none">
      <button
        role="menuitem"
        type="button"
        onClick={onClick}
        className={cn(
          "w-full flex items-center gap-[0.625em] px-[0.875em] py-[0.5em]",
          "text-[0.8125em] font-medium text-left",
          "transition-[background-color,color] duration-150 ease-out",
          "focus-visible:outline-none focus-visible:bg-bg-alt",
          destructive
            ? "text-status-rejected-text hover:bg-status-rejected-bg"
            : "text-text hover:bg-bg-alt",
        )}
      >
        <span className={cn("shrink-0", destructive ? "text-status-rejected-text" : "text-text-muted")}>
          {icon}
        </span>
        {children}
      </button>
    </li>
  );
}
