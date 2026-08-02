# Claude Code Project Memory

This file is read automatically at the start of every Claude Code session.
It establishes the rules that apply to ALL work on this project.

---

## What This Project Is

This is the platform defined in `docs/CONFIG.md`. Read that file to get
the platform name, domain, tagline, and all identity variables.

It is a curated marketplace where remote workers in Nairobi discover,
check in, review, and book workspace sessions at cafés, hotel lobbies,
gardens, and coworking spaces.

---

## Before Writing ANY Visual Code

**Read `docs/DESIGN_SYSTEM.md` first.**

This is the single source of truth for every visual decision:
colours, typography, spacing, shadows, border radius, motion, and
component specifications.

Rules that are non-negotiable:
1. **Never hardcode a hex value** in a component. Use Tailwind classes
   that map to CSS variables (e.g. `bg-primary`, `text-muted`).
2. **Never invent a colour** not defined in `docs/DESIGN_SYSTEM.md`.
3. **Never use arbitrary Tailwind values** for design tokens
   (e.g. `bg-[#C4622D]` is wrong — `bg-primary` is correct).
4. If a visual decision is not covered in `docs/DESIGN_SYSTEM.md`, stop
   and ask before proceeding.

The CSS variables live in `src/styles/tokens.css`. Tailwind classes
are mapped in `tailwind.config.ts`. Both are generated from
`docs/DESIGN_SYSTEM.md` during Session 1 and must not be manually
edited — update the design system file instead.

---

## Before Using Any Platform Name or Copy

**Read `docs/CONFIG.md` first.**

Use `PLATFORM_NAME` for the product name. Never hardcode "WorkSpot" —
the name may change and CONFIG.md is the single source of truth.

Use `SCORE_LABEL` for the quality score badge label.
Use `SUBSCRIPTION_NAME` for the subscription product name.

---

## Docs Folder Reference

All project documentation lives in `docs/`:

| File | Read when |
|------|-----------|
| `docs/CONFIG.md` | Any component that shows the platform name, score label, or subscription name |
| `docs/DESIGN_SYSTEM.md` | Any component that involves colours, fonts, spacing, shadows, or visual style |
| `docs/WORKSPOT.md` | Product context, TypeScript interfaces, spot mock data, business model |
| `docs/SCHEMA.md` | Any database work: migrations, queries, RLS policies |
| `docs/BUILD_PLAN.md` | The current build session instructions |

---

## Tech Stack (unchanging rules)

- TypeScript only — no `.js` files ever
- React 18 + Vite + Tailwind CSS + shadcn/ui
- Supabase for auth, database, realtime, Edge Functions
- React Query for all data fetching — no direct Supabase calls in components
- React Router v6 for routing
- Framer Motion for all animations
- Paystack for payments — never direct Safaricom Daraja API

---

## Code Quality Rules

- Mobile-first always — design for 375px, scale up with Tailwind breakpoints
- Always add loading states (skeleton components, not spinners)
- Always add error states (friendly user-facing message, not raw error)
- All touch targets minimum 44×44px
- ARIA labels on all interactive elements
- `npm run build` must produce zero TypeScript errors after every session

---

## CreativeSpot Compatibility

The codebase is future-proofed for a sister platform. Maintain these:
- `QualityScoreBadge` always uses `scoreLabel` prop — never hardcodes "WorkScore"
- `spots` table has `space_family` and `type_attributes` JSONB columns
- Review categories load from `review_schemas` table — never hardcoded
