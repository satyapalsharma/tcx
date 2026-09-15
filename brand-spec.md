# EXL · Transform.cx — Brand Spec

Source: **EXL logo** (`EXL_Service_logo.svg.webp`). The wordmark is the brand source; its fill was sampled at **#FB4E0B** = `oklch(66.2% 0.218 37)`. Neutrals, type and derived tokens follow the `modern-minimal` direction (Linear / Vercel posture), rebound onto the EXL orange. Company **EXL**, product **Transform.cx**. Lockup = EXL wordmark · hairline divider · product name.

This file is the single source of truth for `assets/tx.css`. Every value below is the value actually shipped.

---

## 1 · Tokens

### Core six

```css
--bg:      oklch(99% 0.002 240);
--surface: oklch(100% 0 0);
--fg:      oklch(18% 0.012 250);
--muted:   oklch(54% 0.012 250);
--border:  oklch(92% 0.005 250);
--accent:  oklch(66.2% 0.218 37);   /* EXL orange #FB4E0B — fills, rings, active marks */
```

### Derived accent (L-shift only, hue held at 35–45)

```css
--accent-strong: oklch(55% 0.19 36);    /* filled buttons + accent text */
--accent-hover:  oklch(50% 0.175 35);
--accent-active: oklch(46% 0.16 34);
--accent-soft:   oklch(96% 0.028 45);   /* badge fills, selection, focus halo */
--accent-border: oklch(85% 0.075 42);
```

### Status (hues deliberately pushed away from brand hue 37)

```css
--success: oklch(60% 0.14 150);  --success-soft: oklch(95% 0.04 150);    --success-fg: oklch(38% 0.1 150);
--warn:    oklch(78% 0.145 88);  --warn-soft:    oklch(96% 0.05 90);     --warn-fg:    oklch(43% 0.1 80);
--danger:  oklch(54% 0.21 22);   --danger-soft:  oklch(95.5% 0.03 22);   --danger-fg:  oklch(43% 0.17 22);
```

### Surfaces & shape

```css
--surface-hover: oklch(96.5% 0.004 250);
--surface-active: oklch(94.5% 0.005 250);
--surface-inset: oklch(97.5% 0.004 250);
--r-sm: 6px;  --r-md: 8px;  --r-lg: 12px;       /* dialogs use 14px */
--shadow-overlay: 0 8px 30px oklch(18% 0.012 250 / .14), 0 1px 4px oklch(18% 0.012 250 / .08);
```

### Type

```css
--font-display: -apple-system, BlinkMacSystemFont, 'SF Pro Display', system-ui, sans-serif;
--font-body:    -apple-system, BlinkMacSystemFont, 'SF Pro Text', system-ui, sans-serif;
--font-mono:    ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
```

Single-family, multi-weight system (utilitarian data product — permitted). Weights: **read 400–490**, **emphasize 510–560**, **announce 600–640**. Never 700+.

| Role | Size | Leading | Tracking |
|---|---|---|---|
| KPI value | 24px | 1.2 | −0.02em |
| Page title (h1) | 20px | 1.25 | −0.02em |
| Dialog title (h2) | 16px | 1.3 | −0.015em |
| Card title (h3) | 13.5px | 1.4 | −0.01em |
| Body / table cell | 13.5px | 1.5 | 0 |
| Label | 12.5px | 1.5 | 0.01em |
| Hint / small | 12px | 1.5 | 0.01em |
| Table header | 11px | 1.4 | 0.07em (caps) |
| Caps / eyebrow | 11px | 1.4 | 0.08em (caps) |

Body copy capped at **65ch** (`.page-h .sub` 660px).

### Motion

Colour-only feedback (hover, press, chip select, tab underline) keeps the browser `ease` at **100–150 ms**. **Anything that moves uses one curve: `cubic-bezier(.2, 0, 0, 1)`** — M3 standard, front-loaded. Transform + opacity only; never `top / left / width / height`.

| Moment | Duration | What moves | Under `prefers-reduced-motion: reduce` |
|---|---|---|---|
| Page-entry reveal | 240 ms, 55 ms stagger, max 4 groups | `translateY(8px)` → 0 + opacity | skipped entirely |
| Dialog entrance | 180 ms | `scale(.98)` → 1 + opacity | **fade only** — travel removed |
| Drawer entrance | 200 ms | `translateX(24px)` → 0 + opacity | **fade only** — travel removed |
| Toast | 220 ms | `translateY(8px)` → 0 + opacity | no animation |
| Live pulse · typing dots | 1.2 s loop | opacity | **stopped** — the "Running / Live" label carries the state |
| Indeterminate spinner | 0.7 s loop | rotate | slowed to 1.6 s (essential progress — not removed) |
| Progress fill | 400 ms | `width` | unchanged |

The entry reveal lives in `assets/ui.js` (`revealPage()`): it marks up to four direct children of `.page`, header first. It is **purely additive** — nothing is hidden in the resting CSS, so a JS failure or a reduced-motion setting simply shows the page already settled. Screens that own their motion layer opt out with `data-no-reveal` (currently `audit-log.html`, which has its own section stagger).

`.fill` animates `width` deliberately: it encodes a running value inside a fixed-width track, the reflow is confined to one 5px bar, and it is data rather than decoration — `scaleX` would misrepresent a value that is genuinely proportional.

