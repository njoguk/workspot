/**
 * Platform identity — the code-side mirror of docs/CONFIG.md.
 *
 * Components MUST import these values instead of hardcoding strings like
 * "RemoSpot" or "WorkScore". When docs/CONFIG.md changes, update this file
 * and the whole product follows. This is what makes the platform renamable.
 *
 * Keep this file in sync with docs/CONFIG.md (the source of truth).
 */

export const PLATFORM = {
  /** Product name — never hardcode this string in components. */
  name: 'RemoSpot',
  domain: 'remospot.com',
  tagline: 'Find your spot. Do your best work.',
  shortDescription: "Nairobi's curated remote work directory",
  longDescription:
    'The definitive marketplace where remote workers in Nairobi discover, check in, review, and book workspace sessions at cafés, hotel lobbies, gardens, and coworking spaces.',
} as const

export const SCORING = {
  /** Label for the quality score badge (WorkSpot). */
  scoreLabel: 'WorkScore',
  /** Label for the future CreativeSpot sister platform. */
  scoreLabelCreative: 'SpaceScore',
} as const

export const COMMUNITY = {
  communityName: 'Nairobi Remote Workers',
  /** Word for a community sub-space. See docs/community-migration.sql. */
  groupsLabel: 'Groups',
  /** Slug of the seeded default "everyone" group (global, un-scoped feed). */
  defaultGroupSlug: 'nairobi-remote-workers',
  eventName: 'Workcation',
  subscriptionName: 'WorkPass',
  venuePortalName: 'Partner Portal',
} as const

/**
 * Number of verified spots shown in the top nav. Phase 1 uses a static
 * value; from Phase 2 this will come from a React Query count of the
 * `spots` table.
 */
export const VERIFIED_SPOT_COUNT = 47

// Convenience re-exports for the most-used values.
export const PLATFORM_NAME = PLATFORM.name
export const SCORE_LABEL = SCORING.scoreLabel
export const SUBSCRIPTION_NAME = COMMUNITY.subscriptionName
