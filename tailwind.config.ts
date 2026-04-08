import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        pokemon: {
          yellow: '#FFCB05',
          blue: '#3B4CCA',
          red: '#CC0000',
          dark: '#1a1a2e',
          darker: '#16213e',
          darkest: '#0f0f1a',
        },
      },
    },
  },
  plugins: [],
}
export default config
