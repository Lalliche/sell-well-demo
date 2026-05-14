/**
 * Pure step builder for the application timeline. Submitted → Under
 * review → Approved/Rejected, derived from `applied_at` + `reviewed_at`.
 */

import { formatAbsolute } from "./overlay-helpers";

export function buildApplicationTimelineSteps({ application, locale, t }) {
  const { status, applied_at, reviewed_at } = application;
  const submittedTs = formatAbsolute(applied_at, locale);
  const reviewedTs = formatAbsolute(reviewed_at, locale);

  const steps = [
    {
      key: "submitted",
      title: t("timeline.submitted"),
      body: t("timeline.submittedBody"),
      timestamp: submittedTs,
      state: "complete",
    },
    {
      key: "underReview",
      title: t("timeline.underReview"),
      body: t("timeline.underReviewBody"),
      timestamp: reviewedTs,
      state: status === "pending" ? "current" : "complete",
    },
  ];

  if (status === "approved") {
    steps.push({
      key: "approved",
      title: t("timeline.approved"),
      body: t("timeline.approvedBody"),
      timestamp: reviewedTs,
      state: "approved",
    });
  } else if (status === "rejected") {
    steps.push({
      key: "rejected",
      title: t("timeline.rejected"),
      body: t("timeline.rejectedBody"),
      timestamp: reviewedTs,
      state: "rejected",
    });
  }

  return steps;
}
