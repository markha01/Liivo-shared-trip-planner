/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#A878F8',
        accent: '#2192D9',
        lime: '#BEE65F',
        powder: '#B2DBF7',
        'dark-bg': '#0D0D1A',
        'dark-surface': '#141428',
        'dark-card': '#1C1C35',
        'dark-border': '#2A2A4A',
      },
    },
  },
  plugins: [],
}
