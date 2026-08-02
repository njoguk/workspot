# Design System

## Philosophy

Warm editorial. East African lifestyle magazine aesthetic. Premium but accessible.
Not generic SaaS. Not a Western fintech clone. Every decision should feel
calibrated for Nairobi — confident, locally-rooted, and visually distinctive.

The design uses a warm earth-tone palette with terracotta as the primary brand
accent, Playfair Display as the editorial display face, and DM Sans for body.
The overall feeling: upscale print magazine, not startup landing page.

---

## How This Design System Works in Code

All values below are implemented as CSS Custom Properties in `src/styles/tokens.css`.
Every component uses Tailwind classes that map to those properties.

**To redesign the entire product:**
1. Update `src/styles/tokens.css` with new values
2. Optionally update font imports in `src/styles/globals.css`
3. `git push` → Vercel auto-deploys in ~2 minutes
4. Every component inherits the changes immediately

Never hardcode hex values in components. Always use Tailwind classes
(`bg-primary`, `text-muted`, `border-surface`) that map to CSS variables.

---

## Token Architecture

### Implementation file: `src/styles/tokens.css`

```css
/* ══════════════════════════════════════════════
   WorkSpot Design Tokens v1.0
   Edit this file to redesign the entire product.
   Naming is semantic (role), not literal (value).
══════════════════════════════════════════════ */

@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;0,900;1,400;1,700&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600&family=DM+Mono:wght@400;500&display=swap');

:root {

  /* ── BRAND COLOURS ── */
  /* Primary action, CTAs, active states, terracotta warmth */
  --color-primary:      #C4622D;
  /* Secondary accent, scores, highlights, golden warmth */
  --color-secondary:    #E8A135;
  /* Success, availability, check-in active, leaf green */
  --color-success:      #3D6B4F;
  /* Informational, badges, sky blue */
  --color-info:         #4A7FA5;

  /* ── SURFACES ── */
  /* Page background — warmest cream */
  --color-bg:           #F9F5EE;
  /* Card surface — slightly warmer than bg */
  --color-surface:      #FAF6EE;
  /* Alternative surface — filter bars, input backgrounds */
  --color-surface-alt:  #EDE5D6;
  /* Subtle tint — hover states, chips, muted backgrounds */
  --color-surface-tint: #F5EFE0;
  /* Sand — secondary card backgrounds */
  --color-surface-sand: #E8DCCB;

  /* ── DARK SURFACES ── */
  /* Primary dark — nav backgrounds, dark cards, hero sections */
  --color-dark:         #1C1410;
  /* Secondary dark — dark card backgrounds, dark panels */
  --color-dark-alt:     #2E1F14;

  /* ── BORDERS ── */
  --color-border:       rgba(28,20,16,0.10);
  --color-border-strong:rgba(28,20,16,0.18);

  /* ── TEXT ── */
  --color-text:         #1C1410;
  --color-text-muted:   #7A6A58;
  --color-text-light:   #A89880;
  /* Text on dark backgrounds */
  --color-text-inverse: #F5EFE0;

  /* ── TYPOGRAPHY ── */
  /* Display / editorial headings */
  --font-display: "Playfair Display", Georgia, serif;
  /* Body copy, UI labels, buttons */
  --font-body:    "DM Sans", system-ui, sans-serif;
  /* Monospace: data, scores, timestamps, metrics */
  --font-mono:    "DM Mono", "Courier New", monospace;

  /* ── TYPE SCALE ── */
  --text-xs:   11px;
  --text-sm:   13px;
  --text-base: 15px;
  --text-lg:   17px;
  --text-xl:   20px;
  --text-2xl:  24px;
  --text-3xl:  28px;
  /* Display: use clamp() in components for responsive sizing */

  /* ── RADIUS ── */
  --radius-sm:   8px;    /* inputs, small chips */
  --radius-md:   12px;   /* small cards, panels */
  --radius-lg:   16px;   /* main cards */
  --radius-xl:   20px;   /* modals, large panels */
  --radius-pill: 100px;  /* badges, chips, pills */

  /* ── SHADOWS ── */
  /* Always earth-toned shadows, never pure black */
  --shadow-sm:  0 2px 12px rgba(28,20,16,0.08);
  --shadow-md:  0 8px 32px rgba(28,20,16,0.12);
  --shadow-lg:  0 24px 64px rgba(28,20,16,0.18);
  --shadow-xl:  0 40px 100px rgba(28,20,16,0.24);

  /* ── SPACING (base-8 scale) ── */
  --space-1:  4px;
  --space-2:  8px;
  --space-3:  12px;
  --space-4:  16px;
  --space-5:  20px;
  --space-6:  24px;
  --space-8:  32px;
  --space-10: 40px;
  --space-12: 48px;
  --space-16: 64px;

  /* ── MOTION ── */
  --duration-fast:   150ms;
  --duration-normal: 250ms;
  --duration-slow:   350ms;
  --ease-out:        cubic-bezier(0.16, 1, 0.3, 1);
  --ease-in-out:     cubic-bezier(0.4, 0, 0.2, 1);

  /* ── LAYOUT ── */
  --nav-height:       64px;
  --tab-bar-height:   68px;
  --sidebar-width:    220px;
  --max-width:        1440px;
  --content-padding:  40px;

}
```

