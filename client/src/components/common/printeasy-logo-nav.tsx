import React from 'react';
import { Printer } from 'lucide-react';
import { useLocation } from 'wouter';

interface PrintEasyLogoNavProps {
  className?: string;
  onClick?: () => void;
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
}

export default function PrintEasyLogoNav({ 
  className = '', 
  onClick, 
  size = 'md', 
  showText = true 
}: PrintEasyLogoNavProps) {
  const [, navigate] = useLocation();
  
  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-10 h-10'
  };

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  };

  const textSizes = {
    sm: 'text-sm',
    md: 'text-xl',
    lg: 'text-2xl'
  };

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      navigate('/');
    }
  };

  return (
    <div 
      className={`flex items-center space-x-2 cursor-pointer hover:opacity-80 transition-opacity ${className}`}
      onClick={handleClick}
    >
      <div className={`bg-brand-yellow rounded-full flex items-center justify-center ${sizeClasses[size]}`}>
        <Printer className={`text-rich-black ${iconSizes[size]}`} />
      </div>
      {showText && (
        <span className={`font-bold text-rich-black ${textSizes[size]}`}>
          PrintEasy
        </span>
      )}
    </div>
  );
}