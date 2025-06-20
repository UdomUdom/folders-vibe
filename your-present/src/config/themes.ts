export interface Theme {
  id: string;
  name: string;
  colors: {
    background: string; // Applied to the main page container/body
    text: string; // Default text color for the page
    primaryAccent: string; // For main headings or important text elements
    secondaryAccent: string; // For sub-headings or other highlighted text
    button: string; // Button background and other interactive elements
    buttonText: string; // Text color for buttons
  };
  font?: string; // Optional: Tailwind font class e.g., 'font-serif'
  effects?: string; // Optional: Tailwind classes for container effects e.g., 'shadow-xl rounded-lg'
}

export const themes: Theme[] = [
  {
    id: 'default_light', // Renamed for clarity
    name: 'Default Light',
    colors: {
      background: 'bg-base-100',
      text: 'text-base-content',
      primaryAccent: 'text-primary', // Black
      secondaryAccent: 'text-secondary', // Dark gray/brown
      button: 'bg-primary hover:opacity-90', // Black button
      buttonText: 'text-primary-content', // White text
    },
    font: 'font-sans', // Assumes --font-family-sans is defined in globals.css
    effects: 'shadow-lg rounded-box', // Using new radius
  },
  {
    id: 'default_dark', // Renamed for clarity, using neutral as base
    name: 'Default Dark',
    colors: {
      background: 'bg-neutral', // Darker base
      text: 'text-neutral-content', // Light text
      primaryAccent: 'text-primary-content', // White for primary accent on dark bg
      secondaryAccent: 'text-accent',
      button: 'bg-primary-content hover:opacity-90', // White button
      buttonText: 'text-primary', // Black text
    },
    font: 'font-sans',
    effects: 'shadow-xl rounded-box',
  },
  {
    id: 'sunset_semantic', // Renamed
    name: 'Sunset Semantic',
    // Using semantic colors that map to OKLCH - 'warning' and 'error' for sunset hues
    colors: {
      background: 'bg-gradient-to-br from-warning to-error',
      text: 'text-warning-content', // Content color for warning
      primaryAccent: 'text-primary-content', // White, stands out on dark/colorful gradient
      secondaryAccent: 'text-error-content', // Ensure this has good contrast on the gradient
      button: 'bg-accent hover:opacity-80', // Use accent color for button
      buttonText: 'text-accent-content',
    },
    font: 'font-serif',
    effects: 'shadow-2xl rounded-lg', // Can keep older radius if it fits theme
  },
  {
    id: 'ocean_semantic', // Renamed
    name: 'Ocean Semantic',
    // Using 'info' for blue, 'success' for a touch of teal/green
    colors: {
      background: 'bg-gradient-to-b from-info to-success',
      text: 'text-info-content', // Light text for info color
      primaryAccent: 'text-primary-content', // White, for good contrast
      secondaryAccent: 'text-success-content', // Light text for success color
      button: 'bg-base-100 hover:opacity-90', // Neutral button on colorful bg
      buttonText: 'text-base-content',
    },
    font: 'font-sans',
    effects: 'rounded-xl shadow-lg',
  },
  {
    id: 'forest_semantic', // Renamed
    name: 'Forest Semantic',
    // Using 'success' for green, 'secondary' for earthy tones
    colors: {
      background: 'bg-gradient-to-tr from-success via-secondary to-success',
      text: 'text-success-content', // Light text for success
      primaryAccent: 'text-warning', // A contrasting 'warning' color (yellowish)
      secondaryAccent: 'text-base-300', // Lighter accent
      button: 'bg-warning hover:opacity-90',
      buttonText: 'text-warning-content',
    },
    font: 'font-serif',
    effects: 'rounded-lg shadow-md',
  },
  {
    id: 'lavender_semantic', // Renamed
    name: 'Lavender Semantic',
    // Using 'accent' and 'info' (purple-ish and blue-ish)
    colors: {
      background: 'bg-gradient-to-tl from-accent via-info to-accent',
      text: 'text-accent-content',
      primaryAccent: 'text-primary-content', // White for contrast
      secondaryAccent: 'text-info-content',
      button: 'bg-base-100 hover:opacity-90',
      buttonText: 'text-base-content',
    },
    font: 'font-sans',
    effects: 'rounded-xl shadow-lg',
  },
  {
    id: 'monochrome_strict', // Renamed
    name: 'Monochrome Strict',
    colors: {
      background: 'bg-primary', // Black background
      text: 'text-primary-content', // White text
      primaryAccent: 'text-primary-content', // White
      secondaryAccent: 'text-base-300', // A light gray from base palette
      button: 'bg-base-100 hover:opacity-80', // Light button
      buttonText: 'text-base-content', // Darker text for light button
    },
    font: 'font-mono', // Using mono font as specified
    effects: 'border-2 border-base-300 rounded-field shadow-lg', // Using new radius
  },
  {
    id: 'pastel_dream', // Renamed
    name: 'Pastel Dream',
    colors: {
      // Using base colors which are light, and accent for a bit of color
      background: 'bg-base-100',
      text: 'text-base-content',
      primaryAccent: 'text-accent',
      secondaryAccent: 'text-secondary',
      button: 'bg-accent hover:opacity-90',
      buttonText: 'text-accent-content',
    },
    font: 'font-sans',
    effects: 'rounded-box shadow-sm border border-base-300', // Using new radius
  }
];

export const getThemeById = (id: string): Theme | undefined => {
  return themes.find(theme => theme.id === id);
};
