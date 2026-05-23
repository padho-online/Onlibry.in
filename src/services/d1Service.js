// src/services/d1Service.js
// D1 Database API Service - WITH FRONTEND CACHING
// UPDATED: Files, Categories, Notifications, QuickAccess, SliderCards, MockTests, Quizzes have caching
// Purchase/Saved/Cart/Logs - No caching (real-time data)

import { getCachedData, clearCache } from './cacheService';

const D1_API_URL = import.meta.env.VITE_D1_API_URL || 'https://onlibry-main-api.mdhabibul12212141.workers.dev';

// Helper function for API calls with retry and timeout
async function callAPI(endpoint, options = {}, retryCount = 0) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout
  
  try {
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
    clearTimeout(timeoutId);
    
    // Retry logic for network errors (max 3 retries)
    if ((error.name === 'AbortError' || error.message === 'Failed to fetch') && retryCount < 3) {
      console.log(`🔄 Retrying ${endpoint} (${retryCount + 1}/3)...`);
      await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1))); // Exponential backoff
      return callAPI(endpoint, options, retryCount + 1);
    }
    
    console.error(`API Error [${endpoint}]:`, error);
    return { success: false, error: error.message, data: null };
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
    return result || { success: false, files: [], pagination: { total: 0, totalPages: 1 } };
  }
  
  // Search or paginated - no cache
  const result = await callAPI(`/api/files?${params.toString()}`);
  return result || { success: false, files: [], pagination: { total: 0, totalPages: 1 } };
}

export async function getFileFromD1(fileId) {
  if (!fileId) return { success: false, error: 'File ID required' };
  const result = await callAPI(`/api/files/${encodeURIComponent(fileId)}`);
  return result || { success: false, file: null };
}

// ============================================
// 2. PURCHASE API (NO CACHE - Real-time)
// ============================================

