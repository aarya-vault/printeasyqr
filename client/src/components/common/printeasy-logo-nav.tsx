import React from 'react';
import { useLocation } from 'wouter';

interface PrintEasyLogoNavProps {
  className?: string;
  onClick?: () => void;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
}

export default function PrintEasyLogoNav({ 
  className = '', 
  onClick, 
  size = 'md', 
  showText = true 
}: PrintEasyLogoNavProps) {
  const [, navigate] = useLocation();

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      navigate('/');
    }
  };

  const sizeClasses = {
    sm: 'w-20 h-5',
    md: 'w-32 h-8',
    lg: 'w-40 h-10',
    xl: 'w-48 h-12'
  };

  return (
    <div 
      className={`cursor-pointer hover:opacity-80 transition-opacity ${className}`}
      onClick={handleClick}
    >
      <div className={sizeClasses[size]}>
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
    </div>
  );
}