# WorkSpot Nairobi — Build Plan (7 Sessions)

Complete build sequence from zero to production.
Each session is a single Claude Code CLI session on your Mac.
Sessions build on each other — complete them in order.

**Before starting:** Complete SETUP_GUIDE.md first.
**Model:** Use Claude Opus 4.8 (`claude-opus-4-8`) in Claude Code for all sessions.
Fable 5 has been suspended by US government order. Opus 4.8 has the same
1M token context window and 128K max output — the session plan is unchanged.

---

## How to Run a Session

1. Open Terminal on your Mac
2. Navigate to your project: `cd ~/workspot`
3. Start Claude Code: `claude`
4. Copy and paste the session instruction below
5. Claude Code writes all the code and runs the app
6. When it says "done", verify using the checklist
7. Commit: `git add . && git commit -m "Session X complete"`
8. Push: `git push origin main`
9. Vercel auto-deploys within 2 minutes

---

## Session 1: Foundation — Project Scaffold & App Shell

**Estimated time:** 2–3 hours
**What you'll have after:** A live URL on Vercel with the app shell,
routing, navigation, and design system working. No content yet.

### Pre-session checklist
- [ ] Node.js installed (`node -v` in Terminal should show a version)
- [ ] Claude Code CLI installed (`claude --version`)
- [ ] GitHub repo created (e.g. `github.com/yourname/workspot`)
- [ ] Vercel account created and connected to GitHub repo
- [ ] Supabase project created (get URL + anon key ready)

### Claude Code Instruction
```
I am building WorkSpot Nairobi — a curated marketplace where remote workers
in Nairobi, Kenya discover and book workspace sessions at cafés, hotels,
gardens, and coworking spaces.

Set up the complete project foundation in the current directory.

TECH STACK:
- React 18 + Vite + TypeScript
- Tailwind CSS v3
- shadcn/ui (use the CLI to init)
- React Router v6
- React Query (TanStack Query v5)
- Framer Motion
- @supabase/supabase-js

STEP 0 — Verify project docs are in place:
Check that the following files exist in the project:
- CLAUDE.md (project root)
- docs/CONFIG.md
- docs/DESIGN_SYSTEM.md
- docs/WORKSPOT.md
- docs/SCHEMA.md
Read docs/CONFIG.md now to get the platform name.
Read docs/DESIGN_SYSTEM.md now before writing any CSS or Tailwind config.
These files are the source of truth — do not invent any design values.

STEP 1 — Scaffold the project:
Create a new Vite + React + TypeScript project. Install all dependencies.
Configure Tailwind with the custom theme from docs/DESIGN_SYSTEM.md.

STEP 2 — Tailwind config (tailwind.config.ts):
Read docs/DESIGN_SYSTEM.md for the complete mapping. Use the token
architecture defined there: Tailwind colours, fonts, radii, and shadows
all map to CSS variables, NOT hardcoded values.

Use this structure (values come from docs/DESIGN_SYSTEM.md tokens):
colors: {
  primary: 'var(--color-primary)',
  secondary: 'var(--color-secondary)',
  success: 'var(--color-success)',
  info: 'var(--color-info)',
  bg: 'var(--color-bg)',
  surface: 'var(--color-surface)',
  'surface-alt': 'var(--color-surface-alt)',
  'surface-tint': 'var(--color-surface-tint)',
  sand: 'var(--color-surface-sand)',
  dark: 'var(--color-dark)',
  'dark-alt': 'var(--color-dark-alt)',
  text: 'var(--color-text)',
  muted: 'var(--color-text-muted)',
  light: 'var(--color-text-light)',
  inverse: 'var(--color-text-inverse)',
}
fontFamily: {
  display: ['var(--font-display)'],
  sans: ['var(--font-body)'],
  mono: ['var(--font-mono)'],
}
borderRadius: {
  sm: 'var(--radius-sm)',
  md: 'var(--radius-md)',
  lg: 'var(--radius-lg)',
  xl: 'var(--radius-xl)',
  pill: 'var(--radius-pill)',
}
boxShadow: {
  sm: 'var(--shadow-sm)',
  md: 'var(--shadow-md)',
  lg: 'var(--shadow-lg)',
  xl: 'var(--shadow-xl)',
}

STEP 3 — Design tokens file (src/styles/tokens.css):
Create this file from docs/DESIGN_SYSTEM.md. It should contain:
1. The Google Fonts @import (Playfair Display, DM Sans, DM Mono)
2. All CSS Custom Properties on :root exactly as defined in the
   Token Architecture section of docs/DESIGN_SYSTEM.md
3. The dark mode block [data-theme="dark"] from DESIGN_SYSTEM.md

Then create src/styles/globals.css:
- @import './tokens.css'
- body { font-family: var(--font-body); background: var(--color-bg); color: var(--color-text); }
- * { box-sizing: border-box; margin: 0; padding: 0; }

Import globals.css in src/main.tsx.

This file is the ONLY place hex values exist in the project.
Components always use Tailwind classes, never raw hex values.

STEP 4 — Supabase client (src/lib/supabase.ts):
Create a Supabase client using VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY
from environment variables.

STEP 5 — TypeScript types (src/types/index.ts):
Create the Spot interface, SpaceFamily type, ScoreLabel type as defined in
the project brief. Also create Profile, Checkin, Review, Event, RSVP, Booking types.

STEP 6 — App shell (src/App.tsx):
Set up React Router v6 with these routes:
/ → ExplorePage (placeholder)
/spot/:id → SpotDetailPage (placeholder)
/community → CommunityPage (placeholder)
/events → EventsPage (placeholder)
/profile → ProfilePage (placeholder)
/auth → AuthPage (placeholder)
/partner → PartnerPage (placeholder)
/partner/dashboard → VenueDashboard (placeholder)
/onboarding → OnboardingPage (placeholder)

Create placeholder page components that show the page name centred.

STEP 7 — Top navigation (src/components/layout/TopNav.tsx):
Fixed top bar, 64px height. Background: cream with backdrop-blur.
Border-bottom: 1px solid rgba(28,20,16,0.1). Sticky.
Left: "WorkSpot" in Playfair Display bold + italic "Nairobi" in
text-muted after it. Right: green pulsing dot + "47 verified spots"
in DM Mono, then "List a Space" button in earth background cream text.
Show avatar initials (gradient) when logged in — read from React Query.

STEP 8 — Bottom tab bar (src/components/layout/BottomTabs.tsx):
Mobile only (hidden above md breakpoint). Fixed bottom. 68px height.
White background. 5 tabs: 🏠 Explore · 📍 Check In · 👥 Community ·
🎉 Events · 👤 Profile. Active tab: terracotta colour. Use NavLink.

STEP 9 — Page wrapper (src/components/layout/PageWrapper.tsx):
Adds consistent padding (16px mobile, 40px tablet, 60px desktop),
max-width 1440px centered, padding-top 64px (nav height),
padding-bottom 68px on mobile (tab bar height).

STEP 10 — Wire everything together in main.tsx:
Wrap in QueryClientProvider, BrowserRouter. All pages use PageWrapper.

STEP 11 — Environment variables:
Create .env.local with VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY
(use placeholder values for now, I'll fill them in).
Create .env.example with the same keys but empty values.
Add .env.local to .gitignore.

After all steps: run `npm run dev` and confirm the app loads at
localhost:5173 with nav visible and routing working. Fix any
TypeScript errors before marking complete.
```

### Verify it worked
- [ ] `npm run dev` starts with no errors in Terminal
- [ ] Browser shows the app at localhost:5173
- [ ] Navigation visible at top on desktop
- [ ] Tab bar visible at bottom on mobile
- [ ] Clicking tabs changes the URL

### After session
```bash
git add .
git commit -m "Session 1: Foundation complete"
git push origin main
```
Then add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to Vercel Environment Variables.

---

## Session 2: Phase 1 — Complete Directory UI

**Estimated time:** 3–4 hours
**What you'll have after:** The full Phase 1 product visible and working in the browser
with all mock data. All components, the hero, filter bar, spot grid, and detail page.

### Pre-session checklist
- [ ] Session 1 complete and deployed to Vercel
- [ ] `npm run dev` starts clean

### Claude Code Instruction
```
I am continuing to build WorkSpot Nairobi. Session 1 (foundation) is complete.
Now build the complete Phase 1 directory UI with mock data.

The design system is established. Colours are available as Tailwind classes
(bg-earth, text-terracotta, etc.) and CSS variables (--earth, --amber, etc.).
Fonts: font-display (Playfair Display), font-sans (DM Sans), font-mono (DM Mono).

STEP 1 — Mock data file (src/data/spots.ts):
Create the SPOTS array with all 12 spots from the project brief. Export it.
Export helper functions: getSpotById(id), getSpotsByNeighbourhood(hood),
getSpotsByType(type), getFeaturedSpots() (returns top 2 by workScore).

STEP 2 — QualityScoreBadge (src/components/ui/QualityScoreBadge.tsx):
Props: score (number), label (string, default 'WorkScore'), size ('sm'|'md'|'lg').
sm=38px, md=48px, lg=56px. Amber background, earth text, Playfair Display font-weight-900.
Rounded-full. Shows score (1 decimal) with label below in DM Mono 7px.

STEP 3 — WifiBars (src/components/ui/WifiBars.tsx):
Props: mbps (number). 4 vertical bars increasing in height (5,8,11,14px).
4px wide each. Active: leaf colour. Inactive: border-strong.
Active count: mbps < 25 → 1, 25-49 → 2, 50-79 → 3, 80+ → 4.

STEP 4 — NoiseDots (src/components/ui/NoiseDots.tsx):
Props: level (1|2|3). 3 circles 7px each. Active: terracotta. Inactive: border.
Tooltip on hover: 1=Quiet, 2=Moderate, 3=Loud.

STEP 5 — MetricRow (src/components/ui/MetricRow.tsx):
Props: spot (Spot). Shows 3 metrics side by side in DM Mono.
For remote_work: WifiBars + mbps value | NoiseDots + noise label | price.

STEP 6 — VibeTags (src/components/ui/VibeTags.tsx):
Props: tags (string[]), max (number, default 3). Pill-shaped tags in mist bg,
text-muted. Truncate to max. Uses DM Sans 11px.

STEP 7 — SpotCard (src/components/spots/SpotCard.tsx):
Grid card for the spot directory. Width ~300px.
Top: 180px image area using coverGradient as CSS background.
QualityScoreBadge (md) top-right of image. If isNew: "🆕 New" badge top-left.
Body (white bg, 18px padding): spot name in font-display 17px bold, neighbourhood +
type in font-mono 11px text-light, MetricRow, VibeTags (max 3).
Hover: translateY(-3px) transition with shadow increase via Framer Motion.
Clicking the card navigates to /spot/:id.

STEP 8 — SpotCardFeatured (src/components/spots/SpotCardFeatured.tsx):
Hero card, 440px tall. Full-bleed coverGradient background.
Dark gradient overlay (linear, bottom to top).
QualityScoreBadge (lg) top-right. Category + vibe badges top-left.
Content anchored bottom-left: name in font-display 26px bold cream,
neighbourhood in font-mono 11px cream/50, MetricRow with cream text.
Hover: subtle scale(1.01) via Framer Motion.

STEP 9 — Filter bar (src/components/explore/FilterBar.tsx):
Sticky at top: 64px (below nav). Background cream. Border-bottom 1px border.
Height 56px. Horizontal scroll on mobile (no scrollbar visible).
Groups separated by vertical 1px border dividers.
Groups: Type (All/Café/Coworking/Hotel/Garden) | WiFi (Fast 50+/Decent 20+) |
Vibe (Quiet/Buzzy/Outdoor) | Price (Free entry/Day pass).
Chip component: default (outlined), hover (terracotta border/text),
active (earth bg cream text). Type = single select. Others = multi-select.
Props: onFilterChange callback.

STEP 10 — useSpotFilters hook (src/hooks/useSpotFilters.ts):
Manages filter state (activeType, wifiFilter, vibeFilter, priceFilter, searchQuery).
Returns filteredSpots, filterState, setFilter functions.
Filter logic: AND combination. Type = exact match. WiFi = min threshold.
Vibe: quiet = noiseLevel===1, buzzy = noiseLevel>=2, outdoor = vibeTags includes 'Outdoor'.
Price: free = priceType==='free', paid = priceType==='paid'.
Search: name or neighbourhood includes query (case insensitive).

STEP 11 — Explore page (src/pages/ExplorePage.tsx):
Full page. Sections top to bottom:

Section A — Hero (100vh dark section):
Earth background with radial gradient overlays (terracotta top-right,
leaf bottom-left). Subtle grid pattern overlay 3% opacity.
Content bottom-anchored (absolute bottom-20 left-10):
- "Nairobi's Remote Work Directory" label: DM Mono 10px amber uppercase
  with 28px rule before it. Animate in with Framer Motion.
- H1: "Find your spot. Do your best work." in Playfair Display
  clamp(52px, 8vw, 100px) font-weight-900 cream. "spot." italic amber.
  Animate in with stagger delay.
- Sub: 16px cream/65. Animate in.
- Stats row: 4 items — "47 Verified Spots" | "12 Neighbourhoods" |
  "830+ Reviews" | "Free Always". Number: Playfair 32px cream. Label: DM Mono cream/35.

Section B — Editor's Picks:
Section heading: "Editor's Picks" Playfair 28px bold + italic subtitle.
Grid: SpotCardFeatured (left, 1.6fr) + SpotCardFeatured (right, 1fr).
Use first 2 spots from getFeaturedSpots().

Section C — All Spots:
Section heading row: "All Spots" left + search input + count right.
Below FilterBar. Below: 3-col SpotCard grid (2 on tablet, 1 on mobile).
Show filtered count in DM Mono. All 12 spots rendered.
"No spots found" empty state when filters return 0.

STEP 12 — Spot detail page (src/pages/SpotDetailPage.tsx):
Route /spot/:id. Reads spot from SPOTS data using useParams.

Hero: 260px image area with coverGradient. Dark overlay. Back arrow top-left
(navigate(-1)). QualityScoreBadge (lg) top-right. Name Playfair 30px bold cream,
neighbourhood + type DM Mono bottom.

Body:
1. Description: left-bordered amber callout box (3px amber left border,
   amber-pale bg, 14px text, 1.75 line-height).
2. Metrics grid (3 cols): 6 cards. Each: label (DM Mono 10px text-light),
   value (Playfair 18px bold), sub (11px text-muted). Cards:
   WiFi Speed | Power Sockets | Noise Level | Price to Work | Best Day | Community Score.
   Derive values from spot data.
3. Vibe tags: all vibeTags as coloured pills.
   Tags with 🌿 → leaf bg/text. Tags with ☕/🏆 → amber bg/text.
   Tags with 📹/🌍 → sky bg/text. Tags with 🌅/⚡ → terracotta bg/text.
4. Best time section: label + time slot pills. Green pill (leaf bg) for
   slots ending in ✓. Red-ish for slots ending in ✗. Default for others.
5. Fixed bottom bar (mobile): two buttons — "🗺 Get Directions" (earth bg)
   + "✍️ Rate This Spot" (terracotta bg). On desktop: inline at bottom.

After all steps: run `npm run dev`. Click through the explore page, filter
chips, and spot detail. Fix any TypeScript or Tailwind errors.
Run `npm run build` and confirm it builds with no errors.
```