export async function savePurchaseToD1(data) {
  if (!data.userId || !data.fileId) {
    return { success: false, error: 'userId and fileId required' };
  }
  return await callAPI('/api/purchase/save', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function getUserPurchasesFromD1(userId) {
  if (!userId) return { success: true, purchases: [] };
  const result = await callAPI(`/api/purchase/user/${encodeURIComponent(userId)}`);
  return result || { success: true, purchases: [] };
}

export async function checkPurchasedInD1(userId, fileId) {
  if (!userId || !fileId) return { success: true, purchased: false };
  const result = await callAPI(`/api/purchase/check?userId=${encodeURIComponent(userId)}&fileId=${encodeURIComponent(fileId)}`);
  return result || { success: true, purchased: false };
}

// ============================================
// 3. SAVED FILES API (NO CACHE - Real-time)
// ============================================

export async function saveFileToD1(userId, fileId, fileName) {
  if (!userId || !fileId) {
    return { success: false, error: 'userId and fileId required' };
  }
  return await callAPI('/api/saved/save', {
    method: 'POST',
    body: JSON.stringify({ userId, fileId, fileName }),
  });
}

export async function removeSavedFileFromD1(userId, fileId, fileName = '') {
  if (!userId || !fileId) {
    return { success: false, error: 'userId and fileId required' };
  }
  return await callAPI('/api/saved/remove', {
    method: 'DELETE',
    body: JSON.stringify({ userId, fileId, fileName }),
  });
}

export async function getUserSavedFromD1(userId) {
  if (!userId) return { success: true, saved: [] };
  const result = await callAPI(`/api/saved/user/${encodeURIComponent(userId)}`);
  return result || { success: true, saved: [] };
}

// ============================================
// 4. NOTIFICATIONS API (WITH CACHE)
// ============================================

export async function getCategoriesFromD1(forceRefresh = false) {
  const result = await getCachedData('categories', async () => {
    return await callAPI('/api/categories');
  }, forceRefresh);
  return result?.success ? result.categories : [];
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
    return result?.success ? result : { notifications: [], pagination: { total: 0, totalPages: 0 } };
  }
  
  const result = await callAPI(`/api/notifications?${params.toString()}`);
  return result?.success ? result : { notifications: [], pagination: { total: 0, totalPages: 0 } };
}

export async function getLatestNotificationsFromD1(limit = 5, forceRefresh = false) {
  const result = await getCachedData('notifications', async () => {
    return await callAPI(`/api/notifications/latest?limit=${limit}`);
  }, forceRefresh);
  return result?.success ? result.notifications : [];
}

export async function getNotificationByIdFromD1(id) {
  if (!id) return null;
  const result = await callAPI(`/api/notifications/${encodeURIComponent(id)}`);
  return result?.success ? result.notification : null;
}

// Admin APIs (no cache - admin needs latest data)
export async function getAllNotificationsAdminFromD1(adminKey) {
  if (!adminKey) return [];
  const result = await callAPI('/api/admin/notifications/all', {
    headers: { 'X-Admin-Key': adminKey }
  });
  return result?.success ? result.notifications : [];
}

export async function createNotificationInD1(data, adminKey) {
  if (!adminKey) return { success: false };
  const result = await callAPI('/api/admin/notifications', {
    method: 'POST',
    headers: { 'X-Admin-Key': adminKey },
    body: JSON.stringify(data),
  });
  if (result?.success) clearCache('notifications');
  return result || { success: false };
}

export async function updateNotificationInD1(id, data, adminKey) {
  if (!adminKey) return { success: false };
  const result = await callAPI(`/api/admin/notifications/${encodeURIComponent(id)}`, {
    method: 'PUT',
    headers: { 'X-Admin-Key': adminKey },
    body: JSON.stringify(data),
  });
  if (result?.success) clearCache('notifications');
  return result || { success: false };
}

export async function deleteNotificationFromD1(id, adminKey) {
  if (!adminKey) return { success: false };
  const result = await callAPI(`/api/admin/notifications/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    headers: { 'X-Admin-Key': adminKey },
  });
  if (result?.success) clearCache('notifications');
  return result || { success: false };
}

// ============================================
// 5. QUICK ACCESS BUTTONS API (WITH CACHE)
// ============================================

export async function getQuickAccessFromD1(forceRefresh = false) {
  const result = await getCachedData('quickAccess', async () => {
    return await callAPI('/api/quick-access');
  }, forceRefresh);
  return result?.success ? result.buttons : [];
}

// Admin APIs (no cache)
export async function getAllQuickAccessAdminFromD1(adminKey) {
  if (!adminKey) return [];
  const result = await callAPI('/api/admin/quick-access/all', {
    headers: { 'X-Admin-Key': adminKey }
  });
  return result?.success ? result.buttons : [];
}

export async function addQuickAccessButtonToD1(data, adminKey) {
  if (!adminKey) return { success: false };
  const result = await callAPI('/api/admin/quick-access', {
    method: 'POST',
    headers: { 'X-Admin-Key': adminKey },
    body: JSON.stringify(data),
  });
  if (result?.success) clearCache('quickAccess');
  return result || { success: false };
}

export async function updateQuickAccessButtonInD1(id, data, adminKey) {
  if (!adminKey) return { success: false };
  const result = await callAPI(`/api/admin/quick-access/${encodeURIComponent(id)}`, {
    method: 'PUT',
    headers: { 'X-Admin-Key': adminKey },
    body: JSON.stringify(data),
  });
  if (result?.success) clearCache('quickAccess');
  return result || { success: false };
}

export async function deleteQuickAccessButtonFromD1(id, adminKey) {
  if (!adminKey) return { success: false };
  const result = await callAPI(`/api/admin/quick-access/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    headers: { 'X-Admin-Key': adminKey },
  });
  if (result?.success) clearCache('quickAccess');
  return result || { success: false };
}

export async function reorderQuickAccessButtonsInD1(buttons, adminKey) {
  if (!adminKey) return { success: false };
  const result = await callAPI('/api/admin/quick-access/reorder', {
    method: 'POST',
    headers: { 'X-Admin-Key': adminKey },
    body: JSON.stringify({ buttons }),
  });
  if (result?.success) clearCache('quickAccess');
  return result || { success: false };
}

// ============================================
// 6. SLIDER CARDS API (WITH CACHE)
// ============================================

