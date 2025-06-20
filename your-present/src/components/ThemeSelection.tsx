import React from 'react';
import { themes, Theme } from '@/config/themes'; // Import Theme interface

interface ThemeSelectionProps {
  selectedThemeId: string;
  onThemeChange: (themeId: string) => void;
}

const ThemeSelection: React.FC<ThemeSelectionProps> = ({ selectedThemeId, onThemeChange }) => {
  // Helper to attempt to convert text color to a bg color for the swatch
  const getSwatchBgClass = (textColorClass: string): string => {
    if (textColorClass.startsWith('text-')) {
      // Simple direct conversion for named colors like text-white, text-red-500
      return textColorClass.replace('text-', 'bg-');
    }
    // Fallback for complex classes or semantic colors like text-base-content
    // This is imperfect and ideally themes would provide swatch colors.
    if (textColorClass === 'text-base-content') return 'bg-base-content';
    if (textColorClass === 'text-neutral-content') return 'bg-neutral-content';
    if (textColorClass === 'text-primary-content') return 'bg-primary-content';
    // Add more specific fallbacks if needed based on your themes.ts
    return 'bg-gray-400'; // Default fallback swatch
  };


  return (
    <div>
      <h3 className="text-lg font-semibold mb-3 text-neutral-content">Select a Theme:</h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 md:gap-4">
        {themes.map((theme: Theme) => (
          <button
            key={theme.id}
            onClick={() => onThemeChange(theme.id)}
            className={`p-3 md:p-4 border rounded-lg transition-all duration-200 ease-in-out transform hover:scale-105 focus:outline-none
                        ${selectedThemeId === theme.id ? 'ring-4 ring-offset-2 ring-primary ring-offset-base-100' : 'border-base-300 hover:border-neutral'}
                        ${theme.colors.background} ${theme.colors.text} ${theme.font || 'font-sans'} ${theme.effects || 'shadow-md'}`}
            title={`Select ${theme.name} theme`}
          >
            <div className={`font-semibold text-center text-sm md:text-base mb-2 truncate ${theme.colors.primaryAccent}`}>{theme.name}</div>

            <div className="text-xs space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="opacity-80">Text</span>
                <span className={`w-3 h-3 rounded-full ring-1 ring-inset ring-gray-500/50 ${getSwatchBgClass(theme.colors.text)}`}></span>
              </div>
              <div className="flex items-center justify-between">
                <span className="opacity-80">Accent</span>
                 <span className={`w-3 h-3 rounded-full ring-1 ring-inset ring-gray-500/50 ${getSwatchBgClass(theme.colors.primaryAccent)}`}></span>
              </div>
              <div className={`mt-2 p-1 text-xs rounded-sm text-center ${theme.colors.button} ${theme.colors.buttonText}`}>
                Button
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default ThemeSelection;
