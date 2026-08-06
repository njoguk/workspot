import { useEffect, useRef, useState } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { Search } from 'lucide-react'

/**
 * Free location picker for the listing editor — OpenStreetMap tiles via Leaflet
 * + Nominatim geocoding (no API key, no billing). Pick by searching, clicking
 * the map, or dragging the pin; the chosen point reverse-geocodes to an address.
 *
 * Respects Nominatim usage policy: debounced search, low volume, Kenya-scoped.
 */

export interface PickedLocation {
  address: string
  lat: number
  lng: number
}

const NAIROBI: [number, number] = [-1.286389, 36.817223]

// Emoji pin as a divIcon avoids Leaflet's bundler marker-image issue entirely.
const PIN = L.divIcon({
  className: 'remospot-pin',
  html: '<div style="font-size:28px;line-height:1;filter:drop-shadow(0 2px 3px rgba(28,20,16,.4))">📍</div>',
  iconSize: [28, 28],
  iconAnchor: [14, 26],
})

interface NominatimResult {
  display_name: string
  lat: string
  lon: string
}

export function LocationPicker({
  value,
  onChange,
}: {
  value: PickedLocation | null
  onChange: (v: PickedLocation) => void
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<L.Map | null>(null)
  const markerRef = useRef<L.Marker | null>(null)
  const onChangeRef = useRef(onChange)
  onChangeRef.current = onChange

  const [query, setQuery] = useState(value?.address ?? '')
  const [results, setResults] = useState<NominatimResult[]>([])
  const [searching, setSearching] = useState(false)

  // Reverse-geocode a point and report the picked location upward.
  async function reportPoint(lat: number, lng: number) {
    let address = `${lat.toFixed(5)}, ${lng.toFixed(5)}`
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
        { headers: { 'Accept-Language': 'en' } },
      )
      const json = await res.json()
      if (json?.display_name) address = json.display_name
    } catch {
      /* keep the coordinate string as a fallback */
    }
    setQuery(address)
    onChangeRef.current({ address, lat, lng })
  }

  function placeMarker(lat: number, lng: number) {
    const map = mapRef.current
    if (!map) return
    if (markerRef.current) {
      markerRef.current.setLatLng([lat, lng])
    } else {
      const m = L.marker([lat, lng], { icon: PIN, draggable: true }).addTo(map)
      m.on('dragend', () => {
        const p = m.getLatLng()
        void reportPoint(p.lat, p.lng)
      })
      markerRef.current = m
    }
    map.panTo([lat, lng])
  }

  // Init the map once.
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return
    const start: [number, number] = value ? [value.lat, value.lng] : NAIROBI
    const map = L.map(containerRef.current, { attributionControl: true }).setView(
      start,
      value ? 15 : 12,
    )
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap contributors',
    }).addTo(map)
    map.on('click', (e: L.LeafletMouseEvent) => {
      placeMarker(e.latlng.lat, e.latlng.lng)
      void reportPoint(e.latlng.lat, e.latlng.lng)
    })
    mapRef.current = map
    if (value) placeMarker(value.lat, value.lng)
    // Container may have been sized after mount; recompute.
    setTimeout(() => map.invalidateSize(), 0)
    return () => {
      map.remove()
      mapRef.current = null
      markerRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Debounced Nominatim search.
  useEffect(() => {
    const q = query.trim()
    if (q.length < 3 || q === value?.address) {
      setResults([])
      return
    }
    const t = setTimeout(async () => {
      setSearching(true)
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&countrycodes=ke&limit=5&addressdetails=1&q=${encodeURIComponent(q)}`,
          { headers: { 'Accept-Language': 'en' } },
        )
        setResults((await res.json()) as NominatimResult[])
      } catch {
        setResults([])
      } finally {
        setSearching(false)
      }
    }, 500)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query])

  function selectResult(r: NominatimResult) {
    const lat = Number(r.lat)
    const lng = Number(r.lon)
    setResults([])
    setQuery(r.display_name)
    placeMarker(lat, lng)
    onChangeRef.current({ address: r.display_name, lat, lng })
  }

  return (
    <div>
      <div className="relative">
        <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-light">
          <Search size={16} />
        </div>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search an address or place in Nairobi…"
          aria-label="Search for a location"
          className="h-11 w-full rounded-md border border-border bg-bg pl-9 pr-3 font-sans text-sm text-text outline-none focus:border-primary"
        />
        {(results.length > 0 || searching) && (
          <ul className="absolute z-[1000] mt-1 max-h-56 w-full overflow-y-auto rounded-md border border-border bg-surface shadow-md">
            {searching && results.length === 0 && (
              <li className="px-3 py-2.5 font-sans text-[13px] text-muted">Searching…</li>
            )}
            {results.map((r, i) => (
              <li key={`${r.lat}-${r.lon}-${i}`}>
                <button
                  type="button"
                  onClick={() => selectResult(r)}
                  className="block w-full px-3 py-2.5 text-left font-sans text-[13px] text-text transition-colors duration-fast hover:bg-surface-alt"
                >
                  {r.display_name}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div
        ref={containerRef}
        className="mt-3 h-64 w-full overflow-hidden rounded-md border border-border"
        role="application"
        aria-label="Map — click or drag the pin to set the exact location"
      />
      <p className="mt-2 font-mono text-[11px] text-light">
        Search, click the map, or drag the pin to set the exact spot.
      </p>
    </div>
  )
}
