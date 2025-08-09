import React from 'react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'full' | 'icon' | 'text';
  className?: string;
}

export const Logo: React.FC<LogoProps> = ({ 
  size = 'md', 
  variant = 'full', 
  className = '' 
}) => {
  const sizeClasses = {
    sm: 'w-24 h-6',
    md: 'w-32 h-8', 
    lg: 'w-40 h-10',
    xl: 'w-48 h-12'
  };

  const iconSizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-10 h-10', 
    xl: 'w-12 h-12'
  };

  if (variant === 'icon') {
    return (
      <div className={`${iconSizeClasses[size]} ${className}`}>
        <svg width="100%" height="100%" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Background Circle */}
          <circle cx="16" cy="16" r="15" fill="#FFBF00" stroke="#000000" strokeWidth="2"/>
          
          {/* Printer Icon */}
          <g transform="translate(8, 8)">
            {/* Printer Base */}
            <rect x="2" y="8" width="12" height="5" rx="0.5" fill="#000000"/>
            {/* Printer Top */}
            <rect x="3" y="5" width="10" height="3" rx="0.5" fill="#000000"/>
            {/* Paper with QR */}
            <rect x="4" y="2" width="8" height="6" rx="0.5" fill="#FFFFFF"/>
            {/* Mini QR Pattern */}
            <g transform="translate(5.5, 3.5)">
              <rect x="0" y="0" width="1" height="1" fill="#000000"/>
              <rect x="2" y="0" width="1" height="1" fill="#000000"/>
              <rect x="4" y="0" width="1" height="1" fill="#000000"/>
              <rect x="0" y="2" width="1" height="1" fill="#000000"/>
              <rect x="4" y="2" width="1" height="1" fill="#000000"/>
              <rect x="2" y="4" width="1" height="1" fill="#000000"/>
            </g>
          </g>
        </svg>
      </div>
    );
  }

  if (variant === 'text') {
    return (
      <div className={`flex flex-col ${className}`}>
        <span className="font-poppins font-semibold text-black text-lg">PrintEasy</span>
        <span className="font-poppins font-medium text-brand-yellow text-sm">QR</span>
      </div>
    );
  }

  return (
    <div className={`${sizeClasses[size]} ${className}`}>
      <svg width="100%" height="100%" viewBox="0 0 160 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Printer Icon */}
        <g transform="translate(8, 8)">
          {/* Printer Base */}
          <rect x="2" y="12" width="20" height="8" rx="1" fill="#FFBF00" stroke="#000000" strokeWidth="1.5"/>
          {/* Paper Tray */}
          <rect x="4" y="16" width="16" height="2" fill="#000000"/>
          {/* Printer Top */}
          <rect x="4" y="6" width="16" height="6" rx="1" fill="#FFBF00" stroke="#000000" strokeWidth="1.5"/>
          {/* Paper */}
          <rect x="6" y="2" width="12" height="8" rx="0.5" fill="#FFFFFF" stroke="#000000" strokeWidth="1"/>
          {/* QR Code Pattern */}
          <g transform="translate(8, 4)">
            <rect x="0" y="0" width="1" height="1" fill="#000000"/>
            <rect x="2" y="0" width="1" height="1" fill="#000000"/>
            <rect x="4" y="0" width="1" height="1" fill="#000000"/>
            <rect x="6" y="0" width="1" height="1" fill="#000000"/>
            <rect x="0" y="2" width="1" height="1" fill="#000000"/>
            <rect x="4" y="2" width="1" height="1" fill="#000000"/>
            <rect x="6" y="2" width="1" height="1" fill="#000000"/>
            <rect x="2" y="4" width="1" height="1" fill="#000000"/>
            <rect x="4" y="4" width="1" height="1" fill="#000000"/>
          </g>
        </g>
        
        {/* PrintEasy Text */}
        <text x="40" y="18" fontFamily="Poppins, sans-serif" fontSize="12" fontWeight="600" fill="#000000">PrintEasy</text>
        {/* QR Text */}
        <text x="40" y="30" fontFamily="Poppins, sans-serif" fontSize="10" fontWeight="500" fill="#FFBF00">QR</text>
      </svg>
    </div>
  );
};