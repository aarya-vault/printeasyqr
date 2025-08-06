import React, { useState, useEffect } from 'react';

export interface LocationData {
  city: string;
  state: string;
  district?: string;
  pincode: string;
}

export interface ShopLocationData {
  city?: string;
  state?: string;
  pinCode?: string;
}

/**
 * Hook to get location data from pincode
 * Automatically fetches city and state if they're missing but pincode exists
 */
export function useLocationFromPincode(shopData: ShopLocationData) {
  const [location, setLocation] = useState<LocationData | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchLocationData = async () => {
      // If we already have city and state, use them
      if (shopData.city && shopData.state) {
        setLocation({
          city: shopData.city,
          state: shopData.state,
          pincode: shopData.pinCode || ''
        });
        return;
      }

      // If we have pincode but missing city/state, fetch them
      if (shopData.pinCode && shopData.pinCode.length === 6) {
        setIsLoading(true);
        try {
          const response = await fetch(`/api/pincode/location/${shopData.pinCode}`);
          const result = await response.json();

          if (result.success && result.data) {
            setLocation({
              city: result.data.city,
              state: result.data.state,
              district: result.data.district,
              pincode: shopData.pinCode
            });
          } else {
            // Fallback to original data or "Unknown"
            setLocation({
              city: shopData.city || 'Unknown',
              state: shopData.state || 'Unknown',
              pincode: shopData.pinCode
            });
          }
        } catch (error) {
          console.error('Error fetching location from pincode:', error);
          // Fallback to original data or "Unknown"
          setLocation({
            city: shopData.city || 'Unknown',
            state: shopData.state || 'Unknown',
            pincode: shopData.pinCode || ''
          });
        } finally {
          setIsLoading(false);
        }
      } else {
        // No valid pincode, use whatever data we have
        setLocation({
          city: shopData.city || 'Unknown',
          state: shopData.state || 'Unknown',
          pincode: shopData.pinCode || ''
        });
      }
    };

    fetchLocationData();
  }, [shopData.city, shopData.state, shopData.pinCode]);

  return { location, isLoading };
}

/**
 * Utility function to get formatted location string
 */
export function getFormattedLocation(shopData: ShopLocationData): string {
  // If we have both city and state, return them
  if (shopData.city && shopData.state && shopData.city !== 'Unknown' && shopData.state !== 'Unknown') {
    return `${shopData.city}, ${shopData.state}`;
  }

  // If we don't have city/state but have pincode, indicate it's being fetched
  if (shopData.pinCode && shopData.pinCode.length === 6) {
    return `PIN: ${shopData.pinCode}`;
  }

  // Default fallback
  return 'Location not available';
}

/**
 * Synchronous utility to get location display text
 * This will show current data or fallback appropriately
 */
export function getLocationDisplayText(shopData: ShopLocationData): string {
  // If we have both city and state, use them
  if (shopData.city && shopData.state && 
      shopData.city !== 'Unknown' && shopData.state !== 'Unknown' &&
      shopData.city.trim() !== '' && shopData.state.trim() !== '') {
    return `${shopData.city}, ${shopData.state}`;
  }

  // If we have pincode, show that as a fallback
  if (shopData.pinCode && shopData.pinCode.length === 6) {
    return `PIN: ${shopData.pinCode}`;
  }

  // Last resort
  return 'Location not available';
}