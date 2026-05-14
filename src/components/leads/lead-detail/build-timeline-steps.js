/**
 * Pure step builder for the lead's status timeline. Returns the full
 * ordered list of steps to render, derived from the lead's three
 * timestamps + status. Lives outside the renderer so the per-status
 * branching stays out of JSX.
 *
 * Steps shape:
 *   { key, title, body, timestamp, state }
 *     state ∈ "complete" | "current" | "skipped" | "approved" | "rejected" | "warning"
 */

import { formatAbsolute, formatShortDate } from "./lead-detail-helpers";

export function buildTimelineSteps({ lead, locale, isExpiringSoon, daysRemaining, t }) {
  const { status, submitted_at, created_at, acknowledged_at, tracking_window_expires_at, resolved_at } = lead;
  const isDraft = status === "draft";
  const draftTs = formatAbsolute(created_at, locale);
  const submittedTs = formatAbsolute(submitted_at, locale);
  const acknowledgedTs = formatAbsolute(acknowledged_at, locale);
  const resolvedTs = formatAbsolute(resolved_at, locale);
  const trackingEndDate = formatShortDate(tracking_window_expires_at, locale);

  const steps = [
    {
      key: "draft",
      title: t("timeline.draft"),
      body: t("timeline.draftBody"),
      timestamp: draftTs,
      state: "complete",
    },
    {
      key: "submitted",
      title: t("timeline.submitted"),
      body: isDraft
        ? t("timeline.submittedDraftBody")
        : t("timeline.submittedBody"),
      timestamp: submittedTs,
      state: isDraft ? "current" : "complete",
    },
  ];

  if (!isDraft) {
    steps.push(buildAckStep({ status, acknowledgedTs, t }));
  }

  if (status === "acknowledged") {
    steps.push({
      key: "tracking",
      title: t("timeline.trackingWindow"),
      body: isExpiringSoon
        ? t("timeline.trackingWindowExpiringBody", { days: daysRemaining ?? 0 })
        : t("timeline.trackingWindowBody", { date: trackingEndDate ?? "—" }),
      timestamp: trackingEndDate,
      state: isExpiringSoon ? "warning" : "current",
    });
  }

  const terminal = buildTerminalStep({ status, resolvedTs, t });
  if (terminal) steps.push(terminal);

  return steps;
}

function buildAckStep({ status, acknowledgedTs, t }) {
  if (status === "submitted" || status === "pending_escrow") {
    return {
      key: "ack",
      title: t("timeline.acknowledged"),
      body:
        status === "pending_escrow"
          ? t("timeline.pendingEscrowBody")
          : t("timeline.acknowledgedPendingBody"),
      timestamp: null,
      state: "current",
    };
  }
  if (status === "expired") {
    return {
      key: "ack",
      title: t("timeline.acknowledged"),
      body: t("timeline.acknowledgedPendingBody"),
      timestamp: null,
      state: "skipped",
    };
  }
  return {
    key: "ack",
    title: t("timeline.acknowledged"),
    body: t("timeline.acknowledgedBody"),
    timestamp: acknowledgedTs,
    state: "complete",
  };
}

function buildTerminalStep({ status, resolvedTs, t }) {
  switch (status) {
    case "converted":
      return { key: "term", title: t("timeline.converted"), body: t("timeline.convertedBody"), timestamp: resolvedTs, state: "approved" };
    case "converted_verified":
      return { key: "term", title: t("timeline.convertedVerified"), body: t("timeline.convertedVerifiedBody"), timestamp: resolvedTs, state: "approved" };
    case "not_converted":
      return { key: "term", title: t("timeline.notConverted"), body: t("timeline.notConvertedBody"), timestamp: resolvedTs, state: "rejected" };
    case "disputed_verifying":
      return { key: "term", title: t("timeline.disputed"), body: t("timeline.disputedBody"), timestamp: null, state: "warning" };
    case "expired":
      return { key: "term", title: t("timeline.expired"), body: t("timeline.expiredBody"), timestamp: resolvedTs, state: "rejected" };
    case "expired_verifying":
      return { key: "term", title: t("timeline.expiredVerifying"), body: t("timeline.expiredVerifyingBody"), timestamp: null, state: "warning" };
    default:
      return null;
  }
}
