# Paystack + Edge Functions — Deployment Handoff

Phase 3 Part B wired real Paystack payments into the **booking** and **WorkPass
subscription** flows and shipped the **Venue Partner Portal**. The frontend is
done and builds clean. The steps below are the ones that need your credentials /
dashboard access and could not be run from the build session.

Until these are done, clicking **Confirm & Pay** (booking) or **Send M-Pesa
Request** (WorkPass) will show a clear error — the popup can't open without a
deployed `initialize-payment` function and the secret key.

---

## 1. Install + link the Supabase CLI

The CLI is installed as a **project dev dependency** (Supabase blocks global npm
installs, and this machine has no Homebrew), so every command is prefixed with
`npx`:

```bash
npm install supabase --save-dev           # already done — installs the CLI locally
```

```bash
npx supabase login                        # opens browser for your access token
```

```bash
npx supabase link --project-ref nfuojbaztkxidgaanbzc
```

> If `link` asks for a database password, press Enter to skip — it isn't needed
> for deploying functions.

## 2. Set the Paystack secret key (server-side only)

Never put the secret key in the frontend or `.env.local`. It lives only in
Supabase Edge Function secrets:

```bash
npx supabase secrets set PAYSTACK_SECRET_KEY=sk_test_xxxxxxxxxxxxxxxxxxxx
```

`SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are injected automatically by the
Edge runtime — you do **not** need to set those.

## 3. Deploy both functions

```bash
npx supabase functions deploy initialize-payment
```

```bash
npx supabase functions deploy paystack-webhook
```

`supabase/config.toml` already sets `verify_jwt = false` for the webhook (Paystack
calls it with no Supabase JWT — it is authenticated by the HMAC signature) and
`verify_jwt = true` for `initialize-payment` (called by the signed-in browser).

## 4. Register the webhook in Paystack

Paystack dashboard → **Settings → API Keys & Webhooks → Webhook URL**:

```
https://nfuojbaztkxidgaanbzc.supabase.co/functions/v1/paystack-webhook
```

Events: `charge.success`, `charge.failed`, `transfer.success`.

## 5. Confirm the public key is set

`.env.local` already has `VITE_PAYSTACK_PUBLIC_KEY=pk_test_…`. Add the same key to
**Vercel → Project → Environment Variables** so production has it too.

---

## 6. Sandbox test (Paystack Kenya M-Pesa)

1. Sign in, get a WorkPass, and book a slot (or buy a WorkPass).
2. In the Paystack popup choose **M-Pesa** and use:
   - Phone: `0708000000`
   - PIN: any 4 digits
   - OTP: any 6 digits
3. `charge.success` fires → the webhook confirms the booking / activates the pass.
4. Check **Paystack dashboard → Transactions** for the test charge, and the
   Supabase `bookings` / `profiles` rows for the updated status.

---

## How it fits together

- `src/lib/paystack.ts` — `initializePayment()` calls the Edge Function; `openPaystackPopup()` runs the inline popup.
- `supabase/functions/initialize-payment/` — creates the Paystack transaction (secret key), stores `paystack_reference` / `paystack_access_code` on the booking, returns the access code.
- `supabase/functions/paystack-webhook/` — verifies the HMAC signature, then on `charge.success` confirms the booking and (for subscriptions) sets `is_workpass` + `workpass_expires_at` on the profile using `metadata.user_id`.
- Booking flow: `BookingPage.tsx` creates a `pending` booking → initialise → popup → `/booking/:id/confirm` on success.
- Subscription flow: `WorkPassPage.tsx` initialise → popup → poll `profiles.is_workpass` (2s × up to 30s) → success screen.

## Partner Portal notes

- The listing editor and payout-number field write **real** owner-scoped rows
  (`spots` + `venue_settings`).
- Dashboard KPIs, charts and the bookings table use **deterministic demo data**
  (`src/lib/partner.ts`) because the `bookings` RLS policy only lets a user read
  their own rows. To make these real, add a `SECURITY DEFINER` RPC that returns
  bookings for a spot the caller owns, then swap `buildPartnerData()` for it.
