<!-- SESSION HANDOFF (2026-05-13 — second handoff of the day): Phase 9 admin DONE end-to-end (9.2/9.3/9.4/9.7/9.8/9.14 shipped + 9.13/9.15 + all earlier 9.1/9.5/9.6/9.10/9.11). Three structural refactors landed mid-session.
  DONE SINCE LAST HANDOFF:
    PHASE 9 admin — all surfaces shipped except 9.9 reports (deferred, lowest priority).
      9.2 + 9.3 merged into ONE: /admin/users polymorphic table (partner + company in one list) with role switcher + suspension tri-state filter (UX research: Stripe/Linear pattern). Row click opens AdminUserDetailOverlay (Profile + Account + Activity, role-aware). No `[slug]` route — users don't get a standalone detail page (overlay covers it, matches every other admin pattern). Mocks: fetchUsers (server-side filters), fetchUserById (returns user + profile + computed activity slice incl. flag_count + recent_flags). Suspend/Unsuspend/ResetPassword via ConfirmDialog. NO admin-to-user direct messaging (out of V1 — admin emails users instead; sendMessageToUser stub deleted everywhere).
      9.4 /admin/campaigns — all-campaigns table (no row kebab, table is read-only). Row click opens AdminCampaignDetailOverlay reusing partner-facing DetailHero + DetailContentSections + SalesKitSection. Admin action rail (force-pause/resume/close) lives in the overlay footer. Admin NEVER navigates to /marketplace/[slug] — admin stays under /admin/campaigns/*. Featured flag REMOVED from V1 entirely (data-model-spec + types + seed + admin.js mocks + i18n + page UI) — partner marketplace has no featured filter so it would have been admin overhead with zero user-facing payoff.
      9.7 /admin/flags — single polymorphic table with role switcher (Partners default · Companies). Threshold filter inside FilterPanel with 4 chips (All incl. 0 / ≥1 default / ≥3 alert / Custom) + a conditional numberInput section that reveals when "Custom" is selected. Row click reuses AdminUserDetailOverlay — flag list surfaces in the overlay's Activity section.
      9.8 /admin/settings — grouped cards by category (Fees & Escrow · Time windows · Files & Uploads). Edit-in-place with type-appropriate input + unit suffix. ConfirmDialog before save (destructive treatment for platform_fee_percentage + escrow_min_deposit_da). Info icon + Popover per row with "What this controls" + "What changes when you edit it" copy. CRITICAL: every PlatformSetting is now WIRED end-to-end — getPlatformSetting(key, fallback) sync helper in lib/mock/admin.js is the single source of truth, and 8 readers consume it (leads.js createLead → platform_fee_percentage; fund-helpers.js + escrow.js fundWallet → escrow_min_deposit_da; leads.js fetchPartnerLeads/fetchCompanyLeads → lead_acknowledgment_window_days as ack_deadline derived field; admin.js _disputeRow → client_verification_timeout_days as verification_deadline; profile.js resubmitForReview + ReviewStatusBanner.jsx → reapplication_cooldown_days; FormInputs.jsx FileInput default → max_upload_size_mb; partner-links.js → click_dedup_window_minutes + partner_link_attribution_window_days). Forward-only — existing seed values stay frozen.
      9.14 AdminRouter rewritten as MIDDLEWARE-ONLY route guard (proxy.ts) — no client-side AdminRouter.jsx. Mock-era cookie shim: client/src/lib/auth-cookie.ts mirrors role into `sellwell_role` cookie on every login/role-switch/logout; middleware reads it from request cookies and rewrites unauthorized hits to /[locale]/__not_found__ → 404. When Django ships, swap cookie name in the single helper file.
      ADMIN DETAIL OVERLAYS — refactored into shared primitives (no duplication). client/src/components/shared/user-profile/: UserProfileSection (role-aware photo/bio/LinkedIn/CV ↔ logo/industry/website/desc) + UserAccountSection (email/signup/status/email-verified/suspended_at/prior-note) + UserActivitySection (role-specific KPI grid + Recent Flags timeline) + labels.js (3 label-mapper helpers). VerificationDetailOverlay + AdminUserDetailOverlay + AdminCampaignDetailOverlay's Company section all consume them. SAME data, SAME fetchUserById path everywhere — single source of truth across admin surfaces.
    FLAG MODEL added (project_flag_model.md memory) — replaced the denormalized `flag_count` integer with a real Flag model (id · user · flagged_by · lead? · reason · created_at). Append-only audit log. Counts computed via Count('flags_received') aggregate (Discourse/Mastodon pattern). Only resolveDispute writes Flag rows in V1. Spec + types + seed + every mock fn + every page that read flag_count updated in lockstep. Reason "fake lead flags"/"unreported sale flags" column REMOVED from /admin/flags table (same hardcoded string for every row of a role — useless; the real per-flag reason lives in the Activity section's Recent Flags list).
    PARTNER+COMPANY SETTINGS REFACTOR (end-of-session) — /settings route DELETED entirely (route folder + PartnerSettingsPage + CompanySettingsPage + SettingsRouter). Settings dropped from sidebar bottom-dock. General tab content (profile-edit form) moved INTO the Profile detail overlay opened from the dock. Notifications tab moved INTO /notifications as a second tab (StatusTabs strip: Inbox + Preferences). Banking + Security sections added to the Profile overlay alongside Profile-info. BANKING MODEL GENERALIZED: BankingInfo was partner-only OneToOne → SalesPartnerProfile in data-model-spec; generalized to OneToOne → User so companies (which need banking-info for the manual withdrawal flow per escrow-leads-spec.md) have a real source. Atlas CRM seeded with banking-info row. New mock fns: fetchBankingInfo(userId), saveBankingInfo(userId, patch).
    MIDDLEWARE — added /admin to protected-tree map alongside the existing authenticated app tree; removed /settings from the map (route deleted).
    NEW MEMORY ENTRIES — feedback_canonical_status_labels.md (one en + one fr per enum value app-wide; canonical UserApplicationStatus pair = "More info requested" / "Info requise"), project_flag_model.md (append-only Flag log + compute-on-read).
  REFACTOR DEBT STILL OUTSTANDING (CRITICAL — read CLAUDE.md top block):
    Option A → Option B routing refactor. Every role-branched route still uses XRouter.jsx client-side gates. Must happen BEFORE Phase 11 backend wiring. Documented in detail at the top of CLAUDE.md.
    Duplicate analytics components (CompanyCommissionChart ⇄ CommissionChart; EscrowSummaryCard ⇄ EscrowWalletCard; PartnerLinkPerformance ⇄ PartnerLinkCard) — flagged in FRONTEND_TODO.md 7.1 refactor-debt note. Collapse before Phase 11.
    Wizard step validation (7.3) — campaign-create wizard validates only on Step 5 review; user can advance through Steps 1-4 with empty required fields. Deferred per FRONTEND_TODO.md.
    FRONTEND_TODO bookkeeping — phases 6.4/6.5/6.6/7.5/7.6/7.9/7.10/7.11 are unticked but per the older session handoff log + the actual file structure they're shipped. Need a tick pass.
    Phase 10 Polish — zero items started (verification-gate audit, EmptyState, Skeletons, error boundaries, lazy-loading audit, responsive pass, keyboard nav, ARIA, prefers-reduced-motion). Some of these will land naturally during next session's polish + mock-entanglement pass.
    Real gaps still: 6.9 /earnings (partner withdrawal page unbuilt), 7.8 /escrow (full wallet detail unbuilt), 9.9 /admin/reports (deferred).
  NEXT: see the standalone session-kick-off prompt the user is using to start the next session.
-->
<!-- SESSION HANDOFF (2026-05-13): Massive Phase 9 admin progress + 2 new project-wide hard rules + minimum-viable user-side settings.
  DONE THIS SESSION:
    9.1  /admin/dashboard — full overhaul: attention-queue rows (Stripe Radar pattern) replacing chips, 3 leaderboard cards (top campaigns/partners/companies, with row sparklines + DeltaPill), question-style stat-card titles, (N)-prefix browser-tab counter. fetchAdminDashboardStats extended with attention + leaderboards + 7-day signup sparkline. New shared primitive: DeltaPill (shared/data-display/). New admin components: AttentionQueueCard, LeaderboardCard.
    9.10 /admin/verifications — full queue + right-rail DetailOverlay (Profile + Account sections). 3 actions (Approve / Request more info / Reject) all wired through ConfirmDialog with required reason where applicable. fetchVerifications takes server-side `search`. Banner round-trip verified: admin's note → user.application_review_notes → AuthBanners on user dashboard works end-to-end.
    9.11 /admin/withdrawals — full queue + WithdrawalDetailOverlay. State-machine footer (pending → Mark processing + Reject; processing → Mark completed + Reject; completed/rejected → read-only). CompleteWithdrawalDialog with required FileInput proof, hard-validated (Submit disabled until file selected). Proof rendered via DocumentCard + DocumentPreviewModal. Polymorphic: company completions write a WalletTransaction; partner completions don't. Seed expanded: +5 pending mixed roles/methods, +2 completed with real PDF/image proofs, +1 stale (red age tone).
    9.5  /admin/disputes — queue with 3 tabs (Active / Expired-verifying / Resolved). Age-toned days_waiting cell. Server-side search (4-field). Row click → /admin/disputes/[slug].
    9.6  /admin/disputes/[slug] — full route page (not overlay — admin needs the context for money-moving rulings). 2-col layout: lead facts + parties (partner card + company card with flag_count) + client contact + chronological outreach log (TimelineStep) on the left; sticky ActionRail on the right.
    Authority constraint preserved: fetchDisputeBySlug returns null for non-admin-visible statuses → page renders NotFound shell, not a data leak. resolveDispute now bumps partner flag_count on 'no_sale' rulings (spec gap fixed mid-session).
    DISPUTE ACTION-RAIL REFACTOR (end-of-session): originally 4 buttons (Contact / Rule sale / Rule no sale / Needs more investigation). User flagged that "Contact client" and "Needs more investigation" wrote indistinguishable LeadVerification rows — real semantic conflation. Merged them into one "Add note" button. Now 3 actions: Add note (secondary, top) → divider → Sale happened (green tint) + No sale (red tint) side-by-side. Status-tinted secondaries, NOT solid black slabs (user pushed back on the heaviness). NeedsInvestigationDialog deleted; resolveDispute mock stripped of needs_investigation branch; partner-links-dashboards-admin-spec.md updated to match. Append-only rule kept (no edit/delete on LeadVerification rows — match LeadNote V1 immutability).
    SETTINGS PAGES (minimum-viable user-side) — built ahead of Phase 6.10 + 7.12 to close the more_info_requested resubmit loop end-to-end:
      Partner /settings + Company /settings, 2 tabs each: General (real profile edit form + ReviewStatusBanner with admin note + Submit-for-review CTA) + Notifications (ComingSoon stub deferred to Phase 10).
      New mocks: fetchCurrentUserProfile, updatePartnerProfile, updateCompanyProfile, resubmitForReview (server-side cooldown guard, partner flag_count untouched).
      Sidebar bottom-dock Settings row converted from DetailOverlay trigger → actual <Link> with role-aware href (/admin/settings for admin, /settings otherwise). Order in dock: Settings · Profile · Help · Language.
      Seed: user 9 (Maghreb HR) reseeded to more_info_requested + new user 11 (Casbah Tech) added in pending_review to keep verification queue balanced.
  NEW PROJECT-WIDE HARD RULES (CLAUDE.md §2 + §3 — added this session, load-bearing):
    §2 — Every downloadable / previewable document goes through shared/data-display/document/ (DocumentCard + DocumentPreviewModal). Never hand-roll <a href={url}>Download</a>. Zero exception, even for one-off files. Always pass onPreview to DocumentCard — let the card decide previewability; do NOT wrap onPreview in a custom previewability guard at the call site (this bug ate a click-test cycle).
    §3 — Search, filters, sorts on list pages are SERVER-SIDE. Every filter state threads through the React Query queryKey AND the mock fn signature; mocks narrow rows server-side; pages read `data` as-is. Never .filter() the React Query result client-side. Reason: DRF PageNumberPagination will silently break client-side narrowing once it ships. Single exception: bounded in-memory datasets (categories, tags, the 8 platform settings, the 5 doc slots).
    Both rules also reflected in client/Skills/dos-and-donts.md + memory files (feedback_document_preview.md, feedback_server_side_filters.md).
  REMAINING IN PHASE 9: 9.2/9.3 (users + slug detail), 9.4 (campaigns), 9.7 (flags), 9.8 (platform settings), 9.9 (reports), 9.12 (admin notification routing — partially shipped earlier), 9.13 (RoleSwitcher admin entry — already shipped), 9.14 (AdminRouter guard around every admin page — NOT YET, all admin routes currently unguarded), 9.15 (LeadVerification seed + mock — shipped). FRONTEND_TODO.md Phase 9 is the source of truth.
  REMAINING CROSS-PHASE: the more_info_requested resubmit loop is closed end-to-end with the new /settings General tab; banner round-trip verified. The Phase 6.10 / 7.12 callout at the top of FRONTEND_TODO.md should still flag that Banking / Notifications / Language tabs are NOT yet built — those land in their proper phase. Settings.tabs labels are now "general" + "notifications" only (matches the old DetailOverlay's 2-tab shape).
  NEXT: confirm with the user which Phase 9 page to ship next. The remaining order I'd propose is 9.4 (/admin/campaigns) → 9.2+9.3 (/admin/users + slug detail) → 9.7 (/admin/flags) → 9.8 (/admin/settings) → 9.9 (/admin/reports) → 9.14 (AdminRouter guard pass on all 9 routes). 9.9 is lowest priority per the original plan.
-->

# SellWell Client — Agent Instructions

## ⚠️ CRITICAL REFACTOR DEBT — Routing model (decided 2026-05-10, not yet executed)

We are currently on **Option A** for role-aware routing: a shared URL space (`/dashboard`, `/campaigns`, `/applications`, `/leads`, `/marketplace`) where each route owns a thin client-side `XRouter.jsx` that reads `useAuth().user.role` and dispatches to the role's component (`PartnerXPage` vs `CompanyXPage`). It works today and ships product fast, but research against production Next.js 16 multi-role apps (Dub, Cal.com, Formbricks, Vercel Platforms, Papermark) is unanimous: **they all use Option B — fully separate route trees per role** (`app/(partner)/p/...` + `app/(company)/c/...`).

**Why Option A is debt:**
- Forces every shared page client-side (the role gate has to read auth on the client), giving up React Server Components streaming and Partial Prerendering on pages where we'd most benefit.
- Different layouts per role can't diverge cleanly — sidebar, providers, role-specific shell concerns share one layout file.
- SSR sees no role on first paint → tiny "auth-ready gate" loading flash on every shared route.
- Middleware can't role-redirect cleanly (it can't differentiate `/applications` for partner vs company).

**The Option B refactor (do later, before backend wiring or before SEO matters):**
1. Move existing role-branched routes into role-prefixed route groups: `app/[locale]/(partner)/p/(app)/...` + `app/[locale]/(company)/c/(app)/...`. Each gets its own `layout.jsx` (own DashboardShell, own providers, own sidebar config).
2. Middleware: redirect `/` (and any unprefixed `/[shared-route]`) to `/p/<route>` or `/c/<route>` based on `request.user.role`. Anonymous traffic continues to `/login`.
3. Update `nav-config.js` to emit role-prefixed `href`s.
4. Update every internal `<Link>` in components to use the role-prefixed path. Most sites: `useRouter` calls, deep-links from notifications, `?campaign=`/`?open=` query-param synced links.
5. Delete the `XRouter.jsx` files (`ApplicationsRouter`, `CampaignSlugRouter`, `LeadsRouter`, `DashboardRouter` etc) — Next.js handles dispatch via the route tree.
6. Update slug-based URLs: `/campaigns/[slug]` becomes `/c/campaigns/[slug]` (company-only); partners continue at `/p/marketplace/[slug]`. The 301 from old slugs through `CampaignSlugHistory` keeps working — just adds the role prefix to the redirect target.
7. Audit external deep-links (notification routes, email templates) — they need to bake role into the URL OR a middleware handler at `/applications?notif=...` reads role and redirects.

**Estimate:** 1–2 hour refactor on this codebase's current size. Doing it later will be more painful proportionally to how many shared routes ship in the meantime.

**Tracking:** flag this as the first item in any pre-backend cleanup pass. The Option A → B switch must happen BEFORE Phase 11 (backend wiring), because backend session-based auth interacts cleanly with middleware role redirects but awkwardly with client-side role gates.

---

<!-- SESSION HANDOFF (2026-05-10 — second handoff of the day): Phases 7.4 → 7.7 shipped end-to-end. Phase 7.8 /escrow is next. -->
<!-- DONE SINCE LAST HANDOFF:
  7.5 /applications (company) — ApplicationsRouter (role branch), CompanyApplicationsPage (PageHeader + StatusTabs + SearchInput + ?campaign chip + DataTable), CompanyApplicationDetailOverlay (Pitch reused + new PartnerSection + Timeline reused, footer Approve/Reject with verification gate + Reject reason ConfirmDialog), reviewApplication mock now real (mutates seed, stamps reviewed_at + review_reason). URL sync: ?campaign=<slug> filters + chip; ?open=<id> auto-opens overlay (closedIdRef pattern fixes close-then-reopen race).
  7.6 /leads (company) — went WAY beyond spec. Built: LeadsRouter (role branch), CompanyLeadsInbox (full-width Vault Meter wallet header on top + table below), LeadInboxWalletHeader (premium Framer Motion: spring counters + 4px partition bar + debit ghost animation, all sharing ANIM_DURATION 0.9s + ease [0.4,0,0.2,1] for synced "money moving" feedback), ReservationsActivityFeed (right half of header — top 5 wallet transactions with type-coloured icons + relative time + AnimatePresence enter on new row), ReserveConfirmDialog (Vault Receipt: shield + 'Held in escrow, not spent' + persistent green refund strip + inline T&Cs link), CompanyLeadDetailOverlay (6 sections with locked states pre-reservation + LeadNotesSplit when revealed), LockedSection (paywall-style gate), ClientSectionIdentityOnly (notes-extracted variant), LeadNotesSplit (partner read-only timeline + company composer with addCompanyLeadNote), full-blackout pre-reservation masking (no name/phone/email/notes/docs leak). FilterBar + LeadsInboxSort (newest/reservation_high/reservation_low) + FilterPanel (Campaign + Partner multi-select). Mock layer: acknowledgeLead now real (debits via reserveForLead + writes WalletTransaction + stamps acknowledged_at + tracking_window_expires_at), fetchCompanyLeads with full contact masking + partner-submitted notes/docs gated by contact_revealed flag, LeadNote.author field added (partner|company) + seed backfill + addCompanyLeadNote.
  7.7 /leads/[slug] (in-overlay only, standalone route deferred) — ConfirmSaleDialog (Vault Receipt v2 with editable sale-amount + LIVE commission/platform-fee preview for percentage deals + return-to-wallet/exceeds-reservation reconciliation strip), DenyConversionDialog (required reason min 20 chars + verification trust strip explaining escrow stays frozen). Footer state machine on CompanyLeadDetailOverlay: acknowledged → Confirm/Deny, submitted/pending → Reserve, else → FooterStateChip. Mocks: confirmSale recomputes commission for percentage campaigns + writes release_commission + release_platform_fee transactions + leftover-return; denyConversion flips to disputed_verifying + stores denial_reason (escrow stays frozen until admin rules per Phase 9). New escrow helpers: releaseFromEscrowForLead + returnToWalletForLead.
  ARCHITECTURE DECISION LOGGED: standalone /leads/[slug] route deferred — overlay covers everything Upwork-style. Spec line about slug routing met by /leads?open=<id> deep-link pattern. Rationale documented in FRONTEND_TODO.md 7.7.
  ROUTING DEBT (CRITICAL, top of CLAUDE.md): Option A → Option B (role-prefixed routes) refactor still pending. Must happen before backend wiring (Phase 11).
-->
<!-- NEXT: Phase 7.8 /escrow — wallet detail page with full transaction history table + Fund/Withdraw CTAs. Reuse EscrowWalletCard primitive (shared/analytics) for the hero, build DataTable for the transaction history. The fetchTransactions mock is already wired and ready. -->
<!-- ARCH DELTAS THIS SESSION (locked, don't undo):
  NEW PRIMITIVES: LeadInboxWalletHeader, ReservationsActivityFeed, ReserveConfirmDialog, ConfirmSaleDialog, DenyConversionDialog, LockedSection, ClientSectionIdentityOnly, LeadNotesSplit, LeadsInboxSort, CompanyLeadDetailOverlay, ApplicationsRouter, CampaignSlugRouter, LeadsRouter, PartnerSection (applications), PartnerCell (applications), CompanyApplicationsPage, CompanyApplicationsEmptyState, CompanyLeadsInbox, CompanyLeadsInboxEmptyState, CompanyApplicationDetailOverlay.
  DATA MODEL: LeadNote.author field (partner|company); types/lead.ts updated; existing seeds backfilled to 'partner'; 4 company-authored notes seeded on leads 103/104/105.
  MOCK DATA: addCompanyLeadNote, acknowledgeLead, confirmSale, denyConversion, reviewApplication, fetchCompanyLeads, fetchCompanyApplications all real now (write back to seed). Helpers: reserveForLead, releaseFromEscrowForLead, returnToWalletForLead in escrow.js.
  SHARED PRIMITIVE FIX: FilterPanel was calling applyLive inside a setLocalValues updater (React 19 violation — render-phase setState in parent). Fixed by computing outside the updater.
  ANIMATION DISCIPLINE: All wallet header animations share ANIM_DURATION (0.9s) + ANIM_EASE [0.4,0,0.2,1]. Bar uses tween (not spring) so it locks with the counter ticks. Applies to mount, reserve debit, refetch.
  TRUST-COPY PATTERN: every money-moving dialog has shield-icon headline + persistent coloured trust strip (green for refundable / release, blue for verification, red for blocked) + inline T&Cs link to /terms (route doesn't exist yet, intentional). Used by ReserveConfirmDialog, ConfirmSaleDialog, DenyConversionDialog. Mercury / Upwork escrow aesthetic.
-->

<!-- SESSION HANDOFF (2026-05-10): Phase 7.4 /campaigns/[slug] shipped end-to-end. Phase 7.5 /applications is next. -->
<!-- DONE THIS SESSION:
  7.4 /campaigns/[slug] — CompanyCampaignDetail (8/4 split, sticky ManageRail right, content left). CompanyDetailHero (logo+meta+inline StatusBadge+title+tagline+updated_at line+16:9 cover). CompanyContentSections (About → PricingTiersBlock → RecentApplicationsPreview → RecentLeadsPreview → SalesKitSection reuse → Audience → Requirements → Tags). ManageRail (commission headline + 2x2 KPI mini-grid Partners/Leads/Conv-rate/Revenue + action stack Edit/Pause-or-Resume/Close + meta tracking-window + Partner Links pill; ConfirmDialog per transition with bespoke copy + verification gate disables pause/resume/close). CampaignEditOverlay built on shared DetailOverlay primitive (4 sections: Overview/Pricing/Commission/Audience, single Save in footer, fires toast.warning on validation fail per the form-rule, key={updated_at} re-mounts overlay so form re-initializes from latest saved state). RecentApplicationsPreview (5 rows pending-first, deep-link /applications?campaign=slug&open=id). RecentLeadsPreview (5 rows newest-first, drafts filtered, deep-link /leads/[slug]). PricingTiersBlock (single-vs-multi rendering convention). Role branch in CampaignSlugRouter — partner lands here = router.replace to /marketplace/[slug]; admin gets a forwarder placeholder.
  MOCKS: fetchCampaignBySlug({slug, companyId}) returns campaign enriched with KPIs (active_partners_count, leads_count, converted_count, conversion_rate, revenue_total, commissions_paid) + documents (slot-ordered) + recent_applications (5, pending-first FIFO, partner slice) + recent_leads (5, newest-first, partner+tier slice) + company slice + category_resolved. companyId mismatch returns null so the page 404s instead of leaking another company's data. pauseCampaign/resumeCampaign/closeCampaign now ACTUALLY mutate _campaigns AND write back to MOCK_CAMPAIGNS (so marketplace + dashboard widgets reflect the new status). updateCampaign(id, patch) does real partial mutation + write-back.
  i18n: full Campaigns.companyDetail.* namespace (hero, pricing, applications, leads, sections, rail, confirm, edit, adminForward) in en + fr lockstep.
-->
<!-- NEXT: Phase 7.5 /applications — company-side applications queue. Partner table with photo + pitch preview + applied date + Approve/Reject buttons. Verification gate on action buttons. Mock fetchCompanyApplications already exists. Reuse DetailOverlay for the per-application expanded view. -->
<!-- ARCH DELTAS THIS SESSION (locked, don't undo):
  NEW FOLDER: src/components/campaigns/detail/ (8 components incl. edit/ subfolder with 4 section forms). NEW ROUTE: app/[locale]/(app)/campaigns/[slug]/page.jsx + CampaignSlugRouter for the role branch.
  MOCKS: pauseCampaign/resumeCampaign/closeCampaign + updateCampaign now write back to MOCK_CAMPAIGNS — earlier session flagged them as no-ops; that's fixed. Slug router decision: company gets the management view, partners are SPA-redirected to /marketplace/[slug] so the same slug resolves to the role-appropriate surface.
  REUSED: shared/overlays/DetailOverlay (CampaignEditOverlay), shared/feedback/ConfirmDialog (3 transitions), shared/feedback/EmptyState (preview empty branches), shared/data-display/StatusBadge + Avatar, marketplace/detail/SalesKitSection (Sales Kit on the company side reuses the partner primitive — same docs, same modal, no duplication), marketplace/detail/DetailSkeleton (loading state during fetch), shared FormInputs (TextInput / TextArea / DropdownInput / ToggleAction-via-buttons in EditCommissionSection).
  HARD RULE LANDED: Edit overlay form-validation fires toast.warning + inline field errors on Save click — per the existing form-rule. No new memory needed; just observed.
-->

<!-- SESSION HANDOFF (2026-05-09 — third handoff): Phases 7.1 + 7.2 + 7.3 (incl. 7.3.1) fully shipped. Phase 7.4 /campaigns/[slug] is next. -->
<!-- DONE THIS SESSION:
  7.1 /dashboard (company) — CompanyDashboard: KpiBand (StatCard reuse), CompanyCommissionChart (recharts dual-series), LeadsInboxPreview (5-tab triage), EscrowSummaryCard (health bar + Fund/Withdraw), ApplicationsQueue (FIFO), ActiveCampaignsList, PartnerLinkPerformance (empty state). Mocks: escrow seed, company-stats.js, fetchCompanyApplications, fetchWallet. i18n: Dashboard.CompanyDashboard.* en+fr. Bug fixed: chart was blank (flex-1 collapsing without parent height, fixed to h-[18em]). KPI sparklines removed from company side (overlapped short DZD values). Refactor debt note saved under 7.5 in FRONTEND_TODO.md.
  7.2 /campaigns — CompanyCampaignsPage: CampaignCardShell extracted as shared primitive (shared/data-display/), MarketplaceCard refactored to consume it, CompanyCampaignCard (cover image + StatusBadge overlay + conversion-rate pill + kebab menu), CampaignActionsMenu (Popover + ConfirmDialog + useToast), StatusTabs with react-icons, verification gate on Create CTA. Kebab Popover placement="top". Mocks: fetchCompanyCampaigns + fetchCompanyApplications enriched. i18n: Campaigns.companyList.* en+fr.
  7.3 /campaigns/new — 5-step wizard: WizardShell (Framer Motion morphing-ring stepper + AnimatePresence direction-aware content slide), Step1ProductDetails (FileInput variant=image for cover), Step2PricingTiers (single-price vs multi-tier UX: single tier = just price field + inline "Add another tier" button + Info icon Popover; multi-tier = name+price columns), Step3Commission (Toggle.jsx new shared primitive + Partner Links section + copyable code snippets + Test Webhook), Step4SalesKit (DocumentCard/DocumentPreviewModal/EmptyDocumentSlot reuse), Step5Review (field checklist with pathLength checkmarks). Per-step validation: validateForStep() blocks Next + fires toast.warning + inline errorMessage on required fields. Mocks: saveCampaignDraft, publishCampaign, testChargilyWebhook, uploadCampaignDocument. i18n: Campaigns.wizard.* en+fr (incl. validation.*).
  GLOBAL FIXES: number input spinners removed globally in globals.css. SellWell logos + typemark swapped in from /public (Sellwell-logo-noBG.png mark, SellWell-Typemark-nobg.png) — Navbar/Footer use imported asset + height=48 w-auto; Sidebar: collapsed=mark only, expanded=mark + "Sell"(text-text)+"Well"(text-accent) with Framer Motion slide+fade animation on the wordmark (max-width 0→8em + opacity + translateX).
-->
<!-- NEXT: Phase 7.4 /campaigns/[slug] — company campaign detail page. Read FRONTEND_TODO.md Phase 7.4 section carefully before starting. -->
<!-- ARCH DELTAS THIS SESSION (locked, don't undo):
  NEW SHARED PRIMITIVES: CampaignCardShell (shared/data-display/), Toggle (ui/Toggle.jsx).
  NEW MOCKS: src/lib/mock/_seed/escrow.ts, src/lib/mock/escrow.js (real fetchWallet/fetchTransactions), src/lib/mock/company-stats.js (fetchCompanyStats/Actions/CommissionTimeseries/PartnerLinksPerformance), fetchCompanyCampaigns + fetchCompanyApplications added to campaigns.js, saveCampaignDraft/publishCampaign/testChargilyWebhook/uploadCampaignDocument stubs.
  ASSETS: /public logos copied to src/assets/ for ES module import (Spotlight pattern).
  GLOBALS: input[type=number] spinners removed globally.
  REFACTORED: MarketplaceCard now consumes CampaignCardShell (no behavior change).
  COMPONENTS: dashboard/company/ folder (7 components), campaigns/wizard/ folder (6 components), campaigns/CampaignActionsMenu.jsx, campaigns/CompanyCampaignCard.jsx, campaigns/CompanyCampaignsPage.jsx.
  ROUTES: /campaigns/page.jsx (role-branched), /campaigns/new/page.jsx.
-->
<!-- CRITICAL LESSON THIS SESSION: Before building ANY new component, read ALL existing shared components in src/components/shared/ including analytics/, data-display/, forms/, layout/, feedback/, overlays/. The session re-built EscrowSummaryCard duplicating EscrowWalletCard, and built CompanyCommissionChart duplicating partner CommissionChart. Both are flagged as refactor debt in FRONTEND_TODO.md 7.1. DO NOT repeat this — always read shared components first. -->

<!-- SESSION HANDOFF (2026-05-09): Phases 6.4–6.8 + 6.6.1 + 6.6.2 fully shipped. Partner side is now ~complete. -->
<!-- DONE THIS SESSION:
  6.4 /applications — tabbed table + ApplicationDetailOverlay (3 sections: Pitch, Timeline, Campaign) + cooldown countdown on rejected.
  6.5 /leads — 5-tab table + LeadDetailOverlay (5 sections: Client/Notes, Timeline, Documents, Campaign, Commission) + draft status.
  6.6 /leads/new — Save-as-draft form (optional firstNote + optional file attachments). Routes to /leads?tab=draft on save.
  6.6.1 draft+notes — draft LeadStatus, LeadNote model (replaces conversation_notes), submitLead(), addLeadNote() with optional backdating, vertical timeline-rail NotesTimeline with NoteRow/NoteComposer/note-helpers split.
  6.6.2 documents — LeadDocument model, DocumentsSection (5th overlay section, editable on draft / read-only post-submit), AddDocumentComposer (file+url modes), /leads/new gets optional Attachments section.
  6.7 — CLOSED (subsumed by overlay, no standalone page needed).
  6.8 /partner-links — FULL: seed integrity audit+repair (4 hard violations fixed across applications/partner-links/leads/notifications seeds), fetchPartnerLinks (enriched+click_buckets), fetchEligibleCampaignsForLinks, generatePartnerLink (one-per-pair guard), Sparkline extended with inline mode, CopyPill new shared primitive (Stripe pattern + success toast), KpiStrip, GenerateLinkPanel, PartnerLinksPage, PartnerLinkDetailOverlay (4 sections: Link/Performance/Sales/Campaign).
  6.9 /earnings + 6.10 /settings — placeholder "coming soon" pages only.
  NOT_FOUND — [locale]/not-found.jsx + [...rest] catch-all route (locale-level, inherits layout/fonts/i18n/providers).
  FORM RULE — every submit button that can fail validation must fire toast.warning(tCommon("formErrorsBody"), { title: tCommon("formErrorsTitle") }) alongside inline red errors. Documented in dos-and-donts.md + memory.
-->
<!-- NEXT: Phase 7 — Tech Company Dashboard (/company/dashboard, /company/leads, /company/campaigns, /company/applications, /company/escrow). Read Phase 7 section in FRONTEND_TODO.md before starting. -->
<!-- ARCH DELTAS THIS SESSION (locked): shared/forms/CopyPill.jsx, shared/analytics/Sparkline.jsx (inline mode added), lead-detail/notes/ folder, lead-detail/documents/ folder, partner-links/ feature folder, app/[locale]/[...rest]/page.jsx catch-all, app/[locale]/not-found.jsx. -->

<!-- SESSION HANDOFF (2026-05-09 — second handoff of the day): Phase 6.3 (/marketplace/[slug] campaign detail) + 6.3.1 (Sales Kit) shipped end-to-end. Plus a project-wide refactor: every user-facing route now uses [slug] not [id] (memorized as feedback_slug_not_id.md), and Partner Links collapsed from two-mode (hosted+redirect) to redirect-only — SellWell never hosts product pages or holds payment in V1. -->
<!-- NEXT: Phase 6.4 /applications, then 6.5 /leads, 6.6 /leads/new, 6.7 /leads/[slug], 6.8 /partner-links, 6.9 /earnings, 6.10 /settings. Phase 6 finishes the partner side; Phase 7 is the company side. Click-test pass on 4/5/6.x deferred. -->
<!-- ARCH DELTAS THIS SESSION (locked, don't undo): -->
<!-- (1) Slug-only routing for every user-facing detail page. /marketplace/[slug], /campaigns/[slug] (company-side), /leads/[slug] (both sides), /admin/users/[slug], /admin/disputes/[slug] (resolves via Lead.slug). Backend REST API still keeps numeric IDs; this is a frontend URL rule. New CampaignSlugHistory model documented for rename-via-append + 301. Lead.slug shape: {first}-{last}-{short-suffix} (e.g. mehdi-touati-7k2). Campaign.slug auto-generated from product_name with collision suffix (atlas-crm, atlas-crm-2). Memory: feedback_slug_not_id.md. -->
<!-- (2) Partner Links — DROPPED hosted mode entirely. partner_link_mode field, PartnerLinkMode type, /p/[slug] route, Phase 8A all removed. PartnerLink.mode + PartnerLinkSale.mode dropped. Every Partner Link is now sellwell.dz/r/[code] → 302 to merchant_redirect_url with ?sw_click=<external_click_id>. Merchant is merchant of record on Chargily; SellWell never holds payment. Phase 8 collapsed to 4 items (8.1 redirect handler, 8.2 webhook receiver, 8.3 link generation, 8.4 reconciliation cron). -->
<!-- (3) Phase 6.3 /marketplace/[slug] live: 8/4 desktop split (content left, sticky right rail). Hero is content-first (logo+title+tagline THEN 16:9 cover image, NOT image-first). layoutId shared element on the company logo morphs from listing card → detail hero. ApplyRail is sticky (top-[1.5em]) with: commission headline, PricingTiersList (read-only), inline meta (tracking window + partner links), Apply state machine (idle → expand inline textarea → submitting → green checkmark pill "Application sent"). Toast fires alongside the inline pill on success. ≥20 char min on pitch, 1000 char max. Already-applied users see StatusBadge instead of button. Element-level micro-stagger entrance (60ms between rows, y:8→0, 350ms ease-out, NO page-level fade). -->
<!-- (4) Phase 6.3.1 Sales Kit — sales-enablement docs the company optionally attaches to a campaign. NEW shared primitives at shared/data-display/document/: DocumentCard.jsx (3 variants: grid/row/attachment), DocumentIcon.jsx (kind-keyed Lucide), DocumentPreviewModal.jsx (PDF iframe NO sandbox + YouTube/Loom/Vimeo embed via toEmbedUrl + image preview + unpreviewable fallback), EmptyDocumentSlot.jsx (dashed border), barrel index.js. lib/format/file.js holds inferFileKind/detectVideoProvider/toEmbedUrl/fileNameFromUrl/formatFileSize. SalesKitSection.jsx (feature wrapper) lives at marketplace/detail/, renders BETWEEN "About" and "Who this is for". Modal is 52em wide × 88vh tall (fixed height not max-height — was collapsing). Section auto-hides when kit is empty (no point rendering empty-state cards on a kit with zero docs). 4 named slots: pitch_deck, one_pager, pricing_sheet, demo_video_url. 5th slot "other" is multi-row with custom labels. Demo video is URL not file upload. NO language tag in V1. -->
<!-- (5) CampaignDocument data contract landed: data-model-spec.md + types/campaign.ts + _seed/campaign-documents.ts (11 realistic rows: full kit on Atlas CRM id 1, partial on Sahara K8s id 2, single doc on Maghreb HR id 3, deck+video on Atlas Enterprise id 4, EMPTY on 5-9 to exercise hidden-section state) + mock/marketplace.js enrich() folds documents:[] onto every campaign. Atlas CRM pitch deck file URL points at Mozilla's pdf.js test PDF (mozilla.github.io/pdf.js/web/compressed.tracemonkey-pldi-09.pdf) so the iframe actually renders during click-test. Other URLs are placehold.co stubs. -->
<!-- (6) Marketplace listing chip strip CHANGED: was [All / Percentage / Flat] commission chips. Now [All / Unapplied (default) / Pending / Approved / Rejected] application-status chips. Default = "unapplied" so partner sees what's new first. Commission type moved into FilterPanel as a third single-select section alongside Category + Partner Links. Research-backed: real platforms show all items mixed with status badges; we let the partner filter when they want to revisit. -->
<!-- (7) FilterPanel rewrite: was position:absolute portal'd to document.body — broke when user scrolled (panel walked off, also overflowed outside the dashboard's white card). Now position:absolute portal'd into the closest scrollable ancestor (findScrollContainer walks up from triggerRef). Container-relative coords. Scroll-tracking is automatic (panel and trigger share the same scroll container). z-30 (was z-50) so it stays below sidebar/topheader. shadow-lg + border-border preserved (don't bump elevation — user said it felt floaty). -->
<!-- (8) Mock auth `applyToCampaign({ campaign_id, partner_id, pitch })` mutates MOCK_APPLICATIONS in place, returns the new row, throws { code: 'already_applied' } on duplicate (UI flips to pending StatusBadge in that branch). Toast wired via useToast — toast.success/info/error fire alongside the inline pill. -->
<!-- (9) New product-tags seed (_seed/product-tags.ts) — 13 tags from auth-onboarding-spec. Was missing entirely; campaign seeds referenced ids 1-12 with no source. fetchProductTags() now returns active rows. -->
<!-- HARD RULES SAVED TO MEMORY THIS SESSION: feedback_slug_not_id.md (every user-facing detail route is [slug], never [id]). All other memory rules from prior sessions still apply. -->
<!-- DATA SEEDS AS OF NOW: 9 active campaigns (atlas-crm, atlas-crm-enterprise-plus, atlas-crm-field-sales, sahara-stack-managed-kubernetes, sahara-stack-edge-cdn paused, sahara-stack-object-storage, maghreb-hr-payroll, maghreb-hr-performance-reviews draft, maghreb-hr-recruitment-ats). 5 have partner_links_enabled=true with merchant_redirect_url filled in (atlascrm.dz, saharastack.io/pricing, saharastack.io/cdn, saharastack.io/storage, maghrebhr.dz/ats). 4 have CampaignDocument rows (1, 2, 3, 4); 5-9 are empty kits. 12 leads with slugs (mehdi-touati-7k2 etc). 4 partner links all /r/[code] shape. 25 partner-link sales all with external_click_id filled. -->
<!-- BUGS FIXED THIS SESSION: (a) /marketplace/[slug] missing _seed/product-tags import — created the seed. (b) ApplyRail Cancel button referenced setSubmitError without it being passed as prop — added to ApplyAffordance destructure. (c) DocumentPreviewModal collapsed when iframe loaded slowly — added explicit h-[88vh]. (d) PDF iframe rendered blank — removed sandbox attribute (Chrome's PDF viewer needs full origin access). (e) FilterPanel walked off on scroll + overflowed white card — see arch delta (7). -->
<!-- ARCH DELTAS THIS SESSION (locked, don't undo): -->
<!-- (1) Phase 5.1–5.3 dashboard chrome live: DashboardShell (em-based widths 13.5em/4em, localStorage collapse, sm forces collapsed via matchMedia), Sidebar (toggle in TOP-LEFT of sidebar not header, brand non-clickable below toggle, role-aware nav from getNavForRole, full-width pill active state with bg-bg + accent-text — NOT bg-accent-light, no left border), TopHeader (no border, bell + avatar right-aligned, no toggle), white content card (rounded-[1em], border-border, sits on bg-alt). Sidebar bottom dock: Profile/Settings/Help shortcuts open DetailOverlay; Language is a popover (not overlay), inline LocaleSwitcher when expanded. Phase 5.4 NotificationBell ships with 30s polling (no WebSocket), badge with ring-bg-alt detachment, accent-tinted "Mark all read" pill button + outlined "View all notifications" pill, optimistic mark-read via setQueryData patches. Phase 5.5 UserAvatarMenu (Manage account → Profile overlay; Logout → useAuth().logout + router.replace("/login")). Phase 5.6 PageHeader (title + optional description + breadcrumbs + actions slot). Phase 5.7 /notifications real route (NOT an overlay — user changed their mind mid-build) — Bell nav entry added to PARTNER_NAV + COMPANY_NAV (admin omitted). -->
<!-- (2) AuthBanners RELOCATED inside TopHeader as compact pills (icon-only under xs, full pill xs+, click → Popover with full title/body/notes/action). AppShell no longer renders banners as a top band; the rejected branch + RoleSwitcher stay where they are. -->
<!-- (3) Popover primitive (shared/overlays/Popover.jsx) is BINARY API only (open/onClose). Internal mounted+visible booleans handle the close animation. Interruptible (mid-exit click reverses smoothly via cleanup). All setState wrapped in rAF/setTimeout — never in useEffect body (HARD RULE in this CLAUDE.md). triggerRef prop excludes the trigger from outside-click detection. -->
<!-- (4) LocaleSwitcher MOVED from landing/Navbar/ to shared/LocaleSwitcher.jsx (4 import sites updated). Variants: "default" (bg-bg-alt) + "onAlt" (bg-bg). onAfterChange callback so popover containers can self-close. -->
<!-- (5) Sparkline primitive (shared/analytics/Sparkline.jsx) — pure recharts AreaChart, no axes/tooltip/legend, tone-aware (positive/negative/muted). StatCard gained optional `sparkline` prop — anchored bottom-right at 70% width 55% height to clear value + trend pill. ONLY renders when `trend` is also present. -->
<!-- (6) Phase 6.1 Sales Partner Dashboard live: 4 money KPIs (Total earned + sparkline · This month + sparkline · Available with HIGHLIGHT styling · Pending in escrow with lead count) · 4 funnel KPIs (Clicks · Conversions · Conv rate · Avg/conv) · CommissionChart (recharts AreaChart, dual-series current+previous, glow filter on current line, 7d/30d/90d/12m range toggle) · ActionRequiredStack (severity tones warn/info/danger; synthesized from leads/applications/banking) · RecentLeadsTable (4 filter chips: All/Expiring soon/Awaiting confirmation/Confirmed this month, status-grouped) · ApprovedCampaignsList (right column, full-height aligned to RecentLeadsTable bottom edge). LatestHotLeadsList REMOVED (user dropped it mid-build). Withdraw button is bg-accent (NOT bg-cta) with shadow + hover lift — accent visibility was a concrete user complaint. -->
<!-- (7) Phase 6.2 Marketplace live at /marketplace: FilterBar (Filters button MOVED LEFT — used to be after chips), MarketplaceCard grid (1/2/3 col responsive), MarketplaceSort popover (Newest/Commission high-low/Commission low-high). Card layout: company logo+name+category overline · product name · 2-line description clamp · footer with mono commission + Partner Link badge + active-partners count + StatusBadge (when applied) OR black CTA "View" pill (h-2.5em px-1.125em rounded-[0.5em] shadow-sm, matches Withdraw button shape). HARD GATE on listing for unapproved partners: useMarketplaceGate hook returns email/pending_review/more_info_requested variant; MarketplaceGate component renders centered status card replacing FilterBar+grid (PageHeader stays). Research-backed pattern: NOT blurred content (cheap, paywall pattern), hard guard with type-led visual, soft SLA, mailto:support@sellwell.dz CTA. -->
<!-- DATA SEEDS (locked) — partner@sellwell.dz (id=1) is the dashboard test user: 9 active campaigns total (6 original + 3 added so View pills show on unapplied cards), 4 approved applications + 1 REJECTED on Sahara CDN (campaign 5, paused) + nothing on the new 7/8/9. 12 leads covering every LeadStatus including 1 expiring <48h. 25 partner-link sales over 90 days for chart. partner-stats.js computes deltas + sparklines. fetchPartnerLatestHotLeads was DELETED (LatestHotLeadsList removed). -->
<!-- BUGS FIXED THIS SESSION: (a) DashboardShell setState-in-effect-body (deferred to rAF). (b) Popover phase machine ignored open=true mid-exit (made interruptible). (c) i18n Marketplace namespace was nested inside Dashboard.* — moved to root in both en.json + fr.json. (d) next/image rejected placehold.co both for hostname AND because SVG default-rejected — added remotePatterns + dangerouslyAllowSVG with strict CSP. (e) FilterBar reorder applied globally (only 2 callers, safe). -->
<!-- HARD RULES SAVED TO MEMORY THIS SESSION (do NOT violate): (1) Never call setState synchronously in useEffect body — wrap in rAF/setTimeout/event handler, cleanup must cancel. (2) NEVER use max-w-* mx-auto layout caps on pages inside DashboardShell — the shell owns card width; only `px-[2em] py-[2em]` for page wrappers. Prose max-w-[Nch] is a different concern and stays allowed. (3) Don't build hooks files for one caller — call useQuery directly in the page component. (4) brief 2-5 line summary with markdown links after every Edit/Write/Delete (project rule). -->
<!-- BIG ARCH CHANGES (still locked, don't undo): Verification Policy — both roles land in pending_review on signup, admin-approval gate. Email-verif + admin-approval are 2 parallel gates. User has application_status enum (pending_review/approved/rejected/more_info_requested) + application_reviewed_at + application_review_notes. Escrow funding is NOT a signup gate — per-lead reservation only. Min escrow deposit = 1,000 DA. WithdrawalRequest model is polymorphic on user role. Chargily has NO outbound API — all withdrawals are MANUAL (admin disburses offline + uploads proof_document). NO national IDs collected. Backend /api/me/: dj-rest-auth USER_DETAILS_SERIALIZER override → MeSerializer with polymorphic profile field (saved to memory/project_backend_me_endpoint.md). -->
<!-- LOCKED COPY/VISUALS (don't undo): CTABanner sub-copy "The first deal pays for itself."; FAQ bg = bg-surface (white) with bg-bg-alt open accordion; Footer bg = bg-bg; TrustedBy uses Atlas CRM placeholder logos; platform fee = 10% of sale amount on top (not deducted); no .vN file naming anywhere; brand name STAYS "SellWell"; Partner Links DUAL-MODE A/B; Phase 8 split 8A/8B; LatestHotLeadsList REMOVED from partner dashboard; FilterBar Filters button on the LEFT not right; sidebar active nav uses bg-bg + accent-text (NOT bg-accent-light); StatCard sparkline anchored bottom-right at 70% width and only renders when trend prop is present. -->

## Hard Rules — Read Every Session, No Exceptions

These are mistakes I have made before in this project. They are **load-bearing** — violating them ships broken code.

### 1. Never call `setState` synchronously in a `useEffect` body

The body of `useEffect` runs after render commits. Calling `setState` (or `dispatch`, etc.) at the top level of the effect body schedules an immediate re-render, causes cascading renders, hurts performance, and React 19 lints it as an error (`react-hooks/set-state-in-effect`).

**Always wrap state transitions in a callback** — `requestAnimationFrame`, `setTimeout`, an event listener, `Promise.then`, or a subscription handler. The cleanup function MUST cancel any in-flight callbacks (`cancelAnimationFrame`, `clearTimeout`).

```jsx
// ❌ WRONG — direct setState in effect body
useEffect(() => {
  if (open) setPhase("entering");
  else setPhase("exiting");
}, [open]);

// ✅ CORRECT — wrapped in rAF, cleanup cancels it
useEffect(() => {
  let raf;
  if (open) raf = requestAnimationFrame(() => setPhase("entering"));
  else      raf = requestAnimationFrame(() => setPhase("exiting"));
  return () => { if (raf) cancelAnimationFrame(raf); };
}, [open]);
```

The double-rAF pattern (`rAF → setPhase("before") → rAF → setPhase("open")`) is what gives CSS transitions the start/end frame separation they need anyway, so deferring is free.

Deriving state from props in an effect is also banned — derive during render. Effects are for *side effects* (subscriptions, DOM measurement, network), not state-sync.

Reference patterns in this codebase that do this correctly: `AuthProvider.jsx` (`requestAnimationFrame(() => setReady(true))`), `Popover.jsx` (phase driver after the 2026-05-09 fix), `DetailOverlay.jsx`.

Full project hard-rule list lives in [Skills/dos-and-donts.md](./Skills/dos-and-donts.md). Architecture rationale in [Skills/nextjs-architecture.md](./Skills/nextjs-architecture.md) under `setState in useEffect — Hard Rule`.

---

### 2. Every downloadable / previewable document goes through `shared/data-display/document/`

Never hand-roll a `<a href={url}>Download</a>` link for a CV, contract, proof-of-payment, screenshot, video, PDF, ZIP, or any other file or external resource. The project ships a single source of truth at [src/components/shared/data-display/document/](./src/components/shared/data-display/document/):

- **`DocumentCard`** (variants: `grid` / `row` / `attachment`) — renders the document with icon, title, optional subtitle/size, and Preview + Download buttons. The card emits `onPreview(doc)`; the parent owns the modal.
- **`DocumentPreviewModal`** — handles PDF iframes, YouTube / Loom / Vimeo embeds, image previews, and the unpreviewable fallback. Caller passes localized `labels`.
- **`DocumentIcon`** — kind-keyed Lucide icon used inside the cards.
- **`EmptyDocumentSlot`** — dashed-border placeholder for empty Sales Kit slots.
- **`lib/format/file.js`** helpers: `inferFileKind`, `detectVideoProvider`, `toEmbedUrl`, `fileNameFromUrl`, `formatFileSize`.

Document shape the components expect:
```js
{ kind: "file" | "url",
  fileUrl?: string,           // when kind === "file"
  externalUrl?: string,       // when kind === "url"
  title: string,
  subtitle?: string,
  sizeBytes?: number }
```

```jsx
// ❌ WRONG — bare anchor for a CV link
<a href={profile.cv_file} target="_blank" rel="noopener noreferrer">
  <FileText /> Download CV
</a>

// ✅ CORRECT — DocumentCard (attachment variant) + parent-owned modal
const [previewDoc, setPreviewDoc] = useState(null);
const cvDoc = {
  kind: "file",
  fileUrl: profile.cv_file,
  title: t("overlay.cv"),
  subtitle: fileNameFromUrl(profile.cv_file),
};

<DocumentCard
  document={cvDoc}
  variant="attachment"
  onPreview={setPreviewDoc}
  labels={{ preview: t("overlay.previewCv"), download: t("overlay.downloadCv") }}
/>

<DocumentPreviewModal
  open={!!previewDoc}
  onClose={() => setPreviewDoc(null)}
  document={previewDoc}
  labels={{ /* ... */ }}
