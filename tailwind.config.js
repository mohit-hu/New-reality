module.exports = {
  content: [
    "./index.html",
    "./*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}"
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        "brand-primary": "#4f46e5",
        "brand-secondary": "#10b981",
        "brand-light": "#f0f9ff",
        "brand-dark": "#1e293b",
        "brand-text": "#334155",
        "brand-text-light": "#64748b"
      },
      fontFamily: {
        sans: ["Inter", "sans-serif"]
      }
    }
  },
  plugins: []
};
