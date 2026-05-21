// src/services/d1Service.js
// D1 Database API Service - WITH FRONTEND CACHING
// UPDATED: Files, Categories, Notifications, QuickAccess, SliderCards, MockTests, Quizzes have caching
// Purchase/Saved/Cart/Logs - No caching (real-time data)

import { getCachedData, clearCache } from './cacheService';

const D1_API_URL = import.meta.env.VITE_D1_API_URL || 'https://onlibry-main-api.mdhabibul12212141.workers.dev';

// Helper function for API calls (no cache - for real-time ops)
async function callAPI(endpoint, options = {}) {
  try {
    const response = await fetch(`${D1_API_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error(`API Error [${endpoint}]:`, error);
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
  
  // Only cache when page=1 and no search (home page files list)
  const shouldCache = page === 1 && !search;
  
  if (shouldCache) {
    const result = await getCachedData('files', async () => {
      return await callAPI(`/api/files?${params.toString()}`);
    }, forceRefresh);
    return result;
  }
  
  // Search or paginated - no cache
  return await callAPI(`/api/files?${params.toString()}`);
}

export async function getFileFromD1(fileId) {
  // Single file - no cache (can be changed frequently)
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
  return await callAPI(`/api/purchase/user/${encodeURIComponent(userId)}`);
}

export async function checkPurchasedInD1(userId, fileId) {
  return await callAPI(`/api/purchase/check?userId=${encodeURIComponent(userId)}&fileId=${encodeURIComponent(fileId)}`);
}

// ============================================
// 3. SAVED FILES API (NO CACHE - Real-time)
// ============================================

export async function saveFileToD1(userId, fileId, fileName) {
  return await callAPI('/api/saved/save', {
    method: 'POST',
    body: JSON.stringify({ userId, fileId, fileName }),
  });
}

export async function removeSavedFileFromD1(userId, fileId, fileName = '') {
  return await callAPI('/api/saved/remove', {
    method: 'DELETE',
    body: JSON.stringify({ userId, fileId, fileName }),
  });
}

export async function getUserSavedFromD1(userId) {
  return await callAPI(`/api/saved/user/${encodeURIComponent(userId)}`);
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
  
  // Only cache first page, all categories
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
  const result = await getCachedData('notifications', async () => {
    return await callAPI(`/api/notifications/latest?limit=${limit}`);
  }, forceRefresh);
  return result.success ? result.notifications : [];
}

export async function getNotificationByIdFromD1(id) {
  // Single notification - no cache (views increment)
  const result = await callAPI(`/api/notifications/${encodeURIComponent(id)}`);
  return result.success ? result.notification : null;
}

// Admin APIs (no cache - admin needs latest data)
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
  // Clear notifications cache after create
  clearCache('notifications');
  return result;
}

export async function updateNotificationInD1(id, data, adminKey) {
  const result = await callAPI(`/api/admin/notifications/${encodeURIComponent(id)}`, {
    method: 'PUT',
    headers: { 'X-Admin-Key': adminKey },
    body: JSON.stringify(data),
  });
  // Clear notifications cache after update
  clearCache('notifications');
  return result;
}

export async function deleteNotificationFromD1(id, adminKey) {
  const result = await callAPI(`/api/admin/notifications/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    headers: { 'X-Admin-Key': adminKey },
  });
  // Clear notifications cache after delete
  clearCache('notifications');
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

// Admin APIs (no cache)
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

// Admin APIs (no cache)
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
// 7. CATEGORIES API (Admin - WITH CACHE CLEAR)
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
  // Single test - no cache
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
  // Single quiz - no cache
  const result = await callAPI(`/api/quizzes/${encodeURIComponent(id)}`);
  return result.success ? result.quiz : null;
}

// ============================================
// 9. LOGS API (NO CACHE - Direct to Google Sheet now)
// NOTE: These functions are kept for compatibility but now send to Google Sheet
// The actual implementation will be in loggerService.js
// ============================================

export async function logPaymentToD1(data) {
  // This now goes to Google Sheet (implemented in loggerService)
  console.log('Payment log redirected to Google Sheet');
  return { success: true };
}

export async function logPageViewToD1(data) {
  // This now goes to Google Sheet
  console.log('Page view log redirected to Google Sheet');
  return { success: true };
}

export async function logSearchToD1(userId, searchQuery, resultCount, pagePath = '') {
  // This now goes to Google Sheet
  console.log('Search log redirected to Google Sheet');
  return { success: true };
}

export async function logFileReadToD1(userId, fileId, fileName, pagesRead, timeSpent) {
  // This now goes to Google Sheet
  console.log('File read log redirected to Google Sheet');
  return { success: true };
}

