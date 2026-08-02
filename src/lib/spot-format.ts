import type { NoiseLevel } from '@/types'

/** Human label for a noise level. */
export function noiseLabel(level: NoiseLevel): string {
  return level === 1 ? 'Quiet' : level === 2 ? 'Moderate' : 'Loud'
}

/** How many of the 4 WiFi bars are "active" for a given speed. */
export function wifiActiveBars(mbps: number): 1 | 2 | 3 | 4 {
  if (mbps < 25) return 1
  if (mbps < 50) return 2
  if (mbps < 80) return 3
  return 4
}

/** Short qualitative label for a WiFi speed. */
export function wifiClass(mbps: number): string {
  if (mbps >= 80) return 'Blazing'
  if (mbps >= 50) return 'Fast'
  if (mbps >= 25) return 'Decent'
  return 'Basic'
}

/** Title-cased label for a spot type. */
export function spotTypeLabel(type: string): string {
  switch (type) {
    case 'cafe':
      return 'Café'
    case 'cowork':
      return 'Coworking'
    case 'hotel':
      return 'Hotel'
    case 'garden':
      return 'Garden'
    default:
      return type.charAt(0).toUpperCase() + type.slice(1)
  }
}
