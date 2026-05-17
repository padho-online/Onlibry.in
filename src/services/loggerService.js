// src/services/loggerService.js - D1 Database Version
import {
  logPageViewToD1,
  logSearchToD1,
  logFileReadToD1,
  logCartToD1,
  logMockResultToD1,
  logQuizResultToD1,
  logPaymentToD1
} from './d1Service';

// Session ID for page view tracking
let sessionId = null;
let pageViewStartTime = null;
let currentPagePath = null;

// Generate session ID
function getSessionId() {
  if (!sessionId) {
    sessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substring(2, 10);
  }
  return sessionId;
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

// ============================================
// PAGE VIEW LOGGING
// ============================================

export async function logPageView(pagePath, pageTitle) {
  try {
    const user = await getCurrentUser();
    const now = new Date().toISOString();
    
    // If we were on a previous page, log time spent
    if (currentPagePath && pageViewStartTime) {
      const timeSpent = Math.floor((Date.now() - pageViewStartTime) / 1000);
      if (timeSpent > 0) {
        await logPageViewToD1({
          userId: user?.uid || 'guest',
          userEmail: user?.email || 'guest',
          pagePath: currentPagePath,
          pageTitle: document.title,
          timeSpent: timeSpent,
          sessionId: getSessionId()
        });
      }
    }
    
    // Start new page view tracking
    currentPagePath = pagePath;
    pageViewStartTime = Date.now();
    
    // Also log the initial view
    await logPageViewToD1({
      userId: user?.uid || 'guest',
      userEmail: user?.email || 'guest',
      pagePath: pagePath,
      pageTitle: pageTitle,
      timeSpent: 0,
      sessionId: getSessionId()
    });
    
    console.log(`📊 Page view logged: ${pagePath}`);
  } catch (error) {
    console.error('Error logging page view:', error);
  }
}

// Initialize page view logging (call on route change)
export function initPageViewLogger() {
  // Log initial page
  const path = window.location.pathname;
  const title = document.title;
  logPageView(path, title);
  
  // Listen for navigation (for React Router)
  const originalPushState = history.pushState;
  const originalReplaceState = history.replaceState;
  
  history.pushState = function(...args) {
    originalPushState.apply(this, args);
    setTimeout(() => {
      logPageView(window.location.pathname, document.title);
    }, 100);
  };
  
  history.replaceState = function(...args) {
    originalReplaceState.apply(this, args);
    setTimeout(() => {
      logPageView(window.location.pathname, document.title);
    }, 100);
  };
  
  window.addEventListener('popstate', () => {
    setTimeout(() => {
      logPageView(window.location.pathname, document.title);
    }, 100);
  });
  
  // Log before unload
  window.addEventListener('beforeunload', async () => {
    if (currentPagePath && pageViewStartTime) {
      const timeSpent = Math.floor((Date.now() - pageViewStartTime) / 1000);
      if (timeSpent > 0) {
        const user = await getCurrentUser();
        await logPageViewToD1({
          userId: user?.uid || 'guest',
          userEmail: user?.email || 'guest',
          pagePath: currentPagePath,
          pageTitle: document.title,
          timeSpent: timeSpent,
          sessionId: getSessionId()
        });
      }
    }
  });
}

// ============================================
// SEARCH LOGGING
// ============================================

export async function logSearch(query, resultCount) {
  try {
    const user = await getCurrentUser();
    await logSearchToD1(user?.uid || 'guest', query, resultCount);
    console.log(`🔍 Search logged: "${query}" -> ${resultCount} results`);
  } catch (error) {
    console.error('Error logging search:', error);
  }
}

// ============================================
// FILE VIEW/READ LOGGING
// ============================================

let fileReadStartTime = null;
let currentFileId = null;

export async function logFileViewStart(fileId, fileName, isPremium = false, isSubscribed = false) {
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
        await logFileReadToD1(
          user?.uid || 'guest',
          currentFileId,
          'File',
          Math.floor(timeSpent / 60), // pages read approximation
          timeSpent
        );
        console.log(`📄 File read logged: ${currentFileId} -> ${timeSpent}s`);
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
// CART LOGGING
// ============================================

export async function logCartAction(userId, fileId, fileName, price, action) {
  try {
    await logCartToD1(userId, fileId, fileName, price, action);
    console.log(`🛒 Cart action logged: ${action} - ${fileName}`);
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
    await logMockResultToD1(
      user?.uid || 'guest',
      data.testName,
      data.totalQuestions,
      data.correct,
      data.incorrect,
      data.unanswered,
      data.score,
      data.timeTaken
    );
    console.log(`📝 Mock test result logged: ${data.testName} -> ${data.correct}/${data.totalQuestions}`);
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
    await logQuizResultToD1(
      user?.uid || 'guest',
      data.quizName,
      data.totalQuestions,
      data.correct,
      data.incorrect,
      data.unanswered,
      data.score,
      data.timeTaken
    );
    console.log(`📝 Quiz result logged: ${data.quizName} -> ${data.correct}/${data.totalQuestions}`);
  } catch (error) {
    console.error('Error logging quiz result:', error);
  }
}

// ============================================
// PAYMENT LOGGING
// ============================================

export async function logPaymentEvent(event, plan, amount, status, paymentId = null, orderId = null, error = null) {
  try {
    const user = await getCurrentUser();
    await logPaymentToD1({
      userId: user?.uid || 'guest',
      userEmail: user?.email || 'guest',
      event: event,
      plan: plan,
      amount: amount,
      status: status,
      paymentId: paymentId,
      orderId: orderId,
      error: error
    });
    console.log(`💰 Payment logged: ${event} - ${status}`);
  } catch (error) {
    console.error('Error logging payment:', error);
  }
}

// ============================================
// USER LOGIN LOGGING
// ============================================

export async function logUserLogin(user) {
  try {
    console.log(`👤 User logged in: ${user?.email}`);
    // Also log to page view as login event
    await logPageView('/login-success', 'Login Success');
  } catch (error) {
    console.error('Error logging user login:', error);
  }
}

// ============================================
// LEGACY EXPORTS (for compatibility)
// ============================================

export function setCurrentUserGetter(getterFn) {
  // Legacy function - kept for compatibility
  console.log('setCurrentUserGetter called (legacy)');
}