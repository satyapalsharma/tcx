import type { Config } from "tailwindcss";

/**
 * Transform.cx — Tailwind v4 configuration.
 *
 * Tailwind v4 is CSS-first: the design tokens (colors, fonts, radii,
 * easings, breakpoints) live in `src/app/globals.css` under `@theme`, and
 * the framework auto-detects source files. This file is intentionally
 * minimal and exists for two reasons:
 *
 *   1. Editor/IDE and plugin compatibility (some tooling still expects it).
 *   2. The safelist below — status/color fragments are composed at
 *      runtime (e.g. `bg-${status}-soft`), which class detection can't see.
 *
 * Do NOT duplicate token values here; edit `@theme` in globals.css instead.
 */
const config: Config = {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/views/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/lib/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/hooks/**/*.{js,ts,jsx,tsx,mdx}",
  ],
};

/**
 * Runtime-composed status classes (e.g. `bg-${status}-soft`) are invisible to
 * class detection. Tailwind v4's place for these is `@source inline(...)`
 * in globals.css — see the SAFELIST constant there. Kept here as reference.
 */
export const SAFELIST = [
  "bg-success-soft",
  "bg-warn-soft",
  "bg-danger-soft",
  "text-success-fg",
  "text-warn-fg",
  "text-danger-fg",
  "border-success",
  "border-warn",
  "border-danger",
] as const;


export default config;
