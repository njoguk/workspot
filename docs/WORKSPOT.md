# WorkSpot Nairobi — Master Project Brief

Read CONFIG.md first (platform name and identity).
Read DESIGN_SYSTEM.md second (all visual design tokens, colours, typography, components).
Read this file third for product context, data, and business model.
Read SCHEMA.md for database structure.
Read BUILD_PLAN.md for build sequence.

---

## What It Is

The platform defined in CONFIG.md is a curated marketplace where remote workers
in Nairobi, Kenya discover, check in, review, and book workspace sessions at
cafés, hotel lobbies, gardens, and coworking spaces. It is free to browse.
Revenue comes from the subscription product (consumer), premium venue listings
(B2B), and booking commissions.

A future platform, CreativeSpot, will share this codebase's infrastructure to
serve photographers, musicians, and makers booking studios. The schema and
components are built to support this without rework.

---

## The Three Build Phases

**Phase 1 — The Curated Directory**
A free, no-login-required web directory of 47 Nairobi spots. Each listing shows
WiFi speed, noise level, price to work there, power sockets, vibe tags, best time
to go, and a score (label defined in CONFIG.md SCORE_LABEL). Users browse, filter,
and read spot detail pages. No backend yet — mock data only.

**Phase 2 — Community Layer**
User accounts, check-ins, reviews, community feed, events, and the monthly
community event RSVP system. Supabase backend goes live here. The score
updates automatically as reviews come in. Streak mechanics and badges keep users
coming back daily.

**Phase 3 — Monetisation**
Subscription product (see CONFIG.md SUBSCRIPTION_NAME) with Paystack payments
(M-Pesa + cards via Paystack gateway). Slot booking system for partner venues.
Venue Partner Portal (desktop dashboard) where café and hotel owners manage their
listing, set availability, view analytics, and receive M-Pesa payouts via Paystack.

---

## Target Users

**Local remote workers** — Freelancers, consultants, founders working from public
spaces. Price-sensitive. Come daily. Primary community builders.

**Remote employees** — Contracted by companies to work from anywhere. Less
price-sensitive. Interested in quality and professional settings.

**International digital nomads** — Visiting Nairobi. Willing to pay for curated,
reliable workspace. Write reviews, share on social media, generate content.

**Venue operators** — Café owners, hotel managers, coworking space operators.
B2B customer on the supply side. Want bookings, analytics, and M-Pesa payouts.

---

## Tech Stack

- **Frontend**: React 18 + Vite + TypeScript
- **Styling**: Tailwind CSS + shadcn/ui component library
- **Routing**: React Router v6
- **Data fetching**: React Query (TanStack Query v5)
- **Animation**: Framer Motion
- **Backend**: Supabase (PostgreSQL + Auth + Edge Functions + Storage + Realtime)
- **Payments**: Paystack (handles M-Pesa STK push + cards — no direct Daraja integration)
- **Deployment**: Vercel (frontend) + Supabase (backend)
- **Version control**: GitHub

All code is TypeScript. No JavaScript files. Mobile-first always (375px baseline).

---

## Design System

**All design tokens, colours, typography, spacing, shadows, motion, and component
visual specifications are defined in DESIGN_SYSTEM.md.**

Always reference DESIGN_SYSTEM.md for any design decision. Do not invent
colours, fonts, or spacing values that are not defined there.

The one platform-specific addition to the design system: the **QualityScoreBadge**
uses the label from CONFIG.md SCORE_LABEL ("WorkScore" by default). The badge
label is always a prop — never hardcoded as the string "WorkScore".

---

## Core Components

These components are used throughout the platform. Their visual styling
comes from DESIGN_SYSTEM.md. Their props and behaviour are defined here.

### QualityScoreBadge
Shows the WorkScore for a spot.
- Props: `score: number`, `label: string = CONFIG.SCORE_LABEL`, `size: 'sm'|'md'|'lg'`
- sm=38px, md=48px, lg=56px
- The label prop defaults to SCORE_LABEL from CONFIG.md
- When CreativeSpot launches it will be SCORE_LABEL_CREATIVE. Always use the prop.

