/**
 * Deterministic avatar helpers (Phase 2 Part B).
 *
 * Community feeds, attendee stacks, and profile chips all render initials on a
 * coloured gradient. The gradient is chosen from a fixed set of design-token
 * pairs by hashing a stable seed (usually the user id) — the same person always
 * gets the same colour, and every colour is a semantic token (never a raw hex).
 */

/** 1–2 letter initials for an avatar chip. Falls back to '?' for empty input. */
export function initialsFrom(name: string | null | undefined): string {
  if (!name) return '?'
  const base = name.includes('@') ? name.split('@')[0] : name
  const parts = base.split(/[\s._-]+/).filter(Boolean)
  const letters =
    parts.length >= 2 ? [parts[0][0], parts[1][0]] : [base[0] ?? '?']
  return letters.join('').toUpperCase()
}

/** Small, stable, non-cryptographic string hash. */
export function hashString(input: string): number {
  let hash = 0
  for (let i = 0; i < input.length; i += 1) {
    hash = (hash * 31 + input.charCodeAt(i)) | 0
  }
  return Math.abs(hash)
}

/** Token pairs used for avatar gradients. Both stops are semantic tokens. */
const AVATAR_PAIRS: readonly [string, string][] = [
  ['--color-primary', '--color-secondary'],
  ['--color-success', '--color-info'],
  ['--color-info', '--color-primary'],
  ['--color-secondary', '--color-success'],
  ['--color-dark-alt', '--color-primary'],
  ['--color-success', '--color-secondary'],
]

/**
 * A CSS `background` gradient string for an avatar, deterministic in `seed`.
 * Uses `var(--color-*)` so it always tracks the design tokens.
 */
export function avatarGradient(seed: string): string {
  const [from, to] = AVATAR_PAIRS[hashString(seed) % AVATAR_PAIRS.length]
  return `linear-gradient(135deg, var(${from}) 0%, var(${to}) 100%)`
}