### Verify it worked
- [ ] Hero section looks dramatic and loads with animation
- [ ] Filter chips filter spots in real time
- [ ] Search input filters spots by name
- [ ] Clicking a spot card goes to its detail page
- [ ] Detail page shows all metrics correctly
- [ ] `npm run build` succeeds with no errors
- [ ] Mobile layout looks correct (single column, bottom tabs visible)

---

## Session 3: Phase 2 Part A — Supabase + Auth

**Estimated time:** 2–3 hours
**What you'll have after:** Real Supabase backend, all 12 spots as real database rows,
working sign up / login flow, and mock data replaced with live queries.

### Pre-session checklist
- [ ] Session 2 complete
- [ ] Supabase project exists (you have URL + anon key)
- [ ] Run all SQL from SCHEMA.md in Supabase SQL Editor (do this before session)
- [ ] Run the review_schemas seed data from SCHEMA.md
- [ ] VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are in .env.local and Vercel

### Claude Code Instruction
```
WorkSpot Phase 2 begins. Connect Supabase and build the full auth flow.
Sessions 1 and 2 are complete — the UI works with mock data from src/data/spots.ts.

STEP 1 — Seed the spots table:
Write a seed script (src/scripts/seedSpots.ts) that takes the SPOTS array
from src/data/spots.ts and inserts all 12 rows into the Supabase spots table.
The spots table has: id, name, neighbourhood, type, space_family, score_label,
description, cover_gradient, type_attributes (JSONB), vibe_tags (text[]),
best_times (text[]), work_score, review_count, price_entry, price_type.
Set space_family='remote_work' and score_label='WorkScore' on all rows.
Store WiFi/noise/sockets values inside type_attributes JSONB.
Run the seed with: npx ts-node --esm src/scripts/seedSpots.ts

STEP 2 — Replace mock data with Supabase queries:
Create src/hooks/useSpots.ts using React Query:
- useSpots() — fetches all spots from Supabase, maps to Spot type
- useSpot(id) — fetches single spot by id
- useFeaturedSpots() — fetches top 2 by work_score DESC
Replace all references to the SPOTS array in ExplorePage and SpotDetailPage
with these hooks. Add loading skeletons (grey animated placeholder divs)
while data loads. Add error states.

STEP 3 — Auth context (src/contexts/AuthContext.tsx):
Create AuthContext with: user, profile, loading, signIn, signUp, signOut.
Use supabase.auth.onAuthStateChange for session management.
When user signs in, fetch their profile row from the profiles table.
Wrap the entire app in AuthProvider in main.tsx.

STEP 4 — Protected route (src/components/auth/ProtectedRoute.tsx):
Wrapper that redirects to /auth if no session. Use for /profile, /partner
routes. Accept children prop.

STEP 5 — Auth page (src/pages/AuthPage.tsx):
Route: /auth. Two tabs: Sign Up | Log In.

Design:
Top 200px: dark hero. Earth background + radial terracotta gradient.
WorkSpot logo centred (Playfair Display bold, italic "Nairobi" below).
Body: white card below with tabs + forms.

Sign Up tab:
Fields: First Name, Last Name, Email, Password.
Validation: email format, password min 8 chars.
On submit: supabase.auth.signUp() → on success navigate to /onboarding.
Show field errors inline in terracotta text.

Log In tab:
Fields: Email, Password. "Forgot password?" link (supabase.auth.resetPasswordForEmail).
On submit: supabase.auth.signInWithPassword() → on success navigate to /.

Both tabs: "Continue with Google" button (supabase.auth.signInWithOAuth provider google).
"or" divider between form and Google button.

STEP 6 — Soft gate (modal bottom sheet):
In ExplorePage, track how many spot detail pages the user has visited
(localStorage counter, increment on each /spot/:id visit).
After 3 visits without auth, show a bottom sheet sliding up:
"Join the community" title, benefit text, "Create account" CTA (earth bg),
"Log in" link, "Continue browsing as guest" dismiss link.
Store dismissal in localStorage. Only show once per browser session.

STEP 7 — Nav state (update TopNav.tsx):
When logged in: show user avatar (initials in gradient circle) instead of
"List a Space" button. Clicking avatar opens a dropdown:
Profile (navigate /profile) | My Bookings | Sign Out.
Use useAuth() hook to read user state.

After all steps: run `npm run dev`. Test sign up (creates a real user in
Supabase), log in, and confirm spots load from the database (check Supabase
Table Editor to see the rows). Fix all errors.
```

### Verify it worked
- [ ] Spots load from Supabase (check Network tab — should see Supabase requests)
- [ ] Sign up creates a real user in Supabase Auth
- [ ] Signing up redirects to /onboarding
- [ ] Log in works and shows avatar in nav
- [ ] Sign out returns to logged-out state
- [ ] Soft gate appears after viewing 3 spots

---

## Session 4: Phase 2 Part B — Community Features

**Estimated time:** 3–4 hours
**What you'll have after:** Complete community layer — onboarding, check-ins,
reviews, community feed, events, user profile, and streak mechanics.

### Pre-session checklist
- [ ] Session 3 complete
- [ ] Auth is working (you can sign up and log in)
- [ ] Supabase tables: checkins, reviews, review_schemas, events, rsvps, profiles all exist

### Claude Code Instruction
```
Continue building WorkSpot Nairobi. Phase 2 Part B: all community features.
Auth is working. Supabase is connected.

STEP 1 — Onboarding wizard (src/pages/OnboardingPage.tsx):
3-step wizard at /onboarding. Only show after first sign-up.
Check localStorage for 'workspot_onboarding_complete' to skip if already done.

Step 1 — Role selection:
Title "What's your work setup?" Desc text. 4 role cards (tap to select, one at a time):
💻 Freelancer/Consultant | 🏠 Remote Employee | 🚀 Founder/Entrepreneur | ✈️ Digital Nomad
Selected card: terracotta border, light terracotta bg, checkmark visible.
"Next →" and "Skip for now" link.

Step 2 — Interests:
Title "What matters to you?" 12 multi-select chips:
🤫 Quiet focus | ⚡ Fast WiFi | ☕ Great coffee | 🌿 Outdoor setting | 📞 Video call friendly
🤝 Networking | 💳 Budget-friendly | 🏨 Professional setting | 🌍 Expat-friendly
🔌 Always has power | 🌅 Morning hours | 🌆 Late night work
Selected: earth bg, cream text. Unselected: outline. Multi-select allowed.

Step 3 — Neighbourhoods:
Title "Where do you mostly work from?" 7 multi-select rows:
🏙 Westlands (7 spots) | 🌳 Kilimani (5 spots) | 🏡 Karen (4 spots) |
🌿 Lavington (3 spots) | 🌍 Gigiri/Runda (4 spots) | 🏗 Upperhill (3 spots) | 🌆 CBD (2 spots)
Selected: leaf-pale bg, leaf border, checkmark. Final button: "🎉 Finish Setup →" leaf bg.

On complete: UPDATE profiles SET role, interests, neighbourhoods via Supabase.
Set localStorage 'workspot_onboarding_complete' = 'true'. Navigate to /.

STEP 2 — Check-in bar (add to ExplorePage when logged in):
Below filter bar. Dark earth card. Left: green pulsing dot + "Where are you working from?".
Right: → arrow. Tapping opens check-in bottom sheet (Framer Motion slide up).

STEP 3 — Check-in bottom sheet (src/components/checkin/CheckInSheet.tsx):
Search input: "Search spots or neighbourhoods..."
"Spots near you" list: 5 spots from useSpots(), ordered by workScore DESC.
Each row: gradient thumbnail (40×40) | name + neighbourhood + live count | workScore badge.
Live count: query checkins WHERE spot_id = X AND checked_out_at IS NULL, use realtime.
Tap a spot → show check-in confirmation.

STEP 4 — Check-in confirmation (src/components/checkin/CheckInConfirm.tsx):
Spot header (gradient, dark overlay). 2×2 grid of live conditions:
People here (count) | Noise (from last review) | WiFi now (from last review) | Best until (from bestTimes).
"📍 Check In Here" button (leaf). "← Different spot" ghost button.
On confirm: INSERT into checkins (user_id, spot_id, checked_in_at).
Update user streak in profiles.

STEP 5 — Active check-in state (src/components/checkin/ActiveCheckIn.tsx):
When user has an open checkin (checked_out_at IS NULL), show this card instead of the bar.
Shows: "● CHECKED IN" badge, spot name, session timer (useInterval count-up), streak counter.
"Also working here" avatar stack (query other open checkins at same spot).
Quick actions: "Still quiet 🔇" | "Test WiFi 📡" | "Leave review ✍️"
"Leave ×" link: UPDATE checkins SET checked_out_at = NOW(). 
If session >= 30 minutes: prompt to leave a review.

STEP 6 — Streak logic (src/hooks/useStreak.ts):
On every check-in, calculate streak:
- If last_checkin_date = yesterday: increment check_in_streak
- If last_checkin_date = today: no change (already checked in today)
- Otherwise: reset to 1
- Update longest_streak if current > longest
UPDATE profiles SET check_in_streak, longest_streak, last_checkin_date.

STEP 7 — Review flow (src/components/review/ReviewFlow.tsx):
3-step flow. Load review schema: SELECT from review_schemas WHERE space_type = spot.type.

Step 1 — Star ratings: For each category in schema.categories, show:
icon + category label + 5 star tap targets (22px). Active: amber fill. Inactive: border.
Score 1-5 shown right. "Next: WiFi Test →" (active only when all rated).

Step 2 — Primary metric + comment:
Label: schema.primary_metric_label. Number input for metric value.
Show average: "Average here: XX from N tests" (query AVG from reviews).
After entry: green result card "XX Mbps · ✓ Saved".
Comment textarea: "Your note" (120px), char count. "Next: Quick Tags →".

Step 3 — Quick tags + submit:
Two groups from schema.quick_tags: Conditions + Vibe. Multi-select chips.
Submit block (dark earth card): "🌟 Your WorkScore contribution" + "Submit Review ✓" amber button.

On submit:
1. Calculate overall_score from ratings + weights
2. INSERT into reviews
3. Call update_spot_work_score(spot.id) via Supabase RPC
4. Increment profile.workscore_contributions
5. Success toast. Navigate to spot detail.

STEP 8 — Community page (src/pages/CommunityPage.tsx):
Route /community. Three tabs: Activity | Tips | People.

Community hero card: dark green gradient. "WorkSpot Community" label amber.
Title "Nairobi Remote Workers". Sub "847 members · Growing every week".
Avatar stack (4 letters). "Join →" button amber (external link placeholder).

Activity tab: Query JOIN of checkins + reviews ordered by created_at DESC limit 20.
Each feed item: avatar (initials, colour based on user_id hash) + name + time ago +
action text + spot name badge. Reactions row (👍/💬 — localStorage count for now).
"📍 Going too" button adds user to checkins.

Tips tab: Reviews with comment IS NOT NULL, ordered by created_at DESC, limit 10.
Each: coloured left border card. User avatar + name + spot badge. Comment excerpt.
Upvote count (localStorage). Tag: derived from quick_tags (WIFI TIP / FOOD TIP etc.).

People tab: profiles WHERE last_checkin_date > NOW() - 30 days.
Grid. Each: avatar + display_name + role chip + check_in_streak.

STEP 9 — Events page (src/pages/EventsPage.tsx):
Route /events.

Events list: Query events table. Upcoming (event_date >= today) + past events.
Featured event card: dark blue-to-terracotta gradient. Event title Playfair bold.
Date/time/free badges. Attendee avatar stack + count (query rsvps).
"RSVP — It's Free" button amber.

Event detail page (/events/:id):
Spot card for host venue. Description. Attendee stack (realtime subscription to rsvps).
RSVP button: INSERT rsvps on click → button turns green "✅ You're going!"
Confirmed screen: green hero + 🎉 + "You're in!" + Add to Calendar button
(Google Calendar link format: https://calendar.google.com/calendar/render?action=TEMPLATE&text=...)

STEP 10 — User profile page (src/pages/ProfilePage.tsx):
Route /profile. Protected (redirect to /auth if not logged in).

Header: dark earth bg. Avatar (initials circle, gradient). display_name + @handle +
role chip + interest chips.
Stats row (3 cols): Check-ins count | Reviews count | Spots visited (DISTINCT spot_id).
All data from profiles + aggregate queries.

Streak card: dark earth gradient. 🔥 icon. check_in_streak large in amber Playfair.
"Last checked in: X ago at [spot name]".

Streak milestone sheet: When streak hits 7, 14, 30, or 60 days, show a celebration
modal on the profile page. Check with localStorage to not re-show.
Progress bar from current milestone → next. Rewards preview.

Badges: 6-wide grid. Earned: full colour. Locked: grayscale opacity 30%.
Badges: 🌿 Garden Lover (5+ garden checkins) | ⚡ WiFi Tester (5+ wifi tests)
| 🔥 7 Day Streak | 🔥 14 Day Streak | 🎉 Workcation Pro (1 event attended)
| 🗺 All Hoods | 🏆 Top Reviewer (10+ reviews)
Query the relevant tables to determine which are earned.

Recent spots: Last 5 DISTINCT spots checked into. Gradient thumbnail + name +
last visit time + total visits + workScore badge.

After all steps: run the app and test the full journey: sign up → onboard →
check in → review → view community feed → RSVP to event → check profile.
Fix all TypeScript errors. Run `npm run build` to confirm clean build.
```

