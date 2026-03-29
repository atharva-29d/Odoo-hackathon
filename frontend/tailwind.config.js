/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#f7f3f7",
          100: "#ede4ec",
          200: "#dcc8d8",
          300: "#c3a2bc",
          400: "#a1779d",
          500: "#87567f",
          600: "#714b67",
          700: "#5f3e57",
          800: "#51374b",
          900: "#44303f"
        },
        accent: {
          50: "#eefbf8",
          100: "#d4f5ee",
          200: "#aeeadb",
          300: "#7fdac2",
          400: "#48c3a5",
          500: "#1ea486",
          600: "#14826b",
          700: "#126857",
          800: "#135247",
          900: "#123f39"
        },
        ink: "#0f172a",
        mist: "#f7f5f8",
        success: "#0f9f6e",
        warning: "#e7971c",
        danger: "#d64545"
      },
      boxShadow: {
        soft: "0 18px 42px rgba(68, 48, 63, 0.08)",
        float: "0 16px 34px rgba(135, 86, 127, 0.18)",
        sidebar: "0 22px 54px rgba(15, 23, 42, 0.12)"
      },
      backgroundImage: {
        hero: "linear-gradient(135deg, rgba(247, 243, 247, 1), rgba(237, 228, 236, 0.95) 48%, rgba(212, 245, 238, 0.9))",
        spotlight: "radial-gradient(circle at top left, rgba(135, 86, 127, 0.14), transparent 48%)"
      },
      borderRadius: {
        "2xl": "1.25rem"
      },
      fontFamily: {
        sans: ["Poppins", "Aptos", "Segoe UI", "sans-serif"]
      }
    }
  },
  plugins: []
};
