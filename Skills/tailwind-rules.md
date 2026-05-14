# Tailwind & Styling Rules — SellWell Client

> The styling contract for this project. Follow exactly.
> Brand values (colors, typography, spacing scale) live in [design-system-final.md](./design-system-final.md) — that file is the source of truth for *what* the values are.
> This file is the source of truth for *how* to write Tailwind.

---

## Units

- **`em` for everything sizing-related:** padding, margin, gap, font-size, border-radius, width/height, top/left offsets.
- **`px` only for:** borders (`border-[1px]`, `border-[2px]`) and hairlines (`h-[1px]`). Never exceed `4px`.
- **Percentages (`w-1/2`, `w-full`, arbitrary `w-[60%]`)** for fluid widths inside layouts.
- **Prefer arbitrary values** (`p-[1em]`, `text-[1.5em]`, `gap-[2em]`) over Tailwind's default numeric scale (`p-4`, `text-lg`). The default scale uses `rem` — that breaks the responsive-base-font strategy below.

```jsx
// ❌ Wrong — rem/px scale, breaks responsive base font strategy
<div className="p-4 text-sm gap-2 rounded-lg">

// ✅ Correct — em arbitrary values
<div className="p-[1em] text-[0.875em] gap-[0.5em] rounded-[0.5em]">
```

### Why `em` (not `rem`)

The body element carries this className:

```jsx
<body className="text-[12px] md:text-[14px] lg:text-[15px] xl:text-[16px]">
```

Because every size downstream is in `em`, changing this one value rescales the entire UI at each breakpoint. `rem` would ignore it — you'd have to write responsive variants on every component.

**The one tax:** `text-[1em]` inside a `text-[1.5em]` parent compounds to 1.5×. Keep `font-size` on leaf text nodes; don't nest size changes.

### Mapping `design-system-final.md` Pixel Values → `em`

The design system defines sizes in pixels (16px body, 14px small, etc.). **Treat those as reference values at the `xl` breakpoint** (where base = 16px). Convert to `em` as `px / 16`:

| Design system | Tailwind |
|---|---|
| `--body: 16px` | `text-[1em]` |
| `--body-sm: 14px` | `text-[0.875em]` |
| `--h2: 24px` | `text-[1.5em]` |
| `--h1: 32px` | `text-[2em]` |
| `--display: 48px` | `text-[3em]` |
| `--space-4: 16px` | `gap-[1em]` / `p-[1em]` |
| `--space-6: 24px` | `gap-[1.5em]` / `p-[1.5em]` |
| `--space-8: 32px` | `gap-[2em]` |

The body className handles smaller-breakpoint downscaling automatically. You never write `text-[14px] sm:text-[16px]` — the body does it for you.

---

## Breakpoints (mobile-first)

Defined in `globals.css` `@theme`:

```
xs    500px
sm    640px
md    850px
lg    1150px
xl    1350px
xxl   1800px
xxxl  2200px
```

Default = mobile. Layer up with `sm:`, `md:`, `lg:`, `xl:`, `xxl:`, `xxxl:`.

```jsx
className="px-[1em] sm:px-[2em] md:px-[3em]"
className="text-[1.25em] sm:text-[1.5em] lg:text-[2em]"
className="flex-col sm:flex-row"
```

> The design system mentions `sm/md/lg/xl/2xl` at different widths (640/768/1024/1280/1440). **The breakpoints above win for layout** — they cover a wider range and match the responsive-base strategy. Use the design system's widths only as conceptual guides ("stat cards: 1 column below sm, 3 columns at lg").

---

## Layout

- **Flex for everything.** Grid only when there is a literal grid: data tables, calendar, image galleries with fixed columns, dashboard stat-card rows.
- Section pattern: a `<section>` wraps a constrained inner `<div>` with horizontal padding + `max-w-*`.
- Spacing between siblings uses `gap-[Xem]` on the parent, **not** margins on children.
- Sizing: `flex-1`, `shrink-0`, `w-full`, `max-w-[80em]`. Avoid fixed px widths.
- Page max-widths from the design system: landing 1200px (`max-w-[75em]`), dashboard 1400px (`max-w-[87.5em]`), auth card 440px (`max-w-[27.5em]`), content/docs 720px (`max-w-[45em]`).

---

## Colors

All colors are defined in `globals.css` `@theme` block as `--color-*` tokens, translated from `design-system-final.md`.

