import React from 'react';

interface ProfessionalLoadingProps {
  message?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  fullScreen?: boolean;
  showBrand?: boolean;
}

export const ProfessionalLoading: React.FC<ProfessionalLoadingProps> = ({
  message = "Loading...",
  size = 'md',
  fullScreen = false,
  showBrand = true
}) => {
  const sizeClasses = {
    sm: 'h-4 w-4 border-2',
    md: 'h-8 w-8 border-3', 
    lg: 'h-12 w-12 border-4',
    xl: 'h-16 w-16 border-4'
  };

  const containerClasses = fullScreen 
    ? 'fixed inset-0 bg-white z-50 flex flex-col items-center justify-center'
    : 'flex flex-col items-center justify-center py-8';

  return (
    <div className={containerClasses}>
      {showBrand && (
        <div className="brand-header mb-6">
          <div className="brand-logo">P</div>
          <span className="brand-text">PrintEasy</span>
        </div>
      )}
      
      <div className="relative mb-4">
        {/* Main Loading Spinner */}
        <div className={`${sizeClasses[size]} border-yellow-400 border-t-transparent rounded-full animate-spin`} />
        
        {/* Inner Ring Animation */}
        <div className={`absolute inset-1 ${sizeClasses[size]} border-yellow-200 border-b-transparent rounded-full animate-spin`} 
             style={{ animationDirection: 'reverse', animationDuration: '0.75s' }} />
      </div>
      
      {/* Loading Bar */}
      <div className="w-64 h-1 bg-gray-100 rounded-full overflow-hidden mb-3">
        <div className="h-full bg-yellow-400 rounded-full" 
             style={{ 
               width: '100%',
               animation: 'loading-bar 2s ease-in-out infinite'
             }} />
      </div>
      
      <p className="text-gray-600 text-sm font-medium text-center max-w-xs">
        {message}
      </p>
      

    </div>
  );
};

// Quick Loading Spinner for inline use
export const LoadingSpinner: React.FC<{ size?: 'sm' | 'md' | 'lg' }> = ({ size = 'md' }) => {
  const sizeClasses = {
    sm: 'h-4 w-4 border-2',
    md: 'h-6 w-6 border-2', 
    lg: 'h-8 w-8 border-3'
  };

  return (
    <div className={`${sizeClasses[size]} border-yellow-400 border-t-transparent rounded-full animate-spin`} />
  );
};

// Page Loading Wrapper
export const PageLoading: React.FC<{ message?: string }> = ({ message = "Loading page..." }) => {
  return <ProfessionalLoading message={message} size="lg" fullScreen showBrand />;
};

// Button Loading State
export const ButtonLoading: React.FC<{ message?: string }> = ({ message = "Processing..." }) => {
  return (
    <div className="flex items-center gap-2">
      <LoadingSpinner size="sm" />
      <span className="text-sm">{message}</span>
    </div>
  );
};