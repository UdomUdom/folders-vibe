"use client";

import React, { useState } from 'react';
import ThemeSelection from '@/components/ThemeSelection';
import { themes } from '@/config/themes';
import { useRouter } from 'next/navigation';

export default function HomePage() {
  const router = useRouter();
  const [receiverName, setReceiverName] = useState('');
  const [giftDetails, setGiftDetails] = useState('');
  const [presentType, setPresentType] = useState('');
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [selectedThemeId, setSelectedThemeId] = useState<string>(themes[0]?.id || 'default');

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

  return (
    <main className="container mx-auto p-4 min-h-screen flex flex-col items-center justify-center bg-base-200 text-base-content">
      <div className="w-full max-w-2xl p-8 space-y-6 bg-base-100 rounded-lg shadow-xl">
        <h1 className="text-3xl font-bold text-center text-primary">Create Your Present</h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="receiverName" className="block text-sm font-medium text-neutral-content">Receiver's Name</label>
            <input
              type="text"
              id="receiverName"
              value={receiverName}
              onChange={(e) => setReceiverName(e.target.value)}
              required
              className="mt-1 block w-full px-3 py-2 border border-base-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm bg-base-200"
            />
          </div>

          <div>
            <label htmlFor="giftDetails" className="block text-sm font-medium text-neutral-content">Gift Details</label>
            <textarea
              id="giftDetails"
              value={giftDetails}
              onChange={(e) => setGiftDetails(e.target.value)}
              rows={4}
              required
              className="mt-1 block w-full px-3 py-2 border border-base-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm bg-base-200"
            />
          </div>

          <div>
            <label htmlFor="presentType" className="block text-sm font-medium text-neutral-content">Present Type</label>
            <select
              id="presentType"
              value={presentType}
              onChange={(e) => setPresentType(e.target.value)}
              required
              className="mt-1 block w-full px-3 py-2 border border-base-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm bg-base-200"
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
            <label htmlFor="imageUpload" className="block text-sm font-medium text-neutral-content">Upload Image for Present (Optional)</label>
            <input
              type="file"
              id="imageUpload"
              accept="image/*"
              onChange={handleImageChange}
              className="mt-1 block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-content hover:file:bg-primary-focus"
            />
            {imagePreviewUrl && (
              <div className="mt-4">
                <img src={imagePreviewUrl} alt="Image preview" className="max-h-40 rounded-md shadow-lg mx-auto"/>
              </div>
            )}
          </div>

          <ThemeSelection selectedThemeId={selectedThemeId} onThemeChange={setSelectedThemeId} />

          <button type="submit" className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-primary-content bg-primary hover:bg-opacity-80 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-focus">
            Create Gift Page
          </button>
        </form>
      </div>
    </main>
  );
}
