// SEO utilities for PrintEasy QR platform
// Handles dynamic social media meta tags and SEO exclusions

export const excludeFromSEO = (pathname: string): boolean => {
  const excludedPaths = [
    '/order-confirmation',
    '/customer-dashboard', 
    '/customer-orders',
    '/shop-dashboard',
    '/shop-owner-dashboard',
    '/redesigned-shop-owner-dashboard',
    '/admin-dashboard',
    '/shop-order-history',
    '/shop-analytics',
    '/chat',
    '/settings'
  ];
  
  return excludedPaths.some(path => pathname.startsWith(path));
};

export const setNoIndexMeta = () => {
  // Remove any existing robots meta
  const existingRobots = document.querySelector('meta[name="robots"]');
  if (existingRobots) {
    existingRobots.remove();
  }
  
  // Add noindex, nofollow for private pages
  const robotsMeta = document.createElement('meta');
  robotsMeta.setAttribute('name', 'robots');
  robotsMeta.setAttribute('content', 'noindex, nofollow, noarchive, nosnippet');
  document.head.appendChild(robotsMeta);
};

export const removeAllSEOMeta = () => {
  // Remove all SEO-related meta tags
  const seoMeta = document.querySelectorAll(
    'meta[property^="og:"], meta[name^="twitter:"], meta[name="description"], meta[name="keywords"], script[type="application/ld+json"]'
  );
  seoMeta.forEach(tag => tag.remove());
  
  // Remove canonical
  const canonical = document.querySelector('link[rel="canonical"]');
  if (canonical) canonical.remove();
};

export const createSocialMediaMeta = (data: {
  title: string;
  description: string;
  imageUrl: string;
  url: string;
  siteName?: string;
  type?: string;
  keywords?: string;
}) => {
  const {
    title,
    description,
    imageUrl,
    url,
    siteName = 'PrintEasy QR',
    type = 'website',
    keywords = ''
  } = data;

  // Remove existing meta tags first
  const existingMeta = document.querySelectorAll(
    'meta[property^="og:"], meta[name^="twitter:"], meta[name="description"], meta[name="keywords"]'
  );
  existingMeta.forEach(tag => tag.remove());

  // Create new meta tags
  const metaTags = [
    { name: 'description', content: description },
    { name: 'keywords', content: keywords },
    { name: 'robots', content: 'index, follow' },
    
    // Open Graph
    { property: 'og:title', content: title },
    { property: 'og:description', content: description },
    { property: 'og:image', content: imageUrl },
    { property: 'og:url', content: url },
    { property: 'og:type', content: type },
    { property: 'og:site_name', content: siteName },
    { property: 'og:locale', content: 'en_IN' },
    
    // Twitter Cards
    { name: 'twitter:card', content: 'summary_large_image' },
    { name: 'twitter:title', content: title },
    { name: 'twitter:description', content: description },
    { name: 'twitter:image', content: imageUrl }
  ];

  metaTags.forEach(({ name, property, content }) => {
    const meta = document.createElement('meta');
    if (name) meta.setAttribute('name', name);
    if (property) meta.setAttribute('property', property);
    meta.setAttribute('content', content);
    document.head.appendChild(meta);
  });

  // Add canonical URL
  let canonical = document.querySelector('link[rel="canonical"]');
  if (!canonical) {
    canonical = document.createElement('link');
    canonical.setAttribute('rel', 'canonical');
    document.head.appendChild(canonical);
  }
  canonical.setAttribute('href', url);

  // Update page title
  document.title = title;
};

export const createBusinessStructuredData = (business: {
  name: string;
  description: string;
  address: string;
  city: string;
  phone: string;
  url: string;
  imageUrl: string;
}) => {
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    'name': business.name,
    'description': business.description,
    'address': {
      '@type': 'PostalAddress',
      'streetAddress': business.address,
      'addressLocality': business.city,
      'addressCountry': 'IN'
    },
    'telephone': business.phone,
    'url': business.url,
    'image': business.imageUrl,
    'priceRange': '₹'
  };

  let jsonLd = document.querySelector('script[type="application/ld+json"]');
  if (!jsonLd) {
    jsonLd = document.createElement('script');
    jsonLd.setAttribute('type', 'application/ld+json');
    document.head.appendChild(jsonLd);
  }
  jsonLd.textContent = JSON.stringify(structuredData);
};