import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { User, X } from 'lucide-react';

interface NameCollectionModalProps {
  isOpen: boolean;
  onComplete: (name: string) => void;
  onClose?: () => void;
}

export function NameCollectionModal({ isOpen, onComplete, onClose }: NameCollectionModalProps) {
  const [name, setName] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim().length >= 2) {
      onComplete(name.trim());
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md border-0 shadow-lg relative">
        {onClose && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100 transition-colors z-10"
            aria-label="Close modal"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        )}
        <CardHeader className="text-center space-y-2">
          <div className="w-16 h-16 bg-brand-yellow rounded-full flex items-center justify-center mx-auto">
            <User className="w-8 h-8 text-rich-black" />
          </div>
          <CardTitle className="text-xl font-bold text-rich-black">Welcome to PrintEasy!</CardTitle>
          <p className="text-medium-gray">Please tell us your name to get started</p>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-rich-black">Your Name</label>
              <Input
                type="text"
                placeholder="Enter your full name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="text-center"
                required
                minLength={2}
                autoFocus
              />
            </div>

            <Button 
              type="submit" 
              className="w-full bg-brand-yellow text-rich-black hover:bg-yellow-500 font-semibold py-3"
              disabled={name.trim().length < 2}
            >
              Continue to Dashboard
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}