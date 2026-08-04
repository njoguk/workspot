// deno-lint-ignore-file no-explicit-any
/**
 * paystack-webhook — Phase 3 Part B, STEP 3.
 *
 * Paystack calls this server-to-server after a transaction settles. It is not
 * authenticated with a Supabase JWT (verify_jwt=false in config.toml); instead
 * it is verified by re-computing the HMAC-SHA512 of the raw body with the
 * Paystack secret key and comparing it to the x-paystack-signature header.
 *
 * On charge.success:
 *   - confirm the booking matching data.reference
 *   - if payment_type includes 'subscription', activate the member's WorkPass
 * On charge.failed:
 *   - mark the booking payment_failed
 * Always responds 200 to a valid webhook (401 only on a bad signature).
 *
 * Deploy: supabase functions deploy paystack-webhook
 * Register the URL in Paystack: Settings → API Keys & Webhooks →
 *   https://<project-ref>.supabase.co/functions/v1/paystack-webhook
 *   Events: charge.success, charge.failed, transfer.success
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

const PAYSTACK_SECRET_KEY = Deno.env.get('PAYSTACK_SECRET_KEY') ?? ''
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? ''
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''

const encoder = new TextEncoder()

/** Constant-time string comparison to avoid signature timing leaks. */
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let mismatch = 0
  for (let i = 0; i < a.length; i++) mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return mismatch === 0
}

/** HMAC-SHA512(rawBody, secret) as lowercase hex. */
async function computeSignature(rawBody: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(PAYSTACK_SECRET_KEY),
    { name: 'HMAC', hash: 'SHA-512' },
    false,
    ['sign'],
  )
  const mac = await crypto.subtle.sign('HMAC', key, encoder.encode(rawBody))
  return [...new Uint8Array(mac)].map((b) => b.toString(16).padStart(2, '0')).join('')
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 })

  const raw = await req.text()
  const signature = req.headers.get('x-paystack-signature') ?? ''

  // 1. Verify authenticity.
  if (!PAYSTACK_SECRET_KEY || !signature) {
    return new Response('Missing signature', { status: 401 })
  }
  const expected = await computeSignature(raw)
  if (!timingSafeEqual(expected, signature)) {
    return new Response('Invalid signature', { status: 401 })
  }

  // 2. Parse the event.
  let payload: any
  try {
    payload = JSON.parse(raw)
  } catch {
    return new Response('OK', { status: 200 }) // don't make Paystack retry a bad body
  }

  const event: string | undefined = payload?.event
  const data: any = payload?.data ?? {}
  const reference: string | undefined = data.reference
  const metadata: any = data.metadata ?? {}
  const paymentType: string | undefined = metadata.payment_type
  const userId: string | undefined = metadata.user_id

  const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY)

  // 3. Handle the events we care about. Any failure is logged but we still 200
  //    so Paystack does not hammer us with retries for a transient DB issue.
  try {
    if (event === 'charge.success') {
      if (reference) {
        await admin.from('bookings').update({ status: 'confirmed' }).eq('paystack_reference', reference)
      }
      if (paymentType && paymentType.includes('subscription') && userId) {
        const expires = new Date()
        if (paymentType === 'subscription_annual') {
          expires.setFullYear(expires.getFullYear() + 1)
        } else {
          expires.setMonth(expires.getMonth() + 1)
        }
        await admin
          .from('profiles')
          .update({ is_workpass: true, workpass_expires_at: expires.toISOString() })
          .eq('id', userId)
      }
    } else if (event === 'charge.failed') {
      if (reference) {
        await admin.from('bookings').update({ status: 'payment_failed' }).eq('paystack_reference', reference)
      }
    }
    // transfer.success (payouts) and other events: acknowledged, no action here.
  } catch (err) {
    console.error('[paystack-webhook] handler error', err)
  }

  return new Response('OK', { status: 200 })
})
