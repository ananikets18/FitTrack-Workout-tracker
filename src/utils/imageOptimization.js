/**
 * Image Optimization Utilities
 * Helpers for lazy loading and responsive images
 */

/**
 * Generate srcset for responsive images
 */
export const generateSrcSet = (imagePath, widths = [320, 640, 960, 1280]) => {
  const extension = imagePath.split('.').pop();
  const basePath = imagePath.replace(`.${extension}`, '');
  
  return widths
    .map(width => `${basePath}-${width}w.${extension} ${width}w`)
    .join(', ');
};

/**
 * Get optimal image size based on viewport
 */
export const getOptimalImageSize = () => {
  const width = window.innerWidth;
  
  if (width <= 640) return 'small';
  if (width <= 1024) return 'medium';
  return 'large';
};

/**
 * Lazy load image with intersection observer
 */
export const lazyLoadImage = (imageElement, options = {}) => {
  const defaultOptions = {
    root: null,
    rootMargin: '50px',
    threshold: 0.01,
  };

  const observerOptions = { ...defaultOptions, ...options };

  const imageObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const img = entry.target;
        const src = img.dataset.src;
        const srcset = img.dataset.srcset;

        if (src) {
          img.src = src;
        }
        if (srcset) {
          img.srcset = srcset;
        }

        img.classList.remove('lazy');
        observer.unobserve(img);
      }
    });
  }, observerOptions);

  imageObserver.observe(imageElement);

  return () => imageObserver.disconnect();
};

/**
 * Preload critical images
 */
export const preloadImage = (src) => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
};

/**
 * Convert image to WebP format (if supported)
 */
export const supportsWebP = () => {
  if (typeof window === 'undefined') return false;
  
  const canvas = document.createElement('canvas');
  if (canvas.getContext && canvas.getContext('2d')) {
    return canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
  }
  return false;
};

/**
 * Get optimized image format
 */
export const getOptimizedImageUrl = (url) => {
  if (supportsWebP() && !url.endsWith('.svg')) {
    return url.replace(/\.(jpg|jpeg|png)$/, '.webp');
  }
  return url;
};
