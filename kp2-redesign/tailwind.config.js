/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#8B5E3C',
        'primary-dark': '#6D462B',
        'primary-light': '#A67C52',
        secondary: '#1A1A1A',
        accent: '#D4AF37',
      },
      fontFamily: {
        heading: ['Cinzel', 'serif'],
        body: ['Raleway', 'sans-serif'],
      },
    },
  },
  plugins: [],
}

