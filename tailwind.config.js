export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      colors: {
        cyber: {
          50: '#e6f7ff',
          100: '#b3e7ff',
          200: '#80d7ff',
          300: '#4dc7ff',
          400: '#00baff',
          500: '#00a3e0',
          600: '#008bbf',
          700: '#006d96',
          800: '#00506e',
          950: '#002535',
        },
      },
    },
  },
  plugins: [],
}
