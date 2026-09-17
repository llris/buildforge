import { useEffect } from 'react';

export default function SEO({
  title,
  description = 'BuildForge - Premium Custom PC Builder and Hardware Marketplace with real-time compatibility validation.',
  image = 'https://placehold.co/1200x630?text=BuildForge+Hardware',
  url,
  jsonLd,
}) {
  useEffect(() => {
    // 1. Page Title
    const siteTitle = 'BuildForge';
    document.title = title ? `${title} | ${siteTitle}` : 'BuildForge | Custom PC Builder & Hardware Store';

    // 2. Meta Helper
    const setMetaTag = (attr, key, content) => {
      if (!content) return;
      let el = document.querySelector(`meta[${attr}="${key}"]`);
      if (!el) {
        el = document.createElement('meta');
        el.setAttribute(attr, key);
        document.head.appendChild(el);
      }
      el.setAttribute('content', content);
    };

    setMetaTag('name', 'description', description);
    setMetaTag('property', 'og:title', title ? `${title} | BuildForge` : 'BuildForge');
    setMetaTag('property', 'og:description', description);
    setMetaTag('property', 'og:image', image);
    setMetaTag('property', 'og:url', url || window.location.href);
    setMetaTag('property', 'og:type', 'website');
    setMetaTag('name', 'twitter:card', 'summary_large_image');
    setMetaTag('name', 'twitter:title', title ? `${title} | BuildForge` : 'BuildForge');
    setMetaTag('name', 'twitter:description', description);
    setMetaTag('name', 'twitter:image', image);

    // 3. JSON-LD Structured Data
    if (jsonLd) {
      let script = document.getElementById('bf-jsonld');
      if (!script) {
        script = document.createElement('script');
        script.id = 'bf-jsonld';
        script.type = 'application/ld+json';
        document.head.appendChild(script);
      }
      script.textContent = JSON.stringify(jsonLd);
    }

    return () => {
      const script = document.getElementById('bf-jsonld');
      if (script) script.remove();
    };
  }, [title, description, image, url, jsonLd]);

  return null;
}
