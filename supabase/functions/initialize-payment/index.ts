// deno-lint-ignore-file no-explicit-any
/**
 * initialize-payment — Phase 3 Part B, STEP 2.
 *
 * Called from the browser (with the signed-in user's JWT) to start a Paystack
 * transaction server-side using the secret key. Paystack returns an access code
 * that the frontend hands to the inline popup, which runs the M-Pesa STK push
 * or card flow. For bookings we also stash the reference + access code on the
 * bookings row so the webhook can find it later.
 *
 * Request body:
 *   { amount_kes, email, booking_id, payment_type, phone_number, user_id }
 *   payment_type: 'booking' | 'subscription_monthly' | 'subscription_annual'
 *
 * Response: { access_code, reference }
 *
 * Deploy: supabase functions deploy initialize-payment
 * Secret:  PAYSTACK_SECRET_KEY must be set (supabase secrets set …).
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'
import { corsHeaders } from '../_shared/cors.ts'

const PAYSTACK_SECRET_KEY = Deno.env.get('PAYSTACK_SECRET_KEY') ?? ''
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? ''
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405)

  if (!PAYSTACK_SECRET_KEY) {
    return json({ error: 'PAYSTACK_SECRET_KEY is not configured' }, 500)
  }

  let payload: any
  try {
    payload = await req.json()
  } catch {
    return json({ error: 'Invalid JSON body' }, 400)
  }

  const { amount_kes, email, booking_id, payment_type, phone_number, user_id } = payload ?? {}

  const amount = Math.round(Number(amount_kes) * 100) // Paystack expects the smallest unit
  if (!email || !Number.isFinite(amount) || amount <= 0 || !payment_type) {
    return json({ error: 'email, amount_kes and payment_type are required' }, 400)
  }

  // Build the Paystack initialize request.
  const paystackBody: Record<string, unknown> = {
    email,
    amount,
    currency: 'KES',
    channels: ['mobile_money', 'card'],
    metadata: {
      booking_id: booking_id ?? null,
      payment_type,
      user_id: user_id ?? null,
    },
  }
  // Only attach mobile_money when a phone was supplied — otherwise let the popup
  // collect it (Paystack rejects an empty phone).
  if (phone_number) {
    paystackBody.mobile_money = { phone: phone_number, provider: 'mpesa' }
  }

  let paystackJson: any
  try {
    const res = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(paystackBody),
    })
    paystackJson = await res.json()
    if (!res.ok || !paystackJson?.status) {
      return json(
        { error: paystackJson?.message ?? 'Paystack initialization failed' },
        502,
      )
    }
  } catch (err) {
    console.error('[initialize-payment] Paystack request failed', err)
    return json({ error: 'Could not reach Paystack' }, 502)
  }

  const { access_code, reference } = paystackJson.data ?? {}
  if (!access_code || !reference) {
    return json({ error: 'Paystack returned no access code' }, 502)
  }

  // Persist reference + access code on the booking so the webhook can match it.
  if (booking_id && SUPABASE_URL && SERVICE_ROLE_KEY) {
    const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY)
    const { error } = await admin
      .from('bookings')
      .update({ paystack_reference: reference, paystack_access_code: access_code })
      .eq('id', booking_id)
    if (error) {
      console.error('[initialize-payment] could not update booking', error.message)
      // Non-fatal: the webhook can still confirm by reference from metadata.
    }
  }

  return json({ access_code, reference })
})
