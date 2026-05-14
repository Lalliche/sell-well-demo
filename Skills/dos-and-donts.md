# Do's & Don'ts — SellWell Client

> Quick-scan cheat sheet. If an agent only reads one file, it should be this one.
> For *why* and *how*, see [nextjs-architecture.md](./nextjs-architecture.md), [tailwind-rules.md](./tailwind-rules.md), [design-system-final.md](./design-system-final.md).

---

## Data Contract Sync Rule — Hard Rule

Any change to a data shape must update **all three** in the same action:

1. `shared-specs/data-model-spec.md` — the written contract
2. `src/types/<resource>.ts` — the TypeScript definition
3. `src/lib/mock/_seed/<resource>.ts` + `src/lib/mock/<resource>.js` — the runtime mock data

If the user says "change X in the mock" → also update the type and the spec.
If the user says "add field Y to the type" → also update the mock seed and the spec.
**Never** update one without the other two.

---

## Session Handoff Rule

When the user says **"clear the context"** or **"start a new session"**:

1. Prepend this comment to the top of `client/CLAUDE.md` before clearing:
   ```
   <!-- SESSION HANDOFF: Phase X.Y done. Next: Phase X.Z — [one sentence on what to build next]. -->
   ```
2. Mark the in-progress phase as `[~]` in `FRONTEND_TODO.md` if it wasn't fully signed off.
3. Then clear. The next session auto-loads `CLAUDE.md` and knows exactly where to resume.

**Never** clear proactively. Only when the user explicitly asks.

---

## Always

### Routing & Layout
- ✅ Every route lives under `app/[locale]/`. There is **NO** `app/layout.tsx` at the root.
- ✅ Internal links use `Link` from `@/i18n/navigation` — never `next/link` or raw `<a>` directly.
- ✅ Body element carries `text-[12px] md:text-[14px] lg:text-[15px] xl:text-[16px]` — the single point that rescales the UI per breakpoint.
- ✅ Use route groups inside `[locale]/`: `(landing)`, `(auth)`, `(app)`, `(admin)` — each owns its layout.

### Components
- ✅ Server components by default. Add `'use client'` only when state, effects, event handlers, or browser APIs are needed.
- ✅ Every `<button>` goes through `AppButton` (`src/components/ui/Buttons.jsx`).
- ✅ Every input goes through `FormInputs` (`src/components/ui/FormInputs.jsx`). `onChange` receives the value directly, not the event.
- ✅ Folder-per-module: when a section grows past one file, convert to a folder with `index.jsx` as the entry.
- ✅ Extract to `src/components/shared/` the moment a pattern appears in 2+ places.
- ✅ Use `cn()` from `@/lib/utils` for all conditional classNames — never string concatenation.

### Styling
- ✅ `em` for padding, margin, gap, font-size, radius, width/height.
- ✅ `px` only for borders (≤4px) and 1px hairlines.
- ✅ Percentages for fluid widths.
- ✅ Prefer arbitrary values (`p-[1em]`, `text-[1.5em]`) over Tailwind's default scale.
- ✅ Flex first. Grid only for literal grids (data tables, stat-card rows).
- ✅ Spacing between siblings via `gap-[Xem]` on the parent — not margins on children.
- ✅ Brand color tokens only: `bg-bg`, `bg-surface`, `text-text`, `text-accent`, etc.
- ✅ Opacity modifiers on tokens: `bg-accent/10`, `border-accent/20`.
- ✅ Shadow levels from `globals.css`: `shadow-xs / sm / md / lg / xl`.

### Typography
- ✅ Headings → Sora. Body → DM Sans. Numbers → IBM Plex Mono. Roles are fixed.
- ✅ All commission values, click counts, monetary amounts → IBM Plex Mono.
- ✅ Body max-width `max-w-[65ch]`.
- ✅ Section labels (eyebrows): uppercase, weight 600, letter-spacing 0.06–0.08em, muted or accent-text color.

### Data, Auth, Forms
- ✅ Use mock data with a documented shape comment until told to integrate the real API.
- ✅ All API calls flow through `src/lib/api.js` (axios, `withCredentials`, CSRF interceptor).
- ✅ `useQuery` for GET. `useMutation` for POST/PUT/DELETE.
- ✅ Auth functions live in `src/lib/Auth.js`. Routes protected by `middleware.ts`.
- ✅ Form inputs validate `onBlur`. Error messages inline below the field.
- ✅ **Form-submit validation fail also fires a warning toast.** When the user clicks the submit/save/send button on a form (or any composer with required fields the user can fail to fill), if validation fails: ALWAYS pair the inline red field errors with `toast.warning(tCommon("formErrorsBody"), { title: tCommon("formErrorsTitle") })`. Shared i18n keys: `Common.formErrorsTitle` + `Common.formErrorsBody` (already in en + fr). The inline errors say *what* is wrong; the toast says *something* is wrong, so the user notices even when the bad field is offscreen. Skip only when the submit button is `disabled={!isValid}` — no clickable failure path.
- ✅ Destructive actions confirmed via `ConfirmPopup` before proceeding.
- ✅ Every translation key added to **both** `messages/en.json` and `messages/fr.json` simultaneously.
- ✅ **Every downloadable / previewable document goes through `shared/data-display/document/`.** Use `DocumentCard` (variants: `grid` / `row` / `attachment`) + a parent-owned `DocumentPreviewModal`. The card emits `onPreview(doc)`; the parent flips a `previewDoc` state and renders the modal. Doc shape: `{ kind: "file" | "url", fileUrl?, externalUrl?, title, subtitle?, sizeBytes? }`. Never write a bare `<a href={url}>Download</a>` — even for one-off CVs, contracts, proofs, screenshots, videos. Exception: zero. Reference impls: `SalesKitSection.jsx` (grid), `lead-detail/documents/DocumentsSection.jsx` (row). Full rationale in `client/CLAUDE.md` §2.
- ✅ **Search, filters, and sorts on list pages are server-side.** Every filter state (search string, status tab, role, sort, date range, etc.) goes into the React Query `queryKey` AND into the mock fn signature. Mocks narrow rows server-side; pages read `data` as-is. Never apply `.filter()` / `.includes()` / sort to the React Query result on the client to narrow rows. The real backend uses DRF `PageNumberPagination` — once on, the client holds only one page at a time, so client-side narrowing silently hides matches that live on other pages. Exception: only when the entire dataset is guaranteed in-memory (categories, tags, the 8 platform settings, the 5 named doc slots). Full rationale in `client/CLAUDE.md` §3.

