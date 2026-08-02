import { useMemo, useState } from 'react'
import { SPOTS } from '@/data/spots'
import type { Spot, SpotType } from '@/types'

export type WifiKey = 'fast' | 'decent'
export type VibeKey = 'quiet' | 'buzzy' | 'outdoor'
export type PriceKey = 'free' | 'paid'

const WIFI_THRESHOLD: Record<WifiKey, number> = { fast: 50, decent: 20 }

function toggle<T>(set: Set<T>, value: T): Set<T> {
  const next = new Set(set)
  if (next.has(value)) next.delete(value)
  else next.add(value)
  return next
}

/**
 * Directory filter state. Combination is AND across groups and OR within a
 * multi-select group. Spec: docs/BUILD_PLAN.md Session 2 STEP 10.
 */
export function useSpotFilters() {
  const [activeType, setActiveType] = useState<SpotType | null>(null)
  const [wifi, setWifi] = useState<Set<WifiKey>>(new Set())
  const [vibe, setVibe] = useState<Set<VibeKey>>(new Set())
  const [price, setPrice] = useState<Set<PriceKey>>(new Set())
  const [searchQuery, setSearchQuery] = useState('')

  const filteredSpots = useMemo<Spot[]>(() => {
    const query = searchQuery.trim().toLowerCase()

    return SPOTS.filter((spot) => {
      // Type — exact single match
      if (activeType && spot.type !== activeType) return false

      // WiFi — must meet the loosest selected threshold
      if (wifi.size > 0) {
        const minThreshold = Math.min(
          ...[...wifi].map((key) => WIFI_THRESHOLD[key]),
        )
        if (spot.wifiMbps < minThreshold) return false
      }

      // Vibe — OR within the group
      if (vibe.size > 0) {
        const matchesVibe = [...vibe].some((key) => {
          if (key === 'quiet') return spot.noiseLevel === 1
          if (key === 'buzzy') return spot.noiseLevel >= 2
          return spot.vibeTags.some((tag) => tag.toLowerCase().includes('outdoor'))
        })
        if (!matchesVibe) return false
      }

      // Price — OR within the group
      if (price.size > 0 && !price.has(spot.priceType)) return false

      // Search — name or neighbourhood
      if (query) {
        const haystack = `${spot.name} ${spot.neighbourhood}`.toLowerCase()
        if (!haystack.includes(query)) return false
      }

      return true
    })
  }, [activeType, wifi, vibe, price, searchQuery])

  return {
    // state
    activeType,
    wifi,
    vibe,
    price,
    searchQuery,
    filteredSpots,
    // setters
    setType: (type: SpotType | null) =>
      setActiveType((current) => (current === type ? null : type)),
    toggleWifi: (key: WifiKey) => setWifi((s) => toggle(s, key)),
    toggleVibe: (key: VibeKey) => setVibe((s) => toggle(s, key)),
    togglePrice: (key: PriceKey) => setPrice((s) => toggle(s, key)),
    setSearch: setSearchQuery,
  }
}

export type SpotFilters = ReturnType<typeof useSpotFilters>
