import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        sage: {
          50:  '#F0F5F2',
          100: '#E1EAE5',
          200: '#C3D5CA',
          300: '#8FAF9F',
          400: '#5D7A6C',
          500: '#3D5A4C',
          600: '#2E4439',
          700: '#1F2E27',
        },
        sand: {
          50:  '#FDFAF7',
          100: '#F8F5F0',
          200: '#F0EAE0',
          300: '#E5DDD0',
          400: '#D4C9B8',
        },
      },
      fontFamily: {
        sans: ['"Noto Sans JP"', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        'base': ['1.0625rem', { lineHeight: '1.7' }],
        'lg':   ['1.1875rem', { lineHeight: '1.6' }],
        'xl':   ['1.3125rem', { lineHeight: '1.5' }],
        '2xl':  ['1.5rem',    { lineHeight: '1.4' }],
        '3xl':  ['1.875rem',  { lineHeight: '1.3' }],
        '4xl':  ['2.25rem',   { lineHeight: '1.2' }],
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
        '4xl': '2rem',
      },
    },
  },
  plugins: [],
};

export default config;