### Images
- ✅ Always `<Image />` from `next/image`.
- ✅ Brand assets → `src/assets/` (imported via ES modules).
- ✅ URL-served files (favicon, robots, OG) → `public/`.

### Interactive States
- ✅ Every clickable element has `hover:`, `focus-visible:`, and `active:` states.
- ✅ Hover lift: `translateY(-1px)` on buttons, `translateY(-2px)` on cards. Paired with shadow increase.
- ✅ Loading: skeleton screens with subtle pulse — never spinners.
- ✅ Animate `transform` and `opacity` only.

---

## Never

### Routing & Layout
- ❌ Never create `app/layout.tsx` at the root. Locale-first only.
- ❌ Never put components inline in `page.jsx`. Split into `components/landing/`, `components/dashboard/`, etc.
- ❌ Never hardcode `"en"` or `"fr"` outside `routing.ts`.

### Components
- ❌ Never create ad-hoc `<button>` elements with inline styles. Use `AppButton`.
- ❌ Never create standalone input elements. Use `FormInputs`.
- ❌ Never re-style an `AppButton` variant from outside — modify `Buttons.jsx`.
- ❌ Never call `setState` synchronously inside a `useEffect` body. Use callbacks (`addEventListener`, `requestAnimationFrame`, `setTimeout`) or derive during render. React 19 flags this as an error.
- ❌ Never duplicate code. Extract to `src/components/shared/` immediately on the second use.
- ❌ Never use raw `<a>` or `next/link` directly inside `[locale]` routes — use `@/i18n/navigation`.
- ❌ Never use raw `<img>`. Always `<Image />`.
- ❌ Never hand-roll an `<a href={url}>Download</a>` for a document (CV, contract, proof of payment, screenshot, video, PDF, ZIP, etc.). Always use `DocumentCard` + `DocumentPreviewModal` from `shared/data-display/document/`.
- ❌ Never apply `.filter()` / `.includes()` / sort to the React Query result on the client to narrow list rows. Filters, search, and sorts thread through the `queryKey` + the mock fn signature. Pagination will break client-side narrowing silently.

### Styling
- ❌ Never use default Tailwind palette colors (`indigo-*`, `blue-*`, `slate-*`, `gray-*`, `zinc-*`, `red-*`…).
- ❌ Never use raw black (`#000000`) for text. Darkest is `--text` (#1A1A1A).
- ❌ Never use pure white (`#FFFFFF`) for the page background. Use `--bg` (#FAF9F6).
- ❌ Never introduce a second chromatic color. Steel blue (`--accent: #3B6ECC`) is the only accent.
- ❌ Never put component-specific classes in `globals.css` — write them inline.
- ❌ Never inline styles for things Tailwind already expresses.
- ❌ Never use CSS Modules or styled-components.
- ❌ Never create `tailwind.config.js`. All config goes in `globals.css` `@theme`.
- ❌ Never use `px` for padding, margin, gap, font-size, or radius. `em` only.
- ❌ Never use CSS Grid for page-level layout. Flex only (Grid for data grids).
- ❌ Never use `transition-all`. Name the properties.
- ❌ Never use `animate-*` Tailwind utilities except `animate-spin` for loaders.
- ❌ Never animate layout properties (width, height, margin, top/left). Transform and opacity only.
- ❌ Never use Tailwind's default `shadow-md`/`shadow-lg` — those names are reused in `globals.css` to point to our own values, but never use them inline as if they were the default flat-black shadows.
- ❌ Never add dark mode in v1.

### Typography
- ❌ Never mix font roles. Sora ≠ DM Sans ≠ IBM Plex Mono — each has its lane.
- ❌ Never mix more than 2 weights in a single text block.
- ❌ Never load fonts via CDN `<link>` tags. Use `next/font/google` in `[locale]/layout.jsx`.

### Data, Auth, Forms
- ❌ Never connect real API calls until explicitly told to. Use mock data with shape comments.
- ❌ Never implement auth logic until explicitly told to. Default to mock session state.
- ❌ Never call `axios` directly inside a component. Wrap in `src/lib/` or a custom hook.
- ❌ Never hardcode user-facing strings in JSX. Always `useTranslations()` (or `getTranslations()` on the server).
- ❌ Never leave one of `en.json` / `fr.json` out of sync.
- ❌ Never auto-dismiss toasts for financial actions. Manual dismissal only.
- ❌ Never truncate commission values. Money must be precise and complete.

### Buttons & UX
- ❌ Never use gradients on buttons.
- ❌ Never have more than one primary CTA per screen.
- ❌ Never use red for non-error states.
- ❌ Never use icons without text labels in navigation.
- ❌ Never use placeholder-only inputs. Always pair with a visible label.
