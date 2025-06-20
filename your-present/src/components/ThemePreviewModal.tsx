"use client"; // Modal interactions require client components

import React from 'react';
import { Theme } from '@/config/themes'; // Import Theme interface

interface ThemePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  theme: Theme | null;
}

const ThemePreviewModal: React.FC<ThemePreviewModalProps> = ({ isOpen, onClose, theme }) => {
  if (!isOpen || !theme) {
    return null;
  }

  // Stop propagation for clicks inside the modal content, so they don't close the modal
  const handleModalContentClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  // Handle Escape key press to close modal
  React.useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
    }
    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-neutral/80 backdrop-blur-sm p-4" // Overlay with backdrop blur
      onClick={onClose} // Click on overlay closes modal
      role="dialog"
      aria-modal="true"
      aria-labelledby="theme-preview-title"
    >
      <div
        className="bg-base-100 text-base-content p-5 md:p-6 rounded-box shadow-2xl w-full max-w-md md:max-w-lg relative max-h-[90vh] flex flex-col" // Modal Dialog
        onClick={handleModalContentClick}
        role="document"
      >
        <div className="flex items-center justify-between mb-4">
            <h2 id="theme-preview-title" className="text-xl md:text-2xl font-semibold text-primary truncate">
                Preview: {theme.name}
            </h2>
            <button
                onClick={onClose}
                className="text-neutral-content hover:text-accent transition-colors text-3xl leading-none p-1 -mr-1"
                aria-label="Close theme preview"
            >
                &times; {/* Simple X icon */}
            </button>
        </div>

        {/* This is the container that gets the theme's direct background, text, font, effects */}
        <div className={`flex-grow overflow-y-auto p-4 md:p-6 border border-base-300 ${theme.effects || 'rounded-lg shadow-inner'} ${theme.colors.background} ${theme.colors.text} ${theme.font || 'font-sans'}`}>
          <h3 className={`text-2xl md:text-3xl font-bold mb-3 ${theme.colors.primaryAccent}`}>Primary Accent Heading</h3>
          <h4 className={`text-lg md:text-xl font-semibold mb-4 ${theme.colors.secondaryAccent}`}>Secondary Accent Subheading</h4>
          <p className="mb-5 text-sm leading-relaxed">
            This is sample paragraph text demonstrating the default text color and font style for the '{theme.name}' theme.
            It helps you visualize how content will appear. Lorem ipsum dolor sit amet, consectetur adipiscing elit.
          </p>
          <button
            type="button" // Important for forms
            className={`px-5 py-2 text-sm md:text-base font-medium rounded-field transition-opacity hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 ${theme.colors.button} ${theme.colors.buttonText} ${theme.colors.button.includes(theme.colors.primaryAccent) ? theme.colors.text : ''} focus:ring-[color:var(--color-primary)]`}
          >
            Theme Button
          </button>
        </div>

        <button
            onClick={onClose}
            className="mt-6 w-full bg-neutral text-neutral-content py-2.5 px-4 rounded-field hover:opacity-90 transition-opacity focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-neutral-focus"
        >
            Close Preview
        </button>
      </div>
    </div>
  );
};

export default ThemePreviewModal;
