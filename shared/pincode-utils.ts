import { getPincodeData, isValidIndianPincode } from './indian-pincode-data';

export interface LocationData {
  city: string;
  state: string;
  district?: string;
  pincode: string;
}

/**
 * Auto-fetch city and state from Indian pincode
 * Returns the location data if found, null otherwise
 */
export async function autoFetchLocationFromPincode(pincode: string): Promise<LocationData | null> {
  try {
    // Validate pincode format first
    if (!isValidIndianPincode(pincode)) {
      console.warn('Invalid pincode format:', pincode);
      return null;
    }

    // Get data from local database
    const pincodeData = getPincodeData(pincode);
    
    if (pincodeData) {
      console.log('✅ Pincode found in database:', pincodeData);
      return {
        city: pincodeData.city,
        state: pincodeData.state,
        district: pincodeData.district,
        pincode: pincodeData.pincode
      };
    }

    // If not found in local database, try external API as fallback
    console.log('⚠️ Pincode not found in local database, trying external API...');
    return await fetchFromExternalAPI(pincode);
    
  } catch (error) {
    console.error('Error fetching location from pincode:', error);
    return null;
  }
}

/**
 * Fallback function to fetch from external API
 * Can be replaced with any reliable Indian pincode API
 */
async function fetchFromExternalAPI(pincode: string): Promise<LocationData | null> {
  try {
    // Using India Post API as fallback
    const response = await fetch(`https://api.postalpincode.in/pincode/${pincode}`);
    
    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data && data.length > 0 && data[0].Status === 'Success' && data[0].PostOffice && data[0].PostOffice.length > 0) {
      const postOffice = data[0].PostOffice[0];
      
      return {
        city: postOffice.District || postOffice.Name,
        state: postOffice.State,
        district: postOffice.District,
        pincode: pincode
      };
    }
    
    return null;
  } catch (error) {
    console.error('External API failed:', error);
    return null;
  }
}

/**
 * Client-side utility for form auto-completion
 */
export function usePincodeAutoComplete() {
  return {
    async fetchLocation(pincode: string): Promise<LocationData | null> {
      if (!pincode || pincode.length !== 6) {
        return null;
      }
      
      return await autoFetchLocationFromPincode(pincode);
    },
    
    validatePincode(pincode: string): boolean {
      return isValidIndianPincode(pincode);
    }
  };
}