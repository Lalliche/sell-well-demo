# Screenshot Workflow — SellWell Client

> Visual validation against reference designs.
> ⚠️ **Do not implement or run the screenshot workflow until explicitly told to.** It's an opt-in tool used during design-comparison passes — not a default step in feature work.

---

## Purpose

When a reference design (Figma export, design system mockup, image attached to a task) needs a pixel-faithful implementation, the screenshot workflow renders the live page in headless Chrome, saves a PNG, and lets the agent visually compare against the reference. The goal is to close the gap between "looks roughly right" and "matches the reference exactly."

This is the same workflow used in the spotlight-copy project, adapted to SellWell.

---

## Setup

### Global helper (already installed on the dev machine)

`~/.local/bin/screenshot.mjs` — uses globally-installed `puppeteer-core` + system Chrome. If it's missing, install:

```bash
npm install -g puppeteer-core
```

The system Chrome path is auto-detected on macOS at `/Applications/Google Chrome.app/Contents/MacOS/Google Chrome`.

### Project wrapper

`screenshot.mjs` at the project root re-exports the global helper with project defaults (output folder, viewport, settle delay). Create it on first use:

```js
// screenshot.mjs (project root)
import { screenshot } from "/Users/macbook/.local/bin/screenshot.mjs";

const url = process.argv[2];
const label = process.argv[3];

if (!url) {
  console.error("Usage: node screenshot.mjs <url> [label]");
  process.exit(1);
}

await screenshot({
  url,
  outDir: "./temporary screenshots",
  label,
  viewport: { width: 1440, height: 900, deviceScaleFactor: 2 },
  fullPage: true,
  settleDelay: 1200,
});
```

The output folder `./temporary screenshots/` is `.gitignore`d.

---

## Usage

```bash
# Always shoot localhost — never file://
node screenshot.mjs http://localhost:3000
node screenshot.mjs http://localhost:3000/en/dashboard
node screenshot.mjs http://localhost:3000/en hero
```

- Saves to `./temporary screenshots/screenshot-N.png` (auto-incremented, never overwrites).
- Optional second argument adds a label: `screenshot-N-hero.png`.
- Viewport: 1440×900 @ 2× DPR. Full-page capture.
- Settle delay: 1.2s after `networkidle2` — allows fonts, animations, and lazy-loaded sections to land.

---

## Local Server Rules

- Start the dev server in the background **before** screenshotting: `npm run dev`.
- Wait for `✓ Ready` in the terminal output before taking the first shot.
- **Never run more than one dev server instance.** If port 3000 is taken, Next.js falls back to 3001 — read the terminal output and screenshot the correct port.
- **Never screenshot a `file:///` URL.** Always use `http://localhost:PORT`.

---

## Comparison Loop

After saving a screenshot, the agent uses the Read tool on the PNG to view it visually, then compares against the reference. The loop:

1. Take a screenshot of the current implementation.
2. View the PNG with the Read tool.
3. Compare against the reference (Figma export, attached image, design-system spec):
   - **Spacing & padding** — gap, margin, section padding.
   - **Font** — size, weight, line-height, letter-spacing.
   - **Colors** — exact hex match against tokens in `design-system-final.md`.
   - **Alignment** — flex direction, justify, align-items.
   - **Border-radius** — pixel-equivalent to the design system token.
   - **Shadows** — correct level (`shadow-xs` through `shadow-xl`).
   - **Image sizing** — `object-fit`, aspect ratio.
4. Make code changes.
5. Repeat.

**Do at least 2 comparison rounds** before declaring the work done. Stop only when no visible differences remain.

---

## Hard Rules

- ❌ Never screenshot a `file:///` URL.
- ❌ Never run more than one dev server instance simultaneously.
- ❌ Never commit anything from `./temporary screenshots/`.
- ❌ Never skip the settle delay — animations and lazy-loaded sections need time to settle.
- ❌ Never declare the work matched after only one comparison round. Two minimum.
- ✅ Always shoot localhost.
- ✅ Always Read the PNG after taking it. A screenshot you don't look at is wasted.
- ✅ Always check spacing, typography, and color against `design-system-final.md` tokens — not against the reference's raw hex values (the reference may itself have minor inaccuracies).
