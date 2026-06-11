import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: ['class'],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  prefix: '',
  theme: {
    container: {
      center: true,
      padding: '2rem',
      screens: { '2xl': '1400px' },
    },
    extend: {
      /* ── Fonts ── */
      fontFamily: {
        sans:    ['Cairo', 'Tajawal', 'Inter', 'sans-serif'],
        display: ['Cairo', 'Tajawal', 'sans-serif'],
        mono:    ['JetBrains Mono', 'Fira Code', 'monospace'],
      },

      /* ── Design Token Colors ── */
      colors: {
        border:     'hsl(var(--border))',
        input:      'hsl(var(--input))',
        ring:       'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',

        primary: {
          DEFAULT:    'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
          light:      'hsl(var(--primary-light))',
          glow:       'hsl(var(--primary-glow))',
        },
        secondary: {
          DEFAULT:    'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT:    'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        success: {
          DEFAULT:    'hsl(var(--success))',
          foreground: 'hsl(var(--success-foreground))',
        },
        warning: {
          DEFAULT:    'hsl(var(--warning))',
          foreground: 'hsl(var(--warning-foreground))',
        },
        muted: {
          DEFAULT:    'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT:    'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        popover: {
          DEFAULT:    'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT:    'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },

        /* Egyptian brand palette */
        egypt: {
          gold:  '#C5A028',
          blue:  '#1B4F72',
          mid:   '#2471A3',
          red:   '#C0392B',
          green: '#1E8449',
          sand:  '#F5ECD7',
          light: '#EBF5FB',
        },

        /* Gamification palette */
        xp:       { gold: '#F59E0B', light: '#FCD34D' },
        streak:   { fire: '#F97316', dim: '#FED7AA' },
        level:    { purple: '#8B5CF6' },
        challenge:{ rose: '#E11D48' },
      },

      /* ── Border Radius ── */
      borderRadius: {
        none: '0',
        sm:   '0.5rem',
        DEFAULT: '0.75rem',
        md:   '0.75rem',
        lg:   '0.9rem',
        xl:   '1.25rem',
        '2xl':'1.5rem',
        '3xl':'2rem',
        '4xl':'2.5rem',
        full: '9999px',
      },

      /* ── Spacing extras ── */
      spacing: {
        '18': '4.5rem',
        '22': '5.5rem',
        '30': '7.5rem',
        '88': '22rem',
      },

      /* ── Keyframes ── */
      keyframes: {
        /* Accordion */
        'accordion-down': {
          from: { height: '0' },
          to:   { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to:   { height: '0' },
        },

        /* Page transitions */
        fadeIn: {
          from: { opacity: '0', transform: 'translateY(10px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        slideUp: {
          from: { opacity: '0', transform: 'translateY(24px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        slideIn: {
          from: { opacity: '0', transform: 'translateX(16px)' },
          to:   { opacity: '1', transform: 'translateX(0)' },
        },
        pop: {
          from: { opacity: '0', transform: 'scale(0.8)' },
          to:   { opacity: '1', transform: 'scale(1)' },
        },
        scaleIn: {
          from: { transform: 'scale(0.92)', opacity: '0' },
          to:   { transform: 'scale(1)',    opacity: '1' },
        },

        /* Loaders */
        shimmer: {
          '0%':   { backgroundPosition:  '200% 0' },
          '100%': { backgroundPosition: '-200% 0' },
        },
        spin: {
          from: { transform: 'rotate(0deg)'  },
          to:   { transform: 'rotate(360deg)'},
        },

        /* Gamification */
        xpShimmer: {
          '0%':   { backgroundPosition: '-200% center' },
          '100%': { backgroundPosition:  '200% center' },
        },
        streakPulse: {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(249,115,22,0)' },
          '50%':      { boxShadow: '0 0 16px 4px rgba(249,115,22,0.35)' },
        },
        glowPulse: {
          '0%, 100%': { opacity: '0.6' },
          '50%':      { opacity: '1'   },
        },
        notifBounce: {
          '0%, 100%': { transform: 'scale(1)'    },
          '50%':      { transform: 'scale(1.15)' },
        },
      },

      /* ── Animation shortcuts ── */
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up':   'accordion-up 0.2s ease-out',
        'fade-in':        'fadeIn 0.35s ease both',
        'slide-up':       'slideUp 0.4s ease both',
        'slide-in':       'slideIn 0.35s ease both',
        'pop':            'pop 0.3s cubic-bezier(0.34,1.56,0.64,1) both',
        'scale-in':       'scaleIn 0.25s cubic-bezier(0.34,1.56,0.64,1) both',
        'shimmer':        'shimmer 1.6s ease-in-out infinite',
        'xp-shimmer':     'xpShimmer 2s linear infinite',
        'streak-glow':    'streakPulse 2.5s ease-in-out infinite',
        'glow-pulse':     'glowPulse 2s ease-in-out infinite',
        'notif-bounce':   'notifBounce 2s ease-in-out infinite',
      },

      /* ── Box shadows ── */
      boxShadow: {
        'glow-primary': '0 0 24px -4px hsl(213 72% 42% / 0.35)',
        'glow-gold':    '0 0 24px -4px hsl(40 85% 50% / 0.40)',
        'glow-fire':    '0 0 20px -4px hsl(25 90% 55% / 0.45)',
        'glow-indigo':  '0 0 24px -4px rgba(99,102,241,0.50)',
        'card':         '0 2px 8px -1px rgb(0 0 0 / 0.08), 0 1px 3px -1px rgb(0 0 0 / 0.04)',
        'card-hover':   '0 8px 24px -4px rgb(0 0 0 / 0.12), 0 4px 8px -4px rgb(0 0 0 / 0.06)',
      },

      /* ── Backdrop blur ── */
      backdropBlur: {
        xs: '2px',
        sm: '6px',
        md: '12px',
        lg: '20px',
        xl: '32px',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
}

export default config