### Verify it worked
- [ ] Onboarding 3 steps work and save to Supabase
- [ ] Check-in creates a real row in Supabase checkins table
- [ ] Active check-in card shows with session timer
- [ ] Checkout + review flow saves a real review and recalculates WorkScore
- [ ] Community feed shows real check-ins from database
- [ ] Profile shows real stats for logged-in user
- [ ] Badge logic correctly shows earned/locked state

---

## Session 5: Phase 3 Part A — WorkPass & Booking

**Estimated time:** 3–4 hours
**What you'll have after:** WorkPass subscription flow, slot booking, booking
confirmation with digital ticket, and My Bookings management page.

### Pre-session checklist
- [ ] Sessions 1–4 complete
- [ ] bookings, venue_settings tables exist in Supabase

### Claude Code Instruction
```
Continue WorkSpot Nairobi build — Phase 3 monetisation. Sessions 1–4 are complete.
Build the WorkPass subscription flow and slot booking system.

STEP 1 — WorkPass hook (src/hooks/useWorkPass.ts):
useIsWorkPassMember() → reads is_workpass + workpass_expires_at from profile.
Returns: { isActive, expiresAt, daysLeft }
Check expiry: if workpass_expires_at < NOW() set is_workpass=false in profiles.

STEP 2 — WorkPass card component (src/components/workpass/WorkPassCard.tsx):
A physical credit card design. Props: profile (Profile), variant ('full'|'mini').
Dark gradient (#1A1408 to #3D2A0A). Gold EMV chip visual (30×22px, gold gradient,
rounded). "WorkSpot Member" tier label DM Mono gold/70. "WorkPass" in Playfair Display
bold 22px cream. "Nairobi · Active" tagline. Watermark "WorkPass" 12% opacity top-right.
Stats row: 47 Spots | ∞ Sessions | -30% Off. Border: 1px gold/20.

STEP 3 — WorkPass upgrade flow (src/pages/WorkPassPage.tsx):
Route: /workpass. Triggered when free user taps "Book a slot".

Screen 1 — Pitch:
Dark #1A1408 background. Radial gold gradient top-right.
"WorkSpot Pass" DM Mono gold kicker. H1 "One pass. Every spot." Playfair 28px cream.
Sub text. WorkPassCard component (full variant, showing generic preview).
2×2 perks grid: 📅 Book ahead | 💸 30% off | ⭐ Priority seats | 🏆 Member badge.
"See plans & pricing →" amber CTA button.

Screen 2 — Plan selector:
Two plan cards side by side.
Monthly: "KES 1,200/mo" — Cancel anytime. 3 features.
Annual: "KES 900/mo" (billed KES 10,800). "Best value" label above. Saves "KES 3,600/yr".
4 features (highlighted). amber border. Annual card visually prominent.
Corporate WorkPass info callout (leaf tint). "Talk to us" ghost button.
Primary CTA: "Start Annual Plan → KES 10,800".
Secondary: "Monthly instead" ghost button.
Store selected plan in state.

Screen 3 — M-Pesa payment:
Order summary dark earth card: Plan | Billed today | Total in amber.
M-Pesa input: pre-fill phone number from profile if available.
Phone number input in format +254 XXX XXX XXX. Input uses Kenyan number format.
"Send M-Pesa Request" leaf button. This will call the Edge Function (built in Session 6).
For now: show a "Payment processing coming in Session 6" message and set
is_workpass=true + workpass_expires_at=30 days from now as a test shortcut.

STEP 4 — WorkPass member UI changes:
In ExplorePage: when isWorkPassMember=true, add "Book a slot" button to each SpotCard
and SpotCardFeatured (leaf bg, white text, below the spot name).
WorkPass status banner in cream page: "🏆 As a WorkPass member you get 30% off all bookings."
In TopNav: show "🏆 WorkPass" golden badge next to avatar.

STEP 5 — Slot booking flow (src/pages/BookingPage.tsx):
Route: /book/:spotId
Gate: if not WorkPass member, redirect to /workpass.

Step 1 — Date + slot picker:
Spot header (gradient, 150px). Booking spot name + meta.
Date strip: scrollable 7-day picker. Selected date: terracotta border.
Time slots list for selected date (4 slots): each slot shows time range | availability
bar (4px colour-coded: green/amber/red based on occupancy) | price with 30% struck
through + discounted price in terracotta + "Pass -30%" below | selection circle.
Fetch real occupancy: query bookings WHERE spot_id AND slot_date AND status=confirmed,
count against venue_settings.max_seats_per_slot (default 30).
Standard prices: Morning KES 700, Midday KES 600, Afternoon KES 500.
WorkPass price = standard × 0.7. Show both.
"Review Booking →" active only when slot selected.

Step 2 — Review + payment method:
Condensed spot header (100px). Booking summary dark earth card:
Slot | Standard rate | WorkPass discount (−KES X, leaf colour) | Total in amber.
Payment selector: "🏆 Pay with Pass" (green, selected) | "📱 M-Pesa" (white outlined).
10-minute reservation warning. "Confirm Booking · KES XXX" leaf button.
On confirm: INSERT into bookings (status='confirmed' for WorkPass, 'pending' for M-Pesa).

STEP 6 — Booking confirmation (src/pages/BookingConfirmPage.tsx):
Route: /booking/:bookingId/confirm
Green hero: ✅ large + "You're booked!" Playfair bold + spot + slot text.
Ticket component (white card, dashed divider mimicking physical ticket):
Top: spot thumbnail + name + neighbourhood.
Dashed divider (border-dashed border-t-2).
Bottom grid 2×2: Date | Time | Duration | Paid (leaf colour with ✓).
Barcode area (dark earth): visual barcode (repeating divs different widths) +
booking_code in DM Mono cream.
Action buttons: "📅 Add to Calendar" + "📤 Share".

STEP 7 — My Bookings (src/pages/MyBookingsPage.tsx):
Route: /bookings (add to router, link from profile dropdown "My Bookings").
Total savings banner: dark earth card, 🏆 icon, "Total WorkPass savings" label,
KES amount in amber Playfair.
Tab strip: Upcoming | Past.
Upcoming: cards with amber top stripe. Spot thumbnail + name + date/time + status badge.
Grid shows paid amount + amount saved. Cancel link (UPDATE status='cancelled',
show only if > 24 hours before slot).
Past: compact rows with done/cancelled status badges.

After all steps: test the full booking flow — tap Book on a spot → select slot →
confirm → see ticket. Check the bookings table in Supabase has real rows.
```

### Verify it worked
- [ ] WorkPass upgrade flow reaches the payment screen
- [ ] Slot booking page shows date strip and time slots
- [ ] Booking confirmation shows the digital ticket with booking code
- [ ] My Bookings page shows the booking

---

## Session 6: Phase 3 Part B — Paystack Payments + Venue Portal

**Estimated time:** 3–4 hours
**What you'll have after:** Real Paystack payments working in sandbox (M-Pesa + cards),
and the complete Venue Partner Portal (landing page, listing editor, dashboard, analytics, payouts).

### Pre-session checklist
- [ ] Sessions 1–5 complete
- [ ] Paystack account created at paystack.com (free, immediate sandbox key access)
- [ ] Test keys ready: pk_test_... (public) and sk_test_... (secret)
- [ ] Add VITE_PAYSTACK_PUBLIC_KEY to .env.local and Vercel environment variables
- [ ] Add PAYSTACK_SECRET_KEY to Supabase secrets (Dashboard → Settings → Secrets)

