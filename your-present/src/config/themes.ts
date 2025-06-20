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
    id: 'default',
    name: 'Default',
    colors: {
      background: 'bg-base-100',
      text: 'text-base-content',
      primaryAccent: 'text-primary',
      secondaryAccent: 'text-secondary',
      button: 'bg-primary hover:bg-primary-focus',
      buttonText: 'text-primary-content',
    },
    font: 'font-sans',
    effects: 'shadow-lg rounded-lg',
  },
  {
    id: 'dark_elegant',
    name: 'Dark Elegant',
    colors: {
      background: 'bg-neutral',
      text: 'text-neutral-content',
      primaryAccent: 'text-accent',
      secondaryAccent: 'text-secondary',
      button: 'bg-accent hover:bg-accent-focus',
      buttonText: 'text-accent-content',
    },
    font: 'font-serif',
    effects: 'shadow-xl rounded-md',
  },
  {
    id: 'sunset_glow',
    name: 'Sunset Glow',
    colors: {
      background: 'bg-gradient-to-br from-orange-400 via-red-500 to-pink-500',
      text: 'text-white',
      primaryAccent: 'text-yellow-300',
      secondaryAccent: 'text-pink-200',
      button: 'bg-yellow-400 hover:bg-yellow-500 focus:ring-yellow-300',
      buttonText: 'text-orange-800 font-semibold',
    },
    font: 'font-sans',
    effects: 'shadow-2xl rounded-lg',
  },
  {
    id: 'ocean_breeze',
    name: 'Ocean Breeze',
    colors: {
      background: 'bg-gradient-to-b from-sky-400 to-cyan-300',
      text: 'text-blue-900',
      primaryAccent: 'text-white',
      secondaryAccent: 'text-sky-700',
      button: 'bg-white hover:bg-sky-100 focus:ring-sky-200',
      buttonText: 'text-sky-600 font-medium',
    },
    font: 'font-sans',
    effects: 'rounded-xl shadow-lg',
  },
  {
    id: 'forest_calm',
    name: 'Forest Calm',
    colors: {
      background: 'bg-gradient-to-tr from-green-700 via-lime-600 to-green-700',
      text: 'text-green-100',
      primaryAccent: 'text-yellow-200',
      secondaryAccent: 'text-green-300',
      button: 'bg-yellow-400 hover:bg-yellow-500 focus:ring-yellow-300',
      buttonText: 'text-green-800 font-bold',
    },
    font: 'font-serif',
    effects: 'rounded-lg shadow-md',
  },
  {
    id: 'lavender_dream',
    name: 'Lavender Dream',
    colors: {
      background: 'bg-gradient-to-tl from-purple-400 via-fuchsia-400 to-indigo-400',
      text: 'text-indigo-900',
      primaryAccent: 'text-white',
      secondaryAccent: 'text-purple-200',
      button: 'bg-white hover:bg-purple-100 focus:ring-purple-300',
      buttonText: 'text-purple-700',
    },
    effects: 'rounded-xl shadow-lg',
  },
  {
    id: 'monochrome_modern',
    name: 'Monochrome Modern',
    colors: {
      background: 'bg-gray-800',
      text: 'text-gray-200',
      primaryAccent: 'text-white',
      secondaryAccent: 'text-gray-400',
      button: 'bg-gray-200 hover:bg-gray-300 focus:ring-gray-400',
      buttonText: 'text-gray-800 font-semibold',
    },
    font: 'font-mono',
    effects: 'border-2 border-gray-700 rounded-none shadow-lg',
  },
  {
    id: 'spring_pastel',
    name: 'Spring Pastel',
    colors: {
      background: 'bg-emerald-50',
      text: 'text-emerald-800',
      primaryAccent: 'text-pink-500',
      secondaryAccent: 'text-yellow-500',
      button: 'bg-pink-400 hover:bg-pink-500 focus:ring-pink-300',
      buttonText: 'text-white',
    },
    font: 'font-sans',
    effects: 'rounded-xl shadow-sm border border-emerald-200',
  }
];

export const getThemeById = (id: string): Theme | undefined => {
  return themes.find(theme => theme.id === id);
};
