import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        sand: {
          50: '#FBF8F3',
          100: '#F5EFE4',
          200: '#EBDFC9',
          300: '#DCC9A3',
          400: '#C9AC7C',
        },
        ivory: {
          DEFAULT: '#FDFCF8',
          muted: '#F5F2EA',
          dark: '#F0EBE0',
        },
        forest: {
          DEFAULT: '#2C4A3E',
          light: '#3E6353',
          dark: '#1F352D',
          deep: '#182A22',
        },
        olive: '#6B7A5A',
        charcoal: {
          DEFAULT: '#1C1F1E',
          light: '#252927',
          elevated: '#2D3230',
          border: '#3A403D',
        },
      },
      fontFamily: {
        arabic: ['Cairo', 'Noto Sans Arabic', 'system-ui', 'sans-serif'],
        english: ['Inter', 'system-ui', 'sans-serif'],
      },
      screens: {
        xs: '380px',
      },
      boxShadow: {
        'soft': '0 1px 3px rgba(28, 31, 30, 0.06), 0 4px 16px rgba(28, 31, 30, 0.06)',
        'card': '0 1px 2px rgba(28, 31, 30, 0.05), 0 8px 24px rgba(28, 31, 30, 0.08)',
        'float': '0 8px 32px rgba(28, 31, 30, 0.16)',
      },
      transitionTimingFunction: {
        'soft': 'cubic-bezier(0.4, 0, 0.2, 1)',
      },
    },
  },
  plugins: [],
};

export default config;
