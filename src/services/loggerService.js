// src/services/loggerService.js - GOOGLE SHEET LOGS VERSION
// UPDATED: All logs now go to NEW Google Sheet (VITE_LOGS_SHEET_API_URL)
// D1 is no longer used for logs
// ❌ REMOVED: logUserSync - Users only synced via bulk sync

const LOGS_SHEET_API_URL = import.meta.env.VITE_LOGS_SHEET_API_URL;

// Session ID for page view tracking
let sessionId = null;
let pageViewStartTime = null;
let currentPagePath = null;

// Track if we're logging to avoid duplicates
let lastLoggedPath = null;
let lastLoggedTime = 0;

// ============================================
// HELPER FUNCTIONS
// ============================================

// Generate session ID
function getSessionId() {
  if (!sessionId) {
    sessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substring(2, 10);
  }
  return sessionId;
}

// Get client IP address
async function getClientIP() {
  try {
    const response = await fetch('https://api.ipify.org?format=json');
    const data = await response.json();
    return data.ip;
  } catch (error) {
    console.log('IP fetch failed, using unknown');
    return 'unknown';
  }
}

// Get current user (async)
async function getCurrentUser() {
  try {
    const { getAuth } = await import('firebase/auth');
    const { auth } = await import('../config/firebase');
    const user = getAuth().currentUser;
    return user;
  } catch (e) {
    return null;
  }
}

// Send data to Google Sheet Logs - FINAL WORKING VERSION
async function sendToLogsSheet(action, data) {
  if (!LOGS_SHEET_API_URL) {
    console.warn('⚠️ VITE_LOGS_SHEET_API_URL not set, skipping log');
    return false;
  }
  
  console.log(`📤 Sending to logs sheet: ${action}`, data);
  
  try {
    // Use no-cors mode - this works with Google Apps Script
    await fetch(LOGS_SHEET_API_URL, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        action: action, 
        ...data,
        timestamp: new Date().toISOString()
      })
    });
    
    console.log(`✅ Log sent to sheet: ${action}`);
    return true;
  } catch (error) {
    console.error(`❌ Error sending log to sheet (${action}):`, error);
    return false;
  }
}
// ============================================
// PAGE VIEW LOGGING - Main function
// ============================================

export async function logPageView(pagePath, pageTitle) {
  try {
    const user = await getCurrentUser();
    const now = Date.now();
    
    // Prevent duplicate logging for same page within 500ms
    if (lastLoggedPath === pagePath && (now - lastLoggedTime) < 500) {
      console.log(`⏭️ Skipping duplicate page view: ${pagePath}`);
      return;
    }
    
    // If we were on a previous page, log time spent before navigating away
    if (currentPagePath && pageViewStartTime && currentPagePath !== pagePath) {
      const timeSpent = Math.floor((now - pageViewStartTime) / 1000);
      if (timeSpent > 0) {
        await sendToLogsSheet('pageView', {
          user_id: user?.uid || 'guest',
          user_email: user?.email || 'guest',
          page_path: currentPagePath,
          page_title: document.title,
          time_spent: timeSpent,
          session_id: getSessionId()
        });
        console.log(`⏱️ Time spent on ${currentPagePath}: ${timeSpent}s`);
      }
    }
    
    // Update tracking for new page
    currentPagePath = pagePath;
    pageViewStartTime = now;
    lastLoggedPath = pagePath;
    lastLoggedTime = now;
    
    // Log the initial view (time_spent = 0 for first view)
    await sendToLogsSheet('pageView', {
      user_id: user?.uid || 'guest',
      user_email: user?.email || 'guest',
      page_path: pagePath,
      page_title: pageTitle || document.title,
      time_spent: 0,
      session_id: getSessionId()
    });
    
    console.log(`📊 Page view logged to Sheet: ${pagePath}`);
  } catch (error) {
    console.error('Error logging page view:', error);
  }
}

