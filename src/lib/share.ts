/**
 * Share / invite helper (feedback round, Phase 4). Uses the native Web Share
 * sheet when available (mobile + some desktop) and falls back to copying a link
 * to the clipboard. Extracted from BookingConfirmPage so spots, events, and
 * bookings share one code path.
 */

export interface ShareInput {
  title: string
  text: string
  /** Defaults to the current page URL. */
  url?: string
}

export type ShareResult = 'shared' | 'copied' | 'dismissed' | 'failed'

export async function shareOrCopy(input: ShareInput): Promise<ShareResult> {
  const url = input.url ?? (typeof window !== 'undefined' ? window.location.href : '')

  if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
    try {
      await navigator.share({ title: input.title, text: input.text, url })
      return 'shared'
    } catch (e) {
      // The user dismissing the sheet is not an error — don't fall back to copy.
      if (e instanceof DOMException && e.name === 'AbortError') return 'dismissed'
      // Any other failure → try the clipboard.
    }
  }

  try {
    const toCopy = url ? `${input.text} ${url}`.trim() : input.text
    await navigator.clipboard.writeText(toCopy)
    return 'copied'
  } catch {
    return 'failed'
  }
}
