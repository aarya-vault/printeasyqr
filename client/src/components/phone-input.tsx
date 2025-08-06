import React from 'react';
import { Input } from '@/components/ui/input';

interface PhoneInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  required?: boolean;
  disabled?: boolean;
}

export default function PhoneInput({ 
  value, 
  onChange, 
  placeholder = "Enter 10-digit mobile number",
  className = "",
  required = false,
  disabled = false
}: PhoneInputProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value;
    // Only allow digits and limit to 10 characters
    const digits = input.replace(/\D/g, '').slice(0, 10);
    onChange(digits);
  };

  return (
    <Input
      type="tel"
      value={value}
      onChange={handleChange}
      placeholder={placeholder}
      className="flex h-10 rounded-md border border-input px-3 ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm w-full text-lg py-3 bg-[transparent]"
      required={required}
      disabled={disabled}
      maxLength={10}
      pattern="[0-9]{10}"
      inputMode="numeric"
    />
  );
}