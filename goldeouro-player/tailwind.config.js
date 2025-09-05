/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'stadium-green': '#22c55e',
        'stadium-dark': '#1e293b',
        'gold': '#fbbf24',
        'goal-blue': '#1e40af',
      },
      backgroundImage: {
        'stadium': "url('/stadium-bg.jpg')",
        'field': "url('/field-bg.jpg')",
      }
    },
  },
  plugins: [],
}