### Claude Code Instruction
```
Continue WorkSpot Nairobi build — Phase 3 Part B. Sessions 1–5 complete.
Build Paystack payment integration and the complete Venue Partner Portal.
We use Paystack as the payment gateway — NOT direct Safaricom Daraja.
Paystack handles all M-Pesa STK push complexity on their end.

STEP 1 — Install Paystack:
npm install @paystack/inline-js
npm install --save-dev @types/paystack__inline-js

Create src/lib/paystack.ts:
export const PAYSTACK_PUBLIC_KEY = import.meta.env.VITE_PAYSTACK_PUBLIC_KEY

STEP 2 — Initialize payment Edge Function:
Create supabase/functions/initialize-payment/index.ts

Receives POST: { amount_kes, email, booking_id, payment_type, phone_number }
payment_type: 'booking' | 'subscription_monthly' | 'subscription_annual'

1. POST to https://api.paystack.co/transaction/initialize
   Headers: { Authorization: "Bearer " + Deno.env.get("PAYSTACK_SECRET_KEY"),
              "Content-Type": "application/json" }
   Body: {
     email,
     amount: amount_kes * 100,
     currency: "KES",
     channels: ["mobile_money", "card"],
     mobile_money: { phone: phone_number, provider: "mpesa" },
     metadata: { booking_id, payment_type }
   }
2. Returns { access_code, reference } to the frontend
3. Store paystack_reference and paystack_access_code on the bookings row

Deploy: supabase functions deploy initialize-payment

STEP 3 — Paystack webhook handler Edge Function:
Create supabase/functions/paystack-webhook/index.ts

1. Verify signature: HMAC-SHA512 of raw body using PAYSTACK_SECRET_KEY
   Compare to x-paystack-signature header. Return 401 if mismatch.
2. Parse event: { event, data }
3. On event === "charge.success":
   - Find booking by paystack_reference = data.reference
   - UPDATE bookings SET status = 'confirmed'
   - If payment_type includes 'subscription':
     UPDATE profiles SET is_workpass = true,
     workpass_expires_at = NOW() + INTERVAL '1 year' (or '1 month')
4. On event === "charge.failed":
   - UPDATE bookings SET status = 'payment_failed'
5. Always return 200 OK immediately.

Deploy: supabase functions deploy paystack-webhook

Register webhook in Paystack dashboard:
Settings → API Keys & Webhooks → Webhook URL:
https://[project-ref].supabase.co/functions/v1/paystack-webhook
Events: charge.success, charge.failed, transfer.success

STEP 4 — Wire Paystack to booking flow:
In BookingPage.tsx, when user taps "Confirm Booking":
1. Call initialize-payment Edge Function → get { access_code, reference }
2. Use @paystack/inline-js to open Paystack popup:
   import PaystackPop from '@paystack/inline-js'
   const paystack = new PaystackPop()
   paystack.resumeTransaction(access_code, {
     onSuccess: (transaction) => navigate('/booking/' + bookingId + '/confirm'),
     onCancel: () => setError('Payment cancelled. Please try again.')
   })
Paystack popup handles the full M-Pesa STK push flow internally.
No polling needed — the popup closes automatically on success/failure.

STEP 5 — Wire Paystack to subscription purchase:
Same flow as bookings, payment_type = 'subscription_monthly' or 'subscription_annual'.
On popup onSuccess: poll profiles.is_workpass every 2 seconds (max 30 seconds).
When is_workpass = true: show WorkPass activated screen with user's name on card.

STEP 6 — Sandbox test credentials (Paystack Kenya M-Pesa test):
Phone number: 0708000000
PIN: any 4 digits
OTP: any 6 digits
Result: charge.success webhook fires, booking confirmed.
Check your Paystack dashboard → Transactions to verify the test appears.

STEP 7 — Venue Partner landing page (src/pages/PartnerLandingPage.tsx):
Route: /partner. Desktop-optimised. Two-column layout (50/50).

Left (use dark background colour from DESIGN_SYSTEM.md):
Subtle line pattern overlay 4% opacity.
Platform name from CONFIG.md PLATFORM_NAME as eyebrow label.
H1: "Your empty seats are money left on the table."
Italic "left on the table" in primary accent colour from DESIGN_SYSTEM.md.
Sub paragraph. 4 bullet benefits with checkmarks.

Right (light surface colour from DESIGN_SYSTEM.md):
Title "Choose your listing type". Sub text.
3-column tier comparison:
FREE: KES 0/mo. 3 perks ✓. 3 locked features ✗ greyed out.
PREMIUM: KES 3,500/mo. accent border. "Most Popular" label above. 5 perks.
FEATURED: KES 8,000/mo. dark surface bg. 6 perks.
CTA: "Get Started — Free →" primary button + "Talk to us" ghost button.

STEP 8 — Venue dashboard shell (src/pages/partner/VenueDashboard.tsx):
Route: /partner/dashboard. Protected route.
Desktop layout: 220px fixed sidebar + scrollable main content area.

Sidebar (dark surface from DESIGN_SYSTEM.md):
Platform name + "Partner Dashboard" sub label.
Venue name card with tier badge.
Nav items: 📊 Overview | ✏️ Edit Listing | 📅 Bookings (pending count badge) |
💰 Payouts | 📈 Analytics | ⚙️ Settings | 🏆 Upgrade Plan.
Active state and hover state from DESIGN_SYSTEM.md surface colours.

STEP 9 — Dashboard overview (src/pages/partner/VenueOverview.tsx):
4-column KPI strip (white cards, 1px border):
📅 Bookings this week | 💰 Revenue net (price_paid sum - 15%) |
👁 Profile views (placeholder) | 📊 Conversion rate.
Animate KPI numbers counting up on mount with Framer Motion.
Bar chart (Recharts BarChart): daily bookings Mon–Sun. 7 bars.
Colour from DESIGN_SYSTEM.md primary accent. Height 80px.
Upcoming bookings table: Guest | Date & Time | Slot | Payment | Status chips.

STEP 10 — Listing editor (src/pages/partner/VenueListingEditor.tsx):
3 form sections:
Section 1 — Basic Info: Venue Name | Neighbourhood | Type | Maps URL | Description.
Section 2 — Work Conditions: WiFi Speed | Price | Sockets | Noise. 3 toggle rows.
Section 3 — Booking Settings (accent border to highlight it is premium):
Paystack discount rate % | Max seats | Slot duration | Advance window |
Available time slots (multi-chip select: 7–10am, 8am–12pm, 12–3pm, 2–5pm, Evening).
Save: UPSERT spots + venue_settings. Success toast.

STEP 11 — Analytics (src/pages/partner/VenueAnalytics.tsx):
2×2 grid using Recharts:
1. Peak hours horizontal bar chart
2. Visitor profile bars (Freelancer 52% | Founder 24% | Remote emp 16% | Nomad 8%)
3. WorkScore trend (3-bar chart)
4. Neighbourhood ranking list (current venue highlighted)

STEP 12 — Payouts (src/pages/partner/VenuePayouts.tsx):
2×2 summary cards: Available to withdraw (highlighted) | Total earned |
This month | Commission 15%.
"Withdraw to M-Pesa via Paystack" button → confirmation modal.
This will call Paystack Transfers API in production.
Show intent + payout history table.

After all steps: test full Paystack sandbox flow. Verify webhook fires.
Deploy both Edge Functions. Run npm run build — must have 0 errors.
```

### Verify it worked
- [ ] Paystack popup opens when confirming a booking
- [ ] Test M-Pesa flow completes with phone 0708000000
- [ ] Booking status updates to 'confirmed' after test payment
- [ ] Paystack dashboard shows the test transaction under Transactions
- [ ] Partner landing page renders both columns correctly
- [ ] Venue dashboard sidebar navigation works
- [ ] Listing editor saves changes to Supabase
- [ ] Analytics charts render

---

## Session 7: Production Polish & Deployment

**Estimated time:** 2–3 hours
**What you'll have after:** Production-ready app. Fully responsive, optimised,
with correct meta tags, error boundaries, and live at your custom domain.

### Pre-session checklist
- [ ] Sessions 1–6 complete
- [ ] App deployed to Vercel and accessible
- [ ] Custom domain purchased (workspot.co.ke recommended)
- [ ] All Supabase environment variables set in Vercel

### Claude Code Instruction
```
Final session — production polish for WorkSpot Nairobi.
Sessions 1–6 are complete. The full app is built. Now make it production-ready.

STEP 1 — Mobile responsiveness audit:
Check every page at 375px viewport width. Fix:
- Hero H1: must use clamp() to not overflow on mobile
- Stats row: wrap to 2×2 on small screens
- Filter bar: horizontal scroll, no wrap, no visible scrollbar
- Featured cards: stack vertically on mobile
- Spot grid: 1 col mobile, 2 col 640px+, 3 col 1024px+
- Spot detail metrics: 2 cols mobile, 3 cols desktop
- Bottom tab bar: always visible on mobile
- Top nav: hide on mobile (< 768px)
- All touch targets: min 44×44px
- No horizontal overflow anywhere

STEP 2 — Skeleton loading states:
Create src/components/ui/Skeleton.tsx: animated grey gradient div.
Add skeletons to: SpotCard (image + 3 text lines), SpotCardFeatured (full),
Profile page (avatar + stats), Community feed (3 items), Events list.
Use these in loading states from React Query.

STEP 3 — Error boundaries:
Create src/components/ui/ErrorBoundary.tsx (class component).
Wrap at the top level and around each major page.
Error fallback: a tasteful earth-toned "Something went wrong" page with
a "Refresh" button and a note about the issue.

STEP 4 — Empty states:
Consistent empty states for: filtered spots returning 0, no bookings yet,
no reviews for a spot, community feed empty, no events. Each empty state:
a relevant emoji, a short message, and a suggested action button.

STEP 5 — Meta tags + SEO (src/components/SEOHead.tsx):
Use react-helmet-async for per-page meta tags.
Global: title WorkSpot Nairobi, description, og:image, og:type, Twitter card.
Per-page: SpotDetail uses spot name + description. Events uses event name.
Add a robots.txt and sitemap generation script.

STEP 6 — Performance:
Lazy load page components with React.lazy + Suspense.
Add loading="lazy" to all images.
Ensure Tailwind CSS is purging unused styles (it should by default with Vite).
Run `npm run build && npx vite preview` — check bundle sizes.
If any chunk > 500KB, split it.

STEP 7 — Toast notifications:
Install and configure react-hot-toast (or sonner).
Add toasts for: successful check-in, review submitted, RSVP confirmed,
booking confirmed, sign out, copy link.

STEP 8 — Progressive Web App setup:
Add vite-plugin-pwa to vite.config.ts.
Configure: name WorkSpot Nairobi, short_name WorkSpot, theme_color #1C1410,
background_color #F5EFE0. Icons: generate from a simple circle with WS initials.
This allows the app to be installed on phone home screens.

STEP 9 — Final checks:
Run `npm run build`. Must complete with 0 errors and 0 TypeScript errors.
Run `npm run preview`. Visit every route and click through every flow.
Check browser console: 0 errors, 0 unexpected warnings.
Check Supabase: all tables have data, RLS policies are working.

STEP 10 — Custom domain:
In Vercel dashboard → Domains → add workspot.co.ke.
Vercel will give you DNS records to add. Add them in your domain registrar.
In Supabase → Authentication → URL Configuration → add workspot.co.ke
to Site URL and Redirect URLs.

After all steps: the app is production-ready. Share the Vercel URL.
```

### Verify it worked
- [ ] `npm run build` succeeds with 0 TypeScript errors
- [ ] App loads in under 2 seconds on a phone
- [ ] Works correctly at 375px on all pages
- [ ] No console errors in production build
- [ ] Custom domain loads the app
- [ ] PWA installs on phone home screen

---

## When Things Break

**TypeScript error you don't understand:** Paste the full error into this
Claude Project chat. Include the file path and line number. Claude will fix it.

**Supabase error (401, 403, 42501):** RLS policy blocking the query.
Paste the error + the query being run. Claude will fix the policy.

**M-Pesa callback not firing:** Check Supabase Edge Function logs in
Supabase Dashboard → Edge Functions → Logs. Paste the error here.

**Build succeeds but feature broken in production:** Run `npm run build &&
npm run preview` locally first. Production bugs are usually environment
variable issues (missing VITE_ prefix) or RLS policies.

