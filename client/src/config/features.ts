/**
 * Feature Flags Configuration
 * 
 * This file controls feature toggles for the PrintEasy QR platform.
 * Change these values to enable/disable features without code changes.
 */

export const FEATURE_FLAGS = {
  /**
   * WhatsApp OTP Verification
   * 
   * When TRUE: Full OTP verification flow is enabled
   * - Users must verify phone number via WhatsApp OTP before placing orders
   * - Homepage login requires OTP verification
   * - Enhanced security and user verification
   * 
   * When FALSE: OTP verification is bypassed
   * - Direct order submission without OTP verification
   * - Simplified login flow using phone numbers
   * - Faster user experience for testing/development
   * 
   * Default: false (temporarily disabled)
   */
  WHATSAPP_OTP_ENABLED: false,

  /**
   * Real-time Notifications
   * 
   * Controls visual and audio notifications for chat messages and order updates
   */
  REALTIME_NOTIFICATIONS_ENABLED: true,

  /**
   * Auto Data Population
   * 
   * Controls automatic filling of user data in forms
   */
  AUTO_DATA_POPULATION_ENABLED: true,
} as const;

/**
 * Helper function to check if a feature is enabled
 */
export const isFeatureEnabled = (feature: keyof typeof FEATURE_FLAGS): boolean => {
  return FEATURE_FLAGS[feature];
};

/**
 * Environment-based overrides
 * 
 * These can override the default values based on environment variables
 */
export const getFeatureFlag = (feature: keyof typeof FEATURE_FLAGS): boolean => {
  // Check for environment variable override
  const envKey = `VITE_${feature}`;
  const envValue = import.meta.env[envKey];
  
  if (envValue !== undefined) {
    return envValue === 'true';
  }
  
  // Return default value
  return FEATURE_FLAGS[feature];
};