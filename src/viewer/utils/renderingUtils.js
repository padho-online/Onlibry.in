// src/viewer/utils/renderingUtils.js

/**
 * Clean up canvas to free memory
 */
export function cleanupCanvas(canvas) {
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }
  canvas.width = 0;
  canvas.height = 0;
}

/**
 * Debounce function for performance
 */
export function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Throttle function for scroll events
 */
export function throttle(func, limit) {
  let inThrottle;
  return function(...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

/**
 * Generate dynamic watermark text
 */
export function generateWatermarkText(userEmail, timestamp) {
  return `${userEmail || 'Guest'} • ${new Date(timestamp).toLocaleDateString()} • Onlibry.in`;
}

/**
 * Check if device is mobile
 */
export function isMobile() {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

/**
 * Get optimal scale for fit to width
 */
export function getFitToWidthScale(viewportWidth, pageWidth) {
  return viewportWidth / pageWidth;
}

/**
 * Get optimal scale for fit to page
 */
export function getFitToPageScale(viewportHeight, pageHeight, viewportWidth, pageWidth) {
  const scaleByHeight = viewportHeight / pageHeight;
  const scaleByWidth = viewportWidth / pageWidth;
  return Math.min(scaleByHeight, scaleByWidth);
}