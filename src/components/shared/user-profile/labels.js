/**
 * Shared label-mappers — bridge a next-intl `t()` resolver (any namespace
 * that mirrors the `Admin.users.overlay.*` key shape) into the `labels` prop
 * the three user-profile sections expect.
 *
 * Both AdminUserDetailOverlay and AdminCampaignDetailOverlay use these so
 * the Profile / Account / Activity sections render identically across every
 * admin surface that surfaces a user. Adding a new admin overlay that shows
 * a user? Pass `useTranslations("Admin.users")` to these helpers — no need
 * to redefine the mapper.
 *
 * The campaigns overlay calls `useTranslations("Admin.users")` (not its own
 * Admin.campaigns namespace) for these so the strings stay coherent with
 * /admin/users.
 */

export function profileLabels(tUser) {
  return {
    profileMissing: tUser("overlay.profileMissing"),
    bio:            tUser("overlay.bio"),
    categories:     tUser("overlay.categories"),
    skills:         tUser("overlay.skills"),
    cv:             tUser("overlay.cv"),
    cvTitle:        tUser("overlay.cvTitle", { name: "{name}" }),
    previewCv:      tUser("overlay.previewCv"),
    downloadCv:     tUser("overlay.downloadCv"),
    linkedin:       tUser("overlay.linkedin"),
    description:    tUser("overlay.description"),
  };
}

export function accountLabels(tUser) {
  return {
    email:             tUser("overlay.email"),
    role:              tUser("overlay.role"),
    rolePartner:       tUser("overlay.rolePartner"),
    roleCompany:       tUser("overlay.roleCompany"),
    signupDate:        tUser("overlay.signupDate"),
    applicationStatus: tUser("overlay.applicationStatus"),
    emailVerified:     tUser("overlay.emailVerified"),
    yes:               tUser("overlay.yes"),
    no:                tUser("overlay.no"),
    suspendedAt:       tUser("overlay.suspendedAt"),
    priorNote:         tUser("overlay.priorNote"),
    status:            (key) => tUser(`statuses.${key}`),
  };
}

export function activityLabels(tUser) {
  return {
    noActivity:          tUser("overlay.activity.noActivity"),
    approvedCampaigns:   tUser("overlay.activity.approvedCampaigns"),
    leadsTotal:          tUser("overlay.activity.leadsTotal"),
    conversionRate:      tUser("overlay.activity.conversionRate"),
    earningsTotal:       tUser("overlay.activity.earningsTotal"),
    campaignsTotal:      tUser("overlay.activity.campaignsTotal"),
    leadsReceived:       tUser("overlay.activity.leadsReceived"),
    escrowAvailable:     tUser("overlay.activity.escrowAvailable"),
    commissionsPaid:     tUser("overlay.activity.commissionsPaid"),
    flagCount:           tUser("overlay.activity.flagCount"),
    recentFlagsHeading:  tUser("overlay.activity.recentFlagsHeading"),
  };
}
