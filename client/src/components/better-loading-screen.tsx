import React from 'react';

interface BetterLoadingScreenProps {
  message?: string;
  isFullScreen?: boolean;
}

export default function BetterLoadingScreen({ 
  message = "Loading...", 
  isFullScreen = false 
}: BetterLoadingScreenProps) {
  const containerClass = isFullScreen 
    ? "fixed inset-0 bg-white z-50 flex items-center justify-center"
    : "flex items-center justify-center p-8";

  return (
    <div className={containerClass}>
      <div className="text-center">
        {/* PrintEasy Branding */}
        <div className="w-16 h-16 bg-brand-yellow rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-rich-black font-bold text-xl">PE</span>
        </div>
        
        {/* Loading Progress Bar */}
        <div className="w-64 h-2 bg-gray-200 rounded-full overflow-hidden mb-4">
          <div 
            className="h-full bg-brand-yellow rounded-full"
            style={{
              width: '100%',
              transition: 'width 2s linear'
            }}
          />
        </div>
        
        <h2 className="text-lg font-semibold text-rich-black mb-2">PrintEasy</h2>
        <p className="text-medium-gray">{message}</p>
      </div>
    </div>
  );
}