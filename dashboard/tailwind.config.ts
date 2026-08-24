import type { Config } from "tailwindcss";

export default {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        cyber: {
          dark: "#080c14",
          card: "#0d1424",
          border: "#1e293b",
          primary: "#38bdf8",
          secondary: "#818cf8",
          success: "#10b981",
          danger: "#ef4444",
          warning: "#f59e0b",
        },
      },
    },
  },
  plugins: [],
} satisfies Config;
