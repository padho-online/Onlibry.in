// src/services/d1Service.js
// D1 Database API Service - WITH FRONTEND CACHING & RETRY LOGIC
// UPDATED: Files, Categories, Notifications, QuickAccess, SliderCards, MockTests, Quizzes have caching
// Purchase/Saved/Cart/Logs - No caching (real-time data)

import { getCachedData, clearCache } from './cacheService';

const D1_API_URL = import.meta.env.VITE_D1_API_URL || 'https://onlibry-main-api.mdhabibul12212141.workers.dev';

// Retry configuration
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

// Helper function for API calls with retry logic
async function callAPI(endpoint, options = {}, retryCount = 0) {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout
    
    const response = await fetch(`${D1_API_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error(`API Error [${endpoint}]:`, error.message);
    
    // Retry logic for network errors
    if (retryCount < MAX_RETRIES && (error.name === 'TypeError' || error.name === 'AbortError')) {
      console.log(`Retrying ${endpoint}... (${retryCount + 1}/${MAX_RETRIES})`);
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY * (retryCount + 1)));
      return callAPI(endpoint, options, retryCount + 1);
    }
    
    return { success: false, error: error.message };
  }
}

// ============================================
// 1. FILES API (WITH CACHE)
// ============================================

export async function getFilesFromD1(page = 1, limit = 20, search = '', forceRefresh = false) {
  const params = new URLSearchParams();
  params.append('page', page);
  params.append('limit', limit);
  if (search) params.append('search', search);
  
  console.log(`📡 Fetching files: page=${page}, limit=${limit}, search="${search}"`);
  
  // Don't cache search results
  const shouldCache = page === 1 && !search;
  
  if (shouldCache) {
    const result = await getCachedData('files', async () => {
      return await callAPI(`/api/files?${params.toString()}`);
    }, forceRefresh);
    return result;
  }
  
  const result = await callAPI(`/api/files?${params.toString()}`);
  return result;
}

export async function getFileFromD1(fileId) {
  return await callAPI(`/api/files/${encodeURIComponent(fileId)}`);
}

// ============================================
// 2. PURCHASE API (NO CACHE - Real-time)
// ============================================

export async function savePurchaseToD1(data) {
  return await callAPI('/api/purchase/save', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function getUserPurchasesFromD1(userId) {
  if (!userId) return { success: true, purchases: [] };
  return await callAPI(`/api/purchase/user/${encodeURIComponent(userId)}`);
}

export async function checkPurchasedInD1(userId, fileId) {
  if (!userId || !fileId) return { success: true, purchased: false };
  return await callAPI(`/api/purchase/check?userId=${encodeURIComponent(userId)}&fileId=${encodeURIComponent(fileId)}`);
}

// ============================================
// 3. SAVED FILES API (NO CACHE - Real-time)
// ============================================

export async function saveFileToD1(userId, fileId, fileName) {
  if (!userId || !fileId) return { success: false, error: 'userId and fileId required' };
  return await callAPI('/api/saved/save', {
    method: 'POST',
    body: JSON.stringify({ userId, fileId, fileName }),
  });
}

export async function removeSavedFileFromD1(userId, fileId, fileName = '') {
  if (!userId || !fileId) return { success: false, error: 'userId and fileId required' };
  return await callAPI('/api/saved/remove', {
    method: 'DELETE',
    body: JSON.stringify({ userId, fileId, fileName }),
  });
}

export async function getUserSavedFromD1(userId) {
  if (!userId) return { success: true, saved: [] };
  
  try {
    const result = await callAPI(`/api/saved/user/${encodeURIComponent(userId)}`);
    return result;
  } catch (error) {
    console.error('getUserSavedFromD1 error:', error);
    return { success: true, saved: [] }; // Return empty array on error
  }
}

// ============================================
// 4. NOTIFICATIONS API (WITH CACHE)
// ============================================

export async function getCategoriesFromD1(forceRefresh = false) {
  const result = await getCachedData('categories', async () => {
    return await callAPI('/api/categories');
  }, forceRefresh);
  return result.success ? result.categories : [];
}

export async function getNotificationsFromD1(page = 1, limit = 10, category = 'all', forceRefresh = false) {
  const params = new URLSearchParams();
  params.append('page', page);
  params.append('limit', limit);
  if (category && category !== 'all') params.append('category', category);
  
  const shouldCache = page === 1 && category === 'all';
  
  if (shouldCache) {
    const result = await getCachedData('notifications', async () => {
      return await callAPI(`/api/notifications?${params.toString()}`);
    }, forceRefresh);
    return result.success ? result : { notifications: [], pagination: { total: 0, totalPages: 0 } };
  }
  
  const result = await callAPI(`/api/notifications?${params.toString()}`);
  return result.success ? result : { notifications: [], pagination: { total: 0, totalPages: 0 } };
}

export async function getLatestNotificationsFromD1(limit = 5, forceRefresh = false) {
  const result = await getCachedData('notifications_latest', async () => {
    return await callAPI(`/api/notifications/latest?limit=${limit}`);
  }, forceRefresh);
  return result.success ? result.notifications : [];
}

export async function getNotificationByIdFromD1(id) {
  const result = await callAPI(`/api/notifications/${encodeURIComponent(id)}`);
  return result.success ? result.notification : null;
}

// Admin APIs
export async function getAllNotificationsAdminFromD1(adminKey) {
  const result = await callAPI('/api/admin/notifications/all', {
    headers: { 'X-Admin-Key': adminKey }
  });
  return result.success ? result.notifications : [];
}

export async function createNotificationInD1(data, adminKey) {
  const result = await callAPI('/api/admin/notifications', {
    method: 'POST',
    headers: { 'X-Admin-Key': adminKey },
    body: JSON.stringify(data),
  });
  clearCache('notifications');
  clearCache('notifications_latest');
  return result;
}

export async function updateNotificationInD1(id, data, adminKey) {
  const result = await callAPI(`/api/admin/notifications/${encodeURIComponent(id)}`, {
    method: 'PUT',
    headers: { 'X-Admin-Key': adminKey },
    body: JSON.stringify(data),
  });
  clearCache('notifications');
  clearCache('notifications_latest');
  return result;
}

export async function deleteNotificationFromD1(id, adminKey) {
  const result = await callAPI(`/api/admin/notifications/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    headers: { 'X-Admin-Key': adminKey },
  });
  clearCache('notifications');
  clearCache('notifications_latest');
  return result;
}

