import React from 'react';
import { Package } from 'lucide-react';

interface LoadingScreenProps {
  message?: string;
}

export function LoadingScreen({ message = 'Loading...' }: LoadingScreenProps) {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="mx-auto w-16 h-16 bg-[#FFBF00] rounded-full flex items-center justify-center mb-4">
          <Package className="w-8 h-8 text-black animate-pulse" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">PrintEasy</h3>
        <p className="text-gray-600">{message}</p>
        <div className="mt-4 w-32 h-2 bg-gray-200 rounded-full mx-auto overflow-hidden">
          <div className="h-full bg-[#FFBF00] rounded-full animate-pulse"></div>
        </div>
      </div>
    </div>
  );
}

export default LoadingScreen;