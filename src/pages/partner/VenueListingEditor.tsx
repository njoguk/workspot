import { useState, type ReactNode } from 'react'
import { useToast } from '@/contexts/ToastContext'
import { useUpsertVenue, type PartnerVenue, type VenueFormInput } from '@/hooks/useVenue'
import { SLOT_CHOICES, SPOT_TYPE_OPTIONS } from '@/lib/partner'
import { SectionHeading } from '@/components/partner/partner-ui'
import { cn } from '@/lib/utils'
import type { NoiseLevel, SocketAvailability, SpotType } from '@/types'

/**
 * Listing editor (STEP 10). Writes REAL data: it UPSERTs the owner's spot and
 * venue_settings rows (both permitted by RLS for the owner). Section 3 is
 * accent-bordered to flag that slot bookings are a premium capability.
 */

const SOCKET_OPTIONS: SocketAvailability[] = ['Excellent', 'Good', 'Moderate', 'Scarce']
const NOISE_OPTIONS: { value: NoiseLevel; label: string }[] = [
  { value: 1, label: 'Quiet' },
  { value: 2, label: 'Moderate' },
  { value: 3, label: 'Loud' },
]

interface FormState {
  name: string
  neighbourhood: string
  type: SpotType
  mapsUrl: string
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
  onSaved?: () => void
}) {
  const { showToast } = useToast()
  const upsert = useUpsertVenue()
  const [form, setForm] = useState<FormState>(() => initialState(venue))
  const [error, setError] = useState<string | null>(null)

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

  async function handleSave() {
    if (!form.name.trim() || !form.neighbourhood.trim()) {
      setError('Venue name and neighbourhood are required.')
      return
    }
    setError(null)
    const input: VenueFormInput = { ...form, spotId: venue?.spotId ?? null }
    try {
      await upsert.mutateAsync(input)
      showToast(venue ? 'Listing updated' : 'Listing created', { icon: '✅' })
      onSaved?.()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save — please try again.')
    }
  }

  return (
    <div>
      <SectionHeading
        title={venue ? 'Edit Listing' : 'Create Listing'}
        subtitle="Tell remote workers what to expect and set your booking rules."
      />

      {/* Section 1 — Basic Info */}
      <FormSection title="Basic info">
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
              <Segment
                key={opt.value}
                active={form.type === opt.value}
                onClick={() => set('type', opt.value)}
              >
                {opt.label}
              </Segment>
            ))}
          </div>
        </Field>
        <Field label="Google Maps URL">
          <TextInput
            value={form.mapsUrl}
            onChange={(v) => set('mapsUrl', v)}
            placeholder="https://maps.google.com/…"
          />
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
      </FormSection>

      {/* Section 2 — Work Conditions */}
      <FormSection title="Work conditions">
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
      </FormSection>

      {/* Section 3 — Booking Settings (premium, accent border) */}
      <FormSection title="Booking settings" premium>
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
      </FormSection>

      {error && (
        <p
          role="alert"
          className="mt-4 rounded-md p-3 font-sans text-[13px] text-primary"
          style={{ background: 'color-mix(in srgb, var(--color-primary) 12%, transparent)' }}
        >
          {error}
        </p>
      )}

      <div className="mt-6">
        <button
          type="button"
          onClick={handleSave}
          disabled={upsert.isPending}
          className="inline-flex h-12 min-h-[44px] items-center justify-center rounded-pill bg-primary px-6 font-sans text-sm font-semibold text-inverse transition-opacity duration-fast hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-55"
        >
          {upsert.isPending ? 'Saving…' : venue ? 'Save changes' : 'Create listing'}
        </button>
      </div>
    </div>
  )
}

// ── Form primitives ────────────────────────────────────────────

function FormSection({
  title,
  premium,
  children,
}: {
  title: string
  premium?: boolean
  children: ReactNode
}) {
  return (
    <section
      className={cn(
        'mt-5 rounded-lg bg-surface p-5',
        premium ? 'border-2 border-primary' : 'border border-border',
      )}
    >
      <div className="mb-4 flex items-center gap-2">
        <h3 className="font-display text-lg font-bold text-text">{title}</h3>
        {premium && (
          <span className="rounded-pill bg-primary px-2 py-0.5 font-mono text-[9px] font-medium uppercase tracking-wide text-inverse">
            Premium
          </span>
        )}
      </div>
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