---

## 2 · Observed rules

1. **The orange is an accent, not a wash.** Cap at ~2 visible uses per screen (primary CTA + one active mark). Never tint the page background with it.
2. **Never white text on raw `--accent`.** `#FB4E0B` is 3.39:1 vs white. Fills use `--accent-strong`; raw `--accent` is reserved for borders, focus rings, dots and progress tracks.
3. **Hairline structure.** 1px borders, no shadows except dialogs, drawers and toasts. Status is always **dot + label**, never colour alone. Hover = an L-shift on the surface, never fore-to-muted.
4. **The lockup is fixed.** EXL wordmark (18px); 1px divider; "Transform.cx". Never re-letter the wordmark, never place it on a saturated orange field.
5. **Advanced lives behind disclosure.** Complex settings sit inside `details.adv`; the default screen stays a single clear action.
6. **One decisive flourish:** the pipeline stage indicator (●→●→●) repeated across screens is the product's connective tissue. Everything else stays quiet.

One-liner: *EXL's orange, used with discipline — a precise, software-native control room for turning customer conversations into deployed agents.*

---

## 3 · Verified contrast gates

Measured from the shipped token values, WCAG 2.2 AA.

| Pair | Ratio | Gate | Use |
|---|---|---|---|
| `--fg` on `--bg` | 18.29 | ≥4.5 ✓ | body text |
| `--fg` on `--surface` | 18.79 | ≥4.5 ✓ | table cells |
| `--muted` on `--bg` | 4.93 | ≥4.5 ✓ | hints, captions |
| `--muted` on `--surface-inset` | 4.71 | ≥4.5 ✓ | hints on inset panels |
| white on `--accent-strong` | 5.30 | ≥4.5 ✓ | filled primary button |
| `--accent-strong` on `--accent-soft` | 4.63 | ≥4.5 ✓ | `.badge-acc`, accent chips |
| `--accent` ring on white | 3.39 | ≥3 ✓ | focus ring, non-text |
| `--warn-fg` on `--warn-soft` | 7.29 | ≥4.5 ✓ | warning badge |
| `--danger-fg` on `--danger-soft` | 7.64 | ≥4.5 ✓ | destructive + error badge |
| `--success-fg` on `--success-soft` | 8.45 | ≥4.5 ✓ | success badge |

**One open tradeoff, documented not hidden:** `--border` on white is **1.26:1**, below the 3:1 that WCAG 1.4.11 wants for component boundaries. The quiet-hairline look is the deliberate brand choice, and identification is carried by the always-present `<label>` plus placeholder. To take strict AA instead, darken only the control boundary — `--border` → `oklch(63% 0.006 250)` on `.input / .btn / .switch` — and accept a visibly heavier UI.

---

## 4 · Component state contract

| Component | Rest | Hover | Active / selected | Focus |
|---|---|---|---|---|
| `.btn` (secondary) | white / `--border` | `--surface-hover` + darker border | `--surface-active` | 2px `--accent-strong` ring |
| `.btn-primary` | `--accent-strong` + white | `--accent-hover` | `--accent-active` | 2px `--accent-strong` ring |
| `.chip` | white / `--border` | `--surface-hover` | `--fg` fill + `--surface` text | ring |
| `.icon-btn` | transparent / `--muted` | `--surface-hover`, icon → `--fg` | — | ring |
| `.input` | white / `--border` | border → `oklch(87% 0.008 250)` | — | `--accent` border + `--accent-soft` halo |
| `.switch` | track `oklch(88% 0.006 250)` | — | track `--accent-strong`, knob `--surface` | ring |
| `.nlink` (nav) | transparent / `--fg` | `--surface-hover` | `--fg` fill + `--surface` text | ring |

Foreground never gets lighter on hover. Disabled is the only state allowed to drop contrast (`opacity .55`).

**Modals:** `role="dialog" aria-modal="true"`, focus moves in on open, Tab is trapped, Escape and close restore focus to the opener. **Toasts:** `role="status" aria-live="polite"`.

---

## 5 · Responsive contract

| Breakpoint | Behaviour |
|---|---|
| ≥1101px | Full 232px sidebar; `grid-4` = 4-up; `ua-grid` / `dm-grid` two-column |
| ≤1100px | `grid-4` → 2-up, `grid-3` → 1-up; workspace grids stack; connector/roles/target grids → 2-up |
| ≤900px | Sidebar collapses to a 56px icon rail (40px wordmark); topbar badges compress; page header wraps |
| ≤760px | **Tables scroll inside their card** (`.card:has(table)`) so the page never goes wide; every control clears the **44px** touch floor; the workspace crumb is dropped and the project select shortens |
| ≤560px | Single column everywhere; `.grid-2` → 1-up; topbar badges hidden (in-page cards carry the status); dialogs/drawers go edge-to-edge |

Body copy never scrolls horizontally on any of these.

---

## 6 · Density & copy

- Body 13.5px, controls 34px desktop / 44px touch, table rows 11px vertical padding. Desktop-first console.
- Sentence case, plain verbs: "Run pipeline", "Approve clusters & send to Design", "Deploy to staging". No marketing adjectives, no invented metrics — every number is labelled demo data on the Skyline Broadband story.
- Numbers are always `tabular-nums`; identifiers, ids and code are always `--font-mono`.
