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
        'base-100': 'var(--color-base-100)',
        'base-200': 'var(--color-base-200)',
        'base-300': 'var(--color-base-300)',
        'base-content': 'var(--color-base-content)',
        'primary': 'var(--color-primary)',
        'primary-content': 'var(--color-primary-content)',
        'secondary': 'var(--color-secondary)',
        'secondary-content': 'var(--color-secondary-content)',
        'accent': 'var(--color-accent)',
        'accent-content': 'var(--color-accent-content)',
        'neutral': 'var(--color-neutral)',
        'neutral-content': 'var(--color-neutral-content)',
        'info': 'var(--color-info)',
        'info-content': 'var(--color-info-content)',
        'success': 'var(--color-success)',
        'success-content': 'var(--color-success-content)',
        'warning': 'var(--color-warning)',
        'warning-content': 'var(--color-warning-content)',
        'error': 'var(--color-error)',
        'error-content': 'var(--color-error-content)',
      },
      borderRadius: {
        // Keep existing Tailwind default radii by extending
        'selector': 'var(--radius-selector)', // 2rem
        'field': 'var(--radius-field)',     // 0.5rem
        'box': 'var(--radius-box)',         // 1rem
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic":
          "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
      },
    },
  },
  plugins: [],
  // darkMode: false, // Explicitly set to false or remove (default is false if not using class strategy)
};
export default config;
