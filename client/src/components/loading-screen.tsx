import React from 'react';

interface LoadingScreenProps {
  message?: string;
}

export default function LoadingScreen({ message = "Loading..." }: LoadingScreenProps) {
  return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="text-center">
        {/* PrintEasy Logo */}
        <div className="mb-8">
          <div className="w-20 h-20 bg-brand-yellow rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl font-bold text-rich-black">P</span>
          </div>
          <h1 className="text-2xl font-bold text-rich-black mb-2">PrintEasy</h1>
          <p className="text-sm text-gray-600">Your Digital Printing Partner</p>
        </div>

        {/* Loading Animation */}
        <div className="w-64 bg-gray-200 rounded-full h-2 mx-auto mb-4">
          <div className="bg-brand-yellow h-2 rounded-full loading-bar"></div>
        </div>
        
        <style>{`
          .loading-bar {
            animation: loading 2s ease-in-out infinite alternate;
          }
          @keyframes loading {
            0% { width: 20%; }
            50% { width: 80%; }
            100% { width: 60%; }
          }
        `}</style>

        <p className="text-gray-600 font-medium">{message}</p>


      </div>
    </div>
  );
}