// ============================================
// REACT ROUTER COMPATIBLE PAGE VIEW LOGGER
// Call this function from App.jsx on route change
// ============================================

export function logCurrentPageView() {
  const path = window.location.pathname;
  const title = document.title;
  logPageView(path, title);
}

// ============================================
// INITIALIZE PAGE VIEW LOGGER
// Works with history API (for non-React Router navigations)
// ============================================

export function initPageViewLogger() {
  console.log('📊 Page view logger initialized (Google Sheet mode)');
  
  // Log initial page
  const path = window.location.pathname;
  const title = document.title;
  logPageView(path, title);
  
  // Listen for popstate (back/forward buttons)
  window.addEventListener('popstate', () => {
    setTimeout(() => {
      logPageView(window.location.pathname, document.title);
    }, 100);
  });
  
  // Log before unload (time spent on last page)
  window.addEventListener('beforeunload', async () => {
    if (currentPagePath && pageViewStartTime) {
      const timeSpent = Math.floor((Date.now() - pageViewStartTime) / 1000);
      if (timeSpent > 0) {
        const user = await getCurrentUser();
        await sendToLogsSheet('pageView', {
          user_id: user?.uid || 'guest',
          user_email: user?.email || 'guest',
          page_path: currentPagePath,
          page_title: document.title,
          time_spent: timeSpent,
          session_id: getSessionId()
        });
        console.log(`⏱️ Final time spent on ${currentPagePath}: ${timeSpent}s`);
      }
    }
  });
}

// ============================================
// SEARCH LOGGING
// ============================================

export async function logSearch(query, resultCount, pagePath = '') {
  try {
    const user = await getCurrentUser();
    await sendToLogsSheet('searchLog', {
      user_id: user?.uid || 'guest',
      search_query: query,
      result_count: resultCount,
      page_path: pagePath || window.location.pathname
    });
    console.log(`🔍 Search logged to Sheet: "${query}" -> ${resultCount} results`);
  } catch (error) {
    console.error('Error logging search:', error);
  }
}

// ============================================
// FILE VIEW/READ LOGGING
// ============================================

let fileReadStartTime = null;
let currentFileId = null;

export async function logFileViewStart(fileId, fileName, isPremium = false, hasAccess = false) {
  try {
    currentFileId = fileId;
    fileReadStartTime = Date.now();
    console.log(`📄 File view started: ${fileName}`);
  } catch (error) {
    console.error('Error logging file view start:', error);
  }
}

export async function logFileViewClose() {
  try {
    if (currentFileId && fileReadStartTime) {
      const timeSpent = Math.floor((Date.now() - fileReadStartTime) / 1000);
      if (timeSpent > 0) {
        const user = await getCurrentUser();
        await sendToLogsSheet('fileReadLog', {
          user_id: user?.uid || 'guest',
          file_id: currentFileId,
          file_name: 'File',
          pages_read: Math.floor(timeSpent / 60),
          time_spent: timeSpent
        });
        console.log(`📄 File read logged to Sheet: ${currentFileId} -> ${timeSpent}s`);
      }
    }
  } catch (error) {
    console.error('Error logging file view close:', error);
  } finally {
    currentFileId = null;
    fileReadStartTime = null;
  }
}

// ============================================
// CART LOGGING (Both - D1 + Sheet)
// ============================================

export async function logCartAction(userId, fileId, fileName, price, action) {
  console.log('🛒 logCartAction called:', { userId, fileId, fileName, price, action });
  
  try {
    const result = await sendToLogsSheet('cartLog', {
      user_id: userId || 'guest',
      file_id: fileId,
      file_name: fileName,
      price: price,
      item_type: 'file',
      action: action,
      status: action === 'add_to_cart' ? 'active' : 'inactive'
    });
    
    console.log(`🛒 Cart action logged to Sheet: ${action} - ${fileName}, result:`, result);
  } catch (error) {
    console.error('Error logging cart action:', error);
  }
}

