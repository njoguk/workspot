import type { Spot } from '@/types'
import { SCORE_LABEL } from '@/config/platform'

/**
 * Phase 1 mock data — the 12 launch spots from docs/WORKSPOT.md.
 * scoreLabel is sourced from CONFIG (never hardcoded) to keep the
 * QualityScoreBadge / CreativeSpot compatibility promise.
 */
export const SPOTS: Spot[] = [
  {
    id: '1',
    name: 'The Alchemist',
    neighbourhood: 'Westlands',
    type: 'garden',
    spaceFamily: 'remote_work',
    scoreLabel: SCORE_LABEL,
    workScore: 9.2,
    wifiMbps: 78,
    noiseLevel: 1,
    priceEntry: 'Min. KES 400',
    priceType: 'free',
    sockets: 'Abundant',
    vibeTags: ['🌿 Outdoor', '🎨 Creative Crowd', '☕ Good Coffee'],
    bestTimes: ['7am–11am ✓', '11am–1pm', '1pm–3pm', '3pm–6pm ✓', 'After 6pm ✗'],
    description:
      'A sprawling open-air garden in the heart of Westlands with multiple bar and food vendors. Mornings are calm and surprisingly productive — great WiFi, plenty of shade, and a creative crowd. Gets loud after 2pm on weekends. The back courtyard has the best socket access.',
    coverGradient: 'linear-gradient(135deg, #2E4A3A 0%, #1C3028 100%)',
    typeAttributes: { wifi_mbps: 78, noise_level: 1, sockets: 'Abundant' },
    isNew: true,
  },
  {
    id: '2',
    name: 'Nairobi Garage',
    neighbourhood: 'Kilimani',
    type: 'cowork',
    spaceFamily: 'remote_work',
    scoreLabel: SCORE_LABEL,
    workScore: 8.8,
    wifiMbps: 120,
    noiseLevel: 2,
    priceEntry: 'KES 1,500/day',
    priceType: 'paid',
    sockets: 'Excellent',
    vibeTags: ['💻 Tech Community', '📞 Call Booths', '☕ Free Coffee'],
    bestTimes: ['8am–12pm ✓', '12pm–2pm', '2pm–5pm ✓', 'After 5pm'],
    description:
      "Nairobi's original tech-focused coworking space, now with multiple floors and event spaces. The community is its biggest asset — engineers, founders, and consultants all share the floor. A day pass buys you unlimited coffee, a dedicated desk, and access to call booths.",
    coverGradient: 'linear-gradient(135deg, #3D2B1F 0%, #6B4226 100%)',
    typeAttributes: { wifi_mbps: 120, noise_level: 2, sockets: 'Excellent' },
  },
  {
    id: '3',
    name: 'Karen Blixen Coffee Garden',
    neighbourhood: 'Karen',
    type: 'garden',
    spaceFamily: 'remote_work',
    scoreLabel: SCORE_LABEL,
    workScore: 8.9,
    wifiMbps: 55,
    noiseLevel: 1,
    priceEntry: 'Min. KES 600',
    priceType: 'free',
    sockets: 'Moderate',
    vibeTags: ['🌳 Stunning Grounds', '🤝 Client Meetings', '🤫 Very Quiet'],
    bestTimes: ['8am–11am ✓', '11am–1pm ✓', '1pm–3pm', '3pm–5pm ✓'],
    description:
      'A truly beautiful setting — colonial-era gardens, giant fig trees, and birdsong. The WiFi is solid for its class and the clientele skews toward consultants and visiting professionals. Ideal for creative work, calls, or meetings you want to impress at.',
    coverGradient: 'linear-gradient(135deg, #1A3320 0%, #2E5235 100%)',
    typeAttributes: { wifi_mbps: 55, noise_level: 1, sockets: 'Moderate' },
  },
  {
    id: '4',
    name: 'The Social House',
    neighbourhood: 'Gigiri',
    type: 'cafe',
    spaceFamily: 'remote_work',
    scoreLabel: SCORE_LABEL,
    workScore: 8.1,
    wifiMbps: 65,
    noiseLevel: 2,
    priceEntry: 'Min. KES 500',
    priceType: 'free',
    sockets: 'Good',
    vibeTags: ['🌍 International Crowd', '📹 Good for Calls', '☕ Specialty Coffee'],
    bestTimes: ['8am–10am ✓', '10am–12pm ✓', '12pm–2pm', '2pm–5pm ✓'],
    description:
      'Stylish café in the Gigiri diplomatic zone popular with NGO workers and UN staff. Excellent flat whites, solid WiFi, and a calm buzzy energy. The terrace is the best spot for video calls.',
    coverGradient: 'linear-gradient(135deg, #2A3545 0%, #3D5070 100%)',
    typeAttributes: { wifi_mbps: 65, noise_level: 2, sockets: 'Good' },
  },
  {
    id: '5',
    name: 'iHub Nairobi',
    neighbourhood: 'Upperhill',
    type: 'cowork',
    spaceFamily: 'remote_work',
    scoreLabel: SCORE_LABEL,
    workScore: 8.5,
    wifiMbps: 95,
    noiseLevel: 2,
    priceEntry: 'KES 1,200/day',
    priceType: 'paid',
    sockets: 'Excellent',
    vibeTags: ['🚀 Startup Energy', '💻 Tech Focused', '📚 Resource Library'],
    bestTimes: ['8am–12pm ✓', '2pm–6pm ✓'],
    description:
      "Africa's original tech hub, reimagined. iHub is more than a coworking space — it's a community of builders, developers, and innovators. The day pass includes access to the events calendar and meeting rooms.",
    coverGradient: 'linear-gradient(135deg, #2A1A35 0%, #4A2A60 100%)',
    typeAttributes: { wifi_mbps: 95, noise_level: 2, sockets: 'Excellent' },
  },
  {
    id: '6',
    name: 'Java House — Westlands',
    neighbourhood: 'Westlands',
    type: 'cafe',
    spaceFamily: 'remote_work',
    scoreLabel: SCORE_LABEL,
    workScore: 7.4,
    wifiMbps: 32,
    noiseLevel: 3,
    priceEntry: 'Min. KES 350',
    priceType: 'free',
    sockets: 'Scarce',
    vibeTags: ['☕ Great Coffee', '🌅 Early Bird Spot', '📍 Central'],
    bestTimes: ['7am–10am ✓', '10am–12pm', '12pm–2pm ✗', '2pm–5pm'],
    description:
      'A Nairobi staple. Reliable WiFi and great coffee before 10am. Not the most socket-friendly — arrive early to claim a wall seat. Best for focused solo work in the morning; gets packed at lunch.',
    coverGradient: 'linear-gradient(135deg, #4A2C1A 0%, #7A4A2A 100%)',
    typeAttributes: { wifi_mbps: 32, noise_level: 3, sockets: 'Scarce' },
  },
  {
    id: '7',
    name: 'Artcaffe — Village Market',
    neighbourhood: 'Gigiri',
    type: 'cafe',
    spaceFamily: 'remote_work',
    scoreLabel: SCORE_LABEL,
    workScore: 7.8,
    wifiMbps: 44,
    noiseLevel: 2,
    priceEntry: 'Min. KES 450',
    priceType: 'free',
    sockets: 'Moderate',
    vibeTags: ['🛒 Mall Location', '🍱 Great Food Menu', '🌡 Air-Conditioned'],
    bestTimes: ['7am–10am ✓', '10am–12pm ✓', '12pm–2pm ✗', '2pm–5pm'],
    description:
      'Large tables, reliable WiFi, and great food make it a solid all-day option. The indoor section is coolest and quietest.',
    coverGradient: 'linear-gradient(135deg, #3A2510 0%, #6A4520 100%)',
    typeAttributes: { wifi_mbps: 44, noise_level: 2, sockets: 'Moderate' },
  },
  {
    id: '8',
    name: 'Roast by Carnivore',
    neighbourhood: 'Langata',
    type: 'hotel',
    spaceFamily: 'remote_work',
    scoreLabel: SCORE_LABEL,
    workScore: 8.3,
    wifiMbps: 70,
    noiseLevel: 1,
    priceEntry: 'Min. KES 700',
    priceType: 'free',
    sockets: 'Good',
    vibeTags: ['💎 Hidden Gem', '🌿 Garden Setting', '🤫 Quiet'],
    bestTimes: ['7am–11am ✓', '11am–1pm ✓', '1pm–3pm', '3pm–5pm'],
    description:
      "One of Nairobi's best-kept work secrets. The garden café attached to the Carnivore complex has fast WiFi, excellent power access, and almost no foot traffic on weekday mornings.",
    coverGradient: 'linear-gradient(135deg, #1A2E1A 0%, #2E502E 100%)',
    typeAttributes: { wifi_mbps: 70, noise_level: 1, sockets: 'Good' },
  },
  {
    id: '9',
    name: 'Pangani Social',
    neighbourhood: 'Pangani',
    type: 'cafe',
    spaceFamily: 'remote_work',
    scoreLabel: SCORE_LABEL,
    workScore: 7.6,
    wifiMbps: 38,
    noiseLevel: 2,
    priceEntry: 'Min. KES 300',
    priceType: 'free',
    sockets: 'Scarce',
    vibeTags: ['🏡 Local Feel', '💸 Budget-Friendly', '🎨 Creative Scene'],
    bestTimes: ['8am–11am ✓', '11am–1pm', '3pm–6pm ✓'],
    description:
      'An authentic neighbourhood café popular with local freelancers and creatives. Lower prices than the Westlands scene. WiFi is decent, sockets are scarce — bring a power bank.',
    coverGradient: 'linear-gradient(135deg, #3A1A10 0%, #6A3020 100%)',
    typeAttributes: { wifi_mbps: 38, noise_level: 2, sockets: 'Scarce' },
  },
  {
    id: '10',
    name: 'Villa Rosa Kempinski — Lobby',
    neighbourhood: 'Westlands',
    type: 'hotel',
    spaceFamily: 'remote_work',
    scoreLabel: SCORE_LABEL,
    workScore: 8.6,
    wifiMbps: 88,
    noiseLevel: 1,
    priceEntry: 'Min. KES 1,200',
    priceType: 'free',
    sockets: 'Good',
    vibeTags: ['🏨 5-Star Setting', '🤝 Client Meetings', '⚡ Fast WiFi'],
    bestTimes: ['8am–10am ✓', '10am–12pm ✓', '2pm–5pm ✓'],
    description:
      'When you need to look impressive. The Kempinski lobby café is ideal for client meetings. Fast WiFi, attentive service, great espresso.',
    coverGradient: 'linear-gradient(135deg, #1A1520 0%, #3A2A45 100%)',
    typeAttributes: { wifi_mbps: 88, noise_level: 1, sockets: 'Good' },
  },
  {
    id: '11',
    name: 'Kikwetu Café',
    neighbourhood: 'Hurlingham',
    type: 'cafe',
    spaceFamily: 'remote_work',
    scoreLabel: SCORE_LABEL,
    workScore: 8.0,
    wifiMbps: 50,
    noiseLevel: 1,
    priceEntry: 'Min. KES 380',
    priceType: 'free',
    sockets: 'Moderate',
    vibeTags: ['🇰🇪 Proudly Kenyan', '☕ Local Beans', '🤫 Low Noise'],
    bestTimes: ['7am–10am ✓', '10am–12pm ✓', '2pm–5pm ✓'],
    description:
      'A proudly Kenyan café with locally sourced beans. The Hurlingham branch is the most work-friendly — quieter, good WiFi, genuinely welcoming.',
    coverGradient: 'linear-gradient(135deg, #2A1A10 0%, #5A3520 100%)',
    typeAttributes: { wifi_mbps: 50, noise_level: 1, sockets: 'Moderate' },
  },
  {
    id: '12',
    name: 'Space and Style Hub',
    neighbourhood: 'Lavington',
    type: 'cowork',
    spaceFamily: 'remote_work',
    scoreLabel: SCORE_LABEL,
    workScore: 8.2,
    wifiMbps: 80,
    noiseLevel: 1,
    priceEntry: 'KES 1,000/day',
    priceType: 'paid',
    sockets: 'Excellent',
    vibeTags: ['🎨 Interior Design', '🤫 Silent Zones', '💎 Boutique'],
    bestTimes: ['8am–12pm ✓', '2pm–6pm ✓'],
    description:
      'A beautifully designed boutique coworking space in quiet Lavington. Max 30 desks. The vibe is calm and professional. One of the best value day passes in Nairobi.',
    coverGradient: 'linear-gradient(135deg, #151520 0%, #252535 100%)',
    typeAttributes: { wifi_mbps: 80, noise_level: 1, sockets: 'Excellent' },
  },
]

// ── Helpers ────────────────────────────────────────────────────

export function getSpotById(id: string): Spot | undefined {
  return SPOTS.find((spot) => spot.id === id)
}

export function getSpotsByNeighbourhood(neighbourhood: string): Spot[] {
  return SPOTS.filter(
    (spot) => spot.neighbourhood.toLowerCase() === neighbourhood.toLowerCase(),
  )
}

export function getSpotsByType(type: Spot['type']): Spot[] {
  return SPOTS.filter((spot) => spot.type === type)
}

/** Top 2 spots by workScore — used for Editor's Picks. */
export function getFeaturedSpots(): Spot[] {
  return [...SPOTS].sort((a, b) => b.workScore - a.workScore).slice(0, 2)
}

/** Count of distinct neighbourhoods across all spots. */
export function getNeighbourhoodCount(): number {
  return new Set(SPOTS.map((spot) => spot.neighbourhood)).size
}