---

## Tailwind Config Mapping

### `tailwind.config.ts` — the bridge from tokens to utility classes

```typescript
import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Brand
        primary:      'var(--color-primary)',
        secondary:    'var(--color-secondary)',
        success:      'var(--color-success)',
        info:         'var(--color-info)',

        // Surfaces
        bg:           'var(--color-bg)',
        surface:      'var(--color-surface)',
        'surface-alt':'var(--color-surface-alt)',
        'surface-tint':'var(--color-surface-tint)',
        sand:         'var(--color-surface-sand)',

        // Dark
        dark:         'var(--color-dark)',
        'dark-alt':   'var(--color-dark-alt)',

        // Text
        text:         'var(--color-text)',
        muted:        'var(--color-text-muted)',
        light:        'var(--color-text-light)',
        inverse:      'var(--color-text-inverse)',
      },
      fontFamily: {
        display: ['var(--font-display)'],
        sans:    ['var(--font-body)'],
        mono:    ['var(--font-mono)'],
      },
      borderRadius: {
        sm:   'var(--radius-sm)',
        md:   'var(--radius-md)',
        lg:   'var(--radius-lg)',
        xl:   'var(--radius-xl)',
        pill: 'var(--radius-pill)',
      },
      boxShadow: {
        sm: 'var(--shadow-sm)',
        md: 'var(--shadow-md)',
        lg: 'var(--shadow-lg)',
        xl: 'var(--shadow-xl)',
      },
      transitionDuration: {
        fast:   'var(--duration-fast)',
        normal: 'var(--duration-normal)',
        slow:   'var(--duration-slow)',
      },
    },
  },
  plugins: [],
}

export default config
```

---

## Component Usage Rules

**Always write:**
```tsx
<div className="bg-surface text-text rounded-lg shadow-sm">
<button className="bg-primary text-inverse font-sans">
<span className="text-muted font-mono text-xs">
```

**Never write:**
```tsx
<div style={{ backgroundColor: '#FAF6EE' }}>         // ❌ hardcoded hex
<button className="bg-[#C4622D] text-[#F5EFE0]">    // ❌ Tailwind arbitrary
<span className="text-[#7A6A58]">                    // ❌ hardcoded in class
```

This rule is what makes redesign work. If every component uses semantic
token names, updating tokens.css changes the whole product instantly.

---

## Colour Palette Reference

