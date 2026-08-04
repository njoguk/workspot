import { useEffect } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { DEFAULT_DISCOUNT_PCT, DEFAULT_MAX_SEATS } from '@/lib/booking'
import type { Booking, BookingStatus, PaymentMethod } from '@/types'

/**
 * Booking data layer (Phase 3 monetisation, STEPS 5–7). All Supabase access
 * for slot bookings lives here; pages consume these hooks only.
 *
 * Note on occupancy: the `bookings` RLS policy scopes SELECT to a user's own
 * rows, so the live count reflects the bookings the current user can see for a
 * spot/date. A venue-wide public count would need a SECURITY DEFINER RPC — out
 * of scope for this phase. Reads default gracefully when nothing is visible.
 */

// ── Venue settings (booking config) ────────────────────────────

export interface VenueBookingSettings {
  maxSeatsPerSlot: number
  workpassDiscountPct: number
  advanceBookingDays: number
}

/** Booking config for a spot, defaulting when no readable venue_settings row. */
export function useVenueSettings(spotId: string | undefined) {
  return useQuery<VenueBookingSettings>({
    queryKey: ['venueSettings', spotId],
    enabled: Boolean(spotId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('venue_settings')
        .select('max_seats_per_slot, workpass_discount_pct, advance_booking_days')
        .eq('spot_id', spotId!)
        .maybeSingle()
      if (error) throw error
      const row = data as {
        max_seats_per_slot: number | null
        workpass_discount_pct: number | null
        advance_booking_days: number | null
      } | null
      return {
        maxSeatsPerSlot: row?.max_seats_per_slot ?? DEFAULT_MAX_SEATS,
        workpassDiscountPct: row?.workpass_discount_pct ?? DEFAULT_DISCOUNT_PCT,
        advanceBookingDays: row?.advance_booking_days ?? 7,
      }
    },
  })
}

// ── Slot occupancy for a spot + date ───────────────────────────

/** Confirmed-booking counts keyed by `slot_start` for one spot on one date. */
export function useSlotOccupancy(spotId: string | undefined, slotDate: string) {
  return useQuery<Record<string, number>>({
    queryKey: ['occupancy', spotId, slotDate],
    enabled: Boolean(spotId && slotDate),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('bookings')
        .select('slot_start')
        .eq('spot_id', spotId!)
        .eq('slot_date', slotDate)
        .eq('status', 'confirmed')
      if (error) throw error
      const counts: Record<string, number> = {}
      for (const row of (data as { slot_start: string }[]) ?? []) {
        counts[row.slot_start] = (counts[row.slot_start] ?? 0) + 1
      }
      return counts
    },
  })
}

// ── Create a booking ───────────────────────────────────────────

export interface CreateBookingInput {
  spotId: string
  slotDate: string
  slotStart: string
  slotEnd: string
  standardPrice: number
  pricePaid: number
  workpassDiscount: number
  paymentMethod: PaymentMethod
}

/** Insert a booking and return the created row (with its generated code). */
export function useCreateBooking() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  return useMutation<Booking, Error, CreateBookingInput>({
    mutationFn: async (input) => {
      if (!user) throw new Error('You need to be signed in to book.')
      // Payment is always collected via Paystack (M-Pesa/card). The booking is
      // created 'pending' and confirmed by the Session 6 payment webhook — no
      // money is held on the WorkPass itself (it only grants the discount).
      const status: BookingStatus = 'pending'
      const { data, error } = await supabase
        .from('bookings')
        .insert({
          user_id: user.id,
          spot_id: input.spotId,
          slot_date: input.slotDate,
          slot_start: input.slotStart,
          slot_end: input.slotEnd,
          price_paid: input.pricePaid,
          standard_price: input.standardPrice,
          workpass_discount: input.workpassDiscount,
          payment_method: input.paymentMethod,
          status,
        })
        .select('*')
        .single()
      if (error) throw error
      return data as Booking
    },
    onSuccess: (booking) => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] })
      queryClient.invalidateQueries({
        queryKey: ['occupancy', booking.spot_id, booking.slot_date],
      })
    },
  })
}

// ── A single booking (confirmation page) ───────────────────────

/** Spot fields joined onto a booking for the ticket / list rows. */
export interface BookingSpot {
  id: string
  name: string
  neighbourhood: string | null
  cover_gradient: string | null
  type: string
}

export interface BookingWithSpot extends Booking {
  spot: BookingSpot | null
}

const BOOKING_COLUMNS =
  'id, user_id, spot_id, slot_date, slot_start, slot_end, price_paid, standard_price, workpass_discount, payment_method, paystack_reference, paystack_access_code, status, booking_code, created_at, spot:spots(id, name, neighbourhood, cover_gradient, type)'

export function useBooking(bookingId: string | undefined) {
  return useQuery<BookingWithSpot | null>({
    queryKey: ['bookings', 'one', bookingId],
    enabled: Boolean(bookingId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('bookings')
        .select(BOOKING_COLUMNS)
        .eq('id', bookingId!)
        .maybeSingle()
      if (error) throw error
      return (data as unknown as BookingWithSpot | null) ?? null
    },
  })
}

// ── The current user's bookings (My Bookings) ──────────────────

export function useMyBookings() {
  const { user } = useAuth()
  const userId = user?.id
  return useQuery<BookingWithSpot[]>({
    queryKey: ['bookings', 'mine', userId],
    enabled: Boolean(userId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('bookings')
        .select(BOOKING_COLUMNS)
        .eq('user_id', userId!)
        .order('slot_date', { ascending: false })
        .order('slot_start', { ascending: false })
      if (error) throw error
      return (data as unknown as BookingWithSpot[]) ?? []
    },
  })
}

// ── Cancel a booking ───────────────────────────────────────────

export function useCancelBooking() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (bookingId: string) => {
      const { error } = await supabase
        .from('bookings')
        .update({ status: 'cancelled' })
        .eq('id', bookingId)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] })
    },
  })
}

// ── Live realtime refresh for occupancy ────────────────────────

/** Invalidate occupancy for a spot/date whenever bookings change. */
export function useOccupancyRealtime(spotId: string | undefined, slotDate: string) {
  const queryClient = useQueryClient()
  useEffect(() => {
    if (!spotId || !slotDate) return
    const channel = supabase
      .channel(`bookings:occupancy:${spotId}:${slotDate}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'bookings',
          filter: `spot_id=eq.${spotId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['occupancy', spotId, slotDate] })
        },
      )
      .subscribe()
    return () => {
      void supabase.removeChannel(channel)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [spotId, slotDate])
}
