/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#f8f3f9",
          100: "#efe2f1",
          200: "#dec1e2",
          300: "#c795cb",
          400: "#b16caf",
          500: "#975391",
          600: "#7c4176",
          700: "#65355f",
          800: "#552f4f",
          900: "#3b1f35"
        },
        ink: "#111827",
        mist: "#eff3f8",
        success: "#0f9f6e",
        warning: "#e7971c",
        danger: "#d64545"
      },
      boxShadow: {
        soft: "0 16px 40px rgba(15, 23, 42, 0.08)",
        sidebar: "0 24px 50px rgba(52, 64, 84, 0.16)"
      },
      backgroundImage: {
        hero: "linear-gradient(135deg, rgba(124, 65, 118, 0.96), rgba(37, 99, 235, 0.82))"
      },
      borderRadius: {
        "2xl": "1.25rem"
      },
      fontFamily: {
        sans: ["Trebuchet MS", "Segoe UI", "sans-serif"]
      }
    }
  },
  plugins: []
};
