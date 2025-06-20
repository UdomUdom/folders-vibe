import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        'base-100': 'oklch(95.127% 0.007 260.731)',
        'base-200': 'oklch(87.18% 0.013 259.63)',
        'base-300': 'oklch(79.35% 0.018 259.07)',
        'base-content': 'oklch(26.8% 0.023 259.1)',
        'primary': 'oklch(71.63% 0.191 274.77)',
        'primary-content': 'oklch(99.23% 0.005 274.77)',
        'secondary': 'oklch(74.4% 0.161 23.9)',
        'secondary-content': 'oklch(16.6% 0.023 23.9)',
        'accent': 'oklch(75.2% 0.186 160.04)',
        'accent-content': 'oklch(99.1% 0.006 160.04)',
        'neutral': 'oklch(54.6% 0.023 258.8)',
        'neutral-content': 'oklch(97.9% 0.006 258.8)',
        'info': 'oklch(80.3% 0.123 220.0)',
        'info-content': 'oklch(21.5% 0.033 220.0)',
        'success': 'oklch(75.2% 0.169 150.0)',
        'success-content': 'oklch(14.5% 0.029 150.0)',
        'warning': 'oklch(81.0% 0.161 80.0)',
        'warning-content': 'oklch(26.5% 0.031 80.0)',
        'error': 'oklch(70.0% 0.218 25.0)',
        'error-content': 'oklch(98.5% 0.005 25.0)'
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic":
          "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
      },
    },
  },
  plugins: [],
};
export default config;
