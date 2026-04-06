/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      fontFamily: {
        sans: ['"IBM Plex Serif"', "Georgia", "ui-serif", "Times New Roman", "serif"],
        serif: ['"IBM Plex Serif"', "Georgia", "ui-serif", "Times New Roman", "serif"],
        mono: ["ui-monospace", "Cascadia Mono", "SFMono-Regular", "monospace"],
        base: ['"IBM Plex Serif"', "Georgia", "ui-serif", "Times New Roman", "serif"],
        heading: ['"IBM Plex Serif"', "Georgia", "ui-serif", "Times New Roman", "serif"],
        display: ['"Arial Black"', 'Arial', 'sans-serif'],
      },
      borderRadius: {
        none: "0",
        base: "var(--radius)",
        sm: "calc(var(--radius) - 4px)",
        DEFAULT: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        lg: "var(--radius)",
        xl: "var(--radius)",
        "2xl": "var(--radius)",
        "3xl": "var(--radius)",
        "4xl": "var(--radius)",
        full: "9999px",
      },
      spacing: {
        boxShadowX: "var(--neo-h)",
        boxShadowY: "var(--neo-v)",
        boxShadowPressX: "var(--neo-h-lg)",
        boxShadowPressY: "var(--neo-v-lg)",
        reverseBoxShadowX: "calc(-1 * var(--neo-h))",
        reverseBoxShadowY: "calc(-1 * var(--neo-v))",
      },
      colors: {
        // Fixed palette (raw values — use for accents, branding, badges)
        'ink':       '#0A0A0A',
        'slate':     '#1C1F26',
        'steel':     '#2E3440',
        'smoke':     '#3A3F4B',
        'ghost':     '#F0EFE9',
        'mist':      '#A8B0BC',
        'bone':      '#F5F0E8',
        'linen':     '#EAE4D9',
        'parchment': '#DDD7CB',
        'stone':     '#B5AFA6',
        'charcoal':  '#0A0A0A',
        'ash':       '#6B6560',
        'teal':      '#00E5CC',
        'amber':     '#FFB800',
        'red':       '#FF3B30',
        // Theme-aware semantic tokens (auto-switch with data-theme)
        'th-base':    'var(--bg-base)',
        'th-surface': 'var(--bg-surface)',
        'th-card':    'var(--bg-card)',
        'th-border':  'var(--border)',
        'th-text':    'var(--text-primary)',
        'th-muted':   'var(--text-secondary)',
        // Shadcn/UI semantic tokens
        border: "var(--border)",
        input: "var(--input)",
        ring: "var(--ring)",
        background: "var(--background)",
        foreground: "var(--foreground)",
        main: {
          DEFAULT: "var(--main)",
          foreground: "var(--main-foreground)",
        },
        "panel-blue": "var(--panel-blue)",
        "secondary-background": "var(--secondary-background)",
        overlay: "var(--overlay)",
        primary: {
          DEFAULT: "var(--primary)",
          foreground: "var(--primary-foreground)",
        },
        secondary: {
          DEFAULT: "var(--secondary)",
          foreground: "var(--secondary-foreground)",
        },
        destructive: {
          DEFAULT: "var(--destructive)",
          foreground: "var(--destructive-foreground)",
        },
        muted: {
          DEFAULT: "var(--muted)",
          foreground: "var(--muted-foreground)",
        },
        accent: {
          DEFAULT: "var(--accent)",
          foreground: "var(--accent-foreground)",
        },
        popover: {
          DEFAULT: "var(--popover)",
          foreground: "var(--popover-foreground)",
        },
        card: {
          DEFAULT: "var(--card)",
          foreground: "var(--card-foreground)",
        },
      },
      boxShadow: {
        'teal':       '4px 4px 0px #00E5CC',
        'amber':      '4px 4px 0px #FFB800',
        'card-dark':  '3px 3px 0px #3A3F4B',
        'card-light': '3px 3px 0px #B5AFA6',
        'card':       'var(--shadow-card)',
        neo: "var(--neo-shadow)",
        "neo-sm": "var(--neo-shadow-sm)",
        "neo-lg": "var(--neo-shadow-lg)",
        "neo-xl": "var(--neo-shadow-xl)",
        shadow: "var(--neo-shadow)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "pulse-soft": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.5" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "pulse-soft": "pulse-soft 2s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
