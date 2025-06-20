"use client";

import React, { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { getThemeById, Theme } from '@/config/themes'; // Import Theme and getThemeById

interface GiftData {
  giftDetails: string;
  imageDataUrl: string | null;
}

export default function GiftDisplayPage() {
  const params = useParams();
  const searchParams = useSearchParams();

  const [giftData, setGiftData] = useState<GiftData | null>(null);
  const [currentThemeId, setCurrentThemeId] = useState<string>('default');
  const [currentTheme, setCurrentTheme] = useState<Theme | undefined>(getThemeById('default'));
  const [presentTypeDisplay, setPresentTypeDisplay] = useState<string>('Unknown present');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // receiverName from the URL path segment. Next.js decodes path segments automatically.
  // If receiverName was separately URI encoded before putting it in the path (e.g. for spaces),
  // then it might need decodeURIComponent here. Assuming simple names or that encoding was handled.
  const receiverNameFromParams = params.receiverName as string;


  useEffect(() => {
    if (typeof window !== 'undefined' && receiverNameFromParams) {
      const themeId = searchParams.get('theme') || 'default';
      const typeQuery = searchParams.get('type');

      setCurrentThemeId(themeId);
      setCurrentTheme(getThemeById(themeId)); // Set the full theme object

      if (typeQuery) {
        setPresentTypeDisplay(decodeURIComponent(typeQuery).replace(/_/g, ' '));
      } else {
        setPresentTypeDisplay('Unknown present type');
      }

      // Use receiverNameFromParams directly as the key, assuming it matches how it was stored.
      // The form page used the raw receiverName state for the key.
      const storageKey = `giftData_${receiverNameFromParams}`;
      try {
        const storedDataString = localStorage.getItem(storageKey);
        if (storedDataString) {
          const parsedData: GiftData = JSON.parse(storedDataString);
          setGiftData(parsedData);
        } else {
          setError("No gift details found. The link might be old, incorrect, or the data wasn't saved correctly.");
          setGiftData({ giftDetails: "No gift details found.", imageDataUrl: null });
        }
      } catch (e) {
        console.error("Failed to parse gift data from localStorage:", e);
        setError("Error loading gift details.");
        setGiftData({ giftDetails: "Error loading details.", imageDataUrl: null });
      }
    } else if (!receiverNameFromParams) {
        setError("Receiver name not found in the URL.");
    }
    setIsLoading(false);
  }, [receiverNameFromParams, searchParams]);

  // Fallback to default theme if currentTheme is somehow undefined
  const themeToApply = currentTheme || getThemeById('default')!; // Add non-null assertion if default always exists

  if (isLoading) {
    return (
      <main className={`min-h-screen flex flex-col items-center justify-center p-6 ${themeToApply.colors.background} ${themeToApply.colors.text} ${themeToApply.font || 'font-sans'}`}>
        Loading gift...
      </main>
    );
  }

  return (
    <main className={`min-h-screen flex flex-col items-center justify-center p-6 transition-colors duration-500 ease-in-out ${themeToApply.colors.background} ${themeToApply.colors.text} ${themeToApply.font || 'font-sans'}`}>
      <div className={`text-center p-6 md:p-10 max-w-lg w-11/12 bg-base-100 bg-opacity-80 backdrop-blur-md ${themeToApply.effects || 'rounded-lg shadow-xl'} border border-base-300`}>
        <h1 className={`text-3xl md:text-4xl font-bold mb-4 break-words ${themeToApply.colors.primaryAccent}`}>
          A Special Gift for {receiverNameFromParams || "Someone Special"}!
        </h1>

        {error && <p className="text-red-500 my-4">{error}</p>}

        <div className="my-6">
          <h2 className={`text-xl md:text-2xl font-semibold mb-2 ${themeToApply.colors.secondaryAccent}`}>
            Your Present: {presentTypeDisplay}
          </h2>
          {giftData?.imageDataUrl && (
            <img
              src={giftData.imageDataUrl}
              alt={presentTypeDisplay}
              className="my-4 rounded-lg shadow-md max-w-xs mx-auto"
            />
          )}
        </div>

        <p className="text-md md:text-lg mb-8 whitespace-pre-wrap break-words">
          {giftData?.giftDetails || (error ? '' : "Loading details...")}
        </p>

        <p className={`text-sm ${themeToApply.colors.secondaryAccent || themeToApply.colors.text}`}>
          Crafted with love.
        </p>
      </div>
    </main>
  );
}
