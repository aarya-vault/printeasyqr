import React from 'react';
import { ProfessionalHeader } from './professional-header';
import { Toaster } from '@/components/ui/toaster';

interface ProfessionalLayoutProps {
  children: React.ReactNode;
  title?: string;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '7xl' | 'full';
  showHeader?: boolean;
  headerActions?: React.ReactNode;
  className?: string;
  padding?: boolean;
}

export const ProfessionalLayout: React.FC<ProfessionalLayoutProps> = ({
  children,
  title,
  maxWidth = '7xl',
  showHeader = true,
  headerActions,
  className = '',
  padding = true
}) => {
  const maxWidthClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md', 
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    '7xl': 'max-w-7xl',
    full: 'max-w-full'
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Professional Header */}
      {showHeader && (
        <ProfessionalHeader 
          title={title}
          actions={headerActions}
        />
      )}

      {/* Main Content */}
      <main className={`${maxWidthClasses[maxWidth]} mx-auto ${padding ? 'px-4 sm:px-6 lg:px-8 py-8' : ''} ${className}`}>
        {children}
      </main>

      {/* Toast Notifications */}
      <Toaster />
    </div>
  );
};

// Specialized Layout Components
export const DashboardLayout: React.FC<{
  children: React.ReactNode;
  title: string;
  actions?: React.ReactNode;
}> = ({ children, title, actions }) => {
  return (
    <ProfessionalLayout 
      title={title}
      headerActions={actions}
      className="space-y-8"
    >
      {children}
    </ProfessionalLayout>
  );
};

export const AuthLayout: React.FC<{
  children: React.ReactNode;
  title?: string;
}> = ({ children, title }) => {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {/* Brand Header */}
        <div className="flex justify-center brand-header mb-8">
          <div className="brand-logo">P</div>
          <span className="brand-text">PrintEasy</span>
        </div>
        
        {title && (
          <h2 className="text-center text-3xl font-bold text-black mb-8">
            {title}
          </h2>
        )}
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="card-professional">
          {children}
        </div>
      </div>
      
      <Toaster />
    </div>
  );
};

export const CenteredLayout: React.FC<{
  children: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  showHeader?: boolean;
}> = ({ children, maxWidth = 'lg', showHeader = true }) => {
  return (
    <ProfessionalLayout 
      maxWidth={maxWidth}
      showHeader={showHeader}
      className="flex items-center justify-center min-h-[calc(100vh-4rem)]"
      padding={false}
    >
      <div className="w-full px-4 sm:px-6 lg:px-8">
        {children}
      </div>
    </ProfessionalLayout>
  );
};