**"This is too complex, I don't know where to start":** Just open a chat in
this Project and describe what's broken. You don't need to understand the code.### Claude Code Instruction
```
Continue WorkSpot Nairobi build — Phase 3 Part B. Sessions 1–5 complete.
Build Paystack payment integration and the complete Venue Partner Portal.
We use Paystack as the payment gateway — NOT direct Safaricom Daraja.
Paystack handles all M-Pesa STK push complexity on their end.

STEP 1 — Install Paystack:
npm install @paystack/inline-js
npm install --save-dev @types/paystack__inline-js

Create src/lib/paystack.ts:
export const PAYSTACK_PUBLIC_KEY = import.meta.env.VITE_PAYSTACK_PUBLIC_KEY

STEP 2 — Initialize payment Edge Function:
Create supabase/functions/initialize-payment/index.ts

Receives POST: { amount_kes, email, booking_id, payment_type, phone_number }
payment_type: 'booking' | 'subscription_monthly' | 'subscription_annual'

1. POST to https://api.paystack.co/transaction/initialize
   Headers: { Authorization: "Bearer " + Deno.env.get("PAYSTACK_SECRET_KEY"),
              "Content-Type": "application/json" }
   Body: {
     email,
     amount: amount_kes * 100,
     currency: "KES",
     channels: ["mobile_money", "card"],
     mobile_money: { phone: phone_number, provider: "mpesa" },
     metadata: { booking_id, payment_type }
   }
2. Returns { access_code, reference } to the frontend
3. Store paystack_reference and paystack_access_code on the bookings row

Deploy: supabase functions deploy initialize-payment

STEP 3 — Paystack webhook handler Edge Function:
Create supabase/functions/paystack-webhook/index.ts

1. Verify signature: HMAC-SHA512 of raw body using PAYSTACK_SECRET_KEY
   Compare to x-paystack-signature header. Return 401 if mismatch.
2. Parse event: { event, data }
3. On event === "charge.success":
   - Find booking by paystack_reference = data.reference
   - UPDATE bookings SET status = 'confirmed'
   - If payment_type includes 'subscription':
     UPDATE profiles SET is_workpass = true,
     workpass_expires_at = NOW() + INTERVAL '1 year' (or '1 month')
4. On event === "charge.failed":
   - UPDATE bookings SET status = 'payment_failed'
5. Always return 200 OK immediately.

Deploy: supabase functions deploy paystack-webhook

Register webhook in Paystack dashboard:
Settings → API Keys & Webhooks → Webhook URL:
https://[project-ref].supabase.co/functions/v1/paystack-webhook
Events: charge.success, charge.failed, transfer.success

STEP 4 — Wire Paystack to booking flow:
In BookingPage.tsx, when user taps "Confirm Booking":
1. Call initialize-payment Edge Function → get { access_code, reference }
2. Use @paystack/inline-js to open Paystack popup:
   import PaystackPop from '@paystack/inline-js'
   const paystack = new PaystackPop()
   paystack.resumeTransaction(access_code, {
     onSuccess: (transaction) => navigate('/booking/' + bookingId + '/confirm'),
     onCancel: () => setError('Payment cancelled. Please try again.')
   })
Paystack popup handles the full M-Pesa STK push flow internally.
No polling needed — the popup closes automatically on success/failure.

STEP 5 — Wire Paystack to subscription purchase:
Same flow as bookings, payment_type = 'subscription_monthly' or 'subscription_annual'.
On popup onSuccess: poll profiles.is_workpass every 2 seconds (max 30 seconds).
When is_workpass = true: show WorkPass activated screen with user's name on card.

STEP 6 — Sandbox test credentials (Paystack Kenya M-Pesa test):
Phone number: 0708000000
PIN: any 4 digits
OTP: any 6 digits
Result: charge.success webhook fires, booking confirmed.
Check your Paystack dashboard → Transactions to verify the test appears.

STEP 7 — Venue Partner landing page (src/pages/PartnerLandingPage.tsx):
Route: /partner. Desktop-optimised. Two-column layout (50/50).

Left (use dark background colour from DESIGN_SYSTEM.md):
Subtle line pattern overlay 4% opacity.
Platform name from CONFIG.md PLATFORM_NAME as eyebrow label.
H1: "Your empty seats are money left on the table."
Italic "left on the table" in primary accent colour from DESIGN_SYSTEM.md.
Sub paragraph. 4 bullet benefits with checkmarks.

Right (light surface colour from DESIGN_SYSTEM.md):
Title "Choose your listing type". Sub text.
3-column tier comparison:
FREE: KES 0/mo. 3 perks ✓. 3 locked features ✗ greyed out.
PREMIUM: KES 3,500/mo. accent border. "Most Popular" label above. 5 perks.
FEATURED: KES 8,000/mo. dark surface bg. 6 perks.
CTA: "Get Started — Free →" primary button + "Talk to us" ghost button.

STEP 8 — Venue dashboard shell (src/pages/partner/VenueDashboard.tsx):
Route: /partner/dashboard. Protected route.
Desktop layout: 220px fixed sidebar + scrollable main content area.

Sidebar (dark surface from DESIGN_SYSTEM.md):
Platform name + "Partner Dashboard" sub label.
Venue name card with tier badge.
Nav items: 📊 Overview | ✏️ Edit Listing | 📅 Bookings (pending count badge) |
💰 Payouts | 📈 Analytics | ⚙️ Settings | 🏆 Upgrade Plan.
Active state and hover state from DESIGN_SYSTEM.md surface colours.

STEP 9 — Dashboard overview (src/pages/partner/VenueOverview.tsx):
4-column KPI strip (white cards, 1px border):
📅 Bookings this week | 💰 Revenue net (price_paid sum - 15%) |
👁 Profile views (placeholder) | 📊 Conversion rate.
Animate KPI numbers counting up on mount with Framer Motion.
Bar chart (Recharts BarChart): daily bookings Mon–Sun. 7 bars.
Colour from DESIGN_SYSTEM.md primary accent. Height 80px.
Upcoming bookings table: Guest | Date & Time | Slot | Payment | Status chips.

STEP 10 — Listing editor (src/pages/partner/VenueListingEditor.tsx):
3 form sections:
Section 1 — Basic Info: Venue Name | Neighbourhood | Type | Maps URL | Description.
Section 2 — Work Conditions: WiFi Speed | Price | Sockets | Noise. 3 toggle rows.
Section 3 — Booking Settings (accent border to highlight it is premium):
Paystack discount rate % | Max seats | Slot duration | Advance window |
Available time slots (multi-chip select: 7–10am, 8am–12pm, 12–3pm, 2–5pm, Evening).
Save: UPSERT spots + venue_settings. Success toast.

STEP 11 — Analytics (src/pages/partner/VenueAnalytics.tsx):
2×2 grid using Recharts:
1. Peak hours horizontal bar chart
2. Visitor profile bars (Freelancer 52% | Founder 24% | Remote emp 16% | Nomad 8%)
3. WorkScore trend (3-bar chart)
4. Neighbourhood ranking list (current venue highlighted)

STEP 12 — Payouts (src/pages/partner/VenuePayouts.tsx):
2×2 summary cards: Available to withdraw (highlighted) | Total earned |
This month | Commission 15%.
"Withdraw to M-Pesa via Paystack" button → confirmation modal.
This will call Paystack Transfers API in production.
Show intent + payout history table.

After all steps: test full Paystack sandbox flow. Verify webhook fires.
Deploy both Edge Functions. Run npm run build — must have 0 errors.
```

### Verify it worked
- [ ] Paystack popup opens when confirming a booking
- [ ] Test M-Pesa flow completes with phone 0708000000
- [ ] Booking status updates to 'confirmed' after test payment
- [ ] Paystack dashboard shows the test transaction under Transactions
- [ ] Partner landing page renders both columns correctly
- [ ] Venue dashboard sidebar navigation works
- [ ] Listing editor saves changes to Supabase
- [ ] Analytics charts renderd paste the session instruction below
5. Claude Code writes all the code and runs the app
6. When it says "done", verify using the checklist
7. Commit: `git add . && git commit -m "Session X complete"`
8. Push: `git push origin main`
9. Vercel auto-deploys within 2 minutes

---

## Session 1: Foundation — Project Scaffold & App Shell

**Estimated time:** 2–3 hours
**What you'll have after:** A live URL on Vercel with the app shell,
routing, navigation, and design system working. No content yet.

### Pre-session checklist
- [ ] Node.js installed (`node -v` in Terminal should show a version)
- [ ] Claude Code CLI installed (`claude --version`)
- [ ] GitHub repo created (e.g. `github.com/yourname/workspot`)
- [ ] Vercel account created and connected to GitHub repo
- [ ] Supabase project created (get URL + anon key ready)

### Claude Code Instruction
```
I am building WorkSpot Nairobi — a curated marketplace where remote workers
in Nairobi, Kenya discover and book workspace sessions at cafés, hotels,
gardens, and coworking spaces.

Set up the complete project foundation in the current directory.

TECH STACK:
- React 18 + Vite + TypeScript
- Tailwind CSS v3
- shadcn/ui (use the CLI to init)
- React Router v6
- React Query (TanStack Query v5)
- Framer Motion
- @supabase/supabase-js

STEP 0 — Verify project docs are in place:
Check that the following files exist in the project:
- CLAUDE.md (project root)
- docs/CONFIG.md
- docs/DESIGN_SYSTEM.md
- docs/WORKSPOT.md
- docs/SCHEMA.md
Read docs/CONFIG.md now to get the platform name.
Read docs/DESIGN_SYSTEM.md now before writing any CSS or Tailwind config.
These files are the source of truth — do not invent any design values.

STEP 1 — Scaffold the project:
Create a new Vite + React + TypeScript project. Install all dependencies.
Configure Tailwind with the custom theme from docs/DESIGN_SYSTEM.md.

STEP 2 — Tailwind config (tailwind.config.ts):
Read docs/DESIGN_SYSTEM.md for the complete mapping. Use the token
architecture defined there: Tailwind colours, fonts, radii, and shadows
all map to CSS variables, NOT hardcoded values.

Use this structure (values come from docs/DESIGN_SYSTEM.md tokens):
colors: {
  primary: 'var(--color-primary)',
  secondary: 'var(--color-secondary)',
  success: 'var(--color-success)',
  info: 'var(--color-info)',
  bg: 'var(--color-bg)',
  surface: 'var(--color-surface)',
  'surface-alt': 'var(--color-surface-alt)',
  'surface-tint': 'var(--color-surface-tint)',
  sand: 'var(--color-surface-sand)',
  dark: 'var(--color-dark)',
  'dark-alt': 'var(--color-dark-alt)',
  text: 'var(--color-text)',
  muted: 'var(--color-text-muted)',
  light: 'var(--color-text-light)',
  inverse: 'var(--color-text-inverse)',
}
fontFamily: {
  display: ['var(--font-display)'],
  sans: ['var(--font-body)'],
  mono: ['var(--font-mono)'],
}
borderRadius: {
  sm: 'var(--radius-sm)',
  md: 'var(--radius-md)',
  lg: 'var(--radius-lg)',
  xl: 'var(--radius-xl)',
  pill: 'var(--radius-pill)',
}
boxShadow: {
  sm: 'var(--shadow-sm)',
  md: 'var(--shadow-md)',
  lg: 'var(--shadow-lg)',
  xl: 'var(--shadow-xl)',
}

STEP 3 — Design tokens file (src/styles/tokens.css):
Create this file from docs/DESIGN_SYSTEM.md. It should contain:
1. The Google Fonts @import (Playfair Display, DM Sans, DM Mono)
2. All CSS Custom Properties on :root exactly as defined in the
   Token Architecture section of docs/DESIGN_SYSTEM.md
3. The dark mode block [data-theme="dark"] from DESIGN_SYSTEM.md

Then create src/styles/globals.css:
- @import './tokens.css'
- body { font-family: var(--font-body); background: var(--color-bg); color: var(--color-text); }
- * { box-sizing: border-box; margin: 0; padding: 0; }

Import globals.css in src/main.tsx.

This file is the ONLY place hex values exist in the project.
Components always use Tailwind classes, never raw hex values.

STEP 4 — Supabase client (src/lib/supabase.ts):
Create a Supabase client using VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY
from environment variables.

STEP 5 — TypeScript types (src/types/index.ts):
Create the Spot interface, SpaceFamily type, ScoreLabel type as defined in
the project brief. Also create Profile, Checkin, Review, Event, RSVP, Booking types.

STEP 6 — App shell (src/App.tsx):
Set up React Router v6 with these routes:
/ → ExplorePage (placeholder)
/spot/:id → SpotDetailPage (placeholder)
/community → CommunityPage (placeholder)
/events → EventsPage (placeholder)
/profile → ProfilePage (placeholder)
/auth → AuthPage (placeholder)
/partner → PartnerPage (placeholder)
/partner/dashboard → VenueDashboard (placeholder)
/onboarding → OnboardingPage (placeholder)

Create placeholder page components that show the page name centred.

STEP 7 — Top navigation (src/components/layout/TopNav.tsx):
Fixed top bar, 64px height. Background: cream with backdrop-blur.
Border-bottom: 1px solid rgba(28,20,16,0.1). Sticky.
Left: "WorkSpot" in Playfair Display bold + italic "Nairobi" in
text-muted after it. Right: green pulsing dot + "47 verified spots"
in DM Mono, then "List a Space" button in earth background cream text.
Show avatar initials (gradient) when logged in — read from React Query.

STEP 8 — Bottom tab bar (src/components/layout/BottomTabs.tsx):
Mobile only (hidden above md breakpoint). Fixed bottom. 68px height.
White background. 5 tabs: 🏠 Explore · 📍 Check In · 👥 Community ·
🎉 Events · 👤 Profile. Active tab: terracotta colour. Use NavLink.

STEP 9 — Page wrapper (src/components/layout/PageWrapper.tsx):
Adds consistent padding (16px mobile, 40px tablet, 60px desktop),
max-width 1440px centered, padding-top 64px (nav height),
padding-bottom 68px on mobile (tab bar height).

STEP 10 — Wire everything together in main.tsx:
Wrap in QueryClientProvider, BrowserRouter. All pages use PageWrapper.

STEP 11 — Environment variables:
Create .env.local with VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY
(use placeholder values for now, I'll fill them in).
Create .env.example with the same keys but empty values.
Add .env.local to .gitignore.

After all steps: run `npm run dev` and confirm the app loads at
localhost:5173 with nav visible and routing working. Fix any
TypeScript errors before marking complete.
```

### Verify it worked
- [ ] `npm run dev` starts with no errors in Terminal
- [ ] Browser shows the app at localhost:5173
- [ ] Navigation visible at top on desktop
- [ ] Tab bar visible at bottom on mobile
- [ ] Clicking tabs changes the URL

### After session
```bash
git add .
git commit -m "Session 1: Foundation complete"
git push origin main
```
Then add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to Vercel Environment Variables.

---

## Session 2: Phase 1 — Complete Directory UI

**Estimated time:** 3–4 hours
**What you'll have after:** The full Phase 1 product visible and working in the browser
with all mock data. All components, the hero, filter bar, spot grid, and detail page.

### Pre-session checklist
- [ ] Session 1 complete and deployed to Vercel
- [ ] `npm run dev` starts clean