export async function getSliderCardsFromD1(forceRefresh = false) {
  const result = await getCachedData('sliderCards', async () => {
    return await callAPI('/api/slider-cards');
  }, forceRefresh);
  return result?.success ? result.cards : [];
}

// Admin APIs (no cache)
export async function getAllSliderCardsAdminFromD1(adminKey) {
  if (!adminKey) return [];
  const result = await callAPI('/api/admin/slider-cards/all', {
    headers: { 'X-Admin-Key': adminKey }
  });
  return result?.success ? result.cards : [];
}

export async function addSliderCardToD1(data, adminKey) {
  if (!adminKey) return { success: false };
  const result = await callAPI('/api/admin/slider-cards', {
    method: 'POST',
    headers: { 'X-Admin-Key': adminKey },
    body: JSON.stringify(data),
  });
  if (result?.success) clearCache('sliderCards');
  return result || { success: false };
}

export async function updateSliderCardInD1(id, data, adminKey) {
  if (!adminKey) return { success: false };
  const result = await callAPI(`/api/admin/slider-cards/${encodeURIComponent(id)}`, {
    method: 'PUT',
    headers: { 'X-Admin-Key': adminKey },
    body: JSON.stringify(data),
  });
  if (result?.success) clearCache('sliderCards');
  return result || { success: false };
}

export async function deleteSliderCardFromD1(id, adminKey) {
  if (!adminKey) return { success: false };
  const result = await callAPI(`/api/admin/slider-cards/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    headers: { 'X-Admin-Key': adminKey },
  });
  if (result?.success) clearCache('sliderCards');
  return result || { success: false };
}

export async function reorderSliderCardsInD1(cards, adminKey) {
  if (!adminKey) return { success: false };
  const result = await callAPI('/api/admin/slider-cards/reorder', {
    method: 'POST',
    headers: { 'X-Admin-Key': adminKey },
    body: JSON.stringify({ cards }),
  });
  if (result?.success) clearCache('sliderCards');
  return result || { success: false };
}

// ============================================
// 7. CATEGORIES API (Admin - WITH CACHE CLEAR)
// ============================================

export async function getAllCategoriesAdminFromD1(adminKey) {
  if (!adminKey) return [];
  const result = await callAPI('/api/admin/categories/all', {
    headers: { 'X-Admin-Key': adminKey }
  });
  return result?.success ? result.categories : [];
}

export async function addCategoryToD1(data, adminKey) {
  if (!adminKey) return { success: false };
  const result = await callAPI('/api/admin/categories', {
    method: 'POST',
    headers: { 'X-Admin-Key': adminKey },
    body: JSON.stringify(data),
  });
  if (result?.success) clearCache('categories');
  return result || { success: false };
}

export async function updateCategoryInD1(id, data, adminKey) {
  if (!adminKey) return { success: false };
  const result = await callAPI(`/api/admin/categories/${encodeURIComponent(id)}`, {
    method: 'PUT',
    headers: { 'X-Admin-Key': adminKey },
    body: JSON.stringify(data),
  });
  if (result?.success) clearCache('categories');
  return result || { success: false };
}

export async function deleteCategoryFromD1(id, adminKey) {
  if (!adminKey) return { success: false };
  const result = await callAPI(`/api/admin/categories/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    headers: { 'X-Admin-Key': adminKey },
  });
  if (result?.success) clearCache('categories');
  return result || { success: false };
}

// ============================================
// 8. MOCK TESTS & QUIZZES API (WITH CACHE)
// ============================================

export async function getMockTestsFromD1(forceRefresh = false) {
  const result = await getCachedData('mockTests', async () => {
    return await callAPI('/api/mock-tests');
  }, forceRefresh);
  return result?.success ? result.tests : [];
}

export async function getMockTestFromD1(id) {
  if (!id) return null;
  const result = await callAPI(`/api/mock-tests/${encodeURIComponent(id)}`);
  return result?.success ? result.test : null;
}

export async function getQuizzesFromD1(forceRefresh = false) {
  const result = await getCachedData('quizzes', async () => {
    return await callAPI('/api/quizzes');
  }, forceRefresh);
  return result?.success ? result.quizzes : [];
}

export async function getQuizFromD1(id) {
  if (!id) return null;
  const result = await callAPI(`/api/quizzes/${encodeURIComponent(id)}`);
  return result?.success ? result.quiz : null;
}

// ============================================
// 9. LOGS API (NO CACHE - Direct to Google Sheet now)
// ============================================

export async function logPaymentToD1(data) {
  console.log('Payment log redirected to Google Sheet', data);
  return { success: true };
}

export async function logPageViewToD1(data) {
  console.log('Page view log redirected to Google Sheet', data);
  return { success: true };
}

export async function logSearchToD1(userId, searchQuery, resultCount, pagePath = '') {
  console.log('Search log redirected to Google Sheet', { userId, searchQuery, resultCount, pagePath });
  return { success: true };
}

export async function logFileReadToD1(userId, fileId, fileName, pagesRead, timeSpent) {
  console.log('File read log redirected to Google Sheet', { userId, fileId, fileName, pagesRead, timeSpent });
  return { success: true };
}

export async function logCartToD1(userId, fileId, fileName, price, action) {
  console.log('Cart log redirected to Google Sheet', { userId, fileId, fileName, price, action });
  return { success: true };
}

export async function logMockResultToD1(userId, testName, totalQuestions, correct, incorrect, unanswered, score, timeTaken) {
  console.log('Mock result log redirected to Google Sheet', { userId, testName, totalQuestions, correct, incorrect, unanswered, score, timeTaken });
  return { success: true };
}

export async function logQuizResultToD1(userId, quizName, totalQuestions, correct, incorrect, unanswered, score, timeTaken) {
  console.log('Quiz result log redirected to Google Sheet', { userId, quizName, totalQuestions, correct, incorrect, unanswered, score, timeTaken });
  return { success: true };
}

// ============================================
// 10. SYNC API (Admin)
// ============================================

export async function syncFilesToD1(adminKey) {
  if (!adminKey) return { success: false };
  return await callAPI('/api/sync/files', {
    method: 'POST',
    headers: { 'X-Admin-Key': adminKey },
  });
}

// ============================================
// 11. USERS API (Admin)
// ============================================

export async function syncUsersToD1(users, adminKey) {
  if (!adminKey) return { success: false };
  return await callAPI('/api/sync/users', {
    method: 'POST',
    headers: { 'X-Admin-Key': adminKey },
    body: JSON.stringify({ users }),
  });
}

export async function getUsersFromD1(adminKey, page = 1, limit = 100, search = '') {
  if (!adminKey) return { success: false, users: [] };
  const offset = (page - 1) * limit;
  const params = new URLSearchParams();
  params.append('limit', limit);
  params.append('offset', offset);
  if (search) params.append('search', search);
  
  const result = await callAPI(`/api/admin/users?${params.toString()}`, {
    headers: { 'X-Admin-Key': adminKey }
  });
  return result || { success: false, users: [] };
}

// ============================================
// 12. CART API (D1 + Sheet backup)
// ============================================

export async function getCartFromD1(userId) {
  if (!userId) return { success: true, cart: [] };
  
  try {
    const result = await callAPI(`/api/cart/${encodeURIComponent(userId)}`);
    if (result?.success && result.cart) {
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
    return result || { success: false };
  } catch (error) {
    console.error('Error adding to cart in D1:', error);
    return { success: false, error: error.message };
  }
}

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
    return result || { success: false };
  } catch (error) {
    console.error('Error removing from cart in D1:', error);
    return { success: false, error: error.message };
  }
}

export async function clearCartInD1(userId) {
  if (!userId) {
    return { success: false, error: 'userId required' };
  }
  
  try {
    const result = await callAPI(`/api/cart/clear/${encodeURIComponent(userId)}`, {
      method: 'DELETE'
    });
    return result || { success: false };
  } catch (error) {
    console.error('Error clearing cart in D1:', error);
    return { success: false, error: error.message };
  }
}

// ============================================
// 13. EXPORT CLEAR CACHE FUNCTION
// ============================================

export { clearCache } from './cacheService';