import React, { useState, useEffect } from 'react';

interface LocationData {
  city: string;
  state: string;
  district: string;
  pincode: string;
}

interface UseLocationFromPincodeResult {
  location: LocationData | null;
  loading: boolean;
  error: string | null;
}

/**
 * Custom hook to fetch location data from pincode
 * Returns actual city and state names instead of "Unknown"
 */
export function useLocationFromPincode(pincode: string | null | undefined): UseLocationFromPincodeResult {
  const [location, setLocation] = useState<LocationData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!pincode || pincode.length !== 6 || !/^\d+$/.test(pincode) || pincode === '123456') {
      setLocation(null);
      setLoading(false);
      setError(null);
      return;
    }

    const fetchLocation = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const response = await fetch(`/api/pincode/location/${pincode}`);
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.success && data.data) {
          setLocation(data.data);
        } else {
          setError('Location not found for this pincode');
          setLocation(null);
        }
      } catch (err) {
        console.error('Error fetching location:', err);
        setError('Failed to fetch location data');
        setLocation(null);
      } finally {
        setLoading(false);
      }
    };

    fetchLocation();
  }, [pincode]);

  return { location, loading, error };
}

/**
 * Utility function to format location display with real-time pincode lookup
 */
export function useFormattedLocation(city: string | undefined, state: string | undefined, pincode: string | undefined): string {
  const { location, loading } = useLocationFromPincode(pincode);
  
  // If we have valid city and state data already, use it
  if (city && state && city !== 'Unknown' && state !== 'Unknown' && city.trim() !== '' && state.trim() !== '') {
    return `${city}, ${state}`;
  }
  
  // If we're loading location data from pincode
  if (loading) {
    return 'Loading location...';
  }
  
  // If we got location data from pincode lookup
  if (location) {
    return `${location.city}, ${location.state}`;
  }
  
  // Final fallback
  return pincode ? `PIN: ${pincode}` : 'Location not available';
}

/**
 * React component for displaying location with real-time pincode lookup
 */
export function LocationDisplay({ 
  city, 
  state, 
  pincode, 
  className = '',
  showPincode = false 
}: {
  city?: string;
  state?: string;
  pincode?: string;
  className?: string;
  showPincode?: boolean;
}) {
  const { location, loading } = useLocationFromPincode(pincode);
  
  // Determine what to display
  let displayText = '';
  
  if (city && state && city !== 'Unknown' && state !== 'Unknown' && city.trim() !== '' && state.trim() !== '') {
    displayText = `${city}, ${state}`;
    if (showPincode && pincode) {
      displayText += ` - ${pincode}`;
    }
  } else if (loading) {
    displayText = 'Loading...';
  } else if (location) {
    displayText = `${location.city}, ${location.state}`;
    if (showPincode && pincode) {
      displayText += ` - ${pincode}`;
    }
  } else {
    displayText = pincode ? `PIN: ${pincode}` : 'Location not available';
  }
  
  return React.createElement('span', { className }, displayText);
}