### Claude Code Instruction
```
I am continuing to build WorkSpot Nairobi. Session 1 (foundation) is complete.
Now build the complete Phase 1 directory UI with mock data.

The design system is established. Colours are available as Tailwind classes
(bg-earth, text-terracotta, etc.) and CSS variables (--earth, --amber, etc.).
Fonts: font-display (Playfair Display), font-sans (DM Sans), font-mono (DM Mono).

STEP 1 — Mock data file (src/data/spots.ts):
Create the SPOTS array with all 12 spots from the project brief. Export it.
Export helper functions: getSpotById(id), getSpotsByNeighbourhood(hood),
getSpotsByType(type), getFeaturedSpots() (returns top 2 by workScore).

STEP 2 — QualityScoreBadge (src/components/ui/QualityScoreBadge.tsx):
Props: score (number), label (string, default 'WorkScore'), size ('sm'|'md'|'lg').
sm=38px, md=48px, lg=56px. Amber background, earth text, Playfair Display font-weight-900.
Rounded-full. Shows score (1 decimal) with label below in DM Mono 7px.

STEP 3 — WifiBars (src/components/ui/WifiBars.tsx):
Props: mbps (number). 4 vertical bars increasing in height (5,8,11,14px).
4px wide each. Active: leaf colour. Inactive: border-strong.
Active count: mbps < 25 → 1, 25-49 → 2, 50-79 → 3, 80+ → 4.

STEP 4 — NoiseDots (src/components/ui/NoiseDots.tsx):
Props: level (1|2|3). 3 circles 7px each. Active: terracotta. Inactive: border.
Tooltip on hover: 1=Quiet, 2=Moderate, 3=Loud.

STEP 5 — MetricRow (src/components/ui/MetricRow.tsx):
Props: spot (Spot). Shows 3 metrics side by side in DM Mono.
For remote_work: WifiBars + mbps value | NoiseDots + noise label | price.

STEP 6 — VibeTags (src/components/ui/VibeTags.tsx):
Props: tags (string[]), max (number, default 3). Pill-shaped tags in mist bg,
text-muted. Truncate to max. Uses DM Sans 11px.

STEP 7 — SpotCard (src/components/spots/SpotCard.tsx):
Grid card for the spot directory. Width ~300px.
Top: 180px image area using coverGradient as CSS background.
QualityScoreBadge (md) top-right of image. If isNew: "🆕 New" badge top-left.
Body (white bg, 18px padding): spot name in font-display 17px bold, neighbourhood +
type in font-mono 11px text-light, MetricRow, VibeTags (max 3).
Hover: translateY(-3px) transition with shadow increase via Framer Motion.
Clicking the card navigates to /spot/:id.

STEP 8 — SpotCardFeatured (src/components/spots/SpotCardFeatured.tsx):
Hero card, 440px tall. Full-bleed coverGradient background.
Dark gradient overlay (linear, bottom to top).
QualityScoreBadge (lg) top-right. Category + vibe badges top-left.
Content anchored bottom-left: name in font-display 26px bold cream,
neighbourhood in font-mono 11px cream/50, MetricRow with cream text.
Hover: subtle scale(1.01) via Framer Motion.

STEP 9 — Filter bar (src/components/explore/FilterBar.tsx):
Sticky at top: 64px (below nav). Background cream. Border-bottom 1px border.
Height 56px. Horizontal scroll on mobile (no scrollbar visible).
Groups separated by vertical 1px border dividers.
Groups: Type (All/Café/Coworking/Hotel/Garden) | WiFi (Fast 50+/Decent 20+) |
Vibe (Quiet/Buzzy/Outdoor) | Price (Free entry/Day pass).
Chip component: default (outlined), hover (terracotta border/text),
active (earth bg cream text). Type = single select. Others = multi-select.
Props: onFilterChange callback.

STEP 10 — useSpotFilters hook (src/hooks/useSpotFilters.ts):
Manages filter state (activeType, wifiFilter, vibeFilter, priceFilter, searchQuery).
Returns filteredSpots, filterState, setFilter functions.
Filter logic: AND combination. Type = exact match. WiFi = min threshold.
Vibe: quiet = noiseLevel===1, buzzy = noiseLevel>=2, outdoor = vibeTags includes 'Outdoor'.
Price: free = priceType==='free', paid = priceType==='paid'.
Search: name or neighbourhood includes query (case insensitive).

STEP 11 — Explore page (src/pages/ExplorePage.tsx):
Full page. Sections top to bottom:

Section A — Hero (100vh dark section):
Earth background with radial gradient overlays (terracotta top-right,
leaf bottom-left). Subtle grid pattern overlay 3% opacity.
Content bottom-anchored (absolute bottom-20 left-10):
- "Nairobi's Remote Work Directory" label: DM Mono 10px amber uppercase
  with 28px rule before it. Animate in with Framer Motion.
- H1: "Find your spot. Do your best work." in Playfair Display
  clamp(52px, 8vw, 100px) font-weight-900 cream. "spot." italic amber.
  Animate in with stagger delay.
- Sub: 16px cream/65. Animate in.
- Stats row: 4 items — "47 Verified Spots" | "12 Neighbourhoods" |
  "830+ Reviews" | "Free Always". Number: Playfair 32px cream. Label: DM Mono cream/35.

Section B — Editor's Picks:
Section heading: "Editor's Picks" Playfair 28px bold + italic subtitle.
Grid: SpotCardFeatured (left, 1.6fr) + SpotCardFeatured (right, 1fr).
Use first 2 spots from getFeaturedSpots().

Section C — All Spots:
Section heading row: "All Spots" left + search input + count right.
Below FilterBar. Below: 3-col SpotCard grid (2 on tablet, 1 on mobile).
Show filtered count in DM Mono. All 12 spots rendered.
"No spots found" empty state when filters return 0.

STEP 12 — Spot detail page (src/pages/SpotDetailPage.tsx):
Route /spot/:id. Reads spot from SPOTS data using useParams.

Hero: 260px image area with coverGradient. Dark overlay. Back arrow top-left
(navigate(-1)). QualityScoreBadge (lg) top-right. Name Playfair 30px bold cream,
neighbourhood + type DM Mono bottom.

Body:
1. Description: left-bordered amber callout box (3px amber left border,
   amber-pale bg, 14px text, 1.75 line-height).
2. Metrics grid (3 cols): 6 cards. Each: label (DM Mono 10px text-light),
   value (Playfair 18px bold), sub (11px text-muted). Cards:
   WiFi Speed | Power Sockets | Noise Level | Price to Work | Best Day | Community Score.
   Derive values from spot data.
3. Vibe tags: all vibeTags as coloured pills.
   Tags with 🌿 → leaf bg/text. Tags with ☕/🏆 → amber bg/text.
   Tags with 📹/🌍 → sky bg/text. Tags with 🌅/⚡ → terracotta bg/text.
4. Best time section: label + time slot pills. Green pill (leaf bg) for
   slots ending in ✓. Red-ish for slots ending in ✗. Default for others.
5. Fixed bottom bar (mobile): two buttons — "🗺 Get Directions" (earth bg)
   + "✍️ Rate This Spot" (terracotta bg). On desktop: inline at bottom.

After all steps: run `npm run dev`. Click through the explore page, filter
chips, and spot detail. Fix any TypeScript or Tailwind errors.
Run `npm run build` and confirm it builds with no errors.
```

### Verify it worked
- [ ] Hero section looks dramatic and loads with animation
- [ ] Filter chips filter spots in real time
- [ ] Search input filters spots by name
- [ ] Clicking a spot card goes to its detail page
- [ ] Detail page shows all metrics correctly
- [ ] `npm run build` succeeds with no errors
- [ ] Mobile layout looks correct (single column, bottom tabs visible)

---

## Session 3: Phase 2 Part A — Supabase + Auth

**Estimated time:** 2–3 hours
**What you'll have after:** Real Supabase backend, all 12 spots as real database rows,
working sign up / login flow, and mock data replaced with live queries.

### Pre-session checklist
- [ ] Session 2 complete
- [ ] Supabase project exists (you have URL + anon key)
- [ ] Run all SQL from SCHEMA.md in Supabase SQL Editor (do this before session)
- [ ] Run the review_schemas seed data from SCHEMA.md
- [ ] VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are in .env.local and Vercel

### Claude Code Instruction
```
WorkSpot Phase 2 begins. Connect Supabase and build the full auth flow.
Sessions 1 and 2 are complete — the UI works with mock data from src/data/spots.ts.

STEP 1 — Seed the spots table:
Write a seed script (src/scripts/seedSpots.ts) that takes the SPOTS array
from src/data/spots.ts and inserts all 12 rows into the Supabase spots table.
The spots table has: id, name, neighbourhood, type, space_family, score_label,
description, cover_gradient, type_attributes (JSONB), vibe_tags (text[]),
best_times (text[]), work_score, review_count, price_entry, price_type.
Set space_family='remote_work' and score_label='WorkScore' on all rows.
Store WiFi/noise/sockets values inside type_attributes JSONB.
Run the seed with: npx ts-node --esm src/scripts/seedSpots.ts

STEP 2 — Replace mock data with Supabase queries:
Create src/hooks/useSpots.ts using React Query:
- useSpots() — fetches all spots from Supabase, maps to Spot type
- useSpot(id) — fetches single spot by id
- useFeaturedSpots() — fetches top 2 by work_score DESC
Replace all references to the SPOTS array in ExplorePage and SpotDetailPage
with these hooks. Add loading skeletons (grey animated placeholder divs)
while data loads. Add error states.

STEP 3 — Auth context (src/contexts/AuthContext.tsx):
Create AuthContext with: user, profile, loading, signIn, signUp, signOut.
Use supabase.auth.onAuthStateChange for session management.
When user signs in, fetch their profile row from the profiles table.
Wrap the entire app in AuthProvider in main.tsx.

STEP 4 — Protected route (src/components/auth/ProtectedRoute.tsx):
Wrapper that redirects to /auth if no session. Use for /profile, /partner
routes. Accept children prop.

STEP 5 — Auth page (src/pages/AuthPage.tsx):
Route: /auth. Two tabs: Sign Up | Log In.

Design:
Top 200px: dark hero. Earth background + radial terracotta gradient.
WorkSpot logo centred (Playfair Display bold, italic "Nairobi" below).
Body: white card below with tabs + forms.

Sign Up tab:
Fields: First Name, Last Name, Email, Password.
Validation: email format, password min 8 chars.
On submit: supabase.auth.signUp() → on success navigate to /onboarding.
Show field errors inline in terracotta text.

Log In tab:
Fields: Email, Password. "Forgot password?" link (supabase.auth.resetPasswordForEmail).
On submit: supabase.auth.signInWithPassword() → on success navigate to /.

Both tabs: "Continue with Google" button (supabase.auth.signInWithOAuth provider google).
"or" divider between form and Google button.

STEP 6 — Soft gate (modal bottom sheet):
In ExplorePage, track how many spot detail pages the user has visited
(localStorage counter, increment on each /spot/:id visit).
After 3 visits without auth, show a bottom sheet sliding up:
"Join the community" title, benefit text, "Create account" CTA (earth bg),
"Log in" link, "Continue browsing as guest" dismiss link.
Store dismissal in localStorage. Only show once per browser session.

STEP 7 — Nav state (update TopNav.tsx):
When logged in: show user avatar (initials in gradient circle) instead of
"List a Space" button. Clicking avatar opens a dropdown:
Profile (navigate /profile) | My Bookings | Sign Out.
Use useAuth() hook to read user state.

After all steps: run `npm run dev`. Test sign up (creates a real user in
Supabase), log in, and confirm spots load from the database (check Supabase
Table Editor to see the rows). Fix all errors.
```

### Verify it worked
- [ ] Spots load from Supabase (check Network tab — should see Supabase requests)
- [ ] Sign up creates a real user in Supabase Auth
- [ ] Signing up redirects to /onboarding
- [ ] Log in works and shows avatar in nav
- [ ] Sign out returns to logged-out state
- [ ] Soft gate appears after viewing 3 spots

---

## Session 4: Phase 2 Part B — Community Features

**Estimated time:** 3–4 hours
**What you'll have after:** Complete community layer — onboarding, check-ins,
reviews, community feed, events, user profile, and streak mechanics.

### Pre-session checklist
- [ ] Session 3 complete
- [ ] Auth is working (you can sign up and log in)
- [ ] Supabase tables: checkins, reviews, review_schemas, events, rsvps, profiles all exist

