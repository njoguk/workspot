/**
 * Kenyan mobile-number helpers, shared by the WorkPass subscription flow and
 * the slot-booking payment step. Pure functions — no React, no Supabase.
 *
 * Display format: "+254 7XX XXX XXX". Paystack expects an M-Pesa number in the
 * local "07XXXXXXXX" form, so `toPaystackPhone` converts back out.
 */

/** Normalise arbitrary input to the display form "+254 7XX XXX XXX". */
export function formatKenyanPhone(input: string): string {
  let digits = input.replace(/\D/g, '')
  if (digits.startsWith('254')) digits = digits.slice(3)
  if (digits.startsWith('0')) digits = digits.slice(1)
  digits = digits.slice(0, 9)
  const groups = [digits.slice(0, 3), digits.slice(3, 6), digits.slice(6, 9)].filter(Boolean)
  return groups.length ? `+254 ${groups.join(' ')}` : '+254 '
}

/** True for a complete Kenyan mobile number (9 subscriber digits starting 7 or 1). */
export function isValidKenyanPhone(formatted: string): boolean {
  const digits = formatted.replace(/\D/g, '').replace(/^254/, '')
  return digits.length === 9 && /^[17]/.test(digits)
}

/**
 * Convert a display number to the "07XXXXXXXX" form Paystack's mobile-money
 * (M-Pesa) channel expects. Returns null when the input is not a valid number.
 */
export function toPaystackPhone(formatted: string): string | null {
  if (!isValidKenyanPhone(formatted)) return null
  const digits = formatted.replace(/\D/g, '').replace(/^254/, '')
  return `0${digits}`
}
