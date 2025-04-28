/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
      "./src/**/*.{js,jsx,ts,tsx}",
    ],
    theme: {
      extend: {
        colors: {
          primary: "#5F55F2",
          secondary: "#36225D",
          accent: "#FD8549",
          light: "#F8F8FC",
          dark: "#1A1A2E"
        },
        fontFamily: {
          sans: ['Inter', 'sans-serif'],
        },
      },
    },
    plugins: [],
  }