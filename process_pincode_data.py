#!/usr/bin/env python3
"""
Process the comprehensive Indian pincode CSV data into a JavaScript module
Creates a complete database with all Indian pincodes including Gujarat, Ahmedabad, and all states
"""

import csv
import json
import sys
from collections import defaultdict

def process_pincode_csv(csv_file_path, output_file_path):
    """Process CSV file and create comprehensive JavaScript pincode database"""
    
    pincode_data = {}
    state_counts = defaultdict(int)
    district_counts = defaultdict(int)
    
    print("🔄 Processing comprehensive Indian pincode CSV data...")
    
    try:
        with open(csv_file_path, 'r', encoding='utf-8') as csvfile:
            reader = csv.DictReader(csvfile)
            
            processed_count = 0
            duplicate_count = 0
            
            for row in reader:
                pincode = row.get('pincode', '').strip()
                district = row.get('district', '').strip()
                state = row.get('statename', '').strip()
                office_name = row.get('officename', '').strip()
                
                # Skip invalid entries
                if not pincode or len(pincode) != 6 or not pincode.isdigit():
                    continue
                    
                if not district or not state:
                    continue
                
                # Clean up data
                district = district.replace('"', '').strip()
                state = state.replace('"', '').strip()
                office_name = office_name.replace('"', '').strip()
                
                # Normalize state names
                state_mapping = {
                    'ANDHRA PRADESH': 'Andhra Pradesh',
                    'ARUNACHAL PRADESH': 'Arunachal Pradesh',
                    'ASSAM': 'Assam',
                    'BIHAR': 'Bihar',
                    'CHHATTISGARH': 'Chhattisgarh',
                    'GOA': 'Goa',
                    'GUJARAT': 'Gujarat',
                    'HARYANA': 'Haryana',
                    'HIMACHAL PRADESH': 'Himachal Pradesh',
                    'JHARKHAND': 'Jharkhand',
                    'KARNATAKA': 'Karnataka',
                    'KERALA': 'Kerala',
                    'MADHYA PRADESH': 'Madhya Pradesh',
                    'MAHARASHTRA': 'Maharashtra',
                    'MANIPUR': 'Manipur',
                    'MEGHALAYA': 'Meghalaya',
                    'MIZORAM': 'Mizoram',
                    'NAGALAND': 'Nagaland',
                    'ODISHA': 'Odisha',
                    'PUNJAB': 'Punjab',
                    'RAJASTHAN': 'Rajasthan',
                    'SIKKIM': 'Sikkim',
                    'TAMIL NADU': 'Tamil Nadu',
                    'TELANGANA': 'Telangana',
                    'TRIPURA': 'Tripura',
                    'UTTAR PRADESH': 'Uttar Pradesh',
                    'UTTARAKHAND': 'Uttarakhand',
                    'WEST BENGAL': 'West Bengal',
                    'ANDAMAN AND NICOBAR ISLANDS': 'Andaman and Nicobar Islands',
                    'CHANDIGARH': 'Chandigarh',
                    'DADRA AND NAGAR HAVELI AND DAMAN AND DIU': 'Dadra and Nagar Haveli and Daman and Diu',
                    'DELHI': 'Delhi',
                    'JAMMU AND KASHMIR': 'Jammu and Kashmir',
                    'LADAKH': 'Ladakh',
                    'LAKSHADWEEP': 'Lakshadweep',
                    'PUDUCHERRY': 'Puducherry'
                }
                
                normalized_state = state_mapping.get(state.upper(), state)
                
                # Normalize district names
                district_mapping = {
                    'AHMADABAD': 'Ahmedabad',
                    'SPSR NELLORE': 'Nellore',
                    'Y.S.R.': 'YSR Kadapa',
                    'MAHBUBNAGAR': 'Mahabubnagar'
                }
                
                normalized_district = district_mapping.get(district.upper(), district)
                
                # Clean and map data properly:
                # For major cities, use district name as city
                # For smaller areas, use cleaned office name as district/area within city
                
                # Clean office name by removing postal suffixes and numbers
                cleaned_office = office_name
                suffixes_to_remove = [' B.O', ' S.O', ' H.O', ' BO', ' SO', ' HO', ' No.1', ' No.2', ' No.3', ' No.4', ' No.5']
                for suffix in suffixes_to_remove:
                    cleaned_office = cleaned_office.replace(suffix, '')
                cleaned_office = cleaned_office.strip()
                
                # Major city mapping - use district as city for these
                major_cities = {
                    'AHMADABAD': 'Ahmedabad',
                    'AHMEDABAD': 'Ahmedabad', 
                    'MUMBAI CITY': 'Mumbai',
                    'MUMBAI': 'Mumbai',
                    'BANGALORE URBAN': 'Bangalore',
                    'BANGALORE': 'Bangalore',
                    'NEW DELHI': 'New Delhi',
                    'DELHI': 'Delhi',
                    'KOLKATA': 'Kolkata',
                    'CHENNAI': 'Chennai',
                    'HYDERABAD': 'Hyderabad',
                    'PUNE': 'Pune',
                    'SURAT': 'Surat',
                    'JAIPUR': 'Jaipur',
                    'LUCKNOW': 'Lucknow',
                    'KANPUR': 'Kanpur',
                    'NAGPUR': 'Nagpur',
                    'INDORE': 'Indore',
                    'THANE': 'Thane',
                    'BHOPAL': 'Bhopal',
                    'VISAKHAPATNAM': 'Visakhapatnam',
                    'PIMPRI CHINCHWAD': 'Pimpri Chinchwad',
                    'PATNA': 'Patna',
                    'VADODARA': 'Vadodara',
                    'LUDHIANA': 'Ludhiana',
                    'RAJKOT': 'Rajkot',
                    'AGRA': 'Agra',
                    'NASHIK': 'Nashik',
                    'FARIDABAD': 'Faridabad',
                    'MEERUT': 'Meerut',
                    'KALYAN DOMBIVALI': 'Kalyan',
                    'VASAI VIRAR': 'Vasai',
                    'VARANASI': 'Varanasi',
                    'SRINAGAR': 'Srinagar',
                    'DHANBAD': 'Dhanbad',
                    'AURANGABAD': 'Aurangabad',
                    'NAVI MUMBAI': 'Navi Mumbai',
                    'ALLAHABAD': 'Allahabad',
                    'AMRITSAR': 'Amritsar',
                    'GWALIOR': 'Gwalior',
                    'COIMBATORE': 'Coimbatore',
                    'MADURAI': 'Madurai',
                    'JODHPUR': 'Jodhpur',
                    'KOTA': 'Kota',
                    'GUWAHATI': 'Guwahati',
                    'CHANDIGARH': 'Chandigarh'
                }
                
                # Check if district is a major city
                city = major_cities.get(normalized_district.upper(), None)
                
                if city:
                    # For major cities, city name comes from major_cities mapping
                    # District should remain the geographic district (normalized_district)
                    # The cleaned office name becomes the area/locality info (we can store it separately or ignore)
                    district_name = normalized_district
                else:
                    # For smaller towns/areas, use cleaned office name as city
                    city = cleaned_office if cleaned_office and cleaned_office.upper() not in ['NA', 'N/A', ''] else normalized_district
                    district_name = normalized_district
                
                # Create entry (prioritize more specific entries)
                if pincode not in pincode_data:
                    pincode_data[pincode] = {
                        'pincode': pincode,
                        'city': city,
                        'state': normalized_state,
                        'district': district_name
                    }
                    state_counts[normalized_state] += 1
                    district_counts[normalized_district] += 1
                    processed_count += 1
                else:
                    # Update if current entry has better city information
                    current_city = pincode_data[pincode]['city']
                    if len(city) > len(current_city) and city.upper() not in ['BO', 'SO', 'HO']:
                        pincode_data[pincode]['city'] = city
                        pincode_data[pincode]['district'] = district_name
                    duplicate_count += 1
                
                if processed_count % 10000 == 0:
                    print(f"✅ Processed {processed_count} unique pincodes...")
    
    except Exception as e:
        print(f"❌ Error processing CSV file: {e}")
        return False
    
    print(f"✅ Processing complete!")
    print(f"📊 Statistics:")
    print(f"   • Unique pincodes: {len(pincode_data)}")
    print(f"   • States covered: {len(state_counts)}")
    print(f"   • Districts covered: {len(district_counts)}")
    print(f"   • Duplicate entries skipped: {duplicate_count}")
    
    # Show coverage for key states
    key_states = ['Gujarat', 'Maharashtra', 'Karnataka', 'Delhi', 'Tamil Nadu', 'Uttar Pradesh']
    print(f"🗺️  Key State Coverage:")
    for state in key_states:
        count = state_counts.get(state, 0)
        print(f"   • {state}: {count} pincodes")
    
    # Check Gujarat/Ahmedabad specifically
    gujarat_count = sum(1 for data in pincode_data.values() if data['state'] == 'Gujarat')
    ahmedabad_count = sum(1 for data in pincode_data.values() 
                         if data['state'] == 'Gujarat' and 'ahmedabad' in data['district'].lower())
    print(f"🎯 Gujarat Coverage: {gujarat_count} pincodes")
    print(f"🎯 Ahmedabad Coverage: {ahmedabad_count} pincodes")
    
    # Create JavaScript module
    print(f"📝 Creating JavaScript module: {output_file_path}")
    
    try:
        with open(output_file_path, 'w', encoding='utf-8') as jsfile:
            jsfile.write("""// Comprehensive Indian Pincode Database
// Generated from official Indian postal data
// Covers all states including Gujarat, Ahmedabad, and complete coverage

// Complete Indian Pincodes Database
const INDIAN_PINCODE_DATABASE = """)
            
            # Write the data as a JavaScript object
            jsfile.write(json.dumps(pincode_data, indent=2, ensure_ascii=False))
            
            jsfile.write(""";

// Get pincode data by pincode
function getPincodeData(pincode) {
  if (!pincode || typeof pincode !== 'string') {
    return null;
  }
  
  const normalizedPincode = pincode.trim();
  return INDIAN_PINCODE_DATABASE[normalizedPincode] || null;
}

// Validate Indian pincode format and existence
function isValidIndianPincode(pincode) {
  if (!pincode || typeof pincode !== 'string') {
    return false;
  }
  
  const normalizedPincode = pincode.trim();
  
  // Check format (6 digits)
  if (!/^\\d{6}$/.test(normalizedPincode)) {
    return false;
  }
  
  // Check if pincode exists in database
  return INDIAN_PINCODE_DATABASE[normalizedPincode] !== undefined;
}

// Search function for partial pincode matches
function searchPincodesByCity(cityName) {
  const results = [];
  const searchTerm = cityName.toLowerCase().trim();
  
  for (const pincodeData of Object.values(INDIAN_PINCODE_DATABASE)) {
    if (pincodeData.city.toLowerCase().includes(searchTerm) ||
        pincodeData.state.toLowerCase().includes(searchTerm) ||
        pincodeData.district.toLowerCase().includes(searchTerm)) {
      results.push(pincodeData);
    }
  }
  
  return results.slice(0, 20); // Limit to 20 results
}

// Get all unique cities
function getAllCities() {
  const cities = new Set();
  for (const data of Object.values(INDIAN_PINCODE_DATABASE)) {
    cities.add(data.city);
  }
  return Array.from(cities).sort();
}

// Get all unique states
function getAllStates() {
  const states = new Set();
  for (const data of Object.values(INDIAN_PINCODE_DATABASE)) {
    states.add(data.state);
  }
  return Array.from(states).sort();
}

// Get all pincodes for a specific state
function getPincodesByState(stateName) {
  const results = [];
  const searchState = stateName.toLowerCase().trim();
  
  for (const data of Object.values(INDIAN_PINCODE_DATABASE)) {
    if (data.state.toLowerCase() === searchState) {
      results.push(data);
    }
  }
  
  return results;
}

// CommonJS exports
module.exports = {
  getPincodeData,
  isValidIndianPincode,
  searchPincodesByCity,
  getAllCities,
  getAllStates,
  getPincodesByState,
  INDIAN_PINCODE_DATABASE
};
""")
        
        print(f"✅ JavaScript module created successfully!")
        return True
        
    except Exception as e:
        print(f"❌ Error creating JavaScript file: {e}")
        return False

if __name__ == "__main__":
    csv_file = "attached_assets/5c2f62fe-5afa-4119-a499-fec9d604d5bd_1754485442039.csv"
    output_file = "shared/indian-pincode-data.js"
    
    success = process_pincode_csv(csv_file, output_file)
    if success:
        print("🎉 Comprehensive Indian pincode database created successfully!")
        print("📍 Includes complete coverage of Gujarat, Ahmedabad, and all Indian states")
    else:
        print("❌ Failed to create pincode database")
        sys.exit(1)