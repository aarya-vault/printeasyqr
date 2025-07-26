import React from 'react';

interface LoadingScreenProps {
  message?: string;
}

export default function BetterLoadingScreen({ 
  message = "Loading..." 
}: LoadingScreenProps) {
  return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="text-center max-w-md mx-auto px-6">
        {/* PrintEasy Logo/Brand */}
        <div className="mb-8">
          <div className="w-20 h-20 bg-brand-yellow rounded-2xl flex items-center justify-center mx-auto mb-4">
            <div className="text-3xl font-bold text-rich-black">P</div>
          </div>
          <h1 className="text-2xl font-bold text-rich-black">PrintEasy</h1>
          <p className="text-sm text-medium-gray mt-1">Your Printing Made Simple</p>
        </div>

        {/* Loading Animation */}
        <div className="mb-6">
          <div className="w-16 h-1 bg-gray-200 rounded-full mx-auto overflow-hidden">
            <div className="h-full bg-brand-yellow rounded-full animate-loading-bar"></div>
          </div>
        </div>

        {/* Loading Message */}
        <p className="text-medium-gray text-base">{message}</p>
      </div>
    </div>
  );
}