export async function logCartToD1(userId, fileId, fileName, price, action) {
  // This now goes to Google Sheet
  console.log('Cart log redirected to Google Sheet');
  return { success: true };
}

export async function logMockResultToD1(userId, testName, totalQuestions, correct, incorrect, unanswered, score, timeTaken) {
  // This now goes to Google Sheet
  console.log('Mock result log redirected to Google Sheet');
  return { success: true };
}

export async function logQuizResultToD1(userId, quizName, totalQuestions, correct, incorrect, unanswered, score, timeTaken) {
  // This now goes to Google Sheet
  console.log('Quiz result log redirected to Google Sheet');
  return { success: true };
}

// ============================================
// 10. SYNC API (Admin)
// ============================================

export async function syncFilesToD1(adminKey) {
  return await callAPI('/api/sync/files', {
    method: 'POST',
    headers: { 'X-Admin-Key': adminKey },
  });
}

// ============================================
// 11. USERS API (Admin)
// ============================================

export async function syncUsersToD1(users, adminKey) {
  return await callAPI('/api/sync/users', {
    method: 'POST',
    headers: { 'X-Admin-Key': adminKey },
    body: JSON.stringify({ users }),
  });
}

export async function getUsersFromD1(adminKey, page = 1, limit = 100, search = '') {
  const offset = (page - 1) * limit;
  const params = new URLSearchParams();
  params.append('limit', limit);
  params.append('offset', offset);
  if (search) params.append('search', search);
  
  return await callAPI(`/api/admin/users?${params.toString()}`, {
    headers: { 'X-Admin-Key': adminKey }
  });
}

// ============================================
// 12. CART API (D1 + Sheet backup)
// ============================================

/**
 * Get user's cart from D1
 * @param {string} userId - User UID
 * @returns {Promise<Object>} - Cart items
 */
export async function getCartFromD1(userId) {
  if (!userId) return { success: false, cart: [] };
  
  try {
    const result = await callAPI(`/api/cart/${encodeURIComponent(userId)}`);
    console.log('📦 Cart from D1:', result);
    
    if (result.success && result.cart) {
      return { success: true, cart: result.cart };
    }
    return { success: true, cart: [] };
  } catch (error) {
    console.error('Error getting cart from D1:', error);
    return { success: false, cart: [], error: error.message };
  }
}

/**
 * Add item to cart in D1
 * @param {string} userId - User UID
 * @param {Object} item - { id, name, price, type }
 * @returns {Promise<Object>}
 */
export async function addToCartInD1(userId, item) {
  if (!userId || !item || !item.id) {
    return { success: false, error: 'userId and item.id required' };
  }
  
  try {
    const result = await callAPI('/api/cart/add', {
      method: 'POST',
      body: JSON.stringify({
        userId: userId,
        fileId: item.id,
        fileName: item.name,
        price: item.price || 0,
        itemType: item.type || 'file',
        action: 'add_to_cart'
      })
    });
    console.log(`✅ Added to cart in D1: ${item.name}`);
    return result;
  } catch (error) {
    console.error('Error adding to cart in D1:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Remove item from cart in D1
 * @param {string} userId - User UID
 * @param {string} fileId - File ID
 * @param {string} fileName - File name
 * @returns {Promise<Object>}
 */
export async function removeFromCartInD1(userId, fileId, fileName = '') {
  if (!userId || !fileId) {
    return { success: false, error: 'userId and fileId required' };
  }
  
  try {
    const result = await callAPI('/api/cart/remove', {
      method: 'DELETE',
      body: JSON.stringify({
        userId: userId,
        fileId: fileId,
        fileName: fileName
      })
    });
    console.log(`✅ Removed from cart in D1: ${fileId}`);
    return result;
  } catch (error) {
    console.error('Error removing from cart in D1:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Clear user's entire cart in D1
 * @param {string} userId - User UID
 * @returns {Promise<Object>}
 */
export async function clearCartInD1(userId) {
  if (!userId) {
    return { success: false, error: 'userId required' };
  }
  
  try {
    const result = await callAPI(`/api/cart/clear/${encodeURIComponent(userId)}`, {
      method: 'DELETE'
    });
    console.log(`✅ Cart cleared in D1 for user: ${userId}`);
    return result;
  } catch (error) {
    console.error('Error clearing cart in D1:', error);
    return { success: false, error: error.message };
  }
}

// ============================================
// 13. EXPORT CLEAR CACHE FUNCTION (for manual refresh)
// ============================================

export { clearCache } from './cacheService';