import React from 'react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  message?: string;
  showLogo?: boolean;
}

export function LoadingSpinner({ 
  size = 'md', 
  className = '', 
  message = 'Loading...', 
  showLogo = false 
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16'
  };

  const containerClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
    xl: 'text-xl'
  };

  return (
    <div className={`flex flex-col items-center justify-center space-y-4 ${containerClasses[size]} ${className}`}>
      {showLogo && (
        <div className="flex items-center space-x-2 mb-4">
          <div className="w-8 h-8 bg-[#FFBF00] rounded-lg flex items-center justify-center">
            <span className="text-black font-bold text-sm">P</span>
          </div>
          <span className="text-xl font-bold text-gray-900">PrintEasy</span>
        </div>
      )}
      
      <div className="relative">
        <div className={`${sizeClasses[size]} border-4 border-gray-200 rounded-full animate-spin`}>
          <div className="absolute top-0 left-0 w-full h-full border-4 border-transparent border-t-[#FFBF00] rounded-full"></div>
        </div>
      </div>
      
      {message && (
        <p className="text-gray-600 text-center font-medium">{message}</p>
      )}
      
      <div className="flex space-x-1">
        <div className="w-2 h-2 bg-[#FFBF00] rounded-full animate-pulse" style={{ animationDelay: '0ms' }}></div>
        <div className="w-2 h-2 bg-[#FFBF00] rounded-full animate-pulse" style={{ animationDelay: '150ms' }}></div>
        <div className="w-2 h-2 bg-[#FFBF00] rounded-full animate-pulse" style={{ animationDelay: '300ms' }}></div>
      </div>
    </div>
  );
}

// Full screen loading overlay component
export function LoadingOverlay({ message = 'Loading...', showLogo = true }: { message?: string; showLogo?: boolean }) {
  return (
    <div className="fixed inset-0 bg-white bg-opacity-90 backdrop-blur-sm z-50 flex items-center justify-center">
      <LoadingSpinner size="xl" message={message} showLogo={showLogo} />
    </div>
  );
}

// Dashboard loading component
export function DashboardLoading({ title = 'Loading Dashboard...', subtitle }: { title?: string; subtitle?: string }) {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <LoadingSpinner size="lg" message={title} showLogo={true} />
        {subtitle && (
          <p className="text-gray-500 mt-4 text-sm">{subtitle}</p>
        )}
      </div>
    </div>
  );
}