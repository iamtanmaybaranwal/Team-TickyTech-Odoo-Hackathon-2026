/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        accent: {
          DEFAULT: "#a855f7",
          light: "#c084fc",
          dark: "#7e22ce",
        },
        surface: {
          DEFAULT: "#0a0a0d",
          raised: "#131318",
          card: "#17171d",
          border: "#26262e",
        },
      },
    },
  },
  plugins: [],
};