### Light surfaces (used on cream background pages)
| Token | Current value | Role |
|-------|--------------|------|
| `--color-bg` | `#F9F5EE` | Page background |
| `--color-surface` | `#FAF6EE` | Cards, panels |
| `--color-surface-alt` | `#EDE5D6` | Filter bar, input bg |
| `--color-surface-tint` | `#F5EFE0` | Cream chip bg |
| `--color-surface-sand` | `#E8DCCB` | Secondary card bg |

### Brand accents
| Token | Current value | Role |
|-------|--------------|------|
| `--color-primary` | `#C4622D` | CTAs, active states, borders |
| `--color-secondary` | `#E8A135` | Scores, highlights, WorkScore badge |
| `--color-success` | `#3D6B4F` | Available, active checkin, positive |
| `--color-info` | `#4A7FA5` | Info badges, sky tones |

### Dark surfaces (hero sections, nav, dark cards)
| Token | Current value | Role |
|-------|--------------|------|
| `--color-dark` | `#1C1410` | Primary dark surface |
| `--color-dark-alt` | `#2E1F14` | Secondary dark surface |

### Text
| Token | Current value | Role |
|-------|--------------|------|
| `--color-text` | `#1C1410` | Primary body text |
| `--color-text-muted` | `#7A6A58` | Secondary text, descriptions |
| `--color-text-light` | `#A89880` | Placeholder, meta, subtle labels |
| `--color-text-inverse` | `#F5EFE0` | Text on dark backgrounds |

---

## Typography Reference

### Font roles
| Token | Family | Used for |
|-------|--------|----------|
| `--font-display` | Playfair Display | H1–H3, spot names, section titles, editorial |
| `--font-body` | DM Sans | Body text, UI labels, buttons, descriptions |
| `--font-mono` | DM Mono | Scores, metrics, timestamps, data, kicker labels |

### Type usage conventions
- **Display font italic** (Playfair Display italic): accent words in headlines, decorative
- **Body font weight 600**: buttons, nav items, card titles
- **Mono font**: always for numbers, scores, times, and all-caps labels
- Never mix display font at small sizes (<14px) — use body font instead

---

## Spacing System

Base unit: 4px. All spacing is multiples of 4.

Comfortable card padding: 20–28px
Section gap: 48–64px
Page horizontal padding: 16px mobile → 40px tablet → 60px desktop
Max content width: 1440px centered

---

## Shadows

All shadows use earth-toned rgba, never pure black.
Base shadow formula: `rgba(28,20,16, opacity)` where 28,20,16 = var(--color-dark).

| Token | Value | Used for |
|-------|-------|----------|
| `--shadow-sm` | `0 2px 12px rgba(28,20,16,0.08)` | Subtle card lift |
| `--shadow-md` | `0 8px 32px rgba(28,20,16,0.12)` | Elevated cards, dropdowns |
| `--shadow-lg` | `0 24px 64px rgba(28,20,16,0.18)` | Modals, popovers |
| `--shadow-xl` | `0 40px 100px rgba(28,20,16,0.24)` | Phone frames, overlay modals |

---

## Motion

All animations: Framer Motion. No CSS animation for interactive elements.

| Token | Value | Used for |
|-------|-------|----------|
| `--duration-fast` | 150ms | Micro-interactions, hover states |
| `--duration-normal` | 250ms | Modal entry, card reveals |
| `--duration-slow` | 350ms | Page transitions, hero animations |
| `--ease-out` | `cubic-bezier(0.16, 1, 0.3, 1)` | Entry animations |
| `--ease-in-out` | `cubic-bezier(0.4, 0, 0.2, 1)` | Toggle states |

### Standard animation presets
```typescript
// Card hover
whileHover={{ y: -3, transition: { duration: 0.2 } }}

// Modal entry
initial={{ opacity: 0, scale: 0.96, y: 12 }}
animate={{ opacity: 1, scale: 1, y: 0 }}
transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}

// Staggered list reveal
container: { transition: { staggerChildren: 0.05 } }
item: { initial: { opacity: 0, y: 16 }, animate: { opacity: 1, y: 0 } }

// Hero content stagger (delay between each element: 0.15s)
```

