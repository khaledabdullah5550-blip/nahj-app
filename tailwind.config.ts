import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          dark: '#0d2b3e',
          DEFAULT: '#1a5276',
          light: '#2874a6',
        },
        danger: '#c0392b',
        warning: '#e67e22',
        success: '#16a085',
      },
      fontFamily: {
        arabic: ['Tajawal', 'Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
}

export default config
