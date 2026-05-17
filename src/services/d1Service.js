// src/services/d1Service.js
// D1 Database API Service - Complete

const D1_API_URL = import.meta.env.VITE_D1_API_URL || 'https://onlibry-main-api.mdhabibul12212141.workers.dev';

// Helper function for API calls
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
// 1. FILES API
// ============================================

export async function getFilesFromD1(page = 1, limit = 20, search = '') {
  const params = new URLSearchParams();
  params.append('page', page);
  params.append('limit', limit);
  if (search) params.append('search', search);
  return await callAPI(`/api/files?${params.toString()}`);
}

export async function getFileFromD1(fileId) {
  return await callAPI(`/api/files/${encodeURIComponent(fileId)}`);
}

// ============================================
// 2. PURCHASE API
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
// 3. SAVED FILES API
// ============================================

export async function saveFileToD1(userId, fileId, fileName) {
  return await callAPI('/api/saved/save', {
    method: 'POST',
    body: JSON.stringify({ userId, fileId, fileName }),
  });
}

export async function removeSavedFileFromD1(userId, fileId) {
  return await callAPI('/api/saved/remove', {
    method: 'DELETE',
    body: JSON.stringify({ userId, fileId }),
  });
}

export async function getUserSavedFromD1(userId) {
  return await callAPI(`/api/saved/user/${encodeURIComponent(userId)}`);
}

// ============================================
// 4. NOTIFICATIONS API (with Categories)
// ============================================

export async function getCategoriesFromD1() {
  const result = await callAPI('/api/categories');
  return result.success ? result.categories : [];
}

export async function getNotificationsFromD1(page = 1, limit = 10, category = 'all') {
  const params = new URLSearchParams();
  params.append('page', page);
  params.append('limit', limit);
  if (category && category !== 'all') params.append('category', category);
  const result = await callAPI(`/api/notifications?${params.toString()}`);
  return result.success ? result : { notifications: [], pagination: { total: 0, totalPages: 0 } };
}

export async function getLatestNotificationsFromD1(limit = 5) {
  const result = await callAPI(`/api/notifications/latest?limit=${limit}`);
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
  return await callAPI('/api/admin/notifications', {
    method: 'POST',
    headers: { 'X-Admin-Key': adminKey },
    body: JSON.stringify(data),
  });
}

export async function updateNotificationInD1(id, data, adminKey) {
  return await callAPI(`/api/admin/notifications/${encodeURIComponent(id)}`, {
    method: 'PUT',
    headers: { 'X-Admin-Key': adminKey },
    body: JSON.stringify(data),
  });
}

export async function deleteNotificationFromD1(id, adminKey) {
  return await callAPI(`/api/admin/notifications/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    headers: { 'X-Admin-Key': adminKey },
  });
}

// ============================================
// 5. QUICK ACCESS BUTTONS API
// ============================================

export async function getQuickAccessFromD1() {
  const result = await callAPI('/api/quick-access');
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
  return await callAPI('/api/admin/quick-access', {
    method: 'POST',
    headers: { 'X-Admin-Key': adminKey },
    body: JSON.stringify(data),
  });
}

export async function updateQuickAccessButtonInD1(id, data, adminKey) {
  return await callAPI(`/api/admin/quick-access/${encodeURIComponent(id)}`, {
    method: 'PUT',
    headers: { 'X-Admin-Key': adminKey },
    body: JSON.stringify(data),
  });
}

export async function deleteQuickAccessButtonFromD1(id, adminKey) {
  return await callAPI(`/api/admin/quick-access/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    headers: { 'X-Admin-Key': adminKey },
  });
}

export async function reorderQuickAccessButtonsInD1(buttons, adminKey) {
  return await callAPI('/api/admin/quick-access/reorder', {
    method: 'POST',
    headers: { 'X-Admin-Key': adminKey },
    body: JSON.stringify({ buttons }),
  });
}

// ============================================
// 6. SLIDER CARDS API
// ============================================

export async function getSliderCardsFromD1() {
  const result = await callAPI('/api/slider-cards');
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
  return await callAPI('/api/admin/slider-cards', {
    method: 'POST',
    headers: { 'X-Admin-Key': adminKey },
    body: JSON.stringify(data),
  });
}

export async function updateSliderCardInD1(id, data, adminKey) {
  return await callAPI(`/api/admin/slider-cards/${encodeURIComponent(id)}`, {
    method: 'PUT',
    headers: { 'X-Admin-Key': adminKey },
    body: JSON.stringify(data),
  });
}

export async function deleteSliderCardFromD1(id, adminKey) {
  return await callAPI(`/api/admin/slider-cards/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    headers: { 'X-Admin-Key': adminKey },
  });
}

export async function reorderSliderCardsInD1(cards, adminKey) {
  return await callAPI('/api/admin/slider-cards/reorder', {
    method: 'POST',
    headers: { 'X-Admin-Key': adminKey },
    body: JSON.stringify({ cards }),
  });
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
  return await callAPI('/api/admin/categories', {
    method: 'POST',
    headers: { 'X-Admin-Key': adminKey },
    body: JSON.stringify(data),
  });
}

export async function updateCategoryInD1(id, data, adminKey) {
  return await callAPI(`/api/admin/categories/${encodeURIComponent(id)}`, {
    method: 'PUT',
    headers: { 'X-Admin-Key': adminKey },
    body: JSON.stringify(data),
  });
}

export async function deleteCategoryFromD1(id, adminKey) {
  return await callAPI(`/api/admin/categories/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    headers: { 'X-Admin-Key': adminKey },
  });
}

// ============================================
// 8. MOCK TESTS & QUIZZES API
// ============================================

export async function getMockTestsFromD1() {
  const result = await callAPI('/api/mock-tests');
  return result.success ? result.tests : [];
}

export async function getMockTestFromD1(id) {
  const result = await callAPI(`/api/mock-tests/${encodeURIComponent(id)}`);
  return result.success ? result.test : null;
}

export async function getQuizzesFromD1() {
  const result = await callAPI('/api/quizzes');
  return result.success ? result.quizzes : [];
}

export async function getQuizFromD1(id) {
  const result = await callAPI(`/api/quizzes/${encodeURIComponent(id)}`);
  return result.success ? result.quiz : null;
}

// ============================================
// 9. LOGS API
// ============================================

export async function logPaymentToD1(data) {
  return await callAPI('/api/log/payment', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function logPageViewToD1(data) {
  return await callAPI('/api/log/pageview', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function logSearchToD1(userId, searchQuery, resultCount) {
  return await callAPI('/api/log/search', {
    method: 'POST',
    body: JSON.stringify({ userId, searchQuery, resultCount }),
  });
}

export async function logFileReadToD1(userId, fileId, fileName, pagesRead, timeSpent) {
  return await callAPI('/api/log/fileread', {
    method: 'POST',
    body: JSON.stringify({ userId, fileId, fileName, pagesRead, timeSpent }),
  });
}

export async function logCartToD1(userId, fileId, fileName, price, action) {
  return await callAPI('/api/log/cart', {
    method: 'POST',
    body: JSON.stringify({ userId, fileId, fileName, price, action }),
  });
}

export async function logMockResultToD1(userId, testName, totalQuestions, correct, incorrect, unanswered, score, timeTaken) {
  return await callAPI('/api/log/mockresult', {
    method: 'POST',
    body: JSON.stringify({ userId, testName, totalQuestions, correct, incorrect, unanswered, score, timeTaken }),
  });
}

export async function logQuizResultToD1(userId, quizName, totalQuestions, correct, incorrect, unanswered, score, timeTaken) {
  return await callAPI('/api/log/quizresult', {
    method: 'POST',
    body: JSON.stringify({ userId, quizName, totalQuestions, correct, incorrect, unanswered, score, timeTaken }),
  });
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