/>
```

Why this is load-bearing: every surface that touches documents (Sales Kit on the marketplace, lead attachments on the company side, withdrawal proofs, dispute proofs, partner CV download in admin verifications, etc.) gets the same icon, the same filename/size meta, the same preview behavior, the same a11y treatment, and the same hover state — for free. Hand-rolling an `<a>` skips the preview modal, skips the icon, skips the filename inference, skips the alignment with neighboring documents on the same page.

Reference impls: [SalesKitSection.jsx](./src/components/marketplace/detail/SalesKitSection.jsx) (grid), [DocumentsSection.jsx](./src/components/leads/lead-detail/documents/DocumentsSection.jsx) (row).

Exception: zero. Even a single one-off file link uses `variant="attachment"`.

---

### 3. Search, filters, and sorts on list pages are server-side by default

Every list-page search, filter, and sort threads its value into the React Query `queryKey` **and** into the mock fn signature. **Never** apply `.filter()` / `.includes()` / `.toLowerCase()` to the React Query result on the client to narrow rows.

**Why:** the real backend is DRF and will paginate most list endpoints with `PageNumberPagination` (`{ count, next, previous, results }`, default 15 per page). Once pagination is on, the client only ever holds **one page** in memory. A client-side `.filter(r => r.name.includes(q))` running against that one page silently hides matches on other pages — search appears to work, but it's broken without throwing an error. Today the mocks return bare arrays, so client-side filtering *looks* fine until Phase 11 wiring flips the switch.

```js
// ✅ Search threaded through queryKey + mock fn
const { data: rows = [] } = useQuery({
  queryKey: ["admin", "verifications", { status, role, search }],
  queryFn: () => fetchVerifications({ status, role, search }),
});

