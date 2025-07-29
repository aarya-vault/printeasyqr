/**
 * Get the proper domain for QR codes and external links
 * Uses Replit domain when available, otherwise falls back to current domain
 */
export function getAppDomain(): string {
  // For Replit deployments, use the actual origin
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }
  
  // Fallback for server-side rendering
  return 'https://localhost:5000';
}

/**
 * Generate a shop URL that works on mobile devices
 */
export function getShopUrl(shopSlug: string): string {
  return `${getAppDomain()}/shop/${shopSlug}`;
}