---

## Border Radius

| Token | Value | Used for |
|-------|-------|----------|
| `--radius-sm` | 8px | Inputs, small buttons, table status chips |
| `--radius-md` | 12px | Small cards, metric panels |
| `--radius-lg` | 16px | Main spot cards, modal panels |
| `--radius-xl` | 20px | Large modals, section panels |
| `--radius-pill` | 100px | Chips, badges, filter pills, tags |

Never use `rounded-full` for non-circular elements — use `rounded-pill` instead.

---

## Key Recurring Components

### QualityScoreBadge
Background: `--color-secondary` (#E8A135)
Text: `--color-dark` (#1C1410)
Font: `--font-display`, font-weight 900
Shape: circular or rounded-md
Sizes: sm=38px, md=48px, lg=56px
Label below score: `--font-mono` 7px, color `rgba(28,20,16, 0.5)`
The label is always a prop (defaults to CONFIG.md SCORE_LABEL). Never hardcode "WorkScore".

### WifiBars
4 vertical bars increasing in height (5, 8, 11, 14px). Width 4px each.
Active: `--color-success` (#3D6B4F)
Inactive: `--color-border-strong`

### NoiseDots
3 circles, 7px diameter.
Active: `--color-primary` (#C4622D)
Inactive: `--color-border`

### Filter chips
Default: outlined, `--color-border-strong` border, `--color-text-muted` text
Hover: `--color-primary` border and text
Active: `--color-dark` background, `--color-text-inverse` text
Font: `--font-body` 12px weight 500, `--radius-pill`

### Vibe tags
Background: `--color-surface-alt`
Text: `--color-text-muted`
Colour variants by tag type:
- Nature tags (🌿, 🌳): `--color-success` tint
- Food/quality tags (☕, 🏆): `--color-secondary` tint
- Info tags (📹, 🌍): `--color-info` tint
- Action tags (🌅, ⚡): `--color-primary` tint

### Hero sections (dark backgrounds)
Background: `--color-dark`
Gradient overlays: radial in `--color-primary` (top-right, 20% opacity)
and `--color-success` (bottom-left, 15% opacity)
Grid pattern overlay: `--color-text-inverse` lines, 3% opacity

---

## Dark Mode (Optional Future Enhancement)

Because all values are CSS Custom Properties with semantic names,
adding a dark mode requires only adding this block to tokens.css:

```css
[data-theme="dark"] {
  --color-bg:           #1C1410;
  --color-surface:      #2E1F14;
  --color-surface-alt:  #3D2B1F;
  --color-surface-tint: #2E1F14;
  --color-border:       rgba(245,239,224,0.08);
  --color-border-strong:rgba(245,239,224,0.15);
  --color-text:         #F5EFE0;
  --color-text-muted:   #A89880;
  --color-text-light:   #7A6A58;
  --color-text-inverse: #1C1410;
  /* brand accents remain the same — they work on both backgrounds */
}
```

Toggle by setting `document.documentElement.setAttribute('data-theme', 'dark')`.

---

## How to Redesign (Step by Step)

### Minor reskin (new colours only)
1. Open `src/styles/tokens.css`
2. Update the colour values under `/* ── BRAND COLOURS ── */` and `/* ── SURFACES ── */`
3. `git push` → deployed in 2 minutes

### Full rebrand (new colours + fonts)
1. Update font @import in `src/styles/tokens.css` (top of file)
2. Update `--font-display`, `--font-body`, `--font-mono` values
3. Update colour values as above
4. `git push` → deployed in 2 minutes

### Layout or spacing changes
1. Update `--radius-*`, `--space-*`, `--shadow-*` tokens
2. `git push`

### What does NOT change in a redesign
- Component structure and functionality
- TypeScript interfaces and business logic
- Database schema
- Any file except `src/styles/tokens.css` (and `globals.css` for font imports)

This is the value of the token architecture. The product logic never changes.
Only the presentation layer does.