// mock fn narrows server-side:
export async function fetchVerifications({ status, role, search }) {
  let rows = MOCK_USERS.filter(u => u.application_status === status);
  if (role) rows = rows.filter(r => r.role === role);
  if (search) {
    const q = search.trim().toLowerCase();
    rows = rows.filter(r =>
      r.display_name.toLowerCase().includes(q) ||
      r.email.toLowerCase().includes(q)
    );
  }
  return rows;
}

// ❌ NEVER — client-side narrowing on the React Query result
const filtered = useMemo(
  () => rows.filter(r => r.email.toLowerCase().includes(q)),
  [rows, q],
);
```

**Sorts follow the same rule** — sorting the current page locally is meaningless when the right answer might live on a later page. Sort param goes into the queryKey + mock fn.

**The single exception:** client-side narrowing is allowed only when **the entire dataset is guaranteed to be in memory** — i.e. the endpoint is explicitly non-paginated AND the resource is small + bounded (14 marketplace categories, 13 product tags, 8 platform settings, the 5 named campaign-document slots). If the resource could grow with platform activity (users, leads, campaigns, applications, partner links, withdrawals, notifications, disputes), assume pagination and ship server-side filters.

Reference impls in this codebase: [MarketplacePage.jsx](./src/components/marketplace/MarketplacePage.jsx) + [mock/marketplace.js](./src/lib/mock/marketplace.js) thread `search`, `categoryIds[]`, `commissionType`, `partnerLinksEnabled`, `sort` all through queryKey → mock; [LeadsPage.jsx](./src/components/leads/LeadsPage.jsx) does the same for the partner leads inbox.

Pagination envelope (forward-looking): when SellWell mocks migrate to the DRF envelope, mocks will return `{ count, next, previous, results }` and pages will paginate at 15 per request. The server-side filter rule is what keeps that migration a one-file change per resource instead of a search rewrite across the entire app.

---

**Version:** 0.5.0

## Required Reading — Every Session, No Exceptions

Consult these in order before writing any code. The `@` syntax pulls each file into context automatically.

@AGENTS.md
@../shared-specs/mvp-spec.md
@../shared-specs/design-system-final.md
@../shared-specs/auth-onboarding-spec.md
@../shared-specs/campaigns-marketplace-spec.md
@../shared-specs/escrow-leads-spec.md
@../shared-specs/partner-links-dashboards-admin-spec.md
@../shared-specs/data-model-spec.md
@Skills/nextjs-architecture.md
@Skills/tailwind-rules.md
@Skills/dos-and-donts.md
@Skills/next-intl.md
@Skills/setup-baseline.md
@Skills/screenshot-workflow.md

## File Map — What to Read for What Task

| Task | Files |
|---|---|
| Any task | `AGENTS.md` + `../shared-specs/mvp-spec.md` + `Skills/dos-and-donts.md` |
| Bootstrapping the project | `Skills/setup-baseline.md` + `Skills/next-intl.md` |
| New page or section | `Skills/nextjs-architecture.md` + `Skills/tailwind-rules.md` + `../shared-specs/design-system-final.md` |
| Styling decisions | `Skills/tailwind-rules.md` + `../shared-specs/design-system-final.md` |
| i18n / translations | `Skills/next-intl.md` |
| Auth / signup / onboarding flows | `../shared-specs/auth-onboarding-spec.md` |
| Marketplace / campaigns / programs | `../shared-specs/campaigns-marketplace-spec.md` |
| Escrow / leads / commissions | `../shared-specs/escrow-leads-spec.md` |
| Partner Links / dashboards / admin | `../shared-specs/partner-links-dashboards-admin-spec.md` |
| Data shapes / API contracts | `../shared-specs/data-model-spec.md` |
| Visual comparison against a reference | `Skills/screenshot-workflow.md` (only when explicitly told to use it) |

## Conflict Resolution

If sources disagree, resolve in this order:

1. **`../shared-specs/mvp-spec.md`** — wins on product scope, user flows, terminology.
2. **Feature specs in `../shared-specs/`** (auth-onboarding, campaigns-marketplace, escrow-leads, partner-links-dashboards-admin) — win on per-feature behavior.
3. **`../shared-specs/data-model-spec.md`** — wins on data shapes, field names, status enums.
4. **`../shared-specs/design-system-final.md`** — wins on brand values (colors, fonts, spacing tokens).
5. **`Skills/nextjs-architecture.md`** — wins on file structure, routing, component patterns.
6. **`Skills/tailwind-rules.md`** — wins on *how* to write styling (units, layout discipline, animations).
7. **`Skills/dos-and-donts.md`** — distilled rules; if it contradicts source files, source files win.
8. **`Skills/next-intl.md`** — wins on i18n setup and usage.
9. **`AGENTS.md`** — global reminders; non-overriding.

Where two source files are in tension on the same axis (e.g., the design system specifies px sizes, the architecture file specifies em-based responsive scaling), the architecture and Tailwind files describe the **implementation strategy** for hitting the design system's reference values — they don't override the values themselves. See `Skills/tailwind-rules.md` §"Mapping design-system pixel values → em" for the bridge.

## Defaults

- **Do not connect real API calls until explicitly told to.** Use mock data with shape comments matching `../shared-specs/data-model-spec.md`.
- **Do not implement auth until explicitly told to.** Default to mock session state.
- **Do not run the screenshot workflow until explicitly told to.** It's opt-in.

## Best UX / Smoothness Request — Hard Rule

When the user asks for "the best UX possible," "smoothest UX," "make it really good UX-wise," or any equivalent phrasing on a feature/page: **spawn a research agent** (`subagent_type: general-purpose`) against premium SaaS / fintech / dashboard references that match the *exact* feature context (e.g. for an Applications list — Upwork, Toptal, Stripe Connect, Mercury, Linear — not generic landing-page references). Agent returns concrete patterns + ranked recommendations. **Then ask 1–2 short questions** to pick a direction from the agent's findings before writing any code.

## High-Animation Section Workflow — Hard Rule

For any premium / flagship / "highly animated" / "Mercury-tier" landing-page section (Hero illustrations, Solution diagrams, How it works flows, Stats reveals, signature interactive moments), follow these 5 steps in order. **Never skip a step.** Skipping any of them produces generic AI-slop output and forces 3-5 throwaway versions.

**1. Deep web research first.**
Spawn a research agent (`subagent_type: general-purpose`) against premium reference sites (Stripe, Linear, Mercury, Ramp, Vercel, Cal.com, Polar, Pitch, Notion, Framer, Resend). Required output:
- Concrete patterns they use for the same problem
- What separates premium from generic
- Ranked list of viable approaches with implementation cost
- 5–10 distinct conceptual directions

**2. Read the project spec + use case.**
Re-read `../shared-specs/mvp-spec.md` and the relevant feature spec. Understand exactly what the section needs to communicate, to whom, and what the conversion goal is.

**3. Confirm Framer Motion is the tool.**
The `motion` package is installed. Use `motion.path` (with `pathLength`) for path drawing, `useScroll` + `useTransform` for scroll-driven, `useInView` from `motion/react` for scroll-triggered, `AnimatePresence` for enter/exit, `layoutId` for FLIP. **Never raw CSS keyframes** for these flagship components — CSS is reserved for simple section fade-ups (`section-hidden` / `section-visible`).

**4. Pitch variants to the user before writing code.**
- Show 5–8 distinct concept pitches (one line each)
- Recommend 1–2 to build, with reasoning
- Ask: "How many variants should I build, and which directions?"
- **Wait for the answer.** Do not start building.

**5. Build with the version-switcher pattern.**
For sections where the user wants to compare options:
- Create `<Component>Client.vN.jsx` files for each variant
- Create a `Switcher.jsx` UI that toggles between them live in dev
- Default-mount the newest variant
- After the user picks the winner: promote it to `<Component>Client.jsx` (canonical), keep the runner-up on disk as `.vN.jsx` for fallback, delete rejected ones, remove the switcher
- Run `npm run build` before declaring done

**Skip ONLY for:** trivial entrance fades, hover lifts, routine UI animations. Those are not flagship moments.

**Triggers:** any user request using the words "premium," "professional," "Mercury-tier," "highly animated," "make it really good," "make it stand out," or describing a flagship landing-page section.
