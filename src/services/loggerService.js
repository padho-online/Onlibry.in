// Google Sheets Web App URL
const LOGGER_API_URL = 'https://script.google.com/macros/s/AKfycbyHujfaaRZTsH6FBKplt4EdpURVrLPC-Efrd1gaQ-NqGQydfhMloAGsnHAaKSdgj0w/exec';

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

// ✅ Get current user from Firebase auth directly via callback
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
      userId: user?.uid || null,
      userEmail: user?.email || null,
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
    
    console.log(`✅ Logged: ${action}`, payload.userEmail || 'guest');
  } catch (error) {
    console.error('Logging error:', error);
  }
}

// 1. Log Page View
export function logPageView(pageUrl, pageTitle) {
  sendLog('pageView', {
    pageUrl: pageUrl,
    pageTitle: pageTitle,
    referrer: document.referrer || ''
  });
}

// 2. Log File View (with duration tracking) - SINGLE VERSION
export function logFileView(fileId, fileName, isPremium, hasAccess, durationSeconds = 0, status = 'completed') {
  console.log('📊 logFileView called:', { fileId, fileName, isPremium, hasAccess, durationSeconds, status });
  sendLog('fileView', {
    fileId: fileId,
    fileName: fileName,
    fileType: fileName?.split('.').pop() || 'unknown',
    isPremium: isPremium,
    hasAccess: hasAccess,
    durationSeconds: durationSeconds,
    viewStatus: status
  });
}

// 3. Log User Login (Called from AuthContext)
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

// 4. Log Saved File Action (with user info)
export async function logSavedFile(fileId, fileName, action, userId = null, userEmail = null) {
  console.log(`📌 Saved File Log: ${action} - ${fileName}`);
  
  await sendLog('savedFile', {
    fileId: fileId,
    fileName: fileName,
    action: action // 'save' or 'unsave'
  });
}

// 5. Log Search Query
export function logSearch(searchQuery, resultsCount, isExactSearch = false) {
  sendLog('searchLog', {
    searchQuery: searchQuery,
    resultsCount: resultsCount,
    isExactSearch: isExactSearch
  });
}

// 6. Log Mock Test Result
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

// 7. Log Quiz Result
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

// 8. Log Payment
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

// Initialize page view logging
export function initPageViewLogger() {
  // Log initial page view
  setTimeout(() => {
    logPageView(window.location.href, document.title);
  }, 100);
  
  // Log on page visibility change
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      logPageView(window.location.href, document.title);
    }
  });
  
  // Log on beforeunload
  window.addEventListener('beforeunload', () => {
    logPageView(window.location.href, document.title);
  });
}