### Claude Code Instruction
```
Continue building WorkSpot Nairobi. Phase 2 Part B: all community features.
Auth is working. Supabase is connected.

STEP 1 — Onboarding wizard (src/pages/OnboardingPage.tsx):
3-step wizard at /onboarding. Only show after first sign-up.
Check localStorage for 'workspot_onboarding_complete' to skip if already done.

Step 1 — Role selection:
Title "What's your work setup?" Desc text. 4 role cards (tap to select, one at a time):
💻 Freelancer/Consultant | 🏠 Remote Employee | 🚀 Founder/Entrepreneur | ✈️ Digital Nomad
Selected card: terracotta border, light terracotta bg, checkmark visible.
"Next →" and "Skip for now" link.

Step 2 — Interests:
Title "What matters to you?" 12 multi-select chips:
🤫 Quiet focus | ⚡ Fast WiFi | ☕ Great coffee | 🌿 Outdoor setting | 📞 Video call friendly
🤝 Networking | 💳 Budget-friendly | 🏨 Professional setting | 🌍 Expat-friendly
🔌 Always has power | 🌅 Morning hours | 🌆 Late night work
Selected: earth bg, cream text. Unselected: outline. Multi-select allowed.

Step 3 — Neighbourhoods:
Title "Where do you mostly work from?" 7 multi-select rows:
🏙 Westlands (7 spots) | 🌳 Kilimani (5 spots) | 🏡 Karen (4 spots) |
🌿 Lavington (3 spots) | 🌍 Gigiri/Runda (4 spots) | 🏗 Upperhill (3 spots) | 🌆 CBD (2 spots)
Selected: leaf-pale bg, leaf border, checkmark. Final button: "🎉 Finish Setup →" leaf bg.

On complete: UPDATE profiles SET role, interests, neighbourhoods via Supabase.
Set localStorage 'workspot_onboarding_complete' = 'true'. Navigate to /.

STEP 2 — Check-in bar (add to ExplorePage when logged in):
Below filter bar. Dark earth card. Left: green pulsing dot + "Where are you working from?".
Right: → arrow. Tapping opens check-in bottom sheet (Framer Motion slide up).

STEP 3 — Check-in bottom sheet (src/components/checkin/CheckInSheet.tsx):
Search input: "Search spots or neighbourhoods..."
"Spots near you" list: 5 spots from useSpots(), ordered by workScore DESC.
Each row: gradient thumbnail (40×40) | name + neighbourhood + live count | workScore badge.
Live count: query checkins WHERE spot_id = X AND checked_out_at IS NULL, use realtime.
Tap a spot → show check-in confirmation.

STEP 4 — Check-in confirmation (src/components/checkin/CheckInConfirm.tsx):
Spot header (gradient, dark overlay). 2×2 grid of live conditions:
People here (count) | Noise (from last review) | WiFi now (from last review) | Best until (from bestTimes).
"📍 Check In Here" button (leaf). "← Different spot" ghost button.
On confirm: INSERT into checkins (user_id, spot_id, checked_in_at).
Update user streak in profiles.

STEP 5 — Active check-in state (src/components/checkin/ActiveCheckIn.tsx):
When user has an open checkin (checked_out_at IS NULL), show this card instead of the bar.
Shows: "● CHECKED IN" badge, spot name, session timer (useInterval count-up), streak counter.
"Also working here" avatar stack (query other open checkins at same spot).
Quick actions: "Still quiet 🔇" | "Test WiFi 📡" | "Leave review ✍️"
"Leave ×" link: UPDATE checkins SET checked_out_at = NOW(). 
If session >= 30 minutes: prompt to leave a review.

STEP 6 — Streak logic (src/hooks/useStreak.ts):
On every check-in, calculate streak:
- If last_checkin_date = yesterday: increment check_in_streak
- If last_checkin_date = today: no change (already checked in today)
- Otherwise: reset to 1
- Update longest_streak if current > longest
UPDATE profiles SET check_in_streak, longest_streak, last_checkin_date.

STEP 7 — Review flow (src/components/review/ReviewFlow.tsx):
3-step flow. Load review schema: SELECT from review_schemas WHERE space_type = spot.type.

Step 1 — Star ratings: For each category in schema.categories, show:
icon + category label + 5 star tap targets (22px). Active: amber fill. Inactive: border.
Score 1-5 shown right. "Next: WiFi Test →" (active only when all rated).

Step 2 — Primary metric + comment:
Label: schema.primary_metric_label. Number input for metric value.
Show average: "Average here: XX from N tests" (query AVG from reviews).
After entry: green result card "XX Mbps · ✓ Saved".
Comment textarea: "Your note" (120px), char count. "Next: Quick Tags →".

Step 3 — Quick tags + submit:
Two groups from schema.quick_tags: Conditions + Vibe. Multi-select chips.
Submit block (dark earth card): "🌟 Your WorkScore contribution" + "Submit Review ✓" amber button.

On submit:
1. Calculate overall_score from ratings + weights
2. INSERT into reviews
3. Call update_spot_work_score(spot.id) via Supabase RPC
4. Increment profile.workscore_contributions
5. Success toast. Navigate to spot detail.

STEP 8 — Community page (src/pages/CommunityPage.tsx):
Route /community. Three tabs: Activity | Tips | People.

Community hero card: dark green gradient. "WorkSpot Community" label amber.
Title "Nairobi Remote Workers". Sub "847 members · Growing every week".
Avatar stack (4 letters). "Join →" button amber (external link placeholder).

Activity tab: Query JOIN of checkins + reviews ordered by created_at DESC limit 20.
Each feed item: avatar (initials, colour based on user_id hash) + name + time ago +
action text + spot name badge. Reactions row (👍/💬 — localStorage count for now).
"📍 Going too" button adds user to checkins.

Tips tab: Reviews with comment IS NOT NULL, ordered by created_at DESC, limit 10.
Each: coloured left border card. User avatar + name + spot badge. Comment excerpt.
Upvote count (localStorage). Tag: derived from quick_tags (WIFI TIP / FOOD TIP etc.).

People tab: profiles WHERE last_checkin_date > NOW() - 30 days.
Grid. Each: avatar + display_name + role chip + check_in_streak.

STEP 9 — Events page (src/pages/EventsPage.tsx):
Route /events.

Events list: Query events table. Upcoming (event_date >= today) + past events.
Featured event card: dark blue-to-terracotta gradient. Event title Playfair bold.
Date/time/free badges. Attendee avatar stack + count (query rsvps).
"RSVP — It's Free" button amber.

Event detail page (/events/:id):
Spot card for host venue. Description. Attendee stack (realtime subscription to rsvps).
RSVP button: INSERT rsvps on click → button turns green "✅ You're going!"
Confirmed screen: green hero + 🎉 + "You're in!" + Add to Calendar button
(Google Calendar link format: https://calendar.google.com/calendar/render?action=TEMPLATE&text=...)

STEP 10 — User profile page (src/pages/ProfilePage.tsx):
Route /profile. Protected (redirect to /auth if not logged in).

Header: dark earth bg. Avatar (initials circle, gradient). display_name + @handle +
role chip + interest chips.
Stats row (3 cols): Check-ins count | Reviews count | Spots visited (DISTINCT spot_id).
All data from profiles + aggregate queries.

Streak card: dark earth gradient. 🔥 icon. check_in_streak large in amber Playfair.
"Last checked in: X ago at [spot name]".

Streak milestone sheet: When streak hits 7, 14, 30, or 60 days, show a celebration
modal on the profile page. Check with localStorage to not re-show.
Progress bar from current milestone → next. Rewards preview.

Badges: 6-wide grid. Earned: full colour. Locked: grayscale opacity 30%.
Badges: 🌿 Garden Lover (5+ garden checkins) | ⚡ WiFi Tester (5+ wifi tests)
| 🔥 7 Day Streak | 🔥 14 Day Streak | 🎉 Workcation Pro (1 event attended)
| 🗺 All Hoods | 🏆 Top Reviewer (10+ reviews)
Query the relevant tables to determine which are earned.

Recent spots: Last 5 DISTINCT spots checked into. Gradient thumbnail + name +
last visit time + total visits + workScore badge.

After all steps: run the app and test the full journey: sign up → onboard →
check in → review → view community feed → RSVP to event → check profile.
Fix all TypeScript errors. Run `npm run build` to confirm clean build.
```

### Verify it worked
- [ ] Onboarding 3 steps work and save to Supabase
- [ ] Check-in creates a real row in Supabase checkins table
- [ ] Active check-in card shows with session timer
- [ ] Checkout + review flow saves a real review and recalculates WorkScore
- [ ] Community feed shows real check-ins from database
- [ ] Profile shows real stats for logged-in user
- [ ] Badge logic correctly shows earned/locked state

---

## Session 5: Phase 3 Part A — WorkPass & Booking

**Estimated time:** 3–4 hours
**What you'll have after:** WorkPass subscription flow, slot booking, booking
confirmation with digital ticket, and My Bookings management page.

### Pre-session checklist
- [ ] Sessions 1–4 complete
- [ ] bookings, venue_settings tables exist in Supabase

### Claude Code Instruction
```
Continue WorkSpot Nairobi build — Phase 3 monetisation. Sessions 1–4 are complete.
Build the WorkPass subscription flow and slot booking system.

STEP 1 — WorkPass hook (src/hooks/useWorkPass.ts):
useIsWorkPassMember() → reads is_workpass + workpass_expires_at from profile.
Returns: { isActive, expiresAt, daysLeft }
Check expiry: if workpass_expires_at < NOW() set is_workpass=false in profiles.

STEP 2 — WorkPass card component (src/components/workpass/WorkPassCard.tsx):
A physical credit card design. Props: profile (Profile), variant ('full'|'mini').
Dark gradient (#1A1408 to #3D2A0A). Gold EMV chip visual (30×22px, gold gradient,
rounded). "WorkSpot Member" tier label DM Mono gold/70. "WorkPass" in Playfair Display
bold 22px cream. "Nairobi · Active" tagline. Watermark "WorkPass" 12% opacity top-right.
Stats row: 47 Spots | ∞ Sessions | -30% Off. Border: 1px gold/20.

STEP 3 — WorkPass upgrade flow (src/pages/WorkPassPage.tsx):
Route: /workpass. Triggered when free user taps "Book a slot".

Screen 1 — Pitch:
Dark #1A1408 background. Radial gold gradient top-right.
"WorkSpot Pass" DM Mono gold kicker. H1 "One pass. Every spot." Playfair 28px cream.
Sub text. WorkPassCard component (full variant, showing generic preview).
2×2 perks grid: 📅 Book ahead | 💸 30% off | ⭐ Priority seats | 🏆 Member badge.
"See plans & pricing →" amber CTA button.

Screen 2 — Plan selector:
Two plan cards side by side.
Monthly: "KES 1,200/mo" — Cancel anytime. 3 features.
Annual: "KES 900/mo" (billed KES 10,800). "Best value" label above. Saves "KES 3,600/yr".
4 features (highlighted). amber border. Annual card visually prominent.
Corporate WorkPass info callout (leaf tint). "Talk to us" ghost button.
Primary CTA: "Start Annual Plan → KES 10,800".
Secondary: "Monthly instead" ghost button.
Store selected plan in state.

Screen 3 — M-Pesa payment:
Order summary dark earth card: Plan | Billed today | Total in amber.
M-Pesa input: pre-fill phone number from profile if available.
Phone number input in format +254 XXX XXX XXX. Input uses Kenyan number format.
"Send M-Pesa Request" leaf button. This will call the Edge Function (built in Session 6).
For now: show a "Payment processing coming in Session 6" message and set
is_workpass=true + workpass_expires_at=30 days from now as a test shortcut.

STEP 4 — WorkPass member UI changes:
In ExplorePage: when isWorkPassMember=true, add "Book a slot" button to each SpotCard
and SpotCardFeatured (leaf bg, white text, below the spot name).
WorkPass status banner in cream page: "🏆 As a WorkPass member you get 30% off all bookings."
In TopNav: show "🏆 WorkPass" golden badge next to avatar.

STEP 5 — Slot booking flow (src/pages/BookingPage.tsx):
Route: /book/:spotId
Gate: if not WorkPass member, redirect to /workpass.

Step 1 — Date + slot picker:
Spot header (gradient, 150px). Booking spot name + meta.
Date strip: scrollable 7-day picker. Selected date: terracotta border.
Time slots list for selected date (4 slots): each slot shows time range | availability
bar (4px colour-coded: green/amber/red based on occupancy) | price with 30% struck
through + discounted price in terracotta + "Pass -30%" below | selection circle.
Fetch real occupancy: query bookings WHERE spot_id AND slot_date AND status=confirmed,
count against venue_settings.max_seats_per_slot (default 30).
Standard prices: Morning KES 700, Midday KES 600, Afternoon KES 500.
WorkPass price = standard × 0.7. Show both.
"Review Booking →" active only when slot selected.

Step 2 — Review + payment method:
Condensed spot header (100px). Booking summary dark earth card:
Slot | Standard rate | WorkPass discount (−KES X, leaf colour) | Total in amber.
Payment selector: "🏆 Pay with Pass" (green, selected) | "📱 M-Pesa" (white outlined).
10-minute reservation warning. "Confirm Booking · KES XXX" leaf button.
On confirm: INSERT into bookings (status='confirmed' for WorkPass, 'pending' for M-Pesa).

STEP 6 — Booking confirmation (src/pages/BookingConfirmPage.tsx):
Route: /booking/:bookingId/confirm
Green hero: ✅ large + "You're booked!" Playfair bold + spot + slot text.
Ticket component (white card, dashed divider mimicking physical ticket):
Top: spot thumbnail + name + neighbourhood.
Dashed divider (border-dashed border-t-2).
Bottom grid 2×2: Date | Time | Duration | Paid (leaf colour with ✓).
Barcode area (dark earth): visual barcode (repeating divs different widths) +
booking_code in DM Mono cream.
Action buttons: "📅 Add to Calendar" + "📤 Share".

STEP 7 — My Bookings (src/pages/MyBookingsPage.tsx):
Route: /bookings (add to router, link from profile dropdown "My Bookings").
Total savings banner: dark earth card, 🏆 icon, "Total WorkPass savings" label,
KES amount in amber Playfair.
Tab strip: Upcoming | Past.
Upcoming: cards with amber top stripe. Spot thumbnail + name + date/time + status badge.
Grid shows paid amount + amount saved. Cancel link (UPDATE status='cancelled',
show only if > 24 hours before slot).
Past: compact rows with done/cancelled status badges.

After all steps: test the full booking flow — tap Book on a spot → select slot →
confirm → see ticket. Check the bookings table in Supabase has real rows.
```

### Verify it worked
- [ ] WorkPass upgrade flow reaches the payment screen
- [ ] Slot booking page shows date strip and time slots
- [ ] Booking confirmation shows the digital ticket with booking code
- [ ] My Bookings page shows the booking

---

## Session 6: Phase 3 Part B — Paystack Payments + Venue Portal

