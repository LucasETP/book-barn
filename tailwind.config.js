/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        barn: {
          brown: "#8B4513",
          dark: "#654321",
          light: "#D2B48C",
          cream: "#F5E6D3",
          red: "#A0522D",
        },
      },
      fontFamily: {
        sans: ["system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
