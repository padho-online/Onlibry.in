// src/services/loggerService.js
// Google Sheets Web App URL - Using environment variable

const LOGGER_API_URL = import.meta.env.VITE_SHEET_API_URL;

// ============================================
// FILE VIEW DURATION TRACKING
// ============================================
let currentFileStartTime = null;
let currentFileId = null;
let currentFileName = null;

// Get client IP address
async function getClientIP() {
  try {
    const response = await fetch('https://api.ipify.org?format=json');
    const data = await response.json();
    return data.ip;
  } catch (error) {
    return 'unknown';
  }
}

// Get device ID from localStorage or generate new
function getDeviceId() {
  let deviceId = localStorage.getItem('onlibry_deviceId');
  if (!deviceId) {
    deviceId = 'device_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    localStorage.setItem('onlibry_deviceId', deviceId);
  }
  return deviceId;
}

// Get current user from Firebase auth directly via callback
let currentUserCallback = null;

export function setCurrentUserGetter(callback) {
  currentUserCallback = callback;
}

async function getCurrentUser() {
  if (currentUserCallback) {
    return currentUserCallback();
  }
  return null;
}

// Send log to Google Sheets
async function sendLog(action, data) {
  try {
    const ipAddress = await getClientIP();
    const deviceId = getDeviceId();
    const user = await getCurrentUser();
    
    const payload = {
      action: action,
      ...data,
      userId: user?.uid || 'guest',
      userEmail: user?.email || 'guest',
      userDisplayName: user?.displayName || null,
      ipAddress: ipAddress,
      deviceId: deviceId,
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString()
    };
    
    // Use sendBeacon for page unload events
    if (action === 'pageView' && document.visibilityState === 'hidden') {
      navigator.sendBeacon(LOGGER_API_URL, JSON.stringify(payload));
    } else {
      await fetch(LOGGER_API_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
    }
    
    console.log(`✅ Logged: ${action}`);
  } catch (error) {
    console.error('Logging error:', error);
  }
}

// ============================================
// 1. Page View Log
// ============================================
export function logPageView(pageUrl, pageTitle) {
  sendLog('pageView', {
    pageUrl: pageUrl,
    pageTitle: pageTitle,
    referrer: document.referrer || ''
  });
}

// ============================================
// 2. FILE VIEW LOGS (with start/close tracking)
// ============================================

// Call this when file view starts
export function logFileViewStart(fileId, fileName, isPremium, hasAccess) {
  currentFileStartTime = Date.now();
  currentFileId = fileId;
  currentFileName = fileName;
  
  sendLog('fileView', {
    fileId: fileId,
    fileName: fileName,
    fileType: fileName?.split('.').pop() || 'unknown',
    isPremium: isPremium || false,
    hasAccess: hasAccess || false,
    eventType: 'open',
    durationSeconds: 0
  });
}

// Call this when file view closes
export function logFileViewClose() {
  if (!currentFileStartTime || !currentFileId) {
    return;
  }
  
  const durationSeconds = Math.round((Date.now() - currentFileStartTime) / 1000);
  
  // Don't log very short views
  if (durationSeconds > 0) {
    sendLog('fileView', {
      fileId: currentFileId,
      fileName: currentFileName,
      eventType: 'close',
      durationSeconds: durationSeconds,
      durationFormatted: formatDuration(durationSeconds)
    });
  }
  
  // Reset tracking
  currentFileStartTime = null;
  currentFileId = null;
  currentFileName = null;
}

// Helper function to format duration
function formatDuration(seconds) {
  if (seconds < 60) return `${seconds} seconds`;
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (secs === 0) return `${mins} minute${mins > 1 ? 's' : ''}`;
  return `${mins} min ${secs} sec`;
}

// Simple file view log (without duration tracking)
export function logFileView(fileId, fileName, isPremium, hasAccess, durationSeconds = 0, status = 'completed') {
  sendLog('fileView', {
    fileId: fileId,
    fileName: fileName,
    fileType: fileName?.split('.').pop() || 'unknown',
    isPremium: isPremium,
    hasAccess: hasAccess,
    eventType: 'simple',
    durationSeconds: durationSeconds,
    viewStatus: status
  });
}

// ============================================
// 3. User Login Log
// ============================================
export function logUserLogin(user) {
  if (!user) {
    console.log('⚠️ logUserLogin called with no user');
    return;
  }
  
  sendLog('userLogin', {
    userId: user.uid,
    userEmail: user.email,
    displayName: user.displayName || user.email?.split('@')[0],
    emailVerified: user.emailVerified
  });
}

// ============================================
// 4. Saved File Log
// ============================================
export async function logSavedFile(fileId, fileName, action, userId = null, userEmail = null) {
  console.log(`📌 Saved File Log: ${action} - ${fileName}`);
  
  await sendLog('savedFile', {
    fileId: fileId,
    fileName: fileName,
    action: action // 'save' or 'unsave'
  });
}

// ============================================
// 5. Search Log
// ============================================
export function logSearch(searchQuery, resultsCount, isExactSearch = false) {
  sendLog('searchLog', {
    searchQuery: searchQuery,
    resultsCount: resultsCount,
    isExactSearch: isExactSearch
  });
}

// ============================================
// 6. Mock Test Result Log
// ============================================
export function logMockTestResult(resultData) {
  const percentage = ((resultData.correct / resultData.totalQuestions) * 100).toFixed(2);
  
  sendLog('mockTestResult', {
    testName: resultData.testName,
    totalQuestions: resultData.totalQuestions,
    correct: resultData.correct,
    incorrect: resultData.incorrect,
    unanswered: resultData.unanswered,
    score: resultData.score,
    timeTaken: resultData.timeTaken,
    percentage: percentage
  });
}

// ============================================
// 7. Quiz Result Log
// ============================================
export function logQuizResult(resultData) {
  const percentage = ((resultData.correct / resultData.totalQuestions) * 100).toFixed(2);
  
  sendLog('quizResult', {
    quizName: resultData.quizName,
    totalQuestions: resultData.totalQuestions,
    correct: resultData.correct,
    incorrect: resultData.incorrect,
    unanswered: resultData.unanswered,
    score: resultData.score,
    timeTaken: resultData.timeTaken,
    percentage: percentage
  });
}

// ============================================
// 8. Payment Log
// ============================================
export function logPayment(event, plan, amount, status, paymentId = null, orderId = null, error = null) {
  sendLog('paymentLog', {
    event: event,
    plan: plan,
    amount: amount,
    status: status,
    paymentId: paymentId,
    orderId: orderId,
    error: error
  });
}

// ============================================
// 9. Initialize Page View Logger
// ============================================
export function initPageViewLogger() {
  // Log initial page view
  setTimeout(() => {
    logPageView(window.location.href, document.title);
  }, 100);
  
  // Log when page is about to close
  window.addEventListener('beforeunload', () => {
    logPageView(window.location.href, document.title);
  });
  
  // Log when page becomes hidden (tab switch)
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      logPageView(window.location.href, document.title);
    }
  });
}

// ============================================
// 10. Test Logger
// ============================================
export async function testLogger() {
  console.log('🔍 Testing logger...');
  
  await sendLog('pageView', {
    pageUrl: 'TEST_PAGE',
    pageTitle: 'Logger Test',
    referrer: 'test'
  });
  
  console.log('✅ Test log sent! Check your Google Sheet.');
} 