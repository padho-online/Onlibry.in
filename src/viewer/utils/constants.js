// src/viewer/utils/constants.js

export const VIEWER_CONSTANTS = {
  // Rendering
  MAX_PAGES_PRELOAD: 3,
  RENDER_DELAY_MS: 100,
  CLEANUP_DELAY_MS: 5000,
  
  // Zoom levels
  ZOOM_LEVELS: [0.5, 0.75, 1, 1.25, 1.5, 2, 2.5, 3],
  DEFAULT_ZOOM: 1,
  MIN_ZOOM: 0.3,
  MAX_ZOOM: 4,
  ZOOM_STEP: 0.1,
  
  // Touch gestures
  PINCH_ZOOM_SENSITIVITY: 0.01,
  SWIPE_THRESHOLD: 50,
  
  // Virtual scroll
  VIRTUAL_SCROLL_BUFFER: 2,
  ITEM_HEIGHT_ESTIMATE: 800,
  
  // Cache
  CACHE_MAX_SIZE: 50,
  CACHE_TTL_MS: 30 * 60 * 1000, // 30 minutes
  
  // Watermark
  WATERMARK_OPACITY: 0.15,
  WATERMARK_ROTATION: -25,
};

export const PREVIEW_LIMITS = {
  MAX_PAGES: 3,
  BLUR_PAGES: false,
  SHOW_PREVIEW_WATERMARK: true,
};

export const EVENT_TYPES = {
  PAGE_CHANGE: 'pageChange',
  ZOOM_CHANGE: 'zoomChange',
  SEARCH_RESULTS: 'searchResults',
  FULLSCREEN_CHANGE: 'fullscreenChange',
};