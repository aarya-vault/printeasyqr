import React from 'react';
import { Printer } from 'lucide-react';

interface PrintEasyLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  textSize?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export default function PrintEasyLogo({ 
  size = 'md', 
  showText = false, 
  textSize = 'md',
  className = '' 
}: PrintEasyLogoProps) {
  // Logo container sizes
  const containerSizes = {
    sm: 'w-6 h-6 p-1',
    md: 'w-8 h-8 p-1.5', 
    lg: 'w-12 h-12 p-2',
    xl: 'w-16 h-16 p-3'
  };

  // Printer icon sizes
  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-8 h-8', 
    xl: 'w-10 h-10'
  };

  // Text sizes
  const textSizes = {
    sm: 'text-sm',
    md: 'text-lg',
    lg: 'text-xl',
    xl: 'text-2xl'
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {/* Consistent Yellow Logo with Printer Inside */}
      <div className={`bg-brand-yellow rounded-lg shadow-lg flex items-center justify-center ${containerSizes[size]}`}>
        <Printer className={`text-rich-black ${iconSizes[size]}`} />
      </div>
      
      {/* Optional Text */}
      {showText && (
        <span className={`font-bold text-rich-black ${textSizes[textSize]}`}>
          PrintEasy
        </span>
      )}
    </div>
  );
}

// Logo variants for specific use cases
export function PrintEasyLogoText({ size = 'md', className = '' }: { size?: 'sm' | 'md' | 'lg' | 'xl', className?: string }) {
  return <PrintEasyLogo size={size} showText={true} textSize={size} className={className} />;
}

export function PrintEasyLogoIcon({ size = 'md', className = '' }: { size?: 'sm' | 'md' | 'lg' | 'xl', className?: string }) {
  return <PrintEasyLogo size={size} showText={false} className={className} />;
}