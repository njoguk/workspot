import type { Config } from 'tailwindcss'
import animate from 'tailwindcss-animate'

/**
 * Tailwind config is the bridge from design tokens (src/styles/tokens.css)
 * to utility classes. Every value here maps to a CSS Custom Property —
 * NEVER a hardcoded hex. To reskin the product, edit tokens.css only.
 * See docs/DESIGN_SYSTEM.md for the source of truth.
 */
const config: Config = {
  darkMode: ['class', '[data-theme="dark"]'],
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Brand
        primary: 'var(--color-primary)',
        secondary: 'var(--color-secondary)',
        success: 'var(--color-success)',
        info: 'var(--color-info)',

        // Surfaces
        bg: 'var(--color-bg)',
        surface: 'var(--color-surface)',
        'surface-alt': 'var(--color-surface-alt)',
        'surface-tint': 'var(--color-surface-tint)',
        sand: 'var(--color-surface-sand)',

        // Dark
        dark: 'var(--color-dark)',
        'dark-alt': 'var(--color-dark-alt)',

        // Text
        text: 'var(--color-text)',
        muted: 'var(--color-text-muted)',
        light: 'var(--color-text-light)',
        inverse: 'var(--color-text-inverse)',

        // Borders (tokens exist in tokens.css; exposed here for border-* utilities)
        border: 'var(--color-border)',
        'border-strong': 'var(--color-border-strong)',
      },
      fontFamily: {
        display: ['var(--font-display)'],
        sans: ['var(--font-body)'],
        mono: ['var(--font-mono)'],
      },
      borderRadius: {
        sm: 'var(--radius-sm)',
        md: 'var(--radius-md)',
        lg: 'var(--radius-lg)',
        xl: 'var(--radius-xl)',
        pill: 'var(--radius-pill)',
      },
      boxShadow: {
        sm: 'var(--shadow-sm)',
        md: 'var(--shadow-md)',
        lg: 'var(--shadow-lg)',
        xl: 'var(--shadow-xl)',
      },
      transitionDuration: {
        fast: 'var(--duration-fast)',
        normal: 'var(--duration-normal)',
        slow: 'var(--duration-slow)',
      },
      maxWidth: {
        content: 'var(--max-width)',
      },
    },
  },
  plugins: [animate],
}

export default config