**Estimated time:** 3–4 hours
**What you'll have after:** Real Paystack payments working in sandbox (M-Pesa + cards),
and the complete Venue Partner Portal (landing page, listing editor, dashboard, analytics, payouts).

### Pre-session checklist
- [ ] Sessions 1–5 complete
- [ ] Paystack account created at paystack.com (free, immediate sandbox key access)
- [ ] Test keys ready: pk_test_... (public) and sk_test_... (secret)
- [ ] Add VITE_PAYSTACK_PUBLIC_KEY to .env.local and Vercel environment variables
- [ ] Add PAYSTACK_SECRET_KEY to Supabase secrets (Dashboard → Settings → Secrets)

### Claude Code Instruction
```
Continue WorkSpot Nairobi build — Phase 3 Part B. Sessions 1–5 complete.
Build Paystack payment integration and the complete Venue Partner Portal.
We use Paystack as the payment gateway — NOT direct Safaricom Daraja.
Paystack handles all M-Pesa STK push complexity on their end.

STEP 1 — Install Paystack:
npm install @paystack/inline-js
npm install --save-dev @types/paystack__inline-js

Create src/lib/paystack.ts:
export const PAYSTACK_PUBLIC_KEY = import.meta.env.VITE_PAYSTACK_PUBLIC_KEY

STEP 2 — Initialize payment Edge Function:
Create supabase/functions/initialize-payment/index.ts

Receives POST: { amount_kes, email, booking_id, payment_type, phone_number }
payment_type: 'booking' | 'subscription_monthly' | 'subscription_annual'

1. POST to https://api.paystack.co/transaction/initialize
   Headers: { Authorization: "Bearer " + Deno.env.get("PAYSTACK_SECRET_KEY"),
              "Content-Type": "application/json" }
   Body: {
     email,
     amount: amount_kes * 100,
     currency: "KES",
     channels: ["mobile_money", "card"],
     mobile_money: { phone: phone_number, provider: "mpesa" },
     metadata: { booking_id, payment_type }
   }
2. Returns { access_code, reference } to the frontend
3. Store paystack_reference and paystack_access_code on the bookings row

Deploy: supabase functions deploy initialize-payment

STEP 3 — Paystack webhook handler Edge Function:
Create supabase/functions/paystack-webhook/index.ts

1. Verify signature: HMAC-SHA512 of raw body using PAYSTACK_SECRET_KEY
   Compare to x-paystack-signature header. Return 401 if mismatch.
2. Parse event: { event, data }
3. On event === "charge.success":
   - Find booking by paystack_reference = data.reference
   - UPDATE bookings SET status = 'confirmed'
   - If payment_type includes 'subscription':
     UPDATE profiles SET is_workpass = true,
     workpass_expires_at = NOW() + INTERVAL '1 year' (or '1 month')
4. On event === "charge.failed":
   - UPDATE bookings SET status = 'payment_failed'
5. Always return 200 OK immediately.

Deploy: supabase functions deploy paystack-webhook

Register webhook in Paystack dashboard:
Settings → API Keys & Webhooks → Webhook URL:
https://[project-ref].supabase.co/functions/v1/paystack-webhook
Events: charge.success, charge.failed, transfer.success

STEP 4 — Wire Paystack to booking flow:
In BookingPage.tsx, when user taps "Confirm Booking":
1. Call initialize-payment Edge Function → get { access_code, reference }
2. Use @paystack/inline-js to open Paystack popup:
   import PaystackPop from '@paystack/inline-js'
   const paystack = new PaystackPop()
   paystack.resumeTransaction(access_code, {
     onSuccess: (transaction) => navigate('/booking/' + bookingId + '/confirm'),
     onCancel: () => setError('Payment cancelled. Please try again.')
   })
Paystack popup handles the full M-Pesa STK push flow internally.
No polling needed — the popup closes automatically on success/failure.

STEP 5 — Wire Paystack to subscription purchase:
Same flow as bookings, payment_type = 'subscription_monthly' or 'subscription_annual'.
On popup onSuccess: poll profiles.is_workpass every 2 seconds (max 30 seconds).
When is_workpass = true: show WorkPass activated screen with user's name on card.

STEP 6 — Sandbox test credentials (Paystack Kenya M-Pesa test):
Phone number: 0708000000
PIN: any 4 digits
OTP: any 6 digits
Result: charge.success webhook fires, booking confirmed.
Check your Paystack dashboard → Transactions to verify the test appears.

STEP 7 — Venue Partner landing page (src/pages/PartnerLandingPage.tsx):
Route: /partner. Desktop-optimised. Two-column layout (50/50).

Left (use dark background colour from DESIGN_SYSTEM.md):
Subtle line pattern overlay 4% opacity.
Platform name from CONFIG.md PLATFORM_NAME as eyebrow label.
H1: "Your empty seats are money left on the table."
Italic "left on the table" in primary accent colour from DESIGN_SYSTEM.md.
Sub paragraph. 4 bullet benefits with checkmarks.

Right (light surface colour from DESIGN_SYSTEM.md):
Title "Choose your listing type". Sub text.
3-column tier comparison:
FREE: KES 0/mo. 3 perks ✓. 3 locked features ✗ greyed out.
PREMIUM: KES 3,500/mo. accent border. "Most Popular" label above. 5 perks.
FEATURED: KES 8,000/mo. dark surface bg. 6 perks.
CTA: "Get Started — Free →" primary button + "Talk to us" ghost button.

STEP 8 — Venue dashboard shell (src/pages/partner/VenueDashboard.tsx):
Route: /partner/dashboard. Protected route.
Desktop layout: 220px fixed sidebar + scrollable main content area.

Sidebar (dark surface from DESIGN_SYSTEM.md):
Platform name + "Partner Dashboard" sub label.
Venue name card with tier badge.
Nav items: 📊 Overview | ✏️ Edit Listing | 📅 Bookings (pending count badge) |
💰 Payouts | 📈 Analytics | ⚙️ Settings | 🏆 Upgrade Plan.
Active state and hover state from DESIGN_SYSTEM.md surface colours.

STEP 9 — Dashboard overview (src/pages/partner/VenueOverview.tsx):
4-column KPI strip (white cards, 1px border):
📅 Bookings this week | 💰 Revenue net (price_paid sum - 15%) |
👁 Profile views (placeholder) | 📊 Conversion rate.
Animate KPI numbers counting up on mount with Framer Motion.
Bar chart (Recharts BarChart): daily bookings Mon–Sun. 7 bars.
Colour from DESIGN_SYSTEM.md primary accent. Height 80px.
Upcoming bookings table: Guest | Date & Time | Slot | Payment | Status chips.

STEP 10 — Listing editor (src/pages/partner/VenueListingEditor.tsx):
3 form sections:
Section 1 — Basic Info: Venue Name | Neighbourhood | Type | Maps URL | Description.
Section 2 — Work Conditions: WiFi Speed | Price | Sockets | Noise. 3 toggle rows.
Section 3 — Booking Settings (accent border to highlight it is premium):
Paystack discount rate % | Max seats | Slot duration | Advance window |
Available time slots (multi-chip select: 7–10am, 8am–12pm, 12–3pm, 2–5pm, Evening).
Save: UPSERT spots + venue_settings. Success toast.

STEP 11 — Analytics (src/pages/partner/VenueAnalytics.tsx):
2×2 grid using Recharts:
1. Peak hours horizontal bar chart
2. Visitor profile bars (Freelancer 52% | Founder 24% | Remote emp 16% | Nomad 8%)
3. WorkScore trend (3-bar chart)
4. Neighbourhood ranking list (current venue highlighted)

STEP 12 — Payouts (src/pages/partner/VenuePayouts.tsx):
2×2 summary cards: Available to withdraw (highlighted) | Total earned |
This month | Commission 15%.
"Withdraw to M-Pesa via Paystack" button → confirmation modal.
This will call Paystack Transfers API in production.
Show intent + payout history table.

After all steps: test full Paystack sandbox flow. Verify webhook fires.
Deploy both Edge Functions. Run npm run build — must have 0 errors.
```

### Verify it worked
- [ ] Paystack popup opens when confirming a booking
- [ ] Test M-Pesa flow completes with phone 0708000000
- [ ] Booking status updates to 'confirmed' after test payment
- [ ] Paystack dashboard shows the test transaction under Transactions
- [ ] Partner landing page renders both columns correctly
- [ ] Venue dashboard sidebar navigation works
- [ ] Listing editor saves changes to Supabase
- [ ] Analytics charts render

---

## Session 7: Production Polish & Deployment

**Estimated time:** 2–3 hours
**What you'll have after:** Production-ready app. Fully responsive, optimised,
with correct meta tags, error boundaries, and live at your custom domain.

### Pre-session checklist
- [ ] Sessions 1–6 complete
- [ ] App deployed to Vercel and accessible
- [ ] Custom domain purchased (workspot.co.ke recommended)
- [ ] All Supabase environment variables set in Vercel

### Claude Code Instruction
```
Final session — production polish for WorkSpot Nairobi.
Sessions 1–6 are complete. The full app is built. Now make it production-ready.

STEP 1 — Mobile responsiveness audit:
Check every page at 375px viewport width. Fix:
- Hero H1: must use clamp() to not overflow on mobile
- Stats row: wrap to 2×2 on small screens
- Filter bar: horizontal scroll, no wrap, no visible scrollbar
- Featured cards: stack vertically on mobile
- Spot grid: 1 col mobile, 2 col 640px+, 3 col 1024px+
- Spot detail metrics: 2 cols mobile, 3 cols desktop
- Bottom tab bar: always visible on mobile
- Top nav: hide on mobile (< 768px)
- All touch targets: min 44×44px
- No horizontal overflow anywhere

STEP 2 — Skeleton loading states:
Create src/components/ui/Skeleton.tsx: animated grey gradient div.
Add skeletons to: SpotCard (image + 3 text lines), SpotCardFeatured (full),
Profile page (avatar + stats), Community feed (3 items), Events list.
Use these in loading states from React Query.

STEP 3 — Error boundaries:
Create src/components/ui/ErrorBoundary.tsx (class component).
Wrap at the top level and around each major page.
Error fallback: a tasteful earth-toned "Something went wrong" page with
a "Refresh" button and a note about the issue.

STEP 4 — Empty states:
Consistent empty states for: filtered spots returning 0, no bookings yet,
no reviews for a spot, community feed empty, no events. Each empty state:
a relevant emoji, a short message, and a suggested action button.

STEP 5 — Meta tags + SEO (src/components/SEOHead.tsx):
Use react-helmet-async for per-page meta tags.
Global: title WorkSpot Nairobi, description, og:image, og:type, Twitter card.
Per-page: SpotDetail uses spot name + description. Events uses event name.
Add a robots.txt and sitemap generation script.

STEP 6 — Performance:
Lazy load page components with React.lazy + Suspense.
Add loading="lazy" to all images.
Ensure Tailwind CSS is purging unused styles (it should by default with Vite).
Run `npm run build && npx vite preview` — check bundle sizes.
If any chunk > 500KB, split it.

STEP 7 — Toast notifications:
Install and configure react-hot-toast (or sonner).
Add toasts for: successful check-in, review submitted, RSVP confirmed,
booking confirmed, sign out, copy link.

STEP 8 — Progressive Web App setup:
Add vite-plugin-pwa to vite.config.ts.
Configure: name WorkSpot Nairobi, short_name WorkSpot, theme_color #1C1410,
background_color #F5EFE0. Icons: generate from a simple circle with WS initials.
This allows the app to be installed on phone home screens.

STEP 9 — Final checks:
Run `npm run build`. Must complete with 0 errors and 0 TypeScript errors.
Run `npm run preview`. Visit every route and click through every flow.
Check browser console: 0 errors, 0 unexpected warnings.
Check Supabase: all tables have data, RLS policies are working.

STEP 10 — Custom domain:
In Vercel dashboard → Domains → add workspot.co.ke.
Vercel will give you DNS records to add. Add them in your domain registrar.
In Supabase → Authentication → URL Configuration → add workspot.co.ke
to Site URL and Redirect URLs.

After all steps: the app is production-ready. Share the Vercel URL.
```

### Verify it worked
- [ ] `npm run build` succeeds with 0 TypeScript errors
- [ ] App loads in under 2 seconds on a phone
- [ ] Works correctly at 375px on all pages
- [ ] No console errors in production build
- [ ] Custom domain loads the app
- [ ] PWA installs on phone home screen

---

## When Things Break

**TypeScript error you don't understand:** Paste the full error into this
Claude Project chat. Include the file path and line number. Claude will fix it.

**Supabase error (401, 403, 42501):** RLS policy blocking the query.
Paste the error + the query being run. Claude will fix the policy.

**M-Pesa callback not firing:** Check Supabase Edge Function logs in
Supabase Dashboard → Edge Functions → Logs. Paste the error here.

**Build succeeds but feature broken in production:** Run `npm run build &&
npm run preview` locally first. Production bugs are usually environment
variable issues (missing VITE_ prefix) or RLS policies.

**"This is too complex, I don't know where to start":** Just open a chat in
this Project and describe what's broken. You don't need to understand the code.