// ============================================
// 5. QUICK ACCESS BUTTONS API (WITH CACHE)
// ============================================

export async function getQuickAccessFromD1(forceRefresh = false) {
  const result = await getCachedData('quickAccess', async () => {
    return await callAPI('/api/quick-access');
  }, forceRefresh);
  return result.success ? result.buttons : [];
}

// Admin APIs
export async function getAllQuickAccessAdminFromD1(adminKey) {
  const result = await callAPI('/api/admin/quick-access/all', {
    headers: { 'X-Admin-Key': adminKey }
  });
  return result.success ? result.buttons : [];
}

export async function addQuickAccessButtonToD1(data, adminKey) {
  const result = await callAPI('/api/admin/quick-access', {
    method: 'POST',
    headers: { 'X-Admin-Key': adminKey },
    body: JSON.stringify(data),
  });
  clearCache('quickAccess');
  return result;
}

export async function updateQuickAccessButtonInD1(id, data, adminKey) {
  const result = await callAPI(`/api/admin/quick-access/${encodeURIComponent(id)}`, {
    method: 'PUT',
    headers: { 'X-Admin-Key': adminKey },
    body: JSON.stringify(data),
  });
  clearCache('quickAccess');
  return result;
}

export async function deleteQuickAccessButtonFromD1(id, adminKey) {
  const result = await callAPI(`/api/admin/quick-access/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    headers: { 'X-Admin-Key': adminKey },
  });
  clearCache('quickAccess');
  return result;
}

export async function reorderQuickAccessButtonsInD1(buttons, adminKey) {
  const result = await callAPI('/api/admin/quick-access/reorder', {
    method: 'POST',
    headers: { 'X-Admin-Key': adminKey },
    body: JSON.stringify({ buttons }),
  });
  clearCache('quickAccess');
  return result;
}

// ============================================
// 6. SLIDER CARDS API (WITH CACHE)
// ============================================

export async function getSliderCardsFromD1(forceRefresh = false) {
  const result = await getCachedData('sliderCards', async () => {
    return await callAPI('/api/slider-cards');
  }, forceRefresh);
  return result.success ? result.cards : [];
}

// Admin APIs
export async function getAllSliderCardsAdminFromD1(adminKey) {
  const result = await callAPI('/api/admin/slider-cards/all', {
    headers: { 'X-Admin-Key': adminKey }
  });
  return result.success ? result.cards : [];
}

export async function addSliderCardToD1(data, adminKey) {
  const result = await callAPI('/api/admin/slider-cards', {
    method: 'POST',
    headers: { 'X-Admin-Key': adminKey },
    body: JSON.stringify(data),
  });
  clearCache('sliderCards');
  return result;
}

export async function updateSliderCardInD1(id, data, adminKey) {
  const result = await callAPI(`/api/admin/slider-cards/${encodeURIComponent(id)}`, {
    method: 'PUT',
    headers: { 'X-Admin-Key': adminKey },
    body: JSON.stringify(data),
  });
  clearCache('sliderCards');
  return result;
}

export async function deleteSliderCardFromD1(id, adminKey) {
  const result = await callAPI(`/api/admin/slider-cards/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    headers: { 'X-Admin-Key': adminKey },
  });
  clearCache('sliderCards');
  return result;
}

export async function reorderSliderCardsInD1(cards, adminKey) {
  const result = await callAPI('/api/admin/slider-cards/reorder', {
    method: 'POST',
    headers: { 'X-Admin-Key': adminKey },
    body: JSON.stringify({ cards }),
  });
  clearCache('sliderCards');
  return result;
}

