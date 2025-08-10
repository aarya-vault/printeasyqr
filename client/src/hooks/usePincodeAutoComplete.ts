import { useState, useCallback } from 'react';

interface LocationData {
  city: string;
  state: string;
  district?: string;
  pincode: string;
}

interface PincodeResponse {
  success: boolean;
  data?: LocationData;
  message?: string;
}

/**
 * Custom hook for Indian pincode auto-completion
 * Fixes the "unknown" city/state issue with comprehensive database
 */
export function usePincodeAutoComplete() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchLocationFromPincode = useCallback(async (pincode: string): Promise<LocationData | null> => {
    // Reset state
    setError(null);
    setIsLoading(true);

    try {
      // Validate pincode format first
      if (!pincode || pincode.length !== 6 || !/^\d{6}$/.test(pincode)) {
        setError('Please enter a valid 6-digit pincode');
        return null;
      }

      console.log('🔍 Fetching location data for pincode:', pincode);

      // Call our comprehensive pincode API
      const response = await fetch(`/api/pincode/location/${pincode}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const result: PincodeResponse = await response.json();

      if (result.success && result.data) {
        console.log('✅ Location found:', result.data);
        return result.data;
      } else {
        const errorMsg = result.message || 'Location not found for this pincode';
        setError(errorMsg);
        console.log('⚠️ Pincode lookup failed:', errorMsg);
        return null;
      }

    } catch (error) {
      const errorMsg = 'Failed to fetch location data. Please try again.';
      setError(errorMsg);
      console.error('❌ Pincode API error:', error);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const validatePincode = useCallback(async (pincode: string): Promise<boolean> => {
    if (!pincode || pincode.length !== 6) {
      return false;
    }

    try {
      const response = await fetch(`/api/pincode/validate/${pincode}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();
      return result.success && result.isValid;
      
    } catch (error) {
      console.error('❌ Pincode validation error:', error);
      return false;
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    fetchLocationFromPincode,
    validatePincode,
    isLoading,
    error,
    clearError
  };
}