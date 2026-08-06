import { useState, type ReactNode } from 'react'
import { Check } from 'lucide-react'
import { useToast } from '@/contexts/ToastContext'
import { useUpsertVenue, type PartnerVenue, type VenueFormInput } from '@/hooks/useVenue'
import { uploadSpotImage } from '@/lib/storage'
import { LocationPicker, type PickedLocation } from '@/components/partner/LocationPicker'
import { SLOT_CHOICES, SPOT_TYPE_OPTIONS } from '@/lib/partner'
import { SectionHeading } from '@/components/partner/partner-ui'
import { cn } from '@/lib/utils'
import type { NoiseLevel, SocketAvailability, SpotType } from '@/types'

/**
 * Listing editor as a step-by-step wizard (feedback round, Phase 4): Basics →
 * Location → Work → Photo → Booking. Writes REAL data — it UPSERTs the owner's
 * spot + venue_settings rows (both permitted by RLS). The Location step uses a
 * free OpenStreetMap picker (no API key) and stores address + lat/lng.
 */

const SOCKET_OPTIONS: SocketAvailability[] = ['Excellent', 'Good', 'Moderate', 'Scarce']
const NOISE_OPTIONS: { value: NoiseLevel; label: string }[] = [
  { value: 1, label: 'Quiet' },
  { value: 2, label: 'Moderate' },
  { value: 3, label: 'Loud' },
]

const STEPS = [
  { id: 'basics', label: 'Basics' },
  { id: 'location', label: 'Location' },
  { id: 'conditions', label: 'Work' },
  { id: 'photo', label: 'Photo' },
  { id: 'booking', label: 'Booking' },
] as const

interface FormState {
  name: string
  neighbourhood: string
  type: SpotType
  mapsUrl: string
  address: string
  latitude: number | null
  longitude: number | null
  coverImageUrl: string | null
  description: string
  wifiMbps: number
  priceEntry: string
  sockets: SocketAvailability
  noiseLevel: NoiseLevel
  workpassDiscountPct: number
  maxSeatsPerSlot: number
  slotDurationHours: number
  advanceBookingDays: number
  availableSlots: string[]
}

function initialState(venue: PartnerVenue | null): FormState {
  return {
    name: venue?.name ?? '',
    neighbourhood: venue?.neighbourhood ?? '',
    type: venue?.type ?? 'cafe',
    mapsUrl: venue?.mapsUrl ?? '',
    address: venue?.address ?? '',
    latitude: venue?.latitude ?? null,
    longitude: venue?.longitude ?? null,
    coverImageUrl: venue?.coverImageUrl ?? null,
    description: venue?.description ?? '',
    wifiMbps: venue?.wifiMbps ?? 50,
    priceEntry: venue?.priceEntry ?? '',
    sockets: (venue?.sockets as SocketAvailability) ?? 'Good',
    noiseLevel: venue?.noiseLevel ?? 2,
    workpassDiscountPct: venue?.workpassDiscountPct ?? 30,
    maxSeatsPerSlot: venue?.maxSeatsPerSlot ?? 30,
    slotDurationHours: venue?.slotDurationHours ?? 4,
    advanceBookingDays: venue?.advanceBookingDays ?? 7,
    availableSlots: venue?.availableSlots ?? ['8am–12pm', '12–3pm', '2–5pm'],
  }
}

export function VenueListingEditor({
  venue,
  onSaved,
}: {
  venue: PartnerVenue | null
  onSaved?: (spotId: string) => void
}) {
  const { showToast } = useToast()
  const upsert = useUpsertVenue()
  const [form, setForm] = useState<FormState>(() => initialState(venue))
  const [error, setError] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [stepIdx, setStepIdx] = useState(0)

  const step = STEPS[stepIdx].id
  const isLast = stepIdx === STEPS.length - 1

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  function toggleSlot(slot: string) {
    setForm((f) => ({
      ...f,
      availableSlots: f.availableSlots.includes(slot)
        ? f.availableSlots.filter((s) => s !== slot)
        : [...f.availableSlots, slot],
    }))
  }

  function validBasics(): boolean {
    if (!form.name.trim() || !form.neighbourhood.trim()) {
      setError('Venue name and neighbourhood are required.')
      return false
    }
    setError(null)
    return true
  }

  function goToStep(i: number) {
    // Basics must be valid before leaving it.
    if (stepIdx === 0 && i > 0 && !validBasics()) return
    setStepIdx(i)
  }
  function next() {
    goToStep(Math.min(stepIdx + 1, STEPS.length - 1))
  }
  function back() {
    setError(null)
    setStepIdx((i) => Math.max(i - 1, 0))
  }

  async function handleCoverUpload(file: File) {
    setUploading(true)
    setError(null)
    try {
      const url = await uploadSpotImage(file, venue?.spotId ?? null)
      set('coverImageUrl', url)
      showToast('Cover photo uploaded', { icon: '🖼️' })
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Upload failed — please try again.')
    } finally {
      setUploading(false)
    }
  }

  function handleLocation(loc: PickedLocation) {
    setForm((f) => ({
      ...f,
      address: loc.address,
      latitude: loc.lat,
      longitude: loc.lng,
      // Keep an explicit Maps URL only if the owner hasn't set their own.
      mapsUrl:
        f.mapsUrl && !/google\.com\/maps\/search/.test(f.mapsUrl)
          ? f.mapsUrl
          : `https://www.google.com/maps/search/?api=1&query=${loc.lat},${loc.lng}`,
    }))
  }

  async function handleSave() {
    if (!validBasics()) {
      setStepIdx(0)
      return
    }
    const input: VenueFormInput = { ...form, spotId: venue?.spotId ?? null }
    try {
      const spotId = await upsert.mutateAsync(input)
      showToast(venue ? 'Listing updated' : 'Listing created', { icon: '✅' })
      onSaved?.(spotId)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save — please try again.')
    }
  }

  const pickerValue: PickedLocation | null =
    form.latitude != null && form.longitude != null
      ? { address: form.address, lat: form.latitude, lng: form.longitude }
      : null

  return (
    <div>
      <SectionHeading
        title={venue ? 'Edit Listing' : 'Create Listing'}
        subtitle="Tell remote workers what to expect and set your booking rules."
      />

      {/* Step indicator */}
      <ol className="mb-5 flex flex-wrap gap-2" aria-label="Listing steps">
        {STEPS.map((s, i) => {
          const active = i === stepIdx
          const done = i < stepIdx
          return (
            <li key={s.id}>
              <button
                type="button"
                onClick={() => goToStep(i)}
                aria-current={active ? 'step' : undefined}
                className={cn(
                  'inline-flex min-h-[40px] items-center gap-1.5 rounded-pill border px-3.5 font-sans text-[13px] font-medium transition-colors duration-fast',
                  active
                    ? 'border-dark bg-dark text-inverse'
                    : 'border-border-strong text-muted hover:border-primary hover:text-primary',
                )}
              >
                <span
                  className={cn(
                    'grid h-5 w-5 place-items-center rounded-pill font-mono text-[10px]',
                    active ? 'bg-inverse text-dark' : done ? 'bg-success text-inverse' : 'bg-surface-alt text-muted',
                  )}
                >
                  {done ? <Check size={12} /> : i + 1}
                </span>
                {s.label}
              </button>
            </li>
          )
        })}
      </ol>

      <StepCard>
        {step === 'basics' && (
          <>
            <Field label="Venue name">
              <TextInput value={form.name} onChange={(v) => set('name', v)} placeholder="e.g. Java House, Westgate" />
            </Field>
            <Field label="Neighbourhood">
              <TextInput
                value={form.neighbourhood}
                onChange={(v) => set('neighbourhood', v)}
                placeholder="e.g. Westlands"
              />
            </Field>
            <Field label="Type">
              <div className="flex flex-wrap gap-2">
                {SPOT_TYPE_OPTIONS.map((opt) => (
                  <Segment key={opt.value} active={form.type === opt.value} onClick={() => set('type', opt.value)}>
                    {opt.label}
                  </Segment>
                ))}
              </div>
            </Field>
            <Field label="Description">
              <textarea
                value={form.description}
                onChange={(e) => set('description', e.target.value)}
                rows={3}
                placeholder="What makes your space great for focused work?"
                className="w-full rounded-md border border-border bg-bg px-3 py-2.5 font-sans text-sm text-text outline-none focus:border-primary"
              />
            </Field>
          </>
        )}

        {step === 'location' && (
          <>
            <Field label="Pin your location">
              <LocationPicker value={pickerValue} onChange={handleLocation} />
            </Field>
            {form.address && (
              <p className="rounded-md bg-surface-alt px-3 py-2 font-sans text-[13px] text-text">
                📍 {form.address}
              </p>
            )}
            <Field label="Google Maps URL (optional)">
              <TextInput
                value={form.mapsUrl}
                onChange={(v) => set('mapsUrl', v)}
                placeholder="https://maps.google.com/…"
              />
            </Field>
          </>
        )}

        {step === 'conditions' && (
          <>
            <Field label="WiFi speed (Mbps)">
              <NumberInput value={form.wifiMbps} onChange={(v) => set('wifiMbps', v)} min={0} max={1000} />
            </Field>
            <Field label="Price to work">
              <TextInput
                value={form.priceEntry}
                onChange={(v) => set('priceEntry', v)}
                placeholder="e.g. Free entry · KES 300 min spend"
              />
            </Field>
            <Field label="Power sockets">
              <div className="flex flex-wrap gap-2">
                {SOCKET_OPTIONS.map((opt) => (
                  <Segment key={opt} active={form.sockets === opt} onClick={() => set('sockets', opt)}>
                    {opt}
                  </Segment>
                ))}
              </div>
            </Field>
            <Field label="Noise level">
              <div className="flex flex-wrap gap-2">
                {NOISE_OPTIONS.map((opt) => (
                  <Segment
                    key={opt.value}
                    active={form.noiseLevel === opt.value}
                    onClick={() => set('noiseLevel', opt.value)}
                  >
                    {opt.label}
                  </Segment>
                ))}
              </div>
            </Field>
          </>
        )}

        {step === 'photo' && (
          <Field label="Cover photo">
            <div className="flex items-center gap-4">
              <div
                className="h-24 w-40 shrink-0 overflow-hidden rounded-md border border-border"
                style={form.coverImageUrl ? undefined : { background: 'var(--color-surface-alt)' }}
              >
                {form.coverImageUrl && (
                  <img src={form.coverImageUrl} alt="Cover preview" className="h-full w-full object-cover" />
                )}
              </div>
              <div className="flex flex-col items-start gap-1.5">
                <label className="inline-flex min-h-[40px] cursor-pointer items-center rounded-pill border border-border-strong px-4 font-sans text-[13px] font-medium text-text transition-colors duration-fast hover:border-primary hover:text-primary">
                  {uploading ? 'Uploading…' : form.coverImageUrl ? 'Replace photo' : 'Upload photo'}
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    className="sr-only"
                    disabled={uploading}
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) void handleCoverUpload(file)
                      e.target.value = ''
                    }}
                  />
                </label>
                {form.coverImageUrl && (
                  <button
                    type="button"
                    onClick={() => set('coverImageUrl', null)}
                    className="font-sans text-[12px] text-muted underline decoration-border-strong underline-offset-2 hover:text-primary"
                  >
                    Remove
                  </button>
                )}
                <p className="font-mono text-[10px] text-light">JPG, PNG, or WebP · up to 5 MB</p>
              </div>
            </div>
          </Field>
        )}

        {step === 'booking' && (
          <>
            <div className="mb-1 flex items-center gap-2">
              <span className="rounded-pill bg-primary px-2 py-0.5 font-mono text-[9px] font-medium uppercase tracking-wide text-inverse">
                Premium
              </span>
              <p className="font-sans text-[12px] text-muted">Slot bookings require a paid plan.</p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Paystack discount rate (%)">
                <NumberInput
                  value={form.workpassDiscountPct}
                  onChange={(v) => set('workpassDiscountPct', v)}
                  min={0}
                  max={100}
                />
              </Field>
              <Field label="Max seats per slot">
                <NumberInput value={form.maxSeatsPerSlot} onChange={(v) => set('maxSeatsPerSlot', v)} min={1} max={500} />
              </Field>
              <Field label="Slot duration (hours)">
                <NumberInput value={form.slotDurationHours} onChange={(v) => set('slotDurationHours', v)} min={1} max={12} />
              </Field>
              <Field label="Advance booking window (days)">
                <NumberInput value={form.advanceBookingDays} onChange={(v) => set('advanceBookingDays', v)} min={1} max={60} />
              </Field>
            </div>
            <Field label="Available time slots">
              <div className="flex flex-wrap gap-2">
                {SLOT_CHOICES.map((slot) => (
                  <Segment key={slot} active={form.availableSlots.includes(slot)} onClick={() => toggleSlot(slot)}>
                    {slot}
                  </Segment>
                ))}
              </div>
            </Field>
          </>
        )}
      </StepCard>

      {error && (
        <p
          role="alert"
          className="mt-4 rounded-md p-3 font-sans text-[13px] text-primary"
          style={{ background: 'color-mix(in srgb, var(--color-primary) 12%, transparent)' }}
        >
          {error}
        </p>
      )}

      {/* Footer nav */}
      <div className="mt-6 flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={back}
          disabled={stepIdx === 0}
          className="inline-flex h-12 min-h-[44px] items-center justify-center rounded-pill border border-border-strong px-5 font-sans text-sm font-semibold text-text transition-colors duration-fast hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-40"
        >
          ← Back
        </button>

        {isLast ? (
          <button
            type="button"
            onClick={handleSave}
            disabled={upsert.isPending}
            className="inline-flex h-12 min-h-[44px] items-center justify-center rounded-pill bg-primary px-6 font-sans text-sm font-semibold text-inverse transition-opacity duration-fast hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-55"
          >
            {upsert.isPending ? 'Saving…' : venue ? 'Save changes' : 'Create listing'}
          </button>
        ) : (
          <button
            type="button"
            onClick={next}
            className="inline-flex h-12 min-h-[44px] items-center justify-center rounded-pill bg-dark px-6 font-sans text-sm font-semibold text-inverse transition-colors duration-fast hover:bg-dark-alt"
          >
            Next →
          </button>
        )}
      </div>
    </div>
  )
}

// ── Form primitives ────────────────────────────────────────────

function StepCard({ children }: { children: ReactNode }) {
  return (
    <section className="rounded-lg border border-border bg-surface p-5">
      <div className="space-y-4">{children}</div>
    </section>
  )
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <label className="mb-1.5 block font-mono text-[11px] uppercase tracking-[0.12em] text-light">
        {label}
      </label>
      {children}
    </div>
  )
}

function TextInput({
  value,
  onChange,
  placeholder,
}: {
  value: string
  onChange: (v: string) => void
  placeholder?: string
}) {
  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="h-11 w-full rounded-md border border-border bg-bg px-3 font-sans text-sm text-text outline-none focus:border-primary"
    />
  )
}

function NumberInput({
  value,
  onChange,
  min,
  max,
}: {
  value: number
  onChange: (v: number) => void
  min?: number
  max?: number
}) {
  return (
    <input
      type="number"
      inputMode="numeric"
      value={Number.isFinite(value) ? value : ''}
      min={min}
      max={max}
      onChange={(e) => onChange(e.target.value === '' ? 0 : Number(e.target.value))}
      className="h-11 w-full rounded-md border border-border bg-bg px-3 font-mono text-sm text-text outline-none focus:border-primary"
    />
  )
}

function Segment({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        'min-h-[40px] rounded-pill border px-4 py-2 font-sans text-[13px] font-medium transition-colors duration-fast',
        active
          ? 'border-dark bg-dark text-inverse'
          : 'border-border-strong text-muted hover:border-primary hover:text-primary',
      )}
    >
      {children}
    </button>
  )
}
