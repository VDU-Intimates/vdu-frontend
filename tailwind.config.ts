import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class", // ✅ Enables class-based dark mode (controlled via ThemeSwitcher)
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        beige: "#F5EEDF", // light background
        "light-green": "#234F2C", // accent color
        "soft-yellow": "#FAF3E0", // soft UI background
        "soft-brown": "#CBB58B", // neutral tan
        // Optional darker shades for dark mode harmony
        dark: {
          bg: "#121212",
          card: "#1E1E1E",
          border: "#2D2D2D",
          text: "#EAEAEA",
          accent: "#4ADE80", // emerald-green accent
        },
      },
    },
  },
  plugins: [],
};

export default config;
