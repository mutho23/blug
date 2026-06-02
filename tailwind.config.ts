import type {Config} from 'tailwindcss'

export default {
  content: ['./app/**/{**,.client,.server}/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          'ui-sans-serif',
          'system-ui',
          '-apple-system',
          'BlinkMacSystemFont',
          '"Segoe UI"',
          'Roboto',
          '"Helvetica Neue"',
          'Arial',
          'sans-serif',
        ],
        display: [
          'Literata',
          'Georgia',
          'ui-serif',
          'serif',
        ],
        mono: [
          '"Recursive Mono"',
          '"Fira Code"',
          '"JetBrains Mono"',
          'ui-monospace',
          'monospace',
        ],
      },
      colors: {
        0: 'hsl(0, 0%, 4%)',
        50: 'hsl(0, 0%, 8%)',
        100: 'hsl(0, 0%, 12%)',
        200: 'hsl(0, 0%, 18%)',
        300: 'hsl(0, 0%, 28%)',
        400: 'hsl(0, 0%, 42%)',
        500: 'hsl(0, 0%, 55%)',
        600: 'hsl(0, 0%, 70%)',
        700: 'hsl(0, 0%, 80%)',
        800: 'hsl(0, 0%, 88%)',
        900: 'hsl(0, 0%, 93%)',
        950: 'hsl(0, 0%, 97%)',
      },
    },
  },
  plugins: [],
} satisfies Config