- Use token names: `bg-bg`, `bg-surface`, `text-text`, `text-text-secondary`, `border-border`, `text-accent`, `bg-accent`, `bg-cta` etc.
- **Opacity modifiers work on tokens:** `bg-accent/10`, `border-accent/20`, `text-text/60`. Use them — don't define extra tokens for alpha variants.
- **Prefer tokens** over hex. Check `globals.css` first.
- For genuine one-off colors with no token match (rare), inline hex is fine: `text-[#515151]`. Most colors should already have a token.
- **Never use default Tailwind palette colors** (`indigo-500`, `blue-600`, `slate-300`, `gray-*`, `zinc-*`…) — they are not the SellWell brand.
- **Never introduce a second chromatic color.** Steel blue (`--accent: #3B6ECC`) is the only accent. Everything else is neutral.
- **Never use raw black (`#000000`)** for text. Darkest allowed is `--text` (#1A1A1A).
- **Never use pure white (`#FFFFFF`)** for the page background. Use `--bg` (#FAF9F6). White is for `--surface` (cards, modals, inputs).

---

## Typography

Three fonts, each with a fixed role (per design system):

- **Sora** — headings only (`font-heading` / `font-[family:var(--font-heading)]`). Weights 600/700/800.
- **DM Sans** — body and UI (`font-body`). Default font, applied at the body level. Weights 400/500/600.
- **IBM Plex Mono** — numbers, financial data, tabular figures (`font-mono`). Weights 400/500/600.

```jsx
<h1 className="font-heading text-[2em] font-bold tracking-[-0.03em]">Page title</h1>
<p className="text-[1em] leading-[1.6]">Default body text</p>
<span className="font-mono text-[1.75em] font-semibold tabular-nums">DZD 12,450.00</span>
```

**Hard rules:**
- Headings always Sora. Body always DM Sans. Numbers always IBM Plex Mono. Never mix roles.
- Commission values, click counts, conversion rates, monetary amounts — **always** IBM Plex Mono.
- Body text max-width: `max-w-[65ch]`.
- Section labels (uppercase eyebrows like "HOW IT WORKS"): `text-[0.6875em]` to `text-[0.75em]`, weight 600, letter-spacing 0.06–0.08em, `text-text-muted` or `text-accent-text`.
- Never mix more than 2 weights in a single text block.
- All text sizes in `em`. Responsive scale: `text-[1.5em] sm:text-[2em] lg:text-[3em]`.
- Line height: `leading-tight` for headings (or arbitrary `leading-[1.06]` for the display), `leading-[1.6]` for body.
- Weights via utilities: `font-light`, `font-normal`, `font-medium`, `font-semibold`, `font-bold`.

---

## Borders & Radius

**Borders in px.** For 1px (the common case) use Tailwind's canonical shorthand: `border`, `border-b`, `border-t`, `border-l`, `border-r`, `border-x`, `border-y`. For other widths use arbitrary values: `border-[1.5px]`, `border-[2px]`, `border-b-[2px]`. Always pair with a color class: `border border-border`, `border-b-[2px] border-accent`.

**Border radius — use the design system's tokens, applied in `em` so they scale with the rest:**

| DS token | Tailwind | Use |
|---|---|---|
| `--radius-sm: 5px` | `rounded-[0.3125em]` | small badges, tags |
| `--radius-md: 6px` | `rounded-[0.375em]` | medium badges, chips |
| `--radius: 8px` | `rounded-[0.5em]` | buttons, inputs |
| `--radius-lg: 10px` | `rounded-[0.625em]` | cards, containers, CTA input |
| `--radius-xl: 12px` | `rounded-[0.75em]` | modals, large cards |
| `--radius-full: 9999px` | `rounded-full` | avatars, pill badges, toggle tracks |

Pick what suits the component. Consistency across similar components matters more than a single universal value.

---

## Shadows

Use the pre-defined levels from `design-system-final.md` — **never inline rgba values for things a level already covers, never use Tailwind's default `shadow-md` / `shadow-lg`** (the names collide with our token names but the values differ).

```jsx
className="shadow-xs"   // buttons, small elements
className="shadow-sm"   // cards at rest
className="shadow-md"   // dropdowns, popovers
className="shadow-lg"   // cards on hover, CTA input
className="shadow-xl"   // modals
```

These resolve to subtle near-black shadows defined in `globals.css` (`--shadow-xs/sm/md/lg/xl`). The classes must be mapped explicitly in `globals.css` because they reference CSS vars:

```css
.shadow-xs { box-shadow: var(--shadow-xs); }
.shadow-sm { box-shadow: var(--shadow-sm); }
.shadow-md { box-shadow: var(--shadow-md); }
.shadow-lg { box-shadow: var(--shadow-lg); }
.shadow-xl { box-shadow: var(--shadow-xl); }
```

If a design genuinely needs a one-off shadow (rare), use inline `style={{ boxShadow: "..." }}`.

---

## Global CSS Is a Last Resort

`src/app/globals.css` should contain **only**:

1. `@import "tailwindcss";`
2. The `@theme inline {}` block — colors, breakpoints, fonts, shadow vars (translated from `design-system-final.md`).
3. `:root {}` — non-Tailwind CSS variables.
4. Base element styles: `html`, `body`, `*`, scrollbar, font smoothing.
5. `@keyframes` definitions for animations that loop or need keyframe control.
6. The `.shadow-xs / .shadow-sm / ...` utility mappings — they reference CSS vars.
7. The `prefers-reduced-motion` block — single source of truth for motion preferences.

**Not in globals.css:** component-specific classes like `.hero-heading-grad`, `.program-card-wrap`, `.dashboard-sidebar`. If Tailwind can express it, write it inline. If it needs state-driven values, use `style={{}}`. If it needs a keyframe, define `@keyframes` in globals.css but apply it with an inline `animation: ...` or a single Tailwind arbitrary value.

**Every time you're about to add a class to globals.css, ask:** *"Can this be Tailwind classes on the element?"* — 90% of the time the answer is yes.

---

## Inline Styles

Use `style={{}}` only for:

- **State-driven dynamic values** (opacity/transform from React state, dynamic rotation/translation, computed widths from data).
- **Gradients** (`backgroundImage: "linear-gradient(...)"`) — including `--bg-gradient` for the hero.
- **Backdrop blur** (`backdropFilter` + `-webkit-` prefix) — for the modal backdrop's `blur(4px)`.
- **Genuinely one-off complex shadows** that don't match `shadow-xs/sm/md/lg/xl`.
- **Applying a `@keyframes` animation** (`animation: "fade-up 0.6s ease forwards"`).

**Everything else: Tailwind classes.** Do not inline anything Tailwind already expresses (padding, color, flex direction, gap, basic borders, simple rounded corners).

---

## Animations

Three approaches, matched to complexity (per `design-system-final.md` Motion section):

1. **Tailwind transitions** for hover/state — `transition-[transform,opacity,background-color] duration-150 ease-out` for micro-interactions, `duration-250` with `ease-[cubic-bezier(0.4,0,0.2,1)]` for transitions.
2. **Inline `style={{}}`** for React-state-driven transitions:
   ```jsx
   style={{
     opacity: isOpen ? 1 : 0,
     transform: isOpen ? "translateY(0)" : "translateY(0.5em)",
     transition: "opacity 0.25s ease, transform 0.25s ease",
   }}
   ```
3. **CSS `@keyframes` in `globals.css`** for looping or multi-step animations (skeleton-pulse, marquee, fade-up). Apply via inline `animation` or a single utility.

**Hard rules:**

- **Never `transition-all`** — name the properties (`transition-[transform,opacity]`).
- **Never `animate-*` Tailwind utilities** except `animate-spin` for loaders. Use `motion` (framer-motion fork) at the call site when you need scroll-triggered or orchestrated animation, and reserve that for cinematic moments — not every card.
- **Transform and opacity only.** Never animate layout properties (width, height, margin, top/left) for performance.
- **Hover lift:** `translateY(-1px)` on buttons, `translateY(-2px)` on cards. Paired with shadow increase (`shadow-sm` → `shadow-lg`). No scale transforms on buttons.
- **Loading states:** skeleton screens with subtle pulse — never spinners.
- **Page entrances:** 400ms `ease-out`, staggered list items at 60ms per item.
- **Financial-action toasts must NOT auto-dismiss.** Manual dismissal only.

---

## Images

- Always `<Image />` from `next/image`. Never raw `<img>`.
- Use `fill` + `object-cover`/`object-contain` inside a sized parent. The parent controls dimensions, not the image.
- Brand assets (logos, illustrations) → `import` from `@/assets/` so Next.js hashes and optimizes them.
- Static URL-served images (favicons, OG share images) → `public/`.
- Placeholders during design: `https://placehold.co/WIDTHxHEIGHT/EDF2FA/3B6ECC` (warm cream bg, accent text — picks up the brand naturally).

---

## What NOT to Do

- No CSS Modules, no styled-components.
- No `tailwind.config.js` — all config goes in `globals.css` `@theme`.
- No default Tailwind palette colors (`indigo-*`, `blue-*`, `slate-*`, `gray-*`, `zinc-*`…).
- No hardcoded hex for colors that already have a token.
- No `px` for padding, margin, gap, font-size, radius — `em` only. `px` is reserved for borders ≤4px.
- No CSS Grid for page-level layout — flex only (Grid is fine for data grids, stat-card rows, calendars).
- No dark mode in v1.
- No component classes in `globals.css` — write them inline.
- No `transition-all`, no `animate-*` (except `animate-spin`).
- No inline styles for things Tailwind already covers.
- No `<img>` — always `<Image />`.
- No raw black or pure white. Use `--text` and `--bg`.
- No second chromatic color. Steel blue is the only accent.
- No gradients on buttons.
- No mixing fonts: Sora for headings, DM Sans for body, IBM Plex Mono for numbers — never swap.
- No truncating commission values. Money must be precise and complete.
- No auto-dismissing toasts for financial actions.
