"use client"; // If using client-side components like next/link or event handlers for router.push

import Link from 'next/link';
// import { useRouter } from 'next/navigation'; // Alternative for programmatic navigation

export default function LandingPage() {
  // const router = useRouter();

  return (
    <main className="min-h-screen flex flex-col items-center justify-center text-center p-4 sm:p-8 bg-base-200 text-base-content">
      <div className="space-y-6 max-w-2xl">
        <h1 className="text-4xl sm:text-5xl font-bold text-primary">
          Welcome to Your Present!
        </h1>
        <p className="text-lg sm:text-xl text-base-content leading-relaxed">
          Craft unique and memorable digital gift experiences for your loved ones.
          Personalize your message, choose a stunning theme, and add a special image to make it unforgettable.
        </p>
        <div className="pt-4">
          <Link href="/create" legacyBehavior>
            <a className="inline-block px-8 sm:px-10 py-3 sm:py-4 text-lg font-semibold rounded-lg shadow-md
                          bg-primary text-primary-content
                          hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2
                          transition-colors duration-150 cursor-pointer">
              Create a Gift Now
            </a>
          </Link>
        </div>
        <p className="text-sm text-neutral-content mt-8">
          Let's make someone's day special!
        </p>
      </div>
    </main>
  );
}
