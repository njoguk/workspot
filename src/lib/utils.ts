import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * cn — merge conditional class names and de-duplicate conflicting
 * Tailwind utilities. Used by shadcn/ui components and throughout the app.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
