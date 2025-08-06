// PIN Code lookup service for Indian postal codes
class PinCodeService {
  // Indian PIN code to city/state mapping (sample data - in production this would be a complete database)
  static pinCodeData = {
    // Major cities - sample data
    '110001': { city: 'New Delhi', state: 'Delhi' },
    '400001': { city: 'Mumbai', state: 'Maharashtra' },
    '700001': { city: 'Kolkata', state: 'West Bengal' },
    '600001': { city: 'Chennai', state: 'Tamil Nadu' },
    '560001': { city: 'Bangalore', state: 'Karnataka' },
    '500001': { city: 'Hyderabad', state: 'Telangana' },
    '302001': { city: 'Jaipur', state: 'Rajasthan' },
    '380001': { city: 'Ahmedabad', state: 'Gujarat' },
    '411001': { city: 'Pune', state: 'Maharashtra' },
    '695001': { city: 'Thiruvananthapuram', state: 'Kerala' },
    '682001': { city: 'Kochi', state: 'Kerala' },
    '226001': { city: 'Lucknow', state: 'Uttar Pradesh' },
    '160001': { city: 'Chandigarh', state: 'Chandigarh' },
    '751001': { city: 'Bhubaneswar', state: 'Odisha' },
    '781001': { city: 'Guwahati', state: 'Assam' },
    '834001': { city: 'Ranchi', state: 'Jharkhand' },
    '492001': { city: 'Raipur', state: 'Chhattisgarh' },
    '533001': { city: 'Rajahmundry', state: 'Andhra Pradesh' },
    '515001': { city: 'Anantapur', state: 'Andhra Pradesh' },
    '524001': { city: 'Nellore', state: 'Andhra Pradesh' },
    '530001': { city: 'Visakhapatnam', state: 'Andhra Pradesh' },
    '641001': { city: 'Coimbatore', state: 'Tamil Nadu' },
    '620001': { city: 'Tiruchirappalli', state: 'Tamil Nadu' },
    '625001': { city: 'Madurai', state: 'Tamil Nadu' },
    '673001': { city: 'Kozhikode', state: 'Kerala' },
    '670001': { city: 'Kannur', state: 'Kerala' },
    '686001': { city: 'Kottayam', state: 'Kerala' },
    '560002': { city: 'Bangalore', state: 'Karnataka' },
    '560003': { city: 'Bangalore', state: 'Karnataka' },
    '560004': { city: 'Bangalore', state: 'Karnataka' },
    '560005': { city: 'Bangalore', state: 'Karnataka' },
    '560006': { city: 'Bangalore', state: 'Karnataka' },
    '560007': { city: 'Bangalore', state: 'Karnataka' },
    '560008': { city: 'Bangalore', state: 'Karnataka' },
    '560009': { city: 'Bangalore', state: 'Karnataka' },
    '560010': { city: 'Bangalore', state: 'Karnataka' },
    '400002': { city: 'Mumbai', state: 'Maharashtra' },
    '400003': { city: 'Mumbai', state: 'Maharashtra' },
    '400004': { city: 'Mumbai', state: 'Maharashtra' },
    '400005': { city: 'Mumbai', state: 'Maharashtra' },
    '400006': { city: 'Mumbai', state: 'Maharashtra' },
    '400007': { city: 'Mumbai', state: 'Maharashtra' },
    '400008': { city: 'Mumbai', state: 'Maharashtra' },
    '400009': { city: 'Mumbai', state: 'Maharashtra' },
    '400010': { city: 'Mumbai', state: 'Maharashtra' },
    '110002': { city: 'New Delhi', state: 'Delhi' },
    '110003': { city: 'New Delhi', state: 'Delhi' },
    '110004': { city: 'New Delhi', state: 'Delhi' },
    '110005': { city: 'New Delhi', state: 'Delhi' },
    '110006': { city: 'New Delhi', state: 'Delhi' },
    '110007': { city: 'New Delhi', state: 'Delhi' },
    '110008': { city: 'New Delhi', state: 'Delhi' },
    '110009': { city: 'New Delhi', state: 'Delhi' },
    '110010': { city: 'New Delhi', state: 'Delhi' },
    // Add more PIN codes as needed
  };

  // Lookup city and state by PIN code
  static async lookupByPinCode(pinCode) {
    try {
      // Validate PIN code format
      if (!pinCode || !/^\d{6}$/.test(pinCode)) {
        throw new Error('Invalid PIN code format. Must be 6 digits.');
      }

      // First try local lookup
      const localResult = this.pinCodeData[pinCode];
      if (localResult) {
        return {
          success: true,
          data: {
            pinCode,
            city: localResult.city,
            state: localResult.state,
            source: 'local'
          }
        };
      }

      // If not found locally, try external API as fallback
      try {
        const response = await fetch(`https://api.postalpincode.in/pincode/${pinCode}`);
        const apiData = await response.json();
        
        if (apiData && apiData[0] && apiData[0].Status === 'Success' && apiData[0].PostOffice && apiData[0].PostOffice.length > 0) {
          const postOffice = apiData[0].PostOffice[0];
          return {
            success: true,
            data: {
              pinCode,
              city: postOffice.District,
              state: postOffice.State,
              source: 'api'
            }
          };
        }
      } catch (apiError) {
        console.warn('External API failed:', apiError.message);
      }

      // If both local and API fail, return error
      return {
        success: false,
        error: 'PIN code not found. Please verify the PIN code or enter city/state manually.',
        data: { pinCode }
      };

    } catch (error) {
      return {
        success: false,
        error: error.message,
        data: { pinCode }
      };
    }
  }

  // Validate Indian PIN code format
  static validatePinCode(pinCode) {
    return /^\d{6}$/.test(pinCode);
  }

  // Get all available states
  static getAllStates() {
    const states = new Set();
    Object.values(this.pinCodeData).forEach(location => {
      states.add(location.state);
    });
    return Array.from(states).sort();
  }

  // Get cities by state
  static getCitiesByState(state) {
    const cities = new Set();
    Object.values(this.pinCodeData).forEach(location => {
      if (location.state === state) {
        cities.add(location.city);
      }
    });
    return Array.from(cities).sort();
  }
}

module.exports = PinCodeService;