"use client";

import React, { useState } from 'react';
import ThemeSelection from '@/components/ThemeSelection';
import { themes, getThemeById, Theme } from '@/config/themes'; // Import getThemeById and Theme
import { useRouter } from 'next/navigation';
import ThemePreviewModal from '@/components/ThemePreviewModal'; // Import Modal

export default function CreatePage() { // Renamed from HomePage to CreatePage
  const router = useRouter();
  const [receiverName, setReceiverName] = useState('');
  const [giftDetails, setGiftDetails] = useState('');
  const [presentType, setPresentType] = useState('');
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);

  // Initialize with a valid theme ID, default to first theme in array or 'default_light'
  const [selectedThemeId, setSelectedThemeId] = useState<string>(themes[0]?.id || 'default_light');

  const [isModalOpen, setIsModalOpen] = useState(false); // State for modal visibility

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setSelectedImage(null);
      setImagePreviewUrl(null);
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!receiverName.trim()) {
      alert("Please enter the receiver's name.");
      return;
    }

    let imageToStore: string | null = null;
    if (selectedImage) {
      imageToStore = await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(selectedImage);
      });
    }

    const storageKey = `giftData_${receiverName}`;
    const dataToStore = {
      giftDetails,
      imageDataUrl: imageToStore,
    };
    try {
      localStorage.setItem(storageKey, JSON.stringify(dataToStore));
    } catch (error) {
      console.error("Error saving to localStorage", error);
      alert("There was an error saving the gift data. Please try again.");
      return;
    }

    router.push(`/uid/${encodeURIComponent(receiverName)}?theme=${selectedThemeId}&type=${encodeURIComponent(presentType)}`);
  };

  const handlePreviewTheme = () => {
    setIsModalOpen(true);
  };

  // Ensure a valid theme object is passed to the modal, fallback to the first theme or a specific default.
  const currentThemeForPreview = getThemeById(selectedThemeId) || themes.find(t => t.id === 'default_light') || themes[0];


  return (
    // main container styling is now primarily from body in globals.css
    <main className="container mx-auto p-4 min-h-screen flex flex-col items-center justify-center">
      <div className="w-full max-w-2xl p-6 md:p-8 space-y-4 md:space-y-6 bg-base-100 rounded-box shadow-xl"> {/* Used rounded-box */}
        <h1 className="text-2xl md:text-3xl font-bold text-center text-primary">Create Your Present</h1>

        <form onSubmit={handleSubmit} className="space-y-4 md:space-y-5">
          <div>
            <label htmlFor="receiverName" className="block text-sm font-medium text-neutral-content mb-1">Receiver's Name</label>
            <input
              type="text"
              id="receiverName"
              value={receiverName}
              onChange={(e) => setReceiverName(e.target.value)}
              required
              className="block w-full px-3 py-2 border border-base-300 rounded-field shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary sm:text-sm bg-base-200" // Used rounded-field
            />
          </div>

          <div>
            <label htmlFor="giftDetails" className="block text-sm font-medium text-neutral-content mb-1">Gift Details</label>
            <textarea
              id="giftDetails"
              value={giftDetails}
              onChange={(e) => setGiftDetails(e.target.value)}
              rows={4}
              required
              className="block w-full px-3 py-2 border border-base-300 rounded-field shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary sm:text-sm bg-base-200" // Used rounded-field
            />
          </div>

          <div>
            <label htmlFor="presentType" className="block text-sm font-medium text-neutral-content mb-1">Present Type</label>
            <select
              id="presentType"
              value={presentType}
              onChange={(e) => setPresentType(e.target.value)}
              required
              className="block w-full px-3 py-2 border border-base-300 rounded-field shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary sm:text-sm bg-base-200" // Used rounded-field
            >
              <option value="">Select a type</option>
              <option value="ring">Ring</option>
              <option value="teddy_bear">Teddy Bear</option>
              <option value="flower">Flower</option>
              <option value="car">Car</option>
              <option value="campaign">Campaign</option>
            </select>
          </div>

          <div>
            <label htmlFor="imageUpload" className="block text-sm font-medium text-neutral-content mb-1">Upload Image for Present (Optional)</label>
            <input
              type="file"
              id="imageUpload"
              accept="image/*"
              onChange={handleImageChange}
              className="block w-full text-sm file:mr-3 file:py-1.5 file:px-3 file:rounded-field file:border-0 file:text-sm file:font-semibold file:bg-primary hover:file:opacity-90 file:text-primary-content cursor-pointer" // Used rounded-field
            />
            {imagePreviewUrl && (
              <div className="mt-3">
                <img src={imagePreviewUrl} alt="Image preview" className="max-h-40 rounded-lg shadow-md mx-auto"/> {/* Kept rounded-lg for image itself */}
              </div>
            )}
          </div>

          <ThemeSelection selectedThemeId={selectedThemeId} onThemeChange={setSelectedThemeId} />

          {/* Button Group */}
          <div className="pt-3 space-y-3 sm:space-y-0 sm:flex sm:flex-row-reverse sm:space-x-reverse sm:space-x-3">
            <button
              type="submit"
              className="w-full sm:w-auto sm:flex-1 justify-center py-2.5 px-4 border border-transparent rounded-field shadow-sm text-sm font-medium
                         text-primary-content bg-primary hover:opacity-90
                         focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary cursor-pointer"
            >
              Create Gift Page
            </button>
            <button
              type="button" // Important: type="button"
              onClick={handlePreviewTheme}
              className="w-full sm:w-auto sm:flex-1 justify-center py-2.5 px-4 border border-secondary rounded-field shadow-sm text-sm font-medium
                         text-secondary-content bg-secondary hover:opacity-90
                         focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-secondary cursor-pointer"
            >
              Preview Theme
            </button>
          </div>
        </form>
      </div>

      <ThemePreviewModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        theme={currentThemeForPreview}
      />
    </main>
  );
}
