/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['DM Sans', 'sans-serif'],
        display: ['Sora', 'sans-serif'],
      },
      colors: {
        ink: {
          DEFAULT: '#0D1117',
          2: '#1C2333',
          3: '#374151',
        },
        muted: '#6B7280',
        line: '#E5E7EB',
        bg: '#F7F8FC',
      },
    },
  },
  plugins: [],
}