// ============================================
// MOCK TEST RESULT LOGGING
// ============================================

export async function logMockTestResult(data) {
  try {
    const user = await getCurrentUser();
    await sendToLogsSheet('mockTestResult', {
      user_id: user?.uid || 'guest',
      test_name: data.testName,
      total_questions: data.totalQuestions,
      correct: data.correct,
      incorrect: data.incorrect,
      unanswered: data.unanswered,
      score: data.score,
      time_taken: data.timeTaken
    });
    console.log(`📝 Mock test result logged to Sheet: ${data.testName} -> ${data.correct}/${data.totalQuestions}`);
  } catch (error) {
    console.error('Error logging mock test result:', error);
  }
}

// ============================================
// QUIZ RESULT LOGGING
// ============================================

export async function logQuizResult(data) {
  try {
    const user = await getCurrentUser();
    await sendToLogsSheet('quizResult', {
      user_id: user?.uid || 'guest',
      quiz_name: data.quizName,
      total_questions: data.totalQuestions,
      correct: data.correct,
      incorrect: data.incorrect,
      unanswered: data.unanswered,
      score: data.score,
      time_taken: data.timeTaken
    });
    console.log(`📝 Quiz result logged to Sheet: ${data.quizName} -> ${data.correct}/${data.totalQuestions}`);
  } catch (error) {
    console.error('Error logging quiz result:', error);
  }
}

// ============================================
// PAYMENT LOGGING (Both - D1 + Sheet)
// ============================================

export async function logPaymentEvent(event, plan, amount, status, paymentId = null, orderId = null, error = null) {
  try {
    const user = await getCurrentUser();
    
    await sendToLogsSheet('paymentLog', {
      user_id: user?.uid || 'guest',
      user_email: user?.email || 'guest',
      event: event,
      plan: plan,
      amount: amount,
      status: status,
      payment_id: paymentId,
      order_id: orderId,
      error: error
    });
    
    console.log(`💰 Payment logged to Sheet: ${event} - ${status}`);
  } catch (error) {
    console.error('Error logging payment:', error);
  }
}

// ============================================
// USER LOGIN LOGGING (for tracking only - NO USER SYNC)
// ============================================

export async function logUserLogin(user) {
  try {
    console.log(`👤 User logged in: ${user?.email}`);
    // ❌ REMOVED: logUserSync - Users only synced via bulk sync
    await logPageView('/login-success', 'Login Success');
  } catch (error) {
    console.error('Error logging user login:', error);
  }
}

// ============================================
// PURCHASE LOGGING (Both - D1 + Sheet)
// ============================================

export async function logUserPurchase(data) {
  try {
    console.log('💾 logUserPurchase called:', data);
    
    await sendToLogsSheet('userPurchase', {
      user_id: data.userId,
      file_id: data.fileId,
      item_type: data.itemType,
      item_name: data.itemName,
      price: data.price,
      payment_id: data.paymentId,
      order_id: data.orderId
    });
    console.log(`💾 User purchase logged to Sheet: ${data.itemName}`);
  } catch (error) {
    console.error('Error logging user purchase:', error);
  }
}

// ============================================
// SAVED FILE LOGGING (Both - D1 + Sheet)
// ============================================

export async function logSavedFile(data) {
  try {
    console.log('💾 logSavedFile called:', data);
    
    await sendToLogsSheet('userSaved', {
      user_id: data.userId,
      file_id: data.fileId,
      file_name: data.fileName,
      action: data.action
    });
    console.log(`💾 Saved file logged to Sheet: ${data.action} - ${data.fileName}`);
  } catch (error) {
    console.error('Error logging saved file:', error);
  }
}

// ============================================
// LEGACY EXPORTS (for compatibility)
// ============================================

export function setCurrentUserGetter(getterFn) {
  console.log('setCurrentUserGetter called (legacy)');
}