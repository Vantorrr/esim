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
        primary: {
          DEFAULT: '#0080FF',
          dark: '#0060DD',
          light: '#40A0FF',
        },
        secondary: {
          DEFAULT: '#FF8534',
          dark: '#FF6600',
          light: '#FFA666',
        },
        background: '#F0F7FF',
        text: {
          primary: '#143E66',
          secondary: '#2F5278',
        },
      },
      backgroundImage: {
        'gradient-primary': 'linear-gradient(135deg, #0080FF 0%, #0060DD 100%)',
        'gradient-secondary': 'linear-gradient(135deg, #FF8534 0%, #FF6600 100%)',
        'gradient-wave': 'linear-gradient(135deg, #FFA666 0%, #FF8534 50%, #FF6600 100%)',
      },
    },
  },
  plugins: [],
}