### WifiBars
4 vertical bars of increasing height. Active bars use the success/availability
colour from DESIGN_SYSTEM.md. Inactive bars use the border colour.
- Props: `mbps: number`
- Levels: <25 → 1 bar, 25–49 → 2, 50–79 → 3, 80+ → 4

### NoiseDots
3 filled circles. Active uses the brand accent colour. Inactive uses border colour.
- Props: `level: 1 | 2 | 3` (1=Quiet, 2=Moderate, 3=Loud)
- Tooltip on hover showing the label

### SpotCard (grid card, ~300px wide)
- Top: 180px image area (coverGradient or real photo)
- QualityScoreBadge (md) top-right of image
- Spot name in display font, bold
- Neighbourhood + type in mono font, muted
- MetricRow: WifiBars + mbps | NoiseDots + label | price
- VibeTags: up to 3, pill-shaped
- Hover: translateY(-3px) with shadow increase

### SpotCardFeatured (hero card, 440px tall)
- Full-bleed coverGradient background
- Dark gradient overlay (bottom-to-top)
- QualityScoreBadge (lg) top-right
- Category + vibe badges top-left
- Content anchored bottom-left: name large, neighbourhood, MetricRow

### MetricRow
Config-driven row of metric items. Each item: icon + value + label.
- Props: `spot: Spot`, `spaceFamily: 'remote_work' | 'creative'`
- remote_work: WiFi | Noise | Price | Sockets
- creative (future): Equipment | Dimensions | Rate

---

## Spot Data (Mock Data for Phase 1)

All spots use `spaceFamily: 'remote_work'` and `scoreLabel` from CONFIG.md.

```typescript
type SpaceFamily = 'remote_work' | 'creative'

interface Spot {
  id: string
  name: string
  neighbourhood: string
  type: 'cafe' | 'cowork' | 'hotel' | 'garden'
  spaceFamily: SpaceFamily
  scoreLabel: string           // from CONFIG.md SCORE_LABEL
  workScore: number            // 0–10 one decimal
  wifiMbps: number
  noiseLevel: 1 | 2 | 3
  priceEntry: string
  priceType: 'free' | 'paid'
  sockets: 'Abundant' | 'Good' | 'Moderate' | 'Scarce'
  vibeTags: string[]
  bestTimes: string[]
  description: string
  coverGradient: string
  typeAttributes: Record<string, unknown>
  isNew?: boolean
  isPremiumListing?: boolean
}
```

The 12 launch spots:

```typescript
export const SPOTS: Spot[] = [
  {
    id: '1', name: 'The Alchemist', neighbourhood: 'Westlands', type: 'garden',
    spaceFamily: 'remote_work', scoreLabel: 'WorkScore', workScore: 9.2,
    wifiMbps: 78, noiseLevel: 1, priceEntry: 'Min. KES 400', priceType: 'free',
    sockets: 'Abundant', vibeTags: ['🌿 Outdoor', '🎨 Creative Crowd', '☕ Good Coffee'],
    bestTimes: ['7am–11am ✓', '11am–1pm', '1pm–3pm', '3pm–6pm ✓', 'After 6pm ✗'],
    description: 'A sprawling open-air garden in the heart of Westlands with multiple bar and food vendors. Mornings are calm and surprisingly productive — great WiFi, plenty of shade, and a creative crowd. Gets loud after 2pm on weekends. The back courtyard has the best socket access.',
    coverGradient: 'linear-gradient(135deg, #2E4A3A 0%, #1C3028 100%)',
    typeAttributes: { wifi_mbps: 78, noise_level: 1, sockets: 'Abundant' }, isNew: true
  },
  {
    id: '2', name: 'Nairobi Garage', neighbourhood: 'Kilimani', type: 'cowork',
    spaceFamily: 'remote_work', scoreLabel: 'WorkScore', workScore: 8.8,
    wifiMbps: 120, noiseLevel: 2, priceEntry: 'KES 1,500/day', priceType: 'paid',
    sockets: 'Excellent', vibeTags: ['💻 Tech Community', '📞 Call Booths', '☕ Free Coffee'],
    bestTimes: ['8am–12pm ✓', '12pm–2pm', '2pm–5pm ✓', 'After 5pm'],
    description: "Nairobi's original tech-focused coworking space, now with multiple floors and event spaces. The community is its biggest asset — engineers, founders, and consultants all share the floor. A day pass buys you unlimited coffee, a dedicated desk, and access to call booths.",
    coverGradient: 'linear-gradient(135deg, #3D2B1F 0%, #6B4226 100%)',
    typeAttributes: { wifi_mbps: 120, noise_level: 2, sockets: 'Excellent' }
  },
  {
    id: '3', name: 'Karen Blixen Coffee Garden', neighbourhood: 'Karen', type: 'garden',
    spaceFamily: 'remote_work', scoreLabel: 'WorkScore', workScore: 8.9,
    wifiMbps: 55, noiseLevel: 1, priceEntry: 'Min. KES 600', priceType: 'free',
    sockets: 'Moderate', vibeTags: ['🌳 Stunning Grounds', '🤝 Client Meetings', '🤫 Very Quiet'],
    bestTimes: ['8am–11am ✓', '11am–1pm ✓', '1pm–3pm', '3pm–5pm ✓'],
    description: 'A truly beautiful setting — colonial-era gardens, giant fig trees, and birdsong. The WiFi is solid for its class and the clientele skews toward consultants and visiting professionals. Ideal for creative work, calls, or meetings you want to impress at.',
    coverGradient: 'linear-gradient(135deg, #1A3320 0%, #2E5235 100%)',
    typeAttributes: { wifi_mbps: 55, noise_level: 1, sockets: 'Moderate' }
  },
  {
    id: '4', name: 'The Social House', neighbourhood: 'Gigiri', type: 'cafe',
    spaceFamily: 'remote_work', scoreLabel: 'WorkScore', workScore: 8.1,
    wifiMbps: 65, noiseLevel: 2, priceEntry: 'Min. KES 500', priceType: 'free',
    sockets: 'Good', vibeTags: ['🌍 International Crowd', '📹 Good for Calls', '☕ Specialty Coffee'],
    bestTimes: ['8am–10am ✓', '10am–12pm ✓', '12pm–2pm', '2pm–5pm ✓'],
    description: 'Stylish café in the Gigiri diplomatic zone popular with NGO workers and UN staff. Excellent flat whites, solid WiFi, and a calm buzzy energy. The terrace is the best spot for video calls.',
    coverGradient: 'linear-gradient(135deg, #2A3545 0%, #3D5070 100%)',
    typeAttributes: { wifi_mbps: 65, noise_level: 2, sockets: 'Good' }
  },
  {
    id: '5', name: 'iHub Nairobi', neighbourhood: 'Upperhill', type: 'cowork',
    spaceFamily: 'remote_work', scoreLabel: 'WorkScore', workScore: 8.5,
    wifiMbps: 95, noiseLevel: 2, priceEntry: 'KES 1,200/day', priceType: 'paid',
    sockets: 'Excellent', vibeTags: ['🚀 Startup Energy', '💻 Tech Focused', '📚 Resource Library'],
    bestTimes: ['8am–12pm ✓', '2pm–6pm ✓'],
    description: "Africa's original tech hub, reimagined. iHub is more than a coworking space — it's a community of builders, developers, and innovators. The day pass includes access to the events calendar and meeting rooms.",
    coverGradient: 'linear-gradient(135deg, #2A1A35 0%, #4A2A60 100%)',
    typeAttributes: { wifi_mbps: 95, noise_level: 2, sockets: 'Excellent' }
  },
  {
    id: '6', name: 'Java House — Westlands', neighbourhood: 'Westlands', type: 'cafe',
    spaceFamily: 'remote_work', scoreLabel: 'WorkScore', workScore: 7.4,
    wifiMbps: 32, noiseLevel: 3, priceEntry: 'Min. KES 350', priceType: 'free',
    sockets: 'Scarce', vibeTags: ['☕ Great Coffee', '🌅 Early Bird Spot', '📍 Central'],
    bestTimes: ['7am–10am ✓', '10am–12pm', '12pm–2pm ✗', '2pm–5pm'],
    description: 'A Nairobi staple. Reliable WiFi and great coffee before 10am. Not the most socket-friendly — arrive early to claim a wall seat. Best for focused solo work in the morning; gets packed at lunch.',
    coverGradient: 'linear-gradient(135deg, #4A2C1A 0%, #7A4A2A 100%)',
    typeAttributes: { wifi_mbps: 32, noise_level: 3, sockets: 'Scarce' }
  },
  {
    id: '7', name: 'Artcaffe — Village Market', neighbourhood: 'Gigiri', type: 'cafe',
    spaceFamily: 'remote_work', scoreLabel: 'WorkScore', workScore: 7.8,
    wifiMbps: 44, noiseLevel: 2, priceEntry: 'Min. KES 450', priceType: 'free',
    sockets: 'Moderate', vibeTags: ['🛒 Mall Location', '🍱 Great Food Menu', '🌡 Air-Conditioned'],
    bestTimes: ['7am–10am ✓', '10am–12pm ✓', '12pm–2pm ✗', '2pm–5pm'],
    description: 'Large tables, reliable WiFi, and great food make it a solid all-day option. The indoor section is coolest and quietest.',
    coverGradient: 'linear-gradient(135deg, #3A2510 0%, #6A4520 100%)',
    typeAttributes: { wifi_mbps: 44, noise_level: 2, sockets: 'Moderate' }
  },
  {
    id: '8', name: 'Roast by Carnivore', neighbourhood: 'Langata', type: 'hotel',
    spaceFamily: 'remote_work', scoreLabel: 'WorkScore', workScore: 8.3,
    wifiMbps: 70, noiseLevel: 1, priceEntry: 'Min. KES 700', priceType: 'free',
    sockets: 'Good', vibeTags: ['💎 Hidden Gem', '🌿 Garden Setting', '🤫 Quiet'],
    bestTimes: ['7am–11am ✓', '11am–1pm ✓', '1pm–3pm', '3pm–5pm'],
    description: "One of Nairobi's best-kept work secrets. The garden café attached to the Carnivore complex has fast WiFi, excellent power access, and almost no foot traffic on weekday mornings.",
    coverGradient: 'linear-gradient(135deg, #1A2E1A 0%, #2E502E 100%)',
    typeAttributes: { wifi_mbps: 70, noise_level: 1, sockets: 'Good' }
  },
  {
    id: '9', name: 'Pangani Social', neighbourhood: 'Pangani', type: 'cafe',
    spaceFamily: 'remote_work', scoreLabel: 'WorkScore', workScore: 7.6,
    wifiMbps: 38, noiseLevel: 2, priceEntry: 'Min. KES 300', priceType: 'free',
    sockets: 'Scarce', vibeTags: ['🏡 Local Feel', '💸 Budget-Friendly', '🎨 Creative Scene'],
    bestTimes: ['8am–11am ✓', '11am–1pm', '3pm–6pm ✓'],
    description: 'An authentic neighbourhood café popular with local freelancers and creatives. Lower prices than the Westlands scene. WiFi is decent, sockets are scarce — bring a power bank.',
    coverGradient: 'linear-gradient(135deg, #3A1A10 0%, #6A3020 100%)',
    typeAttributes: { wifi_mbps: 38, noise_level: 2, sockets: 'Scarce' }
  },
  {
    id: '10', name: 'Villa Rosa Kempinski — Lobby', neighbourhood: 'Westlands', type: 'hotel',
    spaceFamily: 'remote_work', scoreLabel: 'WorkScore', workScore: 8.6,
    wifiMbps: 88, noiseLevel: 1, priceEntry: 'Min. KES 1,200', priceType: 'free',
    sockets: 'Good', vibeTags: ['🏨 5-Star Setting', '🤝 Client Meetings', '⚡ Fast WiFi'],
    bestTimes: ['8am–10am ✓', '10am–12pm ✓', '2pm–5pm ✓'],
    description: 'When you need to look impressive. The Kempinski lobby café is ideal for client meetings. Fast WiFi, attentive service, great espresso.',
    coverGradient: 'linear-gradient(135deg, #1A1520 0%, #3A2A45 100%)',
    typeAttributes: { wifi_mbps: 88, noise_level: 1, sockets: 'Good' }
  },
  {
    id: '11', name: 'Kikwetu Café', neighbourhood: 'Hurlingham', type: 'cafe',
    spaceFamily: 'remote_work', scoreLabel: 'WorkScore', workScore: 8.0,
    wifiMbps: 50, noiseLevel: 1, priceEntry: 'Min. KES 380', priceType: 'free',
    sockets: 'Moderate', vibeTags: ['🇰🇪 Proudly Kenyan', '☕ Local Beans', '🤫 Low Noise'],
    bestTimes: ['7am–10am ✓', '10am–12pm ✓', '2pm–5pm ✓'],
    description: 'A proudly Kenyan café with locally sourced beans. The Hurlingham branch is the most work-friendly — quieter, good WiFi, genuinely welcoming.',
    coverGradient: 'linear-gradient(135deg, #2A1A10 0%, #5A3520 100%)',
    typeAttributes: { wifi_mbps: 50, noise_level: 1, sockets: 'Moderate' }
  },
  {
    id: '12', name: 'Space and Style Hub', neighbourhood: 'Lavington', type: 'cowork',
    spaceFamily: 'remote_work', scoreLabel: 'WorkScore', workScore: 8.2,
    wifiMbps: 80, noiseLevel: 1, priceEntry: 'KES 1,000/day', priceType: 'paid',
    sockets: 'Excellent', vibeTags: ['🎨 Interior Design', '🤫 Silent Zones', '💎 Boutique'],
    bestTimes: ['8am–12pm ✓', '2pm–6pm ✓'],
    description: 'A beautifully designed boutique coworking space in quiet Lavington. Max 30 desks. The vibe is calm and professional. One of the best value day passes in Nairobi.',
    coverGradient: 'linear-gradient(135deg, #151520 0%, #252535 100%)',
    typeAttributes: { wifi_mbps: 80, noise_level: 1, sockets: 'Excellent' }
  },
]
```

---

## Business Model

### Consumer Revenue
- **Subscription Monthly**: KES 1,200/month — full booking access + 30% off all sessions
- **Subscription Annual**: KES 10,800/year (KES 900/month) — same plus priority event seats + member badge
- **Corporate Subscription**: KES 800/head/month for teams of 5+

### B2B Revenue (Venue Partner Portal)
- **Free listing**: Basic listing, community reviews, quality score. No booking system.
- **Premium**: KES 3,500/month — featured placement, booking system, analytics, M-Pesa payouts via Paystack
- **Featured**: KES 8,000/month — homepage hero, Workcation host eligibility, account manager

### Transaction Revenue
- 15% commission on all slot bookings
- Paystack handles all payment processing (M-Pesa + cards) — 1.5% fee per transaction
- Venue payouts via Paystack Transfers API to M-Pesa or bank account

---

## CreativeSpot Compatibility Notes

The schema uses `space_family` (default 'remote_work') and `type_attributes` JSONB
so creative studios can be added later without schema migrations.

QualityScoreBadge accepts a `scoreLabel` prop from CONFIG.md.

Review categories are loaded from `review_schemas` config table, not hardcoded.

Do not add creative space logic during Phase 1–3. The architecture just needs
to support it without breaking.