// ============================================
// 7. CATEGORIES API (Admin)
// ============================================

export async function getAllCategoriesAdminFromD1(adminKey) {
  const result = await callAPI('/api/admin/categories/all', {
    headers: { 'X-Admin-Key': adminKey }
  });
  return result.success ? result.categories : [];
}

export async function addCategoryToD1(data, adminKey) {
  const result = await callAPI('/api/admin/categories', {
    method: 'POST',
    headers: { 'X-Admin-Key': adminKey },
    body: JSON.stringify(data),
  });
  clearCache('categories');
  return result;
}

export async function updateCategoryInD1(id, data, adminKey) {
  const result = await callAPI(`/api/admin/categories/${encodeURIComponent(id)}`, {
    method: 'PUT',
    headers: { 'X-Admin-Key': adminKey },
    body: JSON.stringify(data),
  });
  clearCache('categories');
  return result;
}

export async function deleteCategoryFromD1(id, adminKey) {
  const result = await callAPI(`/api/admin/categories/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    headers: { 'X-Admin-Key': adminKey },
  });
  clearCache('categories');
  return result;
}

// ============================================
// 8. MOCK TESTS & QUIZZES API (WITH CACHE)
// ============================================

export async function getMockTestsFromD1(forceRefresh = false) {
  const result = await getCachedData('mockTests', async () => {
    return await callAPI('/api/mock-tests');
  }, forceRefresh);
  return result.success ? result.tests : [];
}

export async function getMockTestFromD1(id) {
  const result = await callAPI(`/api/mock-tests/${encodeURIComponent(id)}`);
  return result.success ? result.test : null;
}

export async function getQuizzesFromD1(forceRefresh = false) {
  const result = await getCachedData('quizzes', async () => {
    return await callAPI('/api/quizzes');
  }, forceRefresh);
  return result.success ? result.quizzes : [];
}

export async function getQuizFromD1(id) {
  const result = await callAPI(`/api/quizzes/${encodeURIComponent(id)}`);
  return result.success ? result.quiz : null;
}

// ============================================
// 9. SYNC API (Admin)
// ============================================

export async function syncFilesToD1(files, adminKey) {
  return await callAPI('/api/sync/files', {
    method: 'POST',
    headers: { 'X-Admin-Key': adminKey },
    body: JSON.stringify({ files }),
  });
}

export async function syncUsersToD1(users, adminKey) {
  return await callAPI('/api/sync/users', {
    method: 'POST',
    headers: { 'X-Admin-Key': adminKey },
    body: JSON.stringify({ users }),
  });
}

export async function getUsersFromD1(adminKey, page = 1, limit = 100, search = '') {
  const params = new URLSearchParams();
  params.append('limit', limit);
  params.append('offset', (page - 1) * limit);
  if (search) params.append('search', search);
  
  return await callAPI(`/api/admin/users?${params.toString()}`, {
    headers: { 'X-Admin-Key': adminKey }
  });
}

export async function getPaymentLogsFromD1(adminKey, limit = 200) {
  return await callAPI(`/api/admin/payment-logs?limit=${limit}`, {
    headers: { 'X-Admin-Key': adminKey }
  });
}

export async function deleteFileFromD1(fileId, adminKey) {
  return await callAPI(`/api/admin/files/${encodeURIComponent(fileId)}`, {
    method: 'DELETE',
    headers: { 'X-Admin-Key': adminKey }
  });
}

// ============================================
// 10. CART API (D1)
// ============================================

export async function getCartFromD1(userId) {
  if (!userId) return { success: true, cart: [] };
  
  try {
    const result = await callAPI(`/api/cart/${encodeURIComponent(userId)}`);
    if (result.success && result.cart) {
      return { success: true, cart: result.cart };
    }
    return { success: true, cart: [] };
  } catch (error) {
    console.error('Error getting cart from D1:', error);
    return { success: true, cart: [] };
  }
}

export async function addToCartInD1(userId, item) {
  if (!userId || !item?.id) {
    return { success: false, error: 'userId and item.id required' };
  }
  
  return await callAPI('/api/cart/add', {
    method: 'POST',
    body: JSON.stringify({
      userId,
      fileId: item.id,
      fileName: item.name,
      price: item.price || 0,
      itemType: item.type || 'file',
    })
  });
}

export async function removeFromCartInD1(userId, fileId, fileName = '') {
  if (!userId || !fileId) {
    return { success: false, error: 'userId and fileId required' };
  }
  
  return await callAPI('/api/cart/remove', {
    method: 'DELETE',
    body: JSON.stringify({ userId, fileId, fileName })
  });
}

export async function clearCartInD1(userId) {
  if (!userId) return { success: false, error: 'userId required' };
  
  return await callAPI(`/api/cart/clear/${encodeURIComponent(userId)}`, {
    method: 'DELETE'
  });
}

// ============================================
// 11. EXPORT CACHE FUNCTIONS
// ============================================

export { clearCache } from './cacheService';