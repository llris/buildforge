/**
 * Cleanly formats a product's name preventing brand duplication.
 * E.g., if brand is "AMD" and name is "AMD Ryzen 5 7600X", it prevents "AMD AMD Ryzen 5 7600X".
 */
export const formatProductTitle = (productOrName, brand = '') => {
  if (!productOrName) return '';

  let name = '';
  let b = brand;

  if (typeof productOrName === 'object') {
    name = productOrName.name || '';
    b = productOrName.brand || brand;
  } else {
    name = String(productOrName);
  }

  name = name.trim();
  b = (b || '').trim();

  if (!b) return name;

  // Check if name starts with brand + space (case insensitive)
  const regex = new RegExp(`^${b}\\s+`, 'i');
  if (regex.test(name)) {
    return name; // Already contains brand prefix
  }

  return name;
};

/**
 * Strips brand from name if needed for badge + name side-by-side rendering
 */
export const stripBrandFromName = (name = '', brand = '') => {
  if (!name || !brand) return name;
  const regex = new RegExp(`^${brand}\\s+`, 'i');
  return name.replace(regex, '');
};

/**
 * Currency formatter for INR
 */
export const formatINR = (val) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(val || 0);
};

/**
 * Optimizes image URLs if using Cloudinary or external CDN
 */
export const optimizeImageUrl = (url, width = 400) => {
  if (!url) return 'https://placehold.co/400x400?text=Hardware';
  if (url.includes('cloudinary.com') && url.includes('/upload/')) {
    return url.replace('/upload/', `/upload/w_${width},q_auto,f_auto/`);
  }
  if (url.includes('unsplash.com')) {
    return `${url}&w=${width}&q=80&auto=format`;
  }
  return url;
};
