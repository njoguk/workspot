/**
 * Paystack client helpers (Phase 3 Part B, STEP 1 + 4 + 5).
 *
 * Paystack is the payment gateway for both slot bookings and WorkPass
 * subscriptions — it handles the full M-Pesa STK-push flow (and cards) inside
 * its own popup, so the frontend never touches Safaricom Daraja directly.
 *
 * Flow:
 *   1. `initializePayment()` calls the `initialize-payment` Edge Function, which
 *      talks to Paystack server-side (secret key) and returns an access code.
 *   2. `openPaystackPopup()` resumes that transaction in the inline popup.
 *   3. On success Paystack fires our `paystack-webhook` Edge Function, which
 *      confirms the booking / activates the membership.
 */

import Paystack from '@paystack/inline-js'
import { supabase } from '@/lib/supabase'

/** Public key (pk_test_… / pk_live_…). Safe to expose in the browser. */
export const PAYSTACK_PUBLIC_KEY = import.meta.env.VITE_PAYSTACK_PUBLIC_KEY

export type PaymentType = 'booking' | 'subscription_monthly' | 'subscription_annual'

export interface InitPaymentInput {
  /** Amount in whole KES — the Edge Function converts to the smallest unit. */
  amountKes: number
  email: string
  paymentType: PaymentType
  /** Set for `payment_type: 'booking'`; null for subscriptions. */
  bookingId?: string | null
  /** M-Pesa number in "07XXXXXXXX" form. Optional — the popup can collect it. */
  phoneNumber?: string | null
  /** Used by the webhook to activate the right member on subscription payments. */
  userId?: string | null
}

export interface InitPaymentResult {
  access_code: string
  reference: string
}

/**
 * Ask the Edge Function to initialise a Paystack transaction. Throws with a
 * user-facing message when the function is unreachable (e.g. not deployed yet)
 * or Paystack rejects the request.
 */
export async function initializePayment(input: InitPaymentInput): Promise<InitPaymentResult> {
  const { data, error } = await supabase.functions.invoke<InitPaymentResult>(
    'initialize-payment',
    {
      body: {
        amount_kes: input.amountKes,
        email: input.email,
        payment_type: input.paymentType,
        booking_id: input.bookingId ?? null,
        phone_number: input.phoneNumber ?? null,
        user_id: input.userId ?? null,
      },
    },
  )
  if (error) throw new Error(error.message || 'Payment could not be started.')
  if (!data?.access_code || !data?.reference) {
    throw new Error('Payment could not be started. Please try again.')
  }
  return { access_code: data.access_code, reference: data.reference }
}

export interface CheckoutCallbacks {
  /** Fired once the customer completes payment in the popup. */
  onSuccess: (reference: string) => void
  /** Fired when the customer dismisses the popup without paying. */
  onCancel?: () => void
  /** Fired when the popup itself fails to load. */
  onError?: (message: string) => void
}

/**
 * Open the Paystack inline popup for a previously-initialised transaction.
 * The popup manages the M-Pesa STK push / card entry and closes itself on
 * success, cancel, or error — no polling of the popup required.
 */
export function openPaystackPopup(accessCode: string, callbacks: CheckoutCallbacks): void {
  const paystack = new Paystack()
  paystack.resumeTransaction(accessCode, {
    onSuccess: (tx) => callbacks.onSuccess(tx.reference),
    onCancel: () => callbacks.onCancel?.(),
    onError: (err) => callbacks.onError?.(err.message),
  })
}
