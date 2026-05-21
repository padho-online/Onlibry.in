// src/services/cacheService.js
// Frontend Caching Service - 2 Layer Cache (Memory + localStorage)

// ============================================
// CONFIGURATION
// ============================================

const CACHE_CONFIG = {
  files: {
    ttl: 5 * 60 * 1000,        // 5 minutes
    storage: 'memory',          // memory only (session restart pe clear)
    key: 'cache_files'
  },
  categories: {
    ttl: 10 * 60 * 1000,        // 10 minutes
    storage: 'local',           // localStorage (persists across refresh)
    key: 'cache_categories'
  },
  notifications: {
    ttl: 5 * 60 * 1000,         // 5 minutes
    storage: 'memory',
    key: 'cache_notifications'
  },
  quickAccess: {
    ttl: 10 * 60 * 1000,        // 10 minutes
    storage: 'local',
    key: 'cache_quick_access'
  },
  sliderCards: {
    ttl: 10 * 60 * 1000,        // 10 minutes
    storage: 'local',
    key: 'cache_slider_cards'
  },
  mockTests: {
    ttl: 10 * 60 * 1000,        // 10 minutes
    storage: 'local',
    key: 'cache_mock_tests'
  },
  quizzes: {
    ttl: 10 * 60 * 1000,        // 10 minutes
    storage: 'local',
    key: 'cache_quizzes'
  }
};

// In-memory cache store (for memory-only caches)
const memoryCache = new Map();

// ============================================
// HELPER FUNCTIONS
// ============================================

function getFromLocalStorage(key) {
  try {
    const item = localStorage.getItem(key);
    if (!item) return null;
    
    const data = JSON.parse(item);
    const now = Date.now();
    
    // Check if expired
    if (data.expiry && data.expiry < now) {
      localStorage.removeItem(key);
      return null;
    }
    
    return data.value;
  } catch (e) {
    console.error('LocalStorage read error:', e);
    return null;
  }
}

function setToLocalStorage(key, value, ttl) {
  try {
    const item = {
      value: value,
      expiry: Date.now() + ttl
    };
    localStorage.setItem(key, JSON.stringify(item));
  } catch (e) {
    console.error('LocalStorage write error:', e);
  }
}

function getFromMemoryCache(key) {
  const item = memoryCache.get(key);
  if (!item) return null;
  
  const now = Date.now();
  if (item.expiry && item.expiry < now) {
    memoryCache.delete(key);
    return null;
  }
  
  return item.value;
}

function setToMemoryCache(key, value, ttl) {
  memoryCache.set(key, {
    value: value,
    expiry: Date.now() + ttl
  });
}

// ============================================
// MAIN CACHE FUNCTIONS
// ============================================

/**
 * Get data from cache (automatic memory/local storage selection)
 * @param {string} cacheName - From CACHE_CONFIG keys
 * @returns {any|null} Cached data or null
 */
export function getFromCache(cacheName) {
  const config = CACHE_CONFIG[cacheName];
  if (!config) {
    console.warn(`Unknown cache: ${cacheName}`);
    return null;
  }
  
  if (config.storage === 'local') {
    return getFromLocalStorage(config.key);
  } else {
    return getFromMemoryCache(config.key);
  }
}

/**
 * Set data to cache
 * @param {string} cacheName - From CACHE_CONFIG keys
 * @param {any} data - Data to cache
 */
export function setToCache(cacheName, data) {
  const config = CACHE_CONFIG[cacheName];
  if (!config) {
    console.warn(`Unknown cache: ${cacheName}`);
    return;
  }
  
  if (config.storage === 'local') {
    setToLocalStorage(config.key, data, config.ttl);
  } else {
    setToMemoryCache(config.key, data, config.ttl);
  }
}

/**
 * Clear specific cache or all caches
 * @param {string|null} cacheName - Specific cache name or null for all
 */
export function clearCache(cacheName = null) {
  if (cacheName) {
    const config = CACHE_CONFIG[cacheName];
    if (config) {
      if (config.storage === 'local') {
        localStorage.removeItem(config.key);
      } else {
        memoryCache.delete(config.key);
      }
      console.log(`🗑️ Cache cleared: ${cacheName}`);
    }
  } else {
    // Clear all caches
    Object.keys(CACHE_CONFIG).forEach(name => {
      const config = CACHE_CONFIG[name];
      if (config.storage === 'local') {
        localStorage.removeItem(config.key);
      } else {
        memoryCache.delete(config.key);
      }
    });
    console.log(`🗑️ All caches cleared`);
  }
}

/**
 * Wrapper function for API calls with caching
 * @param {string} cacheName - From CACHE_CONFIG keys
 * @param {Function} fetchFunction - Async function to fetch fresh data
 * @param {boolean} forceRefresh - Force refresh cache
 * @returns {Promise<any>} Data
 */
export async function getCachedData(cacheName, fetchFunction, forceRefresh = false) {
  // Check cache first (unless force refresh)
  if (!forceRefresh) {
    const cached = getFromCache(cacheName);
    if (cached) {
      console.log(`📦 Cache HIT: ${cacheName}`);
      return cached;
    }
  }
  
  console.log(`🔄 Cache MISS: ${cacheName}, fetching fresh...`);
  
  // Fetch fresh data
  const freshData = await fetchFunction();
  
  // Store in cache
  if (freshData && !freshData.error) {
    setToCache(cacheName, freshData);
  }
  
  return freshData;
}

/**
 * Check if cache is valid (not expired)
 * @param {string} cacheName - From CACHE_CONFIG keys
 * @returns {boolean}
 */
export function isCacheValid(cacheName) {
  const config = CACHE_CONFIG[cacheName];
  if (!config) return false;
  
  if (config.storage === 'local') {
    const item = localStorage.getItem(config.key);
    if (!item) return false;
    try {
      const data = JSON.parse(item);
      return data.expiry > Date.now();
    } catch {
      return false;
    }
  } else {
    const item = memoryCache.get(config.key);
    if (!item) return false;
    return item.expiry > Date.now();
  }
}

/**
 * Get cache expiry time remaining (in ms)
 * @param {string} cacheName - From CACHE_CONFIG keys
 * @returns {number} Milliseconds remaining (0 if not cached)
 */
export function getCacheRemaining(cacheName) {
  const config = CACHE_CONFIG[cacheName];
  if (!config) return 0;
  
  if (config.storage === 'local') {
    const item = localStorage.getItem(config.key);
    if (!item) return 0;
    try {
      const data = JSON.parse(item);
      return Math.max(0, data.expiry - Date.now());
    } catch {
      return 0;
    }
  } else {
    const item = memoryCache.get(config.key);
    if (!item) return 0;
    return Math.max(0, item.expiry - Date.